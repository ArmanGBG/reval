"use client";

import * as React from "react";
import { motion, useScroll, useTransform, useMotionValue, useSpring } from "framer-motion";
import {
  Sunrise,
  Sun,
  Sunset,
  Moon,
  BookOpen,
  Brain,
  Target,
  CalendarCheck,
  BarChart3,
  Coffee,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const easeOut = [0.16, 1, 0.3, 1] as const;

type TimelineStep = {
  time: string;
  period: "morning" | "noon" | "evening" | "night";
  icon: React.ElementType;
  title: string;
  desc: string;
  tag: string;
  tagColor: string;
  emoji: string;
  /** Day progress percentage (0-100) */
  progress: number;
};

const TIMELINE: TimelineStep[] = [
  {
    time: "۰۷:۰۰",
    period: "morning",
    icon: Sunrise,
    title: "آغاز روز",
    desc: "روال برنامه روزانه را نمایش می‌دهد. اولین وظیفه با اولویت بالا برجسته می‌شود.",
    tag: "برنامه روزانه",
    tagColor: "mint",
    emoji: "🌅",
    progress: 10,
  },
  {
    time: "۰۹:۳۰",
    period: "morning",
    icon: BookOpen,
    title: "مطالعه عمیق",
    desc: "تمرکز عمیق روی درس اصلی روز و حذف حواس‌پرتی‌های محیطی.",
    tag: "تمرکز ۹۰ دقیقه",
    tagColor: "mint",
    emoji: "📖",
    progress: 25,
  },
  {
    time: "۱۲:۰۰",
    period: "noon",
    icon: Brain,
    title: "مرور فلش‌کارت",
    desc: "سیستم تکرار فاصله‌دار، فلش‌کارت‌های نزدیک به فراموشی را یادآوری می‌کند.",
    tag: "مرور هوشمند",
    tagColor: "mint-bright",
    emoji: "🧠",
    progress: 40,
  },
  {
    time: "۱۴:۰۰",
    period: "noon",
    icon: Coffee,
    title: "استراحت برنامه‌ریزی‌شده",
    desc: "وقفه کوتاه برای بازیابی تمرکز. روال زمان استراحت را بر اساس چرخه‌های روز تنظیم می‌کند.",
    tag: "استراحت ۱۵ دقیقه",
    tagColor: "mint",
    emoji: "☕",
    progress: 50,
  },
  {
    time: "۱۶:۳۰",
    period: "evening",
    icon: Target,
    title: "تمرین هدفمند",
    desc: "تمرین‌های انتخاب‌شده توسط مشاور، بر اساس نقاط ضعف شناسایی‌شده در رادار دانش‌آموز.",
    tag: "تمرین اختصاصی",
    tagColor: "mint-bright",
    emoji: "🎯",
    progress: 65,
  },
  {
    time: "۱۹:۰۰",
    period: "evening",
    icon: CalendarCheck,
    title: "همگام‌سازی با مشاور",
    desc: "گزارش پیشرفت روزانه به‌صورت خودکار برای مشاور ارسال می‌شود. تنظیمات فردا اعمال می‌شود.",
    tag: "گزارش روزانه",
    tagColor: "mint",
    emoji: "📋",
    progress: 78,
  },
  {
    time: "۲۱:۳۰",
    period: "night",
    icon: BarChart3,
    title: "بازتاب روزانه",
    desc: "نمودار انطباق، زمان تمرکز و آمار مرور را می‌بیند. ضعف‌ها برای فردا برنامه‌ریزی می‌شوند.",
    tag: "تحلیل روزانه",
    tagColor: "mint-bright",
    emoji: "📊",
    progress: 90,
  },
  {
    time: "۲۳:۰۰",
    period: "night",
    icon: Moon,
    title: "آمادگی برای فردا",
    desc: "روال برنامه فردا را آماده می‌کند. یادآوری خواب کافی برای تثبیت یادگیری.",
    tag: "برنامه فردا",
    tagColor: "mint",
    emoji: "🌙",
    progress: 100,
  },
];

const PERIOD_META: Record<
  TimelineStep["period"],
  { label: string; icon: React.ElementType; gradient: string }
> = {
  morning: {
    label: "صبح",
    icon: Sunrise,
    gradient: "from-mint/15 via-mint/5 to-transparent",
  },
  noon: {
    label: "ظهر",
    icon: Sun,
    gradient: "from-mint-bright/15 via-mint/5 to-transparent",
  },
  evening: {
    label: "عصر",
    icon: Sunset,
    gradient: "from-amber-300/10 via-mint/5 to-transparent",
  },
  night: {
    label: "شب",
    icon: Moon,
    gradient: "from-indigo-300/10 via-mint/5 to-transparent",
  },
};

function TimelineCard({ step, index }: { step: TimelineStep; index: number }) {
  const Icon = step.icon;

  // Subtle hover parallax effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 150, damping: 15 });
  const springY = useSpring(mouseY, { stiffness: 150, damping: 15 });

  const handleMouseMove = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = (e.clientX - rect.left - rect.width / 2) / rect.width;
      const y = (e.clientY - rect.top - rect.height / 2) / rect.height;
      mouseX.set(x * 4);
      mouseY.set(y * 4);
    },
    [mouseX, mouseY]
  );

  const handleMouseLeave = React.useCallback(() => {
    mouseX.set(0);
    mouseY.set(0);
  }, [mouseX, mouseY]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 32, scale: 0.97 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, ease: easeOut, delay: index * 0.06 }}
      className="group relative"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        style={{ x: springX, y: springY }}
        className="surface surface-hover corner-sparkle relative rounded-2xl p-6 sm:p-7"
      >
        {/* Header row: emoji + time + icon */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Period emoji */}
            <span className="text-lg" role="img" aria-label={step.title}>
              {step.emoji}
            </span>
            <div
              className={cn(
                "flex size-11 items-center justify-center rounded-xl border transition-all duration-300 group-hover:scale-110 time-badge-pulse",
                "border-mint/20 bg-mint/[0.08] text-mint"
              )}
            >
              <Icon className="size-5" />
            </div>
            <div>
              <div className="nums text-xl font-extrabold text-foreground">
                {step.time}
              </div>
              <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
                {PERIOD_META[step.period].label}
              </div>
            </div>
          </div>
          {/* Tag */}
          <span
            className={cn(
              "rounded-full border px-3 py-1 text-[10px] font-semibold",
              step.tagColor === "mint-bright"
                ? "border-mint-bright/30 bg-mint-bright/[0.08] text-mint-bright"
                : "border-mint/25 bg-mint/[0.08] text-mint"
            )}
          >
            {step.tag}
          </span>
        </div>

        {/* Day progress indicator */}
        <div className="mt-4 flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted/30">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: `${step.progress}%` }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, ease: easeOut, delay: 0.3 + index * 0.06 }}
              className="h-full rounded-full bg-gradient-to-l from-mint-bright to-mint"
            />
          </div>
          <span className="nums text-[10px] font-medium text-mint/60">
            {step.progress}٪
          </span>
        </div>

        {/* Title + desc */}
        <h3 className="mt-4 text-base font-bold text-foreground sm:text-lg">
          {step.title}
        </h3>
        <p className="mt-2 text-sm leading-[1.85] text-muted-foreground/80">
          {step.desc}
        </p>
      </motion.div>
    </motion.div>
  );
}

