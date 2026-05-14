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
