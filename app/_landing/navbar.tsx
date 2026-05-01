"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronDown } from "lucide-react";
import { NexoraLogo } from "@/components/ui/nexora-logo";

const NAV_LINKS = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Pricing",      href: "#pricing" },
];

const RESOURCES = [
  { label: "Blog",          href: "#" },
  { label: "Documentation", href: "#" },
  { label: "Help Center",   href: "#" },
  { label: "Status",        href: "#" },
];

export default function Navbar() {
  const [menuOpen,    setMenuOpen]    = useState(false);
  const [resOpen,     setResOpen]     = useState(false);
  const resRef = useRef<HTMLDivElement>(null);

  // Close resources dropdown on outside click
  useEffect(() => {
    if (!resOpen) return;
    function handle(e: MouseEvent) {
      if (resRef.current && !resRef.current.contains(e.target as Node)) {
        setResOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [resOpen]);

  return (
    <>
      <nav
        aria-label="Main navigation"
        style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
          height: 64,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 clamp(20px, 4vw, 56px)",
          backgroundColor: "rgba(8,8,16,0.85)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        {/* Logo */}
        <Link href="/" style={{ textDecoration: "none", flexShrink: 0 }}>
          <NexoraLogo size={26} wordmarkSize={15} />
        </Link>

        {/* Desktop nav */}
        <div className="landing-desktop-only" style={{ alignItems: "center", gap: 32 }}>
          {NAV_LINKS.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              className="landing-nav-link"
              style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", textDecoration: "none" }}
            >
              {label}
            </a>
          ))}

          {/* Resources dropdown */}
          <div ref={resRef} style={{ position: "relative" }}>
            <button
              onClick={() => setResOpen((v) => !v)}
              className="landing-nav-link"
              style={{
                display: "flex", alignItems: "center", gap: 4,
                fontSize: 14, color: "rgba(255,255,255,0.55)",
                background: "none", border: "none", cursor: "pointer", padding: 0,
              }}
            >
              Resources
              <ChevronDown
                size={14}
                style={{
                  transition: "transform 0.2s ease",
                  transform: resOpen ? "rotate(180deg)" : "rotate(0deg)",
                }}
              />
            </button>
            <AnimatePresence>
              {resOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  transition={{ duration: 0.16 }}
                  style={{
                    position: "absolute", top: "calc(100% + 12px)", left: "50%",
                    transform: "translateX(-50%)",
                    width: 180,
                    background: "#0e0e18",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 12,
                    overflow: "hidden",
                    boxShadow: "0 16px 48px rgba(0,0,0,0.6)",
                    zIndex: 10,
                  }}
                >
                  {RESOURCES.map(({ label, href }) => (
                    <a
                      key={label}
                      href={href}
                      onClick={() => setResOpen(false)}
                      style={{
                        display: "block",
                        padding: "11px 16px",
                        fontSize: 13,
                        color: "rgba(255,255,255,0.65)",
                        textDecoration: "none",
                        borderBottom: "1px solid rgba(255,255,255,0.05)",
                        transition: "background 0.12s, color 0.12s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                        e.currentTarget.style.color = "#fff";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.color = "rgba(255,255,255,0.65)";
                      }}
                    >
                      {label}
                    </a>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Desktop auth buttons */}
        <div className="landing-desktop-only" style={{ alignItems: "center", gap: 12 }}>
          <Link
            href="/login"
            style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", textDecoration: "none" }}
            className="landing-nav-link"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="landing-btn-primary"
            style={{
              fontSize: 13, fontWeight: 600,
              padding: "8px 20px", borderRadius: 8,
              background: "#FF5200", color: "#fff",
              textDecoration: "none", display: "inline-block",
            }}
          >
            Get started
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="landing-mobile-only"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
          style={{
            background: "none", border: "none", cursor: "pointer",
            color: "#fff", padding: 4, alignItems: "center",
          }}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
            style={{
              position: "fixed", top: 64, left: 0, right: 0, zIndex: 99,
              background: "rgba(8,8,16,0.97)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              borderBottom: "1px solid rgba(255,255,255,0.07)",
              overflow: "hidden",
            }}
          >
            <div style={{ padding: "12px 24px 28px", display: "flex", flexDirection: "column" }}>
              {[...NAV_LINKS, { label: "Resources", href: "#" }].map(({ label, href }) => (
                <a
                  key={label}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  style={{
                    fontSize: 16, color: "rgba(255,255,255,0.8)",
                    textDecoration: "none", padding: "14px 0",
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  {label}
                </a>
              ))}
              <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  style={{
                    flex: 1, textAlign: "center",
                    padding: "11px", borderRadius: 9,
                    border: "1px solid rgba(255,255,255,0.15)",
                    color: "rgba(255,255,255,0.75)", textDecoration: "none", fontSize: 14,
                  }}
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMenuOpen(false)}
                  style={{
                    flex: 1, textAlign: "center",
                    padding: "11px", borderRadius: 9,
                    background: "#FF5200", color: "#fff",
                    textDecoration: "none", fontSize: 14, fontWeight: 600,
                  }}
                >
                  Get started
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
