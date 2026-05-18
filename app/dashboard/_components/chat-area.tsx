"use client"
import { useState, useRef, useEffect, useCallback } from "react"
import { useAgent } from "@/contexts/agent-context"
import DataCard from "./data-card"
import ThinkingIndicator from "./thinking-indicator"

const CTX_TAGS = ["Signals","Campaigns","Inbox","Follow-ups","Analytics","Ghostwriter","Settings","Export"]

const TASK_MESSAGES = [
  "Parsing your request...",
  "Fetching your data...",
  "Cross-referencing signals...",
  "Analyzing campaigns...",
  "Preparing results...",
]

type AgentItem = { id: string; title: string; subtitle: string; meta?: string; status?: string }
type AgentResult = { intent: string; summary: string; items: AgentItem[]; action?: { label: string; href: string } }

type Message =
  | { role: "ai";   text: string; result?: AgentResult; time: string }
  | { role: "user"; text: string; time: string }

function now() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

function greeting(name: string) {
  const h = new Date().getHours()
  const g = h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening"
  return `${g}, ${name}. I'm monitoring your outreach universe -- signals, campaigns, inbox, and follow-ups. What do you want to work on?`
}

export default function ChatArea({ userName }: { userName: string }) {
  const { isWorking, startWork, stopWork, setTaskText } = useAgent()
  const [messages, setMessages] = useState<Message[]>([
    { role: "ai", text: greeting(userName), time: now() },
  ])
  const [input, setInput]       = useState("")
  const [taskText, setLocalTask] = useState("")
  const bottomRef = useRef<HTMLDivElement>(null)
  const taskRef   = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isWorking])

  const runTask = useCallback(async (prompt: string) => {
    if (isWorking) return
    startWork(TASK_MESSAGES[0])
    setLocalTask(TASK_MESSAGES[0])

    let idx = 0
    taskRef.current = setInterval(() => {
      idx = (idx + 1) % TASK_MESSAGES.length
      const t = TASK_MESSAGES[idx]
      setTaskText(t)
      setLocalTask(t)
    }, 1800)

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      })

      if (!res.ok || !res.body) throw new Error("Agent unavailable")

      const reader  = res.body.getReader()
      const decoder = new TextDecoder()
      let   result: AgentResult | null = null
      let   buf  = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += decoder.decode(value, { stream: true })
        const lines = buf.split("\n")
        buf = lines.pop() ?? ""

        for (const line of lines) {
          if (!line.startsWith("data:")) continue
          try {
            const ev = JSON.parse(line.slice(5).trim())
            if (ev.type === "step")   { setTaskText(ev.message); setLocalTask(ev.message) }
            if (ev.type === "result") result = ev.data as AgentResult
          } catch { /* ignore parse errors */ }
        }
      }

      if (result) {
        setMessages(prev => [...prev, {
          role: "ai",
          text: result!.summary,
          result: result!,
          time: now(),
        }])
      }
    } catch {
      setMessages(prev => [...prev, {
        role: "ai",
        text: "Something went wrong. Try again or check your connection.",
        time: now(),
      }])
    } finally {
      if (taskRef.current) clearInterval(taskRef.current)
      stopWork()
    }
  }, [isWorking, startWork, stopWork, setTaskText])

  const handleSend = useCallback(() => {
    const text = input.trim()
    if (!text || isWorking) return
    setMessages(prev => [...prev, { role: "user", text, time: now() }])
    setInput("")
    runTask(text)
  }, [input, isWorking, runTask])

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "#050505" }}>
      <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px", display: "flex", flexDirection: "column", gap: 0, scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.05) transparent" }}>
        <div style={{ textAlign: "center", fontSize: 9, fontFamily: "monospace", color: "rgba(255,255,255,0.12)", letterSpacing: "0.16em", textTransform: "uppercase" as const, marginBottom: 24 }}>
          {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
        </div>

        {messages.map((msg, i) =>
          msg.role === "ai" ? (
            <div key={i} style={{ display: "flex", gap: 14, marginBottom: 24, alignItems: "flex-start", maxWidth: 720 }}>
              <div style={{ width: 28, height: 28, flexShrink: 0, background: "rgba(255,107,53,0.08)", border: "1px solid rgba(255,107,53,0.18)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#FF6B35", fontFamily: "monospace", animation: isWorking && i === messages.length-1 ? "gAvatarPulse 1s ease-in-out infinite" : "none" }}>
                NX
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 9, fontFamily: "monospace", color: "#FF6B35", letterSpacing: "0.14em", textTransform: "uppercase" as const, marginBottom: 7, display: "flex", alignItems: "center", gap: 8 }}>
                  Nexora AI <span style={{ color: "rgba(255,255,255,0.12)" }}>{msg.time}</span>
                </div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.68)", lineHeight: 1.7 }}>{msg.text}</div>
                {msg.result && (
                  <DataCard
                    header={msg.result.intent}
                    subheader={msg.result.action ? `${msg.result.items.length} shown` : undefined}
                    items={msg.result.items.map(it => ({
                      id: it.id, title: it.title, subtitle: it.subtitle,
                      meta: it.meta, status: it.status ?? "white",
                    }))}
                    actions={msg.result.action ? [{ label: msg.result.action.label, href: msg.result.action.href, primary: true }] : []}
                  />
                )}
              </div>
            </div>
          ) : (
            <div key={i} style={{ display: "flex", justifyContent: "flex-end", marginBottom: 24 }}>
              <div style={{ background: "rgba(255,107,53,0.05)", border: "1px solid rgba(255,107,53,0.1)", padding: "10px 16px", maxWidth: 500, fontSize: 13, color: "rgba(255,255,255,0.75)", lineHeight: 1.6 }}>
                {msg.text}
              </div>
            </div>
          )
        )}

        {isWorking && <ThinkingIndicator taskText={taskText} />}
        <div ref={bottomRef} />
      </div>

      <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "14px 32px 20px", background: "#050505" }}>
        <div style={{ display: "flex", gap: 5, marginBottom: 10, flexWrap: "wrap" as const }}>
          {CTX_TAGS.map(tag => (
            <div key={tag} style={{ fontSize: 9, fontFamily: "monospace", letterSpacing: "0.1em", padding: "3px 10px", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.22)", textTransform: "uppercase" as const, cursor: "pointer" }}>
              {tag}
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend() } }}
            placeholder="Ask anything -- find prospects, show campaigns, check inbox, draft emails..."
            style={{ flex: 1, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", padding: "11px 16px", fontSize: 13, color: "rgba(255,255,255,0.8)", fontFamily: "inherit", resize: "none", outline: "none", height: 44, lineHeight: 1.4 }}
          />
          <button onClick={handleSend} disabled={isWorking} style={{ width: 44, height: 44, flexShrink: 0, background: "rgba(255,107,53,0.08)", border: "1px solid rgba(255,107,53,0.22)", color: "#FF6B35", fontSize: 16, cursor: isWorking ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: isWorking ? 0.5 : 1 }}>
            &#x2192;
          </button>
        </div>
        <div style={{ fontSize: 9, fontFamily: "monospace", color: "rgba(255,255,255,0.1)", letterSpacing: "0.08em", marginTop: 8 }}>
          Enter to send &nbsp;&middot;&nbsp; Shift+Enter for new line
        </div>
      </div>
    </div>
  )
}
