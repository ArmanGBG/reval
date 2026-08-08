"use client";

import * as React from "react";
import { fireConfetti } from "./confetti-overlay";

/**
 * Returns an onClick handler that fires a confetti burst centered on the
 * clicked element. Useful for primary CTA buttons to add a delightful
 * moment of celebration.
 *
 * Usage:
 *   <button onClick={useConfettiOnClick()}>...</button>
 *
 * Or combined with another handler:
 *   <button onClick={(e) => { doSomething(); useConfettiOnClick()(e); }}>...</button>
 *
 * The returned handler is stable (memoized) so it's safe to use in deps.
 */
export function useConfettiOnClick(count = 50) {
  return React.useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      // Burst from the center-top of the clicked element
      fireConfetti(rect.left + rect.width / 2, rect.top + rect.height / 2, count);
    },
    [count]
  );
}
