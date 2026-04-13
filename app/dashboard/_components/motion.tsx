"use client";

/**
 * Lightweight motion primitives for the dashboard.
 * Uses framer-motion for JS-driven animations (count-up, stagger, page fade).
 * CSS handles hover/press states for performance.
 */

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useInView,
  AnimatePresence,
  type Variants,
} from "framer-motion";

// re-export AnimatePresence for use by other client components
export { AnimatePresence };

// ─── Easing ──────────────────────────────────────────────────────────────────
const EASE_OUT = [0.23, 1, 0.32, 1] as const;
const EASE_IN_OUT = [0.77, 0, 0.175, 1] as const;

// ─── PageWrapper ──────────────────────────────────────────────────────────────
// Wraps page content with a smooth fade-in on mount.
export function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: EASE_OUT }}
    >
      {children}
    </motion.div>
  );
}

// ─── StaggerList ──────────────────────────────────────────────────────────────
// Animates children in with a stagger.
const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.055, delayChildren: 0.04 },
  },
};

const staggerItem: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: EASE_OUT },
  },
};

export function StaggerList({
  children,
  className,
  style,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  delay?: number;
}) {
  return (
    <motion.div
      className={className}
      style={style}
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      transition={{ delayChildren: delay }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <motion.div className={className} style={style} variants={staggerItem}>
      {children}
    </motion.div>
  );
}

// ─── CountUp ─────────────────────────────────────────────────────────────────
// Animates a number from 0 to target on mount.
export function CountUp({
  value,
  duration = 900,
  suffix = "",
  style,
}: {
  value: number | string;
  duration?: number;
  suffix?: string;
  style?: React.CSSProperties;
}) {
  const numericValue = typeof value === "number" ? value : NaN;
  const [display, setDisplay] = useState<string | number>(
    isNaN(numericValue) ? value : 0
  );
  const started = useRef(false);

  useEffect(() => {
    if (isNaN(numericValue) || started.current) return;
    started.current = true;
    if (numericValue === 0) { setDisplay(0); return; }

    const start = performance.now();
    function frame(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * numericValue);
      setDisplay(current);
      if (progress < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }, [numericValue, duration]);

  return (
    <span style={style}>
      {display}
      {suffix}
    </span>
  );
}

// ─── ScrollReveal ─────────────────────────────────────────────────────────────
// Fades + slides up when scrolled into view.
export function ScrollReveal({
  children,
  className,
  style,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      className={className}
      style={style}
      initial={{ opacity: 0, y: 12 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.38, ease: EASE_OUT, delay }}
    >
      {children}
    </motion.div>
  );
}

// ─── AnimatedRow ──────────────────────────────────────────────────────────────
// For table rows that stagger in. Use inside StaggerList.
export function AnimatedRow({
  children,
  style,
  className,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      style={style}
      variants={staggerItem}
    >
      {children}
    </motion.div>
  );
}

// ─── FadePresence ─────────────────────────────────────────────────────────────
// AnimatePresence wrapper for conditional rendering.
export function FadePresence({ children, show }: { children: React.ReactNode; show: boolean }) {
  return (
    <AnimatePresence mode="wait">
      {show && (
        <motion.div
          key="content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

