import Link from "next/link";
import MeshBackground from "../_components/mesh-bg";
import { NexoraLogo } from "@/components/ui/nexora-logo";
import PricingFAQ from "./faq";

export const metadata = {
  title: "Pricing — Nexora Outreach",
  description: "Simple, transparent pricing. Start free, scale as you grow.",
};

const ORANGE = "#FF5200";
const BG = "#080810";
const CARD_BG = "#0E0E18";
const BORDER = "rgba(255,255,255,0.06)";
const TEXT_DIM = "rgba(255,255,255,0.55)";
const TEXT_MUTED = "rgba(255,255,255,0.45)";

type Tier = {
  name: string;
  price: string;
  priceSuffix?: string;
  priceNote?: string;
  blurb: string;
  features: string[];
  ctaLabel: string;
  ctaHref: string;
  popular?: boolean;
};

const TIERS: Tier[] = [
  {
    name: "Starter",
    price: "$19",
    priceSuffix: "/mo",
    blurb: "Get cold outreach off the ground.",
    features: [
      "300 emails / month",
      "Basic intent signals",
      "Reply tracking",
      "Gmail OAuth integration",
      "AI personalization",
      "Email support",
    ],
    ctaLabel: "Start free",
    ctaHref: "/signup",
  },
  {
    name: "Pro",
    price: "$69",
    priceSuffix: "/mo",
    blurb: "For founders running real campaigns.",
    features: [
      "1,000 emails / month",
      "Everything in Starter",
      "Salesforce integration",
      "Confidence scoring",
      "Advanced signal verification",
      "Priority support",
    ],
    ctaLabel: "Start trial",
    ctaHref: "/signup?plan=pro",
    popular: true,
  },
  {
    name: "Scale",
    price: "Custom",
    priceNote: "$0.12 - $0.15 per email · $99 minimum",
    blurb: "High-volume outreach with white-glove onboarding.",
    features: [
      "Unlimited volume tier",
      "Everything in Pro",
      "Dedicated account manager",
      "Custom integrations",
      "SLA + uptime guarantees",
      "Onboarding & training",
    ],
    ctaLabel: "Contact us",
    ctaHref: "mailto:hello@nexoraoutreach.com?subject=Scale%20plan%20inquiry",
  },
];

