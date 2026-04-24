# CSV Import + Signal Detection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users upload a CSV of leads to create a campaign, then auto-detect signals via Vercel Cron (every minute, 150 leads/run), showing progress until done, then letting the user generate emails.

**Architecture:** CSV upload creates a campaign + leads with `signal_status = 'queued'`. A Vercel Cron endpoint atomically claims batches of 150 queued leads via a Postgres RPC, processes 15 concurrently with Claude Haiku, and writes results back. The campaign detail page polls `/api/campaigns/[id]/signals/progress` every 5s to show a progress banner.

**Tech Stack:** Next.js 15 App Router, Supabase (service role for atomic SQL), Claude Haiku (`claude-haiku-4-5-20251001`), Vercel Cron, TypeScript

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `vercel.json` | Create | Cron schedule config |
| `supabase/migrations/add_leads_updated_at.sql` | Create | updated_at column + index + RPC |
| `app/api/campaigns/import/route.ts` | Create | Parse CSV, create campaign + leads |
| `app/api/campaigns/[id]/signals/progress/route.ts` | Create | Progress counts polling endpoint |
| `app/api/signals/cron/route.ts` | Create | Vercel Cron: claim batch, process, write results |
| `app/dashboard/campaigns/import/page.tsx` | Create | Upload zone + preview + confirm UI |
| `app/dashboard/campaigns/[id]/_components/signal-progress-banner.tsx` | Create | Polling banner with progress bar |
| `app/dashboard/campaigns/[id]/_components/leads-tab.tsx` | Modify | Add SignalProgressBanner at top |
| `app/dashboard/campaigns/page.tsx` | Modify | Add "Import CSV" button in header |

---

## Task 1: Supabase migration

**Files:**
- Create: `supabase/migrations/add_leads_updated_at.sql`

Run this SQL in the Supabase dashboard SQL editor (Project > SQL Editor > New query). There is no migration runner in this project - just execute it directly.

- [ ] **Step 1: Create the migration file**

```sql
-- supabase/migrations/add_leads_updated_at.sql

-- Add updated_at to leads (needed for stuck-lead detection in cron)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Index for cron performance: find queued leads fast
CREATE INDEX IF NOT EXISTS leads_signal_status_created_idx
  ON leads (signal_status, created_at);

-- Atomic claim function: marks next N queued leads as 'processing' and returns them.
-- Called by the cron to prevent double-processing across concurrent executions.
CREATE OR REPLACE FUNCTION claim_queued_leads(batch_size integer)
RETURNS SETOF leads
LANGUAGE sql
AS $$
  UPDATE leads
  SET signal_status = 'processing', updated_at = now()
  WHERE id IN (
    SELECT id FROM leads
    WHERE signal_status = 'queued'
    ORDER BY created_at
    LIMIT batch_size
  )
  RETURNING *;
$$;
```

- [ ] **Step 2: Run in Supabase SQL editor**

Go to your Supabase project > SQL Editor > New query, paste the file contents, and run it. Verify in Table Editor that the `leads` table now has an `updated_at` column.

- [ ] **Step 3: Commit the file**

```bash
git add supabase/migrations/add_leads_updated_at.sql
git commit -m "db: add leads.updated_at, signal status index, claim_queued_leads rpc"
```

---

## Task 2: vercel.json + CRON_SECRET env var

**Files:**
- Create: `vercel.json`

- [ ] **Step 1: Create vercel.json**

```json
{
  "crons": [
    {
      "path": "/api/signals/cron",
      "schedule": "* * * * *"
    }
  ]
}
```

- [ ] **Step 2: Add CRON_SECRET to .env.local**

Add this line to `.env.local` (generate any random string, e.g. `openssl rand -hex 32`):

```
CRON_SECRET=your_random_secret_here
```

Also add it to Vercel dashboard: Project Settings > Environment Variables > `CRON_SECRET`.

- [ ] **Step 3: Commit**

```bash
git add vercel.json
git commit -m "config: add vercel cron for signal detection"
```

---

## Task 3: Progress API route

**Files:**
- Create: `app/api/campaigns/[id]/signals/progress/route.ts`

