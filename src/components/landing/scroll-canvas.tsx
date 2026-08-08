"use client";

import * as React from "react";

const FRAME_COUNT = 98; // Odd frames only (1,3,5,...,195) — 50% smaller download
const FRAME_W = 720;
const FRAME_H = 728;

/** Map array index (0–97) to odd frame number (1,3,5,…,195) */
function framePath(i: number) {
  const frameNum = i * 2 + 1; // index 0→1, 1→3, 2→5, ..., 97→195
  return `/frames/frame_${String(frameNum).padStart(4, "0")}.webp`;
}

/**
 * Cinematic scroll-motion canvas.
 * Plays a sequence of 98 WebP frames (odd only) mapped to the scroll progress of the
 * provided container element. Uses requestAnimationFrame + IntersectionObserver
 * for buttery-smooth, GPU-friendly playback that pauses when off-screen.
 *
 * `frameScale` (< 1) zooms the drawn frame OUT within the canvas, reducing
 * edge cropping. The canvas still fills its container edge-to-edge — dark
 * margins around the scaled frame blend naturally with the page background.
 */
export function ScrollCanvas({
  containerRef,
  className,
  frameScale = 1,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>;
  className?: string;
  /** Scale factor for drawing the frame within the canvas. < 1 = zoom out. */
  frameScale?: number;
}) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const imagesRef = React.useRef<HTMLImageElement[]>([]);
  const currentFrameRef = React.useRef(0);
  const rafRef = React.useRef<number>(0);
  const inViewRef = React.useRef(true);
  // Track loading for first-frame paint only — no blocking overlay
  const [firstFrameReady, setFirstFrameReady] = React.useState(false);

  // Pre-compute draw offsets for frameScale
  const dw = Math.round(FRAME_W * frameScale);
  const dh = Math.round(FRAME_H * frameScale);
  const dx = Math.round((FRAME_W - dw) / 2);
  const dy = Math.round((FRAME_H - dh) / 2);

  // Preload frames progressively — no blocking, canvas shows immediately
  React.useEffect(() => {
    const imgs: HTMLImageElement[] = [];
    let cancelled = false;
    for (let i = 0; i < FRAME_COUNT; i++) {
      const img = new Image();
      img.decoding = "async";
      img.src = framePath(i);
      if (i === 0) {
        // Mark first frame ready so we draw it immediately
        img.onload = () => {
          if (cancelled) return;
          setFirstFrameReady(true);
        };
      }
      imgs[i] = img;
    }
    imagesRef.current = imgs;
    return () => {
      cancelled = true;
    };
  }, []);

  // Setup canvas backing store once
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = FRAME_W;
    canvas.height = FRAME_H;
  }, []);

  const drawFrame = React.useCallback(
    (idx: number) => {
      const canvas = canvasRef.current;
      const img = imagesRef.current[idx];
      if (!canvas || !img || !img.complete || img.naturalWidth === 0) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, FRAME_W, FRAME_H);
      // Draw frame at frameScale — centered within the canvas backing store.
      // When frameScale < 1, the frame is drawn smaller, leaving dark margins
      // that blend naturally with the page background (no CSS scale gaps).
      ctx.drawImage(img, dx, dy, dw, dh);
    },
    [dx, dy, dw, dh]
  );

  // rAF loop: read scroll progress from container, draw matching frame
  React.useEffect(() => {
    const tick = () => {
      const container = containerRef.current;
      if (container && inViewRef.current) {
        const rect = container.getBoundingClientRect();
        const vh = window.innerHeight;
        const scrollable = rect.height - vh;
        const progress = scrollable > 0 ? Math.min(Math.max(-rect.top / scrollable, 0), 1) : 0;
        const target = Math.min(
          FRAME_COUNT - 1,
          Math.max(0, Math.round(progress * (FRAME_COUNT - 1)))
        );
        if (target !== currentFrameRef.current) {
          currentFrameRef.current = target;
          drawFrame(target);
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [containerRef, drawFrame]);

  // Pause when off-screen
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        inViewRef.current = entry.isIntersecting;
      },
      { threshold: 0 }
    );
    io.observe(canvas);
    return () => io.disconnect();
  }, []);

  // Draw frame 0 as soon as it is available (initial paint)
  React.useEffect(() => {
    if (firstFrameReady && currentFrameRef.current === 0) {
      drawFrame(0);
    }
  }, [firstFrameReady, drawFrame]);

  return (
    <div className={className}>
      <div className="relative h-full w-full overflow-hidden">
        {/* Canvas fills container edge-to-edge on both mobile & desktop.
            On mobile, the frameScale prop (< 1) draws the frame smaller
            within the canvas backing store, effectively zooming OUT.
            This avoids CSS scale (which creates layout gaps/borders) and
            instead uses the canvas itself for dark margins that blend with
            the page background.
            No loading overlay — canvas is visible immediately, frames
            load progressively in the background. */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full object-cover"
          style={{ imageRendering: "auto" }}
        />
      </div>
    </div>
  );
}
