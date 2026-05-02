"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { ContextPanel } from "./ContextPanel";
import { QuickActions } from "./QuickActions";
import { RecentChats } from "./RecentChats";

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
    <div style={{ flex: 1, overflowY: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <p style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>Active Campaign</p>
        <ContextPanel />
      </div>
      <div>
        <p style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Quick Actions</p>
        <QuickActions onSend={onSend} />
      </div>
      <div>
        <p style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Recent Chats</p>
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
                position: "fixed", bottom: 0, left: 0, right: 0,
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
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontFamily: "var(--font-outfit)" }}>Context Panel</span>
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

  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          id="agent-sidebar"
          key="desktop-sidebar"
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: "45%", opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          style={{
            background: "#070710",
            borderLeft: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          <div style={{ padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Context Panel</span>
          </div>
          <SidebarBody onSend={onSend} currentChatId={currentChatId} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
