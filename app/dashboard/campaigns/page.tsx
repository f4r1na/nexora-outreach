import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CampaignsTable from "./_components/campaigns-table";
import { StaggerList, StaggerItem, CountUp } from "../_components/motion";

export default async function CampaignsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: campaigns }, { data: sub }] = await Promise.all([
    supabase
      .from("campaigns")
      .select("id, name, tone, status, lead_count, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("subscriptions")
      .select("credits_used, credits_limit")
      .eq("user_id", user.id)
      .single(),
  ]);

  const allCampaigns = campaigns ?? [];
  const totalEmails = allCampaigns.reduce((sum, c) => sum + (c.lead_count ?? 0), 0);
  const creditsUsed = sub?.credits_used ?? 0;
  const creditsLimit = sub?.credits_limit ?? 10;

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
        backgroundColor: "rgba(6,6,6,0.92)",
        backdropFilter: "blur(10px)",
        position: "sticky",
        top: 0,
        zIndex: 30,
      }}>
        <div>
          <h1 style={{
            fontSize: 14,
            fontWeight: 500,
            color: "#fff",
            fontFamily: "var(--font-syne)",
            lineHeight: 1,
            letterSpacing: "-0.01em",
          }}>
            Campaigns
          </h1>
          <p style={{
            fontSize: 11,
            color: "#484848",
            fontFamily: "var(--font-outfit)",
            marginTop: 2,
          }}>
            {allCampaigns.length} total
          </p>
        </div>
        <Link href="/dashboard/campaigns/new" className="btn-primary" style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "7px 14px",
          backgroundColor: "#FF5200",
          color: "#fff",
          borderRadius: 6,
          fontSize: 12,
          fontWeight: 500,
          fontFamily: "var(--font-outfit)",
          textDecoration: "none",
        }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Campaign
        </Link>
      </header>

      <main style={{ flex: 1, padding: "24px 32px 64px" }}>
        {/* Stats */}
        <StaggerList style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          {[
            { label: "TOTAL CAMPAIGNS", value: allCampaigns.length },
            { label: "EMAILS GENERATED", value: totalEmails },
            { label: "CREDITS USED", value: `${creditsUsed} / ${creditsLimit === 999999 ? "∞" : creditsLimit}` },
          ].map((s) => (
            <StaggerItem key={s.label} style={{ flex: 1 }}>
              <div className="stat-card" style={{
                backgroundColor: "#0e0e0e",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 8,
                padding: "14px 18px",
              }}>
                <div style={{ fontSize: 9, fontWeight: 500, letterSpacing: "0.07em", color: "#484848", fontFamily: "var(--font-outfit)", marginBottom: 8, textTransform: "uppercase" }}>
                  {s.label}
                </div>
                <div style={{ fontSize: 20, fontWeight: 500, color: "#fff", fontFamily: "var(--font-syne)", lineHeight: 1 }}>
                  {typeof s.value === "number"
                    ? <CountUp value={s.value} duration={700} />
                    : s.value}
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerList>

        {/* Table or empty */}
        {allCampaigns.length === 0 ? (
          <div style={{
            backgroundColor: "#0e0e0e",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 8,
            padding: "64px 24px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
          }}>
            <p style={{ fontSize: 13, color: "#484848", fontFamily: "var(--font-outfit)", margin: 0 }}>
              No campaigns yet.
            </p>
            <Link href="/dashboard/campaigns/new" className="btn-primary" style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 16px",
              backgroundColor: "#FF5200",
              color: "#fff",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 500,
              fontFamily: "var(--font-outfit)",
              textDecoration: "none",
            }}>
              Create your first campaign
            </Link>
          </div>
        ) : (
          <CampaignsTable campaigns={allCampaigns} />
        )}
      </main>
    </>
  );
}
