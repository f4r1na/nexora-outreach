import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
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

async function refreshGoogleToken(refreshToken: string): Promise<string | null> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return (data.access_token as string) ?? null;
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = getDb();

    const { data: conn } = await db
      .from("gmail_connections")
      .select("access_token, refresh_token")
      .eq("user_id", user.id)
      .single();

    if (!conn?.access_token) {
      return NextResponse.json({ error: "no_connection" }, { status: 400 });
    }

    let accessToken = conn.access_token;
    const refreshToken = conn.refresh_token as string | null;
    const userId = user.id;

    async function calFetch(url: string): Promise<Response> {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.status === 401 && refreshToken) {
        const newToken = await refreshGoogleToken(refreshToken);
        if (newToken) {
          accessToken = newToken;
          await db.from("gmail_connections").update({ access_token: newToken }).eq("user_id", userId);
          return fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
        }
      }
      return res;
    }

    const timeMin = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const timeMax = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime&maxResults=50`;

    const res = await calFetch(url);

    if (!res.ok) {
      if (res.status === 403) {
        return NextResponse.json({ error: "calendar_scope_missing" }, { status: 403 });
      }
      return NextResponse.json({ error: `Calendar API error: ${res.status}` }, { status: 502 });
    }

    type RawAttendee = { email?: string; displayName?: string; self?: boolean };
    type RawDateTime = { dateTime?: string; date?: string };

    const data = await res.json() as { items?: Array<Record<string, unknown>> };

    const events = (data.items ?? []).map((e) => {
      const start = e.start as RawDateTime | undefined;
      const end   = e.end   as RawDateTime | undefined;
      return {
        id:          e.id as string,
        title:       (e.summary as string) ?? "Untitled Meeting",
        start:       start?.dateTime ?? start?.date ?? "",
        end:         end?.dateTime   ?? end?.date   ?? "",
        attendees:   ((e.attendees as RawAttendee[]) ?? []).map((a) => ({
          email: a.email ?? "",
          name:  a.displayName,
          self:  a.self ?? false,
        })),
        hangoutLink: (e.hangoutLink as string | null) ?? null,
        htmlLink:    (e.htmlLink    as string)        ?? null,
        location:    (e.location   as string | null) ?? null,
        status:      (e.status     as string)        ?? "confirmed",
      };
    });

    return NextResponse.json({ events });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
