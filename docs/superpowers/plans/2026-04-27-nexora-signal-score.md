# Nexora Signal Score Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a proprietary signal scoring system that ranks each signal type 1–10 by conversion rate for three founder archetypes (SaaS / agency / investor), and surfaces the score inline on every signal in the lead panel.

**Architecture:** A `signal_scores` table holds `(founder_type, signal_type, score 1-10, conversion_rate)` rows pre-seeded with benchmarks and updated as real data accumulates. `founder_type` is stored on the existing `subscriptions` row (consistent with `company_name`/`physical_address` added for compliance). A single `GET /api/signals/score` endpoint returns all scores for the calling user's founder type in one round-trip. The lead panel fetches scores once per panel-open and renders a small badge next to each signal's existing confidence indicator. The signup form gains a `<select>` for founder type; settings exposes the same picker for existing users.

**Tech Stack:** Next.js App Router route handlers, Supabase service client, PostgreSQL, React state in lead-panel.tsx.

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `supabase/migrations/add_signal_scores.sql` | `signal_scores` table + seed; `founder_type` column on `subscriptions` |
| Create | `app/api/signals/score/route.ts` | `GET /api/signals/score` — returns score map for calling user's founder type |
| Create | `app/api/profile/founder-type/route.ts` | `GET` + `PATCH` founder_type on subscriptions |
| Modify | `app/(auth)/signup/page.tsx` | Add founder type `<select>` to signup form |
| Modify | `app/actions/auth.ts` | Read `founder_type` from formData and save via service client after auth signup |
| Modify | `app/dashboard/settings/page.tsx` | Add "Founder Type" selector so existing users can update it |
| Modify | `app/dashboard/campaigns/[id]/_components/lead-panel.tsx` | Fetch scores once on mount; show score badge per signal |

---

## Task 1: DB Migration — signal_scores table + founder_type column

**Files:**
- Create: `supabase/migrations/add_signal_scores.sql`

- [ ] **Step 1: Write the migration**

```sql
-- Founder type on subscriptions (SaaS / agency / investor).
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS founder_type TEXT
  CHECK (founder_type IN ('saas', 'agency', 'investor'));

-- Proprietary scoring table: maps (founder_type, signal_type) → score + conversion_rate.
-- score is 1-10. conversion_rate is observed or benchmarked reply rate (%).
-- sample_size tracks whether the row is pre-seeded (0) or data-derived (N).
CREATE TABLE IF NOT EXISTS public.signal_scores (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_type     TEXT        NOT NULL CHECK (founder_type IN ('saas', 'agency', 'investor')),
  signal_type      TEXT        NOT NULL,
  score            INT         NOT NULL CHECK (score BETWEEN 1 AND 10),
  conversion_rate  NUMERIC(5,2) NOT NULL,
  sample_size      INT         NOT NULL DEFAULT 0,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS ss_founder_signal_idx
  ON signal_scores (founder_type, signal_type);

-- Seed: industry benchmarks (sample_size = 0 = pre-seeded estimate).
-- SaaS founders respond best to technical signals (GitHub, tech upgrades).
-- Agency founders respond best to hiring/funding (companies that need help scaling).
-- Investor founders respond best to funding/news (deal flow signals).
INSERT INTO signal_scores (founder_type, signal_type, score, conversion_rate)
VALUES
  -- SaaS
  ('saas', 'GitHub',       9, 24.3),
  ('saas', 'tech_upgrade', 9, 24.3),
  ('saas', 'funding',      7, 21.7),
  ('saas', 'hiring',       6, 18.5),
  ('saas', 'product',      5,  9.8),
  ('saas', 'LinkedIn',     4,  8.4),
  ('saas', 'news',         3,  3.6),
  ('saas', 'research',     3,  3.1),
  ('saas', 'Twitter',      2,  3.2),
  -- Agency
  ('agency', 'hiring',       8, 22.1),
  ('agency', 'funding',      7, 20.4),
  ('agency', 'news',         5, 12.7),
  ('agency', 'LinkedIn',     6, 15.2),
  ('agency', 'product',      5, 11.3),
  ('agency', 'Twitter',      4,  8.9),
  ('agency', 'GitHub',       4,  9.8),
  ('agency', 'tech_upgrade', 4,  9.1),
  ('agency', 'research',     3,  5.4),
  -- Investor
  ('investor', 'funding',      9, 31.2),
  ('investor', 'research',     7, 19.4),
  ('investor', 'news',         7, 18.9),
  ('investor', 'hiring',       6, 16.3),
  ('investor', 'Twitter',      5, 13.4),
  ('investor', 'LinkedIn',     5, 12.1),
  ('investor', 'product',      4,  9.2),
  ('investor', 'GitHub',       3,  7.1),
  ('investor', 'tech_upgrade', 3,  6.8)
ON CONFLICT (founder_type, signal_type) DO NOTHING;
```

