# End-to-End Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire Stripe payments, Google OAuth, auth flow, and dashboard plan-gating into a fully working end-to-end system.

**Architecture:** Stripe products (Pro/Agency/Enterprise at $199/$499/$999) are created via a one-time script; price IDs flow through env vars into the checkout and webhook routes. Google OAuth uses Supabase's built-in `signInWithOAuth` with a Next.js callback route. Dashboard reads the `subscriptions` table and gates features by plan.

**Tech Stack:** Next.js 16 App Router, Supabase SSR (@supabase/ssr), Stripe SDK, TypeScript, inline styles (no Tailwind classes for custom styles — existing pages use `style={{}}` props).

---

## Current State (read before starting)

- `lib/plans.ts` — has starter/pro/agency at $19/$49/$99. **Needs update to Pro/Agency/Enterprise at $199/$499/$999.**
- `app/api/stripe/checkout/route.ts` — hardcoded price IDs for old plan names. **Needs new price IDs.**
- `app/api/stripe/webhook/route.ts` — maps old price IDs to old plan names. **Needs updating.**
- `app/(auth)/login/page.tsx` — email/password only. **No Google button.**
- `app/(auth)/signup/page.tsx` — email/password only. **No Google button.**
- `app/actions/auth.ts` — signup redirects to `/dashboard`. **Should redirect to `/onboarding`.**
- `app/pricing/page.tsx` — static `<Button>` components, not wired. **Need checkout handler.**
- `.env.local` — publishable key var is `NEXT_PUBLIC_STRIPE_PUBLISHABLE_` (missing `KEY` suffix). **Bug — code should reference `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.**
- No Supabase OAuth callback route exists (`app/api/auth/callback/` missing).

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `scripts/create-stripe-products.ts` | Create | One-time Stripe product creation |
| `lib/plans.ts` | Modify | Update plan names/prices to Pro/Agency/Enterprise |
| `lib/stripe.ts` | Modify | Add PRICE_IDS and PLAN_LIMITS exports |
| `app/api/stripe/checkout/route.ts` | Modify | New price IDs, 7-day trial, correct cancel URL |
| `app/api/stripe/webhook/route.ts` | Modify | Updated PRICE_TO_PLAN + credit limits |
| `app/pricing/page.tsx` | Modify | Wire buttons to checkout API |
| `app/api/auth/callback/route.ts` | Create | Supabase OAuth exchange + new-user redirect |
| `app/actions/google-auth.ts` | Create | Client-callable Google OAuth initiator |
| `app/(auth)/login/page.tsx` | Modify | Add Google OAuth button |
| `app/(auth)/signup/page.tsx` | Modify | Add Google OAuth button |
| `app/actions/auth.ts` | Modify | signup redirects to /onboarding; login checks onboarding |
| `app/onboarding/page.tsx` | Modify | Persist ICP+product to Supabase, allow email-skip |
| `app/dashboard/page.tsx` | Modify | Fetch subscription, show plan-gated content |

---

## Task 1: Create Stripe Products (one-time setup script)

**Files:**
- Create: `scripts/create-stripe-products.ts`

- [ ] **Step 1: Write the script**

```typescript
// scripts/create-stripe-products.ts
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

async function main() {
  const tiers = [
    { planKey: "pro", displayName: "Nexora Pro", cents: 19900 },
    { planKey: "agency", displayName: "Nexora Agency", cents: 49900 },
    { planKey: "enterprise", displayName: "Nexora Enterprise", cents: 99900 },
  ];

  console.log("Creating Stripe products and prices...\n");

  for (const tier of tiers) {
    const product = await stripe.products.create({
      name: tier.displayName,
      metadata: { plan: tier.planKey },
    });

    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: tier.cents,
      currency: "usd",
      recurring: { interval: "month" },
    });

    console.log(`STRIPE_PRICE_${tier.planKey.toUpperCase()}=${price.id}`);
  }

  console.log("\nAdd the above lines to .env.local");
}

main().catch((e) => { console.error(e); process.exit(1); });
```

- [ ] **Step 2: Run the script**

```bash
STRIPE_SECRET_KEY=$(grep STRIPE_SECRET_KEY .env.local | cut -d= -f2) npx tsx scripts/create-stripe-products.ts
```

Expected output:
```
Creating Stripe products and prices...

STRIPE_PRICE_PRO=price_1Xxx...
STRIPE_PRICE_AGENCY=price_1Xxx...
STRIPE_PRICE_ENTERPRISE=price_1Xxx...