/**
 * "Day in the Life" timeline section.
 *
 * Showcases a typical day of a student using روال — from morning planning
 * through evening reflection. Uses a scroll-linked progress rail to give
 * a sense of journey through the day.
 */
export function DayInLifeTimeline() {
  const sectionRef = React.useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start 80%", "end 20%"],
  });

  // The vertical progress line fills as the user scrolls through
  const lineHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <section
      id="day-in-life"
      className="relative scroll-mt-24 py-28 sm:py-36"
      aria-label="یک روز با روال"
    >
      {/* Background ambient */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/4 top-1/4 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-mint/[0.05] blur-[160px]" />
        <div className="absolute right-1/4 bottom-1/4 h-[32rem] w-[32rem] translate-x-1/2 rounded-full bg-mint-bright/[0.04] blur-[140px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.75, ease: easeOut }}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="mb-5 inline-flex items-center gap-2.5 rounded-full border border-mint/20 bg-mint/[0.08] px-4 py-1.5 text-[11px] font-medium text-mint backdrop-blur-sm">
            <Sunrise className="size-3.5" />
            یک روز با روال
          </span>
          <h2 className="text-balance text-3xl font-extrabold leading-[1.2] tracking-tight sm:text-4xl lg:text-5xl">
            از صبح تا شب،{" "}
            <span className="text-gradient-mint animated-gradient-underline">همه چیز روی مسیر</span>
          </h2>
          <p className="mt-5 text-pretty leading-[1.9] text-muted-foreground/80">
            یک روز نمایی از زندگی دانش‌آموزی که از روال استفاده می‌کند. هر
            لحظه با هدفی مشخص، هر اقدام با تحلیلی همراه.
          </p>
        </motion.div>

        {/* Timeline */}
        <div
          ref={sectionRef}
          className="relative mt-16 sm:mt-20"
        >
          {/* Vertical progress rail (desktop only, on the right for RTL) */}
          <div className="absolute right-[calc(50%-1px)] top-0 hidden h-full w-px bg-border/50 lg:block">
            <motion.div
              className="absolute inset-x-0 top-0 w-px bg-gradient-to-b from-mint-bright via-mint to-mint/60"
              style={{ height: lineHeight }}
            />
            {/* Soft glow following the progress */}
            <motion.div
              className="absolute inset-x-[-2px] top-0 w-[5px] bg-mint/40 blur-md"
              style={{ height: lineHeight }}
            />
          </div>

          {/* Timeline cards — alternating layout on desktop */}
          <div className="space-y-8 sm:space-y-10 lg:grid lg:grid-cols-2 lg:gap-x-16 lg:gap-y-12 lg:space-y-0">
            {TIMELINE.map((step, i) => (
              <div
                key={step.time}
                className={cn(
                  "relative",
                  // Alternate sides on desktop
                  i % 2 === 0 ? "lg:pl-8 dotted-connector" : "lg:pr-8 lg:col-start-2 dotted-connector-ltr"
                )}
              >
                {/* Center dot marker (desktop) */}
                <div
                  className="absolute right-[calc(50%-7px)] top-8 hidden size-3.5 items-center justify-center lg:flex"
                  style={{
                    // Position on the opposite side for odd cards
                    ...(i % 2 !== 0
                      ? { right: "auto", left: "calc(50% - 7px)" }
                      : {}),
                  }}
                >
                  <motion.span
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{
                      duration: 0.5,
                      ease: easeOut,
                      delay: i * 0.06 + 0.2,
                    }}
                    className={cn(
                      "size-3.5 rounded-full border-2 bg-background",
                      i === 0
                        ? "border-mint-bright shadow-[0_0_16px_var(--mint-bright)]"
                        : "border-mint/60"
                    )}
                  >
                    {i === 0 && (
                      <span className="absolute inset-0 animate-ping rounded-full bg-mint-bright/40" />
                    )}
                  </motion.span>
                </div>

                <TimelineCard step={step} index={i} />
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA — outcome summary with shimmer border */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, ease: easeOut }}
          className="mx-auto mt-20 max-w-3xl"
        >
          <div className="border-shimmer relative overflow-hidden rounded-3xl p-8 sm:p-10">
            <div className="pointer-events-none absolute inset-0 mesh-grad-bg opacity-50" />
            <div className="relative flex flex-col items-center gap-6 text-center sm:flex-row sm:justify-between sm:text-right">
              <div className="flex items-center gap-4">
                <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-mint/20 bg-mint/[0.08] glow-pulse-mint">
                  <CheckCircle2 className="size-7 text-mint" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-foreground sm:text-2xl gradient-text-3d">
                    روزی با روال، روزی با نتیجه
                  </h3>
                  <p className="mt-1.5 text-sm text-muted-foreground/80">
                    هر روز با تمرکز عمیق و تحلیل دقیق، یک گام به هدف نزدیک‌تر.
                  </p>
                </div>
              </div>
              <a
                href="#signup"
                className="shine-sweep group inline-flex shrink-0 items-center gap-2 rounded-full bg-mint h-12 px-6 text-sm font-semibold text-[#06120c] shadow-[0_10px_36px_-8px_var(--mint)] transition-all duration-300 hover:shadow-[0_14px_44px_-6px_var(--mint-bright)] hover:brightness-110 hover:scale-[1.02]"
              >
                شروع کنید
                <Sunrise className="size-4 transition-transform duration-300 group-hover:rotate-12" />
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
