"use client"

import { useState, useEffect, useRef, type ReactNode } from "react"
import Link from "next/link"
import { ArrowRight, Check, Users, Send, ShieldCheck, Activity } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

/* ─── Nexora Logo ────────────────────────────────────────────────────────── */
function NexoraLogo({ size = 36 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ filter: "drop-shadow(0 0 8px rgba(249,115,22,0.4))" }}
    >
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
function CheckSVG({ color = "#4ade80" }: { color?: string }) {
  return (
    <svg
      width="11" height="11" viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      style={{ display: "inline", verticalAlign: "middle", flexShrink: 0 }}
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

function XMarkSVG() {
  return (
    <svg
      width="11" height="11" viewBox="0 0 24 24" fill="none"
      stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round"
      style={{ display: "inline", verticalAlign: "middle", flexShrink: 0 }}
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  )
}

function SearchSVG() {
  return (
    <svg
      width="11" height="11" viewBox="0 0 24 24" fill="none"
      stroke="#f97316" strokeWidth="2.5" strokeLinecap="round"
      style={{ display: "inline", verticalAlign: "middle", flexShrink: 0, animation: "searchRotate 2.5s ease-in-out infinite" }}
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  )
}

function EnvelopeSVG() {
  return (
    <svg
      width="11" height="11" viewBox="0 0 24 24" fill="none"
      stroke="#f97316" strokeWidth="2" strokeLinecap="round"
      style={{ display: "inline", verticalAlign: "middle", flexShrink: 0 }}
    >
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
          <span
            style={{
              display: "inline-block",
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: "#f97316",
              verticalAlign: "middle",
              margin: "0 8px 1px",
              animation: "signalPulse 1.8s ease-in-out infinite",
              animationDelay: `${i * 0.3}s`,
            }}
          />
          {item}
          {"   ·   "}
        </span>
      ))}
    </span>
  )
}

function SignalTicker() {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 60,
        height: 32,
        background: "#0a0a0a",
        borderBottom: "1px solid #1a1a1a",
        display: "flex",
        alignItems: "center",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "0 14px",
          flexShrink: 0,
          borderRight: "1px solid #1a1a1a",
        }}
      >
        <div
          style={{
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: "#f97316",
            animation: "signalPulse 1.8s ease-in-out infinite",
          }}
        />
        <span
          className="font-mono"
          style={{ fontSize: 9, color: "#f97316", letterSpacing: "0.12em", fontWeight: 500 }}
        >
          SIGNALS
        </span>
      </div>

      <div style={{ flex: 1, overflow: "hidden" }}>
        <div
          style={{
            display: "flex",
            whiteSpace: "nowrap",
            animation: "tickerScroll 55s linear infinite",
          }}
        >
          <TickerContent />
          <TickerContent />
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          padding: "0 12px",
          flexShrink: 0,
          borderLeft: "1px solid #1a1a1a",
        }}
      >
        <div
          style={{
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: "#4ade80",
            animation: "signalPulse 1.8s ease-in-out infinite 0.4s",
          }}
        />
        <span
          className="font-mono"
          style={{ fontSize: 9, color: "#4ade80", letterSpacing: "0.12em", fontWeight: 500 }}
        >
          LIVE
        </span>
      </div>
    </div>
  )
}

/* ─── Social Proof bar ───────────────────────────────────────────────────── */
const COMPANIES = ["DATAFLOW", "CLOUDSYNC", "VELOCITY AI", "STACKPILOT", "NEXGEN", "PULSEIO", "DRIFTLAB"]

