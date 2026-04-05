"use client";

import { useState } from "react";

export default function VerifyBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div
      className="flex items-start gap-3 px-4 py-3 rounded-xl"
      style={{
        backgroundColor: "rgba(255, 82, 0, 0.08)",
        border: "1px solid rgba(255, 82, 0, 0.2)",
        borderLeft: "3px solid #FF5200",
      }}
      role="alert"
    >
      {/* Warning icon */}
      <svg
        width="18"
        height="18"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        style={{ color: "#FF5200", flexShrink: 0, marginTop: "1px" }}
      >
        <path
          d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path
          d="M10 8v3M10 13.5v.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>

      {/* Message */}
      <p className="text-sm flex-1" style={{ color: "rgba(255,255,255,0.7)" }}>
        <span className="font-semibold" style={{ color: "rgba(255,255,255,0.9)" }}>
          Please verify your email
        </span>{" "}
        — check your inbox and click the confirmation link to activate your
        account.
      </p>

      {/* Dismiss button */}
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        style={{ color: "rgba(255,255,255,0.3)", flexShrink: 0 }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M12 4L4 12M4 4l8 8"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
}
