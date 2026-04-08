import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

// ── Price ID → plan map ────────────────────────────────────────────────────────
const PRICE_TO_PLAN: Record<string, string> = {
  price_1TIxNI7InZIqSYCH1KgzwAOK: "starter",
  price_1TIxOD7InZIqSYCHBz2RiHz0: "pro",
  price_1TIxOc7InZIqSYCHdnKyz9lA: "agency",
};

// ── Plan limits ────────────────────────────────────────────────────────────────
const PLAN_CREDITS: Record<string, number> = {
  starter: 300,
  pro: 1000,
  agency: 3000,
};

const PLAN_SENDS: Record<string, number> = {
  starter: 0,
  pro: 500,
  agency: 1500,
};

// ── Service-role Supabase client (bypasses RLS) ────────────────────────────────
function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log("[webhook] NEXT_PUBLIC_SUPABASE_URL present:", !!url);
  console.log("[webhook] SUPABASE_SERVICE_ROLE_KEY present:", !!key);

  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function POST(req: NextRequest) {
  console.log("[webhook] ── incoming request", new Date().toISOString());
  console.log("[webhook] STRIPE_WEBHOOK_SECRET present:", !!process.env.STRIPE_WEBHOOK_SECRET);

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

    console.log("[webhook] checkout.session.completed — session.id:", session.id);
    console.log("[webhook] session.customer:", session.customer);
    console.log("[webhook] session.subscription:", session.subscription);
    console.log("[webhook] session.customer_details:", JSON.stringify(session.customer_details));
    console.log("[webhook] session.metadata:", JSON.stringify(session.metadata));

    // ── Get customer email ───────────────────────────────────────────────────
    const email =
      session.customer_details?.email ??
      session.customer_email ??
      session.metadata?.email ??
      null;

    console.log("[webhook] resolved customer email:", email);

    if (!email) {
      console.error("[webhook] ERROR: cannot determine customer email");
      return NextResponse.json({ error: "No customer email" }, { status: 400 });
    }

    // ── Determine plan from line items ───────────────────────────────────────
    let plan: string | null = session.metadata?.plan ?? null;
    console.log("[webhook] plan from metadata:", plan ?? "(not present — will fetch line items)");

    if (!plan) {
      console.log("[webhook] fetching line items for session:", session.id);
      try {
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 5 });
        console.log("[webhook] line items:", JSON.stringify(lineItems.data.map((i) => ({ price: i.price?.id, product: i.price?.product }))));

        for (const item of lineItems.data) {
          const priceId = item.price?.id;
          if (priceId && PRICE_TO_PLAN[priceId]) {
            plan = PRICE_TO_PLAN[priceId];
            console.log("[webhook] matched price", priceId, "→ plan:", plan);
            break;
          }
        }
      } catch (err: any) {
        console.error("[webhook] ERROR fetching line items:", err.message);
      }
    }

    if (!plan) {
      console.error("[webhook] ERROR: could not determine plan from metadata or line items");
      return NextResponse.json({ error: "Cannot determine plan" }, { status: 400 });
    }

    // ── Build service client ─────────────────────────────────────────────────
    let supabase: ReturnType<typeof getServiceClient>;
    try {
      supabase = getServiceClient();
    } catch (err: any) {
      console.error("[webhook] ERROR: service client init failed:", err.message);
      return NextResponse.json({ error: err.message }, { status: 500 });
    }

    // ── Look up user by email ────────────────────────────────────────────────
    console.log("[webhook] looking up user by email:", email);

    let userId: string | null = session.metadata?.user_id ?? null;
    console.log("[webhook] user_id from metadata:", userId ?? "(not present)");

    if (!userId) {
      const { data: listData, error: listError } = await supabase.auth.admin.listUsers({ perPage: 1000 });

      if (listError) {
        console.error("[webhook] ERROR: listUsers failed:", listError.message);
        return NextResponse.json({ error: "User lookup failed" }, { status: 500 });
      }

      const matched = listData?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());
      console.log("[webhook] listUsers count:", listData?.users?.length, "matched:", matched?.id ?? null);

      if (!matched) {
        console.error("[webhook] ERROR: no user found with email:", email);
        return NextResponse.json({ error: "User not found" }, { status: 400 });
      }

      userId = matched.id;
      console.log("[webhook] resolved userId via email lookup:", userId);
    }

    // ── Upsert subscription ──────────────────────────────────────────────────
    const creditsLimit = PLAN_CREDITS[plan] ?? 10;
    const sendsLimit = PLAN_SENDS[plan] ?? 0;

    console.log("[webhook] upserting subscription:", { userId, plan, creditsLimit, sendsLimit });

    const { error: upsertError } = await supabase
      .from("subscriptions")
      .upsert(
        {
          user_id: userId,
          plan,
          stripe_customer_id: typeof session.customer === "string" ? session.customer : null,
          stripe_subscription_id: typeof session.subscription === "string" ? session.subscription : null,
          credits_limit: creditsLimit,
          sends_limit: sendsLimit,
          credits_used: 0,
        },
        { onConflict: "user_id" }
      );

    if (upsertError) {
      console.error("[webhook] ERROR: upsert failed:", JSON.stringify(upsertError));
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }

    console.log("[webhook] ✓ subscription upserted — user:", userId, "plan:", plan);
  }

  // ── customer.subscription.deleted ──────────────────────────────────────────
  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
    const customerId = sub.customer as string;

    console.log("[webhook] customer.subscription.deleted — customerId:", customerId);

    let supabase: ReturnType<typeof getServiceClient>;
    try {
      supabase = getServiceClient();
    } catch (err: any) {
      console.error("[webhook] ERROR: service client init failed:", err.message);
      return NextResponse.json({ error: err.message }, { status: 500 });
    }

    const { error } = await supabase
      .from("subscriptions")
      .update({
        plan: "free",
        credits_limit: 10,
        sends_limit: 0,
        credits_used: 0,
        stripe_subscription_id: null,
      })
      .eq("stripe_customer_id", customerId);

    if (error) {
      console.error("[webhook] ERROR: downgrade failed:", JSON.stringify(error));
    } else {
      console.log("[webhook] ✓ subscription downgraded to free for customer:", customerId);
    }
  }

  console.log("[webhook] returning 200 OK");
  return NextResponse.json({ received: true });
}
