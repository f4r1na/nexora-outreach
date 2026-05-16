"use client"

import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Prospect, SIGNAL_COLORS, toDisplayProspect } from "./prospect-data"
import type { ProspectResult } from "@/lib/search/prospect-searcher"

const EASE = [0.4, 0, 0.2, 1] as const

interface TerminalLine {
  text: string
  done: boolean
}

interface ResearchOverlayProps {
  query: string
  onComplete: (prospects: Prospect[]) => void
}

export function ResearchOverlay({ query, onComplete }: ResearchOverlayProps) {
  const [lines, setLines] = useState<TerminalLine[]>([])
  const [cards, setCards] = useState<Prospect[]>([])
  const [progress, setProgress] = useState(0)
  const [statusText, setStatusText] = useState("Scanning...")
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null)

  useEffect(() => {
    let cancelled = false

    async function run() {
      const addLine = (text: string, done = false) => {
        if (cancelled) return
        setLines((prev) => [...prev, { text, done }])
      }

      addLine("→ Parsing your request...")

      let response: Response
      try {
        response = await fetch("/api/prospects/research", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
        })
      } catch {
        addLine("[ERROR] Network error — could not reach research agent", true)
        setTimeout(() => { if (!cancelled) onCompleteRef.current([]) }, 2000)
        return
      }

      if (!response.ok) {
        addLine(`[ERROR] Research agent returned ${response.status}`, true)
        setTimeout(() => { if (!cancelled) onCompleteRef.current([]) }, 2000)
        return
      }

      addLine("→ Agent connected — querying sources in parallel...")

      const reader = response.body!.getReader()
      readerRef.current = reader
      const decoder = new TextDecoder()
      let buffer = ""
      let progressPct = 0
      let finalCards: Prospect[] = []
      let completeCalled = false

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        const parts = buffer.split("\n\n")
        buffer = parts.pop() ?? ""

        for (const chunk of parts) {
          const line = chunk.trim()
          if (!line.startsWith("data: ")) continue
          let event: {
            type: string
            source?: string
            found?: number
            prospects?: ProspectResult[]
            stats?: { total: number; avg_confidence: number }
          }
          try { event = JSON.parse(line.slice(6)) } catch { continue }

          if (cancelled) return

          if (event.type === "progress") {
            progressPct = Math.min(progressPct + 10, 80)
            setProgress(progressPct)
            const label = (event.found ?? 0) === 0
              ? `→ ${event.source}: no results`
              : `→ ${event.source}: ${event.found} found`
            addLine(label)
          }

          if (event.type === "result" && event.prospects) {
            finalCards = event.prospects.map((p, i) => toDisplayProspect(p, i))
            setCards(finalCards)
            setProgress(95)
            addLine("→ Cross-referencing and scoring confidence...")
          }

          if (event.type === "done" && event.stats) {
            const { total, avg_confidence } = event.stats
            setProgress(100)
            if (total === 0) {
              addLine("[COMPLETE] No prospects found matching your criteria", true)
              setStatusText("0 prospects found")
            } else {
              addLine(`[COMPLETE] ${total} verified prospects · avg score ${avg_confidence}/10`, true)
              setStatusText(`${total} prospects found`)
            }
            completeCalled = true
            setTimeout(() => {
              if (!cancelled) onCompleteRef.current(finalCards)
            }, 1200)
          }
        }
      }

      if (!cancelled && !completeCalled) {
        onCompleteRef.current(finalCards)
      }
    }

    run()
    return () => {
      cancelled = true
      readerRef.current?.cancel().catch(() => {})
    }
  }, [query])

  return (
    <motion.div
      initial={{ y: "100%", opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: "100%", opacity: 0 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      style={{
        position: "fixed", inset: 0, zIndex: 50,
        backgroundColor: "#060606",
        display: "flex", flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px 32px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#22c55e", animation: "green-pulse 2s ease-in-out infinite" }} />
          <span style={{ fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.7)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Nexora Research Agent
          </span>
        </div>
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
          {progress === 100 ? statusText : "Scanning..."}
        </span>
      </div>

      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", overflow: "hidden" }}>
        <div style={{
          padding: "24px 28px",
          borderRight: "1px solid rgba(255,255,255,0.05)",
          overflowY: "auto",
          fontFamily: "var(--font-mono)",
        }}>
          <AnimatePresence>
            {lines.map((line, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, ease: EASE }}
                style={{
                  fontSize: 12.5,
                  color: line.done || line.text.startsWith("[COMPLETE]") ? "#22c55e" : "rgba(255,255,255,0.65)",
                  marginBottom: 6,
                  lineHeight: 1.5,
                }}
              >
                {line.text}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div style={{ padding: "24px 28px", overflowY: "auto" }}>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>
            Live Prospects
          </p>
          {cards.length === 0 && (
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", fontStyle: "italic" }}>
              Waiting for results...
            </p>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <AnimatePresence>
              {cards.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, ease: EASE, delay: i * 0.04 }}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "10px 14px",
                    backgroundColor: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 10,
                  }}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: "50%",
                    background: "linear-gradient(135deg, #FF5200, #F59E0B)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 13, fontWeight: 500, color: "#fff", flexShrink: 0,
                  }}>
                    {(p.name[0] ?? "?").toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: "#fff", marginBottom: 2 }}>{p.name}</p>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {p.company}{p.role ? ` · ${p.role}` : ""}
                    </p>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                    <div style={{
                      fontSize: 10, fontWeight: 500,
                      color: SIGNAL_COLORS[p.signal],
                      backgroundColor: `${SIGNAL_COLORS[p.signal]}18`,
                      padding: "2px 7px", borderRadius: 4,
                    }}>
                      {p.signal}
                    </div>
                    <span style={{
                      fontSize: 11,
                      color: p.confidence >= 8 ? "#22c55e" : p.confidence >= 6 ? "#eab308" : "rgba(255,255,255,0.4)",
                    }}>
                      {p.confidence}/10
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div style={{ height: 3, backgroundColor: "rgba(255,255,255,0.06)" }}>
        <motion.div
          style={{ height: "100%", backgroundColor: "#f97316" }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "linear" }}
        />
      </div>
    </motion.div>
  )
}
