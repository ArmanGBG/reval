"use client";

import * as React from "react";
import { motion, AnimatePresence, useInView, useReducedMotion } from "framer-motion";

// ===== Features section =====
// Sits after the InteractiveDemo ("بخشی از محیط اپ این شکلیه..."). Lists the
// detailed feature breakdown of روال as 9 expandable bullet points. Each
// bullet shows only its title by default; clicking the row reveals the
// description below it (animated accordion).
//
// Desktop layout: 2-column grid (each feature is an independent accordion
// that expands inline). Mobile: single column.
//
// The last feature ("مقاله‌های کاربردی") has no body text — it's rendered
// as a non-clickable title-only bullet point.
//
// No icons — every visual is a typographic / CSS element (bullet dot,
// `+`/`×` character for the open/close indicator). Per user's "no icons"
// rule for this section.
const easeOut = [0.16, 1, 0.3, 1] as const;

const FEATURES: { title: string; body?: string }[] = [
  {
    title: "بودجه‌بندیِ دقیقِ مباحث",
    body: "مشخص کردنِ دقیق صفحات و مباحث برای هر درس قبل از شروع برنامه، تا بدونی دقیقاً با چی طرفی و زیرِ بارِ یه برنامه‌ی سنگین و نشدنی نری.",
  },
  {
    title: "آنالیز خودکارِ وضعیت",
    body: "رسمِ دقیقِ نمودارهای پیشرفت و افتِ تو بدون نیاز به هیچ حساب‌وکتابِ دستی، تا با یه نگاه بفهمی کجای مسیری و خیالت از بابت روند رشدت راحت باشه.",
  },
  {
    title: "فضای مطالعه‌ی بدون حواس‌پرتی",
    body: "پنهان شدنِ منوها و دکمه‌های اضافی موقعِ درس خوندن (Zero-Distraction UI)، تا ذهنت درگیرِ نویزهای الکی نشه و بتونی عمیق و راحت تمرکز کنی.",
  },
  {
    title: "ثبتِ بی‌دردسرِ گزارش‌کار",
    body: "وارد کردنِ سریعِ ساعت‌های مطالعه و تعداد تست‌ها توی یه محیطِ خیلی ساده.",
  },
  {
    title: "ارتباط شفاف با مشاور",
    body: "انتقال خودکارِ همه‌ی اطلاعات و نمودارها به پنل مشاور، تا توی جلسات به جای جمع زدنِ ساعت‌ها، تمامِ وقتتون صرفِ حل کردنِ گره‌های ذهنیت بشه.",
  },
  {
    title: "ابزارهای کمکیِ مطالعه",
    body: "دسترسی به فلش‌کارت‌ها و آزمون‌های شخصی‌سازی‌شده، تا بتونی مطالبی که خوندی رو راحت‌تر مرور کنی و خیالت از بابتِ یادگیریِ عمیقشون راحت بشه.",
  },
  {
    title: "آنالیزِ خواب و سبکِ زندگی",
    body: "ثبت و بررسیِ کارهای غیردرسی و وضعیتِ خوابت، تا بتونی انرژیت رو در طول روز بهتر مدیریت کنی و بازدهیِ درس خوندنت رو ببری بالا.",
  },
  {
    title: "تحلیل هوشمندِ آزمون‌ها",
    body: "بررسی اینکه ساعت‌ها و روش‌های مطالعه‌ات دقیقاً چه تاثیری روی نتیجه‌ی آزمون‌هات گذاشته، تا بتونی مسیر پیشرفتت رو خیلی شفاف‌تر ببینی.",
  },
  {
    title: "مقاله‌های کاربردی",
    // body is intentionally omitted — title-only bullet point per user request.
  },
];

export function Features() {
  const headerRef = React.useRef<HTMLDivElement>(null);
  const headerInView = useInView(headerRef, { once: true, margin: "-60px" });
  const reduceMotion = useReducedMotion();

  return (
    <section
      id="features-list"
      className="relative scroll-mt-16 border-b border-border/50 py-24 sm:py-32"
    >
      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        {/* ===== Header — eyebrow promoted to bold main heading (no separate H2) ===== */}
        <motion.div
          ref={headerRef}
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24 }}
          animate={headerInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: reduceMotion ? 0.12 : 0.6, ease: easeOut }}
          className="mb-12 max-w-2xl text-right"
        >
          <h2 className="text-balance text-3xl font-black leading-tight text-foreground sm:text-5xl">
            قابلیت‌های روال
          </h2>
        </motion.div>

        {/* ===== 2-column grid of bullet features (accordion) =====
            - Mobile: single column.
            - Desktop (sm+): 2 columns side-by-side. Each feature is an
              independent accordion that expands inline (height grows,
              pushing siblings in the same column down). */}
        <div className="grid grid-cols-1 gap-x-10 sm:grid-cols-2">
          {FEATURES.map((feature, index) => (
            <FeatureRow key={feature.title} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureRow({
  feature,
  index,
}: {
  feature: { title: string; body?: string };
  index: number;
}) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduceMotion = useReducedMotion();
  const hasBody = Boolean(feature.body);

  // Title-only feature (no body to expand): render as a non-interactive
  // bullet point — no button, no `+` indicator, no click handler.
  if (!hasBody) {
    return (
      <motion.div
        ref={ref}
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{
          duration: reduceMotion ? 0.12 : 0.4,
          delay: reduceMotion ? 0 : Math.min(index * 0.04, 0.24),
          ease: easeOut,
        }}
        className="border-b border-border/40 py-5"
      >
        <div className="flex items-baseline gap-3 text-right sm:gap-4">
          <span
            className="mt-2.5 size-1.5 shrink-0 rounded-full bg-mint"
            aria-hidden="true"
          />
          <span className="flex-1 text-base font-bold leading-snug text-foreground sm:text-lg">
            {feature.title}
          </span>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      ref={ref}
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{
        duration: reduceMotion ? 0.12 : 0.4,
        delay: reduceMotion ? 0 : Math.min(index * 0.04, 0.24),
        ease: easeOut,
      }}
      className="border-b border-border/40"
    >
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="group flex w-full items-baseline gap-3 py-5 text-right transition-colors hover:bg-card/20 sm:gap-4"
      >
        {/* Bullet point (mint circle, no icon) */}
        <span
          className="mt-2.5 size-1.5 shrink-0 rounded-full bg-mint transition-transform duration-300 group-hover:scale-125"
          aria-hidden="true"
        />
        {/* Feature title */}
        <span className="flex-1 text-base font-bold leading-snug text-foreground sm:text-lg">
          {feature.title}
        </span>
        {/* Open/close indicator: typographic `+` that rotates 45° into `×` */}
        <span
          className="shrink-0 select-none text-lg font-light leading-none text-mint transition-transform duration-300"
          style={{ transform: open ? "rotate(45deg)" : "rotate(0deg)" }}
          aria-hidden="true"
        >
          +
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
            animate={reduceMotion ? { opacity: 1 } : { height: "auto", opacity: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: reduceMotion ? 0.12 : 0.32, ease: easeOut }}
            className="overflow-hidden"
          >
            <p className="pr-6 pb-5 text-sm leading-8 text-muted-foreground sm:pr-8">
              {feature.body}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
