"use client";

import * as React from "react";
import { motion, useScroll, useTransform, MotionValue } from "framer-motion";

/**
 * Subtle parallax grid background.
 * Renders a grid-bg pattern that drifts opposite to scroll progress,
 * giving depth to long sections.
 */
export function ParallaxGrid({
  className,
  strength = 80,
  opacity = 0.3,
}: {
  className?: string;
  strength?: number;
  opacity?: number;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  // Use useTransform to create a scroll-linked translate value
  const y: MotionValue<string> = useTransform(
    scrollYProgress,
    [0, 1],
    [`${strength}px`, `-${strength}px`]
  );

  return (
    <div
      ref={ref}
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className ?? ""}`}
      style={{ opacity }}
      aria-hidden="true"
    >
      <motion.div
        style={{ y }}
        className="grid-bg radial-fade absolute -inset-[100px]"
      />
    </div>
  );
}
