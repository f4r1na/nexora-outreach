import { CommandBar } from "@/components/command-bar"
import { StatCard } from "@/components/stat-card"
import { CampaignsTable } from "@/components/campaigns-table"
import { SignalsFeed } from "@/components/signals-feed"

export default function DashboardPage() {
  return (
    <div className="p-6 animate-fade-in">
      {/* Command Center */}
      <div className="mb-8">
        <h1 className="mb-1 text-lg font-semibold">Mission Control</h1>
        <p className="mb-4 text-sm text-muted-foreground">
          Your AI-powered sales command center
        </p>
        <CommandBar />
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        <StatCard
          title="Emails Sent"
          value="2,847"
          change="+12.3% from last week"
          changeType="positive"
          iconName="mail"
          iconColor="text-primary"
        />
        <StatCard
          title="Active Leads"
          value="1,234"
          change="+8.1% from last week"
          changeType="positive"
          iconName="users"
          iconColor="text-foreground"
        />
        <StatCard
          title="Response Rate"
          value="14.2%"
          change="-2.1% from last week"
          changeType="negative"
          iconName="messageSquare"
          iconColor="text-green-500"
        />
        <StatCard
          title="AI Signals"
          value="89"
          change="24 high priority"
          changeType="neutral"
          iconName="zap"
          iconColor="text-accent"
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CampaignsTable limit={5} />
        </div>
        <div className="lg:col-span-1">
          <SignalsFeed />
        </div>
      </div>
    </div>
  )
}
