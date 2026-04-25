import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

type SignalData = {
  company_insights: string;
  role_insights: string;
  pain_points: string[];
  talking_points: string[];
  recent_signals: string[];
  personalization_hooks: string[];
  last_updated: string;
};

type LeadRow = {
  id: string;
  campaign_id: string;
  first_name: string | null;
  company: string | null;
  role: string | null;
  email: string | null;
};

type SignalRow = {
  lead_id: string;
  campaign_id: string;
  source: string;
  source_url: string | null;
  date: string | null;
  date_iso: string | null;
  strength: string;
};

const URL_RE = /\bhttps?:\/\/[^\s<>"')]+/i;

// Best-effort: derive a source label from the text content.
function inferSource(text: string): string {
  const t = text.toLowerCase();
  if (t.includes("linkedin")) return "LinkedIn";
  if (t.includes("github")) return "GitHub";
  if (t.includes("twitter") || t.includes("x.com")) return "Twitter";
  if (t.includes("crunchbase") || t.includes("funding") || t.includes("raised")) return "funding";
  if (t.includes("hiring") || t.includes("job")) return "hiring";
  if (t.includes("launch") || t.includes("release") || t.includes("product")) return "product";
  if (t.includes("news") || t.includes("article") || t.includes("press")) return "news";
  return "research";
}

// Extract discrete signal rows from the rich research blob written to leads.signal_data.
// Pulls each entry from `recent_signals[]` (and falls back to `personalization_hooks[]`),
// deriving source / source_url / date_iso heuristically.
function extractSignals(
  signalData: SignalData,
  lead: { id: string; campaign_id: string }
): SignalRow[] {
  const today = new Date().toISOString().slice(0, 10);
  const items: string[] = [
    ...(Array.isArray(signalData.recent_signals) ? signalData.recent_signals : []),
    ...(Array.isArray(signalData.personalization_hooks) ? signalData.personalization_hooks : []),
  ]
    .map((s) => (typeof s === "string" ? s.trim() : ""))
    .filter((s) => s.length >= 10);

  const out: SignalRow[] = [];
  const seenKey = new Set<string>();
  for (const text of items) {
    const source = inferSource(text);
    const urlMatch = text.match(URL_RE);
    const source_url = urlMatch ? urlMatch[0] : null;
    const date_iso = today;
    const key = `${source}|${date_iso}`;
    if (seenKey.has(key)) continue;
    seenKey.add(key);
    out.push({
      lead_id: lead.id,
      campaign_id: lead.campaign_id,
      source,
      source_url,
      date: date_iso,
      date_iso,
      strength: "medium",
    });
  }
  return out;
}

function getDb() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function researchLead(
  anthropic: Anthropic,
  lead: LeadRow
): Promise<SignalData | null> {
  const firstName = lead.first_name || "Unknown";
  const company = lead.company || "Unknown Company";
  const role = lead.role || "Unknown Role";
  const emailDomain = lead.email?.split("@")[1] || "";

  try {
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 700,
      system: `You are a sales research assistant. Based on the following lead information, provide specific, actionable intelligence a salesperson can reference in a cold email. Focus on: likely company pain points, role-specific challenges, industry context, and compelling personalization angles. Be specific and practical. Never fabricate facts. Return ONLY a valid JSON object with exactly these keys: { "company_insights": string, "role_insights": string, "pain_points": string[], "talking_points": string[], "recent_signals": string[], "personalization_hooks": string[] }. No markdown, no code fences.`,
      messages: [
        {
          role: "user",
          content: `Research this lead for a cold outreach email:\nName: ${firstName}\nCompany: ${company}\nRole: ${role}${emailDomain ? `\nEmail domain: ${emailDomain}` : ""}\n\nProvide actionable sales intelligence. Keep each array to 2-3 items max.`,
        },
      ],
    });

    const raw =
      message.content[0].type === "text" ? message.content[0].text.trim() : "";
    const cleaned = raw.replace(/```json\s*/gi, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return { ...parsed, last_updated: new Date().toISOString() };
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  // Reset stuck leads: processing > 5 minutes old → queued
  await db
    .from("leads")
    .update({ signal_status: "queued", updated_at: new Date().toISOString() })
    .eq("signal_status", "processing")
    .lt("updated_at", new Date(Date.now() - 5 * 60 * 1000).toISOString());

  // Atomically claim next 150 queued leads
  const { data: claimed, error: claimErr } = await db.rpc("claim_queued_leads", {
    batch_size: 150,
  });

  if (claimErr) {
    console.error(
      JSON.stringify({ step: "cron_claim_error", error: claimErr.message })
    );
    return NextResponse.json({ error: claimErr.message }, { status: 500 });
  }

  const leads = (claimed as LeadRow[]) ?? [];
  if (leads.length === 0) {
    return NextResponse.json({ processed: 0, message: "No queued leads" });
  }

  console.log(JSON.stringify({ step: "cron_start", count: leads.length }));

  const CONCURRENCY = 15;
  let successCount = 0;
  let signalsExtracted = 0;
  let signalsInserted = 0;
  let signalsDuplicate = 0;
  const creditsByCampaign: Record<string, number> = {};

  for (let i = 0; i < leads.length; i += CONCURRENCY) {
    const batch = leads.slice(i, i + CONCURRENCY);
    await Promise.all(
      batch.map(async (lead) => {
        const signalData = await researchLead(anthropic, lead);
        if (signalData) {
          await db
            .from("leads")
            .update({
              signal_data: signalData,
              signal_status: "done",
              updated_at: new Date().toISOString(),
            })
            .eq("id", lead.id);
          successCount++;
          creditsByCampaign[lead.campaign_id] =
            (creditsByCampaign[lead.campaign_id] ?? 0) + 1;

          // Additive: also write discrete signal rows. Failures here must not
          // affect lead status or credit accounting.
          try {
            const extracted = extractSignals(signalData, lead);
            signalsExtracted += extracted.length;
            if (extracted.length > 0) {
              const { data: inserted, error: signalErr } = await db
                .from("signals")
                .upsert(extracted, {
                  onConflict: "lead_id,source,date_iso",
                  ignoreDuplicates: true,
                })
                .select("id");
              if (signalErr) {
                console.error(
                  JSON.stringify({
                    step: "cron_signals_insert_error",
                    lead_id: lead.id,
                    error: signalErr.message,
                  })
                );
              } else {
                const insertedCount = inserted?.length ?? 0;
                signalsInserted += insertedCount;
                signalsDuplicate += extracted.length - insertedCount;
              }
            }
          } catch (err: unknown) {
            console.error(
              JSON.stringify({
                step: "cron_signals_extract_error",
                lead_id: lead.id,
                error: err instanceof Error ? err.message : String(err),
              })
            );
          }
        } else {
          await db
            .from("leads")
            .update({
              signal_status: "failed",
              updated_at: new Date().toISOString(),
            })
            .eq("id", lead.id);
        }
      })
    );
  }

  // Deduct credits per user
  const campaignIds = [...new Set(leads.map((l) => l.campaign_id))];
  const { data: campaigns } = await db
    .from("campaigns")
    .select("id, user_id")
    .in("id", campaignIds);

  const campaignUserMap: Record<string, string> = {};
  for (const c of campaigns ?? []) campaignUserMap[c.id] = c.user_id;

  const creditsByUser: Record<string, number> = {};
  for (const [campId, credits] of Object.entries(creditsByCampaign)) {
    const uid = campaignUserMap[campId];
    if (uid) creditsByUser[uid] = (creditsByUser[uid] ?? 0) + credits;
  }

  for (const [userId, credits] of Object.entries(creditsByUser)) {
    const { data: sub } = await db
      .from("subscriptions")
      .select("credits_used")
      .eq("user_id", userId)
      .single();
    if (sub) {
      await db
        .from("subscriptions")
        .update({ credits_used: (sub.credits_used ?? 0) + credits })
        .eq("user_id", userId);
    }
  }

  console.log(
    JSON.stringify({
      step: "cron_done",
      total: leads.length,
      success: successCount,
      signals_extracted: signalsExtracted,
      signals_inserted: signalsInserted,
      signals_duplicate: signalsDuplicate,
    })
  );
  return NextResponse.json({
    processed: leads.length,
    success: successCount,
    signals: {
      extracted: signalsExtracted,
      inserted: signalsInserted,
      duplicate: signalsDuplicate,
    },
  });
}
