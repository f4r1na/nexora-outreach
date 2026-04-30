"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Download, CreditCard, AlertTriangle, Loader2, X } from "lucide-react";
import SectionHeader from "../_components/SectionHeader";
import { PLANS } from "@/lib/plans";

const EASE = [0.23, 1, 0.32, 1] as const;

function fadeUp(i: number) {
  return {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { delay: i * 0.07, duration: 0.28, ease: EASE },
  };
}

const PLAN_ORDER = ["free", "starter", "pro", "agency"] as const;

const PLAN_FEATURES: Record<string, string[]> = {
  free: [
    "10 credits / month",
    "1 active campaign",
    "Basic AI email generation",
    "Community support",
  ],
  starter: [
    "300 credits / month",
    "Up to 3 campaigns",
    "AI email generation",
    "Reply detection",
    "Email support",
  ],
  pro: [
    "1,000 credits / month",
    "Unlimited campaigns",
    "AI email generation",
    "Inbox management",
    "Advanced analytics",
    "Priority support",
  ],
  agency: [
    "Unlimited emails",
    "Everything in Pro+",
    "Dedicated account manager",
    "Custom integrations",
    "SLA + uptime guarantees",
    "Onboarding & training",
  ],
};

interface SubscriptionData {
  plan: string;
  credits_used: number;
  credits_limit: number;
  current_period_end: string | null;
  stripe_customer_id: string | null;
}

interface PaymentMethod {
  name: string;
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
}

interface Invoice {
  id: string;
  date: number;
  amount: number;
  status: string;
  pdf: string | null;
}

interface BillingData {
  paymentMethod: PaymentMethod | null;
  invoices: Invoice[];
  cancelAtPeriodEnd: boolean;
}

const CARD = {
  backgroundColor: "rgba(255,255,255,0.05)",
  borderRadius: 8,
  padding: 20,
} as const;

function brandLabel(brand: string) {
  const map: Record<string, string> = {
    visa: "Visa", mastercard: "Mastercard",
    amex: "Amex", discover: "Discover",
    jcb: "JCB", unionpay: "UnionPay",
  };
  return map[brand.toLowerCase()] ?? (brand.charAt(0).toUpperCase() + brand.slice(1));
}

