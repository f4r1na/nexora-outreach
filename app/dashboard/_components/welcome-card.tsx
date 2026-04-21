"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, Rocket, Mail, Check, X } from "lucide-react";

const KEY = "nexora.onboarding.v1";
const EASE = [0.4, 0, 0.2, 1] as const;

type State = { profile: boolean; campaign: boolean; gmail: boolean; dismissed: boolean };
const DEFAULT: State = { profile: false, campaign: false, gmail: false, dismissed: false };

export default function WelcomeCard({ hasCompanyProfile }: { hasCompanyProfile: boolean }) {
  const [state, setState] = useState<State | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      const parsed: State = raw ? { ...DEFAULT, ...JSON.parse(raw) } : DEFAULT;
      if (hasCompanyProfile) parsed.profile = true;
      setState(parsed);
    } catch {
      setState(DEFAULT);
    }
  }, [hasCompanyProfile]);

  const save = (next: State) => {
    setState(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* noop */ }
  };

  if (!state) return null;
  const allDone = state.profile && state.campaign && state.gmail;
  if (state.dismissed || allDone) return null;

  const steps = [
    {
      key: "profile" as const,
      done: state.profile,
      Icon: Building2,
      title: "Set up your company profile",
      desc: "Give Nexora your pitch so emails sound like you.",
      href: "/dashboard/settings",
    },
    {
      key: "campaign" as const,
      done: state.campaign,
      Icon: Rocket,
      title: "Try your first campaign",
      desc: "Use the prompt bar below — one sentence is enough.",
      href: null,
    },
    {
      key: "gmail" as const,
      done: state.gmail,
      Icon: Mail,
      title: "Connect your Gmail",
      desc: "Official OAuth — we never see your password.",
      href: "/dashboard/settings",
    },
  ];

  const renderCard = (s: typeof steps[number]) => {
    const isHovered = hovered === s.key && !s.done;
    return (
      <div
        onMouseEnter={() => !s.done && setHovered(s.key)}
        onMouseLeave={() => setHovered(null)}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          padding: "20px 16px 18px",
          borderRadius: 12,
          width: "100%",
          backgroundColor: s.done
            ? "rgba(74,222,128,0.04)"
            : isHovered
              ? "rgba(255,82,0,0.08)"
              : "rgba(255,255,255,0.02)",
          border: `1px solid ${s.done ? "rgba(74,222,128,0.12)" : "rgba(255,255,255,0.04)"}`,
          boxShadow: isHovered ? "0 0 28px rgba(255,82,0,0.08)" : "none",
          transition: "background-color 200ms ease, box-shadow 200ms ease",
        }}
      >
        <div style={{
          width: 36, height: 36, borderRadius: 10, marginBottom: 12,
          display: "flex", alignItems: "center", justifyContent: "center",
          backgroundColor: s.done ? "rgba(74,222,128,0.10)" : "rgba(255,82,0,0.08)",
          border: `1px solid ${s.done ? "rgba(74,222,128,0.20)" : "rgba(255,82,0,0.16)"}`,
          flexShrink: 0,
        }}>
          {s.done ? <Check size={15} color="#4ade80" /> : <s.Icon size={15} color="#FF5200" />}
        </div>
        <div style={{
          fontSize: 13, fontWeight: 500, lineHeight: 1.35,
          color: s.done ? "rgba(255,255,255,0.45)" : "#fff",
          fontFamily: "var(--font-outfit)",
          textDecoration: s.done ? "line-through" : "none",
          marginBottom: 6,
        }}>
          {s.title}
        </div>
        <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.38)", lineHeight: 1.5 }}>
          {s.desc}
        </div>
      </div>
    );
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12, height: 0, marginBottom: 0 }}
        transition={{ duration: 0.4, ease: EASE }}
        style={{
          maxWidth: 820,
          margin: "0 auto 24px",
          padding: "24px 22px 20px",
          backgroundColor: "rgba(255,82,0,0.03)",
          border: "1px solid rgba(255,82,0,0.16)",
          borderRadius: 18,
          position: "relative",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
        <button
          type="button"
          onClick={() => save({ ...state, dismissed: true })}
          aria-label="Dismiss"
          className="nx-press"
          style={{
            position: "absolute", top: 14, right: 14,
            width: 26, height: 26, borderRadius: 6,
            background: "none", border: "none", cursor: "pointer",
            color: "rgba(255,255,255,0.35)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <X size={14} />
        </button>

        <div style={{ marginBottom: 20, textAlign: "center" }}>
          <p style={{
            fontSize: 10, fontWeight: 500, letterSpacing: "0.12em",
            color: "#F59E0B", textTransform: "uppercase", marginBottom: 7,
          }}>
            Welcome to Nexora
          </p>
          <h3 style={{
            fontSize: 17, fontWeight: 600,
            fontFamily: "var(--font-space-grotesk)",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            color: "#fff",
            margin: 0,
          }}>
            Here&apos;s how to get started
          </h3>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          {steps.map((s) => {
            if (s.done) {
              return <div key={s.key} style={{ flex: 1 }}>{renderCard(s)}</div>;
            }
            if (s.href) {
              return (
                <Link key={s.key} href={s.href} style={{ flex: 1, textDecoration: "none" }}>
                  {renderCard(s)}
                </Link>
              );
            }
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => save({ ...state, campaign: true })}
                style={{ flex: 1, background: "none", border: "none", padding: 0, cursor: "pointer" }}
              >
                {renderCard(s)}
              </button>
            );
          })}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
