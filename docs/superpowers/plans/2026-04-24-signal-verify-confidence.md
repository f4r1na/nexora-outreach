# Signal Verify + Confidence Scoring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a [Verify] button (opens source URL), confidence badge (HIGH/MEDIUM/LOW from AI strength + date decay), and per-signal [✕] discard (persisted to DB) to every signal in the LeadPanel.

**Architecture:** Update the `Signal` type to include `source_url` and `date_iso` fields. Update the AI prompt in `/api/leads/intelligence` to output these fields. Create `PATCH /api/leads/[id]/signals/discard` to persist discarded signal keys. Modify `LeadPanel` to filter discarded signals, compute confidence, and render the new UI.

**Tech Stack:** Next.js 15 App Router, Supabase (RLS-scoped client for ownership check, admin client for write), TypeScript, React, Claude Haiku

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `app/dashboard/campaigns/[id]/_components/lead-panel.tsx` | Modify | Signal/SignalData types, confidence helpers, discard state, UI |
| `app/api/leads/intelligence/route.ts` | Modify | Signal type, AI prompt (add source_url + date_iso), signal parsing |
| `app/api/leads/[id]/signals/discard/route.ts` | Create | PATCH endpoint - push key to signal_data.discarded |

---

## Task 1: Update type definitions

**Files:**
- Modify: `app/dashboard/campaigns/[id]/_components/lead-panel.tsx:18-38`
- Modify: `app/api/leads/intelligence/route.ts:10-31`

These two files each define their own local `Signal` and `SignalData` types. Update both.

- [ ] **Step 1: Update Signal and SignalData types in lead-panel.tsx**

Find lines 18-38 (the `Signal`, `CompanyIntel`, and `SignalData` type definitions). Replace with:

```ts
export type Signal = {
  type: string;
  text: string;
  source: string;
  source_url: string;
  date: string;
  date_iso: string;
  strength: string;
};

export type CompanyIntel = {
  industry: string;
  size: string;
  description: string;
  funding_stage: string;
  website: string;
};

export type SignalData = {
  signals: Signal[];
  intelligence_score: number;
  last_updated: string;
  company_intel: CompanyIntel;
  discarded: string[];
};
```

- [ ] **Step 2: Update Signal and SignalData types in intelligence/route.ts**

Find lines 10-31 (the local `Signal`, `CompanyIntel`, `SignalData` type definitions). Replace with:

```ts
type Signal = {
  type: string;
  text: string;
  source: string;
  source_url: string;
  date: string;
  date_iso: string;
  strength: "high" | "medium" | "low";
};

type CompanyIntel = {
  industry: string;
  size: string;
  description: string;
  funding_stage: string;
  website: string;
};

type SignalData = {
  signals: Signal[];
  intelligence_score: number;
  last_updated: string;
  company_intel: CompanyIntel;
  discarded: string[];
};
```

- [ ] **Step 3: Build check**

```bash
npm run build
```

Expected: TypeScript errors on `source_url` and `date_iso` missing from prompt parsing — these will be fixed in Task 2. If you see only those errors, types are correct. Any other errors must be fixed before continuing.

- [ ] **Step 4: Commit**

```bash
git add "app/dashboard/campaigns/[id]/_components/lead-panel.tsx" app/api/leads/intelligence/route.ts
git commit -m "types: add source_url, date_iso to Signal; add discarded to SignalData"
```

---

## Task 2: Update AI prompt and signal parsing

**Files:**
- Modify: `app/api/leads/intelligence/route.ts:45-103`

The `generateSignals` function contains the AI prompt and the signal parsing logic. We need to:
1. Update the prompt to request `source_url` and `date_iso` per signal
2. Update the parsing to populate these new fields with safe fallbacks

- [ ] **Step 1: Replace the generateSignals function**

Find the entire `generateSignals` function (lines 41-103) and replace it:

```ts
async function generateSignals(
  client: Anthropic,
  lead: LeadInput
): Promise<SignalData> {
  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 800,
    messages: [
      {
        role: "user",
        content: `You are a B2B sales intelligence tool. Generate realistic signals for this lead.

