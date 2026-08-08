"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "./logo";

/**
 * Reval branded loading screen — brief branded splash that fades out
 * after the logo animation plays. Does NOT wait for scroll frames;
 * the canvas renders progressively as frames load in the background.
 */
export function LoadingScreen() {
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(false);

  // Fade out after a short branded splash (~1.2s total)
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 900);
    return () => clearTimeout(timer);
  }, []);

  if (done) return null;

  return (
    <AnimatePresence onExitComplete={() => setDone(true)}>
      {loading && (
        <motion.div
          key="loading-overlay"
          initial={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background"
          dir="rtl"
        >
          {/* Logo with pulsing mint glow */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: 1,
              scale: 1,
              boxShadow: [
                "0 0 20px color-mix(in oklch, var(--mint) 20%, transparent)",
                "0 0 40px color-mix(in oklch, var(--mint) 40%, transparent), 0 0 80px color-mix(in oklch, var(--mint) 15%, transparent)",
                "0 0 20px color-mix(in oklch, var(--mint) 20%, transparent)",
              ],
            }}
            transition={{
              opacity: { duration: 0.4, delay: 0.1 },
              scale: { duration: 0.5, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] },
              boxShadow: {
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.5,
              },
            }}
            className="rounded-2xl p-3"
          >
            <Logo size={36} showWord className="text-foreground" />
          </motion.div>

          {/* Subtle bottom decorative dots */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-12 flex gap-1.5"
          >
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="block h-1 w-1 rounded-full bg-mint/40"
                animate={{ opacity: [0.3, 0.8, 0.3] }}
                transition={{
                  duration: 1.4,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.25,
                }}
              />
            ))}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
