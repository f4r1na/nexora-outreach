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
      {/* Ambient gradient meshes */}
      <div style={{
        position: "fixed", top: -200, left: -200,
        width: 600, height: 600,
        background: "radial-gradient(circle, rgba(255,82,0,0.08) 0%, transparent 65%)",
        pointerEvents: "none", zIndex: 0,
      }} />
      <div style={{
        position: "fixed", bottom: -300, right: -200,
        width: 700, height: 700,
        background: "radial-gradient(circle, rgba(245,158,11,0.055) 0%, transparent 65%)",
        pointerEvents: "none", zIndex: 0,
      }} />

      <Navbar email={user.email!} plan={plan} />
      <div style={{ paddingTop: 60, minHeight: "100vh", display: "flex", flexDirection: "column", position: "relative", zIndex: 1 }}>
        {children}
      </div>
    </div>
  );
}
