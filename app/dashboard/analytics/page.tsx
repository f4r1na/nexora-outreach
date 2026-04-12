"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────

type Stats = {
  sent: number;
  opened: number;
  clicked: number;
  replied: number;
  open_rate: number;
  click_rate: number;
  reply_rate: number;
};

type CampaignRow = {
  id: string;
  name: string;
  created_at: string;
  sent: number;
  opened: number;
  clicked: number;
  replied: number;
  open_rate: number;
  click_rate: number;
  reply_rate: number;
};

type DailyPoint = { date: string; count: number };

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconSent() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 2L11 13" />
      <path d="M22 2L15 22 11 13 2 9l20-7z" />
    </svg>
  );
}

function IconOpen() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function IconClick() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 9l10.5-3-3 10.5-2.5-5-5-2.5z" />
      <path d="M13.5 13.5l3 3" />
    </svg>
  );
}

function IconReply() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l5-5v3h8a4 4 0 010 8H9" />
    </svg>
  );
}

function IconLock() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  );
}

// ─── Rate colour ─────────────────────────────────────────────────────────────

function rateColor(pct: number) {
  if (pct >= 30) return "#4ade80";
  if (pct >= 10) return "#fbbf24";
  return "#f87171";
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}) {
  const color = accent ?? "#FF5200";
  return (
    <div style={{
      flex: 1, minWidth: 0,
      backgroundColor: "#0e0e0e",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 14, padding: "20px 22px",
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 10,
        backgroundColor: `${color}18`,
        border: `1px solid ${color}30`,
        display: "flex", alignItems: "center", justifyContent: "center",
        color, marginBottom: 14,
      }}>
        {icon}
      </div>
      <div style={{
        fontSize: 30, fontWeight: 800, color: "#fff",
        fontFamily: "var(--font-syne)", lineHeight: 1, marginBottom: 4,
      }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.38)", fontFamily: "var(--font-outfit)" }}>
        {label}
      </div>
      {sub && (
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.22)", fontFamily: "var(--font-outfit)", marginTop: 2 }}>
          {sub}
        </div>
      )}
    </div>
  );
}

// ─── Chart tooltip ────────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  const d = label ? new Date(label + "T00:00:00") : null;
  const formatted = d ? d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : label;
  return (
    <div style={{
      backgroundColor: "#0e0e0e",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 8, padding: "8px 12px",
      fontFamily: "var(--font-outfit)",
    }}>
      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>{formatted}</p>
      <p style={{ fontSize: 14, fontWeight: 700, color: "#FF5200" }}>{payload[0].value} sent</p>
    </div>
  );
}

// ─── Rate pill ────────────────────────────────────────────────────────────────

