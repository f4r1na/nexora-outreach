import Link from "next/link"

type Item = {
  id: string
  title: string
  subtitle: string
  meta?: string
  status?: "orange" | "yellow" | "green" | string
}

type Action = {
  label: string
  href?: string
  onClick?: () => void
  primary?: boolean
}

export default function DataCard({
  header,
  subheader,
  items,
  actions,
}: {
  header: string
  subheader?: string
  items: Item[]
  actions: Action[]
}) {
  const DOT_COLORS: Record<string, string> = {
    orange: "#FF6B35",
    yellow: "#FFD700",
    green:  "#4ade80",
  }

  return (
    <div style={{ marginTop: 12, border: "1px solid rgba(255,255,255,0.07)", background: "#0a0a0a", animation: "gCardIn 0.3s ease-out" }}>
      <div style={{ padding: "8px 14px", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: 9, fontFamily: "monospace", color: "rgba(255,255,255,0.22)", letterSpacing: "0.14em", textTransform: "uppercase" as const, display: "flex", justifyContent: "space-between" }}>
        <span>{header}</span>
        {subheader && <span style={{ color: "rgba(255,107,53,0.45)" }}>{subheader}</span>}
      </div>
      {items.map(item => (
        <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 14px", borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: 11 }}>
          <div style={{ width: 5, height: 5, borderRadius: "50%", flexShrink: 0, background: DOT_COLORS[item.status ?? "white"] ?? "rgba(255,255,255,0.3)", boxShadow: `0 0 5px ${DOT_COLORS[item.status ?? ""] ?? "transparent"}` }} />
          <div style={{ color: "rgba(255,255,255,0.75)", flex: 1 }}>{item.title}</div>
          <div style={{ fontFamily: "monospace", fontSize: 10, color: "rgba(255,255,255,0.22)" }}>{item.subtitle}</div>
          {item.meta && <div style={{ fontFamily: "monospace", fontSize: 10, color: "#4ade80", fontWeight: 600 }}>{item.meta}</div>}
        </div>
      ))}
      {actions.length > 0 && (
        <div style={{ display: "flex", gap: 6, padding: "10px 14px", borderTop: "1px solid rgba(255,255,255,0.05)", flexWrap: "wrap" as const }}>
          {actions.map(a => (
            a.href ? (
              <Link key={a.label} href={a.href} style={{ fontSize: 10, fontFamily: "monospace", letterSpacing: "0.06em", padding: "5px 14px", border: `1px solid ${a.primary ? "rgba(255,107,53,0.35)" : "rgba(255,255,255,0.07)"}`, color: a.primary ? "#FF6B35" : "rgba(255,255,255,0.3)", textTransform: "uppercase" as const, textDecoration: "none", transition: "all 0.15s" }}>
                {a.label}
              </Link>
            ) : (
              <button key={a.label} onClick={a.onClick} style={{ fontSize: 10, fontFamily: "monospace", letterSpacing: "0.06em", padding: "5px 14px", border: `1px solid ${a.primary ? "rgba(255,107,53,0.35)" : "rgba(255,255,255,0.07)"}`, color: a.primary ? "#FF6B35" : "rgba(255,255,255,0.3)", background: "transparent", textTransform: "uppercase" as const, cursor: "pointer", transition: "all 0.15s" }}>
                {a.label}
              </button>
            )
          ))}
        </div>
      )}
    </div>
  )
}
