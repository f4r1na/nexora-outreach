"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

type Progress = {
  total: number;
  queued: number;
  processing: number;
  done: number;
  failed: number;
};

export default function SignalProgressBanner({
  campaignId,
  initialProgress,
}: {
  campaignId: string;
  initialProgress: Progress;
}) {
  const router = useRouter();
  const [progress, setProgress] = useState<Progress>(initialProgress);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isDone =
    progress.total > 0 &&
    progress.queued === 0 &&
    progress.processing === 0;

  const analyzed = progress.done + progress.failed;
  const pct =
    progress.total > 0 ? Math.round((analyzed / progress.total) * 100) : 0;

  const poll = useCallback(async () => {
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/signals/progress`);
      if (!res.ok) return;
      const data: Progress = await res.json();
      setProgress(data);
      if (data.total > 0 && data.queued === 0 && data.processing === 0) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        router.refresh();
      }
    } catch {}
  }, [campaignId, router]);

  useEffect(() => {
    if (isDone) return;
    intervalRef.current = setInterval(poll, 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isDone, poll]);

  if (progress.total === 0) return null;

  return (
    <div
      style={{
        marginBottom: 20,
        padding: "16px 20px",
        backgroundColor: "#0e0e0e",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 8,
        borderLeft: `3px solid ${isDone ? "#22C55E" : "#FF5200"}`,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: isDone ? 0 : 10,
        }}
      >
        <div>
          <p
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: isDone ? "#22C55E" : "#fff",
              fontFamily: "var(--font-syne)",
              marginBottom: 2,
            }}
          >
            {isDone ? "Signals ready" : "Detecting signals..."}
          </p>
          <p
            style={{
              fontSize: 11,
              color: "rgba(255,255,255,0.35)",
              fontFamily: "var(--font-outfit)",
            }}
          >
            {isDone
              ? `${progress.done} leads analyzed${progress.failed > 0 ? `, ${progress.failed} failed` : ""}`
              : `${analyzed} / ${progress.total} leads analyzed`}
          </p>
        </div>
        {isDone && (
          <button
            onClick={() =>
              router.push(`/dashboard/campaigns/${campaignId}?tab=leads`)
            }
            style={{
              padding: "8px 16px",
              borderRadius: 7,
              border: "none",
              backgroundColor: "#FF5200",
              color: "#fff",
              fontSize: 12,
              fontWeight: 500,
              fontFamily: "var(--font-outfit)",
              cursor: "pointer",
            }}
          >
            Generate emails
          </button>
        )}
      </div>

      {!isDone && (
        <div
          style={{
            height: 4,
            borderRadius: 2,
            backgroundColor: "rgba(255,255,255,0.06)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${pct}%`,
              backgroundColor: "#FF5200",
              borderRadius: 2,
              transition: "width 0.4s ease",
            }}
          />
        </div>
      )}
    </div>
  );
}
