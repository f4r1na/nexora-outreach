import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { signal_type, tone, email_body, company_name } = body as {
    signal_type?: string;
    tone?: string;
    email_body?: string;
    company_name?: string;
  };

  if (!tone || !email_body) {
    return NextResponse.json({ error: "tone and email_body are required" }, { status: 400 });
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 300,
    messages: [{
      role: "user",
      content: `Generate 3 subject line variations for this cold email. Return ONLY a JSON array of exactly 3 strings. No markdown.

Signal type: ${signal_type ?? "general"}
Tone: ${tone}
Target company: ${company_name ?? "their company"}
Email body: ${email_body}

Rules:
- 5-10 words each
- No spam trigger words (free, guaranteed, limited time, act now)
- 3 different angles: curiosity-based, direct/value, specific/personalized
- Match the ${tone} tone exactly

Return ONLY the JSON array of 3 strings. Nothing else.`,
    }],
  });

  const raw = message.content[0].type === "text" ? message.content[0].text : "[]";
  const cleaned = raw.replace(/```json\s*/gi, "").replace(/```/g, "").trim();

  let subjects: string[];
  try {
    subjects = JSON.parse(cleaned);
    if (!Array.isArray(subjects)) throw new Error("not array");
    subjects = subjects.slice(0, 3).map(String);
  } catch {
    return NextResponse.json({ error: "AI returned invalid response. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ subjects });
}
