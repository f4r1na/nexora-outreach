import { NextRequest, NextResponse } from "next/server";
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

type Confidence = "HIGH" | "MEDIUM" | "LOW";

type RuleRow = {
  signal_type: string;
  days_threshold: number;
  confidence_level: Confidence;
  conversion_rate: number | null;
};

type ScoreResult = {
  confidence: Confidence;
  conversion_rate: number | null;
  rule_matched: string;
};

async function lookupRule(
  db: ReturnType<typeof getDb>,
  signalType: string,
  daysOld: number
): Promise<ScoreResult> {
  // Find the most specific matching rule: lowest days_threshold that is >= daysOld.
  const { data: rows } = await db
    .from("signals_confidence_rules")
    .select("signal_type, days_threshold, confidence_level, conversion_rate")
    .eq("signal_type", signalType)
    .gte("days_threshold", daysOld)
    .order("days_threshold", { ascending: true })
    .limit(1)
    .returns<RuleRow[]>();

  if (rows && rows.length > 0) {
    const r = rows[0];
    return {
      confidence: r.confidence_level,
      conversion_rate: r.conversion_rate,
      rule_matched: `${r.signal_type}/${r.days_threshold}d`,
    };
  }

  // Fall back to DEFAULT rule
  const { data: defaults } = await db
    .from("signals_confidence_rules")
    .select("signal_type, days_threshold, confidence_level, conversion_rate")
    .eq("signal_type", "DEFAULT")
    .gte("days_threshold", daysOld)
    .order("days_threshold", { ascending: true })
    .limit(1)
    .returns<RuleRow[]>();

  if (defaults && defaults.length > 0) {
    const r = defaults[0];
    return {
      confidence: r.confidence_level,
      conversion_rate: r.conversion_rate,
      rule_matched: `DEFAULT/${r.days_threshold}d`,
    };
  }

  // Hard fallback if rules table is empty
  return { confidence: "MEDIUM", conversion_rate: null, rule_matched: "fallback" };
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { signal_type, days_old } = body as {
      signal_type?: string;
      days_old?: number;
      // source_authority: reserved for future rule enrichment
    };

    if (!signal_type || typeof signal_type !== "string") {
      return NextResponse.json({ error: "signal_type required" }, { status: 400 });
    }
    if (typeof days_old !== "number" || days_old < 0) {
      return NextResponse.json({ error: "days_old must be a non-negative number" }, { status: 400 });
    }

    const db = getDb();
    const result = await lookupRule(db, signal_type, Math.floor(days_old));

    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
