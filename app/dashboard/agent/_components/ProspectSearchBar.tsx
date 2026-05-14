"use client";

import { useState, useRef } from "react";
import { Search, ExternalLink, Building2, MapPin, Zap, Check, Loader2 } from "lucide-react";
import type { ProspectResult } from "@/lib/search/prospect-searcher";

type ProgressState = Record<string, number | null>;

type DoneStats = { total: number; avg_confidence: number };

const SOURCE_LABELS: Record<string, string> = {
  GitHub: "GitHub",
  HackerNews: "HackerNews",
  Crunchbase: "Crunchbase",
  GoogleNews: "Google News",
  LinkedInJobs: "LinkedIn Jobs",
  ProductHunt: "Product Hunt",
  Twitter: "Twitter/X",
  LinkedIn: "LinkedIn",
};

const ALL_SOURCES = Object.keys(SOURCE_LABELS);

function ConfidenceDot({ score }: { score: number }) {
  const color =
    score >= 8 ? "#4ade80" : score >= 6 ? "#f59e0b" : "rgba(255,255,255,0.3)";
  return (
    <span
      title={`Confidence ${score}/10`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontSize: 10,
        color,
        fontFamily: "var(--font-outfit)",
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          backgroundColor: color,
          flexShrink: 0,
        }}
      />
      {score}/10
    </span>
  );
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
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <div style={{ minWidth: 0 }}>
          {prospect.name && (
            <p
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "#fff",
                fontFamily: "var(--font-syne)",
                margin: 0,
                marginBottom: 2,
              }}
            >
              {prospect.name}
            </p>
          )}
          {prospect.role && (
            <p
              style={{
                fontSize: 11,
                color: "rgba(255,255,255,0.45)",
                fontFamily: "var(--font-outfit)",
                margin: 0,
              }}
            >
              {prospect.role}
            </p>
          )}
        </div>

        <div style={{ display: "flex", gap: 5, flexShrink: 0, alignItems: "center" }}>
          {prospect.confidence != null && (
            <ConfidenceDot score={prospect.confidence} />
          )}
          {prospect.linkedin_url && (
            <a
              href={prospect.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              title="LinkedIn"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                fontSize: 10,
                color: "#FF5200",
                textDecoration: "none",
                padding: "3px 8px",
                borderRadius: 999,
                backgroundColor: "rgba(255,82,0,0.08)",
                border: "1px solid rgba(255,82,0,0.15)",
                fontFamily: "var(--font-outfit)",
                fontWeight: 600,
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
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                fontSize: 10,
                color: "rgba(255,255,255,0.4)",
                textDecoration: "none",
                padding: "3px 8px",
                borderRadius: 999,
                backgroundColor: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                fontFamily: "var(--font-outfit)",
                fontWeight: 600,
              }}
            >
              <ExternalLink size={9} />
              CB
            </a>
          )}
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
        {prospect.company && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: 10,
              color: "rgba(255,255,255,0.45)",
              fontFamily: "var(--font-outfit)",
            }}
          >
            <Building2 size={9} />
            {prospect.company}
            {prospect.website_verified && (
              <Check size={8} color="#4ade80" strokeWidth={2.5} aria-label="domain verified" />
            )}
          </span>
        )}
        {prospect.location && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: 10,
              color: "rgba(255,255,255,0.3)",
              fontFamily: "var(--font-outfit)",
            }}
          >
            <MapPin size={9} />
            {prospect.location}
          </span>
        )}
        {prospect.funding_stage && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: 10,
              fontWeight: 600,
              color: "#FF5200",
              fontFamily: "var(--font-outfit)",
              backgroundColor: "rgba(255,82,0,0.08)",
              border: "1px solid rgba(255,82,0,0.15)",
              padding: "1px 7px",
              borderRadius: 999,
            }}
          >
            <Zap size={8} />
            {prospect.funding_stage}
            {prospect.funding_amount ? ` · ${prospect.funding_amount}` : ""}
          </span>
        )}
      </div>

      {(prospect.news_signal || prospect.jobs_signal) && (
        <p
          style={{
            fontSize: 10.5,
            color: "rgba(255,255,255,0.3)",
            fontFamily: "var(--font-outfit)",
            margin: 0,
            lineHeight: 1.45,
          }}
        >
          {prospect.news_signal ?? prospect.jobs_signal}
        </p>
      )}

      {prospect.name && prospect.company && (
        <a
          href={`/dashboard/campaigns/new?prospect=${encodeURIComponent(
            JSON.stringify({ name: prospect.name, company: prospect.company, role: prospect.role ?? "" })
          )}`}
          style={{
            alignSelf: "flex-start",
            fontSize: 10,
            color: "rgba(255,255,255,0.35)",
            fontFamily: "var(--font-outfit)",
            textDecoration: "none",
            marginTop: 2,
          }}
        >
          + Add to campaign
        </a>
      )}
    </div>
  );
}

