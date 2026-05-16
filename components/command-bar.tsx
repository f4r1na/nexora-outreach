"use client"

import { useState, useEffect } from "react"
import { Send, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const examplePrompts = [
  "Find 50 SaaS founders who raised Series A",
  "Draft cold emails for marketing agencies",
  "Analyze last week's campaign performance",
]

const cyclePlaceholders = [
  "Find 20 SaaS founders who raised Series A...",
  "Send follow-ups to everyone who opened...",
  "Analyze my campaign performance...",
]

export function CommandBar() {
  const [query, setQuery] = useState("")
  const [isThinking, setIsThinking] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [placeholderIndex, setPlaceholderIndex] = useState(0)
  const [placeholderVisible, setPlaceholderVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderVisible(false)
      setTimeout(() => {
        setPlaceholderIndex((i) => (i + 1) % cyclePlaceholders.length)
        setPlaceholderVisible(true)
      }, 300)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const handleSubmit = () => {
    if (!query.trim()) return
    setIsThinking(true)
    setTimeout(() => setIsThinking(false), 2000)
  }

  return (
    <div className="w-full animate-scale-in">
      <div className="relative">
        {/* Left icon / processing dots */}
        {isThinking ? (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="inline-block h-1.5 w-1.5 rounded-full bg-primary animate-bounce-dot"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        ) : (
          <div className="absolute left-4 top-1/2 -translate-y-1/2">
            <Sparkles
              className={cn(
                "h-4 w-4 transition-colors duration-200",
                isFocused ? "text-primary" : "text-muted-foreground"
              )}
            />
          </div>
        )}

        {/* Cycling placeholder overlay */}
        {!query && !isThinking && (
          <span
            className="absolute left-11 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none select-none"
            style={{
              opacity: placeholderVisible ? 1 : 0,
              transition: "opacity 0.3s ease",
            }}
          >
            {cyclePlaceholders[placeholderIndex]}
          </span>
        )}

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder=""
          className={cn(
            "h-12 w-full rounded-md border bg-card pl-11 pr-24 text-sm text-foreground focus:outline-none",
            isThinking ? "border-primary" : "border-border"
          )}
          style={{
            boxShadow:
              isFocused || isThinking
                ? "0 0 0 1px #f97316, 0 0 16px rgba(249,115,22,0.12)"
                : undefined,
            transition: "box-shadow 0.2s ease, border-color 0.2s ease",
          }}
        />

        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          <Button
            size="sm"
            className="h-8 gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 transition-transform hover:scale-[1.02]"
            onClick={handleSubmit}
            disabled={isThinking}
          >
            {isThinking ? (
              <div className="h-3.5 w-3.5 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
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
            className="rounded border border-border bg-card px-2.5 py-1 text-xs text-muted-foreground transition-all duration-200 hover:border-primary hover:text-foreground"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  )
}
