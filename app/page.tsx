"use client"

import { useState, useEffect, useRef, type ReactNode } from "react"
import Link from "next/link"
import { Zap, ArrowRight, Check, Users, Send, ShieldCheck, Activity } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

/* ─── Typewriter ─────────────────────────────────────────────────────────── */
function useTypewriter(text: string, speed = 45, startDelay = 900) {
  const [displayed, setDisplayed] = useState("")
  useEffect(() => {
    let i = 0
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

/* ─── Animated counter (starts on mount, not scroll) ────────────────────── */
function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    const timeout = setTimeout(() => {
      const steps = 60
      const duration = 1500
      let i = 0
      const timer = setInterval(() => {
        i++
        setCount(i >= steps ? value : Math.round((value / steps) * i))
        if (i >= steps) clearInterval(timer)
      }, duration / steps)
      return () => clearInterval(timer)
    }, 600)
    return () => clearTimeout(timeout)
  }, [value])
  return <span>{count.toLocaleString()}{suffix}</span>
}

/* ─── Scroll fade-in wrapper ─────────────────────────────────────────────── */
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
      ([entry]) => {
        if (entry.isIntersecting) { setVisible(true); observer.disconnect() }
      },
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
        transform: visible ? "translateY(0)" : "translateY(24px)",
        transition: `opacity 0.6s ease-out ${delay}ms, transform 0.6s ease-out ${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}

/* ─── "No Limits" card ───────────────────────────────────────────────────── */
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
        transition: "box-shadow 0.3s ease",
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

/* ─── Data ───────────────────────────────────────────────────────────────── */
const features = [
  {
    num: "01",
    title: "Signal Detection",
    description: "AI monitors 50+ data sources to detect buying signals. Funding rounds, job changes, tech stack updates.",
  },
  {
    num: "02",
    title: "AI Personalization",
    description: "Every email is uniquely crafted using prospect data and signal insights. No templates.",
  },
  {
    num: "03",
    title: "Autonomous Outreach",
    description: "Smart sequences that adapt based on engagement. Stop when they reply, pause when they're OOO.",
  },
]

const pricingRows = [
  { feature: "Prospects/month",    pro: "500",     agency: "2,500",    enterprise: "Unlimited" },
  { feature: "AI-generated emails",pro: true,      agency: true,       enterprise: true },
  { feature: "Signal detection",   pro: "Basic",   agency: "Advanced", enterprise: "Custom" },
  { feature: "Multi-inbox support",pro: false,     agency: true,       enterprise: true },
  { feature: "Team collaboration", pro: false,     agency: true,       enterprise: true },
  { feature: "API access",         pro: false,     agency: false,      enterprise: true },
  { feature: "Dedicated CSM",      pro: false,     agency: false,      enterprise: true },
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
  const terminalText = useTypewriter("find series-a founders in fintech", 45, 900)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="min-h-screen bg-black text-white selection:bg-orange-500/30 overflow-x-hidden">

      {/* ── Keyframes ──────────────────────────────────────────────────────── */}
      <style>{`
        @keyframes letterIn {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes drawLine {
          from { width: 0; }
          to   { width: 6rem; }
        }
        @keyframes growDown {
          from { height: 0; }
          to   { height: 100vh; }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0; }
        }
      `}</style>

      {/* ── Scanline overlay (fixed, entire page, 3% opacity) ──────────────── */}
      <div
        className="fixed inset-0 pointer-events-none z-50"
        aria-hidden="true"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)",
        }}
      />

      {/* ── Left edge orange vertical line ─────────────────────────────────── */}
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
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-6 md:px-12">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Zap className="h-6 w-6 text-orange-500" />
          </Link>
          <div className="hidden items-center gap-12 md:flex">
            <Link href="#features" className="text-sm text-white/60 hover:text-white transition-colors tracking-wide">Features</Link>
            <Link href="#pricing"  className="text-sm text-white/60 hover:text-white transition-colors tracking-wide">Pricing</Link>
            <Link href="/dashboard" className="text-sm text-white/60 hover:text-white transition-colors tracking-wide">Sign In</Link>
            <Link href="/onboarding" className="text-sm text-white underline underline-offset-4 hover:text-white/80 transition-colors tracking-wide">Get Started</Link>
          </div>
          <div className="md:hidden">
            <ThemeToggle />
          </div>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col justify-end px-6 pb-16 md:px-12 md:pb-24 overflow-hidden">

        {/* Subtle orange glow behind NEXORA */}
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden="true"
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 18% 58%, rgba(249,115,22,0.07) 0%, transparent 65%)",
          }}
        />

        {/* Rotated side text */}
        <div className="absolute left-6 top-1/2 -translate-y-1/2 hidden lg:block">
          <span className="text-[10px] tracking-[0.3em] text-white/30 uppercase -rotate-90 block whitespace-nowrap origin-center">
            AI-Powered Sales Platform
          </span>
        </div>

        {/* Main content */}
        <div className="max-w-7xl">

          {/* NEXORA — letter-by-letter gradient animation */}
          <h1
            className="font-black leading-[0.85] tracking-tighter mb-4"
            style={{ fontSize: "clamp(4rem, 12vw, 14rem)" }}
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

          {/* Orange accent line — draws left to right */}
          <div
            className="h-px mb-6"
            style={{
              backgroundColor: "#f97316",
              width: 0,
              animation: "drawLine 0.8s ease-out 0.5s forwards",
            }}
          />

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-white/60 max-w-md mb-16 leading-relaxed">
            Cold outreach that actually works.
          </p>

          {/* Command terminal + stats row */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-12">

            {/* Command terminal */}
            <div className="w-full max-w-md">
              <div
                className="border border-white/10 bg-white/5 backdrop-blur-sm relative overflow-hidden"
                style={{
                  boxShadow:
                    "0 0 48px rgba(249,115,22,0.08), 0 0 0 1px rgba(249,115,22,0.06), inset 0 1px 0 rgba(255,255,255,0.04)",
                }}
              >
                {/* Traffic lights */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
                  <div className="flex gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-white/20" />
                    <div className="h-2.5 w-2.5 rounded-full bg-white/20" />
                    <div className="h-2.5 w-2.5 rounded-full bg-white/20" />
                  </div>
                  <span className="text-[10px] text-white/40 font-mono tracking-wider">COMMAND</span>
                </div>

                {/* Typewriter */}
                <div className="p-4">
                  <div className="flex items-center gap-3">
                    <span className="text-orange-500 font-mono text-sm">{">"}</span>
                    <span className="text-white/80 font-mono text-sm">{terminalText}</span>
                    <span
                      className="inline-block w-2 h-4 bg-orange-500 align-middle"
                      style={{ animation: "blink 1s step-end infinite" }}
                    />
                  </div>
                </div>

                {/* Left edge fade to black */}
                <div
                  className="absolute inset-y-0 left-0 w-8 pointer-events-none"
                  aria-hidden="true"
                  style={{ background: "linear-gradient(to right, rgba(0,0,0,0.7), transparent)" }}
                />
                {/* Right edge fade to black */}
                <div
                  className="absolute inset-y-0 right-0 w-8 pointer-events-none"
                  aria-hidden="true"
                  style={{ background: "linear-gradient(to left, rgba(0,0,0,0.7), transparent)" }}
                />
              </div>
            </div>

            {/* Stats — yellow numbers, count from 0 on load */}
            <div className="flex gap-12 md:gap-16">
              <div>
                <div className="text-5xl md:text-6xl font-black tracking-tight" style={{ color: "#fbbf24" }}>
                  <AnimatedCounter value={5000} suffix="+" />
                </div>
                <p className="text-[10px] text-white/40 uppercase tracking-[0.2em] mt-2">Prospects</p>
              </div>
              <div>
                <div className="text-5xl md:text-6xl font-black tracking-tight" style={{ color: "#fbbf24" }}>
                  <AnimatedCounter value={87} suffix="%" />
                </div>
                <p className="text-[10px] text-white/40 uppercase tracking-[0.2em] mt-2">Reply Rate</p>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 right-6 md:right-12">
          <span className="text-[10px] text-white/30 uppercase tracking-[0.2em] -rotate-90 origin-center block">
            Scroll
          </span>
        </div>

        {/* Hero bottom fade to black */}
        <div
          className="absolute bottom-0 left-0 right-0 h-56 pointer-events-none"
          aria-hidden="true"
          style={{ background: "linear-gradient(to bottom, transparent, black)" }}
        />
      </section>

      {/* ── Section bleed ──────────────────────────────────────────────────── */}
      <div
        aria-hidden="true"
        style={{
          height: 1,
          background: "linear-gradient(to right, transparent, rgba(255,255,255,0.05), transparent)",
        }}
      />

      {/* ── No Limits section ──────────────────────────────────────────────── */}
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
        {/* Bottom bleed into features */}
        <div
          className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
          aria-hidden="true"
          style={{ background: "linear-gradient(to bottom, transparent, rgba(0,0,0,0.25))" }}
        />
      </section>

      {/* ── Section bleed ──────────────────────────────────────────────────── */}
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
                <p className="text-sm text-white/50 leading-relaxed">
                  {feature.description}
                </p>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section bleed ──────────────────────────────────────────────────── */}
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

          {/* Header row */}
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
                  <p className="text-2xl font-bold">
                    {price}<span className="text-sm font-normal text-white/50">/mo</span>
                  </p>
                </div>
              ))}
            </div>
          </FadeIn>

          {/* Feature rows */}
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
                          val
                            ? <Check className="h-4 w-4 text-white/70 mx-auto" />
                            : <span className="text-white/20">—</span>
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

          {/* CTA */}
          <FadeIn delay={200} className="mt-12 flex justify-center">
            <Link href="/onboarding" className="group inline-flex items-center gap-3 text-sm tracking-wide">
              <span className="text-white underline underline-offset-4">Start your free trial</span>
              <ArrowRight className="h-4 w-4 text-white/50 group-hover:translate-x-1 transition-transform" />
            </Link>
          </FadeIn>
        </div>
      </section>

      {/* ── Pricing footnotes ──────────────────────────────────────────────── */}
      <section className="px-6 pb-20 md:px-12">
        <FadeIn className="flex flex-col items-center gap-4">
          <p className="text-xs tracking-wide" style={{ color: "rgba(255,255,255,0.28)" }}>
            No contracts. Cancel anytime.
          </p>
          <p className="text-xs tracking-wide" style={{ color: "rgba(255,255,255,0.28)" }}>
            No credit card required for trial.
          </p>
          <p className="text-xs tracking-wide" style={{ color: "rgba(255,255,255,0.28)" }}>
            Upgrade or downgrade instantly.
          </p>
        </FadeIn>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="px-6 py-12 md:px-12 border-t border-white/10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-orange-500" />
            <span className="text-sm text-white/50">Nexora</span>
          </div>
          <p className="text-[10px] text-white/30 uppercase tracking-[0.2em]">
            Cold outreach, reinvented
          </p>
        </div>
      </footer>

    </div>
  )
}
