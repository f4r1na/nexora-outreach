"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type PreviewRow = string[];

function parseCSVPreview(
  text: string,
  maxRows = 6
): { headers: string[]; rows: PreviewRow[] } {
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
    ["email", "email_address"].includes(
      h.toLowerCase().replace(/[^a-z0-9]/g, "_")
    )
  );
}

export default function ImportCSVPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<{
    headers: string[];
    rows: PreviewRow[];
  } | null>(null);
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
        setError(
          "CSV must have an 'email' column. Found: " +
            (p.headers.join(", ") || "none")
        );
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
      const res = await fetch("/api/campaigns/import", {
        method: "POST",
        body: formData,
      });
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
    <div style={{ minHeight: "100vh", backgroundColor: "#060606" }}>
      <style>{`@keyframes imp-spin { to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <header
        style={{
          padding: "0 32px",
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
          <svg
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M10 3L5 8l5 5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Back
        </Link>
        <span style={{ color: "rgba(255,255,255,0.1)", fontSize: 16 }}>/</span>
        <span
          style={{
            fontSize: 15,
            fontWeight: 500,
            color: "#fff",
            fontFamily: "var(--font-syne)",
          }}
        >
          Import CSV
        </span>
      </header>

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

        {/* Upload zone */}
        {!preview && (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            style={{
              border: `2px dashed ${
                dragging
                  ? "rgba(255,82,0,0.6)"
                  : "rgba(255,255,255,0.1)"
              }`,
              borderRadius: 10,
              padding: "56px 24px",
              textAlign: "center",
              cursor: "pointer",
              backgroundColor: dragging
                ? "rgba(255,82,0,0.04)"
                : "rgba(255,255,255,0.015)",
              transition: "border-color 0.15s, background-color 0.15s",
            }}
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="rgba(255,255,255,0.2)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ margin: "0 auto 14px", display: "block" }}
              aria-hidden="true"
            >
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
            </svg>
            <p
              style={{
                fontSize: 14,
                color: "rgba(255,255,255,0.55)",
                fontFamily: "var(--font-outfit)",
                marginBottom: 6,
              }}
            >
              Drop your CSV here, or click to browse
            </p>
            <p
              style={{
                fontSize: 11,
                color: "rgba(255,255,255,0.2)",
                fontFamily: "var(--font-outfit)",
              }}
            >
              .csv files only
            </p>
            <input
              ref={inputRef}
              type="file"
              accept=".csv"
              style={{ display: "none" }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) loadFile(f);
              }}
            />
          </div>
        )}

        {/* Preview */}
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
              <p
                style={{
                  fontSize: 13,
                  color: "#4ade80",
                  fontFamily: "var(--font-outfit)",
                }}
              >
                {file?.name} - columns detected
              </p>
              <button
                onClick={() => {
                  setFile(null);
                  setPreview(null);
                  setError(null);
                }}
                style={{
                  fontSize: 11,
                  color: "rgba(255,255,255,0.3)",
                  fontFamily: "var(--font-outfit)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Change file
              </button>
            </div>

            {/* Column preview table */}
            <div
              style={{
                overflowX: "auto",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 8,
                marginBottom: 24,
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: 12,
                  fontFamily: "var(--font-outfit)",
                }}
              >
                <thead>
                  <tr
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
                  >
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
                    <tr
                      key={i}
                      style={{
                        borderBottom: "1px solid rgba(255,255,255,0.04)",
                      }}
                    >
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
                backgroundColor: uploading
                  ? "rgba(255,82,0,0.5)"
                  : "#FF5200",
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
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    style={{ animation: "imp-spin 0.9s linear infinite" }}
                    aria-hidden="true"
                  >
                    <path
                      d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
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
