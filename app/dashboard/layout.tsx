import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "./_components/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("plan, credits_used, credits_limit")
    .eq("user_id", user.id)
    .single();

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: "var(--black)",
      }}
    >
      <Sidebar
        email={user.email!}
        plan={sub?.plan ?? "free"}
        creditsUsed={sub?.credits_used ?? 0}
        creditsLimit={sub?.credits_limit ?? 10}
      />
      <div
        className="dot-grid"
        style={{
          marginLeft: 240,
          flex: 1,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {children}
      </div>
    </div>
  );
}
