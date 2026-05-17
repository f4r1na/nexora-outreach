# Real Prospect Search Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace fake AI-generated prospect data with real data from the existing `/api/prospects/research` SSE endpoint, and surface source attribution, verification badges, and a "View Source" button on every prospect card.

**Architecture:** The backend (`lib/search/`, `app/api/prospects/research/route.ts`) already does real HTTP calls to GitHub, HackerNews, Crunchbase, Google News, LinkedIn Jobs, ProductHunt, Twitter. The only bug is the frontend: `research-overlay.tsx` calls `generateProspects()` (fake data generator in `prospect-data.ts`) instead of calling the SSE endpoint. Fix is: (1) wire the overlay to stream from the real endpoint, (2) adapt `ProspectResult` to the existing `Prospect` display type via a thin mapper, (3) add source badges + view-source + disclaimer to `results-summary.tsx`, (4) lower the confidence filter threshold from 5 to 3 so single-source results (GitHub/HN) are not silently discarded.

**Tech Stack:** Next.js 16 App Router, TypeScript, existing `ProspectResult` type in `lib/search/prospect-searcher.ts`, Framer Motion for existing UI animations.

---

## File Map

**Modify:**
- `app/api/prospects/research/route.ts:75` — lower `filterByConfidence(verified, 5)` threshold to 3
- `app/dashboard/_components/prospect-data.ts` — remove `generateProspects`, update `Prospect` type with source fields, add `toDisplayProspect` adapter
- `app/dashboard/_components/research-overlay.tsx` — remove fake-data call, stream real SSE, map results via `toDisplayProspect`
- `app/dashboard/_components/results-summary.tsx` — add source badges, view-source button, disclaimer, empty state, dynamic source breakdown

**No changes needed:**
- `lib/search/` — all source files already do real HTTP calls
- `app/dashboard/_components/command-bar-section.tsx` — uses `Prospect[]` type, no change needed

---

### Task 1: Lower confidence threshold in the API route

**Files:**
- Modify: `app/api/prospects/research/route.ts:75`

The current threshold of `5` filters out nearly all single-source results (GitHub scores ~4, HackerNews scores ~3). The spec says to show "Unverified" (1-source) prospects — threshold 3 passes them while still filtering empty/useless results.

- [ ] **Step 1: Edit the filter call**

In `app/api/prospects/research/route.ts`, find line 75:
```ts
const scored   = filterByConfidence(verified, 5);
```
Change to:
```ts
const scored   = filterByConfidence(verified, 3);
```

- [ ] **Step 2: Commit**

```bash
git add app/api/prospects/research/route.ts
git commit -m "fix: lower confidence threshold to 3 so single-source prospects aren't discarded"
```

---

### Task 2: Update `prospect-data.ts` — remove hallucination, add real-data adapter

**Files:**
- Modify: `app/dashboard/_components/prospect-data.ts`

Remove the `generateProspects` function (the hallucination engine). Add `toDisplayProspect` to map a `ProspectResult` (real API type) to a `Prospect` (display type). Extend `Prospect` with `sources`, `sourceUrls`, `verified`, `domain`.

- [ ] **Step 1: Replace the file contents entirely**