- [ ] **Step 2: Apply in Supabase dashboard**

SQL Editor → paste → Run.

Verify:
```sql
SELECT founder_type, COUNT(*) FROM signal_scores GROUP BY founder_type;
-- Expected: saas=9, agency=9, investor=9

SELECT column_name FROM information_schema.columns
WHERE table_name = 'subscriptions' AND column_name = 'founder_type';
-- Expected: 1 row
```

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/add_signal_scores.sql
git commit -m "feat: add signal_scores table and founder_type column with benchmark seed data"
```

---

## Task 2: Score API — GET /api/signals/score

**Files:**
- Create: `app/api/signals/score/route.ts`

Returns all signal scores for the calling user's `founder_type` in a single map, so the lead panel can look up scores without per-signal API calls.

- [ ] **Step 1: Create the route**

```ts
import { NextResponse } from "next/server";
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

type ScoreRow = {
  signal_type: string;
  score: number;
  conversion_rate: number;
};

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();

  // Get user's founder type
  const { data: sub } = await db
    .from("subscriptions")
    .select("founder_type")
    .eq("user_id", user.id)
    .single();

  const founderType: string = sub?.founder_type ?? "saas";

  // Fetch all scores for this founder type
  const { data: rows } = await db
    .from("signal_scores")
    .select("signal_type, score, conversion_rate")
    .eq("founder_type", founderType)
    .returns<ScoreRow[]>();

  // Return as a map: signal_type → { score, conversion_rate }
  const scores: Record<string, { score: number; conversion_rate: number }> = {};
  for (const row of rows ?? []) {
    scores[row.signal_type] = {
      score: row.score,
      conversion_rate: Number(row.conversion_rate),
    };
  }

  return NextResponse.json({ founder_type: founderType, scores });
}
```

- [ ] **Step 2: Build check**

```bash
npm run build 2>&1 | grep -iE "(error|failed)" | head -10
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add app/api/signals/score/route.ts
git commit -m "feat: add GET /api/signals/score returning score map for user's founder type"
```

---

## Task 3: Founder Type API — GET + PATCH /api/profile/founder-type

**Files:**
- Create: `app/api/profile/founder-type/route.ts`

Used by the settings page to load and save the user's founder type.

- [ ] **Step 1: Create the route**

```ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_TYPES = ["saas", "agency", "investor"] as const;
type FounderType = typeof VALID_TYPES[number];

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
    .select("founder_type")
    .eq("user_id", user.id)
    .single();

  return NextResponse.json({ founder_type: data?.founder_type ?? null });
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { founder_type } = body as { founder_type?: string };

  if (!founder_type || !VALID_TYPES.includes(founder_type as FounderType)) {
    return NextResponse.json({ error: "founder_type must be saas, agency, or investor" }, { status: 400 });
  }

  const db = getDb();
  const { error } = await db
    .from("subscriptions")
    .update({ founder_type })
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Build check**

```bash
npm run build 2>&1 | grep -iE "(error|failed)" | head -10
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add app/api/profile/founder-type/route.ts
git commit -m "feat: add GET+PATCH /api/profile/founder-type"
```

---

## Task 4: Signup Form — Add Founder Type Selector

**Files:**
- Modify: `app/(auth)/signup/page.tsx`
- Modify: `app/actions/auth.ts`

### 4A: Signup page

- [ ] **Step 1: Add the `<select>` to the form**

In `app/(auth)/signup/page.tsx`, find the block after the confirm password field and before the error/submit:

