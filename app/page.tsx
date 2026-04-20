import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import LandingPrompt from "./_landing/prompt";
import MeshBackground from "./_components/mesh-bg";

export const metadata = {
  title: "Nexora Outreach — AI Cold Email at Scale",
  description: "Describe what you need. Nexora researches leads, drafts hyper-personalized emails, sends follow-ups, and tracks results.",
};

function ArrowRight() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const TEMPLATES = [
  { title: "SaaS founder outreach", sub: "Pitch recently funded founders", accent: "#FF5200" },
  { title: "Agency pitch",          sub: "Growth leaders at Series A",    accent: "#F59E0B" },
  { title: "Freelancer intro",      sub: "Warm cold-intros to CTOs",      accent: "#FF5200" },
  { title: "E-commerce brands",     sub: "DTC founders with CAC pain",    accent: "#F59E0B" },
  { title: "Real estate agents",    sub: "Top producers in a market",     accent: "#FF5200" },
  { title: "Recruiting outreach",   sub: "Senior engineers, specific stack", accent: "#F59E0B" },
];

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <div style={{
      backgroundColor: "#080810",
      minHeight: "100dvh",
      color: "#fff",
      fontFamily: "var(--font-outfit)",
      overflowX: "hidden",
      position: "relative",
    }}>
      <MeshBackground />

      {/* ─── NAVBAR ─────────────────────────────────────────────────── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        height: 64,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 clamp(20px, 4vw, 56px)",
        backgroundColor: "rgba(8,8,16,0.8)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
      }}>
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
          <span style={{ fontSize: 15, fontWeight: 600, color: "#fff", fontFamily: "var(--font-space-grotesk)", letterSpacing: "-0.02em" }}>
            Nexora
          </span>
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          {[["How it works", "#how"], ["Templates", "#templates"], ["Pricing", "#pricing"]].map(([label, href]) => (
            <a
              key={label}
              href={href as string}
              className="landing-nav-link"
              style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", textDecoration: "none" }}
            >
              {label}
            </a>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/login" style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>
            Sign in
          </Link>
          <Link href="/signup" style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            fontSize: 13, fontWeight: 600,
            padding: "8px 18px",
            backgroundColor: "#FF5200", color: "#fff",
            borderRadius: 999, textDecoration: "none",
            fontFamily: "var(--font-outfit)",
          }}>
            Get started
          </Link>
        </div>
      </nav>

      {/* ─── HERO ───────────────────────────────────────────────────── */}
      <section style={{
        paddingTop: "clamp(120px, 14vw, 160px)",
        paddingBottom: "clamp(72px, 9vw, 120px)",
        paddingLeft: "clamp(20px, 4vw, 56px)",
        paddingRight: "clamp(20px, 4vw, 56px)",
        textAlign: "center",
        position: "relative",
        zIndex: 1,
      }}>
        {/* Eyebrow */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 7,
          padding: "5px 14px", borderRadius: 999,
          backgroundColor: "rgba(255,82,0,0.08)",
          border: "1px solid rgba(255,82,0,0.22)",
          marginBottom: 28,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#FF5200", flexShrink: 0 }} />
          <span style={{ fontSize: 11, fontWeight: 500, color: "#FF5200", letterSpacing: "0.06em", textTransform: "uppercase" }}>
            Your AI Outreach Agent
          </span>
        </div>

        {/* Huge 2-line headline */}
        <h1 style={{
          fontSize: "clamp(44px, 8.5vw, 104px)",
          fontWeight: 600,
          lineHeight: 0.98,
          fontFamily: "var(--font-space-grotesk)",
          maxWidth: 1080, margin: "0 auto 28px",
          letterSpacing: "-0.04em",
        }}>
          <span style={{ display: "block", color: "#fff" }}>Cold outreach that</span>
          <span className="headline-gradient" style={{ display: "block", fontStyle: "italic", fontWeight: 500 }}>
            actually works.
          </span>
        </h1>

        <p style={{
          fontSize: "clamp(15px, 1.6vw, 18px)",
          color: "rgba(255,255,255,0.55)",
          maxWidth: 580, margin: "0 auto 40px",
          lineHeight: 1.6,
        }}>
          Describe what you need. Nexora researches your leads, drafts hyper-personalized emails, sends follow-ups, and tracks every reply.
        </p>

        {/* Pill prompt bar */}
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <LandingPrompt />
        </div>

        {/* Inline social proof */}
        <div style={{
          display: "flex", gap: "clamp(16px, 4vw, 40px)", justifyContent: "center", flexWrap: "wrap",
          marginTop: 32,
        }}>
          {[
            { value: "500+",  label: "sales teams" },
            { value: "2M+",   label: "emails sent" },
            { value: "47%",   label: "avg open rate" },
          ].map((s, i) => (
            <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                <span style={{ fontSize: 15, fontWeight: 600, color: "#fff", fontFamily: "var(--font-space-grotesk)" }}>
                  {s.value}
                </span>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.45)" }}>{s.label}</span>
              </div>
              {i < 2 && <span style={{ color: "rgba(255,255,255,0.12)" }}>|</span>}
            </div>
          ))}
        </div>
      </section>

      {/* ─── TEMPLATES ──────────────────────────────────────────────── */}
      <section id="templates" style={{
        padding: "clamp(56px, 8vw, 96px) clamp(20px, 4vw, 56px)",
        position: "relative", zIndex: 1,
        borderTop: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 32, gap: 24, flexWrap: "wrap" }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.1em", color: "#F59E0B", textTransform: "uppercase", marginBottom: 12 }}>
                Templates
              </p>
              <h2 style={{
                fontSize: "clamp(30px, 4.5vw, 48px)",
                fontWeight: 600,
                fontFamily: "var(--font-space-grotesk)",
                letterSpacing: "-0.03em",
                lineHeight: 1.05,
                maxWidth: 560,
              }}>
                Start from a proven campaign.
              </h2>
            </div>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", maxWidth: 360, lineHeight: 1.55 }}>
              Pick a starting point. Nexora handles the research, writing, and follow-ups.
            </p>
          </div>

          <div style={{
            display: "flex",
            gap: 16,
            overflowX: "auto",
            paddingBottom: 8,
            scrollbarWidth: "thin",
          }}>
            {TEMPLATES.map((t) => (
              <div key={t.title} style={{
                flexShrink: 0,
                width: 280,
                padding: "22px 22px 20px",
                backgroundColor: "#0E0E18",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 16,
              }}>
                <div style={{
                  width: 36, height: 36,
                  borderRadius: 10,
                  backgroundColor: `${t.accent}14`,
                  border: `1px solid ${t.accent}30`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: 16,
                }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: t.accent }} />
                </div>
                <p style={{
                  fontSize: 15, fontWeight: 600, color: "#fff",
                  fontFamily: "var(--font-space-grotesk)", marginBottom: 6,
                  letterSpacing: "-0.01em",
                }}>
                  {t.title}
                </p>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>
                  {t.sub}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─────────────────────────────────────────── */}
      <section id="how" style={{
        padding: "clamp(72px, 10vw, 120px) clamp(20px, 4vw, 56px)",
        maxWidth: 1100, margin: "0 auto",
        position: "relative", zIndex: 1,
      }}>
        <div style={{ marginBottom: 72, maxWidth: 640 }}>
          <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.1em", color: "#FF5200", textTransform: "uppercase", marginBottom: 12 }}>
            How it works
          </p>
          <h2 style={{
            fontSize: "clamp(30px, 4.5vw, 52px)",
            fontWeight: 600,
            fontFamily: "var(--font-space-grotesk)",
            lineHeight: 1.05,
            letterSpacing: "-0.03em",
          }}>
            From prompt to pipeline in three steps.
          </h2>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {[
            {
              n: "01",
              title: "Describe what you need",
              desc: "Tell Nexora your target customer, your value prop, or a specific ask — one sentence is enough. The agent figures out the rest.",
            },
            {
              n: "02",
              title: "Nexora researches and writes",
              desc: "The agent finds leads, reads signals (funding, hiring, recent product launches), and drafts an email for each one — in your tone.",
            },
            {
              n: "03",
              title: "Sends, follows up, tracks",
              desc: "Emails send on schedule. Follow-ups fire automatically. Every reply lands in your unified inbox, ranked by intent.",
            },
          ].map((item, i, arr) => (
            <div key={item.n} style={{
              display: "grid",
              gridTemplateColumns: "minmax(120px, 160px) 1fr",
              gap: "clamp(24px, 5vw, 64px)",
              padding: "32px 0",
              borderTop: i === 0 ? "1px solid rgba(255,255,255,0.08)" : "none",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
              alignItems: "start",
            }}>
              <div style={{
                fontSize: "clamp(48px, 7vw, 88px)",
                fontWeight: 500,
                fontFamily: "var(--font-space-grotesk)",
                color: "rgba(255,82,0,0.32)",
                lineHeight: 0.9,
                letterSpacing: "-0.04em",
                fontFeatureSettings: "'tnum' on",
              }}>
                {item.n}
              </div>
              <div style={{ paddingTop: 8 }}>
                <h3 style={{
                  fontSize: "clamp(20px, 2.4vw, 28px)",
                  fontWeight: 600,
                  fontFamily: "var(--font-space-grotesk)",
                  color: "#fff",
                  marginBottom: 12,
                  letterSpacing: "-0.02em",
                  lineHeight: 1.15,
                }}>
                  {item.title}
                </h3>
                <p style={{
                  fontSize: 15,
                  color: "rgba(255,255,255,0.55)",
                  lineHeight: 1.65,
                  maxWidth: 600,
                }}>
                  {item.desc}
                </p>
              </div>
              {i === arr.length - 1 ? null : null}
            </div>
          ))}
        </div>
      </section>

      {/* ─── STATS ──────────────────────────────────────────────────── */}
      <section style={{
        padding: "clamp(64px, 9vw, 112px) clamp(20px, 4vw, 56px)",
        position: "relative", zIndex: 1,
        borderTop: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{
          maxWidth: 1100, margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "clamp(24px, 4vw, 48px)",
        }}>
          {[
            { value: "2M+",  label: "Emails generated" },
            { value: "47%",  label: "Avg open rate" },
            { value: "500+", label: "Sales teams" },
            { value: "60s",  label: "Per campaign" },
          ].map((s) => (
            <div key={s.label}>
              <div style={{
                fontSize: "clamp(44px, 6.5vw, 88px)",
                fontWeight: 600,
                color: "#fff",
                fontFamily: "var(--font-space-grotesk)",
                lineHeight: 0.95,
                letterSpacing: "-0.04em",
                marginBottom: 10,
              }}>
                {s.value}
              </div>
              <div style={{
                fontSize: 13,
                color: "rgba(255,255,255,0.45)",
                fontFamily: "var(--font-outfit)",
              }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── PRICING ────────────────────────────────────────────────── */}
      <section id="pricing" style={{
        padding: "clamp(72px, 10vw, 120px) clamp(20px, 4vw, 56px)",
        position: "relative", zIndex: 1,
        borderTop: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{ maxWidth: 1040, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.1em", color: "#F59E0B", textTransform: "uppercase", marginBottom: 12 }}>
              Pricing
            </p>
            <h2 style={{
              fontSize: "clamp(30px, 4.5vw, 52px)",
              fontWeight: 600,
              fontFamily: "var(--font-space-grotesk)",
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
              maxWidth: 560, margin: "0 auto",
            }}>
              Start free. Scale when you&apos;re ready.
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, alignItems: "start" }}>
            {[
              { name: "Free",    price: "$0",  period: "/mo", credits: "10 emails / month",   highlight: false, tag: null           },
              { name: "Starter", price: "$19", period: "/mo", credits: "300 emails / month",  highlight: false, tag: null           },
              { name: "Pro",     price: "$49", period: "/mo", credits: "1,000 emails / month", highlight: true,  tag: "Most popular" },
              { name: "Agency",  price: "$99", period: "/mo", credits: "Unlimited emails",    highlight: false, tag: null           },
            ].map((plan) => (
              <div key={plan.name} style={{
                backgroundColor: "#0E0E18",
                border: `1px solid ${plan.highlight ? "rgba(255,82,0,0.45)" : "rgba(255,255,255,0.08)"}`,
                borderRadius: 16, padding: "28px 24px",
                position: "relative",
              }}>
                {plan.tag && (
                  <div style={{
                    position: "absolute", top: -11, left: "50%", transform: "translateX(-50%)",
                    backgroundColor: "#FF5200", color: "#fff",
                    fontSize: 10, fontWeight: 600,
                    padding: "4px 14px", borderRadius: 999,
                    whiteSpace: "nowrap", letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}>
                    {plan.tag}
                  </div>
                )}

                <p style={{ fontSize: 11, fontWeight: 600, color: plan.highlight ? "#FF5200" : "rgba(255,255,255,0.4)", marginBottom: 6, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  {plan.name}
                </p>

                <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 6 }}>
                  <span style={{ fontSize: 40, fontWeight: 600, fontFamily: "var(--font-space-grotesk)", color: "#fff", lineHeight: 1, letterSpacing: "-0.03em" }}>
                    {plan.price}
                  </span>
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>{plan.period}</span>
                </div>
                <p style={{ fontSize: 12.5, color: "rgba(255,255,255,0.4)", marginBottom: 24 }}>{plan.credits}</p>

                <Link href="/signup" style={{
                  display: "block", textAlign: "center",
                  padding: "10px 0", borderRadius: 999,
                  fontSize: 13, fontWeight: 600,
                  fontFamily: "var(--font-outfit)",
                  textDecoration: "none",
                  backgroundColor: plan.highlight ? "#FF5200" : "rgba(255,255,255,0.05)",
                  color: plan.highlight ? "#fff" : "rgba(255,255,255,0.7)",
                  border: plan.highlight ? "none" : "1px solid rgba(255,255,255,0.1)",
                }}>
                  Get started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ──────────────────────────────────────────────── */}
      <section style={{
        padding: "clamp(72px, 10vw, 128px) clamp(20px, 4vw, 56px)",
        textAlign: "center",
        position: "relative", overflow: "hidden", zIndex: 1,
      }}>
        <div style={{
          position: "absolute", bottom: -100, left: "50%", transform: "translateX(-50%)",
          width: "60vw", height: "50vw", maxWidth: 900, maxHeight: 600,
          background: "radial-gradient(ellipse at center, rgba(255,82,0,0.14) 0%, transparent 65%)",
          pointerEvents: "none",
        }} />
        <div style={{ maxWidth: 620, margin: "0 auto", position: "relative" }}>
          <h2 style={{
            fontSize: "clamp(32px, 5.5vw, 68px)",
            fontWeight: 600,
            fontFamily: "var(--font-space-grotesk)",
            marginBottom: 20, lineHeight: 1.02, letterSpacing: "-0.035em",
          }}>
            Ready to fill your pipeline?
          </h2>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.5)", marginBottom: 32, lineHeight: 1.6 }}>
            Join sales teams generating hundreds of hyper-personalized cold emails every day.
          </p>
          <Link href="/signup" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "14px 28px",
            backgroundColor: "#FF5200", color: "#fff",
            borderRadius: 999,
            fontSize: 14, fontWeight: 600,
            fontFamily: "var(--font-outfit)",
            textDecoration: "none",
          }}>
            Try the agent free
            <ArrowRight />
          </Link>
          <p style={{ fontSize: 12.5, color: "rgba(255,255,255,0.32)", marginTop: 16 }}>
            No credit card required · 10 free emails on signup
          </p>
        </div>
      </section>

      {/* ─── FOOTER ─────────────────────────────────────────────────── */}
      <footer style={{
        borderTop: "1px solid rgba(255,255,255,0.06)",
        padding: "28px clamp(20px, 4vw, 56px)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: 16,
        position: "relative", zIndex: 1,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 22, height: 22, borderRadius: 6, backgroundColor: "#FF5200", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="11" height="11" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M2 12V2h2.5l5.5 7V2H12v10h-2.5L4 5v7H2z" fill="white" />
            </svg>
          </div>
          <span style={{ fontSize: 12.5, color: "rgba(255,255,255,0.35)" }}>
            © {new Date().getFullYear()} Nexora Studios
          </span>
        </div>
        <div style={{ display: "flex", gap: 24 }}>
          <Link href="/login"  style={{ fontSize: 12.5, color: "rgba(255,255,255,0.35)", textDecoration: "none" }}>Sign in</Link>
          <Link href="/signup" style={{ fontSize: 12.5, color: "rgba(255,255,255,0.35)", textDecoration: "none" }}>Sign up</Link>
        </div>
      </footer>
    </div>
  );
}
