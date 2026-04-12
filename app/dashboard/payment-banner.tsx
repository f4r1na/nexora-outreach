"use client";

import { useState } from "react";

export default function PaymentBanner({ type }: { type: "success" | "canceled" }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  const isSuccess = type === "success";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        padding: "16px 20px",
        borderRadius: 12,
        marginBottom: 24,
        backgroundColor: isSuccess ? "rgba(255,82,0,0.08)" : "rgba(239,68,68,0.08)",
        border: `1px solid ${isSuccess ? "rgba(255,82,0,0.25)" : "rgba(239,68,68,0.2)"}`,
        borderLeft: `3px solid ${isSuccess ? "#FF5200" : "#ef4444"}`,
      }}
    >
      <p
        style={{
          fontSize: 14,
          fontFamily: "var(--font-outfit)",
          fontWeight: 500,
          color: isSuccess ? "#fff" : "#fca5a5",
          margin: 0,
          lineHeight: 1.5,
        }}
      >
        {isSuccess
          ? "Payment successful. Your plan has been upgraded."
          : "Payment was canceled. No charges were made."}
      </p>
      <button
        onClick={() => setDismissed(true)}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "rgba(255,255,255,0.35)",
          flexShrink: 0,
          padding: 4,
          lineHeight: 1,
          borderRadius: 4,
        }}
        aria-label="Dismiss"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
