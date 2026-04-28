# Signal Velocity Alerts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Alert users by email within 2 hours when a funding or hiring signal matching their ICP appears in TechCrunch or YC RSS feeds, with a pre-drafted cold email and a deeplink that auto-fills the campaign wizard.

**Architecture:** A Vercel Cron job (`/api/cron/signal-alerts`, every 30 min) fetches two RSS feeds, parses signal type + company name, matches against each user's ICP keywords/location (stored on `subscriptions`), deduplicates via a `signal_alerts` table, and sends alert emails through Resend. Clicking the alert email opens the campaign wizard at `/dashboard/campaigns/new?signal=<base64url>&q1=<company>` which auto-fires Q1 and shows a signal banner.

**Tech Stack:** Resend SDK (`resend`), Vercel Cron, Next.js 16 App Router route handler, Supabase service role client, plain RSS XML string parsing (no external XML library)

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `supabase/migrations/add_signal_alerts.sql` | Create | `icp_keywords` + `icp_location` on subscriptions; `signal_alerts` dedup table |
| `app/api/profile/icp/route.ts` | Create | GET/PATCH — read/write ICP fields from subscriptions |
| `app/dashboard/settings/page.tsx` | Modify | Add "Signal Velocity Alerts" settings section |
| `lib/signals/rss.ts` | Create | RSS fetch + XML parse, signal type detection, ICP matching |
| `lib/signals/alert-email.ts` | Create | Resend email builder + sender |
| `app/api/cron/signal-alerts/route.ts` | Create | Cron handler: poll feeds, match users, send alerts |
| `vercel.json` | Modify | Register `*/30 * * * *` cron for the alert route |
| `app/dashboard/campaigns/new/page.tsx` | Modify | Auto-select wizard path + signal banner in `WizardContent` |

---

## Task 1: Install Resend + DB Migration

**Files:**
- Create: `supabase/migrations/add_signal_alerts.sql`

- [ ] **Step 1: Install the Resend package**

```bash
npm install resend
```

Expected output: `added 1 package` (or similar). Verify: `node -e "require('resend'); console.log('ok')"` prints `ok`.

- [ ] **Step 2: Write the migration file**

```sql
-- ICP profile fields for signal velocity matching
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS icp_keywords TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS icp_location TEXT NOT NULL DEFAULT '';

-- Dedup table: one row per (user, source URL) to prevent duplicate alerts
CREATE TABLE IF NOT EXISTS public.signal_alerts (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_url    TEXT        NOT NULL,
  source_type   TEXT        NOT NULL,
  company_name  TEXT        NOT NULL,
  signal_type   TEXT        NOT NULL,
  headline      TEXT        NOT NULL,
  published_at  TIMESTAMPTZ,
  alert_sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, source_url)
);

CREATE INDEX IF NOT EXISTS sal_user_id_idx  ON signal_alerts (user_id);
CREATE INDEX IF NOT EXISTS sal_sent_at_idx  ON signal_alerts (alert_sent_at DESC);
```

- [ ] **Step 3: Apply in Supabase dashboard**

Open Supabase → SQL Editor → paste and run.

Verify:
```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'subscriptions'
AND column_name IN ('icp_keywords', 'icp_location');
-- Expected: 2 rows

SELECT COUNT(*) FROM signal_alerts;
-- Expected: 0 (table exists, empty)
```

- [ ] **Step 4: Add environment variables**

Add to `.env.local`:
```
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=alerts@nexoraoutreach.com
```

