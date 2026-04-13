"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PLANS, PlanKey } from "@/lib/plans";
import { ScrollReveal, StaggerList, StaggerItem } from "../_components/motion";

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Shared input style ───────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 12px",
  borderRadius: 6,
  backgroundColor: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "#ccc",
  fontFamily: "var(--font-outfit)",
  fontSize: 13,
  outline: "none",
  boxSizing: "border-box",
};

// ─── Section label ────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontSize: 10,
      fontWeight: 500,
      letterSpacing: "0.07em",
      textTransform: "uppercase",
      color: "#444",
      fontFamily: "var(--font-outfit)",
      marginBottom: 10,
    }}>
      {children}
    </p>
  );
}

// ─── Section card ─────────────────────────────────────────────────────────────

function SectionCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      backgroundColor: "#0e0e0e",
      border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: 8,
      padding: "20px",
      marginBottom: 24,
      ...style,
    }}>
      {children}
    </div>
  );
}

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

  // Writing Style
  const [ghostStyle, setGhostStyle] = useState<GhostStyle | undefined>(undefined);
  const [ghostLoading, setGhostLoading] = useState(true);
  const [sampleEmails, setSampleEmails] = useState(["", "", "", "", ""]);
  const [analyzing, setAnalyzing] = useState(false);
  const [ghostError, setGhostError] = useState<string | null>(null);
  const [isRetraining, setIsRetraining] = useState(false);

  const gmailStatus = searchParams.get("gmail");

  useEffect(() => {
    fetch("/api/subscription")
      .then((r) => r.json())
      .then((d) => { setSub(d.subscription); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetch("/api/auth/gmail/status")
      .then((r) => r.json())
      .then((d) => { setGmail(d.connection ?? null); setGmailLoading(false); })
      .catch(() => setGmailLoading(false));
  }, [searchParams]);

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
    } catch {
      alert("Something went wrong.");
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

  const currentPlan = sub?.plan ?? "free";
  const creditsUsed = sub?.credits_used ?? 0;
  const creditsLimit = sub?.credits_limit ?? 10;
  const pct = Math.min(100, Math.round((creditsUsed / creditsLimit) * 100));
  const isProOrAgency = currentPlan === "pro" || currentPlan === "agency";
  const isAgency = currentPlan === "agency";

  return (
    <>
      {/* Header */}
      <header style={{
        padding: "0 32px",
        height: 60,
        display: "flex",
        alignItems: "center",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        backgroundColor: "rgba(6,6,6,0.92)",
        backdropFilter: "blur(10px)",
        position: "sticky",
        top: 0,
        zIndex: 30,
      }}>
        <h1 style={{ fontSize: 14, fontWeight: 500, color: "#fff", fontFamily: "var(--font-syne)", letterSpacing: "-0.01em" }}>
          Settings
        </h1>
      </header>

      <div style={{ padding: "28px 32px 64px", maxWidth: 600 }}>

        {/* Gmail banner */}
        {gmailStatus === "connected" && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
            padding: "10px 14px", borderRadius: 6, marginBottom: 20,
            backgroundColor: "rgba(74,222,128,0.05)", border: "1px solid rgba(74,222,128,0.15)",
          }}>
            <span style={{ fontSize: 13, color: "#4ade80", fontFamily: "var(--font-outfit)" }}>
              Gmail connected.
            </span>
            <button onClick={() => router.replace("/dashboard/settings")} style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: 16, lineHeight: 1 }}>×</button>
          </div>
        )}
        {gmailStatus === "error" && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
            padding: "10px 14px", borderRadius: 6, marginBottom: 20,
            backgroundColor: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)",
          }}>
            <span style={{ fontSize: 13, color: "#f87171", fontFamily: "var(--font-outfit)" }}>
              Gmail connection failed. Please try again.
            </span>
            <button onClick={() => router.replace("/dashboard/settings")} style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: 16, lineHeight: 1 }}>×</button>
          </div>
        )}

        {/* ── Subscription ── */}
        <ScrollReveal>
        <SectionLabel>Subscription</SectionLabel>
        <SectionCard>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 500, color: "#fff", fontFamily: "var(--font-syne)", textTransform: "capitalize", marginBottom: 2 }}>
                {loading ? "—" : currentPlan}
              </p>
              {sub?.current_period_end && (
                <p style={{ fontSize: 11, color: "#444", fontFamily: "var(--font-outfit)" }}>
                  Renews {new Date(sub.current_period_end).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: "#555", fontFamily: "var(--font-outfit)" }}>Credits used</span>
              <span style={{ fontSize: 12, color: "#888", fontFamily: "var(--font-outfit)" }}>
                {loading ? "—" : `${creditsUsed} / ${creditsLimit === 999999 ? "∞" : creditsLimit}`}
              </span>
            </div>
            <div style={{ height: 3, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
              <div className="progress-bar" style={{
                height: "100%", borderRadius: 2,
                width: `${creditsLimit === 999999 ? 5 : pct}%`,
                backgroundColor: pct >= 90 ? "#ef4444" : "#FF5200",
              }} />
            </div>
            {pct >= 90 && creditsLimit !== 999999 && (
              <p style={{ fontSize: 11, color: "#ef4444", marginTop: 5, fontFamily: "var(--font-outfit)" }}>
                Running low — upgrade to continue.
              </p>
            )}
          </div>
        </SectionCard>

        </ScrollReveal>

        {/* ── Email Accounts ── */}
        <ScrollReveal delay={0.06}>
        <SectionLabel>Email Accounts</SectionLabel>
        <SectionCard style={{ position: "relative", overflow: "hidden" }}>
          {/* Lock overlay */}
          {!isProOrAgency && (
            <div style={{
              position: "absolute", inset: 0, borderRadius: 8,
              backgroundColor: "rgba(6,6,6,0.85)",
              backdropFilter: "blur(4px)",
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 10,
              padding: 24, zIndex: 2,
            }}>
              <p style={{ fontSize: 13, fontWeight: 500, color: "#ccc", fontFamily: "var(--font-syne)", textAlign: "center" }}>
                Gmail sending requires Pro
              </p>
              <button
                onClick={() => {
                  const el = document.getElementById("plans-section");
                  el?.scrollIntoView({ behavior: "smooth" });
                }}
                style={{
                  padding: "7px 16px", backgroundColor: "#FF5200", color: "#fff",
                  borderRadius: 6, border: "none", fontSize: 13,
                  fontFamily: "var(--font-outfit)", cursor: "pointer",
                }}
              >
                View plans
              </button>
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, opacity: isProOrAgency ? 1 : 0.2 }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 500, color: "#ccc", fontFamily: "var(--font-outfit)", marginBottom: 2 }}>Gmail</p>
              <p style={{ fontSize: 12, color: "#555", fontFamily: "var(--font-outfit)" }}>
                Send campaigns from your inbox
              </p>
            </div>

            {gmailLoading ? (
              <div style={{ width: 80, height: 30, backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 6 }} />
            ) : gmail ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#4ade80" }} />
                  <span style={{ fontSize: 12, color: "#666", fontFamily: "var(--font-outfit)" }}>
                    {gmail.gmail_email}
                  </span>
                </div>
                <button
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                  style={{
                    padding: "5px 10px", borderRadius: 6, fontSize: 12,
                    fontFamily: "var(--font-outfit)", cursor: "pointer",
                    backgroundColor: "transparent",
                    color: "#f87171",
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
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "7px 14px", backgroundColor: "#FF5200", color: "#fff",
                  borderRadius: 6, fontSize: 13,
                  fontFamily: "var(--font-outfit)", textDecoration: "none",
                  flexShrink: 0,
                }}
              >
                Connect Gmail
              </a>
            )}
          </div>
        </SectionCard>

        </ScrollReveal>

        {/* ── Writing Style ── */}
        <ScrollReveal delay={0.1}>
        <SectionLabel>Writing Style</SectionLabel>
        <SectionCard style={{ position: "relative", overflow: "hidden" }}>
          {!isAgency && (
            <div style={{
              position: "absolute", inset: 0, borderRadius: 8,
              backgroundColor: "rgba(6,6,6,0.85)",
              backdropFilter: "blur(4px)",
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 10,
              padding: 24, zIndex: 2,
            }}>
              <p style={{ fontSize: 13, fontWeight: 500, color: "#ccc", fontFamily: "var(--font-syne)", textAlign: "center" }}>
                Writing Style requires Agency
              </p>
              <p style={{ fontSize: 12, color: "#555", fontFamily: "var(--font-outfit)", textAlign: "center", maxWidth: 300, lineHeight: 1.5 }}>
                Train AI on your emails — all campaigns will match your voice.
              </p>
              <button
                onClick={() => {
                  const el = document.getElementById("plans-section");
                  el?.scrollIntoView({ behavior: "smooth" });
                }}
                style={{
                  padding: "7px 16px", backgroundColor: "#FF5200", color: "#fff",
                  borderRadius: 6, border: "none", fontSize: 13,
                  fontFamily: "var(--font-outfit)", cursor: "pointer",
                }}
              >
                View plans
              </button>
            </div>
          )}

          <div style={{ opacity: isAgency ? 1 : 0.2 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 500, color: "#ccc", fontFamily: "var(--font-outfit)", marginBottom: 2 }}>
                  AI Writing Style
                </p>
                <p style={{ fontSize: 12, color: "#555", fontFamily: "var(--font-outfit)" }}>
                  Agency only
                </p>
              </div>
            </div>

            {ghostLoading ? (
              <div style={{ color: "#444", fontFamily: "var(--font-outfit)", fontSize: 13 }}>Loading…</div>
            ) : ghostStyle && !isRetraining ? (
              <div>
                <div style={{
                  padding: "14px",
                  borderRadius: 6,
                  backgroundColor: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  marginBottom: 12,
                }}>
                  <p style={{ fontSize: 10, fontWeight: 500, color: "#444", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6, fontFamily: "var(--font-outfit)" }}>
                    Style: Configured
                  </p>
                  <p style={{ fontSize: 13, color: "#888", fontFamily: "var(--font-outfit)", lineHeight: 1.6 }}>
                    {ghostStyle.style_summary}
                  </p>
                </div>
                {ghostStyle.tone_keywords && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 14 }}>
                    {ghostStyle.tone_keywords.split(",").map((kw) => kw.trim()).filter(Boolean).map((kw) => (
                      <span key={kw} style={{
                        fontSize: 11, padding: "3px 8px", borderRadius: 4,
                        backgroundColor: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        color: "#666", fontFamily: "var(--font-outfit)",
                      }}>
                        {kw}
                      </span>
                    ))}
                  </div>
                )}
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => setIsRetraining(true)}
                    style={{
                      padding: "7px 14px", borderRadius: 6, fontSize: 12,
                      fontFamily: "var(--font-outfit)", cursor: "pointer",
                      backgroundColor: "transparent", color: "#888",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    Retrain
                  </button>
                  <button
                    onClick={handleRemoveStyle}
                    style={{
                      padding: "7px 14px", borderRadius: 6, fontSize: 12,
                      fontFamily: "var(--font-outfit)", cursor: "pointer",
                      backgroundColor: "transparent", color: "#f87171",
                      border: "1px solid rgba(239,68,68,0.15)",
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: 12, color: "#555", fontFamily: "var(--font-outfit)", lineHeight: 1.6, marginBottom: 14 }}>
                  Paste 3–5 emails you have written. AI will learn your tone and vocabulary.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
                  {sampleEmails.map((val, i) => (
                    <div key={i}>
                      <label style={{
                        fontSize: 10, fontWeight: 500, color: "#444",
                        textTransform: "uppercase", letterSpacing: "0.06em",
                        display: "block", marginBottom: 4, fontFamily: "var(--font-outfit)",
                      }}>
                        Sample {i + 1}{i < 3 ? " *" : " (optional)"}
                      </label>
                      <textarea
                        value={val}
                        onChange={(e) => setSampleEmails((prev) => prev.map((v, j) => j === i ? e.target.value : v))}
                        placeholder={i === 0 ? "Paste an email you wrote — subject + body works best" : "Paste an email you wrote"}
                        rows={3}
                        style={{
                          ...inputStyle,
                          lineHeight: 1.6,
                          resize: "vertical",
                        }}
                      />
                    </div>
                  ))}
                </div>
                {ghostError && (
                  <p style={{ fontSize: 12, color: "#f87171", fontFamily: "var(--font-outfit)", marginBottom: 12 }}>
                    {ghostError}
                  </p>
                )}
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={handleAnalyzeStyle}
                    disabled={analyzing}
                    style={{
                      padding: "8px 16px", borderRadius: 6,
                      backgroundColor: analyzing ? "rgba(255,82,0,0.4)" : "#FF5200",
                      color: "#fff", border: "none",
                      fontSize: 13, fontFamily: "var(--font-outfit)",
                      cursor: analyzing ? "not-allowed" : "pointer",
                    }}
                  >
                    {analyzing ? "Analyzing…" : "Analyze style"}
                  </button>
                  {isRetraining && (
                    <button
                      onClick={() => { setIsRetraining(false); setGhostError(null); }}
                      style={{
                        padding: "8px 14px", borderRadius: 6,
                        backgroundColor: "transparent", color: "#666",
                        border: "1px solid rgba(255,255,255,0.08)",
                        fontSize: 13, fontFamily: "var(--font-outfit)", cursor: "pointer",
                      }}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </SectionCard>

        </ScrollReveal>

        {/* ── Plans ── */}
        <ScrollReveal delay={0.14}>
        <SectionLabel>
          <span id="plans-section">Available Plans</span>
        </SectionLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {(Object.entries(PLANS) as [PlanKey, typeof PLANS[keyof typeof PLANS]][]).map(([key, plan]) => {
            const isCurrent = currentPlan === key;
            const tier = ["starter", "pro", "agency"];
            const isDowngrade = tier.indexOf(key) < tier.indexOf(currentPlan as string);

            return (
              <div
                key={key}
                style={{
                  backgroundColor: "#0e0e0e",
                  border: `1px solid ${isCurrent ? "rgba(255,82,0,0.25)" : "rgba(255,255,255,0.06)"}`,
                  borderRadius: 8,
                  padding: "16px 18px",
                  display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: "#ccc", fontFamily: "var(--font-outfit)" }}>
                      {plan.name}
                    </span>
                    {isCurrent && (
                      <span style={{
                        fontSize: 10, color: "#FF5200",
                        fontFamily: "var(--font-outfit)",
                      }}>
                        Current
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: 12, color: "#444", fontFamily: "var(--font-outfit)" }}>
                    {plan.credits === 999999 ? "Unlimited" : String(plan.credits)} credits/month
                  </p>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
                  <span style={{ fontSize: 16, fontWeight: 500, color: "#888", fontFamily: "var(--font-syne)" }}>
                    ${plan.price}
                    <span style={{ fontSize: 11, fontWeight: 400, color: "#444" }}>/mo</span>
                  </span>
                  {!isCurrent && !isDowngrade && (
                    <button
                      onClick={() => handleUpgrade(key)}
                      disabled={upgrading === key}
                      className="btn-primary"
                      style={{
                        padding: "7px 14px", backgroundColor: "#FF5200", color: "#fff",
                        borderRadius: 6, border: "none", fontSize: 12,
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
        </ScrollReveal>
      </div>
    </>
  );
}
