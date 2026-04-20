"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, Rocket, Mail, Check, X } from "lucide-react";

const KEY = "nexora.onboarding.v1";
const EASE = [0.4, 0, 0.2, 1] as const;

type State = { profile: boolean; campaign: boolean; gmail: boolean; dismissed: boolean };

const DEFAULT: State = { profile: false, campaign: false, gmail: false, dismissed: false };

export default function WelcomeCard({
  hasCompanyProfile,
}: {
  hasCompanyProfile: boolean;
}) {
  const [state, setState] = useState<State | null>(null);

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
          padding: "22px 24px",
          backgroundColor: "rgba(255,82,0,0.04)",
          border: "1px solid rgba(255,82,0,0.22)",
          borderRadius: 16,
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

        <div style={{ marginBottom: 18 }}>
          <p style={{
            fontSize: 11, fontWeight: 500, letterSpacing: "0.1em",
            color: "#F59E0B", textTransform: "uppercase", marginBottom: 8,
          }}>
            Welcome to Nexora
          </p>
          <h3 style={{
            fontSize: 19, fontWeight: 600,
            fontFamily: "var(--font-space-grotesk)",
            letterSpacing: "-0.02em",
            color: "#fff",
          }}>
            Here&apos;s how to get started
          </h3>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {steps.map((s) => {
            const Body = (
              <div
                className="nx-onboard-row"
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "12px 14px",
                  borderRadius: 10,
                  backgroundColor: s.done ? "rgba(74,222,128,0.05)" : "rgba(255,255,255,0.02)",
                  border: `1px solid ${s.done ? "rgba(74,222,128,0.15)" : "rgba(255,255,255,0.06)"}`,
                  transition: "background-color 200ms ease, border-color 200ms ease",
                }}
              >
                <div style={{
                  width: 28, height: 28, borderRadius: 8,
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  backgroundColor: s.done ? "rgba(74,222,128,0.12)" : "rgba(255,82,0,0.1)",
                  border: `1px solid ${s.done ? "rgba(74,222,128,0.28)" : "rgba(255,82,0,0.22)"}`,
                }}>
                  {s.done
                    ? <Check size={14} color="#4ade80" />
                    : <s.Icon size={14} color="#FF5200" />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 13.5, fontWeight: 500,
                    color: s.done ? "rgba(255,255,255,0.55)" : "#fff",
                    fontFamily: "var(--font-outfit)",
                    textDecoration: s.done ? "line-through" : "none",
                  }}>
                    {s.title}
                  </div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>
                    {s.desc}
                  </div>
                </div>
              </div>
            );
            if (s.done) return <div key={s.key}>{Body}</div>;
            if (s.href) {
              return (
                <Link key={s.key} href={s.href} style={{ textDecoration: "none" }}>
                  {Body}
                </Link>
              );
            }
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => save({ ...state, campaign: true })}
                style={{ background: "none", border: "none", padding: 0, textAlign: "left", cursor: "pointer", width: "100%" }}
              >
                {Body}
              </button>
            );
          })}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
