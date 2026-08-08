"use client";

import * as React from "react";
import { motion } from "framer-motion";

/* ────────────────────────────────────────────────────────────────
   InteractiveParticles — mouse-reactive particle mesh background
   ──────────────────────────────────────────────────────────────── */

/** Pre-seeded particle positions (deterministic, no randomness at render) */
const PARTICLE_COUNT = 30;

const SEED_POSITIONS: { x: number; y: number; size: number; delay: number; speed: number }[] = [
  { x: 5,   y: 8,   size: 1.5, delay: 0.0, speed: 0.6 },
  { x: 12,  y: 22,  size: 2,   delay: 1.1, speed: 0.8 },
  { x: 20,  y: 5,   size: 1,   delay: 0.3, speed: 0.5 },
  { x: 28,  y: 38,  size: 2.5, delay: 2.0, speed: 0.9 },
  { x: 35,  y: 15,  size: 1.5, delay: 0.7, speed: 0.7 },
  { x: 42,  y: 52,  size: 2,   delay: 1.4, speed: 1.0 },
  { x: 50,  y: 28,  size: 1,   delay: 0.5, speed: 0.4 },
  { x: 55,  y: 72,  size: 3,   delay: 1.8, speed: 0.6 },
  { x: 62,  y: 10,  size: 1.5, delay: 0.9, speed: 0.8 },
  { x: 68,  y: 45,  size: 2,   delay: 2.2, speed: 0.5 },
  { x: 75,  y: 65,  size: 1,   delay: 0.2, speed: 0.7 },
  { x: 80,  y: 30,  size: 2.5, delay: 1.6, speed: 0.9 },
  { x: 88,  y: 55,  size: 1.5, delay: 0.4, speed: 0.6 },
  { x: 93,  y: 18,  size: 2,   delay: 1.0, speed: 0.4 },
  { x: 97,  y: 78,  size: 1,   delay: 2.5, speed: 0.8 },
  { x: 8,   y: 62,  size: 2,   delay: 0.6, speed: 0.5 },
  { x: 15,  y: 88,  size: 1.5, delay: 1.3, speed: 0.7 },
  { x: 22,  y: 48,  size: 1,   delay: 0.8, speed: 0.9 },
  { x: 32,  y: 75,  size: 2.5, delay: 2.4, speed: 0.4 },
  { x: 38,  y: 92,  size: 1.5, delay: 0.1, speed: 0.6 },
  { x: 45,  y: 6,   size: 2,   delay: 1.7, speed: 0.8 },
  { x: 52,  y: 85,  size: 1,   delay: 0.3, speed: 0.5 },
  { x: 58,  y: 42,  size: 3,   delay: 2.1, speed: 0.7 },
  { x: 65,  y: 92,  size: 1.5, delay: 0.5, speed: 0.9 },
  { x: 72,  y: 8,   size: 2,   delay: 1.2, speed: 0.4 },
  { x: 78,  y: 58,  size: 1,   delay: 0.9, speed: 0.6 },
  { x: 85,  y: 82,  size: 2.5, delay: 1.9, speed: 0.8 },
  { x: 90,  y: 38,  size: 1.5, delay: 0.4, speed: 0.5 },
  { x: 95,  y: 95,  size: 2,   delay: 2.3, speed: 0.7 },
  { x: 48,  y: 50,  size: 1,   delay: 1.5, speed: 0.6 },
];

/* ── Connecting lines: pre-compute pairs within ~28% distance ── */
const LINE_DISTANCE_THRESHOLD = 28;

function computeLines(): [number, number][] {
  const lines: [number, number][] = [];
  for (let a = 0; a < PARTICLE_COUNT; a++) {
    for (let b = a + 1; b < PARTICLE_COUNT; b++) {
      const dx = SEED_POSITIONS[a].x - SEED_POSITIONS[b].x;
      const dy = SEED_POSITIONS[a].y - SEED_POSITIONS[b].y;
      if (Math.sqrt(dx * dx + dy * dy) < LINE_DISTANCE_THRESHOLD) {
        lines.push([a, b]);
      }
    }
  }
  return lines;
}

const CONNECTING_LINES = computeLines();

