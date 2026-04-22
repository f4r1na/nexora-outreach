"use client";

import { useState, useEffect } from "react";
import { Check } from "lucide-react";

const PREFS_KEY = "nx-prefs-campaign-defaults";

const selectStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 12px",
  borderRadius: 6,
  backgroundColor: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "#ccc",
  fontFamily: "var(--font-outfit)",
  fontSize: 13,
  outline: "none",
  boxSizing: "border-box",
  cursor: "pointer",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 11,
  color: "#555",
  fontFamily: "var(--font-outfit)",
  marginBottom: 5,
};

export default function CampaignDefaults() {
  const [leadCount, setLeadCount] = useState("25");
  const [sendMode, setSendMode] = useState("review");
  const [autoFollowUps, setAutoFollowUps] = useState("no");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(PREFS_KEY);
      if (stored) {
        const p = JSON.parse(stored);
        setLeadCount(p.leadCount ?? "25");
        setSendMode(p.sendMode ?? "review");
        setAutoFollowUps(p.autoFollowUps ?? "no");
      }
    } catch { /* ignore */ }
  }, []);

  function handleSave() {
    localStorage.setItem(PREFS_KEY, JSON.stringify({ leadCount, sendMode, autoFollowUps }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {saved && (
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "9px 12px", borderRadius: 7,
          backgroundColor: "rgba(74,222,128,0.06)",
          border: "1px solid rgba(74,222,128,0.15)",
        }}>
          <Check size={12} color="#4ade80" strokeWidth={2} />
          <span style={{ fontSize: 12, color: "#4ade80", fontFamily: "var(--font-outfit)" }}>
            Campaign defaults saved.
          </span>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <div>
          <label style={labelStyle}>Default lead count</label>
          <select value={leadCount} onChange={(e) => setLeadCount(e.target.value)} style={selectStyle}>
            {["10", "25", "50", "100"].map((n) => (
              <option key={n} value={n}>{n} leads</option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Default send mode</label>
          <select value={sendMode} onChange={(e) => setSendMode(e.target.value)} style={selectStyle}>
            <option value="review">Review first</option>
            <option value="auto">Auto-send</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>Auto follow-ups</label>
          <select value={autoFollowUps} onChange={(e) => setAutoFollowUps(e.target.value)} style={selectStyle}>
            <option value="yes">Enabled</option>
            <option value="no">Disabled</option>
          </select>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
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
          Save defaults
        </button>
      </div>
    </div>
  );
}
