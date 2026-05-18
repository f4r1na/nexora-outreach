"use client"
import { type ReactNode } from "react"
import { AgentProvider } from "@/contexts/agent-context"
import Topbar from "./topbar"
import GalaxyPanel from "./galaxy-panel"

export default function DashboardShell({
  children,
  userName,
}: {
  children: ReactNode
  userName: string
}) {
  return (
    <AgentProvider>
      <div style={{
        height: "100vh", display: "flex", flexDirection: "column",
        background: "#030303", overflow: "hidden",
      }}>
        <Topbar userName={userName} />
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          <GalaxyPanel />
          <main style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            {children}
          </main>
        </div>
      </div>
    </AgentProvider>
  )
}
