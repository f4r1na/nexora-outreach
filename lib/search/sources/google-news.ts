import type { ParsedQuery } from "../query-parser";
import type { ProspectResult } from "../prospect-searcher";

interface SerpNewsResult {
  title?: string;
  link?: string;
  snippet?: string;
  date?: string;
}

interface SerpNewsResponse {
  news_results?: SerpNewsResult[];
  error?: string;
}

function extractCompany(title: string, snippet: string): string | undefined {
  const text = `${title} ${snippet}`;
  const patterns = [
    /^([A-Z][a-zA-Z0-9]{1,30}(?:\s[A-Z][a-zA-Z0-9]{1,20})?)\s+(?:raises|launches|expands|announces|acquires|hires|opens)/i,
    /^([A-Z][a-zA-Z0-9]{1,30}(?:\s[A-Z][a-zA-Z0-9]{1,20})?),\s+(?:a|an|the)\s+/,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m) return m[1].trim();
  }
  return undefined;
}

function parseDate(dateStr: string | undefined): string | undefined {
  if (!dateStr) return undefined;
  if (/hour|minute|second/i.test(dateStr)) return new Date().toISOString().slice(0, 10);
  if (/day/i.test(dateStr)) {
    const days = parseInt(dateStr) || 1;
    return new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
  }
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? undefined : d.toISOString().slice(0, 10);
}

function extractDomain(link: string | undefined): string | undefined {
  if (!link) return undefined;
  try { return new URL(link).hostname.replace(/^www\./, ""); } catch { return undefined; }
}

export async function searchGoogleNews(query: ParsedQuery): Promise<ProspectResult[]> {
  const key = process.env.SERPAPI_KEY;
  if (!key) return [];

  const terms: string[] = [];
  if (query.industry) terms.push(query.industry);
  if (query.role) terms.push(query.role);
  if (query.funding_stage) terms.push(query.funding_stage.replace(/_/g, " ") + " funding");
  if (terms.length === 0) terms.push(...query.keywords.slice(0, 2));
  if (terms.length === 0) return [];

  const q = encodeURIComponent(terms.join(" ") + " startup");
  const url = `https://serpapi.com/search.json?engine=google_news&q=${q}&num=10&api_key=${key}`;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return [];
    const data = (await res.json()) as SerpNewsResponse;
    if (data.error) return [];

    const cutoff = new Date(Date.now() - 90 * 86_400_000).toISOString().slice(0, 10);

    return (data.news_results ?? [])
      .map((r): ProspectResult | null => {
        const dateIso = parseDate(r.date);
        if (dateIso && dateIso < cutoff) return null;
        const company = extractCompany(r.title ?? "", r.snippet ?? "");
        if (!company) return null;
        return {
          company,
          domain: extractDomain(r.link),
          news_signal: r.title?.slice(0, 150),
          source: "GoogleNews",
          signal_dates: dateIso ? [dateIso] : [new Date().toISOString().slice(0, 10)],
        };
      })
      .filter((r): r is ProspectResult => r !== null);
  } catch {
    return [];
  }
}
