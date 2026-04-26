"use client";

import { useState } from "react";

type Props = {
  campaignId: string;
  initialDelays: [number, number, number];
  initialEnabled: boolean;
  locked: boolean;
};

const LABELS = ["Friendly bump", "Different angle", "Graceful breakup"];

export default function FollowupConfig({ campaignId, initialDelays, initialEnabled, locked }: Props) {
  const [delays, setDelays] = useState<[number, number, number]>(initialDelays);
  const [enabled, setEnabled] = useState(initialEnabled);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function save(next: { delays?: [number, number, number]; enabled?: boolean }) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          follow_up_delays: next.delays ?? delays,
          follow_ups_enabled: next.enabled ?? enabled,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      setSavedAt(Date.now());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  function setDelay(idx: number, raw: number) {
    const val = Math.max(1, Math.min(30, raw));
    const next = [...delays] as [number, number, number];
    next[idx] = val;
    setDelays(next);
    save({ delays: next });
  }

  function toggleEnabled() {
    const next = !enabled;
    setEnabled(next);
    save({ enabled: next });
  }

  return (
    <div style={{
      backgroundColor: "#0e0e0e",
      border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: 10,
      padding: "20px 22px",
      marginTop: 16,
      opacity: locked ? 0.55 : 1,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <p className="nx-section-label" style={{ margin: 0 }}>
          Follow-up settings
        </p>
        <label style={{ display: "inline-flex", alignItems: "center", gap: 8, cursor: locked ? "not-allowed" : "pointer" }}>
          <span style={{ fontSize: 11, color: "#666", fontFamily: "var(--font-outfit)" }}>
            {enabled ? "Enabled" : "Disabled"}
          </span>
          <input
            type="checkbox"
            checked={enabled}
            disabled={locked || saving}
            onChange={toggleEnabled}
            style={{ accentColor: "#FF5200", cursor: locked ? "not-allowed" : "pointer" }}
          />
        </label>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {[0, 1, 2].map((idx) => (
          <div key={idx} style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{
              width: 22, height: 22, borderRadius: 6,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 500, fontFamily: "var(--font-outfit)",
              backgroundColor: "rgba(255,255,255,0.04)", color: "#666",
              border: "1px solid rgba(255,255,255,0.06)", flexShrink: 0,
            }}>{idx + 1}</span>
            <span style={{ flex: 1, fontSize: 12.5, color: "#aaa", fontFamily: "var(--font-outfit)" }}>
              {LABELS[idx]}
            </span>
            <span style={{ fontSize: 11, color: "#555", fontFamily: "var(--font-outfit)" }}>after</span>
            <input
              type="number"
              min={1}
              max={30}
              value={delays[idx]}
              disabled={locked || !enabled || saving}
              onChange={(e) => setDelay(idx, parseInt(e.target.value) || 1)}
              style={{
                width: 48, padding: "4px 8px", textAlign: "center",
                backgroundColor: "#060606",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 6, color: "#fff", fontSize: 13,
                fontFamily: "var(--font-outfit)",
              }}
            />
            <span style={{ fontSize: 11, color: "#555", fontFamily: "var(--font-outfit)", width: 32 }}>days</span>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 12, minHeight: 14, fontSize: 11, fontFamily: "var(--font-outfit)" }}>
        {error ? (
          <span style={{ color: "#f87171" }}>{error}</span>
        ) : saving ? (
          <span style={{ color: "#666" }}>Saving…</span>
        ) : savedAt ? (
          <span style={{ color: "#4ade80" }}>Saved</span>
        ) : locked ? (
          <span style={{ color: "#555" }}>Settings locked — campaign already sent.</span>
        ) : null}
      </div>
    </div>
  );
}
