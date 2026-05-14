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

function nameAppearsInText(name: string, text: string): boolean {
  const first = name.split(" ")[0].toLowerCase();
  return text.toLowerCase().includes(first);
}

function companyAppearsInText(company: string, text: string): boolean {
  // Match first word of company name to avoid false negatives on suffixes like "Inc", "LLC"
  const firstWord = company.split(/\s+/)[0].toLowerCase();
  return text.toLowerCase().includes(firstWord);
}

export interface LinkedInVerifyResult {
  verified: boolean;
  linkedin_url?: string;
}

export async function verifyOnLinkedIn(
  name: string,
  company: string
): Promise<LinkedInVerifyResult> {
  const key = process.env.SERPAPI_KEY;
  if (!key) return { verified: false };

  const q = encodeURIComponent(`"${name}" "${company}" site:linkedin.com/in`);
  const url = `https://serpapi.com/search.json?engine=google&q=${q}&num=3&api_key=${key}`;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (res.status === 429) return { verified: false };
    if (!res.ok) return { verified: false };

    const data = (await res.json()) as SerpResponse;
    if (data.error) return { verified: false };

    for (const r of data.organic_results ?? []) {
      const link = r.link ?? "";
      if (!link.includes("linkedin.com/in/")) continue;
      const text = `${r.title ?? ""} ${r.snippet ?? ""}`;
      if (nameAppearsInText(name, text) && companyAppearsInText(company, text)) {
        return { verified: true, linkedin_url: link };
      }
    }

    return { verified: false };
  } catch {
    return { verified: false };
  }
}

// Mark prospects that already have a linkedin_url as verified (free — no API call).
// For GitHub/HackerNews prospects with name+company but no linkedin_url, call verifyOnLinkedIn.
// Caps at MAX_VERIFY calls per search to limit SerpAPI usage.
const MAX_VERIFY = 5;

export async function enrichWithLinkedIn(
  prospects: ProspectResult[]
): Promise<ProspectResult[]> {
  const result: ProspectResult[] = prospects.map((p) =>
    p.linkedin_url ? { ...p, linkedin_verified: true } : p
  );

  let budget = MAX_VERIFY;
  const pending = result.filter(
    (p) =>
      !p.linkedin_url &&
      p.name &&
      p.company &&
      (p.source.includes("GitHub") || p.source.includes("HackerNews"))
  );

  await Promise.all(
    pending.slice(0, budget).map(async (p) => {
      budget--;
      const check = await verifyOnLinkedIn(p.name!, p.company!);
      const idx = result.indexOf(p);
      if (idx !== -1) {
        result[idx] = {
          ...p,
          linkedin_verified: check.verified,
          ...(check.linkedin_url ? { linkedin_url: check.linkedin_url } : {}),
        };
      }
    })
  );

  return result;
}
