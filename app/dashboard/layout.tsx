import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Toaster } from "sonner";
import { Sidebar } from "@/components/sidebar";
import { TopBar } from "@/components/top-bar";
import CommandPalette from "./components/command-palette";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("plan")
    .eq("user_id", user.id)
    .single();

  const plan = sub?.plan ?? "free";
  const userName = (user.user_metadata?.full_name as string | undefined) || user.email?.split("@")[0] || "User";
  const userEmail = user.email ?? "";

  return (
    <div className="flex h-screen bg-background">
      <Sidebar userEmail={userEmail} userName={userName} plan={plan} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
      <CommandPalette />
      <Toaster position="bottom-right" />
    </div>
  );
}
