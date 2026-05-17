import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function HistoryPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("id, name, lead_count, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50)

  const campaignIds = (campaigns ?? []).map((c) => c.id)
  const { data: sentEvents } = campaignIds.length
    ? await supabase
        .from("email_events")
        .select("campaign_id, event_type")
        .in("campaign_id", campaignIds)
    : { data: [] }

  const sentMap: Record<string, number> = {}
  const repliedMap: Record<string, number> = {}
  for (const e of sentEvents ?? []) {
    if (e.event_type === "sent") sentMap[e.campaign_id] = (sentMap[e.campaign_id] ?? 0) + 1
    if (e.event_type === "replied") repliedMap[e.campaign_id] = (repliedMap[e.campaign_id] ?? 0) + 1
  }

  const rows = (campaigns ?? []).map((c) => ({
    id: c.id,
    query: c.name ?? "Untitled",
    date: new Date(c.created_at).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    prospects: c.lead_count ?? 0,
    sent: sentMap[c.id] ?? 0,
    replies: repliedMap[c.id] ?? 0,
    replyRate:
      (sentMap[c.id] ?? 0) > 0
        ? `${Math.round(((repliedMap[c.id] ?? 0) / sentMap[c.id]) * 100)}%`
        : "-",
  }))

  return (
    <div style={{ padding: "32px 24px", minHeight: "100vh", backgroundColor: "#0a0a0a" }}>
      <h1 style={{ fontSize: 20, fontWeight: 500, color: "#ffffff", margin: "0 0 4px", fontFamily: "var(--font-space-grotesk)" }}>
        History
      </h1>
      <p style={{ fontSize: 13, color: "#666666", margin: "0 0 24px" }}>Past campaigns and their results</p>

      {rows.length === 0 ? (
        <div style={{ textAlign: "center", padding: "64px 0", color: "#666666", fontSize: 14 }}>
          No campaigns yet. Start a search from the Home tab.
        </div>
      ) : (
        <div style={{ backgroundColor: "#111111", border: "1px solid #1a1a1a", borderRadius: 8, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 120px 100px 100px 100px 90px", padding: "10px 16px", borderBottom: "1px solid #1a1a1a", gap: 8 }}>
            {["Query", "Date", "Prospects", "Sent", "Replies", "Reply Rate"].map((h) => (
              <span key={h} style={{ fontSize: 11, color: "#666666", fontWeight: 400 }}>{h}</span>
            ))}
          </div>
          {rows.map((row, i) => (
            <div
              key={row.id}
              style={{ display: "grid", gridTemplateColumns: "1fr 120px 100px 100px 100px 90px", padding: "12px 16px", borderBottom: i < rows.length - 1 ? "1px solid #1a1a1a" : "none", gap: 8 }}
            >
              <span style={{ fontSize: 13, color: "#ffffff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.query}</span>
              <span style={{ fontSize: 13, color: "#666666" }}>{row.date}</span>
              <span style={{ fontSize: 13, color: "#666666" }}>{row.prospects}</span>
              <span style={{ fontSize: 13, color: "#666666" }}>{row.sent}</span>
              <span style={{ fontSize: 13, color: "#666666" }}>{row.replies}</span>
              <span style={{ fontSize: 13, color: row.replyRate !== "-" ? "#22c55e" : "#666666" }}>{row.replyRate}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