`RESEND_FROM_EMAIL` must be a verified domain in your Resend dashboard. Add these to Vercel environment variables as well (Settings → Environment Variables).

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/add_signal_alerts.sql package.json package-lock.json
git commit -m "feat: install resend, add signal_alerts table and ICP columns on subscriptions"
```

---

## Task 2: ICP Profile API

**Files:**
- Create: `app/api/profile/icp/route.ts`

This route reads and writes the `icp_keywords` and `icp_location` fields on the user's subscriptions row.

- [ ] **Step 1: Create the directory and route file**

```bash
mkdir -p app/api/profile/icp
```

```typescript
// app/api/profile/icp/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createAdminClient();
  const { data } = await db
    .from("subscriptions")
    .select("icp_keywords, icp_location")
    .eq("user_id", user.id)
    .single();

  return NextResponse.json({
    icp_keywords: data?.icp_keywords ?? "",
    icp_location: data?.icp_location ?? "",
  });
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { icp_keywords, icp_location } = body as {
    icp_keywords?: string;
    icp_location?: string;
  };

  const db = createAdminClient();
  const { error } = await db
    .from("subscriptions")
    .update({
      icp_keywords: (icp_keywords ?? "").trim(),
      icp_location: (icp_location ?? "").trim(),
    })
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add app/api/profile/icp/route.ts
git commit -m "feat: add GET/PATCH /api/profile/icp for ICP keyword and location settings"
```

---

## Task 3: ICP Settings UI

**Files:**
- Modify: `app/dashboard/settings/page.tsx`

Add a "Signal Velocity Alerts" section with keywords + location inputs and a save button. Follow the exact pattern used for the existing Compliance section (state + useEffect + handleSave function + SectionCard).

- [ ] **Step 1: Add state variables**

Read `app/dashboard/settings/page.tsx`. In `SettingsInner`, find where `founderType` / `founderTypeSaving` / `founderTypeMsg` are declared (around line 76-78). Add after them:

```typescript
  const [icpKeywords, setIcpKeywords] = useState("");
  const [icpLocation, setIcpLocation] = useState("");
  const [icpSaving, setIcpSaving] = useState(false);
  const [icpMsg, setIcpMsg] = useState<{ ok: boolean; text: string } | null>(null);
```

- [ ] **Step 2: Add fetch useEffect**

After the existing useEffect that fetches `/api/profile/founder-type`, add:

```typescript
  useEffect(() => {
    fetch("/api/profile/icp")
      .then((r) => r.json())
      .then((d) => {
        setIcpKeywords(d.icp_keywords ?? "");
        setIcpLocation(d.icp_location ?? "");
      })
      .catch(() => {});
  }, []);
```

- [ ] **Step 3: Add save handler**

After the `handleSaveFounderType` function, add:

```typescript
  async function handleSaveIcp() {
    setIcpSaving(true);
    setIcpMsg(null);
    try {
      const res = await fetch("/api/profile/icp", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ icp_keywords: icpKeywords, icp_location: icpLocation }),
      });
      const data = await res.json();
      if (res.ok) {
        setIcpMsg({ ok: true, text: "Alert settings saved." });
      } else {
        setIcpMsg({ ok: false, text: data.error ?? "Failed to save." });
      }
    } catch {
      setIcpMsg({ ok: false, text: "Network error." });
    } finally {
      setIcpSaving(false);
    }
  }
```

- [ ] **Step 4: Add the settings section JSX**

Find the Signal Scoring Profile `<ScrollReveal>` section in the JSX. After it (and before the Compliance section), insert a new `<ScrollReveal>` with this content:

```tsx
<ScrollReveal delay={0.20}>
  <SectionCard>
    <SectionLabel icon={<Zap size={13} strokeWidth={1.75} aria-hidden="true" />}>
      Signal Velocity Alerts
    </SectionLabel>
    <p style={{ fontSize: 12.5, color: "rgba(255,255,255,0.4)", fontFamily: "var(--font-outfit)", marginBottom: 16, lineHeight: 1.6 }}>
      Get emailed within 2 hours when a company matching your ICP raises funding or posts new jobs.
      Leave keywords empty to receive all signals.
    </p>
    <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 14 }}>
      <div>
        <label style={{ fontSize: 11, color: "#555", fontFamily: "var(--font-outfit)", display: "block", marginBottom: 5 }}>
          ICP Keywords (comma-separated)
        </label>
        <input
          type="text"
          value={icpKeywords}
          onChange={(e) => setIcpKeywords(e.target.value)}
          placeholder="e.g. SaaS, fintech, B2B, e-commerce"
          style={{
            width: "100%", padding: "8px 12px", borderRadius: 7,
            backgroundColor: "#060606", border: "1px solid rgba(255,255,255,0.1)",
            color: "#fff", fontSize: 13, fontFamily: "var(--font-outfit)",
            outline: "none", boxSizing: "border-box",
          }}
        />
      </div>
      <div>
        <label style={{ fontSize: 11, color: "#555", fontFamily: "var(--font-outfit)", display: "block", marginBottom: 5 }}>
          Target Location
        </label>
        <input
          type="text"
          value={icpLocation}
          onChange={(e) => setIcpLocation(e.target.value)}
          placeholder="e.g. San Francisco, New York, London"
          style={{
            width: "100%", padding: "8px 12px", borderRadius: 7,
            backgroundColor: "#060606", border: "1px solid rgba(255,255,255,0.1)",
            color: "#fff", fontSize: 13, fontFamily: "var(--font-outfit)",
            outline: "none", boxSizing: "border-box",
          }}
        />
      </div>
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <button
        onClick={handleSaveIcp}
        disabled={icpSaving}
        style={{
          padding: "7px 16px", borderRadius: 7, fontSize: 12.5, fontWeight: 600,
          fontFamily: "var(--font-outfit)", cursor: icpSaving ? "default" : "pointer",
          backgroundColor: icpSaving ? "rgba(255,82,0,0.4)" : "#FF5200",
          color: "#fff", border: "none",
        }}
      >
        {icpSaving ? "Saving…" : "Save Alert Settings"}
      </button>
      {icpMsg && (
        <span style={{ fontSize: 12, fontFamily: "var(--font-outfit)", color: icpMsg.ok ? "#4ade80" : "#ef4444" }}>
          {icpMsg.text}
        </span>
      )}
    </div>
  </SectionCard>
