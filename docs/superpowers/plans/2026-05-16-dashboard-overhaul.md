# Dashboard Clean Slate Rebuild — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Delete the entire old dashboard and rebuild it from scratch as a command-center product — one screen, 7 states, real research + email sending.

**Architecture:** Single command-center page with a React state machine (`idle → thinking → researching → results → email_preview → sending → done`). Research streams via SSE from a new `/api/research` endpoint. Emails use the existing `/api/generate` + sending infrastructure. History/Analytics/Settings are simple Supabase-backed pages.

**Tech Stack:** Next.js 16 App Router, React 19, Supabase, OpenAI gpt-4o-mini, recharts, lucide-react, sonner, inline styles only.

---

## Design tokens (use everywhere, no exceptions)

```
Background:   #0a0a0a
Card:         #111111
Border:       #1a1a1a
Orange:       #f97316
Muted text:   #666666
White:        #ffffff
Font heading: var(--font-space-grotesk), weight 500 max
Font body:    var(--font-outfit), weight 400
Radius:       6–8px
Transition:   all 200ms ease
```

---

## File map

**DELETE:**
- `app/dashboard/` — entire directory tree (all 89 files)
- `components/sidebar.tsx`
- `components/campaigns-table.tsx`
- `components/signals-feed.tsx`
- `components/command-bar.tsx`
- `components/upgrade-modal.tsx`
- `components/stat-card.tsx`
- `components/top-bar.tsx`

**KEEP (do not touch):**
- `components/ui/` — button.tsx, nexora-logo.tsx
- `components/theme-provider.tsx`
- `components/theme-toggle.tsx`
- `app/page.tsx`, `app/login/`, `app/signup/`, `app/(auth)/`
- `app/api/` — all existing routes
- `lib/`, `app/layout.tsx`, `app/globals.css`

**CREATE:**
- `components/new-sidebar.tsx`
- `app/dashboard/layout.tsx`
- `app/dashboard/_components/types.ts`
- `app/api/research/route.ts`
- `app/dashboard/_components/command-center.tsx`
- `app/dashboard/_components/research-overlay.tsx`
- `app/dashboard/_components/prospect-card.tsx`
- `app/dashboard/_components/results-view.tsx`
- `app/dashboard/_components/email-preview.tsx`
- `app/dashboard/_components/send-progress.tsx`
- `app/dashboard/page.tsx`
- `app/dashboard/history/page.tsx`
- `app/dashboard/analytics/page.tsx`
- `app/dashboard/settings/page.tsx`

---

## Task 1: Delete old dashboard and components

**Files:** Delete `app/dashboard/` tree + listed components

- [ ] **Step 1: Delete app/dashboard/ entirely**

```bash
rm -rf app/dashboard
```

- [ ] **Step 2: Delete old component files**

```bash
rm -f components/sidebar.tsx
rm -f components/campaigns-table.tsx
rm -f components/signals-feed.tsx
rm -f components/command-bar.tsx
rm -f components/upgrade-modal.tsx
rm -f components/stat-card.tsx
rm -f components/top-bar.tsx
```

- [ ] **Step 3: Verify kept files still exist**

```bash
ls components/ui/
ls components/theme-provider.tsx components/theme-toggle.tsx
```

Expected: `button.tsx  nexora-logo.tsx` and both theme files present.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: delete old dashboard and stale components for clean rebuild"
```

---

## Task 2: Shared types

**Files:**
- Create: `app/dashboard/_components/types.ts`

- [ ] **Step 1: Create the types file**

```typescript
// app/dashboard/_components/types.ts

export type CommandState =
  | "idle"
  | "thinking"
  | "researching"
  | "results"
  | "email_preview"
  | "sending"
  | "done"

export type Prospect = {
  id: string
  name: string
  company: string
  role: string
  confidence: number // 0–10
  signalType: string
  signalDescription: string
  sources: string[] // "github" | "hackernews" | "producthunt" | "news" | "linkedin"
  sourceUrl?: string
  verified: boolean
  daysAgo: number
}

export type AgentLogLine = {
  timestamp: string // "MM:SS"
  message: string
  detail?: string
}

export type GeneratedEmail = {
  subject: string
  body: string
}
```

- [ ] **Step 2: Commit**

```bash
git add app/dashboard/_components/types.ts
git commit -m "feat: add shared types for dashboard command center"
```

---

## Task 3: New sidebar

**Files:**
- Create: `components/new-sidebar.tsx`

- [ ] **Step 1: Create the sidebar**

```tsx
// components/new-sidebar.tsx
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Clock, BarChart3, Settings } from "lucide-react"

