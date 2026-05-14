import type { ParsedQuery } from "../query-parser";
import type { ProspectResult } from "../prospect-searcher";

interface PHMaker {
  id: string;
  name: string;
  profileUrl: string;
}

interface PHPost {
  name: string;
  tagline: string;
  website: string | null;
  createdAt: string;
  makers: PHMaker[];
}

interface PHResponse {
  data?: { posts?: { edges?: Array<{ node: PHPost }> } };
  errors?: Array<{ message: string }>;
}

const GQL = `query($q:String!,$after:DateTime!){posts(query:$q,order:NEWEST,postedAfter:$after,first:10){edges{node{name tagline website createdAt makers{id name profileUrl}}}}}`;

function extractDomain(website: string | null): string | undefined {
  if (!website) return undefined;
  try { return new URL(website).hostname.replace(/^www\./, ""); } catch { return undefined; }
}

export async function searchProductHunt(query: ParsedQuery): Promise<ProspectResult[]> {
  const token = process.env.PRODUCTHUNT_CLIENT_TOKEN;
  if (!token) return [];

  const terms: string[] = [];
  if (query.industry) terms.push(query.industry);
  if (query.role) terms.push(query.role);
  if (terms.length === 0) terms.push(...query.keywords.slice(0, 2));
  if (terms.length === 0) return [];

  const after = new Date(Date.now() - 90 * 86_400_000).toISOString();

  try {
    const res = await fetch("https://api.producthunt.com/v2/api/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ query: GQL, variables: { q: terms.join(" "), after } }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return [];

    const data = (await res.json()) as PHResponse;
    if (data.errors?.length) return [];

    const results: ProspectResult[] = [];
    for (const edge of data.data?.posts?.edges ?? []) {
      const post = edge.node;
      const signalDate = new Date(post.createdAt).toISOString().slice(0, 10);
      const domain = extractDomain(post.website);
      for (const maker of post.makers.slice(0, 2)) {
        results.push({
          name: maker.name,
          company: post.name,
          domain,
          producthunt_url: `https://www.producthunt.com${maker.profileUrl}`,
          news_signal: `Launched "${post.name}": ${post.tagline}`.slice(0, 150),
          source: "ProductHunt",
          signal_dates: [signalDate],
        });
      }
    }
    return results;
  } catch {
    return [];
  }
}
