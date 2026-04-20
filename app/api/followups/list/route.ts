import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getServiceClient();

  // Get all sequences for this user's campaigns
  const { data: sequences, error } = await db
    .from("follow_up_sequences")
    .select("id, campaign_id, follow_up_number, delay_days, status, created_at")
    .eq("user_id", user.id)
    .order("campaign_id")
    .order("follow_up_number");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!sequences || sequences.length === 0) return NextResponse.json({ campaigns: [] });

  // Get campaigns info
  const campaignIds = [...new Set(sequences.map((s: { campaign_id: string }) => s.campaign_id))];
  const { data: campaigns } = await db
    .from("campaigns")
    .select("id, name, lead_count")
    .in("id", campaignIds)
    .eq("user_id", user.id);

  // Get email counts per sequence
  const seqIds = sequences.map((s: { id: string }) => s.id);
  const { data: emailCounts } = await db
    .from("follow_up_emails")
    .select("sequence_id, status, scheduled_at")
    .in("sequence_id", seqIds)
    .order("scheduled_at");

  // Build counts map
  type EmailRow = { sequence_id: string; status: string; scheduled_at: string };
  const countsBySeq: Record<string, { scheduled: number; sent: number; skipped: number; failed: number; next_at: string | null }> = {};

  for (const email of (emailCounts ?? []) as EmailRow[]) {
    if (!countsBySeq[email.sequence_id]) {
      countsBySeq[email.sequence_id] = { scheduled: 0, sent: 0, skipped: 0, failed: 0, next_at: null };
    }
    const c = countsBySeq[email.sequence_id];
    if (email.status === "scheduled") {
      c.scheduled++;
      if (!c.next_at || email.scheduled_at < c.next_at) c.next_at = email.scheduled_at;
    } else if (email.status === "sent") c.sent++;
    else if (email.status === "skipped") c.skipped++;
    else if (email.status === "failed") c.failed++;
  }

  // Group sequences by campaign
  type SeqRow = { id: string; campaign_id: string; follow_up_number: number; delay_days: number; status: string; created_at: string };
  type CampaignRow = { id: string; name: string; lead_count: number };

  const campaignMap = new Map((campaigns ?? []).map((c: CampaignRow) => [c.id, c]));
  const byCampaign: Record<string, {
    id: string; name: string; lead_count: number;
    sequences: Array<SeqRow & { scheduled: number; sent: number; skipped: number; failed: number; next_at: string | null }>;
  }> = {};

  for (const seq of sequences as SeqRow[]) {
    if (!byCampaign[seq.campaign_id]) {
      const camp = campaignMap.get(seq.campaign_id);
      byCampaign[seq.campaign_id] = {
        id: seq.campaign_id,
        name: camp?.name ?? "Unknown",
        lead_count: camp?.lead_count ?? 0,
        sequences: [],
      };
    }
    const counts = countsBySeq[seq.id] ?? { scheduled: 0, sent: 0, skipped: 0, failed: 0, next_at: null };
    byCampaign[seq.campaign_id].sequences.push({ ...seq, ...counts });
  }

  return NextResponse.json({ campaigns: Object.values(byCampaign) });
}
