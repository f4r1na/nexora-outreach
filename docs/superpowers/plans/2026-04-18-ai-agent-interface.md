# AI Agent Interface Rebuild — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild Nexora Outreach dashboard into a single-page AI agent interface with a top navbar, agent prompt hero, SSE-streaming activity feed, and results panel.

**Architecture:** Remove the sidebar entirely; replace with a 60px sticky top navbar. The dashboard home (`app/dashboard/page.tsx`) becomes a full-screen agent interface. A new SSE route (`app/api/agent/route.ts`) parses NLP prompts with Claude, streams step-by-step activity, and returns structured results. All existing API routes stay intact.

**Tech Stack:** Next.js 16.2.2 App Router, Framer Motion v12, @anthropic-ai/sdk, Supabase SSR, inline `style={{}}` (no Tailwind in dashboard), Syne + Outfit fonts, Lucide icons.

---

### Task 1: New Dashboard Layout — Replace Sidebar with Navbar

**Files:**
- Modify: `app/dashboard/layout.tsx`
- Create: `app/dashboard/_components/navbar.tsx`

- [ ] **Step 1: Create navbar component**

```tsx
// app/dashboard/_components/navbar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { logout } from "@/app/actions/auth";
import { Settings, LogOut, Sparkles } from "lucide-react";

interface NavbarProps {
  email: string;
  plan: string;
}

const NAV = [
  { label: "Agent",      href: "/dashboard",           exact: true },
  { label: "Campaigns",  href: "/dashboard/campaigns"              },
  { label: "Inbox",      href: "/dashboard/inbox"                  },
] as const;

const EASE = [0.23, 1, 0.32, 1] as const;

export default function Navbar({ email, plan }: NavbarProps) {
  const pathname = usePathname();

  return (
    <motion.nav
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: EASE }}
      style={{
        position: "fixed",
        top: 0, left: 0, right: 0,
        height: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 28px",
        backgroundColor: "rgba(6,6,6,0.9)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        zIndex: 50,
      }}
    >
      {/* Logo */}
      <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none" }}>
        <div style={{
          width: 28, height: 28,
          backgroundColor: "#FF5200",
          borderRadius: 6,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M2 12V2h2.5l5.5 7V2H12v10h-2.5L4 5v7H2z" fill="white" />
          </svg>
        </div>
        <span style={{ fontSize: 14, fontWeight: 500, color: "#fff", fontFamily: "var(--font-syne)", letterSpacing: "-0.02em" }}>
          Nexora
        </span>
      </Link>

      {/* Nav links */}
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        {NAV.map(({ label, href, ...rest }) => {
          const exact = (rest as { exact?: boolean }).exact;
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              style={{
                position: "relative",
                padding: "5px 12px",
                borderRadius: 6,
                fontSize: 13,
                fontFamily: "var(--font-outfit)",
                fontWeight: active ? 500 : 400,
                color: active ? "#fff" : "#555",
                textDecoration: "none",
                transition: "color 150ms ease",
              }}
            >
              {active && (
                <motion.span
                  layoutId="nav-pill"
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: 6,
                    backgroundColor: "rgba(255,255,255,0.06)",
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span style={{ position: "relative", zIndex: 1 }}>{label}</span>
            </Link>
          );
        })}
      </div>

      {/* Right side */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {plan !== "free" && (
          <div style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "3px 8px",
            backgroundColor: "rgba(255,82,0,0.08)",
            border: "1px solid rgba(255,82,0,0.2)",
            borderRadius: 4,
          }}>
            <Sparkles size={10} color="#FF5200" />
            <span style={{ fontSize: 10, fontWeight: 500, color: "#FF5200", fontFamily: "var(--font-outfit)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {plan}
            </span>
          </div>
        )}
        <Link href="/dashboard/settings" style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          width: 32, height: 32, borderRadius: 6,
          color: "#555",
          textDecoration: "none",
          transition: "color 150ms ease",
        }}>
          <Settings size={15} />
        </Link>
        <form action={logout}>
          <button type="submit" style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: 32, height: 32, borderRadius: 6,
            background: "none", border: "none", cursor: "pointer",
            color: "#555",
          }}>
            <LogOut size={14} />
          </button>
        </form>
      </div>
    </motion.nav>
  );
}
```

- [ ] **Step 2: Update dashboard layout**