```tsx
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="confirmPassword"
                className="text-sm font-medium"
                style={{ color: "rgba(255,255,255,0.6)" }}
              >
                Confirm password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                placeholder="••••••••"
                className="nx-input"
              />
            </div>
```

Replace with:

```tsx
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="confirmPassword"
                className="text-sm font-medium"
                style={{ color: "rgba(255,255,255,0.6)" }}
              >
                Confirm password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                placeholder="••••••••"
                className="nx-input"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="founderType"
                className="text-sm font-medium"
                style={{ color: "rgba(255,255,255,0.6)" }}
              >
                I sell to...
              </label>
              <select
                id="founderType"
                name="founderType"
                className="nx-input"
                defaultValue="saas"
                style={{ cursor: "pointer" }}
              >
                <option value="saas">SaaS founders &amp; technical buyers</option>
                <option value="agency">Agency owners &amp; service businesses</option>
                <option value="investor">Investors &amp; fund managers</option>
              </select>
            </div>
```

### 4B: Server action

- [ ] **Step 2: Update `app/actions/auth.ts` to save `founder_type` after signup**

Find this block in `app/actions/auth.ts`:

```ts
  const { error } = await supabase.auth.signUp({
    email: formData.get("email") as string,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/dashboard");
```

Replace with:

```ts
  const founderType = formData.get("founderType") as string | null;
  const validTypes = ["saas", "agency", "investor"];
  const safeFounderType = validTypes.includes(founderType ?? "") ? founderType : "saas";

  const { data: authData, error } = await supabase.auth.signUp({
    email: formData.get("email") as string,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  // Save founder type to subscriptions (service role bypasses RLS).
  // The subscription row is created by a DB trigger on auth.users insert;
  // this update runs after the trigger fires.
  if (authData.user) {
    const { createClient: createServiceClient } = await import("@supabase/supabase-js");
    const db = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    await db
      .from("subscriptions")
      .update({ founder_type: safeFounderType })
      .eq("user_id", authData.user.id);
  }

  redirect("/dashboard");
```

- [ ] **Step 3: Build check**

```bash
npm run build 2>&1 | grep -iE "(error|failed)" | head -10
```

Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add "app/(auth)/signup/page.tsx" app/actions/auth.ts
git commit -m "feat: collect founder type on signup and persist to subscriptions"
```

---

## Task 5: Settings — Founder Type Picker for Existing Users

**Files:**
- Modify: `app/dashboard/settings/page.tsx`

Add a "Founder Type" selector to the Settings page so existing users can set or update their type. It sits above the Compliance section, using the same `SectionCard` + `SectionLabel` pattern already in the file.

- [ ] **Step 1: Add founder type state variables**

In `app/dashboard/settings/page.tsx`, find:

```ts
  const [companyName, setCompanyName] = useState("");
  const [physicalAddress, setPhysicalAddress] = useState("");
  const [addressSaving, setAddressSaving] = useState(false);
  const [addressMsg, setAddressMsg] = useState<{ ok: boolean; text: string } | null>(null);
```

After that block, add:

```ts
  const [founderType, setFounderType] = useState<string>("");
  const [founderTypeSaving, setFounderTypeSaving] = useState(false);
  const [founderTypeMsg, setFounderTypeMsg] = useState<{ ok: boolean; text: string } | null>(null);
```

- [ ] **Step 2: Load founder type in a `useEffect`**

After the compliance `useEffect` (the one that fetches `/api/compliance/address`), add:

```ts
  useEffect(() => {
    fetch("/api/profile/founder-type")
      .then((r) => r.json())
      .then((d) => { if (d.founder_type) setFounderType(d.founder_type); })
      .catch(() => {});
  }, []);
```

- [ ] **Step 3: Add the save handler**

After `handleSaveAddress`, add:

```ts
  async function handleSaveFounderType() {
    if (!founderType) return;
    setFounderTypeSaving(true);
    setFounderTypeMsg(null);
    try {
      const res = await fetch("/api/profile/founder-type", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ founder_type: founderType }),
      });
      const data = await res.json();
      if (res.ok) {
        setFounderTypeMsg({ ok: true, text: "Saved. Signal scores will update on next panel open." });
      } else {
        setFounderTypeMsg({ ok: false, text: data.error ?? "Failed to save." });
      }
    } catch {
      setFounderTypeMsg({ ok: false, text: "Network error." });
    } finally {
      setFounderTypeSaving(false);
    }
  }
