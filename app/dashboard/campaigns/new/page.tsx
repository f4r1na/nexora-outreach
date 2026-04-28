"use client";

import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

// ── Types ─────────────────────────────────────────────────────────────────────

type Path = null | "wizard" | "csv";
type Msg = { id: string; role: "ai" | "user"; text: string };
type ActivityStep = { id: string; text: string; variant: "orange" | "amber" | "green" };
type Answers = { targetAudience: string; goal: string; leadCount: string; location: string; sendMode: string };
type LaunchResult = { campaignId: string; leadCount: number; hot: number; warm: number; cold: number };
type PreviewRow = string[];

// ── Config ────────────────────────────────────────────────────────────────────

const QUESTIONS = [
  {
    id: 1,
    text: "Who are you trying to reach?",
    options: ["SaaS Founders", "Agency Owners", "E-commerce Brands", "Real Estate Agents", "Startup CTOs", "Marketing Directors"],
    canType: true,
  },
  {
    id: 2,
    text: "What's your outreach goal?",
    options: ["Book a product demo", "Sell a service", "Find partnerships", "Generate leads", "Recruit candidates"],
    canType: true,
  },
  {
    id: 3,
    text: "How many leads do you want?",
    options: ["10 leads — quick test", "25 leads — small batch", "50 leads — standard", "100 leads — full campaign"],
    canType: false,
  },
  {
    id: 4,
    text: "Any location preference?",
    options: ["Anywhere", "United States", "New York", "San Francisco", "Florida", "Europe"],
    canType: true,
  },
  {
    id: 5,
    text: "How should I send the emails?",
    options: [
      "Review each email before sending",
      "Send to hot leads automatically",
      "Send all automatically",
      "Save as draft first",
    ],
    canType: false,
  },
] as const;

type QuestionId = 1 | 2 | 3 | 4 | 5;

const ANSWER_KEYS: (keyof Answers)[] = ["targetAudience", "goal", "leadCount", "location", "sendMode"];

const ACTIVITY_SCHEDULE: Record<
  QuestionId,
  (ans: string) => { text: string; variant: "orange" | "amber" | "green"; delay: number }[]
> = {
  1: (ans) => [
    { text: `Analyzing target: ${ans}...`, variant: "amber", delay: 400 },
    { text: "Identified key outreach characteristics...", variant: "amber", delay: 1700 },
  ],
  2: (ans) => [
    { text: `Campaign goal: ${ans}...`, variant: "amber", delay: 400 },
    { text: `Optimizing approach for "${ans}"...`, variant: "amber", delay: 1600 },
  ],
  3: (ans) => {
    const n = parseInt(ans) || 10;
    const found = Math.floor(n * (2.1 + Math.random() * 0.8));
    return [
      { text: `Searching for ${ans}...`, variant: "orange", delay: 400 },
      { text: `Found ${found} potential matches...`, variant: "orange", delay: 1800 },
      { text: "Scoring leads for fit...", variant: "amber", delay: 2900 },
    ];
  },
  4: (ans) => [
    { text: `Filtering by location: ${ans}...`, variant: "orange", delay: 400 },
    { text: `${ans === "Anywhere" ? "Global leads" : ans + " leads"} matched...`, variant: "orange", delay: 1700 },
  ],
  5: (_ans) => [
    { text: "Writing personalized emails...", variant: "green", delay: 400 },
    { text: "Applying company profile context...", variant: "amber", delay: 1500 },
    { text: "Generating subject line variations...", variant: "green", delay: 2400 },
    { text: "Campaign ready — emails prepared", variant: "green", delay: 3300 },
  ],
};

const genId = () => Math.random().toString(36).slice(2, 9);

function getLeadStats(leadCountAnswer: string) {
  const total = parseInt(leadCountAnswer.split(" ")[0]) || 10;
  const hot = Math.floor(total * 0.35);
  const warm = Math.floor(total * 0.5);
  const cold = total - hot - warm;
  return { total, hot, warm, cold };
}

// ── CSV helpers ───────────────────────────────────────────────────────────────

function parseCSVPreview(text: string, maxRows = 6): { headers: string[]; rows: PreviewRow[] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return { headers: [], rows: [] };

  const parseLine = (line: string): string[] => {
    const cols: string[] = [];
    let cur = "";
    let inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuote && line[i + 1] === '"') { cur += '"'; i++; }
        else inQuote = !inQuote;
      } else if (ch === "," && !inQuote) {
        cols.push(cur.trim());
        cur = "";
      } else {
        cur += ch;
      }
    }
    cols.push(cur.trim());
    return cols;
  };

  return {
    headers: parseLine(lines[0]),
    rows: lines.slice(1, maxRows).map(parseLine),
  };
}