```ts
import type { ProspectResult } from "@/lib/search/prospect-searcher"

export type SignalType = "FUNDING" | "HIRING" | "LAUNCH" | "GROWTH"

export interface Prospect {
  id: string
  name: string
  company: string
  role: string
  confidence: number
  signal: SignalType
  signalDetail: string
  daysAgo: number
  // real-data fields
  sources: string[]
  sourceUrls: Record<string, string>
  verified: boolean
  domain?: string
}

export const SIGNAL_COLORS: Record<SignalType, string> = {
  FUNDING: "#f97316",
  HIRING: "#3b82f6",
  LAUNCH: "#22c55e",
  GROWTH: "#a855f7",
}

export function avgConfidence(prospects: Prospect[]): number {
  if (!prospects.length) return 0
  return Math.round((prospects.reduce((s, p) => s + p.confidence, 0) / prospects.length) * 10) / 10
}

export function signalCounts(prospects: Prospect[]): Record<SignalType, number> {
  const counts: Record<SignalType, number> = { FUNDING: 0, HIRING: 0, LAUNCH: 0, GROWTH: 0 }
  for (const p of prospects) counts[p.signal]++
  return counts
}

function inferSignal(p: ProspectResult): SignalType {
  const src = p.source
  if (src.includes("Crunchbase")) return "FUNDING"
  if (src.includes("ProductHunt")) return "LAUNCH"
  if (src.includes("HackerNews") || src.includes("LinkedInJobs")) return "HIRING"
  return "GROWTH"
}

function inferSignalDetail(p: ProspectResult): string {
  if (p.funding_amount) return `Raised ${p.funding_amount}${p.funding_stage ? ` (${p.funding_stage})` : ""}`
  if (p.news_signal) return p.news_signal.slice(0, 80)
  if (p.jobs_signal) return p.jobs_signal.slice(0, 80)
  return `Found on ${p.source}`
}

function daysAgoFrom(p: ProspectResult): number {
  const dates = [...(p.signal_dates ?? []), p.announced_on].filter(Boolean) as string[]
  const latest = dates.sort().at(-1)
  if (!latest) return 0
  return Math.max(0, Math.floor((Date.now() - new Date(latest).getTime()) / 86_400_000))
}

export function toDisplayProspect(p: ProspectResult, index: number): Prospect {
  const sources = p.source.split(" + ").map((s) => s.trim()).filter(Boolean)
  const sourceUrls: Record<string, string> = {}
  if (p._github_url) sourceUrls["GitHub"] = p._github_url
  if (p._hn_url) sourceUrls["HackerNews"] = p._hn_url
  if (p.producthunt_url) sourceUrls["ProductHunt"] = p.producthunt_url
  if (p.crunchbase_url) sourceUrls["Crunchbase"] = p.crunchbase_url
  if (p.linkedin_url) sourceUrls["LinkedIn"] = p.linkedin_url
  if (p.twitter_url) sourceUrls["Twitter"] = p.twitter_url

  return {
    id: `p-${index}`,
    name: p.name ?? p.company ?? "Unknown",
    company: p.company ?? p.domain ?? "",
    role: p.role ?? "",
    confidence: p.confidence ?? 0,
    signal: inferSignal(p),
    signalDetail: inferSignalDetail(p),
    daysAgo: daysAgoFrom(p),
    sources,
    sourceUrls,
    verified: sources.length >= 2 || (p.website_verified ?? false),
    domain: p.domain,
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/dashboard/_components/prospect-data.ts
git commit -m "refactor: remove generateProspects hallucination, add toDisplayProspect adapter for real API data"
```

---

### Task 3: Wire `research-overlay.tsx` to the real SSE API

**Files:**
- Modify: `app/dashboard/_components/research-overlay.tsx`

Remove the `generateProspects` call and fake timers. Instead: POST to `/api/prospects/research`, parse the SSE stream, drive terminal lines from `progress` events, populate cards from the `result` event, call `onComplete` on the `done` event.

- [ ] **Step 1: Replace the file contents entirely**