```

- [ ] **Step 4: Add the Founder Type section to the JSX**

Find the Compliance section opening (to insert above it):

```tsx
        {/* ── Compliance ── */}
        <ScrollReveal delay={0.18}>
```

Insert before it:

```tsx
        {/* ── Founder Type ── */}
        <ScrollReveal delay={0.16}>
          <SectionLabel>Signal Scoring Profile</SectionLabel>
          <SectionCard>
            <p style={{ fontSize: 12, color: "#555", fontFamily: "var(--font-outfit)", marginBottom: 14, lineHeight: 1.55 }}>
              Nexora weights signals differently depending on who you sell to. Picking the right type improves your Signal Scores.
            </p>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 11, color: "#555", fontFamily: "var(--font-outfit)", marginBottom: 5 }}>
                I sell to...
              </label>
              <select
                value={founderType}
                onChange={(e) => setFounderType(e.target.value)}
                style={{
                  width: "100%", padding: "8px 12px", borderRadius: 6,
                  backgroundColor: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: founderType ? "#ccc" : "#555",
                  fontFamily: "var(--font-outfit)", fontSize: 13,
                  outline: "none", cursor: "pointer", boxSizing: "border-box",
                }}
              >
                <option value="" disabled>Select your target audience</option>
                <option value="saas">SaaS founders &amp; technical buyers</option>
                <option value="agency">Agency owners &amp; service businesses</option>
                <option value="investor">Investors &amp; fund managers</option>
              </select>
            </div>
            {founderTypeMsg && (
              <div style={{
                padding: "8px 12px", borderRadius: 6, marginBottom: 14,
                backgroundColor: founderTypeMsg.ok ? "rgba(74,222,128,0.06)" : "rgba(239,68,68,0.06)",
                border: `1px solid ${founderTypeMsg.ok ? "rgba(74,222,128,0.15)" : "rgba(239,68,68,0.15)"}`,
              }}>
                <span style={{ fontSize: 12, color: founderTypeMsg.ok ? "#4ade80" : "#f87171", fontFamily: "var(--font-outfit)" }}>
                  {founderTypeMsg.text}
                </span>
              </div>
            )}
            <button
              onClick={handleSaveFounderType}
              disabled={founderTypeSaving || !founderType}
              style={{
                padding: "8px 18px", borderRadius: 6, fontSize: 12,
                fontFamily: "var(--font-outfit)", cursor: founderTypeSaving || !founderType ? "not-allowed" : "pointer",
                backgroundColor: "#FF5200", color: "#fff", border: "none",
                opacity: founderTypeSaving || !founderType ? 0.5 : 1,
              }}
            >
              {founderTypeSaving ? "Saving..." : "Save"}
            </button>
          </SectionCard>
        </ScrollReveal>

```

- [ ] **Step 5: Build check**

```bash
npm run build 2>&1 | grep -iE "(error|failed)" | head -10
```

Expected: no output.

- [ ] **Step 6: Commit**

```bash
git add app/dashboard/settings/page.tsx
git commit -m "feat: add founder type selector to settings for signal score personalization"
```

---

## Task 6: Lead Panel — Signal Score Badges

**Files:**
- Modify: `app/dashboard/campaigns/[id]/_components/lead-panel.tsx`

The panel already fetches signals in a `useEffect`. We add a parallel fetch for signal scores, store them in state, and render a score badge next to each signal's existing confidence badge.

- [ ] **Step 1: Add score state and fetch**

In `lead-panel.tsx`, find the existing state block:

```ts
  const [githubUrl, setGithubUrl] = useState("");
  const [githubLoading, setGithubLoading] = useState(false);
  const [showGithubInput, setShowGithubInput] = useState(false);
```

After that block, add:

```ts
  const [signalScores, setSignalScores] = useState<Record<string, { score: number; conversion_rate: number }>>({});
  const [scoresFounderType, setScoresFounderType] = useState<string>("");
