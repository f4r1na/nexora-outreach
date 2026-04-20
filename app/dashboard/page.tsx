import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AgentInterface from "./_components/agent-interface";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("company_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  const hasCompanyProfile = !!profile?.id;

  return <AgentInterface email={user.email!} hasCompanyProfile={hasCompanyProfile} />;
}
