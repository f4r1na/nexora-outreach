"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PLANS, PlanKey } from "@/lib/plans";

type Subscription = {
  plan: string;
  credits_used: number;
  credits_limit: number;
  current_period_end: string | null;
};

type GmailConnection = {
  gmail_email: string;
} | null;

const PLAN_COLORS: Record<string, string> = {
  free: "text-gray-400",
  starter: "text-blue-400",
  pro: "text-[#ff5200]",
  agency: "text-purple-400",
};

const PLAN_BG: Record<string, string> = {
  free: "bg-gray-800",
  starter: "bg-blue-900/30",
  pro: "bg-orange-900/30",
  agency: "bg-purple-900/30",
};

export default function SettingsPage() {
  const [sub, setSub] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [gmail, setGmail] = useState<GmailConnection>(undefined as unknown as GmailConnection);
  const [gmailLoading, setGmailLoading] = useState(true);
  const searchParams = useSearchParams();

  useEffect(() => {
    fetch("/api/subscription")
      .then((r) => r.json())
      .then((d) => { setSub(d.subscription); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetch("/api/auth/gmail/status")
      .then((r) => r.json())
      .then((d) => { setGmail(d.connection ?? null); setGmailLoading(false); })
      .catch(() => setGmailLoading(false));
  }, [searchParams]);

  async function handleUpgrade(plan: string) {
    setUpgrading(plan);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const text = await res.text();
      console.log("Response:", text);
      const data = JSON.parse(text);
      if (data.url) window.location.href = data.url;
      else alert("Error: " + (data.error || "Unknown error"));
    } catch (err) {
      console.error("Checkout error:", err);
      alert("Something went wrong. Check console.");
    } finally {
      setUpgrading(null);
    }
  }

  const currentPlan = sub?.plan ?? "free";
  const creditsUsed = sub?.credits_used ?? 0;
  const creditsLimit = sub?.credits_limit ?? 10;
  const pct = Math.min(100, Math.round((creditsUsed / creditsLimit) * 100));

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: "var(--font-syne)" }}>
        Settings
      </h1>
      <p className="text-gray-500 text-sm mb-8">Manage your plan and usage</p>

      {/* Current Plan */}
      <div className={`rounded-xl border border-white/10 p-6 mb-6 ${PLAN_BG[currentPlan] ?? "bg-gray-800"}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Current Plan</p>
            <p className={`text-2xl font-bold capitalize ${PLAN_COLORS[currentPlan] ?? "text-white"}`}
               style={{ fontFamily: "var(--font-syne)" }}>
              {loading ? "…" : currentPlan}
            </p>
          </div>
          {sub?.current_period_end && (
            <p className="text-xs text-gray-500">
              Renews {new Date(sub.current_period_end).toLocaleDateString()}
            </p>
          )}
        </div>

        {/* Credits bar */}
        <div>
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Credits used</span>
            <span>{loading ? "…" : `${creditsUsed} / ${creditsLimit === 999999 ? "∞" : creditsLimit}`}</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${creditsLimit === 999999 ? 5 : pct}%`,
                background: pct >= 90 ? "#ef4444" : "#ff5200",
              }}
            />
          </div>
          {pct >= 90 && creditsLimit !== 999999 && (
            <p className="text-xs text-red-400 mt-1">Running low — upgrade to continue</p>
          )}
        </div>
      </div>

      {/* Gmail Integration */}
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Integrations</h2>
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-white font-semibold mb-1" style={{ fontFamily: "var(--font-syne)" }}>Gmail</p>
            <p className="text-gray-400 text-sm">Connect your Gmail to send campaigns automatically</p>
          </div>
          {gmailLoading ? (
            <div className="w-28 h-9 bg-white/10 rounded-lg animate-pulse" />
          ) : (currentPlan === "pro" || currentPlan === "agency") ? (
            gmail ? (
              <div className="flex items-center gap-2 text-green-400 text-sm">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>{gmail.gmail_email}</span>
              </div>
            ) : (
              <a
                href="/api/auth/gmail"
                className="nx-btn px-4 py-2 text-sm"
              >
                Connect Gmail →
              </a>
            )
          ) : (
            <div className="flex flex-col items-end gap-2">
              <span className="text-xs text-gray-500">Pro / Agency only</span>
              <a
                href="/dashboard/settings"
                className="px-4 py-2 text-sm rounded-lg border border-white/20 text-gray-400 hover:border-white/40 transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  const el = document.getElementById("plans-section");
                  el?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                Upgrade to Pro
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Plans */}
      <h2 id="plans-section" className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Available Plans</h2>
      <div className="grid grid-cols-1 gap-4">
        {(Object.entries(PLANS) as [PlanKey, typeof PLANS[keyof typeof PLANS]][]).map(([key, plan]) => {
          const isCurrent = currentPlan === key;
          const isDowngrade = ["starter", "pro", "agency"].indexOf(key) <
            ["starter", "pro", "agency"].indexOf(currentPlan as string);
          return (
            <div
              key={key}
              className={`rounded-xl border p-5 flex items-center justify-between transition-all ${
                isCurrent
                  ? "border-[#ff5200] bg-orange-900/10"
                  : "border-white/10 bg-white/[0.02] hover:border-white/20"
              }`}
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white font-semibold" style={{ fontFamily: "var(--font-syne)" }}>
                    {plan.name}
                  </span>
                  {isCurrent && (
                    <span className="text-xs bg-[#ff5200]/20 text-[#ff5200] px-2 py-0.5 rounded-full">Current</span>
                  )}
                </div>
                <p className="text-gray-400 text-sm">
                  {plan.credits === 999999 ? "Unlimited" : String(plan.credits)} credits/month
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-white font-bold text-lg">${plan.price}<span className="text-gray-500 text-sm font-normal">/mo</span></span>
                {!isCurrent && !isDowngrade && (
                  <button
                    onClick={() => handleUpgrade(key)}
                    disabled={upgrading === key}
                    className="nx-btn px-4 py-2 text-sm disabled:opacity-50"
                  >
                    {upgrading === key ? "Processing..." : "Upgrade"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
