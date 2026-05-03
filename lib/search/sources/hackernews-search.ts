import type { ParsedQuery } from "../query-parser";
import type { ProspectResult } from "../prospect-searcher";

// HN "Who is Hiring?" threads are posted monthly by @whoishiring.
// We search those threads for companies matching the query.

interface HNHit {
  objectID: string;
  author: string;
  story_title?: string;
  comment_text?: string;
  _tags?: string[];
  created_at?: string;
}

interface HNSearchResponse {
  hits?: HNHit[];
}

function extractCompanyFromHNPost(text: string): string | undefined {
  // HN hiring posts start with "Company Name | Role | Location | ..."
  const pipeMatch = text.match(/^([^|<\n]{2,60})\|/);
  if (pipeMatch) return pipeMatch[1].trim();

  // "We're hiring at CompanyName" pattern
  const hiringMatch = text.match(/(?:hiring at|at)\s+([A-Z][^\s,.|]{1,40})/i);
  if (hiringMatch) return hiringMatch[1].trim();

  return undefined;
}

function extractDomainFromText(text: string): string | undefined {
  const urlMatch = text.match(/https?:\/\/(?:www\.)?([a-z0-9-]+\.[a-z]{2,})/i);
  return urlMatch?.[1];
}

export async function searchHackerNews(query: ParsedQuery): Promise<ProspectResult[]> {
  const terms: string[] = [];
  if (query.industry) terms.push(query.industry);
  if (query.role) terms.push(query.role);
  if (query.location) terms.push(query.location);
  if (terms.length === 0 && query.keywords.length > 0) {
    terms.push(...query.keywords.slice(0, 2));
  }
  if (terms.length === 0) return [];

  const q = encodeURIComponent(terms.join(" "));

  try {
    // Search within "Who is Hiring?" story comments only
    const res = await fetch(
      `https://hn.algolia.com/api/v1/search?query=${q}&tags=comment,story_33818406,story_40224213,story_39489700,story_38490536&hitsPerPage=10`,
      { signal: AbortSignal.timeout(8_000) }
    );

    if (!res.ok) {
      // Fall back to general ask_hn search
      const fallback = await fetch(
        `https://hn.algolia.com/api/v1/search?query=who+is+hiring+${q}&tags=ask_hn&hitsPerPage=5`,
        { signal: AbortSignal.timeout(8_000) }
      );
      if (!fallback.ok) return [];
      const fb = (await fallback.json()) as HNSearchResponse;
      return (fb.hits ?? []).slice(0, 5).map((h) => ({
        company: extractCompanyFromHNPost(h.comment_text ?? h.story_title ?? ""),
        source: "HackerNews",
        _hn_url: `https://news.ycombinator.com/item?id=${h.objectID}`,
      })).filter((r) => r.company);
    }

    const data = (await res.json()) as HNSearchResponse;

    return (data.hits ?? [])
      .map((h) => {
        const text = h.comment_text ?? "";
        const company = extractCompanyFromHNPost(text);
        const domain = extractDomainFromText(text);
        if (!company && !domain) return null;
        return {
          company,
          domain,
          source: "HackerNews",
          _hn_url: `https://news.ycombinator.com/item?id=${h.objectID}`,
        } as ProspectResult;
      })
      .filter((r): r is ProspectResult => r !== null);
  } catch {
    return [];
  }
}
