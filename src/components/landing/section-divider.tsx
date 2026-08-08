"use client";

import * as React from "react";
import { motion } from "framer-motion";

/**
 * WaveDivider — An SVG wave shape with animated gradient fill.
 * Creates a smooth sine-wave divider between sections.
 * The gradient subtly shifts horizontally with a slow animation.
 *
 * @param flip  - Flip the wave upside down (for alternating between sections)
 * @param className - Additional CSS classes
 */
export function WaveDivider({
  flip = false,
  className,
}: {
  flip?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`relative w-full h-[40px] overflow-hidden ${className ?? ""}`}
      aria-hidden="true"
    >
      <motion.svg
        viewBox="0 0 1440 40"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full"
        style={{
          transform: flip ? "scaleY(-1)" : undefined,
        }}
        initial={{ x: 0 }}
        animate={{ x: [0, -40, 0] }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <defs>
          <linearGradient id="waveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--mint)" stopOpacity="0" />
            <stop offset="30%" stopColor="var(--mint)" stopOpacity="0.04" />
            <stop offset="50%" stopColor="var(--mint-bright)" stopOpacity="0.06" />
            <stop offset="70%" stopColor="var(--mint)" stopOpacity="0.04" />
            <stop offset="100%" stopColor="var(--mint)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M0,20 C360,0 720,40 1080,20 C1260,10 1440,20 1440,20 L1440,40 L0,40 Z"
          fill="url(#waveGrad)"
        />
        {/* Extended path beyond viewBox for seamless shift */}
        <path
          d="M1440,20 C1800,0 2160,40 2520,20 C2700,10 2880,20 2880,20 L2880,40 L1440,40 Z"
          fill="url(#waveGrad)"
        />
      </motion.svg>
    </div>
  );
}

/**
 * GradientLineDivider — A thin horizontal gradient line with a glowing center dot.
 * The line fades from transparent → mint/30 → transparent,
 * with a brighter pulsing glow at the center.
 */
export function GradientLineDivider({
  className,
}: {
  className?: string;
}) {
  return (
    <div
      className={`relative w-full h-4 flex items-center justify-center ${className ?? ""}`}
      aria-hidden="true"
    >
      {/* Gradient line */}
      <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-[color-mix(in_oklch,var(--mint)_30%,transparent)] to-transparent" />

      {/* Center glow dot */}
      <motion.div
        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 left-1/2 w-8 h-8 rounded-full"
        style={{
          background:
            "radial-gradient(circle, color-mix(in oklch, var(--mint-bright) 50%, transparent) 0%, transparent 70%)",
        }}
        animate={{
          opacity: [0.6, 1, 0.6],
          scale: [1, 1.3, 1],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Small bright center point */}
      <motion.div
        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 left-1/2 w-1.5 h-1.5 rounded-full"
        style={{
          background: "var(--mint-bright)",
        }}
        animate={{
          opacity: [0.8, 1, 0.8],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}
