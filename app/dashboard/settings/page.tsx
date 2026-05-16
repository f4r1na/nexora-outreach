"use client"

import { useState } from "react"
import { Settings, Mail, CreditCard, AlertTriangle, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default function SettingsPage() {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  return (
    <div className="p-6">
      {/* Header */}
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
                  <p className="text-xs text-muted-foreground">john@company.com</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 rounded bg-green-500/10 px-2 py-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  <span className="text-xs font-medium text-green-500">Connected</span>
                </div>
                <Button variant="outline" size="sm" className="border-border bg-card hover:bg-secondary">
                  Disconnect
                </Button>
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
                <span className="text-sm">Emails Sent</span>
                <span className="text-sm font-mono">847 / 1,000</span>
              </div>
              <div className="h-2 rounded-full bg-secondary">
                <div
                  className="h-2 rounded-full bg-primary"
                  style={{ width: "84.7%" }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm">AI Signals</span>
                <span className="text-sm font-mono">312 / 500</span>
              </div>
              <div className="h-2 rounded-full bg-secondary">
                <div
                  className="h-2 rounded-full bg-accent"
                  style={{ width: "62.4%" }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm">Active Campaigns</span>
                <span className="text-sm font-mono">2 / 3</span>
              </div>
              <div className="h-2 rounded-full bg-secondary">
                <div
                  className="h-2 rounded-full bg-green-500"
                  style={{ width: "66.7%" }}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Usage resets on the 1st of each month
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
                <p className="text-sm font-medium">Pro Plan</p>
                <p className="text-xs text-muted-foreground">$199/month</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  Active
                </span>
                <Button variant="outline" size="sm" className="border-border bg-card hover:bg-secondary">
                  Upgrade
                </Button>
              </div>
            </div>
            <div className="h-px bg-border" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm">Payment Method</p>
                <p className="text-xs text-muted-foreground">Visa ending in 4242</p>
              </div>
              <Button variant="outline" size="sm" className="border-border bg-card hover:bg-secondary">
                Update
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm">Next billing date</p>
                <p className="text-xs text-muted-foreground">February 1, 2024</p>
              </div>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                View invoices
              </Button>
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
            {!showDeleteConfirm ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm">Delete Account</p>
                  <p className="text-xs text-muted-foreground">
                    Permanently delete your account and all data
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  Delete Account
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-destructive">
                  Are you sure? This action cannot be undone.
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    className="gap-1.5 bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Yes, delete
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="gap-1.5 border-border bg-card hover:bg-secondary"
                  >
                    <X className="h-3.5 w-3.5" />
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
