"use client";

import * as React from "react";
import Link from "next/link";
import {
  motion,
  useScroll,
  useTransform,
  useMotionValueEvent,
  AnimatePresence,
} from "framer-motion";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { ScrollCanvas } from "./scroll-canvas";
import { CinematicOverlay } from "./cinematic-overlay";
import { useConfettiOnClick } from "./use-confetti";

const easeOut = [0.16, 1, 0.3, 1] as const;

const FRAME_COUNT = 196;
const f = (frame: number) => (frame - 1) / (FRAME_COUNT - 1);

type Highlight = { word: string; className: string };

type Segment = {
  id: number;
  pStart: number;
  pEnd: number;
  text?: string;
  highlight?: string; // legacy single mint highlight
  highlights?: Highlight[]; // multi-highlight with custom colors
  mobileBreakAfter?: string; // insert <br> after this word on mobile only
  cta?: boolean;
};

const SEGMENTS: Segment[] = [
  { id: 0, pStart: f(1), pEnd: f(10) + 0.0001, text: "تو بن‌بست برنامه‌ریزی و آنالیز شخصی گیر کردی؟", highlights: [
    { word: "بن‌بست", className: "text-red-400" },
    { word: "آنالیز", className: "text-gradient-mint" },
  ] },
  { id: 1, pStart: f(11), pEnd: f(55) + 0.0001, text: "ما اینجاییم همه‌چی بیفته رو روال!", mobileBreakAfter: "همه‌چی", highlights: [
    { word: "روال", className: "text-gradient-mint" },
  ] },
  { id: 2, pStart: f(56), pEnd: f(57) + 0.0001 },
  { id: 3, pStart: f(58), pEnd: f(100) + 0.0001, text: "با روال، ادامه راه آسونه…", highlights: [
    { word: "روال", className: "text-gradient-mint" },
  ] },
  { id: 4, pStart: f(101), pEnd: f(102) + 0.0001 },
  { id: 5, pStart: f(103), pEnd: f(183) + 0.0001, text: "پله‌های ترقی رو یکی یکی طی کن…", mobileBreakAfter: "ترقی", highlights: [
    { word: "ترقی", className: "text-gradient-mint" },
  ] },
  { id: 6, pStart: f(184), pEnd: f(185) + 0.0001 },
  { id: 7, pStart: f(186), pEnd: 1.0001, text: "افق‌های روشن منتظرتن…", highlights: [
    { word: "روشن", className: "text-gradient-mint" },
  ], cta: true },
];

function activeSegmentIndex(progress: number): number {
  if (progress >= 1) return SEGMENTS.length - 1;
  for (let i = 0; i < SEGMENTS.length; i++) {
    if (progress >= SEGMENTS[i].pStart && progress < SEGMENTS[i].pEnd) return i;
  }
  return 0;
}

function renderHighlighted(text: string, highlights?: Highlight[], highlight?: string, mobileBreakAfter?: string) {
  // Multi-highlight mode (new)
  if (highlights && highlights.length > 0) {
    let result: React.ReactNode[] = [text];
    for (const { word, className } of highlights) {
      const next: React.ReactNode[] = [];
      for (const part of result) {
        if (typeof part !== "string") { next.push(part); continue; }
        const idx = part.indexOf(word);
        if (idx === -1) { next.push(part); continue; }
        next.push(part.slice(0, idx));
        next.push(<span key={`${word}-${idx}`} className={className}>{word}</span>);
        next.push(part.slice(idx + word.length));
      }
      result = next;
    }
    // Insert mobile-only line break after specified word
    if (mobileBreakAfter) {
      const breakIdx = result.findIndex(
        (n) => typeof n === "string" && n.includes(mobileBreakAfter) ||
               React.isValidElement(n) && String(n.key).startsWith(mobileBreakAfter)
      );
      if (breakIdx !== -1) {
        const target = result[breakIdx];
        if (typeof target === "string" && target.includes(mobileBreakAfter)) {
          const si = target.indexOf(mobileBreakAfter);
          result.splice(breakIdx, 1,
            target.slice(0, si),
            mobileBreakAfter,
            <br key="mbr" className="lg:hidden" />,
            target.slice(si + mobileBreakAfter.length)
          );
        } else if (React.isValidElement(target)) {
          // Break word is a highlighted span — insert <br> right after it
          result.splice(breakIdx + 1, 0, <br key="mbr" className="lg:hidden" />);
        }
      }
    }
    return <>{result}</>;
  }
  // Legacy single-highlight mode
  if (highlight) {
    const idx = text.indexOf(highlight);
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <span className="text-gradient-mint">{highlight}</span>
        {text.slice(idx + highlight.length)}
      </>
    );
  }
  return text;
}

