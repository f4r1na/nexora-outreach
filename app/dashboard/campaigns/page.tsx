import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CampaignsTable from "./_components/campaigns-table";

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div style={{
      backgroundColor: "#0e0e0e", border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 14, padding: "22px 24px", flex: 1, minWidth: 0,
    }}>
      <p style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10, fontFamily: "var(--font-outfit)" }}>
        {label}
      </p>
      <div style={{ fontSize: 36, fontWeight: 900, color: "#fff", fontFamily: "var(--font-syne)", lineHeight: 1 }}>
        {value}
      </div>
      {sub && (
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", marginTop: 6, fontFamily: "var(--font-outfit)" }}>{sub}</p>
      )}
    </div>
  );
}

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
      .select("credits_used, credits_limit, plan")
      .eq("user_id", user.id)
      .single(),
  ]);

  const allCampaigns = campaigns ?? [];
  const totalEmails = allCampaigns.reduce((sum, c) => sum + (c.lead_count ?? 0), 0);
  const creditsUsed = sub?.credits_used ?? 0;
  const creditsLimit = sub?.credits_limit ?? 10;
  const plan = sub?.plan ?? "free";

  const showPdfCard = plan !== "pro" && plan !== "agency";
  const showWordCard = plan !== "agency";

  return (
    <>
      {/* Header */}
      <header style={{
        padding: "0 32px", height: 68,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        backgroundColor: "rgba(6,6,6,0.85)", backdropFilter: "blur(12px)",
        position: "sticky", top: 0, zIndex: 30,
      }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: "#fff", fontFamily: "var(--font-syne)", lineHeight: 1.2 }}>
            Campaigns
          </h1>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", fontFamily: "var(--font-outfit)", marginTop: 1 }}>
            {allCampaigns.length} campaign{allCampaigns.length !== 1 ? "s" : ""} total
          </p>
        </div>
        <Link href="/dashboard/campaigns/new" style={{
          display: "flex", alignItems: "center", gap: 7, padding: "9px 18px",
          backgroundColor: "#FF5200", color: "#fff", borderRadius: 9,
          fontSize: 13.5, fontWeight: 600, fontFamily: "var(--font-outfit)", textDecoration: "none",
        }}>
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
            <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          New Campaign
        </Link>
      </header>

      <main style={{ flex: 1, padding: "28px 32px 64px" }}>
        {/* Stats row */}
        <div style={{ display: "flex", gap: 16, marginBottom: 28 }}>
          <StatCard label="Total Campaigns" value={allCampaigns.length} />
          <StatCard label="Emails Generated" value={totalEmails} />
          <StatCard
            label="Credits Used"
            value={creditsUsed}
            sub={`of ${creditsLimit === 999999 ? "∞" : creditsLimit} total`}
          />
        </div>

        {/* Campaigns table or empty state */}
        {allCampaigns.length === 0 ? (
          <div style={{
            backgroundColor: "#0e0e0e", border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 14, padding: "80px 24px",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 14,
          }}>
            <div style={{
              width: 72, height: 72, borderRadius: 18,
              backgroundColor: "rgba(255,82,0,0.08)", border: "1px solid rgba(255,82,0,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "rgba(255,82,0,0.5)",
            }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
                <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#fff", fontFamily: "var(--font-syne)", margin: 0 }}>
              No campaigns yet
            </h3>
            <p style={{ fontSize: 13.5, color: "rgba(255,255,255,0.35)", fontFamily: "var(--font-outfit)", textAlign: "center", maxWidth: 320, lineHeight: 1.6, margin: 0 }}>
              Create your first campaign to start generating personalized cold emails at scale.
            </p>
            <Link href="/dashboard/campaigns/new" style={{
              marginTop: 6, display: "flex", alignItems: "center", gap: 7,
              padding: "10px 22px", backgroundColor: "#FF5200", color: "#fff",
              borderRadius: 9, fontSize: 13.5, fontWeight: 600, fontFamily: "var(--font-outfit)", textDecoration: "none",
            }}>
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              New Campaign
            </Link>
          </div>
        ) : (
          <CampaignsTable campaigns={allCampaigns} />
        )}

        {/* ── Upgrade feature cards ── */}
        {(showPdfCard || showWordCard) && (
          <div style={{ marginTop: 48 }}>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: "#fff", fontFamily: "var(--font-syne)", marginBottom: 4 }}>
                Unlock More Power
              </h2>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", fontFamily: "var(--font-outfit)" }}>
                Export your campaigns in more formats and get more out of Nexora.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>

              {/* PDF Export card */}
              {showPdfCard && (
                <div style={{
                  backgroundColor: "#0e0e0e",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderLeft: "3px solid #FF5200",
                  borderRadius: 14,
                  padding: "28px 26px",
                  position: "relative",
                  overflow: "hidden",
                }}>
                  {/* Subtle glow */}
                  <div style={{
                    position: "absolute", top: 0, left: 0, width: 200, height: 200,
                    background: "radial-gradient(circle at 0% 0%, rgba(255,82,0,0.07) 0%, transparent 70%)",
                    pointerEvents: "none",
                  }} />

                  <div style={{ position: "relative" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
                      <span style={{ fontSize: 28, lineHeight: 1 }}>📄</span>
                      <span style={{
                        fontSize: 10, fontWeight: 800, color: "#FF5200",
                        backgroundColor: "rgba(255,82,0,0.12)", border: "1px solid rgba(255,82,0,0.2)",
                        padding: "3px 10px", borderRadius: 999, letterSpacing: "0.05em",
                      }}>Pro Plan</span>
                    </div>

                    <h3 style={{ fontSize: 17, fontWeight: 800, color: "#fff", fontFamily: "var(--font-syne)", marginBottom: 8 }}>
                      PDF Export
                    </h3>
                    <p style={{ fontSize: 13.5, color: "rgba(255,255,255,0.42)", lineHeight: 1.7, marginBottom: 18, fontFamily: "var(--font-outfit)" }}>
                      Download your campaigns as a beautifully branded Nexora PDF. Perfect for sharing with clients.
                    </p>

                    <ul style={{ listStyle: "none", padding: 0, margin: "0 0 22px", display: "flex", flexDirection: "column", gap: 8 }}>
                      {["Nexora branded header", "All emails formatted cleanly", "Ready to send to clients"].map((f) => (
                        <li key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "rgba(255,255,255,0.55)" }}>
                          <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                            <path d="M3 8l3.5 3.5L13 4.5" stroke="#FF5200" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          {f}
                        </li>
                      ))}
                    </ul>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 22, fontWeight: 900, color: "#fff", fontFamily: "var(--font-syne)" }}>
                        $49<span style={{ fontSize: 13, fontWeight: 400, color: "rgba(255,255,255,0.35)" }}>/month</span>
                      </span>
                      <Link href="/dashboard/settings" style={{
                        display: "inline-flex", alignItems: "center", gap: 6,
                        padding: "9px 18px", backgroundColor: "#FF5200", color: "#fff",
                        borderRadius: 9, fontSize: 13, fontWeight: 700,
                        fontFamily: "var(--font-outfit)", textDecoration: "none",
                      }}>
                        Upgrade to Pro →
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* Word Export card */}
              {showWordCard && (
                <div style={{
                  backgroundColor: "#0e0e0e",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderLeft: "3px solid #FF5200",
                  borderRadius: 14,
                  padding: "28px 26px",
                  position: "relative",
                  overflow: "hidden",
                }}>
                  <div style={{
                    position: "absolute", top: 0, left: 0, width: 200, height: 200,
                    background: "radial-gradient(circle at 0% 0%, rgba(255,82,0,0.07) 0%, transparent 70%)",
                    pointerEvents: "none",
                  }} />

                  <div style={{ position: "relative" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
                      <span style={{ fontSize: 28, lineHeight: 1 }}>📝</span>
                      <span style={{
                        fontSize: 10, fontWeight: 800, color: "#FF5200",
                        backgroundColor: "rgba(255,82,0,0.12)", border: "1px solid rgba(255,82,0,0.2)",
                        padding: "3px 10px", borderRadius: 999, letterSpacing: "0.05em",
                      }}>Agency Plan</span>
                    </div>

                    <h3 style={{ fontSize: 17, fontWeight: 800, color: "#fff", fontFamily: "var(--font-syne)", marginBottom: 8 }}>
                      Word Export
                    </h3>
                    <p style={{ fontSize: 13.5, color: "rgba(255,255,255,0.42)", lineHeight: 1.7, marginBottom: 18, fontFamily: "var(--font-outfit)" }}>
                      Export campaigns as editable Word documents. Perfect for agencies managing multiple clients.
                    </p>

                    <ul style={{ listStyle: "none", padding: 0, margin: "0 0 22px", display: "flex", flexDirection: "column", gap: 8 }}>
                      {["Word and all features included"].map((f) => (
                        <li key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "rgba(255,255,255,0.55)" }}>
                          <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                            <path d="M3 8l3.5 3.5L13 4.5" stroke="#FF5200" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          {f}
                        </li>
                      ))}
                    </ul>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 22, fontWeight: 900, color: "#fff", fontFamily: "var(--font-syne)" }}>
                        $99<span style={{ fontSize: 13, fontWeight: 400, color: "rgba(255,255,255,0.35)" }}>/month</span>
                      </span>
                      <Link href="/dashboard/settings" style={{
                        display: "inline-flex", alignItems: "center", gap: 6,
                        padding: "9px 18px", backgroundColor: "#FF5200", color: "#fff",
                        borderRadius: 9, fontSize: 13, fontWeight: 700,
                        fontFamily: "var(--font-outfit)", textDecoration: "none",
                      }}>
                        Upgrade to Agency →
                      </Link>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}
      </main>
    </>
  );
}
