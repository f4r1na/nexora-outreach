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

    // Always load campaigns for this user (independent of events table)
    const { data: campaignRows } = await db
      .from("campaigns")
      .select("id, name, created_at, status, lead_count")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    // Fetch all events for this user
    const { data: events } = await db
      .from("email_events")
      .select("event_type, campaign_id, created_at")
      .eq("user_id", user.id);

    console.log("[analytics]", { user_id: user.id, campaigns: campaignRows?.length ?? 0, events: events?.length ?? 0 });

    const evts = events ?? [];
    const sent = evts.filter((e) => e.event_type === "sent").length;
    const opened = evts.filter((e) => e.event_type === "opened").length;
    const clicked = evts.filter((e) => e.event_type === "clicked").length;
    const replied = evts.filter((e) => e.event_type === "replied").length;

    const open_rate = sent > 0 ? Math.round((opened / sent) * 100) : 0;
    const click_rate = sent > 0 ? Math.round((clicked / sent) * 100) : 0;
    const reply_rate = sent > 0 ? Math.round((replied / sent) * 100) : 0;

    // Per-campaign breakdown — include every campaign even with no events
    const campaigns = (campaignRows ?? []).map((camp) => {
      const ce = evts.filter((e) => e.campaign_id === camp.id);
      const c_sent = ce.filter((e) => e.event_type === "sent").length;
      const c_opened = ce.filter((e) => e.event_type === "opened").length;
      const c_clicked = ce.filter((e) => e.event_type === "clicked").length;
      const c_replied = ce.filter((e) => e.event_type === "replied").length;
      const effectiveSent = c_sent > 0 ? c_sent : (camp.status === "sent" ? (camp.lead_count ?? 0) : 0);
      return {
        id: camp.id,
        name: camp.name,
        created_at: camp.created_at,
        sent: effectiveSent,
        opened: c_opened,
        clicked: c_clicked,
        replied: c_replied,
        open_rate: effectiveSent > 0 ? Math.round((c_opened / effectiveSent) * 100) : 0,
        click_rate: effectiveSent > 0 ? Math.round((c_clicked / effectiveSent) * 100) : 0,
        reply_rate: effectiveSent > 0 ? Math.round((c_replied / effectiveSent) * 100) : 0,
      };
    });

    const totalFallbackSent = campaigns.reduce((acc, c) => acc + c.sent, 0);
    const finalSent = sent > 0 ? sent : totalFallbackSent;
    const finalOpenRate = finalSent > 0 ? Math.round((opened / finalSent) * 100) : 0;
    const finalClickRate = finalSent > 0 ? Math.round((clicked / finalSent) * 100) : 0;
    const finalReplyRate = finalSent > 0 ? Math.round((replied / finalSent) * 100) : 0;

    // Daily send volume for last 30 days
    const daily = buildEmptyDaily();
    const sentEvents = evts.filter((e) => e.event_type === "sent");
    for (const e of sentEvents) {
      const day = e.created_at.slice(0, 10);
      const entry = daily.find((d) => d.date === day);
      if (entry) entry.count++;
    }

    return NextResponse.json({
      stats: {
        sent: finalSent,
        opened,
        clicked,
        replied,
        open_rate: finalOpenRate,
        click_rate: finalClickRate,
        reply_rate: finalReplyRate,
      },
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
