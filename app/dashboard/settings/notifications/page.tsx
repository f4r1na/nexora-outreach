"use client";

import { useState, useEffect, useId, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import SectionHeader from "../_components/SectionHeader";
import SaveStatus from "../_components/SaveStatus";
import FormCheckbox from "../_components/FormCheckbox";

const EASE = [0.23, 1, 0.32, 1] as const;

function fadeUp(i: number) {
  return {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { delay: i * 0.08, duration: 0.26, ease: EASE },
  };
}

type Frequency = "immediately" | "daily" | "weekly";

interface Prefs {
  notif_replies: boolean;
  notif_campaign_sent: boolean;
  notif_credits: boolean;
  notif_signals: boolean;
  notif_frequency: Frequency;
}

const DEFAULTS: Prefs = {
  notif_replies: true,
  notif_campaign_sent: true,
  notif_credits: true,
  notif_signals: true,
  notif_frequency: "immediately",
};

const CHECKBOXES: {
  key: keyof Omit<Prefs, "notif_frequency">;
  label: string;
  description: string;
}[] = [
  {
    key: "notif_replies",
    label: "Reply received",
    description: "Get notified when someone replies to your emails",
  },
  {
    key: "notif_campaign_sent",
    label: "Campaign sent",
    description: "Confirmation when a campaign finishes sending",
  },
  {
    key: "notif_credits",
    label: "Low credits warning",
    description: "Alert when you have less than 100 credits remaining",
  },
  {
    key: "notif_signals",
    label: "Signal velocity alerts",
    description: "Real-time alerts when new signals match your ICP",
  },
];

const FREQUENCIES: { value: Frequency; label: string; description: string }[] = [
  {
    value: "immediately",
    label: "Immediately",
    description: "Get notified as soon as the event happens",
  },
  {
    value: "daily",
    label: "Daily digest",
    description: "Receive one email per day with all updates",
  },
  {
    value: "weekly",
    label: "Weekly summary",
    description: "Receive one email per week with all updates",
  },
];

function RadioOption({
  value,
  selected,
  label,
  description,
  onChange,
  toggleCount,
}: {
  value: string;
  selected: boolean;
  label: string;
  description: string;
  onChange: () => void;
  toggleCount: number;
}) {
  const id = useId();
  const [focused, setFocused] = useState(false);

  return (
    <label
      htmlFor={id}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        cursor: "pointer",
        backgroundColor: "rgba(255,255,255,0.05)",
        borderRadius: 8,
        padding: 16,
        userSelect: "none",
        border: `1px solid ${selected ? "rgba(255,82,0,0.22)" : "transparent"}`,
        transition: "border-color 0.18s ease",
      }}
    >
      <input
        id={id}
        type="radio"
        value={value}
        checked={selected}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          position: "absolute",
          opacity: 0,
          width: 1,
          height: 1,
          margin: -1,
          padding: 0,
          overflow: "hidden",
          clip: "rect(0,0,0,0)",
          border: 0,
          whiteSpace: "nowrap",
        }}
      />

      {/* Custom radio indicator */}
      <motion.div
        key={`${value}-${toggleCount}`}
        initial={{ scale: toggleCount > 0 && selected ? 0.88 : 1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.15, ease: EASE }}
        aria-hidden="true"
        style={{
          width: 18,
          height: 18,
          borderRadius: "50%",
          flexShrink: 0,
          marginTop: 2,
          border: `2px solid ${
            focused ? "#FF5200" : selected ? "#FF5200" : "rgba(255,255,255,0.22)"
          }`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "border-color 0.15s ease",
        }}
      >
        <AnimatePresence>
          {selected && (
            <motion.div
              key="dot"
              initial={{ opacity: 0, scale: 0.3 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.3 }}
              transition={{ duration: 0.12, ease: EASE }}
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: "#FF5200",
              }}
            />
          )}
        </AnimatePresence>
      </motion.div>

      <div>
        <span style={{
          display: "block",
          fontSize: 13,
          fontWeight: 500,
          color: "rgba(255,255,255,0.8)",
          fontFamily: "var(--font-outfit)",
          lineHeight: 1.4,
        }}>
          {label}
        </span>
        <span style={{
          display: "block",
          fontSize: 11.5,
          color: "rgba(255,255,255,0.35)",
          fontFamily: "var(--font-outfit)",
          marginTop: 3,
          lineHeight: 1.5,
        }}>
          {description}
        </span>
      </div>
    </label>
  );
}

