'use client';

import * as React from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * PreviewSlider — landing-page slider that showcases app screenshots in
 * both light and dark themes.
 *
 * Theme switching:
 *  The landing page stores its theme on the <html data-theme="light"> attribute
 *  (see src/app/layout.tsx and src/app/globals.css). The `dark` Tailwind
 *  variant is configured via `@custom-variant dark (&:is(.dark *))` but the
 *  app never adds a `.dark` class — instead it adds/removes `data-theme="light"`.
 *  So we use the same bespoke class pattern as the landing logo:
 *    `theme-preview-light` → hidden when html is NOT in light mode (default dark)
 *    `theme-preview-dark`  → hidden when html IS in light mode
 *  The corresponding CSS lives in src/app/globals.css.
 *
 *  This avoids loading both images visually (the wrong-theme one is `display:none`),
 *  but Next.js still hydrates both <Image> tags so the swap is instant.
 *
 * Controls:
 *  - Left/Right arrow buttons (RTL-aware: chevron-right = previous, chevron-left = next)
 *  - Pagination dots at the bottom
 *  - Touch/swipe via pointer events (no external lib needed)
 *  - Optional autoplay with pause-on-hover
 */

// Map of known file basenames → Persian title + short caption.
// Files not in this map fall back to a cleaned-up version of the filename.
const SLIDE_META: Record<string, { title: string; caption: string }> = {
  'dashboard': {
    title: 'داشبورد جامع دانش‌آموز',
    caption: 'خلاصه روزانه، آمار مطالعه و تسک‌های امروز در یک نگاه',
  },
  'study-plan': {
    title: 'برنامه مطالعاتی روزانه و هفتگی',
    caption: 'ساخت برنامه با درگ‌اند‌دراپ و پیگیری دقیق زمان‌بندی',
  },
  'sleep-tracker': {
    title: 'پایش و تحلیل الگوی خواب',
    caption: 'ثبت زمان خواب و بیداری، همراه با میانگین هفتگی',
  },
  'subject-analysis': {
    title: 'آنالیز پیشرفته دروس و فصول',
    caption: 'زمان صرف‌شده در هر فصل و گفتار، با تفکیک نوع فعالیت',
  },
  'subject-analysis1': {
    title: 'آنالیز پیشرفته دروس — نمای اول',
    caption: 'زمان صرف‌شده در هر فصل و گفتار، با تفکیک نوع فعالیت',
  },
  'subject-analysis2': {
    title: 'آنالیز پیشرفته دروس — نمای دوم',
    caption: 'نمودار ترکیبی فعالیت‌های غیردرسی در طول بازه انتخابی',
  },
  'subject-analysis3': {
    title: 'آنالیز پیشرفته دروس — نمای سوم',
    caption: 'تفکیک دقیق زمان هر درس به تفکیک فصل و روش مطالعه',
  },
};

interface PreviewSlide {
  fileName: string;
  title: string;
  caption: string;
}

interface PreviewSliderProps {
  /** Optional override list of file basenames (without extension). Defaults to all .webp files in public/images/preview/light/. */
  files?: string[];
  /** Autoplay interval in ms. Set to 0 to disable. Default: 6000. */
  autoplayMs?: number;
  /** Show caption under the title. Default: true. */
  showCaption?: boolean;
  /** className on the outer container. */
  className?: string;
}

/**
 * Build the slide list from a list of basenames (no extension).
 * Each basename is mapped to its title via SLIDE_META; unknown basenames
 * fall back to a cleaned-up version of the filename (dashes → spaces).
 */
function buildSlides(files: string[]): PreviewSlide[] {
  return files.map((basename) => {
    const meta = SLIDE_META[basename];
    if (meta) {
      return { fileName: `${basename}.webp`, title: meta.title, caption: meta.caption };
    }
    // Fallback: prettify the filename
    const cleaned = basename
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .trim();
    return {
      fileName: `${basename}.webp`,
      title: cleaned || basename,
      caption: '',
    };
  });
}

// Default slide order — controlled list so the order is predictable.
// Mirrors the actual files extracted from the user's Archive.zip.
const DEFAULT_FILES = [
  'dashboard',
  'study-plan',
  'sleep-tracker',
  'subject-analysis1',
  'subject-analysis2',
  'subject-analysis3',
];