</ScrollReveal>
```

- [ ] **Step 5: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 6: Commit**

```bash
git add app/dashboard/settings/page.tsx
git commit -m "feat: add Signal Velocity Alerts ICP settings section"
```

---

## Task 4: RSS Parser + Signal Detection

**Files:**
- Create: `lib/signals/rss.ts`

Pure utility module — no side effects, no DB access. All functions are exported for use in the cron route.

- [ ] **Step 1: Create the file**

```bash
mkdir -p lib/signals
```

```typescript
// lib/signals/rss.ts

export interface FeedItem {
  title: string;
  link: string;
  pubDate: string;
  description: string;
  sourceType: "techcrunch" | "yc";
}

export const FEEDS = [
  { url: "https://techcrunch.com/tag/funding/feed/", type: "techcrunch" as const },
  { url: "https://www.ycombinator.com/blog/rss",     type: "yc" as const },
];

const FUNDING_KEYWORDS = [
  "raises", "raised", "funding", "series a", "series b", "series c", "series d",
  "seed round", "million", "billion", "backed", "investment", "venture", "secures",
];
const HIRING_KEYWORDS = [
  "hiring", "expands team", "new hires", "growing team", "headcount", "open roles",
];

function extractTag(xml: string, tag: string): string {
  const re = new RegExp(
    `<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`,
    "i"
  );
  const m = xml.match(re);
  return (m?.[1] ?? m?.[2] ?? "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .trim();
}

function parseFeed(xml: string, sourceType: FeedItem["sourceType"]): FeedItem[] {
  const blocks = xml.match(/<item>([\s\S]*?)<\/item>/g) ?? [];
  return blocks
    .map((block) => ({
      title:       extractTag(block, "title"),
      link:        extractTag(block, "link"),
      pubDate:     extractTag(block, "pubDate"),
      description: extractTag(block, "description"),
      sourceType,
    }))
    .filter((item) => item.title && item.link);
}

export async function fetchFeed(feed: typeof FEEDS[number]): Promise<FeedItem[]> {
  try {
    const res = await fetch(feed.url, {
      headers: { "User-Agent": "NexoraOutreach/1.0 (signal-monitor; +https://nexoraoutreach.com)" },
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) {
      console.error(`[rss] fetch failed ${feed.url}: ${res.status}`);
      return [];
    }
    return parseFeed(await res.text(), feed.type);
  } catch (err) {
    console.error(`[rss] fetch error ${feed.url}:`, err);
    return [];
  }
}

export function detectSignalType(title: string): "funding" | "hiring" | null {
  const lower = title.toLowerCase();
  if (FUNDING_KEYWORDS.some((kw) => lower.includes(kw))) return "funding";
  if (HIRING_KEYWORDS.some((kw) => lower.includes(kw))) return "hiring";
  return null;
}

export function extractCompanyName(title: string): string {
  const patterns = [
    /^(.+?)\s+raises?\b/i,
    /^(.+?)\s+raised?\b/i,
    /^(.+?)\s+secures?\b/i,
    /^(.+?)\s+closes?\b/i,
    /^(.+?)\s+lands?\b/i,
    /^(.+?)\s+gets?\s+\$/i,
    /^(.+?)\s+is\s+hiring/i,
    /^(.+?)\s+expands?\s+team/i,
  ];
  for (const re of patterns) {
    const m = title.match(re);
    if (m?.[1]) return m[1].replace(/^['"]+|['"]+$/g, "").trim();
  }
  // fallback: first three words
  return title.split(/\s+/).slice(0, 3).join(" ");
}

export function matchesICP(
  item: FeedItem,
  icpKeywords: string,
  icpLocation: string
): boolean {
  const haystack = `${item.title} ${item.description}`.toLowerCase();

  const keywords = icpKeywords
    .split(",")
    .map((k) => k.trim().toLowerCase())
    .filter(Boolean);

  const location = icpLocation.trim().toLowerCase();

  const keywordMatch = keywords.length === 0 || keywords.some((kw) => haystack.includes(kw));
  const locationMatch = !location || haystack.includes(location);

  return keywordMatch && locationMatch;
}

export function isRecent(pubDate: string, hoursBack = 25): boolean {
  if (!pubDate) return true;
  const pub = new Date(pubDate);
  if (isNaN(pub.getTime())) return true;
  return Date.now() - pub.getTime() < hoursBack * 60 * 60 * 1000;
}
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add lib/signals/rss.ts
git commit -m "feat: add RSS feed parser with signal detection and ICP matching"
```

---

## Task 5: Alert Email Builder + Resend Sender

**Files:**
- Create: `lib/signals/alert-email.ts`

Builds the HTML alert email and sends it via Resend. The email includes a pre-drafted cold email template and a deeplink to the campaign wizard.

- [ ] **Step 1: Create the file**

```typescript
// lib/signals/alert-email.ts
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
  const action  = payload.signalType === "funding" ? "just raised funding" : "is actively hiring";
  const emoji   = payload.signalType === "funding" ? "💰" : "📢";
  const badgeColor = payload.signalType === "funding" ? "#F59E0B" : "#10B981";
  const escaped = draft
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
    subject: `🔥 Hot signal: ${payload.companyName} ${action} — reach out now`,
    html,
  });
}
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add lib/signals/alert-email.ts
git commit -m "feat: add Resend alert email builder for signal velocity alerts"
```

---

## Task 6: Cron Route

**Files:**
- Create: `app/api/cron/signal-alerts/route.ts`

The main cron handler. Runs every 30 minutes via Vercel Cron. Fetches both feeds in parallel, matches signals to users, deduplicates, and sends Resend alerts.

- [ ] **Step 1: Create the directory and route file**

```bash
mkdir -p app/api/cron/signal-alerts
```

```typescript
// app/api/cron/signal-alerts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  FEEDS,
  fetchFeed,
  detectSignalType,
  extractCompanyName,
  matchesICP,
  isRecent,
} from "@/lib/signals/rss";
import { sendSignalAlert } from "@/lib/signals/alert-email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || req.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = createAdminClient();

  // 1. Get users who have ICP keywords configured
  const { data: subs } = await db
    .from("subscriptions")
    .select("user_id, icp_keywords, icp_location")
    .not("icp_keywords", "is", null)
    .neq("icp_keywords", "");

  if (!subs || subs.length === 0) {
    return NextResponse.json({ ok: true, message: "No users with ICP configured", sent: 0 });
  }

  // 2. Resolve user emails from auth.users
  const { data: { users } } = await db.auth.admin.listUsers({ perPage: 1000 });
  const emailMap = new Map(users.map((u) => [u.id, u.email ?? ""]));

  const targets = subs
    .map((s) => ({ ...s, email: emailMap.get(s.user_id) ?? "" }))
    .filter((t) => t.email);

  // 3. Fetch all RSS feeds in parallel, keep only recent items
  const feedResults = await Promise.all(FEEDS.map(fetchFeed));
  const recentItems = feedResults.flat().filter((item) => isRecent(item.pubDate));

  console.log(`[signal-alerts] fetched ${recentItems.length} recent items for ${targets.length} users`);

  // 4. For each signal item, find matching users and send alerts
  let sent  = 0;
  const errors: string[] = [];

  for (const item of recentItems) {
    const signalType = detectSignalType(item.title);
    if (!signalType) continue;

    const companyName = extractCompanyName(item.title);

    for (const target of targets) {
      if (!matchesICP(item, target.icp_keywords, target.icp_location)) continue;

      // Dedup: skip if we've already sent this user an alert for this URL
      const { data: existing } = await db
        .from("signal_alerts")
        .select("id")
        .eq("user_id", target.user_id)
        .eq("source_url", item.link)
        .maybeSingle();

      if (existing) continue;

      try {
        await sendSignalAlert({
          userEmail: target.email,
          companyName,
          signalType,
          item,
        });

        await db.from("signal_alerts").insert({
          user_id:      target.user_id,
          source_url:   item.link,
          source_type:  item.sourceType,
          company_name: companyName,
          signal_type:  signalType,
          headline:     item.title,
          published_at: item.pubDate ? new Date(item.pubDate).toISOString() : null,
        });

        sent++;
        console.log(`[signal-alerts] sent: ${target.email} ← ${companyName} (${signalType})`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`${target.email}/${companyName}: ${msg}`);
        console.error(`[signal-alerts] send error:`, msg);
      }
    }
  }

  return NextResponse.json({
    ok: true,
    sent,
    errors: errors.length,
    items_checked: recentItems.length,
    users_checked: targets.length,
  });
}

