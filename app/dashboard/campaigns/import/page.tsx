"use client";

import { useState, useRef, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

type Field = "first_name" | "last_name" | "email" | "company" | "title" | "subject" | "body" | "ignore";

const FIELDS: { key: Field; label: string; required: boolean }[] = [
  { key: "first_name", label: "First name", required: true },
  { key: "last_name", label: "Last name", required: false },
  { key: "email", label: "Email", required: true },
  { key: "company", label: "Company", required: false },
  { key: "title", label: "Title", required: false },
  { key: "subject", label: "Subject", required: false },
  { key: "body", label: "Body", required: false },
  { key: "ignore", label: "Ignore column", required: false },
];

type ImportResult = { campaignId: string; imported: number; skipped: number };

function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  const lines: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (inQ && text[i + 1] === '"') {
        cur += '"';
        i++;
      } else inQ = !inQ;
    } else if (c === "\n" && !inQ) {
      lines.push(cur);
      cur = "";
    } else if (c === "\r" && !inQ) {
      // skip
    } else cur += c;
  }
  if (cur.length) lines.push(cur);

  const splitRow = (line: string): string[] => {
    const out: string[] = [];
    let f = "";
    let q = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (q && line[i + 1] === '"') {
          f += '"';
          i++;
        } else q = !q;
      } else if (c === "," && !q) {
        out.push(f.trim());
        f = "";
      } else f += c;
    }
    out.push(f.trim());
    return out;
  };

  const all = lines.filter((l) => l.length).map(splitRow);
  if (!all.length) return { headers: [], rows: [] };
  return { headers: all[0], rows: all.slice(1) };
}

function autoMap(header: string): Field {
  const h = header.toLowerCase().replace(/[\s_-]+/g, "");
  if (["firstname", "fname", "given", "givenname", "name", "fullname"].includes(h)) return "first_name";
  if (["lastname", "lname", "surname", "familyname"].includes(h)) return "last_name";
  if (["email", "emailaddress", "mail"].includes(h)) return "email";
  if (["company", "companyname", "organization", "org"].includes(h)) return "company";
  if (["title", "jobtitle", "role", "position"].includes(h)) return "title";
  if (["subject", "emailsubject", "subjectline"].includes(h)) return "subject";
  if (["body", "emailbody", "message", "content"].includes(h)) return "body";
  return "ignore";
}

function IconArrowLeft() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconUpload() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 16V4M6 10l6-6 6 6M4 20h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
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

