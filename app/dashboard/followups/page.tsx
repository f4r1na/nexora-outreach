"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

type Sequence = {
  id: string;
  follow_up_number: number;
  delay_days: number;
  status: string;
  created_at: string;
  scheduled: number;
  sent: number;
  skipped: number;
  failed: number;
  next_at: string | null;
};

type CampaignWithSeqs = {
  id: string;
  name: string;
  lead_count: number;
  sequences: Sequence[];
};

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconLock() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const FOLLOWUP_LABELS: Record<number, { title: string; desc: string }> = {
  1: { title: "Follow-up #1", desc: "Friendly bump" },
  2: { title: "Follow-up #2", desc: "Different angle" },
  3: { title: "Follow-up #3", desc: "Graceful breakup" },
};

const STATUS_COLOR: Record<string, { color: string; bg: string; border: string }> = {
  ready:      { color: "#4ade80", bg: "rgba(74,222,128,0.08)",  border: "rgba(74,222,128,0.2)" },
  generating: { color: "#facc15", bg: "rgba(250,204,21,0.08)",  border: "rgba(250,204,21,0.2)" },
  paused:     { color: "#94a3b8", bg: "rgba(148,163,184,0.08)", border: "rgba(148,163,184,0.2)" },
  cancelled:  { color: "#ef4444", bg: "rgba(239,68,68,0.08)",   border: "rgba(239,68,68,0.2)" },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatRelative(iso: string) {
  const diff = new Date(iso).getTime() - Date.now();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days < 0) return "overdue";
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  return `in ${days} days`;
}

// ─── Sequence Row ─────────────────────────────────────────────────────────────

function SequenceRow({
  seq,
  onAction,
}: {
  seq: Sequence;
  onAction: (seqId: string, action: "pause" | "resume" | "cancel") => void;
}) {
  const label = FOLLOWUP_LABELS[seq.follow_up_number] ?? { title: `Follow-up #${seq.follow_up_number}`, desc: "" };
  const statusStyle = STATUS_COLOR[seq.status] ?? STATUS_COLOR.ready;
  const total = seq.scheduled + seq.sent + seq.skipped + seq.failed;

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 14,
      padding: "13px 16px",
      borderTop: "1px solid rgba(255,255,255,0.05)",
    }}>
      {/* Number badge */}
      <span style={{
        width: 28, height: 28, borderRadius: 7, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 12, fontWeight: 800, fontFamily: "var(--font-syne)",
        backgroundColor: "rgba(255,82,0,0.1)", color: "#FF5200",
        border: "1px solid rgba(255,82,0,0.2)",
      }}>
        {seq.follow_up_number}
      </span>

      {/* Label */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", fontFamily: "var(--font-outfit)" }}>
          {label.title}
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginLeft: 6 }}>{label.desc}</span>
        </div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "var(--font-outfit)", marginTop: 2 }}>
          After {seq.delay_days} day{seq.delay_days !== 1 ? "s" : ""}
          {seq.next_at && seq.scheduled > 0 && (
            <span style={{ marginLeft: 8, color: "rgba(255,82,0,0.6)" }}>
              • Next send {formatRelative(seq.next_at)} ({formatDate(seq.next_at)})
            </span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: 12, flexShrink: 0 }}>
        <StatPill label="Scheduled" count={seq.scheduled} color="rgba(255,255,255,0.5)" />
        <StatPill label="Sent" count={seq.sent} color="#4ade80" />
        <StatPill label="Skipped" count={seq.skipped} color="#94a3b8" />
      </div>

      {/* Status badge */}
      <span style={{
        fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 5,
        color: statusStyle.color, backgroundColor: statusStyle.bg,
        border: `1px solid ${statusStyle.border}`,
        fontFamily: "var(--font-outfit)", letterSpacing: "0.04em",
        flexShrink: 0, textTransform: "capitalize",
      }}>
        {seq.status}
      </span>

      {/* Actions */}
      {total > 0 && seq.status !== "cancelled" && (
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          {seq.status === "ready" && seq.scheduled > 0 && (
            <ActionBtn label="Pause" onClick={() => onAction(seq.id, "pause")} color="rgba(148,163,184,0.7)" />
          )}
          {seq.status === "paused" && (
            <ActionBtn label="Resume" onClick={() => onAction(seq.id, "resume")} color="#4ade80" />
          )}
          {seq.scheduled > 0 && (
            <ActionBtn label="Cancel" onClick={() => onAction(seq.id, "cancel")} color="#ef4444" />
          )}
        </div>
      )}
    </div>
  );
}

function StatPill({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 14, fontWeight: 700, color, fontFamily: "var(--font-syne)" }}>{count}</div>
      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", fontFamily: "var(--font-outfit)" }}>{label}</div>
    </div>
  );
}

function ActionBtn({ label, onClick, color }: { label: string; onClick: () => void; color: string }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600,
        backgroundColor: "transparent", color, cursor: "pointer",
        border: `1px solid ${color}40`,
        fontFamily: "var(--font-outfit)", transition: "all 0.15s",
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = `${color}15`; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; }}
    >
      {label}
    </button>
  );
}

