"use client"

import { Zap } from "lucide-react"
import { cn } from "@/lib/utils"

interface Signal {
  id: string
  type: "Funding" | "Hiring" | "Launch" | "Growth" | "Intent"
  company: string
  description: string
  time: string
  priority: "high" | "medium" | "low"
  badge?: "HOT" | "NEW" | "URGENT"
}

const signals: Signal[] = [
  {
    id: "1",
    type: "Funding",
    company: "Acme Corp",
    description: "Raised $12M Series A",
    time: "2m ago",
    priority: "high",
    badge: "HOT",
  },
  {
    id: "2",
    type: "Hiring",
    company: "TechStart",
    description: "Hiring VP of Sales",
    time: "15m ago",
    priority: "high",
    badge: "NEW",
  },
  {
    id: "3",
    type: "Launch",
    company: "DataFlow",
    description: "Launched new product",
    time: "1h ago",
    priority: "medium",
  },
  {
    id: "4",
    type: "Intent",
    company: "CloudBase",
    description: "Visited pricing page 3x",
    time: "2h ago",
    priority: "medium",
    badge: "URGENT",
  },
  {
    id: "5",
    type: "Growth",
    company: "ScaleUp",
    description: "Posted 12 new roles",
    time: "3h ago",
    priority: "low",
  },
]

const typeColors = {
  Funding: "text-orange-500 bg-orange-500/10",
  Hiring: "text-blue-500 bg-blue-500/10",
  Launch: "text-green-500 bg-green-500/10",
  Growth: "text-purple-500 bg-purple-500/10",
  Intent: "text-yellow-500 bg-yellow-500/10",
}

const badgeColors = {
  HOT: "bg-red-500/10 text-red-500 border-red-500/20",
  NEW: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  URGENT: "bg-orange-500/10 text-orange-500 border-orange-500/20",
}

export function SignalsFeed() {
  return (
    <div className="rounded-md border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Zap className="h-4 w-4 text-accent" />
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          </div>
          <h3 className="text-sm font-medium">Live Signals</h3>
        </div>
        <span className="text-xs text-muted-foreground">{signals.length} new</span>
      </div>
      <div className="divide-y divide-border">
        {signals.map((signal) => (
          <div
            key={signal.id}
            className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-secondary/50"
          >
            <div className="flex flex-col items-center gap-1 mt-0.5">
              <div
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  signal.priority === "high"
                    ? "bg-accent animate-pulse"
                    : signal.priority === "medium"
                    ? "bg-primary"
                    : "bg-muted-foreground"
                )}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={cn(
                  "text-xs font-medium px-1.5 py-0.5 rounded",
                  typeColors[signal.type]
                )}>
                  {signal.type}
                </span>
                <span className="text-xs text-muted-foreground">
                  {signal.company}
                </span>
                {signal.badge && (
                  <span className={cn(
                    "text-[10px] font-bold px-1.5 py-0.5 rounded border",
                    badgeColors[signal.badge]
                  )}>
                    {signal.badge}
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-sm text-foreground truncate">
                {signal.description}
              </p>
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {signal.time}
            </span>
          </div>
        ))}
      </div>
      <div className="border-t border-border px-4 py-2">
        <button className="text-xs text-primary hover:underline">
          View all signals
        </button>
      </div>
    </div>
  )
}
