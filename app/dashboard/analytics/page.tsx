import { BarChart3, TrendingUp, TrendingDown, Mail, Users, MessageSquare, Clock } from "lucide-react"

const metrics = [
  {
    name: "Total Emails Sent",
    value: "12,847",
    change: "+18.2%",
    changeType: "positive" as const,
    icon: Mail,
  },
  {
    name: "Unique Recipients",
    value: "4,234",
    change: "+12.5%",
    changeType: "positive" as const,
    icon: Users,
  },
  {
    name: "Average Reply Rate",
    value: "14.2%",
    change: "-2.1%",
    changeType: "negative" as const,
    icon: MessageSquare,
  },
  {
    name: "Avg. Response Time",
    value: "2.4 days",
    change: "-0.5 days",
    changeType: "positive" as const,
    icon: Clock,
  },
]

const campaignPerformance = [
  { name: "Q1 Series A Outreach", sent: 180, replies: 22, rate: 12.2 },
  { name: "VP Sales Hiring", sent: 89, replies: 16, rate: 18.0 },
  { name: "Product Launch Follow-up", sent: 320, replies: 28, rate: 8.8 },
  { name: "Marketing Agency Outreach", sent: 412, replies: 63, rate: 15.3 },
  { name: "Enterprise Tech Stack", sent: 156, replies: 19, rate: 12.2 },
]

const weeklyData = [
  { day: "Mon", sent: 45, replies: 6 },
  { day: "Tue", sent: 62, replies: 9 },
  { day: "Wed", sent: 78, replies: 12 },
  { day: "Thu", sent: 54, replies: 7 },
  { day: "Fri", sent: 41, replies: 5 },
  { day: "Sat", sent: 12, replies: 1 },
  { day: "Sun", sent: 8, replies: 1 },
]

export default function AnalyticsPage() {
  const maxSent = Math.max(...weeklyData.map((d) => d.sent))

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold">Analytics</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Track your outreach performance
        </p>
      </div>

      {/* Key Metrics */}
      <div className="mb-8 grid grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <div
            key={metric.name}
            className="rounded-md border border-border bg-card p-4"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">{metric.name}</p>
              <metric.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="mt-2 text-2xl font-semibold">{metric.value}</p>
            <div className="mt-1 flex items-center gap-1">
              {metric.changeType === "positive" ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
              <span
                className={`text-xs ${
                  metric.changeType === "positive"
                    ? "text-green-500"
                    : "text-red-500"
                }`}
              >
                {metric.change}
              </span>
              <span className="text-xs text-muted-foreground">vs last month</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Weekly Activity */}
        <div className="rounded-md border border-border bg-card p-4">
          <h3 className="mb-4 text-sm font-medium">Weekly Activity</h3>
          <div className="flex items-end gap-2 h-40">
            {weeklyData.map((day) => (
              <div key={day.day} className="flex-1 flex flex-col items-center gap-1">
                <div className="relative w-full flex flex-col items-center gap-0.5">
                  <div
                    className="w-full rounded-t bg-primary/20"
                    style={{ height: `${(day.sent / maxSent) * 120}px` }}
                  />
                  <div
                    className="w-full rounded-b bg-primary absolute bottom-0"
                    style={{ height: `${(day.replies / maxSent) * 120}px` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">{day.day}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded bg-primary/20" />
              <span className="text-muted-foreground">Sent</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded bg-primary" />
              <span className="text-muted-foreground">Replies</span>
            </div>
          </div>
        </div>

        {/* Campaign Performance */}
        <div className="rounded-md border border-border bg-card p-4">
          <h3 className="mb-4 text-sm font-medium">Campaign Performance</h3>
          <div className="space-y-3">
            {campaignPerformance.map((campaign) => (
              <div key={campaign.name} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{campaign.name}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="h-1.5 flex-1 rounded-full bg-secondary">
                      <div
                        className="h-1.5 rounded-full bg-primary"
                        style={{ width: `${(campaign.rate / 20) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-mono font-medium">
                    {campaign.rate}%
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {campaign.replies}/{campaign.sent}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="mt-6 rounded-md border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <h3 className="text-sm font-medium">Performance by Campaign</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-4 py-3 text-xs font-medium text-muted-foreground">
                Campaign
              </th>
              <th className="px-4 py-3 text-xs font-medium text-muted-foreground text-right">
                Sent
              </th>
              <th className="px-4 py-3 text-xs font-medium text-muted-foreground text-right">
                Opened
              </th>
              <th className="px-4 py-3 text-xs font-medium text-muted-foreground text-right">
                Clicked
              </th>
              <th className="px-4 py-3 text-xs font-medium text-muted-foreground text-right">
                Replied
              </th>
              <th className="px-4 py-3 text-xs font-medium text-muted-foreground text-right">
                Reply Rate
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {campaignPerformance.map((campaign) => (
              <tr
                key={campaign.name}
                className="transition-colors hover:bg-secondary/50"
              >
                <td className="px-4 py-3 text-sm">{campaign.name}</td>
                <td className="px-4 py-3 text-sm text-right font-mono text-muted-foreground">
                  {campaign.sent}
                </td>
                <td className="px-4 py-3 text-sm text-right font-mono text-muted-foreground">
                  {Math.round(campaign.sent * 0.65)}
                </td>
                <td className="px-4 py-3 text-sm text-right font-mono text-muted-foreground">
                  {Math.round(campaign.sent * 0.2)}
                </td>
                <td className="px-4 py-3 text-sm text-right font-mono">
                  {campaign.replies}
                </td>
                <td className="px-4 py-3 text-sm text-right font-mono">
                  <span
                    className={
                      campaign.rate >= 15
                        ? "text-green-500"
                        : campaign.rate >= 10
                        ? "text-foreground"
                        : "text-muted-foreground"
                    }
                  >
                    {campaign.rate}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
