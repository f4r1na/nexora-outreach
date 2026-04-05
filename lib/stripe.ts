// Server-side only — never import this in client components
import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2023-10-16",
});

// Re-export plan constants so API routes can import from one place
export { PLANS, PLAN_CREDITS } from "./plans";
export type { PlanKey } from "./plans";
