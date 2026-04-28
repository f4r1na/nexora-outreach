import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_TYPES = ["saas", "agency", "investor"] as const;
type FounderType = typeof VALID_TYPES[number];

function getDb() {
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

  const db = getDb();
  const { data } = await db
    .from("subscriptions")
    .select("founder_type")
    .eq("user_id", user.id)
    .single();

  return NextResponse.json({ founder_type: data?.founder_type ?? null });
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { founder_type } = body as { founder_type?: string };

  if (!founder_type || !VALID_TYPES.includes(founder_type as FounderType)) {
    return NextResponse.json({ error: "founder_type must be saas, agency, or investor" }, { status: 400 });
  }

  const db = getDb();
  const { error } = await db
    .from("subscriptions")
    .update({ founder_type })
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