```tsx
// app/dashboard/layout.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "./_components/navbar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("plan")
    .eq("user_id", user.id)
    .single();

  const plan = sub?.plan ?? "free";

  return (
    <div style={{ backgroundColor: "#060606", minHeight: "100vh" }}>
      <Navbar email={user.email!} plan={plan} />
      <div style={{ paddingTop: 60 }}>
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify layout renders without errors**

Run: `npm run dev` — navigate to `/dashboard` and confirm navbar appears, no console errors.

- [ ] **Step 4: Commit**

```bash
git add app/dashboard/layout.tsx app/dashboard/_components/navbar.tsx
git commit -m "feat: replace sidebar with top navbar in dashboard layout"
```

---

### Task 2: Agent SSE API Route

**Files:**
- Create: `app/api/agent/route.ts`

The agent route receives a prompt, authenticates the user, uses Claude to detect intent, queries Supabase for context, then streams SSE events (steps + final result).

- [ ] **Step 1: Create the agent route**

```ts
// app/api/agent/route.ts
import { createClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

type SSEEvent =
  | { type: "step"; message: string; icon: string }
  | { type: "result"; data: AgentResult }
  | { type: "error"; message: string }
  | { type: "done" };

type AgentResult = {
  intent: string;
  summary: string;
  items: ResultItem[];
  action?: { label: string; href: string };
};

type ResultItem = {
  id: string;
  title: string;
  subtitle: string;
  meta?: string;
  status?: string;
};

function encode(event: SSEEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { prompt } = (await req.json()) as { prompt: string };
  if (!prompt?.trim()) return new Response("Bad Request", { status: 400 });

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: SSEEvent) => controller.enqueue(encode(event));

      try {
        send({ type: "step", message: "Parsing your request...", icon: "brain" });

        // Classify intent with Claude
        const intentResp = await anthropic.messages.create({
          model: "claude-opus-4-7",
          max_tokens: 256,
          system: `You are an intent classifier for an AI cold email outreach tool called Nexora.
Classify the user's request into exactly one of these intents:
- campaigns: view/manage campaigns
- analytics: view analytics or metrics
- inbox: check inbox or replies
- followups: manage follow-up sequences
- signals: lead research or signals
- draft: draft a new campaign or emails
- unknown: anything else

Respond with ONLY the intent word, nothing else.`,
          messages: [{ role: "user", content: prompt }],
        });

        const intent = (intentResp.content[0] as { type: string; text: string }).text.trim().toLowerCase();

        send({ type: "step", message: "Intent detected: " + intent, icon: "zap" });
        send({ type: "step", message: "Fetching your data...", icon: "database" });

        let result: AgentResult;

        if (intent === "campaigns" || intent === "draft") {
          const { data: campaigns } = await supabase
            .from("campaigns")
            .select("id, name, status, lead_count, created_at")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(6);

          send({ type: "step", message: `Found ${campaigns?.length ?? 0} campaigns`, icon: "mail" });

          result = {
            intent,
            summary: intent === "draft"
              ? "Ready to create a new campaign. Here are your existing ones:"
              : "Here are your campaigns:",
            items: (campaigns ?? []).map((c) => ({
              id: c.id,
              title: c.name,
              subtitle: `${c.lead_count ?? 0} leads`,
              meta: new Date(c.created_at).toLocaleDateString(),
              status: c.status,
            })),
            action: intent === "draft"
              ? { label: "New Campaign", href: "/dashboard/campaigns/new" }
              : { label: "View all", href: "/dashboard/campaigns" },
          };
        } else if (intent === "inbox") {
          const { data: replies } = await supabase
            .from("replies")
            .select("id, lead_name, lead_email, subject, status, received_at")
            .eq("user_id", user.id)
            .order("received_at", { ascending: false })
            .limit(6);

          send({ type: "step", message: `Found ${replies?.length ?? 0} replies in inbox`, icon: "inbox" });

          result = {
            intent,
            summary: "Here are your recent inbox replies:",
            items: (replies ?? []).map((r) => ({
              id: r.id,
              title: r.lead_name ?? r.lead_email,
              subtitle: r.subject ?? "No subject",
              meta: r.received_at ? new Date(r.received_at).toLocaleDateString() : "",
              status: r.status,
            })),
            action: { label: "Open inbox", href: "/dashboard/inbox" },
          };
        } else if (intent === "analytics") {
          const { data: campaigns } = await supabase
            .from("campaigns")
            .select("id, name, lead_count, emails_sent, opens, clicks")
            .eq("user_id", user.id)
            .order("emails_sent", { ascending: false })
            .limit(6);

          send({ type: "step", message: "Calculating performance metrics...", icon: "bar-chart" });

          result = {
            intent,
            summary: "Here is your campaign performance:",
            items: (campaigns ?? []).map((c) => ({
              id: c.id,
              title: c.name,
              subtitle: `${c.emails_sent ?? 0} sent · ${c.opens ?? 0} opens · ${c.clicks ?? 0} clicks`,
              meta: c.lead_count ? `${Math.round(((c.opens ?? 0) / Math.max(c.emails_sent ?? 1, 1)) * 100)}% open rate` : "",
            })),
            action: { label: "Full analytics", href: "/dashboard/analytics" },
          };
        } else if (intent === "followups") {
          const { data: followups } = await supabase
            .from("followup_sequences")
            .select("id, lead_name, lead_email, status, next_send_at")
            .eq("user_id", user.id)
            .order("next_send_at", { ascending: true })
            .limit(6);

          send({ type: "step", message: `Found ${followups?.length ?? 0} active follow-up sequences`, icon: "repeat" });

          result = {
            intent,
            summary: "Here are your follow-up sequences:",
            items: (followups ?? []).map((f) => ({
              id: f.id,
              title: f.lead_name ?? f.lead_email,
              subtitle: f.status,
              meta: f.next_send_at ? `Next: ${new Date(f.next_send_at).toLocaleDateString()}` : "",
              status: f.status,
            })),
            action: { label: "Manage follow-ups", href: "/dashboard/followups" },
          };
        } else if (intent === "signals") {
          const { data: signals } = await supabase
            .from("signals")
            .select("id, company, signal_type, summary, created_at")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(6);

          send({ type: "step", message: `Found ${signals?.length ?? 0} lead research signals`, icon: "search" });

          result = {
            intent,
            summary: "Here are your lead research signals:",
            items: (signals ?? []).map((s) => ({
              id: s.id,
              title: s.company,
              subtitle: s.summary ?? s.signal_type,
              meta: new Date(s.created_at).toLocaleDateString(),
            })),
            action: { label: "View signals", href: "/dashboard/signals" },
          };
        } else {
          // unknown intent — general help
          result = {
            intent: "unknown",
            summary: "I can help you with campaigns, inbox, analytics, follow-ups, and lead research. Try asking:",
            items: [
              { id: "1", title: "Show me my campaigns", subtitle: "View and manage your campaigns" },
              { id: "2", title: "Check my inbox", subtitle: "See recent replies" },
              { id: "3", title: "Show analytics", subtitle: "View campaign performance" },
              { id: "4", title: "Manage follow-ups", subtitle: "See scheduled follow-ups" },
            ],
          };
        }

        send({ type: "step", message: "Done", icon: "check" });
        send({ type: "result", data: result });
        send({ type: "done" });
      } catch (err) {
        send({ type: "error", message: err instanceof Error ? err.message : "Something went wrong" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/agent/route.ts
git commit -m "feat: add agent SSE route with Claude intent detection"
```

---

### Task 3: New Dashboard Home — Agent Interface

**Files:**
- Modify: `app/dashboard/page.tsx`
- Create: `app/dashboard/_components/agent-interface.tsx`

- [ ] **Step 1: Create agent interface client component**

```tsx
// app/dashboard/_components/agent-interface.tsx
"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowUp, Loader2, CheckCircle, Zap, Brain, Database, Mail, Inbox, BarChart2, Repeat, Search, Check } from "lucide-react";

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = { message: string; icon: string; done: boolean };

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
  brain: <Brain size={13} />,
  zap: <Zap size={13} />,
  database: <Database size={13} />,
  mail: <Mail size={13} />,
  inbox: <Inbox size={13} />,
  "bar-chart": <BarChart2 size={13} />,
  repeat: <Repeat size={13} />,
  search: <Search size={13} />,
  check: <Check size={13} />,
};

// ─── Status color helper ──────────────────────────────────────────────────────

const STATUS_COLOR: Record<string, string> = {
  sent: "#4ade80",
  pending: "#facc15",
  draft: "#555",
  draft_ready: "#60a5fa",
  ready: "#4ade80",
  active: "#4ade80",
  paused: "#555",
  cancelled: "#f87171",
};

// ─── Suggested prompts ────────────────────────────────────────────────────────

const SUGGESTIONS = [
  "Show me my campaigns",
  "Check my inbox",
  "View analytics",
  "List follow-ups due today",
];

// ─── Main component ───────────────────────────────────────────────────────────

export default function AgentInterface({ email }: { email: string }) {
  const [prompt, setPrompt] = useState("");
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);
  const [result, setResult] = useState<AgentResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });

        const lines = buf.split("\n\n");
        buf = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6);
          try {
            const event = JSON.parse(raw);
            if (event.type === "step") {
              setSteps((prev) => [...prev, { message: event.message, icon: event.icon, done: false }]);
            } else if (event.type === "result") {
              setSteps((prev) => prev.map((s) => ({ ...s, done: true })));
              setResult(event.data);
            } else if (event.type === "error") {
              setError(event.message);
            }
          } catch {
            // ignore parse errors
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

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "calc(100vh - 60px)", padding: "0 0 80px" }}>

      {/* ─── Hero: Agent Prompt (40% vh) ──────────────────────────────────── */}
      <div style={{
        minHeight: "40vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 32px 32px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38, ease: EASE_OUT }}
          style={{ width: "100%", maxWidth: 680, textAlign: "center" }}
        >
          {/* Greeting */}
          <p style={{
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: "0.08em",
            color: "#444",
            textTransform: "uppercase",
            fontFamily: "var(--font-outfit)",
            marginBottom: 16,
          }}>
            {email.split("@")[0]}
          </p>
          <h1 style={{
            fontSize: "clamp(22px, 3vw, 32px)",
            fontWeight: 500,
            fontFamily: "var(--font-syne)",
            color: "#fff",
            letterSpacing: "-0.03em",
            lineHeight: 1.2,
            marginBottom: 32,
          }}>
            What can I help you with?
          </h1>

          {/* Prompt input */}
          <div style={{
            position: "relative",
            backgroundColor: "#0e0e0e",
            border: `1px solid ${focused ? "rgba(255,82,0,0.4)" : "rgba(255,255,255,0.08)"}`,
            borderRadius: 10,
            transition: "border-color 200ms ease",
          }}>
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onKeyDown={handleKey}
              placeholder="e.g. Show me my campaigns, Check my inbox, Draft a campaign for SaaS founders..."
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
              }}
            />
            <button
              onClick={() => submit()}
              disabled={!prompt.trim() || loading}
              style={{
                position: "absolute",
                right: 12,
                bottom: 12,
                width: 32,
                height: 32,
                borderRadius: 7,
                backgroundColor: prompt.trim() && !loading ? "#FF5200" : "rgba(255,255,255,0.06)",
                border: "none",
                cursor: prompt.trim() && !loading ? "pointer" : "default",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background-color 150ms ease",
              }}
            >
              {loading
                ? <Loader2 size={14} color="#555" style={{ animation: "spin 1s linear infinite" }} />
                : <ArrowUp size={14} color={prompt.trim() ? "#fff" : "#333"} />
              }
            </button>
          </div>

          {/* Suggestions */}
          <AnimatePresence>
            {!loading && !result && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginTop: 16 }}
              >
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => submit(s)}
                    style={{
                      padding: "5px 12px",
                      backgroundColor: "transparent",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 6,
                      color: "#555",
                      fontSize: 12,
                      fontFamily: "var(--font-outfit)",
                      cursor: "pointer",
                      transition: "color 150ms ease, border-color 150ms ease",
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

        {/* Steps */}
        <AnimatePresence>
          {steps.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: EASE_OUT }}
              style={{ marginBottom: 28 }}
            >
              <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.06em", color: "#333", textTransform: "uppercase", fontFamily: "var(--font-outfit)", marginBottom: 12 }}>
                Activity
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {steps.map((step, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.22, ease: EASE_OUT, delay: i * 0.05 }}
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <div style={{
                      width: 22, height: 22, borderRadius: 4,
                      backgroundColor: step.done ? "rgba(74,222,128,0.08)" : "rgba(255,255,255,0.04)",
                      border: `1px solid ${step.done ? "rgba(74,222,128,0.2)" : "rgba(255,255,255,0.06)"}`,
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
                      color: step.done ? "#555" : "#888",
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
                border: "1px solid rgba(248,113,113,0.2)",
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
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div>
                  <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.06em", color: "#333", textTransform: "uppercase", fontFamily: "var(--font-outfit)", marginBottom: 4 }}>
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
                    marginLeft: 16,
                  }}>
                    {result.action.label}
                  </Link>
                )}
              </div>

              {/* Card grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
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
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
                      <p style={{ fontSize: 13, fontWeight: 500, color: "#ccc", fontFamily: "var(--font-outfit)", lineHeight: 1.3 }}>
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
                    <p style={{ fontSize: 12, color: "#555", fontFamily: "var(--font-outfit)", lineHeight: 1.4, marginBottom: item.meta ? 6 : 0 }}>
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
        {!loading && !result && steps.length === 0 && !error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            style={{ textAlign: "center", paddingTop: 48 }}
          >
            <p style={{ fontSize: 13, color: "#333", fontFamily: "var(--font-outfit)" }}>
              Type a prompt above to get started.
            </p>
          </motion.div>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
```

- [ ] **Step 2: Update dashboard home page**

```tsx
// app/dashboard/page.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AgentInterface from "./_components/agent-interface";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return <AgentInterface email={user.email!} />;
}
```

- [ ] **Step 3: Commit**

```bash
git add app/dashboard/page.tsx app/dashboard/_components/agent-interface.tsx
git commit -m "feat: build agent interface with prompt hero, activity feed, results panel"
```

---

### Task 4: Settings Page — Add Navigation Tabs for All Features

The settings page already has Account, Gmail, Ghost Writer, and Plan sections. Add tabs for Analytics, Follow-ups, and Signal Radar with summary views and deep-link actions.

**Files:**
- Modify: `app/dashboard/settings/page.tsx` (read first, then add tab navigation)

- [ ] **Step 1: Read the current settings page**

Run: `Read app/dashboard/settings/page.tsx` — understand current tab structure (it uses `tab` param in URL).

- [ ] **Step 2: Add new tab entries and sections**

The settings page uses `useSearchParams` for tab switching. Find the tab list (look for `TABS` or `tab === "..."` patterns) and add:
- `"analytics"` tab — links to `/dashboard/analytics`, shows top-level stats
- `"followups"` tab — links to `/dashboard/followups`, shows active sequence count
- `"signals"` tab — links to `/dashboard/signals`, shows signal count

Each new tab section renders a card with a description and a "Go to [feature]" link button. Example for analytics tab:

```tsx
{tab === "analytics" && (
  <SectionCard>
    <SectionLabel icon={<BarChart3 size={12} />}>Analytics</SectionLabel>
    <p style={{ fontSize: 13, color: "#555", fontFamily: "var(--font-outfit)", marginBottom: 16, lineHeight: 1.6 }}>
      View open rates, click rates, and reply rates across all your campaigns.
    </p>
    <Link href="/dashboard/analytics" style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "7px 14px",
      backgroundColor: "#FF5200",
      color: "#fff",
      borderRadius: 6,
      fontSize: 12,
      fontWeight: 500,
      fontFamily: "var(--font-outfit)",
      textDecoration: "none",
    }}>
      <BarChart3 size={12} /> Open Analytics
    </Link>
  </SectionCard>
)}

{tab === "followups" && (
  <SectionCard>
    <SectionLabel icon={<Repeat size={12} />}>Follow-ups</SectionLabel>
    <p style={{ fontSize: 13, color: "#555", fontFamily: "var(--font-outfit)", marginBottom: 16, lineHeight: 1.6 }}>
      Manage automated follow-up sequences for leads who haven't replied.
    </p>
    <Link href="/dashboard/followups" style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "7px 14px",
      backgroundColor: "#FF5200",
      color: "#fff",
      borderRadius: 6,
      fontSize: 12,
      fontWeight: 500,
      fontFamily: "var(--font-outfit)",
      textDecoration: "none",
    }}>
      <Repeat size={12} /> Manage Follow-ups
    </Link>
  </SectionCard>
)}

{tab === "signals" && (
  <SectionCard>
    <SectionLabel icon={<Search size={12} />}>Lead Research</SectionLabel>
    <p style={{ fontSize: 13, color: "#555", fontFamily: "var(--font-outfit)", marginBottom: 16, lineHeight: 1.6 }}>
      Research leads with AI-powered signal detection to find the best outreach moments.
    </p>
    <Link href="/dashboard/signals" style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "7px 14px",
      backgroundColor: "#FF5200",
      color: "#fff",
      borderRadius: 6,
      fontSize: 12,
      fontWeight: 500,
      fontFamily: "var(--font-outfit)",
      textDecoration: "none",
    }}>
      <Search size={12} /> Open Lead Research
    </Link>
  </SectionCard>
)}
```

Add `Repeat, Search, BarChart3` to lucide imports if not already there.

- [ ] **Step 3: Add tabs to the tab nav list**

Find the tabs array in `app/dashboard/settings/page.tsx` and add:
```tsx
{ id: "analytics", label: "Analytics", icon: <BarChart3 size={13} /> },
{ id: "followups", label: "Follow-ups", icon: <Repeat size={13} /> },
{ id: "signals",   label: "Lead Research", icon: <Search size={13} /> },
```

- [ ] **Step 4: Commit**

```bash
git add app/dashboard/settings/page.tsx
git commit -m "feat: add analytics, follow-ups, lead research tabs to settings"
```

---

### Task 5: Landing Page Rebuild

**Files:**
- Modify: `app/page.tsx`
- Modify: `app/_landing/demo.tsx` (if needed)

The landing page should position Nexora as an AI agent for cold email, not just an email generator. New messaging: "Your AI outreach agent" + feature highlights.

- [ ] **Step 1: Read current landing page fully**

Run: `Read app/page.tsx` — understand current sections (navbar, hero, features, pricing, CTA).

- [ ] **Step 2: Update hero section messaging**

Find the hero headline and update:
```tsx
// Change headline from email-generation focus to agent focus
<h1>Your AI outreach agent</h1>
<p>Tell Nexora what you need — it researches leads, drafts emails, and tracks results automatically.</p>
```

Update the CTA button from generic text to "Try the agent" or "Get started free".

- [ ] **Step 3: Update feature highlights**

Replace or update the feature list to include:
1. Agent interface — natural language control
2. Auto personalization — AI-researched email drafts
3. Live activity feed — see every step in real time
4. Follow-up automation — never lose a lead

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx
git commit -m "feat: update landing page messaging for AI agent positioning"
```

---

### Task 6: Build + Fix All TypeScript Errors

**Files:**
- Any file with TypeScript errors from `npm run build`

- [ ] **Step 1: Run build**

```bash
npm run build
```

Expected: TypeScript compilation — fix any errors.

- [ ] **Step 2: Fix common TypeScript issues**

Common errors to watch for:
- `Property 'exact' does not exist` in navbar NAV array — use a type assertion or typed array
- Framer motion `style` type conflicts — add explicit types
- `AgentResult` type not exported — ensure it's defined in the route file
- Missing imports for new Lucide icons (`Repeat`, `Search`, `BarChart3`)

For any error: read the error, locate the file, apply the minimal fix.

- [ ] **Step 3: Re-run build until clean**

```bash
npm run build
```

Expected: `✓ Compiled successfully`

---

### Task 7: Git Commit and Push

- [ ] **Step 1: Final status check**

```bash
git status
git diff --stat
```

- [ ] **Step 2: Commit any remaining changes**

```bash
git add -A
git commit -m "feat: complete AI agent interface rebuild — navbar, agent prompt, SSE activity, results panel"
```

- [ ] **Step 3: Push**

```bash
git push
```

---

## Self-Review

**Spec coverage:**
- ✅ STEP 1: Read all skill files (done before plan)
- ✅ STEP 2: Read codebase (done before plan)
- ✅ STEP 3: Single page, no sidebar, top navbar, Agent Prompt hero 40%, Activity Feed SSE, Results Panel card grid
- ✅ STEP 4: Settings page with Analytics, Follow-ups, Signal Radar tabs
- ✅ STEP 5: `app/api/agent/route.ts` with NLP parsing, intent detection, SSE streaming
- ✅ STEP 6: Framer Motion stagger, slide-in, glow on focus (orange border highlight)
- ✅ STEP 7: Design system — #060606, #0E0E0E, #FF5200, Syne/Outfit, Lucide icons
- ✅ STEP 8: Landing page messaging update
- ✅ STEP 9: All existing API routes preserved (only layout.tsx + page.tsx modified)
- ✅ STEP 10: Build step included
- ✅ STEP 11: Commit + push included

**Placeholder scan:** No TBD/TODO — all steps contain real code.

**Type consistency:**
- `AgentResult.items` is `ResultItem[]` throughout
- `Step` type used consistently in `agent-interface.tsx`
- `SSEEvent` union type covers all cases in the route
