"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

const EASE = [0.23, 1, 0.32, 1] as const;

const PLANS = [
  {
    name: "Starter",
    price: "$19",
    period: "/ month",
    tagline: "Perfect for solo founders.",
    badge: null,
    highlight: false,
    features: [
      "300 emails / month",
      "5 signal types monitored",
      "AI email generation",
      "Gmail integration",
      "Basic analytics",
      "Email support",
    ],
    cta: "Get Started",
    href: "/signup?plan=starter",
  },
  {
    name: "Pro",
    price: "$69",
    period: "/ month",
    tagline: "For growing sales teams.",
    badge: "Most Popular",
    highlight: true,
    features: [
      "1,000 emails / month",
      "All signal types",
      "A/B template testing",
      "Follow-up automation",
      "Full analytics dashboard",
      "CRM integrations",
      "Priority support",
    ],
    cta: "Start Free Trial",
    href: "/signup?plan=pro",
  },
  {
    name: "Scale",
    price: "Custom",
    period: "",
    tagline: "For high-volume teams.",
    badge: null,
    highlight: false,
    features: [
      "Unlimited emails",
      "Custom signal types",
      "Dedicated AI fine-tuning",
      "White-glove onboarding",
      "SLA & uptime guarantee",
      "API access",
      "Slack support channel",
    ],
    cta: "Contact Sales",
    href: "/contact",
  },
];

export default function PricingSection() {
  return (
    <section
      id="pricing"
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
            Pricing
          </p>
          <h2 style={{
            fontSize: "clamp(28px, 4.5vw, 52px)",
            fontWeight: 700, fontFamily: "var(--font-space-grotesk)",
            letterSpacing: "-0.03em", lineHeight: 1.08,
            maxWidth: 560, margin: "0 auto 16px",
          }}>
            Simple, transparent pricing
          </h2>
          <p style={{
            fontSize: "clamp(14px, 1.8vw, 17px)",
            color: "rgba(255,255,255,0.45)",
            lineHeight: 1.65, maxWidth: 440, margin: "0 auto",
          }}>
            Start free. Upgrade when you need more. Cancel anytime.
          </p>
        </motion.div>

        {/* Cards */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 20,
          alignItems: "start",
        }}>
          {PLANS.map(({ name, price, period, tagline, badge, highlight, features, cta, href }, i) => (
            <motion.div
              key={name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.1, duration: 0.48, ease: EASE }}
              style={{
                background: highlight ? "rgba(255,82,0,0.05)" : "rgba(255,255,255,0.04)",
                border: highlight ? "2px solid #FF5200" : "1px solid rgba(255,255,255,0.08)",
                borderRadius: 20,
                padding: "clamp(24px, 3vw, 36px)",
                position: "relative",
              }}
            >
              {/* Popular badge */}
              {badge && (
                <div style={{
                  position: "absolute", top: -14, left: "50%",
                  transform: "translateX(-50%)",
                  background: "#00D084",
                  color: "#000",
                  fontSize: 11, fontWeight: 700, letterSpacing: "0.06em",
                  padding: "4px 14px", borderRadius: 999,
                  textTransform: "uppercase",
                  whiteSpace: "nowrap",
                }}>
                  {badge}
                </div>
              )}

              {/* Plan name + tagline */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: highlight ? "#FF5200" : "rgba(255,255,255,0.5)", marginBottom: 6 }}>
                  {name}
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 6 }}>
                  <span style={{
                    fontSize: price === "Custom" ? 32 : 42,
                    fontWeight: 800,
                    fontFamily: "var(--font-space-grotesk)",
                    letterSpacing: "-0.04em",
                    color: "#fff",
                  }}>
                    {price}
                  </span>
                  {period && (
                    <span style={{ fontSize: 14, color: "rgba(255,255,255,0.4)" }}>
                      {period}
                    </span>
                  )}
                </div>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>
                  {tagline}
                </p>
              </div>

              {/* Feature list */}
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
                {features.map((feature) => (
                  <li key={feature} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 14, color: "rgba(255,255,255,0.72)" }}>
                    <Check size={15} color="#00D084" style={{ flexShrink: 0, marginTop: 2 }} />
                    {feature}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link
                href={href}
                className={highlight ? "landing-btn-primary" : "landing-btn-ghost"}
                style={{
                  display: "block", textAlign: "center",
                  padding: "12px 20px", borderRadius: 10,
                  fontSize: 14, fontWeight: 700,
                  textDecoration: "none",
                  ...(highlight
                    ? { background: "#FF5200", color: "#fff" }
                    : {
                        background: "transparent",
                        color: "rgba(255,255,255,0.75)",
                        border: "1px solid rgba(255,255,255,0.15)",
                      }),
                }}
              >
                {cta}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
