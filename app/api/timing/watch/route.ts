import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 30;

const URGENCY_DAYS: Record<string, number> = {
  job_change: 3,
  hiring: 2,
  funding: 7,
  tech_change: 14,
  post_activity: 3,
};

function parseRelativeDays(dateStr: string): number {
  const lower = (dateStr ?? "").toLowerCase();
  const match = lower.match(/(\d+)\s*(day|week|month)/);
  if (!match) return 0;
  const num = parseInt(match[1]);
  const unit = match[2];
  if (unit === "day") return num;
  if (unit === "week") return num * 7;
  if (unit === "month") return num * 30;
  return 0;
}

type SignalEntry = { type: string; text: string; date: string; strength: string };
type LeadSignalData = { signals?: SignalEntry[]; last_updated?: string };

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = rateLimit({ key: `timing:${user.id}`, limit: 30, windowMs: 3600_000 });
  if (!rl.ok) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

  const body = await req.json() as { campaignId?: string; leadIds?: string[] };
  const { campaignId, leadIds } = body;

  if (!campaignId && !leadIds?.length) {
    return NextResponse.json({ error: "Provide campaignId or leadIds" }, { status: 400 });
  }

  let query = supabase
    .from("leads")
    .select("id, first_name, company, signal_data")
    .eq("signal_status", "done");

  if (leadIds?.length) {
    query = query.in("id", leadIds);
  } else {
    query = query.eq("campaign_id", campaignId!);
  }

  const { data: leads } = await query;
  if (!leads?.length) return NextResponse.json({ triggers: [], leads: [] });

  const db = createAdminClient();
  const leadIdList = leads.map(l => l.id);

  await db
    .from("timing_triggers")
    .delete()
    .in("lead_id", leadIdList)
    .eq("acted_on", false);

  type TriggerInsert = {
    lead_id: string;
    user_id: string;
    trigger_type: string;
    trigger_data: object;
    detected_at: string;
    optimal_send_by: string;
    acted_on: boolean;
  };

  const toInsert: TriggerInsert[] = [];

  for (const lead of leads) {
    const signalData = lead.signal_data as LeadSignalData | null;
    if (!signalData?.signals?.length) continue;

    const lastUpdated = signalData.last_updated ? new Date(signalData.last_updated) : new Date();

    for (const sig of signalData.signals) {
      const triggerType = sig.type in URGENCY_DAYS ? sig.type : "post_activity";
      const urgencyDays = URGENCY_DAYS[triggerType];
      const ageDays = parseRelativeDays(sig.date);
      const daysLeft = urgencyDays - ageDays;
      if (daysLeft <= 0) continue;

      const detectedAt = new Date(lastUpdated);
      detectedAt.setDate(detectedAt.getDate() - ageDays);

      const optimalSendBy = new Date(detectedAt);
      optimalSendBy.setDate(optimalSendBy.getDate() + urgencyDays);

      toInsert.push({
        lead_id: lead.id,
        user_id: user.id,
        trigger_type: triggerType,
        trigger_data: { signal: sig, lead_name: lead.first_name, company: lead.company },
        detected_at: detectedAt.toISOString(),
        optimal_send_by: optimalSendBy.toISOString(),
        acted_on: false,
      });
    }
  }

  if (toInsert.length > 0) {
    await db.from("timing_triggers").insert(toInsert);
  }

  const leadEarliestSend = new Map<string, number>();
  for (const t of toInsert) {
    const ts = new Date(t.optimal_send_by).getTime();
    const existing = leadEarliestSend.get(t.lead_id);
    if (!existing || ts < existing) leadEarliestSend.set(t.lead_id, ts);
  }

  const sortedLeads = leads
    .filter(l => leadEarliestSend.has(l.id))
    .sort((a, b) => (leadEarliestSend.get(a.id) ?? 0) - (leadEarliestSend.get(b.id) ?? 0));

  const { data: savedTriggers } = await db
    .from("timing_triggers")
    .select("*")
    .in("lead_id", leadIdList)
    .eq("acted_on", false);

  return NextResponse.json({ triggers: savedTriggers ?? [], leads: sortedLeads });
}
