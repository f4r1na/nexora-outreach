"use client"

import { useState, useEffect, useRef, type ReactNode } from "react"
import Link from "next/link"
import { ArrowRight, Check, Users, Send, ShieldCheck, Activity } from "lucide-react"

/* ─── Nexora Logo ────────────────────────────────────────────────────────── */
function NexoraLogo({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none"
      style={{ filter: "drop-shadow(0 0 8px rgba(249,115,22,0.4))" }}>
      <defs>
        <linearGradient id="nlg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#fbbf24" />
        </linearGradient>
      </defs>
      <path d="M4 4 L14 4 L34 44 L44 44 L44 4 L34 4 L14 44 L4 44 Z" fill="url(#nlg)" />
      <path d="M27 5 L19 27 L25 27 L18 43 L33 21 L27 21 Z" fill="#050505" opacity="0.82" />
    </svg>
  )
}

/* ─── SVG Icons ──────────────────────────────────────────────────────────── */
function CheckSVG({ color = "#4ade80", size = 11 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      style={{ display: "inline", verticalAlign: "middle", flexShrink: 0 }}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

function XMarkSVG() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
      stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round"
      style={{ display: "inline", verticalAlign: "middle", flexShrink: 0 }}>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  )
}

function SearchSVG() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
      stroke="#f97316" strokeWidth="2.5" strokeLinecap="round"
      style={{ display: "inline", verticalAlign: "middle", flexShrink: 0, animation: "searchRotate 2.5s ease-in-out infinite" }}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  )
}

function EnvelopeSVG() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
      stroke="#f97316" strokeWidth="2" strokeLinecap="round"
      style={{ display: "inline", verticalAlign: "middle", flexShrink: 0 }}>
      <rect x="2" y="4" width="20" height="16" rx="1" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  )
}

/* ─── Signal Ticker ──────────────────────────────────────────────────────── */
const TICKER_ITEMS = [
  "James Chen at DataFlow just triggered a funding signal",
  "Sarah Kim at CloudSync hired a VP of Sales",
  "Marcus Lee posted on HN Hiring",
  "DataPilot raised Series B",
  "3 new signals detected in last 60 seconds",
]

function TickerContent() {
  return (
    <span className="font-mono" style={{ fontSize: 10, color: "#555", whiteSpace: "nowrap" }}>
      {TICKER_ITEMS.map((item, i) => (
        <span key={i}>
          <span style={{
            display: "inline-block", width: 5, height: 5, borderRadius: "50%",
            background: "#f97316", verticalAlign: "middle", margin: "0 8px 1px",
            animation: "signalPulse 1.8s ease-in-out infinite",
            animationDelay: `${i * 0.3}s`,
          }} />
          {item}{"   ·   "}
        </span>
      ))}
    </span>
  )
}

function SignalTicker() {
  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 60,
      height: 32, background: "#0a0a0a", borderBottom: "1px solid #1a1a1a",
      display: "flex", alignItems: "center", overflow: "hidden",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 14px", flexShrink: 0, borderRight: "1px solid #1a1a1a" }}>
        <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#f97316", animation: "signalPulse 1.8s ease-in-out infinite" }} />
        <span className="font-mono" style={{ fontSize: 9, color: "#f97316", letterSpacing: "0.12em", fontWeight: 500 }}>SIGNALS</span>
      </div>
      <div style={{ flex: 1, overflow: "hidden" }}>
        <div style={{ display: "flex", whiteSpace: "nowrap", animation: "tickerScroll 55s linear infinite" }}>
          <TickerContent /><TickerContent />
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "0 12px", flexShrink: 0, borderLeft: "1px solid #1a1a1a" }}>
        <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#4ade80", animation: "signalPulse 1.8s ease-in-out infinite 0.4s" }} />
        <span className="font-mono" style={{ fontSize: 9, color: "#4ade80", letterSpacing: "0.12em", fontWeight: 500 }}>LIVE</span>
      </div>
    </div>
  )
}

/* ─── Social Proof Marquee ───────────────────────────────────────────────── */
const COMPANIES = ["DATAFLOW", "CLOUDSYNC", "VELOCITY AI", "STACKPILOT", "NEXGEN", "PULSEIO", "DRIFTLAB"]

