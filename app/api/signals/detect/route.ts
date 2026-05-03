import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { rateLimit } from "@/lib/rate-limit";
import { runDetectors } from "@/lib/signals/aggregator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getDb() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rl = rateLimit({
      key: `signal-detect:${user.id}`,
      limit: 20,
      windowMs: 3_600_000,
    });
    if (!rl.ok)
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

    const body = await req.json().catch(() => ({}));
    const { lead_id } = body as { lead_id?: string };
    if (!lead_id)
      return NextResponse.json({ error: "lead_id required" }, { status: 400 });

    const db = getDb();

    const { data: lead } = await db
      .from("leads")
      .select("id, company, campaign_id")
      .eq("id", lead_id)
      .single();
    if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

    const { data: campaign } = await db
      .from("campaigns")
      .select("id")
      .eq("id", lead.campaign_id)
      .eq("user_id", user.id)
      .single();
    if (!campaign) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const result = await runDetectors(lead, db);

    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
