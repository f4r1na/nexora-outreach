"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PageWrapper } from "../_components/motion";
import { Loader2, ChevronDown, Trash2, RefreshCw, Sparkles, Plus, Inbox } from "lucide-react";

type ReplyStatus = "pending" | "draft_ready" | "sent" | "skipped";
type FilterTab = "all" | "pending" | "sent" | "skipped";

type Reply = {
  id: string;
  lead_email: string;
  lead_name: string | null;
  original_subject: string | null;
  reply_body: string;
  ai_draft: string | null;
  status: ReplyStatus;
  created_at: string;
};

type ManualForm = {
  email_from: string;
  subject: string;
  reply_body: string;
};

const STATUS_CONFIG: Record<ReplyStatus, { label: string; color: string }> = {
  pending:     { label: "Needs response", color: "rgba(251,146,60,0.7)" },
  draft_ready: { label: "Draft ready",   color: "rgba(96,165,250,0.7)" },
  sent:        { label: "Responded",     color: "rgba(74,222,128,0.7)" },
  skipped:     { label: "Dismissed",     color: "#555" },
};

const FILTER_TABS: { value: FilterTab; label: string }[] = [
  { value: "all",     label: "All" },
  { value: "pending", label: "Needs Response" },
  { value: "sent",    label: "Responded" },
  { value: "skipped", label: "Dismissed" },
];

function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffH = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60));
  if (diffH < 1) return "Just now";
  if (diffH < 24) return `${diffH}h ago`;
  if (diffH < 48) return "Yesterday";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function SpinnerIcon() {
  return <Loader2 size={13} strokeWidth={2.5} style={{ animation: "spin 0.8s linear infinite" }} aria-hidden="true" />;
}

