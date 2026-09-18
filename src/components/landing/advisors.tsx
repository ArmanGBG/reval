"use client";

import * as React from "react";
import Image from "next/image";
import { motion, useInView, useReducedMotion } from "framer-motion";
import {
  CalendarClock,
  BarChart3,
  TrendingUp,
  GraduationCap,
  Send,
  type LucideIcon,
} from "lucide-react";

// ===== Advisors section ("مشاوران تحصیلی و آموزشگاه‌ها") =====
// Three stacked sub-sections for advisors and institute managers:
//   1. Advisor intro — value-prop paragraph + "اطلاعات بیشتر" CTA
//   2. Advisor features — title + image placeholder + 4 icon features +
//      primary CTA "می‌خوام به عنوان مشاور همکاری کنم"
//   3. Teams & institutes — paragraph + secondary CTA
//        "پنل ویژه آموزشگاه‌ها و تیم‌ها"
//
// All CTAs route to the support Telegram (handle `RevalSupport`). The
// `TELEGRAM_HANDLE` constant is duplicated from `team.tsx` to keep this
// file self-contained — both files now default to "RevalSupport".
//
// Responsive: all three sub-sections stack to single-column on mobile.
const easeOut = [0.16, 1, 0.3, 1] as const;
const TELEGRAM_HANDLE = process.env.NEXT_PUBLIC_ADVISOR_TELEGRAM_HANDLE || "RevalSupport";
const TELEGRAM_URL = `https://t.me/${TELEGRAM_HANDLE}`;

const ADVISOR_FEATURES: { title: string; body: string; icon: LucideIcon }[] = [
  {
    title: "برنامه‌ریزی سریع و منظم",
    body: "به جای ساختنِ برنامه‌ها از صفر، از ابزارهای رِوال کمک بگیر تا توی کمترین زمان، یه برنامه‌ی دقیق و شخصی‌سازی‌شده برای هر دانش‌آموز بچینی.",
    icon: CalendarClock,
  },
  {
    title: "آنالیز خودکارِ گزارش‌کارها",
    body: "دیگه نیازی به ماشین‌حساب و جمع زدنِ دستیِ ساعت‌های مطالعه نیست. سیستم خودش همه‌چیز رو محاسبه می‌کنه تا مستقیم بری سراغ تحلیل.",
    icon: BarChart3,
  },
  {
    title: "داشبوردِ شفافِ پیشرفت",
    body: "وضعیتِ تحصیلی هر دانش‌آموز رو روی نمودارهای ساده ببین، تا توی جلسات دقیقاً بدونی روی چه نقطه‌ضعفی باید دست بذاری.",
    icon: TrendingUp,
  },
  {
    title: "ارتقای مهارت‌های نرم",
    body: "دسترسی به دوره‌ تخصصیِ رِوال برای یادگیریِ مهارت‌های روان‌شناختی و کوچینگ، تا بتونی مشاورِ تاثیرگذارتری برای بچه‌ها باشی.",
    icon: GraduationCap,
  },
];

