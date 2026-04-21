import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookie Policy - Nexora Outreach",
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

function P({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <p style={{ marginBottom: 12, ...style }}>{children}</p>;
}

function CookieTable({ rows }: { rows: { name: string; purpose: string; type: string; expiry: string }[] }) {
  return (
    <div style={{
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 10, overflow: "hidden",
      margin: "12px 0 16px",
    }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ backgroundColor: "rgba(255,255,255,0.04)" }}>
            {["Name", "Purpose", "Type", "Expiry"].map((h) => (
              <th key={h} style={{
                padding: "10px 14px", textAlign: "left",
                fontWeight: 500, color: "rgba(255,255,255,0.5)",
                borderBottom: "1px solid rgba(255,255,255,0.07)",
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.name} style={{
              backgroundColor: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)",
            }}>
              <td style={{ padding: "10px 14px", color: "#fff", fontFamily: "monospace", fontSize: 12 }}>{row.name}</td>
              <td style={{ padding: "10px 14px", color: "rgba(255,255,255,0.6)" }}>{row.purpose}</td>
              <td style={{ padding: "10px 14px", color: "rgba(255,255,255,0.6)" }}>{row.type}</td>
              <td style={{ padding: "10px 14px", color: "rgba(255,255,255,0.6)" }}>{row.expiry}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function CookiesPage() {
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
          Cookie Policy
        </h1>
        <p style={{ fontSize: 13.5, color: "rgba(255,255,255,0.4)" }}>
          Last updated: April 21, 2026
        </p>
      </div>

      <Section title="What are cookies">
        <P>Cookies are small text files stored in your browser when you visit a website. Nexora uses a minimal set of cookies - only what is required for the product to work.</P>
        <P>We do not use advertising cookies, cross-site tracking, or sell data to ad networks.</P>
      </Section>

      <Section title="Authentication cookies">
        <P>These cookies are required for login and session management. Without them, you cannot stay logged in to Nexora.</P>
        <CookieTable rows={[
          { name: "sb-access-token", purpose: "Supabase session - keeps you logged in", type: "Essential", expiry: "1 hour" },
          { name: "sb-refresh-token", purpose: "Supabase session refresh - renews your session", type: "Essential", expiry: "7 days" },
          { name: "sb-auth-token", purpose: "Authentication state", type: "Essential", expiry: "Session" },
        ]} />
        <P>These cookies are set by Supabase, our authentication provider. They contain encrypted tokens only - no personal information is stored in them directly.</P>
      </Section>

      <Section title="Analytics cookies">
        <P>We use minimal, privacy-focused analytics to understand how the product is used. This helps us prioritize improvements.</P>
        <CookieTable rows={[
          { name: "nx_session", purpose: "Anonymous session tracking for product analytics", type: "Analytics", expiry: "30 days" },
        ]} />
        <P>Analytics data is aggregated and anonymized. We do not track individual users across other websites.</P>
      </Section>

      <Section title="No advertising cookies">
        <P>Nexora does not use advertising cookies, retargeting pixels, or any third-party tracking for advertising purposes. We do not share cookie data with ad networks.</P>
      </Section>

      <Section title="How to opt out">
        <P>You can manage or block cookies through your browser settings:</P>
        <ul style={{ paddingLeft: 20, color: "rgba(255,255,255,0.65)", lineHeight: 2 }}>
          <li><strong style={{ color: "rgba(255,255,255,0.8)" }}>Chrome:</strong> Settings &rarr; Privacy and Security &rarr; Cookies</li>
          <li><strong style={{ color: "rgba(255,255,255,0.8)" }}>Firefox:</strong> Settings &rarr; Privacy &amp; Security</li>
          <li><strong style={{ color: "rgba(255,255,255,0.8)" }}>Safari:</strong> Preferences &rarr; Privacy</li>
        </ul>
        <P style={{ marginTop: 12 }}>Note: blocking essential cookies will prevent you from logging in to Nexora.</P>
      </Section>

      <Section title="Contact">
        <P>
          Questions about cookies? Email{" "}
          <a href="mailto:privacy@nexoraoutreach.com" style={{ color: "#FF5200" }}>
            privacy@nexoraoutreach.com
          </a>
          .
        </P>
      </Section>
    </>
  );
}
