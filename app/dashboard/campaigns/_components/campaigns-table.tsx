"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Trash2, Loader2 } from "lucide-react";

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

const EASE = [0.23, 1, 0.32, 1] as const;

const rowVariants = {
  hidden: { opacity: 0, y: 5 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.25, ease: EASE, delay: i * 0.04 },
  }),
  exit: { opacity: 0, x: -6, transition: { duration: 0.16 } },
};

export default function CampaignsTable({ campaigns }: { campaigns: Campaign[] }) {
  const router = useRouter();
  const [search, setSearch]     = useState("");
  const [filter, setFilter]     = useState<"all" | "complete" | "draft">("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [items, setItems]       = useState<Campaign[]>(campaigns);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const filtered = items.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || c.status === filter;
    return matchSearch && matchFilter;
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
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <Search
            size={12}
            color="#383838"
            strokeWidth={1.75}
            aria-hidden="true"
            style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
          />
          <input
            type="text"
            placeholder="Search campaigns"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "7px 12px 7px 30px",
              backgroundColor: "#0e0e0e",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 6,
              color: "#ccc",
              fontSize: 12,
              fontFamily: "var(--font-outfit)",
              outline: "none",
              transition: "border-color 0.18s ease",
            }}
          />
        </div>

        <div style={{
          display: "flex", gap: 2,
          backgroundColor: "rgba(255,255,255,0.03)",
          borderRadius: 8, padding: 3,
          border: "1px solid rgba(255,255,255,0.05)",
        }}>
          {(["all", "complete", "draft"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="btn-ghost"
              style={{
                padding: "5px 13px", borderRadius: 6,
                fontSize: 11, fontFamily: "var(--font-outfit)",
                border: "none", cursor: "pointer",
                backgroundColor: filter === f ? "rgba(255,255,255,0.07)" : "transparent",
                color: filter === f ? "#ccc" : "#3a3a3a",
                fontWeight: filter === f ? 500 : 400,
              }}
            >
              {f === "all" ? "All" : f === "complete" ? "Sent" : "Draft"}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      <AnimatePresence>
        {deleteError && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            style={{
              marginBottom: 12, padding: "9px 12px", borderRadius: 6,
              backgroundColor: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.14)",
              color: "#f87171", fontSize: 12, fontFamily: "var(--font-outfit)",
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
            }}
          >
            {deleteError}
            <button onClick={() => setDeleteError(null)} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", fontSize: 14, lineHeight: 1, padding: 0 }}>×</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <div style={{
        backgroundColor: "#0e0e0e",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 10,
        overflow: "hidden",
      }}>
        {/* Column headers */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 70px 100px 130px 90px",
          padding: "10px 22px",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}>
          {["Campaign", "Leads", "Status", "Created", ""].map((col) => (
            <div key={col} className="nx-section-label">{col}</div>
          ))}
        </div>

        {/* Rows */}
        {filtered.length === 0 ? (
          <div style={{ padding: "56px 24px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 9,
              border: "1px solid rgba(255,255,255,0.07)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#333",
            }}>
              <Search size={16} strokeWidth={1.5} aria-hidden="true" />
            </div>
            <p style={{ fontSize: 13, color: "#444", fontFamily: "var(--font-outfit)" }}>
              {search ? `No campaigns matching "${search}"` : "No campaigns yet."}
            </p>
          </div>
        ) : (
          <AnimatePresence initial={true}>
            {filtered.map((c, i) => {
              const isSent = c.status === "complete";
              return (
                <motion.div
                  key={c.id}
                  custom={i}
                  variants={rowVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="table-row"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 70px 100px 130px 90px",
                    padding: "11px 22px",
                    borderTop: i === 0 ? "none" : "1px solid rgba(255,255,255,0.03)",
                    alignItems: "center",
                  }}
                >
                  <div style={{
                    fontSize: 13, color: "#b8b8b8",
                    fontFamily: "var(--font-outfit)",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    paddingRight: 12,
                  }}>
                    {c.name}
                  </div>

                  <div style={{ fontSize: 13, color: "#555", fontFamily: "var(--font-outfit)", fontVariantNumeric: "tabular-nums" } as React.CSSProperties}>
                    {c.lead_count}
                  </div>

                  <div>
                    <span className={`nx-badge ${isSent ? "nx-badge-green" : "nx-badge-gray"}`}>
                      {isSent ? "Sent" : "Draft"}
                    </span>
                  </div>

                  <div style={{ fontSize: 11, color: "#444", fontFamily: "var(--font-outfit)" }}>
                    {formatDate(c.created_at)}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Link
                      href={`/dashboard/campaigns/${c.id}`}
                      style={{ fontSize: 11, color: "#FF5200", fontFamily: "var(--font-outfit)", textDecoration: "none" }}
                    >
                      View
                    </Link>
                    <button
                      onClick={() => handleDelete(c.id)}
                      disabled={deletingId === c.id}
                      className="btn-ghost"
                      aria-label="Delete campaign"
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "center",
                        width: 24, height: 24, borderRadius: 5,
                        backgroundColor: "transparent",
                        border: "1px solid rgba(255,255,255,0.07)",
                        color: "#383838", cursor: "pointer",
                      }}
                    >
                      {deletingId === c.id
                        ? <Loader2 size={11} strokeWidth={2} style={{ animation: "spin 0.8s linear infinite" }} aria-hidden="true" />
                        : <Trash2 size={11} strokeWidth={1.5} aria-hidden="true" />
                      }
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
