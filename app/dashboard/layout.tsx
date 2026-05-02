import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Toaster } from "sonner";
import Sidebar from "./_components/Sidebar";
import MouseGradient from "./_components/MouseGradient";
import PageWrapper from "./_components/PageWrapper";
import { SoundProvider } from "./_components/SoundProvider";
import OnboardingChecklist from "./components/onboarding-checklist";
import CommandPalette from "./components/command-palette";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [subResult, repliesResult] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("plan, credits_used, credits_limit")
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("replies")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .neq("status", "handled"),
  ]);

  const plan = subResult.data?.plan ?? "free";
  const creditsUsed = subResult.data?.credits_used ?? 0;
  const creditsLimit = subResult.data?.credits_limit ?? 10;
  const pendingReplies = repliesResult.count ?? 0;

  return (
    <SoundProvider>
    <div
      className="dashboard-gradient-bg"
      style={{
        minHeight: "100vh",
        display: "flex",
        position: "relative",
      }}
    >
      <div className="gradient-overlay" />
      <MouseGradient />

      <Sidebar
        email={user.email!}
        plan={plan}
        creditsUsed={creditsUsed}
        creditsLimit={creditsLimit}
        pendingReplies={pendingReplies}
      />

      <main
        className="dashboard-main"
        style={{
          flex: 1,
          minWidth: 0,
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
        }}
      >
        <PageWrapper>
          {children}
        </PageWrapper>
      </main>

      <CommandPalette />
      <OnboardingChecklist />
      <Toaster
        position="bottom-right"
        theme="dark"
        toastOptions={{
          style: {
            backgroundColor: "rgba(14,14,24,0.92)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "#ddd",
            fontFamily: "var(--font-outfit)",
            fontSize: "12.5px",
            backdropFilter: "blur(16px)",
          },
        }}
      />
    </div>
    </SoundProvider>
  );
}
