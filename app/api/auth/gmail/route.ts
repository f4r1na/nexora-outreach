import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  // Verify the user is authenticated
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const errorRedirect = `${appUrl}/dashboard/settings?gmail=error`;

  if (!user) {
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
    return NextResponse.redirect(errorRedirect);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID!;
  const redirectUri = `${appUrl}/api/auth/gmail/callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
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
