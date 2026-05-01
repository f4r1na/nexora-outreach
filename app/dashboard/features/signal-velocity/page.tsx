"use client";

import { useState, useEffect, useCallback, useId } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Copy, Check as CheckIcon } from "lucide-react";
import SectionHeader from "@/app/dashboard/settings/_components/SectionHeader";
import SaveStatus from "@/app/dashboard/settings/_components/SaveStatus";
import FormCheckbox from "@/app/dashboard/settings/_components/FormCheckbox";
import FormSelect from "@/app/dashboard/settings/_components/FormSelect";

const EASE = [0.23, 1, 0.32, 1] as const;

function fadeUp(i: number) {
  return {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { delay: i * 0.07, duration: 0.26, ease: EASE },
  };
}

// ─── Toggle ───────────────────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      style={{
        position: "relative",
        width: 38,
        height: 22,
        borderRadius: 11,
        backgroundColor: checked ? "#FF5200" : "rgba(255,255,255,0.12)",
        border: "none",
        cursor: "pointer",
        padding: 0,
        flexShrink: 0,
        transition: "background-color 0.2s ease",
        outline: "none",
      }}
    >
      <motion.div
        animate={{ x: checked ? 18 : 3 }}
        transition={{ type: "spring", stiffness: 420, damping: 32 }}
        style={{
          position: "absolute",
          top: 3,
          left: 0,
          width: 16,
          height: 16,
          borderRadius: "50%",
          backgroundColor: "#fff",
          boxShadow: "0 1px 4px rgba(0,0,0,0.35)",
        }}
      />
    </button>
  );
}

// ─── ToggleRow ────────────────────────────────────────────────────────────────

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div
      style={{
        backgroundColor: "rgba(255,255,255,0.05)",
        borderRadius: 8,
        padding: 16,
        display: "flex",
        alignItems: description ? "flex-start" : "center",
        justifyContent: "space-between",
        gap: 16,
      }}
    >
      <div>
        <p
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: "rgba(255,255,255,0.85)",
            fontFamily: "var(--font-outfit)",
            margin: 0,
            lineHeight: 1.4,
          }}
        >
          {label}
        </p>
        {description && (
          <p
            style={{
              fontSize: 11.5,
              color: "rgba(255,255,255,0.35)",
              fontFamily: "var(--font-outfit)",
              margin: "3px 0 0",
              lineHeight: 1.5,
            }}
          >
            {description}
          </p>
        )}
      </div>
      <Toggle checked={checked} onChange={onChange} label={label} />
    </div>
  );
}

// ─── TimeInput ────────────────────────────────────────────────────────────────

function TimeInput({
  value,
  onChange,
  onBlur,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  label: string;
}) {
  const id = useId();
  const [focused, setFocused] = useState(false);

  return (
    <div>
      <label
        htmlFor={id}
        style={{
          display: "block",
          fontSize: 11,
          color: "rgba(255,255,255,0.4)",
          fontFamily: "var(--font-outfit)",
          marginBottom: 5,
          letterSpacing: "0.04em",
        }}
      >
        {label}
      </label>
      <input
        id={id}
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          onBlur?.();
        }}
        style={{
          padding: "7px 10px",
          borderRadius: 6,
          backgroundColor: "#060606",
          border: `1px solid ${focused ? "#FF5200" : "rgba(255,255,255,0.1)"}`,
          color: "#fff",
          fontSize: 13,
          fontFamily: "var(--font-outfit)",
          outline: "none",
          transition: "border-color 0.15s ease",
          colorScheme: "dark",
        } as React.CSSProperties}
      />
    </div>
  );
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const THRESHOLD_OPTIONS = [
  { value: "high",   label: "HIGH (>90%)" },
  { value: "medium", label: "MEDIUM (>70%)" },
  { value: "all",    label: "ALL" },
];

const TEMPLATE_OPTIONS = [
  { value: "professional", label: "Professional" },
  { value: "casual",       label: "Casual" },
  { value: "urgent",       label: "Urgent" },
  { value: "balanced",     label: "Balanced" },
  { value: "custom",       label: "Custom" },
];

const AUTO_SEND_OPTIONS = [
  { value: "high_only",    label: "HIGH only" },
  { value: "high_medium",  label: "HIGH + MEDIUM" },
  { value: "ask",          label: "Always ask first" },
];

const ALERT_HISTORY = [
  { date: "Apr 30, 2026 02:15 PM", signal: "Hiring VP of Eng",  company: "TechCorp", confidence: "HIGH"   },
  { date: "Apr 30, 2026 01:42 PM", signal: "Series B Funding",  company: "StartupX", confidence: "HIGH"   },
  { date: "Apr 29, 2026 11:20 AM", signal: "React 18 Upgrade",  company: "WebCo",    confidence: "MEDIUM" },
];

