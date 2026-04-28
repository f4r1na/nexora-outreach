import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  FEEDS,
  fetchFeed,
  detectSignalType,
  extractCompanyName,
  matchesICP,
  isRecent,
} from "@/lib/signals/rss";
import { sendSignalAlert } from "@/lib/signals/alert-email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || req.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = createAdminClient();

  // 1. Get users who have ICP keywords configured
  const { data: subs } = await db
    .from("subscriptions")
    .select("user_id, icp_keywords, icp_location")
    .not("icp_keywords", "is", null)
    .neq("icp_keywords", "");

  if (!subs || subs.length === 0) {
    return NextResponse.json({ ok: true, message: "No users with ICP configured", sent: 0 });
  }

  // 2. Resolve user emails from auth.users
  const { data: { users } } = await db.auth.admin.listUsers({ perPage: 1000 });
  const emailMap = new Map(users.map((u) => [u.id, u.email ?? ""]));

  const targets = subs
    .map((s) => ({ ...s, email: emailMap.get(s.user_id) ?? "" }))
    .filter((t) => t.email);

  // 3. Fetch all RSS feeds in parallel, keep only recent items
  const feedResults = await Promise.all(FEEDS.map(fetchFeed));
  const recentItems = feedResults.flat().filter((item) => isRecent(item.pubDate));

  console.log(`[signal-alerts] fetched ${recentItems.length} recent items for ${targets.length} users`);

  // 4. For each signal item, find matching users and send alerts
  let sent = 0;
  const errors: string[] = [];

  for (const item of recentItems) {
    const signalType = detectSignalType(item.title);
    if (!signalType) continue;

    const companyName = extractCompanyName(item.title);

    for (const target of targets) {
      if (!matchesICP(item, target.icp_keywords, target.icp_location)) continue;

      // Dedup: skip if we've already sent this user an alert for this URL
      const { data: existing } = await db
        .from("signal_alerts")
        .select("id")
        .eq("user_id", target.user_id)
        .eq("source_url", item.link)
        .maybeSingle();

      if (existing) continue;

      try {
        await sendSignalAlert({
          userEmail: target.email,
          companyName,
          signalType,
          item,
        });

        await db.from("signal_alerts").insert({
          user_id:      target.user_id,
          source_url:   item.link,
          source_type:  item.sourceType,
          company_name: companyName,
          signal_type:  signalType,
          headline:     item.title,
          published_at: item.pubDate ? new Date(item.pubDate).toISOString() : null,
        });

        sent++;
        console.log(`[signal-alerts] sent: ${target.email} <- ${companyName} (${signalType})`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`${target.email}/${companyName}: ${msg}`);
        console.error(`[signal-alerts] send error:`, msg);
      }
    }
  }

  return NextResponse.json({
    ok: true,
    sent,
    errors: errors.length,
    items_checked: recentItems.length,
    users_checked: targets.length,
  });
}

export const POST = GET;