function SocialProof() {
  const doubled = [...COMPANIES, ...COMPANIES]
  return (
    <div style={{ background: "#080808", borderTop: "1px solid #1a1a1a", borderBottom: "1px solid #1a1a1a", padding: "18px 0", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center" }}>
        <div style={{ flexShrink: 0, padding: "0 32px", borderRight: "1px solid #1e1e1e", whiteSpace: "nowrap" }}>
          <span className="font-mono" style={{ fontSize: 10, color: "#333", letterSpacing: "0.12em" }}>Trusted by founders at</span>
        </div>
        <div style={{ flex: 1, overflow: "hidden" }}>
          <div className="marquee-track font-mono" style={{ display: "flex", alignItems: "center", animation: "marqueeScroll 30s linear infinite", whiteSpace: "nowrap" }}>
            {doubled.map((name, i) => (
              <span key={i} style={{ display: "inline-flex", alignItems: "center" }}>
                <span className="marquee-item" style={{ fontSize: 11, color: "#3a3a3a", letterSpacing: "0.12em", padding: "0 28px", transition: "color 0.2s ease", cursor: "default" }}>{name}</span>
                <span style={{ display: "inline-block", width: 3, height: 3, borderRadius: "50%", background: "#f97316", opacity: 0.45, flexShrink: 0 }} />
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Scroll FadeIn ──────────────────────────────────────────────────────── */
function FadeIn({ children, delay = 0, className = "", style, from = "bottom" }: {
  children: ReactNode; delay?: number; className?: string; style?: React.CSSProperties; from?: "bottom" | "left" | "right"
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } }, { threshold: 0.1 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  const hiddenT = from === "left" ? "translateX(-28px)" : from === "right" ? "translateX(28px)" : "translateY(20px)"
  return (
    <div ref={ref} className={className} style={{ ...style, opacity: visible ? 1 : 0, transform: visible ? "translate(0)" : hiddenT, transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms` }}>
      {children}
    </div>
  )
}

/* ─── Animated Counter ───────────────────────────────────────────────────── */
function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => {
      const steps = 60; const dur = 1600; let i = 0
      const timer = setInterval(() => { i++; setCount(i >= steps ? value : Math.round((value / steps) * i)); if (i >= steps) clearInterval(timer) }, dur / steps)
      return () => clearInterval(timer)
    }, 700)
    return () => clearTimeout(t)
  }, [value])
  return <span style={{ fontVariantNumeric: "tabular-nums" }}>{count.toLocaleString()}{suffix}</span>
}

/* ─── Typewriter ─────────────────────────────────────────────────────────── */
function useTypewriter(text: string, speed = 45, startDelay = 900) {
  const [displayed, setDisplayed] = useState("")
  useEffect(() => {
    let i = 0; setDisplayed("")
    const t = setTimeout(() => {
      const timer = setInterval(() => { i++; setDisplayed(text.slice(0, i)); if (i >= text.length) clearInterval(timer) }, speed)
      return () => clearInterval(timer)
    }, startDelay)
    return () => clearTimeout(t)
  }, [text, speed, startDelay])
  return displayed
}

function CommandTypewriter({ text }: { text: string }) {
  const displayed = useTypewriter(text, 30, 100)
  return (
    <span className="font-mono" style={{ fontSize: 12 }}>
      <span style={{ color: "#e5e5e5" }}>{displayed}</span>
      <span style={{ display: "inline-block", width: 7, height: 13, background: "#f97316", marginLeft: 2, verticalAlign: "middle", animation: "blink 1.2s step-end infinite" }} />
    </span>
  )
}

/* ─── Limit Card ─────────────────────────────────────────────────────────── */
function LimitCard({ icon: Icon, title, body }: { icon: React.ComponentType<{ className?: string }>; title: string; body: string }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.06)", padding: "2rem", transition: "box-shadow 0.25s ease", boxShadow: hovered ? "0 0 48px rgba(249,115,22,0.09), inset 0 0 32px rgba(249,115,22,0.03)" : "none" }}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <div className="mb-5">
        <div style={{ display: "inline-flex", padding: "0.45rem", background: "linear-gradient(135deg, rgba(249,115,22,0.14), rgba(251,191,36,0.09))", border: "1px solid rgba(249,115,22,0.18)" }}>
          <Icon className="h-4 w-4 text-orange-500" />
        </div>
      </div>
      <h3 className="text-base font-semibold text-white mb-3 tracking-tight">{title}</h3>
      <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>{body}</p>
    </div>
  )
}

/* ─── Live Demo Terminal ─────────────────────────────────────────────────── */
type DemoLine = { icon?: "check" | "search" | "envelope"; text: string; score?: string; color: string; result?: string; sub?: string; indent?: boolean }

const DEMO_PHASES: Array<{ label: string; lines: DemoLine[]; duration: number }> = [
  {
    label: "SEARCHING",
    lines: [{ text: "Finding SaaS founders who raised Series A...", color: "#e5e5e5" }],
    duration: 2400,
  },
  {
    label: "SCANNING SOURCES",
    lines: [
      { text: "→ GitHub..............", color: "#f97316", result: "12 found" },
      { text: "→ HackerNews..........", color: "#f97316", result: "8 found" },
      { text: "→ ProductHunt.........", color: "#f97316", result: "6 found" },
      { text: "→ Cross-referencing...", color: "#fbbf24", result: "verifying" },
    ],
    duration: 4000,
  },
  {
    label: "RESULTS",
    lines: [
      { icon: "check", text: "James Chen · DataFlow Inc ·", score: " 9.2/10", color: "#4ade80", sub: "Raised $5M Series A · 2 days ago" },
      { icon: "check", text: "Sarah Kim · CloudSync ·", score: " 8.7/10", color: "#4ade80", sub: "Hired VP of Sales · 1 week ago" },
      { icon: "check", text: "Marcus Lee · Velocity AI ·", score: " 8.1/10", color: "#4ade80", sub: "Posted on HN Hiring · 3 days ago" },
    ],
    duration: 3800,
  },
  {
    label: "DRAFTING",
    lines: [
      { icon: "envelope", text: "Writing personalized email for James...", color: "#fbbf24" },
      { text: '"Hi James, saw DataFlow just closed Series A..."', color: "rgba(255,255,255,0.5)", indent: true },
      { text: "→ Email queued for delivery", color: "#f97316", indent: true },
    ],
    duration: 3200,
  },
  {
    label: "COMPLETE",
    lines: [{ icon: "check", text: "3 emails ready · Est. reply rate: 24%", color: "#4ade80" }],
    duration: 1800,
  },
]

const demoIcons: Record<string, ReactNode> = {
  check: <CheckSVG />,
  search: <SearchSVG />,
  envelope: <EnvelopeSVG />,
}

function LiveDemo() {
  const [phase, setPhase] = useState(0)
  const [visible, setVisible] = useState(0)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    const p = DEMO_PHASES[phase]
    const timers: ReturnType<typeof setTimeout>[] = []
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFading(false)
    p.lines.forEach((_, i) => { timers.push(setTimeout(() => setVisible(i + 1), i * 720 + 420)) })
    timers.push(setTimeout(() => {
      setFading(true)
      const sw = setTimeout(() => { setPhase((phase + 1) % DEMO_PHASES.length); setVisible(0) }, 450)
      timers.push(sw)
    }, p.duration + 2000))
    return () => timers.forEach(clearTimeout)
  }, [phase])

  const p = DEMO_PHASES[phase]

  return (
    <div style={{ background: "#0c0c0c", border: "1px solid rgba(249,115,22,0.18)", boxShadow: "0 0 30px rgba(249,115,22,0.15), 0 0 0 1px rgba(249,115,22,0.06), 0 24px 60px rgba(0,0,0,0.6)", position: "relative", overflow: "hidden", width: "100%" }}>
      <div className="font-mono" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.018)" }}>
        <div style={{ display: "flex", gap: 6 }}>
          {[0, 1, 2].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "rgba(255,255,255,0.13)" }} />)}
        </div>
        <span style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", letterSpacing: "0.16em" }}>NEXORA / RESEARCH AGENT</span>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", animation: "signalPulse 1.8s ease-in-out infinite" }} />
          <span style={{ fontSize: 9, color: "#4ade80", letterSpacing: "0.12em", fontWeight: 500 }}>LIVE</span>
        </div>
      </div>
      <div className="font-mono" style={{ padding: "10px 16px 4px", fontSize: 9, color: "rgba(249,115,22,0.4)", letterSpacing: "0.24em" }}>[{p.label}]</div>
      <div className="font-mono" style={{ padding: "8px 16px 22px", minHeight: 210, opacity: fading ? 0 : 1, transition: "opacity 0.4s ease" }}>
        {phase === 0 ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "#f97316", fontSize: 13 }}>{">"}</span>
            {visible > 0 && <CommandTypewriter key={phase} text={p.lines[0].text} />}
          </div>
        ) : (
          p.lines.slice(0, visible).map((line, i) => (
            <div key={i} style={{ marginBottom: line.sub ? 2 : 10, paddingLeft: line.indent ? 16 : 0, animation: "demoLineIn 0.3s ease-out forwards" }}>
              <div style={{ fontSize: 12, color: line.color, lineHeight: 1.5, display: "flex", alignItems: "center", gap: 6 }}>
                {line.icon && demoIcons[line.icon]}
                {line.result !== undefined ? (
                  <><span>{line.text}</span><span style={{ color: "#4ade80", fontSize: 11, opacity: 0.7 }}> {line.result}</span></>
                ) : (
                  <><span>{line.text}</span>{line.score && <span style={{ animation: "confidencePulse 1.2s ease-out forwards", animationDelay: "0.05s" }}>{line.score}</span>}</>
                )}
              </div>
              {line.sub && <div style={{ fontSize: 10, color: "rgba(255,255,255,0.24)", paddingLeft: 22, marginBottom: 8, lineHeight: 1.4 }}>{line.sub}</div>}
            </div>
          ))
        )}
      </div>
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, background: "rgba(255,255,255,0.04)" }}>
        <div key={phase} style={{ height: "100%", background: "linear-gradient(to right, #f97316, #fbbf24)", animation: `progressFill ${p.duration + 2000}ms linear forwards` }} />
      </div>
    </div>
  )
}

/* ─── Before / After ─────────────────────────────────────────────────────── */
function BeforeAfter() {
  const before = ["2% average reply rate", "40 hours/week on research", "100 emails → 2 replies", "$500/mo on prospect tools"]
  const after  = ["23% average reply rate", "2 hours/week on review", "20 emails → 5 meetings", "$0 on prospect tools"]
  return (
    <section className="px-6 py-24 md:px-12">
      <div className="max-w-5xl mx-auto">
        <FadeIn style={{ marginBottom: 40 }}>
          <p className="font-mono uppercase" style={{ fontSize: 10, color: "rgba(249,115,22,0.45)", letterSpacing: "0.25em", marginBottom: 12 }}>The difference</p>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight">Before and after.</h2>
        </FadeIn>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-stretch">
          <FadeIn from="left">
            <div style={{ background: "#0d0000", border: "1px solid rgba(239,68,68,0.18)", padding: "2rem", height: "100%" }}>
              <p className="font-mono uppercase" style={{ fontSize: 9, color: "rgba(239,68,68,0.6)", letterSpacing: "0.22em", marginBottom: 20 }}>Without Nexora</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {before.map((item, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <XMarkSVG />
                    <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.4 }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
          <FadeIn delay={60}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 20px" }}>
              <span style={{ fontSize: "1.75rem", fontWeight: 500, color: "#f97316", letterSpacing: "-0.02em", opacity: 0.9 }}>VS</span>
            </div>
          </FadeIn>
          <FadeIn from="right" delay={120}>
            <div style={{ background: "#000d00", border: "1px solid rgba(74,222,128,0.16)", padding: "2rem", height: "100%" }}>
              <p className="font-mono uppercase" style={{ fontSize: 9, color: "rgba(74,222,128,0.6)", letterSpacing: "0.22em", marginBottom: 20 }}>With Nexora</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {after.map((item, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <CheckSVG color="#4ade80" />
                    <span style={{ fontSize: 13, color: "rgba(255,255,255,0.72)", lineHeight: 1.4 }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  )
}

/* ─── Testimonials ───────────────────────────────────────────────────────── */
const TESTIMONIALS = [
  { quote: "Nexora found 15 qualified prospects in 3 minutes that would have taken me 2 days to find manually.", name: "Alex R.", role: "Founder at PulseIO" },
  { quote: "Our reply rate went from 3% to 19% in the first week. The signal-based emails are genuinely different.", name: "Maria S.", role: "Head of Sales at StackPilot" },
  { quote: "I cancelled Apollo the day I started using Nexora. Haven't looked back.", name: "David K.", role: "CEO at DriftLab" },
]

function Testimonials() {
  return (
    <section className="px-6 py-32 md:px-12">
      <div className="max-w-7xl mx-auto">
        <FadeIn style={{ marginBottom: 56 }}>
          <p className="font-mono uppercase" style={{ fontSize: 10, color: "rgba(249,115,22,0.45)", letterSpacing: "0.25em", marginBottom: 12 }}>Social proof</p>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight">What founders are saying</h2>
        </FadeIn>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {TESTIMONIALS.map((t, i) => (
            <FadeIn key={i} delay={i * 80}>
              <div style={{ background: "#111", border: "1px solid rgba(255,255,255,0.06)", padding: "2rem", height: "100%" }}>
                <div style={{ display: "flex", gap: 2, marginBottom: 20 }}>
                  {Array.from({ length: 5 }).map((_, s) => (
                    <svg key={s} width="12" height="12" viewBox="0 0 24 24" fill="#fbbf24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  ))}
                </div>
                <p style={{ fontSize: 14, color: "rgba(255,255,255,0.72)", lineHeight: 1.65, fontStyle: "italic", marginBottom: 24 }}>
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div>
                  <p style={{ fontSize: 13, color: "#f97316", fontWeight: 500 }}>{t.name}</p>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>{t.role}</p>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── FAQ ────────────────────────────────────────────────────────────────── */
const FAQ_ITEMS = [
  { q: "How does Nexora find real prospects?", a: "Our AI searches 7 public sources simultaneously, cross-references results, and only shows prospects verified on 2+ sources with signals from the last 90 days." },
  { q: "What counts as a buying signal?", a: "Funding announcements, hiring sprees, new product launches, executive hires, and HackerNews activity." },
  { q: "Do I need to connect multiple accounts?", a: "No. Just connect Gmail or Outlook once. Nexora handles all research using public data." },
  { q: "What happens after the 7-day trial?", a: "Choose a plan or cancel. No charges without your confirmation. No credit card to start." },
  { q: "How is this different from Apollo?", a: "Apollo gives you a database. Nexora gives you an AI agent that finds people with active buying signals right now and emails them automatically." },
  { q: "Can I cancel anytime?", a: "Yes. No contracts, no fees. Cancel in one click." },
]

function FAQ() {
  const [open, setOpen] = useState<number | null>(null)
  return (
    <section id="faq" className="px-6 py-32 md:px-12">
      <div className="max-w-3xl mx-auto">
        <FadeIn style={{ marginBottom: 56 }}>
          <p className="font-mono uppercase" style={{ fontSize: 10, color: "rgba(249,115,22,0.45)", letterSpacing: "0.25em", marginBottom: 12 }}>FAQ</p>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight">Common questions</h2>
        </FadeIn>
        {FAQ_ITEMS.map((item, i) => (
          <FadeIn key={i} delay={i * 30}>
            <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                style={{ width: "100%", textAlign: "left", padding: "20px 0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "none", border: "none", cursor: "pointer", gap: 16 }}
              >
                <span style={{ fontSize: 15, color: "rgba(255,255,255,0.85)", lineHeight: 1.4 }}>{item.q}</span>
                <span style={{ color: "#f97316", fontSize: 20, flexShrink: 0, lineHeight: 1, fontWeight: 400, transition: "transform 0.25s ease", transform: open === i ? "rotate(45deg)" : "rotate(0deg)" }}>+</span>
              </button>
              <div style={{ maxHeight: open === i ? 300 : 0, overflow: "hidden", transition: "max-height 0.35s ease" }}>
                <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", lineHeight: 1.7, paddingBottom: 24 }}>{item.a}</p>
              </div>
            </div>
          </FadeIn>
        ))}
      </div>
    </section>
  )
}

/* ─── Final CTA ──────────────────────────────────────────────────────────── */
function FinalCTA({ onPricingOpen }: { onPricingOpen: () => void }) {
  return (
    <section style={{ background: "#080808", borderTop: "1px solid #1a1a1a", borderBottom: "1px solid #1a1a1a" }} className="px-6 py-32 md:px-12">
      <div className="max-w-3xl mx-auto text-center">
        <FadeIn>
          <p className="font-mono uppercase" style={{ fontSize: 10, color: "rgba(249,115,22,0.45)", letterSpacing: "0.25em", marginBottom: 24 }}>Get started today</p>
          <h2 className="font-black tracking-tight" style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)", lineHeight: 1, marginBottom: 20 }}>
            Stop crafting.<br />
            <span style={{ backgroundImage: "linear-gradient(135deg, #f97316, #fbbf24)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              Start closing.
            </span>
          </h2>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.45)", lineHeight: 1.65, maxWidth: "42ch", margin: "0 auto 40px" }}>
            Join founders using Nexora to find real prospects and get real replies.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/signup" style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "#f97316", color: "#000", padding: "14px 28px", fontSize: 15, fontWeight: 600, borderRadius: 6, transition: "opacity 0.2s ease" }}
              onMouseEnter={e => { e.currentTarget.style.opacity = "0.85" }} onMouseLeave={e => { e.currentTarget.style.opacity = "1" }}>
              Start Free Trial
              <ArrowRight style={{ width: 16, height: 16 }} />
            </Link>
            <button onClick={onPricingOpen} style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "transparent", color: "rgba(255,255,255,0.65)", padding: "14px 24px", fontSize: 15, border: "1px solid rgba(255,255,255,0.14)", borderRadius: 6, cursor: "pointer", transition: "border-color 0.2s, color 0.2s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.35)"; (e.currentTarget as HTMLElement).style.color = "#fff" }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.14)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.65)" }}>
              View Pricing
            </button>
          </div>
          <p className="font-mono" style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginTop: 20, letterSpacing: "0.08em" }}>
            7-day free trial · No credit card · 30-day money back guarantee
          </p>
        </FadeIn>
      </div>
    </section>
  )
}

/* ─── Sticky CTA ─────────────────────────────────────────────────────────── */
function StickyCTA() {
  const [show, setShow] = useState(false)
  const [closed, setClosed] = useState(false)
  useEffect(() => {
    if (closed) return
    const fn = () => setShow(window.scrollY > 500)
    window.addEventListener("scroll", fn, { passive: true })
    return () => window.removeEventListener("scroll", fn)
  }, [closed])
  return (
    <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 55, background: "#111", borderTop: "1px solid #1a1a1a", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", transform: show ? "translateY(0)" : "translateY(100%)", transition: "transform 0.35s cubic-bezier(0.4,0,0.2,1)", pointerEvents: show ? "auto" : "none" }}>
      <span style={{ fontSize: 13, color: "rgba(255,255,255,0.55)" }}>Start closing more deals today</span>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Link href="/signup" style={{ background: "#f97316", color: "#000", padding: "8px 18px", fontSize: 13, fontWeight: 500, borderRadius: 6, whiteSpace: "nowrap", display: "inline-block" }}>
          Start Free Trial &rarr;
        </Link>
        <button onClick={() => { setClosed(true); setShow(false) }} style={{ color: "rgba(255,255,255,0.3)", background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", alignItems: "center" }} aria-label="Dismiss">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
        </button>
      </div>
    </div>
  )
}

/* ─── Pricing Modal ──────────────────────────────────────────────────────── */
const PRICING_PLANS = [
  {
    label: "Pro",
    price: "$199",
    period: "/month",
    featured: false,
    cta: "Start free trial",
    ctaHref: "/signup?plan=pro",
    features: [
      "200 prospects / month",
      "500 emails / month",
      "Auto follow-ups (3 days)",
      "Email tracking (opens / clicks / replies)",
      "Basic analytics",
    ],
  },
  {
    label: "Agency",
    price: "$499",
    period: "/month",
    featured: true,
    badge: "Most Popular",
    cta: "Start free trial",
    ctaHref: "/signup?plan=agency",
    features: [
      "1,000 prospects / month",
      "Unlimited emails",
      "Multiple workspaces",
      "Team collaboration",
      "Advanced analytics",
      "Priority support",
    ],
  },
  {
    label: "Enterprise",
    price: "Custom",
    period: "",
    featured: false,
    cta: "Contact sales",
    ctaHref: "/contact",
    features: [
      "Unlimited everything",
      "White label",
      "Custom integrations",
      "Dedicated support",
      "SLA guarantee",
    ],
  },
]

function PricingModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = "" }
  }, [])

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 90, background: "rgba(0,0,0,0.88)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px", animation: "modalFadeIn 0.25s ease-out" }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ background: "#0d0d0d", border: "1px solid rgba(255,255,255,0.08)", width: "100%", maxWidth: 900, maxHeight: "90vh", overflowY: "auto", position: "relative" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "24px 28px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div>
            <p className="font-mono uppercase" style={{ fontSize: 9, color: "rgba(249,115,22,0.5)", letterSpacing: "0.25em", marginBottom: 4 }}>Pricing</p>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>Simple, transparent pricing</h2>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.45)", cursor: "pointer", padding: "6px 10px", display: "flex", alignItems: "center", gap: 4, fontSize: 12, transition: "border-color 0.15s, color 0.15s" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.3)"; (e.currentTarget as HTMLElement).style.color = "#fff" }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.1)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.45)" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
            Close
          </button>
        </div>

        {/* Plans */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, padding: "28px" }}>
          {PRICING_PLANS.map(plan => (
            <div key={plan.label} style={{ position: "relative", border: plan.featured ? "1px solid rgba(249,115,22,0.45)" : "1px solid rgba(255,255,255,0.07)", background: plan.featured ? "rgba(249,115,22,0.04)" : "#111", padding: "24px", display: "flex", flexDirection: "column" }}>
              {plan.badge && (
                <div style={{ position: "absolute", top: -1, right: 20, background: "#f97316", color: "#000", fontSize: 9, fontWeight: 700, padding: "3px 10px", fontFamily: "monospace", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                  {plan.badge}
                </div>
              )}
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontSize: 11, color: plan.featured ? "#f97316" : "rgba(255,255,255,0.4)", fontFamily: "monospace", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>{plan.label}</p>
                <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
                  <span style={{ fontSize: 32, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>{plan.price}</span>
                  {plan.period && <span style={{ fontSize: 13, color: "rgba(255,255,255,0.35)" }}>{plan.period}</span>}
                </div>
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
                {plan.features.map(f => (
                  <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                    <CheckSVG color={plan.featured ? "#f97316" : "#4ade80"} size={10} />
                    <span style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", lineHeight: 1.4 }}>{f}</span>
                  </div>
                ))}
              </div>
              <Link href={plan.ctaHref} style={{ display: "block", textAlign: "center", padding: "10px 16px", fontSize: 13, fontWeight: 600, background: plan.featured ? "#f97316" : "transparent", color: plan.featured ? "#000" : "rgba(255,255,255,0.65)", border: plan.featured ? "none" : "1px solid rgba(255,255,255,0.15)", borderRadius: 4, textDecoration: "none", transition: "opacity 0.15s" }}
                onMouseEnter={e => { e.currentTarget.style.opacity = "0.8" }} onMouseLeave={e => { e.currentTarget.style.opacity = "1" }}>
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* Footer note */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "16px 28px", display: "flex", gap: 24, flexWrap: "wrap" }}>
          {["7-day free trial", "No credit card required", "Cancel anytime", "30-day money back"].map(note => (
            <div key={note} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <CheckSVG color="#4ade80" size={9} />
              <span className="font-mono" style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: "0.06em" }}>{note}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─── How It Works Modal (FAQ) ───────────────────────────────────────────── */
const HOW_FAQ = [
  {
    q: "How does Nexora find prospects?",
    a: "Nexora scans 6 real-time data sources in parallel: GitHub (repos, commits, founders), HackerNews (founder discussions), ProductHunt (product launches), Google News (funding announcements), LinkedIn (job postings, hiring signals), and Twitter (founder activity). Then it cross-references and scores every lead by signal strength -- only verified prospects make the cut.",
  },
  {
    q: "How are emails personalized?",
    a: "Each email is generated from actual signals found in your research -- not templates. Every email mentions their recent funding, product launch, hiring activity, LinkedIn role, or articles they published. Result: 34% reply rate vs. the 3% industry average.",
  },
  {
    q: "Can I edit and approve before sending?",
    a: "Yes. After Nexora drafts emails, you review all of them, edit anything you want, approve with one click, then send immediately or schedule. You stay in control of every email that goes out.",
  },
  {
    q: "What if someone replies?",
    a: "Nexora tracks all replies in real-time. See opens, clicks, and replies the moment they happen. Auto follow-up triggers after 3 days if no reply. Get instant notifications. Continue the conversation manually whenever you want.",
  },
  {
    q: "Do you have a free trial?",
    a: "Yes -- 7 days, full access, no credit card required. Cancel anytime. You keep your research data even if you cancel.",
  },
  {
    q: "What if I am not happy?",
    a: "Full refund within 30 days. No questions asked. We're confident you'll love it -- but if you don't, you get your money back.",
  },
]

function HowItWorksModal({ onClose }: { onClose: () => void }) {
  const [open, setOpen] = useState<number | null>(0)

  useEffect(() => {
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = "" }
  }, [])

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 90, background: "rgba(0,0,0,0.88)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px", animation: "modalFadeIn 0.25s ease-out" }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ background: "#0d0d0d", border: "1px solid rgba(255,255,255,0.08)", width: "100%", maxWidth: 640, maxHeight: "90vh", overflowY: "auto", position: "relative" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "24px 28px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div>
            <p className="font-mono uppercase" style={{ fontSize: 9, color: "rgba(249,115,22,0.5)", letterSpacing: "0.25em", marginBottom: 4 }}>How it works</p>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>Your questions, answered</h2>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.45)", cursor: "pointer", padding: "6px 10px", display: "flex", alignItems: "center", gap: 4, fontSize: 12, transition: "border-color 0.15s, color 0.15s" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.3)"; (e.currentTarget as HTMLElement).style.color = "#fff" }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.1)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.45)" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
            Close
          </button>
        </div>

        {/* Accordion */}
        <div style={{ padding: "8px 0 24px" }}>
          {HOW_FAQ.map((item, i) => (
            <div key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                style={{ width: "100%", textAlign: "left", padding: "18px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "none", border: "none", cursor: "pointer", gap: 16 }}
              >
                <span style={{ fontSize: 14, color: open === i ? "#fff" : "rgba(255,255,255,0.75)", lineHeight: 1.4, fontWeight: open === i ? 500 : 400 }}>{item.q}</span>
                <span style={{ color: "#f97316", fontSize: 18, flexShrink: 0, lineHeight: 1, transition: "transform 0.25s ease", transform: open === i ? "rotate(45deg)" : "rotate(0deg)" }}>+</span>
              </button>
              <div style={{ maxHeight: open === i ? 400 : 0, overflow: "hidden", transition: "max-height 0.35s ease" }}>
                <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", lineHeight: 1.75, padding: "0 28px 20px" }}>{item.a}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ padding: "20px 28px", borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)" }}>Still have questions? We are happy to help.</p>
          <Link href="/signup" style={{ background: "#f97316", color: "#000", padding: "9px 20px", fontSize: 13, fontWeight: 600, borderRadius: 4, textDecoration: "none", display: "inline-block", transition: "opacity 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.opacity = "0.85" }} onMouseLeave={e => { e.currentTarget.style.opacity = "1" }}>
            Start free trial
          </Link>
        </div>
      </div>
    </div>
  )
}

/* ─── What Nexora Does ───────────────────────────────────────────────────── */
const WHAT_STEPS = [
  { n: "01", title: "You give one prompt", body: "Tell Nexora who you want to reach in plain English -- your ICP, industry, signals, location, anything." },
  { n: "02", title: "Nexora searches 6 sources", body: "Our AI agent scans GitHub, HackerNews, ProductHunt, Google News, LinkedIn, and Twitter in parallel." },
  { n: "03", title: "Nexora scores every lead", body: "Confidence score 0-10 based on signal strength, recency, and verification across multiple sources." },
  { n: "04", title: "Nexora generates emails", body: "Each email is written from the actual signals found -- their funding, their launch, their hiring news." },
  { n: "05", title: "You review and approve", body: "See every draft before it goes out. Edit anything. Approve with one click." },
  { n: "06", title: "Nexora sends and tracks", body: "Emails go out, opens and replies tracked in real-time, follow-ups triggered automatically." },
]

function WhatNexoraDoes({ onFaqOpen }: { onFaqOpen: () => void }) {
  return (
    <section className="px-6 py-32 md:px-12" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", background: "#050505" }}>
      <div className="max-w-5xl mx-auto">
        <FadeIn style={{ marginBottom: 56 }}>
          <p className="font-mono uppercase" style={{ fontSize: 10, color: "rgba(249,115,22,0.45)", letterSpacing: "0.25em", marginBottom: 12 }}>In 60 seconds</p>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight" style={{ marginBottom: 12 }}>What Nexora does</h2>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.4)", maxWidth: "44ch" }}>Done in 2 minutes. 34% reply rate. Here is exactly how it works.</p>
        </FadeIn>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 1, border: "1px solid rgba(255,255,255,0.06)" }}>
          {WHAT_STEPS.map((step, i) => (
            <FadeIn key={i} delay={i * 60}>
              <div style={{ padding: "28px 24px", borderRight: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "#0a0a0a" }}>
                <div className="font-mono" style={{ fontSize: 28, color: "rgba(249,115,22,0.15)", fontWeight: 700, lineHeight: 1, marginBottom: 16 }}>{step.n}</div>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: "#fff", marginBottom: 8, letterSpacing: "-0.01em" }}>{step.title}</h3>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.6 }}>{step.body}</p>
              </div>
            </FadeIn>
          ))}
        </div>

        <FadeIn delay={200} style={{ marginTop: 36, textAlign: "center" }}>
          <button onClick={onFaqOpen} style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", background: "transparent", border: "1px solid rgba(255,255,255,0.1)", padding: "10px 24px", borderRadius: 4, cursor: "pointer", transition: "border-color 0.15s, color 0.15s" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.3)"; (e.currentTarget as HTMLElement).style.color = "#fff" }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.1)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.55)" }}>
            See how it works in detail &rarr;
          </button>
        </FadeIn>
      </div>
    </section>
  )
}

/* ─── Why Nexora Works ───────────────────────────────────────────────────── */
const WHY_REASONS = [
  { label: "Real signals", body: "Every email is built from actual events -- funding rounds, product launches, hiring news. Not guesses." },
  { label: "Real prospects", body: "Verified across 6 sources. No fake emails. No outdated data. Every lead is a real person." },
  { label: "Real personalization", body: "We don't merge first names into templates. We write from the signal. That is the difference." },
  { label: "Real results", body: "34% average reply rate. The industry average is 3%. The gap speaks for itself." },
  { label: "Real support", body: "Real humans who care about your success -- not AI chatbots and ticket queues." },
]

function WhyNexoraWorks() {
  return (
    <section className="px-6 py-32 md:px-12" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-start">
          <FadeIn from="left" style={{ position: "sticky", top: 100 }}>
            <p className="font-mono uppercase" style={{ fontSize: 10, color: "rgba(249,115,22,0.45)", letterSpacing: "0.25em", marginBottom: 12 }}>Why it works</p>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight" style={{ marginBottom: 16 }}>Why Nexora works</h2>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.4)", lineHeight: 1.7 }}>
              Cold outreach fails because it is generic. Nexora makes every touchpoint personal, timely, and relevant. That is not a feature -- it is the whole model.
            </p>
            <div style={{ marginTop: 32 }}>
              <Link href="/signup" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#f97316", color: "#000", padding: "12px 22px", fontSize: 14, fontWeight: 600, borderRadius: 4, textDecoration: "none", transition: "opacity 0.15s" }}
                onMouseEnter={e => { e.currentTarget.style.opacity = "0.85" }} onMouseLeave={e => { e.currentTarget.style.opacity = "1" }}>
                Try free for 7 days
                <ArrowRight style={{ width: 14, height: 14 }} />
              </Link>
            </div>
          </FadeIn>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {WHY_REASONS.map((r, i) => (
              <FadeIn key={i} delay={i * 80}>
                <div style={{ padding: "24px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: "#f97316", marginBottom: 6 }}>{r.label}</h3>
                  <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", lineHeight: 1.65 }}>{r.body}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─── The Numbers ────────────────────────────────────────────────────────── */
const STATS = [
  { value: "5,000+",   label: "Prospects researched" },
  { value: "87%",      label: "Campaigns exceed 15% reply rate" },
  { value: "2 min",    label: "Average time to campaign" },
  { value: "40 hrs",   label: "Saved per user per month" },
  { value: "$200k+",   label: "Average pipeline generated" },
]

function TheNumbers() {
  return (
    <section className="px-6 py-24 md:px-12" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", background: "#080808" }}>
      <div className="max-w-5xl mx-auto">
        <FadeIn style={{ marginBottom: 48, textAlign: "center" }}>
          <p className="font-mono uppercase" style={{ fontSize: 10, color: "rgba(249,115,22,0.45)", letterSpacing: "0.25em", marginBottom: 12 }}>The numbers</p>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight">Results that speak</h2>
        </FadeIn>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 1, border: "1px solid rgba(255,255,255,0.06)" }}>
          {STATS.map((s, i) => (
            <FadeIn key={i} delay={i * 60}>
              <div style={{ padding: "32px 20px", textAlign: "center", borderRight: "1px solid rgba(255,255,255,0.06)", background: "#0a0a0a" }}>
                <div style={{ fontSize: 36, fontWeight: 800, color: "#fbbf24", letterSpacing: "-0.02em", lineHeight: 1, marginBottom: 10 }}>{s.value}</div>
                <p className="font-mono uppercase" style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: "0.14em", lineHeight: 1.4 }}>{s.label}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── Who Uses Nexora ────────────────────────────────────────────────────── */
const PERSONAS = [
  { role: "Founders", desc: "Doing cold outreach without a sales team. Every meeting matters." },
  { role: "Sales teams", desc: "Automating prospect research so reps can focus on closing." },
  { role: "Agency owners", desc: "Scaling cold outreach across multiple clients without extra headcount." },
  { role: "Freelancers", desc: "Pitching to ideal clients without spending hours on research." },
  { role: "Anyone", desc: "Who has ever stared at a blank email knowing the prospect deserves something better." },
]

function WhoUsesNexora() {
  return (
    <section className="px-6 py-32 md:px-12" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="max-w-4xl mx-auto">
        <FadeIn style={{ marginBottom: 56 }}>
          <p className="font-mono uppercase" style={{ fontSize: 10, color: "rgba(249,115,22,0.45)", letterSpacing: "0.25em", marginBottom: 12 }}>Who it is for</p>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight">Who uses Nexora</h2>
        </FadeIn>
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {PERSONAS.map((p, i) => (
            <FadeIn key={i} delay={i * 60}>
              <div style={{ display: "flex", gap: 24, padding: "20px 0", borderBottom: "1px solid rgba(255,255,255,0.06)", alignItems: "flex-start" }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#f97316", marginTop: 7, flexShrink: 0, boxShadow: "0 0 8px rgba(249,115,22,0.5)" }} />
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: "#fff", marginBottom: 4 }}>{p.role}</h3>
                  <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", lineHeight: 1.6 }}>{p.desc}</p>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── Trust Signals ──────────────────────────────────────────────────────── */
const TRUST_ITEMS = [
  "No setup required -- 2 minutes to your first campaign",
  "No credit card for the trial",
  "7-day full access to every feature",
  "30-day money back guarantee",
  "Real humans in support, not AI chatbots",
  "Your data stays yours, always",
]

function TrustSignals({ onPricingOpen }: { onPricingOpen: () => void }) {
  return (
    <section className="px-6 py-24 md:px-12" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", background: "#050505" }}>
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <FadeIn from="left">
            <p className="font-mono uppercase" style={{ fontSize: 10, color: "rgba(249,115,22,0.45)", letterSpacing: "0.25em", marginBottom: 12 }}>Why founders trust us</p>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight" style={{ marginBottom: 16 }}>Why founders trust Nexora</h2>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.4)", lineHeight: 1.7, marginBottom: 28 }}>
              We built Nexora for founders who hate wasting time. That means no friction, no risk, and no surprises.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Link href="/signup" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#f97316", color: "#000", padding: "12px 22px", fontSize: 14, fontWeight: 600, borderRadius: 4, textDecoration: "none", transition: "opacity 0.15s" }}
                onMouseEnter={e => { e.currentTarget.style.opacity = "0.85" }} onMouseLeave={e => { e.currentTarget.style.opacity = "1" }}>
                Start free trial
              </Link>
              <button onClick={onPricingOpen} style={{ display: "inline-flex", alignItems: "center", fontSize: 14, color: "rgba(255,255,255,0.45)", background: "none", border: "none", cursor: "pointer", gap: 4, transition: "color 0.15s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#fff" }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.45)" }}>
                View pricing &rarr;
              </button>
            </div>
          </FadeIn>
          <FadeIn from="right">
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {TRUST_ITEMS.map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 18px", background: "#0a0a0a", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <CheckSVG color="#4ade80" size={12} />
                  <span style={{ fontSize: 14, color: "rgba(255,255,255,0.65)", lineHeight: 1.5 }}>{item}</span>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  )
}

/* ─── Static Data ────────────────────────────────────────────────────────── */
const howItWorks = [
  { num: "01", title: "Describe", description: "Tell Nexora who you want to reach in plain English. Your ICP, industry, signals, location - anything." },
  { num: "02", title: "Research", description: "Our AI agent searches 7 sources simultaneously, cross-references results, scores confidence 0-10, and returns only verified real people." },
  { num: "03", title: "Close", description: "Personalized emails sent automatically. Follow-ups triggered by new signals. You just review and close deals." },
]

const limitCards = [
  { icon: Users,       title: "Unlimited Prospects", body: "No database caps. Find as many real prospects as your ICP demands. Fresh signals every time." },
  { icon: Send,        title: "Unlimited Emails",    body: "Send as many emails as you need. No per-email fees. No throttling. Just results." },
  { icon: ShieldCheck, title: "Real People Only",    body: "Zero fake leads. Our AI cross-references 7 sources to verify every prospect before you see them." },
  { icon: Activity,    title: "Always Fresh Signals",body: "Every prospect comes with signals from the last 90 days. Not last year." },
]

const pricingPlans = [
  { label: "Pro",        price: "$199", plan: "pro" },
  { label: "Agency",     price: "$499", plan: "agency" },
  { label: "Enterprise", price: "$999", plan: "enterprise" },
]

const pricingRows = [
  { feature: "Prospects/month",     pro: "500",   agency: "2,500",    enterprise: "Unlimited" },
  { feature: "AI-generated emails", pro: true,    agency: true,       enterprise: true },
  { feature: "Signal detection",    pro: "Basic", agency: "Advanced", enterprise: "Custom" },
  { feature: "Multi-inbox support", pro: false,   agency: true,       enterprise: true },
  { feature: "Team collaboration",  pro: false,   agency: true,       enterprise: true },
  { feature: "API access",          pro: false,   agency: false,      enterprise: true },
  { feature: "Priority support",    pro: false,   agency: false,      enterprise: true },
]

/* ─── Page ───────────────────────────────────────────────────────────────── */
export default function LandingPage() {
  const [mounted, setMounted] = useState(false)
  const [pricingOpen, setPricingOpen] = useState(false)
  const [howItWorksOpen, setHowItWorksOpen] = useState(false)
  const terminalText = useTypewriter("find series-a founders in fintech", 40, 1100)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80)
    return () => clearTimeout(t)
  }, [])

  // Close modals on Escape
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setPricingOpen(false); setHowItWorksOpen(false) }
    }
    window.addEventListener("keydown", fn)
    return () => window.removeEventListener("keydown", fn)
  }, [])

  return (
    <div className="min-h-screen bg-black text-white selection:bg-orange-500/30 overflow-x-hidden">

      {/* ── Keyframes + global hover rules ─────────────────────────────────── */}
      <style>{`
        @keyframes letterIn     { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes drawLine     { from { width:0; } to { width:200px; } }
        @keyframes growDown     { from { height:0; } to { height:100vh; } }
        @keyframes blink        { 0%,100% { opacity:1; } 50% { opacity:0; } }
        @keyframes signalPulse  { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
        @keyframes demoLineIn   { from { opacity:0; transform:translateX(-8px); } to { opacity:1; transform:translateX(0); } }
        @keyframes heroRise     { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes tickerScroll { from { transform:translateX(0); } to { transform:translateX(-50%); } }
        @keyframes marqueeScroll{ from { transform:translateX(0); } to { transform:translateX(-50%); } }
        @keyframes searchRotate { 0%,100% { transform:rotate(0deg); } 25% { transform:rotate(-12deg); } 75% { transform:rotate(12deg); } }
        @keyframes progressFill { from { width:0%; } to { width:100%; } }
        @keyframes confidencePulse { 0%,20% { color:#f97316; } 100% { color:#4ade80; } }
        @keyframes modalFadeIn  { from { opacity:0; } to { opacity:1; } }
        .marquee-track:hover { animation-play-state:paused; }
        .marquee-item:hover  { color:#ffffff !important; }
        ::-webkit-scrollbar { width:6px; }
        ::-webkit-scrollbar-track { background:#0a0a0a; }
        ::-webkit-scrollbar-thumb { background:#1e1e1e; }
      `}</style>

      {/* ── Ticker ─────────────────────────────────────────────────────────── */}
      <SignalTicker />

      {/* ── Scanline overlay ───────────────────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none" aria-hidden="true" style={{ zIndex: 30, backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)" }} />

      {/* ── Left orange edge line ───────────────────────────────────────────── */}
      <div className="fixed left-0 top-0 w-px" aria-hidden="true" style={{ zIndex: 40, backgroundColor: "#f97316", animation: mounted ? "growDown 1.2s ease-out forwards" : "none", height: 0 }} />

      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <nav className="fixed left-0 right-0 px-6 md:px-12" style={{ top: 32, zIndex: 50, paddingTop: 18, paddingBottom: 18, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <NexoraLogo size={38} />
          </Link>
          <div className="hidden items-center gap-8 md:flex">
            <Link href="#features" className="text-sm tracking-wide" style={{ color: "rgba(255,255,255,0.52)", transition: "color 0.2s ease" }}
              onMouseEnter={e => { e.currentTarget.style.color = "#fff" }} onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,0.52)" }}>
              Features
            </Link>
            <button onClick={() => setPricingOpen(true)} className="text-sm tracking-wide" style={{ color: "rgba(255,255,255,0.52)", transition: "color 0.2s ease", background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "inherit" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#fff" }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.52)" }}>
              Pricing
            </button>
            <button onClick={() => setHowItWorksOpen(true)} className="text-sm tracking-wide" style={{ color: "rgba(255,255,255,0.52)", transition: "color 0.2s ease", background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "inherit" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#fff" }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.52)" }}>
              How it works
            </button>
            <Link href="/login" className="text-sm" style={{ color: "rgba(255,255,255,0.65)", border: "1px solid rgba(255,255,255,0.14)", padding: "6px 14px", borderRadius: 6, transition: "border-color 0.2s ease, color 0.2s ease" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.35)"; (e.currentTarget as HTMLElement).style.color = "#fff" }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.14)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.65)" }}>
              Sign In
            </Link>
            <Link href="/signup" className="text-sm" style={{ color: "#000", background: "#f97316", padding: "7px 16px", borderRadius: 6, fontWeight: 600, transition: "opacity 0.2s ease" }}
              onMouseEnter={e => { e.currentTarget.style.opacity = "0.85" }} onMouseLeave={e => { e.currentTarget.style.opacity = "1" }}>
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col justify-center px-6 md:px-12 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true" style={{ backgroundImage: "radial-gradient(circle, #1a1a1a 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true" style={{ background: "radial-gradient(ellipse 65% 65% at 28% 52%, rgba(249,115,22,0.055) 0%, transparent 70%)" }} />
        <div className="absolute top-1/2 hidden xl:flex items-center" style={{ left: 4, transform: "translateY(-50%)" }} aria-hidden="true">
          <span style={{ fontSize: 9, color: "#333", letterSpacing: "0.35em", textTransform: "uppercase", writingMode: "vertical-lr", transform: "rotate(180deg)", userSelect: "none" }}>AI-Powered Sales Platform</span>
        </div>

        <div className="max-w-7xl w-full mx-auto" style={{ paddingTop: 120, paddingBottom: 72 }}>
          <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-16 lg:gap-24 items-center">
            <div>
              <div style={{ marginBottom: 16 }}>
                <span className="font-mono uppercase" style={{ fontSize: 10, letterSpacing: "0.32em", color: "rgba(249,115,22,0.5)" }}>AI-Powered Sales Platform</span>
              </div>
              <h1 className="font-black tracking-tighter" style={{ fontSize: "clamp(3.5rem, 9vw, 10rem)", lineHeight: 0.88, marginBottom: 20 }}>
                {"NEXORA".split("").map((letter, i) => (
                  <span key={i} className="inline-block" style={{ backgroundImage: "linear-gradient(135deg, #f97316 0%, #fbbf24 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", animation: "letterIn 0.35s ease-out forwards", animationDelay: `${i * 0.07}s`, opacity: 0 }}>
                    {letter}
                  </span>
                ))}
              </h1>
              <div style={{ height: 1, backgroundColor: "#f97316", width: 0, animation: "drawLine 0.9s ease-out 0.55s forwards", marginBottom: 28 }} />
              <p className="font-light leading-relaxed" style={{ fontSize: "1.15rem", color: "rgba(255,255,255,0.52)", maxWidth: "34ch", marginBottom: 40 }}>
                Cold outreach that actually works.
              </p>
              {/* Hero CTAs */}
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 40 }}>
                <Link href="/signup" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#f97316", color: "#000", padding: "13px 24px", fontSize: 14, fontWeight: 600, borderRadius: 6, textDecoration: "none", transition: "opacity 0.2s ease" }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = "0.85" }} onMouseLeave={e => { e.currentTarget.style.opacity = "1" }}>
                  Get Started Free
                  <ArrowRight style={{ width: 15, height: 15 }} />
                </Link>
                <button onClick={() => setHowItWorksOpen(true)} style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "transparent", color: "rgba(255,255,255,0.65)", padding: "13px 20px", fontSize: 14, border: "1px solid rgba(255,255,255,0.14)", borderRadius: 6, cursor: "pointer", fontFamily: "inherit", transition: "border-color 0.2s, color 0.2s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.35)"; (e.currentTarget as HTMLElement).style.color = "#fff" }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.14)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.65)" }}>
                  See how it works
                </button>
              </div>
              {/* Command terminal */}
              <div style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.025)", boxShadow: "0 0 40px rgba(249,115,22,0.06), inset 0 1px 0 rgba(255,255,255,0.04)", position: "relative", overflow: "hidden", maxWidth: 440 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ display: "flex", gap: 5 }}>
                    {[0,1,2].map(i => <div key={i} style={{ width: 9, height: 9, borderRadius: "50%", background: "rgba(255,255,255,0.16)" }} />)}
                  </div>
                  <span className="font-mono" style={{ fontSize: 10, color: "rgba(255,255,255,0.32)", letterSpacing: "0.18em" }}>COMMAND</span>
                </div>
                <div style={{ padding: "13px 14px 15px", display: "flex", alignItems: "center", gap: 10 }}>
                  <span className="font-mono" style={{ color: "#f97316", fontSize: 13, flexShrink: 0 }}>{">"}</span>
                  <span className="font-mono" style={{ color: "rgba(255,255,255,0.78)", fontSize: 13 }}>{terminalText}</span>
                  <span style={{ display: "inline-block", width: 8, height: 15, background: "#f97316", verticalAlign: "middle", flexShrink: 0, animation: "blink 1.2s step-end infinite" }} />
                </div>
                <div className="absolute inset-y-0 left-0 w-6 pointer-events-none" style={{ background: "linear-gradient(to right, rgba(0,0,0,0.55), transparent)" }} />
                <div className="absolute inset-y-0 right-0 w-6 pointer-events-none" style={{ background: "linear-gradient(to left, rgba(0,0,0,0.55), transparent)" }} />
              </div>
            </div>

            <div className="hidden lg:block" style={{ animation: "heroRise 0.65s ease-out 0.85s both" }}>
              <LiveDemo />
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 72, paddingTop: 48, paddingBottom: 48, borderTop: "1px solid rgba(255,255,255,0.07)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
            {[
              { value: 5000, suffix: "+", label: "Prospects" },
              { value: 87,   suffix: "%", label: "Reply Rate" },
            ].map(({ value, suffix, label }) => (
              <div key={label}>
                <div className="font-black tracking-tight" style={{ fontSize: "3.5rem", color: "#fbbf24", lineHeight: 1 }}>
                  <AnimatedCounter value={value} suffix={suffix} />
                </div>
                <p className="uppercase font-mono" style={{ fontSize: 10, color: "rgba(255,255,255,0.33)", marginTop: 10, letterSpacing: "0.24em" }}>{label}</p>
              </div>
            ))}
            <div>
              <div className="font-black tracking-tight" style={{ fontSize: "3.5rem", color: "#fbbf24", lineHeight: 1 }}>2 min</div>
              <p className="uppercase font-mono" style={{ fontSize: 10, color: "rgba(255,255,255,0.33)", marginTop: 10, letterSpacing: "0.24em" }}>Setup Time</p>
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 right-6 md:right-12">
          <span className="block whitespace-nowrap uppercase" style={{ fontSize: 10, color: "rgba(255,255,255,0.22)", letterSpacing: "0.24em", writingMode: "vertical-lr", transform: "rotate(180deg)" }}>Scroll</span>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none" aria-hidden="true" style={{ background: "linear-gradient(to bottom, transparent, black)" }} />
      </section>

      {/* ── Social Proof Marquee ────────────────────────────────────────────── */}
      <SocialProof />

      {/* ── What Nexora Does ────────────────────────────────────────────────── */}
      <WhatNexoraDoes onFaqOpen={() => setHowItWorksOpen(true)} />

      {/* ── No Limits ──────────────────────────────────────────────────────── */}
      <section className="px-6 py-32 md:px-12 relative" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="max-w-7xl mx-auto">
          <FadeIn style={{ marginBottom: 56 }}>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight">No limits. No compromises.</h2>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {limitCards.map((card, i) => (
              <FadeIn key={i} delay={i * 80}>
                <LimitCard {...card} />
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ───────────────────────────────────────────────────── */}
      <section id="features" className="px-6 py-32 md:px-12 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <FadeIn style={{ marginBottom: 56 }}>
            <p className="font-mono uppercase" style={{ fontSize: 10, color: "rgba(249,115,22,0.45)", letterSpacing: "0.25em", marginBottom: 12 }}>Process</p>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight">How it works</h2>
          </FadeIn>
          <div className="grid md:grid-cols-3 gap-0">
            {howItWorks.map((step, index) => (
              <FadeIn key={index} delay={index * 100}
                className={["py-8 md:py-0 md:px-8", index !== howItWorks.length - 1 ? "border-b md:border-b-0 md:border-r border-white/10" : "", index === 0 ? "md:pl-0" : "", index === howItWorks.length - 1 ? "md:pr-0" : ""].join(" ")}>
                <span className="font-mono block mb-6" style={{ fontSize: "4rem", color: "rgba(249,115,22,0.12)", lineHeight: 1, fontWeight: 500 }}>{step.num}</span>
                <h3 className="text-lg font-semibold text-white mb-3 tracking-tight">{step.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{step.description}</p>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why Nexora Works ───────────────────────────────────────────────── */}
      <WhyNexoraWorks />

      {/* ── Before / After ─────────────────────────────────────────────────── */}
      <BeforeAfter />

      {/* ── The Numbers ────────────────────────────────────────────────────── */}
      <TheNumbers />

      {/* ── Testimonials ───────────────────────────────────────────────────── */}
      <Testimonials />

      {/* ── Who Uses Nexora ────────────────────────────────────────────────── */}
      <WhoUsesNexora />

      {/* ── Trust Signals ──────────────────────────────────────────────────── */}
      <TrustSignals onPricingOpen={() => setPricingOpen(true)} />

      {/* ── Pricing ────────────────────────────────────────────────────────── */}
      <section id="pricing" className="px-6 py-32 md:px-12 border-t border-white/10">
        <div className="max-w-5xl mx-auto">
          <FadeIn style={{ marginBottom: 64 }}>
            <p className="font-mono uppercase" style={{ fontSize: 10, color: "rgba(249,115,22,0.45)", letterSpacing: "0.25em", marginBottom: 12 }}>Pricing</p>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 8 }}>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight">Simple pricing</h2>
              <button onClick={() => setPricingOpen(true)} style={{ fontSize: 13, color: "#f97316", background: "none", border: "1px solid rgba(249,115,22,0.3)", padding: "8px 18px", cursor: "pointer", fontFamily: "inherit", transition: "background 0.15s", borderRadius: 4 }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(249,115,22,0.08)" }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "none" }}>
                Full plan details &rarr;
              </button>
            </div>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>7-day free trial. No credit card required.</p>
          </FadeIn>

          {/* Plan headers */}
          <FadeIn delay={80}>
            <div className="grid grid-cols-4 gap-4 pb-6 mb-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <div />
              {pricingPlans.map(({ label, price, plan }) => (
                <div key={label} className="text-center" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                  <div>
                    <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 4, letterSpacing: "0.08em" }}>{label}</p>
                    <p className="font-black" style={{ fontSize: "1.75rem", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
                      {price}<span style={{ fontSize: 12, fontWeight: 400, color: "rgba(255,255,255,0.4)" }}>/mo</span>
                    </p>
                  </div>
                  <Link href={`/signup?plan=${plan}`} style={{ fontSize: 11, color: "#000", background: "#f97316", padding: "7px 14px", borderRadius: 6, fontWeight: 500, whiteSpace: "nowrap", transition: "opacity 0.2s ease", display: "inline-block" }}
                    onMouseEnter={e => { e.currentTarget.style.opacity = "0.8" }} onMouseLeave={e => { e.currentTarget.style.opacity = "1" }}>
                    Start Free Trial
                  </Link>
                </div>
              ))}
            </div>
          </FadeIn>

          {/* Feature rows */}
          <div>
            {pricingRows.map((row, index) => (
              <FadeIn key={index} delay={index * 40}>
                <div className="grid grid-cols-4 gap-4 py-4 items-center" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>{row.feature}</div>
                  {(["pro", "agency", "enterprise"] as const).map(plan => {
                    const val = row[plan]
                    return (
                      <div key={plan} className="text-center" style={{ fontSize: 13 }}>
                        {typeof val === "boolean" ? (
                          val ? <Check className="h-4 w-4 mx-auto" style={{ color: "rgba(255,255,255,0.55)" }} /> : <span style={{ color: "rgba(255,255,255,0.15)" }}>-</span>
                        ) : (
                          <span style={{ color: "rgba(255,255,255,0.65)" }}>{val}</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </FadeIn>
            ))}
          </div>

          <FadeIn delay={200} style={{ marginTop: 48, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            {["No contracts. Cancel anytime.", "No credit card required for trial.", "Upgrade or downgrade instantly."].map(line => (
              <p key={line} className="font-mono" style={{ fontSize: 11, color: "rgba(255,255,255,0.22)", letterSpacing: "0.04em" }}>{line}</p>
            ))}
          </FadeIn>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────────────────── */}
      <FAQ />

      {/* ── Final CTA ──────────────────────────────────────────────────────── */}
      <FinalCTA onPricingOpen={() => setPricingOpen(true)} />

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="px-6 md:px-12" style={{ paddingTop: 56, paddingBottom: 0, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start gap-10" style={{ marginBottom: 40 }}>
            <div>
              <div className="flex items-center gap-2.5" style={{ marginBottom: 14 }}>
                <NexoraLogo size={28} />
                <span style={{ fontSize: 14, color: "rgba(255,255,255,0.38)", letterSpacing: "0.04em" }}>Nexora</span>
              </div>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.28)", maxWidth: "36ch", lineHeight: 1.65 }}>
                Built for founders who close deals, not craft emails.
              </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 20, alignItems: "flex-end" }}>
              <div style={{ display: "flex", gap: 24, flexWrap: "wrap", justifyContent: "flex-end" }}>
                {[{ href: "#features", label: "Features" }, { href: "#pricing", label: "Pricing" }, { href: "#faq", label: "About" }, { href: "/privacy", label: "Privacy" }, { href: "/terms", label: "Terms" }].map(({ href, label }) => (
                  <Link key={label} href={href} style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", transition: "color 0.2s ease" }}
                    onMouseEnter={e => { e.currentTarget.style.color = "rgba(255,255,255,0.7)" }} onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,0.3)" }}>
                    {label}
                  </Link>
                ))}
              </div>
              <div style={{ display: "flex", gap: 14 }}>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" style={{ color: "rgba(255,255,255,0.25)", transition: "color 0.2s ease" }}
                  onMouseEnter={e => { e.currentTarget.style.color = "rgba(255,255,255,0.65)" }} onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,0.25)" }}
                  aria-label="Twitter / X">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.259 5.629z" /></svg>
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" style={{ color: "rgba(255,255,255,0.25)", transition: "color 0.2s ease" }}
                  onMouseEnter={e => { e.currentTarget.style.color = "rgba(255,255,255,0.65)" }} onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,0.25)" }}
                  aria-label="LinkedIn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                </a>
              </div>
            </div>
          </div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 20, paddingBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", letterSpacing: "0.04em" }}>
              &copy; 2026 Nexora. Built for closers.
            </p>
            <span className="font-mono" style={{ fontSize: 10, color: "rgba(255,255,255,0.12)", letterSpacing: "0.12em" }}>nexoraoutreach.com</span>
          </div>
        </div>
        <div style={{ height: 2, background: "linear-gradient(to right, transparent, #f97316, transparent)", opacity: 0.35 }} />
      </footer>

      {/* ── Sticky CTA ─────────────────────────────────────────────────────── */}
      <StickyCTA />

      {/* ── Modals ─────────────────────────────────────────────────────────── */}
      {pricingOpen    && <PricingModal    onClose={() => setPricingOpen(false)} />}
      {howItWorksOpen && <HowItWorksModal onClose={() => setHowItWorksOpen(false)} />}
    </div>
  )
}
