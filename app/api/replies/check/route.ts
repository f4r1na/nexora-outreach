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

function extractEmailAddress(header: string): string {
  // "Name <email@example.com>" → "email@example.com"
  const match = header.match(/<([^>]+)>/);
  return match ? match[1].toLowerCase() : header.toLowerCase().trim();
}

function extractTextBody(payload: Record<string, unknown>): string {
  // Try direct body first
  const body = payload.body as { data?: string } | undefined;
  if (body?.data) {
    return Buffer.from(body.data, "base64url").toString("utf-8");
  }
  // Try parts
  const parts = payload.parts as Array<Record<string, unknown>> | undefined;
  if (parts) {
    for (const part of parts) {
      const mimeType = part.mimeType as string;
      if (mimeType === "text/plain") {
        const partBody = part.body as { data?: string } | undefined;
        if (partBody?.data) {
          return Buffer.from(partBody.data, "base64url").toString("utf-8");
        }
      }
      // Recurse into multipart
      if (mimeType?.startsWith("multipart/")) {
        const nested = extractTextBody(part);
        if (nested) return nested;
      }
    }
    // Fallback: first part with any body data
    for (const part of parts) {
      const partBody = part.body as { data?: string } | undefined;
      if (partBody?.data) {
        return Buffer.from(partBody.data, "base64url").toString("utf-8");
      }
    }
  }
  return "";
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = getServiceClient();

    // Plan check
    const { data: sub } = await db
      .from("subscriptions")
      .select("plan")
      .eq("user_id", user.id)
      .single();

    const plan = sub?.plan ?? "free";
    if (plan !== "pro" && plan !== "agency") {
      return NextResponse.json({ error: "Pro or Agency plan required" }, { status: 403 });
    }

    // Gmail connection
    const { data: gmailConn } = await db
      .from("gmail_connections")
      .select("access_token, refresh_token, gmail_email")
      .eq("user_id", user.id)
      .single();

    if (!gmailConn?.access_token) {
      return NextResponse.json({ error: "No Gmail account connected" }, { status: 400 });
    }

    let accessToken: string = gmailConn.access_token;
    const refreshToken: string | null = gmailConn.refresh_token ?? null;
    const userId = user.id;

    console.log(JSON.stringify({ step: "replies_check_start", user_id: userId }));

    // Fetch unread inbox messages
    async function gmailFetch(path: string): Promise<Response> {
      const res = await fetch(`https://gmail.googleapis.com/gmail/v1${path}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.status === 401 && refreshToken) {
        const newToken = await refreshGmailToken(refreshToken);
        if (newToken) {
          accessToken = newToken;
          await db
            .from("gmail_connections")
            .update({ access_token: newToken })
            .eq("user_id", userId);
          return fetch(`https://gmail.googleapis.com/gmail/v1${path}`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
        }
      }
      return res;
    }

    const listRes = await gmailFetch(
      "/users/me/messages?q=is:unread+in:inbox&maxResults=50"
    );
    if (!listRes.ok) {
      const text = await listRes.text();
      console.error(JSON.stringify({ step: "replies_list_error", status: listRes.status, body: text }));
      return NextResponse.json({ error: `Gmail API error: ${listRes.status}` }, { status: 502 });
    }

    const listData = await listRes.json() as { messages?: Array<{ id: string; threadId: string }> };
    const messages = listData.messages ?? [];

    console.log(JSON.stringify({ step: "replies_check_unread", count: messages.length }));

    if (messages.length === 0) {
      return NextResponse.json({ found: 0, inserted: 0 });
    }

    // Fetch all leads from user's sent campaigns to match against
    const { data: sentCampaigns } = await db
      .from("campaigns")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "sent");

    if (!sentCampaigns || sentCampaigns.length === 0) {
      return NextResponse.json({ found: 0, inserted: 0, note: "No sent campaigns found" });
    }

    const campaignIds = sentCampaigns.map((c) => c.id);

    const { data: leads } = await db
      .from("leads")
      .select("id, email, first_name, campaign_id")
      .in("campaign_id", campaignIds);

    if (!leads || leads.length === 0) {
      return NextResponse.json({ found: 0, inserted: 0, note: "No leads in sent campaigns" });
    }

    // Build email → lead map
    const leadsByEmail = new Map<string, typeof leads[0]>();
    for (const lead of leads) {
      if (lead.email) leadsByEmail.set(lead.email.toLowerCase(), lead);
    }

    let inserted = 0;
    const errors: string[] = [];

    for (const msg of messages) {
      try {
        const msgRes = await gmailFetch(`/users/me/messages/${msg.id}?format=full`);
        if (!msgRes.ok) continue;

        const msgData = await msgRes.json() as {
          id: string;
          threadId: string;
          snippet: string;
          payload: {
            headers: Array<{ name: string; value: string }>;
            body?: { data?: string };
            parts?: unknown[];
          };
        };

        // Extract headers
        const headers = msgData.payload?.headers ?? [];
        const getHeader = (name: string) =>
          headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? "";

        const fromHeader = getHeader("From");
        const subject = getHeader("Subject");
        const fromEmail = extractEmailAddress(fromHeader);

        // Check if this is from one of our leads
        const lead = leadsByEmail.get(fromEmail);
        if (!lead) continue;

        // Check for duplicate by gmail_message_id
        const { data: existing } = await db
          .from("replies")
          .select("id")
          .eq("gmail_message_id", msg.id)
          .maybeSingle();

        if (existing) continue;

        // Extract body text
        const bodyText =
          extractTextBody(msgData.payload as Record<string, unknown>) ||
          msgData.snippet ||
          "";

        // Insert reply
        const { error: insertError } = await db.from("replies").insert({
          user_id: user.id,
          campaign_id: lead.campaign_id,
          lead_id: lead.id,
          lead_email: fromEmail,
          lead_name: lead.first_name ?? null,
          original_subject: subject || null,
          reply_body: bodyText.trim(),
          status: "pending",
          gmail_message_id: msg.id,
          gmail_thread_id: msg.threadId,
        });

        if (insertError) {
          console.error(JSON.stringify({ step: "replies_insert_error", error: insertError.message, msg_id: msg.id }));
          errors.push(insertError.message);
          continue;
        }

        // Mark as read
        await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}/modify`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ removeLabelIds: ["UNREAD"] }),
        });

        inserted++;
        console.log(JSON.stringify({ step: "replies_inserted", from: fromEmail, msg_id: msg.id }));
      } catch (msgErr: unknown) {
        const e = msgErr instanceof Error ? msgErr.message : String(msgErr);
        errors.push(e);
        console.error(JSON.stringify({ step: "replies_msg_error", error: e, msg_id: msg.id }));
      }
    }

    console.log(JSON.stringify({ step: "replies_check_done", found: messages.length, inserted }));
    return NextResponse.json({ found: messages.length, inserted, errors });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(JSON.stringify({ step: "replies_check_fatal", error: msg }));
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
