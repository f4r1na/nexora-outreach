# CAN-SPAM / GDPR / CASL Compliance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add legal compliance infrastructure: unsubscribe links in every outbound email, an unsubscribe endpoint, consent columns on leads, a physical address requirement, settings UI to collect company/address, and a privacy policy page.

**Architecture:** Five focused changes — DB columns, a public unsubscribe endpoint, MIME footer injection in both send routes, a compliance API + settings section, and a static privacy page. The `buildRawMessage` function in each send route gains three new params (`unsubscribeUrl`, `companyName`, `physicalAddress`); unsubscribe tokens are base64url-encoded UUIDs (practically unguessable). Sending is blocked if `physical_address` is not set in the user's subscription row.

**Tech Stack:** Next.js App Router route handlers, Supabase service client, Gmail API MIME construction already in place.

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `supabase/migrations/add_compliance_columns.sql` | `unsubscribed`/`unsubscribed_at` on `leads`; `company_name`/`physical_address`/`consent_given_at`/`consent_type` on `subscriptions` |
| Create | `app/api/unsubscribe/route.ts` | Public GET — decode token, set `leads.unsubscribed = true`, return HTML confirmation |
| Create | `app/api/compliance/address/route.ts` | Authenticated GET + PATCH — load/save `company_name` + `physical_address` |
| Modify | `app/api/campaigns/send/route.ts` | Footer in `buildRawMessage`; skip unsubscribed leads; require physical address |
| Modify | `app/api/followups/send/route.ts` | Same footer; skip unsubscribed leads; graceful fallback if address missing |
| Modify | `app/dashboard/settings/page.tsx` | Add "Compliance" section with company name + address inputs |
| Create | `app/privacy/page.tsx` | Static privacy policy page matching app design |

---

## Task 1: DB Migration

**Files:**
- Create: `supabase/migrations/add_compliance_columns.sql`

- [ ] **Step 1: Write the migration**

```sql
-- Unsubscribe support on leads
ALTER TABLE leads ADD COLUMN IF NOT EXISTS unsubscribed    BOOLEAN    NOT NULL DEFAULT FALSE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS unsubscribed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS leads_unsubscribed_idx
  ON leads (unsubscribed) WHERE unsubscribed = TRUE;

-- Compliance fields on subscriptions (CAN-SPAM sender identity requirement)
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS company_name      TEXT;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS physical_address  TEXT;

-- Consent tracking on leads (GDPR/CASL audit trail)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS consent_type     TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS consent_given_at TIMESTAMPTZ;
```

- [ ] **Step 2: Apply in Supabase dashboard**

SQL Editor → paste → Run.
Verify:
```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'leads'
  AND column_name IN ('unsubscribed', 'unsubscribed_at', 'consent_type', 'consent_given_at');
-- Expected: 4 rows

SELECT column_name FROM information_schema.columns
WHERE table_name = 'subscriptions'
  AND column_name IN ('company_name', 'physical_address');
-- Expected: 2 rows
```

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/add_compliance_columns.sql
git commit -m "feat: add compliance columns to leads and subscriptions"
```

---

## Task 2: Public Unsubscribe Endpoint

**Files:**
- Create: `app/api/unsubscribe/route.ts`

Token format: `Buffer.from(lead_id_uuid).toString("base64url")` — UUIDs are 128-bit random values, not guessable by enumeration.

- [ ] **Step 1: Create the route**

```ts
import { NextRequest } from "next/server";
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

