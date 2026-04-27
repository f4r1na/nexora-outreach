import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy - Nexora Outreach",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 40 }}>
      <h2 style={{
        fontSize: 13, fontWeight: 600, letterSpacing: "0.08em",
        textTransform: "uppercase", color: "#FF5200",
        fontFamily: "var(--font-outfit)", marginBottom: 14,
      }}>
        {title}
      </h2>
      <div style={{ fontSize: 14.5, color: "rgba(255,255,255,0.65)", lineHeight: 1.75 }}>
        {children}
      </div>
    </section>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p style={{ marginBottom: 12 }}>{children}</p>;
}

function UL({ items }: { items: string[] }) {
  return (
    <ul style={{ paddingLeft: 20, margin: "8px 0 12px" }}>
      {items.map((item) => (
        <li key={item} style={{ marginBottom: 6 }}>{item}</li>
      ))}
    </ul>
  );
}

export default function PrivacyPage() {
  return (
    <>
      <div style={{ marginBottom: 48 }}>
        <p style={{
          fontSize: 11, fontWeight: 500, letterSpacing: "0.1em",
          color: "#F59E0B", textTransform: "uppercase", marginBottom: 12,
        }}>
          Legal
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
          Privacy Policy
        </h1>
        <p style={{ fontSize: 13.5, color: "rgba(255,255,255,0.4)" }}>
          Last updated: April 27, 2026
        </p>
      </div>

      <Section title="What we collect">
        <P>We collect the minimum data needed to run the product.</P>
        <UL items={[
          "Account info: your email address and password (hashed) when you sign up",
          "Outreach data: company names, job titles, and email addresses you use in campaigns",
          "Business signals: funding news, hiring data, and other signals you provide or import",
          "Usage data: which features you use and how often, to improve the product",
          "Payment info: handled entirely by Stripe - we never see or store your card number",
          "Gmail tokens: OAuth tokens used to send emails on your behalf, stored encrypted",
        ]} />
      </Section>

      <Section title="How we use it">
        <UL items={[
          "To generate AI-powered outreach campaigns from your prompts",
          "To send emails and follow-ups through your connected Gmail account",
          "To show you analytics on opens, clicks, and replies",
          "To improve Nexora's AI models (using anonymized, aggregated data only)",
        ]} />
        <P>We never sell your data to third parties. We never use your campaign content or lead data to train AI models without your consent.</P>
      </Section>

      <Section title="Storage">
        <P>Your data is stored on Supabase (PostgreSQL), with servers in the US and EU. All data is encrypted at rest (AES-256) and in transit (TLS 1.2+).</P>
        <P>Gmail OAuth tokens are stored server-side and never exposed to the browser or included in API responses.</P>
        <P>We retain your data for as long as your account is active. When you delete your account, your data is permanently removed within 30 days.</P>
      </Section>

      <Section title="Your rights (GDPR)">
        <P>If you are in the EU or UK, you have the following rights under GDPR:</P>
        <UL items={[
          "Access: request a copy of all data we hold about you",
          "Deletion: delete your account and all associated data at any time from Settings",
          "Export: download your leads and campaigns as CSV from the dashboard",
          "Correction: update your account information at any time",
          "Portability: receive your data in a machine-readable format",
          "Object: opt out of data processing for AI model improvement",
        ]} />
        <P>To exercise any of these rights, email us at <a href="mailto:privacy@nexoraoutreach.com" style={{ color: "#FF5200" }}>privacy@nexoraoutreach.com</a>. We respond within 30 days.</P>
      </Section>

      <Section title="CAN-SPAM compliance">
        <P>Every email sent through Nexora includes your company name, a physical mailing address, and a working unsubscribe link. Unsubscribe requests are processed immediately. The sender is identified in every message.</P>
        <P>As the account holder you are responsible for ensuring your physical mailing address is kept up to date in Settings {">"} Compliance. Sending is blocked if no address is on file.</P>
      </Section>

      <Section title="CASL compliance">
        <P>If you send emails to recipients in Canada, you are responsible for obtaining express or implied consent as required by the Canadian Anti-Spam Legislation (CASL) before sending.</P>
        <P>Nexora provides the unsubscribe mechanism required by section 11 of CASL. Unsubscribe requests are honoured within 10 business days.</P>
      </Section>

      <Section title="Third-party services">
        <UL items={[
          "Supabase - database and authentication (supabase.com/privacy)",
          "Stripe - payment processing (stripe.com/privacy)",
          "Anthropic / OpenAI - AI model providers (data is not used to train their models per our agreements)",
          "Google OAuth - Gmail integration (subject to Google's privacy policy)",
        ]} />
      </Section>

      <Section title="Contact">
        <P>
          For privacy requests or questions, email{" "}
          <a href="mailto:privacy@nexoraoutreach.com" style={{ color: "#FF5200" }}>
            privacy@nexoraoutreach.com
          </a>
          . We aim to respond within 30 days.
        </P>
      </Section>
    </>
  );
}
