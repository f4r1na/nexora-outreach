"use client";

import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  ArrowUp, Loader2, CheckCircle, Zap, Brain, Database,
  Mail, Inbox, BarChart2, Repeat, Search, Check,
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

// ─── Icon map ─────────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, React.ReactNode> = {
  brain:       <Brain size={11} />,
  zap:         <Zap size={11} />,
  database:    <Database size={11} />,
  mail:        <Mail size={11} />,
  inbox:       <Inbox size={11} />,
  "bar-chart": <BarChart2 size={11} />,
  repeat:      <Repeat size={11} />,
  search:      <Search size={11} />,
  check:       <Check size={11} />,
};

// ─── Status dot color ─────────────────────────────────────────────────────────

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

// ─── Component ────────────────────────────────────────────────────────────────

export default function AgentInterface({
  email,
  hasCompanyProfile,
}: {
  email: string;
  hasCompanyProfile: boolean;
}) {
  const [prompt, setPrompt]         = useState("");
  const [focused, setFocused]       = useState(false);
  const [loading, setLoading]       = useState(false);
  const [steps, setSteps]           = useState<AgentStep[]>([]);
  const [result, setResult]         = useState<AgentResult | null>(null);
  const [error, setError]           = useState<string | null>(null);
  const [promptIdx, setPromptIdx]   = useState(0);
  const [hoveredChip, setHoveredChip] = useState<string | null>(null);
  const textareaRef                 = useRef<HTMLTextAreaElement>(null);

  // Cycle example prompts every 3.5s, stop when focused or has input
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
            // ignore malformed lines
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

  const hasOutput = steps.length > 0 || result !== null || error !== null;
  const showPlaceholder = !prompt && !loading;

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "calc(100vh - 60px)", paddingBottom: 80 }}>

      {/* ─── Hero: Agent Prompt ───────────────────────────────────────────── */}
      <div style={{
        minHeight: "40vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 32px 36px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        position: "relative",
        overflow: "hidden",
        // Dot grid background
        backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.032) 1px, transparent 1px)",
        backgroundSize: "28px 28px",
      }}>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38, ease: EASE_OUT }}
          style={{ width: "100%", maxWidth: 680, textAlign: "center", position: "relative", zIndex: 1 }}
        >
          {/* Username label */}
          <p style={{
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: "0.08em",
            color: "#444",
            textTransform: "uppercase",
            fontFamily: "var(--font-outfit)",
            marginBottom: 14,
          }}>
            {email.split("@")[0]}
          </p>

          {/* Headline */}
          <h1 style={{
            fontSize: "clamp(36px, 5vw, 64px)",
            fontWeight: 600,
            fontFamily: "var(--font-syne)",
            color: "#fff",
            letterSpacing: "-0.04em",
            lineHeight: 1.1,
            marginBottom: 24,
          }}>
            What can I help you with?
          </h1>

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
                fontSize: 11, color: "rgba(255,82,0,0.65)", fontFamily: "var(--font-outfit)",
                textDecoration: "none",
              }}>
                Set up your company profile
              </Link>
            )}
          </div>

          {/* Prompt input */}
          <div style={{
            position: "relative",
            backgroundColor: "#0e0e0e",
            border: `1px solid ${focused ? "rgba(255,82,0,0.35)" : "rgba(255,255,255,0.08)"}`,
            borderRadius: 10,
            transition: "border-color 200ms ease, box-shadow 200ms ease",
            boxShadow: focused
              ? "0 0 0 1px rgba(255,82,0,0.12), 0 0 32px rgba(255,82,0,0.07)"
              : "none",
          }}>
            {/* Animated placeholder */}
            {showPlaceholder && (
              <div style={{
                position: "absolute",
                top: 16, left: 18, right: 56,
                pointerEvents: "none",
                userSelect: "none",
                zIndex: 1,
              }}>
                <AnimatePresence mode="wait">
                  <motion.span
                    key={promptIdx}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: focused ? 0.18 : 0.32 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.38, ease: EASE_OUT }}
                    style={{
                      display: "block",
                      color: "#888",
                      fontFamily: "var(--font-outfit)",
                      fontSize: 14,
                      lineHeight: 1.6,
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
              rows={3}
              style={{
                width: "100%",
                padding: "16px 56px 16px 18px",
                backgroundColor: "transparent",
                border: "none",
                outline: "none",
                color: "#ccc",
                fontFamily: "var(--font-outfit)",
                fontSize: 14,
                lineHeight: 1.6,
                resize: "none",
                boxSizing: "border-box",
                position: "relative",
                zIndex: 2,
              }}
            />

            <button
              onClick={() => submit()}
              disabled={!prompt.trim() || loading}
              style={{
                position: "absolute",
                right: 12,
                bottom: 12,
                zIndex: 3,
                width: 32,
                height: 32,
                borderRadius: 7,
                backgroundColor: prompt.trim() && !loading ? "#FF5200" : "rgba(255,255,255,0.06)",
                border: "none",
                cursor: prompt.trim() && !loading ? "pointer" : "default",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background-color 150ms ease, transform 100ms ease-out",
              }}
              onMouseDown={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.97)"; }}
              onMouseUp={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; }}
            >
              {loading
                ? <Loader2 size={14} color="#555" className="nexora-spin" />
                : <ArrowUp size={14} color={prompt.trim() ? "#fff" : "#333"} />
              }
            </button>
          </div>

          {/* Suggestion chips */}
          <AnimatePresence>
            {!loading && !result && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginTop: 16 }}
              >
                {["Show my campaigns", "Check inbox", "View analytics", "List follow-ups"].map((s) => (
                  <button
                    key={s}
                    onClick={() => submit(s)}
                    onMouseEnter={() => setHoveredChip(s)}
                    onMouseLeave={() => setHoveredChip(null)}
                    style={{
                      padding: "5px 12px",
                      backgroundColor: "transparent",
                      border: `1px solid ${hoveredChip === s ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.08)"}`,
                      borderRadius: 6,
                      color: hoveredChip === s ? "#888" : "#555",
                      fontSize: 12,
                      fontFamily: "var(--font-outfit)",
                      cursor: "pointer",
                      transform: hoveredChip === s ? "translateY(-2px)" : "translateY(0)",
                      transition: "transform 150ms ease-out, border-color 150ms ease, color 150ms ease",
                    }}
                  >
                    {s}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* ─── Activity Feed + Results ──────────────────────────────────────── */}
      <div style={{ flex: 1, maxWidth: 760, width: "100%", margin: "0 auto", padding: "32px 32px 0" }}>

        {/* Activity steps */}
        <AnimatePresence>
          {steps.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: EASE_OUT }}
              style={{ marginBottom: 28 }}
            >
              <p style={{
                fontSize: 10,
                fontWeight: 500,
                letterSpacing: "0.06em",
                color: "#333",
                textTransform: "uppercase",
                fontFamily: "var(--font-outfit)",
                marginBottom: 12,
              }}>
                Activity
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {steps.map((step, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, ease: EASE_OUT, delay: i * 0.04 }}
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <div style={{
                      width: 22, height: 22, borderRadius: 4,
                      backgroundColor: step.done ? "rgba(74,222,128,0.06)" : "rgba(255,255,255,0.04)",
                      border: `1px solid ${step.done ? "rgba(74,222,128,0.18)" : "rgba(255,255,255,0.06)"}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: step.done ? "#4ade80" : "#444",
                      flexShrink: 0,
                      transition: "all 200ms ease",
                    }}>
                      {step.done ? <CheckCircle size={11} /> : (ICON_MAP[step.icon] ?? <Zap size={11} />)}
                    </div>
                    <span style={{
                      fontSize: 12,
                      fontFamily: "var(--font-outfit)",
                      color: step.done ? "#444" : "#888",
                    }}>
                      {step.message}
                    </span>
                  </motion.div>
                ))}
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
                padding: "12px 16px",
                backgroundColor: "rgba(248,113,113,0.06)",
                border: "1px solid rgba(248,113,113,0.18)",
                borderRadius: 8,
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
              transition={{ duration: 0.3, ease: EASE_OUT }}
            >
              <div style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 16,
                marginBottom: 16,
              }}>
                <div>
                  <p style={{
                    fontSize: 10,
                    fontWeight: 500,
                    letterSpacing: "0.06em",
                    color: "#333",
                    textTransform: "uppercase",
                    fontFamily: "var(--font-outfit)",
                    marginBottom: 4,
                  }}>
                    Results
                  </p>
                  <p style={{ fontSize: 13, color: "#888", fontFamily: "var(--font-outfit)" }}>
                    {result.summary}
                  </p>
                </div>
                {result.action && (
                  <Link href={result.action.href} style={{
                    padding: "6px 14px",
                    backgroundColor: "#FF5200",
                    color: "#fff",
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 500,
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
                gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                gap: 12,
              }}>
                {result.items.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, ease: EASE_OUT, delay: i * 0.04 }}
                    style={{
                      backgroundColor: "#0e0e0e",
                      border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: 8,
                      padding: "14px 16px",
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
                        fontSize: 13,
                        fontWeight: 500,
                        color: "#ccc",
                        fontFamily: "var(--font-outfit)",
                        lineHeight: 1.3,
                      }}>
                        {item.title}
                      </p>
                      {item.status && (
                        <div style={{
                          width: 6, height: 6, borderRadius: "50%",
                          backgroundColor: STATUS_COLOR[item.status] ?? "#555",
                          flexShrink: 0,
                          marginTop: 4,
                        }} />
                      )}
                    </div>
                    <p style={{
                      fontSize: 12,
                      color: "#555",
                      fontFamily: "var(--font-outfit)",
                      lineHeight: 1.4,
                      marginBottom: item.meta ? 6 : 0,
                    }}>
                      {item.subtitle}
                    </p>
                    {item.meta && (
                      <p style={{ fontSize: 11, color: "#333", fontFamily: "var(--font-outfit)" }}>
                        {item.meta}
                      </p>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state */}
        {!hasOutput && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            style={{
              textAlign: "center",
              paddingTop: 48,
              fontSize: 13,
              color: "#2a2a2a",
              fontFamily: "var(--font-outfit)",
            }}
          >
            Type a prompt above to get started.
          </motion.p>
        )}
      </div>

      <style>{`
        .nexora-spin { animation: nexora-spin 1s linear infinite; }
        @keyframes nexora-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
