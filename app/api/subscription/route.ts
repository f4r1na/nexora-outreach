import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("plan, credits_used, credits_limit, current_period_end, stripe_customer_id")
    .eq("user_id", user.id)
    .single();

  return NextResponse.json({ subscription: subscription ?? { plan: "free", credits_used: 0, credits_limit: 10, current_period_end: null } });
}
