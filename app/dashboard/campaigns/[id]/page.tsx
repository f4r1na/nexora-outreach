import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ id: string }> };

const TONE_STYLE: Record<string, { color: string; bg: string }> = {
  professional: { color: "#60a5fa", bg: "rgba(96,165,250,0.1)" },
  friendly:     { color: "#a78bfa", bg: "rgba(167,139,250,0.1)" },
  bold:         { color: "#fb923c", bg: "rgba(251,146,60,0.1)" },
  minimal:      { color: "#94a3b8", bg: "rgba(148,163,184,0.1)" },
};

export default async function CampaignDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: campaign }, { data: leads }, { data: sub }] = await Promise.all([
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
  ]);

  if (!campaign) notFound();

  const plan = sub?.plan ?? "free";
  const allLeads = leads ?? [];
  const tone = TONE_STYLE[campaign.tone?.toLowerCase()] ?? TONE_STYLE.minimal;
  const createdDate = new Date(campaign.created_at).toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  });

  const pdfAvailable = plan === "pro" || plan === "agency";
  const wordAvailable = plan === "agency";

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
        {/* Left: back + title */}
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

        {/* Right: export buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          <a href={`/api/export?campaignId=${id}&format=csv`} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "7px 14px",
            borderRadius: 8, fontSize: 12.5, fontWeight: 600, fontFamily: "var(--font-outfit)",
            textDecoration: "none", backgroundColor: "#FF5200", color: "#fff",
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            CSV
          </a>

          {pdfAvailable ? (
            <a href={`/api/export?campaignId=${id}&format=pdf`} style={{
              display: "flex", alignItems: "center", gap: 6, padding: "7px 14px",
              borderRadius: 8, fontSize: 12.5, fontWeight: 600, fontFamily: "var(--font-outfit)",
              textDecoration: "none", backgroundColor: "#FF5200", color: "#fff",
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              PDF
            </a>
          ) : (
            <Link href="/dashboard/settings" style={{
              display: "flex", alignItems: "center", gap: 6, padding: "7px 14px",
              borderRadius: 8, fontSize: 12.5, fontWeight: 600, fontFamily: "var(--font-outfit)",
              textDecoration: "none", backgroundColor: "rgba(255,255,255,0.05)",
              color: "rgba(255,255,255,0.35)", border: "1px solid rgba(255,255,255,0.08)",
            }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" strokeLinecap="round" />
              </svg>
              PDF
              <span style={{ fontSize: 9, fontWeight: 700, color: "#FF5200", background: "rgba(255,82,0,0.14)", padding: "1px 5px", borderRadius: 3 }}>Pro</span>
            </Link>
          )}

          {wordAvailable ? (
            <a href={`/api/export?campaignId=${id}&format=docx`} style={{
              display: "flex", alignItems: "center", gap: 6, padding: "7px 14px",
              borderRadius: 8, fontSize: 12.5, fontWeight: 600, fontFamily: "var(--font-outfit)",
              textDecoration: "none", backgroundColor: "#FF5200", color: "#fff",
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Word
            </a>
          ) : (
            <Link href="/dashboard/settings" style={{
              display: "flex", alignItems: "center", gap: 6, padding: "7px 14px",
              borderRadius: 8, fontSize: 12.5, fontWeight: 600, fontFamily: "var(--font-outfit)",
              textDecoration: "none", backgroundColor: "rgba(255,255,255,0.05)",
              color: "rgba(255,255,255,0.35)", border: "1px solid rgba(255,255,255,0.08)",
            }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" strokeLinecap="round" />
              </svg>
              Word
              <span style={{ fontSize: 9, fontWeight: 700, color: "#FF5200", background: "rgba(255,82,0,0.14)", padding: "1px 5px", borderRadius: 3 }}>Agency</span>
            </Link>
          )}
        </div>
      </header>

      <main style={{ flex: 1, padding: "28px 32px 64px" }}>
        {/* Campaign meta bar */}
        <div style={{
          display: "flex", alignItems: "center", gap: 24, marginBottom: 28,
          padding: "14px 20px", backgroundColor: "#0e0e0e",
          border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12,
          flexWrap: "wrap",
        }}>
          <div>
            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3 }}>Emails</p>
            <p style={{ fontSize: 20, fontWeight: 900, color: "#FF5200", fontFamily: "var(--font-syne)" }}>{allLeads.length}</p>
          </div>
          <div style={{ width: 1, height: 36, backgroundColor: "rgba(255,255,255,0.07)" }} />
          <div>
            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3 }}>Status</p>
            <span style={{
              fontSize: 12, fontWeight: 700, padding: "2px 10px", borderRadius: 999,
              color: campaign.status === "complete" ? "#4ade80" : "#94a3b8",
              backgroundColor: campaign.status === "complete" ? "rgba(74,222,128,0.1)" : "rgba(148,163,184,0.1)",
              textTransform: "capitalize",
            }}>{campaign.status}</span>
          </div>
          <div style={{ width: 1, height: 36, backgroundColor: "rgba(255,255,255,0.07)" }} />
          <div>
            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3 }}>Created</p>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", fontFamily: "var(--font-outfit)" }}>{createdDate}</p>
          </div>
        </div>

        {/* Email cards */}
        {allLeads.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "rgba(255,255,255,0.3)", fontFamily: "var(--font-outfit)" }}>
            No emails found for this campaign.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {allLeads.map((lead, i) => (
              <div key={lead.id} style={{
                backgroundColor: "#0e0e0e", border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 14, padding: "22px 24px",
              }}>
                {/* Lead header */}
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

                {/* Custom note */}
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

                {/* Subject */}
                <div style={{ marginBottom: 10 }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 5 }}>Subject</p>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "#fff", fontFamily: "var(--font-syne)", lineHeight: 1.4 }}>
                    {lead.generated_subject}
                  </p>
                </div>

                {/* Body */}
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
      </main>
    </>
  );
}
