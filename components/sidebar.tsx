"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Send, Zap, BarChart3, Settings } from "lucide-react"
import { NexoraIcon } from "@/components/ui/nexora-logo"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Campaigns", href: "/dashboard/campaigns", icon: Send },
  { name: "Signals", href: "/dashboard/signals", icon: Zap },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
]

interface SidebarProps {
  userEmail: string
  userName: string
  plan: string
}

export function Sidebar({ userEmail, userName, plan }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="flex h-screen w-56 flex-col border-r border-border bg-card animate-slide-in-left">
      {/* Orange top accent line */}
      <div style={{ height: 2, background: "linear-gradient(90deg, #f97316, #fbbf24)" }} />

      {/* Logo */}
      <div className="flex h-14 items-center gap-2.5 border-b border-border px-4">
        <div className="animate-logo-breathe">
          <NexoraIcon size={26} />
        </div>
        <span className="text-base font-semibold tracking-tight">Nexora</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4">
        <ul className="space-y-0.5">
          {navigation.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname?.startsWith(`${item.href}/`))
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-secondary text-primary shadow-[inset_2px_0_0_#f97316]"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground hover:translate-x-0.5"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.name}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* User Profile */}
      <div className="border-t border-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-sm font-medium shrink-0">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{userName}</p>
            <p className="text-xs text-muted-foreground capitalize">{plan} plan</p>
          </div>
          {plan !== "free" && (
            <div
              className="flex items-center rounded px-1.5 py-0.5 shrink-0"
              style={{ background: "#f97316" }}
            >
              <span className="text-[9px] font-medium text-white uppercase tracking-wide">
                {plan}
              </span>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
