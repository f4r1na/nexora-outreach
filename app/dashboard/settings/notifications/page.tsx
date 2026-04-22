"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Check, Loader2 } from "lucide-react";

const cardStyle: React.CSSProperties = {
  backgroundColor: "#0e0e18",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: 10, padding: "0 22px", marginBottom: 20,
  overflow: "hidden",
};

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      aria-pressed={enabled}
      style={{
        display: "inline-flex", alignItems: "center",
        width: 40, height: 22, borderRadius: 4,
        backgroundColor: enabled ? "rgba(255,82,0,0.15)" : "rgba(255,255,255,0.05)",
        border: `1px solid ${enabled ? "rgba(255,82,0,0.3)" : "rgba(255,255,255,0.08)"}`,
        cursor: "pointer", padding: "0 3px",
        transition: "background-color 0.15s ease, border-color 0.15s ease",
        flexShrink: 0,
      }}
    >
      <div style={{
        width: 14, height: 14, borderRadius: 3,
        backgroundColor: enabled ? "#FF5200" : "rgba(255,255,255,0.2)",
        transform: `translateX(${enabled ? 18 : 0}px)`,
        transition: "transform 0.15s ease, background-color 0.15s ease",
      }} />
    </button>
  );
}

type Prefs = {
  notif_replies: boolean;
  notif_digest: boolean;
  notif_launches: boolean;
  notif_credits: boolean;
};

const DEFAULTS: Prefs = {
  notif_replies: true,
  notif_digest: false,
  notif_launches: true,
  notif_credits: true,
};

const ROWS: { key: keyof Prefs; label: string; desc: string }[] = [
  { key: "notif_replies", label: "New reply alerts", desc: "Email when a lead replies to your campaign" },
  { key: "notif_digest", label: "Daily digest", desc: "Summary of opens, clicks, and replies every morning" },
  { key: "notif_launches", label: "Campaign confirmations", desc: "Email when a campaign launches or completes" },
  { key: "notif_credits", label: "Low credit warnings", desc: "Alert when you have fewer than 20% credits remaining" },
];

export default function NotificationsPage() {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.user_metadata) {
        setPrefs({
          notif_replies: user.user_metadata.notif_replies ?? DEFAULTS.notif_replies,
          notif_digest: user.user_metadata.notif_digest ?? DEFAULTS.notif_digest,
          notif_launches: user.user_metadata.notif_launches ?? DEFAULTS.notif_launches,
          notif_credits: user.user_metadata.notif_credits ?? DEFAULTS.notif_credits,
        });
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  function set(key: keyof Prefs, value: boolean) {
    setPrefs((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      const supabase = createClient();
      await supabase.auth.updateUser({ data: prefs });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  }

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
            Notifications
          </h1>
          <p style={{ fontSize: 11, color: "#383838", fontFamily: "var(--font-outfit)", marginTop: 3 }}>
            Control which emails you receive from Nexora
          </p>
        </div>
      </header>

      <div style={{ padding: "28px 32px 64px", maxWidth: 560 }}>

        <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.07em", textTransform: "uppercase", color: "#444", fontFamily: "var(--font-outfit)", marginBottom: 10 }}>
          Email Notifications
        </p>

        {loading ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "20px 0", color: "#444" }}>
            <Loader2 size={14} style={{ animation: "spin 0.8s linear infinite" }} />
            <span style={{ fontSize: 13, fontFamily: "var(--font-outfit)" }}>Loading preferences...</span>
          </div>
        ) : (
          <div style={cardStyle}>
            {ROWS.map(({ key, label, desc }, i) => (
              <div
                key={key}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
                  padding: "16px 0",
                  borderBottom: i < ROWS.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                }}
              >
                <div>
                  <p style={{ fontSize: 13, color: "#ccc", fontFamily: "var(--font-outfit)", marginBottom: 2 }}>{label}</p>
                  <p style={{ fontSize: 12, color: "#555", fontFamily: "var(--font-outfit)" }}>{desc}</p>
                </div>
                <Toggle enabled={prefs[key]} onChange={(v) => set(key, v)} />
              </div>
            ))}
          </div>
        )}

        {saved && (
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "9px 12px", borderRadius: 7, marginBottom: 14,
            backgroundColor: "rgba(74,222,128,0.06)",
            border: "1px solid rgba(74,222,128,0.15)",
          }}>
            <Check size={12} color="#4ade80" strokeWidth={2} />
            <span style={{ fontSize: 12, color: "#4ade80", fontFamily: "var(--font-outfit)" }}>
              Preferences saved.
            </span>
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving || loading}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "9px 20px",
            backgroundColor: "#FF5200", color: "#fff",
            borderRadius: 6, border: "none", fontSize: 12,
            fontFamily: "var(--font-outfit)", fontWeight: 500,
            cursor: saving ? "not-allowed" : "pointer",
            opacity: saving ? 0.6 : 1,
          }}
        >
          {saving && <Loader2 size={11} style={{ animation: "spin 0.8s linear infinite" }} />}
          {saving ? "Saving..." : "Save preferences"}
        </button>

      </div>
    </>
  );
}
