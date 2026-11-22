"use client";

import React from "react";
import { motion, useReducedMotion } from "motion/react";

/* --------------------------------------------------------------------------
   Logo: a qubit's Bloch sphere (ring + equator) whose ring is broken and is closed
   by the state-vector dot: a qubit that heals itself. Colours follow the theme:
   the ring uses currentColor, the state dot uses the palette accent.
   -------------------------------------------------------------------------- */

// Ring arc from -20° clockwise round to -70° (gap at the upper right), r = 12 about (16, 16).
const RING = "M27.28 11.9 A12 12 0 1 1 20.1 4.72";

export const LogoMark: React.FC<{ className?: string; animate?: boolean; title?: string }> = ({
  className = "w-8 h-8",
  animate = true,
  title = "Self-Healing QML",
}) => {
  const reduce = useReducedMotion();
  const draw = animate && !reduce;
  return (
    <svg viewBox="0 0 32 32" className={className} role="img" aria-label={title} fill="none">
      <ellipse cx="16" cy="16" rx="12" ry="4.2" stroke="currentColor" strokeWidth="1.2" opacity="0.35" />
      <motion.path
        d={RING}
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        initial={{ pathLength: draw ? 0 : 1 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.9, ease: [0.23, 1, 0.32, 1] }}
      />
      <motion.line
        x1="16"
        y1="16"
        x2="24.49"
        y2="7.51"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        initial={{ pathLength: draw ? 0 : 1 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, delay: draw ? 0.5 : 0, ease: [0.23, 1, 0.32, 1] }}
      />
      <circle cx="16" cy="16" r="1.3" fill="currentColor" />
      <motion.circle
        cx="24.49"
        cy="7.51"
        r="2.8"
        fill="var(--accent)"
        style={{ transformOrigin: "24.49px 7.51px" }}
        initial={{ scale: draw ? 0 : 1 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", bounce: 0.35, duration: 0.6, delay: draw ? 0.85 : 0 }}
      />
    </svg>
  );
};

export const Logo: React.FC<{ className?: string; compact?: boolean; textClassName?: string }> = ({ className = "", compact = false, textClassName = "" }) => (
  <span className={`inline-flex items-center gap-2.5 select-none whitespace-nowrap ${className}`}>
    <LogoMark className="w-7 h-7 shrink-0" />
    <span className={`leading-none ${textClassName}`}>
      <span className="block font-display font-bold tracking-[-0.02em] text-[0.95rem]">Self-Healing</span>
      {!compact && <span className="block type-label opacity-60 mt-0.5 !text-[0.6rem]">Quantum ML</span>}
    </span>
  </span>
);
