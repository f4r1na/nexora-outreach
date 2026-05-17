// app/dashboard/_components/email-preview.tsx
"use client"

import { useState, useEffect } from "react"
import type { Prospect, GeneratedEmail } from "./types"

interface Props {
  prospects: Prospect[]
  onSendAll: (emails: Record<string, GeneratedEmail>) => void
  onBack: () => void
}

export function EmailPreview({ prospects, onSendAll, onBack }: Props) {
  const [index, setIndex] = useState(0)
  const [emails, setEmails] = useState<Record<string, GeneratedEmail>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const current = prospects[index]

  useEffect(() => {
    if (!current || emails[current.id]) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)

    fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        campaignName: "Command Center Campaign",
        tone: "professional",
        leads: [
          {
            name: current.name,
            company: current.company,
            role: current.role,
            email: "",
            note: current.signalDescription,
          },
        ],
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        const generated = data.results?.[0]
        if (generated) {
          setEmails((prev) => ({
            ...prev,
            [current.id]: {
              subject: generated.subject ?? `Quick note about ${current.company}`,
              body: generated.body ?? "",
            },
          }))
        }
        setLoading(false)
      })
      .catch(() => {
        setError("Failed to generate email")
        setLoading(false)
      })
  }, [current?.id])

  const email = emails[current?.id] ?? { subject: "", body: "" }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#0a0a0a",
        padding: "32px 24px",
        maxWidth: 720,
        margin: "0 auto",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
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
          {current?.name} · {current?.company}
        </p>
        <div style={{ flex: 1 }} />
        <p style={{ fontSize: 12, color: "#666666", margin: 0 }}>
          {index + 1} / {prospects.length}
        </p>
        <button
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
          style={{
            padding: "5px 10px",
            borderRadius: 5,
            border: "1px solid #1a1a1a",
            backgroundColor: "transparent",
            color: index === 0 ? "#333333" : "#666666",
            fontSize: 12,
            cursor: index === 0 ? "not-allowed" : "pointer",
          }}
        >
          ←
        </button>
        <button
          onClick={() => setIndex((i) => Math.min(prospects.length - 1, i + 1))}
          disabled={index === prospects.length - 1}
          style={{
            padding: "5px 10px",
            borderRadius: 5,
            border: "1px solid #1a1a1a",
            backgroundColor: "transparent",
            color: index === prospects.length - 1 ? "#333333" : "#666666",
            fontSize: 12,
            cursor: index === prospects.length - 1 ? "not-allowed" : "pointer",
          }}
        >
          →
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "48px 0", color: "#666666", fontSize: 14 }}>
          Generating email...
        </div>
      ) : error ? (
        <div style={{ textAlign: "center", padding: "48px 0", color: "#ef4444", fontSize: 14 }}>
          {error}
        </div>
      ) : (
        <div
          style={{
            backgroundColor: "#111111",
            border: "1px solid #1a1a1a",
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          <div style={{ padding: "16px", borderBottom: "1px solid #1a1a1a" }}>
            <label style={{ fontSize: 11, color: "#666666", display: "block", marginBottom: 6 }}>
              SUBJECT
            </label>
            <input
              value={email.subject}
              onChange={(e) =>
                setEmails((prev) => ({
                  ...prev,
                  [current.id]: { ...prev[current.id], subject: e.target.value },
                }))
              }
              style={{
                width: "100%",
                backgroundColor: "transparent",
                border: "none",
                outline: "none",
                fontSize: 14,
                fontWeight: 500,
                color: "#ffffff",
                boxSizing: "border-box",
              }}
            />
          </div>
          <div style={{ padding: "16px" }}>
            <label style={{ fontSize: 11, color: "#666666", display: "block", marginBottom: 6 }}>
              BODY
            </label>
            <textarea
              value={email.body}
              onChange={(e) =>
                setEmails((prev) => ({
                  ...prev,
                  [current.id]: { ...prev[current.id], body: e.target.value },
                }))
              }
              rows={14}
              style={{
                width: "100%",
                backgroundColor: "transparent",
                border: "none",
                outline: "none",
                fontSize: 13,
                color: "#cccccc",
                resize: "vertical",
                lineHeight: 1.6,
                fontFamily: "inherit",
                boxSizing: "border-box",
              }}
            />
          </div>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 }}>
        <button
          onClick={onBack}
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
          ← Back
        </button>
        <button
          onClick={() => onSendAll(emails)}
          style={{
            padding: "9px 20px",
            borderRadius: 6,
            border: "none",
            backgroundColor: "#f97316",
            color: "#ffffff",
            fontSize: 13,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Send All Now →
        </button>
      </div>
    </div>
  )
}
