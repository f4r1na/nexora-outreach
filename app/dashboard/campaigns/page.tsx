import { Plus, Search, Filter, ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CampaignsTable } from "@/components/campaigns-table"
import Link from "next/link"

export default function CampaignsPage() {
  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Campaigns</h1>
          <p className="text-sm text-muted-foreground">
            Manage your outreach campaigns
          </p>
        </div>
        <Button asChild className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
          <Link href="/dashboard/campaigns/new">
            <Plus className="h-4 w-4" />
            New Campaign
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search campaigns..."
            className="h-9 w-full rounded-md border border-border bg-card pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <Button variant="outline" size="sm" className="gap-2 border-border bg-card text-foreground hover:bg-secondary">
          <Filter className="h-3.5 w-3.5" />
          Filter
        </Button>
        <Button variant="outline" size="sm" className="gap-2 border-border bg-card text-foreground hover:bg-secondary">
          <ArrowUpDown className="h-3.5 w-3.5" />
          Sort
        </Button>
      </div>

      {/* Table */}
      <CampaignsTable showHeader={false} />
    </div>
  )
}
