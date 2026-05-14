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


    // Verify ownership before deleting
    const { data: existing, error: fetchError } = await db
      .from("replies")
      .select("id, user_id")
      .eq("id", replyId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (fetchError) {
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
      return NextResponse.json({ error: "Failed to delete reply" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
