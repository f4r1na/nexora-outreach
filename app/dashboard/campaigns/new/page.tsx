"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UpgradeModal } from "@/components/upgrade-modal";
import type { PlanKey } from "@/lib/plans";

// ─── Types ────────────────────────────────────────────────────────────────────

type Lead = {
  first_name: string;
  company: string;
  role: string;
  email: string;
  custom_note: string;
};

type GeneratedEmail = {
  lead_id: string;
  first_name: string;
  company: string;
  email: string;
  subject: string;
  body: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const TONES = ["Professional", "Friendly", "Bold", "Minimal"] as const;

// ─── CSV Parser ───────────────────────────────────────────────────────────────

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function normalizeHeader(h: string): string {
  return h.toLowerCase().replace(/[\s_\-]+/g, "_").replace(/[^a-z_]/g, "");
}

function findIdx(headers: string[], ...keys: string[]): number {
  for (const key of keys) {
    const i = headers.findIndex((h) => h === key || h.startsWith(key));
    if (i >= 0) return i;
  }
  return -1;
}

function parseCSV(text: string): Lead[] {
  const lines = text.trim().split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const rawHeaders = parseCSVLine(lines[0]);
  const headers = rawHeaders.map(normalizeHeader);

  const nameIdx = findIdx(headers, "first_name", "name", "firstname", "full_name");
  const companyIdx = findIdx(headers, "company", "organization", "org", "employer");
  const roleIdx = findIdx(headers, "role", "title", "job_title", "position", "job");
  const emailIdx = findIdx(headers, "email", "email_address", "mail");
  const noteIdx = findIdx(headers, "custom_note", "note", "notes", "message", "context");

  const parsed = lines
    .slice(1)
    .filter((l) => l.trim())
    .map((line) => {
      const cols = parseCSVLine(line);
      // Use null-safe get: returns the trimmed value or "" if column missing/empty
      const get = (idx: number) =>
        idx >= 0 && cols[idx] !== undefined ? cols[idx].trim() : "";
      return {
        first_name: get(nameIdx),
        company: get(companyIdx),
        role: get(roleIdx),
        email: get(emailIdx),
        custom_note: get(noteIdx),
      };
    });

  console.log("[CSV parser] headers detected:", {
    name: nameIdx,
    company: companyIdx,
    role: roleIdx,
    email: emailIdx,
    note: noteIdx,
  });
  console.log("[CSV parser] parsed leads:", parsed);
  return parsed;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: 1 | 2 | 3 }) {
  const steps = [
    { n: 1, label: "Name Campaign" },
    { n: 2, label: "Upload Leads" },
    { n: 3, label: "Review Emails" },
  ];

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 0,
        marginBottom: 36,
      }}
    >
      {steps.map((step, i) => {
        const done = current > step.n;
        const active = current === step.n;
        return (
          <div key={step.n} style={{ display: "flex", alignItems: "center", flex: i < 2 ? 1 : "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 700,
                  fontFamily: "var(--font-syne)",
                  backgroundColor: done || active ? "#FF5200" : "rgba(255,255,255,0.06)",
                  color: done || active ? "#fff" : "rgba(255,255,255,0.3)",
                  border: done || active ? "none" : "1px solid rgba(255,255,255,0.1)",
                  transition: "all 0.2s",
                }}
              >
                {done ? (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  step.n
                )}
              </div>
              <span
                style={{
                  fontSize: 13,
                  fontFamily: "var(--font-outfit)",
                  fontWeight: active ? 600 : 400,
                  color: active ? "#fff" : done ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.25)",
                  whiteSpace: "nowrap",
                }}
              >
                {step.label}
              </span>
            </div>
            {i < 2 && (
              <div
                style={{
                  flex: 1,
                  height: 1,
                  margin: "0 16px",
                  backgroundColor: current > step.n ? "rgba(255,82,0,0.4)" : "rgba(255,255,255,0.07)",
                  transition: "background-color 0.3s",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function ProgressBar({ progress }: { progress: number }) {
  return (
    <div
      style={{
        width: "100%",
        height: 4,
        borderRadius: 99,
        backgroundColor: "rgba(255,255,255,0.06)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${progress}%`,
          borderRadius: 99,
          backgroundColor: "#FF5200",
          transition: "width 0.4s ease",
          boxShadow: "0 0 12px rgba(255,82,0,0.6)",
        }}
      />
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconUpload() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 15V3M8 7l4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 17v1a3 3 0 003 3h12a3 3 0 003-3v-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconEdit() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M11.5 2.5a1.414 1.414 0 112 2L5 13H3v-2L11.5 2.5z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconExport() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2 11v2a1 1 0 001 1h10a1 1 0 001-1v-2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M8 2v8M5 7l3 3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconArrowLeft() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NewCampaignPage() {
  const router = useRouter();

  // ── Step 1 state
  const [name, setName] = useState("");
  const [tone, setTone] = useState<string>("Professional");

  // ── Step 2 state
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Step 3 state
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [emails, setEmails] = useState<GeneratedEmail[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editSubject, setEditSubject] = useState("");
  const [editBody, setEditBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [upgradeModal, setUpgradeModal] = useState<PlanKey | null>(null);
  const [userPlan, setUserPlan] = useState<string>("free");
  const [downloading, setDownloading] = useState<string | null>(null);

  // Fetch user plan for export gate
  useEffect(() => {
    fetch("/api/subscription")
      .then((r) => r.json())
      .then((d) => setUserPlan(d.subscription?.plan ?? "free"))
      .catch(() => {});
  }, []);

  async function handleDownload(format: "csv" | "pdf" | "docx") {
    if (!campaignId) return;
    setDownloading(format);
    try {
      const res = await fetch(`/api/export?campaignId=${campaignId}&format=${format}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Export failed" }));
        alert(err.error ?? "Export failed");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `nexora-campaign-${campaignId.slice(0, 8)}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      alert("Download failed. Please try again.");
    } finally {
      setDownloading(null);
    }
  }

  // ── CSV handling
  const handleFile = useCallback((file: File) => {
    if (!file.name.endsWith(".csv")) {
      setError("Please upload a .csv file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = parseCSV(text);
      if (parsed.length === 0) {
        setError("No leads found. Make sure your CSV has headers and data rows.");
        return;
      }
      setError(null);
      setLeads(parsed);
    };
    reader.readAsText(file);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  // ── Progress bar animation during generation
  useEffect(() => {
    if (!isGenerating) return;
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 88) {
          clearInterval(interval);
          return 88;
        }
        return p + Math.random() * 6 + 2;
      });
    }, 500);
    return () => clearInterval(interval);
  }, [isGenerating]);

  // ── Generate
  const handleGenerate = async () => {
    setError(null);
    setIsGenerating(true);
    setStep(3);
    try {
      // Debug: verify notes are present before sending
      console.log("[wizard] sending leads to API:", JSON.stringify(leads, null, 2));
      leads.forEach((l, i) =>
        console.log(`[wizard] lead ${i} — name: "${l.first_name}", note: "${l.custom_note}"`)
      );

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignName: name, tone, leads }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      setProgress(100);
      await new Promise((r) => setTimeout(r, 600));
      setCampaignId(data.campaignId);
      setEmails(data.emails);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStep(2);
    } finally {
      setIsGenerating(false);
    }
  };

  // ── Edit save
  const saveEdit = (id: string) => {
    setEmails((prev) =>
      prev.map((e) =>
        e.lead_id === id ? { ...e, subject: editSubject, body: editBody } : e
      )
    );
    setEditingId(null);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Top bar */}
      <header
        style={{
          padding: "0 32px",
          height: 68,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          backgroundColor: "rgba(6,6,6,0.85)",
          backdropFilter: "blur(12px)",
          position: "sticky",
          top: 0,
          zIndex: 30,
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link
            href="/dashboard"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              color: "rgba(255,255,255,0.4)",
              fontSize: 13,
              fontFamily: "var(--font-outfit)",
              textDecoration: "none",
              padding: "6px 10px",
              borderRadius: 7,
              border: "1px solid rgba(255,255,255,0.07)",
              transition: "color 0.15s",
            }}
          >
            <IconArrowLeft />
            Back
          </Link>
          <span style={{ color: "rgba(255,255,255,0.12)", fontSize: 16 }}>/</span>
          <span
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: "#fff",
              fontFamily: "var(--font-syne)",
            }}
          >
            New Campaign
          </span>
        </div>

        {/* Export buttons — only in review state */}
        {step === 3 && !isGenerating && emails.length > 0 && campaignId && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>

            {/* CSV — always available, orange */}
            <button
              onClick={() => handleDownload("csv")}
              disabled={downloading === "csv"}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "7px 14px", borderRadius: 8, fontSize: 12.5, fontWeight: 600,
                fontFamily: "var(--font-outfit)", cursor: "pointer",
                backgroundColor: "#FF5200", color: "#fff", border: "none",
                opacity: downloading === "csv" ? 0.7 : 1,
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {downloading === "csv" ? "Downloading…" : "Export CSV"}
            </button>

            {/* PDF — dark + orange border, "Pro" badge; redirects to settings if not pro+ */}
            <button
              onClick={() => {
                if (userPlan === "free" || userPlan === "starter") {
                  router.push("/dashboard/settings");
                } else {
                  handleDownload("pdf");
                }
              }}
              disabled={downloading === "pdf"}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "7px 14px", borderRadius: 8, fontSize: 12.5, fontWeight: 600,
                fontFamily: "var(--font-outfit)", cursor: "pointer",
                backgroundColor: "rgba(255,82,0,0.08)", color: "#fff",
                border: "1px solid rgba(255,82,0,0.35)",
                opacity: downloading === "pdf" ? 0.7 : 1,
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {downloading === "pdf" ? "Downloading…" : "Export PDF"}
              {(userPlan === "free" || userPlan === "starter") && (
                <span style={{
                  fontSize: 9, fontWeight: 800, color: "#FF5200",
                  background: "rgba(255,82,0,0.15)", padding: "1px 6px", borderRadius: 3,
                }}>Pro</span>
              )}
            </button>

            {/* Word — dark + orange border, "Agency" badge; redirects to settings if not agency */}
            <button
              onClick={() => {
                if (userPlan !== "agency") {
                  router.push("/dashboard/settings");
                } else {
                  handleDownload("docx");
                }
              }}
              disabled={downloading === "docx"}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "7px 14px", borderRadius: 8, fontSize: 12.5, fontWeight: 600,
                fontFamily: "var(--font-outfit)", cursor: "pointer",
                backgroundColor: "rgba(255,82,0,0.08)", color: "#fff",
                border: "1px solid rgba(255,82,0,0.35)",
                opacity: downloading === "docx" ? 0.7 : 1,
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {downloading === "docx" ? "Downloading…" : "Export Word"}
              {userPlan !== "agency" && (
                <span style={{
                  fontSize: 9, fontWeight: 800, color: "#FF5200",
                  background: "rgba(255,82,0,0.15)", padding: "1px 6px", borderRadius: 3,
                }}>Agency</span>
              )}
            </button>

          </div>
        )}

        {/* Upgrade modal */}
        {upgradeModal && (
          <UpgradeModal requiredPlan={upgradeModal} onClose={() => setUpgradeModal(null)} />
        )}
      </header>

      {/* Page body */}
      <main
        style={{
          flex: 1,
          padding: "36px 32px 64px",
          maxWidth: 760,
          width: "100%",
          marginInline: "auto",
        }}
      >
        <StepIndicator current={step} />

        {/* ── STEP 1 ── */}
        {step === 1 && (
          <div className="fade-up">
            <h1
              style={{
                fontSize: 26,
                fontWeight: 700,
                color: "#fff",
                fontFamily: "var(--font-syne)",
                marginBottom: 6,
              }}
            >
              Name your campaign
            </h1>
            <p
              style={{
                fontSize: 14,
                color: "rgba(255,255,255,0.4)",
                fontFamily: "var(--font-outfit)",
                marginBottom: 32,
              }}
            >
              Give it a clear name and choose the tone for your cold emails.
            </p>

            {/* Campaign name */}
            <div style={{ marginBottom: 28 }}>
              <label
                htmlFor="campaign-name"
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 500,
                  color: "rgba(255,255,255,0.55)",
                  fontFamily: "var(--font-outfit)",
                  marginBottom: 8,
                }}
              >
                Campaign name
              </label>
              <input
                id="campaign-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. SaaS Founders Q2"
                className="nx-input"
                autoFocus
              />
            </div>

            {/* Tone */}
            <div style={{ marginBottom: 36 }}>
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: "rgba(255,255,255,0.55)",
                  fontFamily: "var(--font-outfit)",
                  marginBottom: 10,
                }}
              >
                Tone
              </p>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {TONES.map((t) => {
                  const active = tone === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTone(t)}
                      style={{
                        padding: "9px 20px",
                        borderRadius: 8,
                        border: active
                          ? "1px solid rgba(255,82,0,0.5)"
                          : "1px solid rgba(255,255,255,0.09)",
                        backgroundColor: active
                          ? "rgba(255,82,0,0.15)"
                          : "rgba(255,255,255,0.03)",
                        color: active ? "#FF5200" : "rgba(255,255,255,0.5)",
                        fontSize: 13.5,
                        fontWeight: active ? 600 : 400,
                        fontFamily: "var(--font-outfit)",
                        cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              disabled={!name.trim()}
              onClick={() => setStep(2)}
              className="nx-btn"
              style={{ maxWidth: 200 }}
            >
              Continue →
            </button>
          </div>
        )}

        {/* ── STEP 2 ── */}
        {step === 2 && (
          <div className="fade-up">
            <h1
              style={{
                fontSize: 26,
                fontWeight: 700,
                color: "#fff",
                fontFamily: "var(--font-syne)",
                marginBottom: 6,
              }}
            >
              Upload your leads
            </h1>
            <p
              style={{
                fontSize: 14,
                color: "rgba(255,255,255,0.4)",
                fontFamily: "var(--font-outfit)",
                marginBottom: 32,
              }}
            >
              Drop a CSV with columns: <em>name, company, role, email, note</em>.
              Any order, any extra columns are ignored.
            </p>

            {/* Drop zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: isDragging
                  ? "2px solid #FF5200"
                  : "2px dashed rgba(255,255,255,0.12)",
                borderRadius: 14,
                padding: "40px 24px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 10,
                cursor: "pointer",
                backgroundColor: isDragging
                  ? "rgba(255,82,0,0.05)"
                  : "rgba(255,255,255,0.02)",
                transition: "all 0.15s",
                marginBottom: 24,
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 12,
                  backgroundColor: "rgba(255,82,0,0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#FF5200",
                  marginBottom: 4,
                }}
              >
                <IconUpload />
              </div>
              <p
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#fff",
                  fontFamily: "var(--font-outfit)",
                  margin: 0,
                }}
              >
                Drop your CSV here or{" "}
                <span style={{ color: "#FF5200" }}>browse files</span>
              </p>
              <p
                style={{
                  fontSize: 12,
                  color: "rgba(255,255,255,0.3)",
                  fontFamily: "var(--font-outfit)",
                  margin: 0,
                }}
              >
                .csv files only
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                style={{ display: "none" }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />
            </div>

            {error && (
              <p className="nx-error" style={{ marginBottom: 16 }}>
                {error}
              </p>
            )}

            {/* Preview table */}
            {leads.length > 0 && (
              <div style={{ marginBottom: 28 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 12,
                  }}
                >
                  <p
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#fff",
                      fontFamily: "var(--font-outfit)",
                    }}
                  >
                    {leads.length} lead{leads.length !== 1 ? "s" : ""} ready
                  </p>
                  <button
                    type="button"
                    onClick={() => setLeads([])}
                    style={{
                      fontSize: 12,
                      color: "rgba(255,255,255,0.3)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontFamily: "var(--font-outfit)",
                    }}
                  >
                    Remove
                  </button>
                </div>

                <div
                  style={{
                    borderRadius: 10,
                    border: "1px solid rgba(255,255,255,0.07)",
                    overflow: "hidden",
                  }}
                >
                  {/* Column headers */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr",
                      padding: "8px 16px",
                      backgroundColor: "rgba(255,255,255,0.03)",
                      borderBottom: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    {["Name", "Company", "Role", "Email", "Note"].map((col) => (
                      <div
                        key={col}
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          letterSpacing: "0.07em",
                          textTransform: "uppercase",
                          color: "rgba(255,255,255,0.25)",
                          fontFamily: "var(--font-outfit)",
                        }}
                      >
                        {col}
                      </div>
                    ))}
                  </div>

                  {/* Rows (max 5 preview) */}
                  {leads.slice(0, 5).map((lead, i) => (
                    <div
                      key={i}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr",
                        padding: "10px 16px",
                        borderBottom:
                          i < Math.min(leads.length, 5) - 1
                            ? "1px solid rgba(255,255,255,0.04)"
                            : "none",
                      }}
                    >
                      {[
                        lead.first_name,
                        lead.company,
                        lead.role,
                        lead.email,
                        lead.custom_note,
                      ].map((val, j) => (
                        <div
                          key={j}
                          style={{
                            fontSize: 12,
                            color: val
                              ? "rgba(255,255,255,0.65)"
                              : "rgba(255,255,255,0.2)",
                            fontFamily: "var(--font-outfit)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            paddingRight: 8,
                          }}
                        >
                          {val || "—"}
                        </div>
                      ))}
                    </div>
                  ))}

                  {leads.length > 5 && (
                    <div
                      style={{
                        padding: "8px 16px",
                        fontSize: 11,
                        color: "rgba(255,255,255,0.25)",
                        fontFamily: "var(--font-outfit)",
                        backgroundColor: "rgba(255,255,255,0.02)",
                      }}
                    >
                      +{leads.length - 5} more leads not shown
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: "flex", gap: 12 }}>
              <button
                type="button"
                onClick={() => setStep(1)}
                style={{
                  padding: "10px 20px",
                  borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.09)",
                  backgroundColor: "transparent",
                  color: "rgba(255,255,255,0.5)",
                  fontSize: 13.5,
                  fontWeight: 500,
                  fontFamily: "var(--font-outfit)",
                  cursor: "pointer",
                }}
              >
                ← Back
              </button>
              <button
                type="button"
                disabled={leads.length === 0}
                onClick={handleGenerate}
                className="nx-btn"
                style={{ flex: 1, maxWidth: 220 }}
              >
                Generate emails →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Loading ── */}
        {step === 3 && isGenerating && (
          <div
            className="fade-up"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              paddingTop: 40,
              gap: 24,
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 16,
                backgroundColor: "rgba(255,82,0,0.1)",
                border: "1px solid rgba(255,82,0,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10"
                  stroke="#FF5200"
                  strokeWidth="2"
                  strokeLinecap="round"
                  style={{ animation: "spin 1s linear infinite" }}
                />
              </svg>
            </div>

            <div style={{ textAlign: "center" }}>
              <h2
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: "#fff",
                  fontFamily: "var(--font-syne)",
                  marginBottom: 8,
                }}
              >
                AI is writing {leads.length} email{leads.length !== 1 ? "s" : ""}…
              </h2>
              <p
                style={{
                  fontSize: 13,
                  color: "rgba(255,255,255,0.35)",
                  fontFamily: "var(--font-outfit)",
                }}
              >
                Crafting hyper-personalized cold emails for each lead.
              </p>
            </div>

            <div style={{ width: "100%", maxWidth: 400 }}>
              <ProgressBar progress={progress} />
              <p
                style={{
                  fontSize: 11,
                  color: "rgba(255,255,255,0.25)",
                  fontFamily: "var(--font-outfit)",
                  marginTop: 8,
                  textAlign: "center",
                }}
              >
                {Math.round(progress)}% complete
              </p>
            </div>

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* ── STEP 3: Review ── */}
        {step === 3 && !isGenerating && emails.length > 0 && (
          <div className="fade-up">
            {error && (
              <p className="nx-error" style={{ marginBottom: 20 }}>
                {error}
              </p>
            )}

            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                marginBottom: 24,
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <div>
                <h1
                  style={{
                    fontSize: 24,
                    fontWeight: 700,
                    color: "#fff",
                    fontFamily: "var(--font-syne)",
                    marginBottom: 4,
                  }}
                >
                  Review your emails
                </h1>
                <p
                  style={{
                    fontSize: 13,
                    color: "rgba(255,255,255,0.4)",
                    fontFamily: "var(--font-outfit)",
                  }}
                >
                  {emails.length} email{emails.length !== 1 ? "s" : ""} generated · Click edit to refine any email
                </p>
              </div>
              <Link
                href="/dashboard"
                style={{
                  fontSize: 13,
                  color: "rgba(255,255,255,0.4)",
                  fontFamily: "var(--font-outfit)",
                  textDecoration: "none",
                  padding: "8px 14px",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 7,
                  alignSelf: "center",
                }}
              >
                ← Back to Dashboard
              </Link>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              <button
                onClick={() => alert('CSV export')}
                style={{ background: '#FF5200', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
              >
                Export CSV
              </button>
              <button
                onClick={() => alert('PDF export')}
                style={{ background: '#0E0E0E', color: 'white', border: '1px solid #FF5200', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
              >
                Export PDF · Pro
              </button>
              <button
                onClick={() => alert('Word export')}
                style={{ background: '#0E0E0E', color: 'white', border: '1px solid #FF5200', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
              >
                Export Word · Agency
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {emails.map((email) => {
                const isEditing = editingId === email.lead_id;
                const isExpanded = expandedId === email.lead_id;

                return (
                  <div
                    key={email.lead_id}
                    style={{
                      backgroundColor: "var(--black-2)",
                      border: "1px solid rgba(255,255,255,0.07)",
                      borderRadius: 12,
                      overflow: "hidden",
                      transition: "border-color 0.15s",
                    }}
                  >
                    {/* Card header */}
                    <div
                      style={{
                        padding: "16px 20px 12px",
                        borderBottom: "1px solid rgba(255,255,255,0.05)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 12,
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <p
                          style={{
                            fontSize: 13.5,
                            fontWeight: 600,
                            color: "#FF5200",
                            fontFamily: "var(--font-outfit)",
                            marginBottom: 1,
                          }}
                        >
                          {email.first_name || "Lead"}
                          {email.company && (
                            <span style={{ color: "rgba(255,82,0,0.7)" }}>
                              {" · "}{email.company}
                            </span>
                          )}
                        </p>
                        {email.email && (
                          <p
                            style={{
                              fontSize: 11,
                              color: "rgba(255,255,255,0.25)",
                              fontFamily: "var(--font-outfit)",
                            }}
                          >
                            {email.email}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (isEditing) {
                            setEditingId(null);
                          } else {
                            setEditingId(email.lead_id);
                            setEditSubject(email.subject);
                            setEditBody(email.body);
                            setExpandedId(email.lead_id);
                          }
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "6px 12px",
                          borderRadius: 6,
                          border: "1px solid rgba(255,255,255,0.08)",
                          backgroundColor: isEditing ? "rgba(255,82,0,0.1)" : "transparent",
                          color: isEditing ? "#FF5200" : "rgba(255,255,255,0.4)",
                          fontSize: 12,
                          fontFamily: "var(--font-outfit)",
                          cursor: "pointer",
                          flexShrink: 0,
                        }}
                      >
                        <IconEdit />
                        {isEditing ? "Cancel" : "Edit"}
                      </button>
                    </div>

                    {/* Card body */}
                    <div style={{ padding: "14px 20px 16px" }}>
                      {isEditing ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          <div>
                            <label
                              style={{
                                display: "block",
                                fontSize: 11,
                                fontWeight: 600,
                                letterSpacing: "0.06em",
                                textTransform: "uppercase",
                                color: "rgba(255,255,255,0.25)",
                                fontFamily: "var(--font-outfit)",
                                marginBottom: 6,
                              }}
                            >
                              Subject
                            </label>
                            <input
                              type="text"
                              value={editSubject}
                              onChange={(e) => setEditSubject(e.target.value)}
                              className="nx-input"
                              style={{ fontSize: 13 }}
                            />
                          </div>
                          <div>
                            <label
                              style={{
                                display: "block",
                                fontSize: 11,
                                fontWeight: 600,
                                letterSpacing: "0.06em",
                                textTransform: "uppercase",
                                color: "rgba(255,255,255,0.25)",
                                fontFamily: "var(--font-outfit)",
                                marginBottom: 6,
                              }}
                            >
                              Body
                            </label>
                            <textarea
                              value={editBody}
                              onChange={(e) => setEditBody(e.target.value)}
                              rows={5}
                              className="nx-input"
                              style={{ fontSize: 13, resize: "vertical" }}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => saveEdit(email.lead_id)}
                            style={{
                              alignSelf: "flex-start",
                              padding: "7px 18px",
                              borderRadius: 7,
                              border: "none",
                              backgroundColor: "#FF5200",
                              color: "#fff",
                              fontSize: 12.5,
                              fontWeight: 600,
                              fontFamily: "var(--font-outfit)",
                              cursor: "pointer",
                            }}
                          >
                            Save changes
                          </button>
                        </div>
                      ) : (
                        <>
                          <p
                            style={{
                              fontSize: 14,
                              fontWeight: 600,
                              color: "#fff",
                              fontFamily: "var(--font-outfit)",
                              marginBottom: 8,
                            }}
                          >
                            {email.subject}
                          </p>
                          <p
                            style={{
                              fontSize: 13,
                              color: "rgba(255,255,255,0.45)",
                              fontFamily: "var(--font-outfit)",
                              lineHeight: 1.65,
                              display: isExpanded ? "block" : "-webkit-box",
                              WebkitLineClamp: isExpanded ? undefined : 3,
                              WebkitBoxOrient: isExpanded ? undefined : "vertical",
                              overflow: isExpanded ? "visible" : "hidden",
                            }}
                          >
                            {email.body}
                          </p>
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedId(isExpanded ? null : email.lead_id)
                            }
                            style={{
                              marginTop: 6,
                              fontSize: 12,
                              color: "rgba(255,82,0,0.7)",
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              fontFamily: "var(--font-outfit)",
                              padding: 0,
                            }}
                          >
                            {isExpanded ? "Show less" : "Show more"}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Error fallback on step 3 (after failed generation) */}
        {step === 2 && error && (
          <p className="nx-error" style={{ marginTop: 16 }}>
            {error}
          </p>
        )}
      </main>
    </>
  );
}
