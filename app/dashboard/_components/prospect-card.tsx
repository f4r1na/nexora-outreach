// app/dashboard/_components/prospect-card.tsx
"use client"

import type { Prospect } from "./types"

const SOURCE_LABELS: Record<string, string> = {
  github: "GH",
  hackernews: "HN",
  producthunt: "PH",
  news: "News",
  linkedin: "LI",
}

const CONFIDENCE_COLOR = (c: number) => {
  if (c >= 8) return "#22c55e"
  if (c >= 6) return "#f97316"
  return "#ef4444"
}

interface Props {
  prospect: Prospect
  selected?: boolean
  onToggle?: () => void
  animate?: boolean
  animationDelay?: number
}

export function ProspectCard({
  prospect,
  selected = false,
  onToggle,
  animate = false,
  animationDelay = 0,
}: Props) {
  return (
    <div
      style={{
        backgroundColor: "#111111",
        border: `1px solid ${selected ? "#f97316" : "#1a1a1a"}`,
        borderRadius: 8,
        padding: "16px",
        cursor: onToggle ? "pointer" : "default",
        transition: "all 200ms ease",
        animation: animate ? `fade-in 0.3s ease-out ${animationDelay}s both` : undefined,
        position: "relative",
      }}
      onClick={onToggle}
    >
      {/* Checkbox + header row */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        {onToggle && (
          <div
            style={{
              width: 16,
              height: 16,
              borderRadius: 4,
              border: `1px solid ${selected ? "#f97316" : "#2a2a2a"}`,
              backgroundColor: selected ? "#f97316" : "transparent",
              flexShrink: 0,
              marginTop: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {selected && (
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                <path d="M1 4l3 3 5-6" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
        )}

        {/* Avatar */}
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            backgroundColor: "#1a1a1a",
            border: "1px solid #2a2a2a",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 14,
            fontWeight: 500,
            color: "#f97316",
            flexShrink: 0,
          }}
        >
          {prospect.name.charAt(0)}
        </div>

        {/* Name + role */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: "#ffffff",
              margin: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {prospect.name}
          </p>
          <p
            style={{
              fontSize: 12,
              color: "#666666",
              margin: "2px 0 0",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {prospect.role} · {prospect.company}
          </p>
        </div>

        {/* Confidence ring */}
        <div style={{ flexShrink: 0, textAlign: "center" }}>
          <svg width="32" height="32" viewBox="0 0 32 32">
            <circle cx="16" cy="16" r="13" fill="none" stroke="#1a1a1a" strokeWidth="3" />
            <circle
              cx="16"
              cy="16"
              r="13"
              fill="none"
              stroke={CONFIDENCE_COLOR(prospect.confidence)}
              strokeWidth="3"
              strokeDasharray={`${(prospect.confidence / 10) * 81.7} 81.7`}
              strokeLinecap="round"
              transform="rotate(-90 16 16)"
            />
          </svg>
          <p
            style={{
              fontSize: 10,
              color: CONFIDENCE_COLOR(prospect.confidence),
              margin: "-28px 0 0",
              lineHeight: "32px",
              textAlign: "center",
              fontWeight: 500,
            }}
          >
            {prospect.confidence}
          </p>
        </div>
      </div>

      {/* Signal */}
      <div style={{ marginTop: 10 }}>
        <span
          style={{
            display: "inline-block",
            fontSize: 11,
            color: "#f97316",
            backgroundColor: "rgba(249,115,22,0.08)",
            border: "1px solid rgba(249,115,22,0.15)",
            borderRadius: 4,
            padding: "2px 8px",
            marginBottom: 4,
          }}
        >
          {prospect.signalType}
        </span>
        <p style={{ fontSize: 12, color: "#666666", margin: 0, lineHeight: 1.4 }}>
          {prospect.signalDescription}
        </p>
      </div>

      {/* Footer */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: 10,
        }}
      >
        <div style={{ display: "flex", gap: 4 }}>
          {prospect.sources.map((src) => (
            <span
              key={src}
              style={{
                fontSize: 10,
                color: "#666666",
                backgroundColor: "#1a1a1a",
                border: "1px solid #2a2a2a",
                borderRadius: 3,
                padding: "1px 5px",
              }}
            >
              {SOURCE_LABELS[src] ?? src}
            </span>
          ))}
          <span
            style={{
              fontSize: 10,
              color: prospect.verified ? "#22c55e" : "#666666",
              backgroundColor: prospect.verified ? "rgba(34,197,94,0.08)" : "#1a1a1a",
              border: `1px solid ${prospect.verified ? "rgba(34,197,94,0.2)" : "#2a2a2a"}`,
              borderRadius: 3,
              padding: "1px 5px",
            }}
          >
            {prospect.verified ? "Verified" : "Unverified"}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, color: "#666666" }}>{prospect.daysAgo}d ago</span>
          {prospect.sourceUrl && (
            <a
              href={prospect.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              style={{ fontSize: 11, color: "#f97316", textDecoration: "none" }}
            >
              View Source →
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
