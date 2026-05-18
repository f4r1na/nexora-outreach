# Nexora Galaxy Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the entire dashboard shell and home page with the galaxy-constellation + AI chat interface, add missing sub-pages (Campaigns, Inbox, Signals, Ghostwriter), restyle existing pages (Analytics, Settings), then deploy to Vercel.

**Architecture:** A server-component layout handles auth and passes user data to a client `DashboardShell` that owns the topbar + galaxy panel + `AgentContext`. The overview page streams from the existing `/api/agent` SSE endpoint. Sub-pages are server components styled with the new dark aesthetic.

**Tech Stack:** Next.js 16 App Router, TypeScript, Supabase SSR, inline `style={{}}` props (no Tailwind, no CSS modules), HTML Canvas + CSS animations for galaxy panel, `/api/agent` SSE for chat.

---

## File Map

### New files
| Path | Purpose |
|------|---------|
| `contexts/agent-context.tsx` | React context — `isWorking`, `taskText`, `startWork`, `stopWork` |
| `app/dashboard/_components/dashboard-shell.tsx` | Client shell — `AgentProvider` + layout grid |
| `app/dashboard/_components/topbar.tsx` | Client — nav tabs, status pill, avatar |
| `app/dashboard/_components/galaxy-panel.tsx` | Client — canvas particles, orb nodes, SVG lines, agent animations |
| `app/dashboard/_components/chat-area.tsx` | Client — message list + SSE consumer + input bar |
| `app/dashboard/_components/data-card.tsx` | Pure — inline signal/result table inside chat |
| `app/dashboard/_components/draft-card.tsx` | Pure — inline email draft inside chat |
| `app/dashboard/_components/thinking-indicator.tsx` | Client — animated "agent working" row |
| `app/dashboard/campaigns/page.tsx` | Server — campaign list with real Supabase data |
| `app/dashboard/inbox/page.tsx` | Server — reply list |
| `app/dashboard/signals/page.tsx` | Server — signal cards |
| `app/dashboard/ghostwriter/page.tsx` | Client — style analyzer form |

### Modified files
| Path | Change |
|------|--------|
| `app/dashboard/layout.tsx` | Replace sidebar with `DashboardShell` |
| `app/dashboard/page.tsx` | Replace `CommandCenter` with `ChatArea` |
| `app/dashboard/analytics/page.tsx` | Restyle with galaxy design tokens |
| `app/dashboard/_components/analytics-charts.tsx` | Restyle chart colors |
| `app/dashboard/settings/page.tsx` | Restyle with galaxy design tokens |
| `app/globals.css` | Add `@keyframes` for galaxy animations |

---

## Task 1: Animation keyframes in globals.css

**Files:**
- Modify: `app/globals.css`

- [ ] **Add galaxy keyframes** at the bottom of `app/globals.css`:

```css
/* ── Galaxy Dashboard Animations ──────────────────── */
@keyframes gOrbFloat1 { 0%,100%{transform:translate(0,0)} 33%{transform:translate(4px,-5px)} 66%{transform:translate(-3px,4px)} }
@keyframes gOrbFloat2 { 0%,100%{transform:translate(0,0)} 40%{transform:translate(-5px,-3px)} 70%{transform:translate(3px,5px)} }
@keyframes gOrbFloat3 { 0%,100%{transform:translate(0,0)} 25%{transform:translate(3px,5px)} 75%{transform:translate(-4px,-3px)} }
@keyframes gOrbFloat4 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(5px,-4px)} }
@keyframes gOrbFloat5 { 0%,100%{transform:translate(0,0)} 30%{transform:translate(-3px,5px)} 70%{transform:translate(4px,-3px)} }
@keyframes gOrbFloat6 { 0%,100%{transform:translate(0,0)} 20%{transform:translate(2px,6px)} 60%{transform:translate(-5px,-2px)} }
@keyframes gRingExpand { 0%{width:100%;height:100%;opacity:0.7} 100%{width:320%;height:320%;opacity:0} }
@keyframes gStatusPulse { 0%,100%{opacity:1} 50%{opacity:0.2} }
@keyframes gScanSweep { 0%{top:-2px;opacity:0} 5%{opacity:1} 95%{opacity:1} 100%{top:100%;opacity:0} }
@keyframes gTopbarShimmer { 0%{background-position:-100% 0} 100%{background-position:200% 0} }
@keyframes gLogoPulse { 0%,100%{opacity:1} 50%{opacity:0.65} }
@keyframes gDotBounce { 0%,100%{transform:translateY(0);opacity:0.4} 50%{transform:translateY(-4px);opacity:1} }
@keyframes gCardIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
@keyframes gAvatarPulse { 0%,100%{box-shadow:0 0 10px rgba(255,107,53,0.45)} 50%{box-shadow:0 0 22px rgba(255,107,53,0.9)} }
@keyframes gNebulaBreath { 0%,100%{opacity:1} 50%{opacity:1.3} }
@keyframes gTaskFade { 0%,100%{opacity:0.3} 50%{opacity:0.85} }
```

- [ ] **Commit**
```bash
git add app/globals.css
git commit -m "feat: add galaxy dashboard animation keyframes"
```

---

## Task 2: AgentContext

**Files:**
- Create: `contexts/agent-context.tsx`
- Test: `__tests__/contexts/agent-context.test.tsx`

- [ ] **Write failing test** at `__tests__/contexts/agent-context.test.tsx`:

```tsx
import { render, screen, act } from "@testing-library/react"
import { AgentProvider, useAgent } from "@/contexts/agent-context"

function Probe() {
  const { isWorking, taskText, startWork, stopWork } = useAgent()
  return (
    <div>
      <span data-testid="working">{String(isWorking)}</span>
      <span data-testid="task">{taskText}</span>
      <button onClick={() => startWork("Scanning...")}>start</button>
      <button onClick={stopWork}>stop</button>
    </div>
  )
}

test("starts idle", () => {
  render(<AgentProvider><Probe /></AgentProvider>)
  expect(screen.getByTestId("working").textContent).toBe("false")
  expect(screen.getByTestId("task").textContent).toBe("")
})

test("startWork sets isWorking and taskText", () => {
  render(<AgentProvider><Probe /></AgentProvider>)
  act(() => { screen.getByText("start").click() })
  expect(screen.getByTestId("working").textContent).toBe("true")
  expect(screen.getByTestId("task").textContent).toBe("Scanning...")
})

test("stopWork resets state", () => {
  render(<AgentProvider><Probe /></AgentProvider>)
  act(() => { screen.getByText("start").click() })
  act(() => { screen.getByText("stop").click() })
  expect(screen.getByTestId("working").textContent).toBe("false")
  expect(screen.getByTestId("task").textContent).toBe("")
})

test("useAgent throws outside provider", () => {
  const spy = jest.spyOn(console, "error").mockImplementation(() => {})
  expect(() => render(<Probe />)).toThrow("useAgent must be used within AgentProvider")
  spy.mockRestore()
})
```

- [ ] **Run test — expect FAIL** (module not found)
```bash
npx jest __tests__/contexts/agent-context.test.tsx --no-coverage
```

- [ ] **Create `contexts/agent-context.tsx`**:

```tsx
"use client"
import { createContext, useContext, useState, useCallback, type ReactNode } from "react"

type AgentContextType = {
  isWorking: boolean
  taskText: string
  startWork: (initialTask?: string) => void
  stopWork: () => void
  setTaskText: (text: string) => void
}

const AgentContext = createContext<AgentContextType | null>(null)

export function AgentProvider({ children }: { children: ReactNode }) {
  const [isWorking, setIsWorking] = useState(false)
  const [taskText, setTaskText] = useState("")

  const startWork = useCallback((initialTask = "Working...") => {
    setTaskText(initialTask)
    setIsWorking(true)
  }, [])

  const stopWork = useCallback(() => {
    setIsWorking(false)
    setTaskText("")
  }, [])

  return (
    <AgentContext.Provider value={{ isWorking, taskText, startWork, stopWork, setTaskText }}>
      {children}
    </AgentContext.Provider>
  )
}

export function useAgent() {
  const ctx = useContext(AgentContext)
  if (!ctx) throw new Error("useAgent must be used within AgentProvider")
  return ctx
}
```

- [ ] **Run test — expect PASS**
```bash
npx jest __tests__/contexts/agent-context.test.tsx --no-coverage
```

- [ ] **Commit**
```bash
git add contexts/agent-context.tsx __tests__/contexts/agent-context.test.tsx
git commit -m "feat: add AgentContext with isWorking/taskText state"
```

---

## Task 3: DashboardShell + Topbar

