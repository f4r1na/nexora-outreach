"use client";

import { useState, useEffect, useCallback, useId } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import SectionHeader from "../_components/SectionHeader";
import SaveStatus from "../_components/SaveStatus";
import FormSelect from "../_components/FormSelect";
import FormCheckbox from "../_components/FormCheckbox";

const EASE = [0.23, 1, 0.32, 1] as const;

function fadeUp(i: number) {
  return {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { delay: i * 0.1, duration: 0.26, ease: EASE },
  };
}

const TONE_OPTIONS = [
  { value: "professional", label: "Professional" },
  { value: "casual",       label: "Casual" },
  { value: "urgent",       label: "Urgent" },
  { value: "balanced",     label: "Balanced" },
];

const TONE_PREVIEWS: Record<string, string> = {
  professional: "I noticed you recently hired a VP of Engineering...",
  casual:       "Hey! Saw you just brought on a VP of Eng...",
  urgent:       "Quick heads up - your team is hiring fast...",
  balanced:     "I came across your recent hiring moves...",
};

const CONFIDENCE_OPTIONS = [
  { value: "high",        label: "HIGH (>90%)" },
  { value: "high_medium", label: "HIGH + MEDIUM (>70%)" },
  { value: "all",         label: "All" },
];

const DISCARD_OPTIONS = [
  { value: "30",    label: "30 days" },
  { value: "60",    label: "60 days" },
  { value: "90",    label: "90 days" },
  { value: "never", label: "Never auto-hide" },
];

interface Prefs {
  default_tone: string;
  signal_confidence: string;
  signal_discard_days: string;
  signal_show_urls: boolean;
  followup_delay_1: string;
  followup_delay_2: string;
}

const DEFAULTS: Prefs = {
  default_tone:        "professional",
  signal_confidence:   "high_medium",
  signal_discard_days: "90",
  signal_show_urls:    true,
  followup_delay_1:    "3",
  followup_delay_2:    "7",
};

