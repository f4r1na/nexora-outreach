"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Bot,
  Mail,
  Inbox,
  Zap,
  BarChart3,
  GitBranch,
  Target,
  Files,
  Sparkles,
  Sliders,
  Settings,
  CreditCard,
  LogOut,
} from "lucide-react";
import { useEffect, useState, type CSSProperties } from "react";
import { logout } from "@/app/actions/auth";
import { NexoraLogo, NexoraIcon } from "@/components/ui/nexora-logo";
import NavItem from "./NavItem";
import SoundToggle from "./SoundToggle";

function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    setMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return mobile;
}

interface SidebarProps {
  email: string;
  plan: string;
  creditsUsed: number;
  creditsLimit: number;
  pendingReplies?: number;
}

type NavLink = {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; style?: CSSProperties }>;
  exact?: boolean;
  badgeKey?: "pendingReplies";
};

const MAIN: NavLink[] = [
  { label: "Dashboard", href: "/dashboard",            icon: LayoutDashboard, exact: true },
  { label: "AI Agent",  href: "/dashboard/agent",      icon: Bot },
  { label: "Campaigns", href: "/dashboard/campaigns",  icon: Mail },
  { label: "Inbox",     href: "/dashboard/inbox",      icon: Inbox, badgeKey: "pendingReplies" },
  { label: "Signals",   href: "/dashboard/signals",    icon: Zap },
  { label: "Analytics", href: "/dashboard/analytics",  icon: BarChart3 },
];

const FEATURES: NavLink[] = [
  { label: "GitHub Detection", href: "/dashboard/features/github-detection",      icon: GitBranch },
  { label: "Confidence AI",    href: "/dashboard/features/confidence-classifier", icon: Target },
  { label: "Template A/B",     href: "/dashboard/features/template-variations",   icon: Files },
  { label: "Signal Score",     href: "/dashboard/features/signal-score",          icon: Sparkles },
];

const ACCOUNT: NavLink[] = [
  { label: "Preferences", href: "/dashboard/preferences",      icon: Sliders },
  { label: "Settings",    href: "/dashboard/settings/account", icon: Settings },
  { label: "Billing",     href: "/dashboard/billing",          icon: CreditCard },
];

const EASE: [number, number, number, number] = [0.23, 1, 0.32, 1];

const sectionLabelStyle: CSSProperties = {
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "rgba(255,255,255,0.2)",
  fontFamily: "var(--font-outfit)",
  padding: "0 12px",
  marginBottom: 2,
  marginTop: 16,
};

const dividerStyle: CSSProperties = {
  height: 1,
  backgroundColor: "rgba(255,255,255,0.05)",
  margin: "10px 8px",
};

function isActive(pathname: string, link: NavLink): boolean {
  if (link.exact) return pathname === link.href;
  return pathname === link.href || pathname.startsWith(link.href + "/");
}

