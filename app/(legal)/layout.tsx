import Link from "next/link";
import { NexoraLogo } from "@/components/ui/nexora-logo";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      backgroundColor: "#080810",
      minHeight: "100dvh",
      color: "#fff",
      fontFamily: "var(--font-outfit)",
    }}>
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        height: 60,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 clamp(20px, 5vw, 64px)",
        backgroundColor: "rgba(8,8,16,0.85)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
      }}>
        <Link href="/" style={{ textDecoration: "none" }}>
          <NexoraLogo size={24} wordmarkSize={14} />
        </Link>
        <Link href="/" style={{
          fontSize: 12.5,
          color: "rgba(255,255,255,0.4)",
          textDecoration: "none",
          display: "flex", alignItems: "center", gap: 6,
        }}>
          <span style={{ fontSize: 14 }}>&#8592;</span> Back to home
        </Link>
      </nav>

      <main style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "clamp(40px, 6vw, 72px) clamp(20px, 5vw, 0px) 80px",
      }}>
        {children}
      </main>

      <footer style={{
        borderTop: "1px solid rgba(255,255,255,0.06)",
        padding: "20px clamp(20px, 5vw, 64px)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: 12,
      }}>
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>
          &copy; {new Date().getFullYear()} Nexora Studios
        </span>
        <div style={{ display: "flex", gap: 20 }}>
          {[["Privacy", "/privacy"], ["Terms", "/terms"], ["Cookies", "/cookies"], ["Contact", "/contact"]].map(([label, href]) => (
            <Link key={label} href={href} style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", textDecoration: "none" }}>
              {label}
            </Link>
          ))}
        </div>
      </footer>
    </div>
  );
}
