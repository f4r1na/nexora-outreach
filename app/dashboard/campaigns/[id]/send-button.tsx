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
  | { phase: "done"; sent: number; total: number; failures: string[] }
  | { phase: "error"; message: string };

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
      <Link
        href="/dashboard/settings"
        style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "7px 14px", borderRadius: 8, fontSize: 12.5, fontWeight: 600,
          fontFamily: "var(--font-outfit)", textDecoration: "none",
          backgroundColor: "rgba(255,255,255,0.05)",
          color: "rgba(255,255,255,0.35)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <LockIcon />
        Upgrade to Send
      </Link>
    );
  }

  // ── Gate: No Gmail connected ──────────────────────────────────────────────
  if (!gmailEmail) {
    return (
      <Link
        href="/dashboard/settings"
        style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "7px 14px", borderRadius: 8, fontSize: 12.5, fontWeight: 600,
          fontFamily: "var(--font-outfit)", textDecoration: "none",
          backgroundColor: "rgba(255,255,255,0.05)",
          color: "rgba(255,255,255,0.35)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
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
            } else if (evt.type === "progress") {
              setState({ phase: "sending", sent: evt.sent, total: evt.total, currentTo: evt.to });
            } else if (evt.type === "done") {
              setState({ phase: "done", sent: evt.sent, total: evt.total, failures: evt.failures ?? [] });
            } else if (evt.type === "error") {
              setState({ phase: "error", message: evt.message });
            }
          } catch {
            // malformed line — skip
          }
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

  // ── Done ──────────────────────────────────────────────────────────────────
  if (state.phase === "done") {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "7px 14px", borderRadius: 8, fontSize: 12.5, fontWeight: 600,
          fontFamily: "var(--font-outfit)",
          backgroundColor: "rgba(74,222,128,0.1)",
          color: "#4ade80",
          border: "1px solid rgba(74,222,128,0.2)",
        }}>
          <CheckIcon />
          {state.failures.length === 0
            ? `All ${state.sent} emails sent!`
            : `${state.sent} sent, ${state.failures.length} failed`}
        </span>
      </div>
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

      {/* Confirmation modal */}
      {state.phase === "confirming" && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 100,
          backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 24,
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

            <h2 style={{
              fontSize: 18, fontWeight: 800, color: "#fff",
              fontFamily: "var(--font-syne)", marginBottom: 8,
            }}>
              Send {totalLeads} email{totalLeads !== 1 ? "s" : ""}?
            </h2>
            <p style={{
              fontSize: 13, color: "rgba(255,255,255,0.45)",
              fontFamily: "var(--font-outfit)", lineHeight: 1.6, marginBottom: 6,
            }}>
              Campaign: <span style={{ color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>{campaignName}</span>
            </p>
            <p style={{
              fontSize: 13, color: "rgba(255,255,255,0.45)",
              fontFamily: "var(--font-outfit)", lineHeight: 1.6, marginBottom: 28,
            }}>
              From: <span style={{ color: "#FF5200", fontWeight: 600 }}>{gmailEmail}</span>
            </p>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={handleSend}
                style={{
                  flex: 1, padding: "11px 0", borderRadius: 9,
                  backgroundColor: "#FF5200", color: "#fff", border: "none",
                  fontSize: 14, fontWeight: 700, fontFamily: "var(--font-outfit)",
                  cursor: "pointer",
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
                  fontSize: 14, fontWeight: 600, fontFamily: "var(--font-outfit)",
                  cursor: "pointer",
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