Lead: ${lead.first_name}, ${lead.role} at ${lead.company}
Known challenge: ${lead.custom_note}

Return ONLY valid JSON:
{
  "signals": [
    {
      "type": "hiring|funding|news|pain_point|activity",
      "text": "specific 8-15 word signal",
      "source": "Source name (e.g. LinkedIn, TechCrunch, Crunchbase)",
      "source_url": "https://... direct URL to article or post (empty string if unknown)",
      "date": "X days ago|X weeks ago|X months ago",
      "date_iso": "YYYY-MM-DD (best estimate of publication date)",
      "strength": "high|medium|low"
    }
  ],
  "intelligence_score": 70-95,
  "company_intel": {
    "industry": "string",
    "size": "X-Y employees",
    "description": "one sentence about what they do",
    "funding_stage": "string or empty string",
    "website": "plausible domain"
  }
}

Rules:
- Exactly 2-3 signals, all specific and plausible
- At least one signal must reference: "${lead.custom_note}"
- Signals must fit a ${lead.role} at a company called ${lead.company}
- Never fabricate specific dollar amounts for funding; use ranges like "$2-5M"
- source_url should be a realistic URL for the source, or empty string if you cannot construct one
- date_iso must be a valid YYYY-MM-DD date (use today minus the relative date as best estimate)
- No emojis or markdown`,
      },
    ],
  });

  const text =
    msg.content[0].type === "text" ? msg.content[0].text : "{}";
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON");
  const parsed = JSON.parse(match[0]);

  const today = new Date().toISOString().slice(0, 10);

  const signals: Signal[] = Array.isArray(parsed.signals)
    ? parsed.signals.slice(0, 3).map((s: Record<string, unknown>) => ({
        type: String(s.type ?? "news"),
        text: String(s.text ?? ""),
        source: String(s.source ?? "Web"),
        source_url: typeof s.source_url === "string" ? s.source_url : "",
        date: String(s.date ?? "recently"),
        date_iso: typeof s.date_iso === "string" && s.date_iso.match(/^\d{4}-\d{2}-\d{2}$/)
          ? s.date_iso
          : today,
        strength: (["high", "medium", "low"].includes(String(s.strength))
          ? s.strength
          : "medium") as "high" | "medium" | "low",
      }))
    : [];

  return {
    signals,
    intelligence_score: Number(parsed.intelligence_score) || 72,
    last_updated: new Date().toISOString(),
    discarded: [],
    company_intel: {
      industry: parsed.company_intel?.industry ?? "Technology",
      size: parsed.company_intel?.size ?? "10-50 employees",
      description:
        parsed.company_intel?.description ??
        `${lead.company} helps businesses grow.`,
      funding_stage: parsed.company_intel?.funding_stage ?? "",
      website:
        parsed.company_intel?.website ??
        `${lead.company.toLowerCase().replace(/[^a-z0-9]/g, "")}.com`,
    },
  };
}
```

- [ ] **Step 2: Build check**

```bash
npm run build
```

Expected: Clean build. No TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add app/api/leads/intelligence/route.ts
git commit -m "feat: update intelligence prompt to output source_url and date_iso per signal"
```

---

## Task 3: Create discard API route

**Files:**
- Create: `app/api/leads/[id]/signals/discard/route.ts`

PATCH endpoint. Uses the RLS-scoped client to verify ownership (RLS on leads ensures the user can only read their own leads), then uses the admin client to write the updated `signal_data`.

- [ ] **Step 1: Create the directory and file**

```bash
mkdir -p "app/api/leads/[id]/signals/discard"
```

Then create `app/api/leads/[id]/signals/discard/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Props) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let key: string;
  try {
    const body = await req.json();
    if (!body.key || typeof body.key !== "string") throw new Error();
    key = body.key;
  } catch {
    return NextResponse.json({ error: "key required" }, { status: 400 });
  }

  // RLS verifies ownership - will return null if lead doesn't belong to user
  const { data: lead } = await supabase
    .from("leads")
    .select("id, signal_data")
    .eq("id", id)
    .single();

  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const signalData = (lead.signal_data as Record<string, unknown>) ?? {};
  const existing = Array.isArray(signalData.discarded)
    ? (signalData.discarded as string[])
    : [];
  const updated = [...new Set([...existing, key])];

  const db = createAdminClient();
  const { error } = await db
    .from("leads")
    .update({ signal_data: { ...signalData, discarded: updated } })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Build check**

