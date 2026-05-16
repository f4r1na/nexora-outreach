"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { X } from "lucide-react"

const EASE = [0.4, 0, 0.2, 1] as const

function generateTemplate(query: string): { subject: string; body: string } {
  const q = query.toLowerCase()
  const isSaaS = q.includes("saas") || q.includes("founder") || q.includes("series")
  const subject = isSaaS
    ? "Quick question about your growth trajectory"
    : "Partnership idea for {{company}}"
  const body = `Hi {{first_name}},

I noticed {{signal_detail}} — congrats on the momentum.

I'm reaching out because we help ${isSaaS ? "SaaS teams like yours scale outbound without adding headcount" : "companies like {{company}} drive more pipeline with less manual work"}.

Our customers typically see 3-5x more replies within the first 30 days.

Worth a 20-minute call to see if it's a fit?

Best,
[Your name]`
  return { subject, body }
}

interface EmailPreviewModalProps {
  query: string
  onUse: (subject: string, body: string) => void
  onCancel: () => void
}

export function EmailPreviewModal({ query, onUse, onCancel }: EmailPreviewModalProps) {
  const { subject: defaultSubject, body: defaultBody } = generateTemplate(query)
  const [subject, setSubject] = useState(defaultSubject)
  const [body, setBody] = useState(defaultBody)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed", inset: 0, zIndex: 60,
        display: "flex", alignItems: "center", justifyContent: "center",
        backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)",
      }}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
        style={{
          width: "100%", maxWidth: 580,
          backgroundColor: "#111",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 16, overflow: "hidden",
        }}
      >
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 20px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}>
          <h3 style={{ fontSize: 14, fontWeight: 500, color: "#fff" }}>Email Template</h3>
          <button onClick={onCancel} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)", padding: 4 }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: "20px" }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 6 }}>
              Subject
            </label>
            <input
              value={subject}
              onChange={e => setSubject(e.target.value)}
              style={{
                width: "100%", padding: "10px 12px",
                backgroundColor: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 8, color: "#fff", fontSize: 13,
                outline: "none", boxSizing: "border-box",
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 6 }}>
              Body
            </label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              rows={10}
              style={{
                width: "100%", padding: "10px 12px",
                backgroundColor: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 8, color: "rgba(255,255,255,0.8)", fontSize: 13,
                lineHeight: 1.6, resize: "vertical", outline: "none",
                fontFamily: "var(--font-outfit)", boxSizing: "border-box",
              }}
            />
          </div>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 8 }}>
            {"Variables: {{first_name}}, {{company}}, {{signal_detail}}"}
          </p>
        </div>

        <div style={{
          display: "flex", justifyContent: "flex-end", gap: 10,
          padding: "14px 20px",
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}>
          <button
            onClick={onCancel}
            style={{
              padding: "8px 16px", borderRadius: 6,
              border: "1px solid rgba(255,255,255,0.12)",
              backgroundColor: "transparent", color: "rgba(255,255,255,0.6)",
              fontSize: 13, cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => onUse(subject, body)}
            style={{
              padding: "8px 20px", borderRadius: 6,
              backgroundColor: "#f97316", border: "none",
              color: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer",
            }}
          >
            Use Template →
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
