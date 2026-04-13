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
    { label: "New Campaign",    sub: "Generate personalized outreach", href: "/dashboard/campaigns/new" },
    { label: "Check Inbox",     sub: "Review replies from leads",      href: "/dashboard/inbox" },
    { label: "View Analytics",  sub: "Track campaign performance",     href: "/dashboard/analytics" },
  ];

  return (
    <>
      {/* Stat cards */}
      <StaggerList style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 12 }}>
        {statCards.map((card) => (
          <StaggerItem key={card.label}>
            <div className="stat-card" style={{
              backgroundColor: "#0e0e0e",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 10,
              padding: "20px 22px",
              height: "100%",
            }}>
              <div className="nx-section-label" style={{ marginBottom: 12 }}>
                {card.label}
              </div>
              <div style={{
                fontSize: 28,
                fontWeight: 500,
                color: "#fff",
                fontFamily: "var(--font-syne)",
                lineHeight: 1,
                marginBottom: 6,
                fontVariantNumeric: "tabular-nums",
              } as React.CSSProperties}>
                {typeof card.value === "number"
                  ? <CountUp value={card.value} duration={800} />
                  : card.value}
              </div>
              <div style={{
                fontSize: 11,
                color: "#383838",
                fontFamily: "var(--font-outfit)",
              }}>
                {card.sub}
              </div>
            </div>
          </StaggerItem>
        ))}
      </StaggerList>

      {/* Quick actions */}
      <StaggerList style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 28 }} delay={0.1}>
        {quickActions.map((action) => (
          <StaggerItem key={action.label}>
            <Link href={action.href} className="action-card" style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "16px 18px",
              backgroundColor: "#0e0e0e",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 10,
              textDecoration: "none",
              gap: 12,
            }}>
              <div>
                <div style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: "#ddd",
                  fontFamily: "var(--font-outfit)",
                  marginBottom: 3,
                }}>
                  {action.label}
                </div>
                <div style={{ fontSize: 11, color: "#3a3a3a", fontFamily: "var(--font-outfit)" }}>
                  {action.sub}
                </div>
              </div>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FF5200" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </StaggerItem>
        ))}
      </StaggerList>

      {/* Recent campaigns */}
      <div style={{
        backgroundColor: "#0e0e0e",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 10,
        overflow: "hidden",
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 22px",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}>
          <span className="nx-section-label">Recent campaigns</span>
          <Link href="/dashboard/campaigns" style={{
            fontSize: 11,
            color: "#FF5200",
            fontFamily: "var(--font-outfit)",
            textDecoration: "none",
          }}>
            View all
          </Link>
        </div>

        {!recentCampaigns || recentCampaigns.length === 0 ? (
          <div style={{
            padding: "56px 24px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 14,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.07)",
              display: "flex", alignItems: "center", justifyContent: "center", color: "#383838",
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="M2 9h20" />
              </svg>
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 500, color: "#555", fontFamily: "var(--font-outfit)", marginBottom: 4 }}>No campaigns yet</p>
              <p style={{ fontSize: 11, color: "#333", fontFamily: "var(--font-outfit)" }}>Create your first campaign to start generating personalized outreach.</p>
            </div>
            <Link href="/dashboard/campaigns/new" className="btn-primary" style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "8px 16px", backgroundColor: "#FF5200", color: "#fff",
              borderRadius: 7, fontSize: 12, fontWeight: 500,
              fontFamily: "var(--font-outfit)", textDecoration: "none",
            }}>
              Create campaign
            </Link>
          </div>
        ) : (
          <>
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 72px 110px 110px",
              padding: "8px 22px",
              borderBottom: "1px solid rgba(255,255,255,0.04)",
            }}>
              {["Campaign", "Leads", "Status", "Created"].map((col) => (
                <div key={col} className="nx-section-label">{col}</div>
              ))}
            </div>

            <StaggerList delay={0.16}>
              {recentCampaigns.map((c, i) => {
                const isLast = i === recentCampaigns.length - 1;
                const isSent = c.status === "complete";
                return (
                  <StaggerItem key={c.id}>
                    <div
                      className="table-row"
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 72px 110px 110px",
                        padding: "12px 22px",
                        borderBottom: isLast ? "none" : "1px solid rgba(255,255,255,0.03)",
                        alignItems: "center",
                      }}
                    >
                      <Link href={`/dashboard/campaigns/${c.id}`} style={{
                        fontSize: 13, color: "#b8b8b8", fontFamily: "var(--font-outfit)",
                        textDecoration: "none", overflow: "hidden",
                        textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: 16,
                      }}>
                        {c.name}
                      </Link>
                      <div style={{ fontSize: 13, color: "#555", fontFamily: "var(--font-outfit)", fontVariantNumeric: "tabular-nums" }}>
                        {c.lead_count}
                      </div>
                      <div>
                        <span className={`nx-badge ${isSent ? "nx-badge-green" : "nx-badge-gray"}`}>
                          {isSent ? "Sent" : "Draft"}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: "#383838", fontFamily: "var(--font-outfit)" }}>
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
