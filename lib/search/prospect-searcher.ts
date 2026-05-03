import { parseProspectQuery } from "./query-parser";
import { searchCrunchbase } from "./sources/crunchbase";
import { searchWeb } from "./sources/web-search";
import { searchGithubUsers } from "./sources/github-search";
import { searchHackerNews } from "./sources/hackernews-search";

export interface ProspectResult {
  name?: string;
  role?: string;
  company?: string;
  location?: string;
  linkedin_url?: string;
  crunchbase_url?: string;
  domain?: string;
  funding_stage?: string;
  funding_amount?: string;
  announced_on?: string;
  source: string;
  // internal enrichment fields, not shown in UI
  _github_url?: string;
  _hn_url?: string;
  _bio?: string;
}

export interface SearchResult {
  prospects: ProspectResult[];
  query_parsed: {
    role?: string;
    industry?: string;
    location?: string;
    funding_stage?: string;
    keywords: string[];
  };
  sources_used: string[];
}

// Merge all sources by company name. Results appearing in more sources rank higher.
function mergeAndRank(all: ProspectResult[]): ProspectResult[] {
  const byCompany = new Map<string, ProspectResult & { _score: number }>();

  for (const p of all) {
    const key = (p.company ?? p.name ?? p.domain ?? Math.random().toString())
      .toLowerCase()
      .trim();

    const existing = byCompany.get(key);
    if (existing) {
      // Merge fields — prefer non-null values from richer sources
      byCompany.set(key, {
        ...existing,
        ...Object.fromEntries(
          Object.entries(p).filter(([, v]) => v != null && v !== "")
        ),
        source: `${existing.source} + ${p.source}`,
        _score: existing._score + 1,
      });
    } else {
      byCompany.set(key, { ...p, _score: 1 });
    }
  }

  return [...byCompany.values()]
    .sort((a, b) => b._score - a._score)
    .map(({ _score: _, ...rest }) => rest);
}

export async function searchProspects(rawQuery: string): Promise<SearchResult> {
  const parsed = await parseProspectQuery(rawQuery);

  const [crunchbase, web, github, hn] = await Promise.all([
    searchCrunchbase(parsed),
    searchWeb(parsed, rawQuery),
    searchGithubUsers(parsed),
    searchHackerNews(parsed),
  ]);

  const sourcesUsed: string[] = [];
  if (crunchbase.length > 0) sourcesUsed.push("Crunchbase");
  if (web.length > 0) sourcesUsed.push("LinkedIn");
  if (github.length > 0) sourcesUsed.push("GitHub");
  if (hn.length > 0) sourcesUsed.push("HackerNews");

  return {
    prospects: mergeAndRank([...crunchbase, ...web, ...github, ...hn]),
    query_parsed: parsed,
    sources_used: sourcesUsed,
  };
}
