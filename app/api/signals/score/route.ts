import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getDb() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

type ScoreRow = {
  signal_type: string;
  score: number;
  conversion_rate: number;
};

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();

  // Get user's founder type
  const { data: sub } = await db
    .from("subscriptions")
    .select("founder_type")
    .eq("user_id", user.id)
    .single();

  const founderType: string = sub?.founder_type ?? "saas";

  // Fetch all scores for this founder type
  const { data: rows } = await db
    .from("signal_scores")
    .select("signal_type, score, conversion_rate")
    .eq("founder_type", founderType)
    .returns<ScoreRow[]>();

  // Return as a map: signal_type → { score, conversion_rate }
  const scores: Record<string, { score: number; conversion_rate: number }> = {};
  for (const row of rows ?? []) {
    scores[row.signal_type] = {
      score: row.score,
      conversion_rate: Number(row.conversion_rate),
    };
  }

  return NextResponse.json({ founder_type: founderType, scores });
}
