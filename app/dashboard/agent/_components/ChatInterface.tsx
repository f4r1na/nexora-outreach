"use client";
import { Message, useChat } from "ai/react";
import { motion, useReducedMotion } from "framer-motion";
import { PanelRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { loadChat, saveChat } from "../_lib/storage";
import { ChatMessage } from "../_lib/types";
import { AgentAvatar } from "./AgentAvatar";
import { InputArea } from "./InputArea";
import { MessageList } from "./MessageList";
import { Sidebar } from "./Sidebar";

interface ChatInterfaceProps {
  chatId: string;
}

const WELCOME: Message = {
  id: "welcome",
  role: "assistant",
  content: "Hey, I'm your Nexora agent. Ask me about campaigns, leads, analytics, or tell me what you want to do.",
};

export function ChatInterface({ chatId }: ChatInterfaceProps) {
  const prefersReduced = useReducedMotion();
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const freshIds = useRef<Set<string>>(new Set());
  const seenIds = useRef<Set<string>>(new Set(["welcome"]));

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    setIsMobile(mq.matches);
    setSidebarOpen(!mq.matches);
    function handler(e: MediaQueryListEvent) {
      setIsMobile(e.matches);
      if (e.matches) setSidebarOpen(false);
    }
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const stored = loadChat(chatId) as Message[];

  const { messages, input, handleInputChange, handleSubmit, isLoading, append } = useChat({
    api: "/api/chat",
    id: chatId,
    initialMessages: stored.length > 0 ? stored : [WELCOME],
  });

  useEffect(() => {
    const toSave = messages.filter((m) => m.id !== "welcome") as unknown as ChatMessage[];
    if (toSave.length > 0) {
      saveChat(chatId, toSave);
    }
  }, [chatId, messages]);

  useEffect(() => {
    for (const msg of messages) {
      if (!seenIds.current.has(msg.id)) {
        seenIds.current.add(msg.id);
        if (msg.role === "assistant") {
          freshIds.current.add(msg.id);
        }
      }
    }
  }, [messages]);

  function handleQuickAction(message: string) {
    append({ role: "user", content: message });
  }

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#080810", overflow: "hidden" }}>
      {/* Header */}
      <motion.div
        initial={prefersReduced ? false : { y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        style={{ padding: "0 16px", height: 52, borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}
      >
        <AgentAvatar isLoading={false} />
        <span style={{ fontSize: 14, color: "#fff", fontFamily: "var(--font-space-grotesk)", fontWeight: 600 }}>Nexora Agent</span>
        <button
          onClick={() => setSidebarOpen((o) => !o)}
          aria-expanded={sidebarOpen}
          aria-controls="agent-sidebar"
          aria-label="Toggle sidebar"
          style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)", padding: 4, minWidth: 48, minHeight: 48, display: "flex", alignItems: "center", justifyContent: "center", transition: "color 150ms" }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "#fff"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.4)"; }}
        >
          <motion.div animate={{ rotate: sidebarOpen ? 180 : 0 }} transition={{ duration: 0.3 }} style={{ display: "flex" }}>
            <PanelRight size={18} />
          </motion.div>
        </button>
      </motion.div>

      {/* Body */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Chat column */}
        <motion.main
          role="main"
          initial={prefersReduced ? false : { y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}
        >
          <MessageList messages={messages} isLoading={isLoading} freshMessageIds={freshIds.current} onSend={handleQuickAction} />
          <InputArea input={input} onChange={handleInputChange} onSubmit={handleSubmit} isLoading={isLoading} />
        </motion.main>

        {/* Desktop sidebar */}
        {!isMobile && (
          <motion.div
            initial={prefersReduced ? false : { y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            style={{ display: "flex" }}
          >
            <Sidebar isOpen={sidebarOpen} isMobile={false} onClose={() => setSidebarOpen(false)} onSend={handleQuickAction} currentChatId={chatId} />
          </motion.div>
        )}
      </div>

      {/* Mobile sidebar modal */}
      {isMobile && (
        <Sidebar isOpen={sidebarOpen} isMobile={true} onClose={() => setSidebarOpen(false)} onSend={handleQuickAction} currentChatId={chatId} />
      )}
    </div>
  );
}
