// Server-side only — never import this in client components
import Stripe from "stripe"

function createStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    // Return a proxy that throws only when an actual API call is made,
    // so module evaluation during build does not crash.
    return new Proxy({} as Stripe, {
      get(_, prop) {
        throw new Error(`Stripe: STRIPE_SECRET_KEY is not set (accessed .${String(prop)})`)
      },
    })
  }
  return new Stripe(key, { apiVersion: "2023-10-16" })
}

export const stripe = createStripe()

export const PRICE_IDS: Record<string, string> = {
  pro:        process.env.STRIPE_PRICE_PRO ?? "",
  agency:     process.env.STRIPE_PRICE_AGENCY ?? "",
  enterprise: process.env.STRIPE_PRICE_ENTERPRISE ?? "",
}

export const PLAN_SENDS: Record<string, number> = {
  free:       0,
  pro:        200,
  agency:     1000,
  enterprise: 999999,
}

export { PLANS, PLAN_CREDITS } from "./plans"
export type { PlanKey } from "./plans"
