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
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = getServiceClient();

    // Get all campaigns for this user
    const { data: campaigns } = await db
      .from("campaigns")
      .select("id, name, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!campaigns || campaigns.length === 0) {
      return NextResponse.json({ signals: [], campaigns: [] });
    }

    const campaignIds = campaigns.map((c) => c.id);

    // Get leads with signal_data
    const { data: leads } = await db
      .from("leads")
      .select("id, campaign_id, first_name, company, role, email, signal_data, signal_status, created_at")
      .in("campaign_id", campaignIds)
      .not("signal_data", "is", null)
      .order("created_at", { ascending: false });

    // Build campaign map
    const campaignMap: Record<string, string> = {};
    for (const c of campaigns) {
      campaignMap[c.id] = c.name;
    }

    const leadList = (leads ?? []).filter(
      (l) => l.signal_data && Object.keys(l.signal_data).length > 0
    );
    const leadIds = leadList.map((l) => l.id);

    // Discrete signals (additive), filtered to last 90 days and not-discarded.
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    const { data: discrete } = leadIds.length
      ? await db
          .from("signals")
          .select("id, lead_id, source, source_url, date, date_iso, strength")
          .in("lead_id", leadIds)
          .eq("discarded", false)
          .or(`date_iso.gte.${ninetyDaysAgo},date_iso.is.null`)
      : { data: [] as { id: string; lead_id: string; source: string; source_url: string | null; date: string | null; date_iso: string | null; strength: string }[] };

    const byLead: Record<string, typeof discrete> = {};
    for (const s of discrete ?? []) {
      (byLead[s.lead_id] ??= []).push(s);
    }

    const signals = leadList.map((l) => ({
      ...l,
      campaign_name: campaignMap[l.campaign_id] ?? "Unknown Campaign",
      discrete_signals: byLead[l.id] ?? [],
    }));

    return NextResponse.json({ signals, campaigns });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
