"use client";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUp } from "lucide-react";
import { ChangeEvent, FormEvent, KeyboardEvent, useRef, useState } from "react";
import { playSend } from "@/lib/sounds";

interface InputAreaProps {
  input: string;
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
}

export function InputArea({ input, onChange, onSubmit, isLoading }: InputAreaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [focused, setFocused] = useState(false);
  const prefersReduced = useReducedMotion();
  const canSend = !isLoading && input.trim().length > 0;

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    if (canSend) playSend();
    onSubmit(e);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (canSend) {
        playSend();
        onSubmit(e as unknown as FormEvent<HTMLFormElement>);
      }
    }
  }

  function handleInput() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{ padding: "10px 12px", borderTop: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}
    >
      <div
        style={{
          background: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 999,
          padding: "0 8px 0 16px",
          display: "flex",
          alignItems: "center",
          gap: 8,
          minHeight: 56,
          boxShadow: focused ? "0 0 0 4px rgba(255,82,0,0.2)" : "none",
          transition: "box-shadow 200ms ease",
        }}
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={onChange}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Ask anything about your outreach..."
          disabled={isLoading}
          rows={1}
          aria-label="Message input"
          style={{
            flex: 1,
            background: "none",
            border: "none",
            outline: "none",
            color: isLoading ? "rgba(255,255,255,0.4)" : "#fff",
            fontSize: 14,
            fontFamily: "var(--font-outfit)",
            resize: "none",
            maxHeight: 120,
            overflowY: "auto",
            lineHeight: 1.5,
          }}
        />
        <motion.button
          type="submit"
          disabled={!canSend}
          whileHover={canSend && !prefersReduced ? { scale: 1.05 } : {}}
          whileTap={canSend && !prefersReduced ? { scale: 0.95 } : {}}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
          aria-label="Send message"
          style={{
            width: 38,
            height: 38,
            borderRadius: 999,
            background: canSend ? "#FF5200" : "rgba(255,255,255,0.08)",
            border: "none",
            cursor: canSend ? "pointer" : "not-allowed",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            flexShrink: 0,
            transition: "background 150ms ease",
          }}
        >
          <ArrowUp size={18} />
        </motion.button>
      </div>
    </form>
  );
}
