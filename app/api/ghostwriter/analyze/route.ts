import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Agency-only check
    const db = getServiceClient();
    const { data: sub } = await db
      .from("subscriptions")
      .select("plan")
      .eq("user_id", user.id)
      .single();

    if (sub?.plan !== "agency") {
      return NextResponse.json({ error: "Ghost Writer Mode requires an Agency plan" }, { status: 403 });
    }

    let sampleEmails: string[];
    try {
      const body = await req.json();
      sampleEmails = body.sample_emails;
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    if (!Array.isArray(sampleEmails) || sampleEmails.length < 3) {
      return NextResponse.json({ error: "At least 3 sample emails are required" }, { status: 400 });
    }

    const filled = sampleEmails.map((s: string) => s?.trim()).filter(Boolean);
    if (filled.length < 3) {
      return NextResponse.json({ error: "At least 3 non-empty sample emails are required" }, { status: 400 });
    }

    console.log(JSON.stringify({ step: "ghostwriter_analyze_start", user_id: user.id, sample_count: filled.length }));

    const emailBlock = filled.map((e, i) => `[Email ${i + 1}]\n${e}`).join("\n\n---\n\n");

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 800,
      system: `You are an expert writing style analyst. Analyze email samples and extract the writer's unique style. Return ONLY a valid JSON object with exactly two keys: "style_summary" (a 3-5 sentence style guide describing tone, sentence structure, vocabulary, opening/closing patterns, and key quirks) and "tone_keywords" (a comma-separated string of 5-8 single-word descriptors like "conversational, direct, warm, concise, confident"). No markdown, no code fences.`,
      messages: [
        {
          role: "user",
          content: `Analyze my writing style from these sample emails:\n\n${emailBlock}`,
        },
      ],
    });

    const raw = message.content[0].type === "text" ? message.content[0].text.trim() : "";
    console.log(JSON.stringify({ step: "ghostwriter_analysis_raw", length: raw.length }));

    let styleSummary: string;
    let toneKeywords: string;

    try {
      const parsed = JSON.parse(raw.replace(/```json\s*/gi, "").replace(/```/g, "").trim()) as {
        style_summary: string;
        tone_keywords: string;
      };
      styleSummary = parsed.style_summary ?? raw;
      toneKeywords = parsed.tone_keywords ?? "";
    } catch {
      // Fallback: use raw text as summary
      styleSummary = raw;
      toneKeywords = "";
    }

    // Upsert: SELECT then INSERT or UPDATE
    const { data: existing } = await db
      .from("writing_styles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    type DbError = { message: string };
    let saveError: DbError | null = null;

    if (existing) {
      const { error } = await db
        .from("writing_styles")
        .update({
          sample_emails: filled,
          style_summary: styleSummary,
          tone_keywords: toneKeywords,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);
      if (error) saveError = error as DbError;
    } else {
      const { error } = await db
        .from("writing_styles")
        .insert({
          user_id: user.id,
          sample_emails: filled,
          style_summary: styleSummary,
          tone_keywords: toneKeywords,
        });
      if (error) saveError = error as DbError;
    }

    if (saveError) {
      console.error(JSON.stringify({ step: "ghostwriter_save_error", error: saveError.message }));
      return NextResponse.json({ error: "Failed to save writing style" }, { status: 500 });
    }

    console.log(JSON.stringify({ step: "ghostwriter_saved", user_id: user.id }));
    return NextResponse.json({
      ok: true,
      style: { style_summary: styleSummary, tone_keywords: toneKeywords, sample_emails: filled },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(JSON.stringify({ step: "ghostwriter_analyze_fatal", error: msg }));
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
