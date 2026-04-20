import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// ── Helper: resolve user_id ────────────────────────────────────────────────────
async function resolveUserId(
  supabase: ReturnType<typeof getServiceClient>,
  metadata: Stripe.Metadata | null,
  clientReferenceId: string | null,
  email: string | null
): Promise<string | null> {
  // 1. Prefer explicit user_id in metadata (set at checkout creation time)
  const fromMeta = metadata?.user_id ?? clientReferenceId ?? null;
  if (fromMeta) {
    console.log(JSON.stringify({ step: "resolve_user_id", source: "metadata", user_id: fromMeta }));
    return fromMeta;
  }

  // 2. Fall back to email lookup
  if (!email) return null;

  console.log(JSON.stringify({ step: "resolve_user_id", source: "email_lookup", email }));
  const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (error) {
    console.error(JSON.stringify({ step: "resolve_user_id", error: error.message }));
    return null;
  }

  const matched = data?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  console.log(JSON.stringify({ step: "resolve_user_id", total_users: data?.users?.length, matched: matched?.id ?? null }));
  return matched?.id ?? null;
}

// ── POST ───────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  console.log(JSON.stringify({ step: "webhook_hit", ts: new Date().toISOString() }));

  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    console.error(JSON.stringify({ step: "signature_check", error: "missing stripe-signature header" }));
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
    console.log(JSON.stringify({ step: "signature_verified", type: event.type, id: event.id }));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(JSON.stringify({ step: "signature_verified", error: msg }));
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    // ── checkout.session.completed ────────────────────────────────────────────
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      console.log(JSON.stringify({
        step: "checkout_session_completed",
        session_id: session.id,
        customer: session.customer,
        subscription: session.subscription,
        metadata: session.metadata,
        client_reference_id: session.client_reference_id,
      }));

      const supabase = getServiceClient();

      // Resolve user_id
      const email = session.customer_details?.email ?? session.customer_email ?? null;
      const userId = await resolveUserId(supabase, session.metadata, session.client_reference_id, email);

      if (!userId) {
        console.error(JSON.stringify({ step: "resolve_user_id", error: "could not resolve user_id", email }));
        return NextResponse.json({ error: "Cannot resolve user" }, { status: 400 });
      }

      console.log(JSON.stringify({ step: "user_id_resolved", user_id: userId }));

      // Retrieve subscription to get price ID
      if (!session.subscription) {
        console.error(JSON.stringify({ step: "subscription_retrieve", error: "no subscription on session" }));
        return NextResponse.json({ error: "No subscription" }, { status: 400 });
      }

      const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
      const priceId = subscription.items.data[0]?.price?.id ?? null;

      console.log(JSON.stringify({ step: "price_id_extracted", price_id: priceId, subscription_id: subscription.id }));

      const plan = priceId ? (PRICE_TO_PLAN[priceId] ?? null) : null;
      if (!plan) {
        console.error(JSON.stringify({ step: "plan_map", error: "unrecognized price_id", price_id: priceId }));
        return NextResponse.json({ error: "Unrecognized price" }, { status: 400 });
      }

      const creditsLimit = PLAN_CREDITS[plan];
      const sendsLimit = PLAN_SENDS[plan];

      console.log(JSON.stringify({ step: "before_upsert", user_id: userId, plan, credits_limit: creditsLimit, sends_limit: sendsLimit }));

      const { error: upsertError } = await supabase
        .from("subscriptions")
        .upsert(
          {
            user_id: userId,
            plan,
            stripe_customer_id: typeof session.customer === "string" ? session.customer : null,
            stripe_subscription_id: subscription.id,
            credits_limit: creditsLimit,
            credits_used: 0,
            sends_limit: sendsLimit,
            sends_used: 0,
          },
          { onConflict: "user_id" }
        );

      if (upsertError) {
        console.error(JSON.stringify({
          step: "after_upsert",
          success: false,
          message: upsertError.message,
          code: (upsertError as { code?: string }).code,
          details: (upsertError as { details?: string }).details,
          hint: (upsertError as { hint?: string }).hint,
        }));
        return NextResponse.json({ error: upsertError.message }, { status: 500 });
      }

      console.log(JSON.stringify({ step: "after_upsert", success: true, user_id: userId, plan }));
    }

    // ── customer.subscription.updated ─────────────────────────────────────────
    if (event.type === "customer.subscription.updated") {
      const subscription = event.data.object as Stripe.Subscription;
      const priceId = subscription.items.data[0]?.price?.id ?? null;
      const plan = priceId ? (PRICE_TO_PLAN[priceId] ?? null) : null;

      console.log(JSON.stringify({
        step: "subscription_updated",
        subscription_id: subscription.id,
        customer_id: subscription.customer,
        price_id: priceId,
        plan,
      }));

      if (!plan) {
        console.error(JSON.stringify({ step: "subscription_updated", error: "unrecognized price_id", price_id: priceId }));
        // Don't return error — just skip unknown plans
        return NextResponse.json({ received: true });
      }

      const supabase = getServiceClient();
      const prevPlan = (event.data.previous_attributes as { items?: unknown })?.items;
      const planChanged = !!prevPlan;

      const creditsLimit = PLAN_CREDITS[plan];
      const sendsLimit = PLAN_SENDS[plan];

      const updateData: Record<string, unknown> = {
        plan,
        credits_limit: creditsLimit,
        sends_limit: sendsLimit,
      };

      // Reset usage only if the plan actually changed
      if (planChanged) {
        updateData.credits_used = 0;
        updateData.sends_used = 0;
      }

      console.log(JSON.stringify({ step: "before_update", customer_id: subscription.customer, update: updateData }));

      const { error } = await supabase
        .from("subscriptions")
        .update(updateData)
        .eq("stripe_subscription_id", subscription.id);

      if (error) {
        console.error(JSON.stringify({
          step: "after_update",
          success: false,
          message: error.message,
          code: (error as { code?: string }).code,
          details: (error as { details?: string }).details,
          hint: (error as { hint?: string }).hint,
        }));
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      console.log(JSON.stringify({ step: "after_update", success: true, plan }));
    }

    // ── customer.subscription.deleted ─────────────────────────────────────────
    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      console.log(JSON.stringify({ step: "subscription_deleted", subscription_id: subscription.id, customer_id: customerId }));

      const supabase = getServiceClient();

      const { error } = await supabase
        .from("subscriptions")
        .update({
          plan: "free",
          credits_limit: 10,
          sends_limit: 0,
          credits_used: 0,
          sends_used: 0,
          stripe_subscription_id: null,
        })
        .eq("stripe_customer_id", customerId);

      if (error) {
        console.error(JSON.stringify({
          step: "subscription_deleted_update",
          success: false,
          message: error.message,
          code: (error as { code?: string }).code,
        }));
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      console.log(JSON.stringify({ step: "subscription_deleted_update", success: true, customer_id: customerId }));
    }

    // ── invoice.payment_failed ────────────────────────────────────────────────
    if (event.type === "invoice.payment_failed") {
      const invoice = event.data.object as Stripe.Invoice & { subscription?: string | null };
      console.warn(JSON.stringify({
        step: "invoice_payment_failed",
        invoice_id: invoice.id,
        customer_id: invoice.customer,
        subscription_id: invoice.subscription ?? null,
        attempt_count: invoice.attempt_count,
      }));
      // No DB changes — just log for visibility
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(JSON.stringify({ step: "handler_error", error: msg }));
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  console.log(JSON.stringify({ step: "done", status: 200 }));
  return NextResponse.json({ received: true });
}
