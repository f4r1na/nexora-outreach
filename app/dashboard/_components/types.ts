// app/dashboard/_components/types.ts

export type CommandState =
  | "idle"
  | "thinking"
  | "researching"
  | "results"
  | "email_preview"
  | "sending"
  | "done"

export type Prospect = {
  id: string
  name: string
  company: string
  role: string
  confidence: number // 0–10
  signalType: string
  signalDescription: string
  sources: string[] // "github" | "hackernews" | "producthunt" | "news" | "linkedin"
  sourceUrl?: string
  verified: boolean
  daysAgo: number
}

export type AgentLogLine = {
  timestamp: string // "MM:SS"
  message: string
  detail?: string
}

export type GeneratedEmail = {
  subject: string
  body: string
}
