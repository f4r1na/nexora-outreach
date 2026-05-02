"use client";
import { motion, useReducedMotion } from "framer-motion";
import { AgentAvatar } from "./AgentAvatar";
import { CopyButton } from "./CopyButton";
import { useTypewriter } from "../_hooks/useTypewriter";

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  isFresh: boolean;
  isLast: boolean;
  isLoading: boolean;
}

function AgentContent({ content, active }: { content: string; active: boolean }) {
  const text = useTypewriter(content, active);
  return <span style={{ whiteSpace: "pre-wrap" }}>{text}</span>;
}

export function MessageBubble({
  role,
  content,
  isFresh,
  isLast,
  isLoading,
}: MessageBubbleProps) {
  const isUser = role === "user";
  const prefersReduced = useReducedMotion();

  return (
    <motion.div
      initial={prefersReduced ? false : { x: isUser ? 20 : -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        alignItems: "flex-start",
        gap: 8,
      }}
    >
      {!isUser && <AgentAvatar isLoading={isLoading && isLast} />}
      <div
        style={{
          maxWidth: "75%",
          display: "flex",
          flexDirection: "column",
          alignItems: isUser ? "flex-end" : "flex-start",
        }}
      >
        <div
          style={{
            background: isUser ? "rgba(255,82,0,0.12)" : "rgba(255,255,255,0.05)",
            border: `1px solid ${isUser ? "rgba(255,82,0,0.2)" : "rgba(255,255,255,0.08)"}`,
            borderRadius: isUser ? "12px 4px 12px 12px" : "4px 12px 12px 12px",
            padding: "10px 14px",
            fontSize: 14,
            color: isUser ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.82)",
            lineHeight: 1.6,
            fontFamily: "var(--font-outfit)",
          }}
        >
          {isUser ? (
            <span style={{ whiteSpace: "pre-wrap" }}>{content}</span>
          ) : (
            <AgentContent
              content={content}
              active={isFresh && isLast && !isLoading}
            />
          )}
        </div>
        {!isUser && (
          <div style={{ marginTop: 2 }}>
            <CopyButton text={content} />
          </div>
        )}
      </div>
    </motion.div>
  );
}
