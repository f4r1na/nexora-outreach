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
      <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: 10, display: "flex", flexDirection: "column", gap: 8 }}>
        <div className="skeleton" style={{ height: 10, width: "55%", borderRadius: 4 }} />
        <div className="skeleton" style={{ height: 14, width: "75%", borderRadius: 4 }} />
        <div className="skeleton" style={{ height: 8, width: "40%", borderRadius: 4 }} />
        <div className="skeleton" style={{ height: 3, borderRadius: 999 }} />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: 10 }}>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", marginBottom: 8, fontFamily: "var(--font-outfit)" }}>
          No active campaign
        </p>
        <Link href="/dashboard/campaigns/new" style={{ fontSize: 12, color: "#FF5200", textDecoration: "none" }}>
          Start a campaign
        </Link>
      </div>
    );
  }

  const pct = campaign.lead_count > 0 ? Math.round((campaign.emails_sent / campaign.lead_count) * 100) : 0;

  return (
    <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: 10 }}>
      <p style={{ fontSize: 11, fontWeight: 600, color: "#fff", marginBottom: 4, fontFamily: "var(--font-space-grotesk)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {campaign.name}
      </p>
      <div style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{campaign.lead_count} leads</span>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>·</span>
        <span style={{ fontSize: 11, color: "#4ade80" }}>{campaign.status}</span>
      </div>
      <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 999, overflow: "hidden", marginBottom: 4 }}>
        <div style={{ width: `${pct}%`, height: "100%", background: "linear-gradient(90deg, #FF5200, #F59E0B)", borderRadius: 999 }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>{pct}% sent</span>
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>{campaign.emails_sent} / {campaign.lead_count}</span>
      </div>
    </div>
  );
}
