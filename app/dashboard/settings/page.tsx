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

  const CARD = { background: "#0a0a0a", border: "1px solid rgba(255,255,255,0.06)", padding: "16px 20px", marginBottom: 10 }
  const LABEL = { fontSize: 9, fontFamily: "monospace", color: "rgba(255,255,255,0.22)", margin: "0 0 10px", letterSpacing: "0.14em", textTransform: "uppercase" as const }

  return (
    <div style={{ padding: "32px 36px", overflowY: "auto", height: "100%", background: "#050505" }}>
      <div style={{ marginBottom: 32, maxWidth: 560 }}>
        <div style={{ fontSize: 9, fontFamily: "monospace", color: "rgba(255,107,53,0.45)", letterSpacing: "0.22em", textTransform: "uppercase" as const, marginBottom: 6 }}>Account</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>Settings</h1>
      </div>

      <div style={{ maxWidth: 560 }}>
        {/* Email Connection */}
        <div style={CARD}>
          <p style={LABEL}>Email Connection</p>
          {gmailConn ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#4ade80", flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: "#fff" }}>{gmailConn.email}</span>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.22)", marginLeft: "auto", fontFamily: "monospace" }}>Connected</span>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>No email connected</span>
              <a href="/api/auth/gmail" style={{ fontSize: 10, fontFamily: "monospace", letterSpacing: "0.1em", color: "#FF6B35", textDecoration: "none", padding: "6px 14px", border: "1px solid rgba(255,107,53,0.3)", textTransform: "uppercase" as const }}>Connect Gmail</a>
            </div>
          )}
        </div>

        {/* Product Description */}
        <div style={CARD}>
          <p style={LABEL}>Product Description</p>
          <p style={{ fontSize: 12, color: styleProfile?.product_description ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.2)", margin: 0, lineHeight: 1.6 }}>
            {styleProfile?.product_description ?? "Not set -- add this to personalize your outreach emails."}
          </p>
        </div>

        {/* Plan */}
        <div style={CARD}>
          <p style={LABEL}>Plan</p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ fontSize: 13, color: "#fff", margin: "0 0 4px", textTransform: "capitalize" as const }}>{plan} plan</p>
              {plan !== "agency" && <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", margin: 0, fontFamily: "monospace" }}>{creditsLeft} credits remaining</p>}
            </div>
            {plan === "free" && (
              <a href="/pricing" style={{ fontSize: 10, fontFamily: "monospace", letterSpacing: "0.1em", color: "#FF6B35", textDecoration: "none", padding: "6px 14px", border: "1px solid rgba(255,107,53,0.3)", textTransform: "uppercase" as const }}>Upgrade</a>
            )}
          </div>
        </div>

        {/* Account */}
        <div style={CARD}>
          <p style={LABEL}>Account</p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ fontSize: 13, color: "#fff", margin: "0 0 2px" }}>{userName}</p>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", margin: 0, fontFamily: "monospace" }}>{user.email}</p>
            </div>
            <form action="/api/auth/signout" method="POST">
              <button type="submit" style={{ fontSize: 10, fontFamily: "monospace", letterSpacing: "0.08em", color: "rgba(255,255,255,0.35)", background: "none", border: "1px solid rgba(255,255,255,0.07)", padding: "6px 14px", cursor: "pointer", textTransform: "uppercase" as const }}>
                Sign out
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
