"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Lock } from "lucide-react";

type CampaignStats = {
  sent: number;
  opened: number;
  clicked: number;
  replied: number;
  open_rate: number;
  click_rate: number;
  reply_rate: number;
};

function RateBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 12, color: "#555", fontFamily: "var(--font-outfit)" }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 400, color, fontFamily: "var(--font-outfit)" }}>{value}%</span>
      </div>
      <div style={{ height: 3, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
        <div style={{
          height: "100%", borderRadius: 2,
          width: `${value}%`,
          backgroundColor: color,
          transition: "width 0.6s ease",
        }} />
      </div>
    </div>
  );
}

function StatBlock({ label, value, color }: { label: string; value: number | string; color?: string }) {
  return (
    <div style={{
      backgroundColor: "#0e0e0e",
      border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: 10, padding: "18px 22px", flex: 1, minWidth: 0,
    }}>
      <div className="nx-section-label" style={{ marginBottom: 10 }}>
        {label}
      </div>
      <div style={{ fontSize: 24, fontWeight: 500, color: color ?? "#fff", fontFamily: "var(--font-syne)", lineHeight: 1 }}>
        {value}
      </div>
    </div>
  );
}

export default function AnalyticsTab({
  campaignId,
  plan,
}: {
  campaignId: string;
  plan: string;
}) {
  const [stats, setStats] = useState<CampaignStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isProOrAgency = plan === "pro" || plan === "agency";

  useEffect(() => {
    if (!isProOrAgency) { setLoading(false); return; }

    fetch("/api/analytics")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) { setError(d.error); setLoading(false); return; }
        const match = (d.campaigns as Array<{ id: string } & CampaignStats>)
          .find((c) => c.id === campaignId);
        if (match) {
          setStats({
            sent: match.sent,
            opened: match.opened,
            clicked: match.clicked,
            replied: match.replied,
            open_rate: match.open_rate,
            click_rate: match.click_rate,
            reply_rate: match.reply_rate,
          });
        } else {
          setStats({ sent: 0, opened: 0, clicked: 0, replied: 0, open_rate: 0, click_rate: 0, reply_rate: 0 });
        }
        setLoading(false);
      })
      .catch(() => { setError("Failed to load analytics"); setLoading(false); });
  }, [campaignId, isProOrAgency]);

  if (!isProOrAgency) {
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", padding: "80px 0", textAlign: "center", gap: 14,
      }}>
        <div style={{ color: "#444" }}>
          <Lock size={20} strokeWidth={1.5} aria-hidden="true" />
        </div>
        <h3 style={{ fontSize: 15, fontWeight: 500, color: "#ccc", fontFamily: "var(--font-syne)", margin: 0 }}>
          Analytics requires Pro
        </h3>
        <p style={{ fontSize: 13, color: "#555", fontFamily: "var(--font-outfit)", maxWidth: 360, lineHeight: 1.6, margin: 0 }}>
          Track open rates, click rates, and reply rates for this campaign.
        </p>
        <Link href="/dashboard/settings" style={{
          display: "inline-flex", alignItems: "center",
          padding: "8px 16px", backgroundColor: "#FF5200", color: "#fff",
          borderRadius: 6, fontSize: 13, fontWeight: 500,
          fontFamily: "var(--font-outfit)", textDecoration: "none",
        }}>
          View plans
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: "40px 0", color: "#444", fontFamily: "var(--font-outfit)", fontSize: 13 }}>
        Loading analytics…
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        padding: "10px 14px", borderRadius: 6,
        backgroundColor: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)",
        color: "#f87171", fontFamily: "var(--font-outfit)", fontSize: 13,
      }}>
        {error}
      </div>
    );
  }

  if (!stats || stats.sent === 0) {
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", padding: "80px 0", textAlign: "center", gap: 12,
      }}>
        <p style={{ fontSize: 13, color: "#444", fontFamily: "var(--font-outfit)", margin: 0 }}>
          No data yet. Send this campaign to start tracking opens, clicks, and replies.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Volume stats */}
      <div style={{ display: "flex", gap: 10 }}>
        <StatBlock label="Emails Sent" value={stats.sent} color="#FF5200" />
        <StatBlock label="Opened" value={stats.opened} />
        <StatBlock label="Clicked" value={stats.clicked} />
        <StatBlock label="Replied" value={stats.replied} color="#4ade80" />
      </div>

      {/* Rate bars */}
      <div style={{
        backgroundColor: "#0e0e0e",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 10, padding: "18px 22px",
        display: "flex", flexDirection: "column", gap: 14,
      }}>
        <RateBar label="Open rate" value={stats.open_rate} color="#FF5200" />
        <RateBar label="Click rate" value={stats.click_rate} color="#60a5fa" />
        <RateBar label="Reply rate" value={stats.reply_rate} color="#4ade80" />
      </div>
    </div>
  );
}
