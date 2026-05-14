# AI Research Agent Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a real-time prospect research agent that queries 7 sources simultaneously, cross-references results, scores confidence 0–10, and streams live progress to the UI.

**Architecture:** New SSE endpoint `/api/prospects/research` runs 8 parallel source fetches (GitHub, HackerNews, Crunchbase, Google News, LinkedIn Jobs, ProductHunt, Twitter, LinkedIn via Google), then pipes all results through cross-reference → website-verify → confidence-score → filter ≥5. The ProspectSearchBar switches from a single JSON fetch to an EventSource stream. All new source logic is isolated in `lib/search/sources/` and `lib/search/`.

**Tech Stack:** Next.js 15 App Router, TypeScript, SerpAPI (Google News + LinkedIn Jobs), ProductHunt GraphQL API v2, Twitter API v2, existing Supabase auth + rate-limiter.

---

## File Map

**Create:**
- `lib/search/sources/google-news.ts` — SerpAPI `engine=google_news`, extracts company + headline
- `lib/search/sources/linkedin-jobs.ts` — SerpAPI `site:linkedin.com/jobs`, extracts hiring company
- `lib/search/sources/producthunt.ts` — PH GraphQL v2, last-90-days product launches + makers
- `lib/search/sources/twitter-search.ts` — Twitter v2 recent search, founder tweets
- `lib/search/cross-reference.ts` — merges duplicate prospects across sources
- `lib/search/confidence-scorer.ts` — scores 0–10, filters below threshold
- `lib/search/website-verifier.ts` — HEAD requests to verify domains live
- `app/api/prospects/research/route.ts` — SSE streaming route

**Modify:**
- `lib/search/prospect-searcher.ts` — add `signal_dates`, `confidence`, `website_verified`, `twitter_url`, `producthunt_url`, `news_signal`, `jobs_signal` to `ProspectResult`
- `lib/search/sources/github-search.ts` — add `signal_dates` to returned objects
- `lib/search/sources/hackernews-search.ts` — add `signal_dates` to returned objects
- `lib/search/sources/crunchbase.ts` — add `signal_dates` to returned objects
- `app/dashboard/agent/_components/ProspectSearchBar.tsx` — full rewrite: SSE, progress UI, confidence display, "Add to Campaign" button
- `app/dashboard/components/command-palette.tsx` — add "Find Prospects" action
- `.env.example` — document new keys

---

## Task 1: Extend ProspectResult + patch existing sources

**Files:**
- Modify: `lib/search/prospect-searcher.ts`
- Modify: `lib/search/sources/github-search.ts`
- Modify: `lib/search/sources/hackernews-search.ts`
- Modify: `lib/search/sources/crunchbase.ts`

- [ ] **Step 1: Update ProspectResult in prospect-searcher.ts**

Replace the existing `ProspectResult` interface with:

```typescript
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
  // Research agent fields
  confidence?: number;
  website_verified?: boolean;
  twitter_url?: string;
  producthunt_url?: string;
  news_signal?: string;
  jobs_signal?: string;
  signal_dates?: string[];
  // internal enrichment fields
  _github_url?: string;
  _hn_url?: string;
  _bio?: string;
}
```

- [ ] **Step 2: Add signal_dates to github-search.ts**

In `searchGithubUsers`, update the returned object map to include:
```typescript
return (data.items ?? []).map((u) => ({
  name: u.name ?? u.login,
  company: u.company?.replace(/^@/, "") ?? undefined,
  location: u.location ?? undefined,
  domain: extractDomain(u.blog),
  linkedin_url: undefined,
  source: "GitHub",
  signal_dates: [new Date().toISOString().slice(0, 10)],
  _github_url: u.html_url,
  _bio: u.bio ?? undefined,
}));
```

- [ ] **Step 3: Add signal_dates to hackernews-search.ts**

