// components/new-sidebar.tsx
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Clock, BarChart3, Settings } from "lucide-react"

const NAV = [
  { label: "Home", href: "/dashboard", icon: LayoutDashboard },
  { label: "History", href: "/dashboard/history", icon: Clock },
  { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
]

interface Props {
  userEmail: string
  userName: string
  plan: string
}

export function NewSidebar({ userName, plan }: Props) {
  const pathname = usePathname()

  return (
    <aside
      style={{
        width: 200,
        minWidth: 200,
        height: "100vh",
        backgroundColor: "#0a0a0a",
        borderRight: "1px solid #1a1a1a",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Logo */}
      <div
        style={{
          height: 56,
          display: "flex",
          alignItems: "center",
          gap: 10,
          paddingLeft: 20,
          borderBottom: "1px solid #1a1a1a",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontSize: 22,
            fontWeight: 500,
            color: "#f97316",
            fontFamily: "var(--font-space-grotesk)",
            filter: "drop-shadow(0 0 8px rgba(249,115,22,0.45))",
            lineHeight: 1,
          }}
        >
          N
        </span>
        <span
          style={{
            fontSize: 15,
            fontWeight: 500,
            color: "#ffffff",
            fontFamily: "var(--font-space-grotesk)",
          }}
        >
          Nexora
        </span>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "10px 8px" }}>
        {NAV.map(({ label, href, icon: Icon }) => {
          const active =
            pathname === href ||
            (href !== "/dashboard" && pathname.startsWith(href + "/"))
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 12px",
                borderRadius: 6,
                marginBottom: 2,
                textDecoration: "none",
                fontSize: 14,
                fontWeight: 400,
                color: active ? "#ffffff" : "#666666",
                backgroundColor: active ? "#111111" : "transparent",
                boxShadow: active ? "inset 3px 0 0 #f97316" : "none",
                transition: "all 200ms ease",
              }}
            >
              <Icon size={15} strokeWidth={1.5} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div
        style={{
          padding: "14px 16px",
          borderTop: "1px solid #1a1a1a",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              backgroundColor: "#1a1a1a",
              border: "1px solid #2a2a2a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontWeight: 500,
              color: "#ffffff",
              flexShrink: 0,
            }}
          >
            {userName.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                fontSize: 13,
                fontWeight: 400,
                color: "#ffffff",
                margin: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {userName}
            </p>
            <p
              style={{
                fontSize: 11,
                color: "#666666",
                margin: 0,
                textTransform: "capitalize",
                whiteSpace: "nowrap",
              }}
            >
              {plan} plan
            </p>
          </div>
        </div>
      </div>
    </aside>
  )
}
