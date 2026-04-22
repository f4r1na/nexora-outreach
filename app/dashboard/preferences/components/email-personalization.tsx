"use client";

import { useState, useEffect, useRef } from "react";
import { Check, ChevronDown, X } from "lucide-react";

const PREFS_KEY = "nx-prefs-email-personalization";

const INDUSTRIES = [
  "Finance", "Healthcare", "Legal", "Government", "Education",
  "Real Estate", "Insurance", "Retail", "Manufacturing", "Crypto",
];

const selectStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 12px",
  borderRadius: 6,
  backgroundColor: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "#ccc",
  fontFamily: "var(--font-outfit)",
  fontSize: 13,
  outline: "none",
  boxSizing: "border-box",
  cursor: "pointer",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 11,
  color: "#555",
  fontFamily: "var(--font-outfit)",
  marginBottom: 5,
};

function IndustrySelect({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function toggle(industry: string) {
    onChange(
      selected.includes(industry)
        ? selected.filter((i) => i !== industry)
        : [...selected, industry],
    );
  }

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          ...selectStyle,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          textAlign: "left",
        }}
      >
        <span style={{ color: selected.length ? "#ccc" : "rgba(255,255,255,0.25)" }}>
          {selected.length === 0
            ? "None selected"
            : selected.length === 1
            ? selected[0]
            : `${selected.length} industries`}
        </span>
        <ChevronDown
          size={13}
          strokeWidth={1.75}
          color="#555"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.15s ease", flexShrink: 0 }}
        />
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
          backgroundColor: "#0e0e18",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 6,
          overflow: "hidden",
          zIndex: 20,
        }}>
          {INDUSTRIES.map((industry) => {
            const checked = selected.includes(industry);
            return (
              <button
                key={industry}
                onClick={() => toggle(industry)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  width: "100%", padding: "8px 12px",
                  backgroundColor: checked ? "rgba(255,82,0,0.05)" : "transparent",
                  border: "none", cursor: "pointer",
                  fontFamily: "var(--font-outfit)", fontSize: 13,
                  color: checked ? "#ccc" : "#666",
                  textAlign: "left",
                }}
              >
                {industry}
                {checked && <Check size={12} color="#FF5200" strokeWidth={2} />}
              </button>
            );
          })}
        </div>
      )}

      {selected.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 8 }}>
          {selected.map((i) => (
            <span
              key={i}
              style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                fontSize: 11, padding: "3px 8px", borderRadius: 5,
                backgroundColor: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.07)",
                color: "#666", fontFamily: "var(--font-outfit)",
              }}
            >
              {i}
              <button
                onClick={() => onChange(selected.filter((s) => s !== i))}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", color: "#444" }}
              >
                <X size={10} strokeWidth={2} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function EmailPersonalization() {
  const [autoReference, setAutoReference] = useState("yes");
  const [minCompanySize, setMinCompanySize] = useState("any");
  const [avoidIndustries, setAvoidIndustries] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(PREFS_KEY);
      if (stored) {
        const p = JSON.parse(stored);
        setAutoReference(p.autoReference ?? "yes");
        setMinCompanySize(p.minCompanySize ?? "any");
        setAvoidIndustries(p.avoidIndustries ?? []);
      }
    } catch { /* ignore */ }
  }, []);

  function handleSave() {
    localStorage.setItem(PREFS_KEY, JSON.stringify({ autoReference, minCompanySize, avoidIndustries }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {saved && (
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "9px 12px", borderRadius: 7,
          backgroundColor: "rgba(74,222,128,0.06)",
          border: "1px solid rgba(74,222,128,0.15)",
        }}>
          <Check size={12} color="#4ade80" strokeWidth={2} />
          <span style={{ fontSize: 12, color: "#4ade80", fontFamily: "var(--font-outfit)" }}>
            Personalization settings saved.
          </span>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label style={labelStyle}>Auto-reference signals</label>
          <select value={autoReference} onChange={(e) => setAutoReference(e.target.value)} style={selectStyle}>
            <option value="yes">Enabled</option>
            <option value="no">Disabled</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>Min company size</label>
          <select value={minCompanySize} onChange={(e) => setMinCompanySize(e.target.value)} style={selectStyle}>
            <option value="any">Any size</option>
            <option value="1-10">1-10 employees</option>
            <option value="11-50">11-50 employees</option>
            <option value="51-200">51-200 employees</option>
            <option value="201+">201+ employees</option>
          </select>
        </div>
      </div>

      <div>
        <label style={labelStyle}>Industries to avoid</label>
        <IndustrySelect selected={avoidIndustries} onChange={setAvoidIndustries} />
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          onClick={handleSave}
          style={{
            padding: "8px 18px",
            backgroundColor: "#FF5200", color: "#fff",
            borderRadius: 6, border: "none", fontSize: 12,
            fontFamily: "var(--font-outfit)", fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Save settings
        </button>
      </div>
    </div>
  );
}
