"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Zap, ArrowRight, Check } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const hasAnimated = useRef(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true
          const duration = 1500
          const steps = 60
          const increment = value / steps
          let current = 0
          const timer = setInterval(() => {
            current += increment
            if (current >= value) {
              setCount(value)
              clearInterval(timer)
            } else {
              setCount(Math.floor(current))
            }
          }, duration / steps)
        }
      },
      { threshold: 0.5 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [value])

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>
}

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
  { feature: "Prospects/month", pro: "500", agency: "2,500", enterprise: "Unlimited" },
  { feature: "AI-generated emails", pro: true, agency: true, enterprise: true },
  { feature: "Signal detection", pro: "Basic", agency: "Advanced", enterprise: "Custom" },
  { feature: "Multi-inbox support", pro: false, agency: true, enterprise: true },
  { feature: "Team collaboration", pro: false, agency: true, enterprise: true },
  { feature: "API access", pro: false, agency: false, enterprise: true },
  { feature: "Dedicated CSM", pro: false, agency: false, enterprise: true },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-orange-500/30">
      {/* Navbar - Minimal, transparent */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-6 md:px-12">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Zap className="h-6 w-6 text-orange-500" />
          </Link>

          <div className="hidden items-center gap-12 md:flex">
            <Link href="#features" className="text-sm text-white/60 hover:text-white transition-colors tracking-wide">
              Features
            </Link>
            <Link href="#pricing" className="text-sm text-white/60 hover:text-white transition-colors tracking-wide">
              Pricing
            </Link>
            <Link href="/dashboard" className="text-sm text-white/60 hover:text-white transition-colors tracking-wide">
              Sign In
            </Link>
            <Link href="/onboarding" className="text-sm text-white underline underline-offset-4 hover:text-white/80 transition-colors tracking-wide">
              Get Started
            </Link>
          </div>

          <div className="md:hidden">
            <ThemeToggle />
          </div>
        </div>
      </nav>

      {/* Hero - Full screen, editorial asymmetric layout */}
      <section className="relative min-h-screen flex flex-col justify-end px-6 pb-16 md:px-12 md:pb-24">
        {/* Rotated side text */}
        <div className="absolute left-6 top-1/2 -translate-y-1/2 hidden lg:block">
          <span className="text-[10px] tracking-[0.3em] text-white/30 uppercase -rotate-90 block whitespace-nowrap origin-center">
            AI-Powered Sales Platform
          </span>
        </div>

        {/* Main content */}
        <div className="max-w-7xl">
          {/* NEXORA - Massive typography */}
          <h1 className="text-[15vw] md:text-[12vw] font-black leading-[0.85] tracking-tighter text-white mb-4">
            NEXORA
          </h1>
          
          {/* Orange accent line */}
          <div className="w-24 h-px bg-orange-500 mb-6" />
          
          {/* Subheadline */}
          <p className="text-lg md:text-xl text-white/60 max-w-md mb-16 leading-relaxed">
            Cold outreach that actually works.
          </p>

          {/* Bottom section with command bar and stats */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-12">
            {/* Command bar - bottom left */}
            <div className="w-full max-w-md">
              <div className="border border-white/10 bg-white/5 backdrop-blur-sm">
                <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
                  <div className="flex gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-white/20" />
                    <div className="h-2.5 w-2.5 rounded-full bg-white/20" />
                    <div className="h-2.5 w-2.5 rounded-full bg-white/20" />
                  </div>
                  <span className="text-[10px] text-white/40 font-mono tracking-wider">COMMAND</span>
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-3">
                    <span className="text-orange-500 font-mono text-sm">&gt;</span>
                    <span className="text-white/80 font-mono text-sm">find series-a founders in fintech</span>
                    <span className="w-2 h-4 bg-orange-500 animate-pulse" />
                  </div>
                </div>
              </div>
            </div>

            {/* Stats - bottom right */}
            <div className="flex gap-12 md:gap-16">
              <div>
                <div className="text-5xl md:text-6xl font-black tracking-tight">
                  <AnimatedCounter value={5000} suffix="+" />
                </div>
                <p className="text-[10px] text-white/40 uppercase tracking-[0.2em] mt-2">Prospects</p>
              </div>
              <div>
                <div className="text-5xl md:text-6xl font-black tracking-tight">
                  <AnimatedCounter value={87} suffix="%" />
                </div>
                <p className="text-[10px] text-white/40 uppercase tracking-[0.2em] mt-2">Reply Rate</p>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 right-6 md:right-12">
          <div className="flex flex-col items-center gap-2">
            <span className="text-[10px] text-white/30 uppercase tracking-[0.2em] -rotate-90 origin-center">Scroll</span>
          </div>
        </div>
      </section>

      {/* Features - Three columns with numbers, thin line separators */}
      <section id="features" className="px-6 py-32 md:px-12 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-0">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`py-8 md:py-0 md:px-8 ${index !== features.length - 1 ? 'border-b md:border-b-0 md:border-r border-white/10' : ''} ${index === 0 ? 'md:pl-0' : ''} ${index === features.length - 1 ? 'md:pr-0' : ''}`}
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
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing - Simple table */}
      <section id="pricing" className="px-6 py-32 md:px-12 border-t border-white/10">
        <div className="max-w-5xl mx-auto">
          <div className="mb-16">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">Pricing</h2>
            <p className="text-white/50">7-day free trial. No credit card required.</p>
          </div>

          {/* Pricing header */}
          <div className="grid grid-cols-4 gap-4 border-b border-white/10 pb-6 mb-6">
            <div></div>
            <div className="text-center">
              <p className="text-sm text-white/50 mb-1">Pro</p>
              <p className="text-2xl font-bold">$199<span className="text-sm font-normal text-white/50">/mo</span></p>
            </div>
            <div className="text-center">
              <p className="text-sm text-white/50 mb-1">Agency</p>
              <p className="text-2xl font-bold">$499<span className="text-sm font-normal text-white/50">/mo</span></p>
            </div>
            <div className="text-center">
              <p className="text-sm text-white/50 mb-1">Enterprise</p>
              <p className="text-2xl font-bold">$999<span className="text-sm font-normal text-white/50">/mo</span></p>
            </div>
          </div>

          {/* Pricing rows */}
          <div className="space-y-0">
            {pricingRows.map((row, index) => (
              <div key={index} className="grid grid-cols-4 gap-4 py-4 border-b border-white/5 items-center">
                <div className="text-sm text-white/70">{row.feature}</div>
                <div className="text-center text-sm">
                  {typeof row.pro === 'boolean' ? (
                    row.pro ? <Check className="h-4 w-4 text-white/70 mx-auto" /> : <span className="text-white/20">—</span>
                  ) : (
                    <span className="text-white/70">{row.pro}</span>
                  )}
                </div>
                <div className="text-center text-sm">
                  {typeof row.agency === 'boolean' ? (
                    row.agency ? <Check className="h-4 w-4 text-white/70 mx-auto" /> : <span className="text-white/20">—</span>
                  ) : (
                    <span className="text-white/70">{row.agency}</span>
                  )}
                </div>
                <div className="text-center text-sm">
                  {typeof row.enterprise === 'boolean' ? (
                    row.enterprise ? <Check className="h-4 w-4 text-white/70 mx-auto" /> : <span className="text-white/20">—</span>
                  ) : (
                    <span className="text-white/70">{row.enterprise}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-12 flex justify-center">
            <Link 
              href="/onboarding" 
              className="group inline-flex items-center gap-3 text-sm tracking-wide"
            >
              <span className="text-white underline underline-offset-4">Start your free trial</span>
              <ArrowRight className="h-4 w-4 text-white/50 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer - Minimal */}
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
