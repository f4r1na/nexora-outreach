import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import LandingDemo from "./_landing/demo";
import LandingCTA from "./_landing/cta";

export const metadata = {
  title: "Nexora Outreach — AI Cold Email at Scale",
  description: "Generate 100 hyper-personalized cold emails in 60 seconds with AI.",
};

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <div style={{ backgroundColor: "#060606", minHeight: "100vh", color: "#fff", fontFamily: "var(--font-outfit)" }}>

      {/* ── Navbar ── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 40px", height: 64,
        backgroundColor: "rgba(6,6,6,0.85)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <svg width="32" height="32" viewBox="0 0 48 48" fill="none">
            <rect width="48" height="48" rx="10" fill="#FF5200" />
            <path d="M13 36V12h4.5l13 16.5V12H35v24h-4.5L17.5 19.5V36H13z" fill="white" />
          </svg>
          <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: "0.1em", color: "#fff", fontFamily: "var(--font-syne)" }}>
            NEXORA
          </span>
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          <a href="#how" style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>How it works</a>
          <a href="#features" style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>Features</a>
          <a href="#pricing" style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>Pricing</a>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Link href="/login" style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", textDecoration: "none" }}>Sign in</Link>
          <Link href="/signup" style={{
            fontSize: 13, fontWeight: 600, padding: "8px 18px",
            backgroundColor: "#FF5200", color: "#fff", borderRadius: 8, textDecoration: "none",
          }}>
            Get Early Access
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "120px 24px 80px", textAlign: "center",
        background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(255,82,0,0.12) 0%, transparent 70%)",
      }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "5px 14px", borderRadius: 999,
          backgroundColor: "rgba(255,82,0,0.1)", border: "1px solid rgba(255,82,0,0.25)",
          marginBottom: 28,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#FF5200", display: "inline-block" }} />
          <span style={{ fontSize: 12, color: "#FF5200", fontWeight: 600, letterSpacing: "0.04em" }}>AI-Powered Cold Outreach</span>
        </div>

        <h1 style={{
          fontSize: "clamp(36px, 6vw, 72px)", fontWeight: 800, lineHeight: 1.08,
          fontFamily: "var(--font-syne)", maxWidth: 800, margin: "0 auto 24px",
          letterSpacing: "-0.02em",
        }}>
          100 Personalized Cold Emails.{" "}
          <span style={{ color: "#FF5200" }}>60 Seconds.</span>
        </h1>

        <p style={{
          fontSize: "clamp(15px, 2vw, 18px)", color: "rgba(255,255,255,0.5)",
          maxWidth: 520, margin: "0 auto 40px", lineHeight: 1.7,
        }}>
          Upload your lead list, choose a tone, and watch Nexora write hyper-personalized
          cold emails for every single prospect — instantly.
        </p>

        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", justifyContent: "center" }}>
          <Link href="/signup" style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "13px 28px", backgroundColor: "#FF5200", color: "#fff",
            borderRadius: 10, fontSize: 15, fontWeight: 700, textDecoration: "none",
            fontFamily: "var(--font-syne)",
          }}>
            Start Free — No Credit Card
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </Link>
          <a href="#how" style={{
            padding: "13px 24px", color: "rgba(255,255,255,0.55)", fontSize: 14,
            textDecoration: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10,
          }}>
            See how it works
          </a>
        </div>

        {/* Animated demo panel */}
        <div style={{ marginTop: 64, width: "100%", maxWidth: 760 }}>
          <LandingDemo />
        </div>
      </section>

      {/* ── Stats strip ── */}
      <section style={{
        borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: "40px 24px", backgroundColor: "#0e0e0e",
      }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, textAlign: "center" }}>
          {[
            { value: "500+", label: "Campaigns Created" },
            { value: "10x", label: "Faster Than Manual" },
            { value: "85%", label: "Open Rate Lift" },
            { value: "60s", label: "Per 100 Emails" },
          ].map((s) => (
            <div key={s.label}>
              <div style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 800, color: "#FF5200", fontFamily: "var(--font-syne)", lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 6 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how" style={{ padding: "100px 24px", maxWidth: 1000, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", color: "#FF5200", textTransform: "uppercase", marginBottom: 12 }}>How It Works</p>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, fontFamily: "var(--font-syne)", margin: 0 }}>
            Three steps to your inbox
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 24 }}>
          {[
            {
              step: "01",
              title: "Upload Your Leads",
              desc: "Drop in a CSV with name, company, role, and a custom note. Any format works.",
              icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ),
            },
            {
              step: "02",
              title: "Choose Your Tone",
              desc: "Pick Professional, Friendly, Bold, or Minimal. Nexora matches your voice perfectly.",
              icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ),
            },
            {
              step: "03",
              title: "Generate & Export",
              desc: "AI writes every email in seconds. Review, edit, and export to CSV, PDF, or Word.",
              icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M16 12l-4 4-4-4M12 16V4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ),
            },
          ].map((item) => (
            <div key={item.step} style={{
              backgroundColor: "#0e0e0e", border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 16, padding: 32, position: "relative", overflow: "hidden",
            }}>
              <div style={{
                position: "absolute", top: 20, right: 20,
                fontSize: 48, fontWeight: 900, color: "rgba(255,82,0,0.06)",
                fontFamily: "var(--font-syne)", lineHeight: 1,
              }}>{item.step}</div>
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                backgroundColor: "rgba(255,82,0,0.1)", color: "#FF5200",
                display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20,
              }}>{item.icon}</div>
              <h3 style={{ fontSize: 17, fontWeight: 700, fontFamily: "var(--font-syne)", marginBottom: 10 }}>{item.title}</h3>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", lineHeight: 1.7, margin: 0 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Comparison table ── */}
      <section style={{ padding: "80px 24px", backgroundColor: "#0a0a0a" }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", color: "#FF5200", textTransform: "uppercase", marginBottom: 12 }}>Why Not ChatGPT?</p>
            <h2 style={{ fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 800, fontFamily: "var(--font-syne)", margin: 0 }}>
              Built for outreach, not prompts
            </h2>
          </div>

          <div style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", backgroundColor: "#111" }}>
              <div style={{ padding: "14px 20px", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Feature</div>
              <div style={{ padding: "14px 20px", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.08em", textTransform: "uppercase", borderLeft: "1px solid rgba(255,255,255,0.06)" }}>ChatGPT</div>
              <div style={{ padding: "14px 20px", fontSize: 12, fontWeight: 700, color: "#FF5200", letterSpacing: "0.08em", textTransform: "uppercase", borderLeft: "1px solid rgba(255,255,255,0.06)", backgroundColor: "rgba(255,82,0,0.05)" }}>Nexora</div>
            </div>
            {[
              ["CSV lead import", "❌ Manual copy-paste", "✅ Native support"],
              ["Bulk generation", "❌ One at a time", "✅ 100+ in 60s"],
              ["Per-lead personalization", "⚠️ With effort", "✅ Automatic"],
              ["Export to CSV / PDF", "❌ None", "✅ All formats"],
              ["Campaign management", "❌ None", "✅ Full history"],
              ["Credit tracking", "❌ None", "✅ Built-in"],
            ].map(([feat, chatgpt, nexora], i) => (
              <div key={feat} style={{
                display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
                borderTop: "1px solid rgba(255,255,255,0.06)",
                backgroundColor: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)",
              }}>
                <div style={{ padding: "14px 20px", fontSize: 13, color: "rgba(255,255,255,0.7)" }}>{feat}</div>
                <div style={{ padding: "14px 20px", fontSize: 13, color: "rgba(255,255,255,0.4)", borderLeft: "1px solid rgba(255,255,255,0.06)" }}>{chatgpt}</div>
                <div style={{ padding: "14px 20px", fontSize: 13, color: "#fff", borderLeft: "1px solid rgba(255,255,255,0.06)", backgroundColor: "rgba(255,82,0,0.03)" }}>{nexora}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features grid ── */}
      <section id="features" style={{ padding: "100px 24px", maxWidth: 1060, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 60 }}>
          <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", color: "#FF5200", textTransform: "uppercase", marginBottom: 12 }}>Features</p>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, fontFamily: "var(--font-syne)", margin: 0 }}>
            Everything you need to close more deals
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
          {[
            { title: "CSV Import", desc: "Upload any lead list. We auto-detect name, company, role, email, and custom note columns.", icon: "📁" },
            { title: "Hyper-Personalization", desc: "Every email references the lead's specific situation, not just their first name.", icon: "🎯" },
            { title: "4 Tones", desc: "Professional, Friendly, Bold, or Minimal. Match any brand voice or sales style.", icon: "🎙️" },
            { title: "Instant Review", desc: "See all generated emails before exporting. Edit any subject or body inline.", icon: "✏️" },
            { title: "Multi-Format Export", desc: "Download as CSV, PDF (Starter+), or Word document (Pro+).", icon: "📤" },
            { title: "Campaign History", desc: "Every campaign saved automatically. Come back anytime to review or re-export.", icon: "📊" },
          ].map((f) => (
            <div key={f.title} style={{
              backgroundColor: "#0e0e0e", border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 14, padding: "28px 28px",
              transition: "border-color 0.2s",
            }}>
              <div style={{ fontSize: 28, marginBottom: 14 }}>{f.icon}</div>
              <h3 style={{ fontSize: 16, fontWeight: 700, fontFamily: "var(--font-syne)", marginBottom: 8 }}>{f.title}</h3>
              <p style={{ fontSize: 13.5, color: "rgba(255,255,255,0.45)", lineHeight: 1.7, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" style={{ padding: "100px 24px", backgroundColor: "#0a0a0a" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 60 }}>
            <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", color: "#FF5200", textTransform: "uppercase", marginBottom: 12 }}>Pricing</p>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, fontFamily: "var(--font-syne)", margin: 0 }}>
              Simple, honest pricing
            </h2>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.4)", marginTop: 14 }}>Start free. Upgrade when you're ready to scale.</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20 }}>
            {[
              {
                name: "Free",
                price: "$0",
                period: "forever",
                credits: "10 emails",
                features: ["10 email credits", "CSV import", "3 tones", "CSV export"],
                cta: "Get Started",
                highlight: false,
              },
              {
                name: "Starter",
                price: "$19",
                period: "/month",
                credits: "300 emails",
                features: ["300 email credits", "All 4 tones", "CSV + PDF export", "Campaign history"],
                cta: "Get Started",
                highlight: false,
              },
              {
                name: "Pro",
                price: "$49",
                period: "/month",
                credits: "1,000 emails",
                features: ["1,000 email credits", "All 4 tones", "CSV + PDF + Word", "Priority generation"],
                cta: "Get Started",
                highlight: true,
              },
              {
                name: "Agency",
                price: "$99",
                period: "/month",
                credits: "Unlimited",
                features: ["Unlimited credits", "All export formats", "White-label ready", "Early feature access"],
                cta: "Get Started",
                highlight: false,
              },
            ].map((plan) => (
              <div key={plan.name} style={{
                backgroundColor: plan.highlight ? "rgba(255,82,0,0.06)" : "#0e0e0e",
                border: `1px solid ${plan.highlight ? "#FF5200" : "rgba(255,255,255,0.08)"}`,
                borderRadius: 16, padding: 28,
                position: "relative",
              }}>
                {plan.highlight && (
                  <div style={{
                    position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)",
                    backgroundColor: "#FF5200", color: "#fff", fontSize: 11, fontWeight: 700,
                    padding: "3px 14px", borderRadius: 999, whiteSpace: "nowrap",
                  }}>Most Popular</div>
                )}
                <div style={{ marginBottom: 20 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: plan.highlight ? "#FF5200" : "rgba(255,255,255,0.5)", marginBottom: 8 }}>{plan.name}</p>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                    <span style={{ fontSize: 36, fontWeight: 800, fontFamily: "var(--font-syne)", color: "#fff" }}>{plan.price}</span>
                    <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>{plan.period}</span>
                  </div>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>{plan.credits}/month</p>
                </div>

                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 24px", display: "flex", flexDirection: "column", gap: 9 }}>
                  {plan.features.map((f) => (
                    <li key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "rgba(255,255,255,0.6)" }}>
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                        <path d="M3 8l3.5 3.5L13 4.5" stroke="#FF5200" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>

                <Link href="/signup" style={{
                  display: "block", textAlign: "center",
                  padding: "10px 0", borderRadius: 9, fontSize: 13.5, fontWeight: 600,
                  textDecoration: "none",
                  backgroundColor: plan.highlight ? "#FF5200" : "rgba(255,255,255,0.06)",
                  color: plan.highlight ? "#fff" : "rgba(255,255,255,0.7)",
                  border: plan.highlight ? "none" : "1px solid rgba(255,255,255,0.1)",
                }}>
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section style={{
        padding: "100px 24px", textAlign: "center",
        background: "radial-gradient(ellipse 70% 80% at 50% 100%, rgba(255,82,0,0.1) 0%, transparent 70%)",
      }}>
        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(30px, 5vw, 52px)", fontWeight: 800, fontFamily: "var(--font-syne)", marginBottom: 16, lineHeight: 1.1 }}>
            Ready to fill your pipeline?
          </h2>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.45)", marginBottom: 40, lineHeight: 1.7 }}>
            Join sales teams generating hundreds of personalized cold emails every day — in minutes, not hours.
          </p>
          <LandingCTA />
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", marginTop: 16 }}>
            No credit card required. 10 free emails on signup.
          </p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{
        borderTop: "1px solid rgba(255,255,255,0.06)",
        padding: "32px 40px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: 16,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <svg width="24" height="24" viewBox="0 0 48 48" fill="none">
            <rect width="48" height="48" rx="10" fill="#FF5200" />
            <path d="M13 36V12h4.5l13 16.5V12H35v24h-4.5L17.5 19.5V36H13z" fill="white" />
          </svg>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", fontFamily: "var(--font-outfit)" }}>
            Nexora Outreach — by Nexora Studios
          </span>
        </div>
        <div style={{ display: "flex", gap: 24 }}>
          <Link href="/login" style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", textDecoration: "none" }}>Sign in</Link>
          <Link href="/signup" style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", textDecoration: "none" }}>Sign up</Link>
          <a href="#pricing" style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", textDecoration: "none" }}>Pricing</a>
        </div>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", margin: 0 }}>
          © {new Date().getFullYear()} Nexora Studios. All rights reserved.
        </p>
      </footer>

    </div>
  );
}