const WEBHOOK_URL = "https://api.nexoraoutreach.com/webhooks/alerts";

const WEBHOOK_EXAMPLE = `{
  "event": "signal.detected",
  "company": "TechCorp",
  "signal_type": "hiring",
  "confidence": "HIGH",
  "headline": "TechCorp is hiring a VP of Engineering",
  "timestamp": "2026-04-30T14:15:00Z",
  "source_url": "https://techcrunch.com/..."
}`;

interface Settings {
  alerts_enabled:     boolean;
  alert_threshold:    string;
  channel_email:      boolean;
  channel_inapp:      boolean;
  channel_slack:      boolean;
  quiet_hours:        boolean;
  quiet_from:         string;
  quiet_to:           string;
  auto_campaign:      boolean;
  campaign_template:  string;
  auto_send_threshold: string;
  webhooks_enabled:   boolean;
}

const DEFAULTS: Settings = {
  alerts_enabled:      true,
  alert_threshold:     "high",
  channel_email:       true,
  channel_inapp:       true,
  channel_slack:       true,
  quiet_hours:         false,
  quiet_from:          "09:00",
  quiet_to:            "18:00",
  auto_campaign:       false,
  campaign_template:   "professional",
  auto_send_threshold: "ask",
  webhooks_enabled:    false,
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SignalVelocityPage() {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState<string | undefined>();
  const [saveTimestamp, setSaveTimestamp] = useState<Date | undefined>();

  // Load from supabase user metadata
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.user_metadata) {
        const m = user.user_metadata;
        setSettings({
          alerts_enabled:      m.sv_alerts_enabled      ?? DEFAULTS.alerts_enabled,
          alert_threshold:     m.sv_alert_threshold     ?? DEFAULTS.alert_threshold,
          channel_email:       m.sv_channel_email       ?? DEFAULTS.channel_email,
          channel_inapp:       m.sv_channel_inapp       ?? DEFAULTS.channel_inapp,
          channel_slack:       m.sv_channel_slack       ?? DEFAULTS.channel_slack,
          quiet_hours:         m.sv_quiet_hours         ?? DEFAULTS.quiet_hours,
          quiet_from:          m.sv_quiet_from          ?? DEFAULTS.quiet_from,
          quiet_to:            m.sv_quiet_to            ?? DEFAULTS.quiet_to,
          auto_campaign:       m.sv_auto_campaign       ?? DEFAULTS.auto_campaign,
          campaign_template:   m.sv_campaign_template   ?? DEFAULTS.campaign_template,
          auto_send_threshold: m.sv_auto_send_threshold ?? DEFAULTS.auto_send_threshold,
          webhooks_enabled:    m.sv_webhooks_enabled    ?? DEFAULTS.webhooks_enabled,
        });
      }
    }).finally(() => setLoading(false));
  }, []);

  const save = useCallback(async (patch: Record<string, unknown>) => {
    setSaveStatus("saving");
    setSaveError(undefined);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ data: patch });
      if (error) {
        setSaveError(error.message);
        setSaveStatus("error");
      } else {
        setSaveTimestamp(new Date());
        setSaveStatus("saved");
      }
    } catch {
      setSaveError("Failed to save");
      setSaveStatus("error");
    }
  }, []);

  function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSettings((s) => ({ ...s, [key]: value }));
  }

  function autoSaveToggle(key: keyof Settings, value: boolean) {
    update(key, value as Settings[typeof key]);
    save({ [`sv_${key}`]: value });
  }

  function autoSaveSelect(key: keyof Settings, value: string) {
    update(key, value as Settings[typeof key]);
    save({ [`sv_${key}`]: value });
  }

  async function handleSaveAll() {
    const patch: Record<string, unknown> = {};
    (Object.keys(settings) as (keyof Settings)[]).forEach((k) => {
      patch[`sv_${k}`] = settings[k];
    });
    await save(patch);
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(WEBHOOK_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: silently ignore
    }
  }

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", paddingTop: 80 }}>
        <Loader2
          size={20}
          color="rgba(255,255,255,0.25)"
          style={{ animation: "spin 0.8s linear infinite" }}
        />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      style={{ maxWidth: 900, paddingBottom: 80 }}
    >
      {/* ── Page header ── */}
      <motion.div {...fadeUp(0)} style={{ marginBottom: 40 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "#fff",
              fontFamily: "var(--font-syne)",
              letterSpacing: "-0.02em",
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            Signal Velocity Alerts
          </h1>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.08em",
              color: "#FF5200",
              backgroundColor: "rgba(255,82,0,0.12)",
              border: "1px solid rgba(255,82,0,0.3)",
              borderRadius: 4,
              padding: "2px 7px",
              fontFamily: "var(--font-outfit)",
              lineHeight: 1,
              alignSelf: "center",
            }}
          >
            BETA
          </span>
        </div>
        <p
          style={{
            fontSize: 13,
            color: "rgba(255,255,255,0.45)",
            fontFamily: "var(--font-outfit)",
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          Real-time alerts when signals match your ICP
        </p>
      </motion.div>

      {/* ── SECTION 1: Alert Configuration ── */}
      <motion.section {...fadeUp(1)} style={{ marginBottom: 48 }}>
        <SectionHeader
          title="Alert Configuration"
          description="Control when you get notified about hot signals"
          divider
        />
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Enable Alerts */}
          <motion.div {...fadeUp(2)}>
            <FormCheckbox
              label="Turn on real-time alerts"
              description="Get notified immediately when signals match your ICP"
              checked={settings.alerts_enabled}
              onChange={(v) => autoSaveToggle("alerts_enabled", v)}
            />
          </motion.div>

          {/* Alert Threshold */}
          <motion.div {...fadeUp(3)}>
            <FormSelect
              label="Notify me when confidence is:"
              options={THRESHOLD_OPTIONS}
              value={settings.alert_threshold}
              onChange={(v) => autoSaveSelect("alert_threshold", v)}
            />
          </motion.div>

          {/* Alert Channels */}
          <motion.div {...fadeUp(4)}>
            <div
              style={{
                backgroundColor: "rgba(255,255,255,0.05)",
                borderRadius: 8,
                padding: 16,
              }}
            >
              <p
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: "rgba(255,255,255,0.7)",
                  fontFamily: "var(--font-outfit)",
                  margin: "0 0 12px",
                }}
              >
                Alert Channels
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    cursor: "pointer",
                    padding: "6px 0",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={settings.channel_email}
                    onChange={(e) => autoSaveToggle("channel_email", e.target.checked)}
                    style={{ accentColor: "#FF5200", width: 15, height: 15, cursor: "pointer" }}
                  />
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", fontFamily: "var(--font-outfit)" }}>
                    Email notifications
                  </span>
                </label>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    cursor: "pointer",
                    padding: "6px 0",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={settings.channel_inapp}
                    onChange={(e) => autoSaveToggle("channel_inapp", e.target.checked)}
                    style={{ accentColor: "#FF5200", width: 15, height: 15, cursor: "pointer" }}
                  />
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", fontFamily: "var(--font-outfit)" }}>
                    In-app notifications
                  </span>
                </label>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    cursor: "pointer",
                    padding: "6px 0",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={settings.channel_slack}
                    onChange={(e) => autoSaveToggle("channel_slack", e.target.checked)}
                    style={{ accentColor: "#FF5200", width: 15, height: 15, cursor: "pointer" }}
                  />
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", fontFamily: "var(--font-outfit)" }}>
                    Slack{" "}
                    <span style={{ fontSize: 11.5, color: "rgba(255,255,255,0.35)" }}>
                      (if connected)
                    </span>
                  </span>
                </label>
              </div>
            </div>
          </motion.div>

          {/* Quiet Hours */}
          <motion.div {...fadeUp(5)}>
            <div
              style={{
                backgroundColor: "rgba(255,255,255,0.05)",
                borderRadius: 8,
                padding: 16,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: 16,
                  marginBottom: settings.quiet_hours ? 18 : 0,
                }}
              >
                <div>
                  <p
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: "rgba(255,255,255,0.85)",
                      fontFamily: "var(--font-outfit)",
                      margin: 0,
                      lineHeight: 1.4,
                    }}
                  >
                    Enable quiet hours
                  </p>
                  <p
                    style={{
                      fontSize: 11.5,
                      color: "rgba(255,255,255,0.35)",
                      fontFamily: "var(--font-outfit)",
                      margin: "3px 0 0",
                      lineHeight: 1.5,
                    }}
                  >
                    Don&apos;t send alerts outside these hours
                  </p>
                </div>
                <Toggle
                  checked={settings.quiet_hours}
                  onChange={(v) => autoSaveToggle("quiet_hours", v)}
                  label="Enable quiet hours"
                />
              </div>

              <AnimatePresence>
                {settings.quiet_hours && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: "auto", marginTop: 4 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    transition={{ duration: 0.2, ease: EASE }}
                    style={{ overflow: "hidden" }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 12 }}>
                      <TimeInput
                        value={settings.quiet_from}
                        onChange={(v) => update("quiet_from", v)}
                        onBlur={() => save({ sv_quiet_from: settings.quiet_from })}
                        label="From"
                      />
                      <span
                        style={{
                          fontSize: 13,
                          color: "rgba(255,255,255,0.3)",
                          fontFamily: "var(--font-outfit)",
                          paddingBottom: 8,
                        }}
                      >
                        to
                      </span>
                      <TimeInput
                        value={settings.quiet_to}
                        onChange={(v) => update("quiet_to", v)}
                        onBlur={() => save({ sv_quiet_to: settings.quiet_to })}
                        label="To"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* ── SECTION 2: Auto-Campaign Creation ── */}
      <motion.section {...fadeUp(6)} style={{ marginBottom: 48 }}>
        <SectionHeader
          title="Auto-Campaign Creation"
          description="Automatically create campaigns for hot signals"
          divider
        />
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Auto-Create toggle */}
          <motion.div {...fadeUp(7)}>
            <ToggleRow
              label="Create campaign automatically when signal detected"
              description="If enabled, a new campaign will be created automatically"
              checked={settings.auto_campaign}
              onChange={(v) => autoSaveToggle("auto_campaign", v)}
            />
          </motion.div>

          {/* Campaign Template */}
          <motion.div {...fadeUp(8)}>
            <FormSelect
              label="Use email template:"
              options={TEMPLATE_OPTIONS}
              value={settings.campaign_template}
              onChange={(v) => autoSaveSelect("campaign_template", v)}
            />
          </motion.div>

          {/* Auto-Send Threshold */}
          <motion.div {...fadeUp(9)}>
            <FormSelect
              label="Auto-send emails when confidence is:"
              options={AUTO_SEND_OPTIONS}
              value={settings.auto_send_threshold}
              onChange={(v) => autoSaveSelect("auto_send_threshold", v)}
            />
          </motion.div>
        </div>
      </motion.section>

      {/* ── SECTION 3: Alert History ── */}
      <motion.section {...fadeUp(10)} style={{ marginBottom: 48 }}>
        <SectionHeader
          title="Recent Alerts"
          description="Your latest signal velocity alerts"
          divider
        />
        <div style={{ overflowX: "auto", borderRadius: 8 }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              minWidth: 560,
              fontFamily: "var(--font-outfit)",
            }}
          >
            <thead>
              <tr>
                {["Date", "Signal", "Company", "Confidence", "Action"].map((col) => (
                  <th
                    key={col}
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: "rgba(255,255,255,0.35)",
                      textAlign: "left",
                      padding: "10px 16px",
                      backgroundColor: "rgba(255,255,255,0.03)",
                      borderBottom: "1px solid rgba(255,255,255,0.06)",
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ALERT_HISTORY.map((row, i) => (
                <motion.tr
                  key={i}
                  {...fadeUp(11 + i)}
                  style={{
                    borderBottom: i < ALERT_HISTORY.length - 1
                      ? "1px solid rgba(255,255,255,0.05)"
                      : "none",
                  }}
                >
                  <td
                    style={{
                      fontSize: 12,
                      color: "rgba(255,255,255,0.45)",
                      padding: "14px 16px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {row.date}
                  </td>
                  <td
                    style={{
                      fontSize: 13,
                      color: "rgba(255,255,255,0.8)",
                      padding: "14px 16px",
                    }}
                  >
                    {row.signal}
                  </td>
                  <td
                    style={{
                      fontSize: 13,
                      color: "rgba(255,255,255,0.65)",
                      padding: "14px 16px",
                    }}
                  >
                    {row.company}
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span
                      style={{
                        fontSize: 10.5,
                        fontWeight: 700,
                        letterSpacing: "0.07em",
                        padding: "3px 8px",
                        borderRadius: 4,
                        fontFamily: "var(--font-outfit)",
                        color: row.confidence === "HIGH" ? "#4ade80" : "#fbbf24",
                        backgroundColor:
                          row.confidence === "HIGH"
                            ? "rgba(74,222,128,0.1)"
                            : "rgba(251,191,36,0.1)",
                        border: `1px solid ${
                          row.confidence === "HIGH"
                            ? "rgba(74,222,128,0.2)"
                            : "rgba(251,191,36,0.2)"
                        }`,
                      }}
                    >
                      {row.confidence}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <button
                      style={{
                        fontSize: 12,
                        color: "#FF5200",
                        backgroundColor: "transparent",
                        border: "1px solid rgba(255,82,0,0.3)",
                        borderRadius: 5,
                        padding: "4px 10px",
                        cursor: "pointer",
                        fontFamily: "var(--font-outfit)",
                        fontWeight: 500,
                        transition: "background-color 0.15s ease",
                        whiteSpace: "nowrap",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                          "rgba(255,82,0,0.08)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                          "transparent";
                      }}
                    >
                      View Campaign
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.section>

      {/* ── SECTION 4: Webhooks ── */}
      <motion.section {...fadeUp(14)} style={{ marginBottom: 48 }}>
        <SectionHeader
          title="Webhooks"
          description="Send alerts to external services"
          divider
        />
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Webhook URL */}
          <motion.div {...fadeUp(15)}>
            <div
              style={{
                backgroundColor: "rgba(255,255,255,0.05)",
                borderRadius: 8,
                padding: 16,
              }}
            >
              <p
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: "rgba(255,255,255,0.7)",
                  fontFamily: "var(--font-outfit)",
                  margin: "0 0 10px",
                }}
              >
                Webhook URL
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="text"
                  readOnly
                  value={WEBHOOK_URL}
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    borderRadius: 6,
                    backgroundColor: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "rgba(255,255,255,0.5)",
                    fontSize: 12,
                    fontFamily: "var(--font-outfit)",
                    outline: "none",
                    cursor: "default",
                  }}
                />
                <button
                  onClick={handleCopy}
                  title="Copy URL"
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 6,
                    backgroundColor: copied
                      ? "rgba(74,222,128,0.1)"
                      : "rgba(255,255,255,0.06)",
                    border: `1px solid ${copied ? "rgba(74,222,128,0.2)" : "rgba(255,255,255,0.1)"}`,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    transition: "all 0.15s ease",
                  }}
                >
                  <AnimatePresence mode="wait">
                    {copied ? (
                      <motion.div
                        key="check"
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.5, opacity: 0 }}
                        transition={{ duration: 0.15 }}
                      >
                        <CheckIcon size={14} color="#4ade80" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="copy"
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.5, opacity: 0 }}
                        transition={{ duration: 0.15 }}
                      >
                        <Copy size={14} color="rgba(255,255,255,0.45)" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              </div>
            </div>
          </motion.div>

          {/* Enable webhooks toggle */}
          <motion.div {...fadeUp(16)}>
            <ToggleRow
              label="Enable webhooks"
              checked={settings.webhooks_enabled}
              onChange={(v) => autoSaveToggle("webhooks_enabled", v)}
            />
          </motion.div>

          {/* Example payload */}
          <motion.div {...fadeUp(17)}>
            <div
              style={{
                backgroundColor: "rgba(255,255,255,0.05)",
                borderRadius: 8,
                padding: 16,
              }}
            >
              <p
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: "rgba(255,255,255,0.7)",
                  fontFamily: "var(--font-outfit)",
                  margin: "0 0 12px",
                }}
              >
                Example Payload
              </p>
              <pre
                style={{
                  margin: 0,
                  padding: "14px 16px",
                  borderRadius: 6,
                  backgroundColor: "#060606",
                  border: "1px solid rgba(255,255,255,0.08)",
                  fontSize: 12,
                  lineHeight: 1.7,
                  color: "rgba(255,255,255,0.55)",
                  fontFamily: "'Courier New', Courier, monospace",
                  overflowX: "auto",
                  whiteSpace: "pre",
                }}
              >
                {WEBHOOK_EXAMPLE}
              </pre>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* ── Footer ── */}
      <motion.div
        {...fadeUp(18)}
        style={{ display: "flex", alignItems: "center", gap: 16 }}
      >
        <button
          onClick={handleSaveAll}
          disabled={saveStatus === "saving"}
          style={{
            padding: "9px 22px",
            borderRadius: 7,
            backgroundColor: saveStatus === "saving" ? "rgba(255,82,0,0.5)" : "#FF5200",
            color: "#fff",
            fontSize: 13,
            fontWeight: 500,
            fontFamily: "var(--font-outfit)",
            border: "none",
            cursor: saveStatus === "saving" ? "not-allowed" : "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            transition: "filter 0.15s ease, background-color 0.15s ease",
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            if (saveStatus !== "saving")
              (e.currentTarget as HTMLButtonElement).style.filter = "brightness(1.1)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.filter = "none";
          }}
        >
          {saveStatus === "saving" ? (
            <>
              <Loader2
                size={13}
                strokeWidth={2}
                style={{ animation: "spin 0.8s linear infinite" }}
              />
              Saving...
            </>
          ) : (
            "Save Settings"
          )}
        </button>

        <SaveStatus
          status={saveStatus}
          message={saveError}
          timestamp={saveTimestamp}
        />
      </motion.div>
    </motion.div>
  );
}
