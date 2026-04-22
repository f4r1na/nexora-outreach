"use client";

import { useState, useEffect } from "react";
import { Moon, Sun } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Theme = "dark" | "light";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function init() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      const userTheme = user?.user_metadata?.theme as Theme | undefined;
      const stored = (localStorage.getItem("nx-theme") ?? userTheme ?? "dark") as Theme;
      setTheme(stored);
      document.documentElement.setAttribute("data-theme", stored);
    }
    init();
  }, []);

  async function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("nx-theme", next);
    document.documentElement.setAttribute("data-theme", next);

    setSaving(true);
    try {
      const supabase = createClient();
      await supabase.auth.updateUser({ data: { theme: next } });
    } catch { /* silent */ }
    finally { setSaving(false); }
  }

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
        onClick={toggle}
        disabled={saving}
        aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
        style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "8px 14px",
          backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(255,82,0,0.07)",
          border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(255,82,0,0.2)"}`,
          borderRadius: 6, cursor: saving ? "not-allowed" : "pointer",
          opacity: saving ? 0.6 : 1,
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