// Allow manual POST trigger (same auth check applies)
export const POST = GET;
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add app/api/cron/signal-alerts/route.ts
git commit -m "feat: add /api/cron/signal-alerts cron handler — poll RSS feeds and send Resend alerts"
```

---

## Task 7: Register Cron in vercel.json

**Files:**
- Modify: `vercel.json`

- [ ] **Step 1: Add the 30-minute cron entry**

Read `vercel.json` (currently has the signals cron at `* * * * *`). Replace with:

```json
{
  "crons": [
    {
      "path": "/api/signals/cron",
      "schedule": "* * * * *"
    },
    {
      "path": "/api/cron/signal-alerts",
      "schedule": "*/30 * * * *"
    }
  ]
}
```

- [ ] **Step 2: Commit**

```bash
git add vercel.json
git commit -m "feat: register signal-alerts cron at 30-minute interval in vercel.json"
```

---

## Task 8: Signal Deeplink in Campaign Wizard

**Files:**
- Modify: `app/dashboard/campaigns/new/page.tsx`

When a user clicks the alert email link, the URL is:
`/dashboard/campaigns/new?signal=<base64url>&q1=Companies+like+<Company>`

The wizard already handles `?q1=` (auto-fires Q1 answer at step 1). We need to:
1. Auto-select wizard path when `?signal=` is present (so the user skips the choice screen)
2. Show a "Signal Banner" above the chat in `WizardContent`

- [ ] **Step 1: Auto-select wizard path in `NewCampaignPage`**

Read `app/dashboard/campaigns/new/page.tsx`. Find the `NewCampaignPage` component at the bottom (around line 1370). Change:

Old:
```typescript
export default function NewCampaignPage() {
  const [path, setPath] = useState<Path>(null);
```

New:
```typescript
export default function NewCampaignPage() {
  const [path, setPath] = useState<Path>(null);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("signal")) {
      setPath("wizard");
    }
  }, []);
