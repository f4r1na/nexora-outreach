"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  ArrowUp, Loader2, Check, Search, Users, Brain, Mail, Sparkles,
  Building2, Briefcase, Store, Target, Rocket,
} from "lucide-react";

const EASE = [0.4, 0, 0.2, 1] as const;

type DemoStep = { msg: string; delay: number; icon: string; hl?: boolean };

const DEMO_STEPS: DemoStep[] = [
  { msg: "Parsing your request...",            delay:  800, icon: "brain"  },
  { msg: "Identifying target audience...",     delay: 1200, icon: "target" },
  { msg: "Searching for matching leads...",    delay: 1500, icon: "search" },
  { msg: "Found 23 potential leads",           delay:    0, icon: "users",  hl: true },
  { msg: "Researching top prospects...",       delay: 2000, icon: "brain"  },
  { msg: "Writing personalized emails...",     delay: 1800, icon: "mail"   },
  { msg: "Preview ready — 23 emails drafted",  delay:    0, icon: "check",  hl: true },
  { msg: "Done",                               delay:    0, icon: "check"  },
];

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  brain: Brain, target: Target, search: Search, users: Users, mail: Mail, check: Check,
};

type DemoTemplate = { title: string; prompt: string; icon: React.ComponentType<{ size?: number; color?: string }> };
const DEMO_TEMPLATES: DemoTemplate[] = [
  { title: "SaaS founders",    prompt: "Find recently funded SaaS founders in the US and pitch our analytics product.", icon: Rocket },
  { title: "Agency outreach",  prompt: "Reach out to growth leaders at Series A startups and offer our SEO service.", icon: Briefcase },
  { title: "E-commerce DTC",   prompt: "Target DTC e-commerce founders struggling with CAC and introduce our retention tool.", icon: Store },
  { title: "Enterprise ICs",   prompt: "Connect with senior engineers at enterprise SaaS companies hiring for platform roles.", icon: Building2 },
];

const FAKE_LEADS = [
  {
    name: "John Smith",    initials: "JS",
    company: "Acme SaaS",  role: "CEO",
    preview: "Hi John, saw that Acme just raised a seed round — congrats. I noticed your team is hiring for growth roles...",
    color: "#FF5200",
  },
  {
    name: "Sarah Chen",    initials: "SC",
    company: "Flowlane",   role: "Head of Growth",
    preview: "Hi Sarah, Flowlane's recent expansion into APAC caught my eye. Most teams at your stage struggle with...",
    color: "#F59E0B",
  },
  {
    name: "Marcus Patel",  initials: "MP",
    company: "Devhub",     role: "Founder",
    preview: "Hi Marcus, love what Devhub is shipping in dev tooling. Your Product Hunt launch last week was clean...",
    color: "#FF5200",
  },
];

