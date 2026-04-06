"use client";

import { useEffect, useState } from "react";

const LEADS = [
  { name: "Sarah Chen", company: "Acme Corp", role: "VP Sales", note: "just closed Series B" },
  { name: "Marcus Lee", company: "Finova", role: "Head of Growth", note: "hiring 50 SDRs this quarter" },
  { name: "Priya Kapoor", company: "Orion AI", role: "CEO", note: "launched product last week" },
];

const EMAILS = [
  {
    subject: "Congrats on the Series B, Sarah — quick idea",
    body: "Closing a Series B is a massive moment — and exactly when outreach volume needs to scale. Nexora helps Acme's sales team write 100 personalized cold emails in under 60 seconds. Worth a quick call?",
  },
  {
    subject: "Scaling 50 SDRs? Here's how to arm them instantly",
    body: "Hiring 50 SDRs this quarter means you need personalized outreach at serious volume, fast. Nexora generates hyper-personalized emails for every lead in your pipeline — in seconds. Let's talk.",
  },
  {
    subject: "Loved what Orion AI shipped last week, Priya",
    body: "Launching a new product is the perfect moment to flood your pipeline with personalized outreach. Nexora writes 100 cold emails in 60 seconds — each one referencing what makes each prospect tick.",
  },
];

export default function LandingDemo() {
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

  // Auto-cycle leads
  useEffect(() => {
    const cycle = setInterval(() => {
      setActive((i) => (i + 1) % LEADS.length);
    }, 4500);
    return () => clearInterval(cycle);
  }, []);

  // Animate generation bar whenever lead changes
  useEffect(() => {
    setDone(false);
    setProgress(0);
    let p = 0;
    const tick = setInterval(() => {
      p += 6 + Math.random() * 6;
      if (p >= 100) {
        clearInterval(tick);
        setProgress(100);
        setDone(true);
      } else {
        setProgress(Math.round(p));
      }
    }, 55);
    return () => clearInterval(tick);
  }, [active]);

  const lead = LEADS[active];
  const email = EMAILS[active];

  return (
    <div style={{
      backgroundColor: "#0c0c0c",
      border: "1px solid rgba(255,255,255,0.09)",
      borderRadius: 18, overflow: "hidden",
      fontFamily: "var(--font-outfit)",
      boxShadow: "0 40px 100px rgba(0,0,0,0.7)",
    }}>
      {/* Traffic lights */}
      <div style={{
        padding: "11px 18px",
        backgroundColor: "#101010",
        borderBottom: "1px solid rgba(255,255,255,0.055)",
        display: "flex", alignItems: "center", gap: 7,
      }}>
        {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
          <div key={c} style={{ width: 11, height: 11, borderRadius: "50%", backgroundColor: c }} />
        ))}
        <span style={{ marginLeft: 10, fontSize: 11.5, color: "rgba(255,255,255,0.25)", letterSpacing: "0.02em" }}>
          Nexora Outreach — Campaign Generator
        </span>
      </div>

      {/* Body */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>

        {/* Left panel — lead input */}
        <div style={{ padding: "28px 26px", borderRight: "1px solid rgba(255,255,255,0.055)" }}>
          <p style={{ fontSize: 10, fontWeight: 800, color: "#FF5200", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 20 }}>Lead</p>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { label: "Name", value: lead.name },
              { label: "Company", value: lead.company },
              { label: "Role", value: lead.role },
              { label: "Custom note", value: lead.note },
            ].map(({ label, value }) => (
              <div key={label}>
                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", margin: "0 0 3px", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</p>
                <p style={{
                  fontSize: 13, color: label === "Custom note" ? "#FF5200" : "#e8e8e8",
                  margin: 0, fontWeight: label === "Custom note" ? 600 : 400,
                }}>{value}</p>
              </div>
            ))}
          </div>

          {/* Progress */}
          <div style={{ marginTop: 28 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
              <span style={{ fontSize: 11, color: done ? "#4ade80" : "rgba(255,255,255,0.28)" }}>
                {done ? "✓ Email generated" : "Generating…"}
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, color: done ? "#4ade80" : "#FF5200" }}>{progress}%</span>
            </div>
            <div style={{ height: 3, backgroundColor: "rgba(255,255,255,0.07)", borderRadius: 2, overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 2,
                width: `${progress}%`,
                backgroundColor: done ? "#4ade80" : "#FF5200",
                transition: "width 0.06s linear, background-color 0.4s",
              }} />
            </div>
          </div>

          {/* Lead switcher dots */}
          <div style={{ display: "flex", gap: 7, marginTop: 22 }}>
            {LEADS.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                aria-label={`Switch to lead ${i + 1}`}
                style={{
                  width: i === active ? 22 : 8, height: 8, borderRadius: 4,
                  border: "none", cursor: "pointer", padding: 0,
                  backgroundColor: i === active ? "#FF5200" : "rgba(255,255,255,0.15)",
                  transition: "width 0.3s, background-color 0.3s",
                }}
              />
            ))}
          </div>
        </div>

        {/* Right panel — generated email */}
        <div style={{ padding: "28px 26px", minHeight: 280 }}>
          <p style={{ fontSize: 10, fontWeight: 800, color: "#FF5200", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 20 }}>Generated Email</p>

          {done ? (
            <div key={`${active}-done`} style={{ animation: "nxFadeUp 0.35s ease-out forwards" }}>
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", margin: "0 0 5px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Subject</p>
              <p style={{ fontSize: 13, color: "#fff", fontWeight: 700, margin: "0 0 18px", lineHeight: 1.5 }}>{email.subject}</p>

              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Body</p>
              <p style={{ fontSize: 12.5, color: "rgba(255,255,255,0.6)", margin: 0, lineHeight: 1.8 }}>{email.body}</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {[78, 55, 88, 48, 65, 40, 72, 35].map((w, i) => (
                <div key={i} style={{
                  height: 9, borderRadius: 4,
                  backgroundColor: "rgba(255,255,255,0.06)",
                  width: `${w}%`,
                  animation: `nxPulse 1.6s ease-in-out ${i * 0.12}s infinite`,
                }} />
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes nxFadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes nxPulse {
          0%, 100% { opacity: 0.35; }
          50%       { opacity: 0.75; }
        }
      `}</style>
    </div>
  );
}
