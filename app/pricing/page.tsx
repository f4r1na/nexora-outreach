import Link from "next/link"
import { Zap, Check, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const plans = [
  {
    name: "Pro",
    price: "$199",
    period: "/month",
    description: "For growing sales teams",
    features: [
      "1,000 emails/month",
      "500 AI signals",
      "3 campaigns",
      "Gmail & Outlook",
      "Basic analytics",
      "Email support",
    ],
    cta: "Start Free Trial",
    highlighted: false,
  },
  {
    name: "Agency",
    price: "$499",
    period: "/month",
    description: "For sales agencies",
    features: [
      "5,000 emails/month",
      "2,500 AI signals",
      "Unlimited campaigns",
      "Multi-inbox support",
      "Advanced analytics",
      "Priority support",
      "API access",
      "Custom integrations",
    ],
    cta: "Start Free Trial",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "$999",
    period: "/month",
    description: "For large organizations",
    features: [
      "Unlimited emails",
      "Unlimited AI signals",
      "Unlimited campaigns",
      "Unlimited inboxes",
      "Custom AI training",
      "Dedicated CSM",
      "SLA guarantee",
      "SSO & SAML",
      "Custom contracts",
    ],
    cta: "Contact Sales",
    highlighted: false,
  },
]

const comparisonFeatures = [
  { name: "Emails per month", pro: "1,000", agency: "5,000", enterprise: "Unlimited" },
  { name: "AI signals", pro: "500", agency: "2,500", enterprise: "Unlimited" },
  { name: "Campaigns", pro: "3", agency: "Unlimited", enterprise: "Unlimited" },
  { name: "Team members", pro: "1", agency: "5", enterprise: "Unlimited" },
  { name: "Email warmup", pro: true, agency: true, enterprise: true },
  { name: "CRM integrations", pro: false, agency: true, enterprise: true },
  { name: "API access", pro: false, agency: true, enterprise: true },
  { name: "Custom AI training", pro: false, agency: false, enterprise: true },
  { name: "SSO/SAML", pro: false, agency: false, enterprise: true },
  { name: "SLA guarantee", pro: false, agency: false, enterprise: true },
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="flex h-14 items-center justify-between border-b border-border px-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-primary">
            <Zap className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-base font-semibold tracking-tight">Nexora</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
            Dashboard
          </Link>
          <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
            Get Started
          </Button>
        </div>
      </header>

      {/* Hero */}
      <div className="border-b border-border px-6 py-16 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-4">
          <span>7-day free trial</span>
          <span className="text-muted-foreground">No credit card required</span>
        </div>
        <h1 className="text-3xl font-semibold">Simple, transparent pricing</h1>
        <p className="mt-2 text-muted-foreground">
          Choose the plan that fits your sales workflow
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="grid grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                "rounded-md border p-6",
                plan.highlighted
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card"
              )}
            >
              {plan.highlighted && (
                <div className="mb-4 inline-block rounded bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                  Most Popular
                </div>
              )}
              <h3 className="text-lg font-semibold">{plan.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {plan.description}
              </p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-semibold">{plan.price}</span>
                <span className="text-sm text-muted-foreground">
                  {plan.period}
                </span>
              </div>
              <Button
                className={cn(
                  "mt-6 w-full gap-2",
                  plan.highlighted
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "bg-secondary text-foreground hover:bg-secondary/80"
                )}
              >
                {plan.cta}
                <ArrowRight className="h-4 w-4" />
              </Button>
              <ul className="mt-6 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Comparison Table */}
      <div className="border-t border-border px-6 py-12">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-8 text-center text-xl font-semibold">
            Compare plans
          </h2>
          <div className="rounded-md border border-border bg-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    Feature
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-medium">
                    Pro
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-primary">
                    Agency
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-medium">
                    Enterprise
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {comparisonFeatures.map((feature) => (
                  <tr key={feature.name}>
                    <td className="px-4 py-3 text-sm">{feature.name}</td>
                    <td className="px-4 py-3 text-center text-sm">
                      {typeof feature.pro === "boolean" ? (
                        feature.pro ? (
                          <Check className="mx-auto h-4 w-4 text-primary" />
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )
                      ) : (
                        <span className="font-mono text-muted-foreground">
                          {feature.pro}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-sm bg-primary/5">
                      {typeof feature.agency === "boolean" ? (
                        feature.agency ? (
                          <Check className="mx-auto h-4 w-4 text-primary" />
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )
                      ) : (
                        <span className="font-mono">{feature.agency}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-sm">
                      {typeof feature.enterprise === "boolean" ? (
                        feature.enterprise ? (
                          <Check className="mx-auto h-4 w-4 text-primary" />
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )
                      ) : (
                        <span className="font-mono">{feature.enterprise}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-8">
        <div className="mx-auto max-w-5xl text-center">
          <p className="text-sm text-muted-foreground">
            Questions? Contact us at{" "}
            <a href="mailto:sales@nexora.ai" className="text-primary hover:underline">
              sales@nexora.ai
            </a>
          </p>
        </div>
      </footer>
    </div>
  )
}
