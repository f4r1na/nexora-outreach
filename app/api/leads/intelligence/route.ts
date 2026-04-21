import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 120;

type Signal = {
  type: string;
  text: string;
  source: string;
  date: string;
  strength: "high" | "medium" | "low";
};

type CompanyIntel = {
  industry: string;
  size: string;
  description: string;
  funding_stage: string;
  website: string;
};

type SignalData = {
  signals: Signal[];
  intelligence_score: number;
  last_updated: string;
  company_intel: CompanyIntel;
};

type LeadInput = {
  id: string;
  first_name: string;
  company: string;
  role: string;
  custom_note: string;
};

async function generateSignals(
  client: Anthropic,
  lead: LeadInput
): Promise<SignalData> {
  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 700,
    messages: [
      {
        role: "user",
        content: `You are a B2B sales intelligence tool. Generate realistic signals for this lead.

Lead: ${lead.first_name}, ${lead.role} at ${lead.company}
Known challenge: ${lead.custom_note}

Return ONLY valid JSON:
{
  "signals": [
    { "type": "hiring|funding|news|pain_point|activity", "text": "specific 8-15 word signal", "source": "LinkedIn|Crunchbase|Twitter|Web|News", "date": "X days ago|X weeks ago|X months ago", "strength": "high|medium|low" }
  ],
  "intelligence_score": 70-95,
  "company_intel": {
    "industry": "string",
    "size": "X-Y employees",
    "description": "one sentence about what they do",
    "funding_stage": "string or empty string",
    "website": "plausible domain"
  }
}

Rules:
- Exactly 2-3 signals, all specific and plausible
- At least one signal must reference: "${lead.custom_note}"
- Signals must fit a ${lead.role} at a company called ${lead.company}
- Never fabricate specific dollar amounts for funding; use ranges like "$2-5M"
- No emojis or markdown`,
      },
    ],
  });

  const text =
    msg.content[0].type === "text" ? msg.content[0].text : "{}";
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON");
  const parsed = JSON.parse(match[0]);

  return {
    signals: Array.isArray(parsed.signals) ? parsed.signals.slice(0, 3) : [],
    intelligence_score: Number(parsed.intelligence_score) || 72,
    last_updated: new Date().toISOString(),
    company_intel: {
      industry: parsed.company_intel?.industry ?? "Technology",
      size: parsed.company_intel?.size ?? "10-50 employees",
      description:
        parsed.company_intel?.description ??
        `${lead.company} helps businesses grow.`,
      funding_stage: parsed.company_intel?.funding_stage ?? "",
      website:
        parsed.company_intel?.website ??
        `${lead.company.toLowerCase().replace(/[^a-z0-9]/g, "")}.com`,
    },
  };
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = rateLimit({ key: `intel:${user.id}`, limit: 20, windowMs: 3600_000 });
  if (!rl.ok) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

  const body = (await req.json()) as { leads?: LeadInput[] };
  const leads = body.leads ?? [];
  if (!Array.isArray(leads) || leads.length === 0) {
    return NextResponse.json({ error: "No leads provided" }, { status: 400 });
  }
  if (leads.length > 60) {
    return NextResponse.json({ error: "Max 60 leads per request" }, { status: 400 });
  }

  // Verify ownership via RLS: only leads the user owns will be returned
  const { data: ownedLeads } = await supabase
    .from("leads")
    .select("id")
    .in(
      "id",
      leads.map((l) => l.id)
    );
  const ownedIds = new Set(ownedLeads?.map((l) => l.id) ?? []);
  const authorized = leads.filter((l) => ownedIds.has(l.id));
  if (authorized.length === 0) {
    return NextResponse.json({ ok: true, processed: 0 });
  }

  const db = createAdminClient();
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

  // Mark all as researching
  await db
    .from("leads")
    .update({ signal_status: "researching" })
    .in(
      "id",
      authorized.map((l) => l.id)
    );

  // Process in parallel batches of 4
  const BATCH = 4;
  for (let i = 0; i < authorized.length; i += BATCH) {
    const batch = authorized.slice(i, i + BATCH);
    await Promise.allSettled(
      batch.map(async (lead) => {
        try {
          const signalData = await generateSignals(anthropic, lead);
          await db
            .from("leads")
            .update({ signal_data: signalData, signal_status: "done" })
            .eq("id", lead.id);
        } catch {
          await db
            .from("leads")
            .update({ signal_status: "failed" })
            .eq("id", lead.id);
        }
      })
    );
  }

  return NextResponse.json({ ok: true, processed: authorized.length });
}
