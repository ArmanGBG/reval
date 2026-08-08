"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";

const easeOut = [0.16, 1, 0.3, 1] as const;

type Particle = {
  id: number;
  x: number; // initial x offset from center, in px
  y: number; // initial y offset from center, in px
  vx: number; // horizontal velocity (px/s)
  vy: number; // vertical velocity (px/s, negative = up)
  rot: number; // initial rotation in degrees
  vrot: number; // rotation velocity (deg/s)
  size: number; // width in px
  color: string;
  shape: "rect" | "circle" | "triangle";
  duration: number; // animation duration in seconds
};

const COLORS = [
  "var(--mint)",
  "var(--mint-bright)",
  "oklch(0.92 0.12 158)",
  "oklch(0.98 0.015 150)",
  "oklch(0.78 0.14 168)",
  "oklch(0.72 0.10 175)",
];

const SHAPES: Particle["shape"][] = ["rect", "circle", "triangle"];

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function createParticles(count = 60): Particle[] {
  return Array.from({ length: count }, (_, i) => {
    const angle = randomBetween(-Math.PI * 0.85, -Math.PI * 0.15); // upward fan
    const speed = randomBetween(180, 420);
    return {
      id: i,
      x: randomBetween(-12, 12),
      y: randomBetween(-6, 6),
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      rot: randomBetween(0, 360),
      vrot: randomBetween(-540, 540),
      size: randomBetween(6, 12),
      color: COLORS[i % COLORS.length],
      shape: SHAPES[i % SHAPES.length],
      duration: randomBetween(1.4, 2.2),
    };
  });
}

function ParticleShape({ p }: { p: Particle }) {
  if (p.shape === "circle") {
    return (
      <span
        style={{
          width: p.size,
          height: p.size,
          backgroundColor: p.color,
          borderRadius: "9999px",
          display: "block",
        }}
      />
    );
  }
  if (p.shape === "triangle") {
    return (
      <span
        style={{
          width: 0,
          height: 0,
          borderLeft: `${p.size / 2}px solid transparent`,
          borderRight: `${p.size / 2}px solid transparent`,
          borderBottom: `${p.size}px solid ${p.color}`,
          display: "block",
        }}
      />
    );
  }
  // rect
  return (
    <span
      style={{
        width: p.size,
        height: p.size * 1.4,
        backgroundColor: p.color,
        display: "block",
      }}
    />
  );
}

/**
 * Confetti burst overlay — rendered at a fixed (x, y) origin and animates
 * a burst of colored particles upward and outward, then fades.
 *
 * Triggered by `fireConfetti(x, y)` via the exported `fireConfetti` function.
 * Internally managed with a queue so multiple bursts can stack.
 */
type Burst = {
  id: number;
  x: number;
  y: number;
  particles: Particle[];
};

let burstIdCounter = 0;
const listeners = new Set<(b: Burst) => void>();

/**
 * Fire a confetti burst at the given viewport coordinates.
 * Safe to call from anywhere — if no overlay is mounted, it's a no-op.
 */
export function fireConfetti(x: number, y: number, count = 60) {
  const burst: Burst = {
    id: ++burstIdCounter,
    x,
    y,
    particles: createParticles(count),
  };
  listeners.forEach((l) => l(burst));
}

export function ConfettiOverlay() {
  const [bursts, setBursts] = React.useState<Burst[]>([]);

  React.useEffect(() => {
    const onBurst = (b: Burst) => {
      setBursts((prev) => [...prev, b]);
      // Auto-remove after the longest particle finishes
      setTimeout(() => {
        setBursts((prev) => prev.filter((x) => x.id !== b.id));
      }, 2500);
    };
    listeners.add(onBurst);

    // Expose for debugging / programmatic triggering (dev convenience)
    if (typeof window !== "undefined") {
      (window as unknown as { __fireConfetti?: typeof fireConfetti }).__fireConfetti =
        fireConfetti;
    }

    return () => {
      listeners.delete(onBurst);
    };
  }, []);

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[80] overflow-hidden"
      aria-hidden="true"
    >
      <AnimatePresence>
        {bursts.map((burst) => (
          <div
            key={burst.id}
            className="absolute"
            style={{ left: burst.x, top: burst.y }}
          >
            {burst.particles.map((p) => (
              <motion.div
                key={p.id}
                className="confetti-particle"
                initial={{
                  x: p.x,
                  y: p.y,
                  opacity: 1,
                  rotate: p.rot,
                  scale: 1,
                }}
                animate={{
                  x: p.x + p.vx * p.duration * 0.5,
                  y: p.y + p.vy * p.duration * 0.5 + 240 * p.duration,
                  opacity: [1, 1, 0],
                  rotate: p.rot + p.vrot * p.duration,
                  scale: [1, 1, 0.6],
                }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: p.duration,
                  ease: easeOut,
                  opacity: { duration: p.duration, times: [0, 0.7, 1] },
                }}
              >
                <ParticleShape p={p} />
              </motion.div>
            ))}
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
