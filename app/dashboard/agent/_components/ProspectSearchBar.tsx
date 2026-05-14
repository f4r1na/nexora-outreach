"use client";

import { useState } from "react";
import { Search, ExternalLink, Building2, MapPin, Zap, Check } from "lucide-react";
import type { ProspectResult } from "@/lib/search/prospect-searcher";

interface SearchResult {
  prospects: ProspectResult[];
  sources_used: string[];
  query_parsed: {
    role?: string;
    industry?: string;
    location?: string;
    funding_stage?: string;
    keywords: string[];
  };
}

function ProspectCard({ prospect }: { prospect: ProspectResult }) {
  return (
    <div
      style={{
        padding: "12px 14px",
        borderRadius: 9,
        backgroundColor: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
        <div style={{ minWidth: 0 }}>
          {prospect.name && (
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 2 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#fff", fontFamily: "var(--font-syne)", margin: 0 }}>
                {prospect.name}
              </p>
              {prospect.linkedin_verified && (
                <Check
                  size={11}
                  strokeWidth={2.5}
                  color="#4ade80"
                  aria-label="LinkedIn verified"
                />
              )}
            </div>
          )}
          {prospect.role && (
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", fontFamily: "var(--font-outfit)", margin: 0 }}>
              {prospect.role}
            </p>
          )}
        </div>
        <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
          {prospect.linkedin_url && (
            <a
              href={prospect.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              title="LinkedIn"
              style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                fontSize: 10, color: "#FF5200", textDecoration: "none",
                padding: "3px 8px", borderRadius: 999,
                backgroundColor: "rgba(255,82,0,0.08)",
                border: "1px solid rgba(255,82,0,0.15)",
                fontFamily: "var(--font-outfit)", fontWeight: 600,
              }}
            >
              <ExternalLink size={9} />
              LinkedIn
            </a>
          )}
          {prospect.crunchbase_url && (
            <a
              href={prospect.crunchbase_url}
              target="_blank"
              rel="noopener noreferrer"
              title="Crunchbase"
              style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                fontSize: 10, color: "rgba(255,255,255,0.4)", textDecoration: "none",
                padding: "3px 8px", borderRadius: 999,
                backgroundColor: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                fontFamily: "var(--font-outfit)", fontWeight: 600,
              }}
            >
              <ExternalLink size={9} />
              Crunchbase
            </a>
          )}
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
        {prospect.company && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, color: "rgba(255,255,255,0.45)", fontFamily: "var(--font-outfit)" }}>
            <Building2 size={9} />
            {prospect.company}
          </span>
        )}
        {prospect.location && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: "var(--font-outfit)" }}>
            <MapPin size={9} />
            {prospect.location}
          </span>
        )}
        {prospect.funding_stage && (
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            fontSize: 10, fontWeight: 600,
            color: "#FF5200", fontFamily: "var(--font-outfit)",
            backgroundColor: "rgba(255,82,0,0.08)",
            border: "1px solid rgba(255,82,0,0.15)",
            padding: "1px 7px", borderRadius: 999,
          }}>
            <Zap size={8} />
            {prospect.funding_stage}
            {prospect.funding_amount ? ` · ${prospect.funding_amount}` : ""}
          </span>
        )}
      </div>
    </div>
  );
}

export function ProspectSearchBar() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!query.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/prospects/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Search failed");
      } else {
        setResult(data as SearchResult);
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <div style={{ flex: 1, position: "relative" }}>
          <Search
            size={13}
            style={{
              position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)",
              color: "rgba(255,255,255,0.25)", pointerEvents: "none",
            }}
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder='e.g. "SaaS founders California Series A"'
            style={{
              width: "100%", paddingLeft: 32, paddingRight: 12,
              paddingTop: 9, paddingBottom: 9,
              backgroundColor: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.09)",
              borderRadius: 9, color: "#fff", fontSize: 13,
              fontFamily: "var(--font-outfit)", outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={loading || !query.trim()}
          style={{
            padding: "9px 16px", borderRadius: 9, border: "none",
            backgroundColor: loading || !query.trim() ? "rgba(255,82,0,0.3)" : "#FF5200",
            color: "#fff", fontSize: 12, fontWeight: 600,
            fontFamily: "var(--font-outfit)", cursor: loading ? "wait" : "pointer",
            whiteSpace: "nowrap",
          }}
        >
          {loading ? "Searching..." : "Find Prospects"}
        </button>
      </div>

      {error && (
        <p style={{ fontSize: 12, color: "#f87171", fontFamily: "var(--font-outfit)", margin: 0 }}>
          {error}
        </p>
      )}

      {result && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "var(--font-outfit)", margin: 0 }}>
              {result.prospects.length} prospect{result.prospects.length !== 1 ? "s" : ""} found
              {result.sources_used.length > 0 ? ` via ${result.sources_used.join(", ")}` : ""}
            </p>
          </div>

          {result.prospects.length === 0 ? (
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", fontFamily: "var(--font-outfit)", textAlign: "center", padding: "20px 0" }}>
              No prospects found. Try broader search terms.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {result.prospects.map((p, i) => (
                <ProspectCard key={i} prospect={p} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
