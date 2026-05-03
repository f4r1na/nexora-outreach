import Anthropic from "@anthropic-ai/sdk";

export interface ParsedQuery {
  role?: string;         // "founder", "CTO", "VP Sales"
  industry?: string;     // "SaaS", "fintech", "B2B"
  location?: string;     // "California", "New York"
  funding_stage?: string; // "Series A", "Series B", "seed"
  keywords: string[];    // extra terms to include in searches
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

export async function parseProspectQuery(query: string): Promise<ParsedQuery> {
  try {
    const msg = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 256,
      system: `Extract search parameters from a prospect search query. Return ONLY valid JSON with these optional keys: role (string), industry (string), location (string), funding_stage (string — one of: seed, series_a, series_b, series_c, growth, ipo), keywords (string[]). No markdown, no code fences.`,
      messages: [{ role: "user", content: query }],
    });

    const raw = msg.content[0].type === "text" ? msg.content[0].text.trim() : "{}";
    const parsed = JSON.parse(raw);
    return {
      role: parsed.role,
      industry: parsed.industry,
      location: parsed.location,
      funding_stage: parsed.funding_stage,
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
    };
  } catch {
    // Fall back to treating the whole query as keywords
    return { keywords: query.split(/\s+/).filter(Boolean) };
  }
}