function RatePill({ pct }: { pct: number }) {
  const color = rateColor(pct);
  return (
    <span style={{
      fontSize: 11, fontWeight: 700,
      padding: "2px 8px", borderRadius: 999,
      backgroundColor: `${color}18`,
      border: `1px solid ${color}35`,
      color,
      fontFamily: "var(--font-outfit)",
    }}>
      {pct}%
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [plan, setPlan] = useState<string | null>(null);
  const [planLoading, setPlanLoading] = useState(true);

  const [stats, setStats] = useState<Stats | null>(null);
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [daily, setDaily] = useState<DailyPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/subscription")
      .then((r) => r.json())
      .then((d) => { setPlan(d.subscription?.plan ?? "free"); setPlanLoading(false); })
      .catch(() => { setPlan("free"); setPlanLoading(false); });
  }, []);

  useEffect(() => {
    fetch("/api/analytics")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) { setError(d.error); } else {
          setStats(d.stats);
          setCampaigns(d.campaigns ?? []);
          setDaily(d.daily ?? []);
        }
        setLoading(false);
      })
      .catch(() => { setError("Failed to load analytics"); setLoading(false); });
  }, []);

  const isProOrAgency = plan === "pro" || plan === "agency";
  const hasData = (stats?.sent ?? 0) > 0 || campaigns.length > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      {/* Header */}
      <header style={{
        padding: "0 32px", height: 68,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        backgroundColor: "rgba(6,6,6,0.85)", backdropFilter: "blur(12px)",
        position: "sticky", top: 0, zIndex: 30,
      }}>
        <div>
          <h1 style={{
            fontSize: 17, fontWeight: 800, color: "#fff",
            fontFamily: "var(--font-syne)", margin: 0, lineHeight: 1.2,
          }}>
            Analytics
          </h1>
          <p style={{
            fontSize: 12, color: "rgba(255,255,255,0.35)",
            fontFamily: "var(--font-outfit)", margin: 0, marginTop: 2,
          }}>
            Track your campaign performance
          </p>
        </div>
        {!planLoading && isProOrAgency && (
          <span style={{
            fontSize: 10, fontWeight: 800, color: "#FF5200",
            backgroundColor: "rgba(255,82,0,0.1)",
            border: "1px solid rgba(255,82,0,0.25)",
            padding: "4px 10px", borderRadius: 999,
            letterSpacing: "0.06em", textTransform: "uppercase",
            fontFamily: "var(--font-outfit)",
          }}>
            {plan === "agency" ? "Agency" : "Pro"}
          </span>
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
                Upgrade to Pro to unlock Analytics
              </h2>
              <p style={{
                fontSize: 14, color: "rgba(255,255,255,0.4)",
                fontFamily: "var(--font-outfit)", lineHeight: 1.6, maxWidth: 400,
              }}>
                Track open rates, click-through rates, and replies across all your campaigns. Know what works.
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
          <div style={{ color: "rgba(255,255,255,0.25)", fontFamily: "var(--font-outfit)", fontSize: 13 }}>Loading analytics…</div>

        ) : error ? (
          <div style={{
            padding: "12px 16px", borderRadius: 10,
            backgroundColor: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.2)",
            color: "#ef4444", fontFamily: "var(--font-outfit)", fontSize: 13,
          }}>
            {error}
          </div>

        ) : !hasData ? (
          /* ── Empty state ── */
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            minHeight: 420, textAlign: "center", gap: 16,
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: 16,
              backgroundColor: "rgba(255,82,0,0.08)",
              border: "1px solid rgba(255,82,0,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "rgba(255,82,0,0.5)",
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="12" width="4" height="9" rx="1" />
                <rect x="10" y="7" width="4" height="14" rx="1" />
                <rect x="17" y="3" width="4" height="18" rx="1" />
              </svg>
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#fff", fontFamily: "var(--font-syne)", margin: 0 }}>
              No analytics yet
            </h3>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", fontFamily: "var(--font-outfit)", maxWidth: 340, lineHeight: 1.6, margin: 0 }}>
              Send your first campaign to start tracking opens, clicks, and replies.
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
              Create Campaign →
            </Link>
          </div>

        ) : (
          /* ── Analytics content ── */
          <>
            {/* Stat cards */}
            <div style={{ display: "flex", gap: 14, marginBottom: 28, flexWrap: "wrap" }}>
              <StatCard
                icon={<IconSent />}
                label="Total Sent"
                value={stats?.sent ?? 0}
              />
              <StatCard
                icon={<IconOpen />}
                label="Open Rate"
                value={`${stats?.open_rate ?? 0}%`}
                sub={`${stats?.opened ?? 0} of ${stats?.sent ?? 0} opens`}
                accent="#60a5fa"
              />
              <StatCard
                icon={<IconClick />}
                label="Click Rate"
                value={`${stats?.click_rate ?? 0}%`}
                sub={`${stats?.clicked ?? 0} clicks tracked`}
                accent="#a78bfa"
              />
              <StatCard
                icon={<IconReply />}
                label="Reply Rate"
                value={`${stats?.reply_rate ?? 0}%`}
                sub={`${stats?.replied ?? 0} replies received`}
                accent="#4ade80"
              />
            </div>

            {/* Daily volume chart */}
            <div style={{
              backgroundColor: "#0e0e0e",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 14, padding: "22px 24px", marginBottom: 28,
            }}>
              <p style={{
                fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
                color: "rgba(255,255,255,0.25)", fontFamily: "var(--font-outfit)", marginBottom: 20,
              }}>
                Daily Send Volume — Last 30 Days
              </p>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={daily} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10, fontFamily: "var(--font-outfit)" }}
                    tickFormatter={(v: string) => {
                      const d = new Date(v + "T00:00:00");
                      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                    }}
                    interval={6}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10, fontFamily: "var(--font-outfit)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#FF5200"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: "#FF5200", strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Campaign table */}
            {campaigns.length > 0 && (
              <div style={{
                backgroundColor: "#0e0e0e",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 14, overflow: "hidden",
              }}>
                {/* Table header */}
                <div style={{
                  padding: "18px 22px 14px",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                }}>
                  <p style={{
                    fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
                    color: "rgba(255,255,255,0.25)", fontFamily: "var(--font-outfit)", margin: 0,
                  }}>
                    Campaign Performance
                  </p>
                </div>

                {/* Column labels */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 60px 60px 90px 60px 90px 60px 90px",
                  padding: "10px 22px",
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                }}>
                  {["Campaign", "Sent", "Opens", "Open Rate", "Clicks", "Click Rate", "Replies", "Reply Rate"].map((col) => (
                    <div key={col} style={{
                      fontSize: 10, fontWeight: 700, letterSpacing: "0.06em",
                      textTransform: "uppercase", color: "rgba(255,255,255,0.22)",
                      fontFamily: "var(--font-outfit)",
                    }}>
                      {col}
                    </div>
                  ))}
                </div>

                {/* Rows */}
                {campaigns.map((camp, idx) => (
                  <div
                    key={camp.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "2fr 60px 60px 90px 60px 90px 60px 90px",
                      padding: "13px 22px",
                      borderBottom: idx < campaigns.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#fff", fontFamily: "var(--font-outfit)", margin: 0 }}>
                        {camp.name}
                      </p>
                      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", fontFamily: "var(--font-outfit)", margin: 0, marginTop: 2 }}>
                        {new Date(camp.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.7)", fontFamily: "var(--font-outfit)" }}>
                      {camp.sent}
                    </div>
                    <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", fontFamily: "var(--font-outfit)" }}>
                      {camp.opened}
                    </div>
                    <div><RatePill pct={camp.open_rate} /></div>
                    <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", fontFamily: "var(--font-outfit)" }}>
                      {camp.clicked}
                    </div>
                    <div><RatePill pct={camp.click_rate} /></div>
                    <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", fontFamily: "var(--font-outfit)" }}>
                      {camp.replied}
                    </div>
                    <div><RatePill pct={camp.reply_rate} /></div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