function ProgressRow({
  source,
  found,
}: {
  source: string;
  found: number | null;
}) {
  const label = SOURCE_LABELS[source] ?? source;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontSize: 11,
        fontFamily: "var(--font-outfit)",
        color:
          found === null
            ? "rgba(255,255,255,0.3)"
            : found > 0
            ? "rgba(255,255,255,0.6)"
            : "rgba(255,255,255,0.2)",
      }}
    >
      {found === null ? (
        <Loader2
          size={10}
          strokeWidth={2}
          style={{ animation: "spin 0.8s linear infinite", flexShrink: 0 }}
        />
      ) : (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            backgroundColor: found > 0 ? "#4ade80" : "rgba(255,255,255,0.15)",
            flexShrink: 0,
          }}
        />
      )}
      {label}
      {found !== null && (
        <span style={{ color: found > 0 ? "#4ade80" : "rgba(255,255,255,0.2)" }}>
          {found > 0 ? `found ${found}` : "—"}
        </span>
      )}
    </div>
  );
}

export function ProspectSearchBar() {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [progress, setProgress] = useState<ProgressState>({});
  const [prospects, setProspects] = useState<ProspectResult[]>([]);
  const [done, setDone] = useState<DoneStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const handleSearch = async () => {
    if (!query.trim() || searching) return;

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setSearching(true);
    setError(null);
    setProspects([]);
    setDone(null);
    setProgress(Object.fromEntries(ALL_SOURCES.map((s) => [s, null])));

    try {
      const res = await fetch("/api/prospects/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
        signal: ctrl.signal,
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError((d as { error?: string }).error ?? "Search failed");
        setSearching(false);
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buf = "";

      while (true) {
        const { done: streamDone, value } = await reader.read();
        if (streamDone) break;
        buf += decoder.decode(value, { stream: true });
        const parts = buf.split("\n\n");
        buf = parts.pop() ?? "";
        for (const part of parts) {
          const line = part.replace(/^data: /, "").trim();
          if (!line) continue;
          try {
            const evt = JSON.parse(line) as
              | { type: "progress"; source: string; found: number }
              | { type: "result"; prospects: ProspectResult[] }
              | { type: "done"; stats: DoneStats };

            if (evt.type === "progress") {
              setProgress((prev) => ({ ...prev, [evt.source]: evt.found }));
            } else if (evt.type === "result") {
              setProspects(evt.prospects);
            } else if (evt.type === "done") {
              setDone(evt.stats);
              setSearching(false);
            }
          } catch {
            // malformed line, skip
          }
        }
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        setError("Network error");
        setSearching(false);
      }
    }
  };

  const showProgress = searching || done !== null;
  const activeSources = Object.keys(progress);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <div style={{ flex: 1, position: "relative" }}>
          <Search
            size={13}
            style={{
              position: "absolute",
              left: 11,
              top: "50%",
              transform: "translateY(-50%)",
              color: "rgba(255,255,255,0.25)",
              pointerEvents: "none",
            }}
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder='e.g. "SaaS founders California Series A"'
            style={{
              width: "100%",
              paddingLeft: 32,
              paddingRight: 12,
              paddingTop: 9,
              paddingBottom: 9,
              backgroundColor: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.09)",
              borderRadius: 9,
              color: "#fff",
              fontSize: 13,
              fontFamily: "var(--font-outfit)",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={searching || !query.trim()}
          style={{
            padding: "9px 16px",
            borderRadius: 9,
            border: "none",
            backgroundColor:
              searching || !query.trim() ? "rgba(255,82,0,0.3)" : "#FF5200",
            color: "#fff",
            fontSize: 12,
            fontWeight: 600,
            fontFamily: "var(--font-outfit)",
            cursor: searching ? "wait" : "pointer",
            whiteSpace: "nowrap",
          }}
        >
          {searching ? "Researching..." : "Find Prospects"}
        </button>
      </div>

      {error && (
        <p
          style={{
            fontSize: 12,
            color: "#f87171",
            fontFamily: "var(--font-outfit)",
            margin: 0,
          }}
        >
          {error}
        </p>
      )}

      {showProgress && activeSources.length > 0 && (
        <div
          style={{
            padding: "10px 12px",
            borderRadius: 8,
            backgroundColor: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.06)",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
            gap: "6px 12px",
          }}
        >
          {activeSources.map((source) => (
            <ProgressRow key={source} source={source} found={progress[source] ?? null} />
          ))}
        </div>
      )}

      {done && (
        <p
          style={{
            fontSize: 11,
            color: "rgba(255,255,255,0.3)",
            fontFamily: "var(--font-outfit)",
            margin: 0,
          }}
        >
          {done.total} prospect{done.total !== 1 ? "s" : ""} verified
          {done.total > 0 ? ` · avg confidence ${done.avg_confidence}/10` : ""}
        </p>
      )}

      {prospects.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {prospects.map((p, i) => (
            <ProspectCard key={i} prospect={p} />
          ))}
        </div>
      )}

      {done && done.total === 0 && (
        <p
          style={{
            fontSize: 12,
            color: "rgba(255,255,255,0.3)",
            fontFamily: "var(--font-outfit)",
            textAlign: "center",
            padding: "20px 0",
          }}
        >
          No verified prospects found. Try broader terms.
        </p>
      )}
    </div>
  );
}
