import type { ParsedQuery } from "../query-parser";
import type { ProspectResult } from "../prospect-searcher";

interface Tweet {
  id: string;
  text: string;
  created_at: string;
  author_id: string;
}

interface TwitterUser {
  id: string;
  name: string;
  username: string;
  description?: string;
  entities?: {
    url?: { urls?: Array<{ expanded_url: string }> };
  };
}

interface TwitterResponse {
  data?: Tweet[];
  includes?: { users?: TwitterUser[] };
}

function extractDomain(user: TwitterUser): string | undefined {
  const url = user.entities?.url?.urls?.[0]?.expanded_url;
  if (!url) return undefined;
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return undefined; }
}

function extractCompany(bio: string | undefined): string | undefined {
  if (!bio) return undefined;
  const patterns = [
    /(?:founder|ceo|cto|co-founder)\s+(?:at|@|of)\s+(@?[A-Z][a-zA-Z0-9]{1,30})/i,
    /building\s+(@?[A-Z][a-zA-Z0-9\s]{1,30})/i,
  ];
  for (const re of patterns) {
    const m = bio.match(re);
    if (m) return m[1].replace(/^@/, "").trim();
  }
  return undefined;
}

export async function searchTwitter(query: ParsedQuery): Promise<ProspectResult[]> {
  const token = process.env.TWITTER_BEARER_TOKEN;
  if (!token) return [];

  const terms: string[] = [];
  if (query.role) terms.push(query.role);
  if (query.industry) terms.push(query.industry);
  if (terms.length === 0) terms.push(...query.keywords.slice(0, 2));
  if (terms.length === 0) return [];

  const q = encodeURIComponent(
    `(${terms.join(" OR ")}) (founder OR CEO OR CTO OR launched OR hiring) -is:retweet lang:en`
  );

  try {
    const res = await fetch(
      `https://api.twitter.com/2/tweets/search/recent?query=${q}&max_results=20&tweet.fields=created_at,author_id&expansions=author_id&user.fields=name,username,description,entities`,
      { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(10_000) }
    );
    if (!res.ok) return [];

    const data = (await res.json()) as TwitterResponse;
    if (!data.data?.length) return [];

    const userMap = new Map<string, TwitterUser>(
      (data.includes?.users ?? []).map((u) => [u.id, u])
    );

    const seen = new Set<string>();
    const results: ProspectResult[] = [];

    for (const tweet of data.data) {
      const user = userMap.get(tweet.author_id);
      if (!user || seen.has(user.id)) continue;
      seen.add(user.id);
      results.push({
        name: user.name,
        company: extractCompany(user.description),
        domain: extractDomain(user),
        twitter_url: `https://twitter.com/${user.username}`,
        news_signal: tweet.text.slice(0, 120),
        source: "Twitter",
        signal_dates: [new Date(tweet.created_at).toISOString().slice(0, 10)],
      });
    }
    return results;
  } catch {
    return [];
  }
}
