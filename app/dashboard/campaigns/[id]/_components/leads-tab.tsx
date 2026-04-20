"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import LeadPanel, { Lead } from "./lead-panel";

function getSignalDot(lead: Lead): { color: string; title: string } {
  const s = lead.signal_status;
  if (s === "researching") return { color: "#F59E0B", title: "Researching signals..." };
  if (s === "failed" || !s || s === "pending") return { color: "#3a3a4a", title: "No signals" };
  if (s !== "done" || !lead.signal_data?.last_updated)
    return { color: "#3a3a4a", title: "No signals" };
  const days =
    (Date.now() - new Date(lead.signal_data.last_updated).getTime()) / 86_400_000;
  if (days > 30) return { color: "#3a3a4a", title: "Signals outdated" };
  if (days > 7) return { color: "#F59E0B", title: "Signals aging (7-30 days)" };
  return { color: "#4ade80", title: "Fresh signals" };
}

export default function LeadsTab({ leads }: { leads: Lead[] }) {
  const router = useRouter();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [enriching, setEnriching] = useState(false);
  const enrichFiredRef = useRef(false);

  // Background enrichment: trigger for leads with pending/null signals
  useEffect(() => {
    if (enrichFiredRef.current || leads.length === 0) return;
    const pending = leads.filter(
      (l) => !l.signal_status || l.signal_status === "pending"
    );
    if (pending.length === 0) return;
    enrichFiredRef.current = true;
    setEnriching(true);

    fetch("/api/leads/intelligence", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        leads: pending.map((l) => ({
          id: l.id,
          first_name: l.first_name,
          company: l.company,
          role: l.role,
          custom_note: l.custom_note,
        })),
      }),
    })
      .then(() => {
        setEnriching(false);
        router.refresh();
      })
      .catch(() => setEnriching(false));
  }, []);

  const handleSelect = useCallback((lead: Lead, i: number) => {
    setSelectedLead(lead);
    setSelectedIndex(i);
  }, []);

  const handleClose = useCallback(() => setSelectedLead(null), []);

  const handleSkip = useCallback(
    (leadId: string) => {
      const i = leads.findIndex((l) => l.id === leadId);
      if (i < leads.length - 1) {
        setSelectedLead(leads[i + 1]);
        setSelectedIndex(i + 1);
      } else {
        setSelectedLead(null);
      }
    },
    [leads]
  );

  if (leads.length === 0) {
    return (
      <div
        style={{
          padding: "48px 0",
          textAlign: "center",
          color: "#444",
          fontFamily: "var(--font-outfit)",
          fontSize: 13,
        }}
      >
        No emails generated yet.
      </div>
    );
  }

  return (
    <>
      {/* Enrichment banner */}
      {enriching && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 16px",
            marginBottom: 12,
            backgroundColor: "rgba(255,82,0,0.06)",
            border: "1px solid rgba(255,82,0,0.15)",
            borderRadius: 8,
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
                  backgroundColor: "rgba(255,82,0,0.6)",
                  animation: "lt-think 1.4s ease-in-out infinite",
                  animationDelay: `${i * 0.18}s`,
                }}
              />
            ))}
          </div>
          <span
            style={{
              fontSize: 12,
              color: "rgba(255,82,0,0.8)",
              fontFamily: "var(--font-outfit)",
            }}
          >
            Researching signals for {leads.length} leads in the background...
          </span>
        </div>
      )}

      {/* Column headers */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1.5fr 1.5fr 48px",
          gap: 12,
          padding: "0 14px 8px",
        }}
      >
        {["Lead", "Company", "Role", "Intel"].map((h, i) => (
          <p
            key={h}
            style={{
              fontSize: 10,
              color: "#3a3a4a",
              fontFamily: "var(--font-outfit)",
              textTransform: "uppercase",
              letterSpacing: "0.07em",
              textAlign: i === 3 ? "center" : "left",
            }}
          >
            {h}
          </p>
        ))}
      </div>

      {/* Rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {leads.map((lead, i) => {
          const dot = getSignalDot(
            enriching && (!lead.signal_status || lead.signal_status === "pending")
              ? { ...lead, signal_status: "researching" }
              : lead
          );
          const isSelected = selectedLead?.id === lead.id;

          return (
            <button
              key={lead.id}
              onClick={() => handleSelect(lead, i)}
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1.5fr 1.5fr 48px",
                gap: 12,
                alignItems: "center",
                padding: "12px 14px",
                backgroundColor: isSelected
                  ? "rgba(255,82,0,0.06)"
                  : "rgba(255,255,255,0.018)",
                border: `1px solid ${
                  isSelected
                    ? "rgba(255,82,0,0.18)"
                    : "rgba(255,255,255,0.05)"
                }`,
                borderRadius: 9,
                cursor: "pointer",
                textAlign: "left",
                width: "100%",
                transition: "background-color 0.14s, border-color 0.14s",
              }}
            >
              <div style={{ minWidth: 0 }}>
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: "#ccc",
                    fontFamily: "var(--font-outfit)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {lead.first_name}
                </p>
                <p
                  style={{
                    fontSize: 10.5,
                    color: "#444",
                    fontFamily: "var(--font-outfit)",
                    marginTop: 1,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {lead.email}
                </p>
              </div>

              <p
                style={{
                  fontSize: 12.5,
                  color: "#666",
                  fontFamily: "var(--font-outfit)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {lead.company}
              </p>

              <p
                style={{
                  fontSize: 12,
                  color: "#555",
                  fontFamily: "var(--font-outfit)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {lead.role}
              </p>

              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <div
                  title={dot.title}
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    backgroundColor: dot.color,
                    flexShrink: 0,
                    boxShadow:
                      dot.color === "#4ade80"
                        ? "0 0 7px rgba(74,222,128,0.5)"
                        : dot.color === "#F59E0B"
                        ? "0 0 7px rgba(245,158,11,0.4)"
                        : "none",
                    transition: "background-color 0.4s, box-shadow 0.4s",
                  }}
                />
              </div>
            </button>
          );
        })}
      </div>

      <LeadPanel
        lead={selectedLead}
        index={selectedIndex}
        totalLeads={leads.length}
        onClose={handleClose}
        onSkip={handleSkip}
      />

      <style>{`
        @keyframes lt-think {
          0%, 80%, 100% { transform: scale(0.65); opacity: 0.3; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </>
  );
}
