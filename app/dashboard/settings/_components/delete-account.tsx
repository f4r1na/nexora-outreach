"use client"

import { useState } from "react"
import { Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"

export function DeleteAccount() {
  const [showConfirm, setShowConfirm] = useState(false)

  if (!showConfirm) {
    return (
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
          onClick={() => setShowConfirm(true)}
          className="border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          Delete Account
        </Button>
      </div>
    )
  }

  return (
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
          onClick={() => setShowConfirm(false)}
          className="gap-1.5 border-border bg-card hover:bg-secondary"
        >
          <X className="h-3.5 w-3.5" />
          Cancel
        </Button>
      </div>
    </div>
  )
}
