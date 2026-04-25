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
  source_url: string;
  date: string;
  date_iso: string;
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
  discarded: string[];
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
    max_tokens: 800,
    messages: [
      {
        role: "user",
        content: `You are a B2B sales intelligence tool. Generate realistic signals for this lead.

Lead: ${lead.first_name}, ${lead.role} at ${lead.company}
Known challenge: ${lead.custom_note}

Return ONLY valid JSON:
{
  "signals": [
    {
      "type": "hiring|funding|news|pain_point|activity",
      "text": "specific 8-15 word signal",
      "source": "Source name (e.g. LinkedIn, TechCrunch, Crunchbase)",
      "source_url": "https://... direct URL to article or post (empty string if unknown)",
      "date": "X days ago|X weeks ago|X months ago",
      "date_iso": "YYYY-MM-DD (best estimate of publication date)",
      "strength": "high|medium|low"
    }
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
- source_url should be a realistic URL for the source, or empty string if you cannot construct one
- date_iso must be a valid YYYY-MM-DD date (use today minus the relative date as best estimate)
- No emojis or markdown`,
      },
    ],
  });

  const text =
    msg.content[0].type === "text" ? msg.content[0].text : "{}";
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON");
  const parsed = JSON.parse(match[0]);

  const today = new Date().toISOString().slice(0, 10);

  const signals: Signal[] = Array.isArray(parsed.signals)
    ? parsed.signals.slice(0, 3).map((s: Record<string, unknown>) => ({
        type: String(s.type ?? "news"),
        text: String(s.text ?? ""),
        source: String(s.source ?? "Web"),
        source_url: typeof s.source_url === "string" ? s.source_url : "",
        date: String(s.date ?? "recently"),
        date_iso: typeof s.date_iso === "string" && s.date_iso.match(/^\d{4}-\d{2}-\d{2}$/)
          ? s.date_iso
          : today,
        strength: (["high", "medium", "low"].includes(String(s.strength))
          ? s.strength
          : "medium") as "high" | "medium" | "low",
      }))
    : [];

  return {
    signals,
    intelligence_score: Number(parsed.intelligence_score) || 72,
    last_updated: new Date().toISOString(),
    discarded: [],
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
