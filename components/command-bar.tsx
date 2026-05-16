"use client"

import { useState } from "react"
import { Send, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const examplePrompts = [
  "Find 50 SaaS founders who raised Series A",
  "Draft cold emails for marketing agencies",
  "Analyze last week's campaign performance",
]

export function CommandBar() {
  const [query, setQuery] = useState("")
  const [isThinking, setIsThinking] = useState(false)

  const handleSubmit = () => {
    if (!query.trim()) return
    setIsThinking(true)
    // Simulate AI thinking
    setTimeout(() => setIsThinking(false), 2000)
  }

  return (
    <div className="w-full animate-fade-in">
      <div className="relative">
        <div className={cn(
          "absolute left-4 top-1/2 -translate-y-1/2 transition-all",
          isThinking && "animate-pulse-subtle"
        )}>
          <Sparkles className={cn(
            "h-4 w-4 transition-colors",
            isThinking ? "text-primary" : "text-muted-foreground"
          )} />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="Find leads, send emails, analyze campaigns..."
          className={cn(
            "h-12 w-full rounded-md border bg-card pl-11 pr-24 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 transition-all",
            isThinking 
              ? "border-primary ring-1 ring-primary" 
              : "border-border focus:border-primary focus:ring-primary"
          )}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          <Button 
            size="sm" 
            className="h-8 gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={handleSubmit}
            disabled={isThinking}
          >
            {isThinking ? (
              <>
                <div className="h-3.5 w-3.5 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                <span className="sr-only">Processing</span>
              </>
            ) : (
              <>
                <Send className="h-3.5 w-3.5" />
                Send
              </>
            )}
          </Button>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">Try:</span>
        {examplePrompts.map((prompt, index) => (
          <button
            key={index}
            onClick={() => setQuery(prompt)}
            className="rounded border border-border bg-card px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  )
}