```tsx
"use client"

import { useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useState } from "react"
import { Prospect, SIGNAL_COLORS, toDisplayProspect } from "./prospect-data"
import type { ProspectResult } from "@/lib/search/prospect-searcher"

const EASE = [0.4, 0, 0.2, 1] as const

interface TerminalLine {
  text: string
  done: boolean
}

interface ResearchOverlayProps {
  query: string
  onComplete: (prospects: Prospect[]) => void
}

export function ResearchOverlay({ query, onComplete }: ResearchOverlayProps) {
  const [lines, setLines] = useState<TerminalLine[]>([])
  const [cards, setCards] = useState<Prospect[]>([])
  const [progress, setProgress] = useState(0)
  const [statusText, setStatusText] = useState("Scanning...")
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  useEffect(() => {
    let cancelled = false

    async function run() {
      const addLine = (text: string, done = false) => {
        if (cancelled) return
        setLines((prev) => [...prev, { text, done }])
      }

      addLine("→ Parsing your request...")

      let response: Response
      try {
        response = await fetch("/api/prospects/research", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
        })
      } catch {
        addLine("[ERROR] Network error — could not reach research agent", true)
        setTimeout(() => { if (!cancelled) onCompleteRef.current([]) }, 2000)
        return
      }

      if (!response.ok) {
        addLine(`[ERROR] Research agent returned ${response.status}`, true)
        setTimeout(() => { if (!cancelled) onCompleteRef.current([]) }, 2000)
        return
      }

      addLine("→ Agent connected — querying sources in parallel...")

      const reader = response.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ""
      let sourcesDone = 0
      const TOTAL_SOURCES = 8

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        const parts = buffer.split("\n\n")
        buffer = parts.pop() ?? ""

        for (const chunk of parts) {
          const line = chunk.trim()
          if (!line.startsWith("data: ")) continue
          let event: { type: string; source?: string; found?: number; prospects?: ProspectResult[]; stats?: { total: number; avg_confidence: number } }
          try { event = JSON.parse(line.slice(6)) } catch { continue }

          if (cancelled) return

          if (event.type === "progress") {
            sourcesDone++
            const pct = Math.round((sourcesDone / TOTAL_SOURCES) * 80)
            setProgress(pct)
            const label = event.found === 0
              ? `→ ${event.source}: no results`
              : `→ ${event.source}: ${event.found} found`
            addLine(label)
          }

          if (event.type === "result" && event.prospects) {
            const mapped = event.prospects.map((p, i) => toDisplayProspect(p, i))
            setCards(mapped)
            setProgress(95)
            addLine(`→ Cross-referencing and scoring confidence...`)
          }

          if (event.type === "done" && event.stats) {
            const { total, avg_confidence } = event.stats
            setProgress(100)
            if (total === 0) {
              addLine("[COMPLETE] No prospects found matching your criteria", true)
              setStatusText("0 prospects found")
            } else {
              addLine(`[COMPLETE] ${total} verified prospects · avg score ${avg_confidence}/10`, true)
              setStatusText(`${total} prospects found`)
            }
            setTimeout(() => {
              if (!cancelled) {
                const final = cards.length > 0 ? cards : []
                onCompleteRef.current(final)
              }
            }, 1200)
          }
        }
      }
    }

    run()
    return () => { cancelled = true }
  }, [query])

  return (
    <motion.div
      initial={{ y: "100%", opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: "100%", opacity: 0 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      style={{
        position: "fixed", inset: 0, zIndex: 50,
        backgroundColor: "#060606",
        display: "flex", flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px 32px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#22c55e", animation: "green-pulse 2s ease-in-out infinite" }} />
          <span style={{ fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.7)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Nexora Research Agent
          </span>
        </div>
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
          {progress === 100 ? statusText : "Scanning..."}
        </span>
      </div>

      {/* Body: split layout */}
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", overflow: "hidden" }}>
        {/* Terminal */}
        <div style={{
          padding: "24px 28px",
          borderRight: "1px solid rgba(255,255,255,0.05)",
          overflowY: "auto",
          fontFamily: "var(--font-mono)",
        }}>
          <AnimatePresence>
            {lines.map((line, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, ease: EASE }}
                style={{
                  fontSize: 12.5,
                  color: line.done || line.text.startsWith("[COMPLETE]") ? "#22c55e" : "rgba(255,255,255,0.65)",
                  marginBottom: 6,
                  lineHeight: 1.5,
                }}
              >
                {line.text}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Prospect cards */}
        <div style={{ padding: "24px 28px", overflowY: "auto" }}>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>
            Live Prospects
          </p>
          {cards.length === 0 && (
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", fontStyle: "italic" }}>
              Waiting for results...
            </p>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <AnimatePresence>
              {cards.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, ease: EASE, delay: i * 0.04 }}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "10px 14px",
                    backgroundColor: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 10,
                  }}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: "50%",
                    background: "linear-gradient(135deg, #FF5200, #F59E0B)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 13, fontWeight: 500, color: "#fff", flexShrink: 0,
                  }}>
                    {(p.name[0] ?? "?").toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: "#fff", marginBottom: 2 }}>{p.name}</p>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {p.company}{p.role ? ` · ${p.role}` : ""}
                    </p>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                    <div style={{
                      fontSize: 10, fontWeight: 500,
                      color: SIGNAL_COLORS[p.signal],
                      backgroundColor: `${SIGNAL_COLORS[p.signal]}18`,
                      padding: "2px 7px", borderRadius: 4,
                    }}>
                      {p.signal}
                    </div>
                    <span style={{
                      fontSize: 11,
                      color: p.confidence >= 8 ? "#22c55e" : p.confidence >= 6 ? "#eab308" : "rgba(255,255,255,0.4)",
                    }}>
                      {p.confidence}/10
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 3, backgroundColor: "rgba(255,255,255,0.06)" }}>
        <motion.div
          style={{ height: "100%", backgroundColor: "#f97316" }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "linear" }}
        />
      </div>
    </motion.div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors in this file

- [ ] **Step 3: Commit**

```bash
git add app/dashboard/_components/research-overlay.tsx
git commit -m "fix: wire research overlay to real SSE API, remove generateProspects hallucination"
```

---

### Task 4: Update `results-summary.tsx` — source badges, view source, disclaimer, real source counts, empty state

**Files:**
- Modify: `app/dashboard/_components/results-summary.tsx`

Changes:
1. Add source tag badges per prospect card (e.g. `[GitHub]`, `[HackerNews]`)
2. Add verified/unverified badge
3. Add "View Source" button that opens the first available source URL
4. Add disclaimer at the top of the results
5. Compute source breakdown from real data (not hardcoded fractions)
6. Compute unique source count dynamically for the stats row
7. Show "No prospects found" message for empty results

- [ ] **Step 1: Update the source breakdown and stats to use real data**

In `results-summary.tsx`, find the hardcoded `sources` array (around line 40-44):
```ts
  const sources = [
    { name: "GitHub", count: Math.floor(visible.length * 0.4) },
    { name: "HackerNews", count: Math.floor(visible.length * 0.3) },
    { name: "ProductHunt", count: Math.ceil(visible.length * 0.3) },
  ]
  const maxSource = Math.max(...sources.map(s => s.count), 1)
