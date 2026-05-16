import { createClient } from "@/lib/supabase/server";
import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";

type SignalType = "Funding" | "Hiring" | "Launch" | "Growth" | "Intent";
type Priority = "high" | "medium" | "low";

interface SignalItem {
  id: string;
  type: SignalType;
  company: string;
  description: string;
  time: string;
  priority: Priority;
}

const typeColors: Record<string, string> = {
  Funding: "text-orange-500 bg-orange-500/10",
  Hiring: "text-blue-500 bg-blue-500/10",
  Launch: "text-green-500 bg-green-500/10",
  Growth: "text-purple-500 bg-purple-500/10",
  Intent: "text-yellow-500 bg-yellow-500/10",
};

function getRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function inferSignalType(source: string): SignalType {
  const s = source.toLowerCase();
  if (s.includes("fund") || s.includes("raise") || s.includes("series") || s.includes("seed")) return "Funding";
  if (s.includes("hir") || s.includes("job") || s.includes("recruit")) return "Hiring";
  if (s.includes("launch") || s.includes("product") || s.includes("release")) return "Launch";
  if (s.includes("grow") || s.includes("expand") || s.includes("scale")) return "Growth";
  return "Intent";
}

export async function SignalsFeed() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("id")
    .eq("user_id", user.id);

  const campaignIds = (campaigns ?? []).map((c) => c.id);

  let signals: SignalItem[] = [];

  if (campaignIds.length > 0) {
    const { data: leads } = await supabase
      .from("leads")
      .select("id, company, created_at, signal_data")
      .in("campaign_id", campaignIds)
      .not("signal_data", "is", null)
      .order("created_at", { ascending: false })
      .limit(20);

    const leadIds = (leads ?? []).map((l) => l.id);

    if (leadIds.length > 0) {
      const { data: discreteSignals } = await supabase
        .from("signals")
        .select("id, lead_id, source, date_iso, strength")
        .in("lead_id", leadIds)
        .eq("discarded", false)
        .order("date_iso", { ascending: false })
        .limit(15);

      const leadMap: Record<string, { company: string; created_at: string }> = {};
      for (const l of leads ?? []) {
        leadMap[l.id] = { company: l.company ?? "Unknown", created_at: l.created_at };
      }

      signals = (discreteSignals ?? []).map((s) => {
        const lead = leadMap[s.lead_id];
        const type = inferSignalType(s.source ?? "");
        const strength = (s.strength ?? "").toLowerCase();
        const priority: Priority = strength === "high" ? "high" : strength === "medium" ? "medium" : "low";
        return {
          id: s.id,
          type,
          company: lead?.company ?? "Unknown",
          description: s.source ?? "Signal detected",
          time: getRelativeTime(s.date_iso ?? lead?.created_at ?? new Date().toISOString()),
          priority,
        };
      });
    }
  }

  if (signals.length === 0) {
    return (
      <div className="rounded-md border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-accent" />
            <h3 className="text-sm font-medium">Live Signals</h3>
          </div>
          <span className="text-xs text-muted-foreground">0 new</span>
        </div>
        <div style={{ padding: "48px 24px", textAlign: "center" }}>
          <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.45)", marginBottom: "8px" }}>
            No signals detected yet.
          </p>
          <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.3)" }}>
            Nexora will surface real-time signals as your campaigns run.
          </p>
        </div>
      </div>
    );
  }

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
                <span className={cn("text-xs font-medium px-1.5 py-0.5 rounded", typeColors[signal.type] ?? typeColors.Intent)}>
                  {signal.type}
                </span>
                <span className="text-xs text-muted-foreground">{signal.company}</span>
              </div>
              <p className="mt-0.5 text-sm text-foreground truncate">{signal.description}</p>
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">{signal.time}</span>
          </div>
        ))}
      </div>
      <div className="border-t border-border px-4 py-2">
        <a href="/dashboard/signals" className="text-xs text-primary hover:underline">
          View all signals
        </a>
      </div>
    </div>
  );
}