// ─── Campaign Card ────────────────────────────────────────────────────────────

function CampaignCard({
  campaign,
  onAction,
}: {
  campaign: CampaignWithSeqs;
  onAction: (seqId: string, action: "pause" | "resume" | "cancel") => void;
}) {
  const [expanded, setExpanded] = useState(true);

  const totalScheduled = campaign.sequences.reduce((s, seq) => s + seq.scheduled, 0);
  const totalSent = campaign.sequences.reduce((s, seq) => s + seq.sent, 0);
  const allDone = campaign.sequences.every((s) => s.scheduled === 0 || s.status === "cancelled");

  return (
    <div style={{
      backgroundColor: "#0e0e0e",
      border: "1px solid rgba(255,255,255,0.07)",
      borderLeft: "3px solid rgba(255,82,0,0.4)",
      borderRadius: 10,
      overflow: "hidden",
    }}>
      {/* Campaign header */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: "100%", background: "none", border: "none", cursor: "pointer",
          padding: "16px 18px",
          display: "flex", alignItems: "center", gap: 14, textAlign: "left",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 3 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#fff", fontFamily: "var(--font-syne)", margin: 0 }}>
              {campaign.name}
            </p>
            {allDone && (
              <span style={{
                fontSize: 10, fontWeight: 700, color: "#4ade80",
                backgroundColor: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.2)",
                padding: "2px 7px", borderRadius: 4, fontFamily: "var(--font-outfit)",
              }}>
                Complete
              </span>
            )}
          </div>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "var(--font-outfit)", margin: 0 }}>
            {campaign.lead_count} lead{campaign.lead_count !== 1 ? "s" : ""} · {totalSent} sent · {totalScheduled} remaining
          </p>
        </div>
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2"
          style={{ transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.2s", flexShrink: 0 }}
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {expanded && (
        <div>
          {campaign.sequences
            .sort((a, b) => a.follow_up_number - b.follow_up_number)
            .map((seq) => (
              <SequenceRow key={seq.id} seq={seq} onAction={onAction} />
            ))}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FollowupsPage() {
  const [plan, setPlan] = useState<string | null>(null);
  const [planLoading, setPlanLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<CampaignWithSeqs[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ sent: number; skipped: number; failed: number } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/subscription")
      .then((r) => r.json())
      .then((d) => { setPlan(d.subscription?.plan ?? "free"); setPlanLoading(false); })
      .catch(() => { setPlan("free"); setPlanLoading(false); });
  }, []);

  function loadData() {
    setLoading(true);
    fetch("/api/followups/list")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setCampaigns(d.campaigns ?? []);
        setLoading(false);
      })
      .catch(() => { setError("Failed to load follow-ups"); setLoading(false); });
  }

  useEffect(loadData, []);

  const isProOrAgency = plan === "pro" || plan === "agency";

  async function handleSendNow() {
    setSending(true);
    setSendResult(null);
    setActionError(null);
    try {
      const res = await fetch("/api/followups/send", { method: "POST" });
      const data = await res.json();
      if (!res.ok) { setActionError(data.error ?? "Failed to send"); return; }
      setSendResult(data);
      loadData();
    } catch {
      setActionError("Network error. Please try again.");
    } finally {
      setSending(false);
    }
  }

  async function handleAction(seqId: string, action: "pause" | "resume" | "cancel") {
    setActionError(null);
    const confirmMsg = action === "cancel"
      ? "Cancel all remaining scheduled follow-ups for this sequence?"
      : action === "pause"
      ? "Pause this follow-up sequence?"
      : "Resume this follow-up sequence?";
    if (!confirm(confirmMsg)) return;

    const res = await fetch("/api/followups/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sequence_id: seqId, action }),
    });
    const data = await res.json();
    if (!res.ok) { setActionError(data.error ?? "Action failed"); return; }
    loadData();
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      {/* Header */}
      <header style={{
        padding: "0 32px", height: 68,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: "1px solid rgba(255,255,255,0.055)",
        backgroundColor: "rgba(6,6,6,0.94)", backdropFilter: "blur(12px)",
        position: "sticky", top: 0, zIndex: 30, gap: 16,
      }}>
        <div>
          <h1 style={{ fontSize: 16, fontWeight: 500, color: "#fff", fontFamily: "var(--font-syne)", margin: 0, lineHeight: 1, letterSpacing: "-0.02em" }}>
            Follow-up Sequences
          </h1>
          <p style={{ fontSize: 11, color: "#383838", fontFamily: "var(--font-outfit)", margin: 0, marginTop: 3 }}>
            Automatic follow-ups for leads who haven&apos;t replied
          </p>
        </div>
        {!planLoading && isProOrAgency && (
          <button
            onClick={handleSendNow}
            disabled={sending}
            style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              padding: "8px 16px", borderRadius: 7, fontSize: 12, fontWeight: 500,
              fontFamily: "var(--font-outfit)", cursor: sending ? "not-allowed" : "pointer",
              backgroundColor: sending ? "rgba(255,82,0,0.4)" : "#FF5200", color: "#fff", border: "none",
              transition: "background-color 0.15s",
            }}
          >
            {sending ? (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: "spin 1s linear infinite" }}>
                <path d="M21 12a9 9 0 11-6.219-8.56" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            )}
            {sending ? "Sending…" : "Send Due Now"}
          </button>
        )}
      </header>

      {/* Main */}
      <main style={{ flex: 1, padding: "36px 32px 64px" }}>
        {/* Action feedback */}
        {sendResult && (
          <div style={{
            marginBottom: 20, padding: "12px 16px", borderRadius: 10,
            backgroundColor: "rgba(74,222,128,0.07)", border: "1px solid rgba(74,222,128,0.2)",
            color: "#4ade80", fontSize: 13, fontFamily: "var(--font-outfit)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            Sent {sendResult.sent} · Skipped {sendResult.skipped} (already replied) · Failed {sendResult.failed}
            <button onClick={() => setSendResult(null)} style={{ background: "none", border: "none", color: "#4ade80", cursor: "pointer", fontSize: 16, lineHeight: 1 }}>×</button>
          </div>
        )}
        {actionError && (
          <div style={{
            marginBottom: 20, padding: "10px 14px", borderRadius: 9,
            backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
            color: "#f87171", fontSize: 13, fontFamily: "var(--font-outfit)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            {actionError}
            <button onClick={() => setActionError(null)} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", fontSize: 16, lineHeight: 1 }}>×</button>
          </div>
        )}

        {planLoading ? (
          <div style={{ color: "rgba(255,255,255,0.25)", fontFamily: "var(--font-outfit)", fontSize: 13 }}>Loading…</div>

        ) : !isProOrAgency ? (
          /* ── Upgrade gate ── */
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            minHeight: 420, textAlign: "center", gap: 20,
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: "50%",
              backgroundColor: "rgba(255,82,0,0.1)", border: "1px solid rgba(255,82,0,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center", color: "#FF5200",
            }}>
              <IconLock />
            </div>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: "#fff", fontFamily: "var(--font-syne)", marginBottom: 8 }}>
                Upgrade to Pro to unlock Follow-up Sequences
              </h2>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", fontFamily: "var(--font-outfit)", lineHeight: 1.6, maxWidth: 420 }}>
                AI generates 3 personalized follow-up emails per lead and sends them automatically to leads who haven&apos;t replied.
              </p>
            </div>
            <Link href="/dashboard/settings" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "12px 28px", backgroundColor: "#FF5200", color: "#fff",
              borderRadius: 10, fontSize: 14, fontWeight: 700,
              fontFamily: "var(--font-outfit)", textDecoration: "none",
            }}>
              See Plans →
            </Link>
          </div>

        ) : loading ? (
          <div style={{ color: "rgba(255,255,255,0.25)", fontFamily: "var(--font-outfit)", fontSize: 13 }}>Loading sequences…</div>

        ) : error ? (
          <div style={{
            padding: "12px 16px", borderRadius: 10,
            backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
            color: "#ef4444", fontFamily: "var(--font-outfit)", fontSize: 13,
          }}>
            {error}
          </div>

        ) : campaigns.length === 0 ? (
          /* ── Empty state ── */
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            minHeight: 420, textAlign: "center", gap: 16,
          }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, backgroundColor: "rgba(255,82,0,0.08)", border: "1px solid rgba(255,82,0,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,82,0,0.5)" }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M21 12a9 9 0 11-6 -8.5" /><polyline points="21 3 21 9 15 9" /></svg>
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#fff", fontFamily: "var(--font-syne)", margin: 0 }}>
              No follow-up sequences yet
            </h3>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", fontFamily: "var(--font-outfit)", maxWidth: 360, lineHeight: 1.6, margin: 0 }}>
              Send a campaign and choose to set up automatic follow-ups — AI will handle the rest.
            </p>
            <Link href="/dashboard/campaigns" style={{
              marginTop: 4, display: "inline-flex", alignItems: "center", gap: 7,
              padding: "9px 20px", backgroundColor: "#FF5200", color: "#fff",
              borderRadius: 8, fontSize: 13, fontWeight: 700,
              fontFamily: "var(--font-outfit)", textDecoration: "none",
            }}>
              View Campaigns →
            </Link>
          </div>

        ) : (
          /* ── Sequences list ── */
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", fontFamily: "var(--font-outfit)" }}>
                {campaigns.length} campaign{campaigns.length !== 1 ? "s" : ""} with follow-ups
              </span>
              <span style={{
                fontSize: 10, fontWeight: 700, color: "#FF5200",
                backgroundColor: "rgba(255,82,0,0.1)", border: "1px solid rgba(255,82,0,0.2)",
                padding: "2px 8px", borderRadius: 999, fontFamily: "var(--font-outfit)",
              }}>
                {campaigns.reduce((s, c) => s + c.sequences.reduce((ss, seq) => ss + seq.scheduled, 0), 0)} scheduled
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {campaigns.map((c) => (
                <CampaignCard key={c.id} campaign={c} onAction={handleAction} />
              ))}
            </div>
          </div>
        )}
      </main>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
