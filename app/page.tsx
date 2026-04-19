import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import LandingDemo from "./_landing/demo";
import LandingCTA from "./_landing/cta";

export const metadata = {
  title: "Nexora Outreach — AI Cold Email at Scale",
  description: "Generate 100 hyper-personalized cold emails in 60 seconds. Upload your leads, pick a tone, export instantly.",
};

// ─── Icon helpers (inline SVG — no client bundle cost) ────────────────────────

function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 8l3.5 3.5L13 4.5" stroke="#FF5200" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowRight() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <div style={{ backgroundColor: "#060606", minHeight: "100dvh", color: "#fff", fontFamily: "var(--font-outfit)", overflowX: "hidden" }}>

      {/* ─── NAVBAR ─────────────────────────────────────────────────────────── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        height: 64,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 clamp(20px, 4vw, 56px)",
        backgroundColor: "rgba(6,6,6,0.9)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.055)",
      }}>
        {/* Logo */}
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            backgroundColor: "#FF5200",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="15" height="15" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M2 12V2h2.5l5.5 7V2H12v10h-2.5L4 5v7H2z" fill="white" />
            </svg>
          </div>
          <span style={{ fontSize: 14, fontWeight: 600, color: "#fff", fontFamily: "var(--font-syne)", letterSpacing: "-0.02em" }}>
            Nexora
          </span>
        </Link>

        {/* Center links */}
        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          {[["How it works", "#how"], ["Features", "#features"], ["Pricing", "#pricing"]].map(([label, href]) => (
            <a
              key={label}
              href={href as string}
              className="landing-nav-link"
              style={{ fontSize: 13, color: "rgba(255,255,255,0.42)", textDecoration: "none" }}
            >
              {label}
            </a>
          ))}
        </div>

        {/* Auth */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/login" style={{ fontSize: 13, color: "rgba(255,255,255,0.38)", textDecoration: "none" }}>
            Sign in
          </Link>
          <Link href="/signup" style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            fontSize: 13, fontWeight: 500,
            padding: "7px 18px",
            backgroundColor: "#FF5200", color: "#fff",
            borderRadius: 7, textDecoration: "none",
            transition: "background-color 0.15s ease",
          }}>
            Get started
          </Link>
        </div>
      </nav>

      {/* ─── HERO ───────────────────────────────────────────────────────────── */}
      <section style={{
        paddingTop: "clamp(130px, 18vw, 180px)",
        paddingBottom: "clamp(64px, 8vw, 100px)",
        paddingLeft: "clamp(20px, 4vw, 56px)",
        paddingRight: "clamp(20px, 4vw, 56px)",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Ambient glow */}
        <div style={{
          position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
          width: "60vw", height: "40vw", maxWidth: 900, maxHeight: 600,
          background: "radial-gradient(ellipse at center, rgba(255,82,0,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        {/* Eyebrow */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 7,
          padding: "4px 14px", borderRadius: 999,
          backgroundColor: "rgba(255,82,0,0.08)",
          border: "1px solid rgba(255,82,0,0.2)",
          marginBottom: 28, position: "relative",
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#FF5200", flexShrink: 0, display: "block" }} />
          <span style={{ fontSize: 11, fontWeight: 500, color: "#FF5200", letterSpacing: "0.06em", textTransform: "uppercase" }}>
            Your AI Outreach Agent
          </span>
        </div>

        {/* Headline */}
        <h1 style={{
          fontSize: "clamp(38px, 7vw, 80px)",
          fontWeight: 500,
          lineHeight: 1.06,
          fontFamily: "var(--font-syne)",
          maxWidth: 860, margin: "0 auto 20px",
          letterSpacing: "-0.03em",
          position: "relative",
        }}>
          Tell Nexora what you need.{" "}
          <span style={{ color: "#FF5200" }}>It handles the rest.</span>
        </h1>

        {/* Subheading */}
        <p style={{
          fontSize: "clamp(14px, 1.8vw, 17px)",
          color: "rgba(255,255,255,0.38)",
          maxWidth: 500, margin: "0 auto 40px",
          lineHeight: 1.8,
          position: "relative",
        }}>
          Nexora researches your leads, drafts hyper-personalized emails, sends follow-ups, and tracks results — all from a single agent prompt.
        </p>

        {/* CTAs */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, flexWrap: "wrap", position: "relative" }}>
          <Link href="/signup" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "12px 26px",
            backgroundColor: "#FF5200", color: "#fff",
            borderRadius: 7, fontSize: 13, fontWeight: 500,
            textDecoration: "none", fontFamily: "var(--font-outfit)",
            transition: "background-color 0.15s ease",
          }}>
            Try the agent free
            <ArrowRight />
          </Link>
          <a href="#how" style={{
            display: "inline-flex", alignItems: "center",
            padding: "12px 22px",
            color: "rgba(255,255,255,0.38)", fontSize: 13,
            textDecoration: "none",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 7,
            transition: "border-color 0.15s ease, color 0.15s ease",
          }}>
            See how it works
          </a>
        </div>

        {/* Hero demo */}
        <div style={{ marginTop: 64, maxWidth: 900, marginInline: "auto", position: "relative" }}>
          <div style={{
            position: "absolute", inset: -1, borderRadius: 18,
            background: "linear-gradient(135deg, rgba(255,82,0,0.2) 0%, transparent 55%)",
            filter: "blur(32px)", zIndex: 0, pointerEvents: "none",
          }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <LandingDemo />
          </div>
        </div>
      </section>

      {/* ─── SOCIAL PROOF BAR ───────────────────────────────────────────────── */}
      <section style={{
        borderTop: "1px solid rgba(255,255,255,0.05)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        backgroundColor: "#0a0a0a",
        padding: "44px clamp(20px, 4vw, 56px)",
      }}>
        <div style={{
          maxWidth: 900, margin: "0 auto",
          display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
          gap: 24, textAlign: "center",
        }}>
          {[
            { value: "500+", label: "Campaigns created" },
            { value: "10×",  label: "Faster than manual" },
            { value: "85%",  label: "Higher open rates" },
            { value: "60s",  label: "Per 100 emails" },
          ].map((s) => (
            <div key={s.label}>
              <div style={{
                fontSize: "clamp(28px, 4.5vw, 44px)", fontWeight: 700,
                color: "#FF5200", fontFamily: "var(--font-syne)", lineHeight: 1,
              }}>
                {s.value}
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.32)", marginTop: 7, fontFamily: "var(--font-outfit)" }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── HOW IT WORKS ───────────────────────────────────────────────────── */}
      <section id="how" style={{ padding: "100px clamp(20px, 4vw, 56px)", maxWidth: 1040, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 60 }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", color: "#FF5200", textTransform: "uppercase", marginBottom: 12 }}>
            How it works
          </p>
          <h2 style={{
            fontSize: "clamp(26px, 4.5vw, 46px)", fontWeight: 700,
            fontFamily: "var(--font-syne)", maxWidth: 560, margin: "0 auto",
            lineHeight: 1.1, letterSpacing: "-0.025em",
          }}>
            From spreadsheet to inbox in three steps
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
          {[
            {
              n: "01",
              title: "Upload your leads",
              desc: "Drop in a CSV with name, company, role, email, and an optional note. Auto-detects any column format — no reformatting needed.",
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                </svg>
              ),
            },
            {
              n: "02",
              title: "Choose your tone",
              desc: "Professional, Friendly, Bold, or Minimal. Nexora matches your brand voice exactly — no prompt engineering required.",
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
              ),
            },
            {
              n: "03",
              title: "Review and export",
              desc: "Every email is generated in seconds. Review inline, edit anything, then export to CSV or send directly via Gmail.",
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M16 12l-4 4-4-4M12 16V4" />
                </svg>
              ),
            },
          ].map((item) => (
            <div key={item.n} style={{
              backgroundColor: "#0e0e0e",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 12,
              padding: "32px 28px",
              position: "relative", overflow: "hidden",
            }}>
              {/* Step number watermark */}
              <div style={{
                position: "absolute", top: 12, right: 18,
                fontSize: 56, fontWeight: 700, color: "rgba(255,82,0,0.04)",
                fontFamily: "var(--font-syne)", lineHeight: 1, userSelect: "none",
                pointerEvents: "none",
              }}>
                {item.n}
              </div>

              <div style={{
                width: 44, height: 44, borderRadius: 10,
                backgroundColor: "rgba(255,82,0,0.08)", color: "#FF5200",
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: 20,
              }}>
                {item.icon}
              </div>
              <h3 style={{
                fontSize: 16, fontWeight: 600,
                fontFamily: "var(--font-syne)", marginBottom: 10,
                letterSpacing: "-0.015em",
              }}>
                {item.title}
              </h3>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.75 }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── COMPARISON TABLE ───────────────────────────────────────────────── */}
      <section style={{ padding: "72px clamp(20px, 4vw, 56px)", backgroundColor: "#080808" }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", color: "#FF5200", textTransform: "uppercase", marginBottom: 12 }}>
              Why not ChatGPT?
            </p>
            <h2 style={{
              fontSize: "clamp(24px, 4vw, 40px)", fontWeight: 700,
              fontFamily: "var(--font-syne)", letterSpacing: "-0.025em",
            }}>
              Built for outreach, not prompts
            </h2>
          </div>

          <div style={{ border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr", backgroundColor: "#0f0f0f" }}>
              {[
                { label: "Feature", style: {} },
                { label: "ChatGPT", style: { borderLeft: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.22)" } },
                { label: "Nexora", style: { borderLeft: "1px solid rgba(255,255,255,0.06)", color: "#FF5200", backgroundColor: "rgba(255,82,0,0.05)" } },
              ].map((h) => (
                <div key={h.label} style={{ padding: "14px 20px", fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)", ...h.style }}>
                  {h.label}
                </div>
              ))}
            </div>
            {[
              ["CSV lead import",          "Manual copy-paste",      "Native support"],
              ["Bulk generation",          "One at a time",          "100+ in 60 seconds"],
              ["Per-lead personalization", "With effort",            "Fully automatic"],
              ["Export to CSV",            "Not available",          "One-click export"],
              ["Campaign history",         "None",                   "Full dashboard"],
              ["Credit tracking",          "None",                   "Built-in"],
            ].map(([feat, chatgpt, nexora], i) => (
              <div key={feat} style={{
                display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr",
                borderTop: "1px solid rgba(255,255,255,0.05)",
                backgroundColor: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)",
              }}>
                <div style={{ padding: "13px 20px", fontSize: 13, color: "rgba(255,255,255,0.65)" }}>{feat}</div>
                <div style={{ padding: "13px 20px", fontSize: 13, color: "rgba(255,255,255,0.28)", borderLeft: "1px solid rgba(255,255,255,0.05)" }}>{chatgpt}</div>
                <div style={{ padding: "13px 20px", fontSize: 13, color: "#FF5200", borderLeft: "1px solid rgba(255,255,255,0.05)", backgroundColor: "rgba(255,82,0,0.02)" }}>{nexora}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES ───────────────────────────────────────────────────────── */}
      <section id="features" style={{ padding: "100px clamp(20px, 4vw, 56px)", maxWidth: 1040, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", color: "#FF5200", textTransform: "uppercase", marginBottom: 12 }}>
            Features
          </p>
          <h2 style={{
            fontSize: "clamp(26px, 4.5vw, 46px)", fontWeight: 700,
            fontFamily: "var(--font-syne)", maxWidth: 580, margin: "0 auto",
            lineHeight: 1.1, letterSpacing: "-0.025em",
          }}>
            Everything you need to close more deals
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))", gap: 14 }}>
          {[
            { title: "Smart CSV import",         desc: "Upload any lead list. Auto-detects name, company, role, email, and custom note columns — no formatting required." },
            { title: "Hyper-personalization",    desc: "Every email opens with a sentence specific to that lead's situation — not just their name, but their full context." },
            { title: "Four writing tones",       desc: "Professional, Friendly, Bold, or Minimal. Each generates a distinctly different email that matches your brand voice." },
            { title: "Inline review and edit",   desc: "See every generated email before exporting. Click to edit any subject line or body copy directly in the interface." },
            { title: "Instant CSV export",       desc: "Download your campaign as a spreadsheet-ready CSV with all leads, subjects, and email bodies in one file." },
            { title: "Campaign history",         desc: "Every campaign is saved automatically. Return anytime to review, re-export, or draw on past campaigns for inspiration." },
          ].map((f) => (
            <div key={f.title} style={{
              backgroundColor: "#0e0e0e",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 10, padding: "24px 22px",
              transition: "border-color 0.18s ease",
            }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", backgroundColor: "#FF5200", marginBottom: 18 }} />
              <h3 style={{ fontSize: 14, fontWeight: 600, fontFamily: "var(--font-syne)", marginBottom: 8, letterSpacing: "-0.01em" }}>
                {f.title}
              </h3>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.38)", lineHeight: 1.75 }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── PRICING ────────────────────────────────────────────────────────── */}
      <section id="pricing" style={{ padding: "100px clamp(20px, 4vw, 56px)", backgroundColor: "#080808" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", color: "#FF5200", textTransform: "uppercase", marginBottom: 12 }}>
              Pricing
            </p>
            <h2 style={{
              fontSize: "clamp(26px, 4.5vw, 46px)", fontWeight: 700,
              fontFamily: "var(--font-syne)", maxWidth: 520, margin: "0 auto",
              lineHeight: 1.1, letterSpacing: "-0.025em",
            }}>
              Simple, transparent pricing
            </h2>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.35)", marginTop: 12 }}>
              Start free. Scale when you&apos;re ready.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 14, alignItems: "start" }}>
            {[
              {
                name: "Free", price: "$0", period: "/mo", tag: null, highlight: false,
                desc: "Try the core product",
                credits: "10 emails / month",
                features: ["10 email credits", "CSV import", "3 writing tones", "CSV export", "Campaign history"],
                cta: "Get started",
              },
              {
                name: "Starter", price: "$19", period: "/mo", tag: null, highlight: false,
                desc: "For individual sellers",
                credits: "300 emails / month",
                features: ["300 email credits", "All 4 writing tones", "CSV export", "Full campaign history"],
                cta: "Get started",
              },
              {
                name: "Pro", price: "$49", period: "/mo", tag: "Most popular", highlight: true,
                desc: "For serious SDR teams",
                credits: "1,000 emails / month",
                features: ["1,000 email credits", "All 4 writing tones", "CSV export", "Priority generation", "Early feature access"],
                cta: "Get started",
              },
              {
                name: "Agency", price: "$99", period: "/mo", tag: null, highlight: false,
                desc: "For agencies at scale",
                credits: "Unlimited emails",
                features: ["Unlimited credits", "All export formats", "White-label ready", "Early feature access"],
                cta: "Get started",
              },
            ].map((plan) => (
              <div key={plan.name} style={{
                backgroundColor: "#0e0e0e",
                border: `1px solid ${plan.highlight ? "rgba(255,82,0,0.45)" : "rgba(255,255,255,0.07)"}`,
                borderRadius: 12, padding: "28px 22px",
                position: "relative",
              }}>
                {plan.tag && (
                  <div style={{
                    position: "absolute", top: -11, left: "50%", transform: "translateX(-50%)",
                    backgroundColor: "#FF5200", color: "#fff",
                    fontSize: 10, fontWeight: 700,
                    padding: "3px 14px", borderRadius: 999,
                    whiteSpace: "nowrap", letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}>
                    {plan.tag}
                  </div>
                )}

                <p style={{ fontSize: 11, fontWeight: 700, color: plan.highlight ? "#FF5200" : "rgba(255,255,255,0.35)", marginBottom: 5, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  {plan.name}
                </p>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginBottom: 16 }}>
                  {plan.desc}
                </p>

                <div style={{ display: "flex", alignItems: "baseline", gap: 3, marginBottom: 3 }}>
                  <span style={{ fontSize: 36, fontWeight: 700, fontFamily: "var(--font-syne)", color: "#fff", lineHeight: 1 }}>
                    {plan.price}
                  </span>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>{plan.period}</span>
                </div>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.22)", marginBottom: 22 }}>{plan.credits}</p>

                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 9, marginBottom: 24 }}>
                  {plan.features.map((f) => (
                    <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12.5, color: "rgba(255,255,255,0.55)", lineHeight: 1.4 }}>
                      <span style={{ flexShrink: 0, marginTop: 1 }}><CheckIcon /></span>
                      {f}
                    </li>
                  ))}
                </ul>

                <Link href="/signup" style={{
                  display: "block", textAlign: "center",
                  padding: "10px 0", borderRadius: 7,
                  fontSize: 13, fontWeight: 600,
                  fontFamily: "var(--font-syne)",
                  textDecoration: "none",
                  backgroundColor: plan.highlight ? "#FF5200" : "rgba(255,255,255,0.05)",
                  color: plan.highlight ? "#fff" : "rgba(255,255,255,0.55)",
                  border: plan.highlight ? "none" : "1px solid rgba(255,255,255,0.08)",
                  transition: "background-color 0.15s ease",
                }}>
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ──────────────────────────────────────────────────────── */}
      <section style={{
        padding: "110px clamp(20px, 4vw, 56px)",
        textAlign: "center",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)",
          width: "60vw", height: "50vw", maxWidth: 900, maxHeight: 600,
          background: "radial-gradient(ellipse at center bottom, rgba(255,82,0,0.10) 0%, transparent 65%)",
          pointerEvents: "none",
        }} />
        <div style={{ maxWidth: 560, margin: "0 auto", position: "relative" }}>
          <h2 style={{
            fontSize: "clamp(30px, 5.5vw, 56px)", fontWeight: 700,
            fontFamily: "var(--font-syne)",
            marginBottom: 16, lineHeight: 1.08, letterSpacing: "-0.03em",
          }}>
            Ready to fill your pipeline?
          </h2>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.4)", marginBottom: 40, lineHeight: 1.75 }}>
            Join sales teams generating hundreds of personalized cold emails every day — in minutes, not hours.
          </p>
          <LandingCTA />
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.18)", marginTop: 16 }}>
            No credit card required &nbsp;·&nbsp; 10 free emails on signup
          </p>
        </div>
      </section>

      {/* ─── FOOTER ─────────────────────────────────────────────────────────── */}
      <footer style={{
        borderTop: "1px solid rgba(255,255,255,0.05)",
        padding: "24px clamp(20px, 4vw, 56px)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: 16,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 22, height: 22, borderRadius: 5, backgroundColor: "#FF5200", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="11" height="11" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M2 12V2h2.5l5.5 7V2H12v10h-2.5L4 5v7H2z" fill="white" />
            </svg>
          </div>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.22)", fontFamily: "var(--font-outfit)" }}>
            © {new Date().getFullYear()} Nexora Studios
          </span>
        </div>

        <div style={{ display: "flex", gap: 24 }}>
          {[["How it works", "#how"], ["Features", "#features"], ["Pricing", "#pricing"]].map(([l, h]) => (
            <a key={l} href={h as string} style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", textDecoration: "none" }}>
              {l}
            </a>
          ))}
        </div>

        <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
          <Link href="/login"  style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", textDecoration: "none" }}>Sign in</Link>
          <Link href="/signup" style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", textDecoration: "none" }}>Sign up</Link>
        </div>
      </footer>

    </div>
  );
}
