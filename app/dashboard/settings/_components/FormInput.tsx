"use client";

import { useId, useState } from "react";

interface FormInputProps {
  label: string;
  description?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
  maxLength?: number;
  value: string;
  onChange: (value: string) => void;
}

export function FormInput({
  label,
  description,
  placeholder,
  required,
  error,
  maxLength,
  value,
  onChange,
}: FormInputProps) {
  const id = useId();
  const [focused, setFocused] = useState(false);

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
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
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
          boxSizing: "border-box",
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
