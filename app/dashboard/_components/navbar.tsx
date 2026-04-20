"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { logout } from "@/app/actions/auth";
import { Settings, LogOut, Sparkles } from "lucide-react";
import { NexoraLogo } from "@/components/ui/nexora-logo";

interface NavbarProps {
  email: string;
  plan: string;
}

type NavItem = { label: string; href: string; exact?: boolean };

const NAV: NavItem[] = [
  { label: "Agent",     href: "/dashboard",            exact: true },
  { label: "Campaigns", href: "/dashboard/campaigns"               },
  { label: "Inbox",     href: "/dashboard/inbox"                   },
];

const EASE = [0.23, 1, 0.32, 1] as const;

export default function Navbar({ email, plan }: NavbarProps) {
  const pathname = usePathname();

  return (
    <motion.nav
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: EASE }}
      style={{
        position: "fixed",
        top: 0, left: 0, right: 0,
        height: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 28px",
        backgroundColor: "rgba(8,8,16,0.8)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        zIndex: 50,
      }}
    >
      {/* Logo */}
      <Link href="/dashboard" style={{ textDecoration: "none" }}>
        <NexoraLogo size={24} wordmarkSize={15} />
      </Link>

      {/* Nav links */}
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        {NAV.map(({ label, href, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              style={{
                position: "relative",
                padding: "6px 14px",
                borderRadius: 999,
                fontSize: 13,
                fontFamily: "var(--font-outfit)",
                fontWeight: active ? 500 : 400,
                color: active ? "#fff" : "rgba(255,255,255,0.45)",
                textDecoration: "none",
                transition: "color 150ms ease",
              }}
            >
              {active && (
                <motion.span
                  layoutId="nav-pill"
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: 999,
                    backgroundColor: "rgba(255,255,255,0.08)",
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span style={{ position: "relative", zIndex: 1 }}>{label}</span>
            </Link>
          );
        })}
      </div>

      {/* Right side */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {plan !== "free" && (
          <div style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "3px 8px",
            backgroundColor: "rgba(255,82,0,0.08)",
            border: "1px solid rgba(255,82,0,0.2)",
            borderRadius: 4,
          }}>
            <Sparkles size={10} color="#FF5200" />
            <span style={{ fontSize: 10, fontWeight: 500, color: "#FF5200", fontFamily: "var(--font-outfit)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {plan}
            </span>
          </div>
        )}
        <Link
          href="/dashboard/settings"
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: 32, height: 32, borderRadius: 6,
            color: "#555",
            textDecoration: "none",
          }}
        >
          <Settings size={15} />
        </Link>
        <form action={logout}>
          <button type="submit" style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: 32, height: 32, borderRadius: 6,
            background: "none", border: "none", cursor: "pointer",
            color: "#555",
          }}>
            <LogOut size={14} />
          </button>
        </form>
      </div>
    </motion.nav>
  );
}
