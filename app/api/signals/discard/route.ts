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
  const { signal_id, discarded } = body as {
    signal_id?: string;
    discarded?: boolean;
  };

  if (!signal_id || typeof signal_id !== "string") {
    return NextResponse.json({ error: "signal_id required" }, { status: 400 });
  }

  const db = getServiceClient();

  // Ownership check: signal → campaign → user
  const { data: signal } = await db
    .from("signals")
    .select("id, campaign_id")
    .eq("id", signal_id)
    .single();
  if (!signal) return NextResponse.json({ error: "Signal not found" }, { status: 404 });

  const { data: camp } = await db
    .from("campaigns")
    .select("id")
    .eq("id", signal.campaign_id)
    .eq("user_id", user.id)
    .single();
  if (!camp) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { error } = await db
    .from("signals")
    .update({ discarded: discarded !== false })
    .eq("id", signal_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
