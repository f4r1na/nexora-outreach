import { ShieldCheck, XCircle, Gift, Clock } from "lucide-react";

const ITEMS = [
  { Icon: XCircle,     text: "No credit card required" },
  { Icon: ShieldCheck, text: "Cancel anytime"          },
  { Icon: Gift,        text: "10 free emails to start" },
  { Icon: Clock,       text: "Setup in 2 minutes"      },
];

export function TrustBar() {
  return (
    <div style={{
      display: "flex", flexWrap: "wrap", justifyContent: "center",
      gap: "10px 24px",
      marginTop: 22,
    }}>
      {ITEMS.map(({ Icon, text }) => (
        <div key={text} style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
          <Icon size={13} color="rgba(245,158,11,0.85)" />
          <span style={{ fontSize: 12.5, color: "rgba(255,255,255,0.55)" }}>{text}</span>
        </div>
      ))}
    </div>
  );
}
