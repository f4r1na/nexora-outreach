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
}: {
  children: ReactNode
  delay?: number
  className?: string
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
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(20px)",
        transition: `opacity 0.55s ease ${delay}ms, transform 0.55s ease ${delay}ms`,
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
  text: string
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
      { text: "🔍 Searching GitHub...", color: "#f97316", result: "12 found" },
      { text: "🔍 Searching HackerNews...", color: "#f97316", result: "8 found" },
      { text: "🔍 Searching ProductHunt...", color: "#f97316", result: "6 found" },
      { text: "🔍 Cross-referencing...", color: "#fbbf24", result: "verifying..." },
    ],
    duration: 4200,
  },
  {
    label: "RESULTS",
    lines: [
      { text: "✅ James Chen · DataFlow Inc · 9.2/10", color: "#4ade80", sub: "Raised $5M Series A · 2 days ago" },
      { text: "✅ Sarah Kim · CloudSync · 8.7/10", color: "#4ade80", sub: "Hired VP of Sales · 1 week ago" },
      { text: "✅ Marcus Lee · Velocity AI · 8.1/10", color: "#4ade80", sub: "Posted on HN Hiring · 3 days ago" },
    ],
    duration: 3800,
  },
  {
    label: "DRAFTING",
    lines: [
      { text: "✉️ Writing personalized email for James...", color: "#fbbf24" },
      { text: '"Hi James, saw DataFlow just closed Series A..."', color: "rgba(255,255,255,0.5)", indent: true },
    ],
    duration: 2800,
  },
  {
    label: "SENT",
    lines: [{ text: "✅ Email sent. Monitoring for reply...", color: "#4ade80" }],
    duration: 1800,
  },
]

function LiveDemo() {
  const [phase, setPhase] = useState(0)
  const [visible, setVisible] = useState(0)

  useEffect(() => {
    const p = DEMO_PHASES[phase]
    const timers: ReturnType<typeof setTimeout>[] = []

    p.lines.forEach((_, i) => {
      timers.push(setTimeout(() => setVisible(i + 1), i * 720 + 420))
    })

    timers.push(
      setTimeout(() => {
        const next = (phase + 1) % DEMO_PHASES.length
        setPhase(next)
        setVisible(0)
      }, p.duration)
    )

    return () => timers.forEach(clearTimeout)
  }, [phase])

  const p = DEMO_PHASES[phase]

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
      {/* Title bar */}
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
              boxShadow: "0 0 6px rgba(74,222,128,0.7)",
              animation: "demoPulse 1.8s ease-in-out infinite",
            }}
          />
          <span style={{ fontSize: 9, color: "#4ade80", letterSpacing: "0.12em", fontWeight: 600 }}>LIVE</span>
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
      <div className="font-mono" style={{ padding: "8px 16px 22px", minHeight: 210 }}>
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
                animation: "demoLineIn 0.2s ease-out forwards",
              }}
            >
              <div style={{ fontSize: 12, color: line.color, lineHeight: 1.5 }}>
                {line.result !== undefined ? (
                  <>
                    {line.text}
                    <span style={{ color: "rgba(255,255,255,0.24)", fontSize: 11 }}> {line.result}</span>
                  </>
                ) : (
                  line.text
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

      {/* Bottom accent bar */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 2,
          background: "linear-gradient(to right, #f97316, #fbbf24, transparent)",
          opacity: 0.3,
        }}
      />
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
        @keyframes demoPulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 6px rgba(74,222,128,0.7); }
          50%      { opacity: 0.35; box-shadow: none; }
        }
        @keyframes demoLineIn {
          from { opacity: 0; transform: translateX(-6px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes heroRise {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* ── Scanline ───────────────────────────────────────────────────────── */}
      <div
        className="fixed inset-0 pointer-events-none z-50"
        aria-hidden="true"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)",
        }}
      />

      {/* ── Left edge line ─────────────────────────────────────────────────── */}
      <div
        className="fixed left-0 top-0 w-px z-40"
        aria-hidden="true"
        style={{
          backgroundColor: "#f97316",
          animation: mounted ? "growDown 1.2s ease-out forwards" : "none",
          height: 0,
        }}
      />

      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 md:px-12" style={{ paddingTop: 22, paddingBottom: 22 }}>
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

        {/* Ambient glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden="true"
          style={{
            background:
              "radial-gradient(ellipse 65% 65% at 28% 52%, rgba(249,115,22,0.055) 0%, transparent 70%)",
          }}
        />

        {/* Rotated label */}
        <div className="absolute left-6 top-1/2 -translate-y-1/2 hidden xl:block" aria-hidden="true">
          <span
            className="text-[10px] uppercase -rotate-90 block whitespace-nowrap origin-center"
            style={{ letterSpacing: "0.35em", color: "rgba(255,255,255,0.22)" }}
          >
            AI-Powered Sales Platform
          </span>
        </div>

        {/* Content */}
        <div className="max-w-7xl w-full mx-auto" style={{ paddingTop: 88, paddingBottom: 72 }}>

          {/* Two-column: left = copy + terminal, right = demo */}
          <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-16 lg:gap-24 items-center">

            {/* Left column */}
            <div>
              {/* NEXORA */}
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

              {/* Orange line — exactly 200px */}
              <div
                style={{
                  height: 1,
                  backgroundColor: "#f97316",
                  width: 0,
                  animation: "drawLine 0.9s ease-out 0.55s forwards",
                  marginBottom: 28,
                }}
              />

              {/* Subheadline */}
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
                {/* Bar */}
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
                {/* Input line */}
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
                {/* Edge fades */}
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

            {/* Right column — demo terminal */}
            <div
              className="hidden lg:block"
              style={{ animation: "heroRise 0.65s ease-out 0.85s both" }}
            >
              <LiveDemo />
            </div>
          </div>

          {/* Stats row — below both columns */}
          <div
            style={{
              display: "flex",
              gap: 64,
              marginTop: 72,
              paddingTop: 48,
              borderTop: "1px solid rgba(255,255,255,0.07)",
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
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 right-6 md:right-12">
          <span
            className="block -rotate-90 whitespace-nowrap origin-center uppercase"
            style={{ fontSize: 10, color: "rgba(255,255,255,0.22)", letterSpacing: "0.24em" }}
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

      {/* ── Section divider ────────────────────────────────────────────────── */}
      <div
        aria-hidden="true"
        style={{
          height: 1,
          background: "linear-gradient(to right, transparent, rgba(255,255,255,0.05), transparent)",
        }}
      />

      {/* ── No Limits ──────────────────────────────────────────────────────── */}
      <section className="px-6 py-32 md:px-12 relative">
        <div className="max-w-7xl mx-auto">
          <FadeIn className="mb-14">
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

          <FadeIn className="mb-16">
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

          <FadeIn delay={200} className="mt-12 flex justify-center">
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
        <FadeIn className="flex flex-col items-center gap-4">
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
      <footer className="px-6 py-12 md:px-12 border-t border-white/10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2.5">
            <NexoraLogo size={24} />
            <span className="text-sm tracking-wide" style={{ color: "rgba(255,255,255,0.38)" }}>
              Nexora
            </span>
          </div>
          <p
            className="uppercase"
            style={{ fontSize: 10, color: "rgba(255,255,255,0.22)", letterSpacing: "0.22em" }}
          >
            Cold outreach, reinvented
          </p>
        </div>
      </footer>

    </div>
  )
}
