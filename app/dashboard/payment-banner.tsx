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
        gap: 12,
        padding: "12px 18px",
        borderRadius: 10,
        marginBottom: 20,
        backgroundColor: isSuccess ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
        border: `1px solid ${isSuccess ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)"}`,
      }}
    >
      <p
        style={{
          fontSize: 14,
          fontFamily: "var(--font-outfit)",
          color: isSuccess ? "#4ade80" : "#f87171",
          margin: 0,
        }}
      >
        {isSuccess
          ? "Welcome to Starter! Your plan is now active."
          : "Payment canceled. No charge was made."}
      </p>
      <button
        onClick={() => setDismissed(true)}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: isSuccess ? "#4ade80" : "#f87171",
          opacity: 0.7,
          flexShrink: 0,
          padding: 0,
          lineHeight: 1,
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
