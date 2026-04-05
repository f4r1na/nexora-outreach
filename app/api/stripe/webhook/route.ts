import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { PLAN_CREDITS } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) return NextResponse.json({ error: "No signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = await createClient();

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.supabase_user_id;
    const plan = session.metadata?.plan;

    if (!userId || !plan) return NextResponse.json({ error: "Missing metadata" }, { status: 400 });

    const creditsLimit = PLAN_CREDITS[plan] ?? 10;

    await supabase.from("subscriptions").upsert({
      user_id: userId,
      stripe_customer_id: session.customer as string,
      stripe_subscription_id: session.subscription as string,
      plan,
      credits_limit: creditsLimit,
      credits_used: 0,
    }, { onConflict: "user_id" });
  }

  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
    const customerId = sub.customer as string;

    await supabase.from("subscriptions")
      .update({ plan: "free", credits_limit: 10, credits_used: 0, stripe_subscription_id: null })
      .eq("stripe_customer_id", customerId);
  }

  return NextResponse.json({ received: true });
}