function Check() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{ flexShrink: 0, marginTop: 3 }}>
      <path d="M3 8.5l3 3 7-7" stroke={ORANGE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function PricingPage() {
  return (
    <div style={{
      backgroundColor: BG,
      minHeight: "100dvh",
      color: "#fff",
      fontFamily: "var(--font-outfit)",
      overflowX: "hidden",
      position: "relative",
    }}>
      <MeshBackground />

      {/* NAV */}
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
        <Link href="/" style={{ textDecoration: "none" }}>
          <NexoraLogo size={26} wordmarkSize={15} />
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          <Link href="/#how" className="landing-nav-link" style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>
            How it works
          </Link>
          <Link href="/#templates" className="landing-nav-link" style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>
            Templates
          </Link>
          <Link href="/pricing" className="landing-nav-link" style={{ fontSize: 13, color: "#fff", textDecoration: "none" }}>
            Pricing
          </Link>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/login" style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>
            Sign in
          </Link>
          <Link href="/signup" style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            fontSize: 13, fontWeight: 600,
            padding: "8px 18px",
            backgroundColor: ORANGE, color: "#fff",
            borderRadius: 999, textDecoration: "none",
          }}>
            Get started
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section style={{
        paddingTop: "clamp(120px, 14vw, 160px)",
        paddingBottom: "clamp(40px, 6vw, 64px)",
        paddingLeft: "clamp(20px, 4vw, 56px)",
        paddingRight: "clamp(20px, 4vw, 56px)",
        textAlign: "center",
        position: "relative",
        zIndex: 1,
      }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 7,
          padding: "5px 14px", borderRadius: 999,
          backgroundColor: "rgba(255,82,0,0.08)",
          border: "1px solid rgba(255,82,0,0.22)",
          marginBottom: 28,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: ORANGE }} />
          <span style={{ fontSize: 11, fontWeight: 500, color: ORANGE, letterSpacing: "0.06em", textTransform: "uppercase" }}>
            Pricing
          </span>
        </div>

        <h1 style={{
          fontSize: "clamp(40px, 7vw, 80px)",
          fontWeight: 600,
          lineHeight: 1.0,
          fontFamily: "var(--font-space-grotesk)",
          maxWidth: 900, margin: "0 auto 24px",
          letterSpacing: "-0.035em",
        }}>
          <span style={{ display: "block", color: "#fff" }}>Simple, transparent</span>
          <span className="headline-gradient" style={{ display: "block", fontStyle: "italic", fontWeight: 500 }}>
            pricing.
          </span>
        </h1>

        <p style={{
          fontSize: "clamp(15px, 1.6vw, 18px)",
          color: TEXT_DIM,
          maxWidth: 540, margin: "0 auto",
          lineHeight: 1.6,
        }}>
          Start with 10 free emails. Upgrade when you&apos;re ready. Cancel anytime — no lock-in.
        </p>
      </section>

      {/* PRICING CARDS */}
      <section style={{
        padding: "0 clamp(20px, 4vw, 56px) clamp(80px, 10vw, 120px)",
        position: "relative", zIndex: 1,
      }}>
        <div style={{
          maxWidth: 1180,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 20,
          alignItems: "stretch",
        }}>
          {TIERS.map((tier) => {
            const isPopular = tier.popular;
            return (
              <div
                key={tier.name}
                style={{
                  position: "relative",
                  backgroundColor: CARD_BG,
                  border: `1px solid ${isPopular ? "rgba(255,82,0,0.45)" : BORDER}`,
                  borderRadius: 18,
                  padding: "36px 28px 32px",
                  display: "flex",
                  flexDirection: "column",
                  boxShadow: isPopular ? "0 0 0 1px rgba(255,82,0,0.2), 0 20px 60px -20px rgba(255,82,0,0.25)" : "none",
                }}
              >
                {isPopular && (
                  <div style={{
                    position: "absolute",
                    top: -12,
                    left: "50%",
                    transform: "translateX(-50%)",
                    backgroundColor: ORANGE,
                    color: "#fff",
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    padding: "5px 14px",
                    borderRadius: 999,
                  }}>
                    Most Popular
                  </div>
                )}

                <div style={{ marginBottom: 20 }}>
                  <h3 style={{
                    fontSize: 18,
                    fontWeight: 600,
                    fontFamily: "var(--font-space-grotesk)",
                    marginBottom: 8,
                    letterSpacing: "-0.01em",
                  }}>
                    {tier.name}
                  </h3>
                  <p style={{ fontSize: 13, color: TEXT_MUTED, lineHeight: 1.5 }}>
                    {tier.blurb}
                  </p>
                </div>

                <div style={{ marginBottom: 28, minHeight: 76 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                    <span style={{
                      fontSize: 44,
                      fontWeight: 600,
                      fontFamily: "var(--font-space-grotesk)",
                      letterSpacing: "-0.03em",
                      lineHeight: 1,
                    }}>
                      {tier.price}
                    </span>
                    {tier.priceSuffix && (
                      <span style={{ fontSize: 14, color: TEXT_MUTED }}>{tier.priceSuffix}</span>
                    )}
                  </div>
                  {tier.priceNote && (
                    <p style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 8, lineHeight: 1.5 }}>
                      {tier.priceNote}
                    </p>
                  )}
                </div>

                <Link
                  href={tier.ctaHref}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 14,
                    fontWeight: 600,
                    padding: "12px 20px",
                    borderRadius: 10,
                    textDecoration: "none",
                    marginBottom: 28,
                    backgroundColor: isPopular ? ORANGE : "transparent",
                    color: "#fff",
                    border: isPopular ? `1px solid ${ORANGE}` : "1px solid rgba(255,255,255,0.14)",
                    transition: "background-color 0.15s ease",
                  }}
                >
                  {tier.ctaLabel}
                </Link>

                <ul style={{
                  listStyle: "none",
                  padding: 0,
                  margin: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  borderTop: `1px solid ${BORDER}`,
                  paddingTop: 24,
                }}>
                  {tier.features.map((f) => (
                    <li key={f} style={{
                      display: "flex",
                      gap: 10,
                      fontSize: 13.5,
                      color: "rgba(255,255,255,0.78)",
                      lineHeight: 1.5,
                    }}>
                      <Check />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      <PricingFAQ />

      {/* FOOTER CTA */}
      <section style={{
        padding: "clamp(60px, 8vw, 96px) clamp(20px, 4vw, 56px)",
        textAlign: "center",
        borderTop: `1px solid ${BORDER}`,
        position: "relative", zIndex: 1,
      }}>
        <h2 style={{
          fontSize: "clamp(26px, 4vw, 40px)",
          fontWeight: 600,
          fontFamily: "var(--font-space-grotesk)",
          letterSpacing: "-0.025em",
          marginBottom: 14,
        }}>
          Ready to send better cold emails?
        </h2>
        <p style={{ color: TEXT_DIM, marginBottom: 28, fontSize: 15 }}>
          10 free emails. No credit card required.
        </p>
        <Link href="/signup" style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          fontSize: 14, fontWeight: 600,
          padding: "12px 24px",
          backgroundColor: ORANGE, color: "#fff",
          borderRadius: 999, textDecoration: "none",
        }}>
          Start free
        </Link>
      </section>
    </div>
  );
}