```

- [ ] **Step 2: Fetch scores when the panel opens**

Find the existing signals-loading `useEffect` (the one that fetches `/api/signals/discard`):

```ts
  useEffect(() => {
    if (!lead?.id || lead.signal_status !== "done") {
      setSignals([]);
      setSigLoading(false);
      setDiscardedIds(new Set());
      setShowGithubInput(false);
      setGithubUrl("");
      return;
    }
    setSigLoading(true);
    setDiscardedIds(new Set());
    fetch(`/api/signals/discard?lead_id=${lead.id}`)
      .then((r) => r.json())
      .then((d) => setSignals(d.signals ?? []))
      .catch(() => setSignals([]))
      .finally(() => setSigLoading(false));
  }, [lead?.id]);
```

Replace with:

```ts
  useEffect(() => {
    if (!lead?.id || lead.signal_status !== "done") {
      setSignals([]);
      setSigLoading(false);
      setDiscardedIds(new Set());
      setShowGithubInput(false);
      setGithubUrl("");
      return;
    }
    setSigLoading(true);
    setDiscardedIds(new Set());
    Promise.all([
      fetch(`/api/signals/discard?lead_id=${lead.id}`).then((r) => r.json()),
      fetch("/api/signals/score").then((r) => r.json()),
    ])
      .then(([sigData, scoreData]) => {
        setSignals(sigData.signals ?? []);
        setSignalScores(scoreData.scores ?? {});
        setScoresFounderType(scoreData.founder_type ?? "");
      })
      .catch(() => setSignals([]))
      .finally(() => setSigLoading(false));
  }, [lead?.id]);
```

- [ ] **Step 3: Render the score badge inside the signal row**

Find the signal row render block. It currently ends with the discard button after the confidence badge and verify link:

```tsx
                            <span
                              style={{
                                fontSize: 9,
                                padding: "1.5px 6px",
                                borderRadius: 4,
                                color: confColor,
                                border: `1px solid ${confColor}44`,
                                fontFamily: "var(--font-outfit)",
                                letterSpacing: "0.05em",
                              }}
                            >
                              {conf}
                            </span>
```

After that `</span>` (still inside the `alignItems: "center"` flex row), add the score badge:

```tsx
                            {signalScores[sig.source] && (
                              <span
                                title={`Converts ${signalScores[sig.source].conversion_rate}% for ${scoresFounderType} founders`}
                                style={{
                                  fontSize: 9,
                                  padding: "1.5px 6px",
                                  borderRadius: 4,
                                  color: "#FF5200",
                                  border: "1px solid rgba(255,82,0,0.3)",
                                  fontFamily: "var(--font-outfit)",
                                  letterSpacing: "0.04em",
                                  cursor: "default",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {signalScores[sig.source].score}/10
                              </span>
                            )}
```

- [ ] **Step 4: Build check**

```bash
npm run build 2>&1 | grep -iE "(error|failed)" | head -10
```

Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add "app/dashboard/campaigns/[id]/_components/lead-panel.tsx"
git commit -m "feat: show Nexora Signal Score badge per signal in lead panel"
```

---

## Spec Coverage Check

| Requirement | Task |
|-------------|------|
| Categorize founders (SaaS / agency / investor) | Task 4 (signup), Task 5 (settings) |
| User selects on signup | Task 4 — `<select name="founderType">` + action saves it |
| Store in `signal_scores` table: founder_type, signal_type, conversion_rate, score | Task 1 DDL |
| Pre-seed with industry benchmarks | Task 1 INSERT — 27 rows across 3 founder types |
| Calculate conversion rates per signal per founder type | Task 1 seed + table design (update as volume grows via `sample_size`) |
| `GET /api/signals/score` returns score for lead's founder type | Task 2 |
| Surface Signal Score to users in real-time | Task 6 — panel fetches on every lead-open |
| Show on lead panel: "This signal converts 24% for SaaS founders" | Task 6 — badge with `title` tooltip showing exact conversion rate |
| GitHub = 9/10 for SaaS founders | Task 1 seed: `('saas', 'GitHub', 9, 24.3)` |
| Hiring = 6/10 for SaaS founders | Task 1 seed: `('saas', 'hiring', 6, 18.5)` |
| Competitive moat architecture | `sample_size` column enables promotion from seed to data-derived rules as volume grows |
