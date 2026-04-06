"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LandingCTA() {
  const router = useRouter();
  const [email, setEmail] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    router.push(email ? `/signup?email=${encodeURIComponent(email)}` : "/signup");
  }

  return (
    <form onSubmit={handleSubmit} style={{
      display: "flex", gap: 10, maxWidth: 480, margin: "0 auto",
      flexWrap: "wrap", justifyContent: "center",
    }}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        style={{
          flex: 1, minWidth: 200, padding: "14px 18px",
          backgroundColor: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.11)",
          borderRadius: 10, fontSize: 14, color: "#fff",
          outline: "none", fontFamily: "var(--font-outfit)",
        }}
      />
      <button type="submit" style={{
        padding: "14px 26px",
        backgroundColor: "#FF5200", color: "#fff",
        border: "none", borderRadius: 10,
        fontSize: 14, fontWeight: 800, cursor: "pointer",
        fontFamily: "var(--font-syne)", whiteSpace: "nowrap",
        letterSpacing: "0.01em",
      }}>
        Get Early Access
      </button>
    </form>
  );
}
