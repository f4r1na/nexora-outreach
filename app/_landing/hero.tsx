"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Users, Zap, DollarSign, Clock } from "lucide-react";

const EASE = [0.23, 1, 0.32, 1] as const;

function fadeUp(delay: number) {
  return {
    initial: { opacity: 0, y: 22 },
    animate: { opacity: 1, y: 0 },
    transition: { delay, duration: 0.55, ease: EASE },
  };
}

const TRUST_SIGNALS = [
  { icon: Users,     label: "5,000+",   sub: "founders" },
  { icon: Zap,       label: "87%",      sub: "reply rate" },
  { icon: DollarSign,label: "$0",       sub: "to start" },
  { icon: Clock,     label: "2 min",    sub: "setup" },
];

export default function Hero() {
  const [email, setEmail] = useState("");
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const encoded = encodeURIComponent(email.trim());
    router.push(encoded ? `/signup?email=${encoded}` : "/signup");
  }

  return (
    <section
      id="hero"
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "clamp(100px, 15vw, 160px) clamp(20px, 4vw, 56px) clamp(80px, 10vw, 120px)",
        position: "relative",
        zIndex: 1,
      }}
    >
      {/* Badge */}
      <motion.div {...fadeUp(0.05)}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "6px 14px", borderRadius: 999,
          background: "rgba(255,82,0,0.1)",
          border: "1px solid rgba(255,82,0,0.25)",
          marginBottom: 28,
        }}>
          <span style={{ fontSize: 11, color: "#FF5200", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>
            New
          </span>
          <span style={{ width: 1, height: 12, background: "rgba(255,82,0,0.3)" }} />
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
            Signal Velocity Alerts now in beta
          </span>
          <ArrowRight size={12} color="rgba(255,255,255,0.4)" />
        </div>
      </motion.div>

      {/* Headline */}
      <motion.h1
        {...fadeUp(0.12)}
        style={{
          fontSize: "clamp(40px, 7vw, 88px)",
          fontWeight: 700,
          fontFamily: "var(--font-space-grotesk)",
          letterSpacing: "-0.035em",
          lineHeight: 1.04,
          maxWidth: 900,
          margin: "0 auto 24px",
        }}
      >
        Cold outreach{" "}
        <em
          className="headline-gradient"
          style={{ fontStyle: "italic", display: "inline-block" }}
        >
          that actually works
        </em>
      </motion.h1>

      {/* Subheadline */}
      <motion.p
        {...fadeUp(0.2)}
        style={{
          fontSize: "clamp(16px, 2.2vw, 20px)",
          color: "rgba(255,255,255,0.5)",
          fontFamily: "var(--font-outfit)",
          lineHeight: 1.65,
          maxWidth: 580,
          margin: "0 auto 44px",
        }}
      >
        Nexora detects buying signals in real-time, writes hyper-personalized emails using AI, and
        automates follow-ups — so you spend time closing, not crafting.
      </motion.p>

      {/* CTA form */}
      <motion.form
        {...fadeUp(0.28)}
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          justifyContent: "center",
          marginBottom: 52,
          width: "100%",
          maxWidth: 480,
          margin: "0 auto 52px",
        }}
      >
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your work email"
          aria-label="Email address"
          style={{
            flex: 1,
            minWidth: 220,
            padding: "13px 18px",
            borderRadius: 10,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.12)",
            color: "#fff",
            fontSize: 15,
            fontFamily: "var(--font-outfit)",
            outline: "none",
            transition: "border-color 0.15s",
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(255,82,0,0.5)"; }}
          onBlur={(e)  => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; }}
        />
        <button
          type="submit"
          className="landing-btn-primary"
          style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "13px 24px", borderRadius: 10,
            background: "#FF5200", color: "#fff",
            fontSize: 15, fontWeight: 600,
            fontFamily: "var(--font-outfit)",
            border: "none", cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          Try it free
          <ArrowRight size={15} />
        </button>
      </motion.form>

      {/* Trust signals */}
      <motion.div
        {...fadeUp(0.36)}
        style={{
          display: "flex",
          gap: "clamp(20px, 4vw, 48px)",
          flexWrap: "wrap",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {TRUST_SIGNALS.map(({ icon: Icon, label, sub }) => (
          <div
            key={label}
            style={{ display: "flex", alignItems: "center", gap: 10 }}
          >
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: "rgba(255,82,0,0.1)",
              border: "1px solid rgba(255,82,0,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <Icon size={14} color="#FF5200" />
            </div>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: "#fff", fontFamily: "var(--font-space-grotesk)", letterSpacing: "-0.02em" }}>
                {label}
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: -1 }}>
                {sub}
              </div>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Bottom fade-out */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: 160,
          background: "linear-gradient(to bottom, transparent, #080810)",
          pointerEvents: "none",
        }}
      />
    </section>
  );
}
