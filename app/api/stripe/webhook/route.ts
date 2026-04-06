import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { PLAN_CREDITS } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

// Service-role client — bypasses RLS, required for webhook (no user session)
function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase env vars missing");
  return createClient(url, key);
}

export async function POST(req: NextRequest) {
  console.log("[webhook] received request");
  console.log("[webhook] STRIPE_WEBHOOK_SECRET loaded:", !!process.env.STRIPE_WEBHOOK_SECRET);

  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  console.log("[webhook] stripe-signature present:", !!sig);

  if (!sig) {
    console.error("[webhook] missing stripe-signature header");
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
    console.log("[webhook] event verified:", event.type, event.id);
  } catch (err: any) {
    console.error("[webhook] signature verification failed:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    console.log("[webhook] checkout.session.completed — session id:", session.id);
    console.log("[webhook] metadata:", JSON.stringify(session.metadata));
    console.log("[webhook] customer:", session.customer);
    console.log("[webhook] subscription:", session.subscription);

    // The checkout route sets metadata.user_id (not supabase_user_id)
    const userId = session.metadata?.user_id;
    const plan = session.metadata?.plan;

    if (!userId || !plan) {
      console.error("[webhook] missing metadata — userId:", userId, "plan:", plan);
      return NextResponse.json({ error: "Missing metadata" }, { status: 400 });
    }

    const creditsLimit = PLAN_CREDITS[plan] ?? 10;
    console.log("[webhook] upserting subscription — userId:", userId, "plan:", plan, "creditsLimit:", creditsLimit);

    try {
      const supabase = getServiceClient();
      const { error } = await supabase.from("subscriptions").upsert({
        user_id: userId,
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: session.subscription as string,
        plan,
        credits_limit: creditsLimit,
        credits_used: 0,
      }, { onConflict: "user_id" });

      if (error) {
        console.error("[webhook] supabase upsert error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      console.log("[webhook] subscription upserted successfully");
    } catch (err: any) {
      console.error("[webhook] supabase client error:", err.message);
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
    const customerId = sub.customer as string;

    console.log("[webhook] customer.subscription.deleted — customerId:", customerId);

    try {
      const supabase = getServiceClient();
      const { error } = await supabase
        .from("subscriptions")
        .update({ plan: "free", credits_limit: 10, credits_used: 0, stripe_subscription_id: null })
        .eq("stripe_customer_id", customerId);

      if (error) console.error("[webhook] downgrade error:", error);
      else console.log("[webhook] subscription downgraded to free");
    } catch (err: any) {
      console.error("[webhook] supabase client error on delete:", err.message);
    }
  }

  console.log("[webhook] returning 200 received:true");
  return NextResponse.json({ received: true });
}
