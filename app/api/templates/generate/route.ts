import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getDb() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { campaign_id, signal_type, contact_name, company_name } = body as {
    campaign_id?: string;
    signal_type?: string;
    contact_name?: string;
    company_name?: string;
  };

  if (!campaign_id) {
    return NextResponse.json({ error: "campaign_id is required" }, { status: 400 });
  }

  const db = getDb();

  const { data: campaign } = await db
    .from("campaigns")
    .select("id")
    .eq("id", campaign_id)
    .eq("user_id", user.id)
    .single();
  if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const signalContext = signal_type && signal_type !== "general"
    ? `The target company has a recent "${signal_type}" signal (e.g. a new job posting, funding round, GitHub activity, or product launch).`
    : "No specific signal — write based on general B2B outreach.";

  const sampleName = contact_name || "Alex";
  const sampleCompany = company_name || "their company";

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1400,
    messages: [{
      role: "user",
      content: `Write 5 cold email templates for B2B outreach. Return ONLY a JSON array with exactly 5 objects. No markdown, no code fences, no explanation.

Signal context: ${signalContext}
Sample target: ${sampleName} at ${sampleCompany}

Each object must be exactly: { "tone": string, "subject": string, "body": string }

Generate these 5 tones in this exact order:
1. "formal" - executive, polished, corporate language
2. "casual" - conversational, peer-to-peer, friendly tone
3. "urgent" - FOMO or time-pressure, but not pushy
4. "value-first" - lead with specific ROI or outcome before the ask
5. "social-proof" - reference similar companies or concrete results achieved

Rules for subject:
- 6-10 words, no spam trigger words (free, guaranteed, limited time, act now)
- Compelling and specific to the signal context

Rules for body:
- Exactly 2-3 sentences
- Use {first_name} and {company_name} as placeholders (curly-brace syntax — the system substitutes them per lead at send time)
- First sentence must naturally reference the signal context
- Last sentence must be a specific, clear CTA

Return ONLY the JSON array. Nothing else.`,
    }],
  });

  const raw = message.content[0].type === "text" ? message.content[0].text : "[]";
  const cleaned = raw.replace(/```json\s*/gi, "").replace(/```/g, "").trim();

  let variants: { tone: string; subject: string; body: string }[];
  try {
    variants = JSON.parse(cleaned);
    if (!Array.isArray(variants) || variants.length === 0) throw new Error("empty");
  } catch {
    return NextResponse.json({ error: "AI returned invalid response. Please try again." }, { status: 500 });
  }

  await db.from("email_templates").delete().eq("campaign_id", campaign_id);

  const rows = variants.map((v) => ({
    campaign_id,
    signal_type: signal_type ?? "general",
    tone: v.tone,
    subject: v.subject,
    body: v.body,
  }));

  const { data: saved, error: saveError } = await db
    .from("email_templates")
    .insert(rows)
    .select("id, tone, subject, body");

  if (saveError || !saved) {
    return NextResponse.json({ error: "Failed to save templates" }, { status: 500 });
  }

  return NextResponse.json({ templates: saved });
}
