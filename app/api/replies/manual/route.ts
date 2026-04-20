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

    let emailFrom: string;
    let subject: string | undefined;
    let replyBody: string;
    let campaignId: string | undefined;

    try {
      const body = await req.json();
      emailFrom = body.email_from;
      subject = body.subject;
      replyBody = body.reply_body;
      campaignId = body.campaign_id;
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    if (!emailFrom || !replyBody) {
      return NextResponse.json({ error: "email_from and reply_body are required" }, { status: 400 });
    }

    const db = getServiceClient();

    // Try to match a lead by email
    let matchedLead: { id: string; first_name: string | null; campaign_id: string } | null = null;

    // Build query — if campaignId given, scope to it; otherwise search user's sent campaigns
    const { data: sentCampaigns } = await db
      .from("campaigns")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "sent");

    const campaignIds = (sentCampaigns ?? []).map((c) => c.id);

    if (campaignIds.length > 0) {
      const query = db
        .from("leads")
        .select("id, first_name, campaign_id")
        .ilike("email", emailFrom.trim())
        .in("campaign_id", campaignId ? [campaignId] : campaignIds)
        .limit(1);

      const { data: leadMatch } = await query;
      if (leadMatch && leadMatch.length > 0) {
        matchedLead = leadMatch[0];
      }
    }

    console.log(JSON.stringify({
      step: "manual_reply_start",
      from: emailFrom,
      matched_lead: matchedLead?.id ?? null,
    }));

    // Generate AI draft
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const name = matchedLead?.first_name ?? emailFrom;

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 400,
      messages: [
        {
          role: "user",
          content: `You are a professional sales rep replying to a prospect's response to a cold email.

Lead name: ${name}
Original email subject: ${subject ?? "(unknown)"}
Their reply:
"""
${replyBody}
"""

Write a short, natural follow-up reply (2-4 sentences). Be warm and conversational. Move the conversation forward — if they're interested, suggest a quick call; if they have questions, answer them briefly; if they're not interested, be gracious.

Return ONLY the email body text. No subject line, no greeting, no sign-off.`,
        },
      ],
    });

    const aiDraft =
      message.content[0].type === "text" ? message.content[0].text.trim() : "";

    // Insert reply
    const { data: inserted, error: insertError } = await db
      .from("replies")
      .insert({
        user_id: user.id,
        campaign_id: matchedLead?.campaign_id ?? campaignId ?? null,
        lead_id: matchedLead?.id ?? null,
        lead_email: emailFrom.toLowerCase().trim(),
        lead_name: matchedLead?.first_name ?? null,
        original_subject: subject ?? null,
        reply_body: replyBody.trim(),
        ai_draft: aiDraft,
        status: "draft_ready",
      })
      .select("id")
      .single();

    if (insertError || !inserted) {
      console.error(JSON.stringify({ step: "manual_insert_error", error: insertError?.message }));
      return NextResponse.json({ error: "Failed to save reply" }, { status: 500 });
    }

    console.log(JSON.stringify({ step: "manual_reply_created", reply_id: inserted.id }));
    return NextResponse.json({ reply_id: inserted.id, ai_draft: aiDraft, matched_lead: matchedLead?.id ?? null });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(JSON.stringify({ step: "manual_reply_fatal", error: msg }));
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
