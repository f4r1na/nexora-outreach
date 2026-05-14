import type { ProspectResult } from "./prospect-searcher";

function withinDays(dateIso: string, days: number): boolean {
  return dateIso >= new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
}

export function scoreConfidence(p: ProspectResult): number {
  let score = 0;

  const sources = new Set(p.source.split(" + ").map((s) => s.trim()).filter(Boolean));
  score += Math.min(sources.size, 4);

  if (p.linkedin_url) score += 2;
  if (p._github_url) score += 1;

  const dates = (p.signal_dates ?? []).sort();
  const latest = dates.at(-1);
  if (latest) {
    if (withinDays(latest, 30)) score += 2;
    else if (withinDays(latest, 90)) score += 1;
  }

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
