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
