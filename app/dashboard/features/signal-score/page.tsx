"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  Loader2,
  Info,
  RotateCcw,
  ChevronDown,
  TrendingUp,
  Zap,
  Brain,
  Activity,
} from "lucide-react";
import SectionHeader from "@/app/dashboard/settings/_components/SectionHeader";
import SaveStatus from "@/app/dashboard/settings/_components/SaveStatus";

// ─── Constants ────────────────────────────────────────────────────────────────

const EASE = [0.23, 1, 0.32, 1] as const;

function fadeUp(i: number) {
  return {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { delay: i * 0.07, duration: 0.26, ease: EASE },
  };
}

// ─── Founder profiles ─────────────────────────────────────────────────────────

interface FounderProfile {
  id: string;
  label: string;
  tags: string[];
  scores: {
    github: number;
    hiring: number;
    funding: number;
    product: number;
    general: number;
  };
}

const FOUNDER_PROFILES: FounderProfile[] = [
  {
    id: "saas",
    label: "SaaS Founders",
    tags: ["Tech-forward audiences", "B2B software products", "Growth-focused companies"],
    scores: { github: 9, hiring: 7, funding: 8, product: 7, general: 3 },
  },
  {
    id: "agency",
    label: "Agency Owners",
    tags: ["Service-based businesses", "Client acquisition focus", "Project-driven growth"],
    scores: { github: 4, hiring: 8, funding: 6, product: 5, general: 7 },
  },
  {
    id: "investor",
    label: "Investor / VC",
    tags: ["Deal flow signals", "Portfolio company growth", "Market traction indicators"],
    scores: { github: 7, hiring: 6, funding: 10, product: 8, general: 5 },
  },
  {
    id: "enterprise",
    label: "Enterprise Sales",
    tags: ["Large org decision makers", "Long sales cycles", "Budget approval processes"],
    scores: { github: 5, hiring: 9, funding: 9, product: 6, general: 6 },
  },
  {
    id: "ecommerce",
    label: "E-commerce",
    tags: ["Consumer-facing brands", "Transaction volume focus", "Seasonal buying patterns"],
    scores: { github: 3, hiring: 7, funding: 7, product: 9, general: 8 },
  },
];

const SIGNAL_DEFS = [
  {
    key: "github" as const,
    label: "GitHub Signal",
    descriptions: {
      saas:       "Tech team upgrades indicate growth",
      agency:     "Less relevant for client-service businesses",
      investor:   "Engineering velocity is a portfolio signal",
      enterprise: "Dev team size matters for tech buying",
      ecommerce:  "Low relevance for consumer brands",
    },
  },
  {
    key: "hiring" as const,
    label: "Hiring Signal",
    descriptions: {
      saas:       "Less relevant for most SaaS founders",
      agency:     "Hiring surges signal new projects",
      investor:   "Headcount growth is a traction signal",
      enterprise: "Headcount growth reveals budget increases",
      ecommerce:  "Seasonal hiring signals sales peaks",
    },
  },
  {
    key: "funding" as const,
    label: "Funding Signal",
    descriptions: {
      saas:       "Funded companies have budgets to spend",
      agency:     "Funded startups seek agency partners",
      investor:   "Most relevant — direct deal-flow indicator",
      enterprise: "Funded enterprises approve larger budgets",
      ecommerce:  "Venture-backed brands scale quickly",
    },
  },
  {
    key: "product" as const,
    label: "Product Launch",
    descriptions: {
      saas:       "Shows market activity, moderate indicator",
      agency:     "Product launches need marketing support",
      investor:   "Launch traction validates market fit",
      enterprise: "Enterprise launches indicate roadmap shifts",
      ecommerce:  "Product launches drive campaign demand",
    },
  },
  {
    key: "general" as const,
    label: "General News",
    descriptions: {
      saas:       "Low relevance for technical audience",
      agency:     "Brand press signals visibility opportunities",
      investor:   "News flow correlates with deal momentum",
      enterprise: "PR signals readiness for partnerships",
      ecommerce:  "Consumer press creates partnership windows",
    },
  },
];

