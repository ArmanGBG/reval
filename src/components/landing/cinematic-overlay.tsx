"use client";

import * as React from "react";
import { motion, MotionValue, useTransform } from "framer-motion";

/**
 * Cinematic overlay system for the hero scroll stage.
 *
 * Adds three professional film-grade effects that fade in as the user begins
 * scrolling through the cinematic sequence:
 *
 *  1. Letterbox bars — slim dark bars at top & bottom that emulate a
 *     widescreen cinematic aspect ratio. They grow subtly as the user
 *     scrolls deeper into the narrative.
 *  2. Film grain — a slowly-drifting SVG noise texture that gives the
 *     canvas frames a tactile, analog-film quality.
 *  3. Vignette — a soft radial darkening around the edges that focuses
 *     attention on the center content and adds depth.
 *
 * All effects are `pointer-events-none` and purely cosmetic — they do not
 * affect the canvas playback or any interactive element.
 */
export function CinematicOverlay({
  scrollYProgress,
}: {
  scrollYProgress: MotionValue<number>;
}) {
  // Letterbox bar height: starts slim, grows as scroll progresses
  // Peaks at ~5% of viewport height mid-scroll, eases back near the end
  const barHeight = useTransform(
    scrollYProgress,
    [0, 0.06, 0.5, 0.94, 1],
    ["0vh", "3.5vh", "5vh", "5vh", "0vh"]
  );

  // Letterbox opacity: fade in quickly, hold, fade out at the end
  const barOpacity = useTransform(
    scrollYProgress,
    [0, 0.04, 0.94, 1],
    [0, 1, 1, 0]
  );

  // Film grain opacity: subtle, peaks in the middle of the scroll
  const grainOpacity = useTransform(
    scrollYProgress,
    [0, 0.08, 0.92, 1],
    [0, 0.08, 0.08, 0]
  );

  // Vignette opacity: gentle darkening that breathes with scroll
  const vignetteOpacity = useTransform(
    scrollYProgress,
    [0, 0.08, 0.92, 1],
    [0.15, 0.65, 0.65, 0.15]
  );

  // Subtle scan-line shift for the grain (gives it motion)
  const grainShift = useTransform(
    scrollYProgress,
    [0, 1],
    [0, 100]
  );

  return (
    <>
      {/* ─── Letterbox bars (top & bottom) ─── */}
      <motion.div
        style={{ height: barHeight, opacity: barOpacity }}
        className="pointer-events-none absolute inset-x-0 top-0 z-30 bg-black"
        aria-hidden="true"
      >
        {/* Subtle inner shadow for depth */}
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-b from-mint/15 to-transparent" />
      </motion.div>
      <motion.div
        style={{ height: barHeight, opacity: barOpacity }}
        className="pointer-events-none absolute inset-x-0 bottom-0 z-30 bg-black"
        aria-hidden="true"
      >
        {/* Subtle inner shadow for depth */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-t from-mint/15 to-transparent" />
      </motion.div>

      {/* ─── Film grain (animated noise texture) ─── */}
      <motion.div
        style={{ opacity: grainOpacity }}
        className="pointer-events-none absolute inset-0 z-20 overflow-hidden"
        aria-hidden="true"
      >
        <motion.div
          style={{ x: grainShift }}
          className="absolute -inset-[10%] h-[120%] w-[120%]"
        >
          {/* SVG fractal noise — animated via background-position drift */}
          <div
            className="absolute inset-0 animate-[cinematicGrainShift_8s_steps(10)_infinite]"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.85'/%3E%3C/svg%3E\")",
              backgroundSize: "200px 200px",
              mixBlendMode: "overlay",
            }}
          />
        </motion.div>
      </motion.div>

      {/* ─── Cinematic vignette ─── */}
      <motion.div
        style={{ opacity: vignetteOpacity }}
        className="pointer-events-none absolute inset-0 z-10"
        aria-hidden="true"
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 95% 85% at 50% 45%, transparent 35%, oklch(0 0 0 / 0.55) 100%)",
          }}
        />
        {/* Subtle mint-tinted inner glow for warmth */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 50% 45%, color-mix(in oklch, var(--mint) 4%, transparent) 0%, transparent 70%)",
          }}
        />
      </motion.div>

      {/* ─── Cinematic scan lines (very subtle, CRT-style) ─── */}
      <motion.div
        style={{ opacity: grainOpacity }}
        className="pointer-events-none absolute inset-0 z-20"
        aria-hidden="true"
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent 0px, transparent 2px, oklch(0 0 0 / 0.04) 2px, oklch(0 0 0 / 0.04) 3px)",
            mixBlendMode: "multiply",
          }}
        />
      </motion.div>
    </>
  );
}
