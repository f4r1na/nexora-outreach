import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import LandingDemo from "./_landing/demo";
import LandingCTA from "./_landing/cta";

export const metadata = {
  title: "Nexora Outreach — AI Cold Email at Scale",
  description: "Generate 100 hyper-personalized cold emails in 60 seconds. Upload your leads, pick a tone, export instantly.",
};

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <div style={{ backgroundColor: "#060606", minHeight: "100vh", color: "#fff", fontFamily: "var(--font-outfit)", overflowX: "hidden" }}>

      {/* ─────────────────────────── NAVBAR ─────────────────────────── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        height: 66, display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 clamp(20px, 5vw, 60px)",
        backgroundColor: "rgba(6,6,6,0.88)", backdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}>
        {/* Logo */}
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <svg width="34" height="34" viewBox="0 0 48 48" fill="none">
            <rect width="48" height="48" rx="10" fill="#FF5200" />
            <path d="M13 36V12h4.5l13 16.5V12H35v24h-4.5L17.5 19.5V36H13z" fill="white" />
          </svg>
          <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: "0.14em", color: "#fff", fontFamily: "var(--font-syne)" }}>NEXORA</span>
        </Link>

        {/* Nav links */}
        <div style={{ display: "flex", alignItems: "center", gap: 36 }}>
          {[["How it works", "#how"], ["Features", "#features"], ["Pricing", "#pricing"]].map(([label, href]) => (
            <a key={label} href={href} style={{ fontSize: 13, color: "rgba(255,255,255,0.48)", textDecoration: "none" }}>
              {label}
            </a>
          ))}
        </div>

        {/* Auth CTA */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Link href="/login" style={{ fontSize: 13, color: "rgba(255,255,255,0.42)", textDecoration: "none" }}>Sign in</Link>
          <Link href="/signup" style={{
            fontSize: 13, fontWeight: 700, padding: "8px 20px",
            backgroundColor: "#FF5200", color: "#fff", borderRadius: 8,
            textDecoration: "none", letterSpacing: "0.01em",
          }}>
            Get Early Access
          </Link>
        </div>
      </nav>

      {/* ─────────────────────────── HERO ─────────────────────────── */}
      <section style={{
        paddingTop: "clamp(120px, 16vw, 160px)",
        paddingBottom: "clamp(60px, 8vw, 100px)",
        paddingLeft: "clamp(20px, 5vw, 60px)",
        paddingRight: "clamp(20px, 5vw, 60px)",
        textAlign: "center",
        background: "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(255,82,0,0.18) 0%, transparent 65%)",
        position: "relative",
      }}>
        {/* Eyebrow */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 28,
          padding: "5px 16px", borderRadius: 999,
          backgroundColor: "rgba(255,82,0,0.1)", border: "1px solid rgba(255,82,0,0.22)",
        }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: "#FF5200", display: "inline-block", flexShrink: 0 }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: "#FF5200", letterSpacing: "0.05em" }}>AI-POWERED COLD OUTREACH</span>
        </div>

        {/* Headline */}
        <h1 style={{
          fontSize: "clamp(38px, 7vw, 80px)", fontWeight: 900, lineHeight: 1.05,
          fontFamily: "var(--font-syne)", maxWidth: 860, margin: "0 auto 22px",
          letterSpacing: "-0.03em",
        }}>
          100 Personalized Cold Emails.{" "}
          <span style={{ color: "#FF5200", display: "inline" }}>60 Seconds.</span>
        </h1>

        {/* Sub */}
        <p style={{
          fontSize: "clamp(15px, 2.2vw, 19px)", color: "rgba(255,255,255,0.48)",
          maxWidth: 540, margin: "0 auto 44px", lineHeight: 1.75,
        }}>
          Upload your lead list, pick a tone, and watch Nexora write hyper-personalized
          cold emails for every prospect — instantly.
        </p>

        {/* Buttons */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
          <Link href="/signup" style={{
            display: "inline-flex", alignItems: "center", gap: 9,
            padding: "14px 32px", backgroundColor: "#FF5200", color: "#fff",
            borderRadius: 10, fontSize: 15, fontWeight: 800, textDecoration: "none",
            fontFamily: "var(--font-syne)", letterSpacing: "0.01em",
          }}>
            Start Free — No Credit Card
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <a href="#how" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "14px 24px", color: "rgba(255,255,255,0.5)", fontSize: 14,
            textDecoration: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10,
          }}>
            See how it works
          </a>
        </div>

        {/* Demo panel */}
        <div style={{ marginTop: 72, maxWidth: 860, marginInline: "auto", position: "relative" }}>
          {/* Glow */}
          <div style={{
            position: "absolute", inset: -1, borderRadius: 20,
            background: "linear-gradient(135deg, rgba(255,82,0,0.3) 0%, transparent 60%)",
            filter: "blur(40px)", zIndex: 0,
          }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <LandingDemo />
          </div>
        </div>
      </section>

      {/* ─────────────────────────── STATS ─────────────────────────── */}
      <section style={{
        borderTop: "1px solid rgba(255,255,255,0.055)", borderBottom: "1px solid rgba(255,255,255,0.055)",
        backgroundColor: "#0b0b0b", padding: "48px clamp(20px, 5vw, 60px)",
      }}>
        <div style={{ maxWidth: 960, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24, textAlign: "center" }}>
          {[
            { value: "500+", label: "Campaigns Created" },
            { value: "10×", label: "Faster Than Manual" },
            { value: "85%", label: "Open Rate Lift" },
            { value: "60s", label: "Per 100 Emails" },
          ].map((s) => (
            <div key={s.label}>
              <div style={{ fontSize: "clamp(32px, 5vw, 48px)", fontWeight: 900, color: "#FF5200", fontFamily: "var(--font-syne)", lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.38)", marginTop: 8 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────────────────────── HOW IT WORKS ─────────────────────────── */}
      <section id="how" style={{ padding: "110px clamp(20px, 5vw, 60px)", maxWidth: 1060, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 70 }}>
          <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.15em", color: "#FF5200", textTransform: "uppercase", marginBottom: 14 }}>How It Works</p>
          <h2 style={{ fontSize: "clamp(28px, 4.5vw, 48px)", fontWeight: 900, fontFamily: "var(--font-syne)", margin: "0 auto", maxWidth: 600, lineHeight: 1.1, letterSpacing: "-0.02em" }}>
            From spreadsheet to sent — in three steps
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
          {[
            {
              n: "01",
              title: "Upload Your Leads",
              desc: "Drop in a CSV with name, company, role, email, and an optional custom note. Any column format works — we auto-detect everything.",
              icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" strokeLinecap="round" strokeLinejoin="round" /></svg>,
            },
            {
              n: "02",
              title: "Choose Your Tone",
              desc: "Professional, Friendly, Bold, or Minimal. Nexora matches your voice exactly — no prompt engineering needed.",
              icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" strokeLinecap="round" strokeLinejoin="round" /></svg>,
            },
            {
              n: "03",
              title: "Generate & Export",
              desc: "Watch AI write every email in seconds. Review inline, edit anything, then export to CSV, PDF, or Word with one click.",
              icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M16 12l-4 4-4-4M12 16V4" strokeLinecap="round" strokeLinejoin="round" /></svg>,
            },
          ].map((item) => (
            <div key={item.n} style={{
              background: "linear-gradient(135deg, #111 0%, #0d0d0d 100%)",
              border: "1px solid rgba(255,255,255,0.07)", borderRadius: 18,
              padding: "36px 32px", position: "relative", overflow: "hidden",
            }}>
              <div style={{
                position: "absolute", top: 16, right: 20,
                fontSize: 64, fontWeight: 900, color: "rgba(255,82,0,0.05)",
                fontFamily: "var(--font-syne)", lineHeight: 1, userSelect: "none",
              }}>{item.n}</div>
              <div style={{
                width: 50, height: 50, borderRadius: 14,
                backgroundColor: "rgba(255,82,0,0.1)", color: "#FF5200",
                display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 22,
              }}>{item.icon}</div>
              <h3 style={{ fontSize: 18, fontWeight: 800, fontFamily: "var(--font-syne)", marginBottom: 12, letterSpacing: "-0.01em" }}>{item.title}</h3>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.42)", lineHeight: 1.75, margin: 0 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────────────────────── COMPARISON ─────────────────────────── */}
      <section style={{ padding: "80px clamp(20px, 5vw, 60px)", backgroundColor: "#080808" }}>
        <div style={{ maxWidth: 780, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.15em", color: "#FF5200", textTransform: "uppercase", marginBottom: 14 }}>Why Not ChatGPT?</p>
            <h2 style={{ fontSize: "clamp(26px, 4vw, 42px)", fontWeight: 900, fontFamily: "var(--font-syne)", margin: 0, letterSpacing: "-0.02em" }}>
              Built for outreach, not prompts
            </h2>
          </div>

          <div style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 18, overflow: "hidden" }}>
            {/* Header */}
            <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr", backgroundColor: "#0f0f0f" }}>
              <div style={{ padding: "16px 22px", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.25)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Feature</div>
              <div style={{ padding: "16px 22px", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.25)", letterSpacing: "0.1em", textTransform: "uppercase", borderLeft: "1px solid rgba(255,255,255,0.06)" }}>ChatGPT</div>
              <div style={{ padding: "16px 22px", fontSize: 11, fontWeight: 700, color: "#FF5200", letterSpacing: "0.1em", textTransform: "uppercase", borderLeft: "1px solid rgba(255,255,255,0.06)", backgroundColor: "rgba(255,82,0,0.06)" }}>Nexora</div>
            </div>
            {[
              ["CSV lead import", "❌  Manual copy-paste", "✅  Native support"],
              ["Bulk generation", "❌  One at a time", "✅  100+ in 60 seconds"],
              ["Per-lead personalization", "⚠️  With effort", "✅  Fully automatic"],
              ["Export to CSV / PDF / Word", "❌  Not available", "✅  All formats"],
              ["Campaign history", "❌  None", "✅  Full dashboard"],
              ["Credit tracking", "❌  None", "✅  Built-in"],
            ].map(([feat, chatgpt, nexora], i) => (
              <div key={feat} style={{
                display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr",
                borderTop: "1px solid rgba(255,255,255,0.055)",
                backgroundColor: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.012)",
              }}>
                <div style={{ padding: "14px 22px", fontSize: 13.5, color: "rgba(255,255,255,0.7)" }}>{feat}</div>
                <div style={{ padding: "14px 22px", fontSize: 13.5, color: "rgba(255,255,255,0.35)", borderLeft: "1px solid rgba(255,255,255,0.055)" }}>{chatgpt}</div>
                <div style={{ padding: "14px 22px", fontSize: 13.5, color: "#fff", borderLeft: "1px solid rgba(255,255,255,0.055)", backgroundColor: "rgba(255,82,0,0.025)" }}>{nexora}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────── FEATURES ─────────────────────────── */}
      <section id="features" style={{ padding: "110px clamp(20px, 5vw, 60px)", maxWidth: 1060, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.15em", color: "#FF5200", textTransform: "uppercase", marginBottom: 14 }}>Features</p>
          <h2 style={{ fontSize: "clamp(28px, 4.5vw, 48px)", fontWeight: 900, fontFamily: "var(--font-syne)", margin: "0 auto", maxWidth: 640, lineHeight: 1.1, letterSpacing: "-0.02em" }}>
            Everything you need to close more deals
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 18 }}>
          {[
            { emoji: "📁", title: "Smart CSV Import", desc: "Upload any lead list. We auto-detect name, company, role, email, and custom note columns — no formatting required." },
            { emoji: "🎯", title: "Hyper-Personalization", desc: "Every email references the lead's specific situation in the opening sentence. Not just their name — their context." },
            { emoji: "🎙️", title: "4 Writing Tones", desc: "Professional, Friendly, Bold, or Minimal. Each generates a distinctly different email that matches your brand voice." },
            { emoji: "✏️", title: "Inline Review & Edit", desc: "See every generated email before exporting. Click to edit any subject line or body copy directly in the interface." },
            { emoji: "📤", title: "Multi-Format Export", desc: "Download your campaign as CSV (all plans), PDF (Starter+), or formatted Word document (Pro+)." },
            { emoji: "📊", title: "Campaign History", desc: "Every campaign is saved automatically. Return anytime to review, re-export, or use past emails as inspiration." },
          ].map((f) => (
            <div key={f.title} style={{
              backgroundColor: "#0d0d0d", border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 16, padding: "30px 28px",
            }}>
              <div style={{ fontSize: 30, marginBottom: 16, lineHeight: 1 }}>{f.emoji}</div>
              <h3 style={{ fontSize: 16, fontWeight: 800, fontFamily: "var(--font-syne)", marginBottom: 10, letterSpacing: "-0.01em" }}>{f.title}</h3>
              <p style={{ fontSize: 13.5, color: "rgba(255,255,255,0.42)", lineHeight: 1.75, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────────────────────── PRICING ─────────────────────────── */}
      <section id="pricing" style={{ padding: "110px clamp(20px, 5vw, 60px)", backgroundColor: "#080808" }}>
        <div style={{ maxWidth: 1040, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.15em", color: "#FF5200", textTransform: "uppercase", marginBottom: 14 }}>Pricing</p>
            <h2 style={{ fontSize: "clamp(28px, 4.5vw, 48px)", fontWeight: 900, fontFamily: "var(--font-syne)", margin: "0 auto", maxWidth: 560, lineHeight: 1.1, letterSpacing: "-0.02em" }}>
              Simple, honest pricing
            </h2>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.38)", marginTop: 14 }}>Start free. Scale when you&apos;re ready.</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 18, alignItems: "start" }}>
            {[
              {
                name: "Free", price: "$0", period: "/month", tag: null,
                desc: "Try the core product",
                credits: "10 emails",
                features: ["10 email credits/month", "CSV import", "3 writing tones", "CSV export"],
                cta: "Get Started", highlight: false,
              },
              {
                name: "Starter", price: "$19", period: "/month", tag: null,
                desc: "For individual sellers",
                credits: "300 emails",
                features: ["300 email credits/month", "All 4 writing tones", "CSV + PDF export", "Full campaign history"],
                cta: "Get Started", highlight: false,
              },
              {
                name: "Pro", price: "$49", period: "/month", tag: "Most Popular",
                desc: "For serious SDR teams",
                credits: "1,000 emails",
                features: ["1,000 email credits/month", "All 4 writing tones", "CSV + PDF + Word export", "Priority generation"],
                cta: "Get Started", highlight: true,
              },
              {
                name: "Agency", price: "$99", period: "/month", tag: null,
                desc: "For agencies & scale",
                credits: "Unlimited",
                features: ["Unlimited email credits", "All export formats", "White-label ready", "Early feature access"],
                cta: "Get Started", highlight: false,
              },
            ].map((plan) => (
              <div key={plan.name} style={{
                backgroundColor: plan.highlight ? "#0f0f0f" : "#0d0d0d",
                border: `1px solid ${plan.highlight ? "rgba(255,82,0,0.55)" : "rgba(255,255,255,0.07)"}`,
                borderRadius: 18, padding: "30px 26px",
                position: "relative",
                boxShadow: plan.highlight ? "0 0 60px rgba(255,82,0,0.1)" : "none",
              }}>
                {plan.tag && (
                  <div style={{
                    position: "absolute", top: -13, left: "50%", transform: "translateX(-50%)",
                    backgroundColor: "#FF5200", color: "#fff", fontSize: 11, fontWeight: 800,
                    padding: "3px 16px", borderRadius: 999, whiteSpace: "nowrap", letterSpacing: "0.05em",
                  }}>{plan.tag}</div>
                )}

                <p style={{ fontSize: 12, fontWeight: 700, color: plan.highlight ? "#FF5200" : "rgba(255,255,255,0.4)", marginBottom: 6, letterSpacing: "0.06em", textTransform: "uppercase" }}>{plan.name}</p>
                <p style={{ fontSize: 12.5, color: "rgba(255,255,255,0.35)", marginBottom: 14 }}>{plan.desc}</p>

                <div style={{ display: "flex", alignItems: "baseline", gap: 3, marginBottom: 4 }}>
                  <span style={{ fontSize: 40, fontWeight: 900, fontFamily: "var(--font-syne)", color: "#fff", lineHeight: 1 }}>{plan.price}</span>
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.35)" }}>{plan.period}</span>
                </div>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", marginBottom: 24 }}>{plan.credits}/month</p>

                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 26px", display: "flex", flexDirection: "column", gap: 10 }}>
                  {plan.features.map((f) => (
                    <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: 9, fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.4 }}>
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
                        <path d="M3 8l3.5 3.5L13 4.5" stroke="#FF5200" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>

                <Link href="/signup" style={{
                  display: "block", textAlign: "center",
                  padding: "11px 0", borderRadius: 10, fontSize: 14, fontWeight: 700,
                  textDecoration: "none", fontFamily: "var(--font-syne)",
                  backgroundColor: plan.highlight ? "#FF5200" : "rgba(255,255,255,0.06)",
                  color: plan.highlight ? "#fff" : "rgba(255,255,255,0.65)",
                  border: plan.highlight ? "none" : "1px solid rgba(255,255,255,0.09)",
                }}>
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────── FINAL CTA ─────────────────────────── */}
      <section style={{
        padding: "120px clamp(20px, 5vw, 60px)",
        textAlign: "center",
        background: "radial-gradient(ellipse 70% 80% at 50% 100%, rgba(255,82,0,0.12) 0%, transparent 70%)",
      }}>
        <div style={{ maxWidth: 580, margin: "0 auto" }}>
          <h2 style={{
            fontSize: "clamp(32px, 5.5vw, 58px)", fontWeight: 900, fontFamily: "var(--font-syne)",
            marginBottom: 18, lineHeight: 1.08, letterSpacing: "-0.03em",
          }}>
            Ready to fill your pipeline?
          </h2>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.42)", marginBottom: 44, lineHeight: 1.75 }}>
            Join sales teams generating hundreds of personalized cold emails every day — in minutes, not hours.
          </p>
          <LandingCTA />
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", marginTop: 18 }}>
            No credit card required &nbsp;·&nbsp; 10 free emails on signup
          </p>
        </div>
      </section>

      {/* ─────────────────────────── FOOTER ─────────────────────────── */}
      <footer style={{
        borderTop: "1px solid rgba(255,255,255,0.055)",
        padding: "28px clamp(20px, 5vw, 60px)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: 20,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <svg width="22" height="22" viewBox="0 0 48 48" fill="none">
            <rect width="48" height="48" rx="10" fill="#FF5200" />
            <path d="M13 36V12h4.5l13 16.5V12H35v24h-4.5L17.5 19.5V36H13z" fill="white" />
          </svg>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.28)", fontFamily: "var(--font-outfit)" }}>
            Nexora Outreach — by Nexora Studios
          </span>
        </div>

        <div style={{ display: "flex", gap: 28 }}>
          {[["How it works", "#how"], ["Features", "#features"], ["Pricing", "#pricing"]].map(([l, h]) => (
            <a key={l} href={h} style={{ fontSize: 12, color: "rgba(255,255,255,0.28)", textDecoration: "none" }}>{l}</a>
          ))}
        </div>

        <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
          <Link href="/login" style={{ fontSize: 12, color: "rgba(255,255,255,0.28)", textDecoration: "none" }}>Sign in</Link>
          <Link href="/signup" style={{ fontSize: 12, color: "rgba(255,255,255,0.28)", textDecoration: "none" }}>Sign up</Link>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.16)" }}>© {new Date().getFullYear()} Nexora Studios</span>
        </div>
      </footer>

    </div>
  );
}