// ─── Chart data ───────────────────────────────────────────────────────────────

const CHART_BARS = [
  { label: "1-2", count: 1,   pct: 0 },
  { label: "3-4", count: 12,  pct: 1 },
  { label: "5-6", count: 45,  pct: 4 },
  { label: "7-8", count: 234, pct: 19 },
  { label: "9-10",count: 955, pct: 76 },
];

const MAX_BAR = Math.max(...CHART_BARS.map((b) => b.count));

// ─── Stars ────────────────────────────────────────────────────────────────────

function Stars({ score }: { score: number }) {
  const filled = Math.round(score / 2);
  return (
    <span style={{ letterSpacing: 1 }}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} style={{ fontSize: 14, opacity: i < filled ? 1 : 0.18 }}>
          ★
        </span>
      ))}
    </span>
  );
}

// ─── RangeSlider ──────────────────────────────────────────────────────────────

function RangeSlider({
  value,
  min = 0,
  max = 100,
  step = 5,
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
  return (
    <input
      type="range"
      aria-label={label}
      min={min}
      max={max}
      step={step}
      value={value}
      className="ss-slider"
      onChange={(e) => onChange(Number(e.target.value))}
      onPointerUp={(e) => onCommit?.(Number((e.target as HTMLInputElement).value))}
      style={{
        flex: 1,
        height: 6,
        borderRadius: 3,
        appearance: "none",
        WebkitAppearance: "none",
        background: `linear-gradient(to right, #FF5200 0%, #FF5200 ${pct}%, rgba(255,255,255,0.12) ${pct}%, rgba(255,255,255,0.12) 100%)`,
        outline: "none",
        cursor: "pointer",
        accentColor: "#FF5200",
      } as React.CSSProperties}
    />
  );
}

// ─── Score card ───────────────────────────────────────────────────────────────

function SignalScoreCard({
  label,
  score,
  description,
  index,
}: {
  label: string;
  score: number;
  description: string;
  index: number;
}) {
  const isHigh = score >= 8;
  const isMid  = score >= 5 && score < 8;

  const scoreColor = isHigh ? "#FF5200" : isMid ? "#fbbf24" : "rgba(255,255,255,0.4)";

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.07, duration: 0.24, ease: EASE }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 18,
        padding: "16px 20px",
        borderRadius: 12,
        background: isHigh
          ? "rgba(255,82,0,0.06)"
          : "rgba(255,255,255,0.04)",
        border: `1px solid ${isHigh ? "rgba(255,82,0,0.2)" : "rgba(255,255,255,0.07)"}`,
      }}
    >
      {/* Score circle */}
      <div style={{
        width: 54,
        height: 54,
        borderRadius: "50%",
        border: `2px solid ${scoreColor}`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        background: isHigh ? "rgba(255,82,0,0.1)" : "rgba(255,255,255,0.04)",
      }}>
        <span style={{ fontSize: 18, fontWeight: 800, color: scoreColor, lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: "0.03em" }}>/10</span>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 4 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{label}</span>
          <Stars score={score} />
        </div>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: 0 }}>{description}</p>
      </div>

      {/* Bar fill */}
      <div style={{ width: 80, flexShrink: 0 }}>
        <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(score / 10) * 100}%` }}
            transition={{ delay: index * 0.07 + 0.2, duration: 0.5, ease: EASE }}
            style={{ height: "100%", borderRadius: 3, background: scoreColor }}
          />
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

const DEFAULT_WEIGHTS = { type: 50, age: 30, source: 20 };

export default function SignalScorePage() {
  const supabase = createClient();

  const [profileId,     setProfileId]     = useState("saas");
  const [showPicker,    setShowPicker]    = useState(false);
  const [weights,       setWeights]       = useState(DEFAULT_WEIGHTS);
  const [saving,        setSaving]        = useState(false);
  const [saveStatus,    setSaveStatus]    = useState<"idle" | "saving" | "saved" | "error">("idle");

  const pickerRef = useRef<HTMLDivElement>(null);

  const profile = FOUNDER_PROFILES.find((p) => p.id === profileId) ?? FOUNDER_PROFILES[0];
  const weightSum = weights.type + weights.age + weights.source;

  // ── load from Supabase ────
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const meta = data?.user?.user_metadata ?? {};
      if (meta.ss_profile) setProfileId(meta.ss_profile);
      if (meta.ss_weights) setWeights(meta.ss_weights);
    })();
  }, []);

  // ── close picker on outside click ────
  useEffect(() => {
    if (!showPicker) return;
    function handle(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [showPicker]);

  // ── save ────
  const save = useCallback(async () => {
    setSaving(true);
    setSaveStatus("saving");
    const { error } = await supabase.auth.updateUser({
      data: { ss_profile: profileId, ss_weights: weights },
    });
    setSaving(false);
    setSaveStatus(error ? "error" : "saved");
    setTimeout(() => setSaveStatus("idle"), 3000);
  }, [profileId, weights]);

  // ── example score calculation ────
  const exTypeScore  = (profile.scores.github / 10) * (weights.type   / 100);
  const exAgeScore   = (9                   / 10) * (weights.age    / 100);
  const exSrcScore   = (9                   / 10) * (weights.source / 100);
  const exFinal      = (exTypeScore + exAgeScore + exSrcScore) * 10;

  return (
    <>
      <style>{`
        .ss-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 18px; height: 18px; border-radius: 50%;
          background: #FF5200; cursor: pointer;
          margin-top: -6px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.45);
        }
        .ss-slider::-moz-range-thumb {
          width: 18px; height: 18px; border-radius: 50%;
          background: #FF5200; cursor: pointer; border: none;
        }
        .ss-profile-opt:hover { background: rgba(255,255,255,0.07) !important; }
        .ss-stat-card { transition: transform 0.18s ease, border-color 0.18s ease; }
        .ss-stat-card:hover { transform: translateY(-2px); border-color: rgba(255,82,0,0.25) !important; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px 80px", color: "#fff", fontFamily: "inherit" }}>

        {/* ── Header ── */}
        <motion.div {...fadeUp(0)} style={{ marginBottom: 36 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div style={{ display: "flex", gap: 18, alignItems: "flex-start" }}>
              <div style={{
                width: 56, height: 56, borderRadius: 16,
                background: "rgba(255,82,0,0.12)",
                border: "1px solid rgba(255,82,0,0.25)",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <Zap size={28} color="#FF5200" />
              </div>
              <div>
                <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>
                  Nexora Signal Score
                </h1>
                <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", margin: "4px 0 0" }}>
                  Proprietary algorithm that learns which signals convert best for your founder type
                </p>
              </div>
            </div>
            <div style={{
              fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase",
              padding: "5px 12px", borderRadius: 6,
              background: "rgba(0,208,132,0.12)", color: "#00d084",
              border: "1px solid rgba(0,208,132,0.2)",
              alignSelf: "flex-start", marginTop: 6,
            }}>
              ACTIVE
            </div>
          </div>
        </motion.div>

        {/* ══════════════════════════════════════════════════════════════════════
            SECTION 1: FOUNDER PROFILE
        ══════════════════════════════════════════════════════════════════════ */}
        <motion.div {...fadeUp(1)} style={{ marginBottom: 48 }}>
          <SectionHeader
            title="Founder Profile"
            description="We optimize signal scoring based on your business type"
          />

          <div ref={pickerRef} style={{ position: "relative" }}>
            {/* Current profile card */}
            <div style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,82,0,0.2)",
              borderRadius: 14,
              padding: "22px 24px",
            }}>
              <div style={{ marginBottom: 14 }}>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", letterSpacing: "0.04em", textTransform: "uppercase", fontWeight: 600 }}>
                  You are targeting:
                </span>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#FF5200", marginTop: 4 }}>
                  {profile.label}
                </div>
              </div>

              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", marginBottom: 14 }}>
                This means signals are weighted for:
              </div>
              <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6, marginBottom: 20 }}>
                {profile.tags.map((tag) => (
                  <li key={tag} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
                    <span style={{ color: "#FF5200", fontWeight: 700 }}>•</span>
                    {tag}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => setShowPicker((v) => !v)}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "9px 18px", borderRadius: 9,
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "rgba(255,255,255,0.75)", fontSize: 13, fontWeight: 600,
                  cursor: "pointer", transition: "all 0.15s ease",
                }}
              >
                Change Profile
                <ChevronDown
                  size={14}
                  style={{ transition: "transform 0.2s ease", transform: showPicker ? "rotate(180deg)" : "rotate(0deg)" }}
                />
              </button>
            </div>

            {/* Profile picker dropdown */}
            <AnimatePresence>
              {showPicker && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.98 }}
                  transition={{ duration: 0.18, ease: EASE }}
                  style={{
                    position: "absolute",
                    top: "calc(100% + 8px)",
                    left: 0,
                    right: 0,
                    background: "#0f0f18",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 12,
                    overflow: "hidden",
                    zIndex: 50,
                    boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
                  }}
                >
                  {FOUNDER_PROFILES.map((fp) => (
                    <button
                      key={fp.id}
                      onClick={() => { setProfileId(fp.id); setShowPicker(false); }}
                      className="ss-profile-opt"
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        width: "100%", padding: "13px 18px",
                        background: fp.id === profileId ? "rgba(255,82,0,0.08)" : "transparent",
                        border: "none", borderBottom: "1px solid rgba(255,255,255,0.05)",
                        color: fp.id === profileId ? "#FF5200" : "rgba(255,255,255,0.75)",
                        fontSize: 14, fontWeight: fp.id === profileId ? 700 : 400,
                        cursor: "pointer", textAlign: "left", transition: "background 0.12s ease",
                      }}
                    >
                      {fp.label}
                      {fp.id === profileId && (
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#FF5200", letterSpacing: "0.05em" }}>
                          CURRENT
                        </span>
                      )}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* ══════════════════════════════════════════════════════════════════════
            SECTION 2: SIGNAL SCORE BREAKDOWN
        ══════════════════════════════════════════════════════════════════════ */}
        <motion.div {...fadeUp(2)} style={{ marginBottom: 48 }}>
          <SectionHeader
            title="How Signals are Scored for Your Profile"
            description="Each signal type gets a score optimized for your business"
          />

          <AnimatePresence mode="wait">
            <motion.div
              key={profileId}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              style={{ display: "flex", flexDirection: "column", gap: 10 }}
            >
              {SIGNAL_DEFS.map((def, i) => (
                <SignalScoreCard
                  key={def.key}
                  index={i}
                  label={def.label}
                  score={profile.scores[def.key]}
                  description={def.descriptions[profileId as keyof typeof def.descriptions] ?? ""}
                />
              ))}
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* ══════════════════════════════════════════════════════════════════════
            SECTION 3: CONVERSION HISTORY
        ══════════════════════════════════════════════════════════════════════ */}
        <motion.div {...fadeUp(3)} style={{ marginBottom: 48 }}>
          <SectionHeader
            title="Signal Performance Data"
            description="Based on your 1,247 signals sent"
          />

          {/* Bar chart */}
          <div style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 14,
            padding: "24px 28px",
            marginBottom: 16,
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.5)", marginBottom: 20, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Signal Score Distribution
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {CHART_BARS.map((bar, i) => (
                <div key={bar.label} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 36, fontSize: 12, color: "rgba(255,255,255,0.4)", textAlign: "right", flexShrink: 0 }}>
                    {bar.label}
                  </div>
                  <div style={{ flex: 1, height: 20, borderRadius: 4, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(bar.count / MAX_BAR) * 100}%` }}
                      transition={{ delay: i * 0.08 + 0.2, duration: 0.55, ease: EASE }}
                      style={{
                        height: "100%", borderRadius: 4,
                        background: bar.pct >= 50 ? "#FF5200"
                          : bar.pct >= 10 ? "rgba(255,82,0,0.6)"
                          : "rgba(255,82,0,0.3)",
                      }}
                    />
                  </div>
                  <div style={{ width: 80, fontSize: 12, color: "rgba(255,255,255,0.5)", flexShrink: 0 }}>
                    <span style={{ color: "#fff", fontWeight: 600 }}>{bar.count.toLocaleString()}</span>
                    <span style={{ color: "rgba(255,255,255,0.3)", marginLeft: 4 }}>({bar.pct}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stat cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
            {[
              { label: "Average Signal Score", value: "8.2 / 10", color: "#FF5200" },
              { label: "Highest Scoring Signal", value: "GitHub upgrade (9.8)", color: "#00d084" },
              { label: "Lowest Scoring Signal", value: "General news (3.1)", color: "rgba(255,255,255,0.5)" },
              { label: "Top Converter", value: "Funding signals (23.4%)", color: "#00d084" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 + 0.1, duration: 0.24, ease: EASE }}
                className="ss-stat-card"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 12,
                  padding: "16px 18px",
                }}
              >
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 8 }}>
                  {stat.label}
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: stat.color }}>
                  {stat.value}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ══════════════════════════════════════════════════════════════════════
            SECTION 4: ALGORITHM DETAILS
        ══════════════════════════════════════════════════════════════════════ */}
        <motion.div {...fadeUp(4)} style={{ marginBottom: 48 }}>
          <SectionHeader
            title="How the Score is Calculated"
            description="Transparency: here's exactly how we score signals"
          />

          {/* Formula */}
          <div style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 14,
            padding: "24px 28px",
            marginBottom: 16,
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.4)", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Formula
            </div>
            <div style={{
              fontFamily: "monospace",
              fontSize: 13,
              lineHeight: 2.1,
              color: "rgba(255,255,255,0.65)",
              background: "rgba(0,0,0,0.3)",
              borderRadius: 10,
              padding: "16px 20px",
              border: "1px solid rgba(255,255,255,0.06)",
            }}>
              <div><span style={{ color: "rgba(255,255,255,0.35)" }}>Signal Score =</span></div>
              <div style={{ paddingLeft: 20 }}>
                <span style={{ color: "#FF5200" }}>(Signal Type Weight × Type Score)</span>
              </div>
              <div style={{ paddingLeft: 20 }}>
                <span style={{ color: "#fbbf24" }}>+ (Signal Age Weight × Age Score)</span>
              </div>
              <div style={{ paddingLeft: 20 }}>
                <span style={{ color: "#60a5fa" }}>+ (Source Authority Weight × Source Score)</span>
              </div>
              <div style={{ paddingLeft: 20, marginTop: 4 }}>
                <span style={{ color: "rgba(255,255,255,0.35)" }}>= </span>
                <span style={{ color: "#fff", fontWeight: 700 }}>Final Score (1-10)</span>
              </div>
            </div>
          </div>

          {/* Example breakdown */}
          <div style={{
            background: "rgba(255,82,0,0.04)",
            border: "1px solid rgba(255,82,0,0.15)",
            borderRadius: 14,
            padding: "22px 26px",
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.45)", marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Example Breakdown
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", marginBottom: 14 }}>
              GitHub upgrade detected for <span style={{ color: "#fff", fontWeight: 600 }}>TechCorp</span>:
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                {
                  label: `Signal Type (GitHub): ${profile.scores.github}/10 × ${weights.type}%`,
                  value: exTypeScore.toFixed(1),
                  color: "#FF5200",
                },
                {
                  label: `Signal Age (2 days old): 9/10 × ${weights.age}%`,
                  value: exAgeScore.toFixed(1),
                  color: "#fbbf24",
                },
                {
                  label: `Source Authority (verified): 9/10 × ${weights.source}%`,
                  value: exSrcScore.toFixed(1),
                  color: "#60a5fa",
                },
              ].map((row) => (
                <div key={row.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "rgba(255,255,255,0.6)" }}>
                    <span style={{ color: row.color, fontWeight: 700 }}>├─</span>
                    {row.label}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: row.color, flexShrink: 0 }}>
                    = {row.value}
                  </span>
                </div>
              ))}
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", marginTop: 4, paddingTop: 12, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#fff", fontWeight: 700 }}>
                  <span style={{ color: "#FF5200" }}>└─</span>
                  FINAL NEXORA SCORE
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                  <span style={{ fontSize: 20, fontWeight: 800, color: "#FF5200" }}>
                    {exFinal.toFixed(1)}/10
                  </span>
                  <Stars score={exFinal} />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ══════════════════════════════════════════════════════════════════════
            SECTION 5: CUSTOMIZE WEIGHTS
        ══════════════════════════════════════════════════════════════════════ */}
        <motion.div {...fadeUp(5)} style={{ marginBottom: 48 }}>
          <SectionHeader
            title="Advanced: Adjust Algorithm Weights"
            description="Fine-tune how signals are scored"
          />

          <div style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 14,
            padding: "24px 28px",
          }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
              {(
                [
                  { key: "type"   as const, label: "Signal Type Weight",      color: "#FF5200", desc: "How much does signal type matter?" },
                  { key: "age"    as const, label: "Signal Age Weight",        color: "#fbbf24", desc: "How much does freshness matter?" },
                  { key: "source" as const, label: "Source Authority Weight",  color: "#60a5fa", desc: "How much does source matter?" },
                ] as const
              ).map((row) => (
                <div key={row.key}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{row.label}</div>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.38)", marginTop: 2 }}>{row.desc}</div>
                    </div>
                    <div style={{
                      fontSize: 18, fontWeight: 800, color: row.color,
                      minWidth: 52, textAlign: "right",
                    }}>
                      {weights[row.key]}%
                    </div>
                  </div>
                  <RangeSlider
                    value={weights[row.key]}
                    min={0}
                    max={100}
                    step={5}
                    label={row.label}
                    onChange={(v) => setWeights((prev) => ({ ...prev, [row.key]: v }))}
                  />
                </div>
              ))}
            </div>

            {/* Weight sum indicator */}
            <div style={{
              marginTop: 22,
              padding: "12px 16px",
              borderRadius: 10,
              background: weightSum === 100
                ? "rgba(0,208,132,0.08)"
                : "rgba(251,191,36,0.08)",
              border: `1px solid ${weightSum === 100 ? "rgba(0,208,132,0.25)" : "rgba(251,191,36,0.25)"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 8,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                <Info size={14} color={weightSum === 100 ? "#00d084" : "#fbbf24"} />
                <span style={{ color: "rgba(255,255,255,0.55)" }}>
                  Weights must total{" "}
                  <span style={{ color: "#fff", fontWeight: 600 }}>100%</span>.
                  Adjusting these affects all signal scores.
                </span>
              </div>
              <div style={{
                fontSize: 16,
                fontWeight: 800,
                color: weightSum === 100 ? "#00d084" : "#fbbf24",
              }}>
                {weightSum}% {weightSum === 100 ? "✓" : ""}
              </div>
            </div>

            <button
              onClick={() => setWeights(DEFAULT_WEIGHTS)}
              style={{
                display: "flex", alignItems: "center", gap: 7,
                marginTop: 16, padding: "9px 18px", borderRadius: 9,
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "rgba(255,255,255,0.55)", fontSize: 13, fontWeight: 600,
                cursor: "pointer", transition: "all 0.15s ease",
              }}
            >
              <RotateCcw size={13} />
              Reset to Defaults
            </button>
          </div>
        </motion.div>

        {/* ══════════════════════════════════════════════════════════════════════
            SECTION 6: LEARNING PROGRESS
        ══════════════════════════════════════════════════════════════════════ */}
        <motion.div {...fadeUp(6)} style={{ marginBottom: 48 }}>
          <SectionHeader
            title="Model Learning Status"
            description="Your algorithm improves with data"
          />

          <div style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 14,
            padding: "24px 28px",
          }}>
            {/* Progress bar */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>
                  Signals analyzed:
                  <span style={{ color: "#fff", fontWeight: 700, marginLeft: 6 }}>1,247</span>
                  <span style={{ color: "rgba(255,255,255,0.3)", marginLeft: 4 }}>/ 10,000 needed for full accuracy</span>
                </span>
                <span style={{ fontSize: 14, fontWeight: 800, color: "#FF5200" }}>80%</span>
              </div>
              <div style={{ height: 10, borderRadius: 5, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "80%" }}
                  transition={{ delay: 0.3, duration: 0.8, ease: EASE }}
                  style={{
                    height: "100%", borderRadius: 5,
                    background: "linear-gradient(to right, #FF5200, #ff8c42)",
                  }}
                />
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginTop: 6 }}>
                Learning progress: 80% complete
              </div>
            </div>

            {/* Stats grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
              {[
                { label: "Last Updated",   value: "2 hours ago",  icon: <Activity size={14} /> },
                { label: "Model Accuracy", value: "87.3%",        icon: <Brain size={14} />, highlight: true },
                { label: "Next Update",    value: "In 2 hours",   icon: <TrendingUp size={14} /> },
                { label: "Total Signals",  value: "1,247",        icon: <Zap size={14} /> },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: `1px solid ${item.highlight ? "rgba(0,208,132,0.2)" : "rgba(255,255,255,0.07)"}`,
                    borderRadius: 10,
                    padding: "14px 16px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 7, color: "rgba(255,255,255,0.35)", marginBottom: 7 }}>
                    {item.icon}
                    <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      {item.label}
                    </span>
                  </div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: item.highlight ? "#00d084" : "#fff" }}>
                    {item.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Info callout */}
            <div style={{
              marginTop: 18,
              padding: "12px 16px",
              borderRadius: 10,
              background: "rgba(255,82,0,0.06)",
              border: "1px solid rgba(255,82,0,0.15)",
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              fontSize: 13,
              color: "rgba(255,255,255,0.5)",
            }}>
              <Info size={14} color="#FF5200" style={{ flexShrink: 0, marginTop: 1 }} />
              More signals = more accurate scoring. Keep sending campaigns!
            </div>
          </div>
        </motion.div>

        {/* ── Footer ── */}
        <motion.div {...fadeUp(7)}>
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 14,
            paddingTop: 24,
            borderTop: "1px solid rgba(255,255,255,0.07)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <button
                onClick={save}
                disabled={saving}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "11px 24px", borderRadius: 10,
                  background: saving ? "rgba(255,82,0,0.6)" : "#FF5200",
                  border: "none", color: "#fff", fontSize: 14, fontWeight: 700,
                  cursor: saving ? "not-allowed" : "pointer",
                  transition: "background 0.15s ease",
                }}
              >
                {saving && <Loader2 size={14} style={{ animation: "spin 0.8s linear infinite" }} />}
                {saving ? "Saving..." : "Save Settings"}
              </button>
              <SaveStatus status={saveStatus} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: "rgba(255,255,255,0.3)" }}>
              <Info size={13} />
              Algorithm updates automatically every 4 hours based on your reply data
            </div>
          </div>
        </motion.div>

      </div>
    </>
  );
}
