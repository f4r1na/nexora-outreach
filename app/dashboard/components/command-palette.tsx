"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  LayoutDashboard,
  Send,
  Inbox,
  BarChart3,
  Plus,
  Zap,
  CornerDownLeft,
} from "lucide-react";

type Cmd = {
  id: string;
  label: string;
  hint?: string;
  icon: React.ReactNode;
  action: () => void;
  group: "Navigate" | "Actions" | "Campaigns";
};

type CampaignLite = { id: string; name: string };

export default function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);
  const [campaigns, setCampaigns] = useState<CampaignLite[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const isToggle = (e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey);
      if (isToggle) {
        e.preventDefault();
        setOpen((v) => !v);
        return;
      }
      const target = e.target as HTMLElement | null;
      if (target && target.tagName !== "INPUT" && target.tagName !== "TEXTAREA" && !target.isContentEditable) {
        if (e.key === "/" && !open) {
          e.preventDefault();
          setOpen(true);
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    function onOpenEvent() { setOpen(true); }
    window.addEventListener("nx:open-command-palette", onOpenEvent);
    return () => window.removeEventListener("nx:open-command-palette", onOpenEvent);
  }, []);

  useEffect(() => {
    if (!open) { setQ(""); setIdx(0); return; }
    setTimeout(() => inputRef.current?.focus(), 60);
    fetch("/api/campaigns/list")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.campaigns) setCampaigns(d.campaigns as CampaignLite[]); })
      .catch(() => {});
  }, [open]);

  const close = useCallback(() => setOpen(false), []);

  const go = useCallback((href: string) => {
    setOpen(false);
    router.push(href);
  }, [router]);

  const commands: Cmd[] = [
    { id: "nav-agent",      label: "Go to Agent",      hint: "G A", icon: <LayoutDashboard size={13} />, action: () => go("/dashboard"),            group: "Navigate" },
    { id: "nav-campaigns",  label: "Go to Campaigns",  hint: "G C", icon: <Send size={13} />,            action: () => go("/dashboard/campaigns"),  group: "Navigate" },
    { id: "nav-inbox",      label: "Go to Inbox",      hint: "G I", icon: <Inbox size={13} />,           action: () => go("/dashboard/inbox"),      group: "Navigate" },
    { id: "nav-analytics",  label: "Go to Analytics",  hint: "G N", icon: <BarChart3 size={13} />,       action: () => go("/dashboard/analytics"),  group: "Navigate" },
    { id: "act-new",        label: "Create campaign",  hint: "N",   icon: <Plus size={13} />,            action: () => go("/dashboard/campaigns/new"), group: "Actions" },
    ...campaigns.map<Cmd>((c) => ({
      id: `camp-${c.id}`,
      label: c.name,
      icon: <Zap size={13} />,
      action: () => go(`/dashboard/campaigns/${c.id}`),
      group: "Campaigns",
    })),
  ];

  const query = q.trim().toLowerCase();
  const filtered = query
    ? commands.filter((c) => c.label.toLowerCase().includes(query))
    : commands;

  useEffect(() => { setIdx(0); }, [q, open]);

  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelector<HTMLButtonElement>(`[data-cmd-idx="${idx}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [idx, open, filtered.length]);

  if (!open) return null;

  const groups = ["Navigate", "Actions", "Campaigns"] as const;
  let runningIdx = 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={close}
      style={{
        position: "fixed", inset: 0, zIndex: 80,
        backgroundColor: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        paddingTop: "12vh",
        animation: "cp-fade 150ms ease",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 620, maxWidth: "92vw",
          backgroundColor: "#0E0E18",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 16,
          overflow: "hidden",
          boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.02) inset",
          animation: "cp-in 150ms cubic-bezier(0.23,1,0.32,1)",
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") { e.preventDefault(); close(); }
          else if (e.key === "ArrowDown") { e.preventDefault(); setIdx((i) => Math.min(i + 1, filtered.length - 1)); }
          else if (e.key === "ArrowUp") { e.preventDefault(); setIdx((i) => Math.max(i - 1, 0)); }
          else if (e.key === "Enter") { e.preventDefault(); filtered[idx]?.action(); }
        }}
      >
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "14px 18px",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}>
          <Search size={15} color="#555" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search actions, campaigns..."
            style={{
              flex: 1,
              background: "transparent", border: "none", outline: "none",
              color: "#fff",
              fontSize: 14,
              fontFamily: "var(--font-outfit)",
            }}
          />
          <kbd style={{
            fontSize: 10, color: "#555",
            padding: "2px 6px",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 4,
            fontFamily: "var(--font-outfit)",
          }}>
            ESC
          </kbd>
        </div>

        <div ref={listRef} style={{ maxHeight: 400, overflowY: "auto", padding: "6px 6px 10px" }}>
          {filtered.length === 0 ? (
            <p style={{ padding: "28px 18px", color: "#444", fontSize: 12.5, textAlign: "center", fontFamily: "var(--font-outfit)" }}>
              No matches
            </p>
          ) : (
            groups.map((g) => {
              const items = filtered.filter((c) => c.group === g);
              if (items.length === 0) return null;
              return (
                <div key={g} style={{ marginTop: 6 }}>
                  <p style={{
                    fontSize: 9,
                    color: "#3a3a4a",
                    fontFamily: "var(--font-outfit)",
                    textTransform: "uppercase",
                    letterSpacing: "0.09em",
                    padding: "6px 14px 4px",
                  }}>
                    {g}
                  </p>
                  {items.map((c) => {
                    const current = runningIdx === idx;
                    const myIdx = runningIdx;
                    runningIdx += 1;
                    return (
                      <button
                        key={c.id}
                        data-cmd-idx={myIdx}
                        onClick={c.action}
                        onMouseEnter={() => setIdx(myIdx)}
                        style={{
                          width: "100%",
                          display: "flex", alignItems: "center", gap: 11,
                          padding: "9px 12px",
                          borderRadius: 8,
                          border: "none",
                          backgroundColor: current ? "rgba(255,82,0,0.1)" : "transparent",
                          borderLeft: `2px solid ${current ? "#FF5200" : "transparent"}`,
                          color: current ? "#fff" : "#bbb",
                          fontFamily: "var(--font-outfit)",
                          fontSize: 13,
                          textAlign: "left",
                          cursor: "pointer",
                          transition: "background-color 120ms, color 120ms",
                        }}
                      >
                        <span style={{ color: current ? "#FF5200" : "#555", display: "flex", alignItems: "center" }}>
                          {c.icon}
                        </span>
                        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {c.label}
                        </span>
                        {c.hint && (
                          <kbd style={{
                            fontSize: 9, color: "#555",
                            padding: "2px 6px",
                            border: "1px solid rgba(255,255,255,0.06)",
                            borderRadius: 4,
                          }}>
                            {c.hint}
                          </kbd>
                        )}
                        {current && (
                          <CornerDownLeft size={11} color="#FF5200" />
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>

        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "8px 14px",
          borderTop: "1px solid rgba(255,255,255,0.05)",
          fontSize: 10, color: "#3a3a4a",
          fontFamily: "var(--font-outfit)",
        }}>
          <div style={{ display: "flex", gap: 10 }}>
            <span>↑↓ navigate</span>
            <span>↵ select</span>
          </div>
          <span>Cmd+K to reopen</span>
        </div>
      </div>

      <style>{`
        @keyframes cp-fade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes cp-in { from { opacity: 0; transform: translateY(-8px) scale(0.97) } to { opacity: 1; transform: translateY(0) scale(1) } }
      `}</style>
    </div>
  );
}
