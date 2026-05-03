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

function buildSearchQuery(query: ParsedQuery, rawQuery: string): string {
  // Build a Google query that surfaces LinkedIn profiles
  const parts: string[] = [];

  if (query.role) parts.push(`"${query.role}"`);
  if (query.industry) parts.push(query.industry);
  if (query.location) parts.push(query.location);
  if (query.funding_stage) {
    parts.push(query.funding_stage.replace(/_/g, " "));
  }
  // Fall back to raw query terms if parsing produced nothing
  if (parts.length === 0) {
    parts.push(...query.keywords.slice(0, 4));
  }

  // Target LinkedIn profile pages
  parts.push("site:linkedin.com/in");

  return parts.join(" ");
}

function extractLinkedinProfile(result: SerpResult): ProspectResult | null {
  const url = result.link ?? "";
  if (!url.includes("linkedin.com/in/")) return null;

  // linkedin.com/in/firstname-lastname → "Firstname Lastname"
  const slug = url.split("linkedin.com/in/")[1]?.replace(/\/$/, "") ?? "";
  const name = slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  // "Title at Company — Location" pattern in titles/snippets
  const titleText = `${result.title ?? ""} ${result.snippet ?? ""}`;
  const atMatch = titleText.match(/^([^|–—-]+?)\s+(?:at|@)\s+(.+?)(?:\s*[|–—-]|$)/i);

  return {
    name: name || undefined,
    role: atMatch?.[1]?.trim(),
    company: atMatch?.[2]?.trim(),
    linkedin_url: url,
    source: "Web",
  };
}

export async function searchWeb(
  query: ParsedQuery,
  rawQuery: string
): Promise<ProspectResult[]> {
  const key = process.env.SERPAPI_KEY;
  if (!key) return [];

  const q = encodeURIComponent(buildSearchQuery(query, rawQuery));
  const url = `https://serpapi.com/search.json?engine=google&q=${q}&num=10&api_key=${key}`;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(12_000) });
    if (!res.ok) return [];

    const data = (await res.json()) as SerpResponse;
    if (data.error) return [];

    return (data.organic_results ?? [])
      .map(extractLinkedinProfile)
      .filter((r): r is ProspectResult => r !== null);
  } catch {
    return [];
  }
}