export default function NotificationsPage() {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [freqToggleCount, setFreqToggleCount] = useState(0);

  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState<string | undefined>();
  const [saveTimestamp, setSaveTimestamp] = useState<Date | undefined>();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.user_metadata) {
        const m = user.user_metadata;
        setPrefs({
          notif_replies: m.notif_replies ?? true,
          // backward-compat: old key was notif_launches
          notif_campaign_sent: m.notif_campaign_sent ?? m.notif_launches ?? true,
          notif_credits: m.notif_credits ?? true,
          notif_signals: m.notif_signals ?? true,
          notif_frequency: m.notif_frequency ?? "immediately",
        });
      }
    }).finally(() => setLoading(false));
  }, []);

  const save = useCallback(async (patch: Partial<Prefs>) => {
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
      setSaveError("Failed to save preferences");
      setSaveStatus("error");
    }
  }, []);

  function handleCheckbox(key: keyof Omit<Prefs, "notif_frequency">, value: boolean) {
    setPrefs((p) => ({ ...p, [key]: value }));
    save({ [key]: value });
  }

  function handleFrequency(freq: Frequency) {
    if (prefs.notif_frequency === freq) return;
    setFreqToggleCount((c) => c + 1);
    setPrefs((p) => ({ ...p, notif_frequency: freq }));
    save({ notif_frequency: freq });
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
      {/* Page header */}
      <motion.div {...fadeUp(0)} style={{ marginBottom: 40 }}>
        <h1 style={{
          fontSize: 22,
          fontWeight: 700,
          color: "#fff",
          fontFamily: "var(--font-syne)",
          letterSpacing: "-0.02em",
          margin: 0,
          lineHeight: 1.2,
        }}>
          Notifications
        </h1>
        <p style={{
          fontSize: 13,
          color: "rgba(255,255,255,0.45)",
          fontFamily: "var(--font-outfit)",
          margin: "6px 0 0",
        }}>
          Control how and when you receive notifications
        </p>
      </motion.div>

      {/* ── SECTION 1: Email Notifications ── */}
      <motion.section {...fadeUp(1)} style={{ marginBottom: 48 }}>
        <SectionHeader
          title="Email Notifications"
          description="Receive email updates for the following events:"
          divider
        />
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {CHECKBOXES.map(({ key, label, description }, i) => (
            <motion.div key={key} {...fadeUp(i + 2)}>
              <FormCheckbox
                label={label}
                description={description}
                checked={prefs[key]}
                onChange={(v) => handleCheckbox(key, v)}
              />
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ── SECTION 2: Notification Frequency ── */}
      <motion.section {...fadeUp(6)} style={{ marginBottom: 48 }}>
        <SectionHeader
          title="Notification Frequency"
          description="How often would you like to receive notifications?"
          divider
        />
        <div
          role="radiogroup"
          aria-label="Notification frequency"
          style={{ display: "flex", flexDirection: "column", gap: 10 }}
        >
          {FREQUENCIES.map(({ value, label, description }, i) => (
            <motion.div key={value} {...fadeUp(i + 7)}>
              <RadioOption
                value={value}
                selected={prefs.notif_frequency === value}
                label={label}
                description={description}
                onChange={() => handleFrequency(value)}
                toggleCount={freqToggleCount}
              />
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Footer */}
      <motion.div
        {...fadeUp(10)}
        style={{ display: "flex", alignItems: "center" }}
      >
        <SaveStatus
          status={saveStatus}
          message={saveError}
          timestamp={saveTimestamp}
        />
      </motion.div>
    </motion.div>
  );
}
