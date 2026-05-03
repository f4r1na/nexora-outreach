import type { SupabaseClient } from "@supabase/supabase-js";
import { detectGithubActivity } from "./detectors/github-detector";
import { detectHiringSignals } from "./detectors/hiring-detector";
import { detectFundingSignals } from "./detectors/funding-detector";
import type { DetectedSignal } from "./detectors/github-detector";

export type { DetectedSignal };

interface Lead {
  id: string;
  campaign_id: string;
  company: string | null;
}

interface AggregatorResult {
  inserted: number;
  signals: DetectedSignal[];
}

export async function runDetectors(
  lead: Lead,
  db: SupabaseClient
): Promise<AggregatorResult> {
  const company = lead.company?.trim();
  if (!company) return { inserted: 0, signals: [] };

  const [github, hiring, funding] = await Promise.all([
    detectGithubActivity(company),
    detectHiringSignals(company),
    detectFundingSignals(company),
  ]);

  const detected: DetectedSignal[] = [...github, ...hiring, ...funding];
  if (detected.length === 0) return { inserted: 0, signals: [] };

  const today = new Date().toISOString().slice(0, 10);

  const rows = detected.map((s) => ({
    lead_id: lead.id,
    campaign_id: lead.campaign_id,
    source: s.source,
    source_url: s.source_url,
    text: s.text,
    type: s.type,
    date: s.date_iso,
    date_iso: s.date_iso,
    strength: s.strength,
    discarded: false,
    // Backfill date_iso with today for any signals missing it
    ...(s.date_iso ? {} : { date_iso: today, date: today }),
  }));

  const { data: inserted, error } = await db
    .from("signals")
    .upsert(rows, { onConflict: "lead_id,source,date_iso", ignoreDuplicates: true })
    .select("id");

  if (error) {
    console.error("[aggregator] insert error:", error.message);
    return { inserted: 0, signals: detected };
  }

  return { inserted: inserted?.length ?? 0, signals: detected };
}
