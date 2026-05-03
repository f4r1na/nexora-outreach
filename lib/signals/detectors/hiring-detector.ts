import { FEEDS, fetchFeed, detectSignalType } from "@/lib/signals/rss";
import type { DetectedSignal } from "./github-detector";

function toDateIso(pubDate: string): string {
  if (!pubDate) return new Date().toISOString().slice(0, 10);
  const d = new Date(pubDate);
  return isNaN(d.getTime())
    ? new Date().toISOString().slice(0, 10)
    : d.toISOString().slice(0, 10);
}

function mentionsCompany(text: string, company: string): boolean {
  const escaped = company.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b${escaped}\\b`, "i").test(text);
}

export async function detectHiringSignals(company: string): Promise<DetectedSignal[]> {
  try {
    const allItems = (await Promise.all(FEEDS.map(fetchFeed))).flat();
    return allItems
      .filter((item) => {
        if (detectSignalType(item.title) !== "hiring") return false;
        return mentionsCompany(`${item.title} ${item.description}`, company);
      })
      .map((item) => ({
        source: "hiring",
        source_url: item.link,
        text: item.title,
        date_iso: toDateIso(item.pubDate),
        strength: "high" as const,
        type: "hiring",
      }));
  } catch {
    return [];
  }
}
