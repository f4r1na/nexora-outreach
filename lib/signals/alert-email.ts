import { Resend } from "resend";
import type { FeedItem } from "./rss";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM    = process.env.RESEND_FROM_EMAIL ?? "alerts@nexoraoutreach.com";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://nexoraoutreach.com";

export interface AlertPayload {
  userEmail: string;
  companyName: string;
  signalType: "funding" | "hiring";
  item: FeedItem;
}

function draftColdEmail(companyName: string, signalType: "funding" | "hiring"): string {
  if (signalType === "funding") {
    return `Hi {first_name},\n\nCongratulations on ${companyName}'s recent funding — exciting growth ahead. I work with companies at exactly this stage to help them scale outbound efficiently without adding to headcount.\n\nWould you be open to a quick 15-minute call this week?`;
  }
  return `Hi {first_name},\n\nI noticed ${companyName} is actively growing the team — a great signal of momentum. I help scaling companies book more qualified meetings faster.\n\nWould you have 15 minutes this week to explore if we can help?`;
}

function buildDeeplink(companyName: string, signalType: string, headline: string, url: string): string {
  const payload = Buffer.from(
    JSON.stringify({ company: companyName, signal_type: signalType, headline, url })
  ).toString("base64url");
  const q1 = encodeURIComponent(`Companies like ${companyName}`);
  return `${APP_URL}/dashboard/campaigns/new?signal=${payload}&q1=${q1}`;
}

function buildHtml(payload: AlertPayload, deeplink: string, draft: string): string {
  const action     = payload.signalType === "funding" ? "just raised funding" : "is actively hiring";
  const emoji      = payload.signalType === "funding" ? "&#x1F4B0;" : "&#x1F4E2;";
  const badgeColor = payload.signalType === "funding" ? "#F59E0B" : "#10B981";
  const escaped    = draft
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="font-family:Arial,sans-serif;background:#060606;color:#fff;margin:0;padding:0">
<div style="max-width:600px;margin:0 auto;padding:36px 24px">

  <p style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#FF5200;margin:0 0 12px">
    Nexora &mdash; Signal Alert
  </p>

  <h1 style="font-size:22px;font-weight:700;color:#fff;margin:0 0 6px;line-height:1.3">
    ${emoji} ${payload.companyName} ${action}
  </h1>
  <p style="font-size:13px;color:rgba(255,255,255,0.45);margin:0 0 6px">
    Signal is fresh &mdash; highest reply rates come within 2 hours.
  </p>
  <span style="display:inline-block;padding:3px 10px;border-radius:5px;font-size:11px;font-weight:600;
    background:${badgeColor}22;color:${badgeColor};border:1px solid ${badgeColor}44;margin-bottom:24px">
    ${payload.signalType === "funding" ? "Funding" : "Hiring"}
  </span>

  <div style="background:#0e0e0e;border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:18px 20px;margin-bottom:20px">
    <p style="font-size:10px;letter-spacing:0.08em;text-transform:uppercase;color:#555;margin:0 0 8px">Signal</p>
    <p style="font-size:13.5px;color:#fff;margin:0;line-height:1.5">${payload.item.title}</p>
  </div>

  <div style="background:#0e0e0e;border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:18px 20px;margin-bottom:24px">
    <p style="font-size:10px;letter-spacing:0.08em;text-transform:uppercase;color:#555;margin:0 0 8px">Pre-drafted cold email</p>
    <p style="font-size:13px;color:rgba(255,255,255,0.7);line-height:1.75;white-space:pre-wrap;margin:0">${escaped}</p>
  </div>

  <a href="${deeplink}"
     style="display:block;text-align:center;background:#FF5200;color:#fff;text-decoration:none;
            padding:14px 0;border-radius:9px;font-size:14px;font-weight:700;margin-bottom:28px">
    Open in Nexora &amp; Send Now &rarr;
  </a>

  <p style="font-size:11px;color:#333;line-height:1.8;margin:0">
    Source: <a href="${payload.item.link}" style="color:#555">${payload.item.link}</a><br>
    <a href="${APP_URL}/dashboard/settings" style="color:#555">Manage alert settings</a>
  </p>
</div>
</body>
</html>`;
}

export async function sendSignalAlert(payload: AlertPayload): Promise<void> {
  const draft    = draftColdEmail(payload.companyName, payload.signalType);
  const deeplink = buildDeeplink(payload.companyName, payload.signalType, payload.item.title, payload.item.link);
  const html     = buildHtml(payload, deeplink, draft);
  const action   = payload.signalType === "funding" ? "just raised" : "is hiring";

  await resend.emails.send({
    from: `Nexora Alerts <${FROM}>`,
    to: payload.userEmail,
    subject: `Hot signal: ${payload.companyName} ${action} -- reach out now`,
    html,
  });
}
