import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import ChatArea from "./_components/chat-area"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const userName =
    (user.user_metadata?.full_name as string | undefined) ||
    user.email?.split("@")[0] ||
    "User"

  return <ChatArea userName={userName} />
}
