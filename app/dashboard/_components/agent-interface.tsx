"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import Link from "next/link";
import {
  ArrowUp, Loader2, Zap, Brain, Database,
  Mail, Inbox, BarChart2, Repeat, Search, Check,
  Rocket, Target, Users, Building2, Briefcase, Store,
} from "lucide-react";
import MeshBackground from "@/app/_components/mesh-bg";
import WelcomeCard from "./welcome-card";

const EASE = [0.4, 0, 0.2, 1] as const;
const EASE_OUT = [0.23, 1, 0.32, 1] as const;

const EXAMPLE_PROMPTS = [
  "Find 20 SaaS founders who raised a seed round this month and pitch them...",
  "Send follow-ups to all leads who opened my email but never replied...",
  "Research 15 e-commerce store owners in Austin and write personalized emails...",
  "Find marketing directors at Series A startups and draft outreach about our agency...",
  "Check my inbox for replies and draft responses to the interested leads...",
  "Build a campaign targeting HR managers at companies with 50-200 employees...",
];

type Template = {
  id: string;
  title: string;
  subtitle: string;
  prompt: string;
  icon: React.ReactNode;
  accent: string;
};

const TEMPLATES: Template[] = [
  { id: "saas-founder",   title: "SaaS founder outreach", subtitle: "Pitch recently funded founders",   prompt: "Find 20 SaaS founders who raised a seed round in the last 60 days and write pitches tailored to their product.", icon: <Rocket size={20} />,    accent: "#FF5200" },
  { id: "agency-pitch",   title: "Agency pitch",          subtitle: "Growth leaders at Series A",       prompt: "Find 15 growth and marketing leaders at Series A startups and draft outreach about our agency's paid acquisition work.", icon: <Target size={20} />,    accent: "#F59E0B" },
  { id: "freelancer",     title: "Freelancer intro",      subtitle: "Warm cold-intros to CTOs",         prompt: "Write warm cold-intros to 20 CTOs at 50-200 person startups introducing me as a contract backend engineer.", icon: <Briefcase size={20} />, accent: "#FF5200" },
  { id: "ecom",           title: "E-commerce brands",     subtitle: "DTC founders with CAC pain",       prompt: "Find 25 DTC e-commerce founders doing $1-10M ARR and pitch our retention platform.", icon: <Store size={20} />,     accent: "#F59E0B" },
  { id: "real-estate",    title: "Real estate agents",    subtitle: "Top producers in a market",        prompt: "Find 30 top-producing real estate agents in Austin, TX and pitch our listing automation tool.", icon: <Building2 size={20} />, accent: "#FF5200" },
  { id: "recruiting",     title: "Recruiting outreach",   subtitle: "Senior engineers, specific stack", prompt: "Find 20 senior backend engineers with Go and Kubernetes experience and write recruiter pitches for our open role.", icon: <Users size={20} />,     accent: "#F59E0B" },
];

type AgentStep = { message: string; icon: string; done: boolean };
type ResultItem = { id: string; title: string; subtitle: string; meta?: string; status?: string };
type AgentResult = { intent: string; summary: string; items: ResultItem[]; action?: { label: string; href: string } };

const ICON_MAP: Record<string, React.ReactNode> = {
  brain: <Brain size={12} />, zap: <Zap size={12} />, database: <Database size={12} />,
  mail: <Mail size={12} />, inbox: <Inbox size={12} />, "bar-chart": <BarChart2 size={12} />,
  repeat: <Repeat size={12} />, search: <Search size={12} />, check: <Check size={12} />,
};

const STEP_COLORS = ["#FF5200", "#F59E0B", "#4ade80", "rgba(74,222,128,0.55)"] as const;

const CAMPAIGN_PATTERNS = [
  /find leads/i, /create campaign/i, /new campaign/i, /outreach to/i,
  /reach out to/i, /cold email/i, /cold outreach/i, /prospect/i,
  /\bfind \d+\b/i, /\bwrite .{0,30}emails?\b/i, /\bdraft .{0,30}emails?\b/i,
];

function isCampaignIntent(text: string): boolean {
  return CAMPAIGN_PATTERNS.some((p) => p.test(text));
}

