import { CSSProperties } from "react";

interface IconProps {
  size?: number;
  style?: CSSProperties;
  className?: string;
}

export function NexoraIcon({ size = 28, style, className }: IconProps) {
  const gradId = "nexora-n-grad";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={style}
      className={className}
    >
      <defs>
        <linearGradient id={gradId} x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FF5200" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
      </defs>

      {/* Left vertical */}
      <path d="M4 4 H9 V28 H4 Z" fill="#FF5200" />
      {/* Diagonal (orange → amber) */}
      <path d="M9 4 H14 L23 28 H18 Z" fill={`url(#${gradId})`} />
      {/* Right vertical */}
      <path d="M23 4 H28 V28 H23 Z" fill="#FF5200" />
    </svg>
  );
}

export function NexoraLogo({
  size = 28,
  style,
  className,
  wordmarkSize = 15,
  color = "#fff",
}: IconProps & { wordmarkSize?: number; color?: string }) {
  return (
    <span
      className={className}
      style={{ display: "inline-flex", alignItems: "center", gap: 9, ...style }}
    >
      <NexoraIcon size={size} />
      <span
        style={{
          fontSize: wordmarkSize,
          fontWeight: 700,
          color,
          fontFamily: "var(--font-space-grotesk)",
          letterSpacing: "-0.03em",
          lineHeight: 1,
        }}
      >
        Nexora
      </span>
    </span>
  );
}
