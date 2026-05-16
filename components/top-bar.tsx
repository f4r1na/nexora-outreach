"use client"

import { Activity, Mail, Zap } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

interface TopBarProps {
  systemStatus?: "online" | "offline" | "degraded"
  emailsPerHour?: number
  signalsCount?: number
}

export function TopBar({
  systemStatus = "online",
  emailsPerHour = 0,
  signalsCount = 0,
}: TopBarProps) {
  return (
    <div className="flex h-10 items-center justify-between border-b border-border bg-background px-6">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div
            className={`h-1.5 w-1.5 rounded-full ${
              systemStatus === "online"
                ? "bg-green-500 animate-pulse-glow"
                : systemStatus === "degraded"
                ? "bg-yellow-500"
                : "bg-red-500"
            }`}
          />
          <span className="text-xs text-muted-foreground">
            System {systemStatus}
          </span>
        </div>
        <div className="h-3 w-px bg-border" />
        <div className="flex items-center gap-1.5">
          <Mail className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            {emailsPerHour}/hr
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Zap className="h-3 w-3 text-accent" />
          <span className="text-xs text-muted-foreground">
            {signalsCount} signals
          </span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Activity className="h-3 w-3 text-primary" />
          <span className="text-xs font-medium text-primary">AI Online</span>
        </div>
        <ThemeToggle />
      </div>
    </div>
  )
}
