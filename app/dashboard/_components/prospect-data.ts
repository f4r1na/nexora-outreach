import type { ProspectResult } from "@/lib/search/prospect-searcher"

export type SignalType = "FUNDING" | "HIRING" | "LAUNCH" | "GROWTH"

export interface Prospect {
  id: string
  name: string
  company: string
  role: string
  confidence: number
  signal: SignalType
  signalDetail: string
  daysAgo: number
  // real-data fields
  sources: string[]
  sourceUrls: Record<string, string>
  verified: boolean
  domain?: string
}

export const SIGNAL_COLORS: Record<SignalType, string> = {
  FUNDING: "#f97316",
  HIRING: "#3b82f6",
  LAUNCH: "#22c55e",
  GROWTH: "#a855f7",
}

export function avgConfidence(prospects: Prospect[]): number {
  if (!prospects.length) return 0
  return Math.round((prospects.reduce((s, p) => s + p.confidence, 0) / prospects.length) * 10) / 10
}

export function signalCounts(prospects: Prospect[]): Record<SignalType, number> {
  const counts: Record<SignalType, number> = { FUNDING: 0, HIRING: 0, LAUNCH: 0, GROWTH: 0 }
  for (const p of prospects) counts[p.signal]++
  return counts
}

function inferSignal(p: ProspectResult): SignalType {
  const src = p.source
  if (src.includes("Crunchbase")) return "FUNDING"
  if (src.includes("ProductHunt")) return "LAUNCH"
  if (src.includes("HackerNews") || src.includes("LinkedInJobs")) return "HIRING"
  return "GROWTH"
}

function inferSignalDetail(p: ProspectResult): string {
  if (p.funding_amount) return `Raised ${p.funding_amount}${p.funding_stage ? ` (${p.funding_stage})` : ""}`
  if (p.news_signal) return p.news_signal.slice(0, 80)
  if (p.jobs_signal) return p.jobs_signal.slice(0, 80)
  return `Found on ${p.source}`
}

function daysAgoFrom(p: ProspectResult): number {
  const dates = [...(p.signal_dates ?? []), p.announced_on].filter(Boolean) as string[]
  const latest = dates.sort().at(-1)
  if (!latest) return 0
  return Math.max(0, Math.floor((Date.now() - new Date(latest).getTime()) / 86_400_000))
}

export function toDisplayProspect(p: ProspectResult, index: number): Prospect {
  const sources = p.source.split(" + ").map((s) => s.trim()).filter(Boolean)
  const sourceUrls: Record<string, string> = {}
  if (p._github_url) sourceUrls["GitHub"] = p._github_url
  if (p._hn_url) sourceUrls["HackerNews"] = p._hn_url
  if (p.producthunt_url) sourceUrls["ProductHunt"] = p.producthunt_url
  if (p.crunchbase_url) sourceUrls["Crunchbase"] = p.crunchbase_url
  if (p.linkedin_url) sourceUrls["LinkedIn"] = p.linkedin_url
  if (p.twitter_url) sourceUrls["Twitter"] = p.twitter_url

  return {
    id: `p-${index}`,
    name: p.name ?? p.company ?? "Unknown",
    company: p.company ?? p.domain ?? "",
    role: p.role ?? "",
    confidence: p.confidence ?? 0,
    signal: inferSignal(p),
    signalDetail: inferSignalDetail(p),
    daysAgo: daysAgoFrom(p),
    sources,
    sourceUrls,
    verified: sources.length >= 2 || (p.website_verified ?? false),
    domain: p.domain,
  }
}
