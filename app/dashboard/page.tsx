// app/dashboard/page.tsx
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { CommandCenter } from "./_components/command-center"

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: styleProfile } = await supabase
    .from("style_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle()

  return <CommandCenter hasProductDescription={!!styleProfile} />
}
