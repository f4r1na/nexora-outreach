"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";

const EASE = [0.23, 1, 0.32, 1] as const;

const variants = {
  hidden: { opacity: 0, x: 12 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.28, ease: EASE },
  },
};

export default function PageWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <motion.div
      key={pathname}
      variants={variants}
      initial={false}
      animate="visible"
      style={{ flex: 1, display: "flex", flexDirection: "column" }}
    >
      {children}
    </motion.div>
  );
}
