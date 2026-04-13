"use client";

import Link from "next/link";
import { StaggerList, StaggerItem, CountUp } from "./motion";

type Campaign = {
  id: string;
  name: string;
  status: string;
  lead_count: number;
  created_at: string;
};

type Props = {
  emailCount: number;
  campaignCount: number;
  creditsLeft: number | string;
  plan: string;
  creditsUsed: number;
  creditsLimit: number;
  recentCampaigns: Campaign[];
};

export default function DashboardClient({
  emailCount,
  campaignCount,
  creditsLeft,
  plan,
  recentCampaigns,
}: Props) {
  const statCards = [
    {
      label: "EMAILS GENERATED",
      value: emailCount,
      sub: `across ${campaignCount} campaign${campaignCount !== 1 ? "s" : ""}`,
    },
    {
      label: "CAMPAIGNS",
      value: campaignCount,
      sub: "total created",
    },
    {
      label: "CREDITS REMAINING",
      value: creditsLeft,
      sub: typeof creditsLeft === "string" && creditsLeft === "∞" ? "unlimited plan" : "available",
    },
    {
      label: "PLAN",
      value: plan,
      sub: "current subscription",
    },
  ];

  const quickActions = [
    { label: "New Campaign",    sub: "Generate personalized emails", href: "/dashboard/campaigns/new", symbol: "+" },
    { label: "Sync Inbox",      sub: "Check for new replies",        href: "/dashboard/inbox",          symbol: "→" },
    { label: "View Analytics",  sub: "Track campaign performance",   href: "/dashboard/analytics",      symbol: "→" },
  ];

  return (
    <>
      {/* Stat cards */}
      <StaggerList style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 24 }}>
        {statCards.map((card) => (
          <StaggerItem key={card.label}>
            <div className="stat-card" style={{
              backgroundColor: "#0e0e0e",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 8,
              padding: "16px 18px",
              height: "100%",
            }}>
              <div style={{
                fontSize: 9,
                fontWeight: 500,
                letterSpacing: "0.07em",
                color: "#484848",
                fontFamily: "var(--font-outfit)",
                marginBottom: 10,
                textTransform: "uppercase",
              }}>
                {card.label}
              </div>
              <div style={{
                fontSize: 22,
                fontWeight: 500,
                color: "#fff",
                fontFamily: "var(--font-syne)",
                lineHeight: 1,
                marginBottom: 5,
              }}>
                {typeof card.value === "number"
                  ? <CountUp value={card.value} duration={800} />
                  : card.value}
              </div>
              <div style={{
                fontSize: 11,
                color: "#484848",
                fontFamily: "var(--font-outfit)",
              }}>
                {card.sub}
              </div>
            </div>
          </StaggerItem>
        ))}
      </StaggerList>

      {/* Quick actions */}
      <StaggerList style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 24 }} delay={0.12}>
        {quickActions.map((action) => (
          <StaggerItem key={action.label}>
            <Link href={action.href} className="action-card" style={{
              display: "block",
              padding: "14px 16px",
              backgroundColor: "#0e0e0e",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 8,
              textDecoration: "none",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: "#ddd",
                  fontFamily: "var(--font-outfit)",
                }}>
                  {action.label}
                </span>
                <span style={{ fontSize: 13, color: "#FF5200", fontFamily: "var(--font-syne)", fontWeight: 500 }}>
                  {action.symbol}
                </span>
              </div>
              <div style={{ fontSize: 11, color: "#484848", fontFamily: "var(--font-outfit)" }}>
                {action.sub}
              </div>
            </Link>
          </StaggerItem>
        ))}
      </StaggerList>

      {/* Recent campaigns */}
      <div style={{
        backgroundColor: "#0e0e0e",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 8,
        overflow: "hidden",
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "13px 20px",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}>
          <span style={{
            fontSize: 11,
            fontWeight: 500,
            color: "#555",
            fontFamily: "var(--font-outfit)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}>
            Recent campaigns
          </span>
          <Link href="/dashboard/campaigns" style={{
            fontSize: 12,
            color: "#FF5200",
            fontFamily: "var(--font-outfit)",
            textDecoration: "none",
          }}>
            View all
          </Link>
        </div>

        {!recentCampaigns || recentCampaigns.length === 0 ? (
          <div style={{
            padding: "48px 20px",
            textAlign: "center",
            color: "#383838",
            fontFamily: "var(--font-outfit)",
            fontSize: 13,
          }}>
            No campaigns yet.{" "}
            <Link href="/dashboard/campaigns/new" style={{ color: "#FF5200", textDecoration: "none" }}>
              Create one
            </Link>
          </div>
        ) : (
          <>
            {/* Table header */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 80px 100px 120px",
              padding: "8px 20px",
              borderBottom: "1px solid rgba(255,255,255,0.04)",
            }}>
              {["Campaign", "Leads", "Status", "Created"].map((col) => (
                <div key={col} style={{
                  fontSize: 9,
                  fontWeight: 500,
                  letterSpacing: "0.06em",
                  color: "#383838",
                  fontFamily: "var(--font-outfit)",
                  textTransform: "uppercase",
                }}>
                  {col}
                </div>
              ))}
            </div>

            <StaggerList delay={0.18}>
              {recentCampaigns.map((c, i) => {
                const isLast = i === recentCampaigns.length - 1;
                const isSent = c.status === "complete";
                return (
                  <StaggerItem key={c.id}>
                    <div
                      className="table-row"
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 80px 100px 120px",
                        padding: "11px 20px",
                        borderBottom: isLast ? "none" : "1px solid rgba(255,255,255,0.03)",
                        alignItems: "center",
                      }}
                    >
                      <Link href={`/dashboard/campaigns/${c.id}`} style={{
                        fontSize: 13,
                        color: "#c0c0c0",
                        fontFamily: "var(--font-outfit)",
                        textDecoration: "none",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        paddingRight: 16,
                      }}>
                        {c.name}
                      </Link>
                      <div style={{ fontSize: 13, color: "#666", fontFamily: "var(--font-outfit)" }}>
                        {c.lead_count}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{
                          width: 5,
                          height: 5,
                          borderRadius: "50%",
                          backgroundColor: isSent ? "#4ade80" : "#3a3a3a",
                          flexShrink: 0,
                        }} />
                        <span style={{ fontSize: 12, color: "#555", fontFamily: "var(--font-outfit)" }}>
                          {isSent ? "Sent" : "Draft"}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: "#444", fontFamily: "var(--font-outfit)" }}>
                        {new Date(c.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </div>
                    </div>
                  </StaggerItem>
                );
              })}
            </StaggerList>
          </>
        )}
      </div>
    </>
  );
}
