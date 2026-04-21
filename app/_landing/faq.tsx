"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";

const FAQS = [
  {
    q: "Is this really automated?",
    a: "Yes. Nexora finds leads, writes personalized emails, and sends them automatically through your Gmail.",
  },
  {
    q: "Will my emails look spammy?",
    a: "No. Every email is personalized using real research about each lead — company context, role, and signals like hiring activity or recent news.",
  },
  {
    q: "What if I want to review before sending?",
    a: "You can set Nexora to draft mode — review every email before it goes out.",
  },
  {
    q: "How does billing work?",
    a: "You start with 10 free emails. After that, plans start at $19/month. Cancel anytime — no lock-in.",
  },
  {
    q: "Is my Gmail account safe?",
    a: "Yes. We use official Gmail OAuth. We never store your password and tokens are encrypted server-side.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section style={{
      padding: "clamp(80px, 10vw, 128px) clamp(20px, 4vw, 56px)",
      position: "relative", zIndex: 1,
      borderTop: "1px solid rgba(255,255,255,0.06)",
    }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div style={{ marginBottom: 48, textAlign: "center" }}>
          <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.1em", color: "#F59E0B", textTransform: "uppercase", marginBottom: 12 }}>
            FAQ
          </p>
          <h2 style={{
            fontSize: "clamp(30px, 4.5vw, 48px)",
            fontWeight: 600, fontFamily: "var(--font-space-grotesk)",
            letterSpacing: "-0.025em", lineHeight: 1.08,
          }}>
            Questions, answered.
          </h2>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <div
                key={f.q}
                style={{
                  backgroundColor: "#0E0E18",
                  border: `1px solid ${isOpen ? "rgba(255,82,0,0.22)" : "rgba(255,255,255,0.06)"}`,
                  borderRadius: 14,
                  overflow: "hidden",
                  transition: "border-color 0.2s ease",
                }}
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  style={{
                    width: "100%",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    gap: 16,
                    padding: "20px 24px",
                    background: "none", border: "none", cursor: "pointer",
                    color: "#fff",
                    fontFamily: "var(--font-outfit)",
                    fontSize: 15, fontWeight: 500,
                    textAlign: "left",
                  }}
                >
                  <span>{f.q}</span>
                  <Plus
                    size={16}
                    color="rgba(255,255,255,0.45)"
                    style={{
                      flexShrink: 0,
                      transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
                      transition: "transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
                      style={{ overflow: "hidden" }}
                    >
                      <p style={{
                        padding: "0 24px 22px",
                        fontSize: 14, color: "rgba(255,255,255,0.58)",
                        lineHeight: 1.7,
                        fontFamily: "var(--font-outfit)",
                      }}>
                        {f.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