function hasEmailColumn(headers: string[]): boolean {
  return headers.some((h) =>
    ["email", "email_address"].includes(h.toLowerCase().replace(/[^a-z0-9]/g, "_"))
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function IconX() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
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

function IconSend() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 8l4 4 6-7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Shared Header ─────────────────────────────────────────────────────────────

function SharedHeader({ path, onBack }: { path: Path; onBack: () => void }) {
  return (
    <header
      style={{
        padding: "0 28px",
        height: 64,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        backgroundColor: "rgba(6,6,6,0.9)",
        backdropFilter: "blur(12px)",
        position: "sticky",
        top: 0,
        zIndex: 30,
        flexShrink: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {path === null ? (
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
            }}
          >
            <IconArrowLeft />
            Back
          </Link>
        ) : (
          <button
            onClick={onBack}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              color: "rgba(255,255,255,0.4)",
              fontSize: 13,
              fontFamily: "var(--font-outfit)",
              background: "none",
              padding: "6px 10px",
              borderRadius: 7,
              border: "1px solid rgba(255,255,255,0.07)",
              cursor: "pointer",
            }}
          >
            <IconArrowLeft />
            Back
          </button>
        )}
        <span style={{ color: "rgba(255,255,255,0.1)", fontSize: 16 }}>/</span>
        <span style={{ fontSize: 15, fontWeight: 700, color: "#fff", fontFamily: "var(--font-syne)" }}>
          Campaign Wizard
        </span>
      </div>
      <Link
        href="/dashboard"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 32,
          height: 32,
          borderRadius: 8,
          border: "1px solid rgba(255,255,255,0.08)",
          backgroundColor: "rgba(255,255,255,0.02)",
          color: "rgba(255,255,255,0.35)",
        }}
        aria-label="Close wizard"
      >
        <IconX />
      </Link>
    </header>
  );
}

// ── Choice Screen ─────────────────────────────────────────────────────────────

function ChoiceScreen({ onSelect }: { onSelect: (path: "wizard" | "csv") => void }) {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
      }}
    >
      <div>
        <p
          style={{
            fontSize: 13,
            color: "rgba(255,255,255,0.3)",
            fontFamily: "var(--font-outfit)",
            textAlign: "center",
            marginBottom: 28,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
          }}
        >
          How do you want to start?
        </p>
        <div style={{ display: "flex", gap: 16 }}>
          {[
            {
              key: "wizard" as const,
              title: "Start from scratch",
              subtitle: "Answer 5 questions, we'll find the right audience",
              icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                </svg>
              ),
            },
            {
              key: "csv" as const,
              title: "Import CSV",
              subtitle: "Upload your existing lead list",
              icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                </svg>
              ),
            },
          ].map(({ key, title, subtitle, icon }) => (
            <button
              key={key}
              onClick={() => onSelect(key)}
              style={{
                width: 240,
                padding: "28px 24px",
                backgroundColor: "#0e0e0e",
                border: "1px solid rgba(255,255,255,0.09)",
                borderRadius: 14,
                textAlign: "left",
                cursor: "pointer",
                transition: "border-color 0.15s, background-color 0.15s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,82,0,0.45)";
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(255,82,0,0.04)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.09)";
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#0e0e0e";
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  backgroundColor: "rgba(255,82,0,0.1)",
                  border: "1px solid rgba(255,82,0,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#FF5200",
                  marginBottom: 16,
                }}
              >
                {icon}
              </div>
              <p
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: "#fff",
                  fontFamily: "var(--font-syne)",
                  marginBottom: 6,
                }}
              >
                {title}
              </p>
              <p
                style={{
                  fontSize: 12.5,
                  color: "rgba(255,255,255,0.38)",
                  fontFamily: "var(--font-outfit)",
                  lineHeight: 1.5,
                }}
              >
                {subtitle}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── CSV Import Content ────────────────────────────────────────────────────────

