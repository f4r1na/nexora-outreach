import { NextRequest } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getDb() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

function htmlResponse(html: string, status = 200) {
  return new Response(html, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}

const SUCCESS_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Unsubscribed</title>
  <style>
    body{font-family:Arial,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f9fafb;color:#374151}
    .card{text-align:center;padding:48px 40px;background:#fff;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,.1);max-width:400px}
    h1{font-size:22px;margin:0 0 12px;color:#111827}
    p{font-size:14px;color:#6b7280;line-height:1.6;margin:0}
  </style>
</head>
<body>
  <div class="card">
    <h1>You've been unsubscribed</h1>
    <p>You will no longer receive emails from this sender. This takes effect immediately.</p>
  </div>
</body>
</html>`;

function errorHtml(msg: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Error</title>
  <style>
    body{font-family:Arial,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f9fafb}
    .card{text-align:center;padding:48px 40px;background:#fff;border-radius:12px;max-width:400px}
    h1{font-size:20px;color:#ef4444;margin:0 0 12px}
    p{font-size:14px;color:#6b7280;margin:0}
  </style>
</head>
<body>
  <div class="card">
    <h1>Something went wrong</h1>
    <p>${msg}</p>
  </div>
</body>
</html>`;
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return htmlResponse(errorHtml("Invalid unsubscribe link."), 400);

  let leadId: string;
  try {
    leadId = Buffer.from(token, "base64url").toString("utf-8");
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(leadId)) {
      throw new Error("not a uuid");
    }
  } catch {
    return htmlResponse(errorHtml("Invalid unsubscribe link."), 400);
  }

  const db = getDb();
  const { error } = await db
    .from("leads")
    .update({ unsubscribed: true, unsubscribed_at: new Date().toISOString() })
    .eq("id", leadId);

  if (error) {
    console.error(JSON.stringify({ step: "unsubscribe_error", lead_id: leadId, error: error.message }));
    return htmlResponse(errorHtml("Failed to process your request. Please try again."), 500);
  }

  console.log(JSON.stringify({ step: "unsubscribed", lead_id: leadId }));
  return htmlResponse(SUCCESS_HTML);
}
