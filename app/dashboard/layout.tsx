import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Toaster } from "sonner";
import Navbar from "./_components/navbar";
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
  );
}