function SocialProof() {
  const doubled = [...COMPANIES, ...COMPANIES]
  return (
    <div
      style={{
        background: "#080808",
        borderTop: "1px solid #1a1a1a",
        borderBottom: "1px solid #1a1a1a",
        padding: "18px 0",
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", alignItems: "center" }}>
        <div
          style={{
            flexShrink: 0,
            padding: "0 32px",
            borderRight: "1px solid #1e1e1e",
            whiteSpace: "nowrap",
          }}
        >
          <span
            className="font-mono"
            style={{ fontSize: 10, color: "#333", letterSpacing: "0.12em" }}
          >
            Trusted by founders at
          </span>
        </div>

        <div style={{ flex: 1, overflow: "hidden" }}>
          <div
            className="marquee-track font-mono"
            style={{
              display: "flex",
              alignItems: "center",
              animation: "marqueeScroll 30s linear infinite",
              whiteSpace: "nowrap",
            }}
          >
            {doubled.map((name, i) => (
              <span key={i} style={{ display: "inline-flex", alignItems: "center" }}>
                <span
                  className="marquee-item"
                  style={{
                    fontSize: 11,
                    color: "#3a3a3a",
                    letterSpacing: "0.12em",
                    padding: "0 28px",
                    transition: "color 0.2s ease",
                    cursor: "default",
                  }}
                >
                  {name}
                </span>
                <span
                  style={{
                    display: "inline-block",
                    width: 3,
                    height: 3,
                    borderRadius: "50%",
                    background: "#f97316",
                    opacity: 0.45,
                    flexShrink: 0,
                  }}
                />
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Before / After ─────────────────────────────────────────────────────── */
const BEFORE_ITEMS = [
  "2% average reply rate",
  "40 hours/week on research",
  "100 emails → 2 replies",
  "$500/mo on prospect tools",
]

const AFTER_ITEMS = [
  "23% average reply rate",
  "2 hours/week on review",
  "20 emails → 5 meetings",
  "$0 on prospect tools",
]

function BeforeAfter() {
  return (
    <section className="px-6 py-24 md:px-12">
      <div className="max-w-5xl mx-auto">
        <FadeIn style={{ marginBottom: 40 }}>
          <p
            className="font-mono uppercase"
            style={{ fontSize: 10, color: "rgba(249,115,22,0.45)", letterSpacing: "0.25em", marginBottom: 12 }}
          >
            The difference
          </p>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight">
            Before and after.
          </h2>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-0 items-stretch">
          {/* Before */}
          <FadeIn from="left">
            <div
              style={{
                background: "#0d0000",
                border: "1px solid rgba(239,68,68,0.18)",
                padding: "2rem",
                height: "100%",
              }}
            >
              <p
                className="font-mono uppercase"
                style={{ fontSize: 9, color: "rgba(239,68,68,0.6)", letterSpacing: "0.22em", marginBottom: 20 }}
              >
                Without Nexora
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {BEFORE_ITEMS.map((item, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <XMarkSVG />
                    <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.4 }}>
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>

          {/* VS */}
          <FadeIn delay={60}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "24px 20px",
              }}
            >
              <span
                style={{
                  fontSize: "1.75rem",
                  fontWeight: 500,
                  color: "#f97316",
                  letterSpacing: "-0.02em",
                  opacity: 0.9,
                }}
              >
                VS
              </span>
            </div>
          </FadeIn>

          {/* After */}
          <FadeIn from="right" delay={120}>
            <div
              style={{
                background: "#000d00",
                border: "1px solid rgba(74,222,128,0.16)",
                padding: "2rem",
                height: "100%",
              }}
            >
              <p
                className="font-mono uppercase"
                style={{ fontSize: 9, color: "rgba(74,222,128,0.6)", letterSpacing: "0.22em", marginBottom: 20 }}
              >
                With Nexora
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {AFTER_ITEMS.map((item, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <CheckSVG color="#4ade80" />
                    <span style={{ fontSize: 13, color: "rgba(255,255,255,0.72)", lineHeight: 1.4 }}>
                      {item}
                    </span>
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

/* ─── Sticky CTA ─────────────────────────────────────────────────────────── */
function StickyCTA() {
  const [show, setShow] = useState(false)
  const [closed, setClosed] = useState(false)

  useEffect(() => {
    if (closed) return
    const handleScroll = () => setShow(window.scrollY > 500)
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [closed])

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 55,
        background: "#111",
        borderTop: "1px solid #1a1a1a",
        padding: "14px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        transform: show ? "translateY(0)" : "translateY(100%)",
        transition: "transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
        pointerEvents: show ? "auto" : "none",
      }}
    >
      <span style={{ fontSize: 13, color: "rgba(255,255,255,0.55)" }}>
        Start closing more deals today
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Link
          href="/onboarding"
          style={{
            background: "#f97316",
            color: "#000",
            padding: "8px 18px",
            fontSize: 13,
            fontWeight: 500,
            borderRadius: 6,
            whiteSpace: "nowrap",
            display: "inline-block",
          }}
        >
          Start Free Trial &rarr;
        </Link>
        <button
          onClick={() => { setClosed(true); setShow(false) }}
          style={{
            color: "rgba(255,255,255,0.3)",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 4,
            display: "flex",
            alignItems: "center",
          }}
          aria-label="Dismiss"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}

/* ─── Typewriter hook ────────────────────────────────────────────────────── */
function useTypewriter(text: string, speed = 45, startDelay = 900) {
  const [displayed, setDisplayed] = useState("")
  useEffect(() => {
    let i = 0
    setDisplayed("")
    const timeout = setTimeout(() => {
      const timer = setInterval(() => {
        i++
        setDisplayed(text.slice(0, i))
        if (i >= text.length) clearInterval(timer)
      }, speed)
      return () => clearInterval(timer)
    }, startDelay)
    return () => clearTimeout(timeout)
  }, [text, speed, startDelay])
  return displayed
}

/* ─── Demo command typewriter ────────────────────────────────────────────── */
function CommandTypewriter({ text }: { text: string }) {
  const displayed = useTypewriter(text, 30, 100)
  return (
    <span className="font-mono" style={{ fontSize: 12 }}>
      <span style={{ color: "#e5e5e5" }}>{displayed}</span>
      <span
        className="inline-block align-middle"
        style={{
          width: 7,
          height: 13,
          background: "#f97316",
          marginLeft: 2,
          animation: "blink 1.2s step-end infinite",
        }}
      />
    </span>
  )
}

/* ─── Animated counter ───────────────────────────────────────────────────── */
function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    const timeout = setTimeout(() => {
      const steps = 60
      const duration = 1600
      let i = 0
      const timer = setInterval(() => {
        i++
        setCount(i >= steps ? value : Math.round((value / steps) * i))
        if (i >= steps) clearInterval(timer)
      }, duration / steps)
      return () => clearInterval(timer)
    }, 700)
    return () => clearTimeout(timeout)
  }, [value])
  return (
    <span style={{ fontVariantNumeric: "tabular-nums" }}>
      {count.toLocaleString()}{suffix}
    </span>
  )
}

/* ─── Scroll fade-in ─────────────────────────────────────────────────────── */
function FadeIn({
  children,
  delay = 0,
  className = "",
  style,
  from = "bottom",
}: {
  children: ReactNode
  delay?: number
  className?: string
  style?: React.CSSProperties
  from?: "bottom" | "left" | "right"
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect() } },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const hiddenTransform =
    from === "left" ? "translateX(-28px)" :
    from === "right" ? "translateX(28px)" :
    "translateY(20px)"

  return (
    <div
      ref={ref}
      className={className}
      style={{
        ...style,
        opacity: visible ? 1 : 0,
        transform: visible ? "translate(0)" : hiddenTransform,
        transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}

/* ─── No Limits card ─────────────────────────────────────────────────────── */
function LimitCard({
  icon: Icon,
  title,
  body,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  body: string
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      style={{
        backgroundColor: "#111111",
        border: "1px solid rgba(255,255,255,0.06)",
        padding: "2rem",
        transition: "box-shadow 0.25s ease",
        boxShadow: hovered
          ? "0 0 48px rgba(249,115,22,0.09), inset 0 0 32px rgba(249,115,22,0.03)"
          : "none",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="mb-5">
        <div
          style={{
            display: "inline-flex",
            padding: "0.45rem",
            background: "linear-gradient(135deg, rgba(249,115,22,0.14), rgba(251,191,36,0.09))",
            border: "1px solid rgba(249,115,22,0.18)",
          }}
        >
          <Icon className="h-4 w-4 text-orange-500" />
        </div>
      </div>
      <h3 className="text-base font-semibold text-white mb-3 tracking-tight">{title}</h3>
      <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>{body}</p>
    </div>
  )
}

/* ─── Live Demo ──────────────────────────────────────────────────────────── */
type DemoLine = {
  icon?: "check" | "search" | "envelope"
  text: string
  score?: string
  color: string
  result?: string
  sub?: string
  indent?: boolean
}

const DEMO_PHASES: Array<{ label: string; lines: DemoLine[]; duration: number }> = [
  {
    label: "SEARCHING",
    lines: [{ text: "Finding SaaS founders who raised Series A...", color: "#e5e5e5" }],
    duration: 2400,
  },
  {
    label: "SCANNING",
    lines: [
      { icon: "search", text: "Searching GitHub...", color: "#f97316", result: "12 found" },
      { icon: "search", text: "Searching HackerNews...", color: "#f97316", result: "8 found" },
      { icon: "search", text: "Searching ProductHunt...", color: "#f97316", result: "6 found" },
      { icon: "search", text: "Cross-referencing...", color: "#fbbf24", result: "verifying..." },
    ],
    duration: 4200,
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
    ],
    duration: 2800,
  },
  {
    label: "SENT",
    lines: [{ icon: "check", text: "Email sent. Monitoring for reply...", color: "#4ade80" }],
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
    setFading(false)

    p.lines.forEach((_, i) => {
      timers.push(setTimeout(() => setVisible(i + 1), i * 720 + 420))
    })

    timers.push(
      setTimeout(() => {
        setFading(true)
        const switchTimer = setTimeout(() => {
          const next = (phase + 1) % DEMO_PHASES.length
          setPhase(next)
          setVisible(0)
        }, 450)
        timers.push(switchTimer)
      }, p.duration + 2000)
    )

    return () => timers.forEach(clearTimeout)
  }, [phase])

  const p = DEMO_PHASES[phase]
  const totalDuration = p.duration + 2000

  return (
    <div
      style={{
        background: "#0c0c0c",
        border: "1px solid rgba(249,115,22,0.18)",
        boxShadow:
          "0 0 30px rgba(249,115,22,0.15), 0 0 0 1px rgba(249,115,22,0.06), 0 24px 60px rgba(0,0,0,0.6)",
        position: "relative",
        overflow: "hidden",
        width: "100%",
      }}
    >
      {/* Header */}
      <div
        className="font-mono"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          background: "rgba(255,255,255,0.018)",
        }}
      >
        <div style={{ display: "flex", gap: 6 }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{ width: 8, height: 8, borderRadius: "50%", background: "rgba(255,255,255,0.13)" }}
            />
          ))}
        </div>
        <span style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", letterSpacing: "0.16em" }}>
          NEXORA / RESEARCH AGENT
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "#4ade80",
              animation: "signalPulse 1.8s ease-in-out infinite",
            }}
          />
          <span style={{ fontSize: 9, color: "#4ade80", letterSpacing: "0.12em", fontWeight: 500 }}>LIVE</span>
        </div>
      </div>

      {/* Phase label */}
      <div
        className="font-mono"
        style={{ padding: "10px 16px 4px", fontSize: 9, color: "rgba(249,115,22,0.4)", letterSpacing: "0.24em" }}
      >
        [{p.label}]
      </div>

      {/* Content */}
      <div
        className="font-mono"
        style={{
          padding: "8px 16px 22px",
          minHeight: 210,
          opacity: fading ? 0 : 1,
          transition: "opacity 0.4s ease",
        }}
      >
        {phase === 0 ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "#f97316", fontSize: 13 }}>{">"}</span>
            {visible > 0 && <CommandTypewriter key={phase} text={p.lines[0].text} />}
          </div>
        ) : (
          p.lines.slice(0, visible).map((line, i) => (
            <div
              key={i}
              style={{
                marginBottom: line.sub ? 2 : 10,
                paddingLeft: line.indent ? 16 : 0,
                animation: "demoLineIn 0.3s ease-out forwards",
              }}
            >
              <div style={{ fontSize: 12, color: line.color, lineHeight: 1.5, display: "flex", alignItems: "center", gap: 6 }}>
                {line.icon && demoIcons[line.icon]}
                {line.result !== undefined ? (
                  <>
                    <span>{line.text}</span>
                    <span style={{ color: "rgba(255,255,255,0.24)", fontSize: 11 }}>{line.result}</span>
                  </>
                ) : (
                  <>
                    <span>{line.text}</span>
                    {line.score && (
                      <span
                        style={{
                          animation: "confidencePulse 1.2s ease-out forwards",
                          animationDelay: "0.05s",
                        }}
                      >
                        {line.score}
                      </span>
                    )}
                  </>
                )}
              </div>
              {line.sub && (
                <div
                  style={{
                    fontSize: 10,
                    color: "rgba(255,255,255,0.24)",
                    paddingLeft: 22,
                    marginBottom: 8,
                    lineHeight: 1.4,
                  }}
                >
                  {line.sub}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Progress bar */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 2,
          background: "rgba(255,255,255,0.04)",
        }}
      >
        <div
          key={phase}
          style={{
            height: "100%",
            background: "linear-gradient(to right, #f97316, #fbbf24)",
            animation: `progressFill ${totalDuration}ms linear forwards`,
          }}
        />
      </div>
    </div>
  )
}

/* ─── Static data ────────────────────────────────────────────────────────── */
const features = [
  {
    num: "01",
    title: "Signal Detection",
    description:
      "AI monitors 50+ data sources to detect buying signals. Funding rounds, job changes, tech stack updates.",
  },
  {
    num: "02",
    title: "AI Personalization",
    description: "Every email is uniquely crafted using prospect data and signal insights. No templates.",
  },
  {
    num: "03",
    title: "Autonomous Outreach",
    description:
      "Smart sequences that adapt based on engagement. Stop when they reply, pause when they're OOO.",
  },
]

const pricingRows = [
  { feature: "Prospects/month",     pro: "500",   agency: "2,500",    enterprise: "Unlimited" },
  { feature: "AI-generated emails", pro: true,    agency: true,       enterprise: true },
  { feature: "Signal detection",    pro: "Basic", agency: "Advanced", enterprise: "Custom" },
  { feature: "Multi-inbox support", pro: false,   agency: true,       enterprise: true },
  { feature: "Team collaboration",  pro: false,   agency: true,       enterprise: true },
  { feature: "API access",          pro: false,   agency: false,      enterprise: true },
  { feature: "Dedicated CSM",       pro: false,   agency: false,      enterprise: true },
]

const limitCards = [
  {
    icon: Users,
    title: "Unlimited Prospects",
    body: "No database caps. Find as many real prospects as your ICP demands. Fresh signals every time.",
  },
  {
    icon: Send,
    title: "Unlimited Emails",
    body: "Send as many emails as you need. No per-email fees. No throttling. Just results.",
  },
  {
    icon: ShieldCheck,
    title: "Real People Only",
    body: "Zero fake leads. Our AI cross-references 7 sources to verify every single prospect before you see them.",
  },
  {
    icon: Activity,
    title: "Always Fresh Signals",
    body: "Every prospect comes with signals detected in the last 90 days. Not last year.",
  },
]

/* ─── Page ───────────────────────────────────────────────────────────────── */
export default function LandingPage() {
  const [mounted, setMounted] = useState(false)
  const terminalText = useTypewriter("find series-a founders in fintech", 40, 1100)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="min-h-screen bg-black text-white selection:bg-orange-500/30 overflow-x-hidden">

      {/* ── Keyframes ──────────────────────────────────────────────────────── */}
      <style>{`
        @keyframes letterIn {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes drawLine {
          from { width: 0px; }
          to   { width: 200px; }
        }
        @keyframes growDown {
          from { height: 0; }
          to   { height: 100vh; }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0; }
        }
        @keyframes signalPulse {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0.3; }
        }
        @keyframes demoLineIn {
          from { opacity: 0; transform: translateX(-8px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes heroRise {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes tickerScroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @keyframes marqueeScroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @keyframes searchRotate {
          0%, 100% { transform: rotate(0deg); }
          25%      { transform: rotate(-12deg); }
          75%      { transform: rotate(12deg); }
        }
        @keyframes progressFill {
          from { width: 0%; }
          to   { width: 100%; }
        }
        @keyframes confidencePulse {
          0%, 20% { color: #f97316; }
          100%    { color: #4ade80; }
        }
        .marquee-track:hover { animation-play-state: paused; }
        .marquee-item:hover  { color: #ffffff !important; }
      `}</style>

      {/* ── Signal ticker ──────────────────────────────────────────────────── */}
      <SignalTicker />

      {/* ── Scanline ───────────────────────────────────────────────────────── */}
      <div
        className="fixed inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          zIndex: 30,
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)",
        }}
      />

      {/* ── Left edge orange line ───────────────────────────────────────────── */}
      <div
        className="fixed left-0 top-0 w-px"
        aria-hidden="true"
        style={{
          zIndex: 40,
          backgroundColor: "#f97316",
          animation: mounted ? "growDown 1.2s ease-out forwards" : "none",
          height: 0,
        }}
      />

      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <nav
        className="fixed left-0 right-0 px-6 md:px-12"
        style={{ top: 32, zIndex: 50, paddingTop: 20, paddingBottom: 20 }}
      >
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <NexoraLogo size={36} />
          </Link>

          <div className="hidden items-center gap-12 md:flex">
            {(["#features", "#pricing", "/dashboard"] as const).map((href, i) => {
              const label = ["Features", "Pricing", "Sign In"][i]
              return (
                <Link
                  key={label}
                  href={href}
                  className="text-sm tracking-wide"
                  style={{ color: "rgba(255,255,255,0.52)", transition: "color 0.2s ease" }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "rgba(255,255,255,1)" }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.52)" }}
                >
                  {label}
                </Link>
              )
            })}
            <Link
              href="/onboarding"
              className="text-sm tracking-wide"
              style={{
                color: "rgba(255,255,255,0.9)",
                textDecoration: "underline",
                textDecorationThickness: "1px",
                textUnderlineOffset: "3px",
                transition: "opacity 0.2s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.65" }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = "1" }}
            >
              Get Started
            </Link>
          </div>

          <div className="md:hidden">
            <ThemeToggle />
          </div>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col justify-center px-6 md:px-12 overflow-hidden">

        {/* Dot grid */}
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden="true"
          style={{
            backgroundImage: "radial-gradient(circle, #1a1a1a 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        {/* Ambient orange glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden="true"
          style={{
            background:
              "radial-gradient(ellipse 65% 65% at 28% 52%, rgba(249,115,22,0.055) 0%, transparent 70%)",
          }}
        />

        {/* Far-left rotated sidebar label */}
        <div
          className="absolute top-1/2 hidden xl:flex items-center"
          style={{ left: 4, transform: "translateY(-50%)" }}
          aria-hidden="true"
        >
          <span
            style={{
              fontSize: 9,
              color: "#333",
              letterSpacing: "0.35em",
              textTransform: "uppercase",
              writingMode: "vertical-lr",
              transform: "rotate(180deg)",
              userSelect: "none",
            }}
          >
            AI-Powered Sales Platform
          </span>
        </div>

        {/* Content */}
        <div className="max-w-7xl w-full mx-auto" style={{ paddingTop: 120, paddingBottom: 72 }}>

          <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-16 lg:gap-24 items-center">

            {/* Left column */}
            <div>
              <div style={{ marginBottom: 16 }}>
                <span
                  className="font-mono uppercase"
                  style={{
                    fontSize: 10,
                    letterSpacing: "0.32em",
                    color: "rgba(249,115,22,0.5)",
                  }}
                >
                  AI-Powered Sales Platform
                </span>
              </div>

              <h1
                className="font-black tracking-tighter"
                style={{ fontSize: "clamp(3.5rem, 9vw, 10rem)", lineHeight: 0.88, marginBottom: 20 }}
              >
                {"NEXORA".split("").map((letter, i) => (
                  <span
                    key={i}
                    className="inline-block"
                    style={{
                      backgroundImage: "linear-gradient(135deg, #f97316 0%, #fbbf24 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                      animation: "letterIn 0.35s ease-out forwards",
                      animationDelay: `${i * 0.07}s`,
                      opacity: 0,
                    }}
                  >
                    {letter}
                  </span>
                ))}
              </h1>

              <div
                style={{
                  height: 1,
                  backgroundColor: "#f97316",
                  width: 0,
                  animation: "drawLine 0.9s ease-out 0.55s forwards",
                  marginBottom: 28,
                }}
              />

              <p
                className="font-light leading-relaxed"
                style={{
                  fontSize: "1.15rem",
                  color: "rgba(255,255,255,0.52)",
                  maxWidth: "34ch",
                  marginBottom: 48,
                }}
              >
                Cold outreach that actually works.
              </p>

              {/* Command terminal */}
              <div
                style={{
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.025)",
                  boxShadow: "0 0 40px rgba(249,115,22,0.06), inset 0 1px 0 rgba(255,255,255,0.04)",
                  position: "relative",
                  overflow: "hidden",
                  maxWidth: 440,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "9px 14px",
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <div style={{ display: "flex", gap: 5 }}>
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        style={{ width: 9, height: 9, borderRadius: "50%", background: "rgba(255,255,255,0.16)" }}
                      />
                    ))}
                  </div>
                  <span
                    className="font-mono"
                    style={{ fontSize: 10, color: "rgba(255,255,255,0.32)", letterSpacing: "0.18em" }}
                  >
                    COMMAND
                  </span>
                </div>
                <div style={{ padding: "13px 14px 15px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span className="font-mono" style={{ color: "#f97316", fontSize: 13, flexShrink: 0 }}>
                      {">"}
                    </span>
                    <span className="font-mono" style={{ color: "rgba(255,255,255,0.78)", fontSize: 13 }}>
                      {terminalText}
                    </span>
                    <span
                      style={{
                        display: "inline-block",
                        width: 8,
                        height: 15,
                        background: "#f97316",
                        verticalAlign: "middle",
                        flexShrink: 0,
                        animation: "blink 1.2s step-end infinite",
                      }}
                    />
                  </div>
                </div>
                <div
                  className="absolute inset-y-0 left-0 w-6 pointer-events-none"
                  style={{ background: "linear-gradient(to right, rgba(0,0,0,0.55), transparent)" }}
                />
                <div
                  className="absolute inset-y-0 right-0 w-6 pointer-events-none"
                  style={{ background: "linear-gradient(to left, rgba(0,0,0,0.55), transparent)" }}
                />
              </div>
            </div>

            {/* Right column */}
            <div
              className="hidden lg:block"
              style={{ animation: "heroRise 0.65s ease-out 0.85s both" }}
            >
              <LiveDemo />
            </div>
          </div>

          {/* Stats row — 3 stats evenly spaced */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 72,
              paddingTop: 48,
              paddingBottom: 48,
              borderTop: "1px solid rgba(255,255,255,0.07)",
              borderBottom: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <div>
              <div
                className="font-black tracking-tight"
                style={{ fontSize: "3.5rem", color: "#fbbf24", lineHeight: 1 }}
              >
                <AnimatedCounter value={5000} suffix="+" />
              </div>
              <p
                className="uppercase"
                style={{ fontSize: 10, color: "rgba(255,255,255,0.33)", marginTop: 10, letterSpacing: "0.24em" }}
              >
                Prospects
              </p>
            </div>
            <div>
              <div
                className="font-black tracking-tight"
                style={{ fontSize: "3.5rem", color: "#fbbf24", lineHeight: 1 }}
              >
                <AnimatedCounter value={87} suffix="%" />
              </div>
              <p
                className="uppercase"
                style={{ fontSize: 10, color: "rgba(255,255,255,0.33)", marginTop: 10, letterSpacing: "0.24em" }}
              >
                Reply Rate
              </p>
            </div>
            <div>
              <div
                className="font-black tracking-tight"
                style={{ fontSize: "3.5rem", color: "#fbbf24", lineHeight: 1 }}
              >
                2 min
              </div>
              <p
                className="uppercase"
                style={{ fontSize: 10, color: "rgba(255,255,255,0.33)", marginTop: 10, letterSpacing: "0.24em" }}
              >
                Setup Time
              </p>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 right-6 md:right-12">
          <span
            className="block whitespace-nowrap uppercase"
            style={{
              fontSize: 10,
              color: "rgba(255,255,255,0.22)",
              letterSpacing: "0.24em",
              writingMode: "vertical-lr",
              transform: "rotate(180deg)",
            }}
          >
            Scroll
          </span>
        </div>

        {/* Hero bottom fade */}
        <div
          className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none"
          aria-hidden="true"
          style={{ background: "linear-gradient(to bottom, transparent, black)" }}
        />
      </section>

      {/* ── Social proof bar ───────────────────────────────────────────────── */}
      <SocialProof />

      {/* ── No Limits ──────────────────────────────────────────────────────── */}
      <section className="px-6 py-32 md:px-12 relative">
        <div className="max-w-7xl mx-auto">
          <FadeIn style={{ marginBottom: 56 }}>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight">
              No limits. No compromises.
            </h2>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {limitCards.map((card, i) => (
              <FadeIn key={i} delay={i * 80}>
                <LimitCard {...card} />
              </FadeIn>
            ))}
          </div>
        </div>
        <div
          className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
          aria-hidden="true"
          style={{ background: "linear-gradient(to bottom, transparent, rgba(0,0,0,0.3))" }}
        />
      </section>

      {/* ── Before / After ─────────────────────────────────────────────────── */}
      <BeforeAfter />

      {/* ── Section divider ────────────────────────────────────────────────── */}
      <div
        aria-hidden="true"
        style={{
          height: 1,
          background: "linear-gradient(to right, transparent, rgba(255,255,255,0.05), transparent)",
        }}
      />

      {/* ── Features ───────────────────────────────────────────────────────── */}
      <section id="features" className="px-6 py-32 md:px-12 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-0">
            {features.map((feature, index) => (
              <FadeIn
                key={index}
                delay={index * 100}
                className={[
                  "py-8 md:py-0 md:px-8",
                  index !== features.length - 1 ? "border-b md:border-b-0 md:border-r border-white/10" : "",
                  index === 0 ? "md:pl-0" : "",
                  index === features.length - 1 ? "md:pr-0" : "",
                ].join(" ")}
              >
                <span className="text-6xl md:text-7xl font-black text-white/10 block mb-6">
                  {feature.num}
                </span>
                <h3 className="text-lg font-semibold text-white mb-3 tracking-tight">
                  {feature.title}
                </h3>
                <p className="text-sm text-white/50 leading-relaxed">{feature.description}</p>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section divider ────────────────────────────────────────────────── */}
      <div
        aria-hidden="true"
        style={{
          height: 1,
          background: "linear-gradient(to right, transparent, rgba(255,255,255,0.05), transparent)",
        }}
      />

      {/* ── Pricing ────────────────────────────────────────────────────────── */}
      <section id="pricing" className="px-6 py-32 md:px-12 border-t border-white/10">
        <div className="max-w-5xl mx-auto">

          <FadeIn style={{ marginBottom: 64 }}>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">Pricing</h2>
            <p className="text-white/50">7-day free trial. No credit card required.</p>
          </FadeIn>

          <FadeIn delay={80}>
            <div className="grid grid-cols-4 gap-4 border-b border-white/10 pb-6 mb-6">
              <div />
              {[
                { label: "Pro",        price: "$199" },
                { label: "Agency",     price: "$499" },
                { label: "Enterprise", price: "$999" },
              ].map(({ label, price }) => (
                <div key={label} className="text-center">
                  <p className="text-sm text-white/50 mb-1">{label}</p>
                  <p className="text-2xl font-bold" style={{ fontVariantNumeric: "tabular-nums" }}>
                    {price}
                    <span className="text-sm font-normal text-white/50">/mo</span>
                  </p>
                </div>
              ))}
            </div>
          </FadeIn>

          <div className="space-y-0">
            {pricingRows.map((row, index) => (
              <FadeIn key={index} delay={index * 40}>
                <div className="grid grid-cols-4 gap-4 py-4 border-b border-white/5 items-center">
                  <div className="text-sm text-white/70">{row.feature}</div>
                  {(["pro", "agency", "enterprise"] as const).map((plan) => {
                    const val = row[plan]
                    return (
                      <div key={plan} className="text-center text-sm">
                        {typeof val === "boolean" ? (
                          val ? (
                            <Check className="h-4 w-4 text-white/60 mx-auto" />
                          ) : (
                            <span style={{ color: "rgba(255,255,255,0.18)" }}>-</span>
                          )
                        ) : (
                          <span className="text-white/70">{val}</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </FadeIn>
            ))}
          </div>

          <FadeIn delay={200} style={{ marginTop: 48, display: "flex", justifyContent: "center" }}>
            <Link
              href="/onboarding"
              className="group inline-flex items-center gap-3 text-sm tracking-wide"
              style={{ transition: "opacity 0.2s ease" }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.65" }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = "1" }}
            >
              <span
                style={{
                  color: "#fff",
                  textDecoration: "underline",
                  textDecorationThickness: "1px",
                  textUnderlineOffset: "3px",
                }}
              >
                Start your free trial
              </span>
              <ArrowRight className="h-4 w-4 text-white/40 group-hover:translate-x-1 transition-transform duration-200" />
            </Link>
          </FadeIn>
        </div>
      </section>

      {/* ── Pricing footnotes ──────────────────────────────────────────────── */}
      <section className="px-6 pb-20 md:px-12">
        <FadeIn style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          {[
            "No contracts. Cancel anytime.",
            "No credit card required for trial.",
            "Upgrade or downgrade instantly.",
          ].map((line) => (
            <p key={line} className="text-xs tracking-wide" style={{ color: "rgba(255,255,255,0.24)" }}>
              {line}
            </p>
          ))}
        </FadeIn>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="px-6 md:px-12 border-t border-white/10" style={{ paddingTop: 56, paddingBottom: 48 }}>
        <div className="max-w-7xl mx-auto">

          <div
            className="flex flex-col md:flex-row justify-between items-start gap-10"
            style={{ marginBottom: 48 }}
          >
            <div>
              <div className="flex items-center gap-2.5" style={{ marginBottom: 16 }}>
                <NexoraLogo size={26} />
                <span className="text-sm tracking-wide" style={{ color: "rgba(255,255,255,0.38)" }}>
                  Nexora
                </span>
              </div>
              <p
                style={{
                  fontSize: 13,
                  color: "rgba(255,255,255,0.32)",
                  maxWidth: "38ch",
                  lineHeight: 1.65,
                }}
              >
                Built for founders who close deals, not craft emails.
              </p>
            </div>

            <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "rgba(255,255,255,0.28)", transition: "color 0.2s ease", display: "block" }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.7)" }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.28)" }}
                aria-label="Twitter / X"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.259 5.629z" />
                </svg>
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "rgba(255,255,255,0.28)", transition: "color 0.2s ease", display: "block" }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.7)" }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.28)" }}
                aria-label="LinkedIn"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
            </div>
          </div>

          <div
            style={{
              borderTop: "1px solid rgba(255,255,255,0.06)",
              paddingTop: 20,
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <p
              className="uppercase"
              style={{ fontSize: 9, color: "rgba(255,255,255,0.18)", letterSpacing: "0.24em" }}
            >
              Cold outreach, reinvented
            </p>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.15)", letterSpacing: "0.04em" }}>
              nexoraoutreach.com
            </span>
          </div>
        </div>
      </footer>

      {/* ── Sticky CTA ─────────────────────────────────────────────────────── */}
      <StickyCTA />

    </div>
  )
}
