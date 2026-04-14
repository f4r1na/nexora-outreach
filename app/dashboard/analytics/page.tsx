"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { StaggerList, StaggerItem, CountUp, ScrollReveal } from "../_components/motion";
import { Lock } from "lucide-react";

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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function rateColor(pct: number): string {
  if (pct >= 20) return "#4ade80";
  if (pct >= 5) return "#ccc";
  return "#f87171";
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  const d = label ? new Date(label + "T00:00:00") : null;
  const formatted = d ? d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : label;
  return (
    <div style={{
      backgroundColor: "#111",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 6,
      padding: "7px 10px",
      fontFamily: "var(--font-outfit)",
    }}>
      <p style={{ fontSize: 11, color: "#555", marginBottom: 2 }}>{formatted}</p>
      <p style={{ fontSize: 13, color: "#FF5200", fontWeight: 500 }}>{payload[0].value} sent</p>
    </div>
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
    <>
      {/* Header */}
      <header style={{
        padding: "0 32px",
        height: 68,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid rgba(255,255,255,0.055)",
        backgroundColor: "rgba(6,6,6,0.94)",
        backdropFilter: "blur(12px)",
        position: "sticky",
        top: 0,
        zIndex: 30,
      }}>
        <div>
          <h1 style={{ fontSize: 16, fontWeight: 500, color: "#fff", fontFamily: "var(--font-syne)", lineHeight: 1, letterSpacing: "-0.02em" }}>
            Analytics
          </h1>
          <p style={{ fontSize: 11, color: "#383838", fontFamily: "var(--font-outfit)", marginTop: 3 }}>
            Campaign performance
          </p>
        </div>
      </header>

      <main style={{ flex: 1, padding: "24px 32px 64px" }}>
        {planLoading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
            {[...Array(4)].map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 84, borderRadius: 8 }} />
            ))}
          </div>

        ) : !isProOrAgency ? (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", minHeight: 360, textAlign: "center", gap: 14,
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.07)",
              display: "flex", alignItems: "center", justifyContent: "center", color: "#484848",
            }}>
              <Lock size={16} strokeWidth={1.5} aria-hidden="true" />
            </div>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 500, color: "#fff", fontFamily: "var(--font-syne)", marginBottom: 6 }}>
                Analytics requires Pro
              </h2>
              <p style={{ fontSize: 12, color: "#484848", fontFamily: "var(--font-outfit)", lineHeight: 1.6, maxWidth: 320 }}>
                Track open rates, clicks, and replies across all campaigns.
              </p>
            </div>
            <Link href="/dashboard/settings" className="btn-primary" style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "8px 16px", backgroundColor: "#FF5200", color: "#fff",
              borderRadius: 6, fontSize: 12, fontWeight: 500,
              fontFamily: "var(--font-outfit)", textDecoration: "none",
            }}>
              View plans
            </Link>
          </div>

        ) : loading ? (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 20 }}>
              {[...Array(4)].map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 84, borderRadius: 8 }} />
              ))}
            </div>
            <div className="skeleton" style={{ height: 200, borderRadius: 8 }} />
          </div>

        ) : error ? (
          <div style={{
            padding: "10px 14px", borderRadius: 6,
            backgroundColor: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.14)",
            color: "#f87171", fontFamily: "var(--font-outfit)", fontSize: 13,
          }}>
            {error}
          </div>

        ) : !hasData ? (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", minHeight: 360, textAlign: "center", gap: 12,
          }}>
            <p style={{ fontSize: 13, color: "#484848", fontFamily: "var(--font-outfit)" }}>
              No data yet. Send a campaign to start tracking.
            </p>
            <Link href="/dashboard/campaigns/new" style={{
              fontSize: 12, color: "#FF5200", fontFamily: "var(--font-outfit)", textDecoration: "none",
            }}>
              Create campaign
            </Link>
          </div>

        ) : (
          <>
            {/* Stat cards with count-up */}
            <StaggerList style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 20 }}>
              {[
                { label: "EMAILS SENT",  value: stats?.sent ?? 0, isNum: true },
                { label: "OPEN RATE",    value: stats?.open_rate ?? 0, isNum: true, suffix: "%", sub: `${stats?.opened ?? 0} opens` },
                { label: "CLICK RATE",   value: stats?.click_rate ?? 0, isNum: true, suffix: "%", sub: `${stats?.clicked ?? 0} clicks` },
                { label: "REPLY RATE",   value: stats?.reply_rate ?? 0, isNum: true, suffix: "%", sub: `${stats?.replied ?? 0} replies` },
              ].map((card) => (
                <StaggerItem key={card.label}>
                  <div className="stat-card" style={{
                    backgroundColor: "#0e0e0e",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 10,
                    padding: "18px 22px",
                  }}>
                    <div className="nx-section-label" style={{ marginBottom: 10 }}>
                      {card.label}
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 500, color: "#fff", fontFamily: "var(--font-syne)", lineHeight: 1, marginBottom: 4 }}>
                      <CountUp value={card.value} suffix={card.suffix ?? ""} duration={900} />
                    </div>
                    {card.sub && (
                      <div style={{ fontSize: 11, color: "#484848", fontFamily: "var(--font-outfit)" }}>
                        {card.sub}
                      </div>
                    )}
                  </div>
                </StaggerItem>
              ))}
            </StaggerList>

            {/* Chart */}
            <ScrollReveal delay={0.1}>
              <div style={{
                backgroundColor: "#0e0e0e",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 10,
                padding: "20px 24px",
                marginBottom: 16,
              }}>
                <p className="nx-section-label" style={{ marginBottom: 16 }}>
                  Daily send volume — last 30 days
                </p>
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={daily} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                    <XAxis
                      dataKey="date"
                      tick={{ fill: "#383838", fontSize: 10, fontFamily: "var(--font-outfit)" }}
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
                      tick={{ fill: "#383838", fontSize: 10, fontFamily: "var(--font-outfit)" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#FF5200"
                      strokeWidth={1.5}
                      dot={false}
                      activeDot={{ r: 3, fill: "#FF5200", strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </ScrollReveal>

            {/* Campaign table */}
            {campaigns.length > 0 && (
              <ScrollReveal delay={0.16}>
                <div style={{
                  backgroundColor: "#0e0e0e",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 10,
                  overflow: "hidden",
                }}>
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 60px 60px 80px 60px 80px 60px 80px",
                    padding: "10px 22px",
                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                  }}>
                    {["Campaign", "Sent", "Opens", "Open %", "Clicks", "Click %", "Replies", "Reply %"].map((col) => (
                      <div key={col} className="nx-section-label">
                        {col}
                      </div>
                    ))}
                  </div>

                  {campaigns.map((camp, idx) => (
                    <div
                      key={camp.id}
                      className="table-row"
                      style={{
                        display: "grid",
                        gridTemplateColumns: "2fr 60px 60px 80px 60px 80px 60px 80px",
                        padding: "12px 22px",
                        borderTop: idx === 0 ? "none" : "1px solid rgba(255,255,255,0.03)",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <p style={{ fontSize: 13, color: "#c0c0c0", fontFamily: "var(--font-outfit)", margin: 0 }}>
                          {camp.name}
                        </p>
                        <p style={{ fontSize: 10, color: "#383838", fontFamily: "var(--font-outfit)", margin: 0, marginTop: 1 }}>
                          {new Date(camp.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </p>
                      </div>
                      <span style={{ fontSize: 13, color: "#666", fontFamily: "var(--font-outfit)" }}>{camp.sent}</span>
                      <span style={{ fontSize: 13, color: "#666", fontFamily: "var(--font-outfit)" }}>{camp.opened}</span>
                      <span style={{ fontSize: 13, color: rateColor(camp.open_rate), fontFamily: "var(--font-outfit)" }}>{camp.open_rate}%</span>
                      <span style={{ fontSize: 13, color: "#666", fontFamily: "var(--font-outfit)" }}>{camp.clicked}</span>
                      <span style={{ fontSize: 13, color: rateColor(camp.click_rate), fontFamily: "var(--font-outfit)" }}>{camp.click_rate}%</span>
                      <span style={{ fontSize: 13, color: "#666", fontFamily: "var(--font-outfit)" }}>{camp.replied}</span>
                      <span style={{ fontSize: 13, color: rateColor(camp.reply_rate), fontFamily: "var(--font-outfit)" }}>{camp.reply_rate}%</span>
                    </div>
                  ))}
                </div>
              </ScrollReveal>
            )}
          </>
        )}
      </main>
    </>
  );
}
