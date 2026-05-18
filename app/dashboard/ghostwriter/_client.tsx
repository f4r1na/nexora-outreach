"use client"
import { useState } from "react"

type StyleProfile = {
  product_description?: string | null
  tone?: string | null
  key_phrases?: string[] | null
  avg_length?: number | null
} | null

export default function GhostwriterClient({ existingProfile }: { existingProfile: StyleProfile }) {
  const [sample, setSample]   = useState("")
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState<StyleProfile>(existingProfile)
  const [error, setError]     = useState("")

  async function analyze() {
    if (!sample.trim()) return
    setLoading(true); setError("")
    try {
      const res = await fetch("/api/ghostwriter/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sample }),
      })
      if (!res.ok) throw new Error("Analysis failed")
      const data = await res.json()
      setProfile(data.profile ?? data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: "32px 36px", overflowY: "auto", height: "100%" }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 9, fontFamily: "monospace", color: "rgba(255,107,53,0.45)", letterSpacing: "0.22em", textTransform: "uppercase" as const, marginBottom: 6 }}>AI writing style</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>Ghostwriter</h1>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div>
          <div style={{ fontSize: 9, fontFamily: "monospace", color: "rgba(255,255,255,0.25)", letterSpacing: "0.14em", textTransform: "uppercase" as const, marginBottom: 10 }}>Paste 3-5 emails you wrote</div>
          <textarea
            value={sample}
            onChange={e => setSample(e.target.value)}
            placeholder="Hi James, I came across your..."
            style={{ width: "100%", height: 240, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", padding: "14px 16px", fontSize: 12, color: "rgba(255,255,255,0.7)", fontFamily: "monospace", resize: "none", outline: "none", lineHeight: 1.7 }}
          />
          {error && <div style={{ fontSize: 11, color: "#ef4444", fontFamily: "monospace", marginTop: 6 }}>{error}</div>}
          <button
            onClick={analyze}
            disabled={loading || !sample.trim()}
            style={{ marginTop: 10, fontSize: 11, fontFamily: "monospace", letterSpacing: "0.1em", padding: "8px 20px", border: "1px solid rgba(255,107,53,0.35)", color: loading ? "rgba(255,107,53,0.4)" : "#FF6B35", background: "transparent", textTransform: "uppercase" as const, cursor: loading ? "not-allowed" : "pointer" }}
          >
            {loading ? "Analyzing..." : "Analyze style"}
          </button>
        </div>

        <div style={{ border: "1px solid rgba(255,255,255,0.06)", padding: "16px 20px" }}>
          <div style={{ fontSize: 9, fontFamily: "monospace", color: "rgba(255,255,255,0.25)", letterSpacing: "0.14em", textTransform: "uppercase" as const, marginBottom: 16 }}>Style profile</div>
          {!profile ? (
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", lineHeight: 1.7 }}>Analyze your writing to generate a style profile. Nexora will use it to match your tone in every email.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { label: "Tone",        value: profile.tone ?? "--" },
                { label: "Avg length",  value: profile.avg_length ? `${profile.avg_length} words` : "--" },
                { label: "Description", value: profile.product_description ?? "--" },
                { label: "Key phrases", value: (profile.key_phrases ?? []).join(", ") || "--" },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div style={{ fontSize: 9, fontFamily: "monospace", color: "rgba(255,107,53,0.45)", letterSpacing: "0.14em", textTransform: "uppercase" as const, marginBottom: 3 }}>{label}</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", lineHeight: 1.6 }}>{String(value)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
