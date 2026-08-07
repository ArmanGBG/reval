'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ===== Types =====
type CelebrationIntensity = 'small' | 'big';
type CelebrationListener = (intensity: CelebrationIntensity) => void;

// ===== Module-level event emitter =====
// Connects the exported `triggerCelebration()` function to the overlay
// component without requiring a context provider or prop drilling.
const listeners = new Set<CelebrationListener>();

/**
 * Trigger a celebration animation from anywhere in the app.
 * - `small`: 20 particles (partial save, minor wins)
 * - `big`:   50 particles (full task completion)
 */
export function triggerCelebration(intensity: CelebrationIntensity = 'big') {
  if (typeof window === 'undefined') return; // SSR guard
  listeners.forEach((l) => {
    try {
      l(intensity);
    } catch {
      /* never let a listener error break other listeners */
    }
  });
}

function subscribe(listener: CelebrationListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// ===== Confetti palette =====
// Restrained palette — Linear-style. Uses accent + foreground tints.
// CSS vars can't be read at module load (no DOM in SSR), so we resolve
// them to hex literals here. Keep them in sync with globals.css.
const CONFETTI_COLORS = [
  '#5E6AD2', // accent (violet)
  '#6E7AE0', // accent-hover
  '#F7F8F8', // foreground
  '#8A8F98', // foreground-muted
  '#3EBA8C', // success
  '#D89614', // warning
] as const;

type ParticleShape = 'circle' | 'square';

interface Particle {
  id: number;
  x: number;          // horizontal start position (px, from window.innerWidth)
  endX: number;       // horizontal end position (px, includes drift)
  startY: number;     // start Y (px, negative = above viewport)
  endY: number;       // end Y (px, below viewport)
  size: number;       // px
  color: string;
  shape: ParticleShape;
  duration: number;   // seconds (2-3.5s)
  delay: number;      // seconds (0-0.25s)
  rotation: number;   // total rotation in deg
}

function generateParticles(count: number): Particle[] {
  // Guard for SSR — though this is only ever called client-side via the emitter.
  const w = typeof window !== 'undefined' ? window.innerWidth : 1024;
  const h = typeof window !== 'undefined' ? window.innerHeight : 800;

  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const shape: ParticleShape = Math.random() > 0.5 ? 'circle' : 'square';
    const startX = Math.random() * w;
    const drift = (Math.random() - 0.5) * 240; // ±120px horizontal drift
    particles.push({
      id: Date.now() * 1000 + i,
      x: startX,
      endX: startX + drift,
      startY: -24 - Math.random() * 40,
      endY: h + 60,
      size: 6 + Math.random() * 8, // 6-14px
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      shape,
      duration: 2 + Math.random() * 1.5, // 2-3.5s
      delay: Math.random() * 0.25,
      rotation: 180 + Math.random() * 540, // 180-720deg
    });
  }
  return particles;
}

const INTENSITY_COUNT: Record<CelebrationIntensity, number> = {
  small: 20,
  big: 50,
};

// Auto-clear timeout — slightly longer than the longest possible particle
// (3.5s duration + 0.25s delay + buffer). Particles also fade out via the
// opacity keyframes so the visual cut at cleanup is invisible.
const AUTO_CLEAR_MS = 3800;

// ===== Overlay Component =====
export default function CelebrationOverlay() {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const unsubscribe = subscribe((intensity) => {
      const count = INTENSITY_COUNT[intensity] ?? 30;
      setParticles(generateParticles(count));
      // Auto-clear after all particles are done to avoid memory leaks.
      window.setTimeout(() => {
        setParticles([]);
      }, AUTO_CLEAR_MS);
    });
    return unsubscribe;
  }, []);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 9998 }}
    >
      <AnimatePresence>
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{
              x: p.x,
              y: p.startY,
              opacity: 1,
              rotate: 0,
            }}
            animate={{
              x: p.endX,
              y: p.endY,
              opacity: [1, 1, 0],
              rotate: p.rotation,
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              ease: [0.25, 0.46, 0.45, 0.94],
              opacity: { times: [0, 0.75, 1] },
            }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
              borderRadius: p.shape === 'circle' ? '9999px' : '2px',
              boxShadow: 'none',
              willChange: 'transform, opacity',
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
