import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 60;

type Lead = {
  id?: string;
  name?: string;
  company?: string;
  role?: string;
  website?: string;
  linkedin?: string;
  signals?: string;
  linkedin_headline?: string;
  recent_news?: string;
  funding?: string;
  job_postings?: string;
  [k: string]: unknown;
};

type Personalization = {
  hook: string;
  status: "personalized" | "generic";
  source: string;
};

const FALLBACK: Personalization = {
  hook: "Quick question about what you're building...",
  status: "generic",
  source: "none",
};

function hasSignals(lead: Lead): boolean {
  return Boolean(
    lead.signals ||
    lead.linkedin_headline ||
    lead.recent_news ||
    lead.funding ||
    lead.job_postings
  );
}

async function personalizeOne(
  client: Anthropic,
  lead: Lead
): Promise<Personalization> {
  if (!hasSignals(lead) && !lead.website) return FALLBACK;

  const sys =
    "You write ONE specific, natural opening line for a cold email based on a lead's recent activity. " +
    "Respond ONLY with valid JSON: {\"hook\": string, \"source\": string}. " +
    "The hook must reference ONE concrete, recent detail — a product launch, funding round, hire, or specific signal. " +
    "source describes what you referenced (e.g., \"Series A announcement\", \"LinkedIn headline\"). " +
    "Do not fabricate facts. If signals are thin, use only what is given. Max 22 words.";

  const user = [
    `Lead:`,
    `- Name: ${lead.name ?? "unknown"}`,
    `- Role: ${lead.role ?? "unknown"}`,
    `- Company: ${lead.company ?? "unknown"}`,
    `- Website: ${lead.website ?? "n/a"}`,
    `- LinkedIn headline: ${lead.linkedin_headline ?? "n/a"}`,
    `- Recent news: ${lead.recent_news ?? "n/a"}`,
    `- Funding: ${lead.funding ?? "n/a"}`,
    `- Job postings: ${lead.job_postings ?? "n/a"}`,
    `- Other signals: ${lead.signals ?? "n/a"}`,
  ].join("\n");

  try {
    const res = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 180,
      system: sys,
      messages: [{ role: "user", content: user }],
    });
    const text = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");
    const match = text.match(/\{[\s\S]*\}/);
    const parsed = match ? JSON.parse(match[0]) : null;
    const hook = typeof parsed?.hook === "string" ? parsed.hook.trim() : "";
    const source = typeof parsed?.source === "string" ? parsed.source.trim() : "";
    if (!hook) return FALLBACK;
    return { hook, status: "personalized", source: source || "lead data" };
  } catch {
    return FALLBACK;
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as { leads?: Lead[] };
  const leads = body.leads ?? [];

  if (!Array.isArray(leads) || leads.length === 0) {
    return NextResponse.json({ error: "No leads provided" }, { status: 400 });
  }
  if (leads.length > 100) {
    return NextResponse.json({ error: "Max 100 leads per request" }, { status: 400 });
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const personalizations = await Promise.all(leads.map((l) => personalizeOne(client, l)));

  const results = leads.map((lead, i) => ({ ...lead, ...personalizations[i] }));
  const personalized = results.filter((r) => r.status === "personalized").length;

  return NextResponse.json({
    results,
    personalized,
    generic: results.length - personalized,
    total: results.length,
  });
}
