"use client";

import { useId, useState, useRef, useEffect } from "react";

interface FormTextareaProps {
  label: string;
  description?: string;
  placeholder?: string;
  rows?: number;
  required?: boolean;
  maxLength?: number;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
}

const LINE_HEIGHT = 21;
const MIN_ROWS = 4;
const MAX_ROWS = 8;
const PADDING_V = 16;

export default function FormTextarea({
  label,
  description,
  placeholder,
  rows = 4,
  required,
  maxLength,
  value,
  onChange,
  onBlur: onBlurProp,
  error,
}: FormTextareaProps) {
  const id = useId();
  const [focused, setFocused] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);

  const clampedRows = Math.min(MAX_ROWS, Math.max(MIN_ROWS, rows));

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    const minH = MIN_ROWS * LINE_HEIGHT + PADDING_V;
    const maxH = MAX_ROWS * LINE_HEIGHT + PADDING_V;
    el.style.height = `${Math.min(maxH, Math.max(minH, el.scrollHeight))}px`;
  }, [value]);

  const borderColor = error
    ? "rgba(239,68,68,0.5)"
    : focused
    ? "rgba(255,82,0,0.6)"
    : "rgba(255,255,255,0.1)";

  return (
    <div style={{
      backgroundColor: "rgba(255,255,255,0.05)",
      borderRadius: 8,
      padding: 16,
    }}>
      <label
        htmlFor={id}
        style={{
          display: "block",
          fontSize: 12,
          fontWeight: 500,
          color: "rgba(255,255,255,0.7)",
          fontFamily: "var(--font-outfit)",
          marginBottom: description ? 3 : 8,
        }}
      >
        {label}
        {required && (
          <span aria-hidden="true" style={{ color: "#ef4444", marginLeft: 3 }}>*</span>
        )}
      </label>
      {description && (
        <p style={{
          fontSize: 11.5,
          color: "rgba(255,255,255,0.35)",
          fontFamily: "var(--font-outfit)",
          margin: "0 0 8px",
          lineHeight: 1.5,
        }}>
          {description}
        </p>
      )}
      <textarea
        ref={ref}
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => { setFocused(false); onBlurProp?.(); }}
        placeholder={placeholder}
        rows={clampedRows}
        maxLength={maxLength}
        required={required}
        aria-required={required}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        style={{
          width: "100%",
          padding: "8px 12px",
          borderRadius: 6,
          backgroundColor: "#060606",
          border: `1px solid ${borderColor}`,
          color: "#fff",
          fontSize: 13,
          fontFamily: "var(--font-outfit)",
          outline: "none",
          resize: "none",
          boxSizing: "border-box",
          lineHeight: `${LINE_HEIGHT}px`,
          overflow: "hidden",
          transition: "border-color 0.15s ease",
        }}
      />
      {(error || maxLength) && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 5 }}>
          {error ? (
            <span
              id={`${id}-error`}
              role="alert"
              style={{ fontSize: 11.5, color: "#ef4444", fontFamily: "var(--font-outfit)" }}
            >
              {error}
            </span>
          ) : (
            <span />
          )}
          {maxLength && (
            <span style={{
              fontSize: 11,
              color: value.length >= maxLength ? "#ef4444" : "rgba(255,255,255,0.3)",
              fontFamily: "var(--font-outfit)",
              fontVariantNumeric: "tabular-nums",
            } as React.CSSProperties}>
              {value.length}/{maxLength}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
