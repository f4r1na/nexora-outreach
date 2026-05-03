import { parseProspectQuery } from "./query-parser";
import { searchCrunchbase } from "./sources/crunchbase";
import { searchWeb } from "./sources/web-search";

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

// Merge Crunchbase companies with LinkedIn profiles where company name matches.
function mergeResults(
  crunchbase: ProspectResult[],
  web: ProspectResult[]
): ProspectResult[] {
  const merged: ProspectResult[] = [];
  const usedWebIndices = new Set<number>();

  for (const cb of crunchbase) {
    const companyLower = cb.company?.toLowerCase() ?? "";
    const match = companyLower
      ? web.findIndex(
          (w, i) =>
            !usedWebIndices.has(i) &&
            w.company?.toLowerCase().includes(companyLower)
        )
      : -1;

    if (match >= 0) {
      usedWebIndices.add(match);
      merged.push({ ...web[match], ...cb, source: "Crunchbase + LinkedIn" });
    } else {
      merged.push(cb);
    }
  }

  // Remaining web results not matched to a Crunchbase company
  for (let i = 0; i < web.length; i++) {
    if (!usedWebIndices.has(i)) merged.push(web[i]);
  }

  return merged;
}

export async function searchProspects(rawQuery: string): Promise<SearchResult> {
  const parsed = await parseProspectQuery(rawQuery);

  const [crunchbase, web] = await Promise.all([
    searchCrunchbase(parsed),
    searchWeb(parsed, rawQuery),
  ]);

  const sourcesUsed: string[] = [];
  if (crunchbase.length > 0) sourcesUsed.push("Crunchbase");
  if (web.length > 0) sourcesUsed.push("LinkedIn (via Google)");

  return {
    prospects: mergeResults(crunchbase, web),
    query_parsed: parsed,
    sources_used: sourcesUsed,
  };
}
