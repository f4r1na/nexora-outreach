"use client";

import { useState } from "react";
import Link from "next/link";

type Props = {
  campaignId: string;
  campaignName: string;
  totalLeads: number;
  plan: string;
  gmailEmail: string | null;
  initialStatus: string;
};

type SendState =
  | { phase: "idle" }
  | { phase: "confirming" }
  | { phase: "sending"; sent: number; total: number; currentTo: string }
  | { phase: "followup_setup"; sent: number; total: number; delays: [number, number, number] }
  | { phase: "followup_generating"; followupNum: number; leadIndex: number; totalLeads: number }
  | { phase: "followup_done"; scheduled: number }
  | { phase: "error"; message: string };

const FOLLOWUP_LABELS: Record<number, string> = {
  1: "Friendly bump",
  2: "Different angle",
  3: "Graceful breakup",
};

export default function SendCampaignButton({
  campaignId,
  campaignName,
  totalLeads,
  plan,
  gmailEmail,
  initialStatus,
}: Props) {
  const [state, setState] = useState<SendState>({ phase: "idle" });
  const isProOrAgency = plan === "pro" || plan === "agency";
  const alreadySent = initialStatus === "sent";

  // ── Gate: Free / Starter ──────────────────────────────────────────────────
  if (!isProOrAgency) {
    return (
      <Link href="/dashboard/settings" style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: "7px 14px", borderRadius: 8, fontSize: 12.5, fontWeight: 600,
        fontFamily: "var(--font-outfit)", textDecoration: "none",
        backgroundColor: "rgba(255,255,255,0.05)",
        color: "rgba(255,255,255,0.35)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}>
        <LockIcon />
        Upgrade to Send
      </Link>
    );
  }

  // ── Gate: No Gmail connected ──────────────────────────────────────────────
  if (!gmailEmail) {
    return (
      <Link href="/dashboard/settings" style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: "7px 14px", borderRadius: 8, fontSize: 12.5, fontWeight: 600,
        fontFamily: "var(--font-outfit)", textDecoration: "none",
        backgroundColor: "rgba(255,255,255,0.05)",
        color: "rgba(255,255,255,0.35)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}>
        <MailIcon />
        Connect Gmail to Send
      </Link>
    );
  }

  // ── Already sent ──────────────────────────────────────────────────────────
  if (alreadySent && state.phase === "idle") {
    return (
      <span style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: "7px 14px", borderRadius: 8, fontSize: 12.5, fontWeight: 600,
        fontFamily: "var(--font-outfit)",
        backgroundColor: "rgba(74,222,128,0.1)",
        color: "#4ade80",
        border: "1px solid rgba(74,222,128,0.2)",
      }}>
        <CheckIcon />
        Emails Sent
      </span>
    );
  }

  async function handleSend() {
    setState({ phase: "sending", sent: 0, total: totalLeads, currentTo: "" });
    try {
      const res = await fetch("/api/campaigns/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaign_id: campaignId }),
      });

      if (!res.ok || !res.body) {
        const text = await res.text().catch(() => "Unknown error");
        setState({ phase: "error", message: text });
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let finalSent = 0;
      let finalTotal = totalLeads;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const evt = JSON.parse(line);
            if (evt.type === "start") {
              setState({ phase: "sending", sent: 0, total: evt.total, currentTo: "" });
              finalTotal = evt.total;
            } else if (evt.type === "progress") {
              setState({ phase: "sending", sent: evt.sent, total: evt.total, currentTo: evt.to });
              finalSent = evt.sent;
            } else if (evt.type === "done") {
              finalSent = evt.sent;
              finalTotal = evt.total;
              setState({ phase: "followup_setup", sent: evt.sent, total: evt.total, delays: [3, 5, 7] });
            } else if (evt.type === "error") {
              setState({ phase: "error", message: evt.message });
            }
          } catch { /* malformed line */ }
        }
      }

      // If stream ended without a "done" event, transition anyway
      if ((state as SendState).phase === "sending") {
        setState({ phase: "followup_setup", sent: finalSent, total: finalTotal, delays: [3, 5, 7] });
      }
    } catch (err: unknown) {
      setState({ phase: "error", message: err instanceof Error ? err.message : "Network error" });
    }
  }

  async function handleGenerateFollowups(delays: [number, number, number]) {
    setState({ phase: "followup_generating", followupNum: 1, leadIndex: 0, totalLeads });

    try {
      const res = await fetch("/api/followups/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaign_id: campaignId, delays }),
      });

      if (!res.ok || !res.body) {
        const text = await res.text().catch(() => "Unknown error");
        setState({ phase: "error", message: text });
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const evt = JSON.parse(line);
            if (evt.type === "sequence_start") {
              setState({ phase: "followup_generating", followupNum: evt.followupNum, leadIndex: 0, totalLeads: evt.totalLeads });
            } else if (evt.type === "lead_done") {
              setState({ phase: "followup_generating", followupNum: evt.followupNum, leadIndex: evt.leadIndex, totalLeads: evt.totalLeads });
            } else if (evt.type === "done") {
              setState({ phase: "followup_done", scheduled: evt.scheduled });
            } else if (evt.type === "error") {
              setState({ phase: "error", message: evt.message });
            }
          } catch { /* malformed line */ }
        }
      }
    } catch (err: unknown) {
      setState({ phase: "error", message: err instanceof Error ? err.message : "Network error" });
    }
  }

  // ── Sending progress ──────────────────────────────────────────────────────
  if (state.phase === "sending") {
    const pct = state.total > 0 ? Math.round((state.sent / state.total) * 100) : 0;
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ minWidth: 160 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontFamily: "var(--font-outfit)" }}>
              Sending {state.sent} of {state.total}…
            </span>
            <span style={{ fontSize: 11, color: "#FF5200", fontFamily: "var(--font-outfit)", fontWeight: 700 }}>
              {pct}%
            </span>
          </div>
          <div style={{ height: 4, backgroundColor: "rgba(255,255,255,0.07)", borderRadius: 99, overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 99, backgroundColor: "#FF5200",
              width: `${pct}%`, transition: "width 0.4s ease",
            }} />
          </div>
        </div>
      </div>
    );
  }

  // ── Follow-up setup ───────────────────────────────────────────────────────
  if (state.phase === "followup_setup") {
    return (
      <>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "7px 14px", borderRadius: 8, fontSize: 12.5, fontWeight: 600,
          fontFamily: "var(--font-outfit)",
          backgroundColor: "rgba(74,222,128,0.1)",
          color: "#4ade80",
          border: "1px solid rgba(74,222,128,0.2)",
        }}>
          <CheckIcon />
          {state.sent} email{state.sent !== 1 ? "s" : ""} sent
        </span>

        {/* Follow-up modal */}
        <div style={{
          position: "fixed", inset: 0, zIndex: 100,
          backgroundColor: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
        }}>
          <FollowupSetupModal
            totalLeads={state.total}
            initialDelays={state.delays}
            onGenerate={(delays) => handleGenerateFollowups(delays)}
            onSkip={() => setState({ phase: "idle" })}
          />
        </div>
      </>
    );
  }

  // ── Follow-up generating ──────────────────────────────────────────────────
  if (state.phase === "followup_generating") {
    const pct = state.totalLeads > 0 ? Math.round((state.leadIndex / state.totalLeads) * 100) : 0;
    return (
      <div style={{
        position: "fixed", inset: 0, zIndex: 100,
        backgroundColor: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
      }}>
        <div style={{
          backgroundColor: "#0e0e0e", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 16, padding: "36px 32px",
          maxWidth: 420, width: "100%", textAlign: "center",
        }}>
          <div style={{ marginBottom: 24 }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#FF5200" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "spin 1.5s linear infinite" }}>
              <path d="M21 12a9 9 0 11-6.219-8.56" />
            </svg>
          </div>
          <h3 style={{ fontSize: 17, fontWeight: 800, color: "#fff", fontFamily: "var(--font-syne)", marginBottom: 8 }}>
            Generating Follow-up #{state.followupNum}
          </h3>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", fontFamily: "var(--font-outfit)", marginBottom: 20 }}>
            Writing for lead {state.leadIndex} of {state.totalLeads}…
          </p>
          <div style={{ height: 4, backgroundColor: "rgba(255,255,255,0.07)", borderRadius: 99, overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 99, backgroundColor: "#FF5200",
              width: `${pct}%`, transition: "width 0.3s ease",
            }} />
          </div>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", fontFamily: "var(--font-outfit)", marginTop: 10 }}>
            3 follow-up emails × {state.totalLeads} lead{state.totalLeads !== 1 ? "s" : ""}
          </p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Follow-up done ────────────────────────────────────────────────────────
  if (state.phase === "followup_done") {
    return (
      <>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "7px 14px", borderRadius: 8, fontSize: 12.5, fontWeight: 600,
          fontFamily: "var(--font-outfit)",
          backgroundColor: "rgba(74,222,128,0.1)",
          color: "#4ade80",
          border: "1px solid rgba(74,222,128,0.2)",
        }}>
          <CheckIcon />
          Emails Sent
        </span>

        <div style={{
          position: "fixed", inset: 0, zIndex: 100,
          backgroundColor: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
        }}>
          <div style={{
            backgroundColor: "#0e0e0e", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 16, padding: "40px 32px",
            maxWidth: 420, width: "100%", textAlign: "center",
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: 14,
              backgroundColor: "rgba(74,222,128,0.1)",
              border: "1px solid rgba(74,222,128,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#4ade80", margin: "0 auto 20px",
            }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: "#fff", fontFamily: "var(--font-syne)", marginBottom: 8 }}>
              Follow-ups Scheduled!
            </h3>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", fontFamily: "var(--font-outfit)", lineHeight: 1.6, marginBottom: 28 }}>
              {state.scheduled} follow-up email{state.scheduled !== 1 ? "s" : ""} scheduled — leads who don&apos;t reply will receive them automatically.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <Link
                href="/dashboard/followups"
                style={{
                  flex: 1, padding: "11px 0", borderRadius: 9, textAlign: "center",
                  backgroundColor: "#FF5200", color: "#fff", border: "none",
                  fontSize: 13, fontWeight: 700, fontFamily: "var(--font-outfit)",
                  textDecoration: "none", display: "block",
                }}
              >
                View Follow-ups →
              </Link>
              <button
                onClick={() => setState({ phase: "idle" })}
                style={{
                  flex: 1, padding: "11px 0", borderRadius: 9,
                  backgroundColor: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.6)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  fontSize: 13, fontWeight: 600, fontFamily: "var(--font-outfit)", cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (state.phase === "error") {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
          fontFamily: "var(--font-outfit)", maxWidth: 260,
          backgroundColor: "rgba(239,68,68,0.08)",
          color: "#ef4444",
          border: "1px solid rgba(239,68,68,0.2)",
        }}>
          {state.message}
        </span>
        <button
          onClick={() => setState({ phase: "idle" })}
          style={{
            padding: "7px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600,
            fontFamily: "var(--font-outfit)", cursor: "pointer",
            backgroundColor: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  // ── Idle: show button + confirmation modal ────────────────────────────────
  return (
    <>
      <button
        onClick={() => setState({ phase: "confirming" })}
        style={{
          display: "inline-flex", alignItems: "center", gap: 7,
          padding: "7px 16px", borderRadius: 8, fontSize: 13, fontWeight: 700,
          fontFamily: "var(--font-outfit)", cursor: "pointer",
          backgroundColor: "#FF5200", color: "#fff", border: "none",
        }}
      >
        <MailIcon />
        Send via Gmail
      </button>

      {state.phase === "confirming" && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 100,
          backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
        }}>
          <div style={{
            backgroundColor: "#0e0e0e",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 16, padding: "32px 28px",
            maxWidth: 420, width: "100%",
            boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              backgroundColor: "rgba(255,82,0,0.1)",
              border: "1px solid rgba(255,82,0,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#FF5200", marginBottom: 20,
            }}>
              <MailIcon size={22} />
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "#fff", fontFamily: "var(--font-syne)", marginBottom: 8 }}>
              Send {totalLeads} email{totalLeads !== 1 ? "s" : ""}?
            </h2>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", fontFamily: "var(--font-outfit)", lineHeight: 1.6, marginBottom: 6 }}>
              Campaign: <span style={{ color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>{campaignName}</span>
            </p>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", fontFamily: "var(--font-outfit)", lineHeight: 1.6, marginBottom: 28 }}>
              From: <span style={{ color: "#FF5200", fontWeight: 600 }}>{gmailEmail}</span>
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={handleSend}
                style={{
                  flex: 1, padding: "11px 0", borderRadius: 9,
                  backgroundColor: "#FF5200", color: "#fff", border: "none",
                  fontSize: 14, fontWeight: 700, fontFamily: "var(--font-outfit)", cursor: "pointer",
                }}
              >
                Send Now
              </button>
              <button
                onClick={() => setState({ phase: "idle" })}
                style={{
                  flex: 1, padding: "11px 0", borderRadius: 9,
                  backgroundColor: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.6)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  fontSize: 14, fontWeight: 600, fontFamily: "var(--font-outfit)", cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Follow-up Setup Modal ────────────────────────────────────────────────────

function FollowupSetupModal({
  totalLeads,
  initialDelays,
  onGenerate,
  onSkip,
}: {
  totalLeads: number;
  initialDelays: [number, number, number];
  onGenerate: (delays: [number, number, number]) => void;
  onSkip: () => void;
}) {
  const [delays, setDelays] = useState<[number, number, number]>(initialDelays);

  function setDelay(idx: number, val: number) {
    const next = [...delays] as [number, number, number];
    next[idx] = Math.max(1, Math.min(30, val));
    setDelays(next);
  }

  const totalEmails = totalLeads * 3;

  return (
    <div style={{
      backgroundColor: "#0e0e0e", border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 16, padding: "32px 28px",
      maxWidth: 460, width: "100%",
      boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
    }}>
      {/* Header */}
      <div style={{ marginBottom: 22 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            backgroundColor: "rgba(255,82,0,0.1)", border: "1px solid rgba(255,82,0,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center", color: "#FF5200", flexShrink: 0,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
          </div>
          <h2 style={{ fontSize: 17, fontWeight: 800, color: "#fff", fontFamily: "var(--font-syne)", margin: 0 }}>
            Set up auto follow-ups?
          </h2>
        </div>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", fontFamily: "var(--font-outfit)", lineHeight: 1.6, margin: 0 }}>
          AI will generate and send follow-ups automatically to leads who haven&apos;t replied. Costs {totalEmails} credits.
        </p>
      </div>

      {/* Sequence rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
        {([1, 2, 3] as const).map((num) => (
          <div key={num} style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "12px 14px", borderRadius: 10,
            backgroundColor: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}>
            <span style={{
              fontSize: 11, fontWeight: 700, color: "#FF5200",
              backgroundColor: "rgba(255,82,0,0.1)", border: "1px solid rgba(255,82,0,0.2)",
              padding: "2px 7px", borderRadius: 5, flexShrink: 0, fontFamily: "var(--font-outfit)",
            }}>
              #{num}
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", fontFamily: "var(--font-outfit)" }}>
                {FOLLOWUP_LABELS[num]}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
              <input
                type="number"
                min={1}
                max={30}
                value={delays[num - 1]}
                onChange={(e) => setDelay(num - 1, parseInt(e.target.value) || 1)}
                style={{
                  width: 44, padding: "4px 8px", textAlign: "center",
                  backgroundColor: "#060606", border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 6, color: "#fff", fontSize: 13,
                  fontFamily: "var(--font-outfit)", outline: "none",
                }}
              />
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", fontFamily: "var(--font-outfit)" }}>
                days after send
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <button
          onClick={() => onGenerate(delays)}
          style={{
            flex: 1, padding: "12px 0", borderRadius: 9,
            backgroundColor: "#FF5200", color: "#fff", border: "none",
            fontSize: 14, fontWeight: 700, fontFamily: "var(--font-outfit)", cursor: "pointer",
          }}
        >
          Generate &amp; Schedule Follow-ups
        </button>
        <button
          onClick={onSkip}
          style={{
            padding: "12px 16px", borderRadius: 9,
            backgroundColor: "transparent", color: "rgba(255,255,255,0.35)",
            border: "1px solid rgba(255,255,255,0.08)",
            fontSize: 13, fontFamily: "var(--font-outfit)", cursor: "pointer", whiteSpace: "nowrap",
          }}
        >
          Skip
        </button>
      </div>
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function MailIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 13l4 4L19 7" />
    </svg>
  );
}
