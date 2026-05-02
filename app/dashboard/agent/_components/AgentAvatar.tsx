"use client";
import { motion, useReducedMotion } from "framer-motion";

export function AgentAvatar({ isLoading }: { isLoading: boolean }) {
  const prefersReduced = useReducedMotion();

  return (
    <motion.div
      animate={
        isLoading && !prefersReduced
          ? {
              scale: [1, 1.08, 1],
              boxShadow: [
                "0 0 0px rgba(255,82,0,0)",
                "0 0 16px rgba(255,82,0,0.5)",
                "0 0 0px rgba(255,82,0,0)",
              ],
            }
          : { scale: 1, boxShadow: "0 0 0px rgba(255,82,0,0)" }
      }
      transition={
        isLoading && !prefersReduced
          ? { repeat: Infinity, duration: 1.2 }
          : {}
      }
      style={{
        width: 32,
        height: 32,
        borderRadius: "50%",
        background: "linear-gradient(135deg, #FF5200, #F59E0B)",
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 10,
        fontWeight: 700,
        color: "#fff",
        fontFamily: "var(--font-space-grotesk)",
      }}
    >
      N
    </motion.div>
  );
}
