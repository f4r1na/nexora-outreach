"use client"
export default function ThinkingIndicator({ taskText }: { taskText: string }) {
  return (
    <div style={{ display: "flex", gap: 14, marginBottom: 24, alignItems: "center" }}>
      <div style={{ width: 28, height: 28, flexShrink: 0, background: "rgba(255,107,53,0.08)", border: "1px solid rgba(255,107,53,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#FF6B35", fontFamily: "monospace", boxShadow: "0 0 10px rgba(255,107,53,0.4)", animation: "gAvatarPulse 1s ease-in-out infinite" }}>
        NX
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        <div style={{ fontSize: 9, fontFamily: "monospace", letterSpacing: "0.14em", color: "#FF6B35", textTransform: "uppercase" as const }}>Working</div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "monospace", animation: "gTaskFade 2.5s ease-in-out infinite" }}>{taskText}</div>
        <div style={{ display: "flex", gap: 5 }}>
          {[0,1,2].map(i => (
            <div key={i} style={{ width: 4, height: 4, borderRadius: "50%", background: "rgba(255,107,53,0.5)", animation: `gDotBounce 1s ${i*0.18}s ease-in-out infinite` }} />
          ))}
        </div>
      </div>
    </div>
  )
}
