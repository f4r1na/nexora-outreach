import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// This MUST match exactly what is registered in Google Cloud Console →
// APIs & Services → Credentials → OAuth 2.0 Client ID → Authorized redirect URIs.
// If you change this value, update Google Cloud Console too.
const REDIRECT_URI = "https://nexoraoutreach.com/api/auth/gmail/callback";

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function GET(req: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://nexoraoutreach.com";
  const errorRedirect = `${appUrl}/dashboard/settings?gmail=error`;


  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(errorRedirect);
  }

  if (!code) {
    return NextResponse.redirect(errorRedirect);
  }

  // Verify the user is still authenticated via session cookie
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.redirect(errorRedirect);
  }


  // Exchange authorization code for tokens.
  // redirect_uri must be byte-for-byte identical to the one sent in the auth request.

  const tokenBody = new URLSearchParams({
    code,
    client_id: process.env.GOOGLE_CLIENT_ID!,
    client_secret: process.env.GOOGLE_CLIENT_SECRET!,
    redirect_uri: REDIRECT_URI,
    grant_type: "authorization_code",
  });

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: tokenBody,
  });

  const tokenText = await tokenRes.text();

  if (!tokenRes.ok) {
    return NextResponse.redirect(errorRedirect);
  }

  let tokenData: { access_token?: string; refresh_token?: string };
  try {
    tokenData = JSON.parse(tokenText);
  } catch {
    return NextResponse.redirect(errorRedirect);
  }

  const { access_token, refresh_token } = tokenData;

  if (!access_token) {
    return NextResponse.redirect(errorRedirect);
  }


  // Fetch the Gmail address from Google's userinfo endpoint
  const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${access_token}` },
  });

  let gmailEmail: string | null = null;
  if (userInfoRes.ok) {
    const info = await userInfoRes.json();
    gmailEmail = info.email ?? null;
  } else {
  }

  // Store tokens — service role bypasses RLS
  const db = getServiceClient();


  const payload = {
    access_token,
    refresh_token: refresh_token ?? null,
    gmail_email: gmailEmail,
  };

  // Check whether a row already exists for this user
  const { data: existing, error: selectError } = await db
    .from("gmail_connections")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (selectError) {
    return NextResponse.redirect(errorRedirect);
  }

  type DbError = { message: string; code?: string; details?: string; hint?: string };
  let saveError: DbError | null = null;

  if (existing) {
    // Row exists — update in place
    const { error } = await db
      .from("gmail_connections")
      .update(payload)
      .eq("user_id", user.id);
    if (error) saveError = error as DbError;
  } else {
    // No row yet — insert
    const { error } = await db
      .from("gmail_connections")
      .insert({ user_id: user.id, ...payload });
    if (error) saveError = error as DbError;
  }

  if (saveError) {
    return NextResponse.redirect(errorRedirect);
  }

  return NextResponse.redirect(`${appUrl}/dashboard/settings?gmail=connected`);
}
