"use client"

import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { CheckCircle } from "lucide-react"

const EASE = [0.4, 0, 0.2, 1] as const

interface SuccessStateProps {
  sentCount: number
  query: string
  onFindMore: () => void
}

export function SuccessState({ sentCount, query, onFindMore }: SuccessStateProps) {
  const router = useRouter()
  const words = query.split(" ").slice(1, 4).join(" ") || "prospects"
  const campaignName = `${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })} — ${words}`

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: EASE }}
      style={{
        position: "fixed", inset: 0, zIndex: 50,
        backgroundColor: "#060606",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: 32,
      }}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        className="animate-orange-burst"
        style={{
          width: 64, height: 64, borderRadius: "50%",
          backgroundColor: "rgba(249,115,22,0.12)",
          display: "flex", alignItems: "center", justifyContent: "center",
          marginBottom: 24,
        }}
      >
        <CheckCircle size={32} color="#f97316" />
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE, delay: 0.1 }}
        style={{ fontSize: 24, fontWeight: 500, color: "#fff", marginBottom: 8 }}
      >
        Campaign created
      </motion.h2>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE, delay: 0.2 }}
        style={{
          marginTop: 24, marginBottom: 32,
          padding: "20px 28px",
          backgroundColor: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 12,
          minWidth: 320,
        }}
      >
        <p style={{ fontSize: 14, fontWeight: 500, color: "#fff", marginBottom: 6 }}>{campaignName}</p>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", marginBottom: 4 }}>{sentCount} emails sent</p>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)" }}>Follow-ups scheduled in 3 days</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, ease: EASE, delay: 0.3 }}
        style={{ display: "flex", gap: 12 }}
      >
        <button
          onClick={() => router.push("/dashboard/campaigns")}
          style={{
            padding: "10px 22px", borderRadius: 8,
            backgroundColor: "#f97316", border: "none",
            color: "#fff", fontSize: 14, fontWeight: 500, cursor: "pointer",
          }}
        >
          View Campaign →
        </button>
        <button
          onClick={onFindMore}
          style={{
            padding: "10px 22px", borderRadius: 8,
            border: "1px solid rgba(255,255,255,0.12)",
            backgroundColor: "transparent", color: "rgba(255,255,255,0.6)",
            fontSize: 14, cursor: "pointer",
          }}
        >
          Find More →
        </button>
      </motion.div>
    </motion.div>
  )
}
