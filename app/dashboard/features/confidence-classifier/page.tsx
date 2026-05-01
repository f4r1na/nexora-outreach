"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import {
  Brain,
  Loader2,
  Info,
  TrendingUp,
  RotateCcw,
  Sliders,
  Zap,
} from "lucide-react";
import SectionHeader from "@/app/dashboard/settings/_components/SectionHeader";
import SaveStatus from "@/app/dashboard/settings/_components/SaveStatus";
import FormSelect from "@/app/dashboard/settings/_components/FormSelect";

const EASE = [0.23, 1, 0.32, 1] as const;

function fadeUp(i: number) {
  return {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { delay: i * 0.07, duration: 0.26, ease: EASE },
  };
}

// ─── RangeSlider ──────────────────────────────────────────────────────────────

function RangeSlider({
  value,
  min = 0,
  max = 100,
  step = 1,
  label,
  onChange,
  onCommit,
}: {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  label: string;
  onChange: (v: number) => void;
  onCommit?: (v: number) => void;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  const trackFill = `linear-gradient(to right, #FF5200 0%, #FF5200 ${pct}%, rgba(255,255,255,0.12) ${pct}%, rgba(255,255,255,0.12) 100%)`;

  return (
    <input
      type="range"
      aria-label={label}
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      onPointerUp={(e) => onCommit?.(Number((e.target as HTMLInputElement).value))}
      style={{
        flex: 1,
        height: 6,
        borderRadius: 3,
        appearance: "none",
        WebkitAppearance: "none",
        background: trackFill,
        outline: "none",
        cursor: "pointer",
        accentColor: "#FF5200",
      } as React.CSSProperties}
    />
  );
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

// ─── BarChart ─────────────────────────────────────────────────────────────────

const CHART_DATA = [
  { type: "GitHub Upgrade",  rate: 24.0 },
  { type: "Funding",         rate: 22.3 },
  { type: "Hiring",          rate: 18.5 },
  { type: "Product Launch",  rate: 12.4 },
  { type: "General News",    rate:  3.6 },
];

const MAX_RATE = 24.0;

function BarChart() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {CHART_DATA.map((row, i) => (
        <div
          key={row.type}
          style={{ display: "flex", alignItems: "center", gap: 12 }}
        >
          <span
            style={{
              fontSize: 12,
              color: "rgba(255,255,255,0.5)",
              fontFamily: "var(--font-outfit)",
              width: 120,
              flexShrink: 0,
              textAlign: "right",
            }}
          >
            {row.type}
          </span>
          <div
            style={{
              flex: 1,
              height: 22,
              backgroundColor: "rgba(255,255,255,0.04)",
              borderRadius: 4,
              overflow: "hidden",
              position: "relative",
            }}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(row.rate / MAX_RATE) * 100}%` }}
              transition={{ delay: 0.3 + i * 0.1, duration: 0.55, ease: EASE }}
              style={{
                height: "100%",
                backgroundColor: "#FF5200",
                borderRadius: 4,
                opacity: 0.85 - i * 0.08,
              }}
            />
          </div>
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "#FF5200",
              fontFamily: "var(--font-outfit)",
              width: 38,
              flexShrink: 0,
            }}
          >
            {row.rate}%
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const SCORING_ROWS = [
  { type: "Hiring",         d07: "95%", d730: "85%", d3060: "60%", d6090: "40%", d90: "0%", conv: 18.5 },
  { type: "Funding",        d07: "98%", d730: "90%", d3060: "75%", d6090: "55%", d90: "0%", conv: 22.3 },
  { type: "GitHub Upgrade", d07: "92%", d730: "82%", d3060: "65%", d6090: "45%", d90: "0%", conv: 24.0 },
  { type: "Product Launch", d07: "88%", d730: "78%", d3060: "50%", d6090: "25%", d90: "0%", conv: 12.4 },
  { type: "General News",   d07: "50%", d730: "35%", d3060: "20%", d6090: "10%", d90: "0%", conv:  3.6 },
];

const HIDE_OPTIONS = [
  { value: "30",    label: "30 days" },
  { value: "60",    label: "60 days" },
  { value: "90",    label: "90 days" },
  { value: "never", label: "Never" },
];

const STAT_CARDS = [
  { label: "Total Signals",    value: "1,247",             sub: "all time",            icon: TrendingUp },
  { label: "Replied",          value: "87",                sub: "7.0% reply rate",     icon: Zap },
  { label: "Best Performing",  value: "GitHub Upgrades",   sub: "9.2% reply rate",     icon: TrendingUp },
  { label: "Worst Performing", value: "General News",      sub: "2.1% reply rate",     icon: Info },
];

const DEFAULT_WEIGHTS = { type: 50, age: 30, source: 20 };

interface Settings {
  min_confidence: number;
  auto_hide_days: string;
  weight_recent: boolean;
  weight_type: number;
  weight_age: number;
  weight_source: number;
}

const DEFAULTS: Settings = {
  min_confidence: 70,
  auto_hide_days: "90",
  weight_recent:  true,
  weight_type:    50,
  weight_age:     30,
  weight_source:  20,
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ConfidenceClassifierPage() {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [loading, setLoading] = useState(true);

  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState<string | undefined>();
  const [saveTimestamp, setSaveTimestamp] = useState<Date | undefined>();

  // Timer ref for slider debounce
  const sliderTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.user_metadata) {
        const m = user.user_metadata;
        setSettings({
          min_confidence: m.cc_min_confidence ?? DEFAULTS.min_confidence,
          auto_hide_days: m.cc_auto_hide_days ?? DEFAULTS.auto_hide_days,
          weight_recent:  m.cc_weight_recent  ?? DEFAULTS.weight_recent,
          weight_type:    m.cc_weight_type    ?? DEFAULTS.weight_type,
          weight_age:     m.cc_weight_age     ?? DEFAULTS.weight_age,
          weight_source:  m.cc_weight_source  ?? DEFAULTS.weight_source,
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

  // Debounced save for slider interactions
  function saveSlider(key: keyof Settings, value: number) {
    if (sliderTimer.current) clearTimeout(sliderTimer.current);
    sliderTimer.current = setTimeout(() => {
      save({ [`cc_${key}`]: value });
    }, 400);
  }

  function autoSaveString(key: keyof Settings, value: string) {
    update(key, value as Settings[typeof key]);
    save({ [`cc_${key}`]: value });
  }

  function autoSaveBoolean(key: keyof Settings, value: boolean) {
    update(key, value as Settings[typeof key]);
    save({ [`cc_${key}`]: value });
  }

  function handleWeightReset() {
    setSettings((s) => ({
      ...s,
      weight_type:   DEFAULT_WEIGHTS.type,
      weight_age:    DEFAULT_WEIGHTS.age,
      weight_source: DEFAULT_WEIGHTS.source,
    }));
    save({
      cc_weight_type:   DEFAULT_WEIGHTS.type,
      cc_weight_age:    DEFAULT_WEIGHTS.age,
      cc_weight_source: DEFAULT_WEIGHTS.source,
    });
  }

  async function handleSaveAll() {
    const patch: Record<string, unknown> = {};
    (Object.keys(settings) as (keyof Settings)[]).forEach((k) => {
      patch[`cc_${k}`] = settings[k];
    });
    await save(patch);
  }

  const weightSum = settings.weight_type + settings.weight_age + settings.weight_source;
  const weightsValid = weightSum === 100;

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
    <>
      {/* Slider thumb styles */}
      <style>{`
        input[type=range].cc-slider { -webkit-appearance: none; appearance: none; }
        input[type=range].cc-slider::-webkit-slider-thumb {
          -webkit-appearance: none; appearance: none;
          width: 18px; height: 18px; border-radius: 50%;
          background: #FF5200; cursor: pointer;
          margin-top: -6px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.45);
          border: 2px solid rgba(255,255,255,0.15);
        }
        input[type=range].cc-slider::-moz-range-thumb {
          width: 18px; height: 18px; border-radius: 50%;
          background: #FF5200; cursor: pointer; border: none;
          box-shadow: 0 1px 4px rgba(0,0,0,0.45);
        }
        input[type=range].cc-slider::-webkit-slider-runnable-track {
          height: 6px; border-radius: 3px;
        }
        input[type=range].cc-slider::-moz-range-track {
          height: 6px; border-radius: 3px; background: rgba(255,255,255,0.12);
        }
        input[type=range].cc-slider:focus { outline: none; }
      `}</style>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25 }}
        style={{ maxWidth: 900, paddingBottom: 80 }}
      >
        {/* ── Page header ── */}
        <motion.div {...fadeUp(0)} style={{ marginBottom: 40 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 18 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                backgroundColor: "rgba(255,82,0,0.1)",
                border: "1px solid rgba(255,82,0,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Brain size={24} color="#FF5200" />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
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
                  Confidence Classifier
                </h1>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    color: "#4ade80",
                    backgroundColor: "rgba(74,222,128,0.1)",
                    border: "1px solid rgba(74,222,128,0.25)",
                    borderRadius: 4,
                    padding: "2px 7px",
                    fontFamily: "var(--font-outfit)",
                    lineHeight: 1,
                  }}
                >
                  ACTIVE
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
                AI-powered signal quality scoring based on type, age, and source
              </p>
            </div>
          </div>
        </motion.div>

        {/* ── SECTION 1: About ── */}
        <motion.section {...fadeUp(1)} style={{ marginBottom: 48 }}>
          <motion.div
            {...fadeUp(2)}
            style={{
              backgroundColor: "rgba(255,82,0,0.05)",
              border: "1px solid rgba(255,82,0,0.12)",
              borderRadius: 10,
              padding: "18px 20px",
              display: "flex",
              gap: 14,
              alignItems: "flex-start",
            }}
          >
            <Info size={16} color="rgba(255,82,0,0.7)" style={{ flexShrink: 0, marginTop: 1 }} />
            <p
              style={{
                fontSize: 13,
                color: "rgba(255,255,255,0.6)",
                fontFamily: "var(--font-outfit)",
                margin: 0,
                lineHeight: 1.7,
              }}
            >
              The Confidence Classifier learns which signals convert best for your business. Each
              signal gets a score based on:{" "}
              <strong style={{ color: "rgba(255,255,255,0.85)" }}>signal type</strong> (hiring,
              funding, etc),{" "}
              <strong style={{ color: "rgba(255,255,255,0.85)" }}>signal age</strong> (fresher =
              higher), and{" "}
              <strong style={{ color: "rgba(255,255,255,0.85)" }}>source authority</strong>.
            </p>
          </motion.div>
        </motion.section>

        {/* ── SECTION 2: Scoring Rules ── */}
        <motion.section {...fadeUp(3)} style={{ marginBottom: 48 }}>
          <SectionHeader
            title="Scoring Rules by Signal Type"
            description="See how different signal types are scored"
            divider
          />
          <motion.div {...fadeUp(4)} style={{ overflowX: "auto", borderRadius: 8 }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: 580,
                fontFamily: "var(--font-outfit)",
              }}
            >
              <thead>
                <tr style={{ backgroundColor: "rgba(255,255,255,0.04)" }}>
                  {["Signal Type", "0–7 Days", "7–30 Days", "30–60 Days", "60–90 Days", "90+ Days", "Conv Rate"].map(
                    (col, ci) => (
                      <th
                        key={col}
                        style={{
                          fontSize: 10.5,
                          fontWeight: 600,
                          color: "rgba(255,255,255,0.35)",
                          textAlign: ci === 0 ? "left" : "center",
                          padding: "10px 14px",
                          borderBottom: "1px solid rgba(255,255,255,0.07)",
                          letterSpacing: "0.05em",
                          textTransform: "uppercase",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {col}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {SCORING_ROWS.map((row, ri) => {
                  const isEven = ri % 2 === 0;
                  return (
                    <motion.tr
                      key={row.type}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 + ri * 0.06, duration: 0.24 }}
                      style={{
                        backgroundColor: isEven
                          ? "rgba(255,255,255,0.03)"
                          : "transparent",
                        borderBottom:
                          ri < SCORING_ROWS.length - 1
                            ? "1px solid rgba(255,255,255,0.04)"
                            : "none",
                      }}
                    >
                      <td
                        style={{
                          fontSize: 13,
                          fontWeight: 500,
                          color: "rgba(255,255,255,0.85)",
                          padding: "13px 14px",
                        }}
                      >
                        {row.type}
                      </td>
                      {[row.d07, row.d730, row.d3060, row.d6090, row.d90].map((cell, ci) => (
                        <td
                          key={ci}
                          style={{
                            fontSize: 12.5,
                            color:
                              cell === "0%"
                                ? "rgba(255,255,255,0.18)"
                                : parseInt(cell) >= 80
                                ? "rgba(74,222,128,0.9)"
                                : parseInt(cell) >= 50
                                ? "rgba(255,255,255,0.7)"
                                : "rgba(255,255,255,0.4)",
                            padding: "13px 14px",
                            textAlign: "center",
                            fontWeight: parseInt(cell) >= 80 ? 600 : 400,
                          }}
                        >
                          {cell}
                        </td>
                      ))}
                      <td style={{ padding: "13px 14px", textAlign: "center" }}>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: "#4ade80",
                            backgroundColor: "rgba(74,222,128,0.1)",
                            border: "1px solid rgba(74,222,128,0.2)",
                            borderRadius: 4,
                            padding: "3px 8px",
                            letterSpacing: "0.04em",
                          }}
                        >
                          {row.conv}%
                        </span>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </motion.div>
        </motion.section>

        {/* ── SECTION 3: Display Settings ── */}
        <motion.section {...fadeUp(5)} style={{ marginBottom: 48 }}>
          <SectionHeader
            title="Display Settings"
            description="Control which signals you see based on confidence scores"
            divider
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

            {/* Minimum Confidence Slider */}
            <motion.div {...fadeUp(6)}>
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
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 14,
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
                      }}
                    >
                      Minimum Confidence
                    </p>
                    <p
                      style={{
                        fontSize: 11.5,
                        color: "rgba(255,255,255,0.35)",
                        fontFamily: "var(--font-outfit)",
                        margin: "3px 0 0",
                      }}
                    >
                      Only show signals above this confidence level
                    </p>
                  </div>
                  <span
                    style={{
                      fontSize: 22,
                      fontWeight: 700,
                      color: "#FF5200",
                      fontFamily: "var(--font-syne)",
                      letterSpacing: "-0.02em",
                      minWidth: 52,
                      textAlign: "right",
                    }}
                  >
                    {settings.min_confidence}%
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span
                    style={{
                      fontSize: 11,
                      color: "rgba(255,255,255,0.25)",
                      fontFamily: "var(--font-outfit)",
                    }}
                  >
                    0%
                  </span>
                  <input
                    type="range"
                    className="cc-slider"
                    aria-label="Minimum Confidence"
                    min={0}
                    max={100}
                    step={5}
                    value={settings.min_confidence}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      update("min_confidence", v);
                    }}
                    onPointerUp={(e) => {
                      const v = Number((e.target as HTMLInputElement).value);
                      save({ cc_min_confidence: v });
                    }}
                    style={{
                      flex: 1,
                      height: 6,
                      borderRadius: 3,
                      appearance: "none",
                      WebkitAppearance: "none",
                      background: `linear-gradient(to right, #FF5200 0%, #FF5200 ${settings.min_confidence}%, rgba(255,255,255,0.12) ${settings.min_confidence}%, rgba(255,255,255,0.12) 100%)`,
                      outline: "none",
                      cursor: "pointer",
                    } as React.CSSProperties}
                  />
                  <span
                    style={{
                      fontSize: 11,
                      color: "rgba(255,255,255,0.25)",
                      fontFamily: "var(--font-outfit)",
                    }}
                  >
                    100%
                  </span>
                </div>

                {/* Tick marks */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: 6,
                    padding: "0 4px",
                  }}
                >
                  {["0", "25", "50", "75", "100"].map((t) => (
                    <span
                      key={t}
                      style={{
                        fontSize: 10,
                        color:
                          Number(t) === settings.min_confidence
                            ? "#FF5200"
                            : "rgba(255,255,255,0.18)",
                        fontFamily: "var(--font-outfit)",
                        transition: "color 0.15s ease",
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Auto-Hide Dropdown */}
            <motion.div {...fadeUp(7)}>
              <FormSelect
                label="Hide signals older than:"
                options={HIDE_OPTIONS}
                value={settings.auto_hide_days}
                onChange={(v) => autoSaveString("auto_hide_days", v)}
              />
            </motion.div>

            {/* Weight Recent Toggle */}
            <motion.div {...fadeUp(8)}>
              <div
                style={{
                  backgroundColor: "rgba(255,255,255,0.05)",
                  borderRadius: 8,
                  padding: 16,
                  display: "flex",
                  alignItems: "flex-start",
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
                    Boost confidence for very recent signals (&lt;24h)
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
                    Recent signals get +10% confidence boost
                  </p>
                </div>
                <Toggle
                  checked={settings.weight_recent}
                  onChange={(v) => autoSaveBoolean("weight_recent", v)}
                  label="Weight Recent Signals"
                />
              </div>
            </motion.div>
          </div>
        </motion.section>

        {/* ── SECTION 4: Signal Performance ── */}
        <motion.section {...fadeUp(9)} style={{ marginBottom: 48 }}>
          <SectionHeader
            title="Signal Performance"
            description="Your historical conversion rates (updates automatically)"
            divider
          />

          {/* Stat cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
              gap: 12,
              marginBottom: 24,
            }}
          >
            {STAT_CARDS.map((card, i) => {
              const Icon = card.icon;
              return (
                <motion.div
                  key={card.label}
                  {...fadeUp(10 + i)}
                  style={{
                    backgroundColor: "rgba(255,255,255,0.05)",
                    borderRadius: 10,
                    padding: "18px 16px",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 7,
                      marginBottom: 10,
                    }}
                  >
                    <Icon
                      size={13}
                      color="rgba(255,255,255,0.3)"
                      strokeWidth={2}
                    />
                    <span
                      style={{
                        fontSize: 11,
                        color: "rgba(255,255,255,0.35)",
                        fontFamily: "var(--font-outfit)",
                        letterSpacing: "0.04em",
                        textTransform: "uppercase",
                        fontWeight: 600,
                      }}
                    >
                      {card.label}
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: i <= 1 ? 26 : 15,
                      fontWeight: 700,
                      color: "#fff",
                      fontFamily: "var(--font-syne)",
                      margin: "0 0 4px",
                      letterSpacing: "-0.02em",
                      lineHeight: 1.2,
                    }}
                  >
                    {card.value}
                  </p>
                  <p
                    style={{
                      fontSize: 11.5,
                      color: "rgba(255,255,255,0.3)",
                      fontFamily: "var(--font-outfit)",
                      margin: 0,
                    }}
                  >
                    {card.sub}
                  </p>
                </motion.div>
              );
            })}
          </div>

          {/* Bar chart */}
          <motion.div
            {...fadeUp(14)}
            style={{
              backgroundColor: "rgba(255,255,255,0.05)",
              borderRadius: 10,
              padding: 20,
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <p
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "rgba(255,255,255,0.5)",
                fontFamily: "var(--font-outfit)",
                margin: "0 0 18px",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              Conversion Rate by Signal Type
            </p>
            <BarChart />
          </motion.div>
        </motion.section>

        {/* ── SECTION 5: Signal Weights ── */}
        <motion.section {...fadeUp(15)} style={{ marginBottom: 48 }}>
          <SectionHeader
            title="Advanced: Adjust Signal Weights"
            description="Customize how signals are scored (expert mode)"
            divider
          />

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Weight sliders */}
            {(
              [
                { key: "weight_type",   label: "Signal Type Weight",     icon: Sliders },
                { key: "weight_age",    label: "Signal Age Weight",      icon: TrendingUp },
                { key: "weight_source", label: "Source Authority Weight", icon: Brain },
              ] as { key: keyof Settings; label: string; icon: React.ComponentType<{ size: number; color: string }> }[]
            ).map((item, i) => {
              const value = settings[item.key] as number;
              const pct = value;
              const trackBg = `linear-gradient(to right, #FF5200 0%, #FF5200 ${pct}%, rgba(255,255,255,0.12) ${pct}%, rgba(255,255,255,0.12) 100%)`;
              const Icon = item.icon;

              return (
                <motion.div key={item.key} {...fadeUp(16 + i)}>
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
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 12,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Icon size={14} color="rgba(255,255,255,0.4)" />
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 500,
                            color: "rgba(255,255,255,0.8)",
                            fontFamily: "var(--font-outfit)",
                          }}
                        >
                          {item.label}
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: 18,
                          fontWeight: 700,
                          color: weightsValid ? "#FF5200" : "#fbbf24",
                          fontFamily: "var(--font-syne)",
                          letterSpacing: "-0.02em",
                          minWidth: 42,
                          textAlign: "right",
                          transition: "color 0.2s ease",
                        }}
                      >
                        {value}%
                      </span>
                    </div>
                    <input
                      type="range"
                      className="cc-slider"
                      aria-label={item.label}
                      min={0}
                      max={100}
                      step={5}
                      value={value}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        update(item.key, v as Settings[typeof item.key]);
                      }}
                      onPointerUp={(e) => {
                        const v = Number((e.target as HTMLInputElement).value);
                        save({ [`cc_${item.key}`]: v });
                      }}
                      style={{
                        width: "100%",
                        height: 6,
                        borderRadius: 3,
                        appearance: "none",
                        WebkitAppearance: "none",
                        background: trackBg,
                        outline: "none",
                        cursor: "pointer",
                      } as React.CSSProperties}
                    />
                  </div>
                </motion.div>
              );
            })}

            {/* Weight sum indicator */}
            <motion.div {...fadeUp(19)}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 16px",
                  borderRadius: 8,
                  backgroundColor: weightsValid
                    ? "rgba(74,222,128,0.06)"
                    : "rgba(251,191,36,0.06)",
                  border: `1px solid ${weightsValid ? "rgba(74,222,128,0.2)" : "rgba(251,191,36,0.2)"}`,
                  transition: "all 0.2s ease",
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    color: weightsValid
                      ? "rgba(74,222,128,0.8)"
                      : "rgba(251,191,36,0.9)",
                    fontFamily: "var(--font-outfit)",
                    transition: "color 0.2s ease",
                  }}
                >
                  {weightsValid
                    ? "Weights sum to 100% - good to go"
                    : `Weights sum to ${weightSum}% - must equal 100%`}
                </span>
                <button
                  onClick={handleWeightReset}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    fontSize: 12,
                    color: "rgba(255,255,255,0.45)",
                    backgroundColor: "transparent",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "var(--font-outfit)",
                    padding: "3px 8px",
                  }}
                >
                  <RotateCcw size={12} />
                  Reset to defaults
                </button>
              </div>
            </motion.div>
          </div>
        </motion.section>

        {/* ── Footer ── */}
        <motion.div
          {...fadeUp(20)}
          style={{
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <button
            onClick={handleSaveAll}
            disabled={saveStatus === "saving"}
            style={{
              padding: "9px 22px",
              borderRadius: 7,
              backgroundColor:
                saveStatus === "saving" ? "rgba(255,82,0,0.5)" : "#FF5200",
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
                (e.currentTarget as HTMLButtonElement).style.filter =
                  "brightness(1.1)";
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

          <span
            style={{
              fontSize: 12,
              color: "rgba(255,255,255,0.2)",
              fontFamily: "var(--font-outfit)",
              marginLeft: "auto",
            }}
          >
            Scoring rules update automatically based on your reply data
          </span>
        </motion.div>
      </motion.div>
    </>
  );
}
