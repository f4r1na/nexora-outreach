import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (!code) return NextResponse.redirect(`${appUrl}/login`);

  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(`${appUrl}/login?error=oauth`);
  }

  // Check if this user already has a subscription row (= returning user)
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("user_id")
    .eq("user_id", data.user.id)
    .single();

  if (sub) {
    return NextResponse.redirect(`${appUrl}/dashboard`);
  }

  // New user — send to onboarding
  return NextResponse.redirect(`${appUrl}/onboarding`);
}
