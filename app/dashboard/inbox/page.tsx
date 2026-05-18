import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function InboxPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: replies } = await supabase
    .from("replies")
    .select("id, lead_name, lead_email, subject, status, received_at, body")
    .eq("user_id", user.id)
    .order("received_at", { ascending: false })
    .limit(50)

  const STATUS_COLOR: Record<string, string> = {
    unread: "#FF6B35", read: "rgba(255,255,255,0.2)", replied: "#4ade80",
  }

  return (
    <div style={{ padding: "32px 36px", overflowY: "auto", height: "100%" }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 9, fontFamily: "monospace", color: "rgba(255,107,53,0.45)", letterSpacing: "0.22em", textTransform: "uppercase" as const, marginBottom: 6 }}>Replies</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>Inbox</h1>
      </div>

      <div style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 120px 80px", padding: "8px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: 9, fontFamily: "monospace", color: "rgba(255,255,255,0.22)", letterSpacing: "0.14em", textTransform: "uppercase" as const }}>
          <span>From</span><span>Subject</span><span>Received</span><span>Status</span>
        </div>

        {(replies ?? []).length === 0 && (
          <div style={{ padding: "48px 16px", textAlign: "center" as const, fontSize: 13, color: "rgba(255,255,255,0.25)" }}>No replies yet. Keep sending.</div>
        )}

        {(replies ?? []).map(r => (
          <div key={r.id} style={{ display: "grid", gridTemplateColumns: "1fr 2fr 120px 80px", padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)", transition: "background 0.15s", cursor: "pointer" }}>
            <span style={{ fontSize: 12, color: r.status === "unread" ? "#fff" : "rgba(255,255,255,0.55)", fontWeight: r.status === "unread" ? 500 : 400 }}>
              {r.lead_name ?? r.lead_email ?? "Unknown"}
            </span>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{r.subject ?? "No subject"}</span>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", fontFamily: "monospace" }}>
              {r.received_at ? new Date(r.received_at).toLocaleDateString() : "--"}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: STATUS_COLOR[r.status ?? "read"] ?? "rgba(255,255,255,0.2)", display: "inline-block" }} />
              <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", fontFamily: "monospace", textTransform: "uppercase" as const }}>{r.status ?? "read"}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
