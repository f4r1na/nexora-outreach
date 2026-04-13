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

  const [{ data: sub }, { count: pendingCount }] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("plan, credits_used, credits_limit")
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("replies")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .in("status", ["pending", "draft_ready"]),
  ]);

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
        pendingReplies={pendingCount ?? 0}
      />
      <div
        className="dot-grid"
        style={{
          marginLeft: 232,
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
