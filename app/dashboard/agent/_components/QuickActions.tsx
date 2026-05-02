"use client";
import { BarChart2, Inbox, Plus, Repeat } from "lucide-react";
import { useRouter } from "next/navigation";

interface QuickActionsProps {
  onSend: (message: string) => void;
}

type Action = {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  message?: string;
  href?: string;
};

const ACTIONS: Action[] = [
  { icon: BarChart2, label: "View analytics", message: "Show me my analytics" },
  { icon: Inbox,    label: "Check inbox",    message: "Check my inbox"        },
  { icon: Plus,     label: "New campaign",   href: "/dashboard/campaigns/new"  },
  { icon: Repeat,   label: "Follow-ups",     message: "Show my follow-ups"    },
];

export function QuickActions({ onSend }: QuickActionsProps) {
  const router = useRouter();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {ACTIONS.map(({ icon: Icon, label, message, href }) => (
        <button
          key={label}
          onClick={() => {
            if (href) { router.push(href); return; }
            if (message) onSend(message);
          }}
          style={{
            padding: "6px 10px",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 6,
            fontSize: 13,
            color: "rgba(255,255,255,0.55)",
            cursor: "pointer",
            textAlign: "left",
            display: "flex",
            alignItems: "center",
            gap: 8,
            minHeight: 48,
            fontFamily: "var(--font-outfit)",
            transition: "background 150ms, color 150ms",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.06)";
            e.currentTarget.style.color = "#fff";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.03)";
            e.currentTarget.style.color = "rgba(255,255,255,0.55)";
          }}
        >
          <Icon size={15} />
          {label}
        </button>
      ))}
    </div>
  );
}