export function Advisors() {
  const introRef = React.useRef<HTMLDivElement>(null);
  const introInView = useInView(introRef, { once: true, margin: "-60px" });
  const featuresRef = React.useRef<HTMLDivElement>(null);
  const featuresInView = useInView(featuresRef, { once: true, margin: "-60px" });
  const teamsRef = React.useRef<HTMLDivElement>(null);
  const teamsInView = useInView(teamsRef, { once: true, margin: "-60px" });
  const reduceMotion = useReducedMotion();

  return (
    <section
      id="advisors"
      className="relative scroll-mt-16 overflow-hidden border-b border-border/50 py-24 sm:py-32"
    >
      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        {/* ============================================================
            Sub-section 1: Advisor intro
            ============================================================ */}
        <motion.div
          ref={introRef}
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24 }}
          animate={introInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: reduceMotion ? 0.12 : 0.6, ease: easeOut }}
          className="mx-auto mb-24 max-w-3xl text-right sm:mb-32"
        >
          <span className="text-xs font-bold text-mint">برای مشاوران تحصیلی</span>
          <h2 className="mt-3 text-balance text-3xl font-black leading-tight text-foreground sm:text-5xl">
            یه مشاورِ خوب، کارِ خوبش رو می‌کنه
          </h2>
          <p className="mt-6 text-sm font-medium leading-8 text-muted-foreground sm:text-base sm:leading-9">
            یه مشاورِ خوب نباید بیشترِ وقتش رو صرف محاسبه ساعت‌های مطالعه و نوشتنِ برنامه‌های تکراری بکنه. رِوال این کارهای زمان‌بر رو راحت‌تر و منظم‌تر می‌کنه و تمامِ نمودارها و وضعیتِ دانش‌آموز رو خیلی شفاف بهت نشون می‌ده. اینطوری می‌تونی وقت و انرژیت رو بذاری روی کارِ اصلی: یعنی ارتباط گرفتن با دانش‌آموز و حل کردن گره‌های ذهنیش. ضمناً، با دوره‌های تخصصی ما، می‌تونی مهارت‌های مشاوره‌ات رو حسابی آپدیت کنی.
          </p>
          <div className="mt-8">
            <a
              href={TELEGRAM_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full border border-mint/40 bg-mint/[0.06] px-5 text-sm font-semibold text-mint transition-all hover:bg-mint/15 hover:border-mint/60 focus-ring-mint"
            >
              اطلاعات بیشتر
            </a>
          </div>
        </motion.div>

        {/* ============================================================
            Sub-section 2: Advisor features (with image placeholder)
            ============================================================ */}
        <motion.div
          ref={featuresRef}
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24 }}
          animate={featuresInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: reduceMotion ? 0.12 : 0.6, ease: easeOut }}
          className="mb-20 sm:mb-28"
        >
          <div className="mb-12 max-w-2xl text-right">
            <h3 className="text-balance text-2xl font-black leading-tight text-foreground sm:text-4xl">
              وقتت رو برای کارهای تکراری هدر نده!
            </h3>
          </div>

          {/* Image + features grid: image on visual LEFT (end in RTL),
              features on visual RIGHT (start in RTL). Stacks on mobile. */}
          <div className="grid gap-10 sm:grid-cols-2 sm:gap-12">
            {/* Image placeholder for "عکس پنل مشاور"
                (replace src + alt + width/height when real screenshot is ready) */}
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-border/50 bg-card/30">
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center text-muted-foreground/60">
                <span className="text-xs font-bold text-mint">پنل مشاور</span>
                <span className="text-xs">عکس پنل مشاور — اینجا قرار می‌گیره</span>
              </div>
              {/* When ready, replace the placeholder div with:
                  <Image src="/advisor-panel.png" alt="پنل مشاور روال" fill
                         className="object-cover object-top" sizes="(max-width: 640px) 100vw, 50vw" />
              */}
            </div>

            {/* 4 features (2x2 grid on desktop, single column on mobile).
                User explicitly asked for icons here — Lucide icons used. */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-5">
              {ADVISOR_FEATURES.map(({ title, body, icon: Icon }, index) => (
                <AdvisorFeatureCard
                  key={title}
                  title={title}
                  body={body}
                  icon={Icon}
                  index={index}
                />
              ))}
            </div>
          </div>

          {/* Primary CTA — filled mint pill, full prominence */}
          <div className="mt-10 flex justify-end">
            <a
              href={TELEGRAM_URL}
              target="_blank"
              rel="noreferrer"
              className="group inline-flex h-12 items-center justify-center gap-2 rounded-full bg-mint px-6 text-sm font-semibold text-[#06120c] shadow-[0_8px_32px_-8px_var(--mint)] transition-all duration-300 hover:brightness-110 hover:scale-[1.02] focus-ring-mint"
            >
              می‌خوام به عنوان مشاور همکاری کنم
            </a>
          </div>
        </motion.div>

        {/* ============================================================
            Sub-section 3: Teams & institutes
            ============================================================ */}
        <motion.div
          ref={teamsRef}
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24 }}
          animate={teamsInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: reduceMotion ? 0.12 : 0.6, ease: easeOut }}
          className="rounded-3xl border border-border/40 bg-card/20 p-6 text-right sm:p-10"
        >
          <span className="text-xs font-bold text-mint">برای آموزشگاه‌ها و تیم‌های مشاوره</span>
          <h3 className="mt-3 text-balance text-2xl font-black leading-tight text-foreground sm:text-3xl">
            مدیریتِ کلِ تیمت، یک‌جا و شفاف
          </h3>
          <p className="mt-5 max-w-2xl text-sm font-medium leading-8 text-muted-foreground sm:text-base sm:leading-9">
            مدیریتِ یه تیمِ مشاوره نباید با فایل‌های اکسلِ شلوغ و گزارش‌های گیج‌کننده بگذره. با پنلِ سازمانیِ رِوال، می‌تونی عملکردِ همه‌ی مشاورها و روندِ پیشرفتِ تک‌تکِ دانش‌آموزها رو خیلی شفاف و یک‌جا ببینی و کلِ تیمت رو بدون دردسر مدیریت کنی.
          </p>
          {/* Secondary CTA — outlined mint, secondary prominence (different
              style from the primary CTA above). */}
          <div className="mt-7">
            <a
              href={TELEGRAM_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full border border-mint/40 bg-transparent px-5 text-sm font-semibold text-mint transition-all hover:bg-mint/[0.06] hover:border-mint/60 focus-ring-mint"
            >
              <Send className="size-4" aria-hidden="true" />
              پنل ویژه آموزشگاه‌ها و تیم‌ها
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ===== Advisor feature card (with Lucide icon) =====
// Used in sub-section 2. Each card has:
//   - A rounded icon chip (mint accent)
//   - Bold title
//   - Muted body paragraph
// Reveal animation with staggered delay.
function AdvisorFeatureCard({
  title,
  body,
  icon: Icon,
  index,
}: {
  title: string;
  body: string;
  icon: LucideIcon;
  index: number;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      ref={ref}
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{
        duration: reduceMotion ? 0.12 : 0.45,
        delay: reduceMotion ? 0 : index * 0.08,
        ease: easeOut,
      }}
      className="group rounded-2xl border border-border/40 bg-card/20 p-5 transition-colors duration-300 hover:border-mint/30 sm:p-6"
    >
      <div className="flex size-10 items-center justify-center rounded-xl bg-mint/15 text-mint transition-colors group-hover:bg-mint group-hover:text-[#06120c]">
        <Icon className="size-5" strokeWidth={2.2} aria-hidden="true" />
      </div>
      <h4 className="mt-4 text-sm font-black leading-snug text-foreground sm:text-base">
        {title}
      </h4>
      <p className="mt-2 text-xs leading-7 text-muted-foreground sm:text-sm sm:leading-7">
        {body}
      </p>
    </motion.div>
  );
}