This is a simple GET that returns counts of leads by signal_status for a campaign. No auth complexity - RLS on the supabase client scopes it to the user.

- [ ] **Step 1: Create the route**

```ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("leads")
    .select("signal_status")
    .eq("campaign_id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const counts = { queued: 0, processing: 0, done: 0, failed: 0, total: 0 };
  for (const row of data ?? []) {
    counts.total++;
    const s = row.signal_status as keyof typeof counts;
    if (s in counts) counts[s]++;
  }

  return NextResponse.json(counts);
}
```

- [ ] **Step 2: Test manually**

Start dev server (`npm run dev`), open a campaign that has some leads, navigate to `http://localhost:3000/api/campaigns/YOUR_CAMPAIGN_ID/signals/progress`. Should return `{ queued: 0, processing: 0, done: N, failed: 0, total: N }`.

- [ ] **Step 3: Commit**

```bash
git add app/api/campaigns/[id]/signals/progress/route.ts
git commit -m "feat: add signals progress polling endpoint"
```

---

## Task 4: Import API route

**Files:**
- Create: `app/api/campaigns/import/route.ts`

Accepts `multipart/form-data` with a `file` field (CSV) and optional `name` field. Parses CSV, validates required `email` column, creates campaign, bulk-inserts leads in batches of 500.

- [ ] **Step 1: Create the route**

```ts
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

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const cols: string[] = [];
    let cur = "";
    let inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuote && line[i + 1] === '"') { cur += '"'; i++; }
        else inQuote = !inQuote;
      } else if (ch === "," && !inQuote) {
        cols.push(cur.trim());
        cur = "";
      } else {
        cur += ch;
      }
    }
    cols.push(cur.trim());
    rows.push(cols);
  }
  return rows;
}

function normalizeHeader(h: string) {
  return h.toLowerCase().replace(/[^a-z0-9]/g, "_");
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getServiceClient();

  // Plan check: Pro/Agency only
  const { data: sub } = await db
    .from("subscriptions")
    .select("plan, credits_used, credits_limit")
    .eq("user_id", user.id)
    .single();

  const plan = sub?.plan ?? "free";
  if (plan !== "pro" && plan !== "agency") {
    return NextResponse.json(
      { error: "CSV import with signal detection requires a Pro or Agency plan." },
      { status: 403 }
    );
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const campaignName = (formData.get("name") as string | null)?.trim() || null;

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const text = await file.text();
  const rows = parseCSV(text);
  if (rows.length < 2) {
    return NextResponse.json({ error: "CSV must have a header row and at least one data row" }, { status: 400 });
  }

  // Map headers
  const headers = rows[0].map(normalizeHeader);
  const col = (name: string) => {
    const aliases: Record<string, string[]> = {
      first_name: ["first_name", "firstname", "first"],
      last_name:  ["last_name", "lastname", "last"],
      email:      ["email", "email_address"],
      company:    ["company", "company_name", "organization"],
      role:       ["role", "title", "job_title", "position"],
    };
    for (const alias of aliases[name] ?? [name]) {
      const i = headers.indexOf(alias);
      if (i !== -1) return i;
    }
    return -1;
  };

  if (col("email") === -1) {
    return NextResponse.json({ error: "CSV must have an 'email' column" }, { status: 400 });
  }

  // Build lead rows
  const dataRows = rows.slice(1);
  type LeadRow = {
    campaign_id: string;
    user_id: string;
    first_name: string;
    email: string;
    company: string | null;
    role: string | null;
    signal_status: string;
  };
  const leads: Omit<LeadRow, "campaign_id">[] = [];

  for (const row of dataRows) {
    const email = row[col("email")]?.toLowerCase().trim();
    if (!email || !email.includes("@")) continue;

    const firstName = [
      row[col("first_name")] ?? "",
      row[col("last_name")] ?? "",
    ].filter(Boolean).join(" ").trim() || "Unknown";

    leads.push({
      user_id: user.id,
      first_name: firstName,
      email,
      company: row[col("company")]?.trim() || null,
      role: row[col("role")]?.trim() || null,
      signal_status: "queued",
    });
  }

  if (leads.length === 0) {
    return NextResponse.json({ error: "No valid leads found (email column is empty or malformed)" }, { status: 400 });
  }

  // Create campaign
  const name = campaignName || file.name.replace(/\.csv$/i, "").trim() || "Imported Campaign";
  const { data: campaign, error: campErr } = await db
    .from("campaigns")
    .insert({ user_id: user.id, name, status: "draft", lead_count: leads.length, tone: "professional" })
    .select("id")
    .single();

  if (campErr || !campaign) {
    return NextResponse.json({ error: "Failed to create campaign" }, { status: 500 });
  }

  // Bulk insert leads in batches of 500
  const withCampaignId = leads.map((l) => ({ ...l, campaign_id: campaign.id }));
  const BATCH = 500;
  for (let i = 0; i < withCampaignId.length; i += BATCH) {
    const { error: insertErr } = await db
      .from("leads")
      .insert(withCampaignId.slice(i, i + BATCH));
    if (insertErr) {
      // Best-effort: campaign created but some leads may be missing
      console.error(JSON.stringify({ step: "csv_import_insert_error", error: insertErr.message, offset: i }));
    }
  }

  return NextResponse.json({ campaignId: campaign.id, leadCount: leads.length });
}
```

