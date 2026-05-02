"use client";
import { motion, useReducedMotion } from "framer-motion";
import { Sparkles } from "lucide-react";

const SUGGESTIONS = [
  "Show me my top campaigns by open rate",
  "Check my inbox for replies",
  "What follow-ups are due today?",
  "Help me write a cold email",
];

export function WelcomeCard({ onSend }: { onSend: (msg: string) => void }) {
  const prefersReduced = useReducedMotion();

  return (
    <motion.div
      initial={prefersReduced ? false : { y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      style={{
        background: "rgba(255,82,0,0.1)",
        border: "2px solid rgba(255,82,0,0.35)",
        borderRadius: 16,
        padding: "28px 24px",
        margin: "8px 0",
      }}
    >
      <motion.div
        animate={prefersReduced ? {} : { y: [0, -6, 0] }}
        transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }}
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          background: "rgba(255,82,0,0.15)",
          border: "1px solid rgba(255,82,0,0.3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 16,
        }}
      >
        <Sparkles size={24} color="#FF5200" />
      </motion.div>

      <h2
        style={{
          fontFamily: "var(--font-space-grotesk)",
          fontSize: 20,
          fontWeight: 700,
          color: "#fff",
          marginBottom: 8,
        }}
      >
        Welcome to Nexora Agent
      </h2>
      <p
        style={{
          fontSize: 14,
          color: "rgba(255,255,255,0.55)",
          lineHeight: 1.6,
          marginBottom: 20,
        }}
      >
        Your AI outreach assistant. Ask me about campaigns, leads, inbox, or analytics — or pick a suggestion below.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => onSend(s)}
            style={{
              padding: "10px 14px",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,82,0,0.2)",
              borderRadius: 8,
              fontSize: 13,
              color: "rgba(255,255,255,0.7)",
              cursor: "pointer",
              textAlign: "left",
              fontFamily: "var(--font-outfit)",
              transition: "background 150ms, color 150ms, border-color 150ms",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,82,0,0.12)";
              e.currentTarget.style.color = "#fff";
              e.currentTarget.style.borderColor = "rgba(255,82,0,0.5)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.04)";
              e.currentTarget.style.color = "rgba(255,255,255,0.7)";
              e.currentTarget.style.borderColor = "rgba(255,82,0,0.2)";
            }}
          >
            {s}
          </button>
        ))}
      </div>
    </motion.div>
  );
}