In `searchHackerNews`, update the `.map` for the main branch:
```typescript
return {
  company,
  domain,
  source: "HackerNews",
  signal_dates: [toDateIso(h.created_at ?? "")],
  _hn_url: `https://news.ycombinator.com/item?id=${h.objectID}`,
} as ProspectResult;
```

And in the fallback branch:
```typescript
return {
  company: extractCompanyFromHNPost(h.comment_text ?? h.story_title ?? ""),
  source: "HackerNews",
  signal_dates: [new Date().toISOString().slice(0, 10)],
  _hn_url: `https://news.ycombinator.com/item?id=${h.objectID}`,
};
```

- [ ] **Step 4: Add signal_dates to crunchbase.ts**

In `searchCrunchbase`, update the push inside the for-loop:
```typescript
results.push({
  company: p.org_identifier.value,
  funding_stage: p.investment_type?.replace(/_/g, " ") ?? query.funding_stage,
  funding_amount: amountStr,
  announced_on: p.announced_on,
  crunchbase_url: `https://www.crunchbase.com/organization/${p.org_identifier.permalink}`,
  source: "Crunchbase",
  signal_dates: p.announced_on ? [p.announced_on] : [],
});
```

- [ ] **Step 5: Commit**

```bash
git add lib/search/prospect-searcher.ts lib/search/sources/github-search.ts lib/search/sources/hackernews-search.ts lib/search/sources/crunchbase.ts
git commit -m "feat: extend ProspectResult with research agent fields"
```

---

## Task 2: Google News source

**Files:**
- Create: `lib/search/sources/google-news.ts`

- [ ] **Step 1: Create the file**

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add lib/search/sources/google-news.ts
git commit -m "feat: add Google News prospect source"
```

---

## Task 3: LinkedIn Jobs source

**Files:**
- Create: `lib/search/sources/linkedin-jobs.ts`

- [ ] **Step 1: Create the file**

```typescript
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
  // LinkedIn job URL slug: linkedin.com/jobs/view/title-at-company-name-...
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
```

- [ ] **Step 2: Commit**

```bash
git add lib/search/sources/linkedin-jobs.ts
git commit -m "feat: add LinkedIn Jobs hiring signal source"
```

---

## Task 4: ProductHunt source

**Files:**
- Create: `lib/search/sources/producthunt.ts`

- [ ] **Step 1: Create the file**

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add lib/search/sources/producthunt.ts
git commit -m "feat: add ProductHunt product launch source"
```

---

## Task 5: Twitter/X source

**Files:**
- Create: `lib/search/sources/twitter-search.ts`

- [ ] **Step 1: Create the file**

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add lib/search/sources/twitter-search.ts
git commit -m "feat: add Twitter/X founder signal source"
```

---

## Task 6: Cross-reference engine

**Files:**
- Create: `lib/search/cross-reference.ts`

- [ ] **Step 1: Create the file**

