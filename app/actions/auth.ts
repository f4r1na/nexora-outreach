"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type AuthState = { error: string | null };

export async function login(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/dashboard");
}

export async function signup(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const supabase = await createClient();

  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  const founderType = formData.get("founderType") as string | null;
  const validTypes = ["saas", "agency", "investor"];
  const safeFounderType = validTypes.includes(founderType ?? "") ? founderType : "saas";

  const { data: authData, error } = await supabase.auth.signUp({
    email: formData.get("email") as string,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  // Save founder type to subscriptions (service role bypasses RLS).
  // The subscription row is created by a DB trigger on auth.users insert;
  // this update runs after the trigger fires.
  if (authData.user) {
    const { createClient: createServiceClient } = await import("@supabase/supabase-js");
    const db = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    await db
      .from("subscriptions")
      .update({ founder_type: safeFounderType })
      .eq("user_id", authData.user.id);
  }

  redirect("/dashboard");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
