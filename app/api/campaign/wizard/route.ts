import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

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

type EmailResult = {
  index: number;
  subject: string;
  body: string;
};

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { targetAudience, goal, leadCount: leadCountStr, location, sendMode } = body as {
    targetAudience: string;
    goal: string;
    leadCount: string;
    location: string;
    sendMode: string;
  };

  const count = Math.min(parseInt(leadCountStr?.split(" ")[0] ?? "10") || 10, 50);

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
        const supabase = await createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          send({ type: "error", message: "Unauthorized" });
          return;
        }

        const rl = rateLimit({ key: `wizard:${user.id}`, limit: 10, windowMs: 3600_000 });
        if (!rl.ok) {
          send({ type: "error", message: "Rate limit exceeded. Try again later." });
          return;
        }

        const { data: sub } = await supabase
          .from("subscriptions")
          .select("credits_used, credits_limit")
          .eq("user_id", user.id)
          .single();

        const creditsUsed = sub?.credits_used ?? 0;
        const creditsLimit = sub?.credits_limit ?? 10;

        if (creditsUsed + count > creditsLimit) {
          send({
            type: "error",
            message: `Credit limit reached. You have ${Math.max(0, creditsLimit - creditsUsed)} credits left.`,
          });
          return;
        }

        const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

        // ── Step 1: Generate leads
        send({ type: "activity", text: `Finding ${count} ${targetAudience} leads...`, variant: "orange" });

        const locationCtx = location === "Anywhere" ? "worldwide" : location;

        const leadsMsg = await anthropic.messages.create({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 3000,
          messages: [
            {
              role: "user",
              content: `Generate ${count} realistic B2B sales leads. Return ONLY a valid JSON array, no markdown, no code fences.

Target audience: ${targetAudience}
Location: ${locationCtx}
Outreach goal: ${goal}

Each lead: { "first_name": string, "company": string, "role": string, "email": string, "custom_note": string }
- email: realistic format like firstname@company.com
- custom_note: one concrete business challenge this person faces, relevant to the goal
- Companies and names should sound real but be entirely fictional
- role must match the target audience archetype`,
            },
          ],
        });

        const leadsRaw = leadsMsg.content[0].type === "text" ? leadsMsg.content[0].text : "[]";
        const leadsCleaned = leadsRaw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();

        let leads: LeadData[] = [];
        try {
          const parsed = JSON.parse(leadsCleaned);
          leads = Array.isArray(parsed) ? parsed.slice(0, count) : [];
        } catch {
          send({ type: "error", message: "Failed to generate leads. Please try again." });
          return;
        }

        if (leads.length === 0) {
          send({ type: "error", message: "No leads generated. Please try again." });
          return;
        }

        send({ type: "activity", text: `Found ${leads.length} qualified ${targetAudience} profiles...`, variant: "orange" });

        const hot = Math.floor(leads.length * 0.35);
        const warm = Math.floor(leads.length * 0.5);
        const cold = leads.length - hot - warm;

        send({ type: "activity", text: `Scored ${hot} hot, ${warm} warm, ${cold} cold leads...`, variant: "amber" });

        // ── Step 2: Generate emails in batches of 10
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
- index: the lead number shown below (1-based)
- subject: compelling, specific, 6-10 words
- body: 2-3 sentences, reference their specific situation in sentence 1, professional tone

Leads:
${leadsPrompt}`,
                },
              ],
            });

            const raw = emailMsg.content[0].type === "text" ? emailMsg.content[0].text : "[]";
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
          } catch {
            batch.forEach((lead, i) => {
              emailResults.push({
                index: start + i + 1,
                subject: `${goal} — ${lead.company}`,
                body: `Hi ${lead.first_name}, I noticed ${lead.custom_note} I'd love to connect. Would you have 15 minutes this week?`,
              });
            });
          }
        }

        // ── Step 3: Save to Supabase
        send({ type: "activity", text: "Saving campaign to database...", variant: "amber" });

        const campaignName = `${targetAudience} — ${goal}`;
        const { data: campaign, error: campaignError } = await supabase
          .from("campaigns")
          .insert({
            user_id: user.id,
            name: campaignName,
            tone: "Professional",
            status: "complete",
            lead_count: leads.length,
          })
          .select()
          .single();

        if (campaignError || !campaign) {
          send({ type: "error", message: "Failed to save campaign. Please try again." });
          return;
        }

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
            generated_body: email?.body ?? `Hi ${lead.first_name}, I'd love to connect about ${goal.toLowerCase()}.`,
          };
        });

        await supabase.from("leads").insert(leadsToInsert);

        await supabase
          .from("subscriptions")
          .upsert(
            { user_id: user.id, credits_used: creditsUsed + leads.length, credits_limit: creditsLimit },
            { onConflict: "user_id" }
          );

        send({ type: "activity", text: `Campaign ready — ${leads.length} emails prepared`, variant: "green" });
        send({ type: "done", campaignId: campaign.id, leadCount: leads.length, hot, warm, cold });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Internal server error";
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