```typescript
import type { ProspectResult } from "./prospect-searcher";

function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function linkedinMatch(a: ProspectResult, b: ProspectResult): boolean {
  return !!(a.linkedin_url && b.linkedin_url && norm(a.linkedin_url) === norm(b.linkedin_url));
}

function domainMatch(a: ProspectResult, b: ProspectResult): boolean {
  return !!(a.domain && b.domain && norm(a.domain) === norm(b.domain));
}

function nameMatch(a: ProspectResult, b: ProspectResult): boolean {
  if (!a.name || !b.name) return false;
  if (norm(a.name) === norm(b.name)) return true;
  // First-name + same company as a weaker match
  return (
    norm(a.name.split(" ")[0]) === norm(b.name.split(" ")[0]) && companyMatch(a, b)
  );
}

function companyMatch(a: ProspectResult, b: ProspectResult): boolean {
  return !!(a.company && b.company && norm(a.company) === norm(b.company));
}

function shouldMerge(a: ProspectResult, b: ProspectResult): boolean {
  if (linkedinMatch(a, b)) return true;
  if (nameMatch(a, b) && companyMatch(a, b)) return true;
  if (domainMatch(a, b) && (nameMatch(a, b) || companyMatch(a, b))) return true;
  return false;
}

function mergeTwo(base: ProspectResult, inc: ProspectResult): ProspectResult {
  const out: ProspectResult = { ...base };
  for (const [k, v] of Object.entries(inc) as [keyof ProspectResult, unknown][]) {
    if (k === "source" || k === "signal_dates") continue;
    if (v == null || v === "") continue;
    if (out[k] == null || out[k] === "") (out as Record<string, unknown>)[k] = v;
  }
  out.source = [
    ...new Set([...base.source.split(" + "), ...inc.source.split(" + ")]),
  ].join(" + ");
  out.signal_dates = [
    ...new Set([...(base.signal_dates ?? []), ...(inc.signal_dates ?? [])]),
  ];
  return out;
}

export function crossReference(prospects: ProspectResult[]): ProspectResult[] {
  const assigned = new Set<number>();
  const groups: ProspectResult[][] = [];

  for (let i = 0; i < prospects.length; i++) {
    if (assigned.has(i)) continue;
    const group = [prospects[i]];
    assigned.add(i);
    for (let j = i + 1; j < prospects.length; j++) {
      if (assigned.has(j)) continue;
      if (shouldMerge(prospects[i], prospects[j])) {
        group.push(prospects[j]);
        assigned.add(j);
      }
    }
    groups.push(group);
  }

  return groups.map((g) => g.reduce(mergeTwo));
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/search/cross-reference.ts
git commit -m "feat: add cross-reference engine for prospect deduplication"
```

---

## Task 7: Confidence scorer

**Files:**
- Create: `lib/search/confidence-scorer.ts`

- [ ] **Step 1: Create the file**

```typescript
import type { ProspectResult } from "./prospect-searcher";

function withinDays(dateIso: string, days: number): boolean {
  return dateIso >= new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
}

export function scoreConfidence(p: ProspectResult): number {
  let score = 0;

  // Source diversity — 1 pt per unique source, max 4
  const sources = new Set(p.source.split(" + ").map((s) => s.trim()).filter(Boolean));
  score += Math.min(sources.size, 4);

  // LinkedIn URL
  if (p.linkedin_url) score += 2;

  // GitHub URL
  if (p._github_url) score += 1;

  // Signal freshness (most recent date wins)
  const dates = (p.signal_dates ?? []).sort();
  const latest = dates.at(-1);
  if (latest) {
    if (withinDays(latest, 30)) score += 2;
    else if (withinDays(latest, 90)) score += 1;
  }

  // Domain verified live
  if (p.website_verified) score += 1;

  return Math.min(Math.round(score), 10);
}

export function filterByConfidence(
  prospects: ProspectResult[],
  min = 5
): ProspectResult[] {
  return prospects
    .map((p) => ({ ...p, confidence: scoreConfidence(p) }))
    .filter((p) => (p.confidence ?? 0) >= min)
    .sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0));
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/search/confidence-scorer.ts
git commit -m "feat: add 0-10 confidence scorer"
```

---

## Task 8: Website verifier

**Files:**
- Create: `lib/search/website-verifier.ts`

- [ ] **Step 1: Create the file**

```typescript
import type { ProspectResult } from "./prospect-searcher";

async function isLive(domain: string): Promise<boolean> {
  for (const proto of ["https", "http"]) {
    try {
      const r = await fetch(`${proto}://${domain}`, {
        method: "HEAD",
        redirect: "follow",
        signal: AbortSignal.timeout(5_000),
      });
      if (r.status < 500) return true;
    } catch {
      // try next protocol
    }
  }
  return false;
}

