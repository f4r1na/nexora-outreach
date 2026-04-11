import { NextRequest } from "next/server";
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

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Build a base64url-encoded RFC 2822 MIME message for the Gmail API.
function buildRawMessage(opts: {
  to: string;
  from: string;
  subject: string;
  body: string;
}): string {
  const htmlBody = opts.body
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .split("\n")
    .join("<br>\n");

  const mime = [
    `To: ${opts.to}`,
    `From: ${opts.from}`,
    `Subject: ${opts.subject}`,
    "MIME-Version: 1.0",
    "Content-Type: text/html; charset=UTF-8",
    "",
    `<html><body><div style="font-family:Arial,sans-serif;line-height:1.7;color:#222;max-width:600px">${htmlBody}</div></body></html>`,
  ].join("\r\n");

  return Buffer.from(mime).toString("base64url");
}

// Send one email via Gmail API. Returns true on success, false on auth error.
async function sendGmail(opts: {
  accessToken: string;
  raw: string;
}): Promise<{ ok: boolean; authError: boolean; error?: string }> {
  const res = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${opts.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw: opts.raw }),
    }
  );

  if (res.ok) return { ok: true, authError: false };

  const body = await res.text();
  const authError = res.status === 401;
  return { ok: false, authError, error: `HTTP ${res.status}: ${body}` };
}

// Refresh a Gmail access token using the refresh token.
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

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();

  // Helper: write a JSON event line to the stream
  function event(
    controller: ReadableStreamDefaultController,
    data: Record<string, unknown>
  ) {
    controller.enqueue(encoder.encode(JSON.stringify(data) + "\n"));
  }

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // ── Auth ────────────────────────────────────────────────────────────
        const supabase = await createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          event(controller, { type: "error", message: "Unauthorized" });
          controller.close();
          return;
        }

        // ── Parse body ───────────────────────────────────────────────────────
        let campaignId: string;
        try {
          const body = await req.json();
          campaignId = body.campaign_id;
        } catch {
          event(controller, { type: "error", message: "Invalid request body" });
          controller.close();
          return;
        }

        if (!campaignId) {
          event(controller, { type: "error", message: "campaign_id is required" });
          controller.close();
          return;
        }

        console.log(JSON.stringify({ step: "send_start", campaign_id: campaignId, user_id: user.id }));

        const db = getServiceClient();

        // ── Plan check ───────────────────────────────────────────────────────
        const { data: sub } = await db
          .from("subscriptions")
          .select("plan, sends_used, sends_limit")
          .eq("user_id", user.id)
          .single();

        const plan = sub?.plan ?? "free";
        if (plan !== "pro" && plan !== "agency") {
          event(controller, { type: "error", message: "Pro or Agency plan required to send emails" });
          controller.close();
          return;
        }

        const sendsUsed: number = sub?.sends_used ?? 0;
        const sendsLimit: number = sub?.sends_limit ?? 0;
        const remaining = sendsLimit - sendsUsed;

        console.log(JSON.stringify({ step: "send_plan_check", plan, sends_used: sendsUsed, sends_limit: sendsLimit, remaining }));

        if (remaining <= 0) {
          event(controller, { type: "error", message: `Send limit reached (${sendsUsed}/${sendsLimit}). Upgrade to send more.` });
          controller.close();
          return;
        }

        // ── Gmail connection ─────────────────────────────────────────────────
        const { data: gmailConn } = await db
          .from("gmail_connections")
          .select("access_token, refresh_token, gmail_email")
          .eq("user_id", user.id)
          .single();

        if (!gmailConn?.access_token) {
          event(controller, { type: "error", message: "No Gmail account connected. Connect Gmail in Settings." });
          controller.close();
          return;
        }

        let accessToken: string = gmailConn.access_token;
        const refreshToken: string | null = gmailConn.refresh_token ?? null;
        const fromEmail: string = gmailConn.gmail_email ?? "me";

        console.log(JSON.stringify({ step: "send_gmail_loaded", from: fromEmail }));

        // ── Fetch leads ──────────────────────────────────────────────────────
        const { data: leads, error: leadsError } = await db
          .from("leads")
          .select("id, email, generated_subject, generated_body")
          .eq("campaign_id", campaignId)
          .order("created_at");

        if (leadsError || !leads || leads.length === 0) {
          event(controller, { type: "error", message: "No leads found for this campaign" });
          controller.close();
          return;
        }

        // Cap to remaining send allowance
        const toSend = leads.slice(0, remaining);
        const total = toSend.length;

        console.log(JSON.stringify({ step: "send_leads_loaded", total, capped_from: leads.length }));
        event(controller, { type: "start", total, from: fromEmail });

        // ── Send loop ────────────────────────────────────────────────────────
        let sentCount = 0;
        const failures: string[] = [];

        for (let i = 0; i < toSend.length; i++) {
          const lead = toSend[i];

          if (!lead.email) {
            failures.push(`Lead #${i + 1}: no email address`);
            event(controller, { type: "skip", index: i + 1, total, reason: "no email" });
            continue;
          }

          const raw = buildRawMessage({
            to: lead.email,
            from: fromEmail,
            subject: lead.generated_subject ?? "(no subject)",
            body: lead.generated_body ?? "",
          });

          let result = await sendGmail({ accessToken, raw });

          // ── Token refresh on 401 ────────────────────────────────────────
          if (!result.ok && result.authError && refreshToken) {
            console.log(JSON.stringify({ step: "send_token_refresh", index: i }));
            const newToken = await refreshGmailToken(refreshToken);

            if (newToken) {
              accessToken = newToken;
              // Persist new token so future requests work
              await db
                .from("gmail_connections")
                .update({ access_token: newToken })
                .eq("user_id", user.id);

              result = await sendGmail({ accessToken, raw });
            }
          }

          if (result.ok) {
            sentCount++;
            // Increment sends_used after each successful send
            await db
              .from("subscriptions")
              .update({ sends_used: sendsUsed + sentCount })
              .eq("user_id", user.id);

            console.log(JSON.stringify({ step: "send_email_sent", index: i + 1, to: lead.email }));
            event(controller, { type: "progress", sent: sentCount, total, to: lead.email });
          } else {
            failures.push(`${lead.email}: ${result.error ?? "unknown error"}`);
            console.error(JSON.stringify({ step: "send_email_failed", index: i + 1, to: lead.email, error: result.error }));
            event(controller, { type: "fail", index: i + 1, total, to: lead.email, error: result.error });
          }

          // 3-second delay between sends (skip after last email)
          if (i < toSend.length - 1) {
            await sleep(3000);
          }
        }

        // ── Update campaign status ───────────────────────────────────────────
        if (sentCount > 0) {
          await db
            .from("campaigns")
            .update({ status: "sent" })
            .eq("id", campaignId)
            .eq("user_id", user.id);
        }

        console.log(JSON.stringify({ step: "send_done", sent: sentCount, failed: failures.length, campaign_id: campaignId }));
        event(controller, { type: "done", sent: sentCount, total, failures });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(JSON.stringify({ step: "send_fatal_error", error: msg }));
        event(controller, { type: "error", message: msg });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
