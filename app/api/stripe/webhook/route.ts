import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { PLAN_CREDITS } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

// Service-role client — bypasses RLS, required for webhook (no user session)
function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log("[webhook] NEXT_PUBLIC_SUPABASE_URL loaded:", !!url);
  console.log("[webhook] SUPABASE_SERVICE_ROLE_KEY loaded:", !!key);

  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set — anon key cannot bypass RLS");

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function POST(req: NextRequest) {
  console.log("[webhook] ────────────────────────────────────────");
  console.log("[webhook] incoming request at", new Date().toISOString());
  console.log("[webhook] STRIPE_WEBHOOK_SECRET loaded:", !!process.env.STRIPE_WEBHOOK_SECRET);

  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  console.log("[webhook] stripe-signature present:", !!sig);

  if (!sig) {
    console.error("[webhook] ERROR: missing stripe-signature header");
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
    console.log("[webhook] event verified — type:", event.type, "id:", event.id);
  } catch (err: any) {
    console.error("[webhook] ERROR: signature verification failed:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // ── checkout.session.completed ──────────────────────────────────────────────
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    console.log("[webhook] checkout.session.completed");
    console.log("[webhook] session.id:", session.id);
    console.log("[webhook] session.metadata:", JSON.stringify(session.metadata));
    console.log("[webhook] session.customer_email:", session.customer_email);
    console.log("[webhook] session.customer:", session.customer);
    console.log("[webhook] session.subscription:", session.subscription);

    const plan = session.metadata?.plan;
    if (!plan) {
      console.error("[webhook] ERROR: session.metadata.plan is missing");
      return NextResponse.json({ error: "Missing plan in metadata" }, { status: 400 });
    }

    let supabase;
    try {
      supabase = getServiceClient();
    } catch (err: any) {
      console.error("[webhook] ERROR: could not create service client:", err.message);
      return NextResponse.json({ error: err.message }, { status: 500 });
    }

    // ── Resolve user ID ──────────────────────────────────────────────────────
    let userId: string | undefined = session.metadata?.user_id ?? undefined;
    console.log("[webhook] user_id from metadata:", userId ?? "(not present)");

    if (!userId) {
      // Fallback: look up by customer_email
      const email = session.customer_email;
      console.log("[webhook] falling back to email lookup:", email);

      if (!email) {
        console.error("[webhook] ERROR: no user_id in metadata and no customer_email on session");
        return NextResponse.json({ error: "Cannot identify user" }, { status: 400 });
      }

      const { data: listData, error: userError } = await supabase.auth.admin.listUsers();
      const matchedUser = listData?.users?.find((u) => u.email === email);
      console.log("[webhook] email lookup result — matched:", matchedUser?.id ?? null, "error:", userError?.message ?? null);

      if (userError || !matchedUser) {
        console.error("[webhook] ERROR: could not find user by email:", userError?.message);
        return NextResponse.json({ error: "User not found" }, { status: 400 });
      }

      userId = matchedUser.id;
      console.log("[webhook] resolved userId via email:", userId);
    }

    // ── Upsert subscription ──────────────────────────────────────────────────
    const creditsLimit = PLAN_CREDITS[plan] ?? 10;
    console.log("[webhook] upserting — userId:", userId, "plan:", plan, "creditsLimit:", creditsLimit);

    const { data: upsertData, error: upsertError } = await supabase
      .from("subscriptions")
      .upsert(
        {
          user_id: userId,
          stripe_customer_id: session.customer as string ?? null,
          stripe_subscription_id: session.subscription as string ?? null,
          plan,
          credits_limit: creditsLimit,
          credits_used: 0,
        },
        { onConflict: "user_id" }
      );

    if (upsertError) {
      console.error("[webhook] ERROR: supabase upsert failed:", JSON.stringify(upsertError));
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }

    console.log("[webhook] upsert succeeded — data:", JSON.stringify(upsertData));
    console.log("[webhook] ✓ subscription updated for user:", userId, "→ plan:", plan);
  }

  // ── customer.subscription.deleted ──────────────────────────────────────────
  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
    const customerId = sub.customer as string;

    console.log("[webhook] customer.subscription.deleted — customerId:", customerId);

    let supabase;
    try {
      supabase = getServiceClient();
    } catch (err: any) {
      console.error("[webhook] ERROR: could not create service client:", err.message);
      return NextResponse.json({ error: err.message }, { status: 500 });
    }

    const { error } = await supabase
      .from("subscriptions")
      .update({ plan: "free", credits_limit: 10, credits_used: 0, stripe_subscription_id: null })
      .eq("stripe_customer_id", customerId);

    if (error) {
      console.error("[webhook] ERROR: downgrade failed:", JSON.stringify(error));
    } else {
      console.log("[webhook] ✓ subscription downgraded to free for customer:", customerId);
    }
  }

  console.log("[webhook] returning 200");
  return NextResponse.json({ received: true });
}
