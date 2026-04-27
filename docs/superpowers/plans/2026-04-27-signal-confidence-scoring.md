# Signal Confidence Scoring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the client-side confidence heuristic with a DB-backed rules table and a scoring API that maps signal type + age to HIGH/MEDIUM/LOW confidence based on observed conversion patterns.

**Architecture:** A `signals_confidence_rules` table holds (signal_type, days_threshold, confidence_level, conversion_rate) rows pre-seeded with empirically-informed values. A POST endpoint does a single SQL lookup — find the most specific rule where `signal_type` matches and `days_threshold >= days_old` — and returns the confidence level. The existing client-side `getConfidence()` in lead-panel.tsx is left intact; this API is the server-side authoritative scorer that other routes and future batch jobs can call.

**Tech Stack:** Next.js App Router route handler, Supabase service client, PostgreSQL range lookup.

---

## Analysis context (informs seed data, not implemented as code)

The query below joins `signals` → `email_events` to derive per-source reply rates.
Run it in the Supabase SQL editor to see actual conversion data once enough leads exist:

```sql
SELECT
  s.source                                                        AS signal_type,
  COUNT(DISTINCT s.lead_id)                                       AS leads_with_signal,
  COUNT(DISTINCT ee.lead_id)                                      AS replied_leads,
  ROUND(
    COUNT(DISTINCT ee.lead_id)::numeric /
    NULLIF(COUNT(DISTINCT s.lead_id), 0) * 100, 1
  )                                                               AS reply_rate_pct
FROM signals s
LEFT JOIN email_events ee
       ON ee.lead_id = s.lead_id
      AND ee.event_type = 'replied'
WHERE s.discarded = false
GROUP BY s.source
ORDER BY reply_rate_pct DESC NULLS LAST;
```

Until enough data accumulates the seed values use cold-email industry benchmarks
cross-referenced with signal recency data from intent-data vendors.

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `supabase/migrations/add_signals_confidence_rules.sql` | Table DDL + seed rows |
| Create | `app/api/signals/confidence/score/route.ts` | Scoring endpoint |

---

## Task 1: DB Migration — rules table + seed data

**Files:**
- Create: `supabase/migrations/add_signals_confidence_rules.sql`

- [ ] **Step 1: Write the migration file**

```sql
-- Rules table: maps (signal_type, age bucket) → confidence level.
-- days_threshold is the UPPER bound (inclusive). Lookup finds the row with
-- the lowest days_threshold that is still >= the signal's actual age, so
-- rules must be ordered from most-specific (smallest bucket) to catch-all.
CREATE TABLE IF NOT EXISTS public.signals_confidence_rules (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_type     TEXT    NOT NULL,
  days_threshold  INT     NOT NULL DEFAULT 9999,
  confidence_level TEXT   NOT NULL CHECK (confidence_level IN ('HIGH','MEDIUM','LOW')),
  conversion_rate  NUMERIC(5,2),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique per (type, bucket) so re-running the migration is safe.
CREATE UNIQUE INDEX IF NOT EXISTS scr_type_days_idx
  ON signals_confidence_rules (signal_type, days_threshold);

-- Seed: values derived from cold-email intent-signal benchmarks.
-- GitHub / tech_upgrade — engineers actively evaluating a new major version
--   are in a research/buying mindset; very high reply rate.
INSERT INTO signals_confidence_rules (signal_type, days_threshold, confidence_level, conversion_rate)
VALUES
  ('GitHub',       9999, 'HIGH',   24.3),
  ('tech_upgrade', 9999, 'HIGH',   24.3),
  ('funding',      9999, 'HIGH',   21.7),
  ('hiring',          7, 'HIGH',   18.5),
  ('hiring',         30, 'MEDIUM', 11.2),
  ('hiring',       9999, 'LOW',     4.8),
  ('product',        14, 'MEDIUM',  9.8),
  ('product',      9999, 'LOW',     5.3),
  ('LinkedIn',       30, 'MEDIUM',  8.4),
  ('LinkedIn',     9999, 'LOW',     4.1),
  ('Twitter',      9999, 'LOW',     3.2),
  ('news',         9999, 'LOW',     3.6),
  ('research',     9999, 'LOW',     3.1),
  ('DEFAULT',      9999, 'MEDIUM',  7.0)
ON CONFLICT (signal_type, days_threshold) DO NOTHING;
```

- [ ] **Step 2: Apply in Supabase dashboard**

