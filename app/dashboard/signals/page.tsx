"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

type SignalData = {
  company_insights: string;
  role_insights: string;
  pain_points: string[];
  talking_points: string[];
  recent_signals: string[];
  personalization_hooks: string[];
};

type SignalLead = {
  id: string;
  campaign_id: string;
  campaign_name: string;
  first_name: string | null;
  company: string | null;
  role: string | null;
  email: string | null;
  signal_data: SignalData;
  created_at: string;
};

type Campaign = {
  id: string;
  name: string;
  created_at: string;
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

// ─── Signal Card ──────────────────────────────────────────────────────────────

function SignalCard({ lead }: { lead: SignalLead }) {
  const [expanded, setExpanded] = useState(false);
  const sd = lead.signal_data;

  return (
    <div style={{
      backgroundColor: "#0e0e0e",
      border: "1px solid rgba(255,255,255,0.07)",
      borderLeft: "3px solid rgba(255,82,0,0.4)",
      borderRadius: 12, padding: "16px 18px",
    }}>
      {/* Lead header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12, gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#fff", fontFamily: "var(--font-syne)", margin: 0 }}>
              {lead.first_name || "Unknown"}
            </p>
            {lead.company && (
              <span style={{
                fontSize: 11, fontWeight: 600, color: "#FF5200",
                backgroundColor: "rgba(255,82,0,0.08)",
                border: "1px solid rgba(255,82,0,0.2)",
                padding: "2px 8px", borderRadius: 999,
                fontFamily: "var(--font-outfit)",
              }}>
                {lead.company}
              </span>
            )}
          </div>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "var(--font-outfit)", margin: 0 }}>
            {lead.role && <span>{lead.role}</span>}
            {lead.role && lead.campaign_name && <span> · </span>}
            {lead.campaign_name && <span style={{ color: "rgba(255,82,0,0.5)" }}>{lead.campaign_name}</span>}
          </p>
        </div>
        <span style={{ fontSize: 18, flexShrink: 0 }}>🛰️</span>
      </div>

      {/* Company insights */}
      {sd.company_insights && (
        <div style={{
          padding: "10px 12px", borderRadius: 8,
          backgroundColor: "rgba(255,82,0,0.04)",
          border: "1px solid rgba(255,82,0,0.1)",
          marginBottom: 10,
        }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,82,0,0.5)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 5, fontFamily: "var(--font-outfit)" }}>
            Company Insights
          </p>
          <p style={{ fontSize: 12.5, color: "rgba(255,255,255,0.65)", fontFamily: "var(--font-outfit)", lineHeight: 1.6, margin: 0 }}>
            {sd.company_insights}
          </p>
        </div>
      )}

      {/* Pain points */}
      {sd.pain_points?.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 10 }}>
          {sd.pain_points.map((p, i) => (
            <span key={i} style={{
              fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 999,
              backgroundColor: "rgba(255,82,0,0.07)",
              border: "1px solid rgba(255,82,0,0.15)",
              color: "rgba(255,82,0,0.7)", fontFamily: "var(--font-outfit)",
            }}>
              {p}
            </span>
          ))}
        </div>
      )}

      {/* Expand toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          fontSize: 11, color: "rgba(255,255,255,0.3)", background: "none", border: "none",
          cursor: "pointer", fontFamily: "var(--font-outfit)", padding: 0, marginBottom: expanded ? 10 : 0,
        }}
      >
        {expanded ? "Hide details ↑" : "More details ↓"}
      </button>

      {expanded && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {sd.role_insights && (
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.2)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4, fontFamily: "var(--font-outfit)" }}>
                Role Insights
              </p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontFamily: "var(--font-outfit)", lineHeight: 1.55, margin: 0 }}>{sd.role_insights}</p>
            </div>
          )}
          {sd.talking_points?.length > 0 && (
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.2)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4, fontFamily: "var(--font-outfit)" }}>
                Talking Points
              </p>
              <ul style={{ margin: 0, paddingLeft: 16 }}>
                {sd.talking_points.map((t, i) => (
                  <li key={i} style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontFamily: "var(--font-outfit)", lineHeight: 1.55, marginBottom: 3 }}>{t}</li>
                ))}
              </ul>
            </div>
          )}
          {sd.personalization_hooks?.length > 0 && (
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.2)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4, fontFamily: "var(--font-outfit)" }}>
                Personalization Hooks
              </p>
              <ul style={{ margin: 0, paddingLeft: 16 }}>
                {sd.personalization_hooks.map((h, i) => (
                  <li key={i} style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontFamily: "var(--font-outfit)", lineHeight: 1.55, marginBottom: 3 }}>{h}</li>
                ))}
              </ul>
            </div>
          )}
          {sd.recent_signals?.length > 0 && (
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.2)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4, fontFamily: "var(--font-outfit)" }}>
                Signals
              </p>
              <ul style={{ margin: 0, paddingLeft: 16 }}>
                {sd.recent_signals.map((s, i) => (
                  <li key={i} style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontFamily: "var(--font-outfit)", lineHeight: 1.55, marginBottom: 3 }}>{s}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SignalsPage() {
  const [plan, setPlan] = useState<string | null>(null);
  const [planLoading, setPlanLoading] = useState(true);

  const [signals, setSignals] = useState<SignalLead[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterCampaign, setFilterCampaign] = useState<string>("all");

  useEffect(() => {
    fetch("/api/subscription")
      .then((r) => r.json())
      .then((d) => { setPlan(d.subscription?.plan ?? "free"); setPlanLoading(false); })
      .catch(() => { setPlan("free"); setPlanLoading(false); });
  }, []);

  useEffect(() => {
    fetch("/api/signals")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) { setError(d.error); } else {
          setSignals(d.signals ?? []);
          setCampaigns(d.campaigns ?? []);
        }
        setLoading(false);
      })
      .catch(() => { setError("Failed to load signals"); setLoading(false); });
  }, []);

  const isProOrAgency = plan === "pro" || plan === "agency";

  const filtered = filterCampaign === "all"
    ? signals
    : signals.filter((s) => s.campaign_id === filterCampaign);

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      {/* Header */}
      <header style={{
        padding: "0 32px", height: 68,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        backgroundColor: "rgba(6,6,6,0.85)", backdropFilter: "blur(12px)",
        position: "sticky", top: 0, zIndex: 30, gap: 16,
      }}>
        <div>
          <h1 style={{
            fontSize: 17, fontWeight: 800, color: "#fff",
            fontFamily: "var(--font-syne)", margin: 0, lineHeight: 1.2,
          }}>
            Signal Radar
          </h1>
          <p style={{
            fontSize: 12, color: "rgba(255,255,255,0.35)",
            fontFamily: "var(--font-outfit)", margin: 0, marginTop: 2,
          }}>
            AI intelligence gathered on your leads
          </p>
        </div>
        {!planLoading && isProOrAgency && campaigns.length > 0 && (
          <select
            value={filterCampaign}
            onChange={(e) => setFilterCampaign(e.target.value)}
            style={{
              padding: "7px 12px", borderRadius: 8, fontSize: 12,
              backgroundColor: "#0e0e0e", color: "rgba(255,255,255,0.6)",
              border: "1px solid rgba(255,255,255,0.1)",
              fontFamily: "var(--font-outfit)", cursor: "pointer",
              outline: "none",
            }}
          >
            <option value="all">All Campaigns</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        )}
      </header>

      {/* Main */}
      <main style={{ flex: 1, padding: "36px 32px 64px" }}>

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
              backgroundColor: "rgba(255,82,0,0.1)",
              border: "1px solid rgba(255,82,0,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#FF5200",
            }}>
              <IconLock />
            </div>
            <div>
              <h2 style={{
                fontSize: 20, fontWeight: 800, color: "#fff",
                fontFamily: "var(--font-syne)", marginBottom: 8,
              }}>
                Upgrade to Pro to unlock Signal Radar
              </h2>
              <p style={{
                fontSize: 14, color: "rgba(255,255,255,0.4)",
                fontFamily: "var(--font-outfit)", lineHeight: 1.6, maxWidth: 400,
              }}>
                AI researches every lead before writing — surfacing pain points, company context, and personalization hooks that make cold emails actually land.
              </p>
            </div>
            <Link
              href="/dashboard/settings"
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "12px 28px", backgroundColor: "#FF5200", color: "#fff",
                borderRadius: 10, fontSize: 14, fontWeight: 700,
                fontFamily: "var(--font-outfit)", textDecoration: "none",
              }}
            >
              See Plans →
            </Link>
          </div>

        ) : loading ? (
          <div style={{ color: "rgba(255,255,255,0.25)", fontFamily: "var(--font-outfit)", fontSize: 13 }}>Loading intelligence…</div>

        ) : error ? (
          <div style={{
            padding: "12px 16px", borderRadius: 10,
            backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
            color: "#ef4444", fontFamily: "var(--font-outfit)", fontSize: 13,
          }}>
            {error}
          </div>

        ) : filtered.length === 0 ? (
          /* ── Empty state ── */
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            minHeight: 420, textAlign: "center", gap: 16,
          }}>
            <span style={{ fontSize: 48 }}>🛰️</span>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#fff", fontFamily: "var(--font-syne)", margin: 0 }}>
              {filterCampaign === "all" ? "No signals yet" : "No signals for this campaign"}
            </h3>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", fontFamily: "var(--font-outfit)", maxWidth: 340, lineHeight: 1.6, margin: 0 }}>
              {filterCampaign === "all"
                ? "Use Signal Radar when creating a campaign to gather AI intelligence on your leads."
                : "No leads in this campaign had Signal Radar research run on them."}
            </p>
            <Link
              href="/dashboard/campaigns/new"
              style={{
                marginTop: 4, display: "inline-flex", alignItems: "center", gap: 7,
                padding: "9px 20px", backgroundColor: "#FF5200", color: "#fff",
                borderRadius: 8, fontSize: 13, fontWeight: 700,
                fontFamily: "var(--font-outfit)", textDecoration: "none",
              }}
            >
              New Campaign →
            </Link>
          </div>

        ) : (
          /* ── Intelligence feed ── */
          <div>
            {/* Summary */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", fontFamily: "var(--font-outfit)" }}>
                {filtered.length} lead{filtered.length !== 1 ? "s" : ""} researched
              </span>
              <span style={{
                fontSize: 10, fontWeight: 700, color: "#4ade80",
                backgroundColor: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.2)",
                padding: "2px 8px", borderRadius: 999, fontFamily: "var(--font-outfit)",
              }}>
                Intelligence Ready
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {filtered.map((lead) => (
                <SignalCard key={lead.id} lead={lead} />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
