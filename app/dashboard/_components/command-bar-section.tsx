"use client"

import { useState } from "react"
import { AnimatePresence } from "framer-motion"
import { CommandBar } from "@/components/command-bar"
import { ResearchOverlay } from "./research-overlay"
import { ResultsSummary } from "./results-summary"
import { EmailPreviewModal } from "./email-preview-modal"
import { SendingProgress } from "./sending-progress"
import { SuccessState } from "./success-state"
import { Prospect } from "./prospect-data"
import { motion } from "framer-motion"

type Phase = "idle" | "clarify" | "research" | "results" | "preview" | "sending" | "success"

interface CommandBarSectionProps {
  hasCompanyProfile: boolean
}

export function CommandBarSection({ hasCompanyProfile }: CommandBarSectionProps) {
  const [phase, setPhase] = useState<Phase>("idle")
  const [query, setQuery] = useState("")
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [clarifyAnswer, setClarifyAnswer] = useState("")

  const handleSubmit = (q: string) => {
    setQuery(q)
    if (!hasCompanyProfile && !clarifyAnswer) {
      setPhase("clarify")
    } else {
      setPhase("research")
    }
  }

  const reset = () => {
    setPhase("idle")
    setQuery("")
    setProspects([])
    setSelectedIds([])
    setClarifyAnswer("")
  }

  return (
    <>
      <CommandBar onSubmit={handleSubmit} />

      <AnimatePresence>
        {/* Phase 2: Clarification */}
        {phase === "clarify" && (
          <motion.div
            key="clarify"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            style={{
              marginTop: 12, padding: "14px 16px",
              backgroundColor: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 8,
            }}
          >
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 10 }}>
              Quick question before I start: What&apos;s your product?
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                autoFocus
                value={clarifyAnswer}
                onChange={e => setClarifyAnswer(e.target.value)}
                onKeyDown={e => e.key === "Enter" && setPhase("research")}
                placeholder="e.g. AI email automation for sales teams"
                style={{
                  flex: 1, padding: "8px 12px",
                  backgroundColor: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 6, color: "#fff", fontSize: 13, outline: "none",
                }}
              />
              <button
                onClick={() => setPhase("research")}
                style={{
                  padding: "8px 14px", borderRadius: 6,
                  border: "1px solid rgba(255,255,255,0.1)",
                  backgroundColor: "transparent", color: "rgba(255,255,255,0.5)",
                  fontSize: 13, cursor: "pointer",
                }}
              >
                Skip
              </button>
              <button
                onClick={() => setPhase("research")}
                style={{
                  padding: "8px 16px", borderRadius: 6,
                  backgroundColor: "#f97316", border: "none",
                  color: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer",
                }}
              >
                Continue &rarr;
              </button>
            </div>
          </motion.div>
        )}

        {/* Phase 3: Research overlay */}
        {phase === "research" && (
          <ResearchOverlay
            key="research"
            query={query}
            onComplete={(p) => { setProspects(p); setPhase("results") }}
          />
        )}

        {/* Phase 4: Results */}
        {phase === "results" && (
          <ResultsSummary
            key="results"
            prospects={prospects}
            onEditTemplate={() => setPhase("preview")}
            onSendEmails={(ids) => { setSelectedIds(ids); setPhase("sending") }}
            onClose={reset}
          />
        )}

        {/* Phase 5: Email preview overlaid on results */}
        {phase === "preview" && (
          <ResultsSummary
            key="results-bg"
            prospects={prospects}
            onEditTemplate={() => {}}
            onSendEmails={(ids) => { setSelectedIds(ids); setPhase("sending") }}
            onClose={reset}
          />
        )}
        {phase === "preview" && (
          <EmailPreviewModal
            key="preview"
            query={query}
            onUse={() => setPhase("results")}
            onCancel={() => setPhase("results")}
          />
        )}

        {/* Phase 6: Sending */}
        {phase === "sending" && (
          <SendingProgress
            key="sending"
            prospects={prospects}
            selectedIds={selectedIds}
            onComplete={() => setPhase("success")}
          />
        )}

        {/* Phase 7: Success */}
        {phase === "success" && (
          <SuccessState
            key="success"
            sentCount={selectedIds.length}
            query={query}
            onFindMore={reset}
          />
        )}
      </AnimatePresence>
    </>
  )
}
