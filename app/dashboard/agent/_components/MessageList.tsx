"use client";
import { Message } from "ai";
import { useEffect, useRef } from "react";
import { AgentAvatar } from "./AgentAvatar";
import { MessageBubble } from "./MessageBubble";
import { WelcomeCard } from "./WelcomeCard";

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  freshMessageIds: Set<string>;
  onSend?: (msg: string) => void;
}

export function MessageList({ messages, isLoading, freshMessageIds, onSend }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isLoading]);

  const showThinking =
    isLoading &&
    messages.length > 0 &&
    messages[messages.length - 1].role === "user";

  return (
    <div
      role="log"
      aria-live="polite"
      aria-label="Conversation"
      aria-busy={isLoading}
      style={{
        flex: 1,
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        overflowY: "auto",
      }}
    >
      {messages.map((msg, i) =>
        msg.id === "welcome" ? (
          <WelcomeCard key={msg.id} onSend={onSend ?? (() => {})} />
        ) : (
          <MessageBubble
            key={msg.id}
            role={msg.role as "user" | "assistant"}
            content={msg.content}
            isFresh={freshMessageIds.has(msg.id)}
            isLast={i === messages.length - 1}
            isLoading={isLoading}
          />
        )
      )}
      {showThinking && (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
          <AgentAvatar isLoading={true} />
          <div
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "4px 12px 12px 12px",
              padding: "12px 16px",
              display: "flex",
              gap: 5,
              alignItems: "center",
            }}
          >
            {[0, 1, 2].map((dot) => (
              <span
                key={dot}
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.4)",
                  display: "inline-block",
                  animation: "wiz-think 1.2s ease-in-out infinite",
                  animationDelay: `${dot * 0.15}s`,
                }}
              />
            ))}
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
