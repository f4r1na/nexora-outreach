import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"

export default async function CampaignsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("id, name, status, lead_count, emails_sent, opens, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  const rows = (campaigns ?? []).map(c => {
    const sent = c.emails_sent ?? 0
    const opens = c.opens ?? 0
    const rate = sent > 0 ? Math.round((opens / sent) * 100) : 0
    return { ...c, rate }
  })

  const STATUS_COLORS: Record<string, string> = {
    active: "#4ade80", paused: "#FFD700", draft: "rgba(255,255,255,0.3)", completed: "rgba(255,255,255,0.2)",
  }

  return (
    <div style={{ padding: "32px 36px", overflowY: "auto", height: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
        <div>
          <div style={{ fontSize: 9, fontFamily: "monospace", color: "rgba(255,107,53,0.45)", letterSpacing: "0.22em", textTransform: "uppercase" as const, marginBottom: 6 }}>Outreach</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>Campaigns</h1>
        </div>
        <Link href="/dashboard/campaigns/new" style={{ fontSize: 11, fontFamily: "monospace", letterSpacing: "0.1em", padding: "8px 18px", border: "1px solid rgba(255,107,53,0.35)", color: "#FF6B35", textDecoration: "none", textTransform: "uppercase" as const, transition: "all 0.15s" }}>
          New Campaign
        </Link>
      </div>

      <div style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 100px", gap: 0, padding: "8px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: 9, fontFamily: "monospace", color: "rgba(255,255,255,0.22)", letterSpacing: "0.14em", textTransform: "uppercase" as const }}>
          <span>Campaign</span><span>Leads</span><span>Sent</span><span>Open Rate</span><span>Status</span>
        </div>

        {rows.length === 0 && (
          <div style={{ padding: "48px 16px", textAlign: "center" as const, fontSize: 13, color: "rgba(255,255,255,0.25)" }}>
            No campaigns yet.{" "}
            <Link href="/dashboard/campaigns/new" style={{ color: "#FF6B35", textDecoration: "none" }}>Create your first one</Link>
          </div>
        )}

        {rows.map(c => (
          <Link key={c.id} href={`/dashboard/campaigns/${c.id}`} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 100px", gap: 0, padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)", textDecoration: "none", transition: "background 0.15s" }}>
            <span style={{ fontSize: 13, color: "#fff" }}>{c.name}</span>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontFamily: "monospace" }}>{c.lead_count ?? 0}</span>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontFamily: "monospace" }}>{c.emails_sent ?? 0}</span>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontFamily: "monospace" }}>{c.rate}%</span>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: STATUS_COLORS[c.status ?? "draft"] ?? "rgba(255,255,255,0.3)", display: "inline-block" }} />
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontFamily: "monospace", textTransform: "uppercase" as const }}>{c.status ?? "draft"}</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
