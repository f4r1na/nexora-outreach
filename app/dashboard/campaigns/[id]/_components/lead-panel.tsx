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
} from "lucide-react";

export type Signal = {
  type: string;
  text: string;
  source: string;
  date: string;
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
}: Props) {
  const [editingEmail, setEditingEmail] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [copied, setCopied] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
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
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [lead, onClose]);

  const handleCopy = () => {
    navigator.clipboard
      .writeText(`Subject: ${subject}\n\n${body}`)
      .catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

  const isOpen = !!lead;
  const score = lead
    ? getScore(index, totalLeads)
    : { label: "cold" as const, color: "#6b7280" };
  const signals = lead?.signal_data?.signals ?? [];
  const intel = lead?.signal_data?.company_intel;
  const needsRefresh =
    lead?.signal_data?.last_updated
      ? isStale(lead.signal_data.last_updated)
      : false;
  const isPending =
    !lead?.signal_status ||
    lead.signal_status === "pending" ||
    lead.signal_status === "researching";

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
          <>
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
                  {needsRefresh && !refreshing && signals.length > 0 && (
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
                ) : signals.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {signals.map((sig, i) => (
                      <div key={i}>
                        <p
                          style={{
                            fontSize: 12.5,
                            color: "#aaa",
                            fontFamily: "var(--font-outfit)",
                            lineHeight: 1.5,
                            marginBottom: 5,
                          }}
                        >
                          {sig.text}
                        </p>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
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
                        </div>
                      </div>
                    ))}
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
              </div>

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
                  onClick={() => onSkip(lead.id)}
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
                  onClick={() => onSkip(lead.id)}
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
          </>
        )}
      </div>

      <style>{`
        @keyframes panel-think {
          0%, 80%, 100% { transform: scale(0.65); opacity: 0.3; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </>
  );
}
