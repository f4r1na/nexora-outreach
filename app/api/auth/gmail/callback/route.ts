import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(
      "https://nexoraoutreach.com/dashboard/settings?gmail=error"
    );
  }

  // Get current user
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(
      "https://nexoraoutreach.com/dashboard/settings?gmail=error"
    );
  }

  // Exchange code for tokens
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: "https://nexoraoutreach.com/api/auth/gmail/callback",
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(
      "https://nexoraoutreach.com/dashboard/settings?gmail=error"
    );
  }

  const { access_token, refresh_token } = await tokenRes.json();

  // Fetch Gmail address
  const profileRes = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/profile",
    { headers: { Authorization: `Bearer ${access_token}` } }
  );

  const gmailEmail = profileRes.ok
    ? (await profileRes.json()).emailAddress ?? null
    : null;

  // Store tokens (service role to bypass RLS)
  const db = getServiceClient();
  await db.from("gmail_connections").upsert(
    {
      user_id: user.id,
      access_token,
      refresh_token,
      gmail_email: gmailEmail,
    },
    { onConflict: "user_id" }
  );

  return NextResponse.redirect(
    "https://nexoraoutreach.com/dashboard/settings?gmail=connected"
  );
}
