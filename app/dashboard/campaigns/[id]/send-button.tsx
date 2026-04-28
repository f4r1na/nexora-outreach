"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Mail, Lock, Check, Loader2 } from "lucide-react";

type Props = {
  campaignId: string;
  campaignName: string;
  totalLeads: number;
  plan: string;
  gmailEmail: string | null;
  initialStatus: string;
  followUpDelays?: [number, number, number];
  followUpsEnabled?: boolean;
  primarySignalType?: string | null;
  sampleContactName?: string;
  sampleCompanyName?: string;
};

type SendState =
  | { phase: "idle" }
  | { phase: "template-picking" }
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
  followUpDelays = [3, 5, 7],
  followUpsEnabled = true,
  primarySignalType = null,
  sampleContactName = "",
  sampleCompanyName = "",
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
        <Lock size={13} strokeWidth={1.75} aria-hidden="true" />
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
        <Mail size={13} strokeWidth={1.75} aria-hidden="true" />
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
        <Check size={13} strokeWidth={2} aria-hidden="true" />
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
              if (followUpsEnabled) {
                handleGenerateFollowups(followUpDelays);
              } else {
                setState({ phase: "followup_done", scheduled: 0 });
              }
            } else if (evt.type === "error") {
              setState({ phase: "error", message: evt.message });
            }
          } catch { /* malformed line */ }
        }
      }

      // If stream ended without a "done" event, transition anyway
      if ((state as SendState).phase === "sending") {
        void finalSent; void finalTotal;
        if (followUpsEnabled) {
          handleGenerateFollowups(followUpDelays);
        } else {
          setState({ phase: "followup_done", scheduled: 0 });
        }
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
          <Check size={13} strokeWidth={2} aria-hidden="true" />
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
          <div style={{ marginBottom: 24, color: "#FF5200" }}>
            <Loader2 size={36} strokeWidth={1.8} style={{ animation: "spin 1s linear infinite" }} aria-hidden="true" />
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
          <Check size={13} strokeWidth={2} aria-hidden="true" />
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
              <Check size={26} strokeWidth={2.2} aria-hidden="true" />
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
                View Follow-ups
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

  // ── Template picking ──────────────────────────────────────────────────────
  if (state.phase === "template-picking") {
    return (
      <div style={{
        position: "fixed", inset: 0, zIndex: 100,
        backgroundColor: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
      }}>
        <TemplatePicker
          campaignId={campaignId}
          signalType={primarySignalType}
          contactName={sampleContactName}
          companyName={sampleCompanyName}
          onSelect={() => setState({ phase: "confirming" })}
          onSkip={() => setState({ phase: "confirming" })}
        />
      </div>
    );
  }

  // ── Idle: show button + confirmation modal ────────────────────────────────
  return (
    <>
      <button
        onClick={() => setState({ phase: "template-picking" })}
        style={{
          display: "inline-flex", alignItems: "center", gap: 7,
          padding: "7px 16px", borderRadius: 8, fontSize: 13, fontWeight: 700,
          fontFamily: "var(--font-outfit)", cursor: "pointer",
          backgroundColor: "#FF5200", color: "#fff", border: "none",
        }}
      >
        <Mail size={13} strokeWidth={1.75} aria-hidden="true" />
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
              <Mail size={22} strokeWidth={1.75} aria-hidden="true" />
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
            <Mail size={18} strokeWidth={2} aria-hidden="true" />
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

// ─── Template Picker ──────────────────────────────────────────────────────────

type TemplateVariant = { id: string; tone: string; subject: string; body: string };

const TONE_LABELS: Record<string, string> = {
  formal: "Formal",
  casual: "Casual",
  urgent: "Urgent",
  "value-first": "Value-First",
  "social-proof": "Social Proof",
};

function TemplatePicker({
  campaignId,
  signalType,
  contactName,
  companyName,
  onSelect,
  onSkip,
}: {
  campaignId: string;
  signalType: string | null;
  contactName: string;
  companyName: string;
  onSelect: () => void;
  onSkip: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [templates, setTemplates] = useState<TemplateVariant[]>([]);
  const [activeTone, setActiveTone] = useState<string>("");
  const [subjects, setSubjects] = useState<string[]>([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const activeTemplate = templates.find((t) => t.tone === activeTone) ?? null;

  useEffect(() => {
    async function generate() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/templates/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            campaign_id: campaignId,
            signal_type: signalType ?? "general",
            contact_name: contactName,
            company_name: companyName,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Generation failed");
        const tmpl: TemplateVariant[] = data.templates ?? [];
        setTemplates(tmpl);
        if (tmpl.length > 0) {
          setActiveTone(tmpl[0].tone);
          setSelectedSubject(tmpl[0].subject);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to generate templates");
      } finally {
        setLoading(false);
      }
    }
    void generate();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeTemplate) setSelectedSubject(activeTemplate.subject);
    setSubjects([]);
  }, [activeTone, activeTemplate]);

  async function loadSubjects() {
    if (!activeTemplate) return;
    setSubjectsLoading(true);
    try {
      const res = await fetch("/api/templates/generate-subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signal_type: signalType ?? "general",
          tone: activeTone,
          email_body: activeTemplate.body,
          company_name: companyName,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setSubjects(data.subjects ?? []);
    } catch {
      // silently fail — user still has the default subject
    } finally {
      setSubjectsLoading(false);
    }
  }

  async function handleUse() {
    if (!activeTemplate) return;
    setSaving(true);
    try {
      await fetch(`/api/campaigns/${campaignId}/template`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selected_template_id: activeTemplate.id,
          selected_subject_line: selectedSubject || activeTemplate.subject,
        }),
      });
    } finally {
      setSaving(false);
    }
    onSelect();
  }

  if (loading) {
    return (
      <div style={{
        backgroundColor: "#0e0e0e", border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 16, padding: "48px 32px",
        maxWidth: 560, width: "100%", textAlign: "center",
      }}>
        <Loader2
          size={32}
          strokeWidth={1.8}
          style={{ animation: "spin 1s linear infinite", color: "#FF5200", marginBottom: 16 }}
          aria-hidden="true"
        />
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", fontFamily: "var(--font-outfit)" }}>
          Writing 5 template variants…
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        backgroundColor: "#0e0e0e", border: "1px solid rgba(239,68,68,0.2)",
        borderRadius: 16, padding: "36px 28px",
        maxWidth: 420, width: "100%", textAlign: "center",
      }}>
        <p style={{ fontSize: 14, color: "#ef4444", fontFamily: "var(--font-outfit)", marginBottom: 20 }}>
          {error}
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button
            onClick={onSkip}
            style={{
              padding: "10px 20px", borderRadius: 8,
              backgroundColor: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.6)",
              border: "1px solid rgba(255,255,255,0.1)",
              fontSize: 13, fontFamily: "var(--font-outfit)", cursor: "pointer",
            }}
          >
            Skip Templates
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: "#0e0e0e", border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 16, padding: "28px 28px 24px",
      maxWidth: 600, width: "100%",
      boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
      maxHeight: "90vh", overflowY: "auto",
    }}>
      <div style={{ marginBottom: 20 }}>
        <p style={{
          fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase",
          color: "#FF5200", fontFamily: "var(--font-outfit)", marginBottom: 6,
        }}>
          Template Picker
        </p>
        <h2 style={{ fontSize: 17, fontWeight: 800, color: "#fff", fontFamily: "var(--font-syne)", marginBottom: 4 }}>
          Choose a tone for this campaign
        </h2>
        <p style={{ fontSize: 12.5, color: "rgba(255,255,255,0.4)", fontFamily: "var(--font-outfit)" }}>
          {signalType ? `Signal: ${signalType}` : "General outreach"} — placeholders like {"{first_name}"} are filled per lead at send time
        </p>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 18, flexWrap: "wrap" }}>
        {templates.map((t) => (
          <button
            key={t.tone}
            onClick={() => setActiveTone(t.tone)}
            style={{
              padding: "5px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600,
              fontFamily: "var(--font-outfit)", cursor: "pointer",
              backgroundColor: activeTone === t.tone ? "#FF5200" : "rgba(255,255,255,0.05)",
              color: activeTone === t.tone ? "#fff" : "rgba(255,255,255,0.5)",
              border: activeTone === t.tone ? "1px solid #FF5200" : "1px solid rgba(255,255,255,0.08)",
              transition: "all 0.15s",
            }}
          >
            {TONE_LABELS[t.tone] ?? t.tone}
          </button>
        ))}
      </div>

      {activeTemplate && (
        <div style={{
          backgroundColor: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 10, padding: "14px 16px", marginBottom: 18,
        }}>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "var(--font-outfit)", marginBottom: 6, letterSpacing: "0.06em", textTransform: "uppercase" }}>
            Subject (selected)
          </p>
          <p style={{ fontSize: 13.5, fontWeight: 600, color: "#fff", fontFamily: "var(--font-outfit)", marginBottom: 14 }}>
            {selectedSubject || activeTemplate.subject}
          </p>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "var(--font-outfit)", marginBottom: 6, letterSpacing: "0.06em", textTransform: "uppercase" }}>
            Body
          </p>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", fontFamily: "var(--font-outfit)", lineHeight: 1.65, whiteSpace: "pre-wrap" }}>
            {activeTemplate.body}
          </p>
        </div>
      )}

      <div style={{ marginBottom: 22 }}>
        {subjects.length === 0 ? (
          <button
            onClick={loadSubjects}
            disabled={subjectsLoading}
            style={{
              padding: "6px 14px", borderRadius: 7, fontSize: 12, fontWeight: 600,
              fontFamily: "var(--font-outfit)", cursor: subjectsLoading ? "default" : "pointer",
              backgroundColor: "rgba(255,255,255,0.04)",
              color: subjectsLoading ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.55)",
              border: "1px solid rgba(255,255,255,0.09)",
            }}
          >
            {subjectsLoading ? "Generating subjects…" : "+ Get 3 subject variations"}
          </button>
        ) : (
          <div>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "var(--font-outfit)", marginBottom: 8, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              Subject variations
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {subjects.map((s) => (
                <label
                  key={s}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "8px 12px", borderRadius: 8, cursor: "pointer",
                    backgroundColor: selectedSubject === s ? "rgba(255,82,0,0.06)" : "rgba(255,255,255,0.02)",
                    border: selectedSubject === s ? "1px solid rgba(255,82,0,0.25)" : "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <input
                    type="radio"
                    name="subject"
                    value={s}
                    checked={selectedSubject === s}
                    onChange={() => setSelectedSubject(s)}
                    style={{ accentColor: "#FF5200", flexShrink: 0 }}
                  />
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", fontFamily: "var(--font-outfit)" }}>
                    {s}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <button
          onClick={handleUse}
          disabled={saving || !activeTemplate}
          style={{
            flex: 1, padding: "11px 0", borderRadius: 9,
            backgroundColor: saving ? "rgba(255,82,0,0.5)" : "#FF5200",
            color: "#fff", border: "none",
            fontSize: 14, fontWeight: 700, fontFamily: "var(--font-outfit)",
            cursor: saving ? "default" : "pointer",
          }}
        >
          {saving ? "Saving…" : "Use This Template"}
        </button>
        <button
          onClick={onSkip}
          style={{
            padding: "11px 16px", borderRadius: 9,
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
