"use client";

import { motion } from "framer-motion";
import { Search, Sparkles, Send } from "lucide-react";

const EASE = [0.23, 1, 0.32, 1] as const;

const STEPS = [
  {
    step: "01",
    icon: Search,
    title: "Research & Signals",
    description:
      "Nexora monitors hiring activity, funding rounds, GitHub pushes, and product launches in real-time to surface companies with active buying intent.",
    color: "#FF5200",
  },
  {
    step: "02",
    icon: Sparkles,
    title: "Write & Personalize",
    description:
      "Our AI drafts hyper-personalized emails using each company's specific signal context — not generic templates. Every email reads like you spent an hour researching.",
    color: "#F59E0B",
  },
  {
    step: "03",
    icon: Send,
    title: "Send & Track",
    description:
      "Emails go out automatically via your Gmail. Follow-ups are scheduled intelligently. You see opens, clicks, and replies in a clean dashboard.",
    color: "#00D084",
  },
];

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      style={{
        padding: "clamp(80px, 10vw, 128px) clamp(20px, 4vw, 56px)",
        position: "relative",
        zIndex: 1,
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Section label + heading */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, ease: EASE }}
          style={{ textAlign: "center", marginBottom: "clamp(48px, 7vw, 80px)" }}
        >
          <p style={{
            fontSize: 11, fontWeight: 600, letterSpacing: "0.1em",
            color: "#FF5200", textTransform: "uppercase", marginBottom: 14,
          }}>
            How it works
          </p>
          <h2 style={{
            fontSize: "clamp(28px, 4.5vw, 52px)",
            fontWeight: 700, fontFamily: "var(--font-space-grotesk)",
            letterSpacing: "-0.03em", lineHeight: 1.08,
            maxWidth: 640, margin: "0 auto 16px",
          }}>
            From signal to signed deal in minutes
          </h2>
          <p style={{
            fontSize: "clamp(14px, 1.8vw, 17px)",
            color: "rgba(255,255,255,0.45)",
            lineHeight: 1.65, maxWidth: 480, margin: "0 auto",
          }}>
            Three steps. Fully automated. You stay focused on conversations that matter.
          </p>
        </motion.div>

        {/* Steps */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 24,
          position: "relative",
        }}>
          {STEPS.map(({ step, icon: Icon, title, description, color }, i) => (
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: i * 0.12, duration: 0.5, ease: EASE }}
              className="landing-card"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 20,
                padding: "clamp(24px, 3vw, 36px)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Step number watermark */}
              <div
                aria-hidden="true"
                style={{
                  position: "absolute", top: -8, right: 16,
                  fontSize: 80, fontWeight: 800, fontFamily: "var(--font-space-grotesk)",
                  color: "rgba(255,255,255,0.03)",
                  letterSpacing: "-0.05em",
                  lineHeight: 1,
                  userSelect: "none",
                }}
              >
                {step}
              </div>

              {/* Icon */}
              <div style={{
                width: 52, height: 52, borderRadius: 14,
                background: `rgba(${color === "#FF5200" ? "255,82,0" : color === "#F59E0B" ? "245,158,11" : "0,208,132"},0.12)`,
                border: `1px solid rgba(${color === "#FF5200" ? "255,82,0" : color === "#F59E0B" ? "245,158,11" : "0,208,132"},0.25)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: 24,
              }}>
                <Icon size={22} color={color} />
              </div>

              {/* Step label */}
              <div style={{
                fontSize: 11, fontWeight: 700, letterSpacing: "0.08em",
                color: color, textTransform: "uppercase", marginBottom: 10,
              }}>
                Step {step}
              </div>

              <h3 style={{
                fontSize: "clamp(18px, 2vw, 22px)",
                fontWeight: 700, fontFamily: "var(--font-space-grotesk)",
                letterSpacing: "-0.02em", color: "#fff", marginBottom: 12,
              }}>
                {title}
              </h3>
              <p style={{
                fontSize: 14, color: "rgba(255,255,255,0.5)",
                lineHeight: 1.7,
              }}>
                {description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
