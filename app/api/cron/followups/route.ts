import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }
  if (req.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Delegate to the send logic
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://nexoraoutreach.com";
  const res = await fetch(`${baseUrl}/api/followups/send`, { method: "POST" });
  const data = await res.json();

  return NextResponse.json({ ok: res.ok, ...data });
}

// Also allow POST for manual dashboard trigger
export async function POST(req: NextRequest) {
  return GET(req);
}
