"use client";

import { useState, useEffect } from "react";
import { CreditCard, Loader2, X, AlertTriangle, Check } from "lucide-react";

type Sub = {
  plan: string;
  credits_used: number;
  credits_limit: number;
  current_period_end: string | null;
};

const cardStyle: React.CSSProperties = {
  backgroundColor: "#0e0e18",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: 10, padding: "20px 22px", marginBottom: 20,
};

function formatDate(ts: string | number | null): string {
  if (!ts) return "Unknown";
  const d = typeof ts === "number" ? new Date(ts * 1000) : new Date(ts);
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export default function BillingPage() {
  const [sub, setSub] = useState<Sub | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCancel, setShowCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelResult, setCancelResult] = useState<{ periodEnd: number | null } | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/subscription")
      .then((r) => r.json())
      .then((d) => { setSub(d.subscription ?? null); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function handleCancel() {
    setCancelling(true);
    setCancelError(null);
    try {
      const res = await fetch("/api/stripe/cancel-subscription", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setCancelError(data.error ?? "Failed to cancel. Please contact support.");
        return;
      }
      setCancelResult({ periodEnd: data.current_period_end ?? null });
      setShowCancel(false);
    } finally {
      setCancelling(false);
    }
  }

  const isFree = !sub || sub.plan === "free";
  const pct = sub ? Math.min(100, Math.round((sub.credits_used / sub.credits_limit) * 100)) : 0;
  const isUnlimited = sub?.credits_limit === 999999;

  return (
    <>
      <header style={{
        padding: "0 32px", height: 68,
        display: "flex", alignItems: "center",
        borderBottom: "1px solid rgba(255,255,255,0.055)",
        backgroundColor: "rgba(8,8,16,0.94)",
        backdropFilter: "blur(12px)",
        position: "sticky", top: 0, zIndex: 30,
      }}>
        <div>
          <h1 style={{ fontSize: 16, fontWeight: 500, color: "#fff", fontFamily: "var(--font-syne)", letterSpacing: "-0.02em", lineHeight: 1 }}>
            Billing
          </h1>
          <p style={{ fontSize: 11, color: "#383838", fontFamily: "var(--font-outfit)", marginTop: 3 }}>
            Manage your subscription and billing
          </p>
        </div>
      </header>

      <div style={{ padding: "28px 32px 64px", maxWidth: 560 }}>

        {cancelResult && (
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "10px 14px", borderRadius: 8, marginBottom: 20,
            backgroundColor: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.15)",
          }}>
            <Check size={13} strokeWidth={2} color="#4ade80" />
            <span style={{ fontSize: 13, color: "#4ade80", fontFamily: "var(--font-outfit)" }}>
              Subscription cancelled. Access continues until {formatDate(cancelResult.periodEnd)}.
            </span>
          </div>
        )}

        {cancelError && (
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "10px 14px", borderRadius: 8, marginBottom: 20,
            backgroundColor: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)",
          }}>
            <span style={{ fontSize: 13, color: "#f87171", fontFamily: "var(--font-outfit)" }}>{cancelError}</span>
          </div>
        )}

        {/* Current Plan */}
        <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.07em", textTransform: "uppercase", color: "#444", fontFamily: "var(--font-outfit)", marginBottom: 10 }}>
          Current Plan
        </p>
        <div style={cardStyle}>
          {loading ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#444" }}>
              <Loader2 size={14} style={{ animation: "spin 0.8s linear infinite" }} />
              <span style={{ fontSize: 13, fontFamily: "var(--font-outfit)" }}>Loading...</span>
            </div>
          ) : (
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <CreditCard size={15} strokeWidth={1.5} color="#555" />
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 500, color: "#ccc", fontFamily: "var(--font-outfit)" }}>
                      {sub?.plan ? sub.plan.charAt(0).toUpperCase() + sub.plan.slice(1) : "Free"} Plan
                    </p>
                    {sub?.current_period_end && (
                      <p style={{ fontSize: 12, color: "#555", fontFamily: "var(--font-outfit)" }}>
                        Renews {formatDate(sub.current_period_end)}
                      </p>
                    )}
                  </div>
                </div>
                <span style={{
                  fontSize: 9, fontWeight: 500, color: "#FF5200",
                  backgroundColor: "rgba(255,82,0,0.08)",
                  border: "1px solid rgba(255,82,0,0.18)",
                  borderRadius: 999, padding: "2px 7px",
                  fontFamily: "var(--font-outfit)", textTransform: "uppercase", letterSpacing: "0.05em",
                }}>
                  {sub?.plan ?? "free"}
                </span>
              </div>

              {/* Credit usage */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: "#555", fontFamily: "var(--font-outfit)" }}>Credits used</span>
                  <span style={{ fontSize: 12, color: "#888", fontFamily: "var(--font-outfit)" }}>
                    {sub?.credits_used ?? 0} / {isUnlimited ? "Unlimited" : (sub?.credits_limit ?? 10)}
                  </span>
                </div>
                {!isUnlimited && (
                  <div style={{ height: 3, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
                    <div style={{
                      height: "100%", borderRadius: 2,
                      width: `${pct}%`,
                      backgroundColor: pct >= 90 ? "#ef4444" : "#FF5200",
                      transition: "width 0.6s ease",
                    }} />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Cancel Subscription */}
        {!isFree && !cancelResult && (
          <>
            <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.07em", textTransform: "uppercase", color: "#444", fontFamily: "var(--font-outfit)", marginBottom: 10 }}>
              Subscription
            </p>
            <div style={{ ...cardStyle, border: "1px solid rgba(239,68,68,0.12)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                <div>
                  <p style={{ fontSize: 13, color: "#ccc", fontFamily: "var(--font-outfit)", marginBottom: 2 }}>Cancel subscription</p>
                  <p style={{ fontSize: 12, color: "#555", fontFamily: "var(--font-outfit)", lineHeight: 1.5 }}>
                    You will keep access until the end of your billing period.
                    {sub?.current_period_end && ` Access ends ${formatDate(sub.current_period_end)}.`}
                  </p>
                </div>
                <button
                  onClick={() => setShowCancel(true)}
                  style={{
                    padding: "6px 14px", borderRadius: 6, fontSize: 12,
                    fontFamily: "var(--font-outfit)", cursor: "pointer",
                    backgroundColor: "transparent", color: "#f87171",
                    border: "1px solid rgba(239,68,68,0.2)",
                    flexShrink: 0,
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </>
        )}

      </div>

      {/* Cancel Modal */}
      {showCancel && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setShowCancel(false); }}
          style={{
            position: "fixed", inset: 0, zIndex: 200,
            backgroundColor: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(6px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 24,
          }}
        >
          <div style={{
            backgroundColor: "#0e0e18",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 12, padding: "28px",
            width: "100%", maxWidth: 400,
            position: "relative",
          }}>
            <button
              onClick={() => setShowCancel(false)}
              style={{ position: "absolute", top: 14, right: 14, background: "none", border: "none", cursor: "pointer", color: "#555", display: "flex" }}
            >
              <X size={16} strokeWidth={1.75} />
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <AlertTriangle size={16} strokeWidth={1.5} color="#f59e0b" />
              <h2 style={{ fontSize: 15, fontWeight: 500, color: "#ddd", fontFamily: "var(--font-syne)" }}>
                Cancel subscription?
              </h2>
            </div>

            <p style={{ fontSize: 13, color: "#666", fontFamily: "var(--font-outfit)", lineHeight: 1.6, marginBottom: 20 }}>
              You will keep full access until{" "}
              <strong style={{ color: "#888" }}>
                {sub?.current_period_end ? formatDate(sub.current_period_end) : "the end of your billing period"}
              </strong>
              . After that, your account reverts to the free plan.
            </p>

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowCancel(false)}
                style={{ padding: "8px 16px", borderRadius: 6, fontSize: 12, fontFamily: "var(--font-outfit)", cursor: "pointer", backgroundColor: "transparent", color: "#666", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                Keep subscription
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 6, fontSize: 12, fontFamily: "var(--font-outfit)", cursor: cancelling ? "not-allowed" : "pointer", backgroundColor: "#ef4444", color: "#fff", border: "none", opacity: cancelling ? 0.6 : 1 }}
              >
                {cancelling && <Loader2 size={11} style={{ animation: "spin 0.8s linear infinite" }} />}
                {cancelling ? "Cancelling..." : "Yes, cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
