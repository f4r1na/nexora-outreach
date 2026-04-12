"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PLANS, PlanKey } from "@/lib/plans";

// ─── Ghost Writer types ───────────────────────────────────────────────────────

type GhostStyle = {
  style_summary: string;
  tone_keywords: string;
  sample_emails: string[];
} | null;

type Subscription = {
  plan: string;
  credits_used: number;
  credits_limit: number;
  current_period_end: string | null;
};

type GmailConnection = {
  gmail_email: string;
} | null;

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconLock() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 13l4 4L19 7" />
    </svg>
  );
}

function IconGmail() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M2 6.5L12 13.5L22 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function IconX() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

// ─── Plan badge colours ───────────────────────────────────────────────────────

const PLAN_ACCENT: Record<string, { color: string; bg: string; border: string }> = {
  free:    { color: "rgba(255,255,255,0.4)",  bg: "rgba(255,255,255,0.04)",  border: "rgba(255,255,255,0.1)" },
  starter: { color: "#60a5fa",               bg: "rgba(96,165,250,0.08)",   border: "rgba(96,165,250,0.2)" },
  pro:     { color: "#FF5200",               bg: "rgba(255,82,0,0.08)",     border: "rgba(255,82,0,0.35)" },
  agency:  { color: "#a78bfa",               bg: "rgba(167,139,250,0.08)",  border: "rgba(167,139,250,0.25)" },
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [sub, setSub] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);

  const [gmail, setGmail] = useState<GmailConnection>(undefined as unknown as GmailConnection);
  const [gmailLoading, setGmailLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);

  // Writing Style (Ghost Writer)
  const [ghostStyle, setGhostStyle] = useState<GhostStyle | undefined>(undefined);
  const [ghostLoading, setGhostLoading] = useState(true);
  const [sampleEmails, setSampleEmails] = useState(["", "", "", "", ""]);
  const [analyzing, setAnalyzing] = useState(false);
  const [ghostError, setGhostError] = useState<string | null>(null);
  const [isRetraining, setIsRetraining] = useState(false);

  const gmailStatus = searchParams.get("gmail");

  // Load subscription
  useEffect(() => {
    fetch("/api/subscription")
      .then((r) => r.json())
      .then((d) => { setSub(d.subscription); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Load Gmail connection status (re-fetch when URL params change)
  useEffect(() => {
    fetch("/api/auth/gmail/status")
      .then((r) => r.json())
      .then((d) => { setGmail(d.connection ?? null); setGmailLoading(false); })
      .catch(() => setGmailLoading(false));
  }, [searchParams]);

  // Load writing style
  useEffect(() => {
    fetch("/api/ghostwriter")
      .then((r) => r.json())
      .then((d) => { setGhostStyle(d.style ?? null); setGhostLoading(false); })
      .catch(() => { setGhostStyle(null); setGhostLoading(false); });
  }, []);


  async function handleUpgrade(plan: string) {
    setUpgrading(plan);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else alert("Error: " + (data.error || "Unknown error"));
    } catch (err) {
      console.error("Checkout error:", err);
      alert("Something went wrong. Check console.");
    } finally {
      setUpgrading(null);
    }
  }

  async function handleDisconnect() {
    setDisconnecting(true);
    try {
      const res = await fetch("/api/auth/gmail/disconnect", { method: "POST" });
      if (res.ok) {
        setGmail(null);
        router.replace("/dashboard/settings");
      }
    } catch {
      alert("Failed to disconnect. Please try again.");
    } finally {
      setDisconnecting(false);
    }
  }

  const currentPlan = sub?.plan ?? "free";
  const accent = PLAN_ACCENT[currentPlan] ?? PLAN_ACCENT.free;
  const creditsUsed = sub?.credits_used ?? 0;
  const creditsLimit = sub?.credits_limit ?? 10;
  const pct = Math.min(100, Math.round((creditsUsed / creditsLimit) * 100));
  const isProOrAgency = currentPlan === "pro" || currentPlan === "agency";
  const isAgency = currentPlan === "agency";

  async function handleAnalyzeStyle() {
    const filled = sampleEmails.filter((s) => s.trim());
    if (filled.length < 3) { setGhostError("Please provide at least 3 sample emails."); return; }
    setAnalyzing(true);
    setGhostError(null);
    try {
      const res = await fetch("/api/ghostwriter/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sample_emails: filled }),
      });
      const data = await res.json() as { ok?: boolean; style?: GhostStyle; error?: string };
      if (!res.ok) { setGhostError(data.error ?? "Analysis failed"); }
      else if (data.style) {
        setGhostStyle(data.style);
        setIsRetraining(false);
        setSampleEmails(["", "", "", "", ""]);
      }
    } catch { setGhostError("Network error — please try again."); }
    finally { setAnalyzing(false); }
  }

  async function handleRemoveStyle() {
    try {
      const res = await fetch("/api/ghostwriter", { method: "DELETE" });
      if (res.ok) { setGhostStyle(null); setIsRetraining(false); setSampleEmails(["", "", "", "", ""]); }
    } catch { /* silent */ }
  }

  return (
    <div style={{ padding: "32px 32px 64px", maxWidth: 680, margin: "0 auto" }}>

      {/* Page title */}
      <h1 style={{
        fontSize: 22, fontWeight: 800, color: "#fff",
        fontFamily: "var(--font-syne)", marginBottom: 4,
      }}>
        Settings
      </h1>
      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", fontFamily: "var(--font-outfit)", marginBottom: 32 }}>
        Manage your plan and integrations
      </p>

      {/* Gmail status banner */}
      {gmailStatus === "connected" && (
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          backgroundColor: "rgba(34,197,94,0.08)",
          border: "1px solid rgba(34,197,94,0.25)",
          borderLeft: "3px solid #22c55e",
          borderRadius: 10, padding: "12px 16px", marginBottom: 24,
        }}>
          <span style={{ color: "#22c55e", flexShrink: 0 }}><IconCheck /></span>
          <p style={{ fontSize: 13, color: "#fff", fontFamily: "var(--font-outfit)", margin: 0 }}>
            Gmail connected successfully.
          </p>
          <button
            onClick={() => router.replace("/dashboard/settings")}
            style={{ marginLeft: "auto", color: "rgba(255,255,255,0.3)", background: "none", border: "none", cursor: "pointer", padding: 2 }}
          >
            <IconX />
          </button>
        </div>
      )}
      {gmailStatus === "error" && (
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          backgroundColor: "rgba(239,68,68,0.08)",
          border: "1px solid rgba(239,68,68,0.25)",
          borderLeft: "3px solid #ef4444",
          borderRadius: 10, padding: "12px 16px", marginBottom: 24,
        }}>
          <span style={{ color: "#ef4444", flexShrink: 0 }}><IconX /></span>
          <p style={{ fontSize: 13, color: "#fff", fontFamily: "var(--font-outfit)", margin: 0 }}>
            Gmail connection failed. Please try again.
          </p>
          <button
            onClick={() => router.replace("/dashboard/settings")}
            style={{ marginLeft: "auto", color: "rgba(255,255,255,0.3)", background: "none", border: "none", cursor: "pointer", padding: 2 }}
          >
            <IconX />
          </button>
        </div>
      )}

      {/* ── Current Plan card ── */}
      <p style={{
        fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
        color: "rgba(255,255,255,0.25)", fontFamily: "var(--font-outfit)", marginBottom: 12,
      }}>
        Current Plan
      </p>
      <div style={{
        backgroundColor: "#0e0e0e",
        border: `1px solid ${accent.border}`,
        borderRadius: 14, padding: "24px 22px", marginBottom: 32,
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <p style={{
              fontSize: 26, fontWeight: 800, color: accent.color,
              fontFamily: "var(--font-syne)", textTransform: "capitalize", marginBottom: 2,
            }}>
              {loading ? "…" : currentPlan}
            </p>
            {sub?.current_period_end && (
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", fontFamily: "var(--font-outfit)" }}>
                Renews {new Date(sub.current_period_end).toLocaleDateString()}
              </p>
            )}
          </div>
          <span style={{
            fontSize: 10, fontWeight: 800, color: accent.color,
            backgroundColor: accent.bg, border: `1px solid ${accent.border}`,
            padding: "4px 10px", borderRadius: 999, letterSpacing: "0.06em",
            textTransform: "uppercase", fontFamily: "var(--font-outfit)",
          }}>
            {loading ? "…" : currentPlan}
          </span>
        </div>

        {/* Credits bar */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontFamily: "var(--font-outfit)" }}>Credits used</span>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", fontFamily: "var(--font-outfit)", fontWeight: 600 }}>
              {loading ? "…" : `${creditsUsed} / ${creditsLimit === 999999 ? "∞" : creditsLimit}`}
            </span>
          </div>
          <div style={{ height: 6, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 99,
              width: `${creditsLimit === 999999 ? 5 : pct}%`,
              background: pct >= 90 ? "#ef4444" : "#FF5200",
              transition: "width 0.5s",
            }} />
          </div>
          {pct >= 90 && creditsLimit !== 999999 && (
            <p style={{ fontSize: 11, color: "#ef4444", marginTop: 6, fontFamily: "var(--font-outfit)" }}>
              Running low — upgrade to continue
            </p>
          )}
        </div>
      </div>

      {/* ── Gmail Integration ── */}
      <p style={{
        fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
        color: "rgba(255,255,255,0.25)", fontFamily: "var(--font-outfit)", marginBottom: 12,
      }}>
        Integrations
      </p>
      <div style={{
        backgroundColor: "#0e0e0e",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 14, padding: "24px 22px", marginBottom: 32,
        position: "relative", overflow: "hidden",
      }}>

        {/* Locked overlay for free / starter */}
        {!isProOrAgency && (
          <div style={{
            position: "absolute", inset: 0, borderRadius: 14,
            background: "linear-gradient(160deg, rgba(14,14,14,0.5) 0%, rgba(14,14,14,0.88) 100%)",
            backdropFilter: "blur(4px)",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: 10,
            padding: 24, zIndex: 2,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: "50%",
              backgroundColor: "rgba(255,82,0,0.1)",
              border: "1px solid rgba(255,82,0,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#FF5200",
            }}>
              <IconLock />
            </div>
            <p style={{
              fontSize: 13, fontWeight: 700, color: "#fff",
              fontFamily: "var(--font-syne)", textAlign: "center",
            }}>
              Upgrade to Pro to unlock Gmail sending
            </p>
            <button
              onClick={() => {
                const el = document.getElementById("plans-section");
                el?.scrollIntoView({ behavior: "smooth" });
              }}
              style={{
                padding: "8px 20px", backgroundColor: "#FF5200", color: "#fff",
                borderRadius: 8, border: "none", fontSize: 13, fontWeight: 700,
                fontFamily: "var(--font-outfit)", cursor: "pointer",
              }}
            >
              See Plans →
            </button>
          </div>
        )}

        {/* Card content (always rendered, dimmed when locked) */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, opacity: isProOrAgency ? 1 : 0.25 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 11, flexShrink: 0,
              backgroundColor: "rgba(255,82,0,0.1)",
              border: "1px solid rgba(255,82,0,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#FF5200",
            }}>
              <IconGmail />
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#fff", fontFamily: "var(--font-syne)", marginBottom: 2 }}>
                Gmail
              </p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.38)", fontFamily: "var(--font-outfit)" }}>
                Send campaigns directly from your inbox
              </p>
            </div>
          </div>

          {/* Right side: loading / connected / connect */}
          {gmailLoading ? (
            <div style={{ width: 100, height: 34, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 8 }} />
          ) : gmail ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              <span style={{
                display: "flex", alignItems: "center", gap: 5,
                fontSize: 11, fontWeight: 700, color: "#22c55e",
                backgroundColor: "rgba(34,197,94,0.1)",
                border: "1px solid rgba(34,197,94,0.2)",
                padding: "4px 10px", borderRadius: 999,
                fontFamily: "var(--font-outfit)",
              }}>
                <IconCheck />
                Connected
              </span>
              <span style={{
                fontSize: 12, color: "rgba(255,255,255,0.5)",
                fontFamily: "var(--font-outfit)", maxWidth: 180,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {gmail.gmail_email}
              </span>
              <button
                onClick={handleDisconnect}
                disabled={disconnecting}
                style={{
                  padding: "6px 12px", borderRadius: 7, fontSize: 12, fontWeight: 600,
                  fontFamily: "var(--font-outfit)", cursor: "pointer",
                  backgroundColor: "rgba(239,68,68,0.08)",
                  color: "rgba(239,68,68,0.8)",
                  border: "1px solid rgba(239,68,68,0.2)",
                  opacity: disconnecting ? 0.6 : 1,
                }}
              >
                {disconnecting ? "Disconnecting…" : "Disconnect"}
              </button>
            </div>
          ) : (
            <a
              href="/api/auth/gmail"
              style={{
                display: "flex", alignItems: "center", gap: 7,
                padding: "9px 18px", backgroundColor: "#FF5200", color: "#fff",
                borderRadius: 8, fontSize: 13, fontWeight: 700,
                fontFamily: "var(--font-outfit)", textDecoration: "none",
                flexShrink: 0,
              }}
            >
              <IconGmail />
              Connect Gmail
            </a>
          )}
        </div>
      </div>

      {/* ── Writing Style ── */}
      <p style={{
        fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
        color: "rgba(255,255,255,0.25)", fontFamily: "var(--font-outfit)", marginBottom: 12,
      }}>
        Writing Style
      </p>
      <div style={{
        backgroundColor: "#0e0e0e",
        border: `1px solid ${isAgency ? "rgba(167,139,250,0.2)" : "rgba(255,255,255,0.07)"}`,
        borderRadius: 14, padding: "24px 22px", marginBottom: 32,
        position: "relative", overflow: "hidden",
      }}>
        {/* Locked overlay for non-agency */}
        {!isAgency && (
          <div style={{
            position: "absolute", inset: 0, borderRadius: 14,
            background: "linear-gradient(160deg, rgba(14,14,14,0.5) 0%, rgba(14,14,14,0.88) 100%)",
            backdropFilter: "blur(4px)",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: 10,
            padding: 24, zIndex: 2,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: "50%",
              backgroundColor: "rgba(167,139,250,0.1)",
              border: "1px solid rgba(167,139,250,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#a78bfa",
            }}>
              <IconLock />
            </div>
            <p style={{
              fontSize: 13, fontWeight: 700, color: "#fff",
              fontFamily: "var(--font-syne)", textAlign: "center",
            }}>
              Upgrade to Agency to unlock Writing Style
            </p>
            <p style={{
              fontSize: 12, color: "rgba(255,255,255,0.4)",
              fontFamily: "var(--font-outfit)", textAlign: "center", maxWidth: 340, lineHeight: 1.5,
            }}>
              Train AI to write in your exact voice — tone, vocabulary, and sentence structure.
            </p>
            <button
              onClick={() => {
                const el = document.getElementById("plans-section");
                el?.scrollIntoView({ behavior: "smooth" });
              }}
              style={{
                padding: "8px 20px", backgroundColor: "#a78bfa", color: "#fff",
                borderRadius: 8, border: "none", fontSize: 13, fontWeight: 700,
                fontFamily: "var(--font-outfit)", cursor: "pointer",
              }}
            >
              See Plans
            </button>
          </div>
        )}

        {/* Content (always rendered, dimmed when locked) */}
        <div style={{ opacity: isAgency ? 1 : 0.2 }}>
          {/* Header row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#fff", fontFamily: "var(--font-syne)", marginBottom: 2 }}>
                AI Writing Style
              </p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.38)", fontFamily: "var(--font-outfit)" }}>
                Train AI on your emails — all campaigns will sound like you
              </p>
            </div>
            {isAgency && (
              <span style={{
                fontSize: 10, fontWeight: 800, color: "#a78bfa",
                backgroundColor: "rgba(167,139,250,0.1)",
                border: "1px solid rgba(167,139,250,0.25)",
                padding: "4px 10px", borderRadius: 999,
                letterSpacing: "0.06em", textTransform: "uppercase",
                fontFamily: "var(--font-outfit)",
              }}>
                Agency
              </span>
            )}
          </div>

          {ghostLoading ? (
            <div style={{ color: "rgba(255,255,255,0.25)", fontFamily: "var(--font-outfit)", fontSize: 13 }}>Loading…</div>
          ) : ghostStyle && !isRetraining ? (
            /* Active state */
            <div>
              <div style={{
                padding: "16px", borderRadius: 10,
                backgroundColor: "rgba(167,139,250,0.05)",
                border: "1px solid rgba(167,139,250,0.15)",
                marginBottom: 14,
              }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(167,139,250,0.6)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8, fontFamily: "var(--font-outfit)" }}>
                  Style Guide
                </p>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", fontFamily: "var(--font-outfit)", lineHeight: 1.7 }}>
                  {ghostStyle.style_summary}
                </p>
              </div>
              {ghostStyle.tone_keywords && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 18 }}>
                  {ghostStyle.tone_keywords.split(",").map((kw) => kw.trim()).filter(Boolean).map((kw) => (
                    <span key={kw} style={{
                      fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 999,
                      backgroundColor: "rgba(167,139,250,0.1)",
                      border: "1px solid rgba(167,139,250,0.2)",
                      color: "#a78bfa", fontFamily: "var(--font-outfit)",
                    }}>
                      {kw}
                    </span>
                  ))}
                </div>
              )}
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => setIsRetraining(true)}
                  style={{
                    padding: "8px 16px", borderRadius: 8, fontSize: 12.5, fontWeight: 600,
                    fontFamily: "var(--font-outfit)", cursor: "pointer",
                    backgroundColor: "rgba(167,139,250,0.1)",
                    color: "#a78bfa",
                    border: "1px solid rgba(167,139,250,0.25)",
                  }}
                >
                  Retrain
                </button>
                <button
                  onClick={handleRemoveStyle}
                  style={{
                    padding: "8px 16px", borderRadius: 8, fontSize: 12.5, fontWeight: 600,
                    fontFamily: "var(--font-outfit)", cursor: "pointer",
                    backgroundColor: "rgba(239,68,68,0.07)",
                    color: "rgba(239,68,68,0.7)",
                    border: "1px solid rgba(239,68,68,0.2)",
                  }}
                >
                  Remove Style
                </button>
              </div>
            </div>
          ) : (
            /* Training form */
            <div>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", fontFamily: "var(--font-outfit)", lineHeight: 1.6, marginBottom: 18 }}>
                Paste 3–5 emails <strong style={{ color: "rgba(255,255,255,0.7)" }}>you have written</strong> so AI can learn your style.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
                {sampleEmails.map((val, i) => (
                  <div key={i}>
                    <label style={{
                      fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.35)",
                      textTransform: "uppercase", letterSpacing: "0.07em",
                      display: "block", marginBottom: 5, fontFamily: "var(--font-outfit)",
                    }}>
                      Sample {i + 1}{i < 3 ? " *" : " (optional)"}
                    </label>
                    <textarea
                      value={val}
                      onChange={(e) => setSampleEmails((prev) => prev.map((v, j) => j === i ? e.target.value : v))}
                      placeholder={`Paste an email you wrote${i === 0 ? " — subject + body works best" : ""}…`}
                      rows={3}
                      style={{
                        width: "100%", padding: "10px 13px", borderRadius: 9,
                        backgroundColor: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.09)",
                        color: "rgba(255,255,255,0.75)", fontFamily: "var(--font-outfit)",
                        fontSize: 13, lineHeight: 1.6, resize: "vertical",
                        outline: "none", boxSizing: "border-box",
                      }}
                    />
                  </div>
                ))}
              </div>
              {ghostError && (
                <div style={{
                  marginBottom: 14, padding: "9px 13px", borderRadius: 8,
                  backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
                }}>
                  <p style={{ fontSize: 12.5, color: "#ef4444", fontFamily: "var(--font-outfit)" }}>{ghostError}</p>
                </div>
              )}
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={handleAnalyzeStyle}
                  disabled={analyzing}
                  style={{
                    display: "flex", alignItems: "center", gap: 7,
                    padding: "10px 20px", borderRadius: 9,
                    backgroundColor: analyzing ? "rgba(167,139,250,0.4)" : "#a78bfa",
                    color: "#fff", border: "none",
                    fontSize: 13, fontWeight: 700, fontFamily: "var(--font-outfit)",
                    cursor: analyzing ? "not-allowed" : "pointer",
                    opacity: analyzing ? 0.8 : 1,
                  }}
                >
                  {analyzing ? "Analyzing…" : "Analyze Writing Style"}
                </button>
                {isRetraining && (
                  <button
                    onClick={() => { setIsRetraining(false); setGhostError(null); }}
                    style={{
                      padding: "10px 16px", borderRadius: 9,
                      backgroundColor: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      fontSize: 13, fontWeight: 600, fontFamily: "var(--font-outfit)", cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Available Plans ── */}
      <p id="plans-section" style={{
        fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
        color: "rgba(255,255,255,0.25)", fontFamily: "var(--font-outfit)", marginBottom: 12,
      }}>
        Available Plans
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {(Object.entries(PLANS) as [PlanKey, typeof PLANS[keyof typeof PLANS]][]).map(([key, plan]) => {
          const isCurrent = currentPlan === key;
          const tier = ["starter", "pro", "agency"];
          const isDowngrade = tier.indexOf(key) < tier.indexOf(currentPlan as string);
          const a = PLAN_ACCENT[key] ?? PLAN_ACCENT.free;

          return (
            <div
              key={key}
              style={{
                backgroundColor: "#0e0e0e",
                border: `1px solid ${isCurrent ? a.border : "rgba(255,255,255,0.07)"}`,
                borderRadius: 12, padding: "18px 20px",
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: "#fff", fontFamily: "var(--font-syne)" }}>
                    {plan.name}
                  </span>
                  {isCurrent && (
                    <span style={{
                      fontSize: 9, fontWeight: 800, color: a.color,
                      backgroundColor: a.bg, border: `1px solid ${a.border}`,
                      padding: "2px 8px", borderRadius: 999, letterSpacing: "0.06em",
                      fontFamily: "var(--font-outfit)",
                    }}>
                      CURRENT
                    </span>
                  )}
                </div>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", fontFamily: "var(--font-outfit)" }}>
                  {plan.credits === 999999 ? "Unlimited" : String(plan.credits)} credits/month
                </p>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
                <span style={{ fontSize: 18, fontWeight: 800, color: "#fff", fontFamily: "var(--font-syne)" }}>
                  ${plan.price}
                  <span style={{ fontSize: 12, fontWeight: 400, color: "rgba(255,255,255,0.3)" }}>/mo</span>
                </span>
                {!isCurrent && !isDowngrade && (
                  <button
                    onClick={() => handleUpgrade(key)}
                    disabled={upgrading === key}
                    style={{
                      padding: "8px 18px", backgroundColor: "#FF5200", color: "#fff",
                      borderRadius: 8, border: "none", fontSize: 13, fontWeight: 700,
                      fontFamily: "var(--font-outfit)", cursor: "pointer",
                      opacity: upgrading === key ? 0.6 : 1,
                    }}
                  >
                    {upgrading === key ? "Processing…" : "Upgrade"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