function CsvImportContent() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<{ headers: string[]; rows: PreviewRow[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);

  const loadFile = useCallback((f: File) => {
    if (!f.name.toLowerCase().endsWith(".csv")) {
      setError("Please upload a .csv file");
      return;
    }
    setError(null);
    setFile(f);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const p = parseCSVPreview(text);
      if (!hasEmailColumn(p.headers)) {
        setError("CSV must have an 'email' column. Found: " + (p.headers.join(", ") || "none"));
        setFile(null);
        setPreview(null);
        return;
      }
      setPreview(p);
    };
    reader.readAsText(f);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const f = e.dataTransfer.files[0];
      if (f) loadFile(f);
    },
    [loadFile]
  );

  const handleConfirm = async () => {
    if (!file || uploading) return;
    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("name", file.name.replace(/\.csv$/i, "").trim());

    try {
      const res = await fetch("/api/campaigns/import", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Upload failed");
        setUploading(false);
        return;
      }
      router.push(`/dashboard/campaigns/${data.campaignId}?tab=leads`);
    } catch {
      setError("Upload failed. Please try again.");
      setUploading(false);
    }
  };

  return (
    <div style={{ flex: 1, overflowY: "auto" }}>
      <style>{`@keyframes imp-spin { to { transform: rotate(360deg); } }`}</style>
      <main style={{ maxWidth: 640, margin: "0 auto", padding: "48px 24px" }}>
        <h2
          style={{
            fontSize: 22,
            fontWeight: 500,
            color: "#fff",
            fontFamily: "var(--font-syne)",
            marginBottom: 8,
          }}
        >
          Import your leads
        </h2>
        <p
          style={{
            fontSize: 13,
            color: "rgba(255,255,255,0.4)",
            fontFamily: "var(--font-outfit)",
            marginBottom: 32,
            lineHeight: 1.6,
          }}
        >
          Upload a CSV with columns: <strong style={{ color: "rgba(255,255,255,0.6)" }}>email</strong> (required),
          first_name, last_name, company, title.
          Signals will be detected automatically after import.
        </p>

        {!preview && (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            style={{
              border: `2px dashed ${dragging ? "rgba(255,82,0,0.6)" : "rgba(255,255,255,0.1)"}`,
              borderRadius: 10,
              padding: "56px 24px",
              textAlign: "center",
              cursor: "pointer",
              backgroundColor: dragging ? "rgba(255,82,0,0.04)" : "rgba(255,255,255,0.015)",
              transition: "border-color 0.15s, background-color 0.15s",
            }}
          >
            <svg
              width="32" height="32" viewBox="0 0 24 24" fill="none"
              stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
              style={{ margin: "0 auto 14px", display: "block" }}
              aria-hidden="true"
            >
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
            </svg>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", fontFamily: "var(--font-outfit)", marginBottom: 6 }}>
              Drop your CSV here, or click to browse
            </p>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", fontFamily: "var(--font-outfit)" }}>
              .csv files only
            </p>
            <input
              ref={inputRef}
              type="file"
              accept=".csv"
              style={{ display: "none" }}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) loadFile(f); }}
            />
          </div>
        )}

        {preview && (
          <div>
            <div
              style={{
                marginBottom: 16,
                padding: "12px 16px",
                backgroundColor: "rgba(34,197,94,0.07)",
                border: "1px solid rgba(34,197,94,0.2)",
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <p style={{ fontSize: 13, color: "#4ade80", fontFamily: "var(--font-outfit)" }}>
                {file?.name} - columns detected
              </p>
              <button
                onClick={() => { setFile(null); setPreview(null); setError(null); }}
                style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "var(--font-outfit)", background: "none", border: "none", cursor: "pointer" }}
              >
                Change file
              </button>
            </div>

            <div
              style={{
                overflowX: "auto",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 8,
                marginBottom: 24,
              }}
            >
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, fontFamily: "var(--font-outfit)" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                    {preview.headers.map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: "10px 14px",
                          textAlign: "left",
                          color: "rgba(255,255,255,0.35)",
                          fontWeight: 400,
                          whiteSpace: "nowrap",
                          textTransform: "uppercase",
                          fontSize: 10,
                          letterSpacing: "0.07em",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.map((row, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      {row.map((cell, j) => (
                        <td
                          key={j}
                          style={{
                            padding: "10px 14px",
                            color: "rgba(255,255,255,0.6)",
                            whiteSpace: "nowrap",
                            maxWidth: 200,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {cell || "-"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              onClick={handleConfirm}
              disabled={uploading}
              style={{
                width: "100%",
                padding: "12px 20px",
                borderRadius: 8,
                border: "none",
                backgroundColor: uploading ? "rgba(255,82,0,0.5)" : "#FF5200",
                color: "#fff",
                fontSize: 14,
                fontWeight: 500,
                fontFamily: "var(--font-outfit)",
                cursor: uploading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              {uploading ? (
                <>
                  <svg
                    width="13" height="13" viewBox="0 0 24 24" fill="none"
                    style={{ animation: "imp-spin 0.9s linear infinite" }}
                    aria-hidden="true"
                  >
                    <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                  Importing...
                </>
              ) : (
                "Import and detect signals"
              )}
            </button>
          </div>
        )}

        {error && (
          <p
            style={{
              marginTop: 16,
              fontSize: 12,
              color: "#f87171",
              fontFamily: "var(--font-outfit)",
              padding: "10px 14px",
              backgroundColor: "rgba(248,113,113,0.08)",
              borderRadius: 7,
              border: "1px solid rgba(248,113,113,0.2)",
            }}
          >
            {error}
          </p>
        )}
      </main>
    </div>
  );
}

// ── Summary Card ──────────────────────────────────────────────────────────────

function SummaryCard({
  answers,
  leadStats,
  isLaunching,
  launchError,
  launchResult,
  onLaunch,
  onEdit,
}: {
  answers: Answers;
  leadStats: ReturnType<typeof getLeadStats>;
  isLaunching: boolean;
  launchError: string | null;
  launchResult: LaunchResult | null;
  onLaunch: () => void;
  onEdit: () => void;
}) {
  const stats = launchResult
    ? { total: launchResult.leadCount, hot: launchResult.hot, warm: launchResult.warm, cold: launchResult.cold }
    : leadStats;
  const isDone = !!launchResult;

  return (
    <div
      className="wiz-msg"
      style={{
        marginTop: 8,
        padding: "20px",
        backgroundColor: "#0e0e0e",
        border: "1px solid rgba(255,255,255,0.09)",
        borderRadius: 16,
        borderTop: `2px solid ${isDone ? "#22C55E" : "rgba(255,82,0,0.35)"}`,
        transition: "border-top-color 0.4s",
      }}
    >
      <div style={{ marginBottom: 14 }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: isDone ? "#22C55E" : "#FF5200", fontFamily: "var(--font-syne)", marginBottom: 3 }}>
          {isDone ? "Campaign launched!" : "Here's your campaign — ready to launch"}
        </p>
        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "var(--font-outfit)" }}>
          {isDone
            ? `${stats.total} leads found — ${stats.hot} hot, ${stats.warm} warm, ${stats.cold} cold`
            : `~${stats.total} leads ready — ${stats.hot} hot, ${stats.warm} warm, ${stats.cold} cold`}
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, marginBottom: 16 }}>
        {[
          { label: "Target", value: answers.targetAudience },
          { label: "Goal", value: answers.goal },
          { label: "Leads", value: answers.leadCount?.split(" — ")[0] },
          { label: "Location", value: answers.location },
          { label: "Send mode", value: answers.sendMode },
        ].map(({ label, value }) => (
          <div
            key={label}
            style={{
              padding: "8px 11px",
              backgroundColor: "rgba(255,255,255,0.025)",
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <p style={{ fontSize: 9.5, color: "rgba(255,255,255,0.22)", fontFamily: "var(--font-outfit)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3 }}>
              {label}
            </p>
            <p style={{ fontSize: 12, color: "#fff", fontFamily: "var(--font-outfit)", fontWeight: 500, lineHeight: 1.4 }}>
              {value || "—"}
            </p>
          </div>
        ))}
      </div>

      {launchError && (
        <p className="nx-error" style={{ marginBottom: 12, fontSize: 12 }}>
          {launchError}
        </p>
      )}

      {!isDone ? (
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onLaunch}
            disabled={isLaunching}
            className="wiz-launch-btn"
            style={{
              flex: 1,
              padding: "11px 20px",
              borderRadius: 999,
              border: "none",
              backgroundColor: "#FF5200",
              color: "#fff",
              fontSize: 13.5,
              fontWeight: 600,
              fontFamily: "var(--font-outfit)",
              cursor: isLaunching ? "not-allowed" : "pointer",
              opacity: isLaunching ? 0.75 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            {isLaunching ? (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ animation: "wiz-spin 0.9s linear infinite" }} aria-hidden="true">
                  <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
                Launching...
              </>
            ) : (
              <>
                <IconSend />
                Launch campaign
              </>
            )}
          </button>
          {!isLaunching && (
            <button
              onClick={onEdit}
              className="wiz-ghost-btn"
              style={{
                padding: "11px 18px",
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.1)",
                backgroundColor: "transparent",
                color: "rgba(255,255,255,0.45)",
                fontSize: 13,
                fontFamily: "var(--font-outfit)",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              Edit preferences
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", backgroundColor: "rgba(34,197,94,0.08)", borderRadius: 8, border: "1px solid rgba(34,197,94,0.2)" }}>
          <IconCheck />
          <p style={{ fontSize: 12, color: "rgba(34,197,94,0.8)", fontFamily: "var(--font-outfit)" }}>
            Redirecting to your campaign...
          </p>
        </div>
      )}
    </div>
  );
}

// ── Wizard Content (inner, uses useSearchParams) ───────────────────────────────

function WizardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateParam = searchParams.get("template");
  const q1Param = searchParams.get("q1");
  const signalParam = searchParams.get("signal");
  const signalData = (() => {
    if (!signalParam) return null;
    try {
      return JSON.parse(
        atob(signalParam.replace(/-/g, "+").replace(/_/g, "/"))
      ) as { company: string; signal_type: string; headline: string; url: string };
    } catch {
      return null;
    }
  })();

  const [step, setStep] = useState(0);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [activitySteps, setActivitySteps] = useState<ActivityStep[]>([]);
  const [answers, setAnswers] = useState<Partial<Answers>>({});
  const [showTypeInput, setShowTypeInput] = useState(false);
  const [typeInput, setTypeInput] = useState("");
  const [optionsVisible, setOptionsVisible] = useState(false);
  const [answering, setAnswering] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  const [launchError, setLaunchError] = useState<string | null>(null);
  const [launchResult, setLaunchResult] = useState<LaunchResult | null>(null);

  const convRef = useRef<HTMLDivElement>(null);
  const activityRef = useRef<HTMLDivElement>(null);
  const timerRefs = useRef<ReturnType<typeof setTimeout>[]>([]);
  const templateFiredRef = useRef(false);

  const scrollConv = useCallback(() => {
    setTimeout(() => {
      if (convRef.current) convRef.current.scrollTop = convRef.current.scrollHeight;
    }, 60);
  }, []);

  const scrollActivity = useCallback(() => {
    setTimeout(() => {
      if (activityRef.current) activityRef.current.scrollTop = activityRef.current.scrollHeight;
    }, 60);
  }, []);

  const addMsg = useCallback(
    (role: Msg["role"], text: string) => {
      setMessages((prev) => [...prev, { id: genId(), role, text }]);
      scrollConv();
    },
    [scrollConv]
  );

  const addActivity = useCallback(
    (text: string, variant: ActivityStep["variant"]) => {
      setActivitySteps((prev) => [...prev, { id: genId(), text, variant }]);
      scrollActivity();
    },
    [scrollActivity]
  );

  const scheduleActivity = useCallback(
    (qId: QuestionId, answer: string) => {
      const schedule = ACTIVITY_SCHEDULE[qId](answer);
      schedule.forEach(({ text, variant, delay }) => {
        const t = setTimeout(() => addActivity(text, variant), delay);
        timerRefs.current.push(t);
      });
    },
    [addActivity]
  );

  useEffect(() => {
    const t = setTimeout(() => {
      addMsg("ai", QUESTIONS[0].text);
      const t2 = setTimeout(() => {
        setStep(1);
        setOptionsVisible(true);
      }, 150);
      timerRefs.current.push(t2);
    }, 550);
    timerRefs.current.push(t);
    return () => timerRefs.current.forEach(clearTimeout);
  }, [addMsg]);

  const handleAnswer = useCallback(
    (answer: string) => {
      if (answering || step < 1 || step > 5) return;

      setAnswering(true);
      setOptionsVisible(false);
      setShowTypeInput(false);
      setTypeInput("");

      setAnswers((prev) => ({ ...prev, [ANSWER_KEYS[step - 1]]: answer }));
      addMsg("user", answer);
      scheduleActivity(step as QuestionId, answer);

      if (step < 5) {
        const nextStep = (step + 1) as QuestionId;
        const t = setTimeout(() => {
          addMsg("ai", QUESTIONS[nextStep - 1].text);
          const t2 = setTimeout(() => {
            setStep(nextStep);
            setAnswering(false);
            setOptionsVisible(true);
          }, 120);
          timerRefs.current.push(t2);
        }, 950);
        timerRefs.current.push(t);
      } else {
        const t = setTimeout(() => {
          setStep(6);
          setAnswering(false);
        }, 3700);
        timerRefs.current.push(t);
      }
    },
    [step, answering, addMsg, scheduleActivity]
  );

  useEffect(() => {
    if (!templateParam || templateFiredRef.current || step !== 1 || !optionsVisible) return;
    const MAP: Record<string, string> = {
      "saas-founders": "SaaS Founders",
      "agency-owners": "Agency Owners",
      ecommerce: "E-commerce Brands",
      "real-estate": "Real Estate Agents",
      "startup-cto": "Startup CTOs",
      marketing: "Marketing Directors",
    };
    const answer = MAP[templateParam];
    if (answer) {
      templateFiredRef.current = true;
      const t = setTimeout(() => handleAnswer(answer), 700);
      timerRefs.current.push(t);
    }
  }, [templateParam, step, optionsVisible, handleAnswer]);

  useEffect(() => {
    if (!q1Param || templateFiredRef.current || step !== 1 || !optionsVisible) return;
    templateFiredRef.current = true;
    const t = setTimeout(() => handleAnswer(decodeURIComponent(q1Param)), 700);
    timerRefs.current.push(t);
  }, [q1Param, step, optionsVisible, handleAnswer]);

  const handleLaunch = async () => {
    if (isLaunching) return;
    setIsLaunching(true);
    setLaunchError(null);
    setStep(7);

    try {
      const res = await fetch("/api/campaign/wizard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(answers),
      });

      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({ error: "Launch failed" }));
        setLaunchError(err.error ?? "Launch failed");
        setIsLaunching(false);
        setStep(6);
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
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === "activity") {
              addActivity(data.text, data.variant ?? "orange");
            } else if (data.type === "done") {
              setLaunchResult({
                campaignId: data.campaignId,
                leadCount: data.leadCount,
                hot: data.hot,
                warm: data.warm,
                cold: data.cold,
              });
              setIsLaunching(false);
              toast.success("Campaign launched", { style: { color: "#FF5200", borderColor: "rgba(255,82,0,0.25)" } });
              setTimeout(() => router.push(`/dashboard/campaigns/${data.campaignId}`), 2000);
            } else if (data.type === "error") {
              setLaunchError(data.message);
              setIsLaunching(false);
              setStep(6);
              toast.error("Something went wrong. Try again.");
            }
          } catch {}
        }
      }
    } catch (err: unknown) {
      setLaunchError(err instanceof Error ? err.message : "Launch failed");
      setIsLaunching(false);
      setStep(6);
      toast.error("Something went wrong. Try again.");
    }
  };

  const handleEdit = useCallback(() => {
    timerRefs.current.forEach(clearTimeout);
    timerRefs.current = [];
    setStep(1);
    setMessages([{ id: genId(), role: "ai", text: QUESTIONS[0].text }]);
    setActivitySteps([]);
    setAnswers({});
    setAnswering(false);
    setOptionsVisible(true);
    setLaunchError(null);
    setLaunchResult(null);
    templateFiredRef.current = false;
  }, []);

  const currentQ = step >= 1 && step <= 5 ? QUESTIONS[step - 1] : null;
  const leadStats = answers.leadCount ? getLeadStats(answers.leadCount) : { total: 10, hot: 3, warm: 5, cold: 2 };

  return (
    <>
      <style>{`
        @keyframes wiz-fade-up {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes wiz-slide-right {
          from { opacity: 0; transform: translateX(18px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes wiz-option-in {
          from { opacity: 0; transform: scale(0.92) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes wiz-think {
          0%, 80%, 100% { transform: scale(0.65); opacity: 0.3; }
          40% { transform: scale(1); opacity: 1; }
        }
        @keyframes wiz-spin { to { transform: rotate(360deg); } }

        .wiz-msg { animation: wiz-fade-up 0.32s cubic-bezier(.23,1,.32,1) forwards; }
        .wiz-step { animation: wiz-slide-right 0.36s cubic-bezier(.23,1,.32,1) forwards; }
        .wiz-think-dot { animation: wiz-think 1.4s ease-in-out infinite; }

        .wiz-option {
          transition: border-color 0.14s, background-color 0.14s, color 0.14s, transform 0.1s;
        }
        .wiz-option:hover {
          border-color: rgba(255,82,0,0.5) !important;
          background-color: rgba(255,82,0,0.08) !important;
          color: #fff !important;
        }
        .wiz-option:active { transform: scale(0.96); }

        .wiz-launch-btn {
          transition: background-color 0.14s, transform 0.1s;
        }
        .wiz-launch-btn:hover:not(:disabled) { background-color: #ff6a1f !important; }
        .wiz-launch-btn:active:not(:disabled) { transform: scale(0.98); }

        .wiz-ghost-btn {
          transition: border-color 0.14s, color 0.14s;
        }
        .wiz-ghost-btn:hover {
          border-color: rgba(255,255,255,0.22) !important;
          color: rgba(255,255,255,0.65) !important;
        }
      `}</style>

      {/* ── Body: split layout ── */}
      <div
        style={{
          flex: 1,
          display: "flex",
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        {/* LEFT: Conversation */}
        <div
          style={{
            width: "60%",
            display: "flex",
            flexDirection: "column",
            borderRight: "1px solid rgba(255,255,255,0.06)",
            minHeight: 0,
            overflow: "hidden",
          }}
        >
          {/* Progress dots */}
          <div
            style={{
              padding: "16px 28px 14px",
              borderBottom: "1px solid rgba(255,255,255,0.04)",
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexShrink: 0,
            }}
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <div
                key={n}
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  backgroundColor: step >= n ? "#FF5200" : "rgba(255,255,255,0.09)",
                  boxShadow: step >= n ? "0 0 7px rgba(255,82,0,0.55)" : "none",
                  transition: "background-color 0.3s ease, box-shadow 0.3s ease",
                }}
              />
            ))}
            <span style={{ marginLeft: 6, fontSize: 11, color: "rgba(255,255,255,0.22)", fontFamily: "var(--font-outfit)" }}>
              {step <= 5
                ? `Step ${Math.max(step, 1)} of 5`
                : step === 6
                ? "Ready to launch"
                : "Launching..."}
            </span>
          </div>

          {/* Message history + options */}
          <div
            ref={convRef}
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "20px 28px 24px",
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            {signalData && (
              <SignalBanner
                headline={signalData.headline}
                company={signalData.company}
                signalType={signalData.signal_type}
              />
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className="wiz-msg"
                style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}
              >
                <div
                  style={{
                    maxWidth: "78%",
                    padding: "11px 16px",
                    borderRadius: msg.role === "user" ? "18px 18px 5px 18px" : "5px 18px 18px 18px",
                    backgroundColor: msg.role === "user" ? "rgba(255,82,0,0.13)" : "#0e0e0e",
                    border: msg.role === "user" ? "1px solid rgba(255,82,0,0.22)" : "1px solid rgba(255,255,255,0.07)",
                    fontSize: msg.role === "ai" ? 15 : 13.5,
                    fontWeight: msg.role === "ai" ? 600 : 400,
                    lineHeight: 1.55,
                    color: msg.role === "user" ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.82)",
                    fontFamily: msg.role === "ai" ? "var(--font-syne)" : "var(--font-outfit)",
                  }}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {/* Option pills */}
            {currentQ && optionsVisible && !answering && step >= 1 && step <= 5 && (
              <div style={{ marginTop: 4 }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {currentQ.options.map((option, i) => (
                    <button
                      key={option}
                      onClick={() => handleAnswer(option)}
                      className="wiz-option"
                      style={{
                        padding: "9px 18px",
                        borderRadius: 999,
                        border: "1px solid rgba(255,255,255,0.11)",
                        backgroundColor: "rgba(255,255,255,0.03)",
                        color: "rgba(255,255,255,0.62)",
                        fontSize: 13,
                        fontFamily: "var(--font-outfit)",
                        cursor: "pointer",
                        animation: `wiz-option-in 0.4s cubic-bezier(.23,1,.32,1) ${i * 48}ms both`,
                      }}
                    >
                      {option}
                    </button>
                  ))}
                  {currentQ.canType && (
                    <button
                      onClick={() => setShowTypeInput((v) => !v)}
                      className="wiz-option"
                      style={{
                        padding: "9px 18px",
                        borderRadius: 999,
                        border: "1px solid rgba(255,255,255,0.06)",
                        backgroundColor: "transparent",
                        color: "rgba(255,255,255,0.3)",
                        fontSize: 13,
                        fontFamily: "var(--font-outfit)",
                        cursor: "pointer",
                        animation: `wiz-option-in 0.4s cubic-bezier(.23,1,.32,1) ${currentQ.options.length * 48}ms both`,
                      }}
                    >
                      Type my own...
                    </button>
                  )}
                </div>

                {showTypeInput && (
                  <div style={{ marginTop: 12, display: "flex", gap: 8, animation: "wiz-fade-up 0.25s ease-out both" }}>
                    <input
                      value={typeInput}
                      onChange={(e) => setTypeInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && typeInput.trim()) handleAnswer(typeInput.trim()); }}
                      placeholder="Type your answer..."
                      autoFocus
                      className="nx-input"
                      style={{ flex: 1, fontSize: 13, padding: "9px 14px" }}
                    />
                    <button
                      onClick={() => typeInput.trim() && handleAnswer(typeInput.trim())}
                      disabled={!typeInput.trim()}
                      style={{
                        padding: "9px 16px",
                        borderRadius: 8,
                        border: "none",
                        backgroundColor: "#FF5200",
                        color: "#fff",
                        fontSize: 13,
                        fontWeight: 600,
                        fontFamily: "var(--font-outfit)",
                        cursor: typeInput.trim() ? "pointer" : "not-allowed",
                        opacity: typeInput.trim() ? 1 : 0.4,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        transition: "opacity 0.14s",
                      }}
                    >
                      <IconSend />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Thinking dots */}
            {answering && step <= 5 && (
              <div style={{ display: "flex", gap: 5, padding: "4px 0" }}>
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="wiz-think-dot"
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      backgroundColor: "rgba(255,82,0,0.5)",
                      animationDelay: `${i * 0.18}s`,
                    }}
                  />
                ))}
              </div>
            )}

            {/* Summary card */}
            {(step === 6 || step === 7) && (
              <SummaryCard
                answers={answers as Answers}
                leadStats={leadStats}
                isLaunching={isLaunching}
                launchError={launchError}
                launchResult={launchResult}
                onLaunch={handleLaunch}
                onEdit={handleEdit}
              />
            )}

            <div style={{ height: 12 }} />
          </div>
        </div>

        {/* RIGHT: Activity feed */}
        <div
          style={{
            width: "40%",
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
            overflow: "hidden",
            backgroundColor: "rgba(255,255,255,0.005)",
          }}
        >
          <div
            style={{
              padding: "16px 22px 13px",
              borderBottom: "1px solid rgba(255,255,255,0.05)",
              flexShrink: 0,
            }}
          >
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.2)", fontFamily: "var(--font-outfit)", margin: 0 }}>
              Live Activity
            </p>
          </div>

          <div
            ref={activityRef}
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "14px 18px 20px",
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            {activitySteps.length === 0 && (
              <div style={{ display: "flex", gap: 5, padding: "10px 0" }}>
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="wiz-think-dot"
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      backgroundColor: "rgba(255,255,255,0.12)",
                      animationDelay: `${i * 0.22}s`,
                    }}
                  />
                ))}
              </div>
            )}

            {activitySteps.map((actStep) => (
              <div
                key={actStep.id}
                className="wiz-step"
                style={{
                  padding: "9px 12px",
                  borderRadius: 8,
                  backgroundColor: "rgba(255,255,255,0.018)",
                  border: "1px solid rgba(255,255,255,0.05)",
                  borderLeft: `3px solid ${
                    actStep.variant === "orange" ? "#FF5200" : actStep.variant === "amber" ? "#F59E0B" : "#22C55E"
                  }`,
                  fontSize: 11.5,
                  color: "rgba(255,255,255,0.52)",
                  fontFamily: "var(--font-outfit)",
                  lineHeight: 1.5,
                }}
              >
                {actStep.text}
              </div>
            ))}

            <div style={{ height: 8 }} />
          </div>
        </div>
      </div>
    </>
  );
}