```
Replace with:
```ts
  const sourceCounts = visible
    .flatMap((p) => p.sources)
    .reduce((acc, s) => ({ ...acc, [s]: (acc[s] ?? 0) + 1 }), {} as Record<string, number>)
  const sources = Object.entries(sourceCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }))
  const maxSource = Math.max(...sources.map((s) => s.count), 1)
  const uniqueSourceCount = Object.keys(sourceCounts).length
```

- [ ] **Step 2: Update the stats row "Sources" value from hardcoded `3` to `uniqueSourceCount`**

Find:
```ts
            { label: "Sources", value: 3 },
```
Replace with:
```ts
            { label: "Sources", value: uniqueSourceCount },
```

- [ ] **Step 3: Add disclaimer below the header `<motion.div>` block**

After the header motion.div (the one containing `<h1>Found {visible.length} verified prospects</h1>`), add:
```tsx
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 6 }}>
          These prospects were found via public sources. Verify before reaching out.
        </p>
```

So the full header block becomes:
```tsx
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE }}
        >
          <h1 style={{ fontSize: 28, fontWeight: 500, color: "#fff", marginBottom: 6 }}>
            Found {visible.length} verified prospects
          </h1>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)" }}>
            Avg confidence: {avg}/10 · Est. reply rate: ~{estReplyRate}%
          </p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 6 }}>
            These prospects were found via public sources. Verify before reaching out.
          </p>
        </motion.div>
```

- [ ] **Step 4: Add empty state before the prospect grid**

Find the `{/* Prospect grid */}` comment and its wrapping `<div>`. Before the `<AnimatePresence>`, add:
```tsx
          {visible.length === 0 && (
            <div style={{
              gridColumn: "1 / -1", padding: "48px 0",
              textAlign: "center", color: "rgba(255,255,255,0.35)", fontSize: 14,
            }}>
              No prospects found matching your criteria.
            </div>
          )}
```

- [ ] **Step 5: Add source badges + verified badge + view-source to each prospect card**

Find the prospect card's bottom row (the one with signal badge and confidence score):
```tsx
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{
                  fontSize: 10, fontWeight: 500,
                  color: SIGNAL_COLORS[p.signal],
                  backgroundColor: `${SIGNAL_COLORS[p.signal]}18`,
                  padding: "2px 8px", borderRadius: 4,
                }}>
                  {p.signal}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{
                    fontSize: 12, fontWeight: 500,
                    color: p.confidence >= 8 ? "#22c55e" : p.confidence >= 6 ? "#eab308" : "rgba(255,255,255,0.35)",
                  }}>
                    {p.confidence}/10
                  </span>
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{p.daysAgo}d ago</span>
                </div>
              </div>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 6 }}>{p.signalDetail}</p>
