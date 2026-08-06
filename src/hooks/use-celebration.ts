'use client';

import { useCallback } from 'react';
import { triggerCelebration } from '@/components/shared/CelebrationOverlay';

export type CelebrationIntensity = 'small' | 'big';

/**
 * useCelebration — returns a stable `celebrate(intensity)` function that
 * triggers the global CelebrationOverlay confetti burst.
 *
 * Usage:
 *   const { celebrate } = useCelebration();
 *   celebrate('big');   // full task completion — 50 particles
 *   celebrate('small'); // partial save / minor win — 20 particles
 */
export function useCelebration() {
  const celebrate = useCallback((intensity: CelebrationIntensity = 'big') => {
    triggerCelebration(intensity);
  }, []);

  return { celebrate };
}
