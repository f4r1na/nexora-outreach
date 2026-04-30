"use client";

import { useId, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

interface FormCheckboxProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export default function FormCheckbox({ label, description, checked, onChange }: FormCheckboxProps) {
  const id = useId();
  const [toggleCount, setToggleCount] = useState(0);
  const [focused, setFocused] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setToggleCount((c) => c + 1);
    onChange(e.target.checked);
  }

  return (
    <label
      htmlFor={id}
      style={{
        display: "flex",
        alignItems: description ? "flex-start" : "center",
        gap: 12,
        cursor: "pointer",
        backgroundColor: "rgba(255,255,255,0.05)",
        borderRadius: 8,
        padding: 16,
        userSelect: "none",
      }}
    >
      {/* Visually hidden native checkbox keeps keyboard/screen-reader support */}
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          position: "absolute",
          opacity: 0,
          width: 1,
          height: 1,
          margin: -1,
          padding: 0,
          overflow: "hidden",
          clip: "rect(0,0,0,0)",
          border: 0,
          whiteSpace: "nowrap",
        }}
      />

      {/* Custom visual indicator */}
      <motion.div
        key={toggleCount}
        initial={{ scale: toggleCount > 0 ? 0.88 : 1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.15, ease: EASE_OUT }}
        aria-hidden="true"
        style={{
          width: 18,
          height: 18,
          borderRadius: 5,
          flexShrink: 0,
          marginTop: description ? 2 : 0,
          backgroundColor: checked ? "#FF5200" : "transparent",
          border: `2px solid ${
            focused
              ? "#FF5200"
              : checked
              ? "#FF5200"
              : "rgba(255,255,255,0.22)"
          }`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "background-color 0.15s ease, border-color 0.15s ease",
        }}
      >
        <AnimatePresence>
          {checked && (
            <motion.div
              key="check"
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.4 }}
              transition={{ duration: 0.1 }}
            >
              <Check size={11} strokeWidth={3} color="#fff" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <div>
        <span style={{
          fontSize: 13,
          fontWeight: 500,
          color: "rgba(255,255,255,0.8)",
          fontFamily: "var(--font-outfit)",
          lineHeight: 1.4,
        }}>
          {label}
        </span>
        {description && (
          <p style={{
            fontSize: 11.5,
            color: "rgba(255,255,255,0.35)",
            fontFamily: "var(--font-outfit)",
            margin: "3px 0 0",
            lineHeight: 1.5,
          }}>
            {description}
          </p>
        )}
      </div>
    </label>
  );
}
