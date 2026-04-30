"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2, AlertCircle } from "lucide-react";

interface SaveStatusProps {
  status: "idle" | "saving" | "saved" | "error";
  message?: string;
  timestamp?: Date;
}

export default function SaveStatus({ status, message, timestamp }: SaveStatusProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (status === "idle") {
      setVisible(false);
      return;
    }
    setVisible(true);
    if (status === "saved") {
      const t = setTimeout(() => setVisible(false), 3000);
      return () => clearTimeout(t);
    }
  }, [status]);

  function getTimeLabel() {
    if (!timestamp) return "just now";
    const diff = Math.floor((Date.now() - timestamp.getTime()) / 60000);
    if (diff < 1) return "just now";
    return `${diff} minute${diff === 1 ? "" : "s"} ago`;
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key={status}
          initial={{ opacity: 0, y: 3 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -3 }}
          transition={{ duration: 0.18 }}
          style={{ display: "flex", alignItems: "center", gap: 7 }}
          role={status === "error" ? "alert" : "status"}
          aria-live="polite"
        >
          {status === "saving" && (
            <>
              <Loader2
                size={13}
                strokeWidth={2}
                color="#888"
                aria-hidden="true"
                style={{ animation: "spin 0.8s linear infinite" }}
              />
              <span style={{ fontSize: 12, color: "#888", fontFamily: "var(--font-outfit)" }}>
                Saving...
              </span>
            </>
          )}
          {status === "saved" && (
            <>
              <Check size={13} strokeWidth={2.5} color="#4ade80" aria-hidden="true" />
              <span style={{ fontSize: 12, color: "#4ade80", fontFamily: "var(--font-outfit)" }}>
                Saved {getTimeLabel()}
              </span>
            </>
          )}
          {status === "error" && (
            <>
              <AlertCircle size={13} strokeWidth={2} color="#ef4444" aria-hidden="true" />
              <span style={{ fontSize: 12, color: "#ef4444", fontFamily: "var(--font-outfit)" }}>
                {message ?? "Something went wrong"}
              </span>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
