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

function formatRelative(iso: string) {
  const diff = new Date(iso).getTime() - Date.now();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days < 0) return "overdue";
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  return `in ${days} days`;
}

// ─── Components ───────────────────────────────────────────────────────────────

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
        fontFamily: "var(--font-outfit)",
      }}
    >
      {label}
    </button>
  );
}

function SequenceRow({
  seq,
  onAction,
}: {
  seq: Sequence;
  onAction: (seqId: string, action: "pause" | "resume" | "cancel") => void;
}) {
  const label = FOLLOWUP_LABELS[seq.follow_up_number] ?? { title: `Follow-up #${seq.follow_up_number}`, desc: "" };
  const statusStyle = STATUS_COLOR[seq.status] ?? STATUS_COLOR.ready;

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 14,
      padding: "14px 20px",
      borderTop: "1px solid rgba(255,255,255,0.05)",
    }}>
      <span style={{
        width: 28, height: 28, borderRadius: 7, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 12, fontWeight: 800, fontFamily: "var(--font-syne)",
        backgroundColor: "rgba(255,82,0,0.1)", color: "#FF5200",
        border: "1px solid rgba(255,82,0,0.2)",
      }}>
        {seq.follow_up_number}
      </span>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", fontFamily: "var(--font-outfit)" }}>
          {label.title}
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginLeft: 6 }}>{label.desc}</span>
        </div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "var(--font-outfit)", marginTop: 2 }}>
          After {seq.delay_days} day{seq.delay_days !== 1 ? "s" : ""}
          {seq.next_at && seq.scheduled > 0 && (
            <span style={{ marginLeft: 8, color: "rgba(255,82,0,0.6)" }}>
              · Next send {formatRelative(seq.next_at)}
            </span>
          )}
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, flexShrink: 0 }}>
        <StatPill label="Scheduled" count={seq.scheduled} color="rgba(255,255,255,0.5)" />
        <StatPill label="Sent" count={seq.sent} color="#4ade80" />
        <StatPill label="Skipped" count={seq.skipped} color="#94a3b8" />
      </div>

      <span style={{
        fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 5,
        color: statusStyle.color, backgroundColor: statusStyle.bg,
        border: `1px solid ${statusStyle.border}`,
        fontFamily: "var(--font-outfit)", letterSpacing: "0.04em",
        flexShrink: 0, textTransform: "capitalize",
      }}>
        {seq.status}
      </span>

      {seq.status !== "cancelled" && (
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

// ─── Main component ───────────────────────────────────────────────────────────

export default function FollowUpsTab({
  campaignId,
  plan,
}: {
  campaignId: string;
  plan: string;
}) {
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const isProOrAgency = plan === "pro" || plan === "agency";

  function loadData() {
    setLoading(true);
    fetch("/api/followups/list")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) { setError(d.error); setLoading(false); return; }
        const match = (d.campaigns as CampaignWithSeqs[]).find((c) => c.id === campaignId);
        setSequences(match?.sequences ?? []);
        setLoading(false);
      })
      .catch(() => { setError("Failed to load follow-ups"); setLoading(false); });
  }

  useEffect(loadData, [campaignId]);

  async function handleAction(seqId: string, action: "pause" | "resume" | "cancel") {
    setActionError(null);
    const confirmMsg =
      action === "cancel" ? "Cancel all remaining follow-ups for this sequence?" :
      action === "pause"  ? "Pause this follow-up sequence?" :
      "Resume this follow-up sequence?";
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

  if (!isProOrAgency) {
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", padding: "80px 0", textAlign: "center", gap: 16,
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: 14,
          backgroundColor: "rgba(255,82,0,0.08)",
          border: "1px solid rgba(255,82,0,0.15)",
          display: "flex", alignItems: "center", justifyContent: "center", color: "#FF5200",
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
        </div>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: "#fff", fontFamily: "var(--font-syne)", margin: 0 }}>
          Upgrade to Pro to unlock Follow-up Sequences
        </h3>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", fontFamily: "var(--font-outfit)", maxWidth: 360, lineHeight: 1.6, margin: 0 }}>
          AI generates 3 personalized follow-up emails per lead and sends them automatically.
        </p>
        <Link href="/dashboard/settings" style={{
          display: "inline-flex", alignItems: "center", gap: 7,
          padding: "9px 20px", backgroundColor: "#FF5200", color: "#fff",
          borderRadius: 8, fontSize: 13, fontWeight: 700,
          fontFamily: "var(--font-outfit)", textDecoration: "none",
        }}>
          See Plans
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: "40px 0", color: "rgba(255,255,255,0.25)", fontFamily: "var(--font-outfit)", fontSize: 13 }}>
        Loading sequences…
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        padding: "12px 16px", borderRadius: 10,
        backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
        color: "#ef4444", fontFamily: "var(--font-outfit)", fontSize: 13,
      }}>
        {error}
      </div>
    );
  }

  if (sequences.length === 0) {
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", padding: "80px 0", textAlign: "center", gap: 16,
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: 14,
          backgroundColor: "rgba(255,82,0,0.08)", border: "1px solid rgba(255,82,0,0.15)",
          display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,82,0,0.5)",
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <path d="M21 12a9 9 0 11-6-8.5" /><polyline points="21 3 21 9 15 9" />
          </svg>
        </div>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: "#fff", fontFamily: "var(--font-syne)", margin: 0 }}>
          No follow-up sequences yet
        </h3>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", fontFamily: "var(--font-outfit)", maxWidth: 340, lineHeight: 1.6, margin: 0 }}>
          Send this campaign and choose to set up automatic follow-ups when prompted.
        </p>
      </div>
    );
  }

  const totalScheduled = sequences.reduce((s, seq) => s + seq.scheduled, 0);
  const totalSent = sequences.reduce((s, seq) => s + seq.sent, 0);

  return (
    <div>
      {actionError && (
        <div style={{
          marginBottom: 16, padding: "10px 14px", borderRadius: 9,
          backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
          color: "#f87171", fontSize: 13, fontFamily: "var(--font-outfit)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          {actionError}
          <button onClick={() => setActionError(null)} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", fontSize: 16, lineHeight: 1 }}>×</button>
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", fontFamily: "var(--font-outfit)" }}>
          {sequences.length} sequence{sequences.length !== 1 ? "s" : ""} · {totalSent} sent · {totalScheduled} remaining
        </span>
      </div>

      <div style={{
        backgroundColor: "#0a0a0a",
        border: "1px solid rgba(255,255,255,0.07)",
        borderLeft: "3px solid rgba(255,82,0,0.4)",
        borderRadius: 12, overflow: "hidden",
      }}>
        {sequences
          .sort((a, b) => a.follow_up_number - b.follow_up_number)
          .map((seq) => (
            <SequenceRow key={seq.id} seq={seq} onAction={handleAction} />
          ))}
      </div>
    </div>
  );
}