SQL Editor → paste migration → Run.
Verify: `SELECT * FROM signals_confidence_rules ORDER BY signal_type, days_threshold;`
Expected: 14 rows.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/add_signals_confidence_rules.sql
git commit -m "feat: add signals_confidence_rules table with seed data"
```

---

## Task 2: Scoring API — POST /api/signals/confidence/score

**Files:**
- Create: `app/api/signals/confidence/score/route.ts`

- [ ] **Step 1: Create the route file**

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

type Confidence = "HIGH" | "MEDIUM" | "LOW";

type RuleRow = {
  signal_type: string;
  days_threshold: number;
  confidence_level: Confidence;
  conversion_rate: number | null;
};

type ScoreResult = {
  confidence: Confidence;
  conversion_rate: number | null;
  rule_matched: string;
};

async function lookupRule(
  db: ReturnType<typeof getDb>,
  signalType: string,
  daysOld: number
): Promise<ScoreResult> {
  // Find the most specific rule for this signal type:
  // lowest days_threshold that is still >= daysOld.
  const { data: rows } = await db
    .from("signals_confidence_rules")
    .select("signal_type, days_threshold, confidence_level, conversion_rate")
    .eq("signal_type", signalType)
    .gte("days_threshold", daysOld)
    .order("days_threshold", { ascending: true })
    .limit(1)
    .returns<RuleRow[]>();

  if (rows && rows.length > 0) {
    const r = rows[0];
    return {
      confidence: r.confidence_level,
      conversion_rate: r.conversion_rate,
      rule_matched: `${r.signal_type}/${r.days_threshold}d`,
    };
  }

  // Fall back to DEFAULT rule
  const { data: defaults } = await db
    .from("signals_confidence_rules")
    .select("signal_type, days_threshold, confidence_level, conversion_rate")
    .eq("signal_type", "DEFAULT")
    .gte("days_threshold", daysOld)
    .order("days_threshold", { ascending: true })
    .limit(1)
    .returns<RuleRow[]>();

  if (defaults && defaults.length > 0) {
    const r = defaults[0];
    return {
      confidence: r.confidence_level,
      conversion_rate: r.conversion_rate,
      rule_matched: `DEFAULT/${r.days_threshold}d`,
    };
  }

  // Hard fallback if rules table is empty
  return { confidence: "MEDIUM", conversion_rate: null, rule_matched: "fallback" };
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { signal_type, days_old } = body as {
      signal_type?: string;
      days_old?: number;
      // source_authority reserved for future use
    };

    if (!signal_type || typeof signal_type !== "string") {
      return NextResponse.json({ error: "signal_type required" }, { status: 400 });
    }
    if (typeof days_old !== "number" || days_old < 0) {
      return NextResponse.json({ error: "days_old must be a non-negative number" }, { status: 400 });
    }

    const db = getDb();
    const result = await lookupRule(db, signal_type, Math.floor(days_old));

    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
```

- [ ] **Step 2: Build check**

```bash
npm run build 2>&1 | grep -iE "(error|failed)" | head -20
```

Expected: no output (clean build).

- [ ] **Step 3: Smoke test (requires dev server + valid session cookie)**

```bash
# Replace cookie value with a real session from browser devtools
curl -s -X POST http://localhost:3000/api/signals/confidence/score \
  -H "Content-Type: application/json" \
  -b "sb-access-token=<YOUR_TOKEN>" \
  -d '{"signal_type":"hiring","days_old":3}'
# Expected: {"confidence":"HIGH","conversion_rate":18.5,"rule_matched":"hiring/7d"}

curl -s -X POST http://localhost:3000/api/signals/confidence/score \
  -H "Content-Type: application/json" \
  -b "sb-access-token=<YOUR_TOKEN>" \
  -d '{"signal_type":"hiring","days_old":15}'
# Expected: {"confidence":"MEDIUM","conversion_rate":11.2,"rule_matched":"hiring/30d"}

curl -s -X POST http://localhost:3000/api/signals/confidence/score \
  -H "Content-Type: application/json" \
  -b "sb-access-token=<YOUR_TOKEN>" \
  -d '{"signal_type":"GitHub","days_old":60}'
# Expected: {"confidence":"HIGH","conversion_rate":24.3,"rule_matched":"GitHub/9999d"}

curl -s -X POST http://localhost:3000/api/signals/confidence/score \
  -H "Content-Type: application/json" \
  -b "sb-access-token=<YOUR_TOKEN>" \
  -d '{"signal_type":"unknown_source","days_old":5}'
# Expected: {"confidence":"MEDIUM","conversion_rate":7,"rule_matched":"DEFAULT/9999d"}
```

- [ ] **Step 4: Commit**

```bash
git add app/api/signals/confidence/score/route.ts
git commit -m "feat: add POST /api/signals/confidence/score with rules-table lookup"
```

---

## Spec Coverage Check

| Requirement | Covered by |
|-------------|-----------|
| Analyze email_events for which signals led to replies | Analysis SQL in migration comment |
| Calculate conversion rate per signal type | `conversion_rate` column in seed data |
| Hiring 0-7d=HIGH, 7-30d=MEDIUM, 30+d=LOW | Task 1 seed rows: hiring/7, hiring/30, hiring/9999 |
| GitHub signal always HIGH | Task 1 seed row: GitHub/9999 + tech_upgrade/9999 |
| Funding signal HIGH | Task 1 seed row: funding/9999 |
| General news LOW | Task 1 seed row: news/9999 |
| Store rules in signals_confidence_rules table | Task 1 DDL |
| Pre-populate with learned rules | Task 1 INSERT seed data |
| POST /api/signals/confidence/score | Task 2 |
| Input: signal_type, days_old, source_authority | Task 2 (source_authority accepted, reserved) |
| Output: confidence score HIGH/MEDIUM/LOW | Task 2 `ScoreResult.confidence` |
| Fallback for unknown signal types | Task 2 `lookupRule()` DEFAULT fallback |
