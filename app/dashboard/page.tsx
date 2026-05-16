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

  return (
    <div className="p-6 animate-fade-in">
      {!isPaid && (
        <div
          style={{
            marginBottom: "24px",
            padding: "12px 16px",
            borderRadius: "8px",
            border: "1px solid rgba(255,82,0,0.3)",
            backgroundColor: "rgba(255,82,0,0.06)",
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
              color: "#FF5200",
              textDecoration: "none",
              fontWeight: 500,
            }}
          >
            Upgrade
          </Link>
        </div>
      )}

      <div className="mb-8">
        <h1 className="mb-1 text-lg font-semibold">Mission Control</h1>
        <p className="mb-4 text-sm text-muted-foreground">
          Your AI-powered sales command center
        </p>
        <CommandBar />
      </div>

      <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        <StatCard
          title="Emails Sent"
          value="2,847"
          change="+12.3% from last week"
          changeType="positive"
          iconName="mail"
          iconColor="text-primary"
        />
        <StatCard
          title="Active Leads"
          value="1,234"
          change="+8.1% from last week"
          changeType="positive"
          iconName="users"
          iconColor="text-foreground"
        />
        <StatCard
          title="Response Rate"
          value="14.2%"
          change="-2.1% from last week"
          changeType="negative"
          iconName="messageSquare"
          iconColor="text-green-500"
        />
        <StatCard
          title="AI Signals"
          value={isPaid ? "89" : "-"}
          change={isPaid ? "24 high priority" : "Pro+ feature"}
          changeType={isPaid ? "neutral" : "negative"}
          iconName="zap"
          iconColor="text-accent"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CampaignsTable limit={isPaid ? undefined : 3} />
        </div>
        <div className="lg:col-span-1">
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
                  backgroundColor: "#FF5200",
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
