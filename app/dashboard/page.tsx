import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import VerifyBanner from "./verify-banner";
import PaymentBanner from "./payment-banner";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; canceled?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [
    { count: campaignCount },
    { data: sub },
    { count: emailCount },
    { data: recentCampaigns },
  ] = await Promise.all([
    supabase.from("campaigns").select("*", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("subscriptions").select("credits_used, credits_limit, plan").eq("user_id", user.id).single(),
    supabase.from("leads").select("id", { count: "exact", head: true }).in(
      "campaign_id",
      (await supabase.from("campaigns").select("id").eq("user_id", user.id)).data?.map((c) => c.id) ?? []
    ),
    supabase.from("campaigns")
      .select("id, name, status, lead_count, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const creditsUsed = sub?.credits_used ?? 0;
  const creditsLimit = sub?.credits_limit ?? 10;
  const creditsLeft = creditsLimit === 999999 ? "∞" : Math.max(0, creditsLimit - creditsUsed);

  const statCards = [
    {
      label: "EMAILS GENERATED",
      value: emailCount ?? 0,
      sub: `across ${campaignCount ?? 0} campaign${campaignCount !== 1 ? "s" : ""}`,
    },
    {
      label: "CAMPAIGNS",
      value: campaignCount ?? 0,
      sub: "total created",
    },
    {
      label: "CREDITS REMAINING",
      value: creditsLeft,
      sub: creditsLimit === 999999 ? "unlimited plan" : `${creditsUsed} used of ${creditsLimit}`,
    },
    {
      label: "PLAN",
      value: (sub?.plan ?? "Free").charAt(0).toUpperCase() + (sub?.plan ?? "free").slice(1),
      sub: "current subscription",
    },
  ];

  return (
    <>
      {/* Header */}
      <header style={{
        padding: "0 32px",
        height: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        backgroundColor: "rgba(6,6,6,0.9)",
        backdropFilter: "blur(8px)",
        position: "sticky",
        top: 0,
        zIndex: 30,
      }}>
        <div>
          <h1 style={{
            fontSize: 15,
            fontWeight: 500,
            color: "#fff",
            fontFamily: "var(--font-syne)",
            lineHeight: 1,
          }}>
            Dashboard
          </h1>
          <p style={{
            fontSize: 12,
            color: "#555",
            fontFamily: "var(--font-outfit)",
            marginTop: 2,
          }}>
            {user.email}
          </p>
        </div>
        <Link href="/dashboard/campaigns/new" style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "7px 14px",
          backgroundColor: "#FF5200",
          color: "#fff",
          borderRadius: 6,
          fontSize: 13,
          fontWeight: 500,
          fontFamily: "var(--font-outfit)",
          textDecoration: "none",
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Campaign
        </Link>
      </header>

      <main style={{ flex: 1, padding: "28px 32px 64px" }}>
        {/* Payment banners */}
        {params.success === "true" && <PaymentBanner type="success" />}
        {params.canceled === "true" && <PaymentBanner type="canceled" />}
        {!user.email_confirmed_at && <VerifyBanner />}

        {/* Stat cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 28 }}>
          {statCards.map((card) => (
            <div key={card.label} style={{
              backgroundColor: "#0e0e0e",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 8,
              padding: "16px 20px",
            }}>
              <div style={{
                fontSize: 10,
                fontWeight: 500,
                letterSpacing: "0.06em",
                color: "#555",
                fontFamily: "var(--font-outfit)",
                marginBottom: 8,
              }}>
                {card.label}
              </div>
              <div style={{
                fontSize: 22,
                fontWeight: 500,
                color: "#fff",
                fontFamily: "var(--font-syne)",
                lineHeight: 1,
                marginBottom: 4,
              }}>
                {card.value}
              </div>
              <div style={{
                fontSize: 11,
                color: "#555",
                fontFamily: "var(--font-outfit)",
              }}>
                {card.sub}
              </div>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 28 }}>
          {[
            { label: "New Campaign", sub: "Generate personalized emails", href: "/dashboard/campaigns/new", symbol: "+" },
            { label: "Sync Inbox", sub: "Check for new replies", href: "/dashboard/inbox", symbol: "→" },
            { label: "View Analytics", sub: "Track campaign performance", href: "/dashboard/analytics", symbol: "→" },
          ].map((action) => (
            <Link key={action.label} href={action.href} style={{
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
                  color: "#fff",
                  fontFamily: "var(--font-outfit)",
                }}>
                  {action.label}
                </span>
                <span style={{ fontSize: 14, color: "#FF5200", fontFamily: "monospace" }}>{action.symbol}</span>
              </div>
              <div style={{ fontSize: 12, color: "#555", fontFamily: "var(--font-outfit)" }}>
                {action.sub}
              </div>
            </Link>
          ))}
        </div>

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
            padding: "14px 20px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}>
            <span style={{
              fontSize: 12,
              fontWeight: 500,
              color: "#888",
              fontFamily: "var(--font-outfit)",
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
              padding: "40px 20px",
              textAlign: "center",
              color: "#444",
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
                    fontSize: 10,
                    fontWeight: 500,
                    letterSpacing: "0.05em",
                    color: "#444",
                    fontFamily: "var(--font-outfit)",
                    textTransform: "uppercase",
                  }}>
                    {col}
                  </div>
                ))}
              </div>

              {recentCampaigns.map((c, i) => {
                const isLast = i === recentCampaigns.length - 1;
                const isSent = c.status === "complete";
                return (
                  <div
                    key={c.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 80px 100px 120px",
                      padding: "11px 20px",
                      borderBottom: isLast ? "none" : "1px solid rgba(255,255,255,0.04)",
                      alignItems: "center",
                    }}
                  >
                    <Link href={`/dashboard/campaigns/${c.id}`} style={{
                      fontSize: 13,
                      color: "#ccc",
                      fontFamily: "var(--font-outfit)",
                      textDecoration: "none",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      paddingRight: 16,
                    }}>
                      {c.name}
                    </Link>
                    <div style={{ fontSize: 13, color: "#888", fontFamily: "var(--font-outfit)" }}>
                      {c.lead_count}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        backgroundColor: isSent ? "#4ade80" : "#555",
                        flexShrink: 0,
                      }} />
                      <span style={{ fontSize: 12, color: "#666", fontFamily: "var(--font-outfit)" }}>
                        {isSent ? "Sent" : "Draft"}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: "#555", fontFamily: "var(--font-outfit)" }}>
                      {new Date(c.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </main>
    </>
  );
}