```bash
npm run build
```

Expected: Clean build.

- [ ] **Step 3: Test manually**

Start dev server (`npm run dev`). Open a campaign with leads that have signal data. In the browser console:

```js
fetch('/api/leads/YOUR_LEAD_ID/signals/discard', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ key: 'test-key-123' })
}).then(r => r.json()).then(console.log)
```

Expected: `{ ok: true }`. Check Supabase Table Editor - the lead's `signal_data` should now have `discarded: ["test-key-123"]`.

- [ ] **Step 4: Commit**

```bash
git add "app/api/leads/[id]/signals/discard/route.ts"
git commit -m "feat: PATCH /api/leads/[id]/signals/discard - persist discarded signal keys"
```

---

## Task 4: Update LeadPanel UI

**Files:**
- Modify: `app/dashboard/campaigns/[id]/_components/lead-panel.tsx`

This is the largest change. We add:
1. `signalKey` helper (djb2 hash of signal text)
2. `getConfidence` function (AI strength + date decay)
3. `localDiscarded` state (initialized from `signal_data.discarded`, reset on lead change)
4. `handleDiscard` function (optimistic update + fire-and-forget API call)
5. Updated signal render loop (filter discarded, show confidence badge + verify button + discard button)

- [ ] **Step 1: Add signalKey and getConfidence helpers**

After the `isStale` function (line 74), add these two helpers:

```ts
function signalKey(text: string): string {
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h) ^ text.charCodeAt(i);
  return String(h >>> 0);
}

function getConfidence(sig: Signal): { label: "HIGH" | "MEDIUM" | "LOW"; color: string } {
  const base = sig.strength === "high" ? 3 : sig.strength === "medium" ? 2 : 1;
  const days = sig.date_iso
    ? (Date.now() - new Date(sig.date_iso).getTime()) / 86_400_000
    : 90;
  const decay = days < 30 ? 0 : days < 90 ? 1 : 2;
  const score = base - decay;
  if (score >= 3) return { label: "HIGH", color: "#4ade80" };
  if (score >= 1) return { label: "MEDIUM", color: "#F59E0B" };
  return { label: "LOW", color: "#555" };
}
```

- [ ] **Step 2: Add localDiscarded state and handleDiscard**

Inside the `LeadPanel` component, after the existing `const [refreshing, setRefreshing] = useState(false);` line, add:

```ts
const [localDiscarded, setLocalDiscarded] = useState<Set<string>>(
  new Set(lead?.signal_data?.discarded ?? [])
);
```

After the existing `useEffect` that resets state on `lead?.id` change (the one at line ~129 that sets `subject`, `body`, `editingEmail`, `copied`), add a new effect:

```ts
useEffect(() => {
  setLocalDiscarded(new Set(lead?.signal_data?.discarded ?? []));
}, [lead?.id]);
```

After the `handleRefreshIntel` function, add:

```ts
const handleDiscard = (sig: Signal) => {
  if (!lead) return;
  const key = signalKey(sig.text);
  setLocalDiscarded((prev) => new Set([...prev, key]));
  fetch(`/api/leads/${lead.id}/signals/discard`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key }),
  }).catch(() => {});
};
```

- [ ] **Step 3: Update visibleSignals computation**

Find the existing line:
```ts
const signals = lead?.signal_data?.signals ?? [];
```

Replace it with:
```ts
const signals = lead?.signal_data?.signals ?? [];
const visibleSignals = signals.filter((s) => !localDiscarded.has(signalKey(s.text)));
```

- [ ] **Step 4: Replace the signal render loop**

Find the existing signal render block (inside `signals.length > 0 ? (` branch, starting at line ~586):

