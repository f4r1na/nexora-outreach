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

type SendPhase =
  | { phase: "idle" }
  | { phase: "confirming" }
  | { phase: "sending"; sent: number; total: number }
  | { phase: "done"; sent: number; total: number; failures: string[] }
  | { phase: "error"; message: string };

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

// ─── Text → Leads Parser (for PDF / plain text extraction) ───────────────────

function parseTextToLeads(text: string): Lead[] {
  const lines = text.trim().split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const normH = (h: string) => h.toLowerCase().replace(/[\s_-]+/g, "_").replace(/[^a-z_]/g, "");
  const colIdx = (headers: string[], ...keys: string[]) => {
    for (const key of keys) {
      const i = headers.findIndex((h) => h === key || h.startsWith(key));
      if (i >= 0) return i;
    }
    return -1;
  };

  for (const sep of [",", "\t", ";"]) {
    if (!lines[0].includes(sep)) continue;
    const headers = lines[0].split(sep).map((h) => normH(h.trim().replace(/^["']|["']$/g, "")));
    const nameIdx    = colIdx(headers, "first_name", "name", "firstname", "full_name");
    const companyIdx = colIdx(headers, "company", "organization", "org", "employer");
    const roleIdx    = colIdx(headers, "role", "title", "job_title", "position", "job");
    const emailIdx   = colIdx(headers, "email", "email_address", "mail");
    const noteIdx    = colIdx(headers, "custom_note", "note", "notes", "message", "context");
    if (nameIdx < 0 && emailIdx < 0) continue;
    const results = lines.slice(1).filter((l) => l.trim()).map((line) => {
      const cols = line.split(sep).map((c) => c.trim().replace(/^["']|["']$/g, ""));
      const get = (idx: number) => (idx >= 0 && cols[idx] !== undefined ? cols[idx] : "");
      return { first_name: get(nameIdx), company: get(companyIdx), role: get(roleIdx), email: get(emailIdx), custom_note: get(noteIdx) };
    }).filter((l) => l.first_name || l.email);
    if (results.length > 0) return results;
  }

  // Fallback: extract by email address
  const emailRe = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const leads: Lead[] = [];
  for (const line of lines) {
    const match = line.match(emailRe);
    if (match) {
      const email = match[0];
      const rest = line.replace(email, "").replace(/[,|;:\t]+/g, " ").trim();
      const name = rest.split(/\s+/).filter(Boolean).slice(0, 2).join(" ");
      leads.push({ first_name: name, company: "", role: "", email, custom_note: "" });
    }
  }
  return leads;
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

  // ── Send campaign state
  const [gmailEmail, setGmailEmail] = useState<string | null>(null);
  const [sendState, setSendState] = useState<SendPhase>({ phase: "idle" });

  // Fetch user plan for export gate
  useEffect(() => {
    fetch("/api/subscription")
      .then((r) => r.json())
      .then((d) => setUserPlan(d.subscription?.plan ?? "free"))
      .catch(() => {});
  }, []);

  // Fetch Gmail connection status
  useEffect(() => {
    fetch("/api/auth/gmail/status")
      .then((r) => r.json())
      .then((d) => setGmailEmail(d.connection?.gmail_email ?? null))
      .catch(() => {});
  }, []);

  async function handleDownload(format: "csv") {
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

  async function handleSend() {
    if (!campaignId) return;
    setSendState({ phase: "sending", sent: 0, total: emails.length });
    try {
      const res = await fetch("/api/campaigns/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaign_id: campaignId }),
      });
      if (!res.ok || !res.body) {
        const text = await res.text().catch(() => "Send failed");
        setSendState({ phase: "error", message: text });
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const evt = JSON.parse(line);
            if (evt.type === "start") {
              setSendState({ phase: "sending", sent: 0, total: evt.total });
            } else if (evt.type === "progress") {
              setSendState({ phase: "sending", sent: evt.sent, total: evt.total });
            } else if (evt.type === "done") {
              setSendState({ phase: "done", sent: evt.sent, total: evt.total, failures: evt.failures ?? [] });
            } else if (evt.type === "error") {
              setSendState({ phase: "error", message: evt.message });
            }
          } catch { /* skip malformed */ }
        }
      }
    } catch (err: unknown) {
      setSendState({ phase: "error", message: err instanceof Error ? err.message : "Network error" });
    }
  }

  // ── File handling (CSV, Excel, Word)
  const handleFile = useCallback(async (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();

    // CSV — always allowed, parse client-side
    if (ext === "csv") {
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
      return;
    }

    // XLSX — Pro/Agency, parsed client-side with xlsx package
    if (ext === "xlsx" || ext === "xls") {
      if (userPlan !== "pro" && userPlan !== "agency") {
        setError("Excel uploads require a Pro plan or higher. Please upgrade.");
        return;
      }
      setError(null);
      try {
        const XLSX = await import("xlsx");
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        // Convert to array-of-objects using first row as headers
        const rows: Record<string, string>[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });
        console.log("[XLSX] rows:", rows.length, "sample keys:", Object.keys(rows[0] ?? {}));

        if (rows.length === 0) {
          setError("No data found in this Excel file.");
          return;
        }

        const normKey = (k: string) => k.toLowerCase().replace(/[\s_-]+/g, "_").replace(/[^a-z_]/g, "");
        const findKey = (obj: Record<string, string>, ...candidates: string[]) => {
          const keys = Object.keys(obj);
          for (const c of candidates) {
            const found = keys.find((k) => normKey(k) === c || normKey(k).startsWith(c));
            if (found) return found;
          }
          return null;
        };

        const first = rows[0];
        const nameKey    = findKey(first, "first_name", "name", "firstname", "full_name");
        const companyKey = findKey(first, "company", "organization", "org", "employer");
        const roleKey    = findKey(first, "role", "title", "job_title", "position", "job");
        const emailKey   = findKey(first, "email", "email_address", "mail");
        const noteKey    = findKey(first, "custom_note", "note", "notes", "message", "context");

        if (!nameKey && !emailKey) {
          setError("Could not find name or email columns. Make sure your Excel file has headers like: name, company, role, email, note.");
          return;
        }

        const parsed: Lead[] = rows.map((row) => ({
          first_name: nameKey    ? String(row[nameKey] ?? "")    : "",
          company:    companyKey ? String(row[companyKey] ?? "") : "",
          role:       roleKey    ? String(row[roleKey] ?? "")    : "",
          email:      emailKey   ? String(row[emailKey] ?? "")   : "",
          custom_note: noteKey   ? String(row[noteKey] ?? "")    : "",
        })).filter((l) => l.first_name || l.email);

        console.log("[XLSX] leads parsed:", parsed.length);
        if (parsed.length === 0) {
          setError("No valid leads found. Make sure rows have at least a name or email.");
          return;
        }
        setLeads(parsed);
      } catch (err: any) {
        console.error("[XLSX] parse error:", err);
        setError("Failed to parse Excel file: " + (err?.message ?? "Unknown error"));
      }
      return;
    }

    // DOCX — Agency only, parsed server-side with mammoth
    if (ext === "docx") {
      if (userPlan !== "agency") {
        setError("Word uploads require an Agency plan. Please upgrade.");
        return;
      }
      setError(null);
      const form = new FormData();
      form.append("file", file);
      try {
        const res = await fetch("/api/parse-file", { method: "POST", body: form });
        const json = await res.json();
        if (!res.ok) {
          setError(json.error ?? "Failed to parse file.");
          return;
        }
        if (!json.leads || json.leads.length === 0) {
          setError("No leads found in this Word document. Make sure it contains structured lead data.");
          return;
        }
        setLeads(json.leads);
      } catch {
        setError("Failed to upload file. Please try again.");
      }
      return;
    }

    const accepted = userPlan === "agency" ? ".csv, .xlsx, or .docx" : userPlan === "pro" ? ".csv or .xlsx" : ".csv";
    setError(`Unsupported file type. Please upload a ${accepted} file.`);
  }, [userPlan]);

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

        {/* Header action buttons — only in review state */}
        {step === 3 && !isGenerating && emails.length > 0 && campaignId && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Send Campaign button */}
            {sendState.phase === "sending" ? (
              <span style={{
                fontSize: 12, color: "rgba(255,255,255,0.5)", fontFamily: "var(--font-outfit)",
                padding: "7px 14px",
              }}>
                Sending {sendState.sent} of {sendState.total}…
              </span>
            ) : sendState.phase === "done" ? (
              <span style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "7px 14px", borderRadius: 8, fontSize: 12.5, fontWeight: 600,
                fontFamily: "var(--font-outfit)",
                backgroundColor: "rgba(74,222,128,0.1)", color: "#4ade80",
                border: "1px solid rgba(74,222,128,0.2)",
              }}>✓ {sendState.sent} sent</span>
            ) : (userPlan === "pro" || userPlan === "agency") && gmailEmail ? (
              <button
                onClick={() => setSendState({ phase: "confirming" })}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "7px 14px", borderRadius: 8, fontSize: 12.5, fontWeight: 700,
                  fontFamily: "var(--font-outfit)", cursor: "pointer",
                  backgroundColor: "#FF5200", color: "#fff", border: "none",
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
                </svg>
                Send via Gmail
              </button>
            ) : (userPlan === "pro" || userPlan === "agency") && !gmailEmail ? (
              <Link href="/dashboard/settings" style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "7px 14px", borderRadius: 8, fontSize: 12.5, fontWeight: 600,
                fontFamily: "var(--font-outfit)", textDecoration: "none",
                backgroundColor: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}>
                Connect Gmail
              </Link>
            ) : null}

            <button
              onClick={() => handleDownload("csv")}
              disabled={downloading === "csv"}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "7px 14px", borderRadius: 8, fontSize: 12.5, fontWeight: 600,
                fontFamily: "var(--font-outfit)", cursor: "pointer",
                backgroundColor: (userPlan === "pro" || userPlan === "agency") && gmailEmail && sendState.phase === "idle"
                  ? "rgba(255,255,255,0.06)" : "#FF5200",
                color: (userPlan === "pro" || userPlan === "agency") && gmailEmail && sendState.phase === "idle"
                  ? "rgba(255,255,255,0.6)" : "#fff",
                border: (userPlan === "pro" || userPlan === "agency") && gmailEmail && sendState.phase === "idle"
                  ? "1px solid rgba(255,255,255,0.1)" : "none",
                opacity: downloading === "csv" ? 0.7 : 1,
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {downloading === "csv" ? "Downloading…" : "Export CSV"}
            </button>
          </div>
        )}

        {/* Upgrade modal */}
        {upgradeModal && (
          <UpgradeModal requiredPlan={upgradeModal} onClose={() => setUpgradeModal(null)} />
        )}

        {/* Send confirmation modal */}
        {sendState.phase === "confirming" && (
          <div style={{
            position: "fixed", inset: 0, zIndex: 100,
            backgroundColor: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
          }}>
            <div style={{
              backgroundColor: "#0e0e0e", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 16, padding: "32px 28px", maxWidth: 400, width: "100%",
              boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12, marginBottom: 20,
                backgroundColor: "rgba(255,82,0,0.1)", border: "1px solid rgba(255,82,0,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center", color: "#FF5200",
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: "#fff", fontFamily: "var(--font-syne)", marginBottom: 8 }}>
                Send {emails.length} email{emails.length !== 1 ? "s" : ""}?
              </h2>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", fontFamily: "var(--font-outfit)", lineHeight: 1.6, marginBottom: 6 }}>
                From: <span style={{ color: "#FF5200", fontWeight: 600 }}>{gmailEmail}</span>
              </p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", fontFamily: "var(--font-outfit)", marginBottom: 28, lineHeight: 1.6 }}>
                Emails will be sent one by one with a short delay to avoid spam filters.
              </p>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={handleSend}
                  style={{
                    flex: 1, padding: "11px 0", borderRadius: 9,
                    backgroundColor: "#FF5200", color: "#fff", border: "none",
                    fontSize: 14, fontWeight: 700, fontFamily: "var(--font-outfit)", cursor: "pointer",
                  }}
                >Send Now</button>
                <button
                  onClick={() => setSendState({ phase: "idle" })}
                  style={{
                    flex: 1, padding: "11px 0", borderRadius: 9,
                    backgroundColor: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.6)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    fontSize: 14, fontWeight: 600, fontFamily: "var(--font-outfit)", cursor: "pointer",
                  }}
                >Cancel</button>
              </div>
            </div>
          </div>
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
              {userPlan === "agency"
                ? <>Drop a CSV, Excel, or Word doc with columns: <em>name, company, role, email, note</em>. Any order, any extra columns are ignored.</>
                : userPlan === "pro"
                ? <>Drop a CSV or Excel file with columns: <em>name, company, role, email, note</em>. Any order, any extra columns are ignored.</>
                : <>Drop a CSV with columns: <em>name, company, role, email, note</em>. Any order, any extra columns are ignored.</>
              }
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
                  textAlign: "center",
                }}
              >
                {userPlan === "agency"
                  ? <>Drop your CSV, Excel, or Word doc here or <span style={{ color: "#FF5200" }}>browse files</span></>
                  : userPlan === "pro"
                  ? <>Drop your CSV or Excel file here or <span style={{ color: "#FF5200" }}>browse files</span></>
                  : <>Drop your CSV here or <span style={{ color: "#FF5200" }}>browse files</span></>
                }
              </p>
              <p
                style={{
                  fontSize: 12,
                  color: "rgba(255,255,255,0.3)",
                  fontFamily: "var(--font-outfit)",
                  margin: 0,
                }}
              >
                {userPlan === "agency"
                  ? ".csv, .xlsx, .docx accepted"
                  : userPlan === "pro"
                  ? ".csv, .xlsx accepted"
                  : ".csv files only"
                }
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept={
                  userPlan === "agency"
                    ? ".csv,.xlsx,.xls,.docx"
                    : userPlan === "pro"
                    ? ".csv,.xlsx,.xls"
                    : ".csv"
                }
                style={{ display: "none" }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                  e.target.value = "";
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

            {/* Action buttons row */}
            <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
              {/* Send Campaign */}
              {sendState.phase === "sending" ? (
                <div style={{ minWidth: 200 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontFamily: "var(--font-outfit)" }}>
                      Sending {sendState.sent} of {sendState.total}…
                    </span>
                    <span style={{ fontSize: 12, color: "#FF5200", fontWeight: 700, fontFamily: "var(--font-outfit)" }}>
                      {sendState.total > 0 ? Math.round((sendState.sent / sendState.total) * 100) : 0}%
                    </span>
                  </div>
                  <div style={{ height: 4, backgroundColor: "rgba(255,255,255,0.07)", borderRadius: 99, overflow: "hidden" }}>
                    <div style={{
                      height: "100%", borderRadius: 99, backgroundColor: "#FF5200",
                      width: `${sendState.total > 0 ? Math.round((sendState.sent / sendState.total) * 100) : 0}%`,
                      transition: "width 0.4s ease",
                    }} />
                  </div>
                </div>
              ) : sendState.phase === "done" ? (
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "10px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600,
                  fontFamily: "var(--font-outfit)",
                  backgroundColor: "rgba(74,222,128,0.1)", color: "#4ade80",
                  border: "1px solid rgba(74,222,128,0.2)",
                }}>
                  ✓ {sendState.failures.length === 0
                    ? `All ${sendState.sent} emails sent!`
                    : `${sendState.sent} sent, ${sendState.failures.length} failed`}
                </span>
              ) : sendState.phase === "error" ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{
                    padding: "10px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                    fontFamily: "var(--font-outfit)", maxWidth: 260,
                    backgroundColor: "rgba(239,68,68,0.08)", color: "#ef4444",
                    border: "1px solid rgba(239,68,68,0.2)",
                  }}>{sendState.message}</span>
                  <button
                    onClick={() => setSendState({ phase: "idle" })}
                    style={{
                      padding: "8px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                      fontFamily: "var(--font-outfit)", cursor: "pointer",
                      backgroundColor: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                  >Retry</button>
                </div>
              ) : (userPlan === "pro" || userPlan === "agency") && gmailEmail ? (
                <button
                  onClick={() => setSendState({ phase: "confirming" })}
                  disabled={!campaignId}
                  style={{
                    display: "flex", alignItems: "center", gap: 7,
                    background: "#FF5200", color: "#fff", border: "none",
                    padding: "10px 20px", borderRadius: 8, cursor: "pointer",
                    fontWeight: 700, fontFamily: "var(--font-outfit)", fontSize: 13,
                    opacity: !campaignId ? 0.5 : 1,
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
                  </svg>
                  Send via Gmail
                </button>
              ) : (userPlan === "pro" || userPlan === "agency") ? (
                <Link href="/dashboard/settings" style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "10px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600,
                  fontFamily: "var(--font-outfit)", textDecoration: "none",
                  backgroundColor: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}>Connect Gmail to Send</Link>
              ) : (
                <Link href="/dashboard/settings" style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "10px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600,
                  fontFamily: "var(--font-outfit)", textDecoration: "none",
                  backgroundColor: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}>Upgrade to Send</Link>
              )}

              <button
                onClick={() => handleDownload("csv")}
                disabled={downloading === "csv" || !campaignId}
                style={{
                  background: (userPlan === "pro" || userPlan === "agency") && gmailEmail
                    ? "rgba(255,255,255,0.06)" : "#FF5200",
                  color: (userPlan === "pro" || userPlan === "agency") && gmailEmail
                    ? "rgba(255,255,255,0.6)" : "#fff",
                  border: (userPlan === "pro" || userPlan === "agency") && gmailEmail
                    ? "1px solid rgba(255,255,255,0.1)" : "none",
                  padding: "10px 20px", borderRadius: 8, cursor: "pointer",
                  fontWeight: 600, fontFamily: "var(--font-outfit)", fontSize: 13,
                  opacity: downloading === "csv" ? 0.7 : 1,
                }}
              >
                {downloading === "csv" ? "Downloading…" : "Export CSV"}
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
