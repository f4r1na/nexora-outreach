import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

const SIGNAL_COLOR: Record<string, string> = {
  funding: "#FF6B35", hiring: "#FFD700", launch: "#4ade80", expansion: "#60a5fa",
}

export default async function SignalsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: signals } = await supabase
    .from("signals")
    .select("id, company, signal_type, summary, confidence_score, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50)

  return (
    <div style={{ padding: "32px 36px", overflowY: "auto", height: "100%" }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 9, fontFamily: "monospace", color: "rgba(255,107,53,0.45)", letterSpacing: "0.22em", textTransform: "uppercase" as const, marginBottom: 6 }}>Buying signals</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>Signals</h1>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
        {(signals ?? []).length === 0 && (
          <div style={{ gridColumn: "1/-1", padding: "48px 0", textAlign: "center" as const, fontSize: 13, color: "rgba(255,255,255,0.25)" }}>No signals detected yet. Create a campaign to start monitoring.</div>
        )}
        {(signals ?? []).map(s => {
          const color = SIGNAL_COLOR[s.signal_type ?? ""] ?? "#FF6B35"
          const score = Math.round((s.confidence_score ?? 0.75) * 10 * 10) / 10
          return (
            <div key={s.id} style={{ background: "#0a0a0a", border: "1px solid rgba(255,255,255,0.06)", padding: "16px", cursor: "pointer", transition: "border-color 0.15s" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ fontSize: 9, fontFamily: "monospace", color, letterSpacing: "0.14em", textTransform: "uppercase" as const }}>{s.signal_type ?? "signal"}</div>
                <div style={{ fontSize: 11, fontFamily: "monospace", color: "#4ade80", fontWeight: 600 }}>{score}/10</div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 500, color: "#fff", marginBottom: 6 }}>{s.company ?? "Unknown company"}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", lineHeight: 1.6, marginBottom: 12 }}>{s.summary ?? ""}</div>
              <div style={{ height: 2, background: "rgba(255,255,255,0.06)", borderRadius: 1 }}>
                <div style={{ height: "100%", width: `${(s.confidence_score ?? 0.75) * 100}%`, background: `linear-gradient(to right, ${color}, #FFD700)`, borderRadius: 1 }} />
              </div>
              <div style={{ fontSize: 9, fontFamily: "monospace", color: "rgba(255,255,255,0.2)", marginTop: 8, letterSpacing: "0.08em" }}>
                {s.created_at ? new Date(s.created_at).toLocaleDateString() : "--"}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
