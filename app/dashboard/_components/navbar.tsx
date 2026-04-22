"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { logout } from "@/app/actions/auth";
import {
  Settings, LogOut, Sparkles, Search,
  ChevronDown, User, Shield, Bell, Sliders, CreditCard,
} from "lucide-react";
import { NexoraLogo } from "@/components/ui/nexora-logo";

interface NavbarProps {
  email: string;
  plan: string;
}

type NavItem = { label: string; href: string; exact?: boolean };

const NAV: NavItem[] = [
  { label: "Agent",       href: "/dashboard",                exact: true },
  { label: "Campaigns",   href: "/dashboard/campaigns"                   },
  { label: "Inbox",       href: "/dashboard/inbox"                       },
  { label: "Preferences", href: "/dashboard/preferences"                 },
];

const SETTINGS_MENU = [
  { label: "Account",       href: "/dashboard/settings/account",       icon: User },
  { label: "Data & Privacy",href: "/dashboard/settings/data",          icon: Shield },
  { label: "Notifications", href: "/dashboard/settings/notifications", icon: Bell },
  { label: "Preferences",   href: "/dashboard/preferences",            icon: Sliders },
  { label: "Billing",       href: "/dashboard/billing",                icon: CreditCard },
];

const EASE = [0.23, 1, 0.32, 1] as const;

export default function Navbar({ email, plan }: NavbarProps) {
  const pathname = usePathname();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setSettingsOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  // Close on route change
  useEffect(() => { setSettingsOpen(false); }, [pathname]);

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
                    position: "absolute", inset: 0,
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

        <button
          type="button"
          aria-label="Open command palette"
          onClick={() => window.dispatchEvent(new CustomEvent("nx:open-command-palette"))}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            height: 28, padding: "0 8px",
            borderRadius: 7,
            border: "1px solid rgba(255,255,255,0.07)",
            backgroundColor: "rgba(255,255,255,0.02)",
            color: "#666",
            cursor: "pointer",
            fontFamily: "var(--font-outfit)",
            fontSize: 11,
          }}
        >
          <Search size={12} />
          <span style={{ color: "#555" }}>Search</span>
          <kbd style={{
            fontSize: 9, color: "#555",
            padding: "1px 5px",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 3,
            marginLeft: 2,
          }}>
            ⌘K
          </kbd>
        </button>

        {/* Settings dropdown */}
        <div ref={settingsRef} style={{ position: "relative" }}>
          <button
            onClick={() => setSettingsOpen(!settingsOpen)}
            aria-label="Settings menu"
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
              height: 32, padding: "0 8px", borderRadius: 6,
              background: settingsOpen ? "rgba(255,255,255,0.06)" : "none",
              border: settingsOpen ? "1px solid rgba(255,255,255,0.08)" : "1px solid transparent",
              cursor: "pointer", color: settingsOpen ? "#ccc" : "#555",
              transition: "all 0.15s ease",
            }}
          >
            <Settings size={15} />
            <ChevronDown
              size={11}
              strokeWidth={1.75}
              style={{
                transform: settingsOpen ? "rotate(180deg)" : "rotate(0)",
                transition: "transform 0.15s ease",
              }}
            />
          </button>

          {settingsOpen && (
            <div style={{
              position: "absolute", top: "calc(100% + 6px)", right: 0,
              width: 196,
              backgroundColor: "#0e0e18",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 8,
              overflow: "hidden",
              boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
              zIndex: 100,
            }}>
              {/* User info */}
              <div style={{ padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <p style={{ fontSize: 11, color: "#666", fontFamily: "var(--font-outfit)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {email}
                </p>
              </div>

              {SETTINGS_MENU.map(({ label, href, icon: Icon }) => {
                const active = pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    style={{
                      display: "flex", alignItems: "center", gap: 9,
                      padding: "9px 14px",
                      fontSize: 13, fontFamily: "var(--font-outfit)",
                      color: active ? "#ddd" : "#888",
                      textDecoration: "none",
                      backgroundColor: active ? "rgba(255,255,255,0.04)" : "transparent",
                      transition: "background-color 0.12s ease, color 0.12s ease",
                    }}
                  >
                    <Icon size={13} strokeWidth={1.5} style={{ flexShrink: 0 }} />
                    {label}
                  </Link>
                );
              })}

              {/* Divider + logout */}
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                <form action={logout}>
                  <button
                    type="submit"
                    style={{
                      display: "flex", alignItems: "center", gap: 9,
                      width: "100%", padding: "9px 14px",
                      fontSize: 13, fontFamily: "var(--font-outfit)",
                      color: "#555",
                      background: "none", border: "none", cursor: "pointer",
                      textAlign: "left",
                      transition: "color 0.12s ease",
                    }}
                  >
                    <LogOut size={13} strokeWidth={1.5} />
                    Sign out
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.nav>
  );
}
