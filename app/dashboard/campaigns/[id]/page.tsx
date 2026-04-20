import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SendCampaignButton from "./send-button";
import FollowUpsTab from "./follow-ups-tab";
import AnalyticsTab from "./analytics-tab";
import { StaggerList, StaggerItem } from "../../_components/motion";
import { ArrowLeft } from "lucide-react";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
};

const TABS = [
  { key: "overview",  label: "Overview" },
  { key: "leads",     label: "Leads" },
  { key: "followups", label: "Follow-ups" },
  { key: "analytics", label: "Performance" },
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
  const isSent = campaign.status === "complete";
  const createdDate = new Date(campaign.created_at).toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  });

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
        gap: 16,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <Link href="/dashboard/campaigns" style={{
            display: "flex", alignItems: "center", gap: 5,
            fontSize: 12, color: "#555", textDecoration: "none", flexShrink: 0,
          }}>
            <ArrowLeft size={13} strokeWidth={1.5} aria-hidden="true" />
            Campaigns
          </Link>
          <span style={{ color: "#333", fontSize: 14 }}>/</span>
          <h1 style={{
            fontSize: 14,
            fontWeight: 500,
            color: "#ccc",
            fontFamily: "var(--font-syne)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}>
            {campaign.name}
          </h1>
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
            display: "flex", alignItems: "center", gap: 6,
            padding: "6px 12px",
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 400,
            fontFamily: "var(--font-outfit)",
            textDecoration: "none",
            backgroundColor: "transparent",
            color: "#555",
            border: "1px solid rgba(255,255,255,0.08)",
          }}>
            Export CSV
          </a>
        </div>
      </header>

      <main style={{ flex: 1, padding: "24px 32px 64px" }}>
        {/* Tab bar */}
        <div style={{
          display: "flex",
          gap: 0,
          marginBottom: 24,
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <Link
                key={tab.key}
                href={`/dashboard/campaigns/${id}?tab=${tab.key}`}
                style={{
                  padding: "9px 16px",
                  fontSize: 12,
                  fontWeight: 400,
                  fontFamily: "var(--font-outfit)",
                  color: isActive ? "#ddd" : "#484848",
                  textDecoration: "none",
                  marginBottom: -1,
                  position: "relative",
                  transition: "color 0.18s ease",
                  borderBottom: isActive ? "1px solid #FF5200" : "1px solid transparent",
                }}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>

        {/* Overview tab */}
        {activeTab === "overview" && (
          <div style={{ maxWidth: 520 }}>
            <div style={{
              backgroundColor: "#0e0e0e",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 10,
              padding: "20px 22px",
            }}>
              <p className="nx-section-label" style={{ marginBottom: 16 }}>
                Campaign details
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <OverviewRow label="Name" value={campaign.name} />
                <OverviewRow label="Tone" value={campaign.tone ? campaign.tone.charAt(0).toUpperCase() + campaign.tone.slice(1) : "—"} />
                <OverviewRow label="Leads" value={`${allLeads.length}`} />
                <OverviewRow label="Status">
                  <span className={`nx-badge ${isSent ? "nx-badge-green" : "nx-badge-gray"}`}>
                    {isSent ? "Sent" : "Draft"}
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
              <div style={{ padding: "48px 0", textAlign: "center", color: "#444", fontFamily: "var(--font-outfit)", fontSize: 13 }}>
                No emails generated yet.
              </div>
            ) : (
              <StaggerList style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {allLeads.map((lead, i) => (
                  <StaggerItem key={lead.id}>
                  <div style={{
                    backgroundColor: "#0e0e0e",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 10,
                    padding: "18px 22px",
                  }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12, gap: 12 }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 13, fontWeight: 500, color: "#ccc", fontFamily: "var(--font-outfit)" }}>
                            {lead.first_name}
                          </span>
                          {lead.company && (
                            <span style={{ fontSize: 12, color: "#555" }}>{lead.company}</span>
                          )}
                          {lead.role && (
                            <span style={{ fontSize: 12, color: "#444" }}>{lead.role}</span>
                          )}
                        </div>
                        {lead.email && (
                          <p style={{ fontSize: 11, color: "#444", marginTop: 2, fontFamily: "var(--font-outfit)" }}>
                            {lead.email}
                          </p>
                        )}
                      </div>
                      <span style={{
                        fontSize: 10,
                        color: "#444",
                        fontFamily: "var(--font-outfit)",
                        flexShrink: 0,
                      }}>
                        #{i + 1}
                      </span>
                    </div>

                    {lead.custom_note && (
                      <div style={{
                        marginBottom: 12,
                        padding: "8px 12px",
                        backgroundColor: "rgba(255,255,255,0.02)",
                        borderLeft: "2px solid rgba(255,82,0,0.3)",
                        borderRadius: "0 4px 4px 0",
                      }}>
                        <p style={{ fontSize: 12, color: "#666", fontFamily: "var(--font-outfit)", lineHeight: 1.5 }}>
                          {lead.custom_note}
                        </p>
                      </div>
                    )}

                    <div style={{ height: 1, backgroundColor: "rgba(255,255,255,0.04)", marginBottom: 12 }} />

                    <div style={{ marginBottom: 10 }}>
                      <p style={{ fontSize: 10, fontWeight: 500, color: "#444", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4, fontFamily: "var(--font-outfit)" }}>Subject</p>
                      <p style={{ fontSize: 13, fontWeight: 500, color: "#ccc", fontFamily: "var(--font-syne)", lineHeight: 1.4 }}>
                        {lead.generated_subject}
                      </p>
                    </div>

                    <div>
                      <p style={{ fontSize: 10, fontWeight: 500, color: "#444", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4, fontFamily: "var(--font-outfit)" }}>Body</p>
                      <p style={{ fontSize: 13, color: "#666", lineHeight: 1.7, fontFamily: "var(--font-outfit)" }}>
                        {lead.generated_body}
                      </p>
                    </div>
                  </div>
                  </StaggerItem>
                ))}
              </StaggerList>
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

// ─── Helper ───────────────────────────────────────────────────────────────────

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
        fontSize: 12, color: "#555", fontFamily: "var(--font-outfit)",
        width: 72, flexShrink: 0,
      }}>
        {label}
      </span>
      {children ?? (
        <span style={{ fontSize: 13, color: "#888", fontFamily: "var(--font-outfit)" }}>
          {value}
        </span>
      )}
    </div>
  );
}