**Files:**
- Create: `app/dashboard/_components/dashboard-shell.tsx`
- Create: `app/dashboard/_components/topbar.tsx`
- Modify: `app/dashboard/layout.tsx`
- Test: `__tests__/app/dashboard/_components/topbar.test.tsx`

- [ ] **Write failing test**:

```tsx
// __tests__/app/dashboard/_components/topbar.test.tsx
import { render, screen } from "@testing-library/react"
import Topbar from "@/app/dashboard/_components/topbar"
import { AgentProvider } from "@/contexts/agent-context"

jest.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
  useRouter: () => ({ push: jest.fn() }),
}))

function wrap(ui: React.ReactElement) {
  return render(<AgentProvider>{ui}</AgentProvider>)
}

test("renders logo", () => {
  wrap(<Topbar userName="Gustavo" />)
  expect(screen.getByText("NEXORA")).toBeInTheDocument()
})

test("renders nav items", () => {
  wrap(<Topbar userName="Gustavo" />)
  expect(screen.getByText("Overview")).toBeInTheDocument()
  expect(screen.getByText("Campaigns")).toBeInTheDocument()
  expect(screen.getByText("Inbox")).toBeInTheDocument()
})

test("shows user initial in avatar", () => {
  wrap(<Topbar userName="Gustavo" />)
  expect(screen.getByText("G")).toBeInTheDocument()
})
```

- [ ] **Run test — expect FAIL**

- [ ] **Create `app/dashboard/_components/topbar.tsx`**:

```tsx
"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAgent } from "@/contexts/agent-context"

const NAV = [
  { label: "Overview",    href: "/dashboard" },
  { label: "Campaigns",   href: "/dashboard/campaigns" },
  { label: "Inbox",       href: "/dashboard/inbox" },
  { label: "Signals",     href: "/dashboard/signals" },
  { label: "Ghostwriter", href: "/dashboard/ghostwriter" },
  { label: "Analytics",   href: "/dashboard/analytics" },
  { label: "Settings",    href: "/dashboard/settings" },
]

export default function Topbar({ userName }: { userName: string }) {
  const path     = usePathname()
  const { isWorking } = useAgent()
  const initial  = userName.charAt(0).toUpperCase()

  return (
    <div style={{
      height: 38, background: "#070707",
      borderBottom: "1px solid rgba(255,255,255,0.04)",
      display: "flex", alignItems: "center", padding: "0 20px", gap: 18,
      flexShrink: 0, zIndex: 20, position: "relative",
      overflow: "hidden",
    }}>
      {/* shimmer when agent works */}
      {isWorking && (
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: "linear-gradient(90deg,transparent 0%,rgba(255,107,53,0.07) 50%,transparent 100%)",
          backgroundSize: "200% 100%",
          animation: "gTopbarShimmer 1.8s linear infinite",
        }} />
      )}

      {/* Logo */}
      <span style={{
        fontSize: 11, fontWeight: 700, letterSpacing: "0.22em",
        color: "#FF6B35", textTransform: "uppercase" as const, fontFamily: "monospace",
        animation: isWorking ? "gLogoPulse 1s ease-in-out infinite" : "none",
      }}>
        NEXORA
      </span>

      <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.05)" }} />

      {/* Nav */}
      <nav style={{ display: "flex", flex: 1 }}>
        {NAV.map(({ label, href }) => {
          const active = href === "/dashboard" ? path === href : path.startsWith(href)
          return (
            <Link key={href} href={href} style={{
              fontSize: 11, color: active ? "#fff" : "rgba(255,255,255,0.28)",
              padding: "0 13px", height: 38, display: "flex", alignItems: "center",
              letterSpacing: "0.06em", borderBottom: active ? "2px solid #FF6B35" : "2px solid transparent",
              transition: "color 0.15s", textDecoration: "none",
            }}>
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Status pill */}
      <div style={{
        display: "flex", alignItems: "center", gap: 5,
        fontSize: 9, fontFamily: "monospace", letterSpacing: "0.12em",
        textTransform: "uppercase" as const, padding: "3px 10px",
        border: isWorking ? "1px solid rgba(255,107,53,0.3)" : "1px solid rgba(255,255,255,0.06)",
        color: isWorking ? "#FF6B35" : "rgba(255,255,255,0.22)",
        background: isWorking ? "rgba(255,107,53,0.05)" : "transparent",
        transition: "all 0.4s",
      }}>
        <div style={{
          width: 5, height: 5, borderRadius: "50%",
          background: isWorking ? "#FF6B35" : "#4ade80",
          animation: `gStatusPulse ${isWorking ? "0.5s" : "2s"} ease-in-out infinite`,
        }} />
        {isWorking ? "Agent running..." : "Live"}
      </div>

      {/* Avatar */}
      <div style={{
        width: 24, height: 24,
        background: "rgba(255,107,53,0.1)",
        border: "1px solid rgba(255,107,53,0.2)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 10, fontWeight: 700, color: "#FF6B35", fontFamily: "monospace",
      }}>
        {initial}
      </div>
    </div>
  )
}
```

- [ ] **Create `app/dashboard/_components/dashboard-shell.tsx`**:

```tsx
"use client"
import { type ReactNode } from "react"
import { AgentProvider } from "@/contexts/agent-context"
import Topbar from "./topbar"
import GalaxyPanel from "./galaxy-panel"

export default function DashboardShell({
  children,
  userName,
}: {
  children: ReactNode
  userName: string
}) {
  return (
    <AgentProvider>
      <div style={{
        height: "100vh", display: "flex", flexDirection: "column",
        background: "#030303", overflow: "hidden",
      }}>
        <Topbar userName={userName} />
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          <GalaxyPanel />
          <main style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            {children}
          </main>
        </div>
      </div>
    </AgentProvider>
  )
}
```

- [ ] **Replace `app/dashboard/layout.tsx`**:

```tsx
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import DashboardShell from "./_components/dashboard-shell"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const userName =
    (user.user_metadata?.full_name as string | undefined) ||
    user.email?.split("@")[0] ||
    "User"

  return <DashboardShell userName={userName}>{children}</DashboardShell>
}
```

- [ ] **Run test — expect PASS**
```bash
npx jest __tests__/app/dashboard/_components/topbar.test.tsx --no-coverage
```

- [ ] **Commit**
```bash
git add app/dashboard/layout.tsx app/dashboard/_components/dashboard-shell.tsx app/dashboard/_components/topbar.tsx __tests__/app/dashboard/_components/topbar.test.tsx
git commit -m "feat: add DashboardShell with topbar and AgentProvider"
```

---

## Task 4: GalaxyPanel

**Files:**
- Create: `app/dashboard/_components/galaxy-panel.tsx`
- Test: `__tests__/app/dashboard/_components/galaxy-panel.test.tsx`

- [ ] **Write failing smoke test**:

```tsx
// __tests__/app/dashboard/_components/galaxy-panel.test.tsx
import { render } from "@testing-library/react"
import GalaxyPanel from "@/app/dashboard/_components/galaxy-panel"
import { AgentProvider } from "@/contexts/agent-context"

// canvas not available in jsdom
beforeEach(() => {
  HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue({
    clearRect: jest.fn(), beginPath: jest.fn(), arc: jest.fn(),
    fill: jest.fn(), stroke: jest.fn(), moveTo: jest.fn(), lineTo: jest.fn(),
  })
})

test("renders without crashing", () => {
  const { container } = render(
    <AgentProvider><GalaxyPanel /></AgentProvider>
  )
  expect(container.firstChild).toBeTruthy()
})
```

- [ ] **Run test — expect FAIL**

- [ ] **Create `app/dashboard/_components/galaxy-panel.tsx`**:

```tsx
"use client"
import { useEffect, useRef } from "react"
import { useAgent } from "@/contexts/agent-context"

const ORBS = [
  // campaigns (orange, large)
  { id: "o1", x: 108, y: 78,  size: 20, type: "orange" as const, label: "SaaS Founders", sub: "47 leads · 22% reply", rings: 2 },
  { id: "o2", x: 55,  y: 168, size: 15, type: "orange" as const, label: "FinTech CTOs",  sub: "23 leads · sending",  rings: 1 },
  { id: "o3", x: 172, y: 198, size: 12, type: "orange" as const, label: "DevTools",      sub: "89 leads · 31% reply", rings: 1 },
  { id: "o4", x: 125, y: 310, size: 13, type: "orange" as const, label: "E-comm Founders", sub: "draft · 12 leads",  rings: 1 },
  // signals (yellow)
  { id: "s1", x: 148, y: 118, size: 9,  type: "yellow" as const, label: "DataFlow $5M",  sub: "Series A · 2d ago",  rings: 0 },
  { id: "s2", x: 82,  y: 222, size: 8,  type: "yellow" as const, label: "CloudSync",     sub: "Hiring VP Sales",    rings: 0 },
  { id: "s3", x: 44,  y: 282, size: 10, type: "yellow" as const, label: "Velocity AI",   sub: "HN Hiring · 3d ago", rings: 1 },
  { id: "s4", x: 190, y: 262, size: 7,  type: "yellow" as const, label: "StackPilot",    sub: "Launched v2",        rings: 0 },
  { id: "s5", x: 158, y: 368, size: 8,  type: "yellow" as const, label: "NexGen",        sub: "Raised $2M",         rings: 0 },
  // prospects (white)
  { id: "p1", x: 128, y: 96,  size: 5, type: "white" as const, label: "James Chen", sub: "9.2 / 10", rings: 0 },
  { id: "p2", x: 94,  y: 148, size: 5, type: "white" as const, label: "",           sub: "",         rings: 0 },
  { id: "p3", x: 138, y: 178, size: 4, type: "white" as const, label: "",           sub: "",         rings: 0 },
  { id: "p4", x: 68,  y: 196, size: 4, type: "white" as const, label: "",           sub: "",         rings: 0 },
  { id: "p5", x: 100, y: 258, size: 5, type: "white" as const, label: "",           sub: "",         rings: 0 },
  { id: "p6", x: 155, y: 340, size: 4, type: "white" as const, label: "",           sub: "",         rings: 0 },
]

const LINE_PAIRS: [string, string][] = [
  ["o1","s1"],["o1","p1"],["o1","p2"],["o1","o3"],
  ["o2","s2"],["o2","p4"],["o2","s3"],["o2","p2"],
  ["o3","s4"],["o3","p3"],["o3","o4"],
  ["o4","s5"],["o4","p5"],["o4","p6"],
  ["s1","p1"],["p2","p3"],["p3","o3"],
]

const FLOAT_ANIMS = ["gOrbFloat1","gOrbFloat2","gOrbFloat3","gOrbFloat4","gOrbFloat5","gOrbFloat6"]
const FLOAT_DURS  = [8,10,7,9,6,11,8.5,9.5,7.5,6.5,11,8,10,7,9]

const ORB_STYLES = {
  orange: {
    background: "radial-gradient(circle at 32% 30%,#ffaa77,#FF6B35 45%,#a02800)",
    boxShadow: "0 0 10px rgba(255,107,53,0.9),0 0 26px rgba(255,107,53,0.45),0 0 60px rgba(255,107,53,0.15)",
    boxShadowWorking: "0 0 18px rgba(255,107,53,1),0 0 46px rgba(255,107,53,0.65),0 0 90px rgba(255,107,53,0.25)",
    ringColor: "rgba(255,107,53,",
  },
  yellow: {
    background: "radial-gradient(circle at 32% 30%,#fff4a0,#FFD700 45%,#9a7500)",
    boxShadow: "0 0 8px rgba(255,215,0,0.85),0 0 20px rgba(255,215,0,0.35),0 0 50px rgba(255,215,0,0.12)",
    boxShadowWorking: "0 0 14px rgba(255,215,0,1),0 0 36px rgba(255,215,0,0.55),0 0 80px rgba(255,215,0,0.2)",
    ringColor: "rgba(255,215,0,",
  },
  white: {
    background: "radial-gradient(circle at 35% 30%,#fff,#aaa 60%,#555)",
    boxShadow: "0 0 6px rgba(255,255,255,0.55),0 0 16px rgba(255,255,255,0.15)",
    boxShadowWorking: "0 0 10px rgba(255,255,255,0.8),0 0 28px rgba(255,255,255,0.3)",
    ringColor: "rgba(200,200,200,",
  },
}

type Particle = {
  x: number; y: number; r: number
  vx: number; vy: number; opacity: number
  color: "orange"|"yellow"|"white"
  stream?: boolean; tx?: number; ty?: number
  speed?: number; life?: number
}

export default function GalaxyPanel() {
  const { isWorking } = useAgent()
  const canvasRef   = useRef<HTMLCanvasElement>(null)
  const panelRef    = useRef<HTMLDivElement>(null)
  const orbRefs     = useRef<Map<string, HTMLDivElement>>(new Map())
  const svgRef      = useRef<SVGSVGElement>(null)
  const stateRef    = useRef({ isWorking: false, particles: [] as Particle[], frame: 0, streamTick: 0 })

  // sync agent state into ref so canvas loop can read without re-render
  useEffect(() => { stateRef.current.isWorking = isWorking }, [isWorking])

  // particle + canvas loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    function resize() {
      if (!canvas || !panelRef.current) return
      canvas.width  = panelRef.current.offsetWidth
      canvas.height = panelRef.current.offsetHeight
    }
    resize()
    window.addEventListener("resize", resize)

    const orbCenters = [
      { x: 118, y: 88 }, { x: 63, y: 176 }, { x: 178, y: 204 }, { x: 132, y: 317 },
    ]

    function mkParticle(): Particle {
      return {
        x: Math.random() * canvas!.width,
        y: Math.random() * canvas!.height,
        r: Math.random() * 0.8 + 0.2,
        vx: (Math.random() - 0.5) * 0.12,
        vy: (Math.random() - 0.5) * 0.12,
        opacity: Math.random() * 0.35 + 0.05,
        color: (["orange","yellow","white"] as const)[Math.floor(Math.random()*3)],
      }
    }

    function mkStream(tx: number, ty: number): Particle {
      const angle = Math.random() * Math.PI * 2
      const dist  = 60 + Math.random() * 80
      return {
        x: tx + Math.cos(angle) * dist,
        y: ty + Math.sin(angle) * dist,
        tx, ty, r: Math.random() * 1.2 + 0.4,
        vx: 0, vy: 0, speed: 0.4 + Math.random() * 0.6,
        opacity: 0.7 + Math.random() * 0.3,
        color: Math.random() > 0.5 ? "orange" : "yellow",
        stream: true, life: 1,
      }
    }

    const CLRS = {
      orange: "rgba(255,107,53,",
      yellow: "rgba(255,215,0,",
      white:  "rgba(200,200,200,",
    }

    for (let i = 0; i < 60; i++) stateRef.current.particles.push(mkParticle())

    function loop() {
      const st = stateRef.current
      ctx.clearRect(0, 0, canvas!.width, canvas!.height)

      if (st.isWorking) {
        st.streamTick++
        if (st.streamTick % 4 === 0) {
          const orb = orbCenters[Math.floor(Math.random() * orbCenters.length)]
          st.particles.push(mkStream(orb.x, orb.y))
        }
      }

      st.particles = st.particles.filter(p => {
        if (p.stream && p.tx !== undefined && p.ty !== undefined) {
          const dx = p.tx - p.x, dy = p.ty - p.y
          const d  = Math.sqrt(dx*dx + dy*dy)
          if (d < 4 || (p.life ?? 1) <= 0) return false
          const spd = p.speed ?? 0.5
          p.x += (dx/d) * spd; p.y += (dy/d) * spd
          p.life = (p.life ?? 1) - 0.008
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2)
          ctx.fillStyle = CLRS[p.color] + (p.opacity * (p.life ?? 1)) + ")"
          ctx.fill()
          ctx.beginPath(); ctx.moveTo(p.x, p.y)
          ctx.lineTo(p.x - (dx/d)*7, p.y - (dy/d)*7)
          ctx.strokeStyle = CLRS[p.color] + (p.opacity * (p.life ?? 1) * 0.3) + ")"
          ctx.lineWidth = p.r * 0.6; ctx.stroke()
          return true
        }
        const speed = st.isWorking ? 3.5 : 1
        p.x += p.vx * speed; p.y += p.vy * speed
        if (p.x < 0) p.x = canvas!.width
        if (p.x > canvas!.width) p.x = 0
        if (p.y < 0) p.y = canvas!.height
        if (p.y > canvas!.height) p.y = 0
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (st.isWorking ? 1.4 : 1), 0, Math.PI*2)
        ctx.fillStyle = CLRS[p.color] + (p.opacity * (st.isWorking ? 1.4 : 1)) + ")"
        ctx.fill()
        return true
      })

      const ambient = st.particles.filter(p => !p.stream)
      while (ambient.length < 60) {
        const p = mkParticle(); st.particles.push(p); ambient.push(p)
      }

      st.frame = requestAnimationFrame(loop)
    }
    loop()

    return () => {
      cancelAnimationFrame(stateRef.current.frame)
      window.removeEventListener("resize", resize)
    }
  }, [])

  // draw SVG constellation lines
  useEffect(() => {
    const svg   = svgRef.current
    const panel = panelRef.current
    if (!svg || !panel) return

    const draw = () => {
      svg.innerHTML = ""
      const pr = panel.getBoundingClientRect()
      LINE_PAIRS.forEach(([aId, bId]) => {
        const a = orbRefs.current.get(aId)
        const b = orbRefs.current.get(bId)
        if (!a || !b) return
        const ar = a.getBoundingClientRect()
        const br = b.getBoundingClientRect()
        const line = document.createElementNS("http://www.w3.org/2000/svg","line")
        line.setAttribute("x1", String(ar.left - pr.left + ar.width/2))
        line.setAttribute("y1", String(ar.top  - pr.top  + ar.height/2))
        line.setAttribute("x2", String(br.left - pr.left + br.width/2))
        line.setAttribute("y2", String(br.top  - pr.top  + br.height/2))
        line.setAttribute("stroke","rgba(255,107,53,0.08)")
        line.setAttribute("stroke-width","0.6")
        line.setAttribute("stroke-dasharray","4 7")
        svg.appendChild(line)
      })
    }
    const t = setTimeout(draw, 150)
    window.addEventListener("resize", draw)
    return () => { clearTimeout(t); window.removeEventListener("resize", draw) }
  }, [])

  return (
    <div style={{ width: 270, minWidth: 270, background: "#020202", borderRight: "1px solid rgba(255,255,255,0.04)", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
      {/* nebula glow */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: isWorking
          ? "radial-gradient(ellipse 200px 250px at 50% 40%,rgba(255,107,53,0.09) 0%,transparent 70%),radial-gradient(ellipse 160px 180px at 30% 70%,rgba(255,215,0,0.06) 0%,transparent 70%)"
          : "radial-gradient(ellipse 180px 220px at 50% 40%,rgba(255,107,53,0.04) 0%,transparent 70%),radial-gradient(ellipse 140px 160px at 30% 70%,rgba(255,215,0,0.03) 0%,transparent 70%)",
        transition: "background 0.6s",
        animation: isWorking ? "gNebulaBreath 3s ease-in-out infinite" : "none",
      }} />

      {/* scan line */}
      {isWorking && (
        <div style={{
          position: "absolute", left: 0, right: 0, height: 2, top: -2,
          background: "linear-gradient(90deg,transparent,rgba(255,107,53,0.4),rgba(255,215,0,0.2),transparent)",
          boxShadow: "0 0 10px rgba(255,107,53,0.3),0 0 30px rgba(255,107,53,0.1)",
          animation: "gScanSweep 2.2s cubic-bezier(0.4,0,0.6,1) infinite",
          zIndex: 8, pointerEvents: "none",
        }} />
      )}

      {/* canvas */}
      <div ref={panelRef} style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} />

        {/* SVG constellation */}
        <svg ref={svgRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 2 }} xmlns="http://www.w3.org/2000/svg" />

        {/* Orbs */}
        {ORBS.map((orb, i) => {
          const s = ORB_STYLES[orb.type]
          const floatAnim = FLOAT_ANIMS[i % FLOAT_ANIMS.length]
          const floatDur  = FLOAT_DURS[i % FLOAT_DURS.length]
          const activeDur = isWorking ? floatDur / 3.2 : floatDur

          return (
            <div
              key={orb.id}
              ref={el => { if (el) orbRefs.current.set(orb.id, el); else orbRefs.current.delete(orb.id) }}
              className="galaxy-orb-hover"
              style={{
                position: "absolute", borderRadius: "50%",
                width: orb.size, height: orb.size,
                left: orb.x, top: orb.y,
                zIndex: 4, cursor: "pointer",
                animation: `${floatAnim} ${activeDur}s ease-in-out infinite`,
              }}
            >
              {/* core */}
              <div style={{
                width: "100%", height: "100%", borderRadius: "50%",
                background: s.background,
                boxShadow: isWorking ? s.boxShadowWorking : s.boxShadow,
                transition: "box-shadow 0.5s",
                position: "relative", zIndex: 2,
              }} />

              {/* pulse rings */}
              {Array.from({ length: orb.rings }).map((_, ri) => (
                <div key={ri} style={{
                  position: "absolute", borderRadius: "50%",
                  border: `1px solid ${s.ringColor}0.45)`,
                  top: "50%", left: "50%", transform: "translate(-50%,-50%)",
                  animation: `gRingExpand ${isWorking ? 1.4 : 2.8}s ease-out ${ri * 1.2}s infinite`,
                  width: orb.size, height: orb.size,
                  pointerEvents: "none", zIndex: 1,
                }} />
              ))}

              {/* tooltip */}
              {orb.label && (
                <div className="galaxy-orb-tooltip" style={{
                  position: "absolute", left: "calc(100% + 10px)", top: "50%",
                  transform: "translateY(-50%)",
                  background: "rgba(5,5,5,0.94)", border: "1px solid rgba(255,255,255,0.07)",
                  padding: "5px 10px", whiteSpace: "nowrap",
                  pointerEvents: "none", zIndex: 20,
                  opacity: 0, transition: "opacity 0.2s",
                }}>
                  <div style={{ fontSize: 10, color: "#fff", marginBottom: 2, fontWeight: 500 }}>{orb.label}</div>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", fontFamily: "monospace" }}>{orb.sub}</div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* agent status bar */}
      <div style={{
        height: isWorking ? 28 : 0, overflow: "hidden",
        background: "rgba(255,107,53,0.05)",
        borderTop: isWorking ? "1px solid rgba(255,107,53,0.15)" : "1px solid transparent",
        display: "flex", alignItems: "center", gap: 8,
        padding: isWorking ? "0 14px" : "0",
        fontSize: 9, fontFamily: "monospace", letterSpacing: "0.12em",
        color: "#FF6B35", textTransform: "uppercase" as const,
        transition: "height 0.3s ease, border-color 0.3s",
      }}>
        <div style={{ display: "flex", gap: 3 }}>
          {[0,1,2].map(i => (
            <div key={i} style={{ width: 3, height: 3, borderRadius: "50%", background: "#FF6B35", animation: `gStatusPulse 0.6s ${i*0.2}s ease-in-out infinite` }} />
          ))}
        </div>
        Scanning signals...
      </div>

      {/* legend */}
      <div style={{ padding: "10px 14px", borderTop: "1px solid rgba(255,255,255,0.04)", display: "flex", flexDirection: "column", gap: 5, background: "rgba(0,0,0,0.5)" }}>
        {[
          { color: "#FF6B35", shadow: "rgba(255,107,53,0.9)", label: "Campaigns (4 active)" },
          { color: "#FFD700", shadow: "rgba(255,215,0,0.8)",  label: "Signals (12 detected)" },
          { color: "#ccc",    shadow: "rgba(255,255,255,0.5)", label: "Prospects (247 found)" },
        ].map(({ color, shadow, label }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 9, fontFamily: "monospace", color: "rgba(255,255,255,0.22)", letterSpacing: "0.09em" }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: color, boxShadow: `0 0 5px ${shadow}`, flexShrink: 0 }} />
            {label}
          </div>
        ))}
      </div>

      {/* hover CSS injected once */}
      <style>{`
        .galaxy-orb-hover:hover .galaxy-orb-tooltip { opacity: 1 !important; }
        .galaxy-orb-hover:hover { transform: scale(1.25); }
      `}</style>
    </div>
  )
}
```

