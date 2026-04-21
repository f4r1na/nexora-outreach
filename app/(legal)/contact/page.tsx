import { Metadata } from "next";
import { Mail, Lock, FileText } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact - Nexora Outreach",
};

const CARDS: { Icon: LucideIcon; label: string; email: string; note: string }[] = [
  {
    Icon: Mail,
    label: "General Support",
    email: "support@nexoraoutreach.com",
    note: "Reply within 24h",
  },
  {
    Icon: Lock,
    label: "Privacy & Data",
    email: "privacy@nexoraoutreach.com",
    note: "GDPR compliant",
  },
  {
    Icon: FileText,
    label: "Legal",
    email: "legal@nexoraoutreach.com",
    note: "3-5 business days",
  },
];

export default function ContactPage() {
  return (
    <>
      {/* Hero */}
      <div style={{ marginBottom: 56 }}>
        <p style={{
          fontSize: 11, fontWeight: 500, letterSpacing: "0.1em",
          color: "#F59E0B", textTransform: "uppercase", marginBottom: 14,
          fontFamily: "var(--font-outfit)",
        }}>
          Support
        </p>
        <h1 style={{
          fontSize: "clamp(36px, 5vw, 56px)",
          fontWeight: 600,
          fontFamily: "var(--font-space-grotesk)",
          letterSpacing: "-0.03em",
          lineHeight: 1.05,
          color: "#fff",
          marginBottom: 18,
        }}>
          Get in touch
        </h1>
        <p style={{
          fontSize: 15,
          color: "rgba(255,255,255,0.5)",
          lineHeight: 1.65,
          fontFamily: "var(--font-outfit)",
          maxWidth: 380,
          margin: 0,
        }}>
          We read every message. No bots, no ticket queues.
        </p>
      </div>

      {/* Contact cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
        gap: 12,
        marginBottom: 48,
      }}>
        {CARDS.map(({ Icon, label, email, note }) => (
          <div key={label} style={{
            backgroundColor: "#0E0E18",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 16,
            padding: "24px 22px 22px",
            display: "flex",
            flexDirection: "column",
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, marginBottom: 18,
              backgroundColor: "rgba(255,82,0,0.08)",
              border: "1px solid rgba(255,82,0,0.16)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <Icon size={15} color="#FF5200" />
            </div>

            <p style={{
              fontSize: 10, fontWeight: 600, letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.35)",
              fontFamily: "var(--font-outfit)",
              marginBottom: 8,
            }}>
              {label}
            </p>

            <a
              href={`mailto:${email}`}
              style={{
                fontSize: 13, fontWeight: 500,
                color: "#fff",
                textDecoration: "none",
                fontFamily: "var(--font-outfit)",
                marginBottom: 10,
                wordBreak: "break-all",
                lineHeight: 1.4,
              }}
            >
              {email}
            </a>

            <p style={{
              fontSize: 11.5,
              color: "rgba(255,255,255,0.28)",
              fontFamily: "var(--font-outfit)",
              margin: 0,
              marginTop: "auto",
            }}>
              {note}
            </p>
          </div>
        ))}
      </div>

      {/* Direct line */}
      <div style={{
        borderTop: "1px solid rgba(255,255,255,0.06)",
        paddingTop: 28,
        display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8,
      }}>
        <span style={{
          fontSize: 13.5, color: "rgba(255,255,255,0.38)",
          fontFamily: "var(--font-outfit)",
        }}>
          Or email us directly:
        </span>
        <a
          href="mailto:support@nexoraoutreach.com"
          style={{
            fontSize: 13.5, fontWeight: 500,
            color: "#FF5200",
            textDecoration: "none",
            fontFamily: "var(--font-outfit)",
          }}
        >
          support@nexoraoutreach.com
        </a>
      </div>
    </>
  );
}
