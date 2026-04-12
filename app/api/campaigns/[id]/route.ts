import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function DELETE(_req: NextRequest, { params }: Props) {
  const { id } = await params;

  // Auth check with RLS client
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getServiceClient();

  // Verify ownership
  const { data: campaign } = await db
    .from("campaigns")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  console.log(JSON.stringify({ step: "delete_campaign_start", campaign_id: id, user_id: user.id }));

  // 1. Delete email_events (no cascade, must delete manually)
  const { error: eventsErr } = await db
    .from("email_events")
    .delete()
    .eq("campaign_id", id);
  if (eventsErr) {
    console.error(JSON.stringify({ step: "delete_email_events_error", error: eventsErr.message }));
    return NextResponse.json({ error: "Failed to delete email events" }, { status: 500 });
  }
  console.log(JSON.stringify({ step: "deleted_email_events", campaign_id: id }));

  // 2. Delete campaign — CASCADE handles leads; replies.campaign_id is SET NULL on cascade
  const { error: campaignErr } = await db
    .from("campaigns")
    .delete()
    .eq("id", id);
  if (campaignErr) {
    console.error(JSON.stringify({ step: "delete_campaign_error", error: campaignErr.message }));
    return NextResponse.json({ error: "Failed to delete campaign" }, { status: 500 });
  }
  console.log(JSON.stringify({ step: "delete_campaign_success", campaign_id: id }));

  return NextResponse.json({ deleted: true });
}
