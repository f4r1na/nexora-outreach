import { Zap, Filter, ArrowUpDown, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const signals = [
  {
    id: "1",
    type: "Funding",
    company: "Acme Corp",
    description: "Raised $12M Series A led by Sequoia",
    prospect: "Sarah Chen",
    title: "VP of Sales",
    time: "2m ago",
    priority: "high",
    source: "TechCrunch",
  },
  {
    id: "2",
    type: "Hiring",
    company: "TechStart",
    description: "Hiring VP of Sales - posted on LinkedIn",
    prospect: "Michael Roberts",
    title: "Head of Growth",
    time: "15m ago",
    priority: "high",
    source: "LinkedIn",
  },
  {
    id: "3",
    type: "News",
    company: "DataFlow",
    description: "Launched DataFlow 2.0 with AI features",
    prospect: "Emily Davis",
    title: "CEO",
    time: "1h ago",
    priority: "medium",
    source: "Product Hunt",
  },
  {
    id: "4",
    type: "Intent",
    company: "CloudBase",
    description: "Visited pricing page 3x in last 24 hours",
    prospect: "James Wilson",
    title: "Director of Sales",
    time: "2h ago",
    priority: "medium",
    source: "Website",
  },
  {
    id: "5",
    type: "Hiring",
    company: "ScaleUp",
    description: "Posted 12 new sales roles this week",
    prospect: "Lisa Thompson",
    title: "VP Revenue",
    time: "3h ago",
    priority: "low",
    source: "LinkedIn",
  },
  {
    id: "6",
    type: "Funding",
    company: "InnovateTech",
    description: "Closed $5M seed round",
    prospect: "David Kim",
    title: "Founder",
    time: "4h ago",
    priority: "high",
    source: "Crunchbase",
  },
  {
    id: "7",
    type: "News",
    company: "GrowthCo",
    description: "Announced partnership with Salesforce",
    prospect: "Jennifer Lee",
    title: "Head of Partnerships",
    time: "5h ago",
    priority: "medium",
    source: "PR Newswire",
  },
  {
    id: "8",
    type: "Intent",
    company: "MarketPro",
    description: "Downloaded pricing PDF",
    prospect: "Robert Chen",
    title: "CMO",
    time: "6h ago",
    priority: "low",
    source: "Website",
  },
]

const typeStyles = {
  Funding: "bg-accent/10 text-accent",
  Hiring: "bg-green-500/10 text-green-500",
  News: "bg-primary/10 text-primary",
  Intent: "bg-blue-400/10 text-blue-400",
}

const priorityStyles = {
  high: "bg-accent",
  medium: "bg-primary",
  low: "bg-muted-foreground",
}

export default function SignalsPage() {
  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-accent" />
            <h1 className="text-lg font-semibold">Signals</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            AI-detected buying signals from your prospects
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2 border-border bg-card hover:bg-secondary">
            <Filter className="h-3.5 w-3.5" />
            Filter
          </Button>
          <Button variant="outline" size="sm" className="gap-2 border-border bg-card hover:bg-secondary">
            <ArrowUpDown className="h-3.5 w-3.5" />
            Sort
          </Button>
        </div>
      </div>

      {/* Signal Stats */}
      <div className="mb-6 grid grid-cols-4 gap-4">
        <div className="rounded-md border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total Signals</p>
          <p className="mt-1 text-2xl font-semibold">{signals.length}</p>
        </div>
        <div className="rounded-md border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">High Priority</p>
          <p className="mt-1 text-2xl font-semibold text-accent">
            {signals.filter((s) => s.priority === "high").length}
          </p>
        </div>
        <div className="rounded-md border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Funding Signals</p>
          <p className="mt-1 text-2xl font-semibold">
            {signals.filter((s) => s.type === "Funding").length}
          </p>
        </div>
        <div className="rounded-md border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Intent Signals</p>
          <p className="mt-1 text-2xl font-semibold">
            {signals.filter((s) => s.type === "Intent").length}
          </p>
        </div>
      </div>

      {/* Signals Table */}
      <div className="rounded-md border border-border bg-card">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="w-4 px-4 py-3"></th>
              <th className="px-4 py-3 text-xs font-medium text-muted-foreground">
                Type
              </th>
              <th className="px-4 py-3 text-xs font-medium text-muted-foreground">
                Company
              </th>
              <th className="px-4 py-3 text-xs font-medium text-muted-foreground">
                Signal
              </th>
              <th className="px-4 py-3 text-xs font-medium text-muted-foreground">
                Contact
              </th>
              <th className="px-4 py-3 text-xs font-medium text-muted-foreground">
                Source
              </th>
              <th className="px-4 py-3 text-xs font-medium text-muted-foreground">
                Time
              </th>
              <th className="w-10 px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {signals.map((signal) => (
              <tr
                key={signal.id}
                className="transition-colors hover:bg-secondary/50"
              >
                <td className="px-4 py-3">
                  <div
                    className={cn(
                      "h-2 w-2 rounded-full",
                      priorityStyles[signal.priority as keyof typeof priorityStyles]
                    )}
                  />
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "rounded px-2 py-0.5 text-xs font-medium",
                      typeStyles[signal.type as keyof typeof typeStyles]
                    )}
                  >
                    {signal.type}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm font-medium">{signal.company}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-muted-foreground">
                    {signal.description}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div>
                    <p className="text-sm">{signal.prospect}</p>
                    <p className="text-xs text-muted-foreground">
                      {signal.title}
                    </p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-primary">{signal.source}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-muted-foreground">
                    {signal.time}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button className="rounded p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                    <ExternalLink className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
