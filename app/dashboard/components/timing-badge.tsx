"use client";

import { useState } from "react";
import { Clock, Minus } from "lucide-react";

type SignalEntry = { type: string; text: string; date: string; strength: string };
type SignalData = { signals?: SignalEntry[]; last_updated?: string };

type TimingResult = {
  status: "urgent" | "soon" | "none";
  label: string;
  detail: string;
  color: string;
};

const URGENCY_DAYS: Record<string, number> = {
  job_change: 3,
  hiring: 2,
  funding: 7,
  tech_change: 14,
  post_activity: 3,
};

function parseRelativeDays(dateStr: string): number {
  const lower = (dateStr ?? "").toLowerCase();
  const match = lower.match(/(\d+)\s*(day|week|month)/);
  if (!match) return 0;
  const num = parseInt(match[1]);
  const unit = match[2];
  if (unit === "day") return num;
  if (unit === "week") return num * 7;
  if (unit === "month") return num * 30;
  return 0;
}

function computeTiming(signalData: SignalData | null | undefined): TimingResult {
  if (!signalData?.signals?.length) {
    return { status: "none", label: "No urgent signals", detail: "No time-sensitive triggers detected.", color: "#484848" };
  }

  let bestSignal: SignalEntry | null = null;
  let bestDaysLeft = Infinity;
  let bestType = "";

  for (const sig of signalData.signals) {
    const type = sig.type in URGENCY_DAYS ? sig.type : "post_activity";
    const urgencyDays = URGENCY_DAYS[type];
    const ageDays = parseRelativeDays(sig.date);
    const daysLeft = urgencyDays - ageDays;
    if (daysLeft > 0 && daysLeft < bestDaysLeft) {
      bestDaysLeft = daysLeft;
      bestSignal = sig;
      bestType = type;
    }
  }

  if (!bestSignal) {
    return { status: "none", label: "No urgent signals", detail: "Signal window has passed.", color: "#484848" };
  }

  const typeLabel = bestType.replace(/_/g, " ");

  if (bestDaysLeft <= 2) {
    return {
      status: "urgent",
      label: `Send now - ${typeLabel} detected ${bestSignal.date}`,
      detail: bestSignal.text,
      color: "#4ade80",
    };
  }

  return {
    status: "soon",
    label: `Send this week - ${typeLabel} signal`,
    detail: bestSignal.text,
    color: "#F59E0B",
  };
}

export default function TimingBadge({ signalData }: { signalData: SignalData | null | undefined }) {
  const [showDetail, setShowDetail] = useState(false);
  const timing = computeTiming(signalData);
  const isClickable = timing.status !== "none";

  return (
    <div>
      <button
        onClick={() => isClickable && setShowDetail(v => !v)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "4px 10px",
          borderRadius: 999,
          border: `1px solid ${timing.color}33`,
          backgroundColor: `${timing.color}10`,
          cursor: isClickable ? "pointer" : "default",
          fontFamily: "var(--font-outfit)",
          transition: "background-color 0.14s",
        }}
      >
        {timing.status === "urgent" && (
          <span style={{
            width: 6, height: 6, borderRadius: "50%",
            backgroundColor: timing.color,
            boxShadow: `0 0 6px ${timing.color}88`,
            animation: "tb-pulse 2s ease-in-out infinite",
            flexShrink: 0,
          }} />
        )}
        {timing.status === "soon" && (
          <Clock size={9} style={{ color: timing.color, flexShrink: 0 }} />
        )}
        {timing.status === "none" && (
          <Minus size={9} style={{ color: timing.color, flexShrink: 0 }} />
        )}
        <span style={{
          fontSize: 10.5,
          color: isClickable ? timing.color : "#444",
        }}>
          {timing.label}
        </span>
      </button>

      {showDetail && isClickable && (
        <div style={{
          marginTop: 8,
          padding: "10px 12px",
          backgroundColor: "rgba(255,255,255,0.02)",
          border: `1px solid ${timing.color}22`,
          borderRadius: 8,
        }}>
          <p style={{
            fontSize: 11.5, color: "#777",
            fontFamily: "var(--font-outfit)", lineHeight: 1.55, margin: 0,
          }}>
            {timing.detail}
          </p>
        </div>
      )}

      <style>{`
        @keyframes tb-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.4); }
        }
      `}</style>
    </div>
  );
}
