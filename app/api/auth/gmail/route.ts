import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Must be byte-for-byte identical to the value in:
// Google Cloud Console → APIs & Services → Credentials →
// OAuth 2.0 Client ID → Authorized redirect URIs
//
// ⚠️  If you need to change this path, update Google Cloud Console too.
const REDIRECT_URI = "https://nexoraoutreach.com/api/auth/gmail/callback";

export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://nexoraoutreach.com";
  const errorRedirect = `${appUrl}/dashboard/settings?gmail=error`;

  // Verify the user is authenticated
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    console.error(JSON.stringify({ step: "gmail_auth_no_user" }));
    return NextResponse.redirect(errorRedirect);
  }

  // Verify plan is Pro or Agency
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("plan")
    .eq("user_id", user.id)
    .single();

  const plan = sub?.plan ?? "free";
  if (plan !== "pro" && plan !== "agency") {
    console.error(JSON.stringify({ step: "gmail_auth_plan_blocked", plan }));
    return NextResponse.redirect(errorRedirect);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID!;

  console.log(JSON.stringify({
    step: "gmail_auth_redirect",
    redirect_uri: REDIRECT_URI,
    user_id: user.id,
    plan,
    client_id_present: !!clientId,
  }));

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    scope: [
      "https://www.googleapis.com/auth/gmail.send",
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/userinfo.email",
    ].join(" "),
    access_type: "offline",
    prompt: "consent",
    state: user.id,
  });

  return NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  );
}
