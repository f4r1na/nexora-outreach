import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("leads")
    .select("signal_status")
    .eq("campaign_id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const counts = { queued: 0, processing: 0, done: 0, failed: 0, total: 0 };
  for (const row of data ?? []) {
    counts.total++;
    const s = row.signal_status as keyof typeof counts;
    if (s in counts) counts[s]++;
  }

  return NextResponse.json(counts);
}
