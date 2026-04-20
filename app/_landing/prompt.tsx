"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp } from "lucide-react";

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

const EXAMPLE_PROMPTS = [
  "Find 20 SaaS founders who raised a seed round this month and pitch them...",
  "Send follow-ups to leads who opened my email but never replied...",
  "Research 15 e-commerce founders in Austin and write personalized emails...",
  "Find marketing directors at Series A startups and draft outreach...",
  "Check my inbox for replies and draft responses to interested leads...",
  "Build a campaign targeting HR managers at 50-200 person companies...",
];

export default function LandingPrompt() {
  const router = useRouter();
  const [prompt, setPrompt]     = useState("");
  const [focused, setFocused]   = useState(false);
  const [idx, setIdx]           = useState(0);
  const textareaRef             = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (prompt || focused) return;
    const id = setInterval(() => {
      setIdx((i) => (i + 1) % EXAMPLE_PROMPTS.length);
    }, 3500);
    return () => clearInterval(id);
  }, [prompt, focused]);

  const submit = () => {
    const q = prompt.trim();
    router.push(q
      ? `/signup?prompt=${encodeURIComponent(q)}`
      : "/signup"
    );
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const showPlaceholder = !prompt;

  return (
    <div style={{
      position: "relative",
      padding: 1.5,
      borderRadius: 999,
      background: focused
        ? "linear-gradient(135deg, #FF5200 0%, #F59E0B 100%)"
        : "linear-gradient(135deg, rgba(255,82,0,0.4) 0%, rgba(245,158,11,0.4) 100%)",
      boxShadow: focused
        ? "0 0 0 4px rgba(255,82,0,0.08), 0 22px 70px -20px rgba(255,82,0,0.38)"
        : "0 12px 48px -18px rgba(0,0,0,0.7)",
      transition: "box-shadow 260ms ease, background 260ms ease",
    }}>
      <div style={{
        position: "relative",
        backgroundColor: "#0E0E18",
        borderRadius: 999,
        display: "flex",
        alignItems: "center",
        minHeight: 68,
        paddingLeft: 28,
        paddingRight: 8,
      }}>
        {showPlaceholder && (
          <div style={{
            position: "absolute",
            top: 0, bottom: 0, left: 28, right: 96,
            display: "flex", alignItems: "center",
            pointerEvents: "none", userSelect: "none",
            zIndex: 1, overflow: "hidden",
          }}>
            <AnimatePresence mode="wait">
              <motion.span
                key={idx}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: focused ? 0.25 : 0.42 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.4, ease: EASE_OUT }}
                style={{
                  display: "block",
                  color: "rgba(255,255,255,0.6)",
                  fontFamily: "var(--font-outfit)",
                  fontSize: 15,
                  lineHeight: 1.4,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  width: "100%",
                  textAlign: "left",
                }}
              >
                {EXAMPLE_PROMPTS[idx]}
              </motion.span>
            </AnimatePresence>
          </div>
        )}

        <textarea
          ref={textareaRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={handleKey}
          rows={1}
          style={{
            flex: 1,
            padding: "24px 0",
            backgroundColor: "transparent",
            border: "none",
            outline: "none",
            color: "#fff",
            fontFamily: "var(--font-outfit)",
            fontSize: 15,
            lineHeight: 1.4,
            resize: "none",
            position: "relative",
            zIndex: 2,
            textAlign: "left",
          }}
        />

        <button
          onClick={submit}
          style={{
            position: "relative",
            zIndex: 3,
            flexShrink: 0,
            height: 52,
            paddingLeft: 22,
            paddingRight: 24,
            borderRadius: 999,
            backgroundColor: "#FF5200",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
            color: "#fff",
            fontSize: 13.5,
            fontWeight: 600,
            fontFamily: "var(--font-outfit)",
            transition: "background-color 160ms ease, transform 100ms ease-out",
          }}
          onMouseDown={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.97)"; }}
          onMouseUp={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; }}
        >
          <span>Try it</span>
          <ArrowUp size={14} />
        </button>
      </div>
    </div>
  );
}
