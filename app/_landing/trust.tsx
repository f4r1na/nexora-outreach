import { ShieldCheck, XCircle, Gift, Clock } from "lucide-react";

const ITEMS = [
  { Icon: XCircle,     text: "No credit card required" },
  { Icon: ShieldCheck, text: "Cancel anytime"          },
  { Icon: Gift,        text: "50 free emails to start" },
  { Icon: Clock,       text: "Setup in 2 minutes"      },
];

export function TrustBar() {
  return (
    <div style={{
      display: "flex", flexWrap: "wrap", justifyContent: "center",
      gap: "10px 24px",
      marginTop: 22,
    }}>
      {ITEMS.map(({ Icon, text }) => (
        <div key={text} style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
          <Icon size={13} color="rgba(245,158,11,0.85)" />
          <span style={{ fontSize: 12.5, color: "rgba(255,255,255,0.55)" }}>{text}</span>
        </div>
      ))}
    </div>
  );
}

const TESTIMONIALS = [
  {
    quote: "Nexora helped us book 12 meetings in our first week. The personalization is unlike anything we've tried before.",
    name: "Marcus T.", role: "Founder at DevFlow", initials: "MT", color: "#FF5200",
  },
  {
    quote: "I was skeptical about AI outreach but the open rates speak for themselves. 52% on our last campaign.",
    name: "Sarah K.", role: "Head of Growth at Sparkline", initials: "SK", color: "#F59E0B",
  },
  {
    quote: "Set it up on Monday, had replies by Tuesday. This is the future of B2B outreach.",
    name: "James R.", role: "Sales Director at Meridian", initials: "JR", color: "#FF5200",
  },
];

const TRUSTED = ["DevFlow", "Sparkline", "Meridian", "Capsule", "Northgate", "Velo"];

export function Testimonials() {
  return (
    <section style={{
      padding: "clamp(72px, 10vw, 120px) clamp(20px, 4vw, 56px)",
      position: "relative", zIndex: 1,
      borderTop: "1px solid rgba(255,255,255,0.06)",
    }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ marginBottom: 48, textAlign: "center" }}>
          <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.1em", color: "#FF5200", textTransform: "uppercase", marginBottom: 12 }}>
            Loved by sales teams
          </p>
          <h2 style={{
            fontSize: "clamp(30px, 4.5vw, 48px)",
            fontWeight: 600, fontFamily: "var(--font-space-grotesk)",
            letterSpacing: "-0.03em", lineHeight: 1.05,
            maxWidth: 560, margin: "0 auto",
          }}>
            Results you can point to.
          </h2>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 16,
          marginBottom: 64,
        }}>
          {TESTIMONIALS.map((t) => (
            <div key={t.name} style={{
              backgroundColor: "#0E0E18",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 16,
              padding: "24px 22px",
              display: "flex", flexDirection: "column", gap: 20,
            }}>
              <p style={{
                fontSize: 14.5, lineHeight: 1.6,
                color: "rgba(255,255,255,0.78)",
                fontFamily: "var(--font-outfit)",
              }}>
                &ldquo;{t.quote}&rdquo;
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: "auto" }}>
                <div style={{
                  width: 36, height: 36, borderRadius: "50%",
                  backgroundColor: `${t.color}18`,
                  border: `1px solid ${t.color}38`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 600, color: t.color,
                  fontFamily: "var(--font-space-grotesk)",
                }}>
                  {t.initials}
                </div>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: "#fff", fontFamily: "var(--font-space-grotesk)" }}>
                    {t.name}
                  </div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: "center" }}>
          <p style={{
            fontSize: 11, fontWeight: 500, letterSpacing: "0.1em",
            color: "rgba(255,255,255,0.35)", textTransform: "uppercase",
            marginBottom: 18,
          }}>
            Trusted by teams at
          </p>
          <div style={{
            display: "flex", flexWrap: "wrap", justifyContent: "center",
            gap: "10px 28px",
          }}>
            {TRUSTED.map((n, i) => (
              <span key={n} style={{
                fontSize: 15, fontWeight: 500,
                fontFamily: "var(--font-space-grotesk)",
                color: "rgba(255,255,255,0.42)",
                letterSpacing: "-0.01em",
              }}>
                {n}{i < TRUSTED.length - 1 && <span style={{ marginLeft: 28, color: "rgba(255,255,255,0.15)" }}>·</span>}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
