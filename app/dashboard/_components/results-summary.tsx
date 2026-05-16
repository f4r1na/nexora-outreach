// app/dashboard/_components/results-summary.tsx
"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts"
import { Prospect, SIGNAL_COLORS, SignalType, avgConfidence, signalCounts } from "./prospect-data"
import { Trash2 } from "lucide-react"

const EASE = [0.4, 0, 0.2, 1] as const

interface ResultsSummaryProps {
  prospects: Prospect[]
  onEditTemplate: () => void
  onSendEmails: (selected: string[]) => void
  onClose: () => void
}

export function ResultsSummary({ prospects, onEditTemplate, onSendEmails, onClose }: ResultsSummaryProps) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set(prospects.map(p => p.id)))
  const [removed, setRemoved] = useState<Set<string>>(new Set())

  const visible = prospects.filter(p => !removed.has(p.id))
  const selectedVisible = [...selected].filter(id => !removed.has(id))
  const selectedCount = selectedVisible.length
  const avg = avgConfidence(visible.filter(p => selected.has(p.id)))
  const estReplyRate = Math.round(avg * 2.8)

  const sigCounts = signalCounts(visible)
  const pieData = (Object.entries(sigCounts) as [SignalType, number][])
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value, color: SIGNAL_COLORS[name] }))

  const confBins = [
    { range: "9-10", count: visible.filter(p => p.confidence >= 9).length },
    { range: "7-8", count: visible.filter(p => p.confidence >= 7 && p.confidence < 9).length },
    { range: "5-6", count: visible.filter(p => p.confidence >= 5 && p.confidence < 7).length },
  ]

  const sources = [
    { name: "GitHub", count: Math.floor(visible.length * 0.4) },
    { name: "HackerNews", count: Math.floor(visible.length * 0.3) },
    { name: "ProductHunt", count: Math.ceil(visible.length * 0.3) },
  ]
  const maxSource = Math.max(...sources.map(s => s.count), 1)

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }

  const removeProspect = (id: string) => {
    setRemoved(prev => new Set([...prev, id]))
    setSelected(prev => { const n = new Set(prev); n.delete(id); return n })
  }

  const toggleAll = () => {
    const visibleIds = visible.map(p => p.id)
    const allSelected = visibleIds.every(id => selected.has(id))
    if (allSelected) setSelected(new Set())
    else setSelected(new Set(visibleIds))
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: EASE }}
      style={{
        position: "fixed", inset: 0, zIndex: 50,
        backgroundColor: "#060606",
        overflowY: "auto",
        display: "flex", flexDirection: "column",
      }}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        style={{
          position: "fixed", top: 20, right: 24, zIndex: 52,
          background: "none", border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 6, padding: "6px 12px",
          color: "rgba(255,255,255,0.5)", fontSize: 12, cursor: "pointer",
        }}
      >
        ✕ Close
      </button>
      <div style={{ padding: "28px 40px 0", maxWidth: 1100, margin: "0 auto", width: "100%" }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE }}
        >
          <h1 style={{ fontSize: 28, fontWeight: 500, color: "#fff", marginBottom: 6 }}>
            Found {visible.length} verified prospects
          </h1>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)" }}>
            Avg confidence: {avg}/10 · Est. reply rate: ~{estReplyRate}%
          </p>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE, delay: 0.1 }}
          style={{ display: "flex", gap: 20, marginTop: 24, marginBottom: 28 }}
        >
          {[
            { label: "Prospects", value: visible.length },
            { label: "Sources", value: 3 },
            { label: "Avg Score", value: `${avg}/10` },
            { label: "Est. Replies", value: `~${Math.round(selectedCount * (estReplyRate / 100))}` },
          ].map((stat, i) => (
            <div key={i} style={{
              flex: 1, padding: "16px 20px",
              backgroundColor: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 10, textAlign: "center",
            }}>
              <p style={{ fontSize: 22, fontWeight: 500, color: "#fff" }}>{stat.value}</p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>{stat.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Charts row */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE, delay: 0.2 }}
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 32 }}
        >
          {/* Donut — Signal type */}
          <div style={{
            padding: "20px",
            backgroundColor: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10,
          }}>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 16 }}>
              Signal types
            </p>
            <ResponsiveContainer width="100%" height={120}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={30} outerRadius={50} paddingAngle={3} dataKey="value" isAnimationActive>
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#111", border: "1px solid #222", fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
              {pieData.map(d => (
                <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: d.color }} />
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{d.name}: {d.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bar — Confidence distribution */}
          <div style={{
            padding: "20px",
            backgroundColor: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10,
          }}>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 16 }}>
              Confidence distribution
            </p>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={confBins} barSize={28}>
                <XAxis dataKey="range" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Bar dataKey="count" fill="#f97316" radius={[3, 3, 0, 0]} isAnimationActive />
                <Tooltip contentStyle={{ backgroundColor: "#111", border: "1px solid #222", fontSize: 12 }} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Horizontal bars — Source breakdown */}
          <div style={{
            padding: "20px",
            backgroundColor: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10,
          }}>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 16 }}>
              Source breakdown
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 8 }}>
              {sources.map(s => (
                <div key={s.name}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>{s.name}</span>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>{s.count}</span>
                  </div>
                  <div style={{ height: 4, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 2 }}>
                    <motion.div
                      style={{ height: "100%", backgroundColor: "#f97316", borderRadius: 2 }}
                      initial={{ width: 0 }}
                      animate={{ width: `${(s.count / maxSource) * 100}%` }}
                      transition={{ duration: 0.8, ease: EASE, delay: 0.4 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Prospect grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, paddingBottom: 120 }}>
          <AnimatePresence>
            {visible.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25, ease: EASE, delay: i * 0.04 }}
              style={{
                position: "relative", padding: "16px",
                backgroundColor: selected.has(p.id) ? "rgba(249,115,22,0.05)" : "rgba(255,255,255,0.02)",
                border: `1px solid ${selected.has(p.id) ? "rgba(249,115,22,0.2)" : "rgba(255,255,255,0.06)"}`,
                borderRadius: 10,
              }}
            >
              {/* Checkbox */}
              <input
                type="checkbox"
                checked={selected.has(p.id)}
                onChange={() => toggleSelect(p.id)}
                style={{ position: "absolute", top: 12, right: 12, accentColor: "#f97316", cursor: "pointer" }}
              />
              {/* Remove button */}
              <button
                onClick={() => removeProspect(p.id)}
                style={{
                  position: "absolute", top: 10, right: 32,
                  background: "none", border: "none", cursor: "pointer",
                  color: "rgba(255,255,255,0.2)", padding: 2,
                }}
                title="Remove"
              >
                <Trash2 size={12} />
              </button>

              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: "50%",
                  background: "linear-gradient(135deg, #FF5200, #F59E0B)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 14, fontWeight: 500, color: "#fff", flexShrink: 0,
                }}>
                  {p.name[0]}
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 500, color: "#fff", marginBottom: 2 }}>{p.name}</p>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {p.company}
                  </p>
                </div>
              </div>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>{p.role}</p>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{
                  fontSize: 10, fontWeight: 500,
                  color: SIGNAL_COLORS[p.signal],
                  backgroundColor: `${SIGNAL_COLORS[p.signal]}18`,
                  padding: "2px 8px", borderRadius: 4,
                }}>
                  {p.signal}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{
                    fontSize: 12, fontWeight: 500,
                    color: p.confidence >= 8 ? "#22c55e" : p.confidence >= 6 ? "#eab308" : "rgba(255,255,255,0.35)",
                  }}>
                    {p.confidence}/10
                  </span>
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{p.daysAgo}d ago</span>
                </div>
              </div>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 6 }}>{p.signalDetail}</p>
            </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Sticky action bar */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 51,
        padding: "16px 40px",
        backgroundColor: "rgba(6,6,6,0.95)",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(12px)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>
          {selectedCount} of {visible.length} selected
        </span>
        <span style={{ fontSize: 13, color: "rgba(255,255,255,0.35)" }}>
          Est. {Math.round(selectedCount * (estReplyRate / 100))}-{Math.round(selectedCount * (estReplyRate / 100) + 2)} replies based on signals
        </span>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={toggleAll}
            style={{
              padding: "8px 16px", borderRadius: 6,
              border: "1px solid rgba(255,255,255,0.12)",
              backgroundColor: "transparent", color: "rgba(255,255,255,0.6)",
              fontSize: 13, cursor: "pointer",
            }}
          >
            {selectedCount === visible.length ? "Deselect All" : "Select All"}
          </button>
          <button
            onClick={onEditTemplate}
            style={{
              padding: "8px 16px", borderRadius: 6,
              border: "1px solid rgba(255,255,255,0.12)",
              backgroundColor: "transparent", color: "rgba(255,255,255,0.6)",
              fontSize: 13, cursor: "pointer",
            }}
          >
            Edit Template
          </button>
          <button
            onClick={() => onSendEmails(selectedVisible)}
            disabled={selectedCount === 0}
            style={{
              padding: "8px 20px", borderRadius: 6,
              backgroundColor: selectedCount > 0 ? "#f97316" : "rgba(255,255,255,0.08)",
              border: "none", color: selectedCount > 0 ? "#fff" : "rgba(255,255,255,0.3)",
              fontSize: 13, fontWeight: 500, cursor: selectedCount > 0 ? "pointer" : "default",
              transition: "background-color 0.2s",
            }}
          >
            Send Emails →
          </button>
        </div>
      </div>
    </motion.div>
  )
}
