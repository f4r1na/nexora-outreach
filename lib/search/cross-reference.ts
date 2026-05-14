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

function companyMatch(a: ProspectResult, b: ProspectResult): boolean {
  return !!(a.company && b.company && norm(a.company) === norm(b.company));
}

function nameMatch(a: ProspectResult, b: ProspectResult): boolean {
  if (!a.name || !b.name) return false;
  if (norm(a.name) === norm(b.name)) return true;
  return (
    norm(a.name.split(" ")[0]) === norm(b.name.split(" ")[0]) && companyMatch(a, b)
  );
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
    if (out[k] == null || out[k] === "") (out as unknown as Record<string, unknown>)[k] = v;
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
