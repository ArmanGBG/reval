"use client";

import * as React from "react";
import { motion, useScroll, useSpring } from "framer-motion";

/**
 * A thin mint gradient bar fixed at the very top of the viewport
 * that fills left-to-right as the user scrolls the entire page.
 * Positioned at z-[60] so it sits above the header.
 */
export function ScrollProgressBar() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <motion.div
      className="fixed inset-x-0 top-0 z-[60] h-[3px] origin-left bg-gradient-to-l from-mint-bright via-mint to-mint/70"
      style={{ scaleX }}
    />
  );
}
