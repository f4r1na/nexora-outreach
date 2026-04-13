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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
      <path d="M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ animation: "spin 1s linear infinite" }}>
      <path d="M21 12a9 9 0 11-6.219-8.56" />
    </svg>
  );
}

export default function CampaignsTable({ campaigns }: { campaigns: Campaign[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "complete" | "draft">("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [items, setItems] = useState<Campaign[]>(campaigns);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const filtered = items.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || c.status === filter;
    return matchesSearch && matchesFilter;
  });

  async function handleDelete(id: string) {
    if (!confirm("Delete this campaign and all its leads? This cannot be undone.")) return;
    setDeletingId(id);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/campaigns/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setDeleteError(data.error ?? "Failed to delete campaign.");
        return;
      }
      setItems((prev) => prev.filter((c) => c.id !== id));
      router.refresh();
    } catch {
      setDeleteError("Network error. Please try again.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      {/* Search + filter */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 180 }}>
          <svg
            width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
            strokeLinecap="round"
            style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#444", pointerEvents: "none" }}
          >
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search campaigns"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "7px 12px 7px 30px",
              backgroundColor: "#0e0e0e",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 6,
              color: "#ccc",
              fontSize: 13,
              fontFamily: "var(--font-outfit)",
              outline: "none",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: 2 }}>
          {(["all", "complete", "draft"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: "6px 12px",
              borderRadius: 6,
              fontSize: 12,
              fontFamily: "var(--font-outfit)",
              border: "none",
              cursor: "pointer",
              backgroundColor: filter === f ? "#FF5200" : "transparent",
              color: filter === f ? "#fff" : "#555",
              transition: "all 0.15s",
              textTransform: "capitalize",
            }}>
              {f === "all" ? "All" : f === "complete" ? "Sent" : "Draft"}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {deleteError && (
        <div style={{
          marginBottom: 12, padding: "9px 12px", borderRadius: 6,
          backgroundColor: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)",
          color: "#f87171", fontSize: 12, fontFamily: "var(--font-outfit)",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
        }}>
          {deleteError}
          <button onClick={() => setDeleteError(null)} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", fontSize: 14, lineHeight: 1, padding: 0 }}>×</button>
        </div>
      )}

      {/* Table */}
      <div style={{
        backgroundColor: "#0e0e0e",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 8,
        overflow: "hidden",
      }}>
        {/* Column headers */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 70px 90px 130px 100px",
          padding: "10px 20px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}>
          {["Campaign", "Leads", "Status", "Created", ""].map((col) => (
            <div key={col} style={{
              fontSize: 10,
              fontWeight: 500,
              color: "#444",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              fontFamily: "var(--font-outfit)",
            }}>
              {col}
            </div>
          ))}
        </div>

        {/* Rows */}
        {filtered.length === 0 ? (
          <div style={{ padding: "48px 20px", textAlign: "center" }}>
            <p style={{ fontSize: 13, color: "#444", fontFamily: "var(--font-outfit)" }}>
              {search ? `No campaigns matching "${search}"` : "No campaigns yet."}
            </p>
          </div>
        ) : (
          filtered.map((c, i) => {
            const isSent = c.status === "complete";
            return (
              <div
                key={c.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 70px 90px 130px 100px",
                  padding: "12px 20px",
                  borderTop: i === 0 ? "none" : "1px solid rgba(255,255,255,0.04)",
                  alignItems: "center",
                }}
              >
                {/* Name */}
                <div style={{
                  fontSize: 13,
                  color: "#ccc",
                  fontFamily: "var(--font-outfit)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  paddingRight: 12,
                }}>
                  {c.name}
                </div>

                {/* Leads */}
                <div style={{ fontSize: 13, color: "#888", fontFamily: "var(--font-outfit)" }}>
                  {c.lead_count}
                </div>

                {/* Status */}
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    backgroundColor: isSent ? "#4ade80" : "#555",
                    flexShrink: 0,
                  }} />
                  <span style={{ fontSize: 12, color: "#666", fontFamily: "var(--font-outfit)" }}>
                    {isSent ? "Sent" : "Draft"}
                  </span>
                </div>

                {/* Date */}
                <div style={{ fontSize: 12, color: "#555", fontFamily: "var(--font-outfit)" }}>
                  {formatDate(c.created_at)}
                </div>

                {/* Actions */}
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Link
                    href={`/dashboard/campaigns/${c.id}`}
                    style={{
                      fontSize: 12,
                      color: "#FF5200",
                      fontFamily: "var(--font-outfit)",
                      textDecoration: "none",
                    }}
                  >
                    View
                  </Link>
                  <button
                    onClick={() => handleDelete(c.id)}
                    disabled={deletingId === c.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 26,
                      height: 26,
                      borderRadius: 5,
                      backgroundColor: "transparent",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "#444",
                      cursor: "pointer",
                    }}
                    title="Delete campaign"
                  >
                    {deletingId === c.id ? <SpinnerIcon /> : <TrashIcon />}
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