- [ ] **Step 2: Test with a sample CSV**

Create `test.csv`:
```
first_name,last_name,email,company,title
Alice,Smith,alice@example.com,Acme,VP Sales
Bob,Jones,bob@example.com,Beta Inc,CEO
```

Upload via curl:
```bash
curl -X POST http://localhost:3000/api/campaigns/import \
  -F "file=@test.csv" \
  -F "name=Test Import" \
  -b "your session cookie here"
```

Expected: `{ "campaignId": "uuid...", "leadCount": 2 }`. Check Supabase to confirm campaign + 2 leads created with `signal_status = 'queued'`.

- [ ] **Step 3: Commit**

```bash
git add app/api/campaigns/import/route.ts
git commit -m "feat: CSV import API - parse, create campaign, bulk insert leads"
```

---

## Task 5: Cron API route

**Files:**
- Create: `app/api/signals/cron/route.ts`

Protected by `Authorization: Bearer $CRON_SECRET`. Resets stuck leads, claims 150 queued leads atomically via RPC, processes 15 concurrently per round, writes results, deducts credits per user.

- [ ] **Step 1: Create the route**

```ts
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

type SignalData = {
  company_insights: string;
  role_insights: string;
  pain_points: string[];
  talking_points: string[];
  recent_signals: string[];
  personalization_hooks: string[];
  last_updated: string;
};

type LeadRow = {
  id: string;
  campaign_id: string;
  first_name: string | null;
  company: string | null;
  role: string | null;
  email: string | null;
};

function getDb() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function researchLead(
  anthropic: Anthropic,
  lead: LeadRow
): Promise<SignalData | null> {
  const firstName = lead.first_name || "Unknown";
  const company = lead.company || "Unknown Company";
  const role = lead.role || "Unknown Role";
  const emailDomain = lead.email?.split("@")[1] || "";

  try {
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 700,
      system: `You are a sales research assistant. Based on the following lead information, provide specific, actionable intelligence a salesperson can reference in a cold email. Focus on: likely company pain points, role-specific challenges, industry context, and compelling personalization angles. Be specific and practical. Never fabricate facts. Return ONLY a valid JSON object with exactly these keys: { "company_insights": string, "role_insights": string, "pain_points": string[], "talking_points": string[], "recent_signals": string[], "personalization_hooks": string[] }. No markdown, no code fences.`,
      messages: [
        {
          role: "user",
          content: `Research this lead for a cold outreach email:\nName: ${firstName}\nCompany: ${company}\nRole: ${role}${emailDomain ? `\nEmail domain: ${emailDomain}` : ""}\n\nProvide actionable sales intelligence. Keep each array to 2-3 items max.`,
        },
      ],
    });

    const raw = message.content[0].type === "text" ? message.content[0].text.trim() : "";
    const cleaned = raw.replace(/```json\s*/gi, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return { ...parsed, last_updated: new Date().toISOString() };
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  // Auth: Vercel sends Authorization: Bearer $CRON_SECRET on cron calls
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  // 1. Reset stuck leads: processing > 5 minutes → queued
  await db
    .from("leads")
    .update({ signal_status: "queued", updated_at: new Date().toISOString() })
    .eq("signal_status", "processing")
    .lt("updated_at", new Date(Date.now() - 5 * 60 * 1000).toISOString());

  // 2. Atomically claim next 150 queued leads
  const { data: claimed, error: claimErr } = await db.rpc("claim_queued_leads", {
    batch_size: 150,
  });

  if (claimErr) {
    console.error(JSON.stringify({ step: "cron_claim_error", error: claimErr.message }));
    return NextResponse.json({ error: claimErr.message }, { status: 500 });
  }

  const leads = (claimed as LeadRow[]) ?? [];
  if (leads.length === 0) {
    return NextResponse.json({ processed: 0, message: "No queued leads" });
  }

  console.log(JSON.stringify({ step: "cron_start", count: leads.length }));

  // 3. Process 15 concurrently per round
  const CONCURRENCY = 15;
  let successCount = 0;
  const creditsByUser: Record<string, number> = {};

  for (let i = 0; i < leads.length; i += CONCURRENCY) {
    const batch = leads.slice(i, i + CONCURRENCY);
    await Promise.all(
      batch.map(async (lead) => {
        const signalData = await researchLead(anthropic, lead);
        if (signalData) {
          await db
            .from("leads")
            .update({
              signal_data: signalData,
              signal_status: "done",
              updated_at: new Date().toISOString(),
            })
            .eq("id", lead.id);
          successCount++;
          creditsByUser[lead.campaign_id] = (creditsByUser[lead.campaign_id] ?? 0) + 1;
        } else {
          await db
            .from("leads")
            .update({ signal_status: "failed", updated_at: new Date().toISOString() })
            .eq("id", lead.id);
        }
      })
    );
  }

  // 4. Deduct credits per user (group by campaign_id → user_id)
  const campaignIds = [...new Set(leads.map((l) => l.campaign_id))];
  const { data: campaigns } = await db
    .from("campaigns")
    .select("id, user_id")
    .in("id", campaignIds);

  const campaignUserMap: Record<string, string> = {};
  for (const c of campaigns ?? []) campaignUserMap[c.id] = c.user_id;

  const creditsByUserId: Record<string, number> = {};
  for (const [campId, credits] of Object.entries(creditsByUser)) {
    const uid = campaignUserMap[campId];
    if (uid) creditsByUserId[uid] = (creditsByUserId[uid] ?? 0) + credits;
  }

  for (const [userId, credits] of Object.entries(creditsByUserId)) {
    const { data: sub } = await db
      .from("subscriptions")
      .select("credits_used")
      .eq("user_id", userId)
      .single();
    if (sub) {
      await db
        .from("subscriptions")
        .update({ credits_used: (sub.credits_used ?? 0) + credits })
        .eq("user_id", userId);
    }
  }

  console.log(JSON.stringify({ step: "cron_done", total: leads.length, success: successCount }));
  return NextResponse.json({ processed: leads.length, success: successCount });
}
```

- [ ] **Step 2: Test the cron endpoint locally**

First create some leads with `signal_status = 'queued'` in the DB (from Task 4 test). Then call:

```bash
curl -X POST http://localhost:3000/api/signals/cron \
  -H "Authorization: Bearer your_cron_secret_here"