/* ── Repulsion config ── */
const REPULSION_RADIUS = 18; // % of viewport
const REPULSION_STRENGTH = 8; // max px shift

/** Flat array of [dx0, dy0, dx1, dy1, ...] for all particles */
type Offsets = number[];

/**
 * InteractiveParticles renders a subtle, living particle mesh background
 * that responds to mouse movement with soft repulsion.
 *
 * Usage:
 * ```tsx
 * <InteractiveParticles className="absolute inset-0 z-0" />
 * ```
 */
export function InteractiveParticles({ className }: { className?: string }) {
  const mouseRef = React.useRef({ x: -9999, y: -9999 });
  const rafRef = React.useRef<number>(0);

  // Offsets stored in state so they're safe to read during render
  const [offsets, setOffsets] = React.useState<Offsets>(() =>
    new Array(PARTICLE_COUNT * 2).fill(0)
  );

  // Mutable buffer updated by rAF — copied to state periodically
  const bufferRef = React.useRef<Float32Array>(
    new Float32Array(PARTICLE_COUNT * 2)
  );

  React.useEffect(() => {
    let active = true;

    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth) * 100;
      mouseRef.current.y = (e.clientY / window.innerHeight) * 100;
    };

    const onMouseLeave = () => {
      mouseRef.current.x = -9999;
      mouseRef.current.y = -9999;
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("mouseleave", onMouseLeave, { passive: true });

    // Physics tick — runs every frame, writes to mutable buffer
    const physicsTick = () => {
      if (!active) return;

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const buf = bufferRef.current;

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const px = SEED_POSITIONS[i].x;
        const py = SEED_POSITIONS[i].y;
        const dx = px - mx;
        const dy = py - my;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < REPULSION_RADIUS && dist > 0.1) {
          const force = (1 - dist / REPULSION_RADIUS) * REPULSION_STRENGTH;
          const invDist = 1 / dist;
          buf[i * 2] = dx * invDist * force;
          buf[i * 2 + 1] = dy * invDist * force;
        } else {
          buf[i * 2] *= 0.85;
          buf[i * 2 + 1] *= 0.85;
        }
      }

      rafRef.current = requestAnimationFrame(physicsTick);
    };

    // Sync tick — copies buffer to state at ~30fps for React re-render
    let lastSync = 0;
    const syncTick = (now: number) => {
      if (!active) return;
      if (now - lastSync >= 33) {
        lastSync = now;
        const buf = bufferRef.current;
        const snapshot: Offsets = new Array(PARTICLE_COUNT * 2);
        for (let i = 0; i < snapshot.length; i++) {
          snapshot[i] = buf[i];
        }
        setOffsets(snapshot);
      }
      requestAnimationFrame(syncTick);
    };

    rafRef.current = requestAnimationFrame(physicsTick);
    requestAnimationFrame(syncTick);

    return () => {
      active = false;
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseleave", onMouseLeave);
    };
  }, []);

  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className ?? ""}`}
      aria-hidden="true"
    >
      {/* Fade-in wrapper */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2, delay: 0.8, ease: "easeOut" }}
      >
        {/* Particle dots with breathing animation + mouse repulsion */}
        {SEED_POSITIONS.map((p, i) => {
          const ox = offsets[i * 2] || 0;
          const oy = offsets[i * 2 + 1] || 0;
          return (
            <motion.span
              key={`pd-${i}`}
              className="absolute rounded-full"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: `${p.size}px`,
                height: `${p.size}px`,
                backgroundColor: "var(--mint)",
                opacity: 0.2,
                boxShadow: `0 0 ${3 + p.size * 1.5}px var(--mint)`,
                // GPU-accelerated mouse repulsion transform
                transform: `translate3d(${ox}px, ${oy}px, 0)`,
                willChange: "transform",
              }}
              // Breathing / floating animation via framer-motion
              animate={{
                y: [0, -14 * p.speed, 0],
                opacity: [0.12, 0.35, 0.12],
              }}
              transition={{
                duration: 5 + i * 0.3,
                repeat: Infinity,
                ease: "easeInOut",
                delay: p.delay,
              }}
            />
          );
        })}
      </motion.div>
    </div>
  );
}
