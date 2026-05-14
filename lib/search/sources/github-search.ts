import type { ParsedQuery } from "../query-parser";
import type { ProspectResult } from "../prospect-searcher";

interface GithubUser {
  login: string;
  html_url: string;
  name: string | null;
  company: string | null;
  location: string | null;
  bio: string | null;
  blog: string | null;
}

interface GithubUserSearchResponse {
  items?: GithubUser[];
}

function buildUserQuery(query: ParsedQuery): string {
  const parts: string[] = [];

  if (query.role) parts.push(query.role);
  if (query.industry) parts.push(query.industry);
  if (query.location) parts.push(`location:"${query.location}"`);
  // Require some repos so we get active users, not spam accounts
  parts.push("repos:>2");

  return parts.join(" ") || "founder repos:>5";
}

function extractDomain(blog: string | null): string | undefined {
  if (!blog) return undefined;
  const raw = blog.startsWith("http") ? blog : `https://${blog}`;
  try {
    return new URL(raw).hostname.replace(/^www\./, "");
  } catch {
    return undefined;
  }
}

export async function searchGithubUsers(query: ParsedQuery): Promise<ProspectResult[]> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "NexoraOutreach/1.0",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  const token = process.env.GITHUB_TOKEN;
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const q = encodeURIComponent(buildUserQuery(query));
  try {
    const res = await fetch(
      `https://api.github.com/search/users?q=${q}&sort=followers&per_page=10`,
      { headers, signal: AbortSignal.timeout(10_000) }
    );
    if (!res.ok) return [];

    const data = (await res.json()) as GithubUserSearchResponse;

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
  } catch {
    return [];
  }
}