export default function LandingDemo() {
  const reduced = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [focused, setFocused] = useState(false);
  const [running, setRunning] = useState(false);
  const [steps, setSteps] = useState<{ msg: string; icon: string; hl?: boolean }[]>([]);
  const [showResults, setShowResults] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    return () => { timeoutsRef.current.forEach(clearTimeout); };
  }, []);

  const runDemo = (text: string) => {
    const q = text.trim();
    if (!q || running) return;
    setRunning(true); setSteps([]); setShowResults(false);
    timeoutsRef.current.forEach(clearTimeout); timeoutsRef.current = [];

    let acc = 0;
    DEMO_STEPS.forEach((s) => {
      acc += s.delay;
      const t = setTimeout(() => {
        setSteps((prev) => [...prev, { msg: s.msg, icon: s.icon, hl: s.hl }]);
      }, acc);
      timeoutsRef.current.push(t);
    });
    const end = setTimeout(() => {
      setRunning(false);
      setShowResults(true);
    }, acc + 600);
    timeoutsRef.current.push(end);
  };

  const useTpl = (t: DemoTemplate) => { setPrompt(t.prompt); runDemo(t.prompt); };

  const handleOpen = () => {
    setOpen(true);
    setTimeout(() => containerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="nx-press"
        style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          marginTop: 14,
          padding: "12px 22px",
          backgroundColor: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.12)",
          color: "#fff",
          borderRadius: 999,
          fontSize: 13.5, fontWeight: 500,
          fontFamily: "var(--font-outfit)",
          cursor: "pointer",
        }}
      >
        <Sparkles size={14} color="#F59E0B" />
        Try it free — no signup needed
      </button>

      <AnimatePresence>
        {open && (
          <motion.section
            ref={containerRef}
            initial={reduced ? false : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
            style={{
              padding: "clamp(40px, 6vw, 72px) clamp(20px, 4vw, 56px)",
              position: "relative", zIndex: 1,
              borderTop: "1px solid rgba(255,255,255,0.06)",
              overflow: "hidden",
            }}
          >
            <div style={{ maxWidth: 820, margin: "0 auto" }}>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "6px 14px", borderRadius: 999,
                backgroundColor: "rgba(255,82,0,0.10)",
                border: "1px solid rgba(255,82,0,0.25)",
                marginBottom: 20,
              }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#FF5200" }} />
                <span style={{ fontSize: 11, fontWeight: 500, color: "#FF5200", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  Demo mode — see Nexora in action
                </span>
              </div>

              <h3 style={{
                fontSize: "clamp(24px, 3.2vw, 34px)",
                fontWeight: 600, fontFamily: "var(--font-space-grotesk)",
                letterSpacing: "-0.025em", lineHeight: 1.1, marginBottom: 10,
              }}>
                Type a prompt or pick a template.
              </h3>
              <p style={{ fontSize: 14.5, color: "rgba(255,255,255,0.55)", marginBottom: 28, lineHeight: 1.55 }}>
                Watch the agent research, write, and draft emails in real time. Nothing is sent — this is a preview.
              </p>

              <div
                className={!focused && !running ? "breathe-glow" : undefined}
                style={{
                  position: "relative", padding: 1.5, borderRadius: 999,
                  background: focused
                    ? "linear-gradient(135deg, #FF5200 0%, #F59E0B 100%)"
                    : "linear-gradient(135deg, rgba(255,82,0,0.55) 0%, rgba(245,158,11,0.55) 100%)",
                  transition: "background 260ms ease",
                  marginBottom: 24,
                }}
              >
                <div style={{
                  backgroundColor: "#0E0E18", borderRadius: 999,
                  display: "flex", alignItems: "center",
                  padding: "8px 8px 8px 22px", gap: 10,
                }}>
                  <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    onKeyDown={(e) => { if (e.key === "Enter") runDemo(prompt); }}
                    placeholder="Find recently funded SaaS founders in the US..."
                    disabled={running}
                    style={{
                      flex: 1, background: "transparent", border: "none", outline: "none",
                      color: "#fff", fontSize: 15, fontFamily: "var(--font-outfit)",
                      minHeight: 44,
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => runDemo(prompt)}
                    disabled={running || !prompt.trim()}
                    className="nx-press"
                    style={{
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      width: 44, height: 44, borderRadius: 999,
                      backgroundColor: prompt.trim() && !running ? "#FF5200" : "rgba(255,255,255,0.08)",
                      border: "none", color: "#fff", cursor: running ? "default" : "pointer",
                      transition: "background-color 150ms ease",
                    }}
                  >
                    {running ? <Loader2 size={16} className="nx-spin" /> : <ArrowUp size={16} />}
                  </button>
                </div>
              </div>

              {!running && steps.length === 0 && (
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: 10,
                }}>
                  {DEMO_TEMPLATES.map((t) => {
                    const Icon = t.icon;
                    return (
                      <button
                        key={t.title}
                        type="button"
                        onClick={() => useTpl(t)}
                        className="glass glass-hover nx-press"
                        style={{
                          textAlign: "left",
                          padding: "14px",
                          borderRadius: 14,
                          display: "flex", alignItems: "center", gap: 10,
                          cursor: "pointer",
                          color: "#fff", fontFamily: "var(--font-outfit)",
                        }}
                      >
                        <div style={{
                          width: 32, height: 32, borderRadius: 8,
                          background: "linear-gradient(135deg, #FF5200 0%, #F59E0B 100%)",
                          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                        }}>
                          <Icon size={15} color="#fff" />
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 500 }}>{t.title}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {steps.length > 0 && (
                <div style={{
                  backgroundColor: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 14,
                  padding: 18,
                  marginTop: 8,
                  display: "flex", flexDirection: "column", gap: 10,
                }}>
                  {steps.map((s, i) => {
                    const Icon = ICON_MAP[s.icon] ?? Check;
                    const accent = s.hl ? "#F59E0B" : "#FF5200";
                    return (
                      <motion.div
                        key={i}
                        initial={reduced ? false : { opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, ease: EASE }}
                        style={{
                          display: "flex", alignItems: "center", gap: 12,
                          padding: "10px 14px",
                          borderRadius: "3px 10px 10px 3px",
                          borderLeft: `3px solid ${accent}`,
                          backgroundColor: "rgba(255,255,255,0.02)",
                        }}
                      >
                        <Icon size={14} color={accent} />
                        <span style={{
                          fontSize: 13.5,
                          color: s.hl ? "#fff" : "rgba(255,255,255,0.75)",
                          fontWeight: s.hl ? 500 : 400,
                        }}>{s.msg}</span>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              <AnimatePresence>
                {showResults && (
                  <motion.div
                    initial={reduced ? false : { opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: EASE }}
                    style={{ marginTop: 28 }}
                  >
                    <p style={{
                      fontSize: 11, fontWeight: 500, letterSpacing: "0.1em",
                      color: "#F59E0B", textTransform: "uppercase", marginBottom: 14,
                    }}>
                      Preview — 3 of 23 drafted emails
                    </p>

                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {FAKE_LEADS.map((l, i) => (
                        <motion.div
                          key={l.name}
                          initial={reduced ? false : { opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, ease: EASE, delay: i * 0.1 }}
                          className="glass"
                          style={{
                            padding: "16px 18px",
                            borderRadius: 12,
                            display: "flex", gap: 14, alignItems: "flex-start",
                          }}
                        >
                          <div style={{
                            width: 38, height: 38, borderRadius: 10,
                            backgroundColor: `${l.color}18`,
                            border: `1px solid ${l.color}40`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 12, fontWeight: 600, color: l.color, flexShrink: 0,
                            fontFamily: "var(--font-space-grotesk)",
                          }}>
                            {l.initials}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                              <span style={{ fontSize: 14, fontWeight: 600, color: "#fff", fontFamily: "var(--font-space-grotesk)" }}>
                                {l.name}
                              </span>
                              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>
                                {l.role} · {l.company}
                              </span>
                            </div>
                            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", lineHeight: 1.55 }}>
                              {l.preview}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    <motion.div
                      initial={reduced ? false : { opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, ease: EASE, delay: 0.45 }}
                      style={{
                        marginTop: 22,
                        padding: "26px 24px",
                        borderRadius: 16,
                        textAlign: "center",
                        background: "linear-gradient(135deg, rgba(255,82,0,0.1) 0%, rgba(245,158,11,0.08) 100%)",
                        border: "1px solid rgba(255,82,0,0.25)",
                      }}
                    >
                      <h4 style={{
                        fontSize: 22, fontWeight: 600,
                        fontFamily: "var(--font-space-grotesk)",
                        letterSpacing: "-0.02em",
                        marginBottom: 14,
                      }}>
                        Ready to send these for real?
                      </h4>
                      <Link
                        href="/signup"
                        className="nx-press"
                        style={{
                          display: "inline-flex", alignItems: "center", gap: 8,
                          padding: "12px 24px",
                          backgroundColor: "#FF5200", color: "#fff",
                          borderRadius: 999,
                          fontSize: 13.5, fontWeight: 600,
                          fontFamily: "var(--font-outfit)",
                          textDecoration: "none",
                        }}
                      >
                        Start free — 50 emails included
                      </Link>
                      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.42)", marginTop: 10 }}>
                        No credit card required
                      </p>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </>
  );
}
