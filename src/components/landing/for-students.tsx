"use client";

import * as React from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";

// ===== ForStudents section =====
// Sits between the Hero and the InteractiveDemo ("بخشی از محیط اپ این شکلیه...").
// Header-only section (eyebrow + H2 + intro paragraph) — no boxes/cards.
// The detailed feature breakdown lives in the `Features` section further
// down the page (after the InteractiveDemo).
//
// Design language matches the rest of the landing page (same section
// padding, max-w-5xl container, Framer Motion in-view reveal, mint
// accent eyebrow + bold H2 + muted-foreground body).
const easeOut = [0.16, 1, 0.3, 1] as const;

export function ForStudents() {
  const headerRef = React.useRef<HTMLDivElement>(null);
  const headerInView = useInView(headerRef, { once: true, margin: "-60px" });
  const reduceMotion = useReducedMotion();

  return (
    <section
      id="for-students"
      className="relative scroll-mt-16 overflow-hidden border-b border-border/50 py-24 sm:py-32"
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
          <span className="text-xs font-bold text-mint">روال برای توست</span>
          <h2 className="mt-3 text-balance text-3xl font-black leading-tight text-foreground sm:text-5xl">
            برای دانش‌آموزان
          </h2>
          <p className="mt-4 text-sm font-medium leading-8 text-muted-foreground sm:text-base">
            می‌دونیم که مسیر کنکور و درس خوندن چقدر می‌تونه رو اعصاب باشه. برنامه‌های خشک، استرس عقب موندن و گزارش‌کارهایی که فقط حالت رو بدتر می‌کنن. ما «رِوال» رو ساختیم تا به این اوضاع پایان بدیم. اینجا خبری از استرس‌های الکی و رقابت‌های اعصاب‌خردکن نیست؛ اینجا فقط روی مسیرِ خودت تمرکز می‌کنی تا ببینی واقعاً کجای کاری و چطور می‌تونی بهتر بشی.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
