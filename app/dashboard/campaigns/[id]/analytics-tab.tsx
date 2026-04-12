"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", fontFamily: "var(--font-outfit)" }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color, fontFamily: "var(--font-outfit)" }}>{value}%</span>
      </div>
      <div style={{ height: 5, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden" }}>
        <div style={{
          height: "100%", borderRadius: 99,
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
      backgroundColor: "#0a0a0a",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 12, padding: "18px 20px", flex: 1, minWidth: 0,
    }}>
      <div style={{ fontSize: 28, fontWeight: 800, color: color ?? "#fff", fontFamily: "var(--font-syne)", lineHeight: 1, marginBottom: 5 }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", fontFamily: "var(--font-outfit)" }}>
        {label}
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
          Upgrade to Pro to unlock Analytics
        </h3>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", fontFamily: "var(--font-outfit)", maxWidth: 360, lineHeight: 1.6, margin: 0 }}>
          Track open rates, click rates, and reply rates for this campaign.
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
        Loading analytics…
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

  if (!stats || stats.sent === 0) {
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", padding: "80px 0", textAlign: "center", gap: 12,
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: 14,
          backgroundColor: "rgba(255,82,0,0.08)", border: "1px solid rgba(255,82,0,0.15)",
          display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,82,0,0.5)",
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="12" width="4" height="9" rx="1" stroke="currentColor" strokeWidth="1.5" />
            <rect x="10" y="7" width="4" height="14" rx="1" stroke="currentColor" strokeWidth="1.5" />
            <rect x="17" y="3" width="4" height="18" rx="1" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </div>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: "#fff", fontFamily: "var(--font-syne)", margin: 0 }}>
          No data yet
        </h3>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", fontFamily: "var(--font-outfit)", maxWidth: 300, lineHeight: 1.6, margin: 0 }}>
          Send this campaign to start tracking opens, clicks, and replies.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Volume stats */}
      <div style={{ display: "flex", gap: 12 }}>
        <StatBlock label="Emails Sent" value={stats.sent} color="#FF5200" />
        <StatBlock label="Opened" value={stats.opened} />
        <StatBlock label="Clicked" value={stats.clicked} />
        <StatBlock label="Replied" value={stats.replied} color="#4ade80" />
      </div>

      {/* Rate bars */}
      <div style={{
        backgroundColor: "#0a0a0a",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 12, padding: "20px 22px",
        display: "flex", flexDirection: "column", gap: 16,
      }}>
        <RateBar label="Open Rate" value={stats.open_rate} color="#FF5200" />
        <RateBar label="Click Rate" value={stats.click_rate} color="#60a5fa" />
        <RateBar label="Reply Rate" value={stats.reply_rate} color="#4ade80" />
      </div>
    </div>
  );
}
