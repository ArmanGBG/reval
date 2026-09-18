"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";

// ===== Hero =====
// Static hero (no scroll-stepping, no 3-question sequence). Two-column
// layout on desktop: app screenshot on the visual LEFT, value-prop copy
// on the visual RIGHT (RTL: text is on the primary/start side, image on
// the secondary/end side). Stacks vertically on mobile (text first, then
// screenshot below).
//
// Replaces the previous scroll-driven 3-step sequence (بن‌بست برنامه‌ریزی
// → مشاور مناسب → ما اینجاییم) which the user found unnecessary
// friction before reaching the value prop.
export function Hero() {
  const [isMobile, setIsMobile] = React.useState(true);
  const reduceMotion = useReducedMotion();

  React.useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const sync = () => setIsMobile(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  return (
    <section
      id="top"
      className="relative overflow-hidden border-b border-border/50"
      aria-labelledby="hero-title"
    >
      {/* Decorative background (desktop only — mobile stays clean) */}
      {!isMobile && (
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute inset-0 grid-bg opacity-[0.14]" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-mint/50 to-transparent" />
          <div className="absolute inset-x-[12%] top-1/2 h-px bg-gradient-to-l from-transparent via-white/[0.05] to-transparent" />
        </div>
      )}

      <div className="relative mx-auto flex w-full max-w-6xl flex-col items-center gap-10 px-5 pt-24 pb-12 sm:px-8 sm:py-20 md:flex-row md:items-center md:gap-12 md:px-10 lg:gap-16">
        {/* ===== Text block (visual RIGHT in RTL / first in DOM) ===== */}
        <motion.div
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 22, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: reduceMotion ? 0.12 : 0.62, ease: [0.16, 1, 0.3, 1] }}
          className="flex w-full flex-col items-center text-center md:items-start md:text-start md:w-1/2"
        >
          {/* Main headline */}
          <h1
            id="hero-title"
            className="text-balance text-4xl font-black leading-[1.35] text-foreground sm:text-5xl lg:text-6xl"
          >
            ما اینجاییم همه چی بیفته رو{" "}
            <span className="text-mint">روال</span>!
          </h1>

          {/* Longer description */}
          <motion.p
            initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0.12 : 0.55, delay: reduceMotion ? 0 : 0.18 }}
            className="mt-6 max-w-xl text-sm font-normal leading-8 text-muted-foreground sm:text-base md:max-w-none"
          >
            رِوال میز کار شخصیِ تو برای یادگیریه. جایی که برنامه‌‌ریزی و آنالیز دقیق فعالیت یک دانش‌آموز انجام میشه و دقیقا به مشاوری وصل می‌شی که دغدغه‌هات رو می‌فهمه.
          </motion.p>
        </motion.div>

        {/* ===== Screenshot block (visual LEFT in RTL / second in DOM) ===== */}
        <motion.div
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0.12 : 0.7, ease: [0.16, 1, 0.3, 1], delay: reduceMotion ? 0 : 0.15 }}
          className="flex w-full justify-center md:w-1/2 md:justify-end"
        >
          {/* Phone-sized screenshot: kept small to read as a phone mockup,
              not a giant billboard. ~180px wide on mobile, ~240px on desktop
              tall, roughly matching a real phone's proportions. */}
          <div className="relative aspect-[440/956] w-full max-w-[180px] overflow-hidden rounded-[1.75rem] border border-border/60 bg-card shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] sm:max-w-[200px] md:max-w-[220px] lg:max-w-[240px]">
            <Image
              src="/hero-screenshot.png"
              alt="نمونه صفحه‌ی اپلیکیشن روال"
              fill
              sizes="(max-width: 640px) 180px, 240px"
              className="object-cover object-top"
              priority
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