Add the above lines to .env.local
```

- [ ] **Step 3: Add price IDs + fix publishable key name in .env.local**

Append to `.env.local`:
```
STRIPE_PRICE_PRO=price_1Xxx...      # from script output
STRIPE_PRICE_AGENCY=price_1Xxx...   # from script output
STRIPE_PRICE_ENTERPRISE=price_1Xxx... # from script output
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51TDzJc7InZIqSYCHiYPUf2tNh5bXcoDb0dkA4kWf6FyXa1dIESxA3wwGuWKKSi4nbs3wldQtygWyIeFgIHtA9Tzf00Tpcv4u41
```

(The existing line `NEXT_PUBLIC_STRIPE_PUBLISHABLE_` is missing `KEY` — add the correctly-named line; both can coexist.)

- [ ] **Step 4: Commit**

```bash
git add scripts/create-stripe-products.ts
git commit -m "feat: add Stripe product creation script"
```

---

## Task 2: Update lib/plans.ts

**Files:**
- Modify: `lib/plans.ts`

- [ ] **Step 1: Replace the file contents**

```typescript
// Client-safe plan constants — no Stripe SDK, no server-only env vars

export const PLANS = {
  pro:        { name: "Pro",        price: 199, credits: 1000 },
  agency:     { name: "Agency",     price: 499, credits: 5000 },
  enterprise: { name: "Enterprise", price: 999, credits: 999999 },
} as const;

export type PlanKey = keyof typeof PLANS | "free";

export const PLAN_CREDITS: Record<string, number> = {
  free:       10,
  pro:        1000,
  agency:     5000,
  enterprise: 999999,
};
```

- [ ] **Step 2: Verify build compiles**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors referencing plans.ts.

- [ ] **Step 3: Commit**

```bash
git add lib/plans.ts
git commit -m "feat: update plans to Pro/Agency/Enterprise at 199/499/999"
```

---

## Task 3: Update lib/stripe.ts

**Files:**
- Modify: `lib/stripe.ts`

- [ ] **Step 1: Replace the file contents**

```typescript
// Server-side only — never import this in client components
import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2023-10-16",
});

export const PRICE_IDS: Record<string, string> = {
  pro:        process.env.STRIPE_PRICE_PRO ?? "",
  agency:     process.env.STRIPE_PRICE_AGENCY ?? "",
  enterprise: process.env.STRIPE_PRICE_ENTERPRISE ?? "",
};

export const PLAN_SENDS: Record<string, number> = {
  free:       0,
  pro:        200,
  agency:     1000,
  enterprise: 999999,
};

export { PLANS, PLAN_CREDITS } from "./plans";
export type { PlanKey } from "./plans";
```

- [ ] **Step 2: Commit**

```bash
git add lib/stripe.ts
git commit -m "feat: add PRICE_IDS and PLAN_SENDS exports to stripe.ts"
```

---

## Task 4: Update Stripe Checkout Route

**Files:**
- Modify: `app/api/stripe/checkout/route.ts`

- [ ] **Step 1: Replace the file**

```typescript
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe, PRICE_IDS } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { plan, trial } = await req.json();
    const priceId = PRICE_IDS[plan];

    if (!priceId) return NextResponse.json({ error: "Invalid plan" }, { status: 400 });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/dashboard?success=true`,
      cancel_url: `${appUrl}/pricing`,
      client_reference_id: user.id,
      metadata: { user_id: user.id, plan },
    };

    if (trial) {
      sessionConfig.subscription_data = { trial_period_days: 7 };
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);
    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/stripe/checkout/route.ts
git commit -m "feat: update checkout route — new price IDs, trial support, correct cancel URL"
```

---

## Task 5: Update Stripe Webhook Handler

**Files:**
- Modify: `app/api/stripe/webhook/route.ts`

- [ ] **Step 1: Update PRICE_TO_PLAN and PLAN limits at the top of the file**

Replace lines 9-27 (the `PRICE_TO_PLAN`, `PLAN_CREDITS`, `PLAN_SENDS` maps) with:

