"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Lock, Bell, CreditCard, Settings, LogOut, Menu, X } from "lucide-react";
import { logout } from "@/app/actions/auth";

const EASE = [0.23, 1, 0.32, 1] as const;

const GROUPS = [
  {
    label: "ACCOUNT",
    items: [
      { label: "Account Settings", href: "/dashboard/settings/account", icon: User },
      { label: "Data & Privacy",   href: "/dashboard/settings/data-privacy", icon: Lock },
      { label: "Notifications",    href: "/dashboard/settings/notifications", icon: Bell },
    ],
  },
  {
    label: "BILLING",
    items: [
      { label: "Billing & Plans", href: "/dashboard/settings/billing", icon: CreditCard },
    ],
  },
  {
    label: "PREFERENCES",
    items: [
      { label: "Preferences", href: "/dashboard/settings/preferences", icon: Settings },
    ],
  },
] as const;

function NavItem({
  label,
  href,
  icon: Icon,
  pathname,
  onClick,
}: {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; "aria-hidden"?: boolean | "true" | "false" }>;
  pathname: string;
  onClick?: () => void;
}) {
  const active = pathname === href || pathname.startsWith(href + "/");

  return (
    <li style={{ position: "relative" }}>
      {active && (
        <motion.div
          layoutId="settings-nav-active"
          style={{
            position: "absolute", inset: 0,
            borderRadius: 6,
            backgroundColor: "rgba(255,82,0,0.07)",
            borderLeft: "3px solid #FF5200",
          }}
          transition={{ duration: 0.2, ease: EASE }}
        />
      )}
      <Link
        href={href}
        onClick={onClick}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 9,
          padding: "7px 10px",
          paddingLeft: active ? 10 : 12,
          borderRadius: 6,
          fontSize: 13,
          fontFamily: "var(--font-outfit)",
          fontWeight: active ? 500 : 400,
          color: active ? "#FF5200" : "rgba(255,255,255,0.7)",
          textDecoration: "none",
          position: "relative",
          zIndex: 1,
          transition: "color 0.15s ease, background-color 0.15s ease",
        }}
        onMouseEnter={(e) => {
          if (!active) (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "rgba(255,255,255,0.05)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "transparent";
        }}
      >
        <Icon size={18} strokeWidth={active ? 1.75 : 1.5} aria-hidden="true" />
        {label}
      </Link>
    </li>
  );
}

function SidebarContent({ pathname, onLinkClick }: { pathname: string; onLinkClick?: () => void }) {
  return (
    <nav style={{ flex: 1, overflowY: "auto", padding: "16px 10px" }}>
      {GROUPS.map((group) => (
        <div key={group.label} style={{ marginBottom: 24 }}>
          <p style={{
            fontSize: 10.5,
            fontWeight: 600,
            color: "rgba(255,255,255,0.4)",
            fontFamily: "var(--font-syne)",
            letterSpacing: "0.08em",
            margin: "0 0 6px 12px",
            textTransform: "uppercase",
          }}>
            {group.label}
          </p>
          <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 1 }}>
            {group.items.map((item) => (
              <NavItem
                key={item.href}
                label={item.label}
                href={item.href}
                icon={item.icon}
                pathname={pathname}
                onClick={onLinkClick}
              />
            ))}
          </ul>
        </div>
      ))}

      {/* SESSION group */}
      <div>
        <p style={{
          fontSize: 10.5,
          fontWeight: 600,
          color: "rgba(255,255,255,0.4)",
          fontFamily: "var(--font-syne)",
          letterSpacing: "0.08em",
          margin: "0 0 6px 12px",
          textTransform: "uppercase",
        }}>
          SESSION
        </p>
        <ul style={{ listStyle: "none" }}>
          <li>
            <form action={logout}>
              <button
                type="submit"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 9,
                  padding: "7px 12px",
                  borderRadius: 6,
                  width: "100%",
                  border: "none",
                  backgroundColor: "transparent",
                  color: "rgba(255,255,255,0.7)",
                  fontSize: 13,
                  fontFamily: "var(--font-outfit)",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "color 0.15s ease, background-color 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(255,255,255,0.05)";
                  (e.currentTarget as HTMLButtonElement).style.color = "#fff";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
                  (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.7)";
                }}
              >
                <LogOut size={18} strokeWidth={1.5} aria-hidden="true" />
                Sign out
              </button>
            </form>
          </li>
        </ul>
      </div>
    </nav>
  );
}

const SIDEBAR_STYLES = {
  width: 250,
  backgroundColor: "#080810",
  borderRight: "1px solid rgba(255,255,255,0.06)",
  display: "flex",
  flexDirection: "column" as const,
} as const;

export default function SettingsSidebar() {
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
      if (!e.matches) setOpen(false);
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Close drawer on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  if (isMobile) {
    return (
      <>
        {/* Hamburger button */}
        <button
          onClick={() => setOpen(true)}
          aria-label="Open settings menu"
          aria-expanded={open}
          style={{
            position: "fixed",
            top: 68,
            left: 12,
            zIndex: 50,
            width: 36,
            height: 36,
            borderRadius: 8,
            border: "1px solid rgba(255,255,255,0.1)",
            backgroundColor: "#080810",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "rgba(255,255,255,0.7)",
          }}
        >
          <Menu size={16} aria-hidden="true" />
        </button>

        {/* Backdrop */}
        <AnimatePresence>
          {open && (
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setOpen(false)}
              style={{
                position: "fixed",
                inset: 0,
                backgroundColor: "rgba(0,0,0,0.55)",
                zIndex: 45,
              }}
            />
          )}
        </AnimatePresence>

        {/* Drawer */}
        <AnimatePresence>
          {open && (
            <motion.aside
              key="drawer"
              role="dialog"
              aria-label="Settings navigation"
              aria-modal="true"
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ duration: 0.28, ease: EASE }}
              style={{
                ...SIDEBAR_STYLES,
                position: "fixed",
                top: 0,
                left: 0,
                bottom: 0,
                zIndex: 50,
              }}
            >
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 12px",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
              }}>
                <span style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "rgba(255,255,255,0.6)",
                  fontFamily: "var(--font-syne)",
                  letterSpacing: "0.02em",
                }}>
                  Settings
                </span>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close settings menu"
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    border: "none",
                    backgroundColor: "transparent",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "rgba(255,255,255,0.4)",
                  }}
                >
                  <X size={15} aria-hidden="true" />
                </button>
              </div>
              <SidebarContent pathname={pathname} onLinkClick={() => setOpen(false)} />
            </motion.aside>
          )}
        </AnimatePresence>
      </>
    );
  }

  return (
    <motion.aside
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: EASE }}
      style={{
        ...SIDEBAR_STYLES,
        position: "sticky",
        top: 0,
        height: "calc(100vh - 60px)",
        flexShrink: 0,
      }}
    >
      <div style={{
        padding: "20px 12px 12px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <span style={{
          fontSize: 11,
          fontWeight: 600,
          color: "rgba(255,255,255,0.35)",
          fontFamily: "var(--font-syne)",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
        }}>
          Settings
        </span>
      </div>
      <SidebarContent pathname={pathname} />
    </motion.aside>
  );
}
