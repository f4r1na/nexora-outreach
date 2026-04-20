import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as {
    subject: string;
    emailBody: string;
    leadContext: { first_name: string; company: string; role: string; custom_note?: string };
  };
  const { subject, emailBody, leadContext } = body;

  const { data: insight } = await supabase
    .from("campaign_iq_insights")
    .select("best_opening_style, best_subject_pattern, winning_signals, losing_patterns")
    .eq("user_id", user.id)
    .is("campaign_id", null)
    .order("analyzed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const insightCtx = insight
    ? `
PROVEN PATTERNS (apply these):
- Opening style: ${insight.best_opening_style}
- Subject pattern: ${insight.best_subject_pattern}
- Winning signals to reference: ${(insight.winning_signals as string[]).join("; ")}
- Patterns to avoid: ${(insight.losing_patterns as string[]).join("; ")}`
    : "";

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
  const msg = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 600,
    messages: [{
      role: "user",
      content: `B2B cold email optimizer. Rewrite to improve reply rate.

LEAD: ${leadContext.first_name}, ${leadContext.role} at ${leadContext.company}
CONTEXT: ${leadContext.custom_note ?? ""}
${insightCtx}

CURRENT EMAIL:
Subject: ${subject}
Body: ${emailBody}

Return ONLY valid JSON:
{
  "improved_subject": "new subject line",
  "improved_body": "new email body",
  "explanation": "1-2 sentences on what changed and why"
}

Keep it concise, personalized, no emojis, no markdown in the email.`,
    }],
  });

  const text = msg.content[0].type === "text" ? msg.content[0].text : "{}";
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return NextResponse.json({ error: "Improvement failed" }, { status: 500 });
  return NextResponse.json(JSON.parse(match[0]));
}
