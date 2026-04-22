"use client";

import { useState, useEffect } from "react";
import { Sparkles, Loader2 } from "lucide-react";

type GhostStyle = {
  style_summary: string;
  tone_keywords: string;
  sample_emails: string[];
} | null;

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 12px",
  borderRadius: 6,
  backgroundColor: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "#ccc",
  fontFamily: "var(--font-outfit)",
  fontSize: 13,
  outline: "none",
  boxSizing: "border-box",
};

export default function WritingStyle({ isAgency }: { isAgency: boolean }) {
  const [ghostStyle, setGhostStyle] = useState<GhostStyle | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [sampleEmails, setSampleEmails] = useState(["", "", "", "", ""]);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRetraining, setIsRetraining] = useState(false);

  useEffect(() => {
    fetch("/api/ghostwriter")
      .then((r) => r.json())
      .then((d) => { setGhostStyle(d.style ?? null); setLoading(false); })
      .catch(() => { setGhostStyle(null); setLoading(false); });
  }, []);

  async function handleAnalyze() {
    const filled = sampleEmails.filter((s) => s.trim());
    if (filled.length < 3) { setError("Please provide at least 3 sample emails."); return; }
    setAnalyzing(true);
    setError(null);
    try {
      const res = await fetch("/api/ghostwriter/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sample_emails: filled }),
      });
      const data = await res.json() as { ok?: boolean; style?: GhostStyle; error?: string };
      if (!res.ok) { setError(data.error ?? "Analysis failed"); }
      else if (data.style) {
        setGhostStyle(data.style);
        setIsRetraining(false);
        setSampleEmails(["", "", "", "", ""]);
      }
    } catch { setError("Network error — please try again."); }
    finally { setAnalyzing(false); }
  }

  async function handleRemove() {
    try {
      const res = await fetch("/api/ghostwriter", { method: "DELETE" });
      if (res.ok) { setGhostStyle(null); setIsRetraining(false); setSampleEmails(["", "", "", "", ""]); }
    } catch { /* silent */ }
  }

  if (!isAgency) {
    return (
      <div style={{
        padding: "20px 0",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
      }}>
        <p style={{ fontSize: 13, fontWeight: 500, color: "#555", fontFamily: "var(--font-syne)", textAlign: "center" }}>
          Writing Style requires Agency plan
        </p>
        <p style={{ fontSize: 12, color: "#444", fontFamily: "var(--font-outfit)", textAlign: "center", lineHeight: 1.5 }}>
          Train AI on your emails so all campaigns match your voice.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ color: "#444", fontFamily: "var(--font-outfit)", fontSize: 13, display: "flex", alignItems: "center", gap: 7 }}>
        <Loader2 size={13} strokeWidth={2} style={{ animation: "spin 0.8s linear infinite" }} />
        Loading…
      </div>
    );
  }

  if (ghostStyle && !isRetraining) {
    return (
      <div>
        <div style={{
          display: "flex", alignItems: "center", gap: 10, marginBottom: 14,
        }}>
          <Sparkles size={13} strokeWidth={1.5} color="#FF5200" />
          <span style={{ fontSize: 12, color: "#888", fontFamily: "var(--font-outfit)" }}>Style configured</span>
        </div>
        <div style={{
          padding: "14px 16px", borderRadius: 8, marginBottom: 12,
          backgroundColor: "rgba(255,82,0,0.03)",
          border: "1px solid rgba(255,82,0,0.1)",
        }}>
          <p style={{ fontSize: 13, color: "#888", fontFamily: "var(--font-outfit)", lineHeight: 1.6 }}>
            {ghostStyle.style_summary}
          </p>
        </div>
        {ghostStyle.tone_keywords && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 14 }}>
            {ghostStyle.tone_keywords.split(",").map((kw) => kw.trim()).filter(Boolean).map((kw) => (
              <span key={kw} style={{
                fontSize: 11, padding: "3px 9px", borderRadius: 5,
                backgroundColor: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.07)",
                color: "#666", fontFamily: "var(--font-outfit)",
              }}>
                {kw}
              </span>
            ))}
          </div>
        )}
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setIsRetraining(true)}
            style={{
              padding: "6px 13px", borderRadius: 6, fontSize: 12,
              fontFamily: "var(--font-outfit)", cursor: "pointer",
              backgroundColor: "transparent", color: "#888",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            Retrain
          </button>
          <button
            onClick={handleRemove}
            style={{
              padding: "6px 13px", borderRadius: 6, fontSize: 12,
              fontFamily: "var(--font-outfit)", cursor: "pointer",
              backgroundColor: "transparent", color: "#f87171",
              border: "1px solid rgba(239,68,68,0.15)",
            }}
          >
            Remove
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <p style={{ fontSize: 12, color: "#555", fontFamily: "var(--font-outfit)", lineHeight: 1.6, marginBottom: 14 }}>
        Paste 3-5 emails you have written. AI will learn your tone and vocabulary.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
        {sampleEmails.map((val, i) => (
          <div key={i}>
            <label style={{
              fontSize: 10, fontWeight: 500, color: "#444",
              textTransform: "uppercase", letterSpacing: "0.06em",
              display: "block", marginBottom: 4, fontFamily: "var(--font-outfit)",
            }}>
              Sample {i + 1}{i < 3 ? " *" : " (optional)"}
            </label>
            <textarea
              value={val}
              onChange={(e) => setSampleEmails((prev) => prev.map((v, j) => j === i ? e.target.value : v))}
              placeholder={i === 0 ? "Paste an email you wrote — subject + body works best" : "Paste an email you wrote"}
              rows={3}
              style={{ ...inputStyle, lineHeight: 1.6, resize: "vertical" }}
            />
          </div>
        ))}
      </div>
      {error && (
        <p style={{ fontSize: 12, color: "#f87171", fontFamily: "var(--font-outfit)", marginBottom: 12 }}>
          {error}
        </p>
      )}
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={handleAnalyze}
          disabled={analyzing}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "8px 16px", borderRadius: 6,
            backgroundColor: analyzing ? "rgba(255,82,0,0.4)" : "#FF5200",
            color: "#fff", border: "none",
            fontSize: 12, fontFamily: "var(--font-outfit)",
            cursor: analyzing ? "not-allowed" : "pointer",
          }}
        >
          {analyzing && <Loader2 size={12} strokeWidth={2} style={{ animation: "spin 0.8s linear infinite" }} />}
          {analyzing ? "Analyzing..." : "Analyze style"}
        </button>
        {isRetraining && (
          <button
            onClick={() => { setIsRetraining(false); setError(null); }}
            style={{
              padding: "8px 14px", borderRadius: 6,
              backgroundColor: "transparent", color: "#666",
              border: "1px solid rgba(255,255,255,0.08)",
              fontSize: 12, fontFamily: "var(--font-outfit)", cursor: "pointer",
            }}
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