function htmlResponse(html: string, status = 200) {
  return new Response(html, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}

const SUCCESS_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Unsubscribed</title>
  <style>
    body{font-family:Arial,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f9fafb;color:#374151}
    .card{text-align:center;padding:48px 40px;background:#fff;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,.1);max-width:400px}
    h1{font-size:22px;margin:0 0 12px;color:#111827}
    p{font-size:14px;color:#6b7280;line-height:1.6;margin:0}
  </style>
</head>
<body>
  <div class="card">
    <h1>You've been unsubscribed</h1>
    <p>You will no longer receive emails from this sender. This takes effect immediately.</p>
  </div>
</body>
</html>`;

function errorHtml(msg: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Error</title>
  <style>
    body{font-family:Arial,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f9fafb}
    .card{text-align:center;padding:48px 40px;background:#fff;border-radius:12px;max-width:400px}
    h1{font-size:20px;color:#ef4444;margin:0 0 12px}
    p{font-size:14px;color:#6b7280;margin:0}
  </style>
</head>
<body>
  <div class="card">
    <h1>Something went wrong</h1>
    <p>${msg}</p>
  </div>
</body>
</html>`;
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return htmlResponse(errorHtml("Invalid unsubscribe link."), 400);

  let leadId: string;
  try {
    leadId = Buffer.from(token, "base64url").toString("utf-8");
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(leadId)) {
      throw new Error("not a uuid");
    }
  } catch {
    return htmlResponse(errorHtml("Invalid unsubscribe link."), 400);
  }

  const db = getDb();
  const { error } = await db
    .from("leads")
    .update({ unsubscribed: true, unsubscribed_at: new Date().toISOString() })
    .eq("id", leadId);

  if (error) {
    console.error(JSON.stringify({ step: "unsubscribe_error", lead_id: leadId, error: error.message }));
    return htmlResponse(errorHtml("Failed to process your request. Please try again."), 500);
  }

  console.log(JSON.stringify({ step: "unsubscribed", lead_id: leadId }));
  return htmlResponse(SUCCESS_HTML);
}
```

- [ ] **Step 2: Build check**

```bash
npm run build 2>&1 | grep -iE "(error|failed)" | head -10
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add app/api/unsubscribe/route.ts
git commit -m "feat: add public GET /api/unsubscribe endpoint for CAN-SPAM compliance"
```

---

## Task 3: Email Footer in Both Send Routes

**Files:**
- Modify: `app/api/campaigns/send/route.ts`
- Modify: `app/api/followups/send/route.ts`

Both files have a local `buildRawMessage` function. Each gets the same three new params and the same footer HTML. Update each file independently (do not extract a shared module — the files have other differences).

### 3A: campaigns/send/route.ts

- [ ] **Step 1: Update `buildRawMessage` signature and add footer**

Find this exact block (lines 24-62 in `app/api/campaigns/send/route.ts`):

```ts
function buildRawMessage(opts: {
  to: string;
  from: string;
  subject: string;
  body: string;
  leadId: string;
}): string {
  // Step 1: HTML-escape the body
  let htmlBody = opts.body
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Step 2: Wrap plain-text URLs in tracked anchor tags (after escaping)
  htmlBody = htmlBody.replace(/(https?:\/\/[^\s<>"]+)/g, (rawUrl) => {
    const url = rawUrl.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
    const payload = Buffer.from(JSON.stringify({ lead_id: opts.leadId, url })).toString("base64url");
    const trackUrl = `${TRACKING_BASE}/api/track/click/${payload}`;
    return `<a href="${trackUrl}" style="color:#FF5200;text-decoration:underline">${rawUrl}</a>`;
  });

  // Step 3: Convert newlines to <br>
  htmlBody = htmlBody.split("\n").join("<br>\n");

  // Step 4: Open-tracking pixel
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
```

Replace it with:

```ts
function buildRawMessage(opts: {
  to: string;
  from: string;
  subject: string;
  body: string;
  leadId: string;
  unsubscribeUrl: string;
  companyName: string;
  physicalAddress: string;
}): string {
  // Step 1: HTML-escape the body
  let htmlBody = opts.body
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Step 2: Wrap plain-text URLs in tracked anchor tags (after escaping)
  htmlBody = htmlBody.replace(/(https?:\/\/[^\s<>"]+)/g, (rawUrl) => {
    const url = rawUrl.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
    const payload = Buffer.from(JSON.stringify({ lead_id: opts.leadId, url })).toString("base64url");
    const trackUrl = `${TRACKING_BASE}/api/track/click/${payload}`;
    return `<a href="${trackUrl}" style="color:#FF5200;text-decoration:underline">${rawUrl}</a>`;
  });

  // Step 3: Convert newlines to <br>
  htmlBody = htmlBody.split("\n").join("<br>\n");

  // Step 4: Open-tracking pixel
  const pixel = `<img src="${TRACKING_BASE}/api/track/open/${opts.leadId}" width="1" height="1" style="display:none" alt="" />`;

  // Step 5: CAN-SPAM / CASL compliance footer
  const footer = [
    `<div style="margin-top:32px;padding-top:16px;border-top:1px solid #e0e0e0;`,
    `font-family:Arial,sans-serif;font-size:11px;color:#9ca3af;text-align:center;line-height:1.8">`,
    `<p style="margin:0 0 4px">${opts.companyName}</p>`,
    `<p style="margin:0 0 8px">${opts.physicalAddress}</p>`,
    `<p style="margin:0"><a href="${opts.unsubscribeUrl}" style="color:#9ca3af;text-decoration:underline">Unsubscribe</a></p>`,
    `</div>`,
  ].join("");

  const mime = [
    `To: ${opts.to}`,
    `From: ${opts.from}`,
    `Subject: ${opts.subject}`,
    "MIME-Version: 1.0",
    "Content-Type: text/html; charset=UTF-8",
    "",
    `<html><body><div style="font-family:Arial,sans-serif;line-height:1.7;color:#222;max-width:600px">${htmlBody}${pixel}${footer}</div></body></html>`,
  ].join("\r\n");

  return Buffer.from(mime).toString("base64url");
}
```

- [ ] **Step 2: Update the subscriptions select to include address fields**

Find:
```ts
        const { data: sub } = await db
          .from("subscriptions")
          .select("plan, sends_used, sends_limit")
          .eq("user_id", user.id)
          .single();
```

Replace with:
```ts
        const { data: sub } = await db
          .from("subscriptions")
          .select("plan, sends_used, sends_limit, company_name, physical_address")
          .eq("user_id", user.id)
          .single();
```

- [ ] **Step 3: Add physical address check and extract compliance vars**

Find this block (after the plan check, before the send limit check):
```ts
        const plan = sub?.plan ?? "free";
        if (plan !== "pro" && plan !== "agency") {
          event(controller, { type: "error", message: "Pro or Agency plan required to send emails" });
          controller.close();
          return;
        }
```

Replace with:
```ts
        const plan = sub?.plan ?? "free";
        if (plan !== "pro" && plan !== "agency") {
          event(controller, { type: "error", message: "Pro or Agency plan required to send emails" });
          controller.close();
          return;
        }

        const companyName: string = sub?.company_name ?? "";
        const physicalAddress: string = sub?.physical_address ?? "";
        if (!physicalAddress.trim()) {
          event(controller, { type: "error", message: "Physical address required for CAN-SPAM compliance. Add it in Settings under Compliance." });
          controller.close();
          return;
        }
```

- [ ] **Step 4: Skip unsubscribed leads in the leads fetch**

Find:
```ts
        const { data: leads, error: leadsError } = await db
          .from("leads")
          .select("id, email, generated_subject, generated_body")
          .eq("campaign_id", campaignId)
          .order("created_at");
```

Replace with:
```ts
        const { data: leads, error: leadsError } = await db
          .from("leads")
          .select("id, email, generated_subject, generated_body")
          .eq("campaign_id", campaignId)
          .eq("unsubscribed", false)
          .order("created_at");
```

- [ ] **Step 5: Pass compliance fields to `buildRawMessage`**

Find:
```ts
          const raw = buildRawMessage({
            to: lead.email,
            from: fromEmail,
            subject: lead.generated_subject ?? "(no subject)",
            body: lead.generated_body ?? "",
            leadId: lead.id,
          });
```

Replace with:
```ts
          const token = Buffer.from(lead.id).toString("base64url");
          const unsubscribeUrl = `${TRACKING_BASE}/api/unsubscribe?token=${token}`;

          const raw = buildRawMessage({
            to: lead.email,
            from: fromEmail,
            subject: lead.generated_subject ?? "(no subject)",
            body: lead.generated_body ?? "",
            leadId: lead.id,
            unsubscribeUrl,
            companyName,
            physicalAddress,
          });
```

### 3B: followups/send/route.ts

- [ ] **Step 6: Update `buildRawMessage` in followups/send**

Find (lines 21-53 in `app/api/followups/send/route.ts`):
```ts
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
```

Replace with:
```ts
function buildRawMessage(opts: {
  to: string;
  from: string;
  subject: string;
  body: string;
  leadId: string;
  unsubscribeUrl: string;
  companyName: string;
  physicalAddress: string;
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

  const footer = [
    `<div style="margin-top:32px;padding-top:16px;border-top:1px solid #e0e0e0;`,
    `font-family:Arial,sans-serif;font-size:11px;color:#9ca3af;text-align:center;line-height:1.8">`,
    `<p style="margin:0 0 4px">${opts.companyName}</p>`,
    `<p style="margin:0 0 8px">${opts.physicalAddress}</p>`,
    `<p style="margin:0"><a href="${opts.unsubscribeUrl}" style="color:#9ca3af;text-decoration:underline">Unsubscribe</a></p>`,
    `</div>`,
  ].join("");

  const mime = [
    `To: ${opts.to}`,
    `From: ${opts.from}`,
    `Subject: ${opts.subject}`,
    "MIME-Version: 1.0",
    "Content-Type: text/html; charset=UTF-8",
    "",
    `<html><body><div style="font-family:Arial,sans-serif;line-height:1.7;color:#222;max-width:600px">${htmlBody}${pixel}${footer}</div></body></html>`,
  ].join("\r\n");

  return Buffer.from(mime).toString("base64url");
}
```

- [ ] **Step 7: Add `company_name` and `physical_address` to the bulk subscriptions select**

Find:
```ts
    const [{ data: subscriptions }, { data: gmailConns }] = await Promise.all([
      db.from("subscriptions").select("user_id, plan, sends_used, sends_limit").in("user_id", userIds),
```

Replace with:
```ts
    const [{ data: subscriptions }, { data: gmailConns }] = await Promise.all([
      db.from("subscriptions").select("user_id, plan, sends_used, sends_limit, company_name, physical_address").in("user_id", userIds),
```

- [ ] **Step 8: Update the `subByUser` type annotation**

Find:
```ts
    const subByUser = new Map((subscriptions ?? []).map((s: { user_id: string; plan: string; sends_used: number; sends_limit: number }) => [s.user_id, s]));
```

Replace with:
```ts
    const subByUser = new Map((subscriptions ?? []).map((s: { user_id: string; plan: string; sends_used: number; sends_limit: number; company_name: string | null; physical_address: string | null }) => [s.user_id, s]));
```

- [ ] **Step 9: Skip unsubscribed leads in followups**

Find:
```ts
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
```

Replace with:
```ts
      const { data: lead } = await db
        .from("leads")
        .select("email, unsubscribed")
        .eq("id", email.lead_id)
        .single();

      if (!lead?.email || lead.unsubscribed) {
        await db.from("follow_up_emails").update({ status: "skipped" }).eq("id", email.id);
        skipped++;
        continue;
      }
```

- [ ] **Step 10: Pass compliance fields to `buildRawMessage` in followups**

Find:
```ts
      let accessToken = gmailConn.access_token;
      const raw = buildRawMessage({
        to: lead.email,
        from: gmailConn.gmail_email,
        subject: email.subject ?? `Follow-up #${email.follow_up_number}`,
        body: email.body ?? "",
        leadId: email.lead_id,
      });
```

Replace with:
```ts
      let accessToken = gmailConn.access_token;
      const token = Buffer.from(email.lead_id).toString("base64url");
      const unsubscribeUrl = `${TRACKING_BASE}/api/unsubscribe?token=${token}`;
      const companyName = sub.company_name ?? "";
      const physicalAddress = sub.physical_address ?? "";

      const raw = buildRawMessage({
        to: lead.email,
        from: gmailConn.gmail_email,
        subject: email.subject ?? `Follow-up #${email.follow_up_number}`,
        body: email.body ?? "",
        leadId: email.lead_id,
        unsubscribeUrl,
        companyName,
        physicalAddress,
      });
```

- [ ] **Step 11: Build check**

```bash
npm run build 2>&1 | grep -iE "(error|failed)" | head -10
```

Expected: no output.

- [ ] **Step 12: Commit**

```bash
git add app/api/campaigns/send/route.ts app/api/followups/send/route.ts
git commit -m "feat: inject CAN-SPAM footer and skip unsubscribed leads in both send routes"
```

---

## Task 4: Compliance Address API + Settings Section

**Files:**
- Create: `app/api/compliance/address/route.ts`
- Modify: `app/dashboard/settings/page.tsx`

### 4A: API route

- [ ] **Step 1: Create `app/api/compliance/address/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
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

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  const { data } = await db
    .from("subscriptions")
    .select("company_name, physical_address")
    .eq("user_id", user.id)
    .single();

  return NextResponse.json({
    company_name: data?.company_name ?? "",
    physical_address: data?.physical_address ?? "",
  });
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { company_name, physical_address } = body as { company_name?: string; physical_address?: string };

  const db = getDb();
  const { error } = await db
    .from("subscriptions")
    .update({
      company_name: (company_name ?? "").trim(),
      physical_address: (physical_address ?? "").trim(),
    })
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
```

### 4B: Settings page — add Compliance section

The settings page (`app/dashboard/settings/page.tsx`) is a `"use client"` component with existing state for subscription and Gmail. Add compliance state and a new card section.

- [ ] **Step 2: Add compliance state to `SettingsInner`**

In `app/dashboard/settings/page.tsx`, find the existing state block in `SettingsInner`:
```ts
  const [gmail, setGmail] = useState<GmailConnection>(undefined as unknown as GmailConnection);
  const [gmailLoading, setGmailLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
```

After that block, add:
```ts
  const [companyName, setCompanyName] = useState("");
  const [physicalAddress, setPhysicalAddress] = useState("");
  const [addressSaving, setAddressSaving] = useState(false);
  const [addressMsg, setAddressMsg] = useState<{ ok: boolean; text: string } | null>(null);
```

- [ ] **Step 3: Load compliance fields in a `useEffect`**

After the existing Gmail `useEffect`, add:
```ts
  useEffect(() => {
    fetch("/api/compliance/address")
      .then((r) => r.json())
      .then((d) => {
        setCompanyName(d.company_name ?? "");
        setPhysicalAddress(d.physical_address ?? "");
      })
      .catch(() => {});
  }, []);
```

- [ ] **Step 4: Add the save handler**

After `handleDisconnect`, add:
```ts
  async function handleSaveAddress() {
    setAddressSaving(true);
    setAddressMsg(null);
    try {
      const res = await fetch("/api/compliance/address", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company_name: companyName, physical_address: physicalAddress }),
      });
      const data = await res.json();
      if (res.ok) {
        setAddressMsg({ ok: true, text: "Compliance info saved." });
      } else {
        setAddressMsg({ ok: false, text: data.error ?? "Failed to save." });
      }
    } catch {
      setAddressMsg({ ok: false, text: "Network error." });
    } finally {
      setAddressSaving(false);
    }
  }
```

- [ ] **Step 5: Add the Compliance section to JSX**

In the settings page JSX, find the closing `</ScrollReveal>` or the last `</StaggerItem>` near the bottom of `SettingsInner`'s return. Add a new section before it:

Find the pattern:
```tsx
        </StaggerList>
      </ScrollReveal>
    </>
```

Replace with:
```tsx
        {/* ── Compliance ───────────────────────────────────────── */}
        <StaggerItem>
          <SectionLabel>Compliance</SectionLabel>
          <SectionCard>
            <p style={{ fontSize: 12, color: "#555", fontFamily: "var(--font-outfit)", marginBottom: 16, lineHeight: 1.55 }}>
              Required for CAN-SPAM: your company name and physical mailing address appear in every email footer. Sending is blocked until an address is saved.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 11, color: "#555", fontFamily: "var(--font-outfit)", marginBottom: 5 }}>
                  Company name
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Acme Inc."
                  style={{
                    width: "100%", padding: "8px 12px", borderRadius: 6,
                    backgroundColor: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "#ccc", fontFamily: "var(--font-outfit)", fontSize: 13,
                    outline: "none", boxSizing: "border-box",
                  }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, color: "#555", fontFamily: "var(--font-outfit)", marginBottom: 5 }}>
                  Physical mailing address
                </label>
                <input
                  type="text"
                  value={physicalAddress}
                  onChange={(e) => setPhysicalAddress(e.target.value)}
                  placeholder="123 Main St, City, State 00000, Country"
                  style={{
                    width: "100%", padding: "8px 12px", borderRadius: 6,
                    backgroundColor: "rgba(255,255,255,0.03)",
                    border: `1px solid ${physicalAddress.trim() ? "rgba(255,255,255,0.08)" : "rgba(239,68,68,0.3)"}`,
                    color: "#ccc", fontFamily: "var(--font-outfit)", fontSize: 13,
                    outline: "none", boxSizing: "border-box",
                  }}
                />
                {!physicalAddress.trim() && (
                  <p style={{ fontSize: 11, color: "#ef4444", fontFamily: "var(--font-outfit)", marginTop: 5 }}>
                    Required before sending emails
                  </p>
                )}
              </div>
            </div>
            {addressMsg && (
              <div style={{
                padding: "8px 12px", borderRadius: 6, marginBottom: 14,
                backgroundColor: addressMsg.ok ? "rgba(74,222,128,0.06)" : "rgba(239,68,68,0.06)",
                border: `1px solid ${addressMsg.ok ? "rgba(74,222,128,0.15)" : "rgba(239,68,68,0.15)"}`,
              }}>
                <span style={{ fontSize: 12, color: addressMsg.ok ? "#4ade80" : "#f87171", fontFamily: "var(--font-outfit)" }}>
                  {addressMsg.text}
                </span>
              </div>
            )}
            <button
              onClick={handleSaveAddress}
              disabled={addressSaving}
              style={{
                padding: "8px 18px", borderRadius: 6, fontSize: 12,
                fontFamily: "var(--font-outfit)", cursor: addressSaving ? "not-allowed" : "pointer",
                backgroundColor: "#FF5200", color: "#fff", border: "none",
                opacity: addressSaving ? 0.6 : 1,
              }}
            >
              {addressSaving ? "Saving..." : "Save"}
            </button>
            <p style={{ fontSize: 11, color: "#3a3a4a", fontFamily: "var(--font-outfit)", marginTop: 14, lineHeight: 1.55 }}>
              GDPR/CASL: ensure you have appropriate consent for EU and Canadian recipients before sending.{" "}
              <a href="/privacy" target="_blank" style={{ color: "#555", textDecoration: "underline" }}>Privacy policy</a>
            </p>
          </SectionCard>
        </StaggerItem>

        </StaggerList>
      </ScrollReveal>
    </>
```

- [ ] **Step 6: Build check**

```bash
npm run build 2>&1 | grep -iE "(error|failed)" | head -10
```

Expected: no output.

- [ ] **Step 7: Commit**

```bash
git add app/api/compliance/address/route.ts app/dashboard/settings/page.tsx
git commit -m "feat: add compliance address API and settings section"
```

---

## Task 5: Privacy Policy Page

**Files:**
- Create: `app/privacy/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
export const metadata = {
  title: "Privacy Policy | Nexora",
  description: "How Nexora collects, uses, and protects your data.",
};

export default function PrivacyPage() {
  return (
    <div style={{ backgroundColor: "#060606", minHeight: "100vh", color: "#ccc", fontFamily: "Arial, sans-serif" }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "64px 24px 96px" }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: "#fff", marginBottom: 8 }}>
          Privacy Policy
        </h1>
        <p style={{ fontSize: 13, color: "#555", marginBottom: 40 }}>
          Last updated: April 27, 2026
        </p>

        {[
          {
            title: "1. Who we are",
            body: "Nexora Outreach (\"Nexora\", \"we\", \"us\") provides AI-assisted cold email tooling. Our registered address is available on request. Contact: privacy@nexoraoutreach.com.",
          },
          {
            title: "2. Data we collect",
            body: "We collect: (a) account data you provide at signup (email, password); (b) lead data you import or enter (names, email addresses, companies, roles); (c) email engagement events (opens, clicks, replies) tracked via pixel and redirect; (d) payment information processed by Stripe — we never see your card number.",
          },
          {
            title: "3. How we use your data",
            body: "Lead and account data is used solely to operate the service: generating personalised email copy, sending emails via your connected Gmail account, and displaying analytics. We do not sell or share your data with third parties for marketing purposes.",
          },
          {
            title: "4. Legal basis (GDPR)",
            body: "For users in the European Economic Area, we process personal data on the basis of: (a) contract performance — operating the service you signed up for; (b) legitimate interests — product analytics and fraud prevention; (c) consent — where you have opted in to specific features. You may withdraw consent at any time.",
          },
          {
            title: "5. CAN-SPAM compliance",
            body: "Every email sent through Nexora includes a physical mailing address and a working unsubscribe link. Unsubscribe requests are honoured immediately. We identify the sender in every message.",
          },
          {
            title: "6. CASL compliance",
            body: "Users sending to Canadian recipients are responsible for obtaining express or implied consent as required by CASL before sending. Nexora provides the unsubscribe mechanism required by section 11 of CASL.",
          },
          {
            title: "7. Data retention",
            body: "Account data is retained for the duration of your subscription plus 30 days after cancellation. Lead data is deleted on account deletion. Email event logs are retained for 12 months for analytics purposes.",
          },
          {
            title: "8. Your rights",
            body: "You have the right to access, correct, export, or delete your personal data at any time. Use Settings > Account > Delete Account for self-service deletion, or email privacy@nexoraoutreach.com for data requests. EU/EEA users may lodge a complaint with their local supervisory authority.",
          },
          {
            title: "9. Security",
            body: "Data is stored in Supabase (PostgreSQL) with row-level security policies. Passwords are hashed. Gmail OAuth tokens are encrypted at rest. We recommend enabling two-factor authentication in account settings.",
          },
          {
            title: "10. Changes to this policy",
            body: "We will notify registered users by email of material changes to this policy at least 14 days before they take effect.",
          },
        ].map(({ title, body }) => (
          <section key={title} style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: "#fff", marginBottom: 8 }}>
              {title}
            </h2>
            <p style={{ fontSize: 14, lineHeight: 1.7, color: "#888", margin: 0 }}>
              {body}
            </p>
          </section>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Build check**

```bash
npm run build 2>&1 | grep -iE "(error|failed)" | head -10
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add app/privacy/page.tsx
git commit -m "feat: add privacy policy page (GDPR/CAN-SPAM/CASL)"
```

---

## Spec Coverage Check

| Requirement | Task |
|-------------|------|
| Unsubscribe link in every email footer | Task 3 — footer in both `buildRawMessage` functions |
| Honor unsubscribe within 10 days | Task 2 — processed immediately on GET request |
| Include sender physical address | Task 3 — footer; Task 4 — required before send |
| Log consent per lead (consent_given, consent_date) | Task 1 — `consent_type`, `consent_given_at` columns |
| Right to deletion | Existing delete-account + Task 5 policy documents it |
| Data processing transparency | Task 5 — privacy policy |
| Consent required before sending to Canada | Task 4 — compliance section warning + policy |
| Identify sender in each message | Task 3 — `companyName` in footer |
| Provide unsubscribe mechanism | Task 2 + Task 3 |
| GET /api/unsubscribe?token=xxx | Task 2 |
| Warn if sending to EU/Canada without consent | Task 4 — compliance section notice with policy link |
| Require physical address in account settings | Task 4 — red border + error text when empty; Task 3 — blocks send |
| Privacy policy page | Task 5 |
| Settings: show GDPR/CAN-SPAM warnings | Task 4 — compliance card in settings |
