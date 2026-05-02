"use client";

export default function LoadingDots({ size = 5, color = "rgba(255,82,0,0.7)", gap = 4 }: {
  size?: number;
  color?: string;
  gap?: number;
}) {
  return (
    <span
      className="dot-loader"
      aria-label="Loading"
      role="status"
      style={{ display: "inline-flex", alignItems: "center", gap }}
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: size,
            height: size,
            borderRadius: "50%",
            background: color,
            display: "inline-block",
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
    </span>
  );
}