export default function Sidebar({
  email,
  plan,
  creditsUsed,
  creditsLimit,
  pendingReplies = 0,
}: SidebarProps) {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const collapsed = isMobile;

  const isUnlimited = creditsLimit >= 999999;
  const creditsLeft = isUnlimited ? null : Math.max(0, creditsLimit - creditsUsed);
  const creditPct = isUnlimited
    ? 0
    : Math.min(100, Math.round((creditsUsed / Math.max(1, creditsLimit)) * 100));
  const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1);

  const fillBg =
    creditPct >= 90
      ? "#ef4444"
      : creditPct >= 80
        ? "linear-gradient(90deg, #FF5200, #ef4444)"
        : "linear-gradient(90deg, #FF5200, #F59E0B)";

  const renderLink = (link: NavLink) => {
    const active = isActive(pathname, link);
    const badge = link.badgeKey === "pendingReplies" ? pendingReplies : undefined;
    return (
      <NavItem
        key={link.href}
        href={link.href}
        label={link.label}
        icon={link.icon}
        active={active}
        badge={badge}
        collapsed={collapsed}
      />
    );
  };

  return (
    <motion.aside
      className="sidebar-glow"
      aria-label="Navigation"
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: EASE }}
      style={{
        width: collapsed ? 60 : 280,
        flexShrink: 0,
        position: "fixed",
        top: 0,
        left: 0,
        bottom: 0,
        backgroundColor: "rgba(8,8,20,0.75)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderRight: "1px solid rgba(255,255,255,0.07)",
        display: "flex",
        flexDirection: "column",
        zIndex: 40,
      }}
    >
      {/* Logo */}
      <div style={{ padding: "20px 18px 14px" }}>
        {collapsed ? (
          <Link
            href="/dashboard"
            style={{ textDecoration: "none", display: "flex", justifyContent: "center", padding: "0 4px" }}
          >
            <NexoraIcon size={24} />
          </Link>
        ) : (
          <motion.div
            whileHover={{ rotateY: 180 }}
            transition={{ duration: 0.55, ease: [0.23, 1, 0.32, 1] }}
            style={{ display: "inline-flex", transformStyle: "preserve-3d", cursor: "pointer" }}
          >
            <Link href="/dashboard" style={{ textDecoration: "none" }}>
              <NexoraLogo size={26} wordmarkSize={14} />
            </Link>
          </motion.div>
        )}
      </div>

      <div style={dividerStyle} />

      {/* Nav */}
      <nav
        style={{
          flex: 1,
          padding: "4px 10px 12px",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        {/* MAIN */}
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {MAIN.map(renderLink)}
        </div>

        <div style={dividerStyle} />

        {/* FEATURES */}
        {!collapsed && <div style={sectionLabelStyle}>Features</div>}
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {FEATURES.map(renderLink)}
        </div>

        <div style={dividerStyle} />

        {/* ACCOUNT */}
        {!collapsed && <div style={sectionLabelStyle}>Account</div>}
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {ACCOUNT.map(renderLink)}
        </div>
      </nav>

      {/* Bottom panel */}
      <div
        style={{
          padding: "12px 14px 16px",
          borderTop: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        {/* Credit bar */}
        {!isUnlimited && !collapsed && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span
                style={{
                  fontSize: 10,
                  color: "rgba(255,255,255,0.45)",
                  fontFamily: "var(--font-outfit)",
                  fontWeight: 500,
                }}
              >
                {creditsLeft} credits left
              </span>
              <span
                style={{
                  fontSize: 10,
                  color: "rgba(255,255,255,0.25)",
                  fontFamily: "var(--font-outfit)",
                }}
              >
                {creditsLimit}
              </span>
            </div>
            <div
              style={{
                height: 3,
                background: "rgba(255,255,255,0.06)",
                borderRadius: 999,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${creditPct}%`,
                  height: "100%",
                  borderRadius: 999,
                  background: fillBg,
                  transition: "width 0.55s cubic-bezier(0.23,1,0.32,1)",
                }}
              />
            </div>
          </div>
        )}

        {/* User row */}
        {!collapsed && (
          <div style={{ marginBottom: 10 }}>
            <div
              style={{
                fontSize: 11,
                color: "rgba(255,255,255,0.5)",
                fontFamily: "var(--font-outfit)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                marginBottom: 6,
              }}
              title={email}
            >
              {email}
            </div>
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                fontFamily: "var(--font-outfit)",
                color: "#FF5200",
                backgroundColor: "rgba(255,82,0,0.1)",
                border: "1px solid rgba(255,82,0,0.18)",
                borderRadius: 999,
                padding: "2px 8px",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              {planLabel}
            </span>
          </div>
        )}

        {/* Sound toggle */}
        {!collapsed && (
          <div style={{ marginBottom: 6 }}>
            <SoundToggle />
          </div>
        )}

        {/* Sign out */}
        <form action={logout}>
          <button
            type="submit"
            className="btn-ghost glow-ring"
            aria-label="Sign out"
            title={collapsed ? "Sign out" : undefined}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: collapsed ? "center" : "flex-start",
              gap: collapsed ? 0 : 8,
              padding: "7px 10px",
              borderRadius: 7,
              border: "1px solid rgba(255,255,255,0.07)",
              backgroundColor: "transparent",
              color: "rgba(255,255,255,0.5)",
              fontSize: 12,
              fontFamily: "var(--font-outfit)",
              cursor: "pointer",
              width: "100%",
            }}
          >
            <LogOut size={13} strokeWidth={1.5} aria-hidden="true" />
            {!collapsed && "Sign out"}
          </button>
        </form>
      </div>
    </motion.aside>
  );
}