function CsvImportContent() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fileName, setFileName] = useState<string | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Field[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);

  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleFile = async (file: File) => {
    setParseError(null);
    setResult(null);
    setImportError(null);
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setParseError("File must be a .csv");
      return;
    }
    const text = await file.text();
    const { headers: h, rows: r } = parseCsv(text);
    if (!h.length || !r.length) {
      setParseError("CSV has no data");
      return;
    }
    setFileName(file.name);
    setHeaders(h);
    setRows(r);
    setMapping(h.map(autoMap));
  };

  const requiredOk = (["first_name", "email"] as Field[]).every((f) =>
    mapping.includes(f)
  );

  const handleImport = async () => {
    if (!requiredOk || isImporting) return;
    setIsImporting(true);
    setImportError(null);

    try {
      const res = await fetch("/api/campaigns/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName,
          mapping,
          headers,
          rows,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setImportError(data.error ?? "Import failed");
        setIsImporting(false);
        toast.error("Import failed");
        return;
      }
      setResult({
        campaignId: data.campaignId,
        imported: data.imported,
        skipped: data.skipped ?? 0,
      });
      setIsImporting(false);
      toast.success(`Imported ${data.imported} leads`, {
        style: { color: "#FF5200", borderColor: "rgba(255,82,0,0.25)" },
      });
      setTimeout(() => router.push(`/dashboard/campaigns/${data.campaignId}`), 1800);
    } catch (err: unknown) {
      setImportError(err instanceof Error ? err.message : "Import failed");
      setIsImporting(false);
      toast.error("Import failed");
    }
  };

  const reset = () => {
    setFileName(null);
    setHeaders([]);
    setRows([]);
    setMapping([]);
    setParseError(null);
    setImportError(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <>
      <style>{`
        @keyframes csv-fade-up {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes csv-spin { to { transform: rotate(360deg); } }
        .csv-card { animation: csv-fade-up 0.28s cubic-bezier(.23,1,.32,1) both; }
        .csv-btn { transition: background-color 0.14s, transform 0.1s, opacity 0.14s; }
        .csv-btn:hover:not(:disabled) { background-color: #ff6a1f !important; }
        .csv-btn:active:not(:disabled) { transform: scale(0.98); }
        .csv-ghost { transition: border-color 0.14s, color 0.14s; }
        .csv-ghost:hover { border-color: rgba(255,255,255,0.22) !important; color: rgba(255,255,255,0.7) !important; }
        .csv-drop { transition: border-color 0.14s, background-color 0.14s; }
        .csv-drop:hover { border-color: rgba(255,82,0,0.4) !important; background-color: rgba(255,82,0,0.03) !important; }
        .csv-select {
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='rgba(255,255,255,0.4)' stroke-width='1.4' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 10px center;
          padding-right: 28px;
        }
      `}</style>

      <header
        style={{
          padding: "0 28px",
          height: 64,
          display: "flex",
          alignItems: "center",
          gap: 12,
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          backgroundColor: "rgba(6,6,6,0.9)",
          backdropFilter: "blur(12px)",
          position: "sticky",
          top: 0,
          zIndex: 30,
        }}
      >
        <Link
          href="/dashboard/campaigns"
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
        <span style={{ color: "rgba(255,255,255,0.1)", fontSize: 16 }}>/</span>
        <span style={{ fontSize: 15, fontWeight: 600, color: "#fff", fontFamily: "var(--font-syne)" }}>
          Import leads from CSV
        </span>
      </header>

      <div
        style={{
          maxWidth: 880,
          margin: "0 auto",
          padding: "32px 28px 64px",
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        {/* Upload */}
        {!headers.length && !result && (
          <div
            className="csv-card csv-drop"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files?.[0];
              if (f) handleFile(f);
            }}
            style={{
              padding: "56px 24px",
              backgroundColor: "#0e0e0e",
              border: "1.5px dashed rgba(255,255,255,0.12)",
              borderRadius: 12,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
              cursor: "pointer",
              textAlign: "center",
            }}
          >
            <div style={{ color: "rgba(255,255,255,0.55)" }}>
              <IconUpload />
            </div>
            <div>
              <p style={{ fontSize: 15, color: "#fff", fontFamily: "var(--font-syne)", fontWeight: 500, marginBottom: 4 }}>
                Drop your CSV here
              </p>
              <p style={{ fontSize: 12.5, color: "rgba(255,255,255,0.4)", fontFamily: "var(--font-outfit)" }}>
                or click to browse — first_name and email required
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
              style={{ display: "none" }}
            />
            {parseError && (
              <p style={{ marginTop: 8, fontSize: 12.5, color: "#ef4444", fontFamily: "var(--font-outfit)" }}>
                {parseError}
              </p>
            )}
          </div>
        )}

        {/* Preview + mapping */}
        {headers.length > 0 && !result && (
          <>
            <div
              className="csv-card"
              style={{
                padding: "16px 18px",
                backgroundColor: "#0e0e0e",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 13, color: "#fff", fontFamily: "var(--font-outfit)", fontWeight: 500, marginBottom: 2 }} className="truncate">
                  {fileName}
                </p>
                <p style={{ fontSize: 11.5, color: "rgba(255,255,255,0.4)", fontFamily: "var(--font-outfit)", fontVariantNumeric: "tabular-nums" }}>
                  {rows.length} rows · {headers.length} columns
                </p>
              </div>
              <button
                onClick={reset}
                className="csv-ghost"
                style={{
                  padding: "7px 14px",
                  borderRadius: 7,
                  border: "1px solid rgba(255,255,255,0.1)",
                  backgroundColor: "transparent",
                  color: "rgba(255,255,255,0.5)",
                  fontSize: 12.5,
                  fontFamily: "var(--font-outfit)",
                  cursor: "pointer",
                }}
              >
                Choose another file
              </button>
            </div>

            <div
              className="csv-card"
              style={{
                backgroundColor: "#0e0e0e",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 10,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "14px 18px",
                  borderBottom: "1px solid rgba(255,255,255,0.05)",
                }}
              >
                <p style={{ fontSize: 13, color: "#fff", fontFamily: "var(--font-syne)", fontWeight: 500, marginBottom: 3 }}>
                  Map columns
                </p>
                <p style={{ fontSize: 11.5, color: "rgba(255,255,255,0.4)", fontFamily: "var(--font-outfit)" }}>
                  We auto-matched what we could. Adjust any column below.
                </p>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-outfit)" }}>
                  <thead>
                    <tr>
                      {headers.map((h, i) => (
                        <th
                          key={i}
                          style={{
                            padding: "12px 14px",
                            textAlign: "left",
                            borderBottom: "1px solid rgba(255,255,255,0.05)",
                            backgroundColor: "rgba(255,255,255,0.015)",
                            fontSize: 11,
                            fontWeight: 500,
                            color: "rgba(255,255,255,0.55)",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.08em" }} className="truncate">
                              {h}
                            </span>
                            <select
                              className="csv-select"
                              value={mapping[i]}
                              onChange={(e) => {
                                const next = [...mapping];
                                next[i] = e.target.value as Field;
                                setMapping(next);
                              }}
                              style={{
                                padding: "6px 10px",
                                borderRadius: 6,
                                border: "1px solid rgba(255,255,255,0.09)",
                                backgroundColor: "#060606",
                                color: "#fff",
                                fontSize: 12,
                                fontFamily: "var(--font-outfit)",
                                cursor: "pointer",
                                minWidth: 140,
                              }}
                            >
                              {FIELDS.map((f) => (
                                <option key={f.key} value={f.key}>
                                  {f.label}
                                  {f.required ? " *" : ""}
                                </option>
                              ))}
                            </select>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 5).map((row, ri) => (
                      <tr key={ri}>
                        {headers.map((_, ci) => (
                          <td
                            key={ci}
                            style={{
                              padding: "10px 14px",
                              borderBottom: "1px solid rgba(255,255,255,0.04)",
                              fontSize: 12.5,
                              color: "rgba(255,255,255,0.7)",
                              maxWidth: 220,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {row[ci] ?? ""}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {rows.length > 5 && (
                <div
                  style={{
                    padding: "10px 18px",
                    borderTop: "1px solid rgba(255,255,255,0.04)",
                    fontSize: 11.5,
                    color: "rgba(255,255,255,0.35)",
                    fontFamily: "var(--font-outfit)",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  Showing 5 of {rows.length} rows
                </div>
              )}
            </div>

            {!requiredOk && (
              <p
                style={{
                  fontSize: 12.5,
                  color: "#F59E0B",
                  fontFamily: "var(--font-outfit)",
                  padding: "10px 14px",
                  backgroundColor: "rgba(245,158,11,0.06)",
                  border: "1px solid rgba(245,158,11,0.18)",
                  borderRadius: 8,
                }}
              >
                Map all required fields: first_name and email.
              </p>
            )}

            {importError && (
              <p
                style={{
                  fontSize: 12.5,
                  color: "#ef4444",
                  fontFamily: "var(--font-outfit)",
                  padding: "10px 14px",
                  backgroundColor: "rgba(239,68,68,0.06)",
                  border: "1px solid rgba(239,68,68,0.2)",
                  borderRadius: 8,
                }}
              >
                {importError}
              </p>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button
                onClick={handleImport}
                disabled={!requiredOk || isImporting}
                className="csv-btn"
                style={{
                  padding: "11px 22px",
                  borderRadius: 8,
                  border: "none",
                  backgroundColor: "#FF5200",
                  color: "#fff",
                  fontSize: 13.5,
                  fontWeight: 500,
                  fontFamily: "var(--font-outfit)",
                  cursor: !requiredOk || isImporting ? "not-allowed" : "pointer",
                  opacity: !requiredOk ? 0.45 : isImporting ? 0.75 : 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  minWidth: 160,
                  justifyContent: "center",
                }}
              >
                {isImporting ? (
                  <>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ animation: "csv-spin 0.9s linear infinite" }} aria-hidden="true">
                      <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                    </svg>
                    Importing {rows.length}...
                  </>
                ) : (
                  <>Import {rows.length} leads</>
                )}
              </button>
            </div>
          </>
        )}

        {/* Success */}
        {result && (
          <div
            className="csv-card"
            style={{
              padding: 24,
              backgroundColor: "#0e0e0e",
              border: "1px solid rgba(255,255,255,0.06)",
              borderTop: "2px solid #22C55E",
              borderRadius: 12,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, color: "#22C55E" }}>
              <IconCheck />
              <p style={{ fontSize: 14, fontWeight: 600, fontFamily: "var(--font-syne)" }}>
                Import complete
              </p>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 8,
                marginBottom: 18,
              }}
            >
              <div
                style={{
                  padding: "10px 14px",
                  backgroundColor: "rgba(255,255,255,0.025)",
                  borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <p style={{ fontSize: 9.5, color: "rgba(255,255,255,0.3)", fontFamily: "var(--font-outfit)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3 }}>
                  Imported
                </p>
                <p style={{ fontSize: 16, color: "#fff", fontFamily: "var(--font-outfit)", fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>
                  {result.imported}
                </p>
              </div>
              <div
                style={{
                  padding: "10px 14px",
                  backgroundColor: "rgba(255,255,255,0.025)",
                  borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <p style={{ fontSize: 9.5, color: "rgba(255,255,255,0.3)", fontFamily: "var(--font-outfit)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3 }}>
                  Skipped
                </p>
                <p style={{ fontSize: 16, color: "#fff", fontFamily: "var(--font-outfit)", fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>
                  {result.skipped}
                </p>
              </div>
            </div>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", fontFamily: "var(--font-outfit)" }}>
              Redirecting to your campaign...
            </p>
          </div>
        )}
      </div>
    </>
  );
}

export default function CsvImportPage() {
  return (
    <Suspense fallback={null}>
      <CsvImportContent />
    </Suspense>
  );
}
