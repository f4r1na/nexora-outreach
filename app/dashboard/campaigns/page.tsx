import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CampaignsTable from "./_components/campaigns-table";
import { StaggerList, StaggerItem, CountUp } from "../_components/motion";
import { Plus, Mail, Upload } from "lucide-react";

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
          <h1 style={{
            fontSize: 16,
            fontWeight: 500,
            color: "#fff",
            fontFamily: "var(--font-syne)",
            lineHeight: 1,
            letterSpacing: "-0.02em",
          }}>
            Campaigns
          </h1>
          <p style={{
            fontSize: 11,
            color: "#383838",
            fontFamily: "var(--font-outfit)",
            marginTop: 3,
          }}>
            {allCampaigns.length} total
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Link href="/dashboard/campaigns/import" style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            padding: "8px 14px",
            backgroundColor: "transparent",
            color: "rgba(255,255,255,0.45)",
            borderRadius: 7,
            fontSize: 12,
            fontWeight: 500,
            fontFamily: "var(--font-outfit)",
            textDecoration: "none",
            border: "1px solid rgba(255,255,255,0.1)",
          }}>
            <Upload size={11} strokeWidth={2} aria-hidden="true" />
            Import CSV
          </Link>
          <Link href="/dashboard/campaigns/new" className="btn-primary" style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            padding: "8px 16px",
            backgroundColor: "#FF5200",
            color: "#fff",
            borderRadius: 7,
            fontSize: 12,
            fontWeight: 500,
            fontFamily: "var(--font-outfit)",
            textDecoration: "none",
          }}>
            <Plus size={11} strokeWidth={2.5} aria-hidden="true" />
            New Campaign
          </Link>
        </div>
      </header>

      <main style={{ flex: 1, padding: "28px 32px 80px" }}>
        {/* Stats */}
        <StaggerList style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 24 }}>
          {[
            { label: "Total Campaigns", value: allCampaigns.length },
            { label: "Emails Generated", value: totalEmails },
            { label: "Credits Used", value: `${creditsUsed} / ${creditsLimit === 999999 ? "∞" : creditsLimit}` },
          ].map((s) => (
            <StaggerItem key={s.label} style={{ flex: 1 }}>
              <div className="stat-card" style={{
                backgroundColor: "#0e0e0e",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 10,
                padding: "18px 22px",
              }}>
                <div className="nx-section-label" style={{ marginBottom: 10 }}>
                  {s.label}
                </div>
                <div style={{ fontSize: 24, fontWeight: 500, color: "#fff", fontFamily: "var(--font-syne)", lineHeight: 1, fontVariantNumeric: "tabular-nums" } as React.CSSProperties}>
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
            borderRadius: 10,
            padding: "72px 24px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 14,
            textAlign: "center",
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: 11,
              border: "1px solid rgba(255,255,255,0.07)",
              display: "flex", alignItems: "center", justifyContent: "center", color: "#383838",
            }}>
              <Mail size={20} strokeWidth={1.5} aria-hidden="true" />
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 500, color: "#666", fontFamily: "var(--font-outfit)", marginBottom: 4 }}>
                No campaigns yet
              </p>
              <p style={{ fontSize: 12, color: "#333", fontFamily: "var(--font-outfit)", maxWidth: 280 }}>
                Upload a lead list, configure your tone, and generate personalized cold emails in minutes.
              </p>
            </div>
            <Link href="/dashboard/campaigns/new" className="btn-primary" style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              padding: "9px 18px",
              backgroundColor: "#FF5200",
              color: "#fff",
              borderRadius: 7,
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
