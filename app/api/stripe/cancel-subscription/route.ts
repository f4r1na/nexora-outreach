import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!user.email) return NextResponse.json({ error: "No email on account" }, { status: 400 });

  // Find Stripe customer by email
  const customers = await stripe.customers.list({ email: user.email, limit: 1 });
  const customer = customers.data[0];
  if (!customer) return NextResponse.json({ error: "No billing account found" }, { status: 404 });

  // Find active subscription
  const subs = await stripe.subscriptions.list({ customer: customer.id, status: "active", limit: 1 });
  const sub = subs.data[0];
  if (!sub) return NextResponse.json({ error: "No active subscription found" }, { status: 404 });

  // Cancel at period end (not immediately)
  await stripe.subscriptions.update(sub.id, { cancel_at_period_end: true });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const s = sub as any;
  return NextResponse.json({
    ok: true,
    current_period_end: s.current_period_end ?? null,
    cancel_at: s.cancel_at ?? null,
  });
}
