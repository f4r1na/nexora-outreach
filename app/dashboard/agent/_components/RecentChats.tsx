"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { loadIndex } from "../_lib/storage";
import { ChatIndexEntry } from "../_lib/types";

interface RecentChatsProps {
  currentChatId: string;
}

export function RecentChats({ currentChatId }: RecentChatsProps) {
  const [chats, setChats] = useState<ChatIndexEntry[]>([]);

  useEffect(() => {
    setChats(loadIndex());
  }, [currentChatId]);

  return (
    <div>
      <Link
        href="/dashboard/agent"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "6px 10px",
          background: "rgba(255,82,0,0.08)",
          border: "1px solid rgba(255,82,0,0.2)",
          borderRadius: 6,
          fontSize: 12,
          color: "#FF5200",
          textDecoration: "none",
          marginBottom: 6,
          minHeight: 36,
          fontFamily: "var(--font-outfit)",
          fontWeight: 500,
        }}
      >
        New chat
      </Link>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {chats.map((chat) => (
          <Link
            key={chat.id}
            href={`/dashboard/agent/${chat.id}`}
            style={{
              padding: "5px 8px",
              borderRadius: 5,
              fontSize: 13,
              color: chat.id === currentChatId ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.35)",
              background: chat.id === currentChatId ? "rgba(255,82,0,0.08)" : "transparent",
              border: chat.id === currentChatId ? "1px solid rgba(255,82,0,0.15)" : "1px solid transparent",
              textDecoration: "none",
              display: "block",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              fontFamily: "var(--font-outfit)",
              minHeight: 32,
            }}
          >
            {chat.title}
          </Link>
        ))}
        {chats.length === 0 && (
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", padding: "4px 8px", fontFamily: "var(--font-outfit)" }}>
            No recent chats
          </p>
        )}
      </div>
    </div>
  );
}
