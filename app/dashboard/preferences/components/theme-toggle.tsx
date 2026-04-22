"use client";

import { useState, useEffect } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return null;

  const isDark = theme === "dark";

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
      <div>
        <p style={{ fontSize: 13, color: "#ccc", fontFamily: "var(--font-outfit)", marginBottom: 2 }}>
          {isDark ? "Dark mode" : "Light mode"}
        </p>
        <p style={{ fontSize: 12, color: "#555", fontFamily: "var(--font-outfit)" }}>
          Saved to your account and synced across devices
        </p>
      </div>
      <button
        onClick={() => setTheme(isDark ? "light" : "dark")}
        aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
        style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "8px 14px",
          backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(255,82,0,0.07)",
          border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(255,82,0,0.2)"}`,
          borderRadius: 6, cursor: "pointer",
          transition: "all 0.15s ease",
          flexShrink: 0,
        }}
      >
        {isDark
          ? <Moon size={13} strokeWidth={1.75} color="#888" />
          : <Sun size={13} strokeWidth={1.75} color="#FF5200" />
        }
        <span style={{ fontSize: 12, color: isDark ? "#888" : "#FF5200", fontFamily: "var(--font-outfit)" }}>
          {isDark ? "Dark" : "Light"}
        </span>
      </button>
    </div>
  );
}
