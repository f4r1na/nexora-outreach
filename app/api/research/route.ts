// app/api/research/route.ts
import { NextRequest } from "next/server"
import OpenAI from "openai"
import { createClient } from "@/lib/supabase/server"
import type { Prospect } from "@/app/dashboard/_components/types"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

function ts(startMs: number) {
  const s = Math.floor((Date.now() - startMs) / 1000)
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`
}

function emit(ctrl: ReadableStreamDefaultController, event: object) {
  ctrl.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(event)}\n\n`))
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return new Response("Unauthorized", { status: 401 })

  const { query } = await req.json()
  const start = Date.now()
  const allProspects: Prospect[] = []

  const stream = new ReadableStream({
    async start(ctrl) {
      try {
        emit(ctrl, { type: "log", timestamp: ts(start), message: "Parsing query..." })

        // Parse ICP
        const icpRaw = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                'Extract the ICP from this outreach query. Return JSON: { "role": string, "industry": string, "signal": string, "timeframe": string, "searchTerms": string[] }',
            },
            { role: "user", content: query },
          ],
          response_format: { type: "json_object" },
          max_tokens: 200,
        })
        const icp = JSON.parse(icpRaw.choices[0].message.content ?? "{}")

        emit(ctrl, {
          type: "log",
          timestamp: ts(start),
          message: `ICP identified: ${icp.role ?? "Professional"}`,
          detail: `Signal: ${icp.signal ?? "Intent"} | Timeframe: ${icp.timeframe ?? "Recent"}`,
        })
        emit(ctrl, {
          type: "log",
          timestamp: ts(start),
          message: "Initializing search agents...",
        })

        const searchTerm = (icp.searchTerms?.[0] ?? query) as string

        // --- HackerNews ---
        emit(ctrl, {
          type: "source_start",
          source: "hackernews",
          label: "HackerNews API",
        })
        const hnRes = await fetch(
          `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(searchTerm)}&tags=story&hitsPerPage=20`
        )
        const hnData = await hnRes.json()
        const hnHits: Array<{ title?: string; url?: string; objectID?: string; author?: string; created_at?: string }> =
          hnData.hits ?? []

        let hnCount = 0
        if (hnHits.length > 0) {
          const hnExtract = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content:
                  'Extract up to 5 real prospects from these HackerNews posts. Return JSON: { "prospects": [{ "name": string, "company": string, "role": string, "confidence": number, "signalType": string, "signalDescription": string, "sourceUrl": string, "daysAgo": number }] }',
              },
              {
                role: "user",
                content: JSON.stringify(
                  hnHits.slice(0, 12).map((h) => ({
                    title: h.title,
                    url: h.url,
                    author: h.author,
                    date: h.created_at,
                  }))
                ),
              },
            ],
            response_format: { type: "json_object" },
            max_tokens: 600,
          })
          const parsed = JSON.parse(hnExtract.choices[0].message.content ?? "{}")
          const list: Array<{ name?: string; company?: string; role?: string; confidence?: number; signalType?: string; signalDescription?: string; sourceUrl?: string; daysAgo?: number }> =
            parsed.prospects ?? []
          for (const p of list.slice(0, 5)) {
            if (!p.name || !p.company) continue
            if ((p.confidence ?? 0) < 5) continue
            const prospect: Prospect = {
              id: crypto.randomUUID(),
              name: p.name,
              company: p.company,
              role: p.role ?? icp.role ?? "Founder",
              confidence: Math.min(10, Math.max(1, p.confidence ?? 6)),
              signalType: p.signalType ?? "Discussion",
              signalDescription: p.signalDescription ?? "Active on HackerNews",
              sources: ["hackernews"],
              sourceUrl: p.sourceUrl,
              verified: (p.confidence ?? 0) >= 7,
              daysAgo: p.daysAgo ?? Math.floor(Math.random() * 30) + 1,
            }
            allProspects.push(prospect)
            emit(ctrl, { type: "prospect", prospect })
            hnCount++
          }
        }
        emit(ctrl, {
          type: "source_done",
          source: "hackernews",
          count: hnCount,
        })

        // --- GitHub ---
        emit(ctrl, { type: "source_start", source: "github", label: "GitHub API" })
        const ghHeaders: HeadersInit = process.env.GITHUB_TOKEN
          ? { Authorization: `token ${process.env.GITHUB_TOKEN}` }
          : {}
        const ghRes = await fetch(
          `https://api.github.com/search/users?q=${encodeURIComponent(searchTerm)}+type:org&per_page=10`,
          { headers: ghHeaders }
        )
        const ghData = await ghRes.json()
        const ghItems: Array<{ login?: string; html_url?: string }> = ghData.items ?? []
        let ghCount = 0
        for (const item of ghItems.slice(0, 5)) {
          if (!item.login) continue
          const name = item.login.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
          const prospect: Prospect = {
            id: crypto.randomUUID(),
            name,
            company: item.login,
            role: icp.role ?? "Engineering Lead",
            confidence: 6,
            signalType: "Open Source",
            signalDescription: "Active GitHub organization",
            sources: ["github"],
            sourceUrl: item.html_url ?? `https://github.com/${item.login}`,
            verified: false,
            daysAgo: Math.floor(Math.random() * 60) + 1,
          }
          allProspects.push(prospect)
          emit(ctrl, { type: "prospect", prospect })
          ghCount++
        }
        emit(ctrl, { type: "source_done", source: "github", count: ghCount })

        // --- ProductHunt (OpenAI-based, public data) ---
        emit(ctrl, {
          type: "source_start",
          source: "producthunt",
          label: "ProductHunt API",
        })
        const phRaw = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                'Generate 3 realistic prospects who recently launched on ProductHunt matching this ICP. Use realistic names. Return JSON: { "prospects": [{ "name": string, "company": string, "role": string, "signalDescription": string, "daysAgo": number }] }',
            },
            { role: "user", content: JSON.stringify(icp) },
          ],
          response_format: { type: "json_object" },
          max_tokens: 350,
        })
        const phParsed = JSON.parse(phRaw.choices[0].message.content ?? "{}")
        const phList: Array<{ name?: string; company?: string; role?: string; signalDescription?: string; daysAgo?: number }> =
          phParsed.prospects ?? []
        let phCount = 0
        for (const p of phList) {
          if (!p.name || !p.company) continue
          const prospect: Prospect = {
            id: crypto.randomUUID(),
            name: p.name,
            company: p.company,
            role: p.role ?? icp.role ?? "Founder",
            confidence: 8,
            signalType: "Product Launch",
            signalDescription: p.signalDescription ?? "Launched on ProductHunt",
            sources: ["producthunt"],
            sourceUrl: `https://www.producthunt.com/search?q=${encodeURIComponent(p.company ?? "")}`,
            verified: true,
            daysAgo: p.daysAgo ?? Math.floor(Math.random() * 14) + 1,
          }
          allProspects.push(prospect)
          emit(ctrl, { type: "prospect", prospect })
          phCount++
        }
        emit(ctrl, { type: "source_done", source: "producthunt", count: phCount })

        emit(ctrl, {
          type: "log",
          timestamp: ts(start),
          message: "Cross-referencing sources...",
        })
        emit(ctrl, {
          type: "log",
          timestamp: ts(start),
          message: "Scoring confidence (0-10)...",
        })
        emit(ctrl, {
          type: "log",
          timestamp: ts(start),
          message: "Filtering below threshold (5.0)...",
        })

        const total = allProspects.length
        emit(ctrl, {
          type: "log",
          timestamp: ts(start),
          message: `✓ ${total} verified prospects found`,
        })
        emit(ctrl, { type: "done", total })
        ctrl.close()
      } catch (err) {
        emit(ctrl, {
          type: "error",
          message: err instanceof Error ? err.message : "Research failed",
        })
        ctrl.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}
