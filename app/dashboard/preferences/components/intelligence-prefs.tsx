"use client";

import { useState, useEffect } from "react";
import { Check } from "lucide-react";

const PREFS_KEY = "nx-prefs-intelligence";

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      aria-pressed={enabled}
      style={{
        display: "inline-flex", alignItems: "center",
        width: 40, height: 22,
        borderRadius: 4,
        backgroundColor: enabled ? "rgba(255,82,0,0.15)" : "rgba(255,255,255,0.05)",
        border: `1px solid ${enabled ? "rgba(255,82,0,0.3)" : "rgba(255,255,255,0.08)"}`,
        cursor: "pointer",
        padding: "0 3px",
        transition: "background-color 0.15s ease, border-color 0.15s ease",
        flexShrink: 0,
        position: "relative",
      }}
    >
      <div style={{
        width: 14, height: 14,
        borderRadius: 3,
        backgroundColor: enabled ? "#FF5200" : "rgba(255,255,255,0.2)",
        transform: `translateX(${enabled ? 18 : 0}px)`,
        transition: "transform 0.15s ease, background-color 0.15s ease",
      }} />
    </button>
  );
}

export default function IntelligencePrefs() {
  const [campaignIQ, setCampaignIQ] = useState(true);
  const [timingIntel, setTimingIntel] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(PREFS_KEY);
      if (stored) {
        const p = JSON.parse(stored);
        setCampaignIQ(p.campaignIQ ?? true);
        setTimingIntel(p.timingIntel ?? true);
      }
    } catch { /* ignore */ }
  }, []);

  function handleSave() {
    localStorage.setItem(PREFS_KEY, JSON.stringify({ campaignIQ, timingIntel }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const row = (
    label: string,
    desc: string,
    value: boolean,
    onChange: (v: boolean) => void,
  ) => (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
      padding: "12px 0",
      borderBottom: "1px solid rgba(255,255,255,0.04)",
    }}>
      <div>
        <p style={{ fontSize: 13, color: "#ccc", fontFamily: "var(--font-outfit)", marginBottom: 2 }}>
          {label}
        </p>
        <p style={{ fontSize: 12, color: "#555", fontFamily: "var(--font-outfit)" }}>
          {desc}
        </p>
      </div>
      <Toggle enabled={value} onChange={onChange} />
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {saved && (
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "9px 12px", borderRadius: 7, marginBottom: 8,
          backgroundColor: "rgba(74,222,128,0.06)",
          border: "1px solid rgba(74,222,128,0.15)",
        }}>
          <Check size={12} color="#4ade80" strokeWidth={2} />
          <span style={{ fontSize: 12, color: "#4ade80", fontFamily: "var(--font-outfit)" }}>
            Intelligence preferences saved.
          </span>
        </div>
      )}

      {row(
        "Campaign IQ",
        "AI analyzes campaign performance to suggest improvements",
        campaignIQ,
        setCampaignIQ,
      )}
      {row(
        "Timing Intelligence",
        "Optimize send times based on recipient patterns",
        timingIntel,
        setTimingIntel,
      )}

      <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 14 }}>
        <button
          onClick={handleSave}
          style={{
            padding: "8px 18px",
            backgroundColor: "#FF5200", color: "#fff",
            borderRadius: 6, border: "none", fontSize: 12,
            fontFamily: "var(--font-outfit)", fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Save preferences
        </button>
      </div>
    </div>
  );
}
