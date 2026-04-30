"use client";

import { motion } from "framer-motion";

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

interface SectionHeaderProps {
  title: string;
  description?: string;
  divider?: boolean;
}

export default function SectionHeader({ title, description, divider = false }: SectionHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: EASE_OUT }}
      style={{ marginBottom: 24 }}
    >
      <h2 style={{
        fontSize: 18,
        fontWeight: 700,
        color: "#fff",
        fontFamily: "var(--font-syne)",
        margin: 0,
        lineHeight: 1.3,
        letterSpacing: "-0.02em",
      }}>
        {title}
      </h2>
      {description && (
        <p style={{
          fontSize: 13,
          color: "rgba(255,255,255,0.4)",
          fontFamily: "var(--font-outfit)",
          margin: "6px 0 0",
          lineHeight: 1.55,
        }}>
          {description}
        </p>
      )}
      {divider && (
        <div style={{
          height: 1,
          backgroundColor: "rgba(255,255,255,0.1)",
          marginTop: 16,
        }} />
      )}
    </motion.div>
  );
}
