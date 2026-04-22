import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { confirm } = await req.json();
  if (confirm !== "DELETE") {
    return NextResponse.json({ error: "Invalid confirmation. Type DELETE to confirm." }, { status: 400 });
  }

  const admin = createAdminClient();

  // Delete leads via campaigns
  const { data: campaigns } = await admin
    .from("campaigns")
    .select("id")
    .eq("user_id", user.id);

  if (campaigns?.length) {
    await admin.from("leads").delete().in("campaign_id", campaigns.map((c) => c.id));
  }

  // Delete user-scoped records
  await Promise.all([
    admin.from("campaigns").delete().eq("user_id", user.id),
    admin.from("subscriptions").delete().eq("user_id", user.id),
    admin.from("gmail_connections").delete().eq("user_id", user.id),
    admin.from("style_profiles").delete().eq("user_id", user.id),
    admin.from("signal_results").delete().eq("user_id", user.id),
  ]);

  // Delete auth user (must be last)
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
