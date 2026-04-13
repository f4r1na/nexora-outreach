"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { logout } from "@/app/actions/auth";

interface SidebarProps {
  email: string;
  plan: string;
  creditsUsed: number;
  creditsLimit: number;
  pendingReplies?: number;
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconDashboard() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function IconCampaigns() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M2 9h20M7 4v5M17 4v5" />
    </svg>
  );
}

function IconInbox() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  );
}

function IconAnalytics() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

function IconSettings() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  );
}

function IconLogout() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
    </svg>
  );
}

const navLinks = [
  { label: "Dashboard",  href: "/dashboard",           icon: <IconDashboard /> },
  { label: "Campaigns",  href: "/dashboard/campaigns", icon: <IconCampaigns /> },
  { label: "Inbox",      href: "/dashboard/inbox",     icon: <IconInbox /> },
  { label: "Analytics",  href: "/dashboard/analytics", icon: <IconAnalytics /> },
  { label: "Settings",   href: "/dashboard/settings",  icon: <IconSettings /> },
];

export default function Sidebar({ email, plan, creditsUsed, creditsLimit, pendingReplies }: SidebarProps) {
  const pathname = usePathname();

  const isUnlimited = creditsLimit === 999999;
  const creditsLeft = isUnlimited ? 0 : Math.max(0, creditsLimit - creditsUsed);
  const creditPct = isUnlimited ? 0 : Math.min(100, Math.round((creditsUsed / creditsLimit) * 100));
  const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1);

  return (
    <aside style={{
      width: 232,
      flexShrink: 0,
      position: "fixed",
      top: 0,
      left: 0,
      bottom: 0,
      backgroundColor: "#070707",
      borderRight: "1px solid rgba(255,255,255,0.055)",
      display: "flex",
      flexDirection: "column",
      zIndex: 40,
    }}>
      {/* Logo */}
      <div style={{ padding: "20px 16px 16px" }}>
        <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <div style={{
            width: 28,
            height: 28,
            backgroundColor: "#FF5200",
            borderRadius: 7,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M2 12V2h2.5l5.5 7V2H12v10h-2.5L4 5v7H2z" fill="white" />
            </svg>
          </div>
          <span style={{
            fontSize: 14,
            fontWeight: 600,
            color: "#fff",
            fontFamily: "var(--font-syne)",
            letterSpacing: "-0.02em",
          }}>
            Nexora
          </span>
        </Link>
      </div>

      <div style={{ height: 1, backgroundColor: "rgba(255,255,255,0.05)", margin: "0 0 8px" }} />

      {/* Nav */}
      <nav style={{ flex: 1, padding: "4px 10px" }}>
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 2 }}>
          {navLinks.map((link) => {
            const active = link.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(link.href);
            const hasBadge = link.href === "/dashboard/inbox" && (pendingReplies ?? 0) > 0;

            return (
              <li key={link.label} style={{ position: "relative" }}>
                {active && (
                  <motion.div
                    layoutId="sidebar-active-bg"
                    style={{
                      position: "absolute",
                      inset: 0,
                      borderRadius: 7,
                      backgroundColor: "rgba(255,82,0,0.07)",
                      borderLeft: "2px solid #FF5200",
                    }}
                    transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
                  />
                )}
                <Link
                  href={link.href}
                  className={`nav-link${active ? " nav-link-active" : ""}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 10px",
                    paddingLeft: active ? 10 : 12,
                    borderRadius: 7,
                    fontSize: 13,
                    fontFamily: "var(--font-outfit)",
                    fontWeight: active ? 500 : 400,
                    color: active ? "#e8e8e8" : "#4a4a4a",
                    textDecoration: "none",
                    position: "relative",
                    zIndex: 1,
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    <span style={{ flexShrink: 0, display: "flex" }}>{link.icon}</span>
                    {link.label}
                  </span>
                  {hasBadge && (
                    <span style={{
                      fontSize: 9,
                      fontWeight: 600,
                      color: "#FF5200",
                      backgroundColor: "rgba(255,82,0,0.1)",
                      border: "1px solid rgba(255,82,0,0.2)",
                      borderRadius: 999,
                      padding: "1px 5px",
                      lineHeight: 1.6,
                      fontFamily: "var(--font-outfit)",
                      flexShrink: 0,
                    }}>
                      {pendingReplies}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom: credits + user */}
      <div style={{ padding: "12px 12px 16px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        {/* Credit usage bar */}
        {!isUnlimited && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ fontSize: 10, color: "#383838", fontFamily: "var(--font-outfit)" }}>
                {creditsLeft} credits left
              </span>
              <span style={{ fontSize: 10, color: "#2e2e2e", fontFamily: "var(--font-outfit)" }}>
                {creditsLimit}
              </span>
            </div>
            <div className="credit-bar-track">
              <div className="credit-bar-fill" style={{ width: `${creditPct}%` }} />
            </div>
          </div>
        )}

        {/* Email + plan badge */}
        <div style={{ marginBottom: 8 }}>
          <div style={{
            fontSize: 11,
            color: "#3a3a3a",
            fontFamily: "var(--font-outfit)",
            marginBottom: 4,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }} title={email}>
            {email}
          </div>
          <span style={{
            fontSize: 9,
            fontWeight: 600,
            fontFamily: "var(--font-outfit)",
            color: "#FF5200",
            backgroundColor: "rgba(255,82,0,0.08)",
            border: "1px solid rgba(255,82,0,0.15)",
            borderRadius: 999,
            padding: "2px 7px",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}>
            {planLabel}
          </span>
        </div>

        <form action={logout}>
          <button
            type="submit"
            className="btn-ghost"
            aria-label="Sign out"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              padding: "6px 10px",
              borderRadius: 6,
              border: "1px solid rgba(255,255,255,0.06)",
              backgroundColor: "transparent",
              color: "#383838",
              fontSize: 12,
              fontFamily: "var(--font-outfit)",
              cursor: "pointer",
              width: "100%",
            }}
          >
            <IconLogout />
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
