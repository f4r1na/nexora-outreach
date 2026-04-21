import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createAdminClient();

  const [gmail, campaigns, events] = await Promise.all([
    db.from("gmail_connections").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    db.from("campaigns").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    db.from("email_events").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("event_type", "sent"),
  ]);

  return NextResponse.json({
    gmailConnected: (gmail.count ?? 0) > 0,
    hasCampaign: (campaigns.count ?? 0) > 0,
    hasSent: (events.count ?? 0) > 0,
  });
}
