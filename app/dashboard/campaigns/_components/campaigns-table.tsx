"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Campaign = {
  id: string;
  name: string;
  tone: string;
  status: string;
  lead_count: number;
  created_at: string;
};

const STATUS_STYLE: Record<string, { color: string; bg: string; label: string }> = {
  complete: { color: "#4ade80", bg: "rgba(74,222,128,0.1)", label: "Complete" },
  draft:    { color: "#94a3b8", bg: "rgba(148,163,184,0.1)", label: "Draft" },
};

const TONE_STYLE: Record<string, { color: string; bg: string }> = {
  professional: { color: "#60a5fa", bg: "rgba(96,165,250,0.1)" },
  friendly:     { color: "#a78bfa", bg: "rgba(167,139,250,0.1)" },
  bold:         { color: "#fb923c", bg: "rgba(251,146,60,0.1)" },
  minimal:      { color: "#94a3b8", bg: "rgba(148,163,184,0.1)" },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function CampaignsTable({ campaigns }: { campaigns: Campaign[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "complete" | "draft">("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = campaigns.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || c.status === filter;
    return matchesSearch && matchesFilter;
  });

  async function handleDelete(id: string) {
    if (!confirm("Delete this campaign and all its emails? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      await fetch(`/api/campaigns/${id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      {/* Search + filter row */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        {/* Search */}
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)", pointerEvents: "none" }}>
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            placeholder="Search campaigns…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%", padding: "9px 14px 9px 36px",
              backgroundColor: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)", borderRadius: 9,
              color: "#fff", fontSize: 13, fontFamily: "var(--font-outfit)",
              outline: "none",
            }}
          />
        </div>

        {/* Filter tabs */}
        <div style={{ display: "flex", gap: 4, backgroundColor: "rgba(255,255,255,0.04)", padding: 4, borderRadius: 9, border: "1px solid rgba(255,255,255,0.07)" }}>
          {(["all", "complete", "draft"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: "6px 14px", borderRadius: 6, fontSize: 12.5, fontWeight: 600,
              fontFamily: "var(--font-outfit)", border: "none", cursor: "pointer",
              backgroundColor: filter === f ? "#FF5200" : "transparent",
              color: filter === f ? "#fff" : "rgba(255,255,255,0.4)",
              transition: "all 0.15s",
              textTransform: "capitalize",
            }}>{f}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ backgroundColor: "#0e0e0e", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, overflow: "hidden" }}>
        {/* Column headers */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 80px 110px 130px 130px 160px",
          padding: "12px 20px", borderBottom: "1px solid rgba(255,255,255,0.055)",
          backgroundColor: "#111",
        }}>
          {["Campaign", "Leads", "Status", "Tone", "Created", "Actions"].map((col) => (
            <div key={col} style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.07em" }}>
              {col}
            </div>
          ))}
        </div>

        {/* Rows */}
        {filtered.length === 0 ? (
          <div style={{ padding: "56px 24px", textAlign: "center" }}>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.3)", fontFamily: "var(--font-outfit)" }}>
              {search ? `No campaigns matching "${search}"` : "No campaigns yet"}
            </p>
          </div>
        ) : (
          filtered.map((c, i) => {
            const status = STATUS_STYLE[c.status] ?? STATUS_STYLE.draft;
            const tone = TONE_STYLE[c.tone?.toLowerCase()] ?? TONE_STYLE.minimal;
            return (
              <div key={c.id} style={{
                display: "grid", gridTemplateColumns: "1fr 80px 110px 130px 130px 160px",
                padding: "14px 20px",
                borderTop: i === 0 ? "none" : "1px solid rgba(255,255,255,0.05)",
                alignItems: "center",
                backgroundColor: "transparent",
                transition: "background-color 0.15s",
              }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.02)")}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                {/* Name */}
                <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", fontFamily: "var(--font-syne)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: 12 }}>
                  {c.name}
                </div>

                {/* Leads */}
                <div style={{ fontSize: 15, fontWeight: 700, color: "#FF5200", fontFamily: "var(--font-syne)" }}>
                  {c.lead_count}
                </div>

                {/* Status */}
                <div>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 999,
                    color: status.color, backgroundColor: status.bg, letterSpacing: "0.04em",
                  }}>{status.label}</span>
                </div>

                {/* Tone */}
                <div>
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 6,
                    color: tone.color, backgroundColor: tone.bg, textTransform: "capitalize",
                  }}>{c.tone || "—"}</span>
                </div>

                {/* Date */}
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", fontFamily: "var(--font-outfit)" }}>
                  {formatDate(c.created_at)}
                </div>

                {/* Actions */}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Link href={`/dashboard/campaigns/${c.id}`} style={{
                    display: "inline-flex", alignItems: "center", gap: 5,
                    padding: "5px 12px", borderRadius: 7, fontSize: 12, fontWeight: 600,
                    fontFamily: "var(--font-outfit)", textDecoration: "none",
                    backgroundColor: "rgba(255,82,0,0.1)", color: "#FF5200",
                    border: "1px solid rgba(255,82,0,0.2)",
                  }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                    </svg>
                    View
                  </Link>
                  <button
                    onClick={() => handleDelete(c.id)}
                    disabled={deletingId === c.id}
                    style={{
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      width: 30, height: 30, borderRadius: 7,
                      backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                      color: "rgba(255,255,255,0.3)", cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(239,68,68,0.12)"; (e.currentTarget as HTMLButtonElement).style.color = "#f87171"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(239,68,68,0.2)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(255,255,255,0.04)"; (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.3)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.08)"; }}
                  >
                    {deletingId === c.id ? (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: "spin 1s linear infinite" }}><path d="M21 12a9 9 0 11-6.219-8.56" strokeLinecap="round" /></svg>
                    ) : (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
