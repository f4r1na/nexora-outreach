"use client";

import { motion } from "framer-motion";
import { Zap, Brain, RefreshCw, BarChart2, Shield, Code } from "lucide-react";

const EASE = [0.23, 1, 0.32, 1] as const;

const FEATURES = [
  {
    icon: Zap,
    title: "Signal Detection",
    description:
      "Real-time monitoring of 50+ signal types — hiring, funding, GitHub activity, product launches, job changes, and news mentions.",
  },
  {
    icon: Brain,
    title: "AI Email Generation",
    description:
      "GPT-4-powered emails that reference specific signals. Each email reads like it was hand-crafted, not templated. No hallucinations.",
  },
  {
    icon: RefreshCw,
    title: "Follow-Up Automation",
    description:
      "Intelligent follow-up sequences that stop when someone replies. Timing, tone, and cadence are all optimized automatically.",
  },
  {
    icon: BarChart2,
    title: "Analytics Dashboard",
    description:
      "Track open rates, reply rates, and conversion by signal type. Know exactly what's working and double down on it.",
  },
  {
    icon: Shield,
    title: "Compliance Built-In",
    description:
      "CAN-SPAM, GDPR, and CASL compliant out of the box. Automatic unsubscribe handling and suppression lists included.",
  },
  {
    icon: Code,
    title: "API Access",
    description:
      "Programmatic access to signals, campaigns, and analytics. Integrate Nexora into your existing stack in minutes.",
  },
];

export default function FeaturesSection() {
  return (
    <section
      id="features"
      style={{
        padding: "clamp(80px, 10vw, 128px) clamp(20px, 4vw, 56px)",
        position: "relative",
        zIndex: 1,
        borderTop: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, ease: EASE }}
          style={{ textAlign: "center", marginBottom: "clamp(48px, 7vw, 72px)" }}
        >
          <p style={{
            fontSize: 11, fontWeight: 600, letterSpacing: "0.1em",
            color: "#FF5200", textTransform: "uppercase", marginBottom: 14,
          }}>
            Features
          </p>
          <h2 style={{
            fontSize: "clamp(28px, 4.5vw, 52px)",
            fontWeight: 700, fontFamily: "var(--font-space-grotesk)",
            letterSpacing: "-0.03em", lineHeight: 1.08,
            maxWidth: 600, margin: "0 auto 16px",
          }}>
            Everything you need to close more deals
          </h2>
          <p style={{
            fontSize: "clamp(14px, 1.8vw, 17px)",
            color: "rgba(255,255,255,0.45)",
            lineHeight: 1.65, maxWidth: 480, margin: "0 auto",
          }}>
            One platform. Signals, emails, follow-ups, and analytics — all connected.
          </p>
        </motion.div>

        {/* 2×3 grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: 16,
        }}>
          {FEATURES.map(({ icon: Icon, title, description }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.08, duration: 0.45, ease: EASE }}
              className="landing-card"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 18,
                padding: "clamp(20px, 2.5vw, 30px)",
              }}
            >
              <div style={{
                width: 46, height: 46, borderRadius: 12,
                background: "rgba(255,82,0,0.1)",
                border: "1px solid rgba(255,82,0,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: 20,
              }}>
                <Icon size={20} color="#FF5200" />
              </div>
              <h3 style={{
                fontSize: 18, fontWeight: 700,
                fontFamily: "var(--font-space-grotesk)",
                letterSpacing: "-0.02em",
                color: "#fff", marginBottom: 10,
              }}>
                {title}
              </h3>
              <p style={{
                fontSize: 14, color: "rgba(255,255,255,0.48)",
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
