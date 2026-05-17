"use client"

import { useEffect, useRef, useState } from "react"
import { ProspectCard } from "./prospect-card"
import type { AgentLogLine, Prospect } from "./types"

interface Props {
  query: string
  onComplete: (prospects: Prospect[]) => void
  onError: (msg: string) => void
}

export function ResearchOverlay({ query, onComplete, onError }: Props) {
  const [logLines, setLogLines] = useState<AgentLogLine[]>([])
  const [liveProspects, setLiveProspects] = useState<Prospect[]>([])
  const logRef = useRef<HTMLDivElement>(null)
  const allProspects = useRef<Prospect[]>([])

  useEffect(() => {
    const controller = new AbortController()
    ;(async () => {
      try {
        const res = await fetch("/api/research", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
          signal: controller.signal,
        })
        if (!res.ok) { onError("Research failed"); return }
        const reader = res.body!.getReader()
        const decoder = new TextDecoder()
        let buffer = ""
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const parts = buffer.split("\n\n")
          buffer = parts.pop() ?? ""
          for (const part of parts) {
            const line = part.trim()
            if (!line.startsWith("data: ")) continue
            try {
              const event = JSON.parse(line.slice(6))
              if (event.type === "log") {
                setLogLines((prev) => [...prev, { timestamp: event.timestamp, message: event.message, detail: event.detail }])
              } else if (event.type === "source_start") {
                setLogLines((prev) => [...prev, { timestamp: "", message: `→ ${event.label.padEnd(20, ".")}searching` }])
              } else if (event.type === "source_done") {
                setLogLines((prev) => [...prev, { timestamp: "", message: `${event.source} complete: ${event.count} candidates` }])
              } else if (event.type === "prospect") {
                allProspects.current.push(event.prospect)
                setLiveProspects((prev) => [...prev, event.prospect])
              } else if (event.type === "done") {
                onComplete(allProspects.current)
              } else if (event.type === "error") {
                onError(event.message)
              }
            } catch { /* malformed event, skip */ }
          }
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") onError("Connection lost")
      }
    })()
    return () => controller.abort()
  }, [query, onComplete, onError])

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [logLines])

  return (
    <div style={{ position: "fixed", inset: 0, backgroundColor: "#0a0a0a", zIndex: 1000, display: "flex" }}>
      {/* Agent log — left 40% */}
      <div style={{ width: "40%", borderRight: "1px solid #1a1a1a", display: "flex", flexDirection: "column", padding: "32px 24px" }}>
        <p style={{ fontFamily: "monospace", fontSize: 11, color: "#f97316", margin: "0 0 16px", letterSpacing: 1 }}>
          NEXORA RESEARCH AGENT v2.0
        </p>
        <div style={{ height: 1, backgroundColor: "#1a1a1a", marginBottom: 16 }} />
        <div ref={logRef} style={{ flex: 1, overflowY: "auto", fontFamily: "monospace", fontSize: 12, lineHeight: 1.7, color: "#666666" }}>
          {logLines.map((line, i) => (
            <div key={i} style={{ animation: "fade-in 0.15s ease-out both", color: line.message.startsWith("✓") ? "#22c55e" : line.message.startsWith("→") ? "#ffffff" : "#666666" }}>
              {line.timestamp
                ? <span style={{ color: "#3a3a3a" }}>[{line.timestamp}] </span>
                : <span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
              }
              {line.message}
              {line.detail && <div style={{ paddingLeft: 16, color: "#444444", fontSize: 11 }}>{line.detail}</div>}
            </div>
          ))}
          <span style={{ animation: "pulse-subtle 1s ease-in-out infinite", color: "#f97316" }}>▋</span>
        </div>
        <div style={{ height: 1, backgroundColor: "#1a1a1a", marginTop: 16 }} />
      </div>
      {/* Live prospect cards — right 60% */}
      <div style={{ flex: 1, overflowY: "auto", padding: "32px 24px" }}>
        <p style={{ fontSize: 12, color: "#666666", marginBottom: 16 }}>
          {liveProspects.length === 0 ? "Waiting for results..." : `${liveProspects.length} prospects found so far`}
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {liveProspects.map((p) => (
            <ProspectCard key={p.id} prospect={p} animate animationDelay={0} />
          ))}
        </div>
      </div>
    </div>
  )
}
