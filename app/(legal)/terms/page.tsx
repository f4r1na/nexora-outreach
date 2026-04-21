import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service - Nexora Outreach",
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

export default function TermsPage() {
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
          Terms of Service
        </h1>
        <p style={{ fontSize: 13.5, color: "rgba(255,255,255,0.4)" }}>
          Last updated: April 21, 2026
        </p>
      </div>

      <Section title="Who these terms apply to">
        <P>By creating a Nexora account or using the service, you agree to these terms. If you are using Nexora on behalf of a company, you are agreeing on that company's behalf.</P>
      </Section>

      <Section title="Acceptable use">
        <P>You may use Nexora to run legitimate sales outreach. You may not use Nexora to:</P>
        <UL items={[
          "Send spam, bulk unsolicited email, or violate CAN-SPAM, GDPR, or other applicable email laws",
          "Harass, threaten, or abuse individuals",
          "Send emails containing illegal content, hate speech, or malware",
          "Impersonate another person or company",
          "Scrape, reverse engineer, or attempt to access our systems beyond normal use",
          "Resell or sublicense access to Nexora without written permission",
        ]} />
        <P>We reserve the right to suspend accounts that violate these rules without notice.</P>
      </Section>

      <Section title="Payment terms">
        <P>Paid plans are billed monthly in advance via Stripe. Your subscription renews automatically unless you cancel.</P>
        <UL items={[
          "No refunds on paid billing periods",
          "You can cancel anytime from Settings - access continues until the end of your current billing period",
          "Downgrading takes effect at the next billing cycle",
          "We may change pricing with 30 days notice",
        ]} />
        <P>All prices are in USD. Stripe handles payment processing - we never store your card details.</P>
      </Section>

      <Section title="Liability limits">
        <P>Nexora is provided as-is. We do not guarantee email deliverability, lead quality, reply rates, or any specific business outcomes from using the product.</P>
        <P>To the maximum extent permitted by law:</P>
        <UL items={[
          "We are not liable for indirect, incidental, or consequential damages",
          "Our total liability is limited to the amount you paid us in the 30 days before the claim",
          "We are not responsible for third-party services (Gmail, Stripe, AI providers)",
        ]} />
      </Section>

      <Section title="Account termination">
        <P>You can delete your account at any time from Settings. Your data will be permanently removed within 30 days.</P>
        <P>We may suspend or terminate accounts that:</P>
        <UL items={[
          "Violate these terms or our acceptable use policy",
          "Are suspected of fraudulent activity",
          "Have outstanding unpaid balances",
        ]} />
        <P>If we terminate your account for policy violations, you are not entitled to a refund.</P>
      </Section>

      <Section title="Intellectual property">
        <P>You own your data - your leads, campaign content, and emails belong to you. You can export and delete them at any time.</P>
        <P>Nexora owns the platform, codebase, AI prompts, and product design. You may not copy or replicate the platform.</P>
        <P>By using Nexora, you grant us a license to process your data to provide the service.</P>
      </Section>

      <Section title="Changes to these terms">
        <P>We may update these terms occasionally. We will notify you by email and update the date at the top of this page. Continued use of Nexora after changes means you accept the new terms.</P>
      </Section>

      <Section title="Contact">
        <P>
          Questions about these terms? Email{" "}
          <a href="mailto:legal@nexoraoutreach.com" style={{ color: "#FF5200" }}>
            legal@nexoraoutreach.com
          </a>
          .
        </P>
      </Section>
    </>
  );
}