function ChevronIcon({ direction }: { direction: "up" | "down" }) {
  return <ChevronDown size={14} strokeWidth={2} style={{ transform: direction === "up" ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} aria-hidden="true" />;
}

function TrashIcon() {
  return <Trash2 size={12} strokeWidth={2.2} aria-hidden="true" />;
}

function RegenerateIcon() {
  return (
    <RefreshCw size={11} strokeWidth={2.2} aria-hidden="true" />
  );
}

function SparkleIcon() {
  return <Sparkles size={13} strokeWidth={2} aria-hidden="true" />;
}

function SyncIcon() {
  return <RefreshCw size={13} strokeWidth={2.2} aria-hidden="true" />;
}

function PlusIcon() {
  return <Plus size={13} strokeWidth={1.8} aria-hidden="true" />;
}

function InboxEmptyIcon() {
  return <Inbox size={32} strokeWidth={1.3} aria-hidden="true" />;
}

// ─── Reply Card ───────────────────────────────────────────────────────────────

function ReplyCard({
  reply,
  draftLoading,
  editedDraft,
  actionLoading,
  replyActionError,
  isDeleteLoading,
  confirmDelete,
  onGenerateDraft,
  onAction,
  onDelete,
  onConfirmDelete,
  onCancelDelete,
  onDraftChange,
}: {
  reply: Reply;
  draftLoading: boolean;
  editedDraft: string;
  actionLoading: boolean;
  replyActionError: string | null;
  isDeleteLoading: boolean;
  confirmDelete: boolean;
  onGenerateDraft: () => void;
  onAction: (action: "send" | "skip") => void;
  onDelete: () => void;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
  onDraftChange: (v: string) => void;
}) {
  const [expanded, setExpanded] = useState(reply.status === "pending" || reply.status === "draft_ready");
  const cfg = STATUS_CONFIG[reply.status];
  const isDone = reply.status === "sent" || reply.status === "skipped";
  const draft = editedDraft || reply.ai_draft || "";

  return (
    <div style={{
      backgroundColor: "#0e0e0e",
      border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: 10, overflow: "hidden",
      opacity: isDone ? 0.65 : 1,
    }}>
      {/* Card header */}
      <div
        style={{ display: "flex", alignItems: "center", padding: "14px 20px", cursor: "pointer", gap: 14 }}
        onClick={() => setExpanded(!expanded)}
      >
        {/* Lead info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: "#ccc", fontFamily: "var(--font-outfit)" }}>
              {reply.lead_name ?? reply.lead_email}
            </span>
            {reply.lead_name && (
              <span style={{ fontSize: 12, color: "#444", fontFamily: "var(--font-outfit)" }}>
                {reply.lead_email}
              </span>
            )}
          </div>
          {reply.original_subject && (
            <p style={{ fontSize: 12, color: "#555", fontFamily: "var(--font-outfit)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {reply.original_subject}
            </p>
          )}
        </div>

        {/* Right: time + status + actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <span style={{ fontSize: 11, color: "#444", fontFamily: "var(--font-outfit)" }}>
            {formatDate(reply.created_at)}
          </span>
          <span className={`nx-badge ${
            reply.status === "sent" ? "nx-badge-green" :
            reply.status === "draft_ready" ? "nx-badge-blue" :
            reply.status === "pending" ? "nx-badge-orange" :
            "nx-badge-gray"
          }`}>
            {cfg.label}
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); onConfirmDelete(); }}
            disabled={isDeleteLoading}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 26, height: 26, borderRadius: 6, flexShrink: 0,
              backgroundColor: "transparent", border: "1px solid rgba(239,68,68,0.2)",
              color: "rgba(239,68,68,0.45)", cursor: "pointer", padding: 0,
            }}
          >
            {isDeleteLoading ? <SpinnerIcon /> : <TrashIcon />}
          </button>
          <ChevronIcon direction={expanded ? "up" : "down"} />
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "18px 20px" }}>
          {/* Their message */}
          <div style={{ marginBottom: 18 }}>
            <p style={{ fontSize: 10, fontWeight: 500, color: "#444", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8, fontFamily: "var(--font-outfit)" }}>
              Their Message
            </p>
            <div style={{
              padding: "12px 14px",
              backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8,
              fontSize: 13, color: "rgba(255,255,255,0.6)", fontFamily: "var(--font-outfit)",
              lineHeight: 1.7, whiteSpace: "pre-wrap", maxHeight: 160, overflow: "auto",
            }}>
              {reply.reply_body}
            </div>
          </div>

          {/* AI Draft */}
          {!isDone && (
            reply.status === "pending" && !reply.ai_draft ? (
              <button
                onClick={(e) => { e.stopPropagation(); onGenerateDraft(); }}
                disabled={draftLoading}
                style={{
                  display: "flex", alignItems: "center", gap: 7,
                  padding: "8px 14px", borderRadius: 6, fontSize: 13, fontWeight: 400,
                  fontFamily: "var(--font-outfit)", cursor: draftLoading ? "not-allowed" : "pointer",
                  backgroundColor: draftLoading ? "rgba(255,82,0,0.3)" : "rgba(255,82,0,0.1)",
                  color: draftLoading ? "rgba(255,255,255,0.4)" : "#FF5200",
                  border: "1px solid rgba(255,82,0,0.25)", marginBottom: 16,
                }}
              >
                {draftLoading ? <SpinnerIcon /> : <SparkleIcon />}
                {draftLoading ? "Generating…" : "Generate AI Draft"}
              </button>
            ) : (
              <div style={{ marginBottom: 18 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <p style={{ fontSize: 10, fontWeight: 500, color: "#444", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0, fontFamily: "var(--font-outfit)" }}>
                    AI Draft <span style={{ color: "rgba(255,82,0,0.55)", textTransform: "none", letterSpacing: 0, fontSize: 10 }}>(editable)</span>
                  </p>
                  <button
                    onClick={(e) => { e.stopPropagation(); onGenerateDraft(); }}
                    disabled={draftLoading}
                    style={{
                      display: "flex", alignItems: "center", gap: 5,
                      padding: "3px 10px", borderRadius: 6,
                      backgroundColor: "transparent", color: draftLoading ? "rgba(255,82,0,0.4)" : "#FF5200",
                      border: "1px solid rgba(255,82,0,0.3)", fontSize: 11, fontWeight: 400,
                      fontFamily: "var(--font-outfit)", cursor: draftLoading ? "not-allowed" : "pointer",
                    }}
                  >
                    {draftLoading ? <SpinnerIcon /> : <RegenerateIcon />}
                    {draftLoading ? "Regenerating…" : "Regenerate"}
                  </button>
                </div>
                <textarea
                  value={draft}
                  onChange={(e) => onDraftChange(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  rows={5}
                  style={{
                    width: "100%", padding: "12px 14px", borderRadius: 8,
                    backgroundColor: "rgba(255,82,0,0.03)", border: "1px solid rgba(255,82,0,0.15)",
                    color: "rgba(255,255,255,0.75)", fontFamily: "var(--font-outfit)",
                    fontSize: 13, lineHeight: 1.7, resize: "vertical",
                    outline: "none", boxSizing: "border-box",
                  }}
                />
              </div>
            )
          )}

          {/* Done draft preview */}
          {isDone && reply.ai_draft && (
            <div style={{ marginBottom: 0 }}>
              <p style={{ fontSize: 10, fontWeight: 500, color: "#444", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8, fontFamily: "var(--font-outfit)" }}>
                {reply.status === "sent" ? "Sent Reply" : "Draft (Dismissed)"}
              </p>
              <div style={{
                padding: "12px 14px", borderRadius: 8,
                backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
                fontSize: 13, color: "rgba(255,255,255,0.45)", fontFamily: "var(--font-outfit)",
                lineHeight: 1.7, whiteSpace: "pre-wrap",
              }}>
                {reply.ai_draft}
              </div>
            </div>
          )}

          {/* Delete confirm */}
          {confirmDelete && (
            <div style={{
              padding: "12px 14px", borderRadius: 8, marginBottom: 12,
              backgroundColor: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)",
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
            }}>
              <p style={{ fontSize: 13, color: "rgba(239,68,68,0.9)", fontFamily: "var(--font-outfit)", margin: 0 }}>
                Permanently delete this response?
              </p>
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(); }}
                  style={{
                    padding: "6px 14px", borderRadius: 6,
                    backgroundColor: "rgba(239,68,68,0.12)", color: "#ef4444",
                    border: "1px solid rgba(239,68,68,0.3)",
                    fontSize: 12, fontWeight: 400, fontFamily: "var(--font-outfit)", cursor: "pointer",
                  }}
                >
                  Delete
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onCancelDelete(); }}
                  style={{
                    padding: "6px 14px", borderRadius: 6,
                    backgroundColor: "transparent", color: "#555",
                    border: "1px solid rgba(255,255,255,0.08)",
                    fontSize: 12, fontWeight: 400, fontFamily: "var(--font-outfit)", cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Action buttons */}
          {!isDone && (reply.status === "draft_ready" || (reply.status === "pending" && reply.ai_draft)) && (
            <div>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={(e) => { e.stopPropagation(); onAction("send"); }}
                  disabled={actionLoading || !draft.trim()}
                  style={{
                    flex: 1, padding: "9px 0", borderRadius: 6,
                    backgroundColor: actionLoading ? "rgba(255,82,0,0.4)" : "#FF5200",
                    color: "#fff", border: "none",
                    fontSize: 13, fontWeight: 500, fontFamily: "var(--font-outfit)",
                    cursor: actionLoading || !draft.trim() ? "not-allowed" : "pointer",
                    opacity: !draft.trim() ? 0.5 : 1,
                  }}
                >
                  {actionLoading ? "Sending…" : "Send reply"}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onAction("skip"); }}
                  disabled={actionLoading}
                  style={{
                    flex: 1, padding: "9px 0", borderRadius: 6,
                    backgroundColor: "transparent", color: "#555",
                    border: "1px solid rgba(255,255,255,0.08)",
                    fontSize: 13, fontWeight: 400, fontFamily: "var(--font-outfit)", cursor: actionLoading ? "not-allowed" : "pointer",
                  }}
                >
                  Dismiss
                </button>
              </div>
              {replyActionError && (
                <p style={{
                  marginTop: 10, fontSize: 12, color: "#ef4444", fontFamily: "var(--font-outfit)",
                  padding: "8px 12px", borderRadius: 8,
                  backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
                }}>
                  {replyActionError}
                </p>
              )}
            </div>
          )}

          {isDone && replyActionError && (
            <p style={{ marginTop: 10, fontSize: 12, color: "#ef4444", fontFamily: "var(--font-outfit)", padding: "8px 12px", borderRadius: 8, backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
              {replyActionError}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InboxPage() {
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<{ found: number; inserted: number } | null>(null);
  const [checkError, setCheckError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");

  const [showManual, setShowManual] = useState(false);
  const [manualForm, setManualForm] = useState<ManualForm>({ email_from: "", subject: "", reply_body: "" });
  const [manualLoading, setManualLoading] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);

  const [draftLoading, setDraftLoading] = useState<Record<string, boolean>>({});
  const [editedDrafts, setEditedDrafts] = useState<Record<string, string>>({});
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [actionError, setActionError] = useState<Record<string, string | null>>({});
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<Record<string, boolean>>({});

  const fetchReplies = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/replies");
      if (res.ok) {
        const data = await res.json() as { replies: Reply[] };
        setReplies(data.replies ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReplies(); }, [fetchReplies]);

  async function handleCheck() {
    setChecking(true);
    setCheckResult(null);
    setCheckError(null);
    try {
      const res = await fetch("/api/replies/check", { method: "POST" });
      const data = await res.json() as { found?: number; inserted?: number; error?: string };
      if (!res.ok) {
        setCheckError(data.error ?? "Failed to sync inbox");
      } else {
        setCheckResult({ found: data.found ?? 0, inserted: data.inserted ?? 0 });
        if ((data.inserted ?? 0) > 0) await fetchReplies();
      }
    } catch {
      setCheckError("Network error");
    } finally {
      setChecking(false);
    }
  }

  async function handleGenerateDraft(replyId: string) {
    setDraftLoading((prev) => ({ ...prev, [replyId]: true }));
    try {
      const res = await fetch("/api/replies/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reply_id: replyId }),
      });
      const data = await res.json() as { ai_draft?: string; error?: string };
      if (res.ok && data.ai_draft) {
        setReplies((prev) => prev.map((r) => r.id === replyId ? { ...r, ai_draft: data.ai_draft!, status: "draft_ready" } : r));
        setEditedDrafts((prev) => ({ ...prev, [replyId]: data.ai_draft! }));
      }
    } finally {
      setDraftLoading((prev) => ({ ...prev, [replyId]: false }));
    }
  }

  async function handleAction(replyId: string, action: "send" | "skip") {
    const draft = editedDrafts[replyId] || replies.find((r) => r.id === replyId)?.ai_draft || "";
    setActionLoading((prev) => ({ ...prev, [replyId]: true }));
    setActionError((prev) => ({ ...prev, [replyId]: null }));
    try {
      const res = await fetch("/api/replies/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reply_id: replyId, action, edited_draft: draft || undefined }),
      });
      const data = await res.json() as { ok?: boolean; error?: string };
      if (res.ok && data.ok) {
        setReplies((prev) => prev.map((r) => r.id === replyId ? { ...r, status: action === "send" ? "sent" : "skipped" } : r));
      } else {
        setActionError((prev) => ({ ...prev, [replyId]: data.error ?? `Server error (${res.status})` }));
      }
    } catch (err: unknown) {
      setActionError((prev) => ({ ...prev, [replyId]: err instanceof Error ? err.message : "Network error" }));
    } finally {
      setActionLoading((prev) => ({ ...prev, [replyId]: false }));
    }
  }

  async function handleDelete(replyId: string) {
    setDeleteLoading((prev) => ({ ...prev, [replyId]: true }));
    setConfirmDelete(null);
    try {
      const res = await fetch("/api/replies/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reply_id: replyId }),
      });
      const data = await res.json() as { ok?: boolean; error?: string };
      if (res.ok && data.ok) {
        setReplies((prev) => prev.filter((r) => r.id !== replyId));
      } else {
        setActionError((prev) => ({ ...prev, [replyId]: data.error ?? "Delete failed" }));
      }
    } catch (err: unknown) {
      setActionError((prev) => ({ ...prev, [replyId]: err instanceof Error ? err.message : "Network error" }));
    } finally {
      setDeleteLoading((prev) => ({ ...prev, [replyId]: false }));
    }
  }

  async function handleManualSubmit() {
    if (!manualForm.email_from.trim() || !manualForm.reply_body.trim()) return;
    setManualLoading(true);
    setManualError(null);
    try {
      const res = await fetch("/api/replies/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email_from: manualForm.email_from, subject: manualForm.subject || undefined, reply_body: manualForm.reply_body }),
      });
      const data = await res.json() as { reply_id?: string; error?: string };
      if (!res.ok) {
        setManualError(data.error ?? "Failed to add response");
      } else {
        setShowManual(false);
        setManualForm({ email_from: "", subject: "", reply_body: "" });
        await fetchReplies();
      }
    } catch {
      setManualError("Network error");
    } finally {
      setManualLoading(false);
    }
  }

  // Filter logic
  const filtered = replies.filter((r) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "pending") return r.status === "pending" || r.status === "draft_ready";
    if (activeFilter === "sent") return r.status === "sent";
    if (activeFilter === "skipped") return r.status === "skipped";
    return true;
  }).sort((a, b) => {
    const order: Record<ReplyStatus, number> = { draft_ready: 0, pending: 1, sent: 2, skipped: 3 };
    return order[a.status] - order[b.status];
  });

  const needsResponseCount = replies.filter((r) => r.status === "pending" || r.status === "draft_ready").length;

  return (
    <PageWrapper>
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
            Inbox
          </h1>
          <p style={{ fontSize: 11, color: "#383838", fontFamily: "var(--font-outfit)", margin: 0, marginTop: 3 }}>
            Responses from your campaigns
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={() => setShowManual(true)}
            className="btn-ghost"
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "6px 12px", borderRadius: 6, fontSize: 12, fontWeight: 400,
              fontFamily: "var(--font-outfit)", cursor: "pointer",
              backgroundColor: "transparent", color: "#555",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <PlusIcon />
            Add manually
          </button>
          <button
            onClick={handleCheck}
            disabled={checking}
            className="btn-primary"
            style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "7px 14px", borderRadius: 6, fontSize: 12, fontWeight: 500,
              fontFamily: "var(--font-outfit)", cursor: checking ? "not-allowed" : "pointer",
              backgroundColor: checking ? "rgba(255,82,0,0.5)" : "#FF5200",
              color: "#fff", border: "none", opacity: checking ? 0.8 : 1,
            }}
          >
            {checking ? <SpinnerIcon /> : <SyncIcon />}
            {checking ? "Syncing…" : "Sync inbox"}
          </button>
        </div>
      </header>

      <main style={{ flex: 1, padding: "24px 32px 64px" }}>
        {/* Banners */}
        {checkResult && (
          <div style={{
            marginBottom: 18, padding: "10px 16px", borderRadius: 8,
            backgroundColor: checkResult.inserted > 0 ? "rgba(74,222,128,0.07)" : "rgba(255,255,255,0.03)",
            border: `1px solid ${checkResult.inserted > 0 ? "rgba(74,222,128,0.2)" : "rgba(255,255,255,0.07)"}`,
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <p style={{ fontSize: 13, color: checkResult.inserted > 0 ? "#4ade80" : "#555", fontFamily: "var(--font-outfit)" }}>
              {checkResult.inserted > 0
                ? `Found ${checkResult.inserted} new response${checkResult.inserted !== 1 ? "s" : ""} from ${checkResult.found} unread message${checkResult.found !== 1 ? "s" : ""}`
                : `Scanned ${checkResult.found} unread message${checkResult.found !== 1 ? "s" : ""} — no new responses from leads`}
            </p>
            <button onClick={() => setCheckResult(null)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: 18, lineHeight: 1 }}>×</button>
          </div>
        )}
        {checkError && (
          <div style={{
            marginBottom: 18, padding: "10px 16px", borderRadius: 8,
            backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <p style={{ fontSize: 13, color: "#ef4444", fontFamily: "var(--font-outfit)" }}>{checkError}</p>
            <button onClick={() => setCheckError(null)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 18, lineHeight: 1 }}>×</button>
          </div>
        )}

        {/* Filter tabs with animated underline */}
        <div style={{ display: "flex", gap: 0, marginBottom: 20, borderBottom: "1px solid rgba(255,255,255,0.05)", position: "relative" }}>
          {FILTER_TABS.map((tab) => {
            const active = tab.value === activeFilter;
            return (
              <button
                key={tab.value}
                onClick={() => setActiveFilter(tab.value)}
                style={{
                  padding: "9px 16px", fontSize: 12, fontFamily: "var(--font-outfit)",
                  fontWeight: 400, background: "none", border: "none",
                  color: active ? "#ddd" : "#484848",
                  cursor: "pointer", marginBottom: -1,
                  position: "relative",
                  transition: "color 0.18s ease",
                }}
              >
                {tab.label}
                {active && (
                  <motion.div
                    layoutId="inbox-tab-underline"
                    style={{
                      position: "absolute", bottom: 0, left: 0, right: 0,
                      height: 1, backgroundColor: "#FF5200",
                    }}
                    transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 64, borderRadius: 10, animationDelay: `${i * 0.08}s` }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{
            backgroundColor: "#0e0e0e", border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 10, padding: "64px 24px",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
          }}>
            <div style={{ color: "#333" }}>
              <InboxEmptyIcon />
            </div>
            <h3 style={{ fontSize: 14, fontWeight: 500, color: "#ccc", fontFamily: "var(--font-syne)", margin: 0 }}>
              {activeFilter === "all" ? "No responses received" : "No responses in this category"}
            </h3>
            <p style={{ fontSize: 13, color: "#444", fontFamily: "var(--font-outfit)", textAlign: "center", maxWidth: 340, lineHeight: 1.6, margin: 0 }}>
              {activeFilter === "all"
                ? "Sync your inbox to scan Gmail for replies from leads, or add a response manually."
                : "No responses match this filter."}
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {needsResponseCount > 0 && activeFilter === "all" && (
              <p style={{ fontSize: 11, color: "#484848", fontFamily: "var(--font-outfit)", marginBottom: 4 }}>
                {needsResponseCount} response{needsResponseCount !== 1 ? "s" : ""} need attention
              </p>
            )}
            <AnimatePresence initial={true}>
              {filtered.map((reply, i) => (
                <motion.div
                  key={reply.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.28, ease: "easeOut", delay: i * 0.04 }}
                >
                  <ReplyCard
                    reply={reply}
                    draftLoading={draftLoading[reply.id] ?? false}
                    editedDraft={editedDrafts[reply.id] ?? ""}
                    actionLoading={actionLoading[reply.id] ?? false}
                    replyActionError={actionError[reply.id] ?? null}
                    isDeleteLoading={deleteLoading[reply.id] ?? false}
                    confirmDelete={confirmDelete === reply.id}
                    onGenerateDraft={() => handleGenerateDraft(reply.id)}
                    onAction={(action) => handleAction(reply.id, action)}
                    onDelete={() => handleDelete(reply.id)}
                    onConfirmDelete={() => { setConfirmDelete(reply.id); }}
                    onCancelDelete={() => setConfirmDelete(null)}
                    onDraftChange={(v) => setEditedDrafts((prev) => ({ ...prev, [reply.id]: v }))}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* Manual add modal */}
      <AnimatePresence>
        {showManual && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          style={{
            position: "fixed", inset: 0, zIndex: 100,
            backgroundColor: "rgba(0,0,0,0.72)", backdropFilter: "blur(6px)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) { setShowManual(false); setManualError(null); } }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 4 }}
            transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
            style={{
              backgroundColor: "#0e0e0e", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 8, padding: "24px", maxWidth: 480, width: "100%",
            }}
          >
            <h2 style={{ fontSize: 15, fontWeight: 500, color: "#fff", fontFamily: "var(--font-syne)", marginBottom: 20 }}>
              Add response manually
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 10, fontWeight: 500, color: "#444", textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 6, fontFamily: "var(--font-outfit)" }}>
                  From email *
                </label>
                <input
                  type="email"
                  value={manualForm.email_from}
                  onChange={(e) => setManualForm((p) => ({ ...p, email_from: e.target.value }))}
                  placeholder="lead@company.com"
                  style={{
                    width: "100%", padding: "9px 13px", borderRadius: 8,
                    backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.09)",
                    color: "rgba(255,255,255,0.8)", fontFamily: "var(--font-outfit)", fontSize: 13,
                    outline: "none", boxSizing: "border-box",
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: 10, fontWeight: 500, color: "#444", textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 6, fontFamily: "var(--font-outfit)" }}>
                  Subject
                </label>
                <input
                  type="text"
                  value={manualForm.subject}
                  onChange={(e) => setManualForm((p) => ({ ...p, subject: e.target.value }))}
                  placeholder="Re: ..."
                  style={{
                    width: "100%", padding: "9px 13px", borderRadius: 8,
                    backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.09)",
                    color: "rgba(255,255,255,0.8)", fontFamily: "var(--font-outfit)", fontSize: 13,
                    outline: "none", boxSizing: "border-box",
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: 10, fontWeight: 500, color: "#444", textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 6, fontFamily: "var(--font-outfit)" }}>
                  Message *
                </label>
                <textarea
                  value={manualForm.reply_body}
                  onChange={(e) => setManualForm((p) => ({ ...p, reply_body: e.target.value }))}
                  placeholder="Paste their reply here…"
                  rows={5}
                  style={{
                    width: "100%", padding: "9px 13px", borderRadius: 8,
                    backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.09)",
                    color: "rgba(255,255,255,0.8)", fontFamily: "var(--font-outfit)", fontSize: 13,
                    lineHeight: 1.6, resize: "vertical", outline: "none", boxSizing: "border-box",
                  }}
                />
              </div>
              {manualError && (
                <p style={{ fontSize: 12, color: "#ef4444", fontFamily: "var(--font-outfit)", padding: "8px 12px", borderRadius: 8, backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                  {manualError}
                </p>
              )}
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button
                onClick={handleManualSubmit}
                disabled={manualLoading || !manualForm.email_from.trim() || !manualForm.reply_body.trim()}
                style={{
                  flex: 1, padding: "9px 0", borderRadius: 6,
                  backgroundColor: manualLoading ? "rgba(255,82,0,0.4)" : "#FF5200",
                  color: "#fff", border: "none", fontSize: 13, fontWeight: 500,
                  fontFamily: "var(--font-outfit)", cursor: manualLoading ? "not-allowed" : "pointer",
                  opacity: (!manualForm.email_from.trim() || !manualForm.reply_body.trim()) ? 0.5 : 1,
                }}
              >
                {manualLoading ? "Adding…" : "Add Response"}
              </button>
              <button
                onClick={() => { setShowManual(false); setManualError(null); }}
                style={{
                  flex: 1, padding: "9px 0", borderRadius: 6,
                  backgroundColor: "transparent", color: "#555",
                  border: "1px solid rgba(255,255,255,0.08)",
                  fontSize: 13, fontWeight: 400, fontFamily: "var(--font-outfit)", cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </motion.div>
        )}
      </AnimatePresence>
    </PageWrapper>
  );
}