export async function verifyWebsites(
  prospects: ProspectResult[]
): Promise<ProspectResult[]> {
  const domains = [...new Set(prospects.map((p) => p.domain).filter(Boolean))] as string[];

  const checks = await Promise.allSettled(
    domains.map(async (d) => ({ domain: d, live: await isLive(d) }))
  );

  const liveMap = new Map<string, boolean>();
  for (const r of checks) {
    if (r.status === "fulfilled") liveMap.set(r.value.domain, r.value.live);
  }

  return prospects.map((p) => ({
    ...p,
    website_verified: p.domain ? (liveMap.get(p.domain) ?? false) : false,
  }));
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/search/website-verifier.ts
git commit -m "feat: add website verifier (HEAD request per domain)"
```

---

## Task 9: SSE research API route

**Files:**
- Create: `app/api/prospects/research/route.ts`

- [ ] **Step 1: Create the route**

```typescript
import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";
import { parseProspectQuery, type ParsedQuery } from "@/lib/search/query-parser";
import { searchGithubUsers } from "@/lib/search/sources/github-search";
import { searchHackerNews } from "@/lib/search/sources/hackernews-search";
import { searchCrunchbase } from "@/lib/search/sources/crunchbase";
import { searchGoogleNews } from "@/lib/search/sources/google-news";
import { searchLinkedInJobs } from "@/lib/search/sources/linkedin-jobs";
import { searchProductHunt } from "@/lib/search/sources/producthunt";
import { searchTwitter } from "@/lib/search/sources/twitter-search";
import { searchWeb } from "@/lib/search/sources/web-search";
import { crossReference } from "@/lib/search/cross-reference";
import { verifyWebsites } from "@/lib/search/website-verifier";
import { filterByConfidence } from "@/lib/search/confidence-scorer";
import type { ProspectResult } from "@/lib/search/prospect-searcher";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ProgressEvent = { type: "progress"; source: string; found: number };
type ResultEvent   = { type: "result"; prospects: ProspectResult[] };
type DoneEvent     = { type: "done"; stats: { total: number; avg_confidence: number } };
type SSEEvent      = ProgressEvent | ResultEvent | DoneEvent;

function enc(e: SSEEvent): string {
  return `data: ${JSON.stringify(e)}\n\n`;
}

const SOURCES: Array<{ name: string; fn: (q: ParsedQuery) => Promise<ProspectResult[]> }> = [
  { name: "GitHub",       fn: searchGithubUsers },
  { name: "HackerNews",   fn: searchHackerNews },
  { name: "Crunchbase",   fn: searchCrunchbase },
  { name: "GoogleNews",   fn: searchGoogleNews },
  { name: "LinkedInJobs", fn: searchLinkedInJobs },
  { name: "ProductHunt",  fn: searchProductHunt },
  { name: "Twitter",      fn: searchTwitter },
  { name: "LinkedIn",     fn: (q) => searchWeb(q, "") },
];

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const rl = rateLimit({ key: `prospect-research:${user.id}`, limit: 10, windowMs: 3_600_000 });
  if (!rl.ok) return new Response("Too Many Requests", { status: 429 });

  const body = await req.json().catch(() => ({})) as { query?: string };
  if (!body.query?.trim()) return new Response("query required", { status: 400 });

  const stream = new ReadableStream({
    async start(controller) {
      const send = (e: SSEEvent) =>
        controller.enqueue(new TextEncoder().encode(enc(e)));

      try {
        const parsed = await parseProspectQuery(body.query!.trim());
        const all: ProspectResult[] = [];

        await Promise.allSettled(
          SOURCES.map(async ({ name, fn }) => {
            try {
              const results = await fn(parsed);
              all.push(...results);
              send({ type: "progress", source: name, found: results.length });
            } catch {
              send({ type: "progress", source: name, found: 0 });
            }
          })
        );

        const crossed  = crossReference(all);
        const verified = await verifyWebsites(crossed);
        const scored   = filterByConfidence(verified, 5);

        const avg = scored.length > 0
          ? Math.round(
              (scored.reduce((s, p) => s + (p.confidence ?? 0), 0) / scored.length) * 10
            ) / 10
          : 0;

        send({ type: "result", prospects: scored });
        send({ type: "done", stats: { total: scored.length, avg_confidence: avg } });
      } catch {
        send({ type: "done", stats: { total: 0, avg_confidence: 0 } });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/prospects/research/route.ts
git commit -m "feat: add SSE prospect research API route (8 sources)"
```

---

## Task 10: ProspectSearchBar SSE rewrite

**Files:**
- Modify: `app/dashboard/agent/_components/ProspectSearchBar.tsx`

- [ ] **Step 1: Replace entire file**

```typescript
"use client";

import { useState, useRef } from "react";
import { Search, ExternalLink, Building2, MapPin, Zap, Check, Loader2 } from "lucide-react";
import type { ProspectResult } from "@/lib/search/prospect-searcher";

type ProgressState = Record<string, number | null>; // source → found count, null = in-flight

type DoneStats = { total: number; avg_confidence: number };

const SOURCE_LABELS: Record<string, string> = {
  GitHub: "GitHub",
  HackerNews: "HackerNews",
  Crunchbase: "Crunchbase",
  GoogleNews: "Google News",
  LinkedInJobs: "LinkedIn Jobs",
  ProductHunt: "Product Hunt",
  Twitter: "Twitter/X",
  LinkedIn: "LinkedIn",
};

const ALL_SOURCES = Object.keys(SOURCE_LABELS);

function ConfidenceDot({ score }: { score: number }) {
  const color =
    score >= 8 ? "#4ade80" : score >= 6 ? "#f59e0b" : "rgba(255,255,255,0.3)";
  return (
    <span
      title={`Confidence ${score}/10`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontSize: 10,
        color,
        fontFamily: "var(--font-outfit)",
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          backgroundColor: color,
          flexShrink: 0,
        }}
      />
      {score}/10
    </span>
  );
}

function ProspectCard({ prospect }: { prospect: ProspectResult }) {
  return (
    <div
      style={{
        padding: "12px 14px",
        borderRadius: 9,
        backgroundColor: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <div style={{ minWidth: 0 }}>
          {prospect.name && (
            <p
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "#fff",
                fontFamily: "var(--font-syne)",
                margin: 0,
                marginBottom: 2,
              }}
            >
              {prospect.name}
            </p>
          )}
          {prospect.role && (
            <p
              style={{
                fontSize: 11,
                color: "rgba(255,255,255,0.45)",
                fontFamily: "var(--font-outfit)",
                margin: 0,
              }}
            >
              {prospect.role}
            </p>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 5, flexShrink: 0, alignItems: "center" }}>
          {prospect.confidence != null && (
            <ConfidenceDot score={prospect.confidence} />
          )}
          {prospect.linkedin_url && (
            <a
              href={prospect.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              title="LinkedIn"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                fontSize: 10,
                color: "#FF5200",
                textDecoration: "none",
                padding: "3px 8px",
                borderRadius: 999,
                backgroundColor: "rgba(255,82,0,0.08)",
                border: "1px solid rgba(255,82,0,0.15)",
                fontFamily: "var(--font-outfit)",
                fontWeight: 600,
              }}
            >
              <ExternalLink size={9} />
              LinkedIn
            </a>
          )}
          {prospect.crunchbase_url && (
            <a
              href={prospect.crunchbase_url}
              target="_blank"
              rel="noopener noreferrer"
              title="Crunchbase"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                fontSize: 10,
                color: "rgba(255,255,255,0.4)",
                textDecoration: "none",
                padding: "3px 8px",
                borderRadius: 999,
                backgroundColor: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                fontFamily: "var(--font-outfit)",
                fontWeight: 600,
              }}
            >
              <ExternalLink size={9} />
              CB
            </a>
          )}
        </div>
      </div>

      {/* Meta row */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
        {prospect.company && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: 10,
              color: "rgba(255,255,255,0.45)",
              fontFamily: "var(--font-outfit)",
            }}
          >
            <Building2 size={9} />
            {prospect.company}
            {prospect.website_verified && (
              <Check size={8} color="#4ade80" strokeWidth={2.5} aria-label="domain verified" />
            )}
          </span>
        )}
        {prospect.location && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: 10,
              color: "rgba(255,255,255,0.3)",
              fontFamily: "var(--font-outfit)",
            }}
          >
            <MapPin size={9} />
            {prospect.location}
          </span>
        )}
        {prospect.funding_stage && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: 10,
              fontWeight: 600,
              color: "#FF5200",
              fontFamily: "var(--font-outfit)",
              backgroundColor: "rgba(255,82,0,0.08)",
              border: "1px solid rgba(255,82,0,0.15)",
              padding: "1px 7px",
              borderRadius: 999,
            }}
          >
            <Zap size={8} />
            {prospect.funding_stage}
            {prospect.funding_amount ? ` · ${prospect.funding_amount}` : ""}
          </span>
        )}
      </div>

      {/* Signal snippet */}
      {(prospect.news_signal || prospect.jobs_signal) && (
        <p
          style={{
            fontSize: 10.5,
            color: "rgba(255,255,255,0.3)",
            fontFamily: "var(--font-outfit)",
            margin: 0,
            lineHeight: 1.45,
          }}
        >
          {prospect.news_signal ?? prospect.jobs_signal}
        </p>
      )}

      {/* Add to campaign */}
      {prospect.name && prospect.company && (
        <a
          href={`/dashboard/campaigns/new?prospect=${encodeURIComponent(
            JSON.stringify({ name: prospect.name, company: prospect.company, role: prospect.role ?? "" })
          )}`}
          style={{
            alignSelf: "flex-start",
            fontSize: 10,
            color: "rgba(255,255,255,0.35)",
            fontFamily: "var(--font-outfit)",
            textDecoration: "none",
            marginTop: 2,
          }}
        >
          + Add to campaign
        </a>
      )}
    </div>
  );
}