// ── Signal Banner ─────────────────────────────────────────────────────────────

function SignalBanner({ headline, company, signalType }: {
  headline: string;
  company: string;
  signalType: string;
}) {
  const emoji = signalType === "funding" ? "💰" : "📢";
  const label = signalType === "funding" ? "Funding signal" : "Hiring signal";
  return (
    <div style={{
      margin: "0 0 6px",
      padding: "10px 14px",
      borderRadius: 9,
      backgroundColor: "rgba(255,82,0,0.06)",
      border: "1px solid rgba(255,82,0,0.2)",
      display: "flex",
      alignItems: "flex-start",
      gap: 10,
    }}>
      <span style={{ fontSize: 16, flexShrink: 0 }}>{emoji}</span>
      <div>
        <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#FF5200", fontFamily: "var(--font-outfit)" }}>
          {label} — {company}
        </p>
        <p style={{ margin: "2px 0 0", fontSize: 11.5, color: "rgba(255,255,255,0.45)", fontFamily: "var(--font-outfit)", lineHeight: 1.4 }}>
          {headline}
        </p>
      </div>
    </div>
  );
}

// ── Page export ────────────────────────────────────────────────────────────────

export default function NewCampaignPage() {
  const [path, setPath] = useState<Path>(null);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("signal")) {
      setPath("wizard");
    }
  }, []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "calc(100vh - 60px)",
        backgroundColor: "#060606",
        overflow: "hidden",
      }}
    >
      <SharedHeader path={path} onBack={() => setPath(null)} />
      {path === null && <ChoiceScreen onSelect={setPath} />}
      {path === "wizard" && (
        <Suspense fallback={null}>
          <WizardContent />
        </Suspense>
      )}
      {path === "csv" && <CsvImportContent />}
    </div>
  );
}
