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
  const { sequence_id, action } = body as { sequence_id?: string; action?: string };

  if (!sequence_id || !action) {
    return NextResponse.json({ error: "sequence_id and action required" }, { status: 400 });
  }

  if (!["pause", "resume", "cancel"].includes(action)) {
    return NextResponse.json({ error: "action must be pause, resume, or cancel" }, { status: 400 });
  }

  const db = getServiceClient();

  // Verify ownership
  const { data: seq } = await db
    .from("follow_up_sequences")
    .select("id, status")
    .eq("id", sequence_id)
    .eq("user_id", user.id)
    .single();

  if (!seq) return NextResponse.json({ error: "Sequence not found" }, { status: 404 });

  const newStatus = action === "pause" ? "paused" : action === "resume" ? "ready" : "cancelled";

  const { error } = await db
    .from("follow_up_sequences")
    .update({ status: newStatus })
    .eq("id", sequence_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // If cancelling, also cancel all scheduled emails
  if (action === "cancel") {
    await db
      .from("follow_up_emails")
      .update({ status: "skipped" })
      .eq("sequence_id", sequence_id)
      .eq("status", "scheduled");
  }

  console.log(JSON.stringify({ step: "followup_action", sequence_id, action, new_status: newStatus }));
  return NextResponse.json({ ok: true, status: newStatus });
}
