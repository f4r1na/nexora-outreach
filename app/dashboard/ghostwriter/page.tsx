"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type GhostStyle = {
  style_summary: string;
  tone_keywords: string;
  sample_emails: string[];
} | null;

function IconLock() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 13l4 4L19 7" />
    </svg>
  );
}

export default function GhostWriterPage() {
  const [plan, setPlan] = useState<string | null>(null);
  const [planLoading, setPlanLoading] = useState(true);

  const [ghostStyle, setGhostStyle] = useState<GhostStyle | undefined>(undefined);
  const [ghostLoading, setGhostLoading] = useState(true);
  const [sampleEmails, setSampleEmails] = useState(["", "", "", "", ""]);
  const [analyzing, setAnalyzing] = useState(false);
  const [ghostError, setGhostError] = useState<string | null>(null);
  const [isRetraining, setIsRetraining] = useState(false);

  useEffect(() => {
    fetch("/api/subscription")
      .then((r) => r.json())
      .then((d) => { setPlan(d.subscription?.plan ?? "free"); setPlanLoading(false); })
      .catch(() => { setPlan("free"); setPlanLoading(false); });
  }, []);

  useEffect(() => {
    fetch("/api/ghostwriter")
      .then((r) => r.json())
      .then((d) => { setGhostStyle(d.style ?? null); setGhostLoading(false); })
      .catch(() => { setGhostStyle(null); setGhostLoading(false); });
  }, []);

  async function handleAnalyzeStyle() {
    const filled = sampleEmails.filter((s) => s.trim());
    if (filled.length < 3) {
      setGhostError("Please provide at least 3 sample emails.");
      return;
    }
    setAnalyzing(true);
    setGhostError(null);
    try {
      const res = await fetch("/api/ghostwriter/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sample_emails: filled }),
      });
      const data = await res.json() as { ok?: boolean; style?: GhostStyle; error?: string };
      if (!res.ok) {
        setGhostError(data.error ?? "Analysis failed");
      } else if (data.style) {
        setGhostStyle(data.style);
        setIsRetraining(false);
        setSampleEmails(["", "", "", "", ""]);
      }
    } catch {
      setGhostError("Network error — please try again.");
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleRemoveStyle() {
    try {
      const res = await fetch("/api/ghostwriter", { method: "DELETE" });
      if (res.ok) {
        setGhostStyle(null);
        setIsRetraining(false);
        setSampleEmails(["", "", "", "", ""]);
      }
    } catch {
      // silent
    }
  }

  const isAgency = plan === "agency";
  const showGhostForm = isAgency && (!ghostStyle || isRetraining);
  const showGhostActive = isAgency && ghostStyle && !isRetraining;

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      {/* Header */}
      <header style={{
        padding: "0 32px", height: 68,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        backgroundColor: "rgba(6,6,6,0.85)", backdropFilter: "blur(12px)",
        position: "sticky", top: 0, zIndex: 30, gap: 16,
      }}>
        <div>
          <h1 style={{
            fontSize: 17, fontWeight: 800, color: "#fff",
            fontFamily: "var(--font-syne)", margin: 0, lineHeight: 1.2,
          }}>
            Ghost Writer
          </h1>
          <p style={{
            fontSize: 12, color: "rgba(255,255,255,0.35)",
            fontFamily: "var(--font-outfit)", margin: 0, marginTop: 2,
          }}>
            AI learns your writing style and uses it for all campaigns
          </p>
        </div>
        {!planLoading && isAgency && (
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
      </header>

      {/* Main */}
      <main style={{ flex: 1, padding: "40px 32px 64px", maxWidth: 680, width: "100%" }}>

        {planLoading ? (
          <div style={{ color: "rgba(255,255,255,0.25)", fontFamily: "var(--font-outfit)", fontSize: 13 }}>Loading…</div>
        ) : !isAgency ? (
          /* ── Upgrade gate ── */
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            minHeight: 400, textAlign: "center", gap: 20,
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: "50%",
              backgroundColor: "rgba(167,139,250,0.1)",
              border: "1px solid rgba(167,139,250,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#a78bfa",
            }}>
              <IconLock />
            </div>
            <div>
              <h2 style={{
                fontSize: 20, fontWeight: 800, color: "#fff",
                fontFamily: "var(--font-syne)", marginBottom: 8,
              }}>
                Upgrade to Agency to unlock Ghost Writer Mode
              </h2>
              <p style={{
                fontSize: 14, color: "rgba(255,255,255,0.4)",
                fontFamily: "var(--font-outfit)", lineHeight: 1.6, maxWidth: 400,
              }}>
                Train AI to write in your exact voice — tone, vocabulary, sentence structure, and all. Every campaign will sound like you wrote it personally.
              </p>
            </div>
            <Link
              href="/dashboard/settings"
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "12px 28px", backgroundColor: "#a78bfa", color: "#fff",
                borderRadius: 10, fontSize: 14, fontWeight: 700,
                fontFamily: "var(--font-outfit)", textDecoration: "none",
              }}
            >
              See Plans →
            </Link>
          </div>
        ) : (
          /* ── Agency content ── */
          <div>
            {/* Status row */}
            <div style={{
              display: "flex", gap: 12, marginBottom: 32, flexWrap: "wrap",
            }}>
              <div style={{
                flex: 1, minWidth: 160,
                backgroundColor: "#0e0e0e",
                border: `1px solid ${showGhostActive ? "rgba(74,222,128,0.2)" : "rgba(255,255,255,0.07)"}`,
                borderRadius: 12, padding: "16px 18px",
              }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6, fontFamily: "var(--font-outfit)" }}>
                  Style Status
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {showGhostActive ? (
                    <>
                      <span style={{ color: "#4ade80" }}><IconCheck /></span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#4ade80", fontFamily: "var(--font-syne)" }}>Active</span>
                    </>
                  ) : (
                    <span style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.3)", fontFamily: "var(--font-syne)" }}>Not configured</span>
                  )}
                </div>
              </div>
              <div style={{
                flex: 1, minWidth: 160,
                backgroundColor: "#0e0e0e",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 12, padding: "16px 18px",
              }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6, fontFamily: "var(--font-outfit)" }}>
                  Used In
                </p>
                <span style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.5)", fontFamily: "var(--font-syne)" }}>All Campaigns</span>
              </div>
            </div>

            {ghostLoading ? (
              <div style={{ padding: "20px 0", color: "rgba(255,255,255,0.3)", fontFamily: "var(--font-outfit)", fontSize: 13 }}>
                Loading…
              </div>
            ) : showGhostActive ? (
              /* ── Active state ── */
              <div>
                <p style={{
                  fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
                  color: "rgba(255,255,255,0.25)", fontFamily: "var(--font-outfit)", marginBottom: 12,
                }}>
                  Your Writing Style
                </p>
                <div style={{
                  backgroundColor: "#0e0e0e",
                  border: "1px solid rgba(167,139,250,0.2)",
                  borderRadius: 14, padding: "24px 22px", marginBottom: 24,
                }}>
                  <div style={{
                    padding: "16px", borderRadius: 10,
                    backgroundColor: "rgba(167,139,250,0.05)",
                    border: "1px solid rgba(167,139,250,0.15)",
                    marginBottom: 16,
                  }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(167,139,250,0.6)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8, fontFamily: "var(--font-outfit)" }}>
                      Style Guide
                    </p>
                    <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", fontFamily: "var(--font-outfit)", lineHeight: 1.7 }}>
                      {ghostStyle?.style_summary}
                    </p>
                  </div>
                  {ghostStyle?.tone_keywords && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 20 }}>
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
                        padding: "9px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600,
                        fontFamily: "var(--font-outfit)", cursor: "pointer",
                        backgroundColor: "rgba(167,139,250,0.1)",
                        color: "#a78bfa",
                        border: "1px solid rgba(167,139,250,0.25)",
                      }}
                    >
                      🔄 Retrain
                    </button>
                    <button
                      onClick={handleRemoveStyle}
                      style={{
                        padding: "9px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600,
                        fontFamily: "var(--font-outfit)", cursor: "pointer",
                        backgroundColor: "rgba(239,68,68,0.07)",
                        color: "rgba(239,68,68,0.7)",
                        border: "1px solid rgba(239,68,68,0.2)",
                      }}
                    >
                      🗑️ Remove Style
                    </button>
                  </div>
                </div>
              </div>
            ) : showGhostForm ? (
              /* ── Training form ── */
              <div>
                <p style={{
                  fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
                  color: "rgba(255,255,255,0.25)", fontFamily: "var(--font-outfit)", marginBottom: 12,
                }}>
                  Train Your Style
                </p>
                <div style={{
                  backgroundColor: "#0e0e0e",
                  border: "1px solid rgba(167,139,250,0.15)",
                  borderRadius: 14, padding: "24px 22px",
                }}>
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", fontFamily: "var(--font-outfit)", lineHeight: 1.6, marginBottom: 24 }}>
                    Paste 3–5 emails <strong style={{ color: "rgba(255,255,255,0.7)" }}>you have written</strong> so AI can learn your style. The more samples, the better.
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 18 }}>
                    {sampleEmails.map((val, i) => (
                      <div key={i}>
                        <label style={{
                          fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.35)",
                          textTransform: "uppercase", letterSpacing: "0.07em",
                          display: "block", marginBottom: 6, fontFamily: "var(--font-outfit)",
                        }}>
                          Sample email {i + 1}{i < 3 ? " *" : " (optional)"}
                        </label>
                        <textarea
                          value={val}
                          onChange={(e) => setSampleEmails((prev) => prev.map((v, j) => j === i ? e.target.value : v))}
                          placeholder={`Paste an email you wrote${i === 0 ? " — subject + body works best" : ""}…`}
                          rows={4}
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
                      marginBottom: 16, padding: "9px 13px", borderRadius: 8,
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
                        padding: "11px 22px", borderRadius: 9,
                        backgroundColor: analyzing ? "rgba(167,139,250,0.4)" : "#a78bfa",
                        color: "#fff", border: "none",
                        fontSize: 14, fontWeight: 700, fontFamily: "var(--font-outfit)",
                        cursor: analyzing ? "not-allowed" : "pointer",
                        opacity: analyzing ? 0.8 : 1,
                      }}
                    >
                      {analyzing ? "Analyzing your style…" : "🤖 Analyze My Style"}
                    </button>
                    {isRetraining && (
                      <button
                        onClick={() => { setIsRetraining(false); setGhostError(null); }}
                        style={{
                          padding: "11px 18px", borderRadius: 9,
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
              </div>
            ) : null}
          </div>
        )}
      </main>
    </div>
  );
}
