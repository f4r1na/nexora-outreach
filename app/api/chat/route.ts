import { createClient } from "@/lib/supabase/server";
import { createAnthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

const _rl = new Map<string, { n: number; reset: number }>();
function isRateLimited(uid: string): boolean {
  const now = Date.now();
  const e = _rl.get(uid);
  if (!e || now > e.reset) { _rl.set(uid, { n: 1, reset: now + 60_000 }); return false; }
  if (e.n >= 10) return true;
  e.n++;
  return false;
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  if (isRateLimited(user.id)) return new Response("Too Many Requests", { status: 429 });

  const { messages } = await req.json();

  const { data: profile } = await supabase
    .from("company_profiles")
    .select("company_name, industry, target_audience, value_proposition")
    .eq("user_id", user.id)
    .single();

  const companyCtx = profile
    ? ` Company: ${profile.company_name}. Industry: ${profile.industry}. Target audience: ${profile.target_audience}. Value: ${profile.value_proposition}.`
    : "";

  const result = await streamText({
    model: anthropic("claude-sonnet-4-6"),
    system: `You are the Nexora AI agent - a focused assistant for cold email outreach. You help with campaigns, leads, analytics, inbox management, and follow-ups. Be concise and direct. No filler phrases.${companyCtx}`,
    messages,
  });

  return result.toTextStreamResponse();
}
