"use client";

import { useState } from "react";
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-[#0e0e0e] border border-white/10 rounded-2xl p-8 w-full max-w-md mx-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white mb-1" style={{ fontFamily: "var(--font-syne)" }}>
              Upgrade Required
            </h2>
            <p className="text-gray-400 text-sm">
              This feature requires the{" "}
              <span className="text-[#ff5200] font-semibold capitalize">{requiredPlan}</span> plan or higher.
            </p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors ml-4 mt-0.5">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-3">
          {eligiblePlans.map(([key, plan]) => (
            <div key={key} className="flex items-center justify-between bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3">
              <div>
                <p className="text-white font-semibold">{plan.name}</p>
                <p className="text-gray-500 text-xs">
                  {plan.credits === 999999 ? "Unlimited" : plan.credits.toLocaleString()} credits/month
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-white font-bold">${plan.price}<span className="text-gray-500 font-normal text-sm">/mo</span></span>
                <button
                  onClick={() => handleUpgrade(key)}
                  disabled={loading === key}
                  className="nx-btn px-4 py-1.5 text-sm disabled:opacity-50"
                >
                  {loading === key ? "…" : "Select"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