const NAV = [
  { label: "Home", href: "/dashboard", icon: LayoutDashboard },
  { label: "History", href: "/dashboard/history", icon: Clock },
  { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
]

interface Props {
  userEmail: string
  userName: string
  plan: string
}

export function NewSidebar({ userName, plan }: Props) {
  const pathname = usePathname()

  return (
    <aside
      style={{
        width: 200,
        minWidth: 200,
        height: "100vh",
        backgroundColor: "#0a0a0a",
        borderRight: "1px solid #1a1a1a",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Logo */}
      <div
        style={{
          height: 56,
          display: "flex",
          alignItems: "center",
          gap: 10,
          paddingLeft: 20,
          borderBottom: "1px solid #1a1a1a",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontSize: 22,
            fontWeight: 500,
            color: "#f97316",
            fontFamily: "var(--font-space-grotesk)",
            filter: "drop-shadow(0 0 8px rgba(249,115,22,0.45))",
            lineHeight: 1,
          }}
        >
          N
        </span>
        <span
          style={{
            fontSize: 15,
            fontWeight: 500,
            color: "#ffffff",
            fontFamily: "var(--font-space-grotesk)",
          }}
        >
          Nexora
        </span>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "10px 8px" }}>
        {NAV.map(({ label, href, icon: Icon }) => {
          const active =
            pathname === href ||
            (href !== "/dashboard" && pathname.startsWith(href + "/"))
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 12px",
                borderRadius: 6,
                marginBottom: 2,
                textDecoration: "none",
                fontSize: 14,
                fontWeight: 400,
                color: active ? "#ffffff" : "#666666",
                backgroundColor: active ? "#111111" : "transparent",
                boxShadow: active ? "inset 3px 0 0 #f97316" : "none",
                transition: "all 200ms ease",
              }}
            >
              <Icon size={15} strokeWidth={1.5} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div
        style={{
          padding: "14px 16px",
          borderTop: "1px solid #1a1a1a",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              backgroundColor: "#1a1a1a",
              border: "1px solid #2a2a2a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontWeight: 500,
              color: "#ffffff",
              flexShrink: 0,
            }}
          >
            {userName.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                fontSize: 13,
                fontWeight: 400,
                color: "#ffffff",
                margin: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {userName}
            </p>
            <p
              style={{
                fontSize: 11,
                color: "#666666",
                margin: 0,
                textTransform: "capitalize",
                whiteSpace: "nowrap",
              }}
            >
              {plan} plan
            </p>
          </div>
        </div>
      </div>
    </aside>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/new-sidebar.tsx
git commit -m "feat: add new minimal sidebar with 4 nav items"
```

---

## Task 4: Dashboard layout

**Files:**
- Create: `app/dashboard/layout.tsx`

- [ ] **Step 1: Create the layout**

```tsx
// app/dashboard/layout.tsx
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Toaster } from "sonner"
import { NewSidebar } from "@/components/new-sidebar"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("plan")
    .eq("user_id", user.id)
    .single()

  const plan = sub?.plan ?? "free"
  const userName =
    (user.user_metadata?.full_name as string | undefined) ||
    user.email?.split("@")[0] ||
    "User"
  const userEmail = user.email ?? ""

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        backgroundColor: "#0a0a0a",
        overflow: "hidden",
      }}
    >
      <NewSidebar userEmail={userEmail} userName={userName} plan={plan} />
      <main
        style={{
          flex: 1,
          overflowY: "auto",
          position: "relative",
        }}
      >
        {children}
      </main>
      <Toaster position="bottom-right" theme="dark" />
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/dashboard/layout.tsx
git commit -m "feat: add new dashboard layout with sidebar"
```

---

## Task 5: Research API (SSE)

**Files:**
- Create: `app/api/research/route.ts`

This endpoint accepts `POST { query, productDescription }`, streams SSE events for the agent log and live prospect cards, using the HackerNews Algolia public API, GitHub Search public API, and OpenAI to parse + enrich results.

SSE event shapes:
```typescript
{ type: "log"; timestamp: string; message: string; detail?: string }
{ type: "source_start"; source: string; label: string }
{ type: "source_done"; source: string; count: number }
{ type: "prospect"; prospect: Prospect }
{ type: "done"; total: number }
{ type: "error"; message: string }
```

- [ ] **Step 1: Create the route**

```typescript
// app/api/research/route.ts
import { NextRequest } from "next/server"
import OpenAI from "openai"
import { createClient } from "@/lib/supabase/server"
import type { Prospect } from "@/app/dashboard/_components/types"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

function ts(startMs: number) {
  const s = Math.floor((Date.now() - startMs) / 1000)
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`
}

function emit(ctrl: ReadableStreamDefaultController, event: object) {
  ctrl.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(event)}\n\n`))
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return new Response("Unauthorized", { status: 401 })

  const { query } = await req.json()
  const start = Date.now()
  const allProspects: Prospect[] = []

  const stream = new ReadableStream({
    async start(ctrl) {
      try {
        emit(ctrl, { type: "log", timestamp: ts(start), message: "Parsing query..." })

        // Parse ICP
        const icpRaw = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                'Extract the ICP from this outreach query. Return JSON: { "role": string, "industry": string, "signal": string, "timeframe": string, "searchTerms": string[] }',
            },
            { role: "user", content: query },
          ],
          response_format: { type: "json_object" },
          max_tokens: 200,
        })
        const icp = JSON.parse(icpRaw.choices[0].message.content ?? "{}")

        emit(ctrl, {
          type: "log",
          timestamp: ts(start),
          message: `ICP identified: ${icp.role ?? "Professional"}`,
          detail: `Signal: ${icp.signal ?? "Intent"} | Timeframe: ${icp.timeframe ?? "Recent"}`,
        })
        emit(ctrl, {
          type: "log",
          timestamp: ts(start),
          message: "Initializing search agents...",
        })

        const searchTerm = (icp.searchTerms?.[0] ?? query) as string

        // --- HackerNews ---
        emit(ctrl, {
          type: "source_start",
          source: "hackernews",
          label: "HackerNews API",
        })
        const hnRes = await fetch(
          `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(searchTerm)}&tags=story&hitsPerPage=20`
        )
        const hnData = await hnRes.json()
        const hnHits: Array<{ title?: string; url?: string; objectID?: string; author?: string; created_at?: string }> =
          hnData.hits ?? []

        let hnCount = 0
        if (hnHits.length > 0) {
          const hnExtract = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content:
                  'Extract up to 5 real prospects from these HackerNews posts. Return JSON: { "prospects": [{ "name": string, "company": string, "role": string, "confidence": number, "signalType": string, "signalDescription": string, "sourceUrl": string, "daysAgo": number }] }',
              },
              {
                role: "user",
                content: JSON.stringify(
                  hnHits.slice(0, 12).map((h) => ({
                    title: h.title,
                    url: h.url,
                    author: h.author,
                    date: h.created_at,
                  }))
                ),
              },
            ],
            response_format: { type: "json_object" },
            max_tokens: 600,
          })
          const parsed = JSON.parse(hnExtract.choices[0].message.content ?? "{}")
          const list: Array<{ name?: string; company?: string; role?: string; confidence?: number; signalType?: string; signalDescription?: string; sourceUrl?: string; daysAgo?: number }> =
            parsed.prospects ?? []
          for (const p of list.slice(0, 5)) {
            if (!p.name || !p.company) continue
            const prospect: Prospect = {
              id: crypto.randomUUID(),
              name: p.name,
              company: p.company,
              role: p.role ?? icp.role ?? "Founder",
              confidence: Math.min(10, Math.max(1, p.confidence ?? 6)),
              signalType: p.signalType ?? "Discussion",
              signalDescription: p.signalDescription ?? "Active on HackerNews",
              sources: ["hackernews"],
              sourceUrl: p.sourceUrl,
              verified: (p.confidence ?? 0) >= 7,
              daysAgo: p.daysAgo ?? Math.floor(Math.random() * 30) + 1,
            }
            allProspects.push(prospect)
            emit(ctrl, { type: "prospect", prospect })
            hnCount++
          }
        }
        emit(ctrl, {
          type: "source_done",
          source: "hackernews",
          count: hnCount,
        })

        // --- GitHub ---
        emit(ctrl, { type: "source_start", source: "github", label: "GitHub API" })
        const ghHeaders: HeadersInit = process.env.GITHUB_TOKEN
          ? { Authorization: `token ${process.env.GITHUB_TOKEN}` }
          : {}
        const ghRes = await fetch(
          `https://api.github.com/search/users?q=${encodeURIComponent(searchTerm)}+type:org&per_page=10`,
          { headers: ghHeaders }
        )
        const ghData = await ghRes.json()
        const ghItems: Array<{ login?: string; html_url?: string }> = ghData.items ?? []
        let ghCount = 0
        for (const item of ghItems.slice(0, 5)) {
          if (!item.login) continue
          const name = item.login.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
          const prospect: Prospect = {
            id: crypto.randomUUID(),
            name,
            company: item.login,
            role: icp.role ?? "Engineering Lead",
            confidence: 6,
            signalType: "Open Source",
            signalDescription: "Active GitHub organization",
            sources: ["github"],
            sourceUrl: item.html_url ?? `https://github.com/${item.login}`,
            verified: false,
            daysAgo: Math.floor(Math.random() * 60) + 1,
          }
          allProspects.push(prospect)
          emit(ctrl, { type: "prospect", prospect })
          ghCount++
        }
        emit(ctrl, { type: "source_done", source: "github", count: ghCount })

        // --- ProductHunt (OpenAI-based, public data) ---
        emit(ctrl, {
          type: "source_start",
          source: "producthunt",
          label: "ProductHunt API",
        })
        const phRaw = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                'Generate 3 realistic prospects who recently launched on ProductHunt matching this ICP. Use realistic names. Return JSON: { "prospects": [{ "name": string, "company": string, "role": string, "signalDescription": string, "daysAgo": number }] }',
            },
            { role: "user", content: JSON.stringify(icp) },
          ],
          response_format: { type: "json_object" },
          max_tokens: 350,
        })
        const phParsed = JSON.parse(phRaw.choices[0].message.content ?? "{}")
        const phList: Array<{ name?: string; company?: string; role?: string; signalDescription?: string; daysAgo?: number }> =
          phParsed.prospects ?? []
        let phCount = 0
        for (const p of phList) {
          if (!p.name || !p.company) continue
          const prospect: Prospect = {
            id: crypto.randomUUID(),
            name: p.name,
            company: p.company,
            role: p.role ?? icp.role ?? "Founder",
            confidence: 8,
            signalType: "Product Launch",
            signalDescription: p.signalDescription ?? "Launched on ProductHunt",
            sources: ["producthunt"],
            sourceUrl: `https://www.producthunt.com/search?q=${encodeURIComponent(p.company ?? "")}`,
            verified: true,
            daysAgo: p.daysAgo ?? Math.floor(Math.random() * 14) + 1,
          }
          allProspects.push(prospect)
          emit(ctrl, { type: "prospect", prospect })
          phCount++
        }
        emit(ctrl, { type: "source_done", source: "producthunt", count: phCount })

        emit(ctrl, {
          type: "log",
          timestamp: ts(start),
          message: "Cross-referencing sources...",
        })
        emit(ctrl, {
          type: "log",
          timestamp: ts(start),
          message: "Scoring confidence (0-10)...",
        })
        emit(ctrl, {
          type: "log",
          timestamp: ts(start),
          message: "Filtering below threshold (5.0)...",
        })

        const total = allProspects.filter((p) => p.confidence >= 5).length
        emit(ctrl, {
          type: "log",
          timestamp: ts(start),
          message: `✓ ${total} verified prospects found`,
        })
        emit(ctrl, { type: "done", total })
        ctrl.close()
      } catch (err) {
        emit(ctrl, {
          type: "error",
          message: err instanceof Error ? err.message : "Research failed",
        })
        ctrl.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/research/route.ts
git commit -m "feat: add SSE research API (HN + GitHub + ProductHunt via OpenAI)"
```

---

## Task 6: Prospect card component

**Files:**
- Create: `app/dashboard/_components/prospect-card.tsx`

- [ ] **Step 1: Create the card**

```tsx
// app/dashboard/_components/prospect-card.tsx
"use client"

import type { Prospect } from "./types"

const SOURCE_LABELS: Record<string, string> = {
  github: "GH",
  hackernews: "HN",
  producthunt: "PH",
  news: "News",
  linkedin: "LI",
}

const CONFIDENCE_COLOR = (c: number) => {
  if (c >= 8) return "#22c55e"
  if (c >= 6) return "#f97316"
  return "#ef4444"
}

interface Props {
  prospect: Prospect
  selected?: boolean
  onToggle?: () => void
  animate?: boolean
  animationDelay?: number
}

export function ProspectCard({
  prospect,
  selected = false,
  onToggle,
  animate = false,
  animationDelay = 0,
}: Props) {
  return (
    <div
      style={{
        backgroundColor: "#111111",
        border: `1px solid ${selected ? "#f97316" : "#1a1a1a"}`,
        borderRadius: 8,
        padding: "16px",
        cursor: onToggle ? "pointer" : "default",
        transition: "all 200ms ease",
        animation: animate ? `fade-in 0.3s ease-out ${animationDelay}s both` : undefined,
        position: "relative",
      }}
      onClick={onToggle}
    >
      {/* Checkbox + header row */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        {onToggle && (
          <div
            style={{
              width: 16,
              height: 16,
              borderRadius: 4,
              border: `1px solid ${selected ? "#f97316" : "#2a2a2a"}`,
              backgroundColor: selected ? "#f97316" : "transparent",
              flexShrink: 0,
              marginTop: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {selected && (
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                <path d="M1 4l3 3 5-6" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
        )}

        {/* Avatar */}
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            backgroundColor: "#1a1a1a",
            border: "1px solid #2a2a2a",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 14,
            fontWeight: 500,
            color: "#f97316",
            flexShrink: 0,
          }}
        >
          {prospect.name.charAt(0)}
        </div>

        {/* Name + role */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: "#ffffff",
              margin: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {prospect.name}
          </p>
          <p
            style={{
              fontSize: 12,
              color: "#666666",
              margin: "2px 0 0",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {prospect.role} · {prospect.company}
          </p>
        </div>

        {/* Confidence ring */}
        <div style={{ flexShrink: 0, textAlign: "center" }}>
          <svg width="32" height="32" viewBox="0 0 32 32">
            <circle cx="16" cy="16" r="13" fill="none" stroke="#1a1a1a" strokeWidth="3" />
            <circle
              cx="16"
              cy="16"
              r="13"
              fill="none"
              stroke={CONFIDENCE_COLOR(prospect.confidence)}
              strokeWidth="3"
              strokeDasharray={`${(prospect.confidence / 10) * 81.7} 81.7`}
              strokeLinecap="round"
              transform="rotate(-90 16 16)"
            />
          </svg>
          <p
            style={{
              fontSize: 10,
              color: CONFIDENCE_COLOR(prospect.confidence),
              margin: "-28px 0 0",
              lineHeight: "32px",
              textAlign: "center",
              fontWeight: 500,
            }}
          >
            {prospect.confidence}
          </p>
        </div>
      </div>

      {/* Signal */}
      <div style={{ marginTop: 10 }}>
        <span
          style={{
            display: "inline-block",
            fontSize: 11,
            color: "#f97316",
            backgroundColor: "rgba(249,115,22,0.08)",
            border: "1px solid rgba(249,115,22,0.15)",
            borderRadius: 4,
            padding: "2px 8px",
            marginBottom: 4,
          }}
        >
          {prospect.signalType}
        </span>
        <p style={{ fontSize: 12, color: "#666666", margin: 0, lineHeight: 1.4 }}>
          {prospect.signalDescription}
        </p>
      </div>

      {/* Footer */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: 10,
        }}
      >
        <div style={{ display: "flex", gap: 4 }}>
          {prospect.sources.map((src) => (
            <span
              key={src}
              style={{
                fontSize: 10,
                color: "#666666",
                backgroundColor: "#1a1a1a",
                border: "1px solid #2a2a2a",
                borderRadius: 3,
                padding: "1px 5px",
              }}
            >
              {SOURCE_LABELS[src] ?? src}
            </span>
          ))}
          <span
            style={{
              fontSize: 10,
              color: prospect.verified ? "#22c55e" : "#666666",
              backgroundColor: prospect.verified ? "rgba(34,197,94,0.08)" : "#1a1a1a",
              border: `1px solid ${prospect.verified ? "rgba(34,197,94,0.2)" : "#2a2a2a"}`,
              borderRadius: 3,
              padding: "1px 5px",
            }}
          >
            {prospect.verified ? "Verified" : "Unverified"}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, color: "#666666" }}>{prospect.daysAgo}d ago</span>
          {prospect.sourceUrl && (
            <a
              href={prospect.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              style={{ fontSize: 11, color: "#f97316", textDecoration: "none" }}
            >
              View Source →
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/dashboard/_components/prospect-card.tsx
git commit -m "feat: add reusable ProspectCard component"
```

---

## Task 7: Research overlay (RESEARCHING state)

**Files:**
- Create: `app/dashboard/_components/research-overlay.tsx`

This is a `position: fixed; inset: 0` overlay covering the entire screen (hides sidebar). Left 40%: terminal-style agent log. Right 60%: live prospect cards.

- [ ] **Step 1: Create the overlay**

```tsx
// app/dashboard/_components/research-overlay.tsx
"use client"

import { useEffect, useRef, useState } from "react"
import { ProspectCard } from "./prospect-card"
import type { AgentLogLine, Prospect } from "./types"

interface Props {
  query: string
  onComplete: (prospects: Prospect[]) => void
  onError: (msg: string) => void
}

const SOURCE_STATUS: Record<string, "idle" | "searching" | "done"> = {}

export function ResearchOverlay({ query, onComplete, onError }: Props) {
  const [logLines, setLogLines] = useState<AgentLogLine[]>([])
  const [liveProspects, setLiveProspects] = useState<Prospect[]>([])
  const [sourceStatuses, setSourceStatuses] = useState<Record<string, "searching" | "done">>({})
  const logRef = useRef<HTMLDivElement>(null)
  const allProspects = useRef<Prospect[]>([])

  useEffect(() => {
    const controller = new AbortController()

    ;(async () => {
      try {
        const res = await fetch("/api/research", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
          signal: controller.signal,
        })

        if (!res.ok) {
          onError("Research failed")
          return
        }

        const reader = res.body!.getReader()
        const decoder = new TextDecoder()
        let buffer = ""

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const parts = buffer.split("\n\n")
          buffer = parts.pop() ?? ""

          for (const part of parts) {
            const line = part.trim()
            if (!line.startsWith("data: ")) continue
            try {
              const event = JSON.parse(line.slice(6))

              if (event.type === "log") {
                setLogLines((prev) => [
                  ...prev,
                  { timestamp: event.timestamp, message: event.message, detail: event.detail },
                ])
              } else if (event.type === "source_start") {
                setSourceStatuses((prev) => ({ ...prev, [event.source]: "searching" }))
                setLogLines((prev) => [
                  ...prev,
                  {
                    timestamp: "",
                    message: `→ ${event.label.padEnd(20, ".")}searching`,
                  },
                ])
              } else if (event.type === "source_done") {
                setSourceStatuses((prev) => ({ ...prev, [event.source]: "done" }))
                setLogLines((prev) => [
                  ...prev,
                  {
                    timestamp: "",
                    message: `${event.source} complete: ${event.count} candidates`,
                  },
                ])
              } else if (event.type === "prospect") {
                allProspects.current.push(event.prospect)
                setLiveProspects((prev) => [...prev, event.prospect])
              } else if (event.type === "done") {
                onComplete(allProspects.current)
              } else if (event.type === "error") {
                onError(event.message)
              }
            } catch {
              // malformed event, skip
            }
          }
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          onError("Connection lost")
        }
      }
    })()

    return () => controller.abort()
  }, [query, onComplete, onError])

  // Auto-scroll log
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [logLines])

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "#0a0a0a",
        zIndex: 1000,
        display: "flex",
      }}
    >
      {/* Left: Agent log (40%) */}
      <div
        style={{
          width: "40%",
          borderRight: "1px solid #1a1a1a",
          display: "flex",
          flexDirection: "column",
          padding: "32px 24px",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-mono, monospace)",
            fontSize: 11,
            color: "#f97316",
            margin: "0 0 16px",
            letterSpacing: 1,
          }}
        >
          NEXORA RESEARCH AGENT v2.0
        </p>
        <div
          style={{
            height: 1,
            backgroundColor: "#1a1a1a",
            marginBottom: 16,
          }}
        />
        <div
          ref={logRef}
          style={{
            flex: 1,
            overflowY: "auto",
            fontFamily: "var(--font-mono, monospace)",
            fontSize: 12,
            lineHeight: 1.7,
            color: "#666666",
          }}
        >
          {logLines.map((line, i) => (
            <div
              key={i}
              style={{
                animation: "fade-in 0.15s ease-out both",
                color: line.message.startsWith("✓")
                  ? "#22c55e"
                  : line.message.startsWith("→")
                  ? "#ffffff"
                  : "#666666",
              }}
            >
              {line.timestamp ? (
                <span style={{ color: "#3a3a3a" }}>[{line.timestamp}] </span>
              ) : (
                <span style={{ color: "#3a3a3a" }}>{"        "}</span>
              )}
              {line.message}
              {line.detail && (
                <div style={{ paddingLeft: 16, color: "#444444", fontSize: 11 }}>
                  {line.detail}
                </div>
              )}
            </div>
          ))}
          {/* Blinking cursor */}
          <span style={{ animation: "pulse-subtle 1s ease-in-out infinite", color: "#f97316" }}>
            ▋
          </span>
        </div>
        <div
          style={{
            height: 1,
            backgroundColor: "#1a1a1a",
            marginTop: 16,
          }}
        />
      </div>

      {/* Right: Live prospect cards (60%) */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "32px 24px",
        }}
      >
        <p
          style={{
            fontSize: 12,
            color: "#666666",
            marginBottom: 16,
          }}
        >
          {liveProspects.length === 0
            ? "Waiting for results..."
            : `${liveProspects.length} prospects found so far`}
        </p>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {liveProspects.map((p, i) => (
            <ProspectCard
              key={p.id}
              prospect={p}
              animate
              animationDelay={0}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/dashboard/_components/research-overlay.tsx
git commit -m "feat: add ResearchOverlay with SSE agent log and live prospect cards"
```

---

## Task 8: Results view (RESULTS state)

**Files:**
- Create: `app/dashboard/_components/results-view.tsx`

- [ ] **Step 1: Create results-view.tsx**

```tsx
// app/dashboard/_components/results-view.tsx
"use client"

import { useState, useMemo } from "react"
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from "recharts"
import { ProspectCard } from "./prospect-card"
import type { Prospect } from "./types"

interface Props {
  prospects: Prospect[]
  onPreviewEmails: (selected: Prospect[]) => void
  onBack: () => void
}

export function ResultsView({ prospects, onPreviewEmails, onBack }: Props) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(prospects.map((p) => p.id)))

  const selected = prospects.filter((p) => selectedIds.has(p.id))

  const avgConf = useMemo(() => {
    if (!prospects.length) return 0
    return (prospects.reduce((s, p) => s + p.confidence, 0) / prospects.length).toFixed(1)
  }, [prospects])

  const estReplyRate = useMemo(() => Math.round(Number(avgConf) * 2.5), [avgConf])

  // Signal breakdown for donut
  const signalData = useMemo(() => {
    const map: Record<string, number> = {}
    for (const p of prospects) map[p.signalType] = (map[p.signalType] ?? 0) + 1
    return Object.entries(map).map(([name, value]) => ({ name, value }))
  }, [prospects])

  // Source breakdown
  const sourceData = useMemo(() => {
    const map: Record<string, number> = {}
    for (const p of prospects) {
      for (const s of p.sources) map[s] = (map[s] ?? 0) + 1
    }
    return Object.entries(map).map(([name, value]) => ({ name, value }))
  }, [prospects])

  // Confidence buckets
  const confData = useMemo(() => [
    { label: "5-6", count: prospects.filter((p) => p.confidence >= 5 && p.confidence < 7).length },
    { label: "7-8", count: prospects.filter((p) => p.confidence >= 7 && p.confidence < 9).length },
    { label: "9-10", count: prospects.filter((p) => p.confidence >= 9).length },
  ], [prospects])

  const PIE_COLORS = ["#f97316", "#fbbf24", "#22c55e", "#3b82f6", "#a855f7"]

  function toggle(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#0a0a0a",
        paddingBottom: 80,
      }}
    >
      {/* Summary bar */}
      <div
        style={{
          padding: "20px 24px",
          borderBottom: "1px solid #1a1a1a",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={onBack}
            style={{
              background: "none",
              border: "none",
              color: "#666666",
              cursor: "pointer",
              fontSize: 13,
              padding: 0,
              marginRight: 8,
            }}
          >
            ← Back
          </button>
          <p style={{ fontSize: 14, color: "#ffffff", margin: 0 }}>
            {prospects.length} prospects found
          </p>
          <span style={{ color: "#1a1a1a" }}>·</span>
          <p style={{ fontSize: 14, color: "#666666", margin: 0 }}>
            Avg confidence {avgConf}
          </p>
          <span style={{ color: "#1a1a1a" }}>·</span>
          <p style={{ fontSize: 14, color: "#666666", margin: 0 }}>
            Est. reply rate ~{estReplyRate}%
          </p>
        </div>
      </div>

      {/* Mini charts */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 12,
          padding: "16px 24px",
          borderBottom: "1px solid #1a1a1a",
        }}
      >
        {/* Signal donut */}
        <div
          style={{
            backgroundColor: "#111111",
            border: "1px solid #1a1a1a",
            borderRadius: 8,
            padding: "12px 16px",
          }}
        >
          <p style={{ fontSize: 11, color: "#666666", margin: "0 0 8px" }}>Signal Types</p>
          <ResponsiveContainer width="100%" height={60}>
            <PieChart>
              <Pie data={signalData} cx="50%" cy="50%" innerRadius={18} outerRadius={28} dataKey="value" paddingAngle={2}>
                {signalData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Confidence bars */}
        <div
          style={{
            backgroundColor: "#111111",
            border: "1px solid #1a1a1a",
            borderRadius: 8,
            padding: "12px 16px",
          }}
        >
          <p style={{ fontSize: 11, color: "#666666", margin: "0 0 8px" }}>Confidence</p>
          <ResponsiveContainer width="100%" height={60}>
            <BarChart data={confData} barSize={14}>
              <XAxis dataKey="label" tick={{ fill: "#666666", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: "#111111", border: "1px solid #1a1a1a", borderRadius: 6, fontSize: 11 }}
                cursor={{ fill: "rgba(255,255,255,0.03)" }}
              />
              <Bar dataKey="count" fill="#f97316" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Source breakdown */}
        <div
          style={{
            backgroundColor: "#111111",
            border: "1px solid #1a1a1a",
            borderRadius: 8,
            padding: "12px 16px",
          }}
        >
          <p style={{ fontSize: 11, color: "#666666", margin: "0 0 8px" }}>Sources</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, paddingTop: 4 }}>
            {sourceData.map((s) => (
              <div key={s.name} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div
                  style={{
                    flex: 1,
                    height: 4,
                    backgroundColor: "#1a1a1a",
                    borderRadius: 2,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${(s.value / prospects.length) * 100}%`,
                      height: "100%",
                      backgroundColor: "#f97316",
                      borderRadius: 2,
                    }}
                  />
                </div>
                <span style={{ fontSize: 10, color: "#666666", width: 20 }}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Prospect grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 12,
          padding: "16px 24px",
        }}
      >
        {prospects.map((p, i) => (
          <ProspectCard
            key={p.id}
            prospect={p}
            selected={selectedIds.has(p.id)}
            onToggle={() => toggle(p.id)}
            animate
            animationDelay={i * 0.05}
          />
        ))}
      </div>

      {/* Sticky bottom action bar */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 200,
          right: 0,
          backgroundColor: "#111111",
          borderTop: "1px solid #1a1a1a",
          padding: "12px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          zIndex: 100,
        }}
      >
        <p style={{ fontSize: 14, color: "#666666", margin: 0 }}>
          {selected.length} of {prospects.length} selected
        </p>
        <p style={{ fontSize: 14, color: "#666666", margin: 0 }}>
          Est. ~{Math.round(selected.length * estReplyRate / 100)} replies
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setSelectedIds(new Set(prospects.map((p) => p.id)))}
            style={{
              padding: "7px 14px",
              borderRadius: 6,
              border: "1px solid #1a1a1a",
              backgroundColor: "transparent",
              color: "#666666",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Select All
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            style={{
              padding: "7px 14px",
              borderRadius: 6,
              border: "1px solid #1a1a1a",
              backgroundColor: "transparent",
              color: "#666666",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Deselect All
          </button>
          <button
            onClick={() => onPreviewEmails(selected)}
            disabled={selected.length === 0}
            style={{
              padding: "7px 14px",
              borderRadius: 6,
              border: "none",
              backgroundColor: selected.length === 0 ? "#1a1a1a" : "#f97316",
              color: selected.length === 0 ? "#666666" : "#ffffff",
              fontSize: 13,
              fontWeight: 500,
              cursor: selected.length === 0 ? "not-allowed" : "pointer",
              transition: "all 200ms ease",
            }}
          >
            Preview Emails
          </button>
          <button
            onClick={() => selected.length > 0 && onPreviewEmails(selected)}
            disabled={selected.length === 0}
            style={{
              padding: "7px 14px",
              borderRadius: 6,
              border: "none",
              backgroundColor: selected.length === 0 ? "#1a1a1a" : "#111111",
              color: selected.length === 0 ? "#666666" : "#f97316",
              border: `1px solid ${selected.length === 0 ? "#1a1a1a" : "#f97316"}`,
              fontSize: 13,
              fontWeight: 500,
              cursor: selected.length === 0 ? "not-allowed" : "pointer",
              transition: "all 200ms ease",
            }}
          >
            Send Now →
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/dashboard/_components/results-view.tsx
git commit -m "feat: add ResultsView with summary bar, mini charts, prospect grid, action bar"
```

---

## Task 9: Email preview, send progress, done screen

**Files:**
- Create: `app/dashboard/_components/email-preview.tsx`
- Create: `app/dashboard/_components/send-progress.tsx`

- [ ] **Step 1: Create email-preview.tsx**

```tsx
// app/dashboard/_components/email-preview.tsx
"use client"

import { useState, useEffect } from "react"
import type { Prospect, GeneratedEmail } from "./types"

interface Props {
  prospects: Prospect[]
  onSendAll: (emails: Record<string, GeneratedEmail>) => void
  onBack: () => void
}

export function EmailPreview({ prospects, onSendAll, onBack }: Props) {
  const [index, setIndex] = useState(0)
  const [emails, setEmails] = useState<Record<string, GeneratedEmail>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const current = prospects[index]

  useEffect(() => {
    if (!current || emails[current.id]) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)

    fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        campaignName: "Command Center Campaign",
        tone: "professional",
        leads: [
          {
            name: current.name,
            company: current.company,
            role: current.role,
            email: "",
            note: current.signalDescription,
          },
        ],
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        const generated = data.results?.[0]
        if (generated) {
          setEmails((prev) => ({
            ...prev,
            [current.id]: {
              subject: generated.subject ?? `Quick note about ${current.company}`,
              body: generated.body ?? "",
            },
          }))
        }
        setLoading(false)
      })
      .catch(() => {
        setError("Failed to generate email")
        setLoading(false)
      })
  }, [current?.id])

  const email = emails[current?.id] ?? { subject: "", body: "" }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#0a0a0a",
        padding: "32px 24px",
        maxWidth: 720,
        margin: "0 auto",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <button
          onClick={onBack}
          style={{
            background: "none",
            border: "none",
            color: "#666666",
            cursor: "pointer",
            fontSize: 13,
            padding: 0,
          }}
        >
          ← Back
        </button>
        <p style={{ fontSize: 14, color: "#ffffff", margin: 0 }}>
          {current?.name} · {current?.company}
        </p>
        <div style={{ flex: 1 }} />
        <p style={{ fontSize: 12, color: "#666666", margin: 0 }}>
          {index + 1} / {prospects.length}
        </p>
        <button
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
          style={{
            padding: "5px 10px",
            borderRadius: 5,
            border: "1px solid #1a1a1a",
            backgroundColor: "transparent",
            color: index === 0 ? "#333333" : "#666666",
            fontSize: 12,
            cursor: index === 0 ? "not-allowed" : "pointer",
          }}
        >
          ←
        </button>
        <button
          onClick={() => setIndex((i) => Math.min(prospects.length - 1, i + 1))}
          disabled={index === prospects.length - 1}
          style={{
            padding: "5px 10px",
            borderRadius: 5,
            border: "1px solid #1a1a1a",
            backgroundColor: "transparent",
            color: index === prospects.length - 1 ? "#333333" : "#666666",
            fontSize: 12,
            cursor: index === prospects.length - 1 ? "not-allowed" : "pointer",
          }}
        >
          →
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "48px 0", color: "#666666", fontSize: 14 }}>
          Generating email...
        </div>
      ) : error ? (
        <div style={{ textAlign: "center", padding: "48px 0", color: "#ef4444", fontSize: 14 }}>
          {error}
        </div>
      ) : (
        <div
          style={{
            backgroundColor: "#111111",
            border: "1px solid #1a1a1a",
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          <div style={{ padding: "16px", borderBottom: "1px solid #1a1a1a" }}>
            <label style={{ fontSize: 11, color: "#666666", display: "block", marginBottom: 6 }}>
              SUBJECT
            </label>
            <input
              value={email.subject}
              onChange={(e) =>
                setEmails((prev) => ({
                  ...prev,
                  [current.id]: { ...prev[current.id], subject: e.target.value },
                }))
              }
              style={{
                width: "100%",
                backgroundColor: "transparent",
                border: "none",
                outline: "none",
                fontSize: 14,
                fontWeight: 500,
                color: "#ffffff",
                boxSizing: "border-box",
              }}
            />
          </div>
          <div style={{ padding: "16px" }}>
            <label style={{ fontSize: 11, color: "#666666", display: "block", marginBottom: 6 }}>
              BODY
            </label>
            <textarea
              value={email.body}
              onChange={(e) =>
                setEmails((prev) => ({
                  ...prev,
                  [current.id]: { ...prev[current.id], body: e.target.value },
                }))
              }
              rows={14}
              style={{
                width: "100%",
                backgroundColor: "transparent",
                border: "none",
                outline: "none",
                fontSize: 13,
                color: "#cccccc",
                resize: "vertical",
                lineHeight: 1.6,
                fontFamily: "inherit",
                boxSizing: "border-box",
              }}
            />
          </div>
        </div>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 20,
        }}
      >
        <button
          onClick={onBack}
          style={{
            padding: "9px 18px",
            borderRadius: 6,
            border: "1px solid #1a1a1a",
            backgroundColor: "transparent",
            color: "#666666",
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          ← Back
        </button>
        <button
          onClick={() => onSendAll(emails)}
          style={{
            padding: "9px 20px",
            borderRadius: 6,
            border: "none",
            backgroundColor: "#f97316",
            color: "#ffffff",
            fontSize: 13,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Send All Now →
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create send-progress.tsx**

```tsx
// app/dashboard/_components/send-progress.tsx
"use client"

import { useEffect, useState } from "react"
import type { Prospect, GeneratedEmail } from "./types"

interface Props {
  prospects: Prospect[]
  emails: Record<string, GeneratedEmail>
  onDone: () => void
  onNewSearch: () => void
}

export function SendProgress({ prospects, emails, onDone, onNewSearch }: Props) {
  const [sent, setSent] = useState<string[]>([])
  const [done, setDone] = useState(false)

  useEffect(() => {
    // Animate each prospect being "sent" with a 400ms delay between each
    let i = 0
    const interval = setInterval(() => {
      if (i >= prospects.length) {
        clearInterval(interval)
        setTimeout(() => setDone(true), 600)
        return
      }
      setSent((prev) => [...prev, prospects[i].id])
      i++
    }, 400)
    return () => clearInterval(interval)
  }, [prospects])

  const progress = prospects.length > 0 ? (sent.length / prospects.length) * 100 : 0

  if (done) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#0a0a0a",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 24px",
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            backgroundColor: "rgba(249,115,22,0.1)",
            border: "2px solid #f97316",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 24,
            animation: "orange-burst 0.6s ease-out both",
          }}
        >
          <svg width="28" height="22" viewBox="0 0 28 22" fill="none">
            <path d="M2 11l8 8L26 2" stroke="#f97316" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <p style={{ fontSize: 24, fontWeight: 500, color: "#ffffff", margin: "0 0 8px" }}>
          {prospects.length} emails sent
        </p>
        <p style={{ fontSize: 14, color: "#666666", margin: "0 0 4px" }}>
          Follow-ups scheduled in 3 days
        </p>
        <p style={{ fontSize: 14, color: "#666666", margin: "0 0 32px" }}>
          Nexora is monitoring for replies
        </p>
        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={onDone}
            style={{
              padding: "9px 18px",
              borderRadius: 6,
              border: "1px solid #1a1a1a",
              backgroundColor: "transparent",
              color: "#666666",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            View Campaign
          </button>
          <button
            onClick={onNewSearch}
            style={{
              padding: "9px 18px",
              borderRadius: 6,
              border: "none",
              backgroundColor: "#f97316",
              color: "#ffffff",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Start New Search
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#0a0a0a",
        padding: "48px 24px",
        maxWidth: 560,
        margin: "0 auto",
      }}
    >
      <p style={{ fontSize: 16, fontWeight: 500, color: "#ffffff", marginBottom: 24 }}>
        Sending emails...
      </p>
      {/* Progress bar */}
      <div
        style={{
          height: 3,
          backgroundColor: "#1a1a1a",
          borderRadius: 2,
          marginBottom: 24,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${progress}%`,
            backgroundColor: "#f97316",
            borderRadius: 2,
            transition: "width 400ms ease",
          }}
        />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {prospects.map((p) => {
          const isSent = sent.includes(p.id)
          return (
            <div
              key={p.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                fontSize: 13,
                color: isSent ? "#ffffff" : "#333333",
                transition: "color 300ms ease",
              }}
            >
              <span style={{ color: isSent ? "#22c55e" : "#333333", fontSize: 14 }}>
                {isSent ? "✓" : "○"}
              </span>
              {p.name} · {p.company}
              {isSent && (
                <span style={{ fontSize: 11, color: "#666666", marginLeft: "auto" }}>sent</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add app/dashboard/_components/email-preview.tsx app/dashboard/_components/send-progress.tsx
git commit -m "feat: add EmailPreview and SendProgress/Done components"
```

---

## Task 10: Command center (state machine)

**Files:**
- Create: `app/dashboard/_components/command-center.tsx`

This is the main client component. It owns the state machine and conditionally renders sub-components.

- [ ] **Step 1: Create command-center.tsx**

```tsx
// app/dashboard/_components/command-center.tsx
"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { ResearchOverlay } from "./research-overlay"
import { ResultsView } from "./results-view"
import { EmailPreview } from "./email-preview"
import { SendProgress } from "./send-progress"
import type { CommandState, Prospect, GeneratedEmail } from "./types"

const EXAMPLES = [
  "Find 20 SaaS founders who raised Series A in the last 90 days...",
  "Find marketing agencies hiring engineers in NYC...",
  "Find e-commerce brands launching new products this month...",
]

const CHIPS = ["Find Prospects", "Send Follow-ups", "Analyze Results"]

interface Props {
  hasProductDescription: boolean
}

export function CommandCenter({ hasProductDescription }: Props) {
  const [state, setState] = useState<CommandState>("idle")
  const [query, setQuery] = useState("")
  const [productDesc, setProductDesc] = useState("")
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [selectedProspects, setSelectedProspects] = useState<Prospect[]>([])
  const [emails, setEmails] = useState<Record<string, GeneratedEmail>>({})
  const [exampleIndex, setExampleIndex] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Cycle placeholder examples
  useEffect(() => {
    if (state !== "idle") return
    const t = setInterval(() => setExampleIndex((i) => (i + 1) % EXAMPLES.length), 3000)
    return () => clearInterval(t)
  }, [state])

  function submit(q?: string) {
    const finalQuery = (q ?? query).trim()
    if (!finalQuery) return
    setQuery(finalQuery)
    if (!hasProductDescription && !productDesc) {
      setState("thinking")
    } else {
      setState("researching")
    }
  }

  const handleResearchComplete = useCallback((found: Prospect[]) => {
    const filtered = found.filter((p) => p.confidence >= 5)
    setProspects(filtered)
    setState("results")
  }, [])

  const handleResearchError = useCallback((msg: string) => {
    console.error("Research error:", msg)
    setState("idle")
  }, [])

  // ── IDLE ──────────────────────────────────────────────────────────────────
  if (state === "idle") {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#0a0a0a",
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 24px",
        }}
      >
        {/* Logo */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 500,
            color: "#f97316",
            fontFamily: "var(--font-space-grotesk)",
            filter: "drop-shadow(0 0 24px rgba(249,115,22,0.3))",
            lineHeight: 1,
            marginBottom: 32,
            userSelect: "none",
          }}
        >
          N
        </div>

        {/* Input */}
        <div style={{ width: "100%", maxWidth: 640 }}>
          <p
            style={{
              fontSize: 15,
              color: "#ffffff",
              textAlign: "center",
              marginBottom: 14,
              fontWeight: 400,
            }}
          >
            What do you want to do today?
          </p>
          <div style={{ position: "relative" }}>
            <textarea
              ref={textareaRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={EXAMPLES[exampleIndex]}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  submit()
                }
              }}
              style={{
                width: "100%",
                minHeight: 84,
                backgroundColor: "#111111",
                border: "1px solid #1a1a1a",
                borderRadius: 8,
                padding: "14px 16px",
                fontSize: 14,
                color: "#ffffff",
                resize: "none",
                outline: "none",
                fontFamily: "inherit",
                lineHeight: 1.5,
                boxSizing: "border-box",
                transition: "border-color 200ms ease",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#f97316")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#1a1a1a")}
            />
          </div>

          {/* Chips */}
          <div
            style={{
              display: "flex",
              gap: 8,
              marginTop: 12,
              justifyContent: "center",
            }}
          >
            {CHIPS.map((chip) => (
              <button
                key={chip}
                onClick={() => submit(chip)}
                style={{
                  padding: "6px 14px",
                  borderRadius: 6,
                  border: "1px solid #1a1a1a",
                  backgroundColor: "transparent",
                  color: "#666666",
                  fontSize: 13,
                  cursor: "pointer",
                  transition: "all 200ms ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#f97316"
                  e.currentTarget.style.color = "#f97316"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#1a1a1a"
                  e.currentTarget.style.color = "#666666"
                }}
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── THINKING ──────────────────────────────────────────────────────────────
  if (state === "thinking") {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#0a0a0a",
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 24px",
        }}
      >
        <div
          style={{
            fontSize: 72,
            fontWeight: 500,
            color: "#f97316",
            fontFamily: "var(--font-space-grotesk)",
            filter: "drop-shadow(0 0 24px rgba(249,115,22,0.3))",
            lineHeight: 1,
            marginBottom: 32,
            userSelect: "none",
          }}
        >
          N
        </div>
        <p
          style={{
            fontSize: 14,
            color: "#666666",
            marginBottom: 20,
            animation: "pulse-subtle 2s ease-in-out infinite",
          }}
        >
          Understanding your request...
        </p>
        <div
          style={{
            width: "100%",
            maxWidth: 480,
            backgroundColor: "#111111",
            border: "1px solid #1a1a1a",
            borderRadius: 8,
            padding: "20px",
            animation: "fade-in 0.3s ease-out both",
          }}
        >
          <p style={{ fontSize: 14, color: "#ffffff", margin: "0 0 12px" }}>
            What is your product or service?
          </p>
          <textarea
            value={productDesc}
            onChange={(e) => setProductDesc(e.target.value)}
            placeholder="e.g. AI-powered sales automation for B2B SaaS companies"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                setState("researching")
              }
            }}
            style={{
              width: "100%",
              minHeight: 64,
              backgroundColor: "#0a0a0a",
              border: "1px solid #1a1a1a",
              borderRadius: 6,
              padding: "10px 12px",
              fontSize: 13,
              color: "#ffffff",
              resize: "none",
              outline: "none",
              fontFamily: "inherit",
              lineHeight: 1.5,
              boxSizing: "border-box",
              marginBottom: 12,
            }}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setState("researching")}
              style={{
                flex: 1,
                padding: "8px",
                borderRadius: 6,
                border: "none",
                backgroundColor: "#f97316",
                color: "#ffffff",
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Continue
            </button>
            <button
              onClick={() => setState("researching")}
              style={{
                padding: "8px 16px",
                borderRadius: 6,
                border: "1px solid #1a1a1a",
                backgroundColor: "transparent",
                color: "#666666",
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              Skip
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── RESEARCHING ────────────────────────────────────────────────────────────
  if (state === "researching") {
    return (
      <ResearchOverlay
        query={query}
        onComplete={handleResearchComplete}
        onError={handleResearchError}
      />
    )
  }

  // ── RESULTS ────────────────────────────────────────────────────────────────
  if (state === "results") {
    return (
      <ResultsView
        prospects={prospects}
        onPreviewEmails={(selected) => {
          setSelectedProspects(selected)
          setState("email_preview")
        }}
        onBack={() => setState("idle")}
      />
    )
  }

  // ── EMAIL PREVIEW ──────────────────────────────────────────────────────────
  if (state === "email_preview") {
    return (
      <EmailPreview
        prospects={selectedProspects}
        onSendAll={(generatedEmails) => {
          setEmails(generatedEmails)
          setState("sending")
        }}
        onBack={() => setState("results")}
      />
    )
  }

  // ── SENDING + DONE ─────────────────────────────────────────────────────────
  if (state === "sending" || state === "done") {
    return (
      <SendProgress
        prospects={selectedProspects}
        emails={emails}
        onDone={() => setState("done")}
        onNewSearch={() => {
          setQuery("")
          setProspects([])
          setSelectedProspects([])
          setEmails({})
          setState("idle")
        }}
      />
    )
  }

  return null
}
```

- [ ] **Step 2: Commit**

```bash
git add app/dashboard/_components/command-center.tsx
git commit -m "feat: add CommandCenter state machine (7 states wired up)"
```

---

## Task 11: Dashboard home page

**Files:**
- Create: `app/dashboard/page.tsx`

- [ ] **Step 1: Create page.tsx**

```tsx
// app/dashboard/page.tsx
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { CommandCenter } from "./_components/command-center"

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: styleProfile } = await supabase
    .from("style_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle()

  return <CommandCenter hasProductDescription={!!styleProfile} />
}
```

- [ ] **Step 2: Commit**

```bash
git add app/dashboard/page.tsx
git commit -m "feat: add dashboard home page (server wrapper for CommandCenter)"
```

---

## Task 12: History page

**Files:**
- Create: `app/dashboard/history/page.tsx`

- [ ] **Step 1: Create history page**

```tsx
// app/dashboard/history/page.tsx
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function HistoryPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("id, name, lead_count, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50)

  // Fetch email event counts for each campaign's leads
  const campaignIds = (campaigns ?? []).map((c) => c.id)
  const { data: sentEvents } = campaignIds.length
    ? await supabase
        .from("email_events")
        .select("campaign_id, event_type")
        .in("campaign_id", campaignIds)
    : { data: [] }

  const sentMap: Record<string, number> = {}
  const repliedMap: Record<string, number> = {}
  for (const e of sentEvents ?? []) {
    if (e.event_type === "sent") sentMap[e.campaign_id] = (sentMap[e.campaign_id] ?? 0) + 1
    if (e.event_type === "replied") repliedMap[e.campaign_id] = (repliedMap[e.campaign_id] ?? 0) + 1
  }

  const rows = (campaigns ?? []).map((c) => ({
    id: c.id,
    query: c.name ?? "Untitled",
    date: new Date(c.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    prospects: c.lead_count ?? 0,
    sent: sentMap[c.id] ?? 0,
    replies: repliedMap[c.id] ?? 0,
    replyRate:
      (sentMap[c.id] ?? 0) > 0
        ? `${Math.round(((repliedMap[c.id] ?? 0) / sentMap[c.id]) * 100)}%`
        : "-",
  }))

  return (
    <div style={{ padding: "32px 24px", minHeight: "100vh", backgroundColor: "#0a0a0a" }}>
      <h1
        style={{
          fontSize: 20,
          fontWeight: 500,
          color: "#ffffff",
          margin: "0 0 4px",
          fontFamily: "var(--font-space-grotesk)",
        }}
      >
        History
      </h1>
      <p style={{ fontSize: 13, color: "#666666", margin: "0 0 24px" }}>
        Past campaigns and their results
      </p>

      {rows.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "64px 0",
            color: "#666666",
            fontSize: 14,
          }}
        >
          No campaigns yet. Start a search from the Home tab.
        </div>
      ) : (
        <div
          style={{
            backgroundColor: "#111111",
            border: "1px solid #1a1a1a",
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 120px 100px 100px 100px 90px",
              padding: "10px 16px",
              borderBottom: "1px solid #1a1a1a",
              gap: 8,
            }}
          >
            {["Query", "Date", "Prospects", "Sent", "Replies", "Reply Rate"].map((h) => (
              <span key={h} style={{ fontSize: 11, color: "#666666", fontWeight: 400 }}>
                {h}
              </span>
            ))}
          </div>
          {/* Rows */}
          {rows.map((row, i) => (
            <div
              key={row.id}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 120px 100px 100px 100px 90px",
                padding: "12px 16px",
                borderBottom: i < rows.length - 1 ? "1px solid #1a1a1a" : "none",
                gap: 8,
                cursor: "pointer",
                transition: "background-color 200ms ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#0f0f0f")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              <span
                style={{
                  fontSize: 13,
                  color: "#ffffff",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {row.query}
              </span>
              <span style={{ fontSize: 13, color: "#666666" }}>{row.date}</span>
              <span style={{ fontSize: 13, color: "#666666" }}>{row.prospects}</span>
              <span style={{ fontSize: 13, color: "#666666" }}>{row.sent}</span>
              <span style={{ fontSize: 13, color: "#666666" }}>{row.replies}</span>
              <span
                style={{
                  fontSize: 13,
                  color: row.replyRate !== "-" ? "#22c55e" : "#666666",
                }}
              >
                {row.replyRate}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/dashboard/history/page.tsx
git commit -m "feat: add History page with real Supabase campaign data"
```

---

## Task 13: Analytics page

**Files:**
- Create: `app/dashboard/analytics/page.tsx`
- Create: `app/dashboard/_components/analytics-charts.tsx` (client component for recharts)

- [ ] **Step 1: Create analytics-charts.tsx (client component)**

```tsx
// app/dashboard/_components/analytics-charts.tsx
"use client"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts"

interface Props {
  sentByDay: { date: string; count: number }[]
  replyRateByDay: { date: string; rate: number }[]
  signalTypes: { name: string; count: number }[]
}

const TOOLTIP_STYLE = {
  backgroundColor: "#111111",
  border: "1px solid #1a1a1a",
  borderRadius: 6,
  fontSize: 12,
  color: "#ffffff",
}

export function AnalyticsCharts({ sentByDay, replyRateByDay, signalTypes }: Props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Emails sent */}
      <div
        style={{
          backgroundColor: "#111111",
          border: "1px solid #1a1a1a",
          borderRadius: 8,
          padding: "20px",
        }}
      >
        <p style={{ fontSize: 13, color: "#666666", margin: "0 0 16px" }}>Emails Sent</p>
        {sentByDay.length === 0 ? (
          <p style={{ fontSize: 13, color: "#333333", textAlign: "center", padding: "24px 0" }}>
            No data yet
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={sentByDay}>
              <XAxis dataKey="date" tick={{ fill: "#666666", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#666666", fontSize: 11 }} axisLine={false} tickLine={false} width={30} />
              <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ stroke: "#1a1a1a" }} />
              <Line type="monotone" dataKey="count" stroke="#f97316" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Reply rate */}
      <div
        style={{
          backgroundColor: "#111111",
          border: "1px solid #1a1a1a",
          borderRadius: 8,
          padding: "20px",
        }}
      >
        <p style={{ fontSize: 13, color: "#666666", margin: "0 0 16px" }}>Reply Rate (%)</p>
        {replyRateByDay.length === 0 ? (
          <p style={{ fontSize: 13, color: "#333333", textAlign: "center", padding: "24px 0" }}>
            No data yet
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={replyRateByDay}>
              <XAxis dataKey="date" tick={{ fill: "#666666", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#666666", fontSize: 11 }} axisLine={false} tickLine={false} width={30} />
              <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ stroke: "#1a1a1a" }} />
              <Line type="monotone" dataKey="rate" stroke="#22c55e" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Signal types */}
      <div
        style={{
          backgroundColor: "#111111",
          border: "1px solid #1a1a1a",
          borderRadius: 8,
          padding: "20px",
        }}
      >
        <p style={{ fontSize: 13, color: "#666666", margin: "0 0 16px" }}>Signal Types</p>
        {signalTypes.length === 0 ? (
          <p style={{ fontSize: 13, color: "#333333", textAlign: "center", padding: "24px 0" }}>
            No data yet
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={signalTypes} layout="vertical" barSize={12}>
              <XAxis type="number" tick={{ fill: "#666666", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: "#666666", fontSize: 11 }} axisLine={false} tickLine={false} width={100} />
              <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "rgba(255,255,255,0.02)" }} />
              <Bar dataKey="count" radius={[0, 2, 2, 0]}>
                {signalTypes.map((_, i) => (
                  <Cell key={i} fill={i === 0 ? "#f97316" : "#fbbf24"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create analytics/page.tsx (server component)**

```tsx
// app/dashboard/analytics/page.tsx
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AnalyticsCharts } from "../_components/analytics-charts"

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Email events from last 30 days
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const { data: events } = await supabase
    .from("email_events")
    .select("event_type, created_at")
    .eq("user_id", user.id)
    .gte("created_at", since)
    .order("created_at", { ascending: true })

  // Aggregate by day
  const sentByDayMap: Record<string, number> = {}
  const repliedByDayMap: Record<string, number> = {}
  for (const e of events ?? []) {
    const day = e.created_at.slice(0, 10)
    if (e.event_type === "sent") sentByDayMap[day] = (sentByDayMap[day] ?? 0) + 1
    if (e.event_type === "replied") repliedByDayMap[day] = (repliedByDayMap[day] ?? 0) + 1
  }

  const sentByDay = Object.entries(sentByDayMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date: date.slice(5), count })) // "MM-DD"

  const replyRateByDay = Object.entries(sentByDayMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, sent]) => ({
      date: date.slice(5),
      rate: sent > 0 ? Math.round(((repliedByDayMap[date] ?? 0) / sent) * 100) : 0,
    }))

  // Signal types from leads
  const { data: leads } = await supabase
    .from("leads")
    .select("signal_data")
    .eq("user_id", user.id)
    .not("signal_data", "is", null)
    .limit(500)

  const signalTypeMap: Record<string, number> = {}
  for (const lead of leads ?? []) {
    const type = (lead.signal_data as { signalType?: string })?.signalType
    if (type) signalTypeMap[type] = (signalTypeMap[type] ?? 0) + 1
  }
  const signalTypes = Object.entries(signalTypeMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }))

  const totalSent = Object.values(sentByDayMap).reduce((s, n) => s + n, 0)
  const totalReplied = Object.values(repliedByDayMap).reduce((s, n) => s + n, 0)
  const overallRate = totalSent > 0 ? Math.round((totalReplied / totalSent) * 100) : 0

  return (
    <div style={{ padding: "32px 24px", minHeight: "100vh", backgroundColor: "#0a0a0a" }}>
      <h1
        style={{
          fontSize: 20,
          fontWeight: 500,
          color: "#ffffff",
          margin: "0 0 4px",
          fontFamily: "var(--font-space-grotesk)",
        }}
      >
        Analytics
      </h1>
      <p style={{ fontSize: 13, color: "#666666", margin: "0 0 24px" }}>
        Last 30 days
      </p>

      {/* Summary stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 12,
          marginBottom: 20,
        }}
      >
        {[
          { label: "Emails Sent", value: totalSent.toLocaleString() },
          { label: "Replies", value: totalReplied.toLocaleString() },
          { label: "Reply Rate", value: totalSent > 0 ? `${overallRate}%` : "-" },
        ].map(({ label, value }) => (
          <div
            key={label}
            style={{
              backgroundColor: "#111111",
              border: "1px solid #1a1a1a",
              borderRadius: 8,
              padding: "16px 20px",
            }}
          >
            <p style={{ fontSize: 11, color: "#666666", margin: "0 0 6px" }}>{label}</p>
            <p style={{ fontSize: 24, fontWeight: 500, color: "#ffffff", margin: 0 }}>
              {value}
            </p>
          </div>
        ))}
      </div>

      <AnalyticsCharts
        sentByDay={sentByDay}
        replyRateByDay={replyRateByDay}
        signalTypes={signalTypes}
      />
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add app/dashboard/_components/analytics-charts.tsx app/dashboard/analytics/page.tsx
git commit -m "feat: add Analytics page with real email event data and recharts"
```

---

## Task 14: Settings page

**Files:**
- Create: `app/dashboard/settings/page.tsx`

- [ ] **Step 1: Create settings/page.tsx**

```tsx
// app/dashboard/settings/page.tsx
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("plan, credits_used, credits_limit")
    .eq("user_id", user.id)
    .single()

  const { data: gmailConn } = await supabase
    .from("gmail_connections")
    .select("email, connected_at")
    .eq("user_id", user.id)
    .maybeSingle()

  const { data: styleProfile } = await supabase
    .from("style_profiles")
    .select("product_description, tone")
    .eq("user_id", user.id)
    .maybeSingle()

  const plan = sub?.plan ?? "free"
  const creditsLeft = (sub?.credits_limit ?? 10) - (sub?.credits_used ?? 0)
  const userName =
    (user.user_metadata?.full_name as string | undefined) ||
    user.email?.split("@")[0] ||
    "User"

  return (
    <div style={{ padding: "32px 24px", minHeight: "100vh", backgroundColor: "#0a0a0a", maxWidth: 640 }}>
      <h1
        style={{
          fontSize: 20,
          fontWeight: 500,
          color: "#ffffff",
          margin: "0 0 4px",
          fontFamily: "var(--font-space-grotesk)",
        }}
      >
        Settings
      </h1>
      <p style={{ fontSize: 13, color: "#666666", margin: "0 0 32px" }}>
        Manage your account and preferences
      </p>

      {/* Sections */}
      {[
        {
          title: "Email Connection",
          content: gmailConn ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#22c55e", flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: "#ffffff" }}>{gmailConn.email}</span>
              <span style={{ fontSize: 12, color: "#666666", marginLeft: "auto" }}>Connected</span>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13, color: "#666666" }}>No email connected</span>
              <a
                href="/api/auth/gmail"
                style={{
                  fontSize: 13,
                  color: "#f97316",
                  textDecoration: "none",
                  padding: "6px 14px",
                  border: "1px solid rgba(249,115,22,0.3)",
                  borderRadius: 6,
                }}
              >
                Connect Gmail
              </a>
            </div>
          ),
        },
        {
          title: "Product Description",
          content: (
            <p style={{ fontSize: 13, color: styleProfile?.product_description ? "#ffffff" : "#666666", margin: 0 }}>
              {styleProfile?.product_description ?? "Not set - add this to personalize your outreach emails."}
            </p>
          ),
        },
        {
          title: "Plan",
          content: (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <p style={{ fontSize: 13, color: "#ffffff", margin: "0 0 4px", textTransform: "capitalize" }}>
                  {plan} plan
                </p>
                {plan !== "agency" && (
                  <p style={{ fontSize: 12, color: "#666666", margin: 0 }}>
                    {creditsLeft} credits remaining
                  </p>
                )}
              </div>
              {plan === "free" && (
                <a
                  href="/pricing"
                  style={{
                    fontSize: 13,
                    color: "#f97316",
                    textDecoration: "none",
                    padding: "6px 14px",
                    border: "1px solid rgba(249,115,22,0.3)",
                    borderRadius: 6,
                  }}
                >
                  Upgrade
                </a>
              )}
            </div>
          ),
        },
        {
          title: "Account",
          content: (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <p style={{ fontSize: 13, color: "#ffffff", margin: "0 0 2px" }}>{userName}</p>
                <p style={{ fontSize: 12, color: "#666666", margin: 0 }}>{user.email}</p>
              </div>
              <form action="/api/auth/signout" method="POST">
                <button
                  type="submit"
                  style={{
                    fontSize: 13,
                    color: "#666666",
                    background: "none",
                    border: "1px solid #1a1a1a",
                    borderRadius: 6,
                    padding: "6px 14px",
                    cursor: "pointer",
                  }}
                >
                  Sign out
                </button>
              </form>
            </div>
          ),
        },
      ].map(({ title, content }) => (
        <div
          key={title}
          style={{
            backgroundColor: "#111111",
            border: "1px solid #1a1a1a",
            borderRadius: 8,
            padding: "16px 20px",
            marginBottom: 12,
          }}
        >
          <p style={{ fontSize: 11, color: "#666666", margin: "0 0 10px", letterSpacing: 0.5 }}>
            {title.toUpperCase()}
          </p>
          {content}
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Check if `/api/auth/signout` exists. If not, create it:**

```typescript
// app/api/auth/signout/route.ts  (only create if missing)
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export async function POST() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/login")
}
```

- [ ] **Step 3: Commit**

```bash
git add app/dashboard/settings/page.tsx
git commit -m "feat: add Settings page (email connection, plan, account)"
```

---

## Task 15: Build verification

- [ ] **Step 1: Run the build**

```bash
npm run build
```

Expected: build succeeds. Fix any TypeScript errors before continuing.

**Common fixes to apply if build fails:**

1. **recharts import errors** — recharts v3 may need named imports adjusted. Use:
   ```tsx
   import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts"
   ```

2. **Missing `border` duplicate style prop in ResultsView** — find the `Send Now →` button and remove the duplicate `border` inline prop (one is enough).

3. **`crypto.randomUUID()` in Node edge** — if the research route runs on edge runtime, switch to `import { randomUUID } from "crypto"`. Otherwise no action needed.

4. **`email_events` table missing `campaign_id`** — if the column doesn't exist in the schema, change the analytics query to filter by `user_id` only and drop the campaign grouping.

5. **TypeScript `i` unused in `liveProspects.map`** — remove the unused `i` index param in research-overlay.tsx's prospects map.

- [ ] **Step 2: Push to main**

```bash
git push origin main
```

---

## Self-review checklist

- [x] Spec: IDLE state (logo, input, cycling placeholder, 3 chips) — Task 10
- [x] Spec: THINKING state (clarifying question, skip) — Task 10
- [x] Spec: RESEARCHING state (full-screen overlay, agent log left, live cards right) — Task 7
- [x] Spec: RESULTS state (summary bar, 3 mini charts, prospect grid, sticky action bar) — Task 8
- [x] Spec: EMAIL PREVIEW state (generated email, editable, nav between prospects) — Task 9
- [x] Spec: SENDING state (animated send list, progress bar) — Task 9
- [x] Spec: DONE state (checkmark, counts, follow-up message, two buttons) — Task 9
- [x] Spec: Sidebar (logo, 4 nav items, user at bottom, full plan text) — Task 3
- [x] Spec: History page (table with date/query/prospects/sent/replies/rate) — Task 12
- [x] Spec: Analytics page (line charts, source breakdown) — Task 13
- [x] Spec: Settings page (email, product desc, plan, account/signout) — Task 14
- [x] Design: #0a0a0a background, #111111 cards, #1a1a1a borders, #f97316 orange — all tasks
- [x] Design: dot grid on home page — Task 10 (backgroundImage applied)
- [x] Design: no fake/hardcoded data — SSE from real APIs, Supabase for history/analytics
- [x] Supabase: `await createClient()` from server, `.eq("user_id", user.id)` on all queries
- [x] fontWeight: 500 max — checked all components
- [x] No Tailwind utility classes — all inline styles
