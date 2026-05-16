"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Zap, ArrowRight, ArrowLeft, Check, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const steps = [
  { id: 1, title: "What do you sell?", description: "Tell us about your product or service" },
  { id: 2, title: "Who do you sell to?", description: "Describe your ideal customer" },
  { id: 3, title: "Connect email", description: "Link your email account" },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    product: "",
    icp: "",
    emailConnected: false,
  })

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1)
    } else {
      router.push("/dashboard")
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleConnectGmail = () => {
    setFormData({ ...formData, emailConnected: true })
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex h-14 items-center justify-between border-b border-border px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-primary">
            <Zap className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-base font-semibold tracking-tight">Nexora</span>
        </div>
        <div className="flex items-center gap-2">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                  currentStep > step.id
                    ? "bg-primary text-primary-foreground"
                    : currentStep === step.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground"
                )}
              >
                {currentStep > step.id ? (
                  <Check className="h-3 w-3" />
                ) : (
                  step.id
                )}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "mx-2 h-px w-8",
                    currentStep > step.id ? "bg-primary" : "bg-border"
                  )}
                />
              )}
            </div>
          ))}
        </div>
        <div className="w-24" />
      </header>

      {/* Main Content */}
      <main className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-xl">
          {/* Step 1: What do you sell? */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <h1 className="text-2xl font-semibold">What do you sell?</h1>
                <p className="mt-2 text-muted-foreground">
                  Describe your product or service in a few sentences
                </p>
              </div>
              <textarea
                value={formData.product}
                onChange={(e) =>
                  setFormData({ ...formData, product: e.target.value })
                }
                placeholder="e.g., We sell AI-powered sales automation software that helps B2B companies increase their outbound reply rates by 3x..."
                className="h-40 w-full resize-none rounded-md border border-border bg-card p-4 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <p className="text-xs text-muted-foreground text-center">
                This helps our AI craft personalized emails that resonate with your prospects
              </p>
            </div>
          )}

          {/* Step 2: Who do you sell to? */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <h1 className="text-2xl font-semibold">Who do you sell to?</h1>
                <p className="mt-2 text-muted-foreground">
                  Describe your ideal customer profile (ICP)
                </p>
              </div>
              <textarea
                value={formData.icp}
                onChange={(e) =>
                  setFormData({ ...formData, icp: e.target.value })
                }
                placeholder="e.g., VP of Sales or Head of Growth at Series A-C SaaS companies with 50-500 employees, based in North America..."
                className="h-40 w-full resize-none rounded-md border border-border bg-card p-4 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <p className="text-xs text-muted-foreground text-center">
                Our AI will use this to find and prioritize the right prospects for you
              </p>
            </div>
          )}

          {/* Step 3: Connect Email */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <h1 className="text-2xl font-semibold">Connect your email</h1>
                <p className="mt-2 text-muted-foreground">
                  Link your email account to start sending campaigns
                </p>
              </div>
              <div className="space-y-3">
                <button
                  onClick={handleConnectGmail}
                  disabled={formData.emailConnected}
                  className={cn(
                    "flex w-full items-center justify-center gap-3 rounded-md border border-border bg-card p-4 text-sm font-medium transition-colors",
                    formData.emailConnected
                      ? "border-green-500/50 bg-green-500/10"
                      : "hover:bg-secondary"
                  )}
                >
                  {formData.emailConnected ? (
                    <>
                      <Check className="h-5 w-5 text-green-500" />
                      <span className="text-green-500">Gmail Connected</span>
                    </>
                  ) : (
                    <>
                      <Mail className="h-5 w-5" />
                      <span>Connect Gmail</span>
                    </>
                  )}
                </button>
                <button
                  className="flex w-full items-center justify-center gap-3 rounded-md border border-border bg-card p-4 text-sm font-medium transition-colors hover:bg-secondary"
                >
                  <Mail className="h-5 w-5" />
                  <span>Connect Outlook</span>
                </button>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                We only use your email to send campaigns. Your data is secure and encrypted.
              </p>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={currentStep === 1}
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <Button
              onClick={handleNext}
              className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={
                (currentStep === 1 && !formData.product) ||
                (currentStep === 2 && !formData.icp) ||
                (currentStep === 3 && !formData.emailConnected)
              }
            >
              {currentStep === 3 ? "Get Started" : "Continue"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
