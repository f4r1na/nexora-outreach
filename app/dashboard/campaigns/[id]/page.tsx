import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SendCampaignButton from "./send-button";
import FollowUpsTab from "./follow-ups-tab";
import AnalyticsTab from "./analytics-tab";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
};

const TONE_STYLE: Record<string, { color: string; bg: string }> = {
  professional: { color: "#60a5fa", bg: "rgba(96,165,250,0.1)" },
  friendly:     { color: "#a78bfa", bg: "rgba(167,139,250,0.1)" },
  bold:         { color: "#fb923c", bg: "rgba(251,146,60,0.1)" },
  minimal:      { color: "#94a3b8", bg: "rgba(148,163,184,0.1)" },
};

const TABS = [
  { key: "overview",  label: "Overview" },
  { key: "leads",     label: "Leads" },
  { key: "followups", label: "Follow-ups" },
  { key: "analytics", label: "Analytics" },
] as const;

type TabKey = typeof TABS[number]["key"];

export default async function CampaignDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { tab: tabParam } = await searchParams;
  const activeTab: TabKey = (TABS.some((t) => t.key === tabParam) ? tabParam : "overview") as TabKey;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: campaign }, { data: leads }, { data: sub }, { data: gmailConn }] = await Promise.all([
    supabase
      .from("campaigns")
      .select("id, name, tone, status, lead_count, created_at")
      .eq("id", id)
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("leads")
      .select("id, first_name, company, role, email, custom_note, generated_subject, generated_body")
      .eq("campaign_id", id)
      .order("created_at"),
    supabase
      .from("subscriptions")
      .select("plan")
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("gmail_connections")
      .select("gmail_email")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  if (!campaign) notFound();

  const allLeads = leads ?? [];
  const plan = sub?.plan ?? "free";
  const gmailEmail = gmailConn?.gmail_email ?? null;
  const tone = TONE_STYLE[campaign.tone?.toLowerCase()] ?? TONE_STYLE.minimal;
  const createdDate = new Date(campaign.created_at).toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  });

  return (
    <>
      {/* Header */}
      <header style={{
        padding: "0 32px", height: 68,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        backgroundColor: "rgba(6,6,6,0.85)", backdropFilter: "blur(12px)",
        position: "sticky", top: 0, zIndex: 30, gap: 16,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
          <Link href="/dashboard/campaigns" style={{
            display: "flex", alignItems: "center", gap: 6,
            fontSize: 13, color: "rgba(255,255,255,0.4)", textDecoration: "none",
            flexShrink: 0,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Campaigns
          </Link>
          <span style={{ color: "rgba(255,255,255,0.12)", fontSize: 16 }}>/</span>
          <h1 style={{
            fontSize: 16, fontWeight: 700, color: "#fff", fontFamily: "var(--font-syne)",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {campaign.name}
          </h1>
          <span style={{
            fontSize: 11, fontWeight: 600, padding: "2px 9px", borderRadius: 6,
            color: tone.color, backgroundColor: tone.bg, textTransform: "capitalize", flexShrink: 0,
          }}>
            {campaign.tone}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <SendCampaignButton
            campaignId={id}
            campaignName={campaign.name}
            totalLeads={allLeads.length}
            plan={plan}
            gmailEmail={gmailEmail}
            initialStatus={campaign.status ?? ""}
          />
          <a href={`/api/export?campaignId=${id}&format=csv`} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "7px 14px",
            borderRadius: 8, fontSize: 12.5, fontWeight: 600, fontFamily: "var(--font-outfit)",
            textDecoration: "none", backgroundColor: "rgba(255,255,255,0.06)",
            color: "rgba(255,255,255,0.6)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Export CSV
          </a>
        </div>
      </header>

      <main style={{ flex: 1, padding: "28px 32px 64px" }}>
        {/* Tab bar */}
        <div style={{
          display: "flex", gap: 2, marginBottom: 28,
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          paddingBottom: 0,
        }}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <Link
                key={tab.key}
                href={`/dashboard/campaigns/${id}?tab=${tab.key}`}
                style={{
                  padding: "10px 18px",
                  fontSize: 13.5, fontWeight: isActive ? 700 : 500,
                  fontFamily: "var(--font-outfit)",
                  color: isActive ? "#fff" : "rgba(255,255,255,0.35)",
                  textDecoration: "none",
                  borderBottom: isActive ? "2px solid #FF5200" : "2px solid transparent",
                  marginBottom: -1,
                  transition: "color 0.15s",
                }}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>

        {/* Overview tab */}
        {activeTab === "overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 600 }}>
            <div style={{
              backgroundColor: "#0e0e0e",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 14, padding: "24px 24px",
            }}>
              <h2 style={{
                fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
                color: "rgba(255,255,255,0.25)", fontFamily: "var(--font-outfit)", marginBottom: 18,
              }}>
                Campaign Details
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <OverviewRow label="Name" value={campaign.name} />
                <OverviewRow label="Tone">
                  <span style={{
                    fontSize: 12, fontWeight: 600, padding: "2px 9px", borderRadius: 6,
                    color: tone.color, backgroundColor: tone.bg, textTransform: "capitalize",
                  }}>
                    {campaign.tone}
                  </span>
                </OverviewRow>
                <OverviewRow label="Leads" value={`${allLeads.length} lead${allLeads.length !== 1 ? "s" : ""}`} />
                <OverviewRow label="Status">
                  <span style={{
                    fontSize: 12, fontWeight: 700, padding: "2px 10px", borderRadius: 999,
                    color: campaign.status === "complete" ? "#4ade80" : "#94a3b8",
                    backgroundColor: campaign.status === "complete" ? "rgba(74,222,128,0.1)" : "rgba(148,163,184,0.1)",
                    textTransform: "capitalize",
                  }}>
                    {campaign.status}
                  </span>
                </OverviewRow>
                <OverviewRow label="Created" value={createdDate} />
              </div>
            </div>
          </div>
        )}

        {/* Leads tab */}
        {activeTab === "leads" && (
          <>
            {allLeads.length === 0 ? (
              <div style={{
                textAlign: "center", padding: "60px 0",
                color: "rgba(255,255,255,0.3)", fontFamily: "var(--font-outfit)",
              }}>
                No emails found for this campaign.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {allLeads.map((lead, i) => (
                  <div key={lead.id} style={{
                    backgroundColor: "#0e0e0e", border: "1px solid rgba(255,255,255,0.07)",
                    borderRadius: 14, padding: "22px 24px",
                  }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14, gap: 12 }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 15, fontWeight: 700, color: "#FF5200", fontFamily: "var(--font-syne)" }}>
                            {lead.first_name}
                          </span>
                          {lead.company && (
                            <>
                              <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 13 }}>·</span>
                              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.55)" }}>{lead.company}</span>
                            </>
                          )}
                          {lead.role && (
                            <>
                              <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 13 }}>·</span>
                              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>{lead.role}</span>
                            </>
                          )}
                        </div>
                        {lead.email && (
                          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 3, fontFamily: "var(--font-outfit)" }}>
                            {lead.email}
                          </p>
                        )}
                      </div>
                      <span style={{
                        fontSize: 11, color: "rgba(255,255,255,0.2)",
                        backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
                        padding: "2px 8px", borderRadius: 5, flexShrink: 0,
                        fontFamily: "var(--font-outfit)",
                      }}>
                        #{i + 1}
                      </span>
                    </div>

                    {lead.custom_note && (
                      <div style={{
                        marginBottom: 14, padding: "8px 12px",
                        backgroundColor: "rgba(255,82,0,0.06)", borderLeft: "2px solid rgba(255,82,0,0.4)",
                        borderRadius: "0 6px 6px 0",
                      }}>
                        <p style={{ fontSize: 12, color: "rgba(255,82,0,0.8)", fontFamily: "var(--font-outfit)", lineHeight: 1.5 }}>
                          {lead.custom_note}
                        </p>
                      </div>
                    )}

                    <div style={{ height: 1, backgroundColor: "rgba(255,255,255,0.05)", marginBottom: 14 }} />

                    <div style={{ marginBottom: 10 }}>
                      <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 5 }}>Subject</p>
                      <p style={{ fontSize: 14, fontWeight: 700, color: "#fff", fontFamily: "var(--font-syne)", lineHeight: 1.4 }}>
                        {lead.generated_subject}
                      </p>
                    </div>

                    <div>
                      <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 5 }}>Body</p>
                      <p style={{ fontSize: 13.5, color: "rgba(255,255,255,0.55)", lineHeight: 1.8, fontFamily: "var(--font-outfit)" }}>
                        {lead.generated_body}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Follow-ups tab */}
        {activeTab === "followups" && (
          <FollowUpsTab campaignId={id} plan={plan} />
        )}

        {/* Analytics tab */}
        {activeTab === "analytics" && (
          <AnalyticsTab campaignId={id} plan={plan} />
        )}
      </main>
    </>
  );
}

// ─── Helper component ─────────────────────────────────────────────────────────

function OverviewRow({
  label,
  value,
  children,
}: {
  label: string;
  value?: string;
  children?: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <span style={{
        fontSize: 12, color: "rgba(255,255,255,0.3)", fontFamily: "var(--font-outfit)",
        width: 80, flexShrink: 0,
      }}>
        {label}
      </span>
      {children ?? (
        <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", fontFamily: "var(--font-outfit)" }}>
          {value}
        </span>
      )}
    </div>
  );
}
