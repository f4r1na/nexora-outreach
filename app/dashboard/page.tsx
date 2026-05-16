import { createClient } from "@/lib/supabase/server";
import { CommandBar } from "@/components/command-bar";
import { StatCard } from "@/components/stat-card";
import { CampaignsTable } from "@/components/campaigns-table";
import { SignalsFeed } from "@/components/signals-feed";
import Link from "next/link";

async function getSubscription(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("subscriptions")
    .select("plan, credits_used, credits_limit")
    .eq("user_id", userId)
    .single();
  return data ?? { plan: "free", credits_used: 0, credits_limit: 10 };
}

async function getDashboardStats(userId: string) {
  const supabase = await createClient();

  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("id, lead_count")
    .eq("user_id", userId);

  const totalLeads = (campaigns ?? []).reduce((sum, c) => sum + (c.lead_count ?? 0), 0);
  const campaignIds = (campaigns ?? []).map((c) => c.id);

  const { count: sentCount } = await supabase
    .from("email_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("event_type", "sent");

  const { count: repliedCount } = await supabase
    .from("email_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("event_type", "replied");

  const sent = sentCount ?? 0;
  const replied = repliedCount ?? 0;
  const responseRate = sent > 0 ? Math.round((replied / sent) * 1000) / 10 : 0;

  let signalsCount = 0;
  if (campaignIds.length > 0) {
    const { count } = await supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .in("campaign_id", campaignIds)
      .not("signal_data", "is", null);
    signalsCount = count ?? 0;
  }

  return { sent, totalLeads, responseRate, signalsCount };
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const sub = user
    ? await getSubscription(user.id)
    : { plan: "free", credits_used: 0, credits_limit: 10 };

  const plan = sub.plan as string;
  const isPaid = plan !== "free";
  const isAgencyOrEnterprise = plan === "agency" || plan === "enterprise";
  const creditsLeft = (sub.credits_limit ?? 10) - (sub.credits_used ?? 0);

  const stats = user
    ? await getDashboardStats(user.id)
    : { sent: 0, totalLeads: 0, responseRate: 0, signalsCount: 0 };

  return (
    <div className="p-6 animate-fade-in dot-grid min-h-full">
      {!isPaid && (
        <div
          style={{
            marginBottom: "24px",
            padding: "12px 16px",
            borderRadius: "8px",
            border: "1px solid rgba(249,115,22,0.25)",
            backgroundColor: "rgba(249,115,22,0.05)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: "14px", color: "rgba(255,255,255,0.7)" }}>
            Free plan - {creditsLeft} of {sub.credits_limit} credits remaining
          </span>
          <Link
            href="/pricing"
            style={{
              fontSize: "13px",
              color: "#f97316",
              textDecoration: "none",
              fontWeight: 500,
            }}
          >
            Upgrade
          </Link>
        </div>
      )}

      <div className="mb-8">
        <h1 className="mb-1 text-lg font-semibold">
          <span style={{ borderBottom: "2px solid #f97316", paddingBottom: 2 }}>
            Mission Control
          </span>
        </h1>
        <p className="mb-4 text-xs text-muted-foreground">
          Your AI-powered sales command center
        </p>
        <CommandBar />
      </div>

      <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        <StatCard
          title="Emails Sent"
          value={stats.sent.toLocaleString()}
          change={stats.sent > 0 ? "All time" : "No emails sent yet"}
          changeType="positive"
          iconName="mail"
          iconColor="text-primary"
        />
        <StatCard
          title="Active Leads"
          value={stats.totalLeads.toLocaleString()}
          change={stats.totalLeads > 0 ? "Across all campaigns" : "No leads yet"}
          changeType="positive"
          iconName="users"
          iconColor="text-foreground"
        />
        <StatCard
          title="Response Rate"
          value={stats.responseRate > 0 ? `${stats.responseRate}%` : "0%"}
          change={stats.sent > 0 ? `${stats.sent} emails sent` : "No data yet"}
          changeType={stats.responseRate > 0 ? "positive" : "neutral"}
          iconName="messageSquare"
          iconColor="text-green-500"
        />
        <StatCard
          title="AI Signals"
          value={isPaid ? stats.signalsCount.toString() : "-"}
          change={isPaid ? (stats.signalsCount > 0 ? "Leads with signals" : "No signals yet") : "Pro+ feature"}
          changeType={isPaid ? "neutral" : "negative"}
          iconName="zap"
          iconColor="text-primary"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div
          className="lg:col-span-2 animate-fade-in"
          style={{ animationDelay: "0.15s", animationFillMode: "both" }}
        >
          <CampaignsTable limit={isPaid ? undefined : 3} />
        </div>
        <div
          className="lg:col-span-1 animate-slide-in-right"
          style={{ animationDelay: "0.2s", animationFillMode: "both" }}
        >
          {isPaid ? (
            <SignalsFeed />
          ) : (
            <div
              style={{
                padding: "24px",
                borderRadius: "8px",
                border: "1px solid rgba(255,255,255,0.06)",
                backgroundColor: "#0e0e0e",
                textAlign: "center",
              }}
            >
              <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.45)", marginBottom: "16px" }}>
                AI Signals require a paid plan
              </p>
              <Link
                href="/pricing"
                style={{
                  display: "inline-block",
                  padding: "8px 20px",
                  borderRadius: "6px",
                  backgroundColor: "#f97316",
                  color: "#fff",
                  fontSize: "13px",
                  textDecoration: "none",
                }}
              >
                View Plans
              </Link>
            </div>
          )}
        </div>
      </div>

      {isAgencyOrEnterprise && (
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div
            style={{
              padding: "20px",
              borderRadius: "8px",
              border: "1px solid rgba(255,255,255,0.06)",
              backgroundColor: "#0e0e0e",
            }}
          >
            <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", marginBottom: "4px" }}>
              Monthly sends
            </p>
            <p style={{ fontSize: "24px", fontWeight: 500, color: "#fff" }}>
              {plan === "enterprise" ? "Unlimited" : "1,000"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
