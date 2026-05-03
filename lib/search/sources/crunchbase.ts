import type { ParsedQuery } from "../query-parser";
import type { ProspectResult } from "../prospect-searcher";

const BASE = "https://api.crunchbase.com/api/v4";

const FUNDING_TYPE_MAP: Record<string, string> = {
  seed: "seed",
  series_a: "series_a",
  series_b: "series_b",
  series_c: "series_c",
  growth: "series_d",
  ipo: "ipo",
};

interface CrunchbaseOrg {
  value: string;        // company name
  permalink: string;
}

interface CrunchbaseFundingRound {
  properties: {
    announced_on?: string;
    investment_type?: string;
    money_raised?: { value_usd?: number; value?: number; currency?: string };
    org_identifier?: CrunchbaseOrg;
  };
}

export async function searchCrunchbase(query: ParsedQuery): Promise<ProspectResult[]> {
  const key = process.env.CRUNCHBASE_API_KEY;
  if (!key) return [];

  const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const predicates: unknown[] = [
    { type: "predicate", field_id: "announced_on", operator_id: "gte", values: [sixMonthsAgo] },
  ];

  const fundingType = query.funding_stage && FUNDING_TYPE_MAP[query.funding_stage];
  if (fundingType) {
    predicates.push({
      type: "predicate",
      field_id: "investment_type",
      operator_id: "includes",
      values: [fundingType],
    });
  }

  try {
    const res = await fetch(`${BASE}/searches/funding_rounds?user_key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        field_ids: ["announced_on", "investment_type", "money_raised", "org_identifier"],
        query: predicates,
        sort: [{ field_id: "announced_on", sort_value: "desc" }],
        limit: 10,
      }),
      signal: AbortSignal.timeout(12_000),
    });

    if (!res.ok) return [];

    const data = (await res.json()) as { entities?: CrunchbaseFundingRound[] };
    const results: ProspectResult[] = [];

    for (const entity of data.entities ?? []) {
      const p = entity.properties;
      if (!p.org_identifier) continue;

      const amount = p.money_raised?.value_usd ?? p.money_raised?.value;
      const amountStr = amount
        ? `$${(amount / 1_000_000).toFixed(1)}M`
        : undefined;

      results.push({
        company: p.org_identifier.value,
        funding_stage: p.investment_type?.replace(/_/g, " ") ?? query.funding_stage,
        funding_amount: amountStr,
        announced_on: p.announced_on,
        crunchbase_url: `https://www.crunchbase.com/organization/${p.org_identifier.permalink}`,
        source: "Crunchbase",
      });
    }

    return results;
  } catch {
    return [];
  }
}