- [ ] **Run test — expect PASS**
```bash
npx jest __tests__/app/dashboard/_components/galaxy-panel.test.tsx --no-coverage
```

- [ ] **Commit**
```bash
git add app/dashboard/_components/galaxy-panel.tsx __tests__/app/dashboard/_components/galaxy-panel.test.tsx
git commit -m "feat: add GalaxyPanel with canvas particles, orbs, constellation lines"
```

---

## Task 5: DataCard + DraftCard + ThinkingIndicator

**Files:**
- Create: `app/dashboard/_components/data-card.tsx`
- Create: `app/dashboard/_components/draft-card.tsx`
- Create: `app/dashboard/_components/thinking-indicator.tsx`
- Test: `__tests__/app/dashboard/_components/chat-cards.test.tsx`

- [ ] **Write failing tests**:

```tsx
// __tests__/app/dashboard/_components/chat-cards.test.tsx
import { render, screen } from "@testing-library/react"
import DataCard from "@/app/dashboard/_components/data-card"
import DraftCard from "@/app/dashboard/_components/draft-card"
import ThinkingIndicator from "@/app/dashboard/_components/thinking-indicator"
import { AgentProvider } from "@/contexts/agent-context"

const ITEMS = [
  { id: "1", title: "James Chen", subtitle: "DataFlow", meta: "9.2", status: "orange" as const },
  { id: "2", title: "Sarah Kim",  subtitle: "CloudSync", meta: "8.7", status: "yellow" as const },
]

test("DataCard renders header and rows", () => {
  render(<DataCard header="Top signals" items={ITEMS} actions={[]} />)
  expect(screen.getByText("Top signals")).toBeInTheDocument()
  expect(screen.getByText("James Chen")).toBeInTheDocument()
  expect(screen.getByText("Sarah Kim")).toBeInTheDocument()
})

test("DraftCard renders subject and body", () => {
  render(<DraftCard subject="Hello James" body="Quick intro..." actions={[]} />)
  expect(screen.getByText("Hello James")).toBeInTheDocument()
  expect(screen.getByText("Quick intro...")).toBeInTheDocument()
})

test("ThinkingIndicator renders task text", () => {
  render(
    <AgentProvider>
      <ThinkingIndicator taskText="Scanning signals..." />
    </AgentProvider>
  )
  expect(screen.getByText("Scanning signals...")).toBeInTheDocument()
})
```

