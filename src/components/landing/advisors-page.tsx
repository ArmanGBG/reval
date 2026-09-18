"use client";

import * as React from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import {
  CalendarClock,
  BarChart3,
  TrendingUp,
  GraduationCap,
  Send,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";

// ===== Advisors Page (dedicated view within `/` route) =====
// Reached by clicking "اطلاعات بیشتر" on the main landing page's Advisors
// section. Shows the detailed advisor content that USED to live inline on
// the main landing page but was moved here per user's request to keep the
// main landing page focused.
//
// Layout (top-to-bottom):
//   1. Top bar with "بازگشت به لندینگ" back button (calls onBack)
//   2. Advisor features sub-section:
//      - H2 "وقتت رو برای کارهای تکراری هدر نده!"
//      - Image placeholder (for "عکس پنل مشاور") on visual LEFT
//      - 4 Lucide-icon feature cards (2x2) on visual RIGHT
//      - Primary CTA "می‌خوام به عنوان مشاور همکاری کنم" → Telegram
//   3. Teams & institutes sub-section (rounded card):
//      - Eyebrow + H3 + paragraph
//      - Secondary CTA "پنل ویژه آموزشگاه‌ها و تیم‌ها" (with Send icon)
//
// Responsive: stacks to single column on mobile; 2-column layouts on sm+.
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

export function AdvisorsPage({ onBack }: { onBack: () => void }) {
  const featuresRef = React.useRef<HTMLDivElement>(null);
  const featuresInView = useInView(featuresRef, { once: true, margin: "-60px" });
  const teamsRef = React.useRef<HTMLDivElement>(null);
  const teamsInView = useInView(teamsRef, { once: true, margin: "-60px" });
  const reduceMotion = useReducedMotion();

  // On mount (i.e. every time the user navigates to the advisors page from
  // the main landing), scroll to the top of the viewport. Without this the
  // browser preserves the previous scroll position — so if the user was
  // scrolled down to the Advisors section when they clicked "اطلاعات بیشتر",
  // they'd land at the BOTTOM of the advisors page and have to scroll up
  // manually to see "وقتت رو برای کارهای تکراری هدر نده!".
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="relative isolate flex min-h-screen flex-col overflow-x-clip bg-background font-yekan">
      {/* ===== Top bar (back button) =====
          pt-20 clears the fixed Header's h-16 (per ui-ux-pro-max-skill
          "Sticky Navigation" rule: padding-top to body equal to nav height). */}
      <div className="mx-auto w-full max-w-5xl px-5 pt-20 pb-4 sm:px-8">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex h-10 items-center gap-1.5 rounded-full border border-border/60 bg-card/30 px-4 text-xs font-medium text-muted-foreground transition-colors hover:border-mint/40 hover:text-foreground"
        >
          <ArrowRight className="size-3.5 flip-rtl" aria-hidden="true" />
          بازگشت به لندینگ
        </button>
      </div>

      {/* ===== Advisor features sub-section ===== */}
      <section className="relative overflow-hidden pb-20 sm:pb-28">
        <div className="mx-auto max-w-5xl px-5 sm:px-8">
          <motion.div
            ref={featuresRef}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24 }}
            animate={featuresInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: reduceMotion ? 0.12 : 0.6, ease: easeOut }}
          >
            <div className="mb-12 max-w-2xl text-right">
              <h2 className="text-balance text-3xl font-black leading-tight text-foreground sm:text-4xl">
                وقتت رو برای کارهای تکراری هدر نده!
              </h2>
            </div>

            {/* Image + features grid:
                - Desktop (sm+): image on visual LEFT (end in RTL), 4 feature
                  cards in a 2x2 sub-grid on visual RIGHT (start in RTL).
                - Mobile: stacked (image first, features below). */}
            <div className="grid gap-10 sm:grid-cols-2 sm:gap-12">
              {/* Image placeholder for "عکس پنل مشاور"
                  (replace with real screenshot when ready — see commented
                  <Image> block below the placeholder div). */}
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-border/50 bg-card/30">
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center text-muted-foreground/60">
                  <span className="text-xs font-bold text-mint">پنل مشاور</span>
                  <span className="text-xs">عکس پنل مشاور — اینجا قرار می‌گیره</span>
                </div>
                {/* When ready, replace the placeholder div with:
                    <Image src="/advisor-panel.png" alt="پنل مشاور روال" fill
                           className="object-cover object-top"
                           sizes="(max-width: 640px) 100vw, 50vw" />
                */}
              </div>

              {/* 4 feature cards (2x2 grid on desktop, single column on mobile) */}
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

            {/* Primary CTA — filled mint pill */}
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
        </div>
      </section>

      {/* ===== Teams & institutes sub-section ===== */}
      <section className="relative overflow-hidden border-t border-border/50 py-20 sm:py-28">
        <div className="mx-auto max-w-5xl px-5 sm:px-8">
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
            {/* Secondary CTA — outlined mint with Send icon (different style
                from the primary CTA's filled mint pill above). */}
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
    </div>
  );
}

// ===== Advisor feature card (with Lucide icon) =====
// Same card style as the inline version on the main landing page used to
// have before this content was moved to the dedicated advisors page.
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
