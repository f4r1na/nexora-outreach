export interface FeedItem {
  title: string;
  link: string;
  pubDate: string;
  description: string;
  sourceType: "techcrunch" | "yc";
}

export const FEEDS = [
  { url: "https://techcrunch.com/tag/funding/feed/", type: "techcrunch" as const },
  { url: "https://www.ycombinator.com/blog/rss",     type: "yc" as const },
];

const FUNDING_KEYWORDS = [
  "raises", "raised", "funding", "series a", "series b", "series c", "series d",
  "seed round", "million", "billion", "backed", "investment", "venture", "secures",
];
const HIRING_KEYWORDS = [
  "hiring", "expands team", "new hires", "growing team", "headcount", "open roles",
];

function extractTag(xml: string, tag: string): string {
  const re = new RegExp(
    `<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`,
    "i"
  );
  const m = xml.match(re);
  return (m?.[1] ?? m?.[2] ?? "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .trim();
}

function parseFeed(xml: string, sourceType: FeedItem["sourceType"]): FeedItem[] {
  const blocks = xml.match(/<item>([\s\S]*?)<\/item>/g) ?? [];
  return blocks
    .map((block) => ({
      title:       extractTag(block, "title"),
      link:        extractTag(block, "link"),
      pubDate:     extractTag(block, "pubDate"),
      description: extractTag(block, "description"),
      sourceType,
    }))
    .filter((item) => item.title && item.link);
}

export async function fetchFeed(feed: typeof FEEDS[number]): Promise<FeedItem[]> {
  try {
    const res = await fetch(feed.url, {
      headers: { "User-Agent": "NexoraOutreach/1.0 (signal-monitor; +https://nexoraoutreach.com)" },
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) {
      console.error(`[rss] fetch failed ${feed.url}: ${res.status}`);
      return [];
    }
    return parseFeed(await res.text(), feed.type);
  } catch (err) {
    console.error(`[rss] fetch error ${feed.url}:`, err);
    return [];
  }
}

export function detectSignalType(title: string): "funding" | "hiring" | null {
  const lower = title.toLowerCase();
  if (FUNDING_KEYWORDS.some((kw) => lower.includes(kw))) return "funding";
  if (HIRING_KEYWORDS.some((kw) => lower.includes(kw))) return "hiring";
  return null;
}

export function extractCompanyName(title: string): string {
  const patterns = [
    /^(.+?)\s+raises?\b/i,
    /^(.+?)\s+raised?\b/i,
    /^(.+?)\s+secures?\b/i,
    /^(.+?)\s+closes?\b/i,
    /^(.+?)\s+lands?\b/i,
    /^(.+?)\s+gets?\s+\$/i,
    /^(.+?)\s+is\s+hiring/i,
    /^(.+?)\s+expands?\s+team/i,
  ];
  for (const re of patterns) {
    const m = title.match(re);
    if (m?.[1]) return m[1].replace(/^['"]+|['"]+$/g, "").trim();
  }
  return title.split(/\s+/).slice(0, 3).join(" ");
}

export function matchesICP(
  item: FeedItem,
  icpKeywords: string,
  icpLocation: string
): boolean {
  const haystack = `${item.title} ${item.description}`.toLowerCase();

  const keywords = icpKeywords
    .split(",")
    .map((k) => k.trim().toLowerCase())
    .filter(Boolean);

  const location = icpLocation.trim().toLowerCase();

  const keywordMatch = keywords.length === 0 || keywords.some((kw) => haystack.includes(kw));
  const locationMatch = !location || haystack.includes(location);

  return keywordMatch && locationMatch;
}

export function isRecent(pubDate: string, hoursBack = 25): boolean {
  if (!pubDate) return true;
  const pub = new Date(pubDate);
  if (isNaN(pub.getTime())) return true;
  return Date.now() - pub.getTime() < hoursBack * 60 * 60 * 1000;
}