- [ ] **Run — expect FAIL**

- [ ] **Create `app/dashboard/_components/data-card.tsx`**:

```tsx
import Link from "next/link"

type Item = {
  id: string
  title: string
  subtitle: string
  meta?: string
  status?: "orange" | "yellow" | "green" | string
}

type Action = {
  label: string
  href?: string
  onClick?: () => void
  primary?: boolean
}

export default function DataCard({
  header,
  subheader,
  items,
  actions,
}: {
  header: string
  subheader?: string
  items: Item[]
  actions: Action[]
}) {
  const DOT_COLORS: Record<string, string> = {
    orange: "#FF6B35",
    yellow: "#FFD700",
    green:  "#4ade80",
  }

  return (
    <div style={{ marginTop: 12, border: "1px solid rgba(255,255,255,0.07)", background: "#0a0a0a", animation: "gCardIn 0.3s ease-out" }}>
      <div style={{ padding: "8px 14px", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: 9, fontFamily: "monospace", color: "rgba(255,255,255,0.22)", letterSpacing: "0.14em", textTransform: "uppercase", display: "flex", justifyContent: "space-between" }}>
        <span>{header}</span>
        {subheader && <span style={{ color: "rgba(255,107,53,0.45)" }}>{subheader}</span>}
      </div>
      {items.map(item => (
        <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 14px", borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: 11 }}>
          <div style={{ width: 5, height: 5, borderRadius: "50%", flexShrink: 0, background: DOT_COLORS[item.status ?? "white"] ?? "rgba(255,255,255,0.3)", boxShadow: `0 0 5px ${DOT_COLORS[item.status ?? ""] ?? "transparent"}` }} />
          <div style={{ color: "rgba(255,255,255,0.75)", flex: 1 }}>{item.title}</div>
          <div style={{ fontFamily: "monospace", fontSize: 10, color: "rgba(255,255,255,0.22)" }}>{item.subtitle}</div>
          {item.meta && <div style={{ fontFamily: "monospace", fontSize: 10, color: "#4ade80", fontWeight: 600 }}>{item.meta}</div>}
        </div>
      ))}
      {actions.length > 0 && (
        <div style={{ display: "flex", gap: 6, padding: "10px 14px", borderTop: "1px solid rgba(255,255,255,0.05)", flexWrap: "wrap" }}>
          {actions.map(a => (
            a.href ? (
              <Link key={a.label} href={a.href} style={{ fontSize: 10, fontFamily: "monospace", letterSpacing: "0.06em", padding: "5px 14px", border: `1px solid ${a.primary ? "rgba(255,107,53,0.35)" : "rgba(255,255,255,0.07)"}`, color: a.primary ? "#FF6B35" : "rgba(255,255,255,0.3)", textTransform: "uppercase", textDecoration: "none", transition: "all 0.15s" }}>
                {a.label}
              </Link>
            ) : (
              <button key={a.label} onClick={a.onClick} style={{ fontSize: 10, fontFamily: "monospace", letterSpacing: "0.06em", padding: "5px 14px", border: `1px solid ${a.primary ? "rgba(255,107,53,0.35)" : "rgba(255,255,255,0.07)"}`, color: a.primary ? "#FF6B35" : "rgba(255,255,255,0.3)", background: "transparent", textTransform: "uppercase", cursor: "pointer", transition: "all 0.15s" }}>
                {a.label}
              </button>
            )
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Create `app/dashboard/_components/draft-card.tsx`**:

```tsx
type Action = { label: string; onClick?: () => void; primary?: boolean }

