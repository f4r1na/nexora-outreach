"use client";

import { useEffect, useState } from "react";

const DEMO_LEADS = [
  { name: "Sarah Chen", company: "Acme Corp", role: "VP Sales", note: "just closed Series B" },
  { name: "Marcus Lee", company: "Finova", role: "Head of Growth", note: "hiring 50 SDRs this quarter" },
  { name: "Priya Kapoor", company: "Orion AI", role: "CEO", note: "launched new product last week" },
];

const DEMO_EMAILS = [
  {
    subject: "Congrats on the Series B, Sarah — quick idea",
    body: "Raising a Series B is a massive milestone — we wanted to reach out at exactly this moment. As Acme scales its sales motion, Nexora can help your team generate 100 personalized cold emails in under a minute. Worth a 15-min call?",
  },
  {
    subject: "Scaling 50 SDRs? Here's how to arm them",
    body: "Hiring 50 SDRs this quarter means you need personalized outreach at serious volume. Nexora generates hyper-personalized cold emails for every lead in your pipeline — instantly. Let's talk about how to 10x your team's output.",
  },
  {
    subject: "Love what you shipped last week, Priya",
    body: "Launching a new product is the perfect time to flood your pipeline. Nexora helps teams like Orion AI write 100 personalized cold emails in 60 seconds — each one referencing what makes your prospects tick. Let's connect.",
  },
];

export default function LandingDemo() {
  const [active, setActive] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActive((i) => (i + 1) % DEMO_LEADS.length);
      setGenerated(false);
      setProgress(0);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setGenerating(true);
    setGenerated(false);
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setGenerating(false);
          setGenerated(true);
          return 100;
        }
        return p + 8;
      });
    }, 60);
    return () => clearInterval(interval);
  }, [active]);

  const lead = DEMO_LEADS[active];
  const email = DEMO_EMAILS[active];

  return (
    <div style={{
      backgroundColor: "#0e0e0e", border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 16, overflow: "hidden", textAlign: "left",
      boxShadow: "0 32px 80px rgba(0,0,0,0.6)",
    }}>
      {/* Panel header */}
      <div style={{
        padding: "12px 16px", backgroundColor: "#111",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "#ff5f57" }} />
        <div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "#febc2e" }} />
        <div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "#28c840" }} />
        <span style={{ marginLeft: 8, fontSize: 12, color: "rgba(255,255,255,0.3)", fontFamily: "var(--font-outfit)" }}>
          Nexora Outreach — Campaign Generator
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
        {/* Left: lead info */}
        <div style={{ padding: 24, borderRight: "1px solid rgba(255,255,255,0.06)" }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#FF5200", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>Lead</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { label: "Name", value: lead.name },
              { label: "Company", value: lead.company },
              { label: "Role", value: lead.role },
              { label: "Note", value: lead.note },
            ].map(({ label, value }) => (
              <div key={label}>
                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</p>
                <p style={{ fontSize: 13, color: "#fff", margin: 0, fontWeight: label === "Note" ? 500 : 400 }}>{value}</p>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div style={{ marginTop: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
                {generating ? "Generating..." : generated ? "Done" : "Ready"}
              </span>
              <span style={{ fontSize: 11, color: generating ? "#FF5200" : "#4ade80" }}>{progress}%</span>
            </div>
            <div style={{ height: 3, backgroundColor: "rgba(255,255,255,0.07)", borderRadius: 2, overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 2,
                width: `${progress}%`,
                backgroundColor: generated ? "#4ade80" : "#FF5200",
                transition: "width 0.06s linear, background-color 0.3s",
              }} />
            </div>
          </div>

          {/* Lead tabs */}
          <div style={{ display: "flex", gap: 6, marginTop: 20 }}>
            {DEMO_LEADS.map((_, i) => (
              <button
                key={i}
                onClick={() => { setActive(i); }}
                style={{
                  width: 28, height: 6, borderRadius: 3, border: "none", cursor: "pointer",
                  backgroundColor: i === active ? "#FF5200" : "rgba(255,255,255,0.12)",
                  transition: "background-color 0.2s",
                  padding: 0,
                }}
              />
            ))}
          </div>
        </div>

        {/* Right: generated email */}
        <div style={{ padding: 24 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#FF5200", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>Generated Email</p>
          {generated ? (
            <div style={{ animation: "fadeIn 0.3s ease-out" }}>
              <div style={{
                fontSize: 11, color: "rgba(255,255,255,0.3)", marginBottom: 8,
                textTransform: "uppercase", letterSpacing: "0.06em",
              }}>Subject</div>
              <p style={{ fontSize: 13, color: "#fff", fontWeight: 600, marginBottom: 16, lineHeight: 1.5 }}>
                {email.subject}
              </p>
              <div style={{
                fontSize: 11, color: "rgba(255,255,255,0.3)", marginBottom: 8,
                textTransform: "uppercase", letterSpacing: "0.06em",
              }}>Body</div>
              <p style={{ fontSize: 12.5, color: "rgba(255,255,255,0.65)", lineHeight: 1.7, margin: 0 }}>
                {email.body}
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[80, 60, 90, 50, 70, 40].map((w, i) => (
                <div key={i} style={{
                  height: 10, borderRadius: 5,
                  backgroundColor: "rgba(255,255,255,0.07)",
                  width: `${w}%`,
                  animation: `pulse 1.5s ease-in-out ${i * 0.1}s infinite`,
                }} />
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.8; } }
      `}</style>
    </div>
  );
}
