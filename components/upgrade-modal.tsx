"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PLANS, PlanKey } from "@/lib/plans";

type Props = {
  requiredPlan: PlanKey;
  onClose: () => void;
};

const PLAN_ORDER: PlanKey[] = ["free", "starter", "pro", "agency"];

export function UpgradeModal({ requiredPlan, onClose }: Props) {
  const [loading, setLoading] = useState<string | null>(null);

  async function handleUpgrade(plan: string) {
    setLoading(plan);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } finally {
      setLoading(null);
    }
  }

  const eligiblePlans = (Object.entries(PLANS) as [PlanKey, typeof PLANS[keyof typeof PLANS]][]).filter(
    ([key]) => PLAN_ORDER.indexOf(key) >= PLAN_ORDER.indexOf(requiredPlan)
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      style={{
        position: "fixed", inset: 0, zIndex: 50,
        display: "flex", alignItems: "center", justifyContent: "center",
        backgroundColor: "rgba(0,0,0,0.72)", backdropFilter: "blur(6px)",
        padding: 16,
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 4 }}
        transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
        style={{
          backgroundColor: "#0e0e0e",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 10,
          padding: 28,
          width: "100%",
          maxWidth: 420,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 22 }}>
          <div>
            <h2 style={{
              fontSize: 15, fontWeight: 500, color: "#fff",
              fontFamily: "var(--font-syne)", marginBottom: 4,
            }}>
              Upgrade required
            </h2>
            <p style={{ fontSize: 12, color: "#555", fontFamily: "var(--font-outfit)" }}>
              This feature requires the{" "}
              <span style={{ color: "#FF5200" }}>{requiredPlan}</span> plan or higher.
            </p>
          </div>
          <button
            onClick={onClose}
            className="btn-ghost"
            style={{
              background: "none", border: "none", color: "#444",
              cursor: "pointer", padding: 4, marginLeft: 12, flexShrink: 0,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {eligiblePlans.map(([key, plan]) => (
            <div key={key} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              backgroundColor: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 8, padding: "12px 14px",
            }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 500, color: "#ccc", fontFamily: "var(--font-outfit)", marginBottom: 1 }}>
                  {plan.name}
                </p>
                <p style={{ fontSize: 11, color: "#484848", fontFamily: "var(--font-outfit)" }}>
                  {plan.credits === 999999 ? "Unlimited" : plan.credits.toLocaleString()} credits/month
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                <span style={{ fontSize: 14, fontWeight: 500, color: "#888", fontFamily: "var(--font-syne)" }}>
                  ${plan.price}
                  <span style={{ fontSize: 11, fontWeight: 400, color: "#484848" }}>/mo</span>
                </span>
                <button
                  onClick={() => handleUpgrade(key)}
                  disabled={loading === key}
                  className="btn-primary"
                  style={{
                    padding: "6px 14px",
                    backgroundColor: "#FF5200", color: "#fff",
                    borderRadius: 6, border: "none",
                    fontSize: 12, fontFamily: "var(--font-outfit)",
                    cursor: loading === key ? "not-allowed" : "pointer",
                    opacity: loading === key ? 0.5 : 1,
                  }}
                >
                  {loading === key ? "…" : "Select"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
