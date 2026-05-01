"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Calendar } from "lucide-react";

const EASE = [0.23, 1, 0.32, 1] as const;

export default function CTABanner() {
  return (
    <section
      style={{
        padding: "clamp(64px, 8vw, 100px) clamp(20px, 4vw, 56px)",
        position: "relative",
        zIndex: 1,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.55, ease: EASE }}
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          borderRadius: 28,
          padding: "clamp(48px, 6vw, 80px) clamp(28px, 5vw, 80px)",
          background: "linear-gradient(135deg, #FF5200 0%, #cc3d00 50%, #991f00 100%)",
          position: "relative",
          overflow: "hidden",
          textAlign: "center",
        }}
      >
        {/* Noise texture overlay */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute", inset: 0,
            backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
            opacity: 0.06,
            mixBlendMode: "overlay",
            pointerEvents: "none",
          }}
        />

        {/* Orb decorations */}
        <div aria-hidden="true" style={{
          position: "absolute", top: "-30%", right: "-5%",
          width: "40%", paddingBottom: "40%", borderRadius: "50%",
          background: "rgba(255,255,255,0.08)",
          filter: "blur(40px)",
          pointerEvents: "none",
        }} />
        <div aria-hidden="true" style={{
          position: "absolute", bottom: "-40%", left: "-5%",
          width: "35%", paddingBottom: "35%", borderRadius: "50%",
          background: "rgba(255,255,255,0.06)",
          filter: "blur(50px)",
          pointerEvents: "none",
        }} />

        <div style={{ position: "relative", zIndex: 1 }}>
          <h2 style={{
            fontSize: "clamp(28px, 5vw, 60px)",
            fontWeight: 800,
            fontFamily: "var(--font-space-grotesk)",
            letterSpacing: "-0.035em",
            lineHeight: 1.06,
            color: "#fff",
            maxWidth: 640,
            margin: "0 auto 16px",
          }}>
            Ready to transform your cold email?
          </h2>
          <p style={{
            fontSize: "clamp(15px, 1.8vw, 18px)",
            color: "rgba(255,255,255,0.75)",
            lineHeight: 1.6,
            maxWidth: 440,
            margin: "0 auto 40px",
          }}>
            Join 5,000+ founders sending signal-triggered outreach that actually gets replies.
          </p>

          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link
              href="/signup"
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "14px 28px", borderRadius: 12,
                background: "#fff", color: "#FF5200",
                fontSize: 15, fontWeight: 700,
                textDecoration: "none",
                transition: "transform 0.15s ease, box-shadow 0.15s ease",
                fontFamily: "var(--font-outfit)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.05)";
                e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.25)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              Try it free
              <ArrowRight size={15} />
            </Link>

            <Link
              href="/contact"
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "14px 28px", borderRadius: 12,
                background: "rgba(255,255,255,0.12)",
                border: "1px solid rgba(255,255,255,0.25)",
                color: "#fff",
                fontSize: 15, fontWeight: 600,
                textDecoration: "none",
                transition: "transform 0.15s ease, background 0.15s ease",
                fontFamily: "var(--font-outfit)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.05)";
                e.currentTarget.style.background = "rgba(255,255,255,0.18)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.background = "rgba(255,255,255,0.12)";
              }}
            >
              <Calendar size={15} />
              Schedule demo
            </Link>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
