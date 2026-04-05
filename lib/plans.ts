// Client-safe plan constants — no Stripe SDK, no server-only env vars

export const PLANS = {
  starter: { name: "Starter", price: 19, credits: 300 },
  pro:     { name: "Pro",     price: 49, credits: 1000 },
  agency:  { name: "Agency",  price: 99, credits: 999999 },
} as const;

export type PlanKey = keyof typeof PLANS | "free";

export const PLAN_CREDITS: Record<string, number> = {
  free:    10,
  starter: 300,
  pro:     1000,
  agency:  999999,
};
