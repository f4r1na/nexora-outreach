"use client"

import { useEffect, useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Check } from "lucide-react"
import { Prospect } from "./prospect-data"

const EASE = [0.4, 0, 0.2, 1] as const

interface SendingProgressProps {
  prospects: Prospect[]
  selectedIds: string[]
  onComplete: () => void
}

type LineStatus = "pending" | "sending" | "done"

interface SendLine {
  name: string
  status: LineStatus
}

export function SendingProgress({ prospects, selectedIds, onComplete }: SendingProgressProps) {
  const targets = prospects.filter(p => selectedIds.includes(p.id))
  const [lines, setLines] = useState<SendLine[]>(targets.map(p => ({ name: p.name, status: "pending" })))
  const [extraLines, setExtraLines] = useState<{ text: string; done: boolean }[]>([])
  const [finished, setFinished] = useState(false)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []

    targets.forEach((_, i) => {
      timers.push(setTimeout(() => {
        setLines(prev => prev.map((l, j) => j === i ? { ...l, status: "sending" } : l))
      }, i * 300))
      timers.push(setTimeout(() => {
        setLines(prev => prev.map((l, j) => j === i ? { ...l, status: "done" } : l))
      }, i * 300 + 600))
    })

    const afterAll = targets.length * 300 + 600
    timers.push(setTimeout(() => setExtraLines([{ text: "Scheduling follow-ups (3 days)...", done: false }]), afterAll + 200))
    timers.push(setTimeout(() => setExtraLines(prev => [...prev, { text: "Setting up reply monitoring...", done: false }]), afterAll + 900))
    timers.push(setTimeout(() => {
      setExtraLines(prev => prev.map(l => ({ ...l, done: true })))
      setFinished(true)
    }, afterAll + 1600))
    timers.push(setTimeout(() => onCompleteRef.current(), afterAll + 2200))

    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: EASE }}
      style={{
        position: "fixed", inset: 0, zIndex: 50,
        backgroundColor: "#060606",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      <div style={{ width: "100%", maxWidth: 480, padding: "0 24px" }}>
        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 20 }}>
          Sending
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <AnimatePresence>
            {lines.map((line, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, ease: EASE, delay: i * 0.05 }}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  fontSize: 13, color: line.status === "done" ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.8)",
                }}
              >
                <div style={{ width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {line.status === "done"
                    ? <Check size={14} color="#22c55e" />
                    : line.status === "sending"
                    ? <div style={{ width: 10, height: 10, borderRadius: "50%", border: "2px solid #f97316", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
                    : <div style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.15)" }} />
                  }
                </div>
                <span>Writing email for {line.name}...</span>
                {line.status === "done" && <Check size={12} color="#22c55e" style={{ marginLeft: "auto" }} />}
              </motion.div>
            ))}
          </AnimatePresence>

          {extraLines.map((line, i) => (
            <motion.div
              key={`extra-${i}`}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, ease: EASE }}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                fontSize: 13, color: line.done ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.8)",
              }}
            >
              <div style={{ width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {line.done
                  ? <Check size={14} color="#22c55e" />
                  : <div style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#f97316", animation: "green-pulse 1s ease-in-out infinite" }} />
                }
              </div>
              {line.text}
            </motion.div>
          ))}

          {finished && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, ease: EASE }}
              className="animate-orange-burst"
              style={{
                display: "flex", alignItems: "center", gap: 10,
                marginTop: 8, padding: "12px 16px",
                backgroundColor: "rgba(249,115,22,0.08)",
                border: "1px solid rgba(249,115,22,0.2)", borderRadius: 8,
                fontSize: 14, fontWeight: 500, color: "#f97316",
              }}
            >
              <Check size={16} /> [COMPLETE] {targets.length} emails sent
            </motion.div>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </motion.div>
  )
}
