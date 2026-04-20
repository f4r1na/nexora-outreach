import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 60;

type Lead = {
  id?: string;
  name?: string;
  email?: string;
  company?: string;
  role?: string;
  website?: string;
  linkedin?: string;
  signals?: string;
  [k: string]: unknown;
};

type Score = {
  score: number;
  tier: "hot" | "warm" | "cold";
  reasoning: string;
  recommended_action: "send_now" | "send_later" | "skip";
};

function clampScore(s: unknown): number {
  const n = typeof s === "number" ? s : Number(s);
  if (!Number.isFinite(n)) return 50;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function tierFor(score: number): Score["tier"] {
  if (score >= 80) return "hot";
  if (score >= 50) return "warm";
  return "cold";
}

function actionFor(score: number): Score["recommended_action"] {
  if (score >= 80) return "send_now";
  if (score >= 50) return "send_later";
  return "skip";
}

async function scoreOne(
  client: Anthropic,
  lead: Lead,
  campaignGoal: string
): Promise<Score> {
  const sys =
    "You score B2B sales leads 0-100 for fit against a campaign goal. " +
    "Respond ONLY with valid JSON: {\"score\": number, \"reasoning\": string}. " +
    "reasoning must be ONE short sentence. Consider: job title relevance, company size fit, " +
    "recent activity signals, email domain quality, LinkedIn presence.";

  const user = [
    `Campaign goal: ${campaignGoal}`,
    `Lead:`,
    `- Name: ${lead.name ?? "unknown"}`,
    `- Role: ${lead.role ?? "unknown"}`,
    `- Company: ${lead.company ?? "unknown"}`,
    `- Email: ${lead.email ?? "unknown"}`,
    `- Website: ${lead.website ?? "n/a"}`,
    `- LinkedIn: ${lead.linkedin ?? "n/a"}`,
    `- Signals: ${lead.signals ?? "n/a"}`,
  ].join("\n");

  try {
    const res = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 200,
      system: sys,
      messages: [{ role: "user", content: user }],
    });
    const text = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");
    const match = text.match(/\{[\s\S]*\}/);
    const parsed = match ? JSON.parse(match[0]) : null;
    const score = clampScore(parsed?.score);
    const reasoning = typeof parsed?.reasoning === "string" && parsed.reasoning.trim()
      ? parsed.reasoning.trim()
      : "Heuristic score based on available fields.";
    return {
      score,
      tier: tierFor(score),
      reasoning,
      recommended_action: actionFor(score),
    };
  } catch {
    return {
      score: 50,
      tier: "warm",
      reasoning: "Scoring unavailable — defaulted to warm.",
      recommended_action: "send_later",
    };
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as { leads?: Lead[]; campaignGoal?: string };
  const leads = body.leads ?? [];
  const goal = (body.campaignGoal ?? "").trim() || "General B2B outreach";

  if (!Array.isArray(leads) || leads.length === 0) {
    return NextResponse.json({ error: "No leads provided" }, { status: 400 });
  }
  if (leads.length > 100) {
    return NextResponse.json({ error: "Max 100 leads per request" }, { status: 400 });
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const scores = await Promise.all(leads.map((l) => scoreOne(client, l, goal)));

  const results = leads.map((lead, i) => ({ ...lead, ...scores[i] }));
  results.sort((a, b) => b.score - a.score);

  const counts = { hot: 0, warm: 0, cold: 0 };
  for (const r of results) counts[r.tier]++;

  return NextResponse.json({
    results,
    counts,
    total: results.length,
  });
}