function inferAudience(text: string): string {
  const m = text.match(
    /(?:find|reach|target|prospect|outreach to|email)\s+(?:\d+\s+)?([A-Za-z][\w\s-]{2,40}?)(?:\s+(?:in\b|at\b|who\b|that\b|and\b|,)|$)/i
  );
  return m ? m[1].trim() : "";
}

const STATUS_COLOR: Record<string, string> = {
  sent: "#4ade80", pending: "#facc15", draft: "#555", draft_ready: "#60a5fa",
  ready: "#4ade80", active: "#4ade80", paused: "#555", cancelled: "#f87171",
};

const CHIPS: { label: string; icon: React.ReactNode }[] = [
  { label: "Show my campaigns", icon: <Mail size={12} /> },
  { label: "Check inbox",       icon: <Inbox size={12} /> },
  { label: "View analytics",    icon: <BarChart2 size={12} /> },
  { label: "List follow-ups",   icon: <Repeat size={12} /> },
];

// ─── Headline word-stagger component ─────────────────────────────────────────

function StaggerHeadline({
  text, color = "#fff", delay = 0, gradient = false,
}: { text: string; color?: string; delay?: number; gradient?: boolean }) {
  const reduced = useReducedMotion();
  const words = text.split(" ");
  return (
    <>
      {words.map((w, i) => (
        <motion.span
          key={i}
          initial={reduced ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE, delay: delay + i * 0.08 }}
          className={gradient ? "headline-gradient" : undefined}
          style={{
            display: "inline-block",
            color: gradient ? undefined : color,
            marginRight: "0.24em",
          }}
        >
          {w}
        </motion.span>
      ))}
    </>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AgentInterface({
  email,
  hasCompanyProfile,
}: {
  email: string;
  hasCompanyProfile: boolean;
}) {
  const router = useRouter();
  const reduced = useReducedMotion();
  const [prompt, setPrompt]           = useState("");
  const [focused, setFocused]         = useState(false);
  const [loading, setLoading]         = useState(false);
  const [steps, setSteps]             = useState<AgentStep[]>([]);
  const [result, setResult]           = useState<AgentResult | null>(null);
  const [error, setError]             = useState<string | null>(null);
  const [promptIdx, setPromptIdx]     = useState(0);
  const [hoveredChip, setHoveredChip] = useState<string | null>(null);
  const textareaRef                   = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (prompt || focused) return;
    const id = setInterval(() => setPromptIdx((i) => (i + 1) % EXAMPLE_PROMPTS.length), 3500);
    return () => clearInterval(id);
  }, [prompt, focused]);

  const submit = async (text?: string) => {
    const q = (text ?? prompt).trim();
    if (!q || loading) return;

    if (isCampaignIntent(q)) {
      const audience = inferAudience(q);
      const dest = audience
        ? `/dashboard/campaigns/new?q1=${encodeURIComponent(audience)}`
        : "/dashboard/campaigns/new";
      router.push(dest);
      return;
    }

    setLoading(true); setSteps([]); setResult(null); setError(null);
    if (!text) setPrompt("");
    try {
      const resp = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: q }),
      });
      if (!resp.ok || !resp.body) throw new Error("Request failed");
      const reader  = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const chunks = buf.split("\n\n");
        buf = chunks.pop() ?? "";
        for (const chunk of chunks) {
          if (!chunk.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(chunk.slice(6)) as {
              type: string; message?: string; icon?: string; data?: AgentResult;
            };
            if (event.type === "step") {
              setSteps((prev) => [...prev, { message: event.message ?? "", icon: event.icon ?? "zap", done: false }]);
            } else if (event.type === "result" && event.data) {
              setSteps((prev) => prev.map((s) => ({ ...s, done: true })));
              setResult(event.data);
            } else if (event.type === "error") {
              setError(event.message ?? "Unknown error");
            }
          } catch { /* ignore */ }
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const useTemplate = (t: Template) => {
    setPrompt(t.prompt);
    textareaRef.current?.focus();
  };

  const hasOutput = steps.length > 0 || result !== null || error !== null;
  const showPlaceholder = !prompt && !loading;

  const fadeIn = (delay: number) => ({
    initial: reduced ? false : { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: EASE, delay },
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "calc(100vh - 60px)", paddingBottom: 96 }}>

      {/* ─── Hero ─────────────────────────────────────────────────────── */}
      <section style={{
        paddingTop: "clamp(56px, 8vw, 96px)",
        paddingBottom: "clamp(36px, 5vw, 56px)",
        paddingLeft: 32, paddingRight: 32,
        display: "flex", flexDirection: "column", alignItems: "center",
        position: "relative",
      }}>
        <MeshBackground />

        <div style={{ width: "100%", maxWidth: 780, textAlign: "center", position: "relative", zIndex: 2 }}>

          <WelcomeCard hasCompanyProfile={hasCompanyProfile} />

          {/* Username pulse */}
          <motion.p
            {...fadeIn(0)}
            className="username-pulse"
            style={{
              fontSize: 11, fontWeight: 500, letterSpacing: "0.1em",
              color: "rgba(255,255,255,0.55)",
              textTransform: "uppercase",
              fontFamily: "var(--font-outfit)",
              marginBottom: 18,
            }}
          >
            {email.split("@")[0]}
          </motion.p>

          {/* Headline — word stagger */}
          <h1 style={{
            fontSize: "clamp(40px, 6vw, 72px)",
            fontWeight: 600,
            fontFamily: "var(--font-space-grotesk)",
            letterSpacing: "-0.035em",
            lineHeight: 1.02,
            marginBottom: 18,
          }}>
            <StaggerHeadline text="Your outreach," delay={0.1} />
            <br />
            <StaggerHeadline text="on autopilot." delay={0.26} gradient />
          </h1>

          {/* Subtitle */}
          <motion.p
            {...fadeIn(0.5)}
            style={{
              fontSize: 16,
              color: "rgba(255,255,255,0.55)",
              fontFamily: "var(--font-outfit)",
              marginBottom: 28,
              maxWidth: 560, marginInline: "auto",
              lineHeight: 1.6,
            }}
          >
            Describe what you need. Nexora researches, writes, sends, and follows up.
          </motion.p>

          {/* Company profile badge */}
          <motion.div {...fadeIn(0.6)} style={{ marginBottom: 24 }}>
            {hasCompanyProfile ? (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#4ade80" }} />
                <span style={{ fontSize: 11, color: "#4ade80", fontWeight: 500 }}>Company profile active</span>
              </div>
            ) : (
              <Link href="/dashboard/settings" style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                fontSize: 11, color: "rgba(255,82,0,0.8)", textDecoration: "none",
              }}>
                Set up your company profile →
              </Link>
            )}
          </motion.div>

          {/* ─── Pill prompt bar with animated halo ─────────────────── */}
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: EASE, delay: 0.7 }}
            style={{ position: "relative" }}
          >
            {/* Rotating halo */}
            {!reduced && (
              <div style={{
                position: "absolute",
                inset: -2,
                borderRadius: 999,
                background: "conic-gradient(from 0deg, #FF5200, #F59E0B, #FF5200, #CC2200, #FF5200)",
                filter: focused ? "blur(14px)" : "blur(10px)",
                opacity: focused ? 0.55 : 0.28,
                animation: "halo-spin 8s linear infinite",
                transition: "opacity 0.3s ease, filter 0.3s ease",
                zIndex: 0,
              }} />
            )}

            <div
              className={!focused && !loading ? "breathe-glow" : undefined}
              style={{
                position: "relative",
                padding: 1.5,
                borderRadius: 999,
                background: focused
                  ? "linear-gradient(135deg, #FF5200 0%, #F59E0B 100%)"
                  : "linear-gradient(135deg, rgba(255,82,0,0.6) 0%, rgba(245,158,11,0.6) 100%)",
                boxShadow: focused
                  ? "0 0 0 6px rgba(255,82,0,0.1), 0 26px 80px -20px rgba(255,82,0,0.4)"
                  : undefined,
                transition: "background 260ms ease",
                zIndex: 1,
              }}
            >
              <div style={{
                position: "relative",
                backgroundColor: "#0E0E18",
                borderRadius: 999,
                display: "flex",
                alignItems: "center",
                minHeight: 68,
                paddingLeft: 28,
                paddingRight: 8,
              }}>
                {showPlaceholder && (
                  <div style={{
                    position: "absolute",
                    top: 0, bottom: 0, left: 28, right: 100,
                    display: "flex", alignItems: "center",
                    pointerEvents: "none", userSelect: "none",
                    overflow: "hidden",
                  }}>
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={promptIdx}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: focused ? 0.25 : 0.45 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.42, ease: EASE_OUT }}
                        style={{
                          display: "block",
                          color: "rgba(255,255,255,0.65)",
                          fontFamily: "var(--font-outfit)",
                          fontSize: 15.5,
                          lineHeight: 1.4,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          width: "100%",
                          textAlign: "left",
                        }}
                      >
                        {EXAMPLE_PROMPTS[promptIdx]}
                      </motion.span>
                    </AnimatePresence>
                  </div>
                )}

                <textarea
                  ref={textareaRef}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  onKeyDown={handleKey}
                  rows={1}
                  style={{
                    flex: 1,
                    padding: "24px 0",
                    backgroundColor: "transparent",
                    border: "none",
                    outline: "none",
                    color: "#fff",
                    fontFamily: "var(--font-outfit)",
                    fontSize: 15.5,
                    lineHeight: 1.4,
                    resize: "none",
                    position: "relative",
                    zIndex: 2,
                    textAlign: "left",
                  }}
                />

                <button
                  onClick={() => submit()}
                  disabled={!prompt.trim() || loading}
                  style={{
                    position: "relative",
                    zIndex: 3,
                    flexShrink: 0,
                    height: 52,
                    paddingLeft: 22,
                    paddingRight: 24,
                    borderRadius: 999,
                    backgroundColor: prompt.trim() && !loading ? "#FF5200" : "rgba(255,255,255,0.06)",
                    border: "none",
                    cursor: prompt.trim() && !loading ? "pointer" : "default",
                    display: "flex", alignItems: "center", gap: 6,
                    color: prompt.trim() ? "#fff" : "rgba(255,255,255,0.3)",
                    fontSize: 13.5, fontWeight: 600,
                    fontFamily: "var(--font-outfit)",
                    transition: "background-color 160ms ease, transform 100ms ease-out",
                  }}
                  onMouseDown={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.97)"; }}
                  onMouseUp={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; }}
                >
                  {loading
                    ? <Loader2 size={16} className="nexora-spin" />
                    : <>
                        <span>Send</span>
                        <ArrowUp size={14} />
                      </>
                  }
                </button>
              </div>
            </div>
          </motion.div>

          {/* Suggestion chips */}
          <AnimatePresence>
            {!loading && !result && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, delay: 0.9, ease: EASE }}
                style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginTop: 22 }}
              >
                {CHIPS.map((c) => (
                  <button
                    key={c.label}
                    onClick={() => submit(c.label)}
                    onMouseEnter={() => setHoveredChip(c.label)}
                    onMouseLeave={() => setHoveredChip(null)}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      padding: "8px 15px",
                      backgroundColor: hoveredChip === c.label ? "rgba(255,255,255,0.055)" : "rgba(255,255,255,0.025)",
                      border: `1px solid ${hoveredChip === c.label ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.08)"}`,
                      borderRadius: 999,
                      color: hoveredChip === c.label ? "#fff" : "rgba(255,255,255,0.6)",
                      fontSize: 12.5,
                      fontFamily: "var(--font-outfit)",
                      cursor: "pointer",
                      transform: hoveredChip === c.label ? "translateY(-2px)" : "translateY(0)",
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      backdropFilter: "blur(8px)",
                    }}
                  >
                    {c.icon}
                    {c.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* ─── Templates (taller glass cards) ───────────────────────── */}
      {!hasOutput && !loading && (
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE, delay: 1.0 }}
          style={{ paddingLeft: 32, paddingRight: 32, marginTop: 16 }}
        >
          <div style={{ maxWidth: 1160, margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 18 }}>
              <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.1em", color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>
                Try these campaigns
              </p>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
                Click to use as a starting point
              </span>
            </div>

            <div style={{
              display: "flex", gap: 16,
              overflowX: "auto",
              paddingBottom: 12, paddingTop: 6,
              scrollbarWidth: "thin",
            }}>
              {TEMPLATES.map((t, i) => (
                <motion.button
                  key={t.id}
                  initial={reduced ? false : { opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55, delay: 1.15 + i * 0.08, ease: EASE }}
                  onClick={() => useTemplate(t)}
                  className="glass glass-hover"
                  style={{
                    flexShrink: 0,
                    width: 280,
                    minHeight: 180,
                    textAlign: "left",
                    padding: "22px 22px 20px",
                    borderRadius: 18,
                    cursor: "pointer",
                    fontFamily: "var(--font-outfit)",
                    display: "flex", flexDirection: "column",
                    background: "linear-gradient(180deg, rgba(255,255,255,0.055) 0%, rgba(255,255,255,0.025) 100%)",
                    position: "relative",
                  }}
                >
                  <div style={{
                    width: 44, height: 44,
                    borderRadius: 12,
                    background: `linear-gradient(135deg, ${t.accent} 0%, ${t.accent === "#FF5200" ? "#F59E0B" : "#FF5200"} 100%)`,
                    color: "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    marginBottom: 18,
                    boxShadow: `0 6px 20px -4px ${t.accent}55`,
                  }}>
                    {t.icon}
                  </div>
                  <p style={{
                    fontSize: 15, fontWeight: 600, color: "#fff",
                    fontFamily: "var(--font-space-grotesk)", marginBottom: 6,
                    letterSpacing: "-0.01em",
                  }}>
                    {t.title}
                  </p>
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>
                    {t.subtitle}
                  </p>
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* ─── Stats row (glass bar) ────────────────────────────────── */}
      {!hasOutput && !loading && (
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: EASE }}
          style={{ padding: "48px 32px 0" }}
        >
          <div
            className="glass"
            style={{
              maxWidth: 900, margin: "0 auto",
              borderRadius: 20,
              padding: "22px clamp(20px, 4vw, 40px)",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: 4,
              background: "linear-gradient(180deg, rgba(255,255,255,0.055) 0%, rgba(255,255,255,0.025) 100%)",
            }}
          >
            {[
              { value: "2M+",  label: "Emails sent" },
              { value: "47%",  label: "Avg open rate" },
              { value: "500+", label: "Teams using Nexora" },
            ].map((s, i, arr) => (
              <div
                key={s.label}
                style={{
                  display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center",
                  gap: 6,
                  padding: "8px 16px",
                  borderRight: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
                }}
              >
                <span
                  className="headline-gradient"
                  style={{
                    fontSize: "clamp(26px, 3vw, 34px)",
                    fontWeight: 600,
                    fontFamily: "var(--font-space-grotesk)",
                    letterSpacing: "-0.03em",
                    lineHeight: 1,
                  }}
                >
                  {s.value}
                </span>
                <span style={{
                  fontSize: 12,
                  color: "rgba(255,255,255,0.5)",
                  fontFamily: "var(--font-outfit)",
                }}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ─── Activity Feed + Results ───────────────────────────────── */}
      <div style={{ flex: 1, maxWidth: 820, width: "100%", margin: "0 auto", padding: "32px 32px 0" }}>
        <AnimatePresence>
          {steps.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: EASE }}
              style={{ marginBottom: 32 }}
            >
              <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.08em", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", marginBottom: 14 }}>
                Activity
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {steps.map((step, i) => {
                  const color = step.done ? "#4ade80" : STEP_COLORS[i % STEP_COLORS.length];
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, ease: EASE, delay: i * 0.05 }}
                      style={{
                        display: "flex", alignItems: "center", gap: 12,
                        padding: "10px 14px 10px 16px",
                        backgroundColor: "rgba(14,14,24,0.65)",
                        borderLeft: `3px solid ${color}`,
                        border: "1px solid rgba(255,255,255,0.05)",
                        borderLeftWidth: 3, borderLeftColor: color,
                        borderRadius: "3px 12px 12px 3px",
                        backdropFilter: "blur(8px)",
                      }}
                    >
                      <div style={{ color, display: "flex", flexShrink: 0 }}>
                        {step.done ? <Check size={12} /> : (ICON_MAP[step.icon] ?? <Zap size={12} />)}
                      </div>
                      <span style={{ fontSize: 13, color: step.done ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.85)" }}>
                        {step.message}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{
                padding: "14px 18px",
                backgroundColor: "rgba(248,113,113,0.08)",
                border: "1px solid rgba(248,113,113,0.22)",
                borderRadius: 12,
                color: "#f87171", fontSize: 13, marginBottom: 24,
              }}
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: EASE }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 18 }}>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.08em", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", marginBottom: 6 }}>
                    Results
                  </p>
                  <p style={{ fontSize: 14, color: "rgba(255,255,255,0.8)" }}>{result.summary}</p>
                </div>
                {result.action && (
                  <Link href={result.action.href} style={{
                    padding: "8px 16px", backgroundColor: "#FF5200", color: "#fff",
                    borderRadius: 999, fontSize: 12.5, fontWeight: 600,
                    textDecoration: "none", whiteSpace: "nowrap", flexShrink: 0,
                  }}>
                    {result.action.label}
                  </Link>
                )}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
                {result.items.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease: EASE, delay: i * 0.04 }}
                    className="glass"
                    style={{ borderRadius: 14, padding: "16px 18px" }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
                      <p style={{
                        fontSize: 13.5, fontWeight: 600, color: "#fff",
                        fontFamily: "var(--font-space-grotesk)", lineHeight: 1.3,
                      }}>
                        {item.title}
                      </p>
                      {item.status && (
                        <div style={{
                          width: 6, height: 6, borderRadius: "50%",
                          backgroundColor: STATUS_COLOR[item.status] ?? "#555",
                          flexShrink: 0, marginTop: 6,
                        }} />
                      )}
                    </div>
                    <p style={{ fontSize: 12.5, color: "rgba(255,255,255,0.5)", lineHeight: 1.5, marginBottom: item.meta ? 6 : 0 }}>
                      {item.subtitle}
                    </p>
                    {item.meta && (
                      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{item.meta}</p>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── How it works (giant 01/02/03, alternating) ───────────── */}
      {!hasOutput && (
        <section style={{ padding: "96px 32px 0", position: "relative" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <motion.div
              initial={reduced ? false : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, ease: EASE }}
              style={{ marginBottom: 56, maxWidth: 580 }}
            >
              <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.1em", color: "#F59E0B", textTransform: "uppercase", marginBottom: 12 }}>
                How it works
              </p>
              <h2 style={{
                fontSize: "clamp(28px, 4vw, 44px)",
                fontWeight: 600,
                fontFamily: "var(--font-space-grotesk)",
                letterSpacing: "-0.03em",
                lineHeight: 1.05,
              }}>
                From prompt to pipeline in three steps.
              </h2>
            </motion.div>

            <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
              {[
                {
                  n: "01",
                  title: "Describe your target",
                  desc: "Tell Nexora who you want to reach in plain language.",
                },
                {
                  n: "02",
                  title: "AI does the research",
                  desc: "Nexora finds leads, reads their LinkedIn, company news, and recent activity.",
                },
                {
                  n: "03",
                  title: "Emails go out automatically",
                  desc: "Personalized emails sent from your Gmail, follow-ups scheduled.",
                },
              ].map((s, i) => {
                const reverse = i % 2 === 1;
                return (
                  <motion.div
                    key={s.n}
                    initial={reduced ? false : { opacity: 0, y: 28 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.6, ease: EASE }}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "minmax(140px, 220px) 1fr",
                      gap: "clamp(24px, 5vw, 64px)",
                      alignItems: "center",
                      direction: reverse ? "rtl" : "ltr",
                    }}
                  >
                    <div
                      style={{
                        direction: "ltr",
                        fontSize: "clamp(72px, 10vw, 120px)",
                        fontWeight: 500,
                        fontFamily: "var(--font-space-grotesk)",
                        color: "rgba(255,82,0,0.22)",
                        lineHeight: 0.9,
                        letterSpacing: "-0.05em",
                        fontFeatureSettings: "'tnum' on",
                        textAlign: reverse ? "right" : "left",
                      }}
                    >
                      {s.n}
                    </div>
                    <div style={{ direction: "ltr", textAlign: reverse ? "right" : "left" }}>
                      <h3 style={{
                        fontSize: "clamp(20px, 2.4vw, 28px)",
                        fontWeight: 600,
                        color: "#fff",
                        fontFamily: "var(--font-space-grotesk)",
                        letterSpacing: "-0.02em",
                        lineHeight: 1.15,
                        marginBottom: 10,
                      }}>
                        {s.title}
                      </h3>
                      <p style={{
                        fontSize: 15,
                        color: "rgba(255,255,255,0.55)",
                        lineHeight: 1.6,
                        maxWidth: 500,
                        marginLeft: reverse ? "auto" : 0,
                      }}>
                        {s.desc}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <style>{`
        .nexora-spin { animation: nexora-spin 1s linear infinite; }
        @keyframes nexora-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