```

Expected: `{ "processed": 2, "success": 2 }`. Check Supabase - leads should now have `signal_status = 'done'` and `signal_data` populated.

- [ ] **Step 3: Test auth rejection**

```bash
curl -X POST http://localhost:3000/api/signals/cron \
  -H "Authorization: Bearer wrong_secret"
```

Expected: `{ "error": "Unauthorized" }` with status 401.

- [ ] **Step 4: Commit**

```bash
git add app/api/signals/cron/route.ts
git commit -m "feat: signal detection cron - atomic claim, 15-concurrent Claude Haiku, credit deduction"
```

---

## Task 6: SignalProgressBanner component

**Files:**
- Create: `app/dashboard/campaigns/[id]/_components/signal-progress-banner.tsx`

Client component. Polls `/api/campaigns/[id]/signals/progress` every 5s when signals are in progress. Shows progress bar. Stops polling when all leads are done or failed.

- [ ] **Step 1: Create the component**

```tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

type Progress = {
  total: number;
  queued: number;
  processing: number;
  done: number;
  failed: number;
};

export default function SignalProgressBanner({
  campaignId,
  initialProgress,
}: {
  campaignId: string;
  initialProgress: Progress;
}) {
  const router = useRouter();
  const [progress, setProgress] = useState<Progress>(initialProgress);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isDone =
    progress.total > 0 &&
    progress.queued === 0 &&
    progress.processing === 0;

  const analyzed = progress.done + progress.failed;
  const pct = progress.total > 0 ? Math.round((analyzed / progress.total) * 100) : 0;

  const poll = useCallback(async () => {
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/signals/progress`);
      if (!res.ok) return;
      const data: Progress = await res.json();
      setProgress(data);
      if (data.total > 0 && data.queued === 0 && data.processing === 0) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        router.refresh();
      }
    } catch {}
  }, [campaignId, router]);

  useEffect(() => {
    if (isDone) return;
    intervalRef.current = setInterval(poll, 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isDone, poll]);

  if (progress.total === 0) return null;

  return (
    <div
      style={{
        marginBottom: 20,
        padding: "16px 20px",
        backgroundColor: "#0e0e0e",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 8,
        borderLeft: `3px solid ${isDone ? "#22C55E" : "#FF5200"}`,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: isDone ? 0 : 10,
        }}
      >
        <div>
          <p
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: isDone ? "#22C55E" : "#fff",
              fontFamily: "var(--font-syne)",
              marginBottom: 2,
            }}
          >
            {isDone ? "Signals ready" : "Detecting signals..."}
          </p>
          <p
            style={{
              fontSize: 11,
              color: "rgba(255,255,255,0.35)",
              fontFamily: "var(--font-outfit)",
            }}
          >
            {isDone
              ? `${progress.done} leads analyzed${progress.failed > 0 ? `, ${progress.failed} failed` : ""}`
              : `${analyzed} / ${progress.total} leads analyzed`}
          </p>
        </div>
        {isDone && (
          <button
            onClick={() => router.push(`/dashboard/campaigns/${campaignId}?tab=leads`)}
            style={{
              padding: "8px 16px",
              borderRadius: 7,
              border: "none",
              backgroundColor: "#FF5200",
              color: "#fff",
              fontSize: 12,
              fontWeight: 500,
              fontFamily: "var(--font-outfit)",
              cursor: "pointer",
            }}
          >
            Generate emails
          </button>
        )}
      </div>

      {!isDone && (
        <div
          style={{
            height: 4,
            borderRadius: 2,
            backgroundColor: "rgba(255,255,255,0.06)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${pct}%`,
              backgroundColor: "#FF5200",
              borderRadius: 2,
              transition: "width 0.4s ease",
            }}
          />
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/dashboard/campaigns/[id]/_components/signal-progress-banner.tsx
git commit -m "feat: signal progress banner with polling"
```

---

## Task 7: Wire up leads tab + campaigns page

**Files:**
- Modify: `app/dashboard/campaigns/[id]/_components/leads-tab.tsx`
- Modify: `app/dashboard/campaigns/[id]/page.tsx`
- Modify: `app/dashboard/campaigns/page.tsx`

### Part A: Add banner to leads tab

The `LeadsTab` component receives a `leads` array. We need to also pass the campaign ID so the banner can poll. Check `app/dashboard/campaigns/[id]/page.tsx` to confirm how `LeadsTab` is called (it's at line ~60 in that file).

- [ ] **Step 1: Update LeadsTab props**

In `app/dashboard/campaigns/[id]/_components/leads-tab.tsx`, add `campaignId` prop and render the banner:

Find the existing `export default function LeadsTab({ leads }: { leads: Lead[] })` line and change to:

```tsx
import SignalProgressBanner from "./signal-progress-banner";

// Add to top of file (after existing imports)

type ProgressCounts = {
  total: number;
  queued: number;
  processing: number;
  done: number;
  failed: number;
};

export default function LeadsTab({
  leads,
  campaignId,
  signalProgress,
}: {
  leads: Lead[];
  campaignId: string;
  signalProgress: ProgressCounts;
}) {
```

Then at the start of the returned JSX (before the enrichment banner `{enriching && ...}` block), add:

```tsx
{(signalProgress.queued > 0 || signalProgress.processing > 0) && (
  <SignalProgressBanner campaignId={campaignId} initialProgress={signalProgress} />
)}
```

- [ ] **Step 2: Update campaign detail page to pass props**

In `app/dashboard/campaigns/[id]/page.tsx`, the page already queries leads with `signal_status`. Add a progress computation and pass it to LeadsTab.

After the existing `const allLeads = leads ?? [];` line, add:

```ts
const signalProgress = {
  total: allLeads.length,
  queued: allLeads.filter((l) => l.signal_status === "queued").length,
  processing: allLeads.filter((l) => l.signal_status === "processing").length,
  done: allLeads.filter((l) => l.signal_status === "done").length,
  failed: allLeads.filter((l) => l.signal_status === "failed").length,
};
```

Find where `<LeadsTab leads={allLeads} />` is rendered and update to:

```tsx
<LeadsTab leads={allLeads} campaignId={id} signalProgress={signalProgress} />
```

- [ ] **Step 3: Add Import CSV button to campaigns list**

In `app/dashboard/campaigns/page.tsx`, find the header section that contains the "New Campaign" `<Link>`. After that Link, add:

```tsx
import { Upload } from "lucide-react";

// In the header, after the existing New Campaign Link:
<Link
  href="/dashboard/campaigns/import"
  style={{
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    padding: "8px 16px",
    backgroundColor: "transparent",
    color: "rgba(255,255,255,0.55)",
    borderRadius: 7,
    fontSize: 12,
    fontWeight: 500,
    fontFamily: "var(--font-outfit)",
    textDecoration: "none",
    border: "1px solid rgba(255,255,255,0.1)",
  }}
>
  <Upload size={11} strokeWidth={2} aria-hidden="true" />
  Import CSV
</Link>
```

The header div needs `gap: 8` to space the two buttons. Find the `<Link href="/dashboard/campaigns/new"` element - it's inside a div. Wrap both Links in a flex container with `gap: 8` if they aren't already.

- [ ] **Step 4: Build check**

```bash
npm run build
```

Expected: zero TypeScript errors. Fix any type errors before committing.

- [ ] **Step 5: Commit**

```bash
git add app/dashboard/campaigns/[id]/_components/leads-tab.tsx \
        app/dashboard/campaigns/[id]/page.tsx \
        app/dashboard/campaigns/page.tsx
git commit -m "feat: wire signal progress banner into leads tab and campaigns header"
```

---

## Task 8: CSV Import page

**Files:**
- Create: `app/dashboard/campaigns/import/page.tsx`

Two-state client component: upload zone → column preview → confirm. Sends `multipart/form-data` to `POST /api/campaigns/import`, redirects to campaign on success.

- [ ] **Step 1: Create the page**

```tsx
"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type PreviewRow = string[];

function parseCSVPreview(text: string, maxRows = 6): { headers: string[]; rows: PreviewRow[] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return { headers: [], rows: [] };

  const parseLine = (line: string): string[] => {
    const cols: string[] = [];
    let cur = "";
    let inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuote && line[i + 1] === '"') { cur += '"'; i++; }
        else inQuote = !inQuote;
      } else if (ch === "," && !inQuote) {
        cols.push(cur.trim());
        cur = "";
      } else {
        cur += ch;
      }
    }
    cols.push(cur.trim());
    return cols;
  };

  return {
    headers: parseLine(lines[0]),
    rows: lines.slice(1, maxRows).map(parseLine),
  };
}

