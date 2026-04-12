"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/actions/auth";

interface SidebarProps {
  email: string;
  plan: string;
  creditsUsed: number;
  creditsLimit: number;
  pendingReplies?: number;
}

function NexoraLogo() {
  return (
    <svg width="36" height="36" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="48" height="48" rx="11" fill="#FF5200" />
      <path d="M13 36V12h4.5l13 16.5V12H35v24h-4.5L17.5 19.5V36H13z" fill="white" />
    </svg>
  );
}

function IconDashboard() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <rect x="9" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <rect x="1" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <rect x="9" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function IconCampaigns() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2 4h12M2 8h8M2 12h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function IconInbox() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M14 2H2a1 1 0 00-1 1v7a1 1 0 001 1h3v2.5L8.5 11H14a1 1 0 001-1V3a1 1 0 00-1-1z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconAnalytics() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="1" y="9" width="3" height="6" rx="1" stroke="currentColor" strokeWidth="1.4" />
      <rect x="6" y="5" width="3" height="10" rx="1" stroke="currentColor" strokeWidth="1.4" />
      <rect x="11" y="1" width="3" height="14" rx="1" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function IconSettings() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M2.929 2.929l1.06 1.06M12.01 12.01l1.06 1.061M2.929 13.071l1.06-1.06M12.01 3.99l1.06-1.061" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function IconLogout() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M11 11l3-3-3-3M14 8H6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const navLinks = [
  { label: "Dashboard",  href: "/dashboard",            icon: <IconDashboard /> },
  { label: "Campaigns",  href: "/dashboard/campaigns",  icon: <IconCampaigns /> },
  { label: "Inbox",      href: "/dashboard/inbox",      icon: <IconInbox /> },
  { label: "Analytics",  href: "/dashboard/analytics",  icon: <IconAnalytics /> },
  { label: "Settings",   href: "/dashboard/settings",   icon: <IconSettings /> },
];

const PLAN_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  free:    { label: "Free",    color: "#888",    bg: "rgba(255,255,255,0.06)" },
  starter: { label: "Starter", color: "#60a5fa", bg: "rgba(96,165,250,0.1)" },
  pro:     { label: "Pro",     color: "#ff5200", bg: "rgba(255,82,0,0.12)" },
  agency:  { label: "Agency",  color: "#a78bfa", bg: "rgba(167,139,250,0.12)" },
};

export default function Sidebar({ email, plan, creditsUsed, creditsLimit, pendingReplies = 0 }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside style={{
      width: 240, flexShrink: 0, position: "fixed",
      top: 0, left: 0, bottom: 0,
      backgroundColor: "var(--black-2)",
      borderRight: "1px solid rgba(255,255,255,0.06)",
      display: "flex", flexDirection: "column", zIndex: 40,
    }}>
      {/* Brand */}
      <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none" }}>
          <NexoraLogo />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.1em", color: "#fff", fontFamily: "var(--font-syne)", lineHeight: 1.2 }}>
              NEXORA
            </div>
            <div style={{ fontSize: 11, color: "#FF5200", fontFamily: "var(--font-outfit)", letterSpacing: "0.04em", marginTop: 1 }}>
              Outreach
            </div>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px 10px" }}>
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 2 }}>
          {navLinks.map((link) => {
            const active = link.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(link.href);
            const isInbox = link.label === "Inbox";
            const showInboxBadge = isInbox && pendingReplies > 0;
            const isAnalytics = link.label === "Analytics";
            const isProOrAgency = plan === "pro" || plan === "agency";

            return (
              <li key={link.label}>
                <Link
                  href={link.href}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "9px 12px", borderRadius: 8,
                    fontSize: 13.5, fontFamily: "var(--font-outfit)",
                    fontWeight: active ? 600 : 400,
                    backgroundColor: active ? "rgba(255,82,0,0.12)" : "transparent",
                    color: active ? "#FF5200" : "rgba(255,255,255,0.45)",
                    textDecoration: "none", transition: "background-color 0.15s, color 0.15s",
                  }}
                >
                  <span style={{ opacity: active ? 1 : 0.6, flexShrink: 0 }}>{link.icon}</span>
                  {link.label}
                  <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
                    {showInboxBadge && (
                      <span style={{
                        fontSize: 10, fontWeight: 700, lineHeight: 1,
                        padding: "2px 6px", borderRadius: 99,
                        backgroundColor: "#FF5200", color: "#fff", fontFamily: "var(--font-outfit)",
                      }}>
                        {pendingReplies > 99 ? "99+" : pendingReplies}
                      </span>
                    )}
                    {isAnalytics && !isProOrAgency && (
                      <span style={{
                        fontSize: 9, fontWeight: 700, lineHeight: 1,
                        padding: "2px 6px", borderRadius: 99,
                        backgroundColor: "rgba(255,82,0,0.1)", color: "#FF5200",
                        border: "1px solid rgba(255,82,0,0.2)", fontFamily: "var(--font-outfit)",
                        letterSpacing: "0.04em",
                      }}>
                        Pro
                      </span>
                    )}
                    {active && !showInboxBadge && !(isAnalytics && !isProOrAgency) && (
                      <span style={{ width: 5, height: 5, borderRadius: "50%", backgroundColor: "#FF5200" }} />
                    )}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User footer */}
      <div style={{ padding: "14px 14px 16px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        {/* Credits bar */}
        {(() => {
          const pct = creditsLimit === 999999 ? 5 : Math.min(100, Math.round((creditsUsed / creditsLimit) * 100));
          const exhausted = creditsUsed >= creditsLimit && creditsLimit !== 999999;
          const badge = PLAN_BADGE[plan] ?? PLAN_BADGE.free;
          return (
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: "var(--font-outfit)" }}>
                  {exhausted ? "Credits exhausted" : `${creditsUsed}/${creditsLimit === 999999 ? "∞" : creditsLimit} credits`}
                </span>
                <span style={{ fontSize: 10, fontWeight: 600, color: badge.color, background: badge.bg, padding: "1px 7px", borderRadius: 4, fontFamily: "var(--font-outfit)" }}>
                  {badge.label}
                </span>
              </div>
              <div style={{ height: 3, background: "rgba(255,255,255,0.07)", borderRadius: 2, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${pct}%`, borderRadius: 2, background: exhausted ? "#ef4444" : "#ff5200", transition: "width 0.5s" }} />
              </div>
            </div>
          );
        })()}

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <div style={{
            width: 30, height: 30, borderRadius: "50%",
            backgroundColor: "rgba(255,82,0,0.15)", border: "1px solid rgba(255,82,0,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, fontWeight: 700, color: "#FF5200", fontFamily: "var(--font-syne)", flexShrink: 0,
          }}>
            {email[0].toUpperCase()}
          </div>
          <div style={{
            fontSize: 12, color: "rgba(255,255,255,0.45)", fontFamily: "var(--font-outfit)",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }} title={email}>
            {email}
          </div>
        </div>

        <form action={logout}>
          <button type="submit" style={{
            width: "100%", padding: "7px 12px", borderRadius: 7,
            border: "1px solid rgba(255,255,255,0.07)", backgroundColor: "transparent",
            color: "rgba(255,255,255,0.35)", fontSize: 12, fontFamily: "var(--font-outfit)",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            transition: "border-color 0.15s, color 0.15s",
          }}>
            <IconLogout />
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
