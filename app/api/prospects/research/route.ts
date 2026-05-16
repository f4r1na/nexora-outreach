import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";
import { parseProspectQuery, type ParsedQuery } from "@/lib/search/query-parser";
import { searchGithubUsers } from "@/lib/search/sources/github-search";
import { searchHackerNews } from "@/lib/search/sources/hackernews-search";
import { searchCrunchbase } from "@/lib/search/sources/crunchbase";
import { searchGoogleNews } from "@/lib/search/sources/google-news";
import { searchLinkedInJobs } from "@/lib/search/sources/linkedin-jobs";
import { searchProductHunt } from "@/lib/search/sources/producthunt";
import { searchTwitter } from "@/lib/search/sources/twitter-search";
import { searchWeb } from "@/lib/search/sources/web-search";
import { crossReference } from "@/lib/search/cross-reference";
import { verifyWebsites } from "@/lib/search/website-verifier";
import { filterByConfidence } from "@/lib/search/confidence-scorer";
import type { ProspectResult } from "@/lib/search/prospect-searcher";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ProgressEvent = { type: "progress"; source: string; found: number };
type ResultEvent   = { type: "result"; prospects: ProspectResult[] };
type DoneEvent     = { type: "done"; stats: { total: number; avg_confidence: number } };
type SSEEvent      = ProgressEvent | ResultEvent | DoneEvent;

function enc(e: SSEEvent): string {
  return `data: ${JSON.stringify(e)}\n\n`;
}

const SOURCES: Array<{ name: string; fn: (q: ParsedQuery) => Promise<ProspectResult[]> }> = [
  { name: "GitHub",       fn: searchGithubUsers },
  { name: "HackerNews",   fn: searchHackerNews },
  { name: "Crunchbase",   fn: searchCrunchbase },
  { name: "GoogleNews",   fn: searchGoogleNews },
  { name: "LinkedInJobs", fn: searchLinkedInJobs },
  { name: "ProductHunt",  fn: searchProductHunt },
  { name: "Twitter",      fn: searchTwitter },
  { name: "LinkedIn",     fn: (q) => searchWeb(q, "") },
];

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const rl = rateLimit({ key: `prospect-research:${user.id}`, limit: 10, windowMs: 3_600_000 });
  if (!rl.ok) return new Response("Too Many Requests", { status: 429 });

  const body = await req.json().catch(() => ({})) as { query?: string };
  if (!body.query?.trim()) return new Response("query required", { status: 400 });

  const stream = new ReadableStream({
    async start(controller) {
      const send = (e: SSEEvent) =>
        controller.enqueue(new TextEncoder().encode(enc(e)));

      try {
        const parsed = await parseProspectQuery(body.query!.trim());
        const all: ProspectResult[] = [];

        await Promise.allSettled(
          SOURCES.map(async ({ name, fn }) => {
            try {
              const results = await fn(parsed);
              all.push(...results);
              send({ type: "progress", source: name, found: results.length });
            } catch {
              send({ type: "progress", source: name, found: 0 });
            }
          })
        );

        const crossed  = crossReference(all);
        const verified = await verifyWebsites(crossed);
        const scored   = filterByConfidence(verified, 3);

        const avg = scored.length > 0
          ? Math.round(
              (scored.reduce((s, p) => s + (p.confidence ?? 0), 0) / scored.length) * 10
            ) / 10
          : 0;

        send({ type: "result", prospects: scored });
        send({ type: "done", stats: { total: scored.length, avg_confidence: avg } });
      } catch {
        send({ type: "done", stats: { total: 0, avg_confidence: 0 } });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
