import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import VerifyBanner from "./verify-banner";
import PaymentBanner from "./payment-banner";
import DashboardClient from "./_components/dashboard-client";
import { Plus } from "lucide-react";

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
            Dashboard
          </h1>
          <p style={{
            fontSize: 11,
            color: "#383838",
            fontFamily: "var(--font-outfit)",
            marginTop: 3,
          }}>
            {user.email}
          </p>
        </div>
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
      </header>

      <main style={{ flex: 1, padding: "32px 32px 80px" }}>
        {params.success === "true" && <PaymentBanner type="success" />}
        {params.canceled === "true" && <PaymentBanner type="canceled" />}
        {!user.email_confirmed_at && <VerifyBanner />}

        <DashboardClient
          emailCount={emailCount ?? 0}
          campaignCount={campaignCount ?? 0}
          creditsLeft={creditsLeft}
          plan={(sub?.plan ?? "Free").charAt(0).toUpperCase() + (sub?.plan ?? "free").slice(1)}
          creditsUsed={creditsUsed}
          creditsLimit={creditsLimit}
          recentCampaigns={recentCampaigns ?? []}
        />
      </main>
    </>
  );
}
