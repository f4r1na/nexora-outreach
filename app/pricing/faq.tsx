"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";

const FAQS = [
  {
    q: "Can I switch plans later?",
    a: "Yes. Upgrade or downgrade anytime from your dashboard. Changes prorate automatically.",
  },
  {
    q: "What happens if I exceed my email quota?",
    a: "Sending pauses until the next billing cycle, or you can upgrade to a higher tier on the spot. We never bill surprise overages.",
  },
  {
    q: "How does the Scale tier pricing work?",
    a: "Scale is usage-based at $0.12 to $0.15 per email depending on volume, with a $99/month minimum. Larger commitments get lower per-email rates.",
  },
  {
    q: "Do you offer a free trial?",
    a: "Every account starts with 10 free emails — no credit card required. Pro includes a 7-day trial when you sign up.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Cancel from your dashboard with one click. You keep access until the end of your billing period.",
  },
];

export default function PricingFAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section style={{
      padding: "clamp(60px, 8vw, 96px) clamp(20px, 4vw, 56px)",
      position: "relative", zIndex: 1,
      borderTop: "1px solid rgba(255,255,255,0.06)",
    }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div style={{ marginBottom: 48, textAlign: "center" }}>
          <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.1em", color: "#F59E0B", textTransform: "uppercase", marginBottom: 12 }}>
            FAQ
          </p>
          <h2 style={{
            fontSize: "clamp(28px, 4.2vw, 44px)",
            fontWeight: 600, fontFamily: "var(--font-space-grotesk)",
            letterSpacing: "-0.025em", lineHeight: 1.08,
            color: "#fff",
          }}>
            Pricing questions, answered.
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
