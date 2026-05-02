import { createClient } from "@/lib/supabase/server";
import { randomUUID } from "crypto";
import { redirect } from "next/navigation";

export default async function AgentPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  redirect(`/dashboard/agent/${randomUUID()}`);
}
