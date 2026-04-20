"use client";

import { useState, useEffect } from "react";
import { Brain, ChevronDown, ChevronUp, RotateCcw, TrendingUp, Zap, Lightbulb } from "lucide-react";

type Insight = {
  id: string;
  best_opening_style: string;
  best_subject_pattern: string;
  winning_signals: string[];
  losing_patterns: string[];
  improvement_suggestions: string[];
  confidence_score: number;
  analyzed_at: string;
};

function InsightPill({ icon, color, label }: { icon: React.ReactNode; color: string; label: string }) {
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "4px 10px", borderRadius: 999,
      backgroundColor: `${color}12`,
      border: `1px solid ${color}2a`,
    }}>
      <span style={{ color, display: "flex", alignItems: "center" }}>{icon}</span>
      <span style={{ fontSize: 11, color: "#666", fontFamily: "var(--font-outfit)", lineHeight: 1 }}>
        {label}
      </span>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p style={{
        fontSize: 9, color: "#3a3a4a", textTransform: "uppercase",
        letterSpacing: "0.08em", fontFamily: "var(--font-outfit)", marginBottom: 6,
      }}>
        {label}
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {children}
      </div>
    </div>
  );
}

const rowStyle: React.CSSProperties = {
  fontSize: 12, color: "#666", fontFamily: "var(--font-outfit)", margin: 0, lineHeight: 1.6,
};

export default function CampaignIQCard({ sentCount }: { sentCount: number }) {
  const [insight, setInsight] = useState<Insight | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    if (sentCount < 10) return;
    runAnalysis(false);
  }, [sentCount]); // eslint-disable-line react-hooks/exhaustive-deps

  async function runAnalysis(force: boolean) {
    if (force) setAnalyzing(true);
    else setLoading(true);
    try {
      const res = await fetch("/api/campaign-iq/analyze", { method: "POST" });
      const data = await res.json() as { insight?: Insight };
      if (data.insight) setInsight(data.insight);
    } finally {
      setLoading(false);
      setAnalyzing(false);
    }
  }

  if (sentCount < 10) return null;

  if (loading) {
    return (
      <div style={{
        backgroundColor: "#0e0e0e",
        border: "1px solid rgba(255,82,0,0.12)",
        borderRadius: 10,
        padding: "18px 22px",
        marginBottom: 16,
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}>
        <div style={{ display: "flex", gap: 4 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: 5, height: 5, borderRadius: "50%",
              backgroundColor: "rgba(255,82,0,0.5)",
              animation: "ciq-think 1.4s ease-in-out infinite",
              animationDelay: `${i * 0.18}s`,
            }} />
          ))}
        </div>
        <span style={{ fontSize: 12, color: "#555", fontFamily: "var(--font-outfit)" }}>
          Analyzing campaign patterns...
        </span>
        <style>{`
          @keyframes ciq-think {
            0%, 80%, 100% { transform: scale(0.65); opacity: 0.3; }
            40% { transform: scale(1); opacity: 1; }
          }
        `}</style>
      </div>
    );
  }

  if (!insight) return null;

  const scoreColor =
    insight.confidence_score >= 75 ? "#4ade80" :
    insight.confidence_score >= 50 ? "#F59E0B" : "#f87171";

  return (
    <div style={{
      backgroundColor: "#0e0e0e",
      border: "1px solid rgba(255,82,0,0.18)",
      borderRadius: 10,
      padding: "18px 22px",
      marginBottom: 16,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 7,
            backgroundColor: "rgba(255,82,0,0.1)",
            border: "1px solid rgba(255,82,0,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#FF5200",
          }}>
            <Brain size={13} strokeWidth={1.8} />
          </div>
          <div>
            <p style={{
              fontSize: 13, fontWeight: 600, color: "#ddd",
              fontFamily: "var(--font-space-grotesk)", margin: 0,
            }}>
              Campaign IQ
            </p>
            <p style={{ fontSize: 10, color: "#444", fontFamily: "var(--font-outfit)", margin: 0, marginTop: 1 }}>
              Learning from your reply patterns
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{
            fontSize: 11, fontWeight: 600,
            padding: "3px 10px", borderRadius: 999,
            backgroundColor: `${scoreColor}18`,
            color: scoreColor,
            border: `1px solid ${scoreColor}33`,
            fontFamily: "var(--font-outfit)",
          }}>
            {insight.confidence_score}% confidence
          </span>
          <button
            onClick={() => runAnalysis(true)}
            disabled={analyzing}
            title="Re-analyze"
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 28, height: 28, borderRadius: 7,
              border: "1px solid rgba(255,255,255,0.07)",
              backgroundColor: "transparent",
              color: "#444",
              cursor: analyzing ? "not-allowed" : "pointer",
              opacity: analyzing ? 0.5 : 1,
              transition: "color 0.14s",
            }}
          >
            <RotateCcw size={11} style={{ animation: analyzing ? "ciq-spin 1s linear infinite" : "none" }} />
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <InsightPill icon={<TrendingUp size={10} />} color="#FF5200" label={insight.best_opening_style} />
        {insight.winning_signals[0] && (
          <InsightPill icon={<Zap size={10} />} color="#F59E0B" label={insight.winning_signals[0]} />
        )}
        {insight.improvement_suggestions[0] && (
          <InsightPill icon={<Lightbulb size={10} />} color="#6b7280" label={insight.improvement_suggestions[0]} />
        )}
      </div>

      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          display: "flex", alignItems: "center", gap: 5,
          fontSize: 10, color: "#444", fontFamily: "var(--font-outfit)",
          backgroundColor: "transparent", border: "none",
          cursor: "pointer", padding: "10px 0 0",
          transition: "color 0.14s",
        }}
      >
        {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
        {expanded ? "Less" : "Full analysis"}
      </button>

      {expanded && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 14 }}>
          <Section label="What works">
            <p style={rowStyle}><strong style={{ color: "#888", fontWeight: 500 }}>Opening:</strong> {insight.best_opening_style}</p>
            <p style={rowStyle}><strong style={{ color: "#888", fontWeight: 500 }}>Subject:</strong> {insight.best_subject_pattern}</p>
          </Section>
          {insight.winning_signals.length > 0 && (
            <Section label="Winning signals">
              {insight.winning_signals.map((s, i) => (
                <p key={i} style={rowStyle}>- {s}</p>
              ))}
            </Section>
          )}
          {insight.losing_patterns.length > 0 && (
            <Section label="Avoid these">
              {insight.losing_patterns.map((s, i) => (
                <p key={i} style={rowStyle}>- {s}</p>
              ))}
            </Section>
          )}
          {insight.improvement_suggestions.length > 0 && (
            <Section label="Suggestions">
              {insight.improvement_suggestions.map((s, i) => (
                <p key={i} style={rowStyle}>- {s}</p>
              ))}
            </Section>
          )}
          <p style={{ fontSize: 10, color: "#333", fontFamily: "var(--font-outfit)" }}>
            Last analyzed {new Date(insight.analyzed_at).toLocaleDateString("en-US", {
              month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
            })}
          </p>
        </div>
      )}

      <style>{`
        @keyframes ciq-think {
          0%, 80%, 100% { transform: scale(0.65); opacity: 0.3; }
          40% { transform: scale(1); opacity: 1; }
        }
        @keyframes ciq-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