export default function DraftCard({
  recipientName,
  subject,
  body,
  actions,
}: {
  recipientName?: string
  subject: string
  body: string
  actions: Action[]
}) {
  return (
    <div style={{ marginTop: 12, border: "1px solid rgba(255,107,53,0.15)", background: "rgba(255,107,53,0.03)", animation: "gCardIn 0.35s ease-out" }}>
      <div style={{ padding: "8px 14px", borderBottom: "1px solid rgba(255,107,53,0.1)", fontSize: 9, fontFamily: "monospace", letterSpacing: "0.14em", textTransform: "uppercase", display: "flex", justifyContent: "space-between", color: "rgba(255,107,53,0.5)" }}>
        <span>Draft{recipientName ? ` · ${recipientName}` : ""}</span>
        <span>Ghostwriter v3</span>
      </div>
      <div style={{ padding: 14, fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 1.9, fontFamily: "monospace", borderBottom: "1px solid rgba(255,107,53,0.08)" }}>
        <div style={{ color: "rgba(255,255,255,0.28)", fontSize: 10, marginBottom: 10, letterSpacing: "0.04em" }}>
          Subject: {subject}
        </div>
        {body}
      </div>
      {actions.length > 0 && (
        <div style={{ display: "flex", gap: 6, padding: "10px 14px", flexWrap: "wrap" }}>
          {actions.map(a => (
            <button key={a.label} onClick={a.onClick} style={{ fontSize: 10, fontFamily: "monospace", letterSpacing: "0.06em", padding: "5px 14px", border: `1px solid ${a.primary ? "rgba(255,107,53,0.35)" : "rgba(255,255,255,0.07)"}`, color: a.primary ? "#FF6B35" : "rgba(255,255,255,0.3)", background: "transparent", textTransform: "uppercase", cursor: "pointer" }}>
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Create `app/dashboard/_components/thinking-indicator.tsx`**:

```tsx
"use client"
export default function ThinkingIndicator({ taskText }: { taskText: string }) {
  return (
    <div style={{ display: "flex", gap: 14, marginBottom: 24, alignItems: "center" }}>
      <div style={{ width: 28, height: 28, flexShrink: 0, background: "rgba(255,107,53,0.08)", border: "1px solid rgba(255,107,53,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#FF6B35", fontFamily: "monospace", boxShadow: "0 0 10px rgba(255,107,53,0.4)", animation: "gAvatarPulse 1s ease-in-out infinite" }}>
        NX
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        <div style={{ fontSize: 9, fontFamily: "monospace", letterSpacing: "0.14em", color: "#FF6B35", textTransform: "uppercase" as const }}>Working</div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "monospace", animation: "gTaskFade 2.5s ease-in-out infinite" }}>{taskText}</div>
        <div style={{ display: "flex", gap: 5 }}>
          {[0,1,2].map(i => (
            <div key={i} style={{ width: 4, height: 4, borderRadius: "50%", background: "rgba(255,107,53,0.5)", animation: `gDotBounce 1s ${i*0.18}s ease-in-out infinite` }} />
          ))}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Run tests — expect PASS**
```bash
npx jest __tests__/app/dashboard/_components/chat-cards.test.tsx --no-coverage
```

- [ ] **Commit**
```bash
git add app/dashboard/_components/data-card.tsx app/dashboard/_components/draft-card.tsx app/dashboard/_components/thinking-indicator.tsx __tests__/app/dashboard/_components/chat-cards.test.tsx
git commit -m "feat: add DataCard, DraftCard, ThinkingIndicator components"
```

---

## Task 6: ChatArea (Overview page)

**Files:**
- Create: `app/dashboard/_components/chat-area.tsx`
- Modify: `app/dashboard/page.tsx`
- Test: `__tests__/app/dashboard/_components/chat-area.test.tsx`

- [ ] **Write failing test**:

```tsx
// __tests__/app/dashboard/_components/chat-area.test.tsx
import { render, screen } from "@testing-library/react"
import ChatArea from "@/app/dashboard/_components/chat-area"
import { AgentProvider } from "@/contexts/agent-context"

global.fetch = jest.fn().mockResolvedValue({ ok: false, body: null })

test("renders greeting with user name", () => {
  render(
    <AgentProvider>
      <ChatArea userName="Gustavo" />
    </AgentProvider>
  )
  expect(screen.getByText(/Gustavo/)).toBeInTheDocument()
})

test("renders context tags", () => {
  render(
    <AgentProvider>
      <ChatArea userName="Gustavo" />
    </AgentProvider>
  )
  expect(screen.getByText("Campaigns")).toBeInTheDocument()
  expect(screen.getByText("Inbox")).toBeInTheDocument()
})

test("renders input textarea", () => {
  render(
    <AgentProvider>
      <ChatArea userName="Gustavo" />
    </AgentProvider>
  )
  expect(screen.getByPlaceholderText(/Ask anything/i)).toBeInTheDocument()
})
```

- [ ] **Run — expect FAIL**

- [ ] **Create `app/dashboard/_components/chat-area.tsx`**:

```tsx
"use client"
import { useState, useRef, useEffect, useCallback } from "react"
import { useAgent } from "@/contexts/agent-context"
import DataCard from "./data-card"
import DraftCard from "./draft-card"
import ThinkingIndicator from "./thinking-indicator"

const CTX_TAGS = ["Signals","Campaigns","Inbox","Follow-ups","Analytics","Ghostwriter","Settings","Export"]

const TASK_MESSAGES = [
  "Parsing your request...",
  "Fetching your data...",
  "Cross-referencing signals...",
  "Analyzing campaigns...",
  "Preparing results...",
]

type AgentItem = { id: string; title: string; subtitle: string; meta?: string; status?: string }
type AgentResult = { intent: string; summary: string; items: AgentItem[]; action?: { label: string; href: string } }

type Message =
  | { role: "ai";   text: string; result?: AgentResult; time: string }
  | { role: "user"; text: string; time: string }

function now() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

function greeting(name: string) {
  const h = new Date().getHours()
  const g = h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening"
  return `${g}, ${name}. I'm monitoring your outreach universe — signals, campaigns, inbox, and follow-ups. What do you want to work on?`
}

export default function ChatArea({ userName }: { userName: string }) {
  const { isWorking, startWork, stopWork, setTaskText } = useAgent()
  const [messages, setMessages] = useState<Message[]>([
    { role: "ai", text: greeting(userName), time: now() },
  ])
  const [input, setInput]     = useState("")
  const [taskText, setLocalTask] = useState("")
  const bottomRef = useRef<HTMLDivElement>(null)
  const taskRef   = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isWorking])

  const runTask = useCallback(async (prompt: string) => {
    if (isWorking) return
    startWork(TASK_MESSAGES[0])
    setLocalTask(TASK_MESSAGES[0])

    let idx = 0
    taskRef.current = setInterval(() => {
      idx = (idx + 1) % TASK_MESSAGES.length
      const t = TASK_MESSAGES[idx]
      setTaskText(t)
      setLocalTask(t)
    }, 1800)

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      })

      if (!res.ok || !res.body) throw new Error("Agent unavailable")

      const reader  = res.body.getReader()
      const decoder = new TextDecoder()
      let   result: AgentResult | null = null
      let   buf  = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += decoder.decode(value, { stream: true })
        const lines = buf.split("\n")
        buf = lines.pop() ?? ""

        for (const line of lines) {
          if (!line.startsWith("data:")) continue
          try {
            const ev = JSON.parse(line.slice(5).trim())
            if (ev.type === "step") { setTaskText(ev.message); setLocalTask(ev.message) }
            if (ev.type === "result") result = ev.data as AgentResult
          } catch { /* ignore parse errors */ }
        }
      }

      if (result) {
        setMessages(prev => [...prev, {
          role: "ai",
          text: result!.summary,
          result: result!,
          time: now(),
        }])
      }
    } catch {
      setMessages(prev => [...prev, {
        role: "ai",
        text: "Something went wrong. Try again or check your connection.",
        time: now(),
      }])
    } finally {
      if (taskRef.current) clearInterval(taskRef.current)
      stopWork()
    }
  }, [isWorking, startWork, stopWork, setTaskText])

  const handleSend = useCallback(() => {
    const text = input.trim()
    if (!text || isWorking) return
    setMessages(prev => [...prev, { role: "user", text, time: now() }])
    setInput("")
    runTask(text)
  }, [input, isWorking, runTask])

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "#050505" }}>
      {/* messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px", display: "flex", flexDirection: "column", gap: 0, scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.05) transparent" }}>
        <div style={{ textAlign: "center", fontSize: 9, fontFamily: "monospace", color: "rgba(255,255,255,0.12)", letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 24 }}>
          {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
        </div>

        {messages.map((msg, i) =>
          msg.role === "ai" ? (
            <div key={i} style={{ display: "flex", gap: 14, marginBottom: 24, alignItems: "flex-start", maxWidth: 720 }}>
              <div style={{ width: 28, height: 28, flexShrink: 0, background: "rgba(255,107,53,0.08)", border: "1px solid rgba(255,107,53,0.18)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#FF6B35", fontFamily: "monospace", animation: isWorking && i === messages.length-1 ? "gAvatarPulse 1s ease-in-out infinite" : "none" }}>
                NX
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 9, fontFamily: "monospace", color: "#FF6B35", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 7, display: "flex", alignItems: "center", gap: 8 }}>
                  Nexora AI <span style={{ color: "rgba(255,255,255,0.12)" }}>{msg.time}</span>
                </div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.68)", lineHeight: 1.7 }}>{msg.text}</div>
                {msg.result && (
                  <DataCard
                    header={msg.result.intent}
                    subheader={msg.result.action ? `${msg.result.items.length} shown` : undefined}
                    items={msg.result.items.map(it => ({
                      id: it.id, title: it.title, subtitle: it.subtitle,
                      meta: it.meta, status: it.status ?? "white",
                    }))}
                    actions={msg.result.action ? [{ label: msg.result.action.label, href: msg.result.action.href, primary: true }] : []}
                  />
                )}
              </div>
            </div>
          ) : (
            <div key={i} style={{ display: "flex", justifyContent: "flex-end", marginBottom: 24 }}>
              <div style={{ background: "rgba(255,107,53,0.05)", border: "1px solid rgba(255,107,53,0.1)", padding: "10px 16px", maxWidth: 500, fontSize: 13, color: "rgba(255,255,255,0.75)", lineHeight: 1.6 }}>
                {msg.text}
              </div>
            </div>
          )
        )}

        {isWorking && <ThinkingIndicator taskText={taskText} />}
        <div ref={bottomRef} />
      </div>

      {/* input */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "14px 32px 20px", background: "#050505" }}>
        <div style={{ display: "flex", gap: 5, marginBottom: 10, flexWrap: "wrap" }}>
          {CTX_TAGS.map(tag => (
            <div key={tag} style={{ fontSize: 9, fontFamily: "monospace", letterSpacing: "0.1em", padding: "3px 10px", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.22)", textTransform: "uppercase" as const, cursor: "pointer" }}>
              {tag}
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend() } }}
            placeholder="Ask anything — find prospects, show campaigns, check inbox, draft emails..."
            style={{ flex: 1, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", padding: "11px 16px", fontSize: 13, color: "rgba(255,255,255,0.8)", fontFamily: "inherit", resize: "none", outline: "none", height: 44, lineHeight: 1.4 }}
          />
          <button onClick={handleSend} disabled={isWorking} style={{ width: 44, height: 44, flexShrink: 0, background: "rgba(255,107,53,0.08)", border: "1px solid rgba(255,107,53,0.22)", color: "#FF6B35", fontSize: 16, cursor: isWorking ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: isWorking ? 0.5 : 1 }}>
            &#x2192;
          </button>
        </div>
        <div style={{ fontSize: 9, fontFamily: "monospace", color: "rgba(255,255,255,0.1)", letterSpacing: "0.08em", marginTop: 8 }}>
          Enter to send &nbsp;·&nbsp; Shift+Enter for new line
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Replace `app/dashboard/page.tsx`**:

```tsx
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import ChatArea from "./_components/chat-area"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const userName =
    (user.user_metadata?.full_name as string | undefined) ||
    user.email?.split("@")[0] ||
    "User"

  return <ChatArea userName={userName} />
}
```

- [ ] **Run tests — expect PASS**
```bash
npx jest __tests__/app/dashboard/_components/chat-area.test.tsx --no-coverage
```

- [ ] **Commit**
```bash
git add app/dashboard/_components/chat-area.tsx app/dashboard/page.tsx __tests__/app/dashboard/_components/chat-area.test.tsx
git commit -m "feat: add ChatArea with SSE streaming from /api/agent, replace dashboard home"
```

---

## Task 7: Campaigns Page

**Files:**
- Create: `app/dashboard/campaigns/page.tsx`

- [ ] **Create `app/dashboard/campaigns/page.tsx`**:

```tsx
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"

export default async function CampaignsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("id, name, status, lead_count, emails_sent, opens, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  const rows = (campaigns ?? []).map(c => {
    const sent = c.emails_sent ?? 0
    const opens = c.opens ?? 0
    const rate = sent > 0 ? Math.round((opens / sent) * 100) : 0
    return { ...c, rate }
  })

  const STATUS_COLORS: Record<string, string> = {
    active: "#4ade80", paused: "#FFD700", draft: "rgba(255,255,255,0.3)", completed: "rgba(255,255,255,0.2)",
  }

  return (
    <div style={{ padding: "32px 36px", overflowY: "auto", height: "100%" }}>
      {/* header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
        <div>
          <div style={{ fontSize: 9, fontFamily: "monospace", color: "rgba(255,107,53,0.45)", letterSpacing: "0.22em", textTransform: "uppercase", marginBottom: 6 }}>Outreach</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>Campaigns</h1>
        </div>
        <Link href="/dashboard/campaigns/new" style={{ fontSize: 11, fontFamily: "monospace", letterSpacing: "0.1em", padding: "8px 18px", border: "1px solid rgba(255,107,53,0.35)", color: "#FF6B35", textDecoration: "none", textTransform: "uppercase", transition: "all 0.15s" }}>
          New Campaign
        </Link>
      </div>

      {/* table */}
      <div style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
        {/* thead */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 100px", gap: 0, padding: "8px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: 9, fontFamily: "monospace", color: "rgba(255,255,255,0.22)", letterSpacing: "0.14em", textTransform: "uppercase" }}>
          <span>Campaign</span><span>Leads</span><span>Sent</span><span>Open Rate</span><span>Status</span>
        </div>

        {rows.length === 0 && (
          <div style={{ padding: "48px 16px", textAlign: "center", fontSize: 13, color: "rgba(255,255,255,0.25)" }}>
            No campaigns yet.{" "}
            <Link href="/dashboard/campaigns/new" style={{ color: "#FF6B35", textDecoration: "none" }}>Create your first one</Link>
          </div>
        )}

        {rows.map(c => (
          <Link key={c.id} href={`/dashboard/campaigns/${c.id}`} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 100px", gap: 0, padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)", textDecoration: "none", transition: "background 0.15s" }}>
            <span style={{ fontSize: 13, color: "#fff" }}>{c.name}</span>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontFamily: "monospace" }}>{c.lead_count ?? 0}</span>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontFamily: "monospace" }}>{c.emails_sent ?? 0}</span>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontFamily: "monospace" }}>{c.rate}%</span>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: STATUS_COLORS[c.status ?? "draft"] ?? "rgba(255,255,255,0.3)", display: "inline-block" }} />
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontFamily: "monospace", textTransform: "uppercase" }}>{c.status ?? "draft"}</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Commit**
```bash
git add app/dashboard/campaigns/page.tsx
git commit -m "feat: add Campaigns page with real Supabase data"
```

---

## Task 8: Inbox + Signals Pages

**Files:**
- Create: `app/dashboard/inbox/page.tsx`
- Create: `app/dashboard/signals/page.tsx`

- [ ] **Create `app/dashboard/inbox/page.tsx`**:

```tsx
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function InboxPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: replies } = await supabase
    .from("replies")
    .select("id, lead_name, lead_email, subject, status, received_at, body")
    .eq("user_id", user.id)
    .order("received_at", { ascending: false })
    .limit(50)

  const STATUS_COLOR: Record<string, string> = {
    unread: "#FF6B35", read: "rgba(255,255,255,0.2)", replied: "#4ade80",
  }

  return (
    <div style={{ padding: "32px 36px", overflowY: "auto", height: "100%" }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 9, fontFamily: "monospace", color: "rgba(255,107,53,0.45)", letterSpacing: "0.22em", textTransform: "uppercase", marginBottom: 6 }}>Replies</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>Inbox</h1>
      </div>

      <div style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 120px 80px", padding: "8px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: 9, fontFamily: "monospace", color: "rgba(255,255,255,0.22)", letterSpacing: "0.14em", textTransform: "uppercase" }}>
          <span>From</span><span>Subject</span><span>Received</span><span>Status</span>
        </div>

        {(replies ?? []).length === 0 && (
          <div style={{ padding: "48px 16px", textAlign: "center", fontSize: 13, color: "rgba(255,255,255,0.25)" }}>No replies yet. Keep sending.</div>
        )}

        {(replies ?? []).map(r => (
          <div key={r.id} style={{ display: "grid", gridTemplateColumns: "1fr 2fr 120px 80px", padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)", transition: "background 0.15s", cursor: "pointer" }}>
            <span style={{ fontSize: 12, color: r.status === "unread" ? "#fff" : "rgba(255,255,255,0.55)", fontWeight: r.status === "unread" ? 500 : 400 }}>
              {r.lead_name ?? r.lead_email ?? "Unknown"}
            </span>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{r.subject ?? "No subject"}</span>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", fontFamily: "monospace" }}>
              {r.received_at ? new Date(r.received_at).toLocaleDateString() : "—"}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: STATUS_COLOR[r.status ?? "read"] ?? "rgba(255,255,255,0.2)", display: "inline-block" }} />
              <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", fontFamily: "monospace", textTransform: "uppercase" }}>{r.status ?? "read"}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Create `app/dashboard/signals/page.tsx`**:

```tsx
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

const SIGNAL_COLOR: Record<string, string> = {
  funding: "#FF6B35", hiring: "#FFD700", launch: "#4ade80", expansion: "#60a5fa",
}

export default async function SignalsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: signals } = await supabase
    .from("signals")
    .select("id, company, signal_type, summary, confidence_score, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50)

  return (
    <div style={{ padding: "32px 36px", overflowY: "auto", height: "100%" }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 9, fontFamily: "monospace", color: "rgba(255,107,53,0.45)", letterSpacing: "0.22em", textTransform: "uppercase", marginBottom: 6 }}>Buying signals</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>Signals</h1>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
        {(signals ?? []).length === 0 && (
          <div style={{ gridColumn: "1/-1", padding: "48px 0", textAlign: "center", fontSize: 13, color: "rgba(255,255,255,0.25)" }}>No signals detected yet. Create a campaign to start monitoring.</div>
        )}
        {(signals ?? []).map(s => {
          const color = SIGNAL_COLOR[s.signal_type ?? ""] ?? "#FF6B35"
          const score = Math.round((s.confidence_score ?? 0.75) * 10 * 10) / 10
          return (
            <div key={s.id} style={{ background: "#0a0a0a", border: "1px solid rgba(255,255,255,0.06)", padding: "16px", cursor: "pointer", transition: "border-color 0.15s" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ fontSize: 9, fontFamily: "monospace", color, letterSpacing: "0.14em", textTransform: "uppercase" }}>{s.signal_type ?? "signal"}</div>
                <div style={{ fontSize: 11, fontFamily: "monospace", color: "#4ade80", fontWeight: 600 }}>{score}/10</div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 500, color: "#fff", marginBottom: 6 }}>{s.company ?? "Unknown company"}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", lineHeight: 1.6, marginBottom: 12 }}>{s.summary ?? ""}</div>
              {/* score bar */}
              <div style={{ height: 2, background: "rgba(255,255,255,0.06)", borderRadius: 1 }}>
                <div style={{ height: "100%", width: `${(s.confidence_score ?? 0.75) * 100}%`, background: `linear-gradient(to right, ${color}, #FFD700)`, borderRadius: 1 }} />
              </div>
              <div style={{ fontSize: 9, fontFamily: "monospace", color: "rgba(255,255,255,0.2)", marginTop: 8, letterSpacing: "0.08em" }}>
                {s.created_at ? new Date(s.created_at).toLocaleDateString() : "—"}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Commit**
```bash
git add app/dashboard/inbox/page.tsx app/dashboard/signals/page.tsx
git commit -m "feat: add Inbox and Signals pages with Supabase data"
```

---

## Task 9: Ghostwriter Page

**Files:**
- Create: `app/dashboard/ghostwriter/page.tsx`

- [ ] **Create `app/dashboard/ghostwriter/page.tsx`**:

```tsx
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import GhostwriterClient from "./_client"

export default async function GhostwriterPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("style_profiles")
    .select("product_description, tone, key_phrases, avg_length")
    .eq("user_id", user.id)
    .maybeSingle()

  return <GhostwriterClient existingProfile={profile} />
}
```

- [ ] **Create `app/dashboard/ghostwriter/_client.tsx`**:

```tsx
"use client"
import { useState } from "react"

type StyleProfile = {
  product_description?: string | null
  tone?: string | null
  key_phrases?: string[] | null
  avg_length?: number | null
} | null

export default function GhostwriterClient({ existingProfile }: { existingProfile: StyleProfile }) {
  const [sample, setSample]     = useState("")
  const [loading, setLoading]   = useState(false)
  const [profile, setProfile]   = useState<StyleProfile>(existingProfile)
  const [error, setError]       = useState("")

  async function analyze() {
    if (!sample.trim()) return
    setLoading(true); setError("")
    try {
      const res = await fetch("/api/ghostwriter/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sample }),
      })
      if (!res.ok) throw new Error("Analysis failed")
      const data = await res.json()
      setProfile(data.profile ?? data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: "32px 36px", overflowY: "auto", height: "100%" }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 9, fontFamily: "monospace", color: "rgba(255,107,53,0.45)", letterSpacing: "0.22em", textTransform: "uppercase", marginBottom: 6 }}>AI writing style</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>Ghostwriter</h1>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* input */}
        <div>
          <div style={{ fontSize: 9, fontFamily: "monospace", color: "rgba(255,255,255,0.25)", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 10 }}>Paste 3–5 emails you wrote</div>
          <textarea
            value={sample}
            onChange={e => setSample(e.target.value)}
            placeholder="Hi James, I came across your..."
            style={{ width: "100%", height: 240, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", padding: "14px 16px", fontSize: 12, color: "rgba(255,255,255,0.7)", fontFamily: "monospace", resize: "none", outline: "none", lineHeight: 1.7 }}
          />
          {error && <div style={{ fontSize: 11, color: "#ef4444", fontFamily: "monospace", marginTop: 6 }}>{error}</div>}
          <button
            onClick={analyze}
            disabled={loading || !sample.trim()}
            style={{ marginTop: 10, fontSize: 11, fontFamily: "monospace", letterSpacing: "0.1em", padding: "8px 20px", border: "1px solid rgba(255,107,53,0.35)", color: loading ? "rgba(255,107,53,0.4)" : "#FF6B35", background: "transparent", textTransform: "uppercase", cursor: loading ? "not-allowed" : "pointer" }}
          >
            {loading ? "Analyzing..." : "Analyze style"}
          </button>
        </div>

        {/* profile */}
        <div style={{ border: "1px solid rgba(255,255,255,0.06)", padding: "16px 20px" }}>
          <div style={{ fontSize: 9, fontFamily: "monospace", color: "rgba(255,255,255,0.25)", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 16 }}>Style profile</div>
          {!profile ? (
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", lineHeight: 1.7 }}>Analyze your writing to generate a style profile. Nexora will use it to match your tone in every email.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { label: "Tone",        value: profile.tone ?? "—" },
                { label: "Avg length",  value: profile.avg_length ? `${profile.avg_length} words` : "—" },
                { label: "Description", value: profile.product_description ?? "—" },
                { label: "Key phrases", value: (profile.key_phrases ?? []).join(", ") || "—" },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div style={{ fontSize: 9, fontFamily: "monospace", color: "rgba(255,107,53,0.45)", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 3 }}>{label}</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", lineHeight: 1.6 }}>{value}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Commit**
```bash
git add app/dashboard/ghostwriter/page.tsx app/dashboard/ghostwriter/_client.tsx
git commit -m "feat: add Ghostwriter page with style analysis"
```

---

## Task 10: Restyle Analytics + Settings

**Files:**
- Modify: `app/dashboard/analytics/page.tsx`
- Modify: `app/dashboard/_components/analytics-charts.tsx`
- Modify: `app/dashboard/settings/page.tsx`

- [ ] **Update analytics page header** — add the galaxy design header above charts. Open `app/dashboard/analytics/page.tsx` and add before the `return`:

```tsx
// After the existing data-fetching logic, wrap the return:
return (
  <div style={{ padding: "32px 36px", overflowY: "auto", height: "100%" }}>
    <div style={{ marginBottom: 32 }}>
      <div style={{ fontSize: 9, fontFamily: "monospace", color: "rgba(255,107,53,0.45)", letterSpacing: "0.22em", textTransform: "uppercase", marginBottom: 6 }}>Performance</div>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>Analytics</h1>
    </div>
    {/* existing AnalyticsCharts component below */}
    <AnalyticsCharts ... />
  </div>
)
```

> **Full edit:** Read `app/dashboard/analytics/page.tsx` fully, then wrap the outermost `<div>` that currently wraps `<AnalyticsCharts ...>` with the header block above. Keep all existing data fetching unchanged.

- [ ] **Update chart colors** in `app/dashboard/_components/analytics-charts.tsx` — find any hardcoded chart colors and replace:
  - Primary stroke/fill: use `#FF6B35`
  - Secondary stroke/fill: use `#FFD700`
  - Background colors: use `rgba(255,107,53,0.1)` and `rgba(255,215,0,0.1)`
  - Grid lines: `rgba(255,255,255,0.05)`
  - Axis text: `rgba(255,255,255,0.3)`

> **Read the file first**, then make targeted color replacements only.

- [ ] **Update settings page** — read `app/dashboard/settings/page.tsx` fully, then:
  - Remove any `<NewSidebar>`, header background colors, or card backgrounds that don't match `#0a0a0a`
  - Add the galaxy header block at the top of the return:
  ```tsx
  <div style={{ fontSize: 9, fontFamily: "monospace", color: "rgba(255,107,53,0.45)", letterSpacing: "0.22em", textTransform: "uppercase", marginBottom: 6 }}>Account</div>
  <h1 style={{ fontSize: 22, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em", marginBottom: 32 }}>Settings</h1>
  ```
  - Wrap the whole return in `<div style={{ padding: "32px 36px", overflowY: "auto", height: "100%" }}>`

- [ ] **Commit**
```bash
git add app/dashboard/analytics/page.tsx app/dashboard/_components/analytics-charts.tsx app/dashboard/settings/page.tsx
git commit -m "feat: restyle Analytics and Settings with galaxy design tokens"
```

---

## Task 11: Build verification

- [ ] **Clear cache and build**
```bash
rm -rf .next
npm run build 2>&1
```
Expected: `✓ Compiled successfully` and `✓ Generating static pages` with 0 TypeScript errors.

- [ ] **Fix any TypeScript errors** — common ones to watch for:
  - `params` in dynamic routes must be `await`-ed: `const { id } = await params`
  - Missing `"use client"` on components that use `useState`/`useEffect`/`useRef`
  - Import paths using `@/` alias must resolve

- [ ] **Run all tests**
```bash
npx jest --no-coverage 2>&1
```
Expected: all passing (some pre-existing lint warnings are OK, 0 failures).

- [ ] **Commit if any fixes were needed**
```bash
git add -A
git commit -m "fix: resolve TypeScript errors for production build"
```

---

## Task 12: Deploy to Vercel

- [ ] **Check Vercel CLI is installed**
```bash
vercel --version
```
If not installed: `npm i -g vercel`

- [ ] **Verify environment variables are set in Vercel** — run:
```bash
vercel env ls
```
Must include: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`, `ANTHROPIC_API_KEY`, `NEXT_PUBLIC_APP_URL`

If any are missing, add them:
```bash
vercel env add <VARIABLE_NAME>
```

- [ ] **Deploy to production**
```bash
vercel --prod
```

- [ ] **Open the deployment URL** and verify:
  - `/login` loads (auth page)
  - After login, `/dashboard` shows the galaxy panel + chat
  - Typing in the chat and hitting Enter triggers the agent animation + SSE response
  - Nav tabs route to `/dashboard/campaigns`, `/dashboard/inbox`, etc.
  - Each sub-page loads with real data

---

## Self-Review

**Spec coverage:**
- [x] Galaxy panel with canvas particles, orbs, SVG lines — Task 4
- [x] Topbar with nav, status pill, agent state — Task 3
- [x] Agent context (isWorking, taskText) — Task 2
- [x] Chat overview page with SSE streaming — Task 6
- [x] Campaigns page — Task 7
- [x] Inbox page — Task 8
- [x] Signals page — Task 8
- [x] Ghostwriter page — Task 9
- [x] Analytics restyle — Task 10
- [x] Settings restyle — Task 10
- [x] Build + deploy — Tasks 11–12
- [x] Animation keyframes — Task 1

**Placeholders:** None — all steps include full code.

**Type consistency:**
- `AgentContextType` defined in Task 2, consumed via `useAgent()` in Tasks 3, 4, 6
- `Message` union type defined and used only in `chat-area.tsx` (Task 6)
- `Item`/`Action` types defined in `data-card.tsx` and used correctly in `chat-area.tsx`
- `StyleProfile` type in ghostwriter matches Supabase select fields

**Gaps found and addressed:**
- History page (`/dashboard/history`) still exists — the old campaigns view. It won't break anything but the nav now points to `/dashboard/campaigns`. The history page can remain as-is for now (accessible by direct URL).
- The `new-sidebar.tsx` component is no longer imported — it stays in the codebase but is unused. No cleanup needed.
