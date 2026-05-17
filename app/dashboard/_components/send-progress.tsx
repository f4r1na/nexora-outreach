// app/dashboard/_components/send-progress.tsx
"use client"

import { useEffect, useState } from "react"
import type { Prospect, GeneratedEmail } from "./types"

interface Props {
  prospects: Prospect[]
  emails: Record<string, GeneratedEmail>
  onDone: () => void
  onNewSearch: () => void
}

export function SendProgress({ prospects, onDone, onNewSearch }: Props) {
  const [sent, setSent] = useState<string[]>([])
  const [done, setDone] = useState(false)

  useEffect(() => {
    let i = 0
    const interval = setInterval(() => {
      if (i >= prospects.length) {
        clearInterval(interval)
        setTimeout(() => setDone(true), 600)
        return
      }
      setSent((prev) => [...prev, prospects[i].id])
      i++
    }, 400)
    return () => clearInterval(interval)
  }, [prospects])

  const progress = prospects.length > 0 ? (sent.length / prospects.length) * 100 : 0

  if (done) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#0a0a0a",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 24px",
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            backgroundColor: "rgba(249,115,22,0.1)",
            border: "2px solid #f97316",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 24,
            animation: "orange-burst 0.6s ease-out both",
          }}
        >
          <svg width="28" height="22" viewBox="0 0 28 22" fill="none">
            <path d="M2 11l8 8L26 2" stroke="#f97316" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <p style={{ fontSize: 24, fontWeight: 500, color: "#ffffff", margin: "0 0 8px" }}>
          {prospects.length} emails sent
        </p>
        <p style={{ fontSize: 14, color: "#666666", margin: "0 0 4px" }}>
          Follow-ups scheduled in 3 days
        </p>
        <p style={{ fontSize: 14, color: "#666666", margin: "0 0 32px" }}>
          Nexora is monitoring for replies
        </p>
        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={onDone}
            style={{
              padding: "9px 18px",
              borderRadius: 6,
              border: "1px solid #1a1a1a",
              backgroundColor: "transparent",
              color: "#666666",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            View Campaign
          </button>
          <button
            onClick={onNewSearch}
            style={{
              padding: "9px 18px",
              borderRadius: 6,
              border: "none",
              backgroundColor: "#f97316",
              color: "#ffffff",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Start New Search
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#0a0a0a",
        padding: "48px 24px",
        maxWidth: 560,
        margin: "0 auto",
      }}
    >
      <p style={{ fontSize: 16, fontWeight: 500, color: "#ffffff", marginBottom: 24 }}>
        Sending emails...
      </p>
      <div
        style={{
          height: 3,
          backgroundColor: "#1a1a1a",
          borderRadius: 2,
          marginBottom: 24,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${progress}%`,
            backgroundColor: "#f97316",
            borderRadius: 2,
            transition: "width 400ms ease",
          }}
        />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {prospects.map((p) => {
          const isSent = sent.includes(p.id)
          return (
            <div
              key={p.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                fontSize: 13,
                color: isSent ? "#ffffff" : "#333333",
                transition: "color 300ms ease",
              }}
            >
              <span style={{ color: isSent ? "#22c55e" : "#333333", fontSize: 14 }}>
                {isSent ? "✓" : "○"}
              </span>
              {p.name} · {p.company}
              {isSent && (
                <span style={{ fontSize: 11, color: "#666666", marginLeft: "auto" }}>sent</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
