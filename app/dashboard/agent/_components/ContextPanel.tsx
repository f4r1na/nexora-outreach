"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ActiveCampaign } from "../_lib/types";

export function ContextPanel() {
  const [campaign, setCampaign] = useState<ActiveCampaign | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/campaigns/active")
      .then((r) => r.json())
      .then((data) => {
        setCampaign(data.campaign ?? null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
        <div className="skeleton" style={{ height: 12, width: "60%", borderRadius: 4 }} />
        <div className="skeleton" style={{ height: 16, width: "80%", borderRadius: 4 }} />
        <div className="skeleton" style={{ height: 10, width: "45%", borderRadius: 4 }} />
        <div className="skeleton" style={{ height: 4, borderRadius: 999 }} />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: 16 }}>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 10, fontFamily: "var(--font-outfit)", lineHeight: 1.4 }}>
          No active campaign
        </p>
        <Link href="/dashboard/campaigns/new" style={{ fontSize: 13, color: "#FF5200", textDecoration: "none", fontFamily: "var(--font-outfit)" }}>
          Start a campaign &rarr;
        </Link>
      </div>
    );
  }

  const pct = campaign.lead_count > 0 ? Math.round((campaign.emails_sent / campaign.lead_count) * 100) : 0;

  return (
    <div style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: 16 }}>
      <p style={{ fontSize: 13, fontWeight: 600, color: "#fff", marginBottom: 6, fontFamily: "var(--font-space-grotesk)", wordBreak: "break-word", lineHeight: 1.4 }}>
        {campaign.name}
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12, alignItems: "center" }}>
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontFamily: "var(--font-outfit)" }}>
          {campaign.lead_count} leads
        </span>
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }}>·</span>
        <span style={{ fontSize: 12, color: "#4ade80", fontFamily: "var(--font-outfit)" }}>
          {campaign.status}
        </span>
      </div>
      <div style={{ height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 999, overflow: "hidden", marginBottom: 6 }}>
        <div style={{ width: `${pct}%`, height: "100%", background: "linear-gradient(90deg, #FF5200, #F59E0B)", borderRadius: 999, transition: "width 600ms ease" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "var(--font-outfit)" }}>{pct}% sent</span>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "var(--font-outfit)" }}>{campaign.emails_sent} / {campaign.lead_count}</span>
      </div>
    </div>
  );
}