```typescript
// ── Price ID → plan map ─────────────────────────────────────────────────────
function buildPriceMap(): Record<string, string> {
  const map: Record<string, string> = {};
  const ids: Record<string, string | undefined> = {
    pro:        process.env.STRIPE_PRICE_PRO,
    agency:     process.env.STRIPE_PRICE_AGENCY,
    enterprise: process.env.STRIPE_PRICE_ENTERPRISE,
  };
  for (const [plan, id] of Object.entries(ids)) {
    if (id) map[id] = plan;
  }
  return map;
}

const PRICE_TO_PLAN = buildPriceMap();

// ── Plan limits ─────────────────────────────────────────────────────────────
const PLAN_CREDITS: Record<string, number> = {
  free:       10,
  pro:        1000,
  agency:     5000,
  enterprise: 999999,
};

const PLAN_SENDS: Record<string, number> = {
  free:       0,
  pro:        200,
  agency:     1000,
  enterprise: 999999,
};
```

- [ ] **Step 2: Verify build passes**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add app/api/stripe/webhook/route.ts
git commit -m "feat: update webhook — dynamic price ID map, new plan limits"
```

---

## Task 6: Wire Pricing Page to Checkout

**Files:**
- Modify: `app/pricing/page.tsx`

The current page is a Server Component using Shadcn `<Button>`. It needs to become a Client Component to call the checkout API.

- [ ] **Step 1: Replace the full file**

```typescript
"use client";

