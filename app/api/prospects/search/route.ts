import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";
import { searchProspects } from "@/lib/search/prospect-searcher";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rl = rateLimit({
      key: `prospect-search:${user.id}`,
      limit: 20,
      windowMs: 3_600_000,
    });
    if (!rl.ok)
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

    const body = await req.json().catch(() => ({}));
    const { query } = body as { query?: string };
    if (!query?.trim())
      return NextResponse.json({ error: "query required" }, { status: 400 });

    const result = await searchProspects(query.trim());

    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
