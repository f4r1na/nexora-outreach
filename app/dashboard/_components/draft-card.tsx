type Action = { label: string; onClick?: () => void; primary?: boolean }

export default function DraftCard({
  recipientName,
  subject,
  body,
  actions,
}: {
  recipientName?: string
  subject: string
  body: string
  actions: Action[]
}) {
  return (
    <div style={{ marginTop: 12, border: "1px solid rgba(255,107,53,0.15)", background: "rgba(255,107,53,0.03)", animation: "gCardIn 0.35s ease-out" }}>
      <div style={{ padding: "8px 14px", borderBottom: "1px solid rgba(255,107,53,0.1)", fontSize: 9, fontFamily: "monospace", letterSpacing: "0.14em", textTransform: "uppercase" as const, display: "flex", justifyContent: "space-between", color: "rgba(255,107,53,0.5)" }}>
        <span>Draft{recipientName ? ` · ${recipientName}` : ""}</span>
        <span>Ghostwriter v3</span>
      </div>
      <div style={{ padding: 14, fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 1.9, fontFamily: "monospace", borderBottom: "1px solid rgba(255,107,53,0.08)" }}>
        <div style={{ color: "rgba(255,255,255,0.28)", fontSize: 10, marginBottom: 10, letterSpacing: "0.04em" }}>
          Subject: {subject}
        </div>
        <div>{body}</div>
      </div>
      {actions.length > 0 && (
        <div style={{ display: "flex", gap: 6, padding: "10px 14px", flexWrap: "wrap" as const }}>
          {actions.map(a => (
            <button key={a.label} onClick={a.onClick} style={{ fontSize: 10, fontFamily: "monospace", letterSpacing: "0.06em", padding: "5px 14px", border: `1px solid ${a.primary ? "rgba(255,107,53,0.35)" : "rgba(255,255,255,0.07)"}`, color: a.primary ? "#FF6B35" : "rgba(255,255,255,0.3)", background: "transparent", textTransform: "uppercase" as const, cursor: "pointer" }}>
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
