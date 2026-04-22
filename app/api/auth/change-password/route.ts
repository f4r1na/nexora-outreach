import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { newPassword } = await req.json();
  if (!newPassword || newPassword.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(user.id, { password: newPassword });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}