```

Replace with:
```tsx
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{
                  fontSize: 10, fontWeight: 500,
                  color: SIGNAL_COLORS[p.signal],
                  backgroundColor: `${SIGNAL_COLORS[p.signal]}18`,
                  padding: "2px 8px", borderRadius: 4,
                }}>
                  {p.signal}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{
                    fontSize: 12, fontWeight: 500,
                    color: p.confidence >= 8 ? "#22c55e" : p.confidence >= 6 ? "#eab308" : "rgba(255,255,255,0.35)",
                  }}>
                    {p.confidence}/10
                  </span>
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{p.daysAgo}d ago</span>
                </div>
              </div>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 6 }}>{p.signalDetail}</p>

              {/* Source badges row */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                <span style={{
                  fontSize: 10,
                  color: p.verified ? "#22c55e" : "rgba(255,255,255,0.35)",
                  border: `1px solid ${p.verified ? "rgba(34,197,94,0.3)" : "rgba(255,255,255,0.12)"}`,
                  borderRadius: 4, padding: "1px 6px",
                }}>
                  {p.verified ? "Verified" : "Unverified"}
                </span>
                {p.sources.map((s) => (
                  <span key={s} style={{
                    fontSize: 10, color: "rgba(255,255,255,0.4)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 4, padding: "1px 6px",
                  }}>
                    {s}
                  </span>
                ))}
                {Object.values(p.sourceUrls).length > 0 && (
                  <a
                    href={Object.values(p.sourceUrls)[0]}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      marginLeft: "auto", fontSize: 10,
                      color: "rgba(255,255,255,0.4)",
                      textDecoration: "none",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 4, padding: "1px 6px",
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    View Source
                  </a>
                )}
              </div>
```

- [ ] **Step 6: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 7: Commit**

```bash
git add app/dashboard/_components/results-summary.tsx
git commit -m "feat: add source badges, verified status, view-source button, disclaimer to prospect cards"
```

---

### Task 5: Full build check and push

**Files:** None modified

- [ ] **Step 1: Run production build**

```bash
npm run build
```
Expected: Compiled successfully with no TypeScript errors.

If errors appear:
- `Property 'sources' does not exist on type 'Prospect'` → The old `prospect-data.ts` wasn't saved correctly. Check the file.
- `Cannot find module './prospect-data'` → Check imports in `research-overlay.tsx` and `results-summary.tsx`.
- `generateProspects is not exported` → Some file still imports it. Search: `grep -r "generateProspects" app/`

- [ ] **Step 2: Push to main**

```bash
git push origin main
```

---

## Self-Review

**Spec coverage:**

| Requirement | Task |
|---|---|
| Remove AI-hallucinated prospects | Task 2 (remove generateProspects) + Task 3 (wire SSE) |
| Real GitHub API call | Already implemented in lib/search/sources/github-search.ts |
| Real HackerNews API call | Already implemented in lib/search/sources/hackernews-search.ts |
| Real SerpAPI for Google News | Already implemented in lib/search/sources/google-news.ts |
| Real SerpAPI for LinkedIn Jobs | Already implemented in lib/search/sources/linkedin-jobs.ts |
| Real ProductHunt API call | Already implemented in lib/search/sources/producthunt.ts |
| Cross-reference results | Already implemented in lib/search/cross-reference.ts |
| Score confidence, filter | Already implemented, threshold lowered in Task 1 |
| Source URL per prospect | Task 2 (sourceUrls in toDisplayProspect) |
| Verified/Unverified badge | Task 4, Step 5 |
| Source tags on each card | Task 4, Step 5 |
| View Source button | Task 4, Step 5 |
| 0 results empty state | Task 4, Step 4 + overlay done event handler |
| Disclaimer on results | Task 4, Step 3 |

**No gaps found.**

**Placeholder scan:** None — all steps have actual code.

**Type consistency:**
- `Prospect` gains `sources: string[]`, `sourceUrls: Record<string, string>`, `verified: boolean`, `domain?: string` in Task 2
- `results-summary.tsx` uses `p.sources`, `p.sourceUrls`, `p.verified` in Task 4 — these match Task 2 exactly
- `toDisplayProspect` returns a `Prospect` — all required fields populated
- `research-overlay.tsx` imports `toDisplayProspect` and `Prospect` from `./prospect-data` — matches Task 2 exports
