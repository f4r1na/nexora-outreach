import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import GhostwriterClient from "./_client"

export default async function GhostwriterPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("style_profiles")
    .select("product_description, tone, key_phrases, avg_length")
    .eq("user_id", user.id)
    .maybeSingle()

  return <GhostwriterClient existingProfile={profile} />
}
