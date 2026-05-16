"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Zap, Briefcase, BarChart, ShoppingBag, TrendingUp, Settings,
  User, Store, Building, Megaphone, ShoppingCart, Home,
  ArrowLeft, ArrowRight, Check,
} from "lucide-react";

const ACCENT = "#FF5200";

const CATEGORIES = [
  { id: "saas", icon: Zap, label: "SaaS Product", description: "Software sold as a subscription" },
  { id: "agency", icon: Briefcase, label: "Agency Services", description: "Marketing, design, or dev services" },
  { id: "consulting", icon: BarChart, label: "Consulting", description: "Strategy or professional advice" },
  { id: "ecommerce", icon: ShoppingBag, label: "E-commerce", description: "Physical or digital products" },
  { id: "fintech", icon: TrendingUp, label: "Financial Services", description: "Fintech, investment, or banking" },
  { id: "enterprise", icon: Settings, label: "Enterprise Software", description: "B2B tools for large companies" },
];

const ICP_OPTIONS = [
  { id: "startup-founders", icon: User, label: "Startup Founders" },
  { id: "smb-owners", icon: Store, label: "SMB Owners" },
  { id: "enterprise-ctos", icon: Building, label: "Enterprise CTOs" },
  { id: "vp-sales", icon: TrendingUp, label: "VP of Sales" },
  { id: "marketing-directors", icon: Megaphone, label: "Marketing Directors" },
  { id: "agency-owners", icon: Briefcase, label: "Agency Owners" },
  { id: "ecommerce-brands", icon: ShoppingCart, label: "E-commerce Brands" },
  { id: "real-estate", icon: Home, label: "Real Estate Agents" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [customCategory, setCustomCategory] = useState("");
  const [selectedICP, setSelectedICP] = useState<string[]>([]);

  const toggleICP = (id: string) =>
    setSelectedICP((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const canContinue = () => {
    if (currentStep === 1) return selectedCategory !== null || customCategory.trim().length > 0;
    if (currentStep === 2) return selectedICP.length > 0;
    return true;
  };

  const handleNext = async () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
      return;
    }
    setSaving(true);
    try {
      const categoryLabel = selectedCategory
        ? CATEGORIES.find((c) => c.id === selectedCategory)?.label
        : customCategory;
      const icpLabels = selectedICP
        .map((id) => ICP_OPTIONS.find((o) => o.id === id)?.label)
        .filter(Boolean)
        .join(", ");
      await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product: categoryLabel, icp: icpLabels }),
      });
    } finally {
      setSaving(false);
      router.push("/dashboard");
    }
  };

  const handleSkip = () => router.push("/dashboard");
  const handleBack = () => { if (currentStep > 1) setCurrentStep(currentStep - 1); };

  const root: React.CSSProperties = {
    minHeight: "100vh",
    background: "#060606",
    display: "flex",
    flexDirection: "column",
    fontFamily: "var(--font-outfit, sans-serif)",
    color: "#e8e8e8",
  };

  return (
    <div style={root}>
      {/* Header */}
      <header style={{
        padding: "20px 32px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Zap style={{ width: 18, height: 18, color: ACCENT }} />
          <span style={{ fontFamily: "var(--font-syne, sans-serif)", fontWeight: 500, fontSize: 15, color: "#fff" }}>
            Nexora
          </span>
        </div>

        {/* Step progress */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {[1, 2, 3].map((step) => (
            <div key={step} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                background: currentStep >= step ? ACCENT : "#111",
                border: `1px solid ${currentStep >= step ? ACCENT : "#1a1a1a"}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: currentStep >= step ? "#fff" : "#444",
                fontSize: 12,
                fontWeight: 500,
                transition: "background 0.2s, border-color 0.2s",
              }}>
                {currentStep > step ? <Check style={{ width: 12, height: 12 }} /> : step}
              </div>
              {step < 3 && (
                <div style={{
                  width: 28,
                  height: 1,
                  background: currentStep > step ? ACCENT : "#1a1a1a",
                  transition: "background 0.2s",
                }} />
              )}
            </div>
          ))}
        </div>

        <div style={{ width: 90 }} />
      </header>

      {/* Main */}
      <main style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
      }}>
        <div style={{ width: "100%", maxWidth: 680 }}>

          {/* Step 1 */}
          {currentStep === 1 && (
            <div>
              <div style={{ textAlign: "center", marginBottom: 32 }}>
                <p style={{ fontSize: 11, color: "#444", marginBottom: 10, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 500 }}>
                  Step 1 of 3
                </p>
                <h1 style={{ fontFamily: "var(--font-syne, sans-serif)", fontWeight: 500, fontSize: 24, color: "#fff", margin: 0 }}>
                  Choose your category
                </h1>
                <p style={{ color: "#555", marginTop: 8, fontSize: 14, margin: "8px 0 0" }}>
                  Select what best describes your product
                </p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {CATEGORIES.map(({ id, icon: Icon, label, description }) => {
                  const selected = selectedCategory === id;
                  return (
                    <button
                      key={id}
                      onClick={() => { setSelectedCategory(selected ? null : id); setCustomCategory(""); }}
                      style={{
                        background: "#111",
                        border: `1px solid ${selected ? ACCENT : "#1a1a1a"}`,
                        borderRadius: 8,
                        padding: "18px 20px",
                        cursor: "pointer",
                        textAlign: "left",
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                        transition: "border-color 0.15s",
                      }}
                    >
                      <Icon style={{ width: 18, height: 18, color: selected ? ACCENT : "#555", transition: "color 0.15s" }} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: "#e0e0e0", marginBottom: 3 }}>{label}</div>
                        <div style={{ fontSize: 12, color: "#555", lineHeight: 1.4 }}>{description}</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div style={{ marginTop: 14 }}>
                <div style={{ position: "relative" }}>
                  <input
                    type="text"
                    value={customCategory}
                    onChange={(e) => { setCustomCategory(e.target.value); setSelectedCategory(null); }}
                    placeholder="Don't see yours? Describe it ->"
                    style={{
                      width: "100%",
                      background: "#111",
                      border: `1px solid ${customCategory.trim() ? ACCENT : "#1a1a1a"}`,
                      borderRadius: 8,
                      padding: "12px 40px 12px 16px",
                      color: "#e8e8e8",
                      fontSize: 13,
                      outline: "none",
                      transition: "border-color 0.15s",
                      boxSizing: "border-box",
                    }}
                  />
                  <ArrowRight style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, color: "#333", pointerEvents: "none" }} />
                </div>
              </div>
            </div>
          )}

          {/* Step 2 */}
          {currentStep === 2 && (
            <div>
              <div style={{ textAlign: "center", marginBottom: 32 }}>
                <p style={{ fontSize: 11, color: "#444", marginBottom: 10, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 500 }}>
                  Step 2 of 3
                </p>
                <h1 style={{ fontFamily: "var(--font-syne, sans-serif)", fontWeight: 500, fontSize: 24, color: "#fff", margin: 0 }}>
                  Who&apos;s your ideal customer?
                </h1>
                <p style={{ color: "#555", marginTop: 8, fontSize: 14, margin: "8px 0 0" }}>
                  Select all that apply
                </p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {ICP_OPTIONS.map(({ id, icon: Icon, label }) => {
                  const selected = selectedICP.includes(id);
                  return (
                    <button
                      key={id}
                      onClick={() => toggleICP(id)}
                      style={{
                        background: "#111",
                        border: `1px solid ${selected ? ACCENT : "#1a1a1a"}`,
                        borderRadius: 8,
                        padding: "14px 18px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        transition: "border-color 0.15s",
                      }}
                    >
                      <Icon style={{ width: 16, height: 16, color: selected ? ACCENT : "#444", flexShrink: 0, transition: "color 0.15s" }} />
                      <span style={{ fontSize: 13, fontWeight: 400, color: selected ? "#e0e0e0" : "#777", flex: 1, textAlign: "left" }}>
                        {label}
                      </span>
                      {selected && (
                        <Check style={{ width: 14, height: 14, color: ACCENT, flexShrink: 0 }} />
                      )}
                    </button>
                  );
                })}
              </div>

              {selectedICP.length === 0 && (
                <p style={{ textAlign: "center", fontSize: 12, color: "#333", marginTop: 16 }}>
                  Select at least one to continue
                </p>
              )}
            </div>
          )}

          {/* Step 3 */}
          {currentStep === 3 && (
            <div>
              <div style={{ textAlign: "center", marginBottom: 40 }}>
                <p style={{ fontSize: 11, color: "#444", marginBottom: 10, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 500 }}>
                  Step 3 of 3
                </p>
                <h1 style={{ fontFamily: "var(--font-syne, sans-serif)", fontWeight: 500, fontSize: 24, color: "#fff", margin: 0 }}>
                  Connect your email
                </h1>
                <p style={{ color: "#555", marginTop: 8, fontSize: 14, margin: "8px 0 0" }}>
                  Link your email account to start sending campaigns
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 400, margin: "0 auto" }}>
                <button
                  style={{
                    background: ACCENT,
                    border: "none",
                    borderRadius: 8,
                    padding: "15px 24px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                    color: "#fff",
                    fontSize: 14,
                    fontWeight: 500,
                    width: "100%",
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="M2 7l10 7 10-7" />
                  </svg>
                  Connect Gmail
                </button>

                <button
                  style={{
                    background: "#161616",
                    border: "1px solid #1a1a1a",
                    borderRadius: 8,
                    padding: "15px 24px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                    color: "#aaa",
                    fontSize: 14,
                    fontWeight: 400,
                    width: "100%",
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="M2 7l10 7 10-7" />
                    <path d="M12 11V20" />
                    <path d="M2 20h10" />
                  </svg>
                  Connect Outlook
                </button>

                <div style={{ textAlign: "center", marginTop: 6 }}>
                  <button
                    onClick={handleSkip}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#3a3a3a", fontSize: 12, padding: 0 }}
                  >
                    Skip for now -&gt;
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div style={{ marginTop: 48, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <button
              onClick={handleBack}
              disabled={currentStep === 1}
              style={{
                background: "none",
                border: "none",
                cursor: currentStep === 1 ? "default" : "pointer",
                color: currentStep === 1 ? "#222" : "#555",
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 14,
                padding: 0,
                transition: "color 0.15s",
              }}
            >
              <ArrowLeft style={{ width: 15, height: 15 }} />
              Back
            </button>

            <button
              onClick={handleNext}
              disabled={!canContinue() || saving}
              style={{
                background: canContinue() && !saving ? ACCENT : "#1e1208",
                border: "none",
                borderRadius: 8,
                padding: "10px 22px",
                cursor: canContinue() && !saving ? "pointer" : "default",
                color: canContinue() && !saving ? "#fff" : "#4a2510",
                fontSize: 14,
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                gap: 8,
                transition: "background 0.15s, color 0.15s",
              }}
            >
              {saving ? "Saving..." : currentStep === 3 ? "Get Started" : "Continue"}
              <ArrowRight style={{ width: 15, height: 15 }} />
            </button>
          </div>

          {/* Skip setup */}
          <div style={{ textAlign: "center", marginTop: 20 }}>
            <button
              onClick={handleSkip}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#2e2e2e", fontSize: 12, padding: 0 }}
            >
              Skip setup -&gt;
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
