# Signal Verify + Confidence Scoring Design

**Date:** 2026-04-24
**Status:** Approved

## Overview

Add a [Verify] button and confidence score (HIGH/MEDIUM/LOW) to each signal in the LeadPanel. Users can discard individual signals (persisted to DB). Confidence combines AI-provided strength with date decay.

## User Flow

1. User opens a lead in the LeadPanel
2. Each signal row shows: text, source name chip, confidence badge (HIGH/MEDIUM/LOW), [Verify] button, [✕] discard button
3. Clicking [Verify] opens `sig.source_url` in a new tab
4. Clicking [✕] removes the signal optimistically, persists discard to DB
5. If all signals discarded, the "Find signals" button is shown (existing behavior)

## Data Model

### Signal type (lead-panel.tsx)

```ts
export type Signal = {
  type: string;
  text: string;
  source: string;      // display name: "TechCrunch"
  source_url: string;  // actual URL: "https://techcrunch.com/..."
  date: string;        // display string: "Jan 2024"
  date_iso: string;    // ISO date for math: "2024-01-15"
  strength: string;    // "high" | "medium" | "low" — from AI
};
```

### SignalData type (lead-panel.tsx)

```ts
export type SignalData = {
  signals: Signal[];
  intelligence_score: number;
  last_updated: string;
  company_intel: CompanyIntel;
  discarded: string[];  // stable signal keys (MD5-free hash of sig.text)
};
```

Discard keys use a simple djb2 hash of `sig.text` — stable across re-renders, survives signal reordering.

## Confidence Scoring Formula

```ts
function getConfidence(sig: Signal): "HIGH" | "MEDIUM" | "LOW" {
  const base = sig.strength === "high" ? 3 : sig.strength === "medium" ? 2 : 1;
  const days = sig.date_iso
    ? (Date.now() - new Date(sig.date_iso).getTime()) / 86_400_000
    : 90;
  const decay = days < 30 ? 0 : days < 90 ? 1 : 2;
  const score = base - decay;
  if (score >= 3) return "HIGH";
  if (score >= 1) return "MEDIUM";
  return "LOW";
}
```

Display:
- HIGH: `#4ade80` (green)
- MEDIUM: `#F59E0B` (amber)
- LOW: `#555` (muted)

## API Changes

### Prompt update (two routes)

Both `/api/leads/intelligence` route and the cron's `researchLead` function must update the signal JSON schema to require `source_url` and `date_iso` per signal:

```
Each signal object must include:
- "source_url": the direct URL to the source article/post/page (empty string if not available)
- "date_iso": the publication date in ISO 8601 format (YYYY-MM-DD), best estimate if exact date unknown
```

### New route: PATCH /api/leads/[id]/signals/discard

**File:** `app/api/leads/[id]/signals/discard/route.ts`

Body: `{ key: string }`

Steps:
1. Auth check
2. Fetch lead, verify `campaign_id` belongs to a campaign owned by `user.id`
3. Load `signal_data` JSON
4. Push `key` into `signal_data.discarded` (dedup with Set)
5. Update lead row with new `signal_data`

No new DB columns needed — `signal_data` is an existing JSON column.

## UI Changes (lead-panel.tsx)

### Signal key helper

```ts
function signalKey(text: string): string {
  // djb2 hash — stable, no crypto needed
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h) ^ text.charCodeAt(i);
  return String(h >>> 0);
}
```

### Filter discarded signals before render

```ts
const discarded = new Set(lead.signal_data?.discarded ?? []);
const visibleSignals = signals.filter(s => !discarded.has(signalKey(s.text)));
```

### Per-signal row additions

Each signal row gains three elements inline with the existing source chip + date:

1. **Confidence badge** — `HIGH` / `MEDIUM` / `LOW` pill, 9px, color per formula
2. **[↗ Verify]** — ghost button, opens `sig.source_url` in new tab; hidden if `source_url` is empty or not a valid URL
3. **[✕] Discard** — icon button, far right; calls discard API optimistically

### Discard state

`LeadPanel` adds local state: `discardedKeys: Set<string>` (starts from `signal_data.discarded`). On discard click: add key to local set immediately (optimistic), fire `PATCH` in background. No loading state — fire-and-forget with silent failure.

When `visibleSignals.length === 0`: show the existing "Find signals" button (no change needed to that code path).

## Scope Boundaries

- Email generation is not affected
- "Find signals" / "Refresh intel" behavior is unchanged
- No bulk discard or undo
- `source_url` gracefully degrades: if AI returns empty string, [Verify] button is hidden