```tsx
signals.length > 0 ? (
  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
    {signals.map((sig, i) => (
      <div key={i}>
        <p ...>{sig.text}</p>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span ...>{sig.source}</span>
          <span ...>{sig.date}</span>
        </div>
      </div>
    ))}
  </div>
) : (
```

Replace with:

```tsx
visibleSignals.length > 0 ? (
  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
    {visibleSignals.map((sig, i) => {
      const conf = getConfidence(sig);
      return (
        <div key={i} style={{ position: "relative", paddingRight: 22 }}>
          <button
            onClick={() => handleDiscard(sig)}
            title="Discard signal"
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 18,
              height: 18,
              borderRadius: 4,
              border: "none",
              backgroundColor: "transparent",
              color: "#3a3a4a",
              cursor: "pointer",
              padding: 0,
              fontSize: 11,
              lineHeight: 1,
            }}
            aria-label="Discard signal"
          >
            ✕
          </button>
          <p
            style={{
              fontSize: 12.5,
              color: "#aaa",
              fontFamily: "var(--font-outfit)",
              lineHeight: 1.5,
              marginBottom: 5,
            }}
          >
            {sig.text}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span
              style={{
                fontSize: 9.5,
                padding: "1.5px 7px",
                borderRadius: 4,
                backgroundColor: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.07)",
                color: "#555",
                fontFamily: "var(--font-outfit)",
              }}
            >
              {sig.source}
            </span>
            <span
              style={{
                fontSize: 10,
                color: "#3a3a4a",
                fontFamily: "var(--font-outfit)",
              }}
            >
              {sig.date}
            </span>
            <span
              style={{
                fontSize: 9,
                padding: "1.5px 6px",
                borderRadius: 4,
                backgroundColor: `${conf.color}14`,
                border: `1px solid ${conf.color}33`,
                color: conf.color,
                fontFamily: "var(--font-outfit)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                fontWeight: 600,
              }}
            >
              {conf.label}
            </span>
            {sig.source_url && (
              <a
                href={sig.source_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 3,
                  fontSize: 9.5,
                  color: "#555",
                  fontFamily: "var(--font-outfit)",
                  textDecoration: "none",
                  padding: "1.5px 7px",
                  borderRadius: 4,
                  border: "1px solid rgba(255,255,255,0.07)",
                  backgroundColor: "rgba(255,255,255,0.02)",
                  transition: "color 0.14s",
                }}
              >
                ↗ Verify
              </a>
            )}
          </div>
        </div>
      );
    })}
  </div>
) : (
```

Note: the `signals.length > 0` condition at the top of the ternary also needs updating. Find this line:

```ts
} : signals.length > 0 ? (
```

And change it to:

```ts
} : visibleSignals.length > 0 ? (
```

- [ ] **Step 5: Build check**

```bash
npm run build
```

Expected: Clean build, zero TypeScript errors.

- [ ] **Step 6: Manual smoke test**

```bash
npm run dev
```

Open a campaign with leads that have `signal_status = "done"` and `signal_data`. Open a lead in the panel. Verify:

1. Each signal shows a confidence badge (HIGH/MEDIUM/LOW) with correct color
2. If the signal has a `source_url`, a `↗ Verify` link appears and opens the URL in a new tab
3. Clicking `✕` removes the signal from view immediately (optimistic)
4. Refreshing the page: if the `PATCH` succeeded, the discarded signal stays hidden
5. After discarding all signals for a lead, the "Find signals" button appears

Note: Existing leads in DB will have `source_url: undefined` and `date_iso: undefined` since they were generated before this change. For those, confidence will show "MEDIUM" (fallback: unknown date = 90 days, strength defaults to 1 → score -1 → LOW actually - but the `strength` field exists with real values so confidence = strength only degraded by date 90 = base - 2). The [Verify] button will be hidden for them. To get proper data, click "Refresh intel" on a lead to regenerate with the new prompt.

- [ ] **Step 7: Commit**

```bash
git add "app/dashboard/campaigns/[id]/_components/lead-panel.tsx"
git commit -m "feat: signal verify button, confidence badge, and per-signal discard"
```
