"use client";

import { useState } from "react";
import { Download, FileJson, ShieldCheck, Loader2 } from "lucide-react";

const cardStyle: React.CSSProperties = {
  backgroundColor: "#0e0e18",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: 10, padding: "20px 22px", marginBottom: 20,
};

export default function DataPage() {
  const [exporting, setExporting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleExport() {
    setExporting(true);
    setDone(false);
    try {
      const res = await fetch("/api/user/export-data");
      if (!res.ok) { alert("Export failed. Please try again."); return; }
      const blob = await res.blob();
      const date = new Date().toISOString().split("T")[0];
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `nexora-data-export-${date}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setDone(true);
      setTimeout(() => setDone(false), 4000);
    } finally {
      setExporting(false);
    }
  }

  return (
    <>
      <header style={{
        padding: "0 32px", height: 68,
        display: "flex", alignItems: "center",
        borderBottom: "1px solid rgba(255,255,255,0.055)",
        backgroundColor: "rgba(8,8,16,0.94)",
        backdropFilter: "blur(12px)",
        position: "sticky", top: 0, zIndex: 30,
      }}>
        <div>
          <h1 style={{ fontSize: 16, fontWeight: 500, color: "#fff", fontFamily: "var(--font-syne)", letterSpacing: "-0.02em", lineHeight: 1 }}>
            Data &amp; Privacy
          </h1>
          <p style={{ fontSize: 11, color: "#383838", fontFamily: "var(--font-outfit)", marginTop: 3 }}>
            Export and manage your personal data
          </p>
        </div>
      </header>

      <div style={{ padding: "28px 32px 64px", maxWidth: 560 }}>

        <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.07em", textTransform: "uppercase", color: "#444", fontFamily: "var(--font-outfit)", marginBottom: 10 }}>
          Data Export (GDPR)
        </p>

        <div style={cardStyle}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 20 }}>
            <FileJson size={20} strokeWidth={1.5} color="#555" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <p style={{ fontSize: 13, color: "#ccc", fontFamily: "var(--font-outfit)", marginBottom: 4 }}>
                Export all your data
              </p>
              <p style={{ fontSize: 12, color: "#555", fontFamily: "var(--font-outfit)", lineHeight: 1.6 }}>
                Download a complete JSON archive of everything stored in your account.
              </p>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 20 }}>
            {[
              "Account profile and settings",
              "All campaigns and leads",
              "Email events (opens, clicks, replies)",
              "Subscription and billing history",
              "Writing style profile",
            ].map((item) => (
              <div key={item} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 4, height: 4, borderRadius: "50%", backgroundColor: "#444", flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: "#666", fontFamily: "var(--font-outfit)" }}>{item}</span>
              </div>
            ))}
          </div>

          {done && (
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "9px 12px", borderRadius: 7, marginBottom: 14,
              backgroundColor: "rgba(74,222,128,0.06)",
              border: "1px solid rgba(74,222,128,0.15)",
            }}>
              <ShieldCheck size={13} color="#4ade80" strokeWidth={2} />
              <span style={{ fontSize: 12, color: "#4ade80", fontFamily: "var(--font-outfit)" }}>
                Export downloaded successfully.
              </span>
            </div>
          )}

          <button
            onClick={handleExport}
            disabled={exporting}
            style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              padding: "9px 18px",
              backgroundColor: exporting ? "rgba(255,82,0,0.4)" : "#FF5200",
              color: "#fff", borderRadius: 6, border: "none",
              fontSize: 12, fontFamily: "var(--font-outfit)", fontWeight: 500,
              cursor: exporting ? "not-allowed" : "pointer",
            }}
          >
            {exporting
              ? <Loader2 size={13} strokeWidth={2} style={{ animation: "spin 0.8s linear infinite" }} />
              : <Download size={13} strokeWidth={1.75} />
            }
            {exporting ? "Preparing export..." : "Download my data"}
          </button>
        </div>

        <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.07em", textTransform: "uppercase", color: "#444", fontFamily: "var(--font-outfit)", marginBottom: 10, marginTop: 8 }}>
          Your rights
        </p>
        <div style={cardStyle}>
          {[
            ["Right to access", "You can export all your data at any time using the button above."],
            ["Right to deletion", "You can delete your account from the Account Security page."],
            ["Right to portability", "Your data export is in JSON format, readable by any system."],
          ].map(([title, desc]) => (
            <div key={title} style={{ marginBottom: 14, paddingBottom: 14, borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <p style={{ fontSize: 13, color: "#888", fontFamily: "var(--font-outfit)", marginBottom: 2 }}>{title}</p>
              <p style={{ fontSize: 12, color: "#555", fontFamily: "var(--font-outfit)", lineHeight: 1.5 }}>{desc}</p>
            </div>
          ))}
          <p style={{ fontSize: 11, color: "#444", fontFamily: "var(--font-outfit)" }}>
            For other privacy requests, contact{" "}
            <a href="mailto:privacy@nexora.ai" style={{ color: "#666", textDecoration: "none" }}>privacy@nexora.ai</a>
          </p>
        </div>

      </div>
    </>
  );
}
