"use client";

import { useState, useEffect, useRef } from "react";
import {
  X,
  Pencil,
  Copy,
  Send,
  SkipForward,
  RotateCcw,
  Check,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import TimingBadge from "@/app/dashboard/components/timing-badge";

export type Signal = {
  id: string;
  type: string;
  text: string;
  source: string;
  source_url: string;
  date: string;
  date_iso: string;
  strength: string;
};

export type CompanyIntel = {
  industry: string;
  size: string;
  description: string;
  funding_stage: string;
  website: string;
};

export type SignalData = {
  signals: Signal[];
  intelligence_score: number;
  last_updated: string;
  company_intel: CompanyIntel;
  discarded: string[];
};

export type Lead = {
  id: string;
  first_name: string;
  company: string;
  role: string;
  email: string;
  custom_note: string;
  generated_subject: string;
  generated_body: string;
  signal_data?: SignalData | null;
  signal_status?: string | null;
};

type Props = {
  lead: Lead | null;
  index: number;
  totalLeads: number;
  onClose: () => void;
  onSkip: (leadId: string) => void;
  onPrev?: () => void;
  onNext?: () => void;
};

function getScore(
  index: number,
  total: number
): { label: "hot" | "warm" | "cold"; color: string } {
  const r = total > 0 ? index / total : 0;
  if (r < 0.35) return { label: "hot", color: "#FF5200" };
  if (r < 0.85) return { label: "warm", color: "#F59E0B" };
  return { label: "cold", color: "#6b7280" };
}

function isStale(iso: string): boolean {
  return (Date.now() - new Date(iso).getTime()) / 86_400_000 > 7;
}

function getConfidence(sig: Signal): "HIGH" | "MEDIUM" | "LOW" {
  const base = sig.strength === "high" ? 3 : sig.strength === "medium" ? 2 : 1;
  const days = sig.date_iso
    ? (Date.now() - new Date(sig.date_iso).getTime()) / 86_400_000
    : 90;
  const decay = days < 30 ? 0 : days < 90 ? 1 : 2;
  const score = base - decay;
  if (score >= 3) return "HIGH";
  if (score >= 1) return "MEDIUM";
  return "LOW";
}

const CONF_ORDER = { HIGH: 0, MEDIUM: 1, LOW: 2 } as const;

function IntelChip({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        padding: "6px 9px",
        backgroundColor: "rgba(255,255,255,0.02)",
        borderRadius: 7,
        border: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <p
        style={{
          fontSize: 9,
          color: "#3a3a4a",
          fontFamily: "var(--font-outfit)",
          textTransform: "uppercase",
          letterSpacing: "0.07em",
          marginBottom: 2,
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontSize: 11.5,
          color: "#777",
          fontFamily: "var(--font-outfit)",
        }}
      >
        {value}
      </p>
    </div>
  );
}

export default function LeadPanel({
  lead,
  index,
  totalLeads,
  onClose,
  onSkip,
  onPrev,
  onNext,
}: Props) {
  const [editingEmail, setEditingEmail] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [copied, setCopied] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [sigLoading, setSigLoading] = useState(false);
  const [discardedIds, setDiscardedIds] = useState<Set<string>>(new Set());
  const [githubUrl, setGithubUrl] = useState("");
  const [githubLoading, setGithubLoading] = useState(false);
  const [showGithubInput, setShowGithubInput] = useState(false);
  const [signalScores, setSignalScores] = useState<Record<string, { score: number; conversion_rate: number }>>({});
  const [scoresFounderType, setScoresFounderType] = useState<string>("");
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!lead) return;
    setSubject(lead.generated_subject ?? "");
    setBody(lead.generated_body ?? "");
    setEditingEmail(false);
    setCopied(false);
  }, [lead?.id]);

  useEffect(() => {
    if (!lead) return;
    function down(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const inEditable = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      if (e.key === "Escape") onClose();
      else if (!inEditable && e.key === "ArrowLeft" && onPrev) { e.preventDefault(); onPrev(); }
      else if (!inEditable && e.key === "ArrowRight" && onNext) { e.preventDefault(); onNext(); }
    }
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [lead, onClose, onPrev, onNext]);

  useEffect(() => {
    if (!lead?.id || lead.signal_status !== "done") return;
    fetch("/api/timing/watch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadIds: [lead.id] }),
    }).catch(() => {});
  }, [lead?.id, lead?.signal_status]);

  useEffect(() => {
    if (!lead?.id || lead.signal_status !== "done") {
      setSignals([]);
      setSigLoading(false);
      setDiscardedIds(new Set());
      setShowGithubInput(false);
      setGithubUrl("");
      return;
    }
    setSigLoading(true);
    setDiscardedIds(new Set());
    Promise.all([
      fetch(`/api/signals/discard?lead_id=${lead.id}`).then((r) => r.json()),
      fetch("/api/signals/score").then((r) => r.json()),
    ])
      .then(([sigData, scoreData]) => {
        setSignals(sigData.signals ?? []);
        setSignalScores(scoreData.scores ?? {});
        setScoresFounderType(scoreData.founder_type ?? "");
      })
      .catch(() => setSignals([]))
      .finally(() => setSigLoading(false));
  }, [lead?.id]);

  const handleCopy = () => {
    navigator.clipboard
      .writeText(`Subject: ${subject}\n\n${body}`)
      .catch(() => {});
    setCopied(true);
    toast("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSend = () => {
    if (!lead) return;
    toast.success(`Email sent to ${lead.first_name}`, {
      style: { color: "#4ade80", borderColor: "rgba(74,222,128,0.25)" },
    });
    onSkip(lead.id);
  };

  const handleSkipToast = () => {
    if (!lead) return;
    toast("Lead skipped", { style: { color: "#888" } });
    onSkip(lead.id);
  };

  const handleDiscard = (signalId: string) => {
    setDiscardedIds((prev) => new Set([...prev, signalId]));
    fetch("/api/signals/discard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ signal_id: signalId }),
    }).catch(() => {});
  };

  const handleRefreshIntel = async () => {
    if (!lead || refreshing) return;
    setRefreshing(true);
    try {
      await fetch("/api/leads/intelligence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leads: [
            {
              id: lead.id,
              first_name: lead.first_name,
              company: lead.company,
              role: lead.role,
              custom_note: lead.custom_note,
            },
          ],
        }),
      });
      window.location.reload();
    } catch {
      setRefreshing(false);
    }
  };

  const handleGithubCheck = async () => {
    if (!lead || !githubUrl.trim() || githubLoading) return;
    setGithubLoading(true);
    try {
      const res = await fetch("/api/signals/github/detect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead_id: lead.id, repo_url: githubUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "GitHub check failed");
        return;
      }
      if (data.signals?.length > 0) {
        setSignals((prev) => [...(data.signals as Signal[]), ...prev]);
        toast.success(data.message);
      } else {
        toast(data.message, { style: { color: "#888" } });
      }
      setShowGithubInput(false);
      setGithubUrl("");
    } catch {
      toast.error("GitHub check failed");
    } finally {
      setGithubLoading(false);
    }
  };

  const isOpen = !!lead;
  const score = lead
    ? getScore(index, totalLeads)
    : { label: "cold" as const, color: "#6b7280" };
  const intel = lead?.signal_data?.company_intel;
  const needsRefresh =
    lead?.signal_data?.last_updated
      ? isStale(lead.signal_data.last_updated)
      : false;
  const isPending =
    !lead?.signal_status ||
    lead.signal_status === "pending" ||
    lead.signal_status === "researching" ||
    sigLoading;

  const visibleSignals = signals
    .filter((s) => {
      if (!s.date_iso) return false;
      return (Date.now() - new Date(s.date_iso).getTime()) / 86_400_000 < 90;
    })
    .filter((s) => !discardedIds.has(s.id))
    .sort((a, b) => CONF_ORDER[getConfidence(a)] - CONF_ORDER[getConfidence(b)]);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.45)",
          zIndex: 40,
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
          transition: "opacity 200ms ease",
        }}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: 420,
          backgroundColor: "#0E0E18",
          borderLeft: "1px solid rgba(255,255,255,0.07)",
          zIndex: 50,
          display: "flex",
          flexDirection: "column",
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 300ms cubic-bezier(0.23, 1, 0.32, 1)",
          boxShadow: isOpen ? "-24px 0 80px rgba(0,0,0,0.6)" : "none",
          overflowY: "auto",
          overflowX: "hidden",
        }}
        role="dialog"
        aria-modal="true"
        aria-label={lead ? `${lead.first_name} lead details` : "Lead details"}
      >
        {lead && (
          <div key={lead.id} style={{ animation: "lp-fade 150ms ease" }}>
            {/* Header */}
            <div
              style={{
                padding: "20px 22px 18px",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                position: "sticky",
                top: 0,
                backgroundColor: "#0E0E18",
                zIndex: 2,
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 9,
                    flexWrap: "wrap",
                    marginBottom: 5,
                  }}
                >
                  <h2
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: "#fff",
                      fontFamily: "var(--font-space-grotesk)",
                      margin: 0,
                    }}
                  >
                    {lead.first_name}
                  </h2>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      padding: "2px 9px",
                      borderRadius: 999,
                      backgroundColor: `${score.color}22`,
                      color: score.color,
                      border: `1px solid ${score.color}44`,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      fontFamily: "var(--font-outfit)",
                    }}
                  >
                    {score.label}
                  </span>
                </div>
                <p
                  style={{
                    fontSize: 12,
                    color: "#666",
                    fontFamily: "var(--font-outfit)",
                    margin: 0,
                    lineHeight: 1.4,
                  }}
                >
                  {lead.role}
                  {lead.company && (
                    <>
                      {" "}
                      <span style={{ color: "#444" }}>at</span> {lead.company}
                    </>
                  )}
                </p>
                <p
                  style={{
                    fontSize: 11,
                    color: "#3a3a4a",
                    fontFamily: "var(--font-outfit)",
                    marginTop: 2,
                  }}
                >
                  {lead.email}
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                {(onPrev || onNext) && (
                  <div style={{
                    display: "flex", alignItems: "center", gap: 2,
                    padding: "2px 4px",
                    borderRadius: 7,
                    border: "1px solid rgba(255,255,255,0.07)",
                    backgroundColor: "rgba(255,255,255,0.02)",
                    marginRight: 2,
                  }}>
                    <button
                      onClick={onPrev}
                      disabled={!onPrev || index <= 0}
                      aria-label="Previous lead"
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "center",
                        width: 22, height: 22, borderRadius: 5,
                        border: "none",
                        backgroundColor: "transparent",
                        color: !onPrev || index <= 0 ? "#2a2a36" : "#888",
                        cursor: !onPrev || index <= 0 ? "not-allowed" : "pointer",
                      }}
                    >
                      <ChevronLeft size={12} />
                    </button>
                    <span style={{
                      fontSize: 10, color: "#555", fontFamily: "var(--font-outfit)",
                      padding: "0 4px", whiteSpace: "nowrap",
                    }}>
                      {index + 1} of {totalLeads}
                    </span>
                    <button
                      onClick={onNext}
                      disabled={!onNext || index >= totalLeads - 1}
                      aria-label="Next lead"
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "center",
                        width: 22, height: 22, borderRadius: 5,
                        border: "none",
                        backgroundColor: "transparent",
                        color: !onNext || index >= totalLeads - 1 ? "#2a2a36" : "#888",
                        cursor: !onNext || index >= totalLeads - 1 ? "not-allowed" : "pointer",
                      }}
                    >
                      <ChevronRight size={12} />
                    </button>
                  </div>
                )}
                <button
                  onClick={onClose}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 30,
                    height: 30,
                    borderRadius: 7,
                    border: "1px solid rgba(255,255,255,0.07)",
                    backgroundColor: "rgba(255,255,255,0.02)",
                    color: "#444",
                    cursor: "pointer",
                    flexShrink: 0,
                    transition: "background-color 0.14s, color 0.14s",
                  }}
                  aria-label="Close panel"
                >
                  <X size={13} />
                </button>
              </div>
            </div>

            {/* Scrollable body */}
            <div
              style={{
                padding: "16px 22px 32px",
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              {/* Company Intel */}
              <div
                style={{
                  backgroundColor: "rgba(255,255,255,0.025)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 10,
                  padding: "14px 16px",
                }}
              >
                <p
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: "#444",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    fontFamily: "var(--font-outfit)",
                    marginBottom: 10,
                  }}
                >
                  Company Intel
                </p>
                {intel ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <p
                      style={{
                        fontSize: 12.5,
                        color: "#888",
                        fontFamily: "var(--font-outfit)",
                        lineHeight: 1.55,
                        marginBottom: 4,
                      }}
                    >
                      {intel.description}
                    </p>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 6,
                      }}
                    >
                      {intel.industry && (
                        <IntelChip label="Industry" value={intel.industry} />
                      )}
                      {intel.size && (
                        <IntelChip label="Size" value={intel.size} />
                      )}
                      {intel.funding_stage && (
                        <IntelChip
                          label="Stage"
                          value={intel.funding_stage}
                        />
                      )}
                      {intel.website && (
                        <IntelChip label="Web" value={intel.website} />
                      )}
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 6,
                    }}
                  >
                    <IntelChip label="Company" value={lead.company} />
                    <IntelChip label="Role" value={lead.role} />
                  </div>
                )}
              </div>

              {/* Signals */}
              <div
                style={{
                  backgroundColor: "rgba(255,255,255,0.018)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderLeft: "3px solid #FF5200",
                  borderRadius: "0 10px 10px 0",
                  padding: "14px 16px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 12,
                  }}
                >
                  <p
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      color: "#444",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      fontFamily: "var(--font-outfit)",
                    }}
                  >
                    Why we picked them
                  </p>
                  {needsRefresh && !refreshing && visibleSignals.length > 0 && (
                    <button
                      onClick={handleRefreshIntel}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        fontSize: 10,
                        color: "#555",
                        backgroundColor: "transparent",
                        border: "1px solid rgba(255,255,255,0.07)",
                        borderRadius: 5,
                        padding: "3px 8px",
                        cursor: "pointer",
                        fontFamily: "var(--font-outfit)",
                      }}
                    >
                      <RotateCcw size={9} />
                      Refresh intel
                    </button>
                  )}
                </div>

                {isPending ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "4px 0",
                    }}
                  >
                    <div style={{ display: "flex", gap: 4 }}>
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          style={{
                            width: 5,
                            height: 5,
                            borderRadius: "50%",
                            backgroundColor: "rgba(255,82,0,0.5)",
                            animation: "panel-think 1.4s ease-in-out infinite",
                            animationDelay: `${i * 0.18}s`,
                          }}
                        />
                      ))}
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        color: "#555",
                        fontFamily: "var(--font-outfit)",
                      }}
                    >
                      Researching signals...
                    </span>
                  </div>
                ) : visibleSignals.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {visibleSignals.map((sig) => {
                      const conf = getConfidence(sig);
                      const confColor =
                        conf === "HIGH" ? "#4ade80" : conf === "MEDIUM" ? "#F59E0B" : "#555";
                      return (
                        <div key={sig.id}>
                          <p
                            style={{
                              fontSize: 12.5,
                              color: "#aaa",
                              fontFamily: "var(--font-outfit)",
                              lineHeight: 1.5,
                              marginBottom: 6,
                            }}
                          >
                            {sig.text}
                          </p>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 5,
                              flexWrap: "wrap",
                            }}
                          >
                            <span
                              style={{
                                fontSize: 9.5,
                                padding: "1.5px 7px",
                                borderRadius: 4,
                                backgroundColor: "rgba(255,255,255,0.04)",
                                border: "1px solid rgba(255,255,255,0.07)",
                                color: "#555",
                                fontFamily: "var(--font-outfit)",
                              }}
                            >
                              {sig.source}
                            </span>
                            <span
                              style={{
                                fontSize: 10,
                                color: "#3a3a4a",
                                fontFamily: "var(--font-outfit)",
                              }}
                            >
                              {sig.date}
                            </span>
                            <span
                              style={{
                                fontSize: 9,
                                padding: "1.5px 6px",
                                borderRadius: 4,
                                color: confColor,
                                border: `1px solid ${confColor}44`,
                                fontFamily: "var(--font-outfit)",
                                letterSpacing: "0.05em",
                              }}
                            >
                              {conf}
                            </span>
                            {signalScores[sig.source] && (
                              <span
                                title={`Converts ${signalScores[sig.source].conversion_rate}% for ${scoresFounderType} founders`}
                                style={{
                                  fontSize: 9,
                                  padding: "1.5px 6px",
                                  borderRadius: 4,
                                  color: "#FF5200",
                                  border: "1px solid rgba(255,82,0,0.3)",
                                  fontFamily: "var(--font-outfit)",
                                  letterSpacing: "0.04em",
                                  cursor: "default",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {signalScores[sig.source].score}/10
                              </span>
                            )}
                            {sig.source_url ? (
                              <a
                                href={sig.source_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  fontSize: 10,
                                  color: "#555",
                                  backgroundColor: "transparent",
                                  border: "1px solid rgba(255,255,255,0.07)",
                                  borderRadius: 4,
                                  padding: "1.5px 7px",
                                  fontFamily: "var(--font-outfit)",
                                  textDecoration: "none",
                                }}
                              >
                                ↗ Verify
                              </a>
                            ) : (
                              <button
                                disabled
                                title="Source not available"
                                style={{
                                  fontSize: 10,
                                  color: "#2a2a36",
                                  backgroundColor: "transparent",
                                  border: "1px solid rgba(255,255,255,0.04)",
                                  borderRadius: 4,
                                  padding: "1.5px 7px",
                                  cursor: "not-allowed",
                                  fontFamily: "var(--font-outfit)",
                                }}
                              >
                                ↗ Verify
                              </button>
                            )}
                            <button
                              onClick={() => handleDiscard(sig.id)}
                              title="Discard signal"
                              style={{
                                marginLeft: "auto",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: 18,
                                height: 18,
                                backgroundColor: "transparent",
                                border: "none",
                                color: "#3a3a4a",
                                cursor: "pointer",
                                padding: 0,
                                borderRadius: 3,
                                flexShrink: 0,
                              }}
                            >
                              <X size={10} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {lead.custom_note && (
                      <p
                        style={{
                          fontSize: 12.5,
                          color: "#666",
                          fontFamily: "var(--font-outfit)",
                          lineHeight: 1.55,
                          fontStyle: "italic",
                        }}
                      >
                        &ldquo;{lead.custom_note}&rdquo;
                      </p>
                    )}
                    <button
                      onClick={handleRefreshIntel}
                      disabled={refreshing}
                      style={{
                        alignSelf: "flex-start",
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        fontSize: 11,
                        color: "#FF5200",
                        backgroundColor: "transparent",
                        border: "1px solid rgba(255,82,0,0.22)",
                        borderRadius: 6,
                        padding: "5px 11px",
                        cursor: refreshing ? "not-allowed" : "pointer",
                        fontFamily: "var(--font-outfit)",
                        opacity: refreshing ? 0.6 : 1,
                      }}
                    >
                      <RotateCcw size={10} />
                      {refreshing ? "Researching..." : "Find signals"}
                    </button>
                  </div>
                )}

                {/* GitHub signal check */}
                <div style={{ marginTop: 10, borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: 10 }}>
                  {showGithubInput ? (
                    <div style={{ display: "flex", gap: 6 }}>
                      <input
                        value={githubUrl}
                        onChange={(e) => setGithubUrl(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleGithubCheck();
                          if (e.key === "Escape") setShowGithubInput(false);
                        }}
                        placeholder="github.com/owner/repo"
                        className="nx-input"
                        style={{ flex: 1, fontSize: 11, padding: "5px 9px" }}
                        autoFocus
                      />
                      <button
                        onClick={handleGithubCheck}
                        disabled={githubLoading || !githubUrl.trim()}
                        style={{
                          fontSize: 11,
                          color: "#fff",
                          backgroundColor: githubLoading || !githubUrl.trim() ? "rgba(255,82,0,0.3)" : "#FF5200",
                          border: "none",
                          borderRadius: 6,
                          padding: "5px 11px",
                          cursor: githubLoading || !githubUrl.trim() ? "not-allowed" : "pointer",
                          fontFamily: "var(--font-outfit)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {githubLoading ? "Checking..." : "Check"}
                      </button>
                      <button
                        onClick={() => { setShowGithubInput(false); setGithubUrl(""); }}
                        style={{
                          display: "flex", alignItems: "center", justifyContent: "center",
                          width: 28, height: 28, borderRadius: 6,
                          border: "1px solid rgba(255,255,255,0.07)",
                          backgroundColor: "transparent", color: "#444", cursor: "pointer",
                        }}
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowGithubInput(true)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        fontSize: 10,
                        color: "#555",
                        backgroundColor: "transparent",
                        border: "1px solid rgba(255,255,255,0.07)",
                        borderRadius: 5,
                        padding: "3px 8px",
                        cursor: "pointer",
                        fontFamily: "var(--font-outfit)",
                      }}
                    >
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                      </svg>
                      Check GitHub
                    </button>
                  )}
                </div>
              </div>

              {/* Timing Badge */}
              <TimingBadge signalData={lead.signal_data} />

              {/* Email Preview */}
              <div
                style={{
                  backgroundColor: "rgba(255,255,255,0.025)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 10,
                  padding: "14px 16px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 12,
                  }}
                >
                  <p
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      color: "#444",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      fontFamily: "var(--font-outfit)",
                    }}
                  >
                    Email
                  </p>
                  {!editingEmail && (
                    <button
                      onClick={() => setEditingEmail(true)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        fontSize: 10,
                        color: "#555",
                        backgroundColor: "transparent",
                        border: "1px solid rgba(255,255,255,0.07)",
                        borderRadius: 5,
                        padding: "3px 8px",
                        cursor: "pointer",
                        fontFamily: "var(--font-outfit)",
                        transition: "color 0.14s",
                      }}
                    >
                      <Pencil size={9} />
                      Edit
                    </button>
                  )}
                </div>

                {editingEmail ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <input
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="nx-input"
                      placeholder="Subject..."
                      style={{
                        fontSize: 12,
                        padding: "7px 10px",
                        fontWeight: 500,
                      }}
                    />
                    <textarea
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      className="nx-input"
                      rows={8}
                      style={{
                        fontSize: 12,
                        padding: "7px 10px",
                        resize: "vertical",
                        lineHeight: 1.65,
                      }}
                    />
                    <button
                      onClick={() => setEditingEmail(false)}
                      style={{
                        alignSelf: "flex-end",
                        fontSize: 11,
                        fontWeight: 600,
                        color: "#fff",
                        backgroundColor: "#FF5200",
                        border: "none",
                        borderRadius: 6,
                        padding: "5px 12px",
                        cursor: "pointer",
                        fontFamily: "var(--font-outfit)",
                      }}
                    >
                      Done
                    </button>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                    <p
                      style={{
                        fontSize: 12.5,
                        fontWeight: 600,
                        color: "#ccc",
                        fontFamily: "var(--font-space-grotesk)",
                        lineHeight: 1.4,
                      }}
                    >
                      {subject}
                    </p>
                    <div
                      style={{
                        height: 1,
                        backgroundColor: "rgba(255,255,255,0.04)",
                      }}
                    />
                    <p
                      style={{
                        fontSize: 12,
                        color: "#777",
                        fontFamily: "var(--font-outfit)",
                        lineHeight: 1.7,
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {body}
                    </p>
                  </div>
                )}
              </div>

              {/* Action Row */}
              <div style={{ display: "flex", gap: 8, paddingTop: 2 }}>
                <button
                  onClick={handleSend}
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 7,
                    padding: "10px 16px",
                    borderRadius: 999,
                    border: "none",
                    backgroundColor: "#FF5200",
                    color: "#fff",
                    fontSize: 13,
                    fontWeight: 600,
                    fontFamily: "var(--font-outfit)",
                    cursor: "pointer",
                    transition: "background-color 0.14s",
                  }}
                >
                  <Send size={12} />
                  Send now
                </button>
                <button
                  onClick={handleSkipToast}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    padding: "10px 14px",
                    borderRadius: 999,
                    border: "1px solid rgba(255,255,255,0.08)",
                    backgroundColor: "transparent",
                    color: "#555",
                    fontSize: 13,
                    fontFamily: "var(--font-outfit)",
                    cursor: "pointer",
                    transition: "border-color 0.14s, color 0.14s",
                    whiteSpace: "nowrap",
                  }}
                >
                  <SkipForward size={12} />
                  Skip
                </button>
                <button
                  onClick={handleCopy}
                  title={copied ? "Copied!" : "Copy email"}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 42,
                    height: 42,
                    borderRadius: 999,
                    border: "1px solid rgba(255,255,255,0.08)",
                    backgroundColor: "transparent",
                    color: copied ? "#4ade80" : "#555",
                    cursor: "pointer",
                    flexShrink: 0,
                    transition: "color 0.14s",
                  }}
                  aria-label="Copy email"
                >
                  {copied ? <Check size={13} /> : <Copy size={13} />}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes panel-think {
          0%, 80%, 100% { transform: scale(0.65); opacity: 0.3; }
          40% { transform: scale(1); opacity: 1; }
        }
        @keyframes lp-fade {
          from { opacity: 0; transform: translateX(4px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </>
  );
}
