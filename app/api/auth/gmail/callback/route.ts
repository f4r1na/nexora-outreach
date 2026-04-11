import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function GET(req: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const errorRedirect = `${appUrl}/dashboard/settings?gmail=error`;

  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(errorRedirect);
  }

  // Verify the user is still authenticated
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(errorRedirect);
  }

  const redirectUri = `${appUrl}/api/auth/gmail/callback`;

  // Exchange code for tokens
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    console.error("[gmail/callback] token exchange failed:", await tokenRes.text());
    return NextResponse.redirect(errorRedirect);
  }

  const { access_token, refresh_token } = await tokenRes.json();

  // Fetch Gmail address via userinfo endpoint
  const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${access_token}` },
  });

  const gmailEmail = userInfoRes.ok
    ? ((await userInfoRes.json()).email ?? null)
    : null;

  // Store tokens using service role (bypasses RLS)
  const db = getServiceClient();
  const { error } = await db.from("gmail_connections").upsert(
    {
      user_id: user.id,
      access_token,
      refresh_token,
      gmail_email: gmailEmail,
    },
    { onConflict: "user_id" }
  );

  if (error) {
    console.error("[gmail/callback] upsert failed:", error.message);
    return NextResponse.redirect(errorRedirect);
  }

  return NextResponse.redirect(`${appUrl}/dashboard/settings?gmail=connected`);
}
