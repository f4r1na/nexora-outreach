// app/dashboard/_components/research-overlay.tsx
"use client"

import { useEffect, useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Prospect, SIGNAL_COLORS, generateProspects } from "./prospect-data"

const EASE = [0.4, 0, 0.2, 1] as const

interface TerminalLine {
  text: string
  done: boolean
}

function buildTerminalLines(query: string, count: number): { text: string; delay: number }[] {
  const q = query.toLowerCase()
  const audience = q.includes("saas") ? "SaaS founders" : q.includes("marketing") ? "marketing leaders" : "prospects"
  const signal = q.includes("series") || q.includes("fund") ? "Series A, 90 days" : q.includes("hir") ? "hiring signals" : "recent activity"
  return [
    { text: "→ Parsing your request...", delay: 200 },
    { text: `→ Identified: ${audience}, ${signal}`, delay: 700 },
    { text: "→ Searching GitHub API...", delay: 1200 },
    { text: `   ████████░░ ${Math.floor(count * 0.4)} prospects found`, delay: 1800 },
    { text: "→ Searching HackerNews...", delay: 2400 },
    { text: `   ██████████ ${Math.floor(count * 0.3)} prospects found`, delay: 2900 },
    { text: "→ Searching ProductHunt...", delay: 3400 },
    { text: `   ███████░░░ ${Math.floor(count * 0.3)} prospects found`, delay: 3900 },
    { text: "→ Cross-referencing sources...", delay: 4500 },
    { text: "→ Verifying company websites...", delay: 5000 },
    { text: "→ Scoring confidence (0-10)...", delay: 5600 },
    { text: "→ Filtering below 5.0...", delay: 6200 },
    { text: `[COMPLETE] ${count} verified prospects found`, delay: 7000 },
  ]
}

interface ResearchOverlayProps {
  query: string
  onComplete: (prospects: Prospect[]) => void
}

export function ResearchOverlay({ query, onComplete }: ResearchOverlayProps) {
  const [lines, setLines] = useState<TerminalLine[]>([])
  const [cards, setCards] = useState<Prospect[]>([])
  const [progress, setProgress] = useState(0)
  const [prospects] = useState(() => generateProspects(query, 15))

  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  useEffect(() => {
    const schedule = buildTerminalLines(query, prospects.length)
    const timers: ReturnType<typeof setTimeout>[] = []

    schedule.forEach((item, i) => {
      timers.push(setTimeout(() => {
        setLines(prev => [...prev, { text: item.text, done: false }])
        setProgress(Math.round(((i + 1) / schedule.length) * 100))
        if (i % 2 === 0 && Math.floor(i / 2) < prospects.length) {
          setCards(prev => [...prev, prospects[Math.floor(i / 2)]])
        }
      }, item.delay))
    })

    timers.push(setTimeout(() => {
      setLines(prev => prev.map((l, i) => i === prev.length - 1 ? { ...l, done: true } : l))
    }, 7200))

    timers.push(setTimeout(() => {
      onCompleteRef.current(prospects)
    }, 8000))

    return () => timers.forEach(clearTimeout)
  }, [])

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
      {/* Header */}
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
          {progress === 100 ? `${prospects.length} prospects found` : "Scanning..."}
        </span>
      </div>

      {/* Body: split layout */}
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", overflow: "hidden" }}>
        {/* Terminal */}
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

        {/* Prospect cards */}
        <div style={{ padding: "24px 28px", overflowY: "auto" }}>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>
            Live Prospects
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <AnimatePresence>
              {cards.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, ease: EASE, delay: i * 0.05 }}
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
                    {p.name[0]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: "#fff", marginBottom: 2 }}>{p.name}</p>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {p.company} · {p.role}
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

      {/* Progress bar */}
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
