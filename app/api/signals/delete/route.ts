import { NextRequest, NextResponse } from "next/server";
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

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { campaign_id } = body as { campaign_id?: string };

  const db = getServiceClient();

  // Resolve the campaign IDs that belong to this user
  let campaignIds: string[];
  if (campaign_id) {
    // Verify ownership
    const { data: camp } = await db
      .from("campaigns")
      .select("id")
      .eq("id", campaign_id)
      .eq("user_id", user.id)
      .single();
    if (!camp) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    campaignIds = [campaign_id];
  } else {
    const { data: camps } = await db
      .from("campaigns")
      .select("id")
      .eq("user_id", user.id);
    campaignIds = (camps ?? []).map((c: { id: string }) => c.id);
  }

  console.log(JSON.stringify({ step: "delete_signals_start", user_id: user.id, campaign_ids: campaignIds }));

  if (campaignIds.length === 0) {
    return NextResponse.json({ cleared: 0 });
  }

  const { data, error } = await db
    .from("leads")
    .update({ signal_data: {}, signal_status: "pending" })
    .in("campaign_id", campaignIds)
    .select("id");

  if (error) {
    console.error(JSON.stringify({ step: "delete_signals_error", error: error.message }));
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const cleared = data?.length ?? 0;
  console.log(JSON.stringify({ step: "delete_signals_success", cleared, campaign_ids: campaignIds }));

  return NextResponse.json({ cleared });
}
