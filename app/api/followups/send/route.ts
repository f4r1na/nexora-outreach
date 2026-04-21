import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TRACKING_BASE = "https://nexoraoutreach.com";

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildRawMessage(opts: {
  to: string;
  from: string;
  subject: string;
  body: string;
  leadId: string;
}): string {
  let htmlBody = opts.body
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  htmlBody = htmlBody.replace(/(https?:\/\/[^\s<>"]+)/g, (rawUrl) => {
    const url = rawUrl.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
    const payload = Buffer.from(JSON.stringify({ lead_id: opts.leadId, url })).toString("base64url");
    const trackUrl = `${TRACKING_BASE}/api/track/click/${payload}`;
    return `<a href="${trackUrl}" style="color:#FF5200;text-decoration:underline">${rawUrl}</a>`;
  });

  htmlBody = htmlBody.split("\n").join("<br>\n");
  const pixel = `<img src="${TRACKING_BASE}/api/track/open/${opts.leadId}" width="1" height="1" style="display:none" alt="" />`;

  const mime = [
    `To: ${opts.to}`,
    `From: ${opts.from}`,
    `Subject: ${opts.subject}`,
    "MIME-Version: 1.0",
    "Content-Type: text/html; charset=UTF-8",
    "",
    `<html><body><div style="font-family:Arial,sans-serif;line-height:1.7;color:#222;max-width:600px">${htmlBody}${pixel}</div></body></html>`,
  ].join("\r\n");

  return Buffer.from(mime).toString("base64url");
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

async function sendGmail(opts: { accessToken: string; raw: string }): Promise<{ ok: boolean; authError: boolean; error?: string }> {
  const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: { Authorization: `Bearer ${opts.accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ raw: opts.raw }),
  });
  if (res.ok) return { ok: true, authError: false };
  const body = await res.text();
  return { ok: false, authError: res.status === 401, error: `HTTP ${res.status}: ${body}` };
}

export async function POST(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }
  if (req.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getServiceClient();

  try {
    console.log(JSON.stringify({ step: "followup_send_start" }));

    // ── Find all due follow-up emails ────────────────────────────────────────
    const now = new Date().toISOString();

    const { data: dueEmails, error: dueErr } = await db
      .from("follow_up_emails")
      .select(`
        id,
        lead_id,
        campaign_id,
        user_id,
        follow_up_number,
        subject,
        body,
        sequence_id,
        follow_up_sequences!inner(status)
      `)
      .eq("status", "scheduled")
      .lte("scheduled_at", now)
      .limit(50);

    if (dueErr) {
      console.error(JSON.stringify({ step: "followup_send_query_error", error: dueErr.message }));
      return NextResponse.json({ error: dueErr.message }, { status: 500 });
    }

    if (!dueEmails || dueEmails.length === 0) {
      console.log(JSON.stringify({ step: "followup_send_none_due" }));
      return NextResponse.json({ sent: 0, skipped: 0, failed: 0 });
    }

    // Filter out emails belonging to paused/cancelled sequences
    type DueEmail = {
      id: string;
      lead_id: string;
      campaign_id: string;
      user_id: string;
      follow_up_number: number;
      subject: string | null;
      body: string | null;
      sequence_id: string;
      follow_up_sequences: { status: string } | { status: string }[];
    };

    const activeEmails = (dueEmails as DueEmail[]).filter((e) => {
      const seqStatus = Array.isArray(e.follow_up_sequences)
        ? e.follow_up_sequences[0]?.status
        : e.follow_up_sequences?.status;
      return seqStatus === "ready";
    });

    console.log(JSON.stringify({ step: "followup_send_due", total: dueEmails.length, active: activeEmails.length }));

    // ── Group by user_id to load Gmail connections efficiently ───────────────
    const userIds = [...new Set(activeEmails.map((e) => e.user_id))];

    // Load subscriptions and Gmail connections for all relevant users
    const [{ data: subscriptions }, { data: gmailConns }] = await Promise.all([
      db.from("subscriptions").select("user_id, plan, sends_used, sends_limit").in("user_id", userIds),
      db.from("gmail_connections").select("user_id, access_token, refresh_token, gmail_email").in("user_id", userIds),
    ]);

    const subByUser = new Map((subscriptions ?? []).map((s: { user_id: string; plan: string; sends_used: number; sends_limit: number }) => [s.user_id, s]));
    const gmailByUser = new Map((gmailConns ?? []).map((g: { user_id: string; access_token: string; refresh_token: string; gmail_email: string }) => [g.user_id, g]));

    let sent = 0;
    let skipped = 0;
    let failed = 0;

    for (const email of activeEmails) {
      // ── Check if lead has replied ──────────────────────────────────────────
      const { data: replyEvent } = await db
        .from("email_events")
        .select("id")
        .eq("lead_id", email.lead_id)
        .eq("event_type", "replied")
        .maybeSingle();

      if (replyEvent) {
        await db.from("follow_up_emails").update({ status: "skipped" }).eq("id", email.id);
        skipped++;
        console.log(JSON.stringify({ step: "followup_skipped_replied", email_id: email.id, lead_id: email.lead_id }));
        continue;
      }

      // ── Check sends limit ──────────────────────────────────────────────────
      const sub = subByUser.get(email.user_id);
      if (!sub || (sub.plan !== "pro" && sub.plan !== "agency")) {
        await db.from("follow_up_emails").update({ status: "skipped" }).eq("id", email.id);
        skipped++;
        continue;
      }

      if (sub.sends_used >= sub.sends_limit) {
        await db.from("follow_up_emails").update({ status: "failed" }).eq("id", email.id);
        failed++;
        console.log(JSON.stringify({ step: "followup_send_limit_reached", user_id: email.user_id }));
        continue;
      }

      // ── Gmail connection ───────────────────────────────────────────────────
      const gmailConn = gmailByUser.get(email.user_id);
      if (!gmailConn?.access_token) {
        await db.from("follow_up_emails").update({ status: "failed" }).eq("id", email.id);
        failed++;
        continue;
      }

      // ── Fetch lead email address ───────────────────────────────────────────
      const { data: lead } = await db
        .from("leads")
        .select("email")
        .eq("id", email.lead_id)
        .single();

      if (!lead?.email) {
        await db.from("follow_up_emails").update({ status: "skipped" }).eq("id", email.id);
        skipped++;
        continue;
      }

      // ── Build and send ─────────────────────────────────────────────────────
      let accessToken = gmailConn.access_token;
      const raw = buildRawMessage({
        to: lead.email,
        from: gmailConn.gmail_email,
        subject: email.subject ?? `Follow-up #${email.follow_up_number}`,
        body: email.body ?? "",
        leadId: email.lead_id,
      });

      let result = await sendGmail({ accessToken, raw });

      if (!result.ok && result.authError && gmailConn.refresh_token) {
        const newToken = await refreshGmailToken(gmailConn.refresh_token);
        if (newToken) {
          accessToken = newToken;
          await db.from("gmail_connections").update({ access_token: newToken }).eq("user_id", email.user_id);
          gmailByUser.set(email.user_id, { ...gmailConn, access_token: newToken });
          result = await sendGmail({ accessToken, raw });
        }
      }

      if (result.ok) {
        const now2 = new Date().toISOString();
        await db.from("follow_up_emails").update({ status: "sent", sent_at: now2 }).eq("id", email.id);

        // Increment sends_used
        await db.from("subscriptions").update({ sends_used: sub.sends_used + 1 }).eq("user_id", email.user_id);
        subByUser.set(email.user_id, { ...sub, sends_used: sub.sends_used + 1 });

        // Record sent event
        await db.from("email_events").insert({
          lead_id: email.lead_id,
          campaign_id: email.campaign_id,
          user_id: email.user_id,
          event_type: "sent",
          metadata: { follow_up_number: email.follow_up_number },
        });

        sent++;
        console.log(JSON.stringify({ step: "followup_sent", email_id: email.id, follow_up_number: email.follow_up_number, to: lead.email }));
      } else {
        await db.from("follow_up_emails").update({ status: "failed" }).eq("id", email.id);
        failed++;
        console.error(JSON.stringify({ step: "followup_send_failed", email_id: email.id, error: result.error }));
      }

      await sleep(3000);
    }

    console.log(JSON.stringify({ step: "followup_send_done", sent, skipped, failed }));
    return NextResponse.json({ sent, skipped, failed });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(JSON.stringify({ step: "followup_send_fatal", error: msg }));
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
