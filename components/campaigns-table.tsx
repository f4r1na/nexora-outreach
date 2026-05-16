"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import { MoreHorizontal } from "lucide-react"

interface Campaign {
  id: string
  name: string
  status: "active" | "paused" | "stopped" | "draft"
  prospects: number
  sent: number
  replyRate: number
  signals: number
  created: string
}

const campaigns: Campaign[] = [
  {
    id: "1",
    name: "Q1 Series A Outreach",
    status: "active",
    prospects: 245,
    sent: 180,
    replyRate: 12.4,
    signals: 8,
    created: "Jan 15, 2024",
  },
  {
    id: "2",
    name: "VP Sales Hiring Companies",
    status: "active",
    prospects: 156,
    sent: 89,
    replyRate: 18.2,
    signals: 12,
    created: "Jan 18, 2024",
  },
  {
    id: "3",
    name: "Product Launch Follow-up",
    status: "paused",
    prospects: 320,
    sent: 320,
    replyRate: 8.7,
    signals: 3,
    created: "Jan 10, 2024",
  },
  {
    id: "4",
    name: "Enterprise Tech Stack",
    status: "draft",
    prospects: 89,
    sent: 0,
    replyRate: 0,
    signals: 0,
    created: "Jan 22, 2024",
  },
  {
    id: "5",
    name: "Marketing Agency Outreach",
    status: "stopped",
    prospects: 412,
    sent: 412,
    replyRate: 15.3,
    signals: 24,
    created: "Dec 28, 2023",
  },
]

const statusStyles = {
  active: "bg-green-500/10 text-green-500 border border-green-500/20",
  paused: "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20",
  stopped: "bg-red-500/10 text-red-500 border border-red-500/20",
  draft: "bg-muted text-muted-foreground border border-border",
}

interface CampaignsTableProps {
  limit?: number
  showHeader?: boolean
}

export function CampaignsTable({ limit, showHeader = true }: CampaignsTableProps) {
  const displayCampaigns = limit ? campaigns.slice(0, limit) : campaigns

  return (
    <div className="rounded-md border border-border bg-card">
      {showHeader && (
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 className="text-sm font-medium">Recent Campaigns</h3>
          <Link
            href="/campaigns"
            className="text-xs text-primary hover:underline"
          >
            View all
          </Link>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-4 py-3 text-xs font-medium text-muted-foreground">
                Name
              </th>
              <th className="px-4 py-3 text-xs font-medium text-muted-foreground">
                Status
              </th>
              <th className="px-4 py-3 text-xs font-medium text-muted-foreground text-right">
                Prospects
              </th>
              <th className="px-4 py-3 text-xs font-medium text-muted-foreground text-right">
                Sent
              </th>
              <th className="px-4 py-3 text-xs font-medium text-muted-foreground text-right">
                Reply Rate
              </th>
              <th className="px-4 py-3 text-xs font-medium text-muted-foreground text-right">
                Signals
              </th>
              <th className="px-4 py-3 text-xs font-medium text-muted-foreground">
                Created
              </th>
              <th className="w-10 px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {displayCampaigns.map((campaign) => (
              <tr
                key={campaign.id}
                className="transition-colors hover:bg-secondary/50 group"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/campaigns/${campaign.id}`}
                    className="text-sm font-medium hover:text-primary transition-colors"
                  >
                    {campaign.name}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "inline-flex rounded px-2 py-0.5 text-xs font-medium capitalize",
                      statusStyles[campaign.status]
                    )}
                  >
                    {campaign.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-sm font-mono text-muted-foreground">
                  {campaign.prospects.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right text-sm font-mono text-muted-foreground">
                  {campaign.sent.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right text-sm font-mono text-muted-foreground">
                  {campaign.replyRate > 0 ? `${campaign.replyRate}%` : "—"}
                </td>
                <td className="px-4 py-3 text-right text-sm font-mono">
                  {campaign.signals > 0 ? (
                    <span className="text-accent">{campaign.signals}</span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {campaign.created}
                </td>
                <td className="px-4 py-3">
                  <button className="rounded p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground opacity-0 group-hover:opacity-100">
                    <MoreHorizontal className="h-4 w-4" />
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
