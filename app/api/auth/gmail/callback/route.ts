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

  console.log(JSON.stringify({ step: "gmail_callback_hit", redirect_uri: REDIRECT_URI }));

  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    console.error(JSON.stringify({ step: "gmail_callback_oauth_error", error }));
    return NextResponse.redirect(errorRedirect);
  }

  if (!code) {
    console.error(JSON.stringify({ step: "gmail_callback_no_code" }));
    return NextResponse.redirect(errorRedirect);
  }

  // Verify the user is still authenticated via session cookie
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error(JSON.stringify({ step: "gmail_callback_auth", error: authError?.message ?? "no user" }));
    return NextResponse.redirect(errorRedirect);
  }

  console.log(JSON.stringify({ step: "gmail_callback_auth", user_id: user.id }));

  // Exchange authorization code for tokens.
  // redirect_uri must be byte-for-byte identical to the one sent in the auth request.
  console.log(JSON.stringify({ step: "gmail_token_exchange_start", redirect_uri: REDIRECT_URI }));

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
    console.error(JSON.stringify({
      step: "gmail_token_exchange_failed",
      status: tokenRes.status,
      statusText: tokenRes.statusText,
      body: tokenText,
      google_client_id_present: !!process.env.GOOGLE_CLIENT_ID,
      google_client_secret_present: !!process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri_used: REDIRECT_URI,
    }));
    return NextResponse.redirect(errorRedirect);
  }

  let tokenData: { access_token?: string; refresh_token?: string };
  try {
    tokenData = JSON.parse(tokenText);
  } catch {
    console.error(JSON.stringify({ step: "gmail_token_parse_failed", body: tokenText }));
    return NextResponse.redirect(errorRedirect);
  }

  const { access_token, refresh_token } = tokenData;

  if (!access_token) {
    console.error(JSON.stringify({ step: "gmail_token_missing_access_token", body: tokenText }));
    return NextResponse.redirect(errorRedirect);
  }

  console.log(JSON.stringify({
    step: "gmail_token_exchange_success",
    has_access_token: !!access_token,
    has_refresh_token: !!refresh_token,
  }));

  // Fetch the Gmail address from Google's userinfo endpoint
  const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${access_token}` },
  });

  let gmailEmail: string | null = null;
  if (userInfoRes.ok) {
    const info = await userInfoRes.json();
    gmailEmail = info.email ?? null;
    console.log(JSON.stringify({ step: "gmail_userinfo", email: gmailEmail }));
  } else {
    console.error(JSON.stringify({
      step: "gmail_userinfo_failed",
      status: userInfoRes.status,
      body: await userInfoRes.text(),
    }));
  }

  // Store tokens — service role bypasses RLS
  const db = getServiceClient();

  console.log(JSON.stringify({
    step: "gmail_save_start",
    user_id: user.id,
    gmail_email: gmailEmail,
    supabase_url_present: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    service_role_present: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  }));

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
    console.error(JSON.stringify({
      step: "gmail_save_select_failed",
      message: selectError.message,
      code: (selectError as { code?: string }).code,
    }));
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
    console.log(JSON.stringify({ step: "gmail_save_update", user_id: user.id }));
  } else {
    // No row yet — insert
    const { error } = await db
      .from("gmail_connections")
      .insert({ user_id: user.id, ...payload });
    if (error) saveError = error as DbError;
    console.log(JSON.stringify({ step: "gmail_save_insert", user_id: user.id }));
  }

  if (saveError) {
    console.error(JSON.stringify({
      step: "gmail_save_failed",
      message: saveError.message,
      code: saveError.code,
      details: saveError.details,
      hint: saveError.hint,
    }));
    return NextResponse.redirect(errorRedirect);
  }

  console.log(JSON.stringify({ step: "gmail_save_success", user_id: user.id }));
  return NextResponse.redirect(`${appUrl}/dashboard/settings?gmail=connected`);
}
