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

    let replyId: string;
    try {
      const body = await req.json();
      replyId = body.reply_id;
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    if (!replyId) {
      return NextResponse.json({ error: "reply_id is required" }, { status: 400 });
    }

    const db = getServiceClient();

    // Fetch the reply
    const { data: reply, error: replyError } = await db
      .from("replies")
      .select("id, user_id, lead_name, lead_email, original_subject, reply_body, status")
      .eq("id", replyId)
      .eq("user_id", user.id)
      .single();

    if (replyError || !reply) {
      return NextResponse.json({ error: "Reply not found" }, { status: 404 });
    }

    console.log(JSON.stringify({ step: "draft_generate_start", reply_id: replyId }));

    // Generate AI draft
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const name = reply.lead_name ?? reply.lead_email;
    const subject = reply.original_subject ?? "(no subject)";
    const incomingReply = reply.reply_body;

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 400,
      messages: [
        {
          role: "user",
          content: `You are a professional sales rep replying to a prospect's response to a cold email.

Lead name: ${name}
Original email subject: ${subject}
Their reply:
"""
${incomingReply}
"""

Write a short, natural follow-up reply (2-4 sentences). Be warm and conversational. Move the conversation forward — if they're interested, suggest a quick call; if they have questions, answer them briefly; if they're not interested, be gracious.

Return ONLY the email body text. No subject line, no greeting (start from the first sentence of the reply body), no sign-off.`,
        },
      ],
    });

    const aiDraft =
      message.content[0].type === "text" ? message.content[0].text.trim() : "";

    console.log(JSON.stringify({ step: "draft_generated", reply_id: replyId, length: aiDraft.length }));

    // Save draft
    const { error: updateError } = await db
      .from("replies")
      .update({ ai_draft: aiDraft, status: "draft_ready" })
      .eq("id", replyId)
      .eq("user_id", user.id);

    if (updateError) {
      console.error(JSON.stringify({ step: "draft_save_error", error: updateError.message }));
      return NextResponse.json({ error: "Failed to save draft" }, { status: 500 });
    }

    return NextResponse.json({ reply_id: replyId, ai_draft: aiDraft });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(JSON.stringify({ step: "draft_fatal", error: msg }));
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
