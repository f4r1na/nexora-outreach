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
}

const FIRST_NAMES = ["James", "Sarah", "Marcus", "Priya", "Tom", "Elena", "David", "Mia", "Lucas", "Aisha", "Ryan", "Zoe", "Kevin", "Nina", "Alex"]
const LAST_NAMES = ["Chen", "Kim", "Lee", "Patel", "Rodriguez", "Johnson", "Williams", "Brown", "Garcia", "Martinez", "Anderson", "Taylor", "Thomas", "Jackson", "White"]
const ROLES_SAAS = ["Founder & CEO", "Co-Founder", "CTO", "VP of Growth", "Head of Product"]
const ROLES_MARKETING = ["VP Marketing", "CMO", "Head of Growth", "Marketing Director", "Demand Gen Lead"]
const ROLES_GENERIC = ["CEO", "Founder", "Director", "VP Operations", "Head of Sales"]

const SIGNAL_DETAILS: Record<SignalType, string[]> = {
  FUNDING: ["Raised $4.2M Seed round", "Closed $12M Series A", "Secured $2.8M pre-seed", "Raised $7M from a16z", "Closed $18M Series B"],
  HIRING: ["Hiring 5 engineers", "Posted 12 jobs this month", "Expanding sales team", "Hiring SDRs and AEs", "Growing ops team"],
  LAUNCH: ["Launched v2.0 on ProductHunt", "New product line announced", "Beta launch on HN", "Public launch this week", "Major feature release"],
  GROWTH: ["3x revenue last quarter", "Expanding to EU market", "500 new customers this month", "Featured in TechCrunch", "Crossed 10K users"],
}

function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function inferRoles(query: string): string[] {
  const q = query.toLowerCase()
  if (q.includes("saas") || q.includes("founder")) return ROLES_SAAS
  if (q.includes("marketing") || q.includes("agency")) return ROLES_MARKETING
  return ROLES_GENERIC
}

function inferSignals(query: string): SignalType[] {
  const q = query.toLowerCase()
  const signals: SignalType[] = []
  if (q.includes("series") || q.includes("raised") || q.includes("seed") || q.includes("fund")) signals.push("FUNDING")
  if (q.includes("hir") || q.includes("recruit")) signals.push("HIRING")
  if (q.includes("launch") || q.includes("product")) signals.push("LAUNCH")
  if (!signals.length) signals.push("FUNDING", "HIRING", "GROWTH")
  return signals
}

const COMPANIES_SAAS = ["Luma", "Slope", "Brex", "Anrok", "Merge", "Drata", "Vanta", "Rippling", "Finch", "Vessel", "Workato", "Pendo", "Amplitude", "Heap", "Mixpanel"]
const COMPANIES_GENERIC = ["Acme Corp", "NovaTech", "Meridian", "Apex Labs", "Stratum", "Velox", "Cirrus", "Axon", "Prism", "Orbit", "Vector", "Nexus", "Pillar", "Forge", "Atlas"]

export function generateProspects(query: string, count = 15): Prospect[] {
  const roles = inferRoles(query)
  const signals = inferSignals(query)
  const q = query.toLowerCase()
  const companies = q.includes("saas") || q.includes("startup") ? COMPANIES_SAAS : COMPANIES_GENERIC
  const seen = new Set<string>()
  const prospects: Prospect[] = []

  for (let i = 0; i < count; i++) {
    let company: string
    do { company = rand(companies) } while (seen.has(company))
    seen.add(company)

    const confidence = Math.round((5 + Math.random() * 5) * 10) / 10
    prospects.push({
      id: `prospect-${i}`,
      name: `${rand(FIRST_NAMES)} ${rand(LAST_NAMES)}`,
      company,
      role: rand(roles),
      confidence,
      signal: rand(signals),
      signalDetail: rand(SIGNAL_DETAILS[rand(signals)]),
      daysAgo: Math.floor(Math.random() * 14) + 1,
    })
  }

  return prospects.sort((a, b) => b.confidence - a.confidence)
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
