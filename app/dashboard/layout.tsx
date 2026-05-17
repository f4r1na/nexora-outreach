// app/dashboard/layout.tsx
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Toaster } from "sonner"
import { NewSidebar } from "@/components/new-sidebar"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("plan")
    .eq("user_id", user.id)
    .single()

  const plan = sub?.plan ?? "free"
  const userName =
    (user.user_metadata?.full_name as string | undefined) ||
    user.email?.split("@")[0] ||
    "User"
  const userEmail = user.email ?? ""

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        backgroundColor: "#0a0a0a",
        overflow: "hidden",
      }}
    >
      <NewSidebar userEmail={userEmail} userName={userName} plan={plan} />
      <main
        style={{
          flex: 1,
          overflowY: "auto",
          position: "relative",
        }}
      >
        {children}
      </main>
      <Toaster position="bottom-right" theme="dark" />
    </div>
  )
}
