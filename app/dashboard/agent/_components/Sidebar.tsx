"use client";
import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";
import { useEffect } from "react";
import { ContextPanel } from "./ContextPanel";
import { QuickActions } from "./QuickActions";
import { RecentChats } from "./RecentChats";

const SIDEBAR_WIDTH = 400;

const CAPABILITIES = [
  "Analyze campaign performance",
  "Draft personalized emails",
  "Identify follow-up opportunities",
  "Summarize inbox replies",
];

interface SidebarProps {
  isOpen: boolean;
  isMobile: boolean;
  onClose: () => void;
  onSend: (message: string) => void;
  currentChatId: string;
}

function SidebarBody({
  onSend,
  currentChatId,
}: {
  onSend: (message: string) => void;
  currentChatId: string;
}) {
  return (
    <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
      {/* Active Campaign */}
      <div style={{ padding: "20px 16px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <p style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12, fontFamily: "var(--font-space-grotesk)" }}>
          Active Campaign
        </p>
        <ContextPanel />
      </div>

      {/* Quick Actions */}
      <div style={{ padding: "20px 16px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <p style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12, fontFamily: "var(--font-space-grotesk)" }}>
          Quick Actions
        </p>
        <QuickActions onSend={onSend} />
      </div>

      {/* Agent Capabilities */}
      <div style={{ padding: "20px 16px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <p style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12, fontFamily: "var(--font-space-grotesk)" }}>
          Agent Capabilities
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {CAPABILITIES.map((cap) => (
            <div key={cap} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <Check size={14} color="#00D084" strokeWidth={2.5} style={{ flexShrink: 0, marginTop: 1 }} />
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", fontFamily: "var(--font-outfit)", lineHeight: 1.4 }}>
                {cap}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Chats */}
      <div style={{ padding: "20px 16px 24px" }}>
        <p style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12, fontFamily: "var(--font-space-grotesk)" }}>
          Recent Chats
        </p>
        <RecentChats currentChatId={currentChatId} />
      </div>
    </div>
  );
}

export function Sidebar({ isOpen, isMobile, onClose, onSend, currentChatId }: SidebarProps) {
  useEffect(() => {
    if (!isMobile) return;
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) onClose();
    }
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isMobile, isOpen, onClose]);

  if (isMobile) {
    return (
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 40 }}
            />
            <motion.div
              id="agent-sidebar"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              style={{
                position: "fixed",
                bottom: 0,
                left: 0,
                right: 0,
                background: "#070710",
                borderTop: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "16px 16px 0 0",
                zIndex: 50,
                maxHeight: "80vh",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.5)", fontFamily: "var(--font-outfit)" }}>
                  Context Panel
                </span>
                <button
                  onClick={onClose}
                  aria-label="Close sidebar"
                  style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.5)", minWidth: 48, minHeight: 48, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontFamily: "var(--font-outfit)" }}
                >
                  Close
                </button>
              </div>
              <SidebarBody onSend={onSend} currentChatId={currentChatId} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }

  // Desktop: outer div animates width 0→400px with overflow:hidden
  // Inner div is always 400px wide so content never squishes during animation
  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          key="sidebar-outer"
          initial={{ width: 0 }}
          animate={{ width: SIDEBAR_WIDTH }}
          exit={{ width: 0 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          style={{ flexShrink: 0, overflow: "hidden" }}
        >
          <div
            id="agent-sidebar"
            style={{
              width: SIDEBAR_WIDTH,
              height: "100%",
              background: "#070710",
              borderLeft: "1px solid rgba(255,255,255,0.06)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "var(--font-space-grotesk)" }}>
                Context Panel
              </span>
            </div>
            <SidebarBody onSend={onSend} currentChatId={currentChatId} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
