"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";

const EASE = [0.23, 1, 0.32, 1] as const;

const FAQS = [
  {
    q: "How does signal detection actually work?",
    a: "Nexora continuously monitors 50+ data sources — job boards, Crunchbase, GitHub, Product Hunt, news feeds, and more. When a company publishes a hiring spike, closes funding, or ships a product launch, we detect it within minutes and surface it as an actionable signal for your outreach.",
  },
  {
    q: "Will my emails look spammy or templated?",
    a: "No. Every email is generated using the specific signal context for that company — not a generic template. Your prospect receives an email that references their actual situation: the role they just posted, the round they just closed, or the tech upgrade they just shipped. Prospects regularly reply saying they're impressed by the research.",
  },
  {
    q: "Does Nexora integrate with my CRM?",
    a: "Yes. Nexora connects to HubSpot, Salesforce, and Pipedrive out of the box. Contacts, activities, and replies sync automatically. We also support Zapier and a REST API for custom integrations.",
  },
  {
    q: "Is my data and Gmail account secure?",
    a: "We use official Gmail OAuth — no passwords stored, ever. All tokens are encrypted server-side with AES-256. Your email content is never used to train AI models. We're SOC 2 Type II compliant and GDPR-ready with a full DPA available on request.",
  },
  {
    q: "Can I cancel or change plans anytime?",
    a: "Yes. No contracts, no lock-ins. Downgrade, upgrade, or cancel at any time from your billing settings. If you cancel, you keep access until the end of your current billing period. We don't do surprise charges.",
  },
  {
    q: "How does follow-up automation work?",
    a: "When your initial email gets no reply, Nexora schedules follow-ups automatically. Each follow-up references the original signal and adds a new angle — not just 'bumping' the thread. Sequences stop the moment someone replies or unsubscribes. You control the cadence and maximum number of touches.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section
      id="faq"
      style={{
        padding: "clamp(80px, 10vw, 128px) clamp(20px, 4vw, 56px)",
        position: "relative",
        zIndex: 1,
        borderTop: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, ease: EASE }}
          style={{ textAlign: "center", marginBottom: "clamp(40px, 6vw, 64px)" }}
        >
          <p style={{
            fontSize: 11, fontWeight: 600, letterSpacing: "0.1em",
            color: "#FF5200", textTransform: "uppercase", marginBottom: 14,
          }}>
            FAQ
          </p>
          <h2 style={{
            fontSize: "clamp(28px, 4.5vw, 52px)",
            fontWeight: 700, fontFamily: "var(--font-space-grotesk)",
            letterSpacing: "-0.03em", lineHeight: 1.08,
          }}>
            Questions, answered.
          </h2>
        </motion.div>

        {/* Accordion */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <motion.div
                key={f.q}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-20px" }}
                transition={{ delay: i * 0.06, duration: 0.4, ease: EASE }}
                style={{
                  background: "#0E0E18",
                  border: `1px solid ${isOpen ? "rgba(255,82,0,0.25)" : "rgba(255,255,255,0.07)"}`,
                  borderRadius: 14,
                  overflow: "hidden",
                  transition: "border-color 0.2s ease",
                }}
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  style={{
                    width: "100%",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    gap: 16, padding: "20px 24px",
                    background: "none", border: "none", cursor: "pointer",
                    color: "#fff", fontFamily: "var(--font-outfit)",
                    fontSize: 15, fontWeight: 500, textAlign: "left",
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
                        fontSize: 14, color: "rgba(255,255,255,0.55)",
                        lineHeight: 1.75, fontFamily: "var(--font-outfit)",
                      }}>
                        {f.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