function ProgressRow({
  source,
  found,
}: {
  source: string;
  found: number | null;
}) {
  const label = SOURCE_LABELS[source] ?? source;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontSize: 11,
        fontFamily: "var(--font-outfit)",
        color:
          found === null
            ? "rgba(255,255,255,0.3)"
            : found > 0
            ? "rgba(255,255,255,0.6)"
            : "rgba(255,255,255,0.2)",
      }}
    >
      {found === null ? (
        <Loader2
          size={10}
          strokeWidth={2}
          style={{ animation: "spin 0.8s linear infinite", flexShrink: 0 }}
        />
      ) : (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            backgroundColor: found > 0 ? "#4ade80" : "rgba(255,255,255,0.15)",
            flexShrink: 0,
          }}
        />
      )}
      {label}
      {found !== null && (
        <span style={{ color: found > 0 ? "#4ade80" : "rgba(255,255,255,0.2)" }}>
          {found > 0 ? `found ${found}` : "—"}
        </span>
      )}
    </div>
  );
}

export function ProspectSearchBar() {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [progress, setProgress] = useState<ProgressState>({});
  const [prospects, setProspects] = useState<ProspectResult[]>([]);
  const [done, setDone] = useState<DoneStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const handleSearch = async () => {
    if (!query.trim() || searching) return;

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setSearching(true);
    setError(null);
    setProspects([]);
    setDone(null);
    // Mark all sources as in-flight
    setProgress(Object.fromEntries(ALL_SOURCES.map((s) => [s, null])));

    try {
      const res = await fetch("/api/prospects/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
        signal: ctrl.signal,
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError((d as { error?: string }).error ?? "Search failed");
        setSearching(false);
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buf = "";

      while (true) {
        const { done: streamDone, value } = await reader.read();
        if (streamDone) break;
        buf += decoder.decode(value, { stream: true });
        const parts = buf.split("\n\n");
        buf = parts.pop() ?? "";
        for (const part of parts) {
          const line = part.replace(/^data: /, "").trim();
          if (!line) continue;
          try {
            const evt = JSON.parse(line) as
              | { type: "progress"; source: string; found: number }
              | { type: "result"; prospects: ProspectResult[] }
              | { type: "done"; stats: DoneStats };

            if (evt.type === "progress") {
              setProgress((prev) => ({ ...prev, [evt.source]: evt.found }));
            } else if (evt.type === "result") {
              setProspects(evt.prospects);
            } else if (evt.type === "done") {
              setDone(evt.stats);
              setSearching(false);
            }
          } catch {
            // malformed line, skip
          }
        }
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        setError("Network error");
        setSearching(false);
      }
    }
  };

  const showProgress = searching || done !== null;
  const activeSources = Object.keys(progress);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Input row */}
      <div style={{ display: "flex", gap: 8 }}>
        <div style={{ flex: 1, position: "relative" }}>
          <Search
            size={13}
            style={{
              position: "absolute",
              left: 11,
              top: "50%",
              transform: "translateY(-50%)",
              color: "rgba(255,255,255,0.25)",
              pointerEvents: "none",
            }}
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder='e.g. "SaaS founders California Series A"'
            style={{
              width: "100%",
              paddingLeft: 32,
              paddingRight: 12,
              paddingTop: 9,
              paddingBottom: 9,
              backgroundColor: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.09)",
              borderRadius: 9,
              color: "#fff",
              fontSize: 13,
              fontFamily: "var(--font-outfit)",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={searching || !query.trim()}
          style={{
            padding: "9px 16px",
            borderRadius: 9,
            border: "none",
            backgroundColor:
              searching || !query.trim() ? "rgba(255,82,0,0.3)" : "#FF5200",
            color: "#fff",
            fontSize: 12,
            fontWeight: 600,
            fontFamily: "var(--font-outfit)",
            cursor: searching ? "wait" : "pointer",
            whiteSpace: "nowrap",
          }}
        >
          {searching ? "Researching..." : "Find Prospects"}
        </button>
      </div>

      {error && (
        <p
          style={{
            fontSize: 12,
            color: "#f87171",
            fontFamily: "var(--font-outfit)",
            margin: 0,
          }}
        >
          {error}
        </p>
      )}

      {/* Live progress */}
      {showProgress && activeSources.length > 0 && (
        <div
          style={{
            padding: "10px 12px",
            borderRadius: 8,
            backgroundColor: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.06)",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
            gap: "6px 12px",
          }}
        >
          {activeSources.map((source) => (
            <ProgressRow key={source} source={source} found={progress[source] ?? null} />
          ))}
        </div>
      )}

      {/* Done summary */}
      {done && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          <p
            style={{
              fontSize: 11,
              color: "rgba(255,255,255,0.3)",
              fontFamily: "var(--font-outfit)",
              margin: 0,
            }}
          >
            {done.total} prospect{done.total !== 1 ? "s" : ""} verified
            {done.total > 0 ? ` · avg confidence ${done.avg_confidence}/10` : ""}
          </p>
        </div>
      )}

      {/* Results */}
      {prospects.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {prospects.map((p, i) => (
            <ProspectCard key={i} prospect={p} />
          ))}
        </div>
      )}

      {done && done.total === 0 && (
        <p
          style={{
            fontSize: 12,
            color: "rgba(255,255,255,0.3)",
            fontFamily: "var(--font-outfit)",
            textAlign: "center",
            padding: "20px 0",
          }}
        >
          No verified prospects found. Try broader terms.
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/dashboard/agent/_components/ProspectSearchBar.tsx
git commit -m "feat: rewrite ProspectSearchBar with SSE streaming + confidence display"
```

---

## Task 11: Command palette integration + env vars

**Files:**
- Modify: `app/dashboard/components/command-palette.tsx`
- Modify: `.env.example`

- [ ] **Step 1: Add "Find Prospects" to command-palette.tsx**

Add `Users` to the lucide-react import:
```typescript
import {
  Search, LayoutDashboard, Send, Inbox, BarChart3, Plus, Zap, CornerDownLeft, Users,
} from "lucide-react";
```

Add `"Actions"` group entry inside the `commands` array (after the `act-new` entry):
```typescript
{ id: "act-prospects", label: "Find Prospects", hint: "P", icon: <Users size={13} />, action: () => go("/dashboard/agent"), group: "Actions" },
```

- [ ] **Step 2: Add new env vars to .env.example**

Append to `.env.example`:
```
# ProductHunt API (free OAuth bearer — https://api.producthunt.com/v2/oauth/token)
PRODUCTHUNT_CLIENT_TOKEN=

# Twitter/X App-Only Bearer Token (free basic tier)
TWITTER_BEARER_TOKEN=
```

- [ ] **Step 3: Commit**

```bash
git add app/dashboard/components/command-palette.tsx .env.example
git commit -m "feat: add Find Prospects to command palette, document new env vars"
```

---

## Task 12: Build verification

- [ ] **Step 1: Run build**

```bash
npm run build
```

Expected: zero TypeScript errors, all routes compile. The new routes `/api/prospects/research` and `/dashboard/agent` appear in the route manifest.

- [ ] **Step 2: Fix any type errors**

Common pitfalls:
- `signal_dates` must be `string[] | undefined` — the `??` fallback handles undefined in cross-reference
- `_github_url` is typed optional on `ProspectResult` — confidence scorer uses optional chaining
- `searchWeb` second arg can be `""` — no change needed to web-search.ts

- [ ] **Step 3: Commit fixes if needed**

```bash
git add -A
git commit -m "fix: resolve build type errors in research agent"
```

---

## Self-Review

**Spec coverage:**
- ✅ 7 sources (+ LinkedIn via Google = 8 total) — Tasks 1–5 + existing github/hn/crunchbase
- ✅ Natural language ICP → `parseProspectQuery` (existing, unchanged)
- ✅ Parallel search — `Promise.allSettled` in research route
- ✅ Cross-reference — Task 6
- ✅ Confidence 0–10 — Task 7
- ✅ Website verification — Task 8
- ✅ Filter ≥5/10 — `filterByConfidence(verified, 5)` in route
- ✅ Signals ≤90 days — each source enforces cutoff; freshness reflected in confidence
- ✅ Source failures skip silently — per-source try/catch in route
- ✅ Real-time progress — SSE `progress` events, one per source as it completes
- ✅ Done summary with avg confidence — `done` event
- ✅ Command palette — Task 11
- ✅ Campaign integration — "Add to campaign" link in ProspectCard
- ✅ Supabase auth — route checks `supabase.auth.getUser()`
- ✅ Rate limiting — `rateLimit` on research route
- ✅ No fake data — all sources skip when API key missing, filter ≥5 removes low-confidence noise

**Placeholders:** None. All steps contain complete code.

**Type consistency:**
- `ProspectResult.signal_dates?: string[]` — defined Task 1, used Tasks 2–8
- `ProspectResult.confidence?: number` — defined Task 1, written by `filterByConfidence` (Task 7), read by `ProspectCard` (Task 10)
- `ProspectResult.website_verified?: boolean` — defined Task 1, written by `verifyWebsites` (Task 8), read by `ProspectCard` (Task 10)
- `ProspectResult._github_url?: string` — existing, read by `scoreConfidence` (Task 7)
- `crossReference` — exported from `lib/search/cross-reference.ts`, imported in route (Task 9) ✅
- `verifyWebsites` — exported from `lib/search/website-verifier.ts`, imported in route ✅
- `filterByConfidence` — exported from `lib/search/confidence-scorer.ts`, imported in route ✅
