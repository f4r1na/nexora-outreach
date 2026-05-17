import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AnalyticsCharts } from "../_components/analytics-charts"

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const { data: events } = await supabase
    .from("email_events")
    .select("event_type, created_at")
    .eq("user_id", user.id)
    .gte("created_at", since)
    .order("created_at", { ascending: true })

  const sentByDayMap: Record<string, number> = {}
  const repliedByDayMap: Record<string, number> = {}
  for (const e of events ?? []) {
    const day = e.created_at.slice(0, 10)
    if (e.event_type === "sent") sentByDayMap[day] = (sentByDayMap[day] ?? 0) + 1
    if (e.event_type === "replied") repliedByDayMap[day] = (repliedByDayMap[day] ?? 0) + 1
  }

  const sentByDay = Object.entries(sentByDayMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date: date.slice(5), count }))

  const replyRateByDay = Object.entries(sentByDayMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, sent]) => ({ date: date.slice(5), rate: sent > 0 ? Math.round(((repliedByDayMap[date] ?? 0) / sent) * 100) : 0 }))

  const { data: leads } = await supabase
    .from("leads")
    .select("signal_data")
    .eq("user_id", user.id)
    .not("signal_data", "is", null)
    .limit(500)

  const signalTypeMap: Record<string, number> = {}
  for (const lead of leads ?? []) {
    const type = (lead.signal_data as { signalType?: string })?.signalType
    if (type) signalTypeMap[type] = (signalTypeMap[type] ?? 0) + 1
  }
  const signalTypes = Object.entries(signalTypeMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }))

  const totalSent = Object.values(sentByDayMap).reduce((s, n) => s + n, 0)
  const totalReplied = Object.values(repliedByDayMap).reduce((s, n) => s + n, 0)
  const overallRate = totalSent > 0 ? Math.round((totalReplied / totalSent) * 100) : 0

  return (
    <div style={{ padding: "32px 24px", minHeight: "100vh", backgroundColor: "#0a0a0a" }}>
      <h1 style={{ fontSize: 20, fontWeight: 500, color: "#ffffff", margin: "0 0 4px", fontFamily: "var(--font-space-grotesk)" }}>Analytics</h1>
      <p style={{ fontSize: 13, color: "#666666", margin: "0 0 24px" }}>Last 30 days</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Emails Sent", value: totalSent.toLocaleString() },
          { label: "Replies", value: totalReplied.toLocaleString() },
          { label: "Reply Rate", value: totalSent > 0 ? `${overallRate}%` : "-" },
        ].map(({ label, value }) => (
          <div key={label} style={{ backgroundColor: "#111111", border: "1px solid #1a1a1a", borderRadius: 8, padding: "16px 20px" }}>
            <p style={{ fontSize: 11, color: "#666666", margin: "0 0 6px" }}>{label}</p>
            <p style={{ fontSize: 24, fontWeight: 500, color: "#ffffff", margin: 0 }}>{value}</p>
          </div>
        ))}
      </div>

      <AnalyticsCharts sentByDay={sentByDay} replyRateByDay={replyRateByDay} signalTypes={signalTypes} />
    </div>
  )
}
