import { NextRequest, NextResponse } from "next/server";
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

async function refreshGmailToken(refreshToken: string): Promise<string | null> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return (data.access_token as string) ?? null;
}

function buildReplyMessage(opts: {
  to: string;
  from: string;
  subject: string;
  body: string;
  threadId?: string | null;
}): string {
  const htmlBody = opts.body
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .split("\n")
    .join("<br>\n");

  const subject = opts.subject.startsWith("Re:")
    ? opts.subject
    : `Re: ${opts.subject}`;

  const mime = [
    `To: ${opts.to}`,
    `From: ${opts.from}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    "Content-Type: text/html; charset=UTF-8",
    "",
    `<html><body><div style="font-family:Arial,sans-serif;line-height:1.7;color:#222;max-width:600px">${htmlBody}</div></body></html>`,
  ].join("\r\n");

  return Buffer.from(mime).toString("base64url");
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let replyId: string;
    let action: "send" | "skip";
    let editedDraft: string | undefined;

    try {
      const body = await req.json();
      replyId = body.reply_id;
      action = body.action;
      editedDraft = body.edited_draft;
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    if (!replyId || !action) {
      return NextResponse.json({ error: "reply_id and action are required" }, { status: 400 });
    }

    if (action !== "send" && action !== "skip") {
      return NextResponse.json({ error: "action must be 'send' or 'skip'" }, { status: 400 });
    }

    const db = getServiceClient();

    console.log(JSON.stringify({ step: "reply_send_start", reply_id: replyId, action, user_id: user.id, has_edited_draft: !!editedDraft }));

    // Fetch reply
    const { data: reply, error: replyError } = await db
      .from("replies")
      .select("id, user_id, lead_email, lead_name, original_subject, ai_draft, gmail_thread_id, status")
      .eq("id", replyId)
      .eq("user_id", user.id)
      .single();

    if (replyError || !reply) {
      console.error(JSON.stringify({ step: "reply_fetch_error", reply_id: replyId, error: replyError?.message ?? "not found" }));
      return NextResponse.json({ error: "Reply not found" }, { status: 404 });
    }

    console.log(JSON.stringify({ step: "reply_fetched", reply_id: replyId, status: reply.status, has_ai_draft: !!reply.ai_draft }));

    if (reply.status === "sent" || reply.status === "skipped") {
      return NextResponse.json({ error: "Reply already processed" }, { status: 409 });
    }

    // Skip case
    if (action === "skip") {
      const { error: skipError } = await db
        .from("replies")
        .update({ status: "skipped" })
        .eq("id", replyId)
        .eq("user_id", user.id);

      if (skipError) {
        console.error(JSON.stringify({ step: "reply_skip_db_error", error: skipError.message }));
        return NextResponse.json({ error: "Failed to update reply status" }, { status: 500 });
      }

      console.log(JSON.stringify({ step: "reply_skipped", reply_id: replyId }));
      return NextResponse.json({ ok: true, action: "skipped" });
    }

    // Send case
    const { data: gmailConn, error: gmailConnError } = await db
      .from("gmail_connections")
      .select("access_token, refresh_token, gmail_email")
      .eq("user_id", user.id)
      .single();

    if (gmailConnError) {
      console.error(JSON.stringify({ step: "reply_gmail_conn_error", error: gmailConnError.message }));
    }

    if (!gmailConn?.access_token) {
      console.error(JSON.stringify({ step: "reply_no_gmail_conn", user_id: user.id }));
      return NextResponse.json({ error: "No Gmail account connected. Connect Gmail in Settings." }, { status: 400 });
    }

    let accessToken: string = gmailConn.access_token;
    const refreshToken: string | null = gmailConn.refresh_token ?? null;
    const fromEmail: string = gmailConn.gmail_email ?? "me";

    const draftToSend = editedDraft ?? reply.ai_draft ?? "";
    console.log(JSON.stringify({ step: "reply_draft_resolved", reply_id: replyId, draft_source: editedDraft ? "edited" : "ai_draft", draft_length: draftToSend.length, to: reply.lead_email, from: fromEmail }));

    if (!draftToSend.trim()) {
      return NextResponse.json({ error: "No draft to send — generate a draft first" }, { status: 400 });
    }

    const raw = buildReplyMessage({
      to: reply.lead_email,
      from: fromEmail,
      subject: reply.original_subject ?? "Re: your email",
      body: draftToSend,
      threadId: reply.gmail_thread_id,
    });

    // Build request body — include threadId if available for threading
    const sendBody: Record<string, unknown> = { raw };
    if (reply.gmail_thread_id) {
      sendBody.threadId = reply.gmail_thread_id;
    }

    async function sendViaGmail(): Promise<{ ok: boolean; authError: boolean; error?: string }> {
      const res = await fetch(
        "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(sendBody),
        }
      );
      if (res.ok) return { ok: true, authError: false };
      const body = await res.text();
      return { ok: false, authError: res.status === 401, error: `HTTP ${res.status}: ${body}` };
    }

    let result = await sendViaGmail();

    if (!result.ok && result.authError && refreshToken) {
      const newToken = await refreshGmailToken(refreshToken);
      if (newToken) {
        accessToken = newToken;
        await db
          .from("gmail_connections")
          .update({ access_token: newToken })
          .eq("user_id", user.id);
        result = await sendViaGmail();
      }
    }

    if (!result.ok) {
      console.error(JSON.stringify({ step: "reply_send_error", reply_id: replyId, error: result.error }));
      return NextResponse.json({ error: result.error ?? "Gmail send failed" }, { status: 502 });
    }

    // Mark as sent, save the final draft used
    await db
      .from("replies")
      .update({ status: "sent", ai_draft: draftToSend })
      .eq("id", replyId)
      .eq("user_id", user.id);

    console.log(JSON.stringify({ step: "reply_sent", reply_id: replyId, to: reply.lead_email }));
    return NextResponse.json({ ok: true, action: "sent" });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(JSON.stringify({ step: "reply_send_fatal", error: msg }));
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
