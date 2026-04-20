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

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = getServiceClient();

    // Fetch all events for this user
    const { data: events } = await db
      .from("email_events")
      .select("event_type, campaign_id, created_at")
      .eq("user_id", user.id);

    if (!events || events.length === 0) {
      return NextResponse.json({
        stats: { sent: 0, opened: 0, clicked: 0, replied: 0, open_rate: 0, click_rate: 0, reply_rate: 0 },
        campaigns: [],
        daily: buildEmptyDaily(),
      });
    }

    // Overall stats
    const sent = events.filter((e) => e.event_type === "sent").length;
    const opened = events.filter((e) => e.event_type === "opened").length;
    const clicked = events.filter((e) => e.event_type === "clicked").length;
    const replied = events.filter((e) => e.event_type === "replied").length;

    const open_rate = sent > 0 ? Math.round((opened / sent) * 100) : 0;
    const click_rate = sent > 0 ? Math.round((clicked / sent) * 100) : 0;
    const reply_rate = sent > 0 ? Math.round((replied / sent) * 100) : 0;

    // Per-campaign breakdown
    const campaignIds = [
      ...new Set(events.map((e) => e.campaign_id).filter(Boolean)),
    ] as string[];

    const { data: campaignRows } = await db
      .from("campaigns")
      .select("id, name, created_at")
      .in("id", campaignIds)
      .order("created_at", { ascending: false });

    const campaigns = (campaignRows ?? []).map((camp) => {
      const ce = events.filter((e) => e.campaign_id === camp.id);
      const c_sent = ce.filter((e) => e.event_type === "sent").length;
      const c_opened = ce.filter((e) => e.event_type === "opened").length;
      const c_clicked = ce.filter((e) => e.event_type === "clicked").length;
      const c_replied = ce.filter((e) => e.event_type === "replied").length;
      return {
        id: camp.id,
        name: camp.name,
        created_at: camp.created_at,
        sent: c_sent,
        opened: c_opened,
        clicked: c_clicked,
        replied: c_replied,
        open_rate: c_sent > 0 ? Math.round((c_opened / c_sent) * 100) : 0,
        click_rate: c_sent > 0 ? Math.round((c_clicked / c_sent) * 100) : 0,
        reply_rate: c_sent > 0 ? Math.round((c_replied / c_sent) * 100) : 0,
      };
    });

    // Daily send volume for last 30 days
    const daily = buildEmptyDaily();
    const sentEvents = events.filter((e) => e.event_type === "sent");
    for (const e of sentEvents) {
      const day = e.created_at.slice(0, 10);
      const entry = daily.find((d) => d.date === day);
      if (entry) entry.count++;
    }

    return NextResponse.json({
      stats: { sent, opened, clicked, replied, open_rate, click_rate, reply_rate },
      campaigns,
      daily,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

function buildEmptyDaily(): Array<{ date: string; count: number }> {
  const result: Array<{ date: string; count: number }> = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    result.push({ date: d.toISOString().slice(0, 10), count: 0 });
  }
  return result;
}
