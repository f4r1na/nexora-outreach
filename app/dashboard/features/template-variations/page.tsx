"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutTemplate,
  Loader2,
  Info,
  Plus,
  Eye,
  Pencil,
  Copy,
  Trash2,
  Play,
  Trophy,
  Zap,
  Check,
  X,
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

const TONES = [
  { id: "professional", label: "Professional", desc: "Formal, business-like" },
  { id: "casual",       label: "Casual",       desc: "Friendly, conversational" },
  { id: "urgent",       label: "Urgent",       desc: "Time-sensitive, FOMO" },
  { id: "value_first",  label: "Value-First",  desc: "Lead with value proposition" },
  { id: "social_proof", label: "Social Proof", desc: "Mention other customers" },
] as const;

const SIGNAL_OPTIONS = [
  { value: "hiring",         label: "Hiring" },
  { value: "funding",        label: "Funding" },
  { value: "github",         label: "GitHub" },
  { value: "product_launch", label: "Product Launch" },
  { value: "general",        label: "General" },
];

const TONE_FILTER_OPTIONS = [
  { value: "all",          label: "All" },
  { value: "professional", label: "Professional" },
  { value: "casual",       label: "Casual" },
  { value: "urgent",       label: "Urgent" },
  { value: "value_first",  label: "Value-First" },
  { value: "social_proof", label: "Social Proof" },
];

const SIGNAL_FILTER_OPTIONS = [
  { value: "all",            label: "All" },
  { value: "hiring",         label: "Hiring" },
  { value: "funding",        label: "Funding" },
  { value: "github",         label: "GitHub" },
  { value: "product_launch", label: "Product Launch" },
  { value: "general",        label: "General" },
];

const STATUS_FILTER_OPTIONS = [
  { value: "all",      label: "All" },
  { value: "active",   label: "Active" },
  { value: "archived", label: "Archived" },
  { value: "testing",  label: "Testing" },
];

// ─── Static demo data ─────────────────────────────────────────────────────────

interface Template {
  id: string;
  name: string;
  tone: string;
  signal: string;
  variants: number;
  subject: string;
  preview: string;
  generated: string;
  campaigns: number;
  replyRate: number;
  status: "active" | "archived" | "testing";
}

const DEMO_TEMPLATES: Template[] = [
  {
    id: "t1",
    name: "Professional",
    tone: "professional",
    signal: "hiring",
    variants: 5,
    subject: "Noticed your recent hiring",
    preview: "Hi [Name], I saw you just posted several engineering roles...",
    generated: "Apr 30, 2026",
    campaigns: 3,
    replyRate: 8.2,
    status: "testing",
  },
  {
    id: "t2",
    name: "Casual Outreach",
    tone: "casual",
    signal: "funding",
    variants: 3,
    subject: "Congrats on the raise - quick thought",
    preview: "Hey [Name], saw the news about your Series B - congrats!...",
    generated: "Apr 28, 2026",
    campaigns: 2,
    replyRate: 7.4,
    status: "active",
  },
  {
    id: "t3",
    name: "Value-First FOMO",
    tone: "value_first",
    signal: "product_launch",
    variants: 4,
    subject: "What companies do after a product launch",
    preview: "Hi [Name], companies that launch new products typically see...",
    generated: "Apr 25, 2026",
    campaigns: 1,
    replyRate: 9.1,
    status: "active",
  },
];

interface AbRow {
  template: string;
  variant: string;
  sent: number;
  opened: number;
  openedPct: number;
  clicked: number;
  clickedPct: number;
  replied: number;
  replyRate: number;
  winner: boolean;
}

const AB_ROWS: AbRow[] = [
  { template: "Professional", variant: "Variant A", sent: 150, opened: 45, openedPct: 30, clicked: 12, clickedPct: 8,  replied: 12, replyRate: 8.0,  winner: false },
  { template: "Professional", variant: "Variant B", sent: 150, opened: 48, openedPct: 32, clicked: 15, clickedPct: 10, replied: 13, replyRate: 8.7,  winner: true  },
  { template: "Professional", variant: "Variant C", sent: 150, opened: 42, openedPct: 28, clicked: 11, clickedPct: 7,  replied: 10, replyRate: 6.7,  winner: false },
];

