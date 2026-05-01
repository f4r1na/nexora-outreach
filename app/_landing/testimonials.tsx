"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const EASE = [0.23, 1, 0.32, 1] as const;

const TESTIMONIALS = [
  {
    quote:
      "We went from 2% reply rates to 11% in six weeks. The signal detection is uncanny — Nexora caught a hiring spike at one of our target accounts the day it was posted and we had a reply within 48 hours.",
    name: "Marcus Chen",
    title: "Founder & CEO",
    company: "Stackline AI",
    location: "San Francisco, CA",
    avatar: "MC",
    avatarColor: "#FF5200",
  },
  {
    quote:
      "I was skeptical about AI cold email tools but Nexora is genuinely different. The emails don't read like templates. My prospects reply saying they're impressed I did my research — I didn't, the AI did.",
    name: "Priya Nair",
    title: "Head of Growth",
    company: "Forma Labs",
    location: "London, UK",
    avatar: "PN",
    avatarColor: "#F59E0B",
  },
  {
    quote:
      "Replaced three SDRs with Nexora at a fraction of the cost. We now book 40+ qualified demos a month and the pipeline quality is better because every outreach is signal-triggered. This is the future.",
    name: "Jake Holloway",
    title: "VP Sales",
    company: "Relay.io",
    location: "Austin, TX",
    avatar: "JH",
    avatarColor: "#00D084",
  },
];

function Stars() {
  return (
    <div style={{ display: "flex", gap: 3, marginBottom: 20 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} style={{ color: "#F59E0B", fontSize: 16 }}>★</span>
      ))}
    </div>
  );
}

export default function Testimonials() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (paused) return;
    timerRef.current = setInterval(() => {
      setActive((a) => (a + 1) % TESTIMONIALS.length);
    }, 5000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [paused]);

  return (
    <section
      id="testimonials"
      style={{
        padding: "clamp(80px, 10vw, 128px) clamp(20px, 4vw, 56px)",
        position: "relative",
        zIndex: 1,
        borderTop: "1px solid rgba(255,255,255,0.05)",
      }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
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
            Social proof
          </p>
          <h2 style={{
            fontSize: "clamp(28px, 4.5vw, 52px)",
            fontWeight: 700, fontFamily: "var(--font-space-grotesk)",
            letterSpacing: "-0.03em", lineHeight: 1.08,
            maxWidth: 560, margin: "0 auto",
          }}>
            Founders who closed more deals
          </h2>
        </motion.div>

        {/* Carousel */}
        <div style={{ position: "relative", maxWidth: 760, margin: "0 auto" }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              transition={{ duration: 0.35, ease: EASE }}
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.09)",
                borderRadius: 24,
                padding: "clamp(28px, 4vw, 48px)",
              }}
            >
              <Stars />
              <p style={{
                fontSize: "clamp(16px, 2vw, 20px)",
                color: "rgba(255,255,255,0.8)",
                lineHeight: 1.7,
                fontStyle: "italic",
                marginBottom: 32,
                fontFamily: "var(--font-outfit)",
              }}>
                &ldquo;{TESTIMONIALS[active].quote}&rdquo;
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: "50%",
                  background: `rgba(${
                    TESTIMONIALS[active].avatarColor === "#FF5200" ? "255,82,0" :
                    TESTIMONIALS[active].avatarColor === "#F59E0B" ? "245,158,11" :
                    "0,208,132"
                  },0.2)`,
                  border: `1px solid ${TESTIMONIALS[active].avatarColor}33`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 700, color: TESTIMONIALS[active].avatarColor,
                  flexShrink: 0,
                  fontFamily: "var(--font-space-grotesk)",
                }}>
                  {TESTIMONIALS[active].avatar}
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", fontFamily: "var(--font-space-grotesk)" }}>
                    {TESTIMONIALS[active].name}
                  </div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 1 }}>
                    {TESTIMONIALS[active].title} · {TESTIMONIALS[active].company} · {TESTIMONIALS[active].location}
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Nav dots */}
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 24 }}>
            {TESTIMONIALS.map((_, i) => (
              <button
                key={i}
                onClick={() => { setActive(i); setPaused(true); }}
                aria-label={`Go to testimonial ${i + 1}`}
                style={{
                  width: i === active ? 24 : 8,
                  height: 8, borderRadius: 4,
                  background: i === active ? "#FF5200" : "rgba(255,255,255,0.2)",
                  border: "none", cursor: "pointer", padding: 0,
                  transition: "width 0.25s ease, background 0.2s ease",
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
