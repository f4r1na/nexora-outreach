"use client";

import { useId, useState } from "react";

interface SelectOption {
  value: string;
  label: string;
}

interface FormSelectProps {
  label: string;
  description?: string;
  options: SelectOption[];
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
}

export function FormSelect({
  label,
  description,
  options,
  required,
  value,
  onChange,
}: FormSelectProps) {
  const id = useId();
  const [focused, setFocused] = useState(false);

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
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        required={required}
        aria-required={required}
        style={{
          width: "100%",
          padding: "8px 12px",
          borderRadius: 6,
          backgroundColor: "#060606",
          border: `1px solid ${focused ? "#FF5200" : "rgba(255,255,255,0.1)"}`,
          color: value ? "#fff" : "rgba(255,255,255,0.35)",
          fontSize: 13,
          fontFamily: "var(--font-outfit)",
          outline: "none",
          cursor: "pointer",
          boxSizing: "border-box",
          transition: "border-color 0.15s ease",
          appearance: "auto",
        }}
      >
        {options.map((opt) => (
          <option
            key={opt.value}
            value={opt.value}
            style={{ backgroundColor: "#0e0e0e", color: "#fff" }}
          >
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
