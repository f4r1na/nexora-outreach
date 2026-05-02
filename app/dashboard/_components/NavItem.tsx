"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { CSSProperties } from "react";

interface NavItemProps {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; style?: CSSProperties }>;
  active: boolean;
  badge?: number;
  collapsed?: boolean;
}

export default function NavItem({ href, label, icon: Icon, active, badge, collapsed }: NavItemProps) {
  return (
    <div className="nav-item-wrap" style={{ position: "relative" }}>
      <div className="nav-aura" />
      <Link
        href={href}
        title={collapsed ? label : undefined}
        aria-current={active ? "page" : undefined}
        className="glow-ring"
        style={{
          display: "flex",
          alignItems: "center",
          gap: collapsed ? 0 : 10,
          padding: collapsed ? "9px" : "9px 12px",
          justifyContent: collapsed ? "center" : "flex-start",
          borderRadius: 9,
          textDecoration: "none",
          position: "relative",
          zIndex: 1,
          transition: "background-color 0.18s ease, color 0.18s ease",
          backgroundColor: active ? "rgba(255,82,0,0.08)" : "transparent",
          color: active ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.38)",
          fontSize: 13,
          fontFamily: "var(--font-outfit)",
          fontWeight: active ? 500 : 400,
        }}
      >
        {active && (
          <motion.div
            layoutId="sidebar-active"
            style={{
              position: "absolute",
              left: 0,
              top: 4,
              bottom: 4,
              width: 2.5,
              borderRadius: 999,
              backgroundColor: "#FF5200",
              boxShadow: "0 0 10px rgba(255,82,0,0.5)",
            }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          />
        )}

        <motion.div
          whileHover={{ scale: 1.15 }}
          transition={{ type: "spring", stiffness: 500, damping: 20 }}
          style={{ flexShrink: 0, display: "flex", alignItems: "center" }}
        >
          <Icon
            size={15}
            strokeWidth={active ? 2 : 1.5}
            style={{
              color: active ? "#FF5200" : "inherit",
              filter: active ? "drop-shadow(0 0 4px rgba(255,82,0,0.4))" : "none",
              transition: "color 0.18s ease, filter 0.18s ease",
            }}
          />
        </motion.div>

        {!collapsed && (
          <span style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {label}
          </span>
        )}

        {!collapsed && badge && badge > 0 ? (
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: "#FF5200",
              backgroundColor: "rgba(255,82,0,0.12)",
              border: "1px solid rgba(255,82,0,0.2)",
              borderRadius: 999,
              padding: "1px 5px",
              lineHeight: 1.6,
              fontFamily: "var(--font-outfit)",
              flexShrink: 0,
            }}
          >
            {badge > 99 ? "99+" : badge}
          </span>
        ) : null}
      </Link>
    </div>
  );
}
