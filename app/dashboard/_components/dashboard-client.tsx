"use client";

import Link from "next/link";
import { ArrowRight, Plus, Inbox, BarChart3, Mail } from "lucide-react";
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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function DashboardClient({
  emailCount,
  campaignCount,
  creditsLeft,
  plan,
  recentCampaigns,
}: Props) {

  const stats = [
    {
      label: "Emails Generated",
      value: emailCount,
      sub: `across ${campaignCount} campaign${campaignCount !== 1 ? "s" : ""}`,
    },
    {
      label: "Campaigns",
      value: campaignCount,
      sub: "total created",
    },
    {
      label: "Credits Remaining",
      value: creditsLeft,
      sub: creditsLeft === "∞" ? "unlimited plan" : "available",
    },
    {
      label: "Plan",
      value: plan,
      sub: "current subscription",
    },
  ];

  const actions = [
    { label: "New Campaign",   sub: "Generate personalized outreach",  href: "/dashboard/campaigns/new", icon: Plus },
    { label: "Check Inbox",    sub: "Review replies from leads",        href: "/dashboard/inbox",          icon: Inbox },
    { label: "View Analytics", sub: "Track campaign performance",       href: "/dashboard/analytics",      icon: BarChart3 },
  ];

  return (
    <>
      {/* Stat cards */}
      <StaggerList style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 10 }}>
        {stats.map((card) => (
          <StaggerItem key={card.label}>
            <div className="stat-card" style={{
              backgroundColor: "#0e0e0e",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 10,
              padding: "20px 22px",
              height: "100%",
            }}>
              <div className="nx-section-label" style={{ marginBottom: 12 }}>{card.label}</div>
              <div style={{
                fontSize: 26, fontWeight: 600,
                color: "#fff", fontFamily: "var(--font-syne)",
                lineHeight: 1, marginBottom: 6,
                fontVariantNumeric: "tabular-nums",
              } as React.CSSProperties}>
                {typeof card.value === "number"
                  ? <CountUp value={card.value} duration={800} />
                  : card.value}
              </div>
              <div style={{ fontSize: 11, color: "#3a3a3a", fontFamily: "var(--font-outfit)" }}>
                {card.sub}
              </div>
            </div>
          </StaggerItem>
        ))}
      </StaggerList>

      {/* Quick actions */}
      <StaggerList style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 24 }} delay={0.08}>
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <StaggerItem key={action.label}>
              <Link href={action.href} className="action-card" style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "15px 18px",
                backgroundColor: "#0e0e0e",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 10,
                textDecoration: "none",
                gap: 12,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    backgroundColor: "rgba(255,82,0,0.07)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <Icon size={14} color="#FF5200" strokeWidth={1.75} aria-hidden="true" />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "#ccc", fontFamily: "var(--font-outfit)", marginBottom: 2 }}>
                      {action.label}
                    </div>
                    <div style={{ fontSize: 11, color: "#3a3a3a", fontFamily: "var(--font-outfit)" }}>
                      {action.sub}
                    </div>
                  </div>
                </div>
                <ArrowRight size={13} color="#FF5200" strokeWidth={2} aria-hidden="true" style={{ flexShrink: 0 }} />
              </Link>
            </StaggerItem>
          );
        })}
      </StaggerList>

      {/* Recent campaigns */}
      <div style={{
        backgroundColor: "#0e0e0e",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 10,
        overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 22px",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}>
          <span className="nx-section-label">Recent campaigns</span>
          <Link href="/dashboard/campaigns" style={{
            fontSize: 11, color: "#FF5200",
            fontFamily: "var(--font-outfit)", textDecoration: "none",
          }}>
            View all
          </Link>
        </div>

        {recentCampaigns.length === 0 ? (
          <div style={{
            padding: "56px 24px", textAlign: "center",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 9,
              border: "1px solid rgba(255,255,255,0.07)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#333",
            }}>
              <Mail size={16} strokeWidth={1.5} aria-hidden="true" />
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 500, color: "#555", fontFamily: "var(--font-outfit)", marginBottom: 3 }}>
                No campaigns yet
              </p>
              <p style={{ fontSize: 11, color: "#333", fontFamily: "var(--font-outfit)" }}>
                Create your first campaign to start generating personalized outreach.
              </p>
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
              display: "grid", gridTemplateColumns: "1fr 72px 110px 110px",
              padding: "8px 22px",
              borderBottom: "1px solid rgba(255,255,255,0.04)",
            }}>
              {["Campaign", "Leads", "Status", "Created"].map((col) => (
                <div key={col} className="nx-section-label">{col}</div>
              ))}
            </div>

            <StaggerList delay={0.14}>
              {recentCampaigns.map((c, i) => {
                const isSent = c.status === "complete";
                const isLast = i === recentCampaigns.length - 1;
                return (
                  <StaggerItem key={c.id}>
                    <div className="table-row" style={{
                      display: "grid", gridTemplateColumns: "1fr 72px 110px 110px",
                      padding: "12px 22px",
                      borderBottom: isLast ? "none" : "1px solid rgba(255,255,255,0.03)",
                      alignItems: "center",
                    }}>
                      <Link href={`/dashboard/campaigns/${c.id}`} style={{
                        fontSize: 13, color: "#b8b8b8", fontFamily: "var(--font-outfit)",
                        textDecoration: "none",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        paddingRight: 16,
                      }}>
                        {c.name}
                      </Link>
                      <div style={{ fontSize: 13, color: "#555", fontFamily: "var(--font-outfit)", fontVariantNumeric: "tabular-nums" } as React.CSSProperties}>
                        {c.lead_count}
                      </div>
                      <div>
                        <span className={`nx-badge ${isSent ? "nx-badge-green" : "nx-badge-gray"}`}>
                          {isSent ? "Sent" : "Draft"}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: "#383838", fontFamily: "var(--font-outfit)" }}>
                        {formatDate(c.created_at)}
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
