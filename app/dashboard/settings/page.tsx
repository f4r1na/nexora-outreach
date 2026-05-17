import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("plan, credits_used, credits_limit")
    .eq("user_id", user.id)
    .single()

  const { data: gmailConn } = await supabase
    .from("gmail_connections")
    .select("email, connected_at")
    .eq("user_id", user.id)
    .maybeSingle()

  const { data: styleProfile } = await supabase
    .from("style_profiles")
    .select("product_description")
    .eq("user_id", user.id)
    .maybeSingle()

  const plan = sub?.plan ?? "free"
  const creditsLeft = (sub?.credits_limit ?? 10) - (sub?.credits_used ?? 0)
  const userName = (user.user_metadata?.full_name as string | undefined) || user.email?.split("@")[0] || "User"

  return (
    <div style={{ padding: "32px 24px", minHeight: "100vh", backgroundColor: "#0a0a0a", maxWidth: 640 }}>
      <h1 style={{ fontSize: 20, fontWeight: 500, color: "#ffffff", margin: "0 0 4px", fontFamily: "var(--font-space-grotesk)" }}>Settings</h1>
      <p style={{ fontSize: 13, color: "#666666", margin: "0 0 32px" }}>Manage your account and preferences</p>

      {/* Email Connection */}
      <div style={{ backgroundColor: "#111111", border: "1px solid #1a1a1a", borderRadius: 8, padding: "16px 20px", marginBottom: 12 }}>
        <p style={{ fontSize: 11, color: "#666666", margin: "0 0 10px", letterSpacing: 0.5 }}>EMAIL CONNECTION</p>
        {gmailConn ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#22c55e", flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: "#ffffff" }}>{gmailConn.email}</span>
            <span style={{ fontSize: 12, color: "#666666", marginLeft: "auto" }}>Connected</span>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 13, color: "#666666" }}>No email connected</span>
            <a href="/api/auth/gmail" style={{ fontSize: 13, color: "#f97316", textDecoration: "none", padding: "6px 14px", border: "1px solid rgba(249,115,22,0.3)", borderRadius: 6 }}>Connect Gmail</a>
          </div>
        )}
      </div>

      {/* Product Description */}
      <div style={{ backgroundColor: "#111111", border: "1px solid #1a1a1a", borderRadius: 8, padding: "16px 20px", marginBottom: 12 }}>
        <p style={{ fontSize: 11, color: "#666666", margin: "0 0 10px", letterSpacing: 0.5 }}>PRODUCT DESCRIPTION</p>
        <p style={{ fontSize: 13, color: styleProfile?.product_description ? "#ffffff" : "#666666", margin: 0 }}>
          {styleProfile?.product_description ?? "Not set - add this to personalize your outreach emails."}
        </p>
      </div>

      {/* Plan */}
      <div style={{ backgroundColor: "#111111", border: "1px solid #1a1a1a", borderRadius: 8, padding: "16px 20px", marginBottom: 12 }}>
        <p style={{ fontSize: 11, color: "#666666", margin: "0 0 10px", letterSpacing: 0.5 }}>PLAN</p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontSize: 13, color: "#ffffff", margin: "0 0 4px", textTransform: "capitalize" }}>{plan} plan</p>
            {plan !== "agency" && <p style={{ fontSize: 12, color: "#666666", margin: 0 }}>{creditsLeft} credits remaining</p>}
          </div>
          {plan === "free" && (
            <a href="/pricing" style={{ fontSize: 13, color: "#f97316", textDecoration: "none", padding: "6px 14px", border: "1px solid rgba(249,115,22,0.3)", borderRadius: 6 }}>Upgrade</a>
          )}
        </div>
      </div>

      {/* Account */}
      <div style={{ backgroundColor: "#111111", border: "1px solid #1a1a1a", borderRadius: 8, padding: "16px 20px" }}>
        <p style={{ fontSize: 11, color: "#666666", margin: "0 0 10px", letterSpacing: 0.5 }}>ACCOUNT</p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontSize: 13, color: "#ffffff", margin: "0 0 2px" }}>{userName}</p>
            <p style={{ fontSize: 12, color: "#666666", margin: 0 }}>{user.email}</p>
          </div>
          <form action="/api/auth/signout" method="POST">
            <button type="submit" style={{ fontSize: 13, color: "#666666", background: "none", border: "1px solid #1a1a1a", borderRadius: 6, padding: "6px 14px", cursor: "pointer" }}>
              Sign out
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
