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

    const signals = (leads ?? [])
      .filter((l) => l.signal_data && Object.keys(l.signal_data).length > 0)
      .map((l) => ({
        ...l,
        campaign_name: campaignMap[l.campaign_id] ?? "Unknown Campaign",
      }));

    return NextResponse.json({ signals, campaigns });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
