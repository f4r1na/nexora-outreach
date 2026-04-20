"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, ChevronDown, X, Sparkles } from "lucide-react";

type Status = { gmailConnected: boolean; hasCampaign: boolean; hasSent: boolean };

const DISMISS_KEY = "nx_onboarding_dismissed";

export default function OnboardingChecklist() {
  const [status, setStatus] = useState<Status | null>(null);
  const [expanded, setExpanded] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const [celebrating, setCelebrating] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(DISMISS_KEY) === "1") { setDismissed(true); return; }

    let mounted = true;
    const load = async () => {
      try {
        const res = await fetch("/api/onboarding/status");
        if (!res.ok) return;
        const data = (await res.json()) as Status;
        if (mounted) setStatus(data);
      } catch {}
    };
    load();
    const id = window.setInterval(load, 15_000);
    return () => { mounted = false; window.clearInterval(id); };
  }, []);

  useEffect(() => {
    if (!status) return;
    const done = status.gmailConnected && status.hasCampaign && status.hasSent;
    if (done && !celebrating) {
      setCelebrating(true);
      const t = window.setTimeout(() => {
        localStorage.setItem(DISMISS_KEY, "1");
        setDismissed(true);
      }, 3000);
      return () => window.clearTimeout(t);
    }
  }, [status, celebrating]);

  if (dismissed || !status) return null;

  const steps = [
    { label: "Connect Gmail", href: "/dashboard/settings", done: status.gmailConnected },
    { label: "Create your first campaign", href: "/dashboard/campaigns/new", done: status.hasCampaign },
    { label: "Launch your first email", href: "/dashboard/campaigns", done: status.hasSent },
  ];
  const remaining = steps.filter(s => !s.done).length;
  const allDone = remaining === 0;

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  };

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        aria-label="Open onboarding checklist"
        style={{
          position: "fixed", bottom: 22, right: 22, zIndex: 60,
          width: 44, height: 44, borderRadius: "50%",
          border: "1px solid rgba(255,82,0,0.4)",
          backgroundColor: "#FF5200",
          boxShadow: "0 8px 24px rgba(255,82,0,0.35), 0 0 0 4px rgba(255,82,0,0.08)",
          color: "#fff",
          fontSize: 14, fontWeight: 600, fontFamily: "var(--font-space-grotesk)",
          cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          animation: "ob-pulse 2.4s ease-in-out infinite",
        }}
      >
        {remaining}
        <style>{`@keyframes ob-pulse { 0%,100%{box-shadow:0 8px 24px rgba(255,82,0,0.35),0 0 0 4px rgba(255,82,0,0.08)} 50%{box-shadow:0 8px 24px rgba(255,82,0,0.45),0 0 0 8px rgba(255,82,0,0.12)} }`}</style>
      </button>
    );
  }

  return (
    <div
      style={{
        position: "fixed", bottom: 22, right: 22, zIndex: 60,
        width: 280,
        backgroundColor: "rgba(14,14,24,0.88)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(255,82,0,0.18)",
        borderRadius: 14,
        padding: "14px 14px 12px",
        boxShadow: "0 16px 48px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.02) inset",
        animation: "ob-in 200ms cubic-bezier(0.23,1,0.32,1)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 22, height: 22, borderRadius: 6,
            backgroundColor: "rgba(255,82,0,0.12)",
            border: "1px solid rgba(255,82,0,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#FF5200",
          }}>
            <Sparkles size={11} />
          </div>
          <p style={{ fontSize: 12.5, fontWeight: 600, color: "#ddd", fontFamily: "var(--font-space-grotesk)", margin: 0 }}>
            {allDone ? "You're all set!" : "Getting started"}
          </p>
        </div>
        <button
          onClick={() => setExpanded(false)}
          aria-label="Collapse"
          style={{
            width: 22, height: 22, borderRadius: 5,
            border: "1px solid rgba(255,255,255,0.07)",
            backgroundColor: "transparent",
            color: "#555",
            cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <ChevronDown size={11} />
        </button>
      </div>

      {allDone ? (
        <p style={{ fontSize: 11.5, color: "#888", fontFamily: "var(--font-outfit)", lineHeight: 1.5, margin: 0, padding: "4px 2px 8px" }}>
          Everything is connected. This panel will close automatically.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {steps.map((s) => (
            <Link
              key={s.label}
              href={s.href}
              style={{
                display: "flex", alignItems: "center", gap: 9,
                padding: "8px 9px",
                borderRadius: 7,
                backgroundColor: "rgba(255,255,255,0.018)",
                border: "1px solid rgba(255,255,255,0.04)",
                textDecoration: "none",
                transition: "background-color 150ms",
              }}
            >
              <div style={{
                width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                backgroundColor: s.done ? "rgba(74,222,128,0.12)" : "transparent",
                border: `1px solid ${s.done ? "rgba(74,222,128,0.5)" : "rgba(255,82,0,0.35)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: s.done ? "#4ade80" : "#FF5200",
              }}>
                {s.done && <Check size={10} strokeWidth={3} />}
              </div>
              <span style={{
                fontSize: 11.5,
                color: s.done ? "#555" : "#c8c8c8",
                fontFamily: "var(--font-outfit)",
                textDecoration: s.done ? "line-through" : "none",
                lineHeight: 1.3,
              }}>
                {s.label}
              </span>
            </Link>
          ))}
        </div>
      )}

      <button
        onClick={dismiss}
        style={{
          display: "flex", alignItems: "center", gap: 4,
          marginTop: 10, marginLeft: "auto",
          fontSize: 10, color: "#444",
          backgroundColor: "transparent", border: "none",
          cursor: "pointer", fontFamily: "var(--font-outfit)",
          padding: "2px 4px",
        }}
      >
        <X size={9} />
        Dismiss
      </button>

      <style>{`
        @keyframes ob-in {
          from { opacity: 0; transform: translateY(8px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
