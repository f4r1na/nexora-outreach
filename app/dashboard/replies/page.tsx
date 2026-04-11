"use client";

import { useState, useEffect, useCallback } from "react";

type ReplyStatus = "pending" | "draft_ready" | "sent" | "skipped";

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

const STATUS_STYLE: Record<ReplyStatus, { label: string; color: string; bg: string; border: string }> = {
  pending:     { label: "Needs Draft",  color: "#fb923c", bg: "rgba(251,146,60,0.1)",  border: "rgba(251,146,60,0.2)" },
  draft_ready: { label: "Ready to Send", color: "#60a5fa", bg: "rgba(96,165,250,0.1)", border: "rgba(96,165,250,0.2)" },
  sent:        { label: "Sent",          color: "#4ade80", bg: "rgba(74,222,128,0.1)", border: "rgba(74,222,128,0.2)" },
  skipped:     { label: "Skipped",       color: "#94a3b8", bg: "rgba(148,163,184,0.1)", border: "rgba(148,163,184,0.2)" },
};

export default function RepliesPage() {
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<{ found: number; inserted: number } | null>(null);
  const [checkError, setCheckError] = useState<string | null>(null);

  const [showManual, setShowManual] = useState(false);
  const [manualForm, setManualForm] = useState<ManualForm>({ email_from: "", subject: "", reply_body: "" });
  const [manualLoading, setManualLoading] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);

  // Per-reply state
  const [draftLoading, setDraftLoading] = useState<Record<string, boolean>>({});
  const [editedDrafts, setEditedDrafts] = useState<Record<string, string>>({});
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

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
        setCheckError(data.error ?? "Failed to check replies");
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
        setReplies((prev) =>
          prev.map((r) =>
            r.id === replyId ? { ...r, ai_draft: data.ai_draft!, status: "draft_ready" } : r
          )
        );
        setEditedDrafts((prev) => ({ ...prev, [replyId]: data.ai_draft! }));
      }
    } finally {
      setDraftLoading((prev) => ({ ...prev, [replyId]: false }));
    }
  }

  async function handleAction(replyId: string, action: "send" | "skip") {
    setActionLoading((prev) => ({ ...prev, [replyId]: true }));
    try {
      const res = await fetch("/api/replies/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reply_id: replyId,
          action,
          edited_draft: editedDrafts[replyId],
        }),
      });
      const data = await res.json() as { ok?: boolean; error?: string };
      if (res.ok && data.ok) {
        setReplies((prev) =>
          prev.map((r) =>
            r.id === replyId ? { ...r, status: action === "send" ? "sent" : "skipped" } : r
          )
        );
      }
    } finally {
      setActionLoading((prev) => ({ ...prev, [replyId]: false }));
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
        body: JSON.stringify({
          email_from: manualForm.email_from,
          subject: manualForm.subject || undefined,
          reply_body: manualForm.reply_body,
        }),
      });
      const data = await res.json() as { reply_id?: string; ai_draft?: string; error?: string };
      if (!res.ok) {
        setManualError(data.error ?? "Failed to add reply");
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

  const pendingCount = replies.filter((r) => r.status === "pending" || r.status === "draft_ready").length;
  const sentCount = replies.filter((r) => r.status === "sent").length;
  const skippedCount = replies.filter((r) => r.status === "skipped").length;

  // Sort: active first, then sent/skipped
  const sorted = [...replies].sort((a, b) => {
    const order: Record<ReplyStatus, number> = { draft_ready: 0, pending: 1, sent: 2, skipped: 3 };
    return order[a.status] - order[b.status];
  });

  return (
    <>
      {/* Header */}
      <header style={{
        padding: "0 32px", height: 68,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        backgroundColor: "rgba(6,6,6,0.85)", backdropFilter: "blur(12px)",
        position: "sticky", top: 0, zIndex: 30, gap: 16,
      }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: "#fff", fontFamily: "var(--font-syne)", lineHeight: 1.2 }}>
            Reply Handler
          </h1>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", fontFamily: "var(--font-outfit)", marginTop: 1 }}>
            AI-powered responses to inbound replies
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={() => setShowManual(true)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "7px 14px", borderRadius: 8, fontSize: 12.5, fontWeight: 600,
              fontFamily: "var(--font-outfit)", cursor: "pointer",
              backgroundColor: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <PasteIcon />
            Paste Reply
          </button>
          <button
            onClick={handleCheck}
            disabled={checking}
            style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "7px 16px", borderRadius: 8, fontSize: 13, fontWeight: 700,
              fontFamily: "var(--font-outfit)", cursor: checking ? "not-allowed" : "pointer",
              backgroundColor: checking ? "rgba(255,82,0,0.5)" : "#FF5200",
              color: "#fff", border: "none", opacity: checking ? 0.8 : 1,
            }}
          >
            {checking ? <SpinnerIcon /> : <InboxIcon />}
            {checking ? "Checking…" : "Check Gmail"}
          </button>
        </div>
      </header>

      <main style={{ flex: 1, padding: "28px 32px 64px" }}>
        {/* Check result banner */}
        {checkResult && (
          <div style={{
            marginBottom: 20, padding: "12px 16px", borderRadius: 10,
            backgroundColor: checkResult.inserted > 0 ? "rgba(74,222,128,0.08)" : "rgba(255,255,255,0.04)",
            border: `1px solid ${checkResult.inserted > 0 ? "rgba(74,222,128,0.2)" : "rgba(255,255,255,0.08)"}`,
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <p style={{ fontSize: 13, color: checkResult.inserted > 0 ? "#4ade80" : "rgba(255,255,255,0.4)", fontFamily: "var(--font-outfit)" }}>
              {checkResult.inserted > 0
                ? `Found ${checkResult.inserted} new repl${checkResult.inserted !== 1 ? "ies" : "y"} from ${checkResult.found} unread message${checkResult.found !== 1 ? "s" : ""}`
                : `Checked ${checkResult.found} unread message${checkResult.found !== 1 ? "s" : ""} — no new replies from leads`}
            </p>
            <button
              onClick={() => setCheckResult(null)}
              style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: 18, lineHeight: 1 }}
            >×</button>
          </div>
        )}
        {checkError && (
          <div style={{
            marginBottom: 20, padding: "12px 16px", borderRadius: 10,
            backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <p style={{ fontSize: 13, color: "#ef4444", fontFamily: "var(--font-outfit)" }}>{checkError}</p>
            <button
              onClick={() => setCheckError(null)}
              style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 18, lineHeight: 1 }}
            >×</button>
          </div>
        )}

        {/* Stats row */}
        <div style={{ display: "flex", gap: 16, marginBottom: 28 }}>
          {[
            { label: "Needs Attention", value: pendingCount, color: "#FF5200" },
            { label: "Sent", value: sentCount, color: "#4ade80" },
            { label: "Skipped", value: skippedCount, color: "#94a3b8" },
          ].map((stat) => (
            <div key={stat.label} style={{
              backgroundColor: "#0e0e0e", border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 14, padding: "22px 24px", flex: 1,
            }}>
              <p style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10, fontFamily: "var(--font-outfit)" }}>
                {stat.label}
              </p>
              <div style={{ fontSize: 36, fontWeight: 900, color: stat.color, fontFamily: "var(--font-syne)", lineHeight: 1 }}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        {/* Loading */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "rgba(255,255,255,0.3)", fontFamily: "var(--font-outfit)" }}>
            Loading replies…
          </div>
        ) : sorted.length === 0 ? (
          /* Empty state */
          <div style={{
            backgroundColor: "#0e0e0e", border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 14, padding: "80px 24px",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 14,
          }}>
            <div style={{
              width: 72, height: 72, borderRadius: 18,
              backgroundColor: "rgba(255,82,0,0.08)", border: "1px solid rgba(255,82,0,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,82,0,0.5)",
            }}>
              <InboxLargeIcon />
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#fff", fontFamily: "var(--font-syne)", margin: 0 }}>
              No replies yet
            </h3>
            <p style={{ fontSize: 13.5, color: "rgba(255,255,255,0.35)", fontFamily: "var(--font-outfit)", textAlign: "center", maxWidth: 340, lineHeight: 1.6, margin: 0 }}>
              Click <strong style={{ color: "rgba(255,255,255,0.6)" }}>Check Gmail</strong> to scan your inbox for replies from leads, or paste a reply manually.
            </p>
          </div>
        ) : (
          /* Reply cards */
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {sorted.map((reply) => {
              const style = STATUS_STYLE[reply.status];
              const isExpanded = expanded[reply.id] ?? (reply.status !== "sent" && reply.status !== "skipped");
              const draft = editedDrafts[reply.id] ?? reply.ai_draft ?? "";
              const isDraftLoading = draftLoading[reply.id] ?? false;
              const isActionLoading = actionLoading[reply.id] ?? false;
              const isDone = reply.status === "sent" || reply.status === "skipped";

              return (
                <div key={reply.id} style={{
                  backgroundColor: "#0e0e0e", border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 14, overflow: "hidden",
                  opacity: isDone ? 0.6 : 1,
                }}>
                  {/* Card header */}
                  <div
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "18px 24px", cursor: "pointer", gap: 12,
                    }}
                    onClick={() => setExpanded((prev) => ({ ...prev, [reply.id]: !isExpanded }))}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 9,
                        backgroundColor: "rgba(255,82,0,0.1)", border: "1px solid rgba(255,82,0,0.2)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "#FF5200", flexShrink: 0, fontSize: 14, fontWeight: 700, fontFamily: "var(--font-syne)",
                      }}>
                        {(reply.lead_name ?? reply.lead_email)[0].toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: 14, fontWeight: 700, color: "#fff", fontFamily: "var(--font-syne)", margin: 0 }}>
                          {reply.lead_name ?? reply.lead_email}
                        </p>
                        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", fontFamily: "var(--font-outfit)", margin: 0, marginTop: 1 }}>
                          {reply.lead_name ? reply.lead_email : ""}
                          {reply.original_subject && (
                            <span style={{ color: "rgba(255,255,255,0.2)" }}>
                              {reply.lead_name ? " · " : ""}{reply.original_subject}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 6,
                        color: style.color, backgroundColor: style.bg, border: `1px solid ${style.border}`,
                        fontFamily: "var(--font-outfit)",
                      }}>
                        {style.label}
                      </span>
                      <ChevronIcon direction={isExpanded ? "up" : "down"} />
                    </div>
                  </div>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "20px 24px" }}>
                      {/* Their reply */}
                      <div style={{ marginBottom: 20 }}>
                        <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                          Their Reply
                        </p>
                        <div style={{
                          padding: "14px 16px", backgroundColor: "rgba(255,255,255,0.03)",
                          border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10,
                          fontSize: 13, color: "rgba(255,255,255,0.6)", fontFamily: "var(--font-outfit)",
                          lineHeight: 1.7, whiteSpace: "pre-wrap", maxHeight: 160, overflow: "auto",
                        }}>
                          {reply.reply_body}
                        </div>
                      </div>

                      {/* AI Draft section */}
                      {!isDone && (
                        reply.status === "pending" && !reply.ai_draft ? (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleGenerateDraft(reply.id); }}
                            disabled={isDraftLoading}
                            style={{
                              display: "flex", alignItems: "center", gap: 7,
                              padding: "9px 16px", borderRadius: 8, fontSize: 13, fontWeight: 700,
                              fontFamily: "var(--font-outfit)", cursor: isDraftLoading ? "not-allowed" : "pointer",
                              backgroundColor: isDraftLoading ? "rgba(255,82,0,0.4)" : "rgba(255,82,0,0.15)",
                              color: isDraftLoading ? "rgba(255,255,255,0.4)" : "#FF5200",
                              border: "1px solid rgba(255,82,0,0.3)", marginBottom: 16,
                            }}
                          >
                            {isDraftLoading ? <SpinnerIcon /> : <SparkleIcon />}
                            {isDraftLoading ? "Generating draft…" : "Generate AI Draft"}
                          </button>
                        ) : (
                          <div style={{ marginBottom: 20 }}>
                            <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                              AI Draft <span style={{ color: "rgba(255,82,0,0.6)", textTransform: "none", letterSpacing: 0, fontSize: 10 }}>(editable)</span>
                            </p>
                            <textarea
                              value={draft}
                              onChange={(e) => setEditedDrafts((prev) => ({ ...prev, [reply.id]: e.target.value }))}
                              onClick={(e) => e.stopPropagation()}
                              rows={5}
                              style={{
                                width: "100%", padding: "12px 14px", borderRadius: 10,
                                backgroundColor: "rgba(255,82,0,0.04)",
                                border: "1px solid rgba(255,82,0,0.2)",
                                color: "rgba(255,255,255,0.75)", fontFamily: "var(--font-outfit)",
                                fontSize: 13, lineHeight: 1.7, resize: "vertical",
                                outline: "none", boxSizing: "border-box",
                              }}
                            />
                          </div>
                        )
                      )}

                      {/* Done state draft preview */}
                      {isDone && reply.ai_draft && (
                        <div style={{ marginBottom: 0 }}>
                          <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                            {reply.status === "sent" ? "Sent Reply" : "Draft (Skipped)"}
                          </p>
                          <div style={{
                            padding: "12px 14px", borderRadius: 10,
                            backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
                            fontSize: 13, color: "rgba(255,255,255,0.45)", fontFamily: "var(--font-outfit)",
                            lineHeight: 1.7, whiteSpace: "pre-wrap",
                          }}>
                            {reply.ai_draft}
                          </div>
                        </div>
                      )}

                      {/* Action buttons */}
                      {!isDone && (reply.status === "draft_ready" || (reply.status === "pending" && reply.ai_draft)) && (
                        <div style={{ display: "flex", gap: 10 }}>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleAction(reply.id, "send"); }}
                            disabled={isActionLoading || !draft.trim()}
                            style={{
                              flex: 1, padding: "10px 0", borderRadius: 9,
                              backgroundColor: isActionLoading ? "rgba(255,82,0,0.4)" : "#FF5200",
                              color: "#fff", border: "none",
                              fontSize: 13, fontWeight: 700, fontFamily: "var(--font-outfit)",
                              cursor: isActionLoading || !draft.trim() ? "not-allowed" : "pointer",
                              opacity: !draft.trim() ? 0.5 : 1,
                            }}
                          >
                            {isActionLoading ? "Sending…" : "Send Reply"}
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleAction(reply.id, "skip"); }}
                            disabled={isActionLoading}
                            style={{
                              flex: 1, padding: "10px 0", borderRadius: 9,
                              backgroundColor: "rgba(255,255,255,0.05)",
                              color: "rgba(255,255,255,0.5)",
                              border: "1px solid rgba(255,255,255,0.1)",
                              fontSize: 13, fontWeight: 600, fontFamily: "var(--font-outfit)",
                              cursor: isActionLoading ? "not-allowed" : "pointer",
                            }}
                          >
                            Skip
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Manual paste modal */}
      {showManual && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 100,
          backgroundColor: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
        }}>
          <div style={{
            backgroundColor: "#0e0e0e", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 16, padding: "32px 28px",
            maxWidth: 480, width: "100%",
            boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
          }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "#fff", fontFamily: "var(--font-syne)", marginBottom: 6 }}>
              Paste a Reply
            </h2>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", fontFamily: "var(--font-outfit)", marginBottom: 24, lineHeight: 1.5 }}>
              Manually add a reply to generate an AI draft response.
            </p>

            {manualError && (
              <div style={{ marginBottom: 16, padding: "10px 14px", borderRadius: 8, backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                <p style={{ fontSize: 12.5, color: "#ef4444", fontFamily: "var(--font-outfit)" }}>{manualError}</p>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6, fontFamily: "var(--font-outfit)" }}>
                  Their Email Address *
                </label>
                <input
                  type="email"
                  value={manualForm.email_from}
                  onChange={(e) => setManualForm((f) => ({ ...f, email_from: e.target.value }))}
                  placeholder="lead@company.com"
                  style={{
                    width: "100%", padding: "10px 14px", borderRadius: 9,
                    backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
                    color: "#fff", fontFamily: "var(--font-outfit)", fontSize: 13, outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6, fontFamily: "var(--font-outfit)" }}>
                  Subject (optional)
                </label>
                <input
                  type="text"
                  value={manualForm.subject}
                  onChange={(e) => setManualForm((f) => ({ ...f, subject: e.target.value }))}
                  placeholder="Re: your email"
                  style={{
                    width: "100%", padding: "10px 14px", borderRadius: 9,
                    backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
                    color: "#fff", fontFamily: "var(--font-outfit)", fontSize: 13, outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6, fontFamily: "var(--font-outfit)" }}>
                  Their Reply *
                </label>
                <textarea
                  value={manualForm.reply_body}
                  onChange={(e) => setManualForm((f) => ({ ...f, reply_body: e.target.value }))}
                  placeholder="Paste the reply text here…"
                  rows={6}
                  style={{
                    width: "100%", padding: "10px 14px", borderRadius: 9,
                    backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
                    color: "#fff", fontFamily: "var(--font-outfit)", fontSize: 13,
                    outline: "none", resize: "vertical", boxSizing: "border-box", lineHeight: 1.6,
                  }}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
              <button
                onClick={handleManualSubmit}
                disabled={manualLoading || !manualForm.email_from.trim() || !manualForm.reply_body.trim()}
                style={{
                  flex: 1, padding: "11px 0", borderRadius: 9,
                  backgroundColor: manualLoading ? "rgba(255,82,0,0.5)" : "#FF5200",
                  color: "#fff", border: "none",
                  fontSize: 14, fontWeight: 700, fontFamily: "var(--font-outfit)",
                  cursor: manualLoading ? "not-allowed" : "pointer",
                  opacity: (!manualForm.email_from.trim() || !manualForm.reply_body.trim()) ? 0.5 : 1,
                }}
              >
                {manualLoading ? "Generating Draft…" : "Add & Generate Draft"}
              </button>
              <button
                onClick={() => { setShowManual(false); setManualError(null); }}
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

// ─── Icons ─────────────────────────────────────────────────────────────────────

function InboxIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
      <path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" />
    </svg>
  );
}

function InboxLargeIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
      <path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" />
    </svg>
  );
}

function PasteIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l2.4 7.2H22l-6.2 4.5 2.4 7.2L12 17l-6.2 3.9 2.4-7.2L2 9.2h7.6z" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}

function ChevronIcon({ direction }: { direction: "up" | "down" }) {
  return (
    <svg
      width="12" height="12" viewBox="0 0 24 24" fill="none"
      stroke="rgba(255,255,255,0.3)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
      style={{ transform: direction === "up" ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}