function formatDate(unix: number) {
  return new Date(unix * 1000).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function planDisplayName(plan: string) {
  if (plan === "free") return "Free";
  return PLANS[plan as keyof typeof PLANS]?.name ?? (plan.charAt(0).toUpperCase() + plan.slice(1));
}

function planDisplayPrice(plan: string) {
  if (plan === "free") return "$0 / month";
  const p = PLANS[plan as keyof typeof PLANS];
  return p ? `$${p.price} / month` : "Custom pricing";
}

function getAdjacentPlans(current: string) {
  const idx = PLAN_ORDER.indexOf(current as typeof PLAN_ORDER[number]);
  return {
    upgrade: idx >= 0 && idx < PLAN_ORDER.length - 1 ? PLAN_ORDER[idx + 1] : null,
    downgrade: idx > 0 ? PLAN_ORDER[idx - 1] : null,
  };
}

function ConfirmModal({
  onClose,
  onConfirm,
  confirming,
  error,
}: {
  onClose: () => void;
  onConfirm: () => void;
  confirming: boolean;
  error: string | null;
}) {
  return (
    <motion.div
      key="cancel-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        backgroundColor: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 24,
      }}
    >
      <motion.div
        key="cancel-modal"
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={{ duration: 0.2, ease: EASE }}
        style={{
          backgroundColor: "#0e0e18",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 12, padding: 28,
          width: "100%", maxWidth: 400,
          position: "relative",
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute", top: 14, right: 14,
            background: "none", border: "none", cursor: "pointer",
            color: "rgba(255,255,255,0.35)", display: "flex",
          }}
          aria-label="Close"
        >
          <X size={16} strokeWidth={1.75} aria-hidden="true" />
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <AlertTriangle size={17} strokeWidth={1.75} color="#ef4444" aria-hidden="true" />
          <h2 style={{
            fontSize: 15, fontWeight: 600, color: "#fff",
            fontFamily: "var(--font-syne)", margin: 0,
          }}>
            Cancel your subscription?
          </h2>
        </div>
        <p style={{
          fontSize: 12, color: "rgba(255,255,255,0.5)",
          fontFamily: "var(--font-outfit)", lineHeight: 1.6, marginBottom: 20,
        }}>
          You'll keep access until the end of your current billing period. After that, your account reverts to the free plan.
        </p>

        {error && (
          <div style={{
            padding: "8px 12px", borderRadius: 6, marginBottom: 16,
            backgroundColor: "rgba(239,68,68,0.06)",
            border: "1px solid rgba(239,68,68,0.18)",
          }}>
            <p style={{ fontSize: 12, color: "#ef4444", fontFamily: "var(--font-outfit)", margin: 0 }}>
              {error}
            </p>
          </div>
        )}

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            disabled={confirming}
            style={{
              padding: "8px 16px", borderRadius: 6, fontSize: 12,
              fontFamily: "var(--font-outfit)", cursor: "pointer",
              backgroundColor: "transparent", color: "rgba(255,255,255,0.5)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            Keep subscription
          </button>
          <button
            onClick={onConfirm}
            disabled={confirming}
            style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              padding: "8px 16px", borderRadius: 6, fontSize: 12,
              fontFamily: "var(--font-outfit)",
              cursor: confirming ? "not-allowed" : "pointer",
              backgroundColor: "#ef4444", color: "#fff", border: "none",
              opacity: confirming ? 0.7 : 1,
            }}
          >
            {confirming && <Loader2 size={12} strokeWidth={2} style={{ animation: "spin 0.8s linear infinite" }} />}
            {confirming ? "Canceling..." : "Yes, cancel"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function BillingPage() {
  const [sub, setSub] = useState<SubscriptionData | null>(null);
  const [billing, setBilling] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);

  const [cancelModal, setCancelModal] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [canceledUntil, setCanceledUntil] = useState<string | null>(null);

  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/subscription").then((r) => r.json()),
      fetch("/api/billing").then((r) => r.json()),
    ]).then(([subData, billingData]) => {
      setSub(subData.subscription ?? null);
      setBilling(billingData);
    }).finally(() => setLoading(false));
  }, []);

  async function handlePlanChange(plan: string) {
    setUpgrading(plan);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } finally {
      setUpgrading(null);
    }
  }

  async function openPortal() {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } finally {
      setPortalLoading(false);
    }
  }

  async function handleCancel() {
    setCanceling(true);
    setCancelError(null);
    try {
      const res = await fetch("/api/stripe/cancel-subscription", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        const endDate = data.current_period_end
          ? new Date(data.current_period_end * 1000).toLocaleDateString("en-US", {
              month: "long", day: "numeric", year: "numeric",
            })
          : null;
        setCanceledUntil(endDate);
        setCancelModal(false);
        setBilling((b) => b ? { ...b, cancelAtPeriodEnd: true } : b);
      } else {
        setCancelError(data.error ?? "Failed to cancel subscription.");
      }
    } finally {
      setCanceling(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", paddingTop: 80 }}>
        <Loader2 size={20} color="rgba(255,255,255,0.25)" style={{ animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }

  const plan = sub?.plan ?? "free";
  const creditsUsed = sub?.credits_used ?? 0;
  const creditsLimit = sub?.credits_limit ?? 10;
  const isUnlimited = creditsLimit >= 999999;
  const pct = isUnlimited ? 100 : Math.min(100, Math.round((creditsUsed / creditsLimit) * 100));
  const creditsLeft = isUnlimited ? null : Math.max(0, creditsLimit - creditsUsed);
  const { upgrade: upgradePlan, downgrade: downgradePlan } = getAdjacentPlans(plan);

  const isCanceled = billing?.cancelAtPeriodEnd || !!canceledUntil;
  const periodEnd = sub?.current_period_end
    ? new Date(sub.current_period_end).toLocaleDateString("en-US", {
        month: "long", day: "numeric", year: "numeric",
      })
    : null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25 }}
        style={{ maxWidth: 900, paddingBottom: 80 }}
      >
        {/* Page header */}
        <motion.div {...fadeUp(0)} style={{ marginBottom: 40 }}>
          <h1 style={{
            fontSize: 22, fontWeight: 700, color: "#fff",
            fontFamily: "var(--font-syne)", letterSpacing: "-0.02em",
            margin: 0, lineHeight: 1.2,
          }}>
            Billing & Plans
          </h1>
          <p style={{
            fontSize: 13, color: "rgba(255,255,255,0.45)",
            fontFamily: "var(--font-outfit)", margin: "6px 0 0",
          }}>
            Manage your subscription and payment method
          </p>
        </motion.div>

        {/* ── SECTION 1: Current Plan ── */}
        <motion.section {...fadeUp(1)} style={{ marginBottom: 48 }}>
          <SectionHeader title="Current Plan" divider />

          {/* Cancellation warning */}
          {isCanceled && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 14px", borderRadius: 8, marginBottom: 16,
                backgroundColor: "rgba(239,68,68,0.06)",
                border: "1px solid rgba(239,68,68,0.18)",
              }}
            >
              <AlertTriangle size={14} strokeWidth={1.75} color="#ef4444" aria-hidden="true" />
              <p style={{
                fontSize: 12, color: "#ef4444",
                fontFamily: "var(--font-outfit)", margin: 0, lineHeight: 1.5,
              }}>
                Cancellation scheduled{(canceledUntil || periodEnd) ? ` — access until ${canceledUntil ?? periodEnd}` : ""}.
              </p>
            </motion.div>
          )}

          <div style={CARD}>
            <div style={{
              display: "flex", alignItems: "flex-start",
              justifyContent: "space-between", flexWrap: "wrap",
              gap: 12, marginBottom: 20,
            }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
                  <h2 style={{
                    fontSize: 20, fontWeight: 700, color: "#fff",
                    fontFamily: "var(--font-syne)", margin: 0, letterSpacing: "-0.02em",
                  }}>
                    {planDisplayName(plan)}
                  </h2>
                  <span style={{
                    fontSize: 9, fontWeight: 600,
                    fontFamily: "var(--font-outfit)", color: "#FF5200",
                    backgroundColor: "rgba(255,82,0,0.1)",
                    border: "1px solid rgba(255,82,0,0.2)",
                    borderRadius: 999, padding: "2px 8px",
                    letterSpacing: "0.05em", textTransform: "uppercase",
                  }}>
                    Active
                  </span>
                </div>
                <p style={{
                  fontSize: 14, color: "rgba(255,255,255,0.45)",
                  fontFamily: "var(--font-outfit)", margin: 0,
                }}>
                  {planDisplayPrice(plan)}
                  {plan === "agency" && (
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.28)", marginLeft: 6 }}>
                      (custom per email)
                    </span>
                  )}
                </p>
              </div>
            </div>

            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 9, marginBottom: 24 }}>
              {(PLAN_FEATURES[plan] ?? []).map((feature) => (
                <li key={feature} style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <Check size={13} strokeWidth={2.5} color="#FF5200" aria-hidden="true" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", fontFamily: "var(--font-outfit)" }}>
                    {feature}
                  </span>
                </li>
              ))}
            </ul>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {upgradePlan && (
                <button
                  onClick={() => handlePlanChange(upgradePlan)}
                  disabled={!!upgrading}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 7,
                    padding: "8px 18px", borderRadius: 7,
                    backgroundColor: "#FF5200", color: "#fff",
                    fontSize: 13, fontWeight: 500, fontFamily: "var(--font-outfit)",
                    border: "none",
                    cursor: upgrading ? "not-allowed" : "pointer",
                    opacity: upgrading === upgradePlan ? 0.7 : 1,
                    transition: "filter 0.15s ease",
                  }}
                  onMouseEnter={(e) => { if (!upgrading) (e.currentTarget as HTMLButtonElement).style.filter = "brightness(1.1)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.filter = "none"; }}
                >
                  {upgrading === upgradePlan && <Loader2 size={13} strokeWidth={2} style={{ animation: "spin 0.8s linear infinite" }} />}
                  Upgrade to {planDisplayName(upgradePlan)}
                </button>
              )}
              {downgradePlan && (
                <button
                  onClick={() => handlePlanChange(downgradePlan)}
                  disabled={!!upgrading}
                  style={{
                    padding: "8px 18px", borderRadius: 7,
                    backgroundColor: "transparent", color: "rgba(255,255,255,0.55)",
                    fontSize: 13, fontFamily: "var(--font-outfit)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    cursor: upgrading ? "not-allowed" : "pointer",
                    opacity: upgrading === downgradePlan ? 0.7 : 1,
                    transition: "color 0.15s ease, border-color 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    const b = e.currentTarget as HTMLButtonElement;
                    b.style.color = "rgba(255,255,255,0.85)";
                    b.style.borderColor = "rgba(255,255,255,0.25)";
                  }}
                  onMouseLeave={(e) => {
                    const b = e.currentTarget as HTMLButtonElement;
                    b.style.color = "rgba(255,255,255,0.55)";
                    b.style.borderColor = "rgba(255,255,255,0.12)";
                  }}
                >
                  Downgrade to {planDisplayName(downgradePlan)}
                </button>
              )}
              {plan === "free" && !upgradePlan && (
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", fontFamily: "var(--font-outfit)", alignSelf: "center" }}>
                  No active subscription
                </p>
              )}
            </div>
          </div>
        </motion.section>

        {/* ── SECTION 2: Usage Tracker ── */}
        <motion.section {...fadeUp(2)} style={{ marginBottom: 48 }}>
          <SectionHeader title="Usage This Month" divider />
          <div style={{ ...CARD, display: "flex", flexDirection: "column", gap: 24 }}>

            {/* Credits */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 9 }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.65)", fontFamily: "var(--font-outfit)" }}>
                  Credits Used
                </span>
                <span style={{
                  fontSize: 14, fontWeight: 600, color: "#fff",
                  fontFamily: "var(--font-outfit)", fontVariantNumeric: "tabular-nums",
                }}>
                  {creditsUsed.toLocaleString()} / {isUnlimited ? "Unlimited" : creditsLimit.toLocaleString()}
                </span>
              </div>
              <div style={{ height: 8, backgroundColor: "rgba(255,255,255,0.07)", borderRadius: 999, overflow: "hidden" }}>
                <motion.div
                  initial={{ width: "0%" }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 1.1, ease: EASE, delay: 0.35 }}
                  style={{
                    height: "100%",
                    borderRadius: 999,
                    backgroundColor: "#FF5200",
                    backgroundImage: isUnlimited
                      ? "linear-gradient(90deg, #FF5200 0%, #ff8c42 100%)"
                      : undefined,
                  }}
                />
              </div>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.28)", fontFamily: "var(--font-outfit)", marginTop: 7 }}>
                {isUnlimited
                  ? "Unlimited credits on your plan"
                  : `${creditsLeft?.toLocaleString()} credits remaining`}
              </p>
            </div>

            {/* Email Sends */}
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.65)", fontFamily: "var(--font-outfit)" }}>
                  Email Sends This Month
                </span>
                <span style={{
                  fontSize: 14, fontWeight: 600, color: "#fff",
                  fontFamily: "var(--font-outfit)", fontVariantNumeric: "tabular-nums",
                }}>
                  {creditsUsed} / {isUnlimited ? "Unlimited" : creditsLimit}
                </span>
              </div>
              {plan === "agency" && (
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.28)", fontFamily: "var(--font-outfit)" }}>
                  You're on a pay-per-email plan
                </p>
              )}
            </div>

          </div>
        </motion.section>

        {/* ── SECTION 3: Payment Method ── */}
        <motion.section {...fadeUp(3)} style={{ marginBottom: 48 }}>
          <SectionHeader title="Payment Method" divider />

          {billing?.paymentMethod ? (
            <motion.div
              whileHover={{ scale: 1.012, boxShadow: "0 10px 40px rgba(0,0,0,0.45)" }}
              transition={{ duration: 0.18, ease: EASE }}
              style={{
                ...CARD,
                display: "flex", alignItems: "center",
                justifyContent: "space-between", gap: 16, flexWrap: "wrap",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{
                  width: 46, height: 32, borderRadius: 6,
                  backgroundColor: "rgba(255,255,255,0.09)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <CreditCard size={18} strokeWidth={1.5} color="rgba(255,255,255,0.45)" aria-hidden="true" />
                </div>
                <div>
                  {billing.paymentMethod.name && (
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: "var(--font-outfit)", margin: "0 0 2px" }}>
                      {billing.paymentMethod.name}
                    </p>
                  )}
                  <p style={{ fontSize: 13, color: "#fff", fontFamily: "var(--font-outfit)", margin: 0, fontWeight: 500 }}>
                    {brandLabel(billing.paymentMethod.brand)} ending in {billing.paymentMethod.last4}
                  </p>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.32)", fontFamily: "var(--font-outfit)", margin: "3px 0 0" }}>
                    Expires {String(billing.paymentMethod.exp_month).padStart(2, "0")}/{billing.paymentMethod.exp_year}
                  </p>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <button
                  onClick={openPortal}
                  disabled={portalLoading}
                  style={{
                    padding: "6px 14px", borderRadius: 6, fontSize: 12,
                    fontFamily: "var(--font-outfit)",
                    backgroundColor: "transparent", color: "rgba(255,255,255,0.55)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    cursor: portalLoading ? "not-allowed" : "pointer",
                    opacity: portalLoading ? 0.5 : 1,
                    transition: "color 0.15s ease",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#fff"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.55)"; }}
                >
                  Edit
                </button>
                <button
                  onClick={openPortal}
                  disabled={portalLoading}
                  style={{
                    padding: "6px 14px", borderRadius: 6, fontSize: 12,
                    fontFamily: "var(--font-outfit)",
                    backgroundColor: "transparent", color: "rgba(239,68,68,0.65)",
                    border: "1px solid rgba(239,68,68,0.15)",
                    cursor: portalLoading ? "not-allowed" : "pointer",
                    opacity: portalLoading ? 0.5 : 1,
                    transition: "color 0.15s ease",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#ef4444"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(239,68,68,0.65)"; }}
                >
                  Remove
                </button>
              </div>
            </motion.div>
          ) : (
            <div style={{
              ...CARD,
              display: "flex", alignItems: "center", gap: 12,
              color: "rgba(255,255,255,0.28)",
            }}>
              <CreditCard size={18} strokeWidth={1.5} aria-hidden="true" />
              <span style={{ fontSize: 13, fontFamily: "var(--font-outfit)" }}>
                No payment method on file.{" "}
                {plan !== "free" && (
                  <button
                    onClick={openPortal}
                    style={{
                      background: "none", border: "none", color: "#FF5200",
                      fontSize: 13, fontFamily: "var(--font-outfit)", cursor: "pointer", padding: 0,
                    }}
                  >
                    Add one
                  </button>
                )}
              </span>
            </div>
          )}
        </motion.section>

        {/* ── SECTION 4: Invoice History ── */}
        <motion.section {...fadeUp(4)} style={{ marginBottom: 48 }}>
          <SectionHeader title="Invoice History" divider />

          {billing?.invoices.length ? (
            <div style={{ ...CARD, padding: 0, overflow: "hidden" }}>
              {/* Header row */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 100px 80px 72px",
                gap: 12, padding: "12px 20px",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
              }}>
                {["Date", "Amount", "Status", ""].map((col) => (
                  <span key={col} style={{
                    fontSize: 10.5, fontWeight: 600, textTransform: "uppercase",
                    letterSpacing: "0.06em", color: "rgba(255,255,255,0.28)",
                    fontFamily: "var(--font-outfit)",
                  }}>
                    {col}
                  </span>
                ))}
              </div>

              {billing.invoices.map((inv, i) => (
                <motion.div
                  key={inv.id}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 + i * 0.05, duration: 0.22, ease: EASE }}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 100px 80px 72px",
                    gap: 12, alignItems: "center",
                    padding: "13px 20px",
                    borderBottom: i < billing.invoices.length - 1
                      ? "1px solid rgba(255,255,255,0.04)"
                      : undefined,
                  }}
                >
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", fontFamily: "var(--font-outfit)" }}>
                    {formatDate(inv.date)}
                  </span>
                  <span style={{
                    fontSize: 13, fontWeight: 500, color: "#fff",
                    fontFamily: "var(--font-outfit)", fontVariantNumeric: "tabular-nums",
                  }}>
                    ${(inv.amount / 100).toFixed(2)}
                  </span>
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: 5,
                    fontSize: 12, fontFamily: "var(--font-outfit)",
                    color: inv.status === "paid" ? "#4ade80" : "rgba(255,255,255,0.4)",
                  }}>
                    {inv.status === "paid" && (
                      <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#4ade80", flexShrink: 0 }} />
                    )}
                    {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                  </span>
                  <span>
                    {inv.pdf ? (
                      <a
                        href={inv.pdf}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Download invoice from ${formatDate(inv.date)}`}
                        style={{
                          display: "inline-flex", alignItems: "center", gap: 5,
                          fontSize: 12, color: "rgba(255,255,255,0.4)",
                          fontFamily: "var(--font-outfit)", textDecoration: "none",
                          padding: "4px 10px", borderRadius: 6,
                          border: "1px solid rgba(255,255,255,0.08)",
                          transition: "color 0.15s ease, border-color 0.15s ease",
                        }}
                        onMouseEnter={(e) => {
                          const a = e.currentTarget as HTMLAnchorElement;
                          a.style.color = "#fff";
                          a.style.borderColor = "rgba(255,255,255,0.18)";
                        }}
                        onMouseLeave={(e) => {
                          const a = e.currentTarget as HTMLAnchorElement;
                          a.style.color = "rgba(255,255,255,0.4)";
                          a.style.borderColor = "rgba(255,255,255,0.08)";
                        }}
                      >
                        <Download size={11} aria-hidden="true" />
                        PDF
                      </a>
                    ) : (
                      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.18)", fontFamily: "var(--font-outfit)" }}>-</span>
                    )}
                  </span>
                </motion.div>
              ))}
            </div>
          ) : (
            <div style={{
              ...CARD,
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: "40px 20px",
            }}>
              <p style={{
                fontSize: 13, color: "rgba(255,255,255,0.22)",
                fontFamily: "var(--font-outfit)", margin: 0, textAlign: "center",
              }}>
                No invoices yet. Your first invoice will appear here.
              </p>
            </div>
          )}
        </motion.section>

        {/* ── SECTION 5: Danger Zone ── */}
        <motion.section {...fadeUp(5)}>
          <div style={{ marginBottom: 16 }}>
            <h2 style={{
              fontSize: 16, fontWeight: 700, color: "#ef4444",
              fontFamily: "var(--font-syne)", margin: "0 0 12px",
              letterSpacing: "-0.01em",
            }}>
              Subscription
            </h2>
            <div style={{ height: 1, backgroundColor: "rgba(239,68,68,0.16)" }} />
          </div>

          <div style={{
            ...CARD,
            backgroundColor: "rgba(239,68,68,0.03)",
            border: "1px solid rgba(239,68,68,0.14)",
            display: "flex", alignItems: "center",
            justifyContent: "space-between", gap: 24, flexWrap: "wrap",
          }}>
            <div>
              <p style={{
                fontSize: 14, fontWeight: 500, color: "rgba(255,255,255,0.8)",
                fontFamily: "var(--font-outfit)", margin: "0 0 4px",
              }}>
                Cancel Subscription
              </p>
              <p style={{
                fontSize: 12, color: "rgba(255,255,255,0.38)",
                fontFamily: "var(--font-outfit)", margin: 0, lineHeight: 1.55,
              }}>
                If you cancel, you'll lose access at the end of your billing period
              </p>
            </div>
            <button
              onClick={() => { setCancelModal(true); setCancelError(null); }}
              disabled={isCanceled || plan === "free"}
              style={{
                padding: "8px 18px", borderRadius: 7, fontSize: 13,
                fontFamily: "var(--font-outfit)", flexShrink: 0,
                backgroundColor: "transparent",
                color: isCanceled || plan === "free" ? "rgba(239,68,68,0.28)" : "#ef4444",
                border: `1px solid ${isCanceled || plan === "free" ? "rgba(239,68,68,0.1)" : "rgba(239,68,68,0.28)"}`,
                cursor: isCanceled || plan === "free" ? "not-allowed" : "pointer",
                transition: "background-color 0.15s ease",
              }}
              onMouseEnter={(e) => {
                if (!isCanceled && plan !== "free") {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(239,68,68,0.09)";
                }
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
              }}
            >
              {isCanceled ? "Cancellation Scheduled" : "Cancel Subscription"}
            </button>
          </div>
        </motion.section>

        {/* Footer */}
        <motion.div
          {...fadeUp(6)}
          style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 36 }}
        >
          <Check size={13} strokeWidth={2.5} color="#4ade80" aria-hidden="true" />
          <span style={{ fontSize: 12, color: "#4ade80", fontFamily: "var(--font-outfit)" }}>
            Changes saved automatically
          </span>
        </motion.div>
      </motion.div>

      {/* Cancel confirmation modal */}
      <AnimatePresence>
        {cancelModal && (
          <ConfirmModal
            onClose={() => setCancelModal(false)}
            onConfirm={handleCancel}
            confirming={canceling}
            error={cancelError}
          />
        )}
      </AnimatePresence>
    </>
  );
}
