"use client";

import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  ArrowUp, Loader2, Zap, Brain, Database,
  Mail, Inbox, BarChart2, Repeat, Search, Check,
  Rocket, Target, Users, Building2, Briefcase, Store,
} from "lucide-react";

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

// ─── Rotating example prompts ─────────────────────────────────────────────────

const EXAMPLE_PROMPTS = [
  "Find 20 SaaS founders who raised a seed round this month and pitch them...",
  "Send follow-ups to all leads who opened my email but never replied...",
  "Research 15 e-commerce store owners in Austin and write personalized emails...",
  "Find marketing directors at Series A startups and draft outreach about our agency...",
  "Check my inbox for replies and draft responses to the interested leads...",
  "Build a campaign targeting HR managers at companies with 50-200 employees...",
];

// ─── Templates ────────────────────────────────────────────────────────────────

type Template = {
  id: string;
  title: string;
  subtitle: string;
  prompt: string;
  icon: React.ReactNode;
  accent: string;
};

const TEMPLATES: Template[] = [
  {
    id: "saas-founder",
    title: "SaaS founder outreach",
    subtitle: "Pitch recently funded founders",
    prompt: "Find 20 SaaS founders who raised a seed round in the last 60 days and write pitches tailored to their product.",
    icon: <Rocket size={14} />,
    accent: "#FF5200",
  },
  {
    id: "agency-pitch",
    title: "Agency pitch",
    subtitle: "Growth leaders at Series A",
    prompt: "Find 15 growth and marketing leaders at Series A startups and draft outreach about our agency's paid acquisition work.",
    icon: <Target size={14} />,
    accent: "#F59E0B",
  },
  {
    id: "freelancer-intro",
    title: "Freelancer intro",
    subtitle: "Warm cold-intros to CTOs",
    prompt: "Write warm cold-intros to 20 CTOs at 50-200 person startups introducing me as a contract backend engineer.",
    icon: <Briefcase size={14} />,
    accent: "#FF5200",
  },
  {
    id: "ecom-brands",
    title: "E-commerce brands",
    subtitle: "DTC founders with CAC pain",
    prompt: "Find 25 DTC e-commerce founders doing $1-10M ARR and pitch our retention platform.",
    icon: <Store size={14} />,
    accent: "#F59E0B",
  },
  {
    id: "real-estate",
    title: "Real estate agents",
    subtitle: "Top producers in a market",
    prompt: "Find 30 top-producing real estate agents in Austin, TX and pitch our listing automation tool.",
    icon: <Building2 size={14} />,
    accent: "#FF5200",
  },
  {
    id: "recruiting",
    title: "Recruiting outreach",
    subtitle: "Senior engineers, specific stack",
    prompt: "Find 20 senior backend engineers with Go and Kubernetes experience and write recruiter pitches for our open role.",
    icon: <Users size={14} />,
    accent: "#F59E0B",
  },
];

// ─── Types ────────────────────────────────────────────────────────────────────

type AgentStep = { message: string; icon: string; done: boolean };

type ResultItem = {
  id: string;
  title: string;
  subtitle: string;
  meta?: string;
  status?: string;
};

type AgentResult = {
  intent: string;
  summary: string;
  items: ResultItem[];
  action?: { label: string; href: string };
};

const ICON_MAP: Record<string, React.ReactNode> = {
  brain:       <Brain size={12} />,
  zap:         <Zap size={12} />,
  database:    <Database size={12} />,
  mail:        <Mail size={12} />,
  inbox:       <Inbox size={12} />,
  "bar-chart": <BarChart2 size={12} />,
  repeat:      <Repeat size={12} />,
  search:      <Search size={12} />,
  check:       <Check size={12} />,
};

// Per-step left-border color (cycles through orange → amber → green → muted)
const STEP_COLORS = ["#FF5200", "#F59E0B", "#4ade80", "rgba(74,222,128,0.55)"] as const;

const STATUS_COLOR: Record<string, string> = {
  sent:        "#4ade80",
  pending:     "#facc15",
  draft:       "#555",
  draft_ready: "#60a5fa",
  ready:       "#4ade80",
  active:      "#4ade80",
  paused:      "#555",
  cancelled:   "#f87171",
};

// ─── Chip presets ─────────────────────────────────────────────────────────────

