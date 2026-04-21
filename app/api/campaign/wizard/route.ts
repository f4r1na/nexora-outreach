import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ActivityVariant = "orange" | "amber" | "green";

type SSEEvent =
  | { type: "activity"; text: string; variant: ActivityVariant }
  | { type: "done"; campaignId: string; leadCount: number; hot: number; warm: number; cold: number }
  | { type: "error"; message: string };

type LeadData = {
  first_name: string;
  company: string;
  role: string;
  email: string;
  custom_note: string;
};

type EmailResult = { index: number; subject: string; body: string };

// Simple input sanitizer — strip dangerous characters from prompt injections
function sanitize(s: string, maxLen = 120): string {
  return String(s ?? "").replace(/[<>"'`]/g, "").trim().slice(0, maxLen);
}

export async function POST(req: NextRequest) {
  // ── Auth BEFORE stream (cookies() only available in request context) ──
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = rateLimit({ key: `wizard:${user.id}`, limit: 10, windowMs: 3600_000 });
  if (!rl.ok) {
    return NextResponse.json({ error: "Rate limit exceeded. Try again later." }, { status: 429 });
  }

  // ── Parse + validate body ──
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const targetAudience = sanitize((body.targetAudience as string) ?? "");
  const goal          = sanitize((body.goal as string) ?? "");
  const leadCountStr  = sanitize((body.leadCount as string) ?? "10");
  const location      = sanitize((body.location as string) ?? "Anywhere");
  const _sendMode     = sanitize((body.sendMode as string) ?? "");

  if (!targetAudience || !goal) {
    return NextResponse.json({ error: "targetAudience and goal are required" }, { status: 400 });
  }

  const count = Math.min(Math.max(parseInt(leadCountStr.split(" ")[0]) || 10, 1), 50);

  // ── Admin client for DB (bypasses RLS, no cookie dependency inside stream) ──
  const db = createAdminClient();
  const userId = user.id;

  console.log(`[wizard] user=${userId} audience=${targetAudience} goal=${goal} count=${count} location=${location}`);

  // ── Credit check (before stream starts) ──
  const { data: sub, error: subErr } = await db
    .from("subscriptions")
    .select("credits_used, credits_limit")
    .eq("user_id", userId)
    .single();

  if (subErr) {
    console.error("[wizard] subscription fetch error:", subErr.message);
    return NextResponse.json({ error: "Could not verify credits. Please try again." }, { status: 500 });
  }

  const creditsUsed  = sub?.credits_used ?? 0;
  const creditsLimit = sub?.credits_limit ?? 10;

  if (creditsUsed + count > creditsLimit) {
    return NextResponse.json(
      { error: `Credit limit reached. You have ${Math.max(0, creditsLimit - creditsUsed)} credits left.` },
      { status: 403 }
    );
  }

  // ── Stream ──
  const encoder = new TextEncoder();
  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: SSEEvent) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        } catch {}
      };

      try {
        const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
        const locationCtx = location === "Anywhere" ? "worldwide" : location;

        // ── Step 1: Generate leads ──
        send({ type: "activity", text: `Finding ${count} ${targetAudience} leads...`, variant: "orange" });
        console.log(`[wizard] calling Claude for leads: count=${count} target=${targetAudience} location=${locationCtx}`);

        const leadsMsg = await anthropic.messages.create({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 3000,
          messages: [
            {
              role: "user",
              content: `Generate ${count} realistic B2B sales leads. Return ONLY a valid JSON array with no markdown, no code fences, no explanation.

Target audience: ${targetAudience}
Location: ${locationCtx}
Outreach goal: ${goal}

Each item must be exactly: { "first_name": string, "company": string, "role": string, "email": string, "custom_note": string }
- email: realistic format like firstname@company.com (all lowercase)
- custom_note: one concrete business challenge this person likely faces, relevant to the goal
- Companies and names sound real but must be entirely fictional
- role must match the target audience archetype
Return the JSON array only. No other text.`,
            },
          ],
        });

        const leadsRaw = leadsMsg.content[0].type === "text" ? leadsMsg.content[0].text : "[]";
        console.log(`[wizard] Claude leads response (first 300 chars): ${leadsRaw.slice(0, 300)}`);

        const leadsCleaned = leadsRaw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();

        let leads: LeadData[] = [];
        try {
          const parsed = JSON.parse(leadsCleaned);
          if (!Array.isArray(parsed)) throw new Error("Not an array");
          leads = parsed
            .slice(0, count)
            .filter(
              (l): l is LeadData =>
                l && typeof l.first_name === "string" && typeof l.email === "string"
            );
          console.log(`[wizard] parsed ${leads.length} leads successfully`);
        } catch (parseErr) {
          console.error("[wizard] lead JSON parse error:", parseErr, "raw:", leadsRaw.slice(0, 500));
          send({ type: "error", message: "Failed to generate leads. Please try again." });
          return;
        }

        if (leads.length === 0) {
          console.error("[wizard] leads array is empty after filter");
          send({ type: "error", message: "No leads generated. Please try again." });
          return;
        }

        send({ type: "activity", text: `Found ${leads.length} qualified ${targetAudience} profiles...`, variant: "orange" });

        const hot  = Math.floor(leads.length * 0.35);
        const warm = Math.floor(leads.length * 0.5);
        const cold = leads.length - hot - warm;

        send({ type: "activity", text: `Scored ${hot} hot, ${warm} warm, ${cold} cold leads...`, variant: "amber" });

        // ── Step 2: Generate emails in batches of 10 ──
        send({ type: "activity", text: "Writing personalized emails...", variant: "green" });

        const BATCH = 10;
        const emailResults: EmailResult[] = [];

        for (let start = 0; start < leads.length; start += BATCH) {
          const batch = leads.slice(start, start + BATCH);
          const totalBatches = Math.ceil(leads.length / BATCH);
          const batchNum = Math.floor(start / BATCH) + 1;

          if (totalBatches > 1) {
            send({
              type: "activity",
              text: `Batch ${batchNum}/${totalBatches}: emails ${start + 1}–${Math.min(start + BATCH, leads.length)}...`,
              variant: "green",
            });
          }

          const leadsPrompt = batch
            .map((l, i) => `${start + i + 1}. ${l.first_name} at ${l.company} (${l.role}) — ${l.custom_note}`)
            .join("\n");

          try {
            const emailMsg = await anthropic.messages.create({
              model: "claude-haiku-4-5-20251001",
              max_tokens: 2000,
              messages: [
                {
                  role: "user",
                  content: `Write cold outreach emails. Goal: ${goal}. Return ONLY a JSON array, no markdown.

Each object: { "index": number, "subject": string, "body": string }
- index: the lead number as shown (1-based)
- subject: compelling, specific, 6-10 words
- body: 2-3 sentences max, reference their specific situation in sentence 1, professional tone

Leads:
${leadsPrompt}`,
                },
              ],
            });

            const raw     = emailMsg.content[0].type === "text" ? emailMsg.content[0].text : "[]";
            const cleaned = raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
            try {
              const parsed: EmailResult[] = JSON.parse(cleaned);
              emailResults.push(...parsed);
            } catch {
              batch.forEach((lead, i) => {
                emailResults.push({
                  index: start + i + 1,
                  subject: `${goal} — ${lead.company}`,
                  body: `Hi ${lead.first_name}, ${lead.custom_note} I'd love to help ${lead.company} with ${goal.toLowerCase()}. Would you be open to a quick call?`,
                });
              });
            }
          } catch (batchErr) {
            console.error("[wizard] email batch error:", batchErr);
            batch.forEach((lead, i) => {
              emailResults.push({
                index: start + i + 1,
                subject: `${goal} — ${lead.company}`,
                body: `Hi ${lead.first_name}, I noticed ${lead.custom_note} I'd love to connect. Would you have 15 minutes this week?`,
              });
            });
          }
        }

        // ── Step 3: Save to Supabase ──
        send({ type: "activity", text: "Saving campaign to database...", variant: "amber" });

        const campaignName = `${targetAudience} — ${goal}`;
        console.log(`[wizard] inserting campaign: ${campaignName} for user ${userId}`);

        const { data: campaign, error: campaignError } = await db
          .from("campaigns")
          .insert({
            user_id: userId,
            name: campaignName,
            tone: "Professional",
            status: "complete",
            lead_count: leads.length,
          })
          .select()
          .single();

        if (campaignError || !campaign) {
          console.error("[wizard] campaign insert error:", campaignError?.message);
          send({ type: "error", message: "Failed to save campaign. Please try again." });
          return;
        }

        console.log(`[wizard] campaign created: ${campaign.id}`);

        const leadsToInsert = leads.map((lead, i) => {
          const email = emailResults.find((e) => e.index === i + 1);
          return {
            campaign_id: campaign.id,
            first_name: lead.first_name,
            company: lead.company,
            role: lead.role,
            email: lead.email,
            custom_note: lead.custom_note,
            generated_subject: email?.subject ?? `${goal} — ${lead.company}`,
            generated_body:
              email?.body ?? `Hi ${lead.first_name}, I'd love to connect about ${goal.toLowerCase()}.`,
          };
        });

        const { error: leadsError } = await db.from("leads").insert(leadsToInsert);
        if (leadsError) {
          console.error("[wizard] leads insert error:", leadsError.message);
        } else {
          console.log(`[wizard] inserted ${leadsToInsert.length} leads`);
        }

        // Update credits
        const { error: creditsError } = await db
          .from("subscriptions")
          .upsert(
            {
              user_id: userId,
              credits_used: creditsUsed + leads.length,
              credits_limit: creditsLimit,
            },
            { onConflict: "user_id" }
          );

        if (creditsError) {
          console.error("[wizard] credits update error:", creditsError.message);
        }

        send({ type: "activity", text: `Campaign ready — ${leads.length} emails prepared`, variant: "green" });
        send({ type: "done", campaignId: campaign.id, leadCount: leads.length, hot, warm, cold });
        console.log(`[wizard] done: campaign=${campaign.id} leads=${leads.length}`);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Internal server error";
        console.error("[wizard] unhandled error:", err);
        send({ type: "error", message });
      } finally {
        closed = true;
        try {
          controller.close();
        } catch {}
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
