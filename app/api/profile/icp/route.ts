import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createAdminClient();
  const { data } = await db
    .from("subscriptions")
    .select("icp_keywords, icp_location")
    .eq("user_id", user.id)
    .single();

  return NextResponse.json({
    icp_keywords: data?.icp_keywords ?? "",
    icp_location: data?.icp_location ?? "",
  });
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { icp_keywords, icp_location } = body as {
    icp_keywords?: string;
    icp_location?: string;
  };

  const db = createAdminClient();
  const { error } = await db
    .from("subscriptions")
    .update({
      icp_keywords: (icp_keywords ?? "").trim(),
      icp_location: (icp_location ?? "").trim(),
    })
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
