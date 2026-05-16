import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { MoreHorizontal, Plus } from "lucide-react";

interface Campaign {
  id: string;
  name: string;
  status: "active" | "paused" | "stopped" | "draft" | "sent";
  prospects: number;
  sent: number;
  replyRate: number;
  signals: number;
  created: string;
}

const statusStyles: Record<string, string> = {
  active: "bg-primary/10 text-primary",
  paused: "bg-yellow-500/10 text-yellow-500",
  stopped: "bg-red-500/10 text-red-500",
  sent: "bg-green-500/10 text-green-500",
  draft: "bg-secondary text-muted-foreground",
};

const statusLabels: Record<string, string> = {
  active: "Active",
  paused: "Paused",
  stopped: "Stopped",
  sent: "Complete",
  draft: "Draft",
};

interface CampaignsTableProps {
  limit?: number;
  showHeader?: boolean;
}

export async function CampaignsTable({ limit, showHeader = true }: CampaignsTableProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: rawCampaigns } = await supabase
    .from("campaigns")
    .select("id, name, status, lead_count, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit ?? 1000);

  const campaignRows = rawCampaigns ?? [];

  let campaigns: Campaign[] = [];

  if (campaignRows.length > 0) {
    const campaignIds = campaignRows.map((c) => c.id);

    const { data: events } = await supabase
      .from("email_events")
      .select("event_type, campaign_id")
      .eq("user_id", user.id)
      .in("campaign_id", campaignIds);

    const { data: leadsWithSignals } = await supabase
      .from("leads")
      .select("campaign_id")
      .in("campaign_id", campaignIds)
      .not("signal_data", "is", null);

    const evts = events ?? [];
    const signalsByCampaign: Record<string, number> = {};
    for (const l of leadsWithSignals ?? []) {
      signalsByCampaign[l.campaign_id] = (signalsByCampaign[l.campaign_id] ?? 0) + 1;
    }

    campaigns = campaignRows.map((c) => {
      const ce = evts.filter((e) => e.campaign_id === c.id);
      const cSent = ce.filter((e) => e.event_type === "sent").length;
      const cReplied = ce.filter((e) => e.event_type === "replied").length;
      const effectiveSent = cSent > 0 ? cSent : (c.status === "sent" ? (c.lead_count ?? 0) : 0);
      const replyRate = effectiveSent > 0 ? Math.round((cReplied / effectiveSent) * 1000) / 10 : 0;
      return {
        id: c.id,
        name: c.name,
        status: c.status,
        prospects: c.lead_count ?? 0,
        sent: effectiveSent,
        replyRate,
        signals: signalsByCampaign[c.id] ?? 0,
        created: new Date(c.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      };
    });
  }

  if (campaigns.length === 0) {
    return (
      <div className="rounded-md border border-border bg-card">
        {showHeader && (
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h3 className="text-sm font-medium">Recent Campaigns</h3>
            <Link
              href="/dashboard/campaigns/new"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 12px",
                borderRadius: 6,
                backgroundColor: "#f97316",
                color: "#fff",
                fontSize: 12,
                textDecoration: "none",
                fontWeight: 500,
              }}
            >
              <Plus style={{ width: 12, height: 12 }} />
              New Campaign
            </Link>
          </div>
        )}
        <div
          style={{
            padding: "48px 24px",
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.45)", marginBottom: "4px" }}>
            No campaigns yet.
          </p>
          <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.3)", marginBottom: "20px" }}>
            Use the command bar to create one.
          </p>
          <Link
            href="/dashboard/campaigns/new"
            style={{
              display: "inline-block",
              padding: "8px 20px",
              borderRadius: "6px",
              backgroundColor: "#f97316",
              color: "#fff",
              fontSize: "13px",
              textDecoration: "none",
            }}
          >
            Create Campaign
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-border bg-card">
      {showHeader && (
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 className="text-sm font-medium">Recent Campaigns</h3>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/campaigns/new"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 12px",
                borderRadius: 6,
                backgroundColor: "#f97316",
                color: "#fff",
                fontSize: 12,
                textDecoration: "none",
                fontWeight: 500,
              }}
            >
              <Plus style={{ width: 12, height: 12 }} />
              New Campaign
            </Link>
            <Link
              href="/dashboard/campaigns"
              className="text-xs text-primary hover:underline"
            >
              View all
            </Link>
          </div>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Name</th>
              <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-xs font-medium text-muted-foreground text-right">Prospects</th>
              <th className="px-4 py-3 text-xs font-medium text-muted-foreground text-right">Sent</th>
              <th className="px-4 py-3 text-xs font-medium text-muted-foreground text-right">Reply Rate</th>
              <th className="px-4 py-3 text-xs font-medium text-muted-foreground text-right">Signals</th>
              <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Created</th>
              <th className="w-10 px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {campaigns.map((campaign) => (
              <tr
                key={campaign.id}
                className="transition-colors hover:bg-secondary/50 campaign-row group"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/dashboard/campaigns/${campaign.id}`}
                    className="text-sm font-medium hover:text-primary transition-colors"
                  >
                    {campaign.name}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium",
                      statusStyles[campaign.status] ?? statusStyles.draft
                    )}
                  >
                    {campaign.status === "active" && (
                      <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse shrink-0" />
                    )}
                    {statusLabels[campaign.status] ?? campaign.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-sm font-mono text-muted-foreground">
                  {campaign.prospects.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right text-sm font-mono text-muted-foreground">
                  {campaign.sent.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right text-sm font-mono text-muted-foreground">
                  {campaign.replyRate > 0 ? `${campaign.replyRate}%` : "-"}
                </td>
                <td className="px-4 py-3 text-right text-sm font-mono">
                  {campaign.signals > 0 ? (
                    <span className="text-primary">{campaign.signals}</span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
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
  );
}
