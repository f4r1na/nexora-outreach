"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAgent } from "@/contexts/agent-context"

const NAV = [
  { label: "Overview",    href: "/dashboard" },
  { label: "Campaigns",   href: "/dashboard/campaigns" },
  { label: "Inbox",       href: "/dashboard/inbox" },
  { label: "Signals",     href: "/dashboard/signals" },
  { label: "Ghostwriter", href: "/dashboard/ghostwriter" },
  { label: "Analytics",   href: "/dashboard/analytics" },
  { label: "Settings",    href: "/dashboard/settings" },
]

export default function Topbar({ userName }: { userName: string }) {
  const path = usePathname()
  const { isWorking } = useAgent()
  const initial = userName.charAt(0).toUpperCase()

  return (
    <div style={{
      height: 38, background: "#070707",
      borderBottom: "1px solid rgba(255,255,255,0.04)",
      display: "flex", alignItems: "center", padding: "0 20px", gap: 18,
      flexShrink: 0, zIndex: 20, position: "relative",
      overflow: "hidden",
    }}>
      {isWorking && (
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: "linear-gradient(90deg,transparent 0%,rgba(255,107,53,0.07) 50%,transparent 100%)",
          backgroundSize: "200% 100%",
          animation: "gTopbarShimmer 1.8s linear infinite",
        }} />
      )}

      <span style={{
        fontSize: 11, fontWeight: 700, letterSpacing: "0.22em",
        color: "#FF6B35", textTransform: "uppercase" as const, fontFamily: "monospace",
        animation: isWorking ? "gLogoPulse 1s ease-in-out infinite" : "none",
      }}>
        NEXORA
      </span>

      <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.05)" }} />

      <nav style={{ display: "flex", flex: 1 }}>
        {NAV.map(({ label, href }) => {
          const active = href === "/dashboard" ? path === href : path.startsWith(href)
          return (
            <Link key={href} href={href} style={{
              fontSize: 11, color: active ? "#fff" : "rgba(255,255,255,0.28)",
              padding: "0 13px", height: 38, display: "flex", alignItems: "center",
              letterSpacing: "0.06em", borderBottom: active ? "2px solid #FF6B35" : "2px solid transparent",
              transition: "color 0.15s", textDecoration: "none",
            }}>
              {label}
            </Link>
          )
        })}
      </nav>

      <div style={{
        display: "flex", alignItems: "center", gap: 5,
        fontSize: 9, fontFamily: "monospace", letterSpacing: "0.12em",
        textTransform: "uppercase" as const, padding: "3px 10px",
        border: isWorking ? "1px solid rgba(255,107,53,0.3)" : "1px solid rgba(255,255,255,0.06)",
        color: isWorking ? "#FF6B35" : "rgba(255,255,255,0.22)",
        background: isWorking ? "rgba(255,107,53,0.05)" : "transparent",
        transition: "all 0.4s",
      }}>
        <div style={{
          width: 5, height: 5, borderRadius: "50%",
          background: isWorking ? "#FF6B35" : "#4ade80",
          animation: `gStatusPulse ${isWorking ? "0.5s" : "2s"} ease-in-out infinite`,
        }} />
        {isWorking ? "Agent running..." : "Live"}
      </div>

      <div style={{
        width: 24, height: 24,
        background: "rgba(255,107,53,0.1)",
        border: "1px solid rgba(255,107,53,0.2)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 10, fontWeight: 700, color: "#FF6B35", fontFamily: "monospace",
      }}>
        {initial}
      </div>
    </div>
  )
}