const PARTICLES = [
  { left: 12, top: 25, size: 3.5, delay: 0, speed: 1 },
  { left: 82, top: 35, size: 2, delay: 1.2, speed: 0.6 },
  { left: 25, top: 65, size: 4, delay: 0.8, speed: 0.8 },
  { left: 70, top: 70, size: 1.5, delay: 2, speed: 1.2 },
  { left: 55, top: 20, size: 2.5, delay: 1.5, speed: 0.5 },
  { left: 40, top: 80, size: 3, delay: 0.3, speed: 0.9 },
  { left: 90, top: 15, size: 1.5, delay: 0.6, speed: 1.1 },
  { left: 8, top: 50, size: 2, delay: 1.8, speed: 0.7 },
];

/* ───────── Shared Text Content (used by both mobile & desktop) ───────── */

function TextContent({ seg, onConfetti }: { seg: Segment; onConfetti: () => void }) {
  return (
    <AnimatePresence mode="wait">
      {seg.text ? (
        <motion.div
          key={seg.id}
          initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -20, filter: "blur(6px)" }}
          transition={{ duration: 0.6, ease: easeOut }}
        >
          <h2 className="text-balance font-extrabold leading-[1.35] tracking-tight [text-shadow:0_2px_40px_rgba(0,0,0,0.8)]">
            {renderHighlighted(seg.text, seg.highlights, seg.highlight, seg.mobileBreakAfter)}
          </h2>

          {seg.cta && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.65, ease: easeOut }}
            >
              <div className="mt-44 flex flex-col items-center gap-3 sm:mt-8 sm:flex-row sm:justify-center sm:gap-3.5">
                <Link
                  href="#signup"
                  onClick={onConfetti}
                  className="group relative touch-target inline-flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-full bg-mint px-7 py-3 text-sm font-semibold text-[#06120c] shadow-[0_14px_44px_-10px_var(--mint)] transition-all duration-300 hover:shadow-[0_18px_52px_-8px_var(--mint-bright)] hover:brightness-110 hover:scale-[1.02] focus-ring-mint sm:w-auto sm:py-3.5"
                >
                  <span
                    className="absolute inset-0 -translate-x-full transition-transform duration-[1200ms] group-hover:translate-x-full"
                    style={{ background: "linear-gradient(to left, transparent 0%, rgba(255,255,255,0.06) 15%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.06) 85%, transparent 100%)" }}
                  />
                  <motion.span
                    className="pointer-events-none absolute -inset-1.5 rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    animate={{ boxShadow: ["0 0 0 2px var(--mint), 0 0 16px -4px var(--mint-bright)", "0 0 0 2px var(--mint-bright), 0 0 28px -4px var(--mint-bright)", "0 0 0 2px var(--mint), 0 0 16px -4px var(--mint-bright)"] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    aria-hidden="true"
                  />
                  ثبت‌نام رایگان
                  <ArrowLeft className="relative size-4 transition-all duration-300 group-hover:-translate-x-1.5 group-hover:scale-110" />
                </Link>
                <Link
                  href="#features"
                  className="touch-target inline-flex w-full items-center justify-center gap-2 rounded-full border border-border/60 bg-background/30 px-7 py-3 text-sm font-medium text-foreground backdrop-blur-lg transition-all duration-300 hover:bg-background/50 hover:border-border focus-ring-mint sm:w-auto sm:py-3.5"
                >
                  کاوش امکانات
                </Link>
              </div>
            </motion.div>
          )}
        </motion.div>
      ) : (
        <motion.div key={`empty-${seg.id}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }} />
      )}
    </AnimatePresence>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */

export function Hero() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end end"] });
  const onConfetti = useConfettiOnClick(70);

  const canvasY = useTransform(scrollYProgress, [0, 1], ["0%", "-6%"]);
  // Hint stays visible until ~88% scroll, then fades before CTA appears
  const hintOpacity = useTransform(scrollYProgress, [0, 0.85, 0.95], [1, 1, 0]);

  const [active, setActive] = React.useState(0);
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const idx = activeSegmentIndex(v);
    setActive((prev) => (prev === idx ? prev : idx));
  });

  const seg = SEGMENTS[active];

  return (
    <section id="top" ref={containerRef} className="relative h-[300vh]" aria-label="معرفی روال">
      <div className="sticky top-0 h-[100svh] overflow-hidden">

        {/* ════════════════════════════════════════════════════════════
            MOBILE LAYOUT  (hidden on lg+)
            — Full-bleed canvas background
            — Text at top of screen
            — Independent from desktop — edit freely
        ════════════════════════════════════════════════════════════ */}
        <div className="lg:hidden">
          {/* Full-bleed canvas — frameScale={0.88} zooms OUT on mobile
              to reduce edge cropping. The canvas still fills edge-to-edge;
              dark margins within the canvas blend with the page background. */}
          <motion.div style={{ y: canvasY }} className="absolute inset-0 z-0">
            <ScrollCanvas containerRef={containerRef} className="h-full w-full" frameScale={0.88} />
            {/* Heavy top scrim for text legibility */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/90 via-background/15 to-background/50" />
            {/* Ambient glow */}
            <div className="pointer-events-none absolute -top-1/4 right-1/4 h-[44rem] w-[44rem] rounded-full bg-mint/[0.08] blur-[160px]" />
            {/* Floating particles */}
            <motion.div className="pointer-events-none absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.5, delay: 0.5 }} aria-hidden="true">
              {PARTICLES.map((p, i) => (
                <motion.span key={i} className="absolute rounded-full bg-mint/40"
                  style={{ left: `${p.left}%`, top: `${p.top}%`, width: `${p.size}px`, height: `${p.size}px`, boxShadow: `0 0 ${4 + p.size * 2}px var(--mint)` }}
                  animate={{ y: [0, -22 * p.speed, 0], opacity: [0.15, 0.7, 0.15] }}
                  transition={{ duration: 4 + i * 0.5, repeat: Infinity, ease: "easeInOut", delay: p.delay }}
                />
              ))}
            </motion.div>
          </motion.div>

          {/* Mobile text — vertically centered in the mid-section of the screen */}
          <div className="relative z-20 flex h-full flex-col items-end justify-center px-5 pt-[32vh]">
            <div className="w-full max-w-3xl text-right">
              <div className="min-h-[7rem]">
                <h2 className="text-balance text-2xl font-extrabold leading-[1.35] tracking-tight sm:text-3xl">
                  <TextContent seg={seg} onConfetti={onConfetti} />
                </h2>
              </div>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════
            DESKTOP LAYOUT  (hidden below lg)
            — Split from middle: canvas LEFT (50%), text RIGHT (50%)
            — Canvas uses object-contain → full frame visible, no crop
            — Soft gradient dissolve on text panel left edge
            — Independent from mobile — edit freely
        ════════════════════════════════════════════════════════════ */}
        <div className="hidden lg:block">
          {/* ── LEFT: Canvas (~58%) ──
              Extends past text panel start for seamless overlap dissolve.
              Text panel (z-20) sits on top, covering the overlap zone. */}
          <div className="absolute inset-y-0 left-0 right-[42%] z-0">
            <ScrollCanvas containerRef={containerRef} className="h-full w-full" />
            {/* Soft gradient dissolve — wide, gradual fade from canvas to background */}
            <div
              className="pointer-events-none absolute inset-y-0 right-0 z-10 w-[50%]"
              style={{ background: "linear-gradient(to right, transparent 0%, transparent 10%, var(--background) 80%, var(--background) 100%)" }}
            />
            {/* Ambient glow */}
            <div className="pointer-events-none absolute -top-1/4 right-1/4 h-[44rem] w-[44rem] rounded-full bg-mint/[0.08] blur-[160px]" />
            <motion.div className="pointer-events-none absolute bottom-0 left-1/4 h-[36rem] w-[36rem] rounded-full bg-mint/[0.05] blur-[140px]"
              animate={{ opacity: [0.05, 0.08, 0.05], scale: [1, 1.05, 1] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            />
            {/* Floating particles */}
            <motion.div className="pointer-events-none absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.5, delay: 0.5 }} aria-hidden="true">
              {PARTICLES.map((p, i) => (
                <motion.span key={i} className="absolute rounded-full bg-mint/40"
                  style={{ left: `${p.left}%`, top: `${p.top}%`, width: `${p.size}px`, height: `${p.size}px`, boxShadow: `0 0 ${4 + p.size * 2}px var(--mint)` }}
                  animate={{ y: [0, -22 * p.speed, 0], opacity: [0.15, 0.7, 0.15] }}
                  transition={{ duration: 4 + i * 0.5, repeat: Infinity, ease: "easeInOut", delay: p.delay }}
                />
              ))}
            </motion.div>
          </div>

          {/* ── RIGHT: Text panel (~45%) ──
              Has a soft left-edge dissolve so no hard boundary with canvas. */}
          <div className="absolute inset-y-0 left-[55%] right-0 z-20 flex items-center justify-center">
            {/* Solid background fill */}
            <div className="absolute inset-0 bg-background" />
            {/* Left-edge dissolve — transparent → bg-background, softens the seam */}
            <div
              className="pointer-events-none absolute inset-y-0 -left-[12%] w-[25%]"
              style={{ background: "linear-gradient(to right, transparent 0%, transparent 5%, var(--background) 70%, var(--background) 100%)" }}
            />
            <div className="relative z-10 w-full max-w-lg px-8 text-center xl:max-w-xl">
              <div className="min-h-[9.5rem]">
                <h2 className="text-balance text-[2.5rem] font-extrabold leading-[1.35] tracking-tight xl:text-[2.75rem]">
                  <TextContent seg={seg} onConfetti={onConfetti} />
                </h2>
              </div>
            </div>
          </div>
        </div>

        {/* Cinematic overlay (shared) */}
        <CinematicOverlay scrollYProgress={scrollYProgress} />

        {/* Scroll hint — visible throughout all frames, fades only near CTA */}
        <motion.div style={{ opacity: hintOpacity }} className="pointer-events-none absolute left-0 right-0 bottom-8 flex flex-col items-center gap-2 lg:right-1/2 lg:bottom-10 lg:gap-2.5">
          <span className="text-[11px] font-semibold tracking-wide text-mint/80 sm:text-xs">برای ادامه اسکرول کنید</span>
          <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} className="relative flex flex-col items-center">
            <div className="absolute -inset-6 rounded-full bg-mint/[0.08] blur-xl" />
            <svg width="18" height="26" viewBox="0 0 18 26" fill="none" className="relative text-mint" stroke="currentColor" strokeWidth="1.5">
              <rect x="1" y="1" width="16" height="24" rx="8" />
              <motion.g animate={{ y: [0, 3, 0] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}>
                <circle cx="9" cy="8" r="1.5" fill="currentColor" stroke="none" />
              </motion.g>
            </svg>
            <div className="mt-1.5 flex flex-col items-center">
              <ChevronDown className="size-3 text-mint/60" />
              <ChevronDown className="size-2.5 -mt-0.5 text-mint/30" />
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
