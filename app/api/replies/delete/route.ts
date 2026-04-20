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
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let replyId: string;
    try {
      const body = await req.json();
      replyId = body.reply_id;
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    if (!replyId) {
      return NextResponse.json({ error: "reply_id is required" }, { status: 400 });
    }

    const db = getServiceClient();

    console.log(JSON.stringify({ step: "reply_delete_start", reply_id: replyId, user_id: user.id }));

    // Verify ownership before deleting
    const { data: existing, error: fetchError } = await db
      .from("replies")
      .select("id, user_id")
      .eq("id", replyId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (fetchError) {
      console.error(JSON.stringify({ step: "reply_delete_fetch_error", error: fetchError.message }));
      return NextResponse.json({ error: "Failed to verify reply ownership" }, { status: 500 });
    }

    if (!existing) {
      return NextResponse.json({ error: "Reply not found" }, { status: 404 });
    }

    const { error: deleteError } = await db
      .from("replies")
      .delete()
      .eq("id", replyId)
      .eq("user_id", user.id);

    if (deleteError) {
      console.error(JSON.stringify({ step: "reply_delete_db_error", error: deleteError.message }));
      return NextResponse.json({ error: "Failed to delete reply" }, { status: 500 });
    }

    console.log(JSON.stringify({ step: "reply_deleted", reply_id: replyId, user_id: user.id }));
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(JSON.stringify({ step: "reply_delete_fatal", error: msg }));
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
