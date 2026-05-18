"use client"
import { createContext, useContext, useState, useCallback, type ReactNode } from "react"

type AgentContextType = {
  isWorking: boolean
  taskText: string
  startWork: (initialTask?: string) => void
  stopWork: () => void
  setTaskText: (text: string) => void
}

const AgentContext = createContext<AgentContextType | null>(null)

export function AgentProvider({ children }: { children: ReactNode }) {
  const [isWorking, setIsWorking] = useState(false)
  const [taskText, setTaskText] = useState("")

  const startWork = useCallback((initialTask = "Working...") => {
    setTaskText(initialTask)
    setIsWorking(true)
  }, [])

  const stopWork = useCallback(() => {
    setIsWorking(false)
    setTaskText("")
  }, [])

  return (
    <AgentContext.Provider value={{ isWorking, taskText, startWork, stopWork, setTaskText }}>
      {children}
    </AgentContext.Provider>
  )
}

export function useAgent() {
  const ctx = useContext(AgentContext)
  if (!ctx) throw new Error("useAgent must be used within AgentProvider")
  return ctx
}
