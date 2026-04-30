"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Zap, Github, Target, Files } from "lucide-react";

const EASE = [0.23, 1, 0.32, 1] as const;

type BadgeType = "BETA" | "ACTIVE";

interface Feature {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; color?: string }>;
  title: string;
  badge: BadgeType;
  badgeColor: string;
  badgeBg: string;
  description: string;
  highlights: string[];
  href: string;
}

const FEATURES: Feature[] = [
  {
    icon: Zap,
    title: "Signal Velocity Alerts",
    badge: "BETA",
    badgeColor: "#FF5200",
    badgeBg: "rgba(255,82,0,0.15)",
    description: "Real-time alerts when signals match your ICP. Get notified instantly on hot opportunities and auto-create campaigns.",
    highlights: ["Real-time monitoring", "ICP-based filtering", "Email notifications", "Auto-campaign creation"],
    href: "/dashboard/features/signal-velocity",
  },
  {
    icon: Github,
    title: "GitHub Signal Detection",
    badge: "ACTIVE",
    badgeColor: "#00D084",
    badgeBg: "rgba(0,208,132,0.15)",
    description: "Monitor your target companies' public GitHub repos for technology stack changes and dependency upgrades.",
    highlights: ["Repo monitoring", "Tech stack tracking", "Dependency updates", "Commit-level details"],
    href: "/dashboard/features/github-detection",
  },
  {
    icon: Target,
    title: "Confidence Classifier",
    badge: "ACTIVE",
    badgeColor: "#00D084",
    badgeBg: "rgba(0,208,132,0.15)",
    description: "AI-powered signal quality scoring. Know exactly which signals are most likely to convert based on signal type and age.",
    highlights: ["Signal type scoring", "Age-based decay", "Conversion predictions", "Custom thresholds"],
    href: "/dashboard/features/confidence-classifier",
  },
  {
    icon: Files,
    title: "Email Template Variations",
    badge: "ACTIVE",
    badgeColor: "#00D084",
    badgeBg: "rgba(0,208,132,0.15)",
    description: "Generate and A/B test multiple email versions with different tones. Optimize your reply rate with data-driven tone selection.",
    highlights: ["Multi-tone generation", "A/B testing", "Tone variations", "Reply rate tracking"],
    href: "/dashboard/features/template-variations",
  },
  {
    icon: Zap,
    title: "Nexora Signal Score",
    badge: "ACTIVE",
    badgeColor: "#00D084",
    badgeBg: "rgba(0,208,132,0.15)",
    description: "Proprietary algorithm that learns which signals convert best for your founder type. SaaS, Agency, or Investor-optimized scoring.",
    highlights: ["Founder-type learning", "Conversion optimization", "Dynamic weighting", "Top signal ranking"],
    href: "/dashboard/features/signal-score",
  },
];

function FeatureCard({ icon: Icon, title, badge, badgeColor, badgeBg, description, highlights, href, index }: Feature & { index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.3, ease: EASE }}
      whileHover={{ scale: 1.02, boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}
      style={{
        backgroundColor: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 8,
        padding: 20,
        display: "flex",
        flexDirection: "column",
        gap: 16,
        cursor: "default",
        transition: "border-color 0.2s ease",
      }}
    >
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 10, flexShrink: 0,
          backgroundColor: "rgba(255,82,0,0.1)",
          border: "1px solid rgba(255,82,0,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon size={24} color="#FF5200" strokeWidth={1.75} />
        </div>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, paddingTop: 4 }}>
          <h3 style={{
            fontSize: 16, fontWeight: 700, color: "#fff",
            fontFamily: "var(--font-syne)", margin: 0, lineHeight: 1.25,
          }}>
            {title}
          </h3>
          <span style={{
            fontSize: 10, fontWeight: 600, letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: badgeColor,
            backgroundColor: badgeBg,
            border: `1px solid ${badgeColor}30`,
            borderRadius: 4,
            padding: "3px 8px",
            fontFamily: "var(--font-outfit)",
            flexShrink: 0,
            whiteSpace: "nowrap",
          }}>
            {badge}
          </span>
        </div>
      </div>

      {/* Description */}
      <p style={{
        fontSize: 13,
        color: "rgba(255,255,255,0.7)",
        fontFamily: "var(--font-outfit)",
        lineHeight: 1.65,
        margin: 0,
      }}>
        {description}
      </p>

      {/* Highlights */}
      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 7 }}>
        {highlights.map((item) => (
          <li key={item} style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <span style={{
              width: 4, height: 4, borderRadius: "50%",
              backgroundColor: "#FF5200", flexShrink: 0,
            }} />
            <span style={{
              fontSize: 13,
              color: "rgba(255,255,255,0.6)",
              fontFamily: "var(--font-outfit)",
            }}>
              {item}
            </span>
          </li>
        ))}
      </ul>

      {/* Configure button */}
      <div style={{ marginTop: "auto", paddingTop: 4 }}>
        <Link
          href={href}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 100,
            padding: "8px 0",
            borderRadius: 6,
            fontSize: 12, fontWeight: 500,
            fontFamily: "var(--font-outfit)",
            color: "#fff",
            backgroundColor: "#FF5200",
            textDecoration: "none",
            transition: "filter 0.15s ease",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.filter = "brightness(1.1)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.filter = "none"; }}
        >
          Configure
        </Link>
      </div>
    </motion.div>
  );
}

export default function FeaturesPage() {
  return (
    <div style={{ padding: "40px 32px 80px", maxWidth: 1200, margin: "0 auto" }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: EASE }}
        style={{ marginBottom: 40 }}
      >
        <h1 style={{
          fontSize: 26, fontWeight: 700, color: "#fff",
          fontFamily: "var(--font-syne)", letterSpacing: "-0.02em",
          margin: "0 0 8px",
        }}>
          Advanced Features
        </h1>
        <p style={{
          fontSize: 14,
          color: "rgba(255,255,255,0.5)",
          fontFamily: "var(--font-outfit)",
          margin: 0,
        }}>
          Unlock powerful capabilities for your cold email campaigns
        </p>
      </motion.div>

      {/* Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
        gap: 24,
      }}>
        {FEATURES.map((feature, i) => (
          <FeatureCard key={feature.href} {...feature} index={i} />
        ))}
      </div>
    </div>
  );
}
