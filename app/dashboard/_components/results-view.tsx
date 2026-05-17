// app/dashboard/_components/results-view.tsx
"use client"

import { useState, useMemo } from "react"
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from "recharts"
import { ProspectCard } from "./prospect-card"
import type { Prospect } from "./types"

interface Props {
  prospects: Prospect[]
  onPreviewEmails: (selected: Prospect[]) => void
  onBack: () => void
}

export function ResultsView({ prospects, onPreviewEmails, onBack }: Props) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(prospects.map((p) => p.id))
  )

  const selected = prospects.filter((p) => selectedIds.has(p.id))

  const avgConf = useMemo(() => {
    if (!prospects.length) return 0
    return (prospects.reduce((s, p) => s + p.confidence, 0) / prospects.length).toFixed(1)
  }, [prospects])

  const estReplyRate = useMemo(() => Math.round(Number(avgConf) * 2.5), [avgConf])

  const signalData = useMemo(() => {
    const map: Record<string, number> = {}
    for (const p of prospects) map[p.signalType] = (map[p.signalType] ?? 0) + 1
    return Object.entries(map).map(([name, value]) => ({ name, value }))
  }, [prospects])

  const sourceData = useMemo(() => {
    const map: Record<string, number> = {}
    for (const p of prospects) {
      for (const s of p.sources) map[s] = (map[s] ?? 0) + 1
    }
    return Object.entries(map).map(([name, value]) => ({ name, value }))
  }, [prospects])

  const confData = useMemo(
    () => [
      { label: "5-6", count: prospects.filter((p) => p.confidence >= 5 && p.confidence < 7).length },
      { label: "7-8", count: prospects.filter((p) => p.confidence >= 7 && p.confidence < 9).length },
      { label: "9-10", count: prospects.filter((p) => p.confidence >= 9).length },
    ],
    [prospects]
  )

  const PIE_COLORS = ["#f97316", "#fbbf24", "#22c55e", "#3b82f6", "#a855f7"]

  function toggle(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0a0a0a", paddingBottom: 80 }}>
      {/* Summary bar */}
      <div
        style={{
          padding: "20px 24px",
          borderBottom: "1px solid #1a1a1a",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <button
          onClick={onBack}
          style={{
            background: "none",
            border: "none",
            color: "#666666",
            cursor: "pointer",
            fontSize: 13,
            padding: 0,
          }}
        >
          ← Back
        </button>
        <p style={{ fontSize: 14, color: "#ffffff", margin: 0 }}>
          {prospects.length} prospects found
        </p>
        <span style={{ color: "#1a1a1a" }}>·</span>
        <p style={{ fontSize: 14, color: "#666666", margin: 0 }}>Avg confidence {avgConf}</p>
        <span style={{ color: "#1a1a1a" }}>·</span>
        <p style={{ fontSize: 14, color: "#666666", margin: 0 }}>Est. reply rate ~{estReplyRate}%</p>
      </div>

      {/* Mini charts */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 12,
          padding: "16px 24px",
          borderBottom: "1px solid #1a1a1a",
        }}
      >
        {/* Signal donut */}
        <div style={{ backgroundColor: "#111111", border: "1px solid #1a1a1a", borderRadius: 8, padding: "12px 16px" }}>
          <p style={{ fontSize: 11, color: "#666666", margin: "0 0 8px" }}>Signal Types</p>
          <ResponsiveContainer width="100%" height={60}>
            <PieChart>
              <Pie data={signalData} cx="50%" cy="50%" innerRadius={18} outerRadius={28} dataKey="value" paddingAngle={2}>
                {signalData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Confidence bars */}
        <div style={{ backgroundColor: "#111111", border: "1px solid #1a1a1a", borderRadius: 8, padding: "12px 16px" }}>
          <p style={{ fontSize: 11, color: "#666666", margin: "0 0 8px" }}>Confidence</p>
          <ResponsiveContainer width="100%" height={60}>
            <BarChart data={confData} barSize={14}>
              <XAxis dataKey="label" tick={{ fill: "#666666", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: "#111111", border: "1px solid #1a1a1a", borderRadius: 6, fontSize: 11 }}
                cursor={{ fill: "rgba(255,255,255,0.03)" }}
              />
              <Bar dataKey="count" fill="#f97316" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Source breakdown */}
        <div style={{ backgroundColor: "#111111", border: "1px solid #1a1a1a", borderRadius: 8, padding: "12px 16px" }}>
          <p style={{ fontSize: 11, color: "#666666", margin: "0 0 8px" }}>Sources</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, paddingTop: 4 }}>
            {sourceData.map((s) => (
              <div key={s.name} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ flex: 1, height: 4, backgroundColor: "#1a1a1a", borderRadius: 2, overflow: "hidden" }}>
                  <div
                    style={{
                      width: `${(s.value / prospects.length) * 100}%`,
                      height: "100%",
                      backgroundColor: "#f97316",
                      borderRadius: 2,
                    }}
                  />
                </div>
                <span style={{ fontSize: 10, color: "#666666", width: 20 }}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Prospect grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 12,
          padding: "16px 24px",
        }}
      >
        {prospects.map((p, i) => (
          <ProspectCard
            key={p.id}
            prospect={p}
            selected={selectedIds.has(p.id)}
            onToggle={() => toggle(p.id)}
            animate
            animationDelay={i * 0.05}
          />
        ))}
      </div>

      {/* Sticky bottom action bar */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 200,
          right: 0,
          backgroundColor: "#111111",
          borderTop: "1px solid #1a1a1a",
          padding: "12px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          zIndex: 100,
        }}
      >
        <p style={{ fontSize: 14, color: "#666666", margin: 0 }}>
          {selected.length} of {prospects.length} selected
        </p>
        <p style={{ fontSize: 14, color: "#666666", margin: 0 }}>
          Est. ~{Math.round((selected.length * estReplyRate) / 100)} replies
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setSelectedIds(new Set(prospects.map((p) => p.id)))}
            style={{
              padding: "7px 14px",
              borderRadius: 6,
              border: "1px solid #1a1a1a",
              backgroundColor: "transparent",
              color: "#666666",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Select All
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            style={{
              padding: "7px 14px",
              borderRadius: 6,
              border: "1px solid #1a1a1a",
              backgroundColor: "transparent",
              color: "#666666",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Deselect All
          </button>
          <button
            onClick={() => onPreviewEmails(selected)}
            disabled={selected.length === 0}
            style={{
              padding: "7px 14px",
              borderRadius: 6,
              border: "none",
              backgroundColor: selected.length === 0 ? "#1a1a1a" : "#f97316",
              color: selected.length === 0 ? "#666666" : "#ffffff",
              fontSize: 13,
              fontWeight: 500,
              cursor: selected.length === 0 ? "not-allowed" : "pointer",
              transition: "all 200ms ease",
            }}
          >
            Preview Emails
          </button>
          <button
            onClick={() => selected.length > 0 && onPreviewEmails(selected)}
            disabled={selected.length === 0}
            style={{
              padding: "7px 14px",
              borderRadius: 6,
              backgroundColor: selected.length === 0 ? "#1a1a1a" : "#111111",
              color: selected.length === 0 ? "#666666" : "#f97316",
              border: `1px solid ${selected.length === 0 ? "#1a1a1a" : "#f97316"}`,
              fontSize: 13,
              fontWeight: 500,
              cursor: selected.length === 0 ? "not-allowed" : "pointer",
              transition: "all 200ms ease",
            }}
          >
            Send Now →
          </button>
        </div>
      </div>
    </div>
  )
}
