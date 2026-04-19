"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { PLANS, PlanKey } from "@/lib/plans";
import { ScrollReveal, StaggerList, StaggerItem } from "../_components/motion";
import {
  Mail, CreditCard, Pen, Package, Check, Loader2, X,
  Sparkles, Zap, Building2, ChevronRight, BarChart3, Repeat, Search,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type GhostStyle = {
  style_summary: string;
  tone_keywords: string;
  sample_emails: string[];
} | null;

type Subscription = {
  plan: string;
  credits_used: number;
  credits_limit: number;
  current_period_end: string | null;
};

type GmailConnection = {
  gmail_email: string;
} | null;

// ─── Shared input style ───────────────────────────────────────────────────────

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

// ─── Section label ────────────────────────────────────────────────────────────

function SectionLabel({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 7,
      marginBottom: 10,
    }}>
      {icon && <span style={{ color: "#383838" }}>{icon}</span>}
      <p style={{
        fontSize: 10,
        fontWeight: 500,
        letterSpacing: "0.07em",
        textTransform: "uppercase",
        color: "#444",
        fontFamily: "var(--font-outfit)",
        margin: 0,
      }}>
        {children}
      </p>
    </div>
  );
}

// ─── Section card ─────────────────────────────────────────────────────────────

function SectionCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      backgroundColor: "#0e0e0e",
      border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: 10,
      padding: "20px 22px",
      marginBottom: 24,
      ...style,
    }}>
      {children}
    </div>
  );
}

// ─── Plan icon ────────────────────────────────────────────────────────────────

function PlanIcon({ plan }: { plan: string }) {
  if (plan === "agency") return <Building2 size={14} strokeWidth={1.75} aria-hidden="true" />;
  if (plan === "pro") return <Zap size={14} strokeWidth={1.75} aria-hidden="true" />;
  return <Package size={14} strokeWidth={1.75} aria-hidden="true" />;
}

// ─── Inner page (needs Suspense for useSearchParams) ─────────────────────────

function SettingsInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [sub, setSub] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);

  const [gmail, setGmail] = useState<GmailConnection>(undefined as unknown as GmailConnection);
  const [gmailLoading, setGmailLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);

  // Writing Style
  const [ghostStyle, setGhostStyle] = useState<GhostStyle | undefined>(undefined);
  const [ghostLoading, setGhostLoading] = useState(true);
  const [sampleEmails, setSampleEmails] = useState(["", "", "", "", ""]);
  const [analyzing, setAnalyzing] = useState(false);
  const [ghostError, setGhostError] = useState<string | null>(null);
  const [isRetraining, setIsRetraining] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  // Company Profile
  const [cpLoading, setCpLoading]   = useState(true);
  const [cpSaving, setCpSaving]     = useState(false);
  const [cpSaved, setCpSaved]       = useState(false);
  const [cpName, setCpName]         = useState("");
  const [cpDesc, setCpDesc]         = useState("");
  const [cpCustomer, setCpCustomer] = useState("");
  const [cpValue, setCpValue]       = useState("");
  const [cpTone, setCpTone]         = useState("Professional");
  const [cpUrl, setCpUrl]           = useState("");
  const [cpDiff, setCpDiff]         = useState("");

  const gmailStatus = searchParams.get("gmail");

  useEffect(() => {
    fetch("/api/subscription")
      .then((r) => r.json())
      .then((d) => { setSub(d.subscription); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetch("/api/auth/gmail/status")
      .then((r) => r.json())
      .then((d) => { setGmail(d.connection ?? null); setGmailLoading(false); })
      .catch(() => setGmailLoading(false));
  }, [searchParams]);

  useEffect(() => {
    fetch("/api/ghostwriter")
      .then((r) => r.json())
      .then((d) => { setGhostStyle(d.style ?? null); setGhostLoading(false); })
      .catch(() => { setGhostStyle(null); setGhostLoading(false); });
  }, []);

  useEffect(() => {
    fetch("/api/company-profile")
      .then((r) => r.json())
      .then((d) => {
        const p = d.profile;
        if (p) {
          setCpName(p.company_name ?? "");
          setCpDesc(p.company_description ?? "");
          setCpCustomer(p.ideal_customer ?? "");
          setCpValue(p.value_proposition ?? "");
          setCpTone(p.tone ?? "Professional");
          setCpUrl(p.website_url ?? "");
          setCpDiff(p.differentiators ?? "");
        }
        setCpLoading(false);
      })
      .catch(() => setCpLoading(false));
  }, []);

  async function handleSaveCompanyProfile() {
    setCpSaving(true);
    setCpSaved(false);
    try {
      const res = await fetch("/api/company-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_name:        cpName,
          company_description: cpDesc,
          ideal_customer:      cpCustomer,
          value_proposition:   cpValue,
          tone:                cpTone,
          website_url:         cpUrl,
          differentiators:     cpDiff,
        }),
      });
      if (res.ok) {
        setCpSaved(true);
        setTimeout(() => setCpSaved(false), 3000);
      }
    } finally {
      setCpSaving(false);
    }
  }

  async function handleUpgrade(plan: string) {
    setUpgrading(plan);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else alert("Error: " + (data.error || "Unknown error"));
    } catch {
      alert("Something went wrong.");
    } finally {
      setUpgrading(null);
    }
  }

  async function handleDisconnect() {
    setDisconnecting(true);
    try {
      const res = await fetch("/api/auth/gmail/disconnect", { method: "POST" });
      if (res.ok) {
        setGmail(null);
        router.replace("/dashboard/settings");
      }
    } catch {
      alert("Failed to disconnect. Please try again.");
    } finally {
      setDisconnecting(false);
    }
  }

  async function handleAnalyzeStyle() {
    const filled = sampleEmails.filter((s) => s.trim());
    if (filled.length < 3) { setGhostError("Please provide at least 3 sample emails."); return; }
    setAnalyzing(true);
    setGhostError(null);
    try {
      const res = await fetch("/api/ghostwriter/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sample_emails: filled }),
      });
      const data = await res.json() as { ok?: boolean; style?: GhostStyle; error?: string };
      if (!res.ok) { setGhostError(data.error ?? "Analysis failed"); }
      else if (data.style) {
        setGhostStyle(data.style);
        setIsRetraining(false);
        setSampleEmails(["", "", "", "", ""]);
      }
    } catch { setGhostError("Network error — please try again."); }
    finally { setAnalyzing(false); }
  }

  async function handleRemoveStyle() {
    try {
      const res = await fetch("/api/ghostwriter", { method: "DELETE" });
      if (res.ok) { setGhostStyle(null); setIsRetraining(false); setSampleEmails(["", "", "", "", ""]); }
    } catch { /* silent */ }
  }

  const currentPlan = sub?.plan ?? "free";
  const creditsUsed = sub?.credits_used ?? 0;
  const creditsLimit = sub?.credits_limit ?? 10;
  const pct = Math.min(100, Math.round((creditsUsed / creditsLimit) * 100));
  const isProOrAgency = currentPlan === "pro" || currentPlan === "agency";
  const isAgency = currentPlan === "agency";

  return (
    <>
      {/* Header */}
      <header style={{
        padding: "0 32px",
        height: 68,
        display: "flex",
        alignItems: "center",
        borderBottom: "1px solid rgba(255,255,255,0.055)",
        backgroundColor: "rgba(6,6,6,0.94)",
        backdropFilter: "blur(12px)",
        position: "sticky",
        top: 0,
        zIndex: 30,
      }}>
        <div>
          <h1 style={{ fontSize: 16, fontWeight: 500, color: "#fff", fontFamily: "var(--font-syne)", letterSpacing: "-0.02em", lineHeight: 1 }}>
            Settings
          </h1>
          <p style={{ fontSize: 11, color: "#383838", fontFamily: "var(--font-outfit)", marginTop: 3 }}>
            Manage your account and billing
          </p>
        </div>
      </header>

      <div style={{ padding: "28px 32px 64px", maxWidth: 640 }}>

        {/* Gmail banner */}
        {gmailStatus === "connected" && !bannerDismissed && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
            padding: "10px 14px", borderRadius: 8, marginBottom: 20,
            backgroundColor: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.15)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Check size={13} strokeWidth={2} color="#4ade80" aria-hidden="true" />
              <span style={{ fontSize: 13, color: "#4ade80", fontFamily: "var(--font-outfit)" }}>
                Gmail connected successfully.
              </span>
            </div>
            <button
              onClick={() => { setBannerDismissed(true); router.replace("/dashboard/settings"); }}
              style={{ background: "none", border: "none", color: "#555", cursor: "pointer", padding: 2, display: "flex" }}
              aria-label="Dismiss"
            >
              <X size={14} strokeWidth={1.75} aria-hidden="true" />
            </button>
          </div>
        )}
        {gmailStatus === "error" && !bannerDismissed && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
            padding: "10px 14px", borderRadius: 8, marginBottom: 20,
            backgroundColor: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)",
          }}>
            <span style={{ fontSize: 13, color: "#f87171", fontFamily: "var(--font-outfit)" }}>
              Gmail connection failed. Please try again.
            </span>
            <button
              onClick={() => { setBannerDismissed(true); router.replace("/dashboard/settings"); }}
              style={{ background: "none", border: "none", color: "#555", cursor: "pointer", padding: 2, display: "flex" }}
              aria-label="Dismiss"
            >
              <X size={14} strokeWidth={1.75} aria-hidden="true" />
            </button>
          </div>
        )}

        {/* ── Company Profile ── */}
        <ScrollReveal>
          <SectionLabel icon={<Building2 size={12} strokeWidth={1.75} />}>Company Profile</SectionLabel>
          <SectionCard>
            {cpSaved && (
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "9px 12px", borderRadius: 7, marginBottom: 16,
                backgroundColor: "rgba(74,222,128,0.06)",
                border: "1px solid rgba(74,222,128,0.15)",
              }}>
                <Check size={12} color="#4ade80" strokeWidth={2} />
                <span style={{ fontSize: 12, color: "#4ade80", fontFamily: "var(--font-outfit)" }}>
                  Company profile saved.
                </span>
              </div>
            )}

            {cpLoading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "20px 0" }}>
                <Loader2 size={16} color="#333" style={{ animation: "spin 0.8s linear infinite" }} />
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {/* Company name + website */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 11, color: "#555", fontFamily: "var(--font-outfit)", marginBottom: 5 }}>
                      Company name
                    </label>
                    <input
                      value={cpName}
                      onChange={(e) => setCpName(e.target.value)}
                      placeholder="Acme Inc."
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 11, color: "#555", fontFamily: "var(--font-outfit)", marginBottom: 5 }}>
                      Website URL
                    </label>
                    <input
                      value={cpUrl}
                      onChange={(e) => setCpUrl(e.target.value)}
                      placeholder="https://acme.com"
                      style={inputStyle}
                    />
                  </div>
                </div>

                {/* What you do */}
                <div>
                  <label style={{ display: "block", fontSize: 11, color: "#555", fontFamily: "var(--font-outfit)", marginBottom: 5 }}>
                    What your company does
                  </label>
                  <textarea
                    value={cpDesc}
                    onChange={(e) => setCpDesc(e.target.value)}
                    placeholder="2-3 sentences describing your product or service..."
                    rows={2}
                    style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
                  />
                </div>

                {/* Ideal customer */}
                <div>
                  <label style={{ display: "block", fontSize: 11, color: "#555", fontFamily: "var(--font-outfit)", marginBottom: 5 }}>
                    Your ideal customer
                  </label>
                  <textarea
                    value={cpCustomer}
                    onChange={(e) => setCpCustomer(e.target.value)}
                    placeholder="Who are you trying to reach? e.g. SaaS founders at seed-stage startups..."
                    rows={2}
                    style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
                  />
                </div>

                {/* Value proposition */}
                <div>
                  <label style={{ display: "block", fontSize: 11, color: "#555", fontFamily: "var(--font-outfit)", marginBottom: 5 }}>
                    Your value proposition
                  </label>
                  <textarea
                    value={cpValue}
                    onChange={(e) => setCpValue(e.target.value)}
                    placeholder="What problem do you solve? What outcome do customers get?"
                    rows={2}
                    style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
                  />
                </div>

                {/* Key differentiators */}
                <div>
                  <label style={{ display: "block", fontSize: 11, color: "#555", fontFamily: "var(--font-outfit)", marginBottom: 5 }}>
                    Key differentiators
                  </label>
                  <textarea
                    value={cpDiff}
                    onChange={(e) => setCpDiff(e.target.value)}
                    placeholder="What makes you different from competitors?"
                    rows={2}
                    style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
                  />
                </div>

                {/* Tone + save */}
                <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: "block", fontSize: 11, color: "#555", fontFamily: "var(--font-outfit)", marginBottom: 5 }}>
                      Tone of voice
                    </label>
                    <select
                      value={cpTone}
                      onChange={(e) => setCpTone(e.target.value)}
                      style={{ ...inputStyle, cursor: "pointer" }}
                    >
                      {["Professional", "Friendly", "Direct", "Consultative", "Bold"].map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={handleSaveCompanyProfile}
                    disabled={cpSaving}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      padding: "8px 18px",
                      backgroundColor: "#FF5200", color: "#fff",
                      borderRadius: 6, border: "none", fontSize: 12,
                      fontFamily: "var(--font-outfit)", fontWeight: 500,
                      cursor: cpSaving ? "not-allowed" : "pointer",
                      opacity: cpSaving ? 0.6 : 1,
                      flexShrink: 0,
                    }}
                  >
                    {cpSaving && <Loader2 size={11} style={{ animation: "spin 0.8s linear infinite" }} />}
                    {cpSaving ? "Saving..." : "Save profile"}
                  </button>
                </div>
              </div>
            )}
          </SectionCard>
        </ScrollReveal>

        {/* ── Subscription ── */}
        <ScrollReveal>
          <SectionLabel icon={<CreditCard size={12} strokeWidth={1.75} />}>Subscription</SectionLabel>
          <SectionCard>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 18 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{
                    fontSize: 9, fontWeight: 600, color: "#FF5200",
                    backgroundColor: "rgba(255,82,0,0.08)",
                    border: "1px solid rgba(255,82,0,0.18)",
                    borderRadius: 999, padding: "2px 7px",
                    fontFamily: "var(--font-outfit)", textTransform: "uppercase", letterSpacing: "0.05em",
                  }}>
                    {loading ? "—" : currentPlan}
                  </span>
                </div>
                {sub?.current_period_end && (
                  <p style={{ fontSize: 11, color: "#444", fontFamily: "var(--font-outfit)" }}>
                    Renews {new Date(sub.current_period_end).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                  </p>
                )}
              </div>
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: "#555", fontFamily: "var(--font-outfit)" }}>Credits used this month</span>
                <span style={{ fontSize: 12, color: "#888", fontFamily: "var(--font-outfit)", fontVariantNumeric: "tabular-nums" } as React.CSSProperties}>
                  {loading ? "—" : `${creditsUsed} / ${creditsLimit === 999999 ? "∞" : creditsLimit}`}
                </span>
              </div>
              <div style={{ height: 3, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: 2,
                  width: `${creditsLimit === 999999 ? 5 : pct}%`,
                  backgroundColor: pct >= 90 ? "#ef4444" : "#FF5200",
                  transition: "width 0.6s ease",
                }} />
              </div>
              {pct >= 90 && creditsLimit !== 999999 && (
                <p style={{ fontSize: 11, color: "#ef4444", marginTop: 6, fontFamily: "var(--font-outfit)" }}>
                  Running low — upgrade to continue generating emails.
                </p>
              )}
            </div>
          </SectionCard>
        </ScrollReveal>

        {/* ── Email Accounts ── */}
        <ScrollReveal delay={0.06}>
          <SectionLabel icon={<Mail size={12} strokeWidth={1.75} />}>Email Accounts</SectionLabel>
          <SectionCard style={{ position: "relative", overflow: "hidden" }}>
            {/* Lock overlay */}
            {!isProOrAgency && (
              <div style={{
                position: "absolute", inset: 0, borderRadius: 10,
                backgroundColor: "rgba(6,6,6,0.88)",
                backdropFilter: "blur(4px)",
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", gap: 10,
                padding: 24, zIndex: 2,
              }}>
                <p style={{ fontSize: 13, fontWeight: 500, color: "#ccc", fontFamily: "var(--font-syne)", textAlign: "center" }}>
                  Gmail sending requires Pro
                </p>
                <button
                  onClick={() => {
                    const el = document.getElementById("plans-section");
                    el?.scrollIntoView({ behavior: "smooth" });
                  }}
                  style={{
                    padding: "7px 16px", backgroundColor: "#FF5200", color: "#fff",
                    borderRadius: 6, border: "none", fontSize: 12,
                    fontFamily: "var(--font-outfit)", cursor: "pointer",
                  }}
                >
                  View plans
                </button>
              </div>
            )}

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, opacity: isProOrAgency ? 1 : 0.15 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 9,
                  backgroundColor: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#555", flexShrink: 0,
                }}>
                  <Mail size={15} strokeWidth={1.5} aria-hidden="true" />
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 500, color: "#ccc", fontFamily: "var(--font-outfit)", marginBottom: 2 }}>Gmail</p>
                  <p style={{ fontSize: 12, color: "#555", fontFamily: "var(--font-outfit)" }}>
                    Send campaigns directly from your inbox
                  </p>
                </div>
              </div>

              {gmailLoading ? (
                <div style={{ width: 90, height: 30, backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 6 }} />
              ) : gmail ? (
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#4ade80", flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: "#666", fontFamily: "var(--font-outfit)" }}>
                      {gmail.gmail_email}
                    </span>
                  </div>
                  <button
                    onClick={handleDisconnect}
                    disabled={disconnecting}
                    style={{
                      display: "flex", alignItems: "center", gap: 5,
                      padding: "5px 10px", borderRadius: 6, fontSize: 12,
                      fontFamily: "var(--font-outfit)", cursor: "pointer",
                      backgroundColor: "transparent", color: "#f87171",
                      border: "1px solid rgba(239,68,68,0.2)",
                      opacity: disconnecting ? 0.6 : 1,
                    }}
                  >
                    {disconnecting && <Loader2 size={11} strokeWidth={2} style={{ animation: "spin 0.8s linear infinite" }} aria-hidden="true" />}
                    {disconnecting ? "Disconnecting…" : "Disconnect"}
                  </button>
                </div>
              ) : (
                <a
                  href="/api/auth/gmail"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "7px 14px", backgroundColor: "#FF5200", color: "#fff",
                    borderRadius: 6, fontSize: 12,
                    fontFamily: "var(--font-outfit)", textDecoration: "none",
                    flexShrink: 0,
                  }}
                >
                  <Mail size={12} strokeWidth={1.75} aria-hidden="true" />
                  Connect Gmail
                </a>
              )}
            </div>
          </SectionCard>
        </ScrollReveal>

        {/* ── Writing Style ── */}
        <ScrollReveal delay={0.1}>
          <SectionLabel icon={<Pen size={12} strokeWidth={1.75} />}>Writing Style</SectionLabel>
          <SectionCard style={{ position: "relative", overflow: "hidden" }}>
            {!isAgency && (
              <div style={{
                position: "absolute", inset: 0, borderRadius: 10,
                backgroundColor: "rgba(6,6,6,0.88)",
                backdropFilter: "blur(4px)",
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", gap: 10,
                padding: 24, zIndex: 2,
              }}>
                <p style={{ fontSize: 13, fontWeight: 500, color: "#ccc", fontFamily: "var(--font-syne)", textAlign: "center" }}>
                  Writing Style requires Agency
                </p>
                <p style={{ fontSize: 12, color: "#555", fontFamily: "var(--font-outfit)", textAlign: "center", maxWidth: 280, lineHeight: 1.5 }}>
                  Train AI on your emails — all campaigns will match your voice.
                </p>
                <button
                  onClick={() => {
                    const el = document.getElementById("plans-section");
                    el?.scrollIntoView({ behavior: "smooth" });
                  }}
                  style={{
                    padding: "7px 16px", backgroundColor: "#FF5200", color: "#fff",
                    borderRadius: 6, border: "none", fontSize: 12,
                    fontFamily: "var(--font-outfit)", cursor: "pointer",
                  }}
                >
                  View plans
                </button>
              </div>
            )}

            <div style={{ opacity: isAgency ? 1 : 0.15 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 9,
                  backgroundColor: "rgba(255,82,0,0.07)",
                  border: "1px solid rgba(255,82,0,0.15)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#FF5200", flexShrink: 0,
                }}>
                  <Sparkles size={15} strokeWidth={1.5} aria-hidden="true" />
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 500, color: "#ccc", fontFamily: "var(--font-outfit)", marginBottom: 2 }}>
                    AI Writing Style
                  </p>
                  <p style={{ fontSize: 12, color: "#555", fontFamily: "var(--font-outfit)" }}>
                    Agency only — trains on your emails
                  </p>
                </div>
              </div>

              {ghostLoading ? (
                <div style={{ color: "#444", fontFamily: "var(--font-outfit)", fontSize: 13, display: "flex", alignItems: "center", gap: 7 }}>
                  <Loader2 size={13} strokeWidth={2} style={{ animation: "spin 0.8s linear infinite" }} aria-hidden="true" />
                  Loading…
                </div>
              ) : ghostStyle && !isRetraining ? (
                <div>
                  <div style={{
                    padding: "14px 16px",
                    borderRadius: 8,
                    backgroundColor: "rgba(255,82,0,0.03)",
                    border: "1px solid rgba(255,82,0,0.1)",
                    marginBottom: 12,
                  }}>
                    <p style={{ fontSize: 10, fontWeight: 500, color: "rgba(255,82,0,0.6)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6, fontFamily: "var(--font-outfit)" }}>
                      Style configured
                    </p>
                    <p style={{ fontSize: 13, color: "#888", fontFamily: "var(--font-outfit)", lineHeight: 1.6 }}>
                      {ghostStyle.style_summary}
                    </p>
                  </div>
                  {ghostStyle.tone_keywords && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 14 }}>
                      {ghostStyle.tone_keywords.split(",").map((kw) => kw.trim()).filter(Boolean).map((kw) => (
                        <span key={kw} style={{
                          fontSize: 11, padding: "3px 9px", borderRadius: 5,
                          backgroundColor: "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(255,255,255,0.07)",
                          color: "#666", fontFamily: "var(--font-outfit)",
                        }}>
                          {kw}
                        </span>
                      ))}
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => setIsRetraining(true)}
                      style={{
                        padding: "6px 13px", borderRadius: 6, fontSize: 12,
                        fontFamily: "var(--font-outfit)", cursor: "pointer",
                        backgroundColor: "transparent", color: "#888",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      Retrain
                    </button>
                    <button
                      onClick={handleRemoveStyle}
                      style={{
                        padding: "6px 13px", borderRadius: 6, fontSize: 12,
                        fontFamily: "var(--font-outfit)", cursor: "pointer",
                        backgroundColor: "transparent", color: "#f87171",
                        border: "1px solid rgba(239,68,68,0.15)",
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <p style={{ fontSize: 12, color: "#555", fontFamily: "var(--font-outfit)", lineHeight: 1.6, marginBottom: 14 }}>
                    Paste 3–5 emails you have written. AI will learn your tone and vocabulary.
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
                    {sampleEmails.map((val, i) => (
                      <div key={i}>
                        <label style={{
                          fontSize: 10, fontWeight: 500, color: "#444",
                          textTransform: "uppercase", letterSpacing: "0.06em",
                          display: "block", marginBottom: 4, fontFamily: "var(--font-outfit)",
                        }}>
                          Sample {i + 1}{i < 3 ? " *" : " (optional)"}
                        </label>
                        <textarea
                          value={val}
                          onChange={(e) => setSampleEmails((prev) => prev.map((v, j) => j === i ? e.target.value : v))}
                          placeholder={i === 0 ? "Paste an email you wrote — subject + body works best" : "Paste an email you wrote"}
                          rows={3}
                          style={{ ...inputStyle, lineHeight: 1.6, resize: "vertical" }}
                        />
                      </div>
                    ))}
                  </div>
                  {ghostError && (
                    <p style={{ fontSize: 12, color: "#f87171", fontFamily: "var(--font-outfit)", marginBottom: 12 }}>
                      {ghostError}
                    </p>
                  )}
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={handleAnalyzeStyle}
                      disabled={analyzing}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 6,
                        padding: "8px 16px", borderRadius: 6,
                        backgroundColor: analyzing ? "rgba(255,82,0,0.4)" : "#FF5200",
                        color: "#fff", border: "none",
                        fontSize: 12, fontFamily: "var(--font-outfit)",
                        cursor: analyzing ? "not-allowed" : "pointer",
                      }}
                    >
                      {analyzing && <Loader2 size={12} strokeWidth={2} style={{ animation: "spin 0.8s linear infinite" }} aria-hidden="true" />}
                      {analyzing ? "Analyzing…" : "Analyze style"}
                    </button>
                    {isRetraining && (
                      <button
                        onClick={() => { setIsRetraining(false); setGhostError(null); }}
                        style={{
                          padding: "8px 14px", borderRadius: 6,
                          backgroundColor: "transparent", color: "#666",
                          border: "1px solid rgba(255,255,255,0.08)",
                          fontSize: 12, fontFamily: "var(--font-outfit)", cursor: "pointer",
                        }}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </SectionCard>
        </ScrollReveal>

        {/* ── Plans ── */}
        <ScrollReveal delay={0.14}>
          <SectionLabel icon={<Package size={12} strokeWidth={1.75} />}>
            <span id="plans-section">Available Plans</span>
          </SectionLabel>
          <StaggerList style={{ display: "flex", flexDirection: "column", gap: 8 }} delay={0.18}>
            {(Object.entries(PLANS) as [PlanKey, typeof PLANS[keyof typeof PLANS]][]).map(([key, plan]) => {
              const isCurrent = currentPlan === key;
              const tier = ["free", "starter", "pro", "agency"];
              const isDowngrade = tier.indexOf(key) < tier.indexOf(currentPlan as string);

              return (
                <StaggerItem key={key}>
                  <div style={{
                    backgroundColor: "#0e0e0e",
                    border: `1px solid ${isCurrent ? "rgba(255,82,0,0.3)" : "rgba(255,255,255,0.06)"}`,
                    borderRadius: 10,
                    padding: "16px 20px",
                    display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
                    position: "relative",
                    overflow: "hidden",
                  }}>
                    {isCurrent && (
                      <div style={{
                        position: "absolute", top: 0, left: 0, bottom: 0,
                        width: 3, backgroundColor: "#FF5200", borderRadius: "10px 0 0 10px",
                      }} />
                    )}
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                        backgroundColor: isCurrent ? "rgba(255,82,0,0.08)" : "rgba(255,255,255,0.04)",
                        border: `1px solid ${isCurrent ? "rgba(255,82,0,0.15)" : "rgba(255,255,255,0.06)"}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: isCurrent ? "#FF5200" : "#555",
                      }}>
                        <PlanIcon plan={key} />
                      </div>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                          <span style={{ fontSize: 13, fontWeight: 500, color: isCurrent ? "#ddd" : "#888", fontFamily: "var(--font-outfit)" }}>
                            {plan.name}
                          </span>
                          {isCurrent && (
                            <span style={{
                              fontSize: 9, fontWeight: 600, color: "#FF5200",
                              backgroundColor: "rgba(255,82,0,0.08)",
                              border: "1px solid rgba(255,82,0,0.18)",
                              borderRadius: 999, padding: "1px 6px",
                              fontFamily: "var(--font-outfit)", textTransform: "uppercase", letterSpacing: "0.06em",
                            }}>
                              Current
                            </span>
                          )}
                        </div>
                        <p style={{ fontSize: 12, color: "#444", fontFamily: "var(--font-outfit)" }}>
                          {plan.credits === 999999 ? "Unlimited" : String(plan.credits)} credits/month
                        </p>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
                      <span style={{ fontSize: 18, fontWeight: 600, color: isCurrent ? "#ccc" : "#555", fontFamily: "var(--font-syne)", fontVariantNumeric: "tabular-nums" } as React.CSSProperties}>
                        ${plan.price}
                        <span style={{ fontSize: 11, fontWeight: 400, color: "#444" }}>/mo</span>
                      </span>
                      {!isCurrent && !isDowngrade && (
                        <button
                          onClick={() => handleUpgrade(key)}
                          disabled={upgrading === key}
                          style={{
                            display: "inline-flex", alignItems: "center", gap: 5,
                            padding: "7px 14px", backgroundColor: "#FF5200", color: "#fff",
                            borderRadius: 6, border: "none", fontSize: 12,
                            fontFamily: "var(--font-outfit)", cursor: upgrading === key ? "not-allowed" : "pointer",
                            opacity: upgrading === key ? 0.6 : 1,
                          }}
                        >
                          {upgrading === key
                            ? <Loader2 size={11} strokeWidth={2} style={{ animation: "spin 0.8s linear infinite" }} aria-hidden="true" />
                            : <ChevronRight size={11} strokeWidth={2} aria-hidden="true" />
                          }
                          {upgrading === key ? "Processing…" : "Upgrade"}
                        </button>
                      )}
                    </div>
                  </div>
                </StaggerItem>
              );
            })}
          </StaggerList>
        </ScrollReveal>

        {/* ── Quick Access ── */}
        <ScrollReveal delay={0.12}>
          <SectionLabel>Quick Access</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { label: "Analytics", desc: "View open rates, clicks, and campaign performance", href: "/dashboard/analytics", icon: <BarChart3 size={14} strokeWidth={1.75} /> },
              { label: "Follow-ups", desc: "Manage automated follow-up sequences", href: "/dashboard/followups", icon: <Repeat size={14} strokeWidth={1.75} /> },
              { label: "Lead Research", desc: "AI-powered signals for smarter outreach", href: "/dashboard/signals", icon: <Search size={14} strokeWidth={1.75} /> },
            ].map(({ label, desc, href, icon }) => (
              <Link key={href} href={href} style={{ textDecoration: "none" }}>
                <div style={{
                  backgroundColor: "#0e0e0e",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 8,
                  padding: "14px 16px",
                  display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
                  cursor: "pointer",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 7, flexShrink: 0,
                      backgroundColor: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "#555",
                    }}>
                      {icon}
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 500, color: "#ccc", fontFamily: "var(--font-outfit)", marginBottom: 2 }}>{label}</p>
                      <p style={{ fontSize: 12, color: "#555", fontFamily: "var(--font-outfit)" }}>{desc}</p>
                    </div>
                  </div>
                  <ChevronRight size={14} color="#333" strokeWidth={1.75} />
                </div>
              </Link>
            ))}
          </div>
        </ScrollReveal>

      </div>
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  return (
    <Suspense>
      <SettingsInner />
    </Suspense>
  );
}
