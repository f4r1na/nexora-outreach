import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "./_components/navbar";

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

  return (
    <div style={{ backgroundColor: "#080810", minHeight: "100vh", position: "relative", overflow: "hidden" }}>
      <Navbar email={user.email!} plan={plan} />
      <div style={{ paddingTop: 60, minHeight: "100vh", display: "flex", flexDirection: "column", position: "relative", zIndex: 1 }}>
        {children}
      </div>
    </div>
  );
}