export function PreviewSlider({
  files = DEFAULT_FILES,
  autoplayMs = 6000,
  showCaption = true,
  className,
}: PreviewSliderProps) {
  const slides = React.useMemo(() => buildSlides(files), [files]);
  const [active, setActive] = React.useState(0);
  const [paused, setPaused] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const dragStartX = React.useRef<number | null>(null);

  const goTo = React.useCallback((index: number) => {
    setActive((current) => {
      const next = (index + slides.length) % slides.length;
      return next;
    });
  }, [slides.length]);

  const goNext = React.useCallback(() => {
    setActive((c) => (c + 1) % slides.length);
  }, [slides.length]);

  const goPrev = React.useCallback(() => {
    setActive((c) => (c - 1 + slides.length) % slides.length);
  }, [slides.length]);

  // Keyboard navigation (left/right arrows)
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!containerRef.current) return;
      // Only handle when the slider or a child is focused / hovered
      const isInside = containerRef.current.contains(document.activeElement) ||
        containerRef.current.matches(':hover');
      if (!isInside) return;
      if (e.key === 'ArrowLeft') {
        // RTL: left arrow → next
        goNext();
      } else if (e.key === 'ArrowRight') {
        goPrev();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [goNext, goPrev]);

  // Autoplay
  React.useEffect(() => {
    if (!autoplayMs || paused || slides.length <= 1) return;
    const timer = window.setInterval(() => {
      setActive((c) => (c + 1) % slides.length);
    }, autoplayMs);
    return () => window.clearInterval(timer);
  }, [autoplayMs, paused, slides.length]);

  // Swipe via pointer events (works for both touch and mouse drag).
  // Threshold: 50px horizontal movement triggers a slide change.
  const onPointerDown = (e: React.PointerEvent) => {
    dragStartX.current = e.clientX;
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (dragStartX.current == null) return;
    const delta = e.clientX - dragStartX.current;
    dragStartX.current = null;
    if (Math.abs(delta) < 50) return;
    // RTL: swiping left (delta < 0) means "go to next"
    if (delta < 0) goNext();
    else goPrev();
  };
  const onPointerLeave = () => {
    dragStartX.current = null;
  };

  if (slides.length === 0) return null;
  const current = slides[active];

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative w-full max-w-5xl mx-auto select-none',
        className,
      )}
      dir="rtl"
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerLeave}
      onPointerCancel={onPointerLeave}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      // Make the slider focusable so keyboard arrows work without a child button focused
      tabIndex={0}
      role="region"
      aria-roledescription="carousel"
      aria-label="نمایش اسلایدی پیش‌نمایش اپلیکیشن"
    >
      {/* ===== Slide image ===== */}
      <div className="relative w-full aspect-[16/10] overflow-hidden rounded-2xl border border-[var(--border-strong)] shadow-2xl bg-[var(--bg-elevated)]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={current.fileName}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0"
          >
            {/* Light-theme image — visible when html[data-theme="light"] */}
            <Image
              src={`/images/preview/light/${current.fileName}`}
              alt={current.title}
              fill
              sizes="(max-width: 768px) 100vw, 80vw"
              className="theme-preview-light absolute inset-0 h-full w-full object-cover object-top"
              priority={active === 0}
            />
            {/* Dark-theme image — visible when html is NOT in light mode (default dark) */}
            <Image
              src={`/images/preview/dark/${current.fileName}`}
              alt={current.title}
              fill
              sizes="(max-width: 768px) 100vw, 80vw"
              className="theme-preview-dark absolute inset-0 h-full w-full object-cover object-top"
              priority={active === 0}
            />
          </motion.div>
        </AnimatePresence>

        {/* ===== Top gradient overlay (for the title text to remain readable) ===== */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* ===== Top-right: autoplay toggle ===== */}
        {autoplayMs > 0 && slides.length > 1 && (
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            className="absolute left-3 top-3 z-10 inline-flex size-9 items-center justify-center rounded-full border border-white/15 bg-black/40 text-white/80 backdrop-blur-sm transition-colors hover:bg-black/60 hover:text-white"
            aria-label={paused ? 'ادامه پخش خودکار' : 'توقف پخش خودکار'}
          >
            {paused ? <Play className="size-4" /> : <Pause className="size-4" />}
          </button>
        )}

        {/* ===== Bottom-left: title + caption ===== */}
        <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.fileName}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="text-right"
            >
              <h3 className="text-base font-bold text-white sm:text-lg drop-shadow-md">
                {current.title}
              </h3>
              {showCaption && current.caption && (
                <p className="mt-1 text-xs text-white/80 sm:text-sm drop-shadow-sm">
                  {current.caption}
                </p>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ===== Navigation arrows (outside the image so they don't overlap content) ===== */}
        {slides.length > 1 && (
          <>
            {/* RTL: right arrow = previous */}
            <button
              type="button"
              onClick={goPrev}
              className="absolute right-3 top-1/2 z-10 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/40 text-white/90 backdrop-blur-sm transition-all hover:bg-black/60 hover:text-white hover:scale-105"
              aria-label="اسلاید قبلی"
            >
              <ChevronRight className="size-5" />
            </button>
            {/* RTL: left arrow = next */}
            <button
              type="button"
              onClick={goNext}
              className="absolute left-3 top-1/2 z-10 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/40 text-white/90 backdrop-blur-sm transition-all hover:bg-black/60 hover:text-white hover:scale-105"
              aria-label="اسلاید بعدی"
            >
              <ChevronLeft className="size-5" />
            </button>
          </>
        )}
      </div>

      {/* ===== Pagination dots + counter (below the image) ===== */}
      {slides.length > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2" dir="rtl">
          {slides.map((slide, idx) => (
            <button
              key={slide.fileName}
              type="button"
              onClick={() => goTo(idx)}
              aria-label={`اسلاید ${idx + 1}: ${slide.title}`}
              aria-current={idx === active}
              className={cn(
                'h-2 rounded-full transition-all',
                idx === active
                  ? 'w-6 bg-[var(--accent)]'
                  : 'w-2 bg-[var(--border-strong)] hover:bg-[var(--foreground-muted)]',
              )}
            />
          ))}
        </div>
      )}

      {/* ===== Slide counter (small, below the dots) ===== */}
      <p className="mt-2 text-center text-[11px] tabular-nums text-[var(--foreground-muted)]">
        {String(active + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
      </p>
    </div>
  );
}

export default PreviewSlider;