```

Note: `useEffect` is already imported in this file. `window.location.search` is safe to use here because the component is already marked `"use client"` and `useEffect` only runs client-side.

- [ ] **Step 2: Add `SignalBanner` component**

Add this component definition in the file, just before the `// ── Page export` comment:

```typescript
// ── Signal Banner ─────────────────────────────────────────────────────────────

function SignalBanner({ headline, company, signalType }: {
  headline: string;
  company: string;
  signalType: string;
}) {
  const emoji = signalType === "funding" ? "💰" : "📢";
  const label = signalType === "funding" ? "Funding signal" : "Hiring signal";
  return (
    <div style={{
      margin: "0 0 16px",
      padding: "10px 14px",
      borderRadius: 9,
      backgroundColor: "rgba(255,82,0,0.06)",
      border: "1px solid rgba(255,82,0,0.2)",
      display: "flex",
      alignItems: "flex-start",
      gap: 10,
    }}>
      <span style={{ fontSize: 16, flexShrink: 0 }}>{emoji}</span>
      <div>
        <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#FF5200", fontFamily: "var(--font-outfit)" }}>
          {label} — {company}
        </p>
        <p style={{ margin: "2px 0 0", fontSize: 11.5, color: "rgba(255,255,255,0.45)", fontFamily: "var(--font-outfit)", lineHeight: 1.4 }}>
          {headline}
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Read and decode signal param in `WizardContent`**

In `WizardContent` (around line 808), `searchParams` is already available. After the existing `const q1Param = searchParams.get("q1");` line, add:

```typescript
  const signalParam = searchParams.get("signal");
  const signalData = (() => {
    if (!signalParam) return null;
    try {
      return JSON.parse(
        atob(signalParam.replace(/-/g, "+").replace(/_/g, "/"))
      ) as { company: string; signal_type: string; headline: string; url: string };
    } catch {
      return null;
    }
  })();
