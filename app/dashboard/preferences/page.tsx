"use client";

import { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import CompanyProfile from "./components/company-profile";
import WritingStyle from "./components/writing-style";
import CampaignDefaults from "./components/campaign-defaults";
import IntelligencePrefs from "./components/intelligence-prefs";
import EmailPersonalization from "./components/email-personalization";

const cardStyle: React.CSSProperties = {
  backgroundColor: "#0e0e18",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: 10,
  marginBottom: 12,
  overflow: "hidden",
};

function Section({
  label,
  defaultOpen = false,
  children,
}: {
  label: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div style={cardStyle}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          width: "100%", padding: "16px 20px",
          background: "none", border: "none", cursor: "pointer",
          borderBottom: open ? "1px solid rgba(255,255,255,0.06)" : "none",
        }}
      >
        <span style={{
          fontSize: 13, fontWeight: 500,
          color: open ? "#ddd" : "#888",
          fontFamily: "var(--font-outfit)",
          letterSpacing: "-0.01em",
        }}>
          {label}
        </span>
        <ChevronDown
          size={14}
          strokeWidth={1.75}
          color={open ? "#555" : "#333"}
          style={{
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.18s ease",
            flexShrink: 0,
          }}
        />
      </button>
      {open && (
        <div style={{ padding: "18px 20px" }}>
          {children}
        </div>
      )}
    </div>
  );
}

export default function PreferencesPage() {
  const [plan, setPlan] = useState("free");

  useEffect(() => {
    fetch("/api/subscription")
      .then((r) => r.json())
      .then((d) => { if (d.subscription?.plan) setPlan(d.subscription.plan); })
      .catch(() => {});
  }, []);

  const isAgency = plan === "agency";

  return (
    <>
      <header style={{
        padding: "0 32px",
        height: 68,
        display: "flex",
        alignItems: "center",
        borderBottom: "1px solid rgba(255,255,255,0.055)",
        backgroundColor: "rgba(8,8,16,0.94)",
        backdropFilter: "blur(12px)",
        position: "sticky",
        top: 0,
        zIndex: 30,
      }}>
        <div>
          <h1 style={{
            fontSize: 16, fontWeight: 500, color: "#fff",
            fontFamily: "var(--font-syne)", letterSpacing: "-0.02em", lineHeight: 1,
          }}>
            Preferences
          </h1>
          <p style={{ fontSize: 11, color: "#383838", fontFamily: "var(--font-outfit)", marginTop: 3 }}>
            Manage your profile, defaults, and personalization
          </p>
        </div>
      </header>

      <div style={{ padding: "24px 32px 64px", maxWidth: 640 }}>

        <Section label="Company Profile" defaultOpen>
          <CompanyProfile />
        </Section>

        <Section label="Writing Style">
          <WritingStyle isAgency={isAgency} />
        </Section>

        <Section label="Campaign Defaults">
          <CampaignDefaults />
        </Section>

        <Section label="Intelligence Preferences">
          <IntelligencePrefs />
        </Section>

        <Section label="Email Personalization">
          <EmailPersonalization />
        </Section>

      </div>
    </>
  );
}
