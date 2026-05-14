import type { ParsedQuery } from "../query-parser";
import type { ProspectResult } from "../prospect-searcher";

interface SerpResult {
  title?: string;
  link?: string;
  snippet?: string;
}

interface SerpResponse {
  organic_results?: SerpResult[];
  error?: string;
}

function extractCompany(title: string, snippet: string): string | undefined {
  const text = `${title} ${snippet}`;
  const atMatch = text.match(/\bat\s+([A-Z][a-zA-Z0-9\s&.]{1,40}?)(?:\s*[-|•·–—,]|\s+is\b|\s+we\b|$)/);
  if (atMatch) return atMatch[1].trim();
  const slugMatch = text.match(/-at-([a-z0-9-]{3,40})-\d/);
  if (slugMatch) {
    return slugMatch[1].split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  }
  return undefined;
}

export async function searchLinkedInJobs(query: ParsedQuery): Promise<ProspectResult[]> {
  const key = process.env.SERPAPI_KEY;
  if (!key) return [];

  const parts: string[] = [];
  if (query.role) parts.push(`"${query.role}"`);
  if (query.industry) parts.push(query.industry);
  if (query.location) parts.push(query.location);
  if (parts.length === 0) parts.push(...query.keywords.slice(0, 2));
  if (parts.length === 0) return [];

  parts.push("site:linkedin.com/jobs");
  const q = encodeURIComponent(parts.join(" "));
  const url = `https://serpapi.com/search.json?engine=google&q=${q}&num=10&api_key=${key}`;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return [];
    const data = (await res.json()) as SerpResponse;
    if (data.error) return [];

    return (data.organic_results ?? [])
      .map((r): ProspectResult | null => {
        if (!r.link?.includes("linkedin.com/jobs")) return null;
        const company = extractCompany(r.title ?? "", r.snippet ?? "");
        if (!company) return null;
        return {
          company,
          jobs_signal: r.title?.slice(0, 120),
          source: "LinkedInJobs",
          signal_dates: [new Date().toISOString().slice(0, 10)],
        };
      })
      .filter((r): r is ProspectResult => r !== null);
  } catch {
    return [];
  }
}
