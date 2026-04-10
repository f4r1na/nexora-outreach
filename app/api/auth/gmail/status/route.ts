import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ connection: null });

  const { data } = await supabase
    .from("gmail_connections")
    .select("gmail_email")
    .eq("user_id", user.id)
    .single();

  return NextResponse.json({ connection: data ?? null });
}
