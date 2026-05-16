import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { product, icp } = await req.json();

  // Use type assertion — columns may not be in generated types yet
  await (supabase
    .from("subscriptions")
    .update({ product_description: product, icp_description: icp } as Record<string, unknown>)
    .eq("user_id", user.id) as unknown as Promise<{ error: unknown }>);

  return NextResponse.json({ ok: true });
}
