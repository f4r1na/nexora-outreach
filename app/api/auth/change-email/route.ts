import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { newEmail } = await req.json();
  if (!newEmail || !newEmail.includes("@")) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }
  if (newEmail === user.email) {
    return NextResponse.json({ error: "That is already your email address" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(user.id, { email: newEmail });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}
