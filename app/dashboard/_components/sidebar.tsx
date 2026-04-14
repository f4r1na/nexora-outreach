"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { logout } from "@/app/actions/auth";
import {
  LayoutDashboard,
  Mail,
  Inbox,
  BarChart3,
  Settings,
  LogOut,
} from "lucide-react";

interface SidebarProps {
  email: string;
  plan: string;
  creditsUsed: number;
  creditsLimit: number;
  pendingReplies?: number;
}

const NAV = [
  { label: "Dashboard",  href: "/dashboard",            icon: LayoutDashboard, exact: true },
  { label: "Campaigns",  href: "/dashboard/campaigns",  icon: Mail },
  { label: "Inbox",      href: "/dashboard/inbox",      icon: Inbox },
  { label: "Analytics",  href: "/dashboard/analytics",  icon: BarChart3 },
  { label: "Settings",   href: "/dashboard/settings",   icon: Settings },
] as const;

const EASE = [0.23, 1, 0.32, 1] as const;

export default function Sidebar({ email, plan, creditsUsed, creditsLimit, pendingReplies }: SidebarProps) {
  const pathname = usePathname();

  const isUnlimited = creditsLimit === 999999;
  const creditsLeft = isUnlimited ? null : Math.max(0, creditsLimit - creditsUsed);
  const creditPct   = isUnlimited ? 0 : Math.min(100, Math.round((creditsUsed / creditsLimit) * 100));
  const planLabel   = plan.charAt(0).toUpperCase() + plan.slice(1);

  return (
    <aside style={{
      width: 240,
      flexShrink: 0,
      position: "fixed",
      top: 0, left: 0, bottom: 0,
      backgroundColor: "#080808",
      borderRight: "1px solid rgba(255,255,255,0.055)",
      display: "flex",
      flexDirection: "column",
      zIndex: 40,
    }}>

      {/* Logo */}
      <div style={{ padding: "20px 16px 14px" }}>
        <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none" }}>
          <div style={{
            width: 30, height: 30,
            backgroundColor: "#FF5200",
            borderRadius: 8,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <svg width="15" height="15" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M2 12V2h2.5l5.5 7V2H12v10h-2.5L4 5v7H2z" fill="white" />
            </svg>
          </div>
          <span style={{
            fontSize: 14, fontWeight: 600,
            color: "#fff",
            fontFamily: "var(--font-syne)",
            letterSpacing: "-0.02em",
          }}>
            Nexora
          </span>
        </Link>
      </div>

      <div style={{ height: 1, backgroundColor: "rgba(255,255,255,0.05)", margin: "0 0 6px" }} />

      {/* Nav */}
      <nav style={{ flex: 1, padding: "4px 10px", overflowY: "auto" }}>
        <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 1 }}>
          {NAV.map((link) => {
            const active = ("exact" in link && link.exact)
              ? pathname === link.href
              : pathname.startsWith(link.href);
            const hasBadge = link.href === "/dashboard/inbox" && (pendingReplies ?? 0) > 0;
            const Icon = link.icon;

            return (
              <li key={link.label} style={{ position: "relative" }}>
                {active && (
                  <motion.div
                    layoutId="nav-active"
                    style={{
                      position: "absolute", inset: 0,
                      borderRadius: 7,
                      backgroundColor: "rgba(255,82,0,0.07)",
                      borderLeft: "2px solid #FF5200",
                    }}
                    transition={{ duration: 0.2, ease: EASE }}
                  />
                )}
                <Link
                  href={link.href}
                  className={`nav-link${active ? " nav-link-active" : ""}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "7.5px 10px",
                    paddingLeft: active ? 10 : 12,
                    borderRadius: 7,
                    fontSize: 13,
                    fontFamily: "var(--font-outfit)",
                    fontWeight: active ? 500 : 400,
                    color: active ? "#e0e0e0" : "#484848",
                    textDecoration: "none",
                    position: "relative", zIndex: 1,
                    gap: 8,
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    <Icon
                      size={14}
                      strokeWidth={active ? 1.75 : 1.5}
                      aria-hidden="true"
                      style={{ flexShrink: 0 }}
                    />
                    {link.label}
                  </span>
                  {hasBadge && (
                    <span style={{
                      fontSize: 9, fontWeight: 600,
                      color: "#FF5200",
                      backgroundColor: "rgba(255,82,0,0.1)",
                      border: "1px solid rgba(255,82,0,0.2)",
                      borderRadius: 999,
                      padding: "1px 5px", lineHeight: 1.6,
                      fontFamily: "var(--font-outfit)", flexShrink: 0,
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

      {/* Bottom */}
      <div style={{ padding: "12px 12px 16px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>

        {/* Credit bar */}
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
              <div
                className="credit-bar-fill"
                style={{
                  width: `${creditPct}%`,
                  backgroundColor: creditPct >= 90 ? "#ef4444" : "#FF5200",
                }}
              />
            </div>
          </div>
        )}

        {/* User row */}
        <div style={{ marginBottom: 8 }}>
          <div style={{
            fontSize: 11, color: "#383838",
            fontFamily: "var(--font-outfit)",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            marginBottom: 5,
          }} title={email}>
            {email}
          </div>
          <span style={{
            fontSize: 9, fontWeight: 600,
            fontFamily: "var(--font-outfit)",
            color: "#FF5200",
            backgroundColor: "rgba(255,82,0,0.08)",
            border: "1px solid rgba(255,82,0,0.15)",
            borderRadius: 999,
            padding: "2px 7px",
            letterSpacing: "0.04em", textTransform: "uppercase",
          }}>
            {planLabel}
          </span>
        </div>

        {/* Sign out */}
        <form action={logout}>
          <button
            type="submit"
            className="btn-ghost"
            aria-label="Sign out"
            style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "6px 10px", borderRadius: 6,
              border: "1px solid rgba(255,255,255,0.06)",
              backgroundColor: "transparent",
              color: "#383838",
              fontSize: 12, fontFamily: "var(--font-outfit)",
              cursor: "pointer", width: "100%",
            }}
          >
            <LogOut size={12} strokeWidth={1.5} aria-hidden="true" />
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
