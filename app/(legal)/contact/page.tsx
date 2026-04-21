import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact - Nexora Outreach",
};

function ContactCard({
  icon, title, desc, email, response,
}: {
  icon: string; title: string; desc: string; email: string; response: string;
}) {
  return (
    <div style={{
      padding: "24px 22px",
      backgroundColor: "rgba(255,255,255,0.02)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 14,
    }}>
      <div style={{ fontSize: 22, marginBottom: 12 }}>{icon}</div>
      <h3 style={{
        fontSize: 15, fontWeight: 600, color: "#fff",
        fontFamily: "var(--font-space-grotesk)",
        marginBottom: 6, letterSpacing: "-0.01em",
      }}>
        {title}
      </h3>
      <p style={{ fontSize: 13.5, color: "rgba(255,255,255,0.5)", lineHeight: 1.55, marginBottom: 16 }}>
        {desc}
      </p>
      <a
        href={`mailto:${email}`}
        style={{
          display: "inline-block",
          fontSize: 13, fontWeight: 500,
          color: "#FF5200",
          textDecoration: "none",
          padding: "8px 16px",
          backgroundColor: "rgba(255,82,0,0.08)",
          border: "1px solid rgba(255,82,0,0.2)",
          borderRadius: 8,
          fontFamily: "var(--font-outfit)",
        }}
      >
        {email}
      </a>
      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 12 }}>
        {response}
      </p>
    </div>
  );
}

export default function ContactPage() {
  return (
    <>
      <div style={{ marginBottom: 48 }}>
        <p style={{
          fontSize: 11, fontWeight: 500, letterSpacing: "0.1em",
          color: "#F59E0B", textTransform: "uppercase", marginBottom: 12,
        }}>
          Support
        </p>
        <h1 style={{
          fontSize: "clamp(28px, 5vw, 44px)",
          fontWeight: 600,
          fontFamily: "var(--font-space-grotesk)",
          letterSpacing: "-0.03em",
          lineHeight: 1.1,
          color: "#fff",
          marginBottom: 16,
        }}>
          Get in touch
        </h1>
        <p style={{ fontSize: 15, color: "rgba(255,255,255,0.5)", lineHeight: 1.65, maxWidth: 520 }}>
          We are a small team. We read every message and respond to everything. No bots, no ticket queues.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 48 }}>
        <ContactCard
          icon="&#9993;"
          title="General support"
          desc="Product questions, bugs, billing issues, or anything else about using Nexora."
          email="support@nexoraoutreach.com"
          response="We reply within 24 hours on weekdays."
        />
        <ContactCard
          icon="&#128274;"
          title="Privacy & data requests"
          desc="Account deletion, data export, GDPR requests, or questions about how we handle your data."
          email="privacy@nexoraoutreach.com"
          response="We respond to data requests within 30 days as required by GDPR."
        />
        <ContactCard
          icon="&#128203;"
          title="Legal & partnerships"
          desc="Terms of service questions, enterprise agreements, or partnership inquiries."
          email="legal@nexoraoutreach.com"
          response="Typically within 3-5 business days."
        />
      </div>

      <div style={{
        padding: "20px 22px",
        backgroundColor: "rgba(255,82,0,0.04)",
        border: "1px solid rgba(255,82,0,0.14)",
        borderRadius: 12,
        fontSize: 13.5,
        color: "rgba(255,255,255,0.5)",
        lineHeight: 1.65,
      }}>
        <strong style={{ color: "rgba(255,255,255,0.8)" }}>Working hours:</strong> Monday to Friday, 9am - 6pm CET.
        Messages sent outside these hours will be answered the next business day.
      </div>
    </>
  );
}
