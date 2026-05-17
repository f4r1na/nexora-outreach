"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { ResearchOverlay } from "./research-overlay"
import { ResultsView } from "./results-view"
import { EmailPreview } from "./email-preview"
import { SendProgress } from "./send-progress"
import type { CommandState, Prospect, GeneratedEmail } from "./types"

const EXAMPLES = [
  "Find 20 SaaS founders who raised Series A in the last 90 days...",
  "Find marketing agencies hiring engineers in NYC...",
  "Find e-commerce brands launching new products this month...",
]

const CHIPS = ["Find Prospects", "Send Follow-ups", "Analyze Results"]

interface Props {
  hasProductDescription: boolean
}

export function CommandCenter({ hasProductDescription }: Props) {
  const [state, setState] = useState<CommandState>("idle")
  const [query, setQuery] = useState("")
  const [productDesc, setProductDesc] = useState("")
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [selectedProspects, setSelectedProspects] = useState<Prospect[]>([])
  const [emails, setEmails] = useState<Record<string, GeneratedEmail>>({})
  const [exampleIndex, setExampleIndex] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (state !== "idle") return
    const t = setInterval(() => setExampleIndex((i) => (i + 1) % EXAMPLES.length), 3000)
    return () => clearInterval(t)
  }, [state])

  function submit(q?: string) {
    const finalQuery = (q ?? query).trim()
    if (!finalQuery) return
    setQuery(finalQuery)
    if (!hasProductDescription && !productDesc) {
      setState("thinking")
    } else {
      setState("researching")
    }
  }

  const handleResearchComplete = useCallback((found: Prospect[]) => {
    setProspects(found.filter((p) => p.confidence >= 5))
    setState("results")
  }, [])

  const handleResearchError = useCallback((msg: string) => {
    console.error("Research error:", msg)
    setState("idle")
  }, [])

  const DOT_GRID_BG = {
    backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)",
    backgroundSize: "28px 28px",
  }

  const LOGO = (
    <div style={{ fontSize: 72, fontWeight: 500, color: "#f97316", fontFamily: "var(--font-space-grotesk)", filter: "drop-shadow(0 0 24px rgba(249,115,22,0.3))", lineHeight: 1, marginBottom: 32, userSelect: "none" as const }}>
      N
    </div>
  )

  if (state === "idle") {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#0a0a0a", ...DOT_GRID_BG, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
        {LOGO}
        <div style={{ width: "100%", maxWidth: 640 }}>
          <p style={{ fontSize: 15, color: "#ffffff", textAlign: "center", marginBottom: 14, fontWeight: 400 }}>What do you want to do today?</p>
          <textarea
            ref={textareaRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={EXAMPLES[exampleIndex]}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit() } }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#f97316")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "#1a1a1a")}
            style={{ width: "100%", minHeight: 84, backgroundColor: "#111111", border: "1px solid #1a1a1a", borderRadius: 8, padding: "14px 16px", fontSize: 14, color: "#ffffff", resize: "none", outline: "none", fontFamily: "inherit", lineHeight: 1.5, boxSizing: "border-box", transition: "border-color 200ms ease" }}
          />
          <div style={{ display: "flex", gap: 8, marginTop: 12, justifyContent: "center" }}>
            {CHIPS.map((chip) => (
              <button key={chip} onClick={() => submit(chip)}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#f97316"; e.currentTarget.style.color = "#f97316" }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#1a1a1a"; e.currentTarget.style.color = "#666666" }}
                style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid #1a1a1a", backgroundColor: "transparent", color: "#666666", fontSize: 13, cursor: "pointer", transition: "all 200ms ease" }}>
                {chip}
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (state === "thinking") {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#0a0a0a", ...DOT_GRID_BG, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
        {LOGO}
        <p style={{ fontSize: 14, color: "#666666", marginBottom: 20, animation: "pulse-subtle 2s ease-in-out infinite" }}>Understanding your request...</p>
        <div style={{ width: "100%", maxWidth: 480, backgroundColor: "#111111", border: "1px solid #1a1a1a", borderRadius: 8, padding: "20px", animation: "fade-in 0.3s ease-out both" }}>
          <p style={{ fontSize: 14, color: "#ffffff", margin: "0 0 12px" }}>What is your product or service?</p>
          <textarea
            value={productDesc}
            onChange={(e) => setProductDesc(e.target.value)}
            placeholder="e.g. AI-powered sales automation for B2B SaaS companies"
            autoFocus
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); setState("researching") } }}
            style={{ width: "100%", minHeight: 64, backgroundColor: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: 6, padding: "10px 12px", fontSize: 13, color: "#ffffff", resize: "none", outline: "none", fontFamily: "inherit", lineHeight: 1.5, boxSizing: "border-box", marginBottom: 12 }}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setState("researching")} style={{ flex: 1, padding: "8px", borderRadius: 6, border: "none", backgroundColor: "#f97316", color: "#ffffff", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>Continue</button>
            <button onClick={() => setState("researching")} style={{ padding: "8px 16px", borderRadius: 6, border: "1px solid #1a1a1a", backgroundColor: "transparent", color: "#666666", fontSize: 13, cursor: "pointer" }}>Skip</button>
          </div>
        </div>
      </div>
    )
  }

  if (state === "researching") {
    return <ResearchOverlay query={query} onComplete={handleResearchComplete} onError={handleResearchError} />
  }

  if (state === "results") {
    return (
      <ResultsView
        prospects={prospects}
        onPreviewEmails={(selected) => { setSelectedProspects(selected); setState("email_preview") }}
        onBack={() => setState("idle")}
      />
    )
  }

  if (state === "email_preview") {
    return (
      <EmailPreview
        prospects={selectedProspects}
        onSendAll={(generatedEmails) => { setEmails(generatedEmails); setState("sending") }}
        onBack={() => setState("results")}
      />
    )
  }

  if (state === "sending" || state === "done") {
    return (
      <SendProgress
        prospects={selectedProspects}
        emails={emails}
        onDone={() => setState("done")}
        onNewSearch={() => { setQuery(""); setProspects([]); setSelectedProspects([]); setEmails({}); setState("idle") }}
      />
    )
  }

  return null
}
