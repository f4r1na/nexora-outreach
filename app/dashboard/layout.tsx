import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Toaster } from "sonner";
import Link from "next/link";
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
        <footer style={{
          marginTop: "auto",
          borderTop: "1px solid rgba(255,255,255,0.05)",
          padding: "14px 28px",
          display: "flex", gap: 20, flexWrap: "wrap",
        }}>
          {[["Privacy", "/privacy"], ["Terms", "/terms"], ["Cookies", "/cookies"], ["Contact", "/contact"]].map(([label, href]) => (
            <Link key={label} href={href} style={{ fontSize: 11.5, color: "rgba(255,255,255,0.22)", textDecoration: "none" }}>
              {label}
            </Link>
          ))}
        </footer>
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
