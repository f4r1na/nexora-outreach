import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Settings, Mail, CreditCard, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PLANS, type PlanKey } from "@/lib/plans"
import { DeleteAccount } from "./_components/delete-account"
import Link from "next/link"

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const [subResult, gmailResult, activeCampaignsResult] = await Promise.all([
    supabase.from("subscriptions").select("plan, credits_used, credits_limit").eq("user_id", user.id).single(),
    supabase.from("gmail_connections").select("gmail_email").eq("user_id", user.id).single(),
    supabase.from("campaigns").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "active"),
  ])

  const sub = subResult.data ?? { plan: "free", credits_used: 0, credits_limit: 10 }
  const plan = sub.plan as PlanKey
  const gmail = gmailResult.data
  const activeCampaignCount = activeCampaignsResult.count ?? 0

  const creditsUsed = sub.credits_used ?? 0
  const creditsLimit = sub.credits_limit ?? 10
  const creditsPercent = creditsLimit > 0 ? Math.round((creditsUsed / creditsLimit) * 100) : 0

  const planInfo = plan !== "free" ? PLANS[plan as Exclude<PlanKey, "free">] : null
  const planLabel = planInfo?.name ?? "Free"
  const planPrice = planInfo?.price ?? 0

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-lg font-semibold">Settings</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Manage your account and preferences
        </p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Email Connection */}
        <section className="rounded-md border border-border bg-card">
          <div className="border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-medium">Email Connection</h2>
            </div>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded bg-secondary">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium">Gmail</p>
                  <p className="text-xs text-muted-foreground">
                    {gmail?.gmail_email ?? "Not connected"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {gmail ? (
                  <>
                    <div className="flex items-center gap-1.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-green-pulse" />
                      <span className="text-xs text-muted-foreground">Connected</span>
                    </div>
                    <Button variant="outline" size="sm" className="border-border bg-card hover:bg-secondary">
                      Disconnect
                    </Button>
                  </>
                ) : (
                  <Button variant="outline" size="sm" className="border-border bg-card hover:bg-secondary">
                    Connect Gmail
                  </Button>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded bg-secondary">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Outlook</p>
                  <p className="text-xs text-muted-foreground">Not connected</p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="border-border bg-card hover:bg-secondary">
                Connect
              </Button>
            </div>
          </div>
        </section>

        {/* Usage */}
        <section className="rounded-md border border-border bg-card">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-medium">Usage This Month</h2>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm">Credits Used</span>
                <span className="text-sm font-mono">{creditsUsed.toLocaleString()} / {creditsLimit.toLocaleString()}</span>
              </div>
              <div className="h-2 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-2 rounded-full bg-primary bar-fill-animate"
                  style={{ width: `${Math.min(creditsPercent, 100)}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm">Active Campaigns</span>
                <span className="text-sm font-mono">{activeCampaignCount}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Account email: {user.email}
            </p>
          </div>
        </section>

        {/* Billing */}
        <section className="rounded-md border border-border bg-card">
          <div className="border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-medium">Billing & Plan</h2>
            </div>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{planLabel} Plan</p>
                <p className="text-xs text-muted-foreground">
                  {planPrice > 0 ? `$${planPrice}/month` : "Free"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary capitalize">
                  {plan}
                </span>
                {plan === "free" && (
                  <Button asChild variant="outline" size="sm" className="border-border bg-card hover:bg-secondary">
                    <Link href="/dashboard/billing">Upgrade</Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Danger Zone */}
        <section className="rounded-md border border-destructive/50 bg-card">
          <div className="border-b border-destructive/50 px-4 py-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <h2 className="text-sm font-medium text-destructive">Danger Zone</h2>
            </div>
          </div>
          <div className="p-4">
            <DeleteAccount />
          </div>
        </section>
      </div>
    </div>
  )
}