const CHIPS: { label: string; icon: React.ReactNode }[] = [
  { label: "Show my campaigns", icon: <Mail size={12} /> },
  { label: "Check inbox",       icon: <Inbox size={12} /> },
  { label: "View analytics",    icon: <BarChart2 size={12} /> },
  { label: "List follow-ups",   icon: <Repeat size={12} /> },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function AgentInterface({
  email,
  hasCompanyProfile,
}: {
  email: string;
  hasCompanyProfile: boolean;
}) {
  const [prompt, setPrompt]           = useState("");
  const [focused, setFocused]         = useState(false);
  const [loading, setLoading]         = useState(false);
  const [steps, setSteps]             = useState<AgentStep[]>([]);
  const [result, setResult]           = useState<AgentResult | null>(null);
  const [error, setError]             = useState<string | null>(null);
  const [promptIdx, setPromptIdx]     = useState(0);
  const [hoveredChip, setHoveredChip] = useState<string | null>(null);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const textareaRef                   = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (prompt || focused) return;
    const id = setInterval(() => {
      setPromptIdx((i) => (i + 1) % EXAMPLE_PROMPTS.length);
    }, 3500);
    return () => clearInterval(id);
  }, [prompt, focused]);

  const submit = async (text?: string) => {
    const q = (text ?? prompt).trim();
    if (!q || loading) return;

    setLoading(true);
    setSteps([]);
    setResult(null);
    setError(null);
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
              type: string;
              message?: string;
              icon?: string;
              data?: AgentResult;
            };
            if (event.type === "step") {
              setSteps((prev) => [
                ...prev,
                { message: event.message ?? "", icon: event.icon ?? "zap", done: false },
              ]);
            } else if (event.type === "result" && event.data) {
              setSteps((prev) => prev.map((s) => ({ ...s, done: true })));
              setResult(event.data);
            } else if (event.type === "error") {
              setError(event.message ?? "Unknown error");
            }
          } catch {
            // ignore malformed chunks
          }
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

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "calc(100vh - 60px)", paddingBottom: 80 }}>

      {/* ─── Hero: Agent Prompt ───────────────────────────────────────────── */}
      <div style={{
        paddingTop: "clamp(56px, 8vw, 96px)",
        paddingBottom: "clamp(36px, 5vw, 56px)",
        paddingLeft: 32,
        paddingRight: 32,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        position: "relative",
      }}>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.42, ease: EASE_OUT }}
          style={{ width: "100%", maxWidth: 760, textAlign: "center", position: "relative", zIndex: 1 }}
        >
          {/* Username label */}
          <p style={{
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: "0.08em",
            color: "rgba(255,255,255,0.32)",
            textTransform: "uppercase",
            fontFamily: "var(--font-outfit)",
            marginBottom: 14,
          }}>
            {email.split("@")[0]}
          </p>

          {/* Headline */}
          <h1 style={{
            fontSize: "clamp(38px, 5.6vw, 68px)",
            fontWeight: 600,
            fontFamily: "var(--font-space-grotesk)",
            color: "#fff",
            letterSpacing: "-0.035em",
            lineHeight: 1.05,
            marginBottom: 16,
          }}>
            Your outreach, on autopilot.
          </h1>

          {/* Subheadline */}
          <p style={{
            fontSize: 15,
            color: "rgba(255,255,255,0.5)",
            fontFamily: "var(--font-outfit)",
            marginBottom: 26,
            maxWidth: 540, marginInline: "auto",
            lineHeight: 1.6,
          }}>
            Describe what you need. Nexora researches, writes, sends, and follows up.
          </p>

          {/* Company profile badge */}
          <div style={{ marginBottom: 24 }}>
            {hasCompanyProfile ? (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#4ade80", flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: "#4ade80", fontFamily: "var(--font-outfit)", fontWeight: 500 }}>
                  Company profile active
                </span>
              </div>
            ) : (
              <Link href="/dashboard/settings" style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                fontSize: 11, color: "rgba(255,82,0,0.75)", fontFamily: "var(--font-outfit)",
                textDecoration: "none",
              }}>
                Set up your company profile →
              </Link>
            )}
          </div>

          {/* ─── Pill prompt input with gradient border ─────────────────── */}
          <div style={{
            position: "relative",
            padding: 1.5,
            borderRadius: 999,
            background: focused
              ? "linear-gradient(135deg, #FF5200 0%, #F59E0B 100%)"
              : "linear-gradient(135deg, rgba(255,82,0,0.35) 0%, rgba(245,158,11,0.35) 100%)",
            boxShadow: focused
              ? "0 0 0 4px rgba(255,82,0,0.08), 0 18px 60px -20px rgba(255,82,0,0.32)"
              : "0 10px 40px -18px rgba(0,0,0,0.6)",
            transition: "box-shadow 240ms ease, background 240ms ease",
          }}>
            <div style={{
              position: "relative",
              backgroundColor: "#0E0E18",
              borderRadius: 999,
              display: "flex",
              alignItems: "center",
              minHeight: 64,
              paddingLeft: 26,
              paddingRight: 8,
            }}>
              {/* Animated placeholder */}
              {showPlaceholder && (
                <div style={{
                  position: "absolute",
                  top: 0, bottom: 0, left: 26, right: 80,
                  display: "flex", alignItems: "center",
                  pointerEvents: "none", userSelect: "none",
                  zIndex: 1, overflow: "hidden",
                }}>
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={promptIdx}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: focused ? 0.2 : 0.38 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={{ duration: 0.4, ease: EASE_OUT }}
                      style={{
                        display: "block",
                        color: "rgba(255,255,255,0.55)",
                        fontFamily: "var(--font-outfit)",
                        fontSize: 14,
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
                  padding: "22px 0",
                  backgroundColor: "transparent",
                  border: "none",
                  outline: "none",
                  color: "#fff",
                  fontFamily: "var(--font-outfit)",
                  fontSize: 14.5,
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
                  height: 48,
                  paddingLeft: 20,
                  paddingRight: 22,
                  borderRadius: 999,
                  backgroundColor: prompt.trim() && !loading ? "#FF5200" : "rgba(255,255,255,0.06)",
                  border: "none",
                  cursor: prompt.trim() && !loading ? "pointer" : "default",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  color: prompt.trim() ? "#fff" : "rgba(255,255,255,0.3)",
                  fontSize: 13,
                  fontWeight: 600,
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

          {/* Suggestion chips */}
          <AnimatePresence>
            {!loading && !result && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginTop: 20 }}
              >
                {CHIPS.map((c) => (
                  <button
                    key={c.label}
                    onClick={() => submit(c.label)}
                    onMouseEnter={() => setHoveredChip(c.label)}
                    onMouseLeave={() => setHoveredChip(null)}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      padding: "7px 14px",
                      backgroundColor: hoveredChip === c.label ? "rgba(255,255,255,0.04)" : "transparent",
                      border: `1px solid ${hoveredChip === c.label ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.08)"}`,
                      borderRadius: 999,
                      color: hoveredChip === c.label ? "#fff" : "rgba(255,255,255,0.55)",
                      fontSize: 12.5,
                      fontFamily: "var(--font-outfit)",
                      cursor: "pointer",
                      transform: hoveredChip === c.label ? "translateY(-2px)" : "translateY(0)",
                      transition: "transform 150ms ease-out, border-color 150ms ease, color 150ms ease, background-color 150ms ease",
                    }}
                  >
                    {c.icon}
                    {c.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* ─── Templates (Lovable-style) ─────────────────────────────────── */}
      {!hasOutput && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15, ease: EASE_OUT }}
          style={{ paddingLeft: 32, paddingRight: 32, marginTop: 12 }}
        >
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 14 }}>
              <p style={{
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: "0.08em",
                color: "rgba(255,255,255,0.35)",
                textTransform: "uppercase",
                fontFamily: "var(--font-outfit)",
              }}>
                Try these campaigns
              </p>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", fontFamily: "var(--font-outfit)" }}>
                Click to use as a starting point
              </span>
            </div>

            <div style={{
              display: "flex",
              gap: 14,
              overflowX: "auto",
              paddingBottom: 8,
              scrollbarWidth: "thin",
              scrollbarColor: "rgba(255,255,255,0.1) transparent",
            }}>
              {TEMPLATES.map((t, i) => {
                const isHover = hoveredCard === t.id;
                return (
                  <motion.button
                    key={t.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 + i * 0.04, ease: EASE_OUT }}
                    onClick={() => useTemplate(t)}
                    onMouseEnter={() => setHoveredCard(t.id)}
                    onMouseLeave={() => setHoveredCard(null)}
                    style={{
                      flexShrink: 0,
                      width: 260,
                      textAlign: "left",
                      padding: "18px 20px",
                      backgroundColor: isHover ? "#14141E" : "#0E0E18",
                      border: `1px solid ${isHover ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.08)"}`,
                      borderRadius: 16,
                      cursor: "pointer",
                      transform: isHover ? "translateY(-3px)" : "translateY(0)",
                      transition: "transform 220ms cubic-bezier(0.23,1,0.32,1), border-color 200ms ease, background-color 200ms ease",
                      fontFamily: "var(--font-outfit)",
                      position: "relative",
                    }}
                  >
                    <div style={{
                      width: 34, height: 34,
                      borderRadius: 10,
                      backgroundColor: `${t.accent}14`,
                      border: `1px solid ${t.accent}30`,
                      color: t.accent,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      marginBottom: 14,
                    }}>
                      {t.icon}
                    </div>
                    <p style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "#fff",
                      fontFamily: "var(--font-space-grotesk)",
                      marginBottom: 5,
                      letterSpacing: "-0.01em",
                    }}>
                      {t.title}
                    </p>
                    <p style={{
                      fontSize: 12.5,
                      color: "rgba(255,255,255,0.45)",
                      lineHeight: 1.5,
                    }}>
                      {t.subtitle}
                    </p>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}

      {/* ─── Activity Feed + Results ──────────────────────────────────── */}
      <div style={{ flex: 1, maxWidth: 820, width: "100%", margin: "0 auto", padding: "32px 32px 0" }}>

        {/* Activity steps with colored left borders */}
        <AnimatePresence>
          {steps.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: EASE_OUT }}
              style={{ marginBottom: 32 }}
            >
              <p style={{
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: "0.08em",
                color: "rgba(255,255,255,0.3)",
                textTransform: "uppercase",
                fontFamily: "var(--font-outfit)",
                marginBottom: 14,
              }}>
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
                      transition={{ duration: 0.28, ease: EASE_OUT, delay: i * 0.05 }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "10px 14px 10px 16px",
                        backgroundColor: "rgba(14,14,24,0.6)",
                        borderLeft: `3px solid ${color}`,
                        borderTop: "1px solid rgba(255,255,255,0.04)",
                        borderRight: "1px solid rgba(255,255,255,0.04)",
                        borderBottom: "1px solid rgba(255,255,255,0.04)",
                        borderRadius: "3px 12px 12px 3px",
                      }}
                    >
                      <div style={{
                        color,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}>
                        {step.done ? <Check size={12} /> : (ICON_MAP[step.icon] ?? <Zap size={12} />)}
                      </div>
                      <span style={{
                        fontSize: 13,
                        fontFamily: "var(--font-outfit)",
                        color: step.done ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.85)",
                      }}>
                        {step.message}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{
                padding: "14px 18px",
                backgroundColor: "rgba(248,113,113,0.06)",
                border: "1px solid rgba(248,113,113,0.18)",
                borderRadius: 12,
                color: "#f87171",
                fontSize: 13,
                fontFamily: "var(--font-outfit)",
                marginBottom: 24,
              }}
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results panel */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.32, ease: EASE_OUT }}
            >
              <div style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 16,
                marginBottom: 18,
              }}>
                <div>
                  <p style={{
                    fontSize: 11,
                    fontWeight: 500,
                    letterSpacing: "0.08em",
                    color: "rgba(255,255,255,0.3)",
                    textTransform: "uppercase",
                    fontFamily: "var(--font-outfit)",
                    marginBottom: 6,
                  }}>
                    Results
                  </p>
                  <p style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", fontFamily: "var(--font-outfit)" }}>
                    {result.summary}
                  </p>
                </div>
                {result.action && (
                  <Link href={result.action.href} style={{
                    padding: "8px 16px",
                    backgroundColor: "#FF5200",
                    color: "#fff",
                    borderRadius: 999,
                    fontSize: 12.5,
                    fontWeight: 600,
                    fontFamily: "var(--font-outfit)",
                    textDecoration: "none",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}>
                    {result.action.label}
                  </Link>
                )}
              </div>

              {/* Card grid */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                gap: 12,
              }}>
                {result.items.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, ease: EASE_OUT, delay: i * 0.04 }}
                    style={{
                      backgroundColor: "#0E0E18",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 14,
                      padding: "16px 18px",
                    }}
                  >
                    <div style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: 8,
                      marginBottom: 6,
                    }}>
                      <p style={{
                        fontSize: 13.5,
                        fontWeight: 600,
                        color: "#fff",
                        fontFamily: "var(--font-space-grotesk)",
                        lineHeight: 1.3,
                        letterSpacing: "-0.005em",
                      }}>
                        {item.title}
                      </p>
                      {item.status && (
                        <div style={{
                          width: 6, height: 6, borderRadius: "50%",
                          backgroundColor: STATUS_COLOR[item.status] ?? "#555",
                          flexShrink: 0,
                          marginTop: 6,
                        }} />
                      )}
                    </div>
                    <p style={{
                      fontSize: 12.5,
                      color: "rgba(255,255,255,0.5)",
                      fontFamily: "var(--font-outfit)",
                      lineHeight: 1.5,
                      marginBottom: item.meta ? 6 : 0,
                    }}>
                      {item.subtitle}
                    </p>
                    {item.meta && (
                      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "var(--font-outfit)" }}>
                        {item.meta}
                      </p>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style>{`
        .nexora-spin { animation: nexora-spin 1s linear infinite; }
        @keyframes nexora-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