interface SubjectLine {
  id: string;
  text: string;
  rate: number;
}

const DEMO_SUBJECTS: SubjectLine[] = [
  { id: "s1", text: "Noticed your recent hiring at TechCorp",          rate: 8.2 },
  { id: "s2", text: "Quick question about your team expansion",         rate: 7.1 },
  { id: "s3", text: "Your company is growing fast - here's how we help", rate: 9.3 },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function ToneLabel({ tone }: { tone: string }) {
  const map: Record<string, string> = {
    professional: "Professional",
    casual:       "Casual",
    urgent:       "Urgent",
    value_first:  "Value-First",
    social_proof: "Social Proof",
  };
  return <>{map[tone] ?? tone}</>;
}

function SignalLabel({ signal }: { signal: string }) {
  const map: Record<string, string> = {
    hiring:         "Hiring",
    funding:        "Funding",
    github:         "GitHub",
    product_launch: "Product Launch",
    general:        "General",
  };
  return <>{map[signal] ?? signal}</>;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, React.CSSProperties> = {
    active:   { background: "rgba(0,208,132,0.15)", color: "#00d084" },
    archived: { background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" },
    testing:  { background: "rgba(251,191,36,0.15)", color: "#fbbf24" },
  };
  const labels: Record<string, string> = { active: "Active", archived: "Archived", testing: "Testing" };
  return (
    <span style={{
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: "0.04em",
      padding: "2px 8px",
      borderRadius: 4,
      textTransform: "uppercase",
      ...styles[status],
    }}>
      {labels[status] ?? status}
    </span>
  );
}

function TemplateCard({
  template,
  onDelete,
  onDuplicate,
}: {
  template: Template;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
}) {
  const [hoverBtn, setHoverBtn] = useState<string | null>(null);

  return (
    <div style={{
      background: "rgba(255,255,255,0.05)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 12,
      padding: "20px 24px",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>{template.name}</span>
            <StatusBadge status={template.status} />
          </div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>
            {template.variants} variants
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          {(["view", "edit", "duplicate", "delete"] as const).map((action) => {
            const icons = {
              view:      <Eye size={13} />,
              edit:      <Pencil size={13} />,
              duplicate: <Copy size={13} />,
              delete:    <Trash2 size={13} />,
            };
            const isDelete = action === "delete";
            const isDuplicate = action === "duplicate";
            return (
              <button
                key={action}
                onMouseEnter={() => setHoverBtn(action)}
                onMouseLeave={() => setHoverBtn(null)}
                onClick={() => {
                  if (isDuplicate) onDuplicate(template.id);
                  if (isDelete) onDelete(template.id);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 12,
                  padding: "4px 10px",
                  borderRadius: 6,
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: hoverBtn === action
                    ? isDelete ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.08)"
                    : "transparent",
                  color: hoverBtn === action && isDelete ? "#ef4444" : "rgba(255,255,255,0.6)",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  textTransform: "capitalize",
                }}
              >
                {icons[action]}
                {action.charAt(0).toUpperCase() + action.slice(1)}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", marginBottom: 6 }}>
        <span style={{ color: "rgba(255,255,255,0.35)", marginRight: 6 }}>Subject:</span>
        <span style={{ color: "rgba(255,255,255,0.75)", fontStyle: "italic" }}>"{template.subject}"</span>
      </div>
      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", marginBottom: 16 }}>
        <span style={{ color: "rgba(255,255,255,0.35)", marginRight: 6 }}>Preview:</span>
        {template.preview}
      </div>

      <div style={{ display: "flex", gap: 24, flexWrap: "wrap", fontSize: 12, color: "rgba(255,255,255,0.4)", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 12 }}>
        <span>Generated: <span style={{ color: "rgba(255,255,255,0.6)" }}>{template.generated}</span></span>
        <span>Campaigns: <span style={{ color: "rgba(255,255,255,0.6)" }}>{template.campaigns}</span></span>
        <span>Reply rate: <span style={{ color: "#fff", fontWeight: 600 }}>{template.replyRate}%</span></span>
        <span style={{ marginLeft: "auto" }}>
          <span style={{ color: "rgba(255,255,255,0.35)", marginRight: 6 }}>Tone:</span>
          <ToneLabel tone={template.tone} />
          <span style={{ color: "rgba(255,255,255,0.25)", margin: "0 6px" }}>·</span>
          <span style={{ color: "rgba(255,255,255,0.35)", marginRight: 6 }}>Signal:</span>
          <SignalLabel signal={template.signal} />
        </span>
      </div>
    </div>
  );
}

function RadioGroup({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {TONES.map((t) => (
        <label
          key={t.id}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            cursor: "pointer",
            padding: "12px 16px",
            borderRadius: 10,
            border: `1px solid ${value === t.id ? "rgba(255,82,0,0.4)" : "rgba(255,255,255,0.08)"}`,
            background: value === t.id ? "rgba(255,82,0,0.07)" : "transparent",
            transition: "all 0.15s ease",
          }}
        >
          <div style={{
            width: 18,
            height: 18,
            borderRadius: "50%",
            border: `2px solid ${value === t.id ? "#FF5200" : "rgba(255,255,255,0.25)"}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            transition: "border-color 0.15s ease",
          }}>
            <AnimatePresence>
              {value === t.id && (
                <motion.div
                  key="dot"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  style={{ width: 8, height: 8, borderRadius: "50%", background: "#FF5200" }}
                />
              )}
            </AnimatePresence>
          </div>
          <input
            type="radio"
            name="tone"
            value={t.id}
            checked={value === t.id}
            onChange={() => onChange(t.id)}
            style={{ display: "none" }}
          />
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: value === t.id ? "#fff" : "rgba(255,255,255,0.7)" }}>
              {t.label}
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.38)", marginTop: 1 }}>
              {t.desc}
            </div>
          </div>
        </label>
      ))}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function TemplateVariationsPage() {
  const supabase = createClient();

  // --- settings state ---
  const [templates, setTemplates] = useState<Template[]>(DEMO_TEMPLATES);
  const [selectedSignal, setSelectedSignal] = useState("hiring");
  const [selectedTone,   setSelectedTone]   = useState("professional");
  const [companyName,    setCompanyName]     = useState("");
  const [subjectBody,    setSubjectBody]     = useState("");
  const [generatedSubjects, setGeneratedSubjects] = useState<SubjectLine[] | null>(null);
  const [toneFilter,    setToneFilter]    = useState("all");
  const [signalFilter,  setSignalFilter]  = useState("all");
  const [statusFilter,  setStatusFilter]  = useState("all");
  const [sortCol,       setSortCol]       = useState<"name" | "tone" | "signal" | "variants" | "replyRate">("replyRate");
  const [sortDir,       setSortDir]       = useState<"asc" | "desc">("desc");

  // --- UI state ---
  const [generating,        setGenerating]        = useState(false);
  const [generatingSubject, setGeneratingSubject] = useState(false);
  const [saving,            setSaving]            = useState(false);
  const [saveStatus,        setSaveStatus]        = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [usedSubject,       setUsedSubject]        = useState<string | null>(null);
  const [abStopped,         setAbStopped]          = useState(false);
  const [abWinnerApplied,   setAbWinnerApplied]    = useState(false);


  // --- load from Supabase ---
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const meta = data?.user?.user_metadata ?? {};
      if (meta.tv_signal)  setSelectedSignal(meta.tv_signal);
      if (meta.tv_tone)    setSelectedTone(meta.tv_tone);
      if (meta.tv_company) setCompanyName(meta.tv_company);
    })();
  }, []);

  // --- save ---
  const save = useCallback(async () => {
    setSaving(true);
    setSaveStatus("saving");
    const { error } = await supabase.auth.updateUser({
      data: {
        tv_signal:  selectedSignal,
        tv_tone:    selectedTone,
        tv_company: companyName,
      },
    });
    setSaving(false);
    setSaveStatus(error ? "error" : "saved");
    setTimeout(() => setSaveStatus("idle"), 3000);
  }, [selectedSignal, selectedTone, companyName]);

  // --- generate variations (mock) ---
  const handleGenerate = useCallback(async () => {
    setGenerating(true);
    await new Promise((r) => setTimeout(r, 1800));
    const newTemplate: Template = {
      id: `t${Date.now()}`,
      name: TONES.find((t) => t.id === selectedTone)?.label ?? selectedTone,
      tone: selectedTone,
      signal: selectedSignal,
      variants: 5,
      subject: companyName
        ? `A note for ${companyName}`
        : TONES.find((t) => t.id === selectedTone)?.desc ?? "",
      preview: "Hi [Name], we noticed something interesting about your team...",
      generated: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      campaigns: 0,
      replyRate: 0,
      status: "active",
    };
    setTemplates((prev) => [newTemplate, ...prev]);
    setGenerating(false);
  }, [selectedTone, selectedSignal, companyName]);

  // --- generate subjects (mock) ---
  const handleGenerateSubjects = useCallback(async () => {
    if (!subjectBody.trim()) return;
    setGeneratingSubject(true);
    setGeneratedSubjects(null);
    await new Promise((r) => setTimeout(r, 1600));
    setGeneratedSubjects(DEMO_SUBJECTS);
    setGeneratingSubject(false);
  }, [subjectBody]);

  // --- template actions ---
  const handleDelete = useCallback((id: string) => {
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleDuplicate = useCallback((id: string) => {
    setTemplates((prev) => {
      const original = prev.find((t) => t.id === id);
      if (!original) return prev;
      const copy: Template = { ...original, id: `t${Date.now()}`, name: `${original.name} (copy)`, campaigns: 0, replyRate: 0, status: "active" };
      return [copy, ...prev];
    });
  }, []);

  // --- sort / filter library ---
  const filteredTemplates = templates.filter((t) => {
    if (toneFilter   !== "all" && t.tone   !== toneFilter)              return false;
    if (signalFilter !== "all" && t.signal !== signalFilter)            return false;
    if (statusFilter !== "all" && t.status !== statusFilter)            return false;
    return true;
  }).sort((a, b) => {
    let av: string | number = a[sortCol];
    let bv: string | number = b[sortCol];
    if (typeof av === "string") av = av.toLowerCase();
    if (typeof bv === "string") bv = bv.toLowerCase();
    if (av < bv) return sortDir === "asc" ? -1 : 1;
    if (av > bv) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  function toggleSort(col: typeof sortCol) {
    if (sortCol === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(col);
      setSortDir("desc");
    }
  }

  function SortIndicator({ col }: { col: typeof sortCol }) {
    if (sortCol !== col) return <span style={{ opacity: 0.25, fontSize: 10, marginLeft: 3 }}>↕</span>;
    return <span style={{ fontSize: 10, marginLeft: 3, color: "#FF5200" }}>{sortDir === "asc" ? "↑" : "↓"}</span>;
  }

  const thStyle: React.CSSProperties = {
    padding: "10px 14px",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.35)",
    textAlign: "left",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    cursor: "pointer",
    whiteSpace: "nowrap",
    userSelect: "none",
  };

  return (
    <>
      <style>{`
        .tv-input::placeholder { color: rgba(255,255,255,0.25); }
        .tv-input:focus { outline: none; border-color: rgba(255,82,0,0.5) !important; background: rgba(255,255,255,0.07) !important; }
        .tv-btn-ghost:hover { background: rgba(255,255,255,0.08); }
        .tv-subject-card:hover { background: rgba(255,255,255,0.07); border-color: rgba(255,82,0,0.3); }
        .tv-table-row:hover { background: rgba(255,255,255,0.04); }
      `}</style>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px 80px", color: "#fff", fontFamily: "inherit" }}>

        {/* ── Header ── */}
        <motion.div {...fadeUp(0)} style={{ marginBottom: 36 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div style={{ display: "flex", gap: 18, alignItems: "flex-start" }}>
              <div style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                background: "rgba(255,82,0,0.12)",
                border: "1px solid rgba(255,82,0,0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}>
                <LayoutTemplate size={28} color="#FF5200" />
              </div>
              <div>
                <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>
                  Email Template Variations
                </h1>
                <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", margin: "4px 0 0" }}>
                  Generate and A/B test multiple email versions with different tones
                </p>
              </div>
            </div>
            <div style={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              padding: "5px 12px",
              borderRadius: 6,
              background: "rgba(0,208,132,0.12)",
              color: "#00d084",
              border: "1px solid rgba(0,208,132,0.2)",
              alignSelf: "flex-start",
              marginTop: 6,
            }}>
              ACTIVE
            </div>
          </div>
        </motion.div>

        {/* ══════════════════════════════════════════════════════════════════════
            SECTION 1: TEMPLATE MANAGEMENT
        ══════════════════════════════════════════════════════════════════════ */}
        <motion.div {...fadeUp(1)} style={{ marginBottom: 48 }}>
          <SectionHeader
            title="Your Email Templates"
            description="Manage and test different email versions"
          />

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <AnimatePresence mode="popLayout">
              {templates.map((template, i) => (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97, y: -6 }}
                  transition={{ delay: i * 0.05, duration: 0.22, ease: EASE }}
                >
                  <TemplateCard
                    template={template}
                    onDelete={handleDelete}
                    onDuplicate={handleDuplicate}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <button
            onClick={handleGenerate}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 16,
              padding: "10px 18px",
              borderRadius: 10,
              background: "rgba(255,255,255,0.06)",
              border: "1px dashed rgba(255,255,255,0.18)",
              color: "rgba(255,255,255,0.55)",
              fontSize: 14,
              cursor: "pointer",
              transition: "all 0.15s ease",
              width: "100%",
              justifyContent: "center",
            }}
            className="tv-btn-ghost"
          >
            <Plus size={16} />
            New Template
          </button>
        </motion.div>

        {/* ══════════════════════════════════════════════════════════════════════
            SECTION 2: CREATE NEW TEMPLATE
        ══════════════════════════════════════════════════════════════════════ */}
        <motion.div {...fadeUp(2)} style={{ marginBottom: 48 }}>
          <SectionHeader
            title="Generate New Template Variations"
            description="Pick a tone and generate 5 variations"
          />

          <div style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 14,
            padding: "24px 28px",
            display: "flex",
            flexDirection: "column",
            gap: 24,
          }}>
            {/* Signal Type */}
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.75)", marginBottom: 8 }}>
                Signal Type
              </label>
              <select
                value={selectedSignal}
                onChange={(e) => setSelectedSignal(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "#060606",
                  color: "#fff",
                  fontSize: 14,
                  outline: "none",
                  cursor: "pointer",
                  appearance: "auto",
                  boxSizing: "border-box",
                  transition: "border-color 0.15s ease",
                }}
              >
                {SIGNAL_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value} style={{ backgroundColor: "#0e0e0e" }}>{o.label}</option>
                ))}
              </select>
            </div>

            {/* Tone Selection */}
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.75)", marginBottom: 10 }}>
                Tone Selection
              </label>
              <RadioGroup value={selectedTone} onChange={setSelectedTone} />
            </div>

            {/* Company Name */}
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.75)", marginBottom: 6 }}>
                Company Name <span style={{ color: "rgba(255,255,255,0.3)", fontWeight: 400 }}>(optional)</span>
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Acme Corp"
                className="tv-input"
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(255,255,255,0.05)",
                  color: "#fff",
                  fontSize: 14,
                  boxSizing: "border-box",
                  transition: "all 0.15s ease",
                }}
              />
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 5 }}>
                Auto-populated in email body
              </p>
            </div>

            {/* Generate button */}
            <button
              onClick={handleGenerate}
              disabled={generating}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: "12px 24px",
                borderRadius: 10,
                background: generating ? "rgba(255,82,0,0.6)" : "#FF5200",
                border: "none",
                color: "#fff",
                fontSize: 14,
                fontWeight: 700,
                cursor: generating ? "not-allowed" : "pointer",
                transition: "background 0.15s ease",
                alignSelf: "flex-start",
              }}
            >
              {generating ? (
                <>
                  <Loader2 size={15} style={{ animation: "spin 0.8s linear infinite" }} />
                  Generating...
                </>
              ) : (
                <>
                  <Play size={15} />
                  Generate Variations
                </>
              )}
            </button>
          </div>
        </motion.div>

        {/* ══════════════════════════════════════════════════════════════════════
            SECTION 3: ACTIVE A/B TESTS
        ══════════════════════════════════════════════════════════════════════ */}
        <motion.div {...fadeUp(3)} style={{ marginBottom: 48 }}>
          <SectionHeader
            title="Running A/B Tests"
            description="Compare email performance across variants"
          />

          <div style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 14,
            overflow: "hidden",
          }}>
            {abStopped ? (
              <div style={{ padding: "32px 24px", textAlign: "center", color: "rgba(255,255,255,0.35)", fontSize: 14 }}>
                Test stopped. No active A/B tests.
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 680 }}>
                  <thead>
                    <tr>
                      {["Template", "Variant", "Sent", "Opened", "Clicked", "Replied", "Reply Rate"].map((h) => (
                        <th key={h} style={thStyle}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {AB_ROWS.map((row, i) => (
                      <tr
                        key={i}
                        className="tv-table-row"
                        style={{
                          background: row.winner
                            ? "rgba(0,208,132,0.08)"
                            : i % 2 === 1 ? "rgba(255,255,255,0.02)" : "transparent",
                          transition: "background 0.15s ease",
                        }}
                      >
                        <td style={{ padding: "11px 14px", fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
                          {row.template}
                        </td>
                        <td style={{ padding: "11px 14px", fontSize: 13 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ color: row.winner ? "#00d084" : "rgba(255,255,255,0.75)" }}>
                              {row.variant}
                            </span>
                            {row.winner && (
                              <span style={{
                                fontSize: 10,
                                fontWeight: 700,
                                letterSpacing: "0.05em",
                                padding: "2px 6px",
                                borderRadius: 4,
                                background: "rgba(0,208,132,0.2)",
                                color: "#00d084",
                                textTransform: "uppercase",
                              }}>
                                Winner
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: "11px 14px", fontSize: 13, color: "rgba(255,255,255,0.75)" }}>{row.sent}</td>
                        <td style={{ padding: "11px 14px", fontSize: 13, color: "rgba(255,255,255,0.75)" }}>
                          {row.opened} <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }}>({row.openedPct}%)</span>
                        </td>
                        <td style={{ padding: "11px 14px", fontSize: 13, color: "rgba(255,255,255,0.75)" }}>
                          {row.clicked} <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }}>({row.clickedPct}%)</span>
                        </td>
                        <td style={{ padding: "11px 14px", fontSize: 13, color: "rgba(255,255,255,0.75)" }}>{row.replied}</td>
                        <td style={{ padding: "11px 14px", fontSize: 13, fontWeight: 700, color: "#fff" }}>
                          {row.replyRate}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {!abStopped && (
              <div style={{
                display: "flex",
                gap: 10,
                padding: "14px 18px",
                borderTop: "1px solid rgba(255,255,255,0.06)",
              }}>
                <button
                  onClick={() => setAbStopped(true)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "8px 14px",
                    borderRadius: 8,
                    background: "transparent",
                    border: "1px solid rgba(255,255,255,0.12)",
                    color: "rgba(255,255,255,0.6)",
                    fontSize: 13,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                  className="tv-btn-ghost"
                >
                  <X size={13} />
                  Stop Test
                </button>
                <button
                  onClick={() => setAbWinnerApplied(true)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "8px 14px",
                    borderRadius: 8,
                    background: abWinnerApplied ? "rgba(0,208,132,0.15)" : "rgba(0,208,132,0.12)",
                    border: "1px solid rgba(0,208,132,0.3)",
                    color: "#00d084",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <AnimatePresence mode="wait">
                    {abWinnerApplied ? (
                      <motion.span key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Check size={13} />
                        Winner Applied
                      </motion.span>
                    ) : (
                      <motion.span key="use" initial={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Trophy size={13} />
                        Use Winner
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* ══════════════════════════════════════════════════════════════════════
            SECTION 4: SUBJECT LINE GENERATION
        ══════════════════════════════════════════════════════════════════════ */}
        <motion.div {...fadeUp(4)} style={{ marginBottom: 48 }}>
          <SectionHeader
            title="Subject Line A/B Testing"
            description="Generate multiple subject line options"
          />

          <div style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 14,
            padding: "24px 28px",
          }}>
            <textarea
              value={subjectBody}
              onChange={(e) => setSubjectBody(e.target.value)}
              placeholder="Paste your email body here..."
              className="tv-input"
              rows={5}
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.05)",
                color: "#fff",
                fontSize: 14,
                resize: "vertical",
                boxSizing: "border-box",
                fontFamily: "inherit",
                transition: "all 0.15s ease",
                minHeight: 110,
              }}
            />

            <button
              onClick={handleGenerateSubjects}
              disabled={generatingSubject || !subjectBody.trim()}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginTop: 14,
                padding: "11px 22px",
                borderRadius: 10,
                background: generatingSubject || !subjectBody.trim() ? "rgba(255,82,0,0.45)" : "#FF5200",
                border: "none",
                color: "#fff",
                fontSize: 14,
                fontWeight: 700,
                cursor: generatingSubject || !subjectBody.trim() ? "not-allowed" : "pointer",
                transition: "background 0.15s ease",
              }}
            >
              {generatingSubject ? (
                <>
                  <Loader2 size={15} style={{ animation: "spin 0.8s linear infinite" }} />
                  Generating...
                </>
              ) : (
                <>
                  <Zap size={15} />
                  Generate Subject Lines
                </>
              )}
            </button>

            <AnimatePresence>
              {generatedSubjects && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.22, ease: EASE }}
                  style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 10 }}
                >
                  {generatedSubjects.map((s, i) => (
                    <motion.div
                      key={s.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.07, duration: 0.22, ease: EASE }}
                      className="tv-subject-card"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 14,
                        padding: "14px 16px",
                        borderRadius: 10,
                        border: usedSubject === s.id
                          ? "1px solid rgba(0,208,132,0.35)"
                          : "1px solid rgba(255,255,255,0.08)",
                        background: usedSubject === s.id
                          ? "rgba(0,208,132,0.07)"
                          : "rgba(255,255,255,0.04)",
                        transition: "all 0.15s ease",
                        cursor: "default",
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 13, color: "#fff", marginBottom: 4 }}>
                          <span style={{ color: "rgba(255,255,255,0.35)", marginRight: 6 }}>{i + 1}.</span>
                          "{s.text}"
                        </div>
                        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
                          Preview reply rate: <span style={{ color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>~{s.rate}%</span>
                        </div>
                      </div>
                      <button
                        onClick={() => setUsedSubject(s.id)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "6px 14px",
                          borderRadius: 7,
                          border: usedSubject === s.id ? "1px solid rgba(0,208,132,0.4)" : "1px solid rgba(255,255,255,0.15)",
                          background: usedSubject === s.id ? "rgba(0,208,132,0.15)" : "transparent",
                          color: usedSubject === s.id ? "#00d084" : "rgba(255,255,255,0.6)",
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: "pointer",
                          flexShrink: 0,
                          transition: "all 0.15s ease",
                        }}
                      >
                        {usedSubject === s.id ? <><Check size={12} /> Used</> : "Use"}
                      </button>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* ══════════════════════════════════════════════════════════════════════
            SECTION 5: TEMPLATE LIBRARY
        ══════════════════════════════════════════════════════════════════════ */}
        <motion.div {...fadeUp(5)} style={{ marginBottom: 48 }}>
          <SectionHeader
            title="View All Templates"
            description="Browse templates by tone and signal type"
          />

          {/* Filters */}
          <div style={{ display: "flex", gap: 14, marginBottom: 16, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 160 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginBottom: 5 }}>
                Tone
              </label>
              <select
                value={toneFilter}
                onChange={(e) => setToneFilter(e.target.value)}
                style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "#060606", color: "#fff", fontSize: 13, outline: "none", cursor: "pointer", appearance: "auto", boxSizing: "border-box" }}
              >
                {TONE_FILTER_OPTIONS.map((o) => <option key={o.value} value={o.value} style={{ backgroundColor: "#0e0e0e" }}>{o.label}</option>)}
              </select>
            </div>
            <div style={{ flex: 1, minWidth: 160 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginBottom: 5 }}>
                Signal
              </label>
              <select
                value={signalFilter}
                onChange={(e) => setSignalFilter(e.target.value)}
                style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "#060606", color: "#fff", fontSize: 13, outline: "none", cursor: "pointer", appearance: "auto", boxSizing: "border-box" }}
              >
                {SIGNAL_FILTER_OPTIONS.map((o) => <option key={o.value} value={o.value} style={{ backgroundColor: "#0e0e0e" }}>{o.label}</option>)}
              </select>
            </div>
            <div style={{ flex: 1, minWidth: 140 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginBottom: 5 }}>
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "#060606", color: "#fff", fontSize: 13, outline: "none", cursor: "pointer", appearance: "auto", boxSizing: "border-box" }}
              >
                {STATUS_FILTER_OPTIONS.map((o) => <option key={o.value} value={o.value} style={{ backgroundColor: "#0e0e0e" }}>{o.label}</option>)}
              </select>
            </div>
          </div>

          {/* Table */}
          <div style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 14,
            overflow: "hidden",
          }}>
            {filteredTemplates.length === 0 ? (
              <div style={{ padding: "32px 24px", textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: 14 }}>
                No templates match these filters.
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 620 }}>
                  <thead>
                    <tr>
                      {(
                        [
                          ["name",      "Template Name"],
                          ["tone",      "Tone"],
                          ["signal",    "Signal"],
                          ["variants",  "Variants"],
                          ["replyRate", "Reply Rate"],
                        ] as [typeof sortCol, string][]
                      ).map(([col, label]) => (
                        <th key={col} style={thStyle} onClick={() => toggleSort(col)}>
                          {label}
                          <SortIndicator col={col} />
                        </th>
                      ))}
                      <th style={{ ...thStyle, cursor: "default" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {filteredTemplates.map((t, i) => (
                        <motion.tr
                          key={t.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ delay: i * 0.04, duration: 0.18 }}
                          className="tv-table-row"
                          style={{
                            background: i % 2 === 1 ? "rgba(255,255,255,0.02)" : "transparent",
                            transition: "background 0.15s ease",
                          }}
                        >
                          <td style={{ padding: "11px 14px", fontSize: 13, fontWeight: 600, color: "#fff" }}>{t.name}</td>
                          <td style={{ padding: "11px 14px", fontSize: 13, color: "rgba(255,255,255,0.65)" }}><ToneLabel tone={t.tone} /></td>
                          <td style={{ padding: "11px 14px", fontSize: 13, color: "rgba(255,255,255,0.65)" }}><SignalLabel signal={t.signal} /></td>
                          <td style={{ padding: "11px 14px", fontSize: 13, color: "rgba(255,255,255,0.65)" }}>{t.variants}</td>
                          <td style={{ padding: "11px 14px", fontSize: 13, fontWeight: 700, color: t.replyRate >= 8 ? "#00d084" : "#fff" }}>
                            {t.replyRate > 0 ? `${t.replyRate}%` : "-"}
                          </td>
                          <td style={{ padding: "11px 14px" }}>
                            <div style={{ display: "flex", gap: 6 }}>
                              <button
                                onClick={() => handleDuplicate(t.id)}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 4,
                                  fontSize: 11,
                                  padding: "3px 9px",
                                  borderRadius: 5,
                                  border: "1px solid rgba(255,255,255,0.1)",
                                  background: "transparent",
                                  color: "rgba(255,255,255,0.5)",
                                  cursor: "pointer",
                                  transition: "all 0.15s ease",
                                }}
                                className="tv-btn-ghost"
                              >
                                <Copy size={11} />
                                Duplicate
                              </button>
                              <button
                                onClick={() => handleDelete(t.id)}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 4,
                                  fontSize: 11,
                                  padding: "3px 9px",
                                  borderRadius: 5,
                                  border: "1px solid rgba(239,68,68,0.2)",
                                  background: "transparent",
                                  color: "rgba(239,68,68,0.6)",
                                  cursor: "pointer",
                                  transition: "all 0.15s ease",
                                }}
                              >
                                <Trash2 size={11} />
                                Delete
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </motion.div>

        {/* ── Footer ── */}
        <motion.div {...fadeUp(6)}>
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
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "11px 24px",
                  borderRadius: 10,
                  background: saving ? "rgba(255,82,0,0.6)" : "#FF5200",
                  border: "none",
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 700,
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
              A/B tests run automatically - results update every 4 hours
            </div>
          </div>
        </motion.div>

      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}
