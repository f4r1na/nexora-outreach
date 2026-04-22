"use client";

import { useState, useEffect } from "react";
import { Check, Loader2 } from "lucide-react";

const inputStyle: React.CSSProperties = {
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
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 11,
  color: "#555",
  fontFamily: "var(--font-outfit)",
  marginBottom: 5,
};

export default function CompanyProfile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [customer, setCustomer] = useState("");
  const [value, setValue] = useState("");
  const [tone, setTone] = useState("Professional");
  const [url, setUrl] = useState("");
  const [diff, setDiff] = useState("");

  useEffect(() => {
    fetch("/api/company-profile")
      .then((r) => r.json())
      .then((d) => {
        const p = d.profile;
        if (p) {
          setName(p.company_name ?? "");
          setDesc(p.company_description ?? "");
          setCustomer(p.ideal_customer ?? "");
          setValue(p.value_proposition ?? "");
          setTone(p.tone ?? "Professional");
          setUrl(p.website_url ?? "");
          setDiff(p.differentiators ?? "");
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/company-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_name: name,
          company_description: desc,
          ideal_customer: customer,
          value_proposition: value,
          tone,
          website_url: url,
          differentiators: diff,
        }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "20px 0" }}>
        <Loader2 size={16} color="#333" style={{ animation: "spin 0.8s linear infinite" }} />
      </div>
    );
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
            Company profile saved.
          </span>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label style={labelStyle}>Company name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Acme Inc." style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Website URL</label>
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://acme.com" style={inputStyle} />
        </div>
      </div>

      {[
        { label: "What your company does", val: desc, set: setDesc, ph: "2-3 sentences describing your product or service..." },
        { label: "Your ideal customer", val: customer, set: setCustomer, ph: "Who are you trying to reach? e.g. SaaS founders at seed-stage startups..." },
        { label: "Your value proposition", val: value, set: setValue, ph: "What problem do you solve? What outcome do customers get?" },
        { label: "Key differentiators", val: diff, set: setDiff, ph: "What makes you different from competitors?" },
      ].map(({ label, val, set, ph }) => (
        <div key={label}>
          <label style={labelStyle}>{label}</label>
          <textarea
            value={val}
            onChange={(e) => set(e.target.value)}
            placeholder={ph}
            rows={2}
            style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
          />
        </div>
      ))}

      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Tone of voice</label>
          <select value={tone} onChange={(e) => setTone(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
            {["Professional", "Friendly", "Direct", "Consultative", "Bold"].map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "8px 18px",
            backgroundColor: "#FF5200", color: "#fff",
            borderRadius: 6, border: "none", fontSize: 12,
            fontFamily: "var(--font-outfit)", fontWeight: 500,
            cursor: saving ? "not-allowed" : "pointer",
            opacity: saving ? 0.6 : 1,
            flexShrink: 0,
          }}
        >
          {saving && <Loader2 size={11} style={{ animation: "spin 0.8s linear infinite" }} />}
          {saving ? "Saving..." : "Save profile"}
        </button>
      </div>
    </div>
  );
}