function NumberInput({
  label,
  description,
  value,
  min,
  max,
  error,
  onChange,
  onBlur,
}: {
  label: string;
  description?: string;
  value: string;
  min: number;
  max: number;
  error?: string;
  onChange: (v: string) => void;
  onBlur: () => void;
}) {
  const id = useId();
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? "rgba(239,68,68,0.5)"
    : focused
    ? "rgba(255,82,0,0.6)"
    : "rgba(255,255,255,0.1)";

  return (
    <div style={{
      backgroundColor: "rgba(255,255,255,0.05)",
      borderRadius: 8,
      padding: 16,
    }}>
      <label
        htmlFor={id}
        style={{
          display: "block",
          fontSize: 13,
          fontWeight: 600,
          color: "rgba(255,255,255,0.8)",
          fontFamily: "var(--font-outfit)",
          marginBottom: description ? 4 : 10,
        }}
      >
        {label}
      </label>
      {description && (
        <p style={{
          fontSize: 12,
          color: "rgba(255,255,255,0.55)",
          fontFamily: "var(--font-outfit)",
          margin: "0 0 10px",
          lineHeight: 1.5,
        }}>
          {description}
        </p>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <input
          id={id}
          type="number"
          value={value}
          min={min}
          max={max}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => { setFocused(false); onBlur(); }}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          style={{
            width: 80,
            textAlign: "center",
            padding: "8px",
            borderRadius: 6,
            backgroundColor: "#060606",
            border: `1px solid ${borderColor}`,
            color: "#fff",
            fontSize: 13,
            fontFamily: "var(--font-outfit)",
            outline: "none",
            transition: "border-color 0.15s ease",
            boxSizing: "border-box",
          } as React.CSSProperties}
        />
        <span style={{
          fontSize: 13,
          color: "rgba(255,255,255,0.5)",
          fontFamily: "var(--font-outfit)",
        }}>
          days
        </span>
      </div>
      <AnimatePresence>
        {error && (
          <motion.span
            id={`${id}-error`}
            role="alert"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
            style={{
              display: "block",
              fontSize: 11.5,
              color: "#ef4444",
              fontFamily: "var(--font-outfit)",
              marginTop: 7,
            }}
          >
            {error}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function PreferencesPage() {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS);
  const [loading, setLoading] = useState(true);

  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState<string | undefined>();
  const [saveTimestamp, setSaveTimestamp] = useState<Date | undefined>();

  const [followup1Error, setFollowup1Error] = useState<string | undefined>();
  const [followup2Error, setFollowup2Error] = useState<string | undefined>();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.user_metadata) {
        const m = user.user_metadata;
        setPrefs({
          default_tone:        m.default_tone        ?? DEFAULTS.default_tone,
          signal_confidence:   m.signal_confidence   ?? DEFAULTS.signal_confidence,
          signal_discard_days: m.signal_discard_days ?? DEFAULTS.signal_discard_days,
          signal_show_urls:    m.signal_show_urls     ?? DEFAULTS.signal_show_urls,
          followup_delay_1:    m.followup_delay_1    ?? DEFAULTS.followup_delay_1,
          followup_delay_2:    m.followup_delay_2    ?? DEFAULTS.followup_delay_2,
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
      setSaveError("Failed to save preferences");
      setSaveStatus("error");
    }
  }, []);

  function handleSelect(key: keyof Prefs, value: string) {
    setPrefs((p) => ({ ...p, [key]: value }));
    save({ [key]: value });
  }

  function handleCheckbox(value: boolean) {
    setPrefs((p) => ({ ...p, signal_show_urls: value }));
    save({ signal_show_urls: value });
  }

  function handleFollowup1Blur() {
    const n = Number(prefs.followup_delay_1);
    if (!prefs.followup_delay_1 || isNaN(n) || n < 1 || n > 30) {
      setFollowup1Error("Enter a number between 1 and 30");
      return;
    }
    setFollowup1Error(undefined);
    save({ followup_delay_1: prefs.followup_delay_1 });
  }

  function handleFollowup2Blur() {
    const n = Number(prefs.followup_delay_2);
    if (!prefs.followup_delay_2 || isNaN(n) || n < 1 || n > 60) {
      setFollowup2Error("Enter a number between 1 and 60");
      return;
    }
    setFollowup2Error(undefined);
    save({ followup_delay_2: prefs.followup_delay_2 });
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
          Preferences
        </h1>
        <p style={{
          fontSize: 13,
          color: "rgba(255,255,255,0.45)",
          fontFamily: "var(--font-outfit)",
          margin: "6px 0 0",
        }}>
          Customize your Nexora experience
        </p>
      </motion.div>

      {/* ── SECTION 1: Email Writing Style ── */}
      <motion.section {...fadeUp(1)} style={{ marginBottom: 48 }}>
        <SectionHeader
          title="Email Writing Style"
          description="Choose the default tone for your generated emails"
          divider
        />
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <motion.div {...fadeUp(2)}>
            <FormSelect
              label="Default Tone:"
              options={TONE_OPTIONS}
              value={prefs.default_tone}
              onChange={(v) => handleSelect("default_tone", v)}
            />
          </motion.div>

          {/* Tone preview */}
          <motion.div {...fadeUp(3)}>
            <div style={{
              backgroundColor: "rgba(255,255,255,0.05)",
              borderRadius: 8,
              padding: 16,
              minHeight: 68,
            }}>
              <p style={{
                fontSize: 10.5,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.07em",
                color: "rgba(255,255,255,0.28)",
                fontFamily: "var(--font-outfit)",
                margin: "0 0 8px",
              }}>
                Preview
              </p>
              <AnimatePresence mode="wait">
                <motion.p
                  key={prefs.default_tone}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{
                    fontSize: 12,
                    fontStyle: "italic",
                    color: "rgba(255,255,255,0.6)",
                    fontFamily: "var(--font-outfit)",
                    margin: 0,
                    lineHeight: 1.65,
                  }}
                >
                  {TONE_PREVIEWS[prefs.default_tone]}
                </motion.p>
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* ── SECTION 2: Signal Preferences ── */}
      <motion.section {...fadeUp(4)} style={{ marginBottom: 48 }}>
        <SectionHeader
          title="Signal Preferences"
          description="Control how signals are detected and displayed"
          divider
        />
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <motion.div {...fadeUp(5)}>
            <FormSelect
              label="Show only signals with confidence:"
              options={CONFIDENCE_OPTIONS}
              value={prefs.signal_confidence}
              onChange={(v) => handleSelect("signal_confidence", v)}
            />
          </motion.div>
          <motion.div {...fadeUp(6)}>
            <FormSelect
              label="Auto-hide signals older than:"
              options={DISCARD_OPTIONS}
              value={prefs.signal_discard_days}
              onChange={(v) => handleSelect("signal_discard_days", v)}
            />
          </motion.div>
          <motion.div {...fadeUp(7)}>
            <FormCheckbox
              label="Show source URLs on signals"
              description='Allows you to verify signals by clicking [Verify]'
              checked={prefs.signal_show_urls}
              onChange={handleCheckbox}
            />
          </motion.div>
        </div>
      </motion.section>

      {/* ── SECTION 3: Default Campaign Settings ── */}
      <motion.section {...fadeUp(8)} style={{ marginBottom: 48 }}>
        <SectionHeader
          title="Default Campaign Settings"
          description="Automatically applied to new campaigns"
          divider
        />
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <motion.div {...fadeUp(9)}>
            <NumberInput
              label="Send first follow-up after:"
              description="Days to wait before sending follow-up email"
              value={prefs.followup_delay_1}
              min={1}
              max={30}
              error={followup1Error}
              onChange={(v) => {
                setPrefs((p) => ({ ...p, followup_delay_1: v }));
                if (followup1Error) setFollowup1Error(undefined);
              }}
              onBlur={handleFollowup1Blur}
            />
          </motion.div>
          <motion.div {...fadeUp(10)}>
            <NumberInput
              label="Send second follow-up after:"
              description="Days to wait after initial send before second follow-up"
              value={prefs.followup_delay_2}
              min={1}
              max={60}
              error={followup2Error}
              onChange={(v) => {
                setPrefs((p) => ({ ...p, followup_delay_2: v }));
                if (followup2Error) setFollowup2Error(undefined);
              }}
              onBlur={handleFollowup2Blur}
            />
          </motion.div>
        </div>
      </motion.section>

      {/* Footer */}
      <motion.div {...fadeUp(11)} style={{ display: "flex", alignItems: "center" }}>
        <SaveStatus
          status={saveStatus}
          message={saveError}
          timestamp={saveTimestamp}
        />
      </motion.div>
    </motion.div>
  );
}