function hasEmailColumn(headers: string[]): boolean {
  return headers.some((h) =>
    ["email", "email_address"].includes(h.toLowerCase().replace(/[^a-z0-9]/g, "_"))
  );
}

export default function ImportCSVPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<{ headers: string[]; rows: PreviewRow[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);

  const loadFile = useCallback((f: File) => {
    if (!f.name.endsWith(".csv")) {
      setError("Please upload a .csv file");
      return;
    }
    setError(null);
    setFile(f);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const p = parseCSVPreview(text);
      if (!hasEmailColumn(p.headers)) {
        setError("CSV must have an 'email' column. Found: " + (p.headers.join(", ") || "none"));
        setFile(null);
        setPreview(null);
        return;
      }
      setPreview(p);
    };
    reader.readAsText(f);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const f = e.dataTransfer.files[0];
      if (f) loadFile(f);
    },
    [loadFile]
  );

  const handleConfirm = async () => {
    if (!file || uploading) return;
    setUploading(true);
    setError(null);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("name", file.name.replace(/\.csv$/i, "").trim());

    try {
      const res = await fetch("/api/campaigns/import", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Upload failed");
        setUploading(false);
        return;
      }
      router.push(`/dashboard/campaigns/${data.campaignId}?tab=leads`);
    } catch {
      setError("Upload failed. Please try again.");
      setUploading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#060606" }}>
      {/* Header */}
      <header
        style={{
          padding: "0 32px",
          height: 64,
          display: "flex",
          alignItems: "center",
          gap: 12,
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          backgroundColor: "rgba(6,6,6,0.9)",
          backdropFilter: "blur(12px)",
          position: "sticky",
          top: 0,
          zIndex: 30,
        }}
      >
        <Link
          href="/dashboard/campaigns"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            color: "rgba(255,255,255,0.4)",
            fontSize: 13,
            fontFamily: "var(--font-outfit)",
            textDecoration: "none",
            padding: "6px 10px",
            borderRadius: 7,
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back
        </Link>
        <span style={{ color: "rgba(255,255,255,0.1)", fontSize: 16 }}>/</span>
        <span style={{ fontSize: 15, fontWeight: 500, color: "#fff", fontFamily: "var(--font-syne)" }}>
          Import CSV
        </span>
      </header>

      <main style={{ maxWidth: 640, margin: "0 auto", padding: "48px 24px" }}>
        <h2
          style={{
            fontSize: 22,
            fontWeight: 500,
            color: "#fff",
            fontFamily: "var(--font-syne)",
            marginBottom: 8,
          }}
        >
          Import your leads
        </h2>
        <p
          style={{
            fontSize: 13,
            color: "rgba(255,255,255,0.4)",
            fontFamily: "var(--font-outfit)",
            marginBottom: 32,
          }}
        >
          Upload a CSV with columns: email (required), first_name, last_name, company, title.
          Signals will be detected automatically after import.
        </p>

        {/* Upload zone */}
        {!preview && (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            style={{
              border: `2px dashed ${dragging ? "rgba(255,82,0,0.6)" : "rgba(255,255,255,0.1)"}`,
              borderRadius: 10,
              padding: "56px 24px",
              textAlign: "center",
              cursor: "pointer",
              backgroundColor: dragging ? "rgba(255,82,0,0.04)" : "rgba(255,255,255,0.015)",
              transition: "border-color 0.15s, background-color 0.15s",
            }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto 14px" }} aria-hidden="true">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
            </svg>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", fontFamily: "var(--font-outfit)", marginBottom: 6 }}>
              Drop your CSV here, or click to browse
            </p>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", fontFamily: "var(--font-outfit)" }}>
              .csv files only
            </p>
            <input
              ref={inputRef}
              type="file"
              accept=".csv"
              style={{ display: "none" }}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) loadFile(f); }}
            />
          </div>
        )}

        {/* Preview */}
        {preview && (
          <div>
            <div
              style={{
                marginBottom: 16,
                padding: "12px 16px",
                backgroundColor: "rgba(34,197,94,0.07)",
                border: "1px solid rgba(34,197,94,0.2)",
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <p style={{ fontSize: 13, color: "#4ade80", fontFamily: "var(--font-outfit)" }}>
                {file?.name} - columns detected
              </p>
              <button
                onClick={() => { setFile(null); setPreview(null); setError(null); }}
                style={{
                  fontSize: 11,
                  color: "rgba(255,255,255,0.3)",
                  fontFamily: "var(--font-outfit)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Change file
              </button>
            </div>

            {/* Column preview table */}
            <div
              style={{
                overflowX: "auto",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 8,
                marginBottom: 24,
              }}
            >
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, fontFamily: "var(--font-outfit)" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                    {preview.headers.map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: "10px 14px",
                          textAlign: "left",
                          color: "rgba(255,255,255,0.35)",
                          fontWeight: 400,
                          whiteSpace: "nowrap",
                          textTransform: "uppercase",
                          fontSize: 10,
                          letterSpacing: "0.07em",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.map((row, i) => (
                    <tr
                      key={i}
                      style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                    >
                      {row.map((cell, j) => (
                        <td
                          key={j}
                          style={{
                            padding: "10px 14px",
                            color: "rgba(255,255,255,0.6)",
                            whiteSpace: "nowrap",
                            maxWidth: 200,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {cell || "-"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              onClick={handleConfirm}
              disabled={uploading}
              style={{
                width: "100%",
                padding: "12px 20px",
                borderRadius: 8,
                border: "none",
                backgroundColor: uploading ? "rgba(255,82,0,0.5)" : "#FF5200",
                color: "#fff",
                fontSize: 14,
                fontWeight: 500,
                fontFamily: "var(--font-outfit)",
                cursor: uploading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              {uploading ? (
                <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ animation: "spin 0.9s linear infinite" }} aria-hidden="true">
                    <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                  Importing...
                </>
              ) : (
                "Import and detect signals"
              )}
            </button>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {error && (
          <p
            style={{
              marginTop: 16,
              fontSize: 12,
              color: "#f87171",
              fontFamily: "var(--font-outfit)",
              padding: "10px 14px",
              backgroundColor: "rgba(248,113,113,0.08)",
              borderRadius: 7,
              border: "1px solid rgba(248,113,113,0.2)",
            }}
          >
            {error}
          </p>
        )}
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Test in browser**

```bash
npm run dev
```

Navigate to `http://localhost:3000/dashboard/campaigns/import`. Test:
1. Drop a valid CSV - should show preview table
2. Drop a CSV without email column - should show error
3. Drop a non-CSV file - should show error
4. Click "Import and detect signals" - should redirect to campaign leads tab
5. Check Supabase: leads should have `signal_status = 'queued'`

- [ ] **Step 3: Commit**

```bash
git add app/dashboard/campaigns/import/page.tsx
git commit -m "feat: CSV import page with drag-and-drop and column preview"
```

---

## Task 9: End-to-end test

- [ ] **Step 1: Create a 50-row test CSV**

```bash
python3 -c "
import random, string
rows = ['first_name,last_name,email,company,title']
for i in range(50):
    rows.append(f'Lead{i},Test{i},lead{i}@test{i}.com,Company{i},Director')
print('\n'.join(rows))
" > test50.csv
```

- [ ] **Step 2: Import via the UI**

Go to `http://localhost:3000/dashboard/campaigns/import`, upload `test50.csv`. Confirm it redirects to the campaign leads tab and the signal progress banner appears at the top showing "0 / 50 leads analyzed".

- [ ] **Step 3: Trigger cron manually**

```bash
curl -X POST http://localhost:3000/api/signals/cron \
  -H "Authorization: Bearer your_cron_secret_here"
```

Expected: `{ "processed": 50, "success": N }`. The banner should update to 100% after the next page poll.

- [ ] **Step 4: Verify signal data in DB**

In Supabase Table Editor, check that leads now have `signal_data` JSON with `company_insights`, `pain_points`, etc., and `signal_status = 'done'`.

- [ ] **Step 5: Verify progress banner reaches done state**

Refresh the campaign leads tab. The banner should show "Signals ready" with a "Generate emails" button.

- [ ] **Step 6: Final build check**

```bash
npm run build
```

Expected: clean build, no errors.

- [ ] **Step 7: Commit**

No new files - this task is verification only. If any fixes were needed during testing, commit those now:

```bash
git add -p
git commit -m "fix: address issues found during e2e import test"
```
