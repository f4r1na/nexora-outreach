import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import VerifyBanner from "./verify-banner";
import PaymentBanner from "./payment-banner";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconPlus() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function IconMail() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="2" y="4" width="20" height="16" rx="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2 8l10 6 10-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconChart() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="12" width="4" height="9" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="10" y="7" width="4" height="14" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="17" y="3" width="4" height="18" rx="1" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function IconCredits() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M12 7v10M9.5 9.5C9.5 8.4 10.6 7.5 12 7.5s2.5.9 2.5 2c0 2.5-5 2.5-5 5 0 1.1 1.1 2 2.5 2s2.5-.9 2.5-2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconInbox() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div
      style={{
        backgroundColor: "var(--black-2)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 14,
        padding: 24,
        flex: 1,
        minWidth: 0,
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 10,
          backgroundColor: "rgba(255,82,0,0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#FF5200",
          marginBottom: 16,
        }}
      >
        {icon}
      </div>
      <div
        style={{
          fontSize: 32,
          fontWeight: 700,
          color: "#fff",
          fontFamily: "var(--font-syne)",
          lineHeight: 1,
          marginBottom: 6,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: 13,
          color: "rgba(255,255,255,0.4)",
          fontFamily: "var(--font-outfit)",
        }}
      >
        {label}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; canceled?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const email = user.email!;
  const greeting = getGreeting();

  const [{ count: campaignCount }, { data: sub }, { count: emailCount }] = await Promise.all([
    supabase.from("campaigns").select("*", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("subscriptions").select("credits_used, credits_limit, plan").eq("user_id", user.id).single(),
    supabase.from("leads").select("id", { count: "exact", head: true })
      .in("campaign_id",
        (await supabase.from("campaigns").select("id").eq("user_id", user.id)).data?.map((c) => c.id) ?? []
      ),
  ]);

  const creditsUsed = sub?.credits_used ?? 0;
  const creditsLimit = sub?.credits_limit ?? 10;
  const creditsLeft = creditsLimit === 999999 ? "∞" : Math.max(0, creditsLimit - creditsUsed);

  return (
    <>
      {/* Sticky top bar */}
      <header
        style={{
          padding: "0 32px",
          height: 68,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          backgroundColor: "rgba(6,6,6,0.85)",
          backdropFilter: "blur(12px)",
          position: "sticky",
          top: 0,
          zIndex: 30,
        }}
      >
        <div>
          <p
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "#fff",
              fontFamily: "var(--font-syne)",
              lineHeight: 1.2,
            }}
          >
            {greeting}
          </p>
          <p
            style={{
              fontSize: 12,
              color: "rgba(255,255,255,0.35)",
              fontFamily: "var(--font-outfit)",
              marginTop: 1,
            }}
          >
            {email}
          </p>
        </div>

        <Link
          href="/dashboard/campaigns/new"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            padding: "9px 18px",
            backgroundColor: "#FF5200",
            color: "#fff",
            borderRadius: 9,
            fontSize: 13.5,
            fontWeight: 600,
            fontFamily: "var(--font-outfit)",
            textDecoration: "none",
            transition: "background-color 0.15s",
          }}
        >
          <IconPlus />
          New Campaign
        </Link>
      </header>

      {/* Page body */}
      <main style={{ flex: 1, padding: "28px 32px 48px" }}>
        {/* Payment banners */}
        {params.success === "true" && <PaymentBanner type="success" />}
        {params.canceled === "true" && <PaymentBanner type="canceled" />}

        {/* Verify banner */}
        {!user.email_confirmed_at && <VerifyBanner />}

        {/* Stats row */}
        <div
          style={{ display: "flex", gap: 16, marginTop: 24 }}
        >
          <StatCard icon={<IconMail />} label="Emails Generated" value={emailCount ?? 0} />
          <StatCard icon={<IconChart />} label="Campaigns" value={campaignCount ?? 0} />
          <StatCard icon={<IconCredits />} label="Credits Left" value={creditsLeft} />
        </div>

        {/* Campaigns table */}
        <div
          style={{
            marginTop: 28,
            backgroundColor: "var(--black-2)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 14,
            overflow: "hidden",
          }}
        >
          {/* Table header row */}
          <div
            style={{
              padding: "20px 24px 16px",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <h2
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: "#fff",
                fontFamily: "var(--font-syne)",
                margin: 0,
              }}
            >
              Your Campaigns
            </h2>
            <span
              style={{
                fontSize: 11,
                color: "rgba(255,255,255,0.25)",
                fontFamily: "var(--font-outfit)",
                backgroundColor: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 5,
                padding: "2px 8px",
              }}
            >
              {campaignCount ?? 0} total
            </span>
          </div>

          {/* Column headers */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 80px 100px 120px 80px",
              padding: "10px 24px",
              borderBottom: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            {["Name", "Leads", "Status", "Created", "Actions"].map((col) => (
              <div
                key={col}
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.25)",
                  fontFamily: "var(--font-outfit)",
                }}
              >
                {col}
              </div>
            ))}
          </div>

          {/* Empty state */}
          <div
            style={{
              padding: "64px 24px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 16,
                backgroundColor: "rgba(255,82,0,0.08)",
                border: "1px solid rgba(255,82,0,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "rgba(255,82,0,0.6)",
                marginBottom: 4,
              }}
            >
              <IconInbox />
            </div>
            <h3
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: "#fff",
                fontFamily: "var(--font-syne)",
                margin: 0,
              }}
            >
              No campaigns yet
            </h3>
            <p
              style={{
                fontSize: 13,
                color: "rgba(255,255,255,0.35)",
                fontFamily: "var(--font-outfit)",
                textAlign: "center",
                maxWidth: 320,
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              Create your first campaign to start generating personalized cold
              emails.
            </p>
            <Link
              href="/dashboard/campaigns/new"
              style={{
                marginTop: 8,
                display: "flex",
                alignItems: "center",
                gap: 7,
                padding: "9px 20px",
                backgroundColor: "#FF5200",
                color: "#fff",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                fontFamily: "var(--font-outfit)",
                textDecoration: "none",
              }}
            >
              <IconPlus />
              Create Campaign
            </Link>
          </div>
        </div>
      </main>

      {/* Upgrade nudge banner — free/starter only */}
      {(!sub?.plan || sub.plan === "free" || sub.plan === "starter") && (
        <div style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 50,
          backgroundColor: "#0e0e0e",
          border: "1px solid rgba(255,82,0,0.25)",
          borderLeft: "3px solid #FF5200",
          borderRadius: 12,
          padding: "14px 18px",
          maxWidth: 300,
          boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,82,0,0.05)",
        }}>
          <p style={{
            fontSize: 12, fontWeight: 600, color: "#fff",
            fontFamily: "var(--font-outfit)", lineHeight: 1.6, marginBottom: 10,
          }}>
            ⚡ Want more power? Upgrade your plan and unlock PDF/Word exports, more credits, and priority AI generation.
          </p>
          <Link href="/dashboard/settings" style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            padding: "6px 14px", backgroundColor: "#FF5200", color: "#fff",
            borderRadius: 7, fontSize: 12, fontWeight: 700,
            fontFamily: "var(--font-outfit)", textDecoration: "none",
          }}>
            Upgrade Now →
          </Link>
        </div>
      )}
    </>
  );
}