```

- [ ] **Step 4: Render the banner inside `WizardContent`**

Find where `WizardContent` renders the conversation area. Look for the `convRef` div (the chat history container). Just above it, conditionally render the banner:

Search for the JSX block that contains `ref={convRef}`. Just before that div (inside the same parent), add:

```tsx
{signalData && (
  <SignalBanner
    headline={signalData.headline}
    company={signalData.company}
    signalType={signalData.signal_type}
  />
)}
```

The exact location to insert depends on the surrounding JSX structure. The banner should appear above the conversation messages but inside the wizard panel area so it stays visible while the user answers questions.

- [ ] **Step 5: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 6: Test the deeplink manually**

1. Construct a test URL:
```javascript
const payload = btoa(JSON.stringify({ company: "Acme Corp", signal_type: "funding", headline: "Acme Corp raises $10M Series A", url: "https://techcrunch.com/test" })).replace(/\+/g, "-").replace(/\//g, "_");
const url = `/dashboard/campaigns/new?signal=${payload}&q1=Companies+like+Acme+Corp`;
console.log(url);
```
2. Navigate to that URL while logged in
3. Expected: wizard opens immediately (no choice screen), banner appears at top, Q1 auto-fires with "Companies like Acme Corp" after ~700ms

- [ ] **Step 7: Commit**

```bash
git add app/dashboard/campaigns/new/page.tsx
git commit -m "feat: auto-open wizard and show signal banner when launched from alert email deeplink"
```

---

## Self-Review

**Spec coverage:**

| Requirement | Covered By |
|---|---|
| Cron job runs every 30 min | Task 7 — `vercel.json` `*/30 * * * *` |
| Poll job boards + news feeds | Task 6 — fetches TechCrunch + YC RSS via `lib/signals/rss.ts` |
| Extract hiring/funding signals | Task 4 — `detectSignalType`, `extractCompanyName` |
| Match against user ICP | Task 4 — `matchesICP` (keyword + location substring match) |
| Send email alert with pre-drafted cold email | Task 5 — Resend, `draftColdEmail` |
| User clicks email → opens Nexora pre-filled | Task 5 — `buildDeeplink` encodes signal; Task 8 — wizard decodes + auto-fires Q1 |
| ICP stored in user profile | Task 1 — DB columns; Task 2 — API; Task 3 — settings UI |
| Dedup: no duplicate alerts per user/signal | Task 6 — dedup check against `signal_alerts` before sending |
| Y Combinator RSS source | Task 4 — `https://www.ycombinator.com/blog/rss` in `FEEDS` |
| TechCrunch RSS source | Task 4 — `https://techcrunch.com/tag/funding/feed/` in `FEEDS` |

**Notes on scope gaps:**
- LinkedIn and Crunchbase intentionally excluded per spec (ToS / no free API)
- Reply after clicking "Send Now" uses the existing campaign wizard flow — no additional work needed
- Resend domain (`RESEND_FROM_EMAIL`) must be verified in the Resend dashboard before emails will send

**Placeholder scan:** No TBD, TODO, or vague instructions present.

**Type consistency:** `FeedItem` defined in `lib/signals/rss.ts` and imported by `lib/signals/alert-email.ts` and `app/api/cron/signal-alerts/route.ts` consistently. `AlertPayload` defined once in `alert-email.ts` and used in the cron route.
