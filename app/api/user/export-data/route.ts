import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const admin = createAdminClient();
  const userId = user.id;

  const [campaigns, sub, gmail, style] = await Promise.all([
    admin.from("campaigns").select("*").eq("user_id", userId),
    admin.from("subscriptions").select("plan, credits_used, credits_limit, current_period_end").eq("user_id", userId).single(),
    admin.from("gmail_connections").select("gmail_email, created_at").eq("user_id", userId).single(),
    admin.from("style_profiles").select("style_summary, tone_keywords, created_at").eq("user_id", userId).single(),
  ]);

  let leads: unknown[] = [];
  if (campaigns.data?.length) {
    const { data: leadsData } = await admin
      .from("leads")
      .select("first_name, company, email, role, generated_subject, status, sent_at, open_count, click_count, created_at")
      .in("campaign_id", campaigns.data.map((c) => c.id));
    leads = leadsData ?? [];
  }

  const payload = {
    exported_at: new Date().toISOString(),
    account: {
      id: user.id,
      email: user.email,
      created_at: user.created_at,
    },
    subscription: sub.data ?? null,
    gmail_connection: gmail.data ?? null,
    writing_style: style.data ?? null,
    campaigns: campaigns.data ?? [],
    leads,
  };

  const date = new Date().toISOString().split("T")[0];
  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="nexora-data-export-${date}.json"`,
    },
  });
}
