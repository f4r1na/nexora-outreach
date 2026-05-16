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
