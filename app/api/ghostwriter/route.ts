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

// GET — fetch the current user's writing style
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = getServiceClient();
    const { data: style } = await db
      .from("writing_styles")
      .select("style_summary, tone_keywords, sample_emails, updated_at")
      .eq("user_id", user.id)
      .maybeSingle();

    return NextResponse.json({ style: style ?? null });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// DELETE — remove the user's writing style
export async function DELETE() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = getServiceClient();
    const { error } = await db
      .from("writing_styles")
      .delete()
      .eq("user_id", user.id);

    if (error) {
      console.error(JSON.stringify({ step: "ghostwriter_delete_error", error: error.message }));
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(JSON.stringify({ step: "ghostwriter_deleted", user_id: user.id }));
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
