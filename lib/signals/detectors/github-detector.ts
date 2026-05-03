export interface DetectedSignal {
  source: string;
  source_url: string | null;
  text: string;
  date_iso: string;
  strength: "high" | "medium" | "low";
  type: string;
}

interface GithubRepo {
  full_name: string;
  html_url: string;
  pushed_at: string;
  description: string | null;
}

export async function detectGithubActivity(company: string): Promise<DetectedSignal[]> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "NexoraOutreach/1.0",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  const token = process.env.GITHUB_TOKEN;
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  try {
    const q = encodeURIComponent(`${company} in:name`);
    const res = await fetch(
      `https://api.github.com/search/repositories?q=${q}&sort=updated&order=desc&per_page=5`,
      { headers, signal: AbortSignal.timeout(10_000) }
    );
    if (!res.ok) return [];

    const data = (await res.json()) as { items?: GithubRepo[] };
    return (data.items ?? [])
      .filter((repo) => repo.pushed_at.slice(0, 10) >= cutoff)
      .map((repo) => ({
        source: "GitHub",
        source_url: repo.html_url,
        text: `${repo.full_name} had recent GitHub activity`,
        date_iso: repo.pushed_at.slice(0, 10),
        strength: "medium" as const,
        type: "github_activity",
      }));
  } catch {
    return [];
  }
}
