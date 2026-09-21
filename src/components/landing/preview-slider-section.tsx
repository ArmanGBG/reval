'use client';

import * as React from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { PreviewSlider } from './preview-slider';

/**
 * PreviewSliderSection — landing-page wrapper around PreviewSlider.
 *
 * Sits between Hero and ForStudents, matching the landing page's section
 * rhythm: same `border-b border-border/50 py-24 sm:py-32` pattern, same
 * `max-w-5xl px-5 sm:px-8` container, same Framer Motion in-view reveal.
 *
 * The slider itself (max-w-5xl mx-auto) is the inner content; this wrapper
 * adds the section eyebrow + heading so the slider reads as part of the
 * landing narrative ("نمای نزدیک از محیط اپ"), not a standalone widget.
 */

const easeOut = [0.16, 1, 0.3, 1] as const;

export function PreviewSliderSection() {
  const headerRef = React.useRef<HTMLDivElement>(null);
  const headerInView = useInView(headerRef, { once: true, margin: '-60px' });
  const sliderRef = React.useRef<HTMLDivElement>(null);
  const sliderInView = useInView(sliderRef, { once: true, margin: '-80px' });
  const reduceMotion = useReducedMotion();

  return (
    <section
      id="preview"
      className="relative scroll-mt-16 overflow-hidden border-b border-border/50 py-24 sm:py-32"
      aria-labelledby="preview-title"
    >
      <div className="relative mx-auto max-w-5xl px-5 sm:px-8">
        {/* ===== Header ===== */}
        <motion.div
          ref={headerRef}
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24 }}
          animate={headerInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: reduceMotion ? 0.12 : 0.6, ease: easeOut }}
          className="mb-12 max-w-2xl text-right"
        >
          <span className="text-xs font-bold text-mint">نمای نزدیک</span>
          <h2
            id="preview-title"
            className="mt-3 text-balance text-3xl font-black leading-tight text-foreground sm:text-4xl lg:text-5xl"
          >
            محیط اپ، قدم به قدم
          </h2>
          <p className="mt-4 text-sm font-medium leading-8 text-muted-foreground sm:text-base">
            از داشبورد روزانه تا آنالیز دقیق هر درس — چند صفحه از محیط روال رو با هم می‌بینیم. روی هر تصویر بکشید یا از دکمه‌های کناری برای مرور استفاده کنید.
          </p>
        </motion.div>

        {/* ===== Slider ===== */}
        <motion.div
          ref={sliderRef}
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 30 }}
          animate={sliderInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: reduceMotion ? 0.12 : 0.7, ease: easeOut, delay: reduceMotion ? 0 : 0.1 }}
        >
          <PreviewSlider />
        </motion.div>
      </div>
    </section>
  );
}

export default PreviewSliderSection;