import { useState } from "react";
import Link from "next/link";
import { Zap, Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const plans = [
  {
    key: "pro",
    name: "Pro",
    price: "$199",
    period: "/month",
    description: "For growing sales teams",
    features: [
      "1,000 emails/month",
      "500 AI signals",
      "3 campaigns",
      "Gmail & Outlook",
      "Basic analytics",
      "Email support",
    ],
    cta: "Start Free Trial",
    highlighted: false,
    trial: true,
  },
  {
    key: "agency",
    name: "Agency",
    price: "$499",
    period: "/month",
    description: "For sales agencies",
    features: [
      "5,000 emails/month",
      "2,500 AI signals",
      "Unlimited campaigns",
      "Multi-inbox support",
      "Advanced analytics",
      "Priority support",
      "API access",
      "Custom integrations",
    ],
    cta: "Start Free Trial",
    highlighted: true,
    trial: true,
  },
  {
    key: "enterprise",
    name: "Enterprise",
    price: "$999",
    period: "/month",
    description: "For large organizations",
    features: [
      "Unlimited emails",
      "Unlimited AI signals",
      "Unlimited campaigns",
      "Unlimited inboxes",
      "Custom AI training",
      "Dedicated CSM",
      "SLA guarantee",
      "SSO & SAML",
      "Custom contracts",
    ],
    cta: "Contact Sales",
    highlighted: false,
    trial: false,
  },
];

const comparisonFeatures = [
  { name: "Emails per month", pro: "1,000", agency: "5,000", enterprise: "Unlimited" },
  { name: "AI signals", pro: "500", agency: "2,500", enterprise: "Unlimited" },
  { name: "Campaigns", pro: "3", agency: "Unlimited", enterprise: "Unlimited" },
  { name: "Team members", pro: "1", agency: "5", enterprise: "Unlimited" },
  { name: "Email warmup", pro: true, agency: true, enterprise: true },
  { name: "CRM integrations", pro: false, agency: true, enterprise: true },
  { name: "API access", pro: false, agency: true, enterprise: true },
  { name: "Custom AI training", pro: false, agency: false, enterprise: true },
  { name: "SSO/SAML", pro: false, agency: false, enterprise: true },
  { name: "SLA guarantee", pro: false, agency: false, enterprise: true },
];

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null);

  async function handleCheckout(planKey: string, trial: boolean) {
    if (planKey === "enterprise") {
      window.location.href = "mailto:sales@nexora.ai";
      return;
    }
    setLoading(planKey);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planKey, trial }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else if (data.error === "Unauthorized") {
        window.location.href = "/login";
      }
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="flex h-14 items-center justify-between border-b border-border px-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-primary">
            <Zap className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-base font-semibold tracking-tight">Nexora</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
            Dashboard
          </Link>
          <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
            Get Started
          </Button>
        </div>
      </header>

      {/* Hero */}
      <div className="border-b border-border px-6 py-16 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-4">
          <span>7-day free trial</span>
          <span className="text-muted-foreground">No credit card required</span>
        </div>
        <h1 className="text-3xl font-semibold">Simple, transparent pricing</h1>
        <p className="mt-2 text-muted-foreground">
          Choose the plan that fits your sales workflow
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="grid grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                "rounded-md border p-6",
                plan.highlighted ? "border-primary bg-primary/5" : "border-border bg-card"
              )}
            >
              {plan.highlighted && (
                <div className="mb-4 inline-block rounded bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                  Most Popular
                </div>
              )}
              <h3 className="text-lg font-semibold">{plan.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-semibold">{plan.price}</span>
                <span className="text-sm text-muted-foreground">{plan.period}</span>
              </div>
              <Button
                onClick={() => handleCheckout(plan.key, plan.trial)}
                disabled={loading === plan.key}
                className={cn(
                  "mt-6 w-full gap-2",
                  plan.highlighted
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "bg-secondary text-foreground hover:bg-secondary/80"
                )}
              >
                {loading === plan.key ? "Redirecting..." : plan.cta}
                <ArrowRight className="h-4 w-4" />
              </Button>
              <ul className="mt-6 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Comparison Table */}
      <div className="border-t border-border px-6 py-12">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-8 text-center text-xl font-semibold">Compare plans</h2>
          <div className="rounded-md border border-border bg-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Feature</th>
                  <th className="px-4 py-3 text-center text-sm font-medium">Pro</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-primary">Agency</th>
                  <th className="px-4 py-3 text-center text-sm font-medium">Enterprise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {comparisonFeatures.map((feature) => (
                  <tr key={feature.name}>
                    <td className="px-4 py-3 text-sm">{feature.name}</td>
                    <td className="px-4 py-3 text-center text-sm">
                      {typeof feature.pro === "boolean" ? (
                        feature.pro ? <Check className="mx-auto h-4 w-4 text-primary" /> : <span className="text-muted-foreground">-</span>
                      ) : (
                        <span className="font-mono text-muted-foreground">{feature.pro}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-sm bg-primary/5">
                      {typeof feature.agency === "boolean" ? (
                        feature.agency ? <Check className="mx-auto h-4 w-4 text-primary" /> : <span className="text-muted-foreground">-</span>
                      ) : (
                        <span className="font-mono">{feature.agency}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-sm">
                      {typeof feature.enterprise === "boolean" ? (
                        feature.enterprise ? <Check className="mx-auto h-4 w-4 text-primary" /> : <span className="text-muted-foreground">-</span>
                      ) : (
                        <span className="font-mono">{feature.enterprise}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-8">
        <div className="mx-auto max-w-5xl text-center">
          <p className="text-sm text-muted-foreground">
            Questions? Contact us at{" "}
            <a href="mailto:sales@nexora.ai" className="text-primary hover:underline">
              sales@nexora.ai
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/pricing/page.tsx
git commit -m "feat: wire pricing page buttons to Stripe checkout"
```

---

## Task 7: Create Supabase OAuth Callback Route

This is the route Supabase redirects to after Google sign-in. It exchanges the auth code for a session, then decides whether to send the user to `/onboarding` (new user) or `/dashboard` (returning user).

**Files:**
- Create: `app/api/auth/callback/route.ts`

- [ ] **Step 1: Create the file**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (!code) return NextResponse.redirect(`${appUrl}/login`);

  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(`${appUrl}/login?error=oauth`);
  }

  // Check if this user already has a subscription row (= returning user)
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("user_id")
    .eq("user_id", data.user.id)
    .single();

  if (sub) {
    return NextResponse.redirect(`${appUrl}/dashboard`);
  }

  // New user — send to onboarding
  return NextResponse.redirect(`${appUrl}/onboarding`);
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/auth/callback/route.ts
git commit -m "feat: add Supabase OAuth callback — routes new users to /onboarding"
```

---

## Task 8: Create Google OAuth Action

**Files:**
- Create: `app/actions/google-auth.ts`

- [ ] **Step 1: Create the file**

```typescript
"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function signInWithGoogle() {
  const supabase = await createClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${appUrl}/api/auth/callback`,
    },
  });

  if (error || !data.url) {
    redirect("/login?error=oauth");
  }

  redirect(data.url);
}
```

- [ ] **Step 2: Commit**

```bash
git add app/actions/google-auth.ts
git commit -m "feat: add Google OAuth server action"
```

---

## Task 9: Add Google OAuth Button to Login Page

**Files:**
- Modify: `app/(auth)/login/page.tsx`

- [ ] **Step 1: Add the Google button below the form card**

Add import at the top (after the existing imports):
```typescript
import { signInWithGoogle } from "@/app/actions/google-auth";
```

Replace the closing `</form>` and the closing `</div>` of the card with:

```tsx
            <button
              type="submit"
              disabled={pending}
              className="nx-btn mt-2"
            >
              {pending ? "Signing in..." : "Sign in"}
            </button>

            <div className="relative my-4">
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: "1px",
                    backgroundColor: "rgba(255,255,255,0.08)",
                  }}
                />
              </div>
              <div
                style={{
                  position: "relative",
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <span
                  style={{
                    backgroundColor: "var(--black-2)",
                    padding: "0 12px",
                    fontSize: "12px",
                    color: "rgba(255,255,255,0.35)",
                  }}
                >
                  or
                </span>
              </div>
            </div>

            <form action={signInWithGoogle}>
              <button
                type="submit"
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  padding: "10px 16px",
                  borderRadius: "6px",
                  border: "1px solid rgba(255,255,255,0.1)",
                  backgroundColor: "transparent",
                  color: "rgba(255,255,255,0.8)",
                  fontSize: "14px",
                  cursor: "pointer",
                  fontFamily: "var(--font-outfit)",
                }}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M17.64 9.2045c0-.6381-.0573-1.2518-.1636-1.8409H9v3.4814h4.8436c-.2086 1.125-.8427 2.0782-1.7959 2.7164v2.2581h2.9087c1.7018-1.5668 2.6836-3.874 2.6836-6.615z" fill="#4285F4"/>
                  <path d="M9 18c2.43 0 4.4673-.8059 5.9564-2.1805l-2.9087-2.2581c-.8059.54-1.8368.859-3.0477.859-2.344 0-4.3282-1.5831-5.036-3.7104H.9574v2.3318C2.4382 15.9832 5.4818 18 9 18z" fill="#34A853"/>
                  <path d="M3.964 10.71c-.18-.54-.2827-1.1168-.2827-1.71s.1027-1.17.2827-1.71V4.9582H.9574C.3477 6.1732 0 7.5482 0 9s.3477 2.8268.9574 4.0418L3.964 10.71z" fill="#FBBC05"/>
                  <path d="M9 3.5795c1.3214 0 2.5077.4541 3.4405 1.346l2.5813-2.5814C13.4632.8918 11.426 0 9 0 5.4818 0 2.4382 2.0168.9574 4.9582L3.964 7.29C4.6718 5.1627 6.656 3.5795 9 3.5795z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>
            </form>
          </form>
        </div>
```

The full replacement diff:
- Find `<button type="submit" disabled={pending} className="nx-btn mt-2">{pending ? "Signing in…" : "Sign in"}</button>` and replace with the expanded version above (preserving the sign-in button then adding the divider + Google form).

- [ ] **Step 2: Verify the file renders — check for TypeScript errors**

```bash
npx tsc --noEmit 2>&1 | grep "login"
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add "app/(auth)/login/page.tsx"
git commit -m "feat: add Continue with Google button to login page"
```

---

## Task 10: Add Google OAuth Button to Signup Page

**Files:**
- Modify: `app/(auth)/signup/page.tsx`

- [ ] **Step 1: Add Google button (same pattern as login)**

Add import after existing imports:
```typescript
import { signInWithGoogle } from "@/app/actions/google-auth";
```

After the existing `<button type="submit">Create account</button>` in the form, add the same divider + Google form block from Task 9 (identical code — copy exactly).

- [ ] **Step 2: Commit**

```bash
git add "app/(auth)/signup/page.tsx"
git commit -m "feat: add Continue with Google button to signup page"
```

---

## Task 11: Fix Auth Actions — Signup Redirects to Onboarding, Login Smart Redirect

**Files:**
- Modify: `app/actions/auth.ts`

- [ ] **Step 1: Replace the signup redirect and add login smart redirect**

```typescript
"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export type AuthState = { error: string | null };

export async function login(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  });

  if (error) {
    return { error: error.message };
  }

  // Check if user has completed onboarding (has subscription row)
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("user_id")
      .eq("user_id", user.id)
      .single();

    if (!sub) {
      redirect("/onboarding");
    }
  }

  redirect("/dashboard");
}

export async function signup(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const supabase = await createClient();

  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  const founderType = formData.get("founderType") as string | null;
  const validTypes = ["saas", "agency", "investor"];
  const safeFounderType = validTypes.includes(founderType ?? "") ? founderType : "saas";

  const { data: authData, error } = await supabase.auth.signUp({
    email: formData.get("email") as string,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  if (authData.user) {
    const db = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    await db
      .from("subscriptions")
      .update({ founder_type: safeFounderType })
      .eq("user_id", authData.user.id);
  }

  redirect("/onboarding");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
```

- [ ] **Step 2: Commit**

```bash
git add app/actions/auth.ts
git commit -m "feat: signup redirects to /onboarding, login checks onboarding status"
```

---

## Task 12: Update Onboarding Page — Persist Data + Allow Email Skip

The current onboarding page is fully client-side and doesn't save anything. Update it to call a server action that saves product/ICP info, and allow users to skip the email connection step.

**Files:**
- Modify: `app/onboarding/page.tsx`

- [ ] **Step 1: Replace the file**

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Zap, ArrowRight, ArrowLeft, Check, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const steps = [
  { id: 1, title: "What do you sell?", description: "Tell us about your product or service" },
  { id: 2, title: "Who do you sell to?", description: "Describe your ideal customer" },
  { id: 3, title: "Connect email", description: "Link your email account" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    product: "",
    icp: "",
    emailConnected: false,
  });

  const handleNext = async () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
      return;
    }
    // Final step — persist and redirect
    setSaving(true);
    try {
      await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product: formData.product,
          icp: formData.icp,
        }),
      });
    } finally {
      setSaving(false);
      router.push("/dashboard");
    }
  };

  const handleSkip = () => {
    router.push("/dashboard");
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex h-14 items-center justify-between border-b border-border px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-primary">
            <Zap className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-base font-semibold tracking-tight">Nexora</span>
        </div>
        <div className="flex items-center gap-2">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                  currentStep > step.id
                    ? "bg-primary text-primary-foreground"
                    : currentStep === step.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground"
                )}
              >
                {currentStep > step.id ? <Check className="h-3 w-3" /> : step.id}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "mx-2 h-px w-8",
                    currentStep > step.id ? "bg-primary" : "bg-border"
                  )}
                />
              )}
            </div>
          ))}
        </div>
        <div className="w-24" />
      </header>

      <main className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-xl">
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <h1 className="text-2xl font-semibold">What do you sell?</h1>
                <p className="mt-2 text-muted-foreground">
                  Describe your product or service in a few sentences
                </p>
              </div>
              <textarea
                value={formData.product}
                onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                placeholder="e.g., We sell AI-powered sales automation software that helps B2B companies increase their outbound reply rates by 3x..."
                className="h-40 w-full resize-none rounded-md border border-border bg-card p-4 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <h1 className="text-2xl font-semibold">Who do you sell to?</h1>
                <p className="mt-2 text-muted-foreground">
                  Describe your ideal customer profile (ICP)
                </p>
              </div>
              <textarea
                value={formData.icp}
                onChange={(e) => setFormData({ ...formData, icp: e.target.value })}
                placeholder="e.g., VP of Sales or Head of Growth at Series A-C SaaS companies with 50-500 employees, based in North America..."
                className="h-40 w-full resize-none rounded-md border border-border bg-card p-4 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <h1 className="text-2xl font-semibold">Connect your email</h1>
                <p className="mt-2 text-muted-foreground">
                  Link your email account to start sending campaigns
                </p>
              </div>
              <div className="space-y-3">
                <button
                  onClick={() => setFormData({ ...formData, emailConnected: true })}
                  disabled={formData.emailConnected}
                  className={cn(
                    "flex w-full items-center justify-center gap-3 rounded-md border border-border bg-card p-4 text-sm font-medium transition-colors",
                    formData.emailConnected
                      ? "border-green-500/50 bg-green-500/10"
                      : "hover:bg-secondary"
                  )}
                >
                  {formData.emailConnected ? (
                    <>
                      <Check className="h-5 w-5 text-green-500" />
                      <span className="text-green-500">Gmail Connected</span>
                    </>
                  ) : (
                    <>
                      <Mail className="h-5 w-5" />
                      <span>Connect Gmail</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                We only use your email to send campaigns. Your data is secure and encrypted.
              </p>
            </div>
          )}

          <div className="mt-8 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={currentStep === 1}
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="flex items-center gap-3">
              {currentStep === 3 && (
                <Button
                  variant="ghost"
                  onClick={handleSkip}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Skip for now
                </Button>
              )}
              <Button
                onClick={handleNext}
                disabled={
                  saving ||
                  (currentStep === 1 && !formData.product) ||
                  (currentStep === 2 && !formData.icp)
                }
                className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {saving ? "Saving..." : currentStep === 3 ? "Get Started" : "Continue"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Create the onboarding API route to persist data**

Create `app/api/onboarding/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { product, icp } = await req.json();

  await supabase
    .from("subscriptions")
    .update({ product_description: product, icp_description: icp })
    .eq("user_id", user.id);

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 3: Commit**

```bash
git add app/onboarding/page.tsx app/api/onboarding/route.ts
git commit -m "feat: onboarding persists product+ICP to Supabase, allows email skip"
```

---

## Task 13: Dashboard Plan Gating

The dashboard page is currently a Client Component with static data. Convert to a Server Component that fetches the user's plan and shows gated content.

**Files:**
- Modify: `app/dashboard/page.tsx`

- [ ] **Step 1: Replace the file**

```typescript
import { createClient } from "@/lib/supabase/server";
import { CommandBar } from "@/components/command-bar";
import { StatCard } from "@/components/stat-card";
import { CampaignsTable } from "@/components/campaigns-table";
import { SignalsFeed } from "@/components/signals-feed";
import Link from "next/link";

async function getSubscription(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("subscriptions")
    .select("plan, credits_used, credits_limit")
    .eq("user_id", userId)
    .single();
  return data ?? { plan: "free", credits_used: 0, credits_limit: 10 };
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const sub = user ? await getSubscription(user.id) : { plan: "free", credits_used: 0, credits_limit: 10 };

  const plan = sub.plan as string;
  const isPaid = plan !== "free";
  const isAgencyOrEnterprise = plan === "agency" || plan === "enterprise";
  const creditsLeft = sub.credits_limit - sub.credits_used;

  return (
    <div className="p-6 animate-fade-in">
      {/* Plan banner for free users */}
      {!isPaid && (
        <div
          style={{
            marginBottom: "24px",
            padding: "12px 16px",
            borderRadius: "8px",
            border: "1px solid rgba(255,82,0,0.3)",
            backgroundColor: "rgba(255,82,0,0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: "14px", color: "rgba(255,255,255,0.7)" }}>
            Free plan - {creditsLeft} of {sub.credits_limit} credits remaining
          </span>
          <Link
            href="/pricing"
            style={{
              fontSize: "13px",
              color: "#FF5200",
              textDecoration: "none",
              fontWeight: 500,
            }}
          >
            Upgrade
          </Link>
        </div>
      )}

      {/* Command Center */}
      <div className="mb-8">
        <h1 className="mb-1 text-lg font-semibold">Mission Control</h1>
        <p className="mb-4 text-sm text-muted-foreground">
          Your AI-powered sales command center
        </p>
        <CommandBar />
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        <StatCard
          title="Emails Sent"
          value="2,847"
          change="+12.3% from last week"
          changeType="positive"
          iconName="mail"
          iconColor="text-primary"
        />
        <StatCard
          title="Active Leads"
          value="1,234"
          change="+8.1% from last week"
          changeType="positive"
          iconName="users"
          iconColor="text-foreground"
        />
        <StatCard
          title="Response Rate"
          value="14.2%"
          change="-2.1% from last week"
          changeType="negative"
          iconName="messageSquare"
          iconColor="text-green-500"
        />
        <StatCard
          title="AI Signals"
          value={isPaid ? "89" : "—"}
          change={isPaid ? "24 high priority" : "Pro+ feature"}
          changeType={isPaid ? "neutral" : "negative"}
          iconName="zap"
          iconColor="text-accent"
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CampaignsTable limit={isPaid ? undefined : 3} />
        </div>
        <div className="lg:col-span-1">
          {isPaid ? (
            <SignalsFeed />
          ) : (
            <div
              style={{
                padding: "24px",
                borderRadius: "8px",
                border: "1px solid rgba(255,255,255,0.06)",
                backgroundColor: "#0e0e0e",
                textAlign: "center",
              }}
            >
              <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.45)", marginBottom: "16px" }}>
                AI Signals require a paid plan
              </p>
              <Link
                href="/pricing"
                style={{
                  display: "inline-block",
                  padding: "8px 20px",
                  borderRadius: "6px",
                  backgroundColor: "#FF5200",
                  color: "#fff",
                  fontSize: "13px",
                  textDecoration: "none",
                }}
              >
                View Plans
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Agency/Enterprise: extra row */}
      {isAgencyOrEnterprise && (
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div
            style={{
              padding: "20px",
              borderRadius: "8px",
              border: "1px solid rgba(255,255,255,0.06)",
              backgroundColor: "#0e0e0e",
            }}
          >
            <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", marginBottom: "4px" }}>
              Monthly sends
            </p>
            <p style={{ fontSize: "24px", fontWeight: 500, color: "#fff" }}>
              {plan === "enterprise" ? "Unlimited" : "1,000"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/dashboard/page.tsx
git commit -m "feat: dashboard shows plan-gated content, upgrade prompt for free users"
```

---

## Task 14: Run Build + Fix Errors

- [ ] **Step 1: Run the build**

```bash
npm run build 2>&1
```

Expected: compilation succeeds. If errors appear, fix each one before proceeding.

**Common errors to expect and fixes:**

- `Type 'undefined' is not assignable to 'string'` in stripe.ts PRICE_IDS: The `?? ""` fallback handles this.
- Missing import in login/signup pages for `signInWithGoogle`: ensure the import line was added.
- `Cannot find module '@/app/actions/google-auth'`: verify the file was created at `app/actions/google-auth.ts`.
- `Property 'product_description' does not exist on type '...'`: The Supabase TypeScript types may not include the new columns yet — add `// @ts-expect-error` above the update call in the onboarding route as a workaround.

- [ ] **Step 2: Re-run build until clean**

```bash
npm run build 2>&1
```

Expected:
```
- info Creating an optimized production build
- info Compiled successfully
```

- [ ] **Step 3: Commit any fixes**

```bash
git add -A
git commit -m "fix: resolve build errors"
```

---

## Task 15: Push to Main

- [ ] **Step 1: Verify current branch**

```bash
git status
git log --oneline -5
```

- [ ] **Step 2: Push**

```bash
git push origin main
```

Expected: push completes without errors.

---

## Post-Deploy Manual Checklist

Run these in Supabase dashboard SQL editor after deploying:

```sql
-- Ensure onboarding columns exist in subscriptions
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS product_description text,
  ADD COLUMN IF NOT EXISTS icp_description text,
  ADD COLUMN IF NOT EXISTS founder_type text,
  ADD COLUMN IF NOT EXISTS sends_limit int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sends_used int DEFAULT 0;
```

Also confirm in Supabase dashboard (Authentication > Providers):
- Google is enabled
- Client ID = `659725925559-lbdg9acouuanqt64fi4fvri6s94usjvj.apps.googleusercontent.com`
- Client Secret = value from `.env.local`

Also in Google Cloud Console > APIs & Credentials:
- Add `https://vikqtxbemwjmdwnxgepk.supabase.co/auth/v1/callback` to authorized redirect URIs.

---

## Self-Review

**Spec coverage check:**

| Requirement | Task |
|------------|------|
| 3 Stripe products/prices in stripe.ts | Tasks 1-3 |
| Checkout session API | Task 4 |
| 7-day trial | Task 4 |
| Success URL /dashboard, Cancel URL /pricing | Task 4 |
| Webhook: checkout.session.completed | Already in webhook (Task 5 updates price map) |
| Webhook: customer.subscription.deleted → downgrade | Already in webhook |
| Connect pricing page buttons to checkout | Task 6 |
| Add plan column to subscriptions | Post-deploy SQL + existing schema |
| After payment update user plan | Webhook handler |
| Dashboard checks user plan | Task 13 |
| Free users redirect to /pricing at limits | Task 13 (upgrade banner + gated features) |
| Google sign-in button on /login | Task 9 |
| Google sign-in button on /signup | Task 10 |
| After Google auth → create user in Supabase | Supabase handles automatically |
| Redirect to /onboarding if new user | Task 7 (callback route) |
| Redirect to /dashboard if existing user | Task 7 (callback route) |
| /signup → /onboarding for new users | Task 11 |
| /login → smart redirect | Task 11 |
| After onboarding → /dashboard | Tasks 12 |
| Protected routes: /dashboard requires auth | Already in dashboard/layout.tsx |
| Unauthenticated → redirect /login | Already in dashboard/layout.tsx |
| Free: limited features, upgrade prompts | Task 13 |
| Pro: 200 prospects/month | Task 5 (PLAN_SENDS) |
| Agency: 1000 prospects/month | Task 5 (PLAN_SENDS) |
| Enterprise: unlimited | Task 5 (PLAN_SENDS) |

**Placeholder scan:** No TBDs or unimplemented code blocks found.

**Type consistency:** PRICE_IDS keys (pro/agency/enterprise) match PlanKey, PRICE_TO_PLAN, PLAN_CREDITS, and PLAN_SENDS throughout all tasks.
