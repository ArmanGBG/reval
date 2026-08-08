"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Trophy,
  Flame,
  Star,
  Target,
  Crown,
  Zap,
  Award,
  Medal,
  Sparkles,
  Lock,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

const easeOut = [0.16, 1, 0.3, 1] as const;

/* ============ Helpers ============ */
const PERSIAN_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
const toPersianDigits = (input: number | string): string =>
  String(input).replace(/\d/g, (d) => PERSIAN_DIGITS[Number(d)]);

/* ============ Reveal wrapper ============ */
function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32, scale: 0.97 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.8, ease: easeOut, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ============ Achievement data ============ */
type Achievement = {
  title: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  progress: number;
  unlocked: boolean;
};

const ACHIEVEMENTS: Achievement[] = [
  {
    title: "شروعگر پروازی",
    desc: "اولین برنامه هفتگی‌ات را کامل کن",
    icon: Flame,
    progress: 100,
    unlocked: true,
  },
  {
    title: "فلیپ‌کارت طلایی",
    desc: "۱۰۰ فلش‌کارت مرور کن",
    icon: Zap,
    progress: 75,
    unlocked: false,
  },
  {
    title: "ماراثون تمرکز",
    desc: "۲۸ روز پشت سر هم تمرکز عمیق",
    icon: Target,
    progress: 60,
    unlocked: false,
  },
  {
    title: "نابغه داده",
    desc: "تمام نمودارهای رادار را پر کن",
    icon: Star,
    progress: 100,
    unlocked: true,
  },
  {
    title: "قهرمان کنکور",
    desc: "نمره کامل در ۵ آزمون آزمایشی",
    icon: Crown,
    progress: 40,
    unlocked: false,
  },
  {
    title: "استاد برنامه‌ریزی",
    desc: "۱۰ هفته پشت سر هم برنامه داشته باش",
    icon: Award,
    progress: 90,
    unlocked: false,
  },
];

/* ============ Bottom stats data ============ */
const STATS = [
  {
    title: "بیش از ۵۰",
    label: "دستاورد قابل باز کردن",
    icon: Sparkles,
  },
  {
    title: "هر هفته",
    label: "دستاوردهای جدید",
    icon: Trophy,
  },
  {
    title: "امتیاز جایزه",
    label: "برای هر دستاورد",
    icon: Medal,
  },
] as const;

/* ============ Floating sparkles ============ */
const SPARKLES = [
  { top: "12%", left: "8%", size: 6, delay: 0, duration: 5 },
  { top: "22%", left: "88%", size: 4, delay: 1.2, duration: 6 },
  { top: "68%", left: "6%", size: 5, delay: 0.6, duration: 5.5 },
  { top: "78%", left: "92%", size: 4, delay: 1.8, duration: 4.8 },
] as const;

/* ============ Badge ============ */
function BadgeIcon({
  achievement,
}: {
  achievement: Achievement;
}) {
  const Icon = achievement.icon;
  const isUnlocked = achievement.unlocked;

  return (
    <div className="relative flex size-20 items-center justify-center">
      {/* Soft mint glow behind */}
      <span
        aria-hidden="true"
        className={cn(
          "absolute inset-0 rounded-full blur-2xl scale-150",
          isUnlocked ? "bg-mint/40" : "bg-mint/15"
        )}
      />

      {/* Rotating conic-gradient ring */}
      <motion.div
        aria-hidden="true"
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "conic-gradient(from 0deg, var(--mint) 0%, transparent 25%, var(--mint-bright) 50%, transparent 75%, var(--mint) 100%)",
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      />

      {/* Inner gradient circle with icon */}
      <div
        className={cn(
          "absolute inset-[3px] flex items-center justify-center rounded-full",
          "bg-gradient-to-br from-mint-bright to-mint",
          "shadow-[inset_0_1px_0_0_oklch(1_0_0_/_30%)]",
          !isUnlocked && "opacity-60"
        )}
      >
        <Icon className="size-8 text-background" />
      </div>

      {/* Locked overlay */}
      {!isUnlocked && (
        <motion.div
          aria-hidden="true"
          className={cn(
            "absolute inset-0 flex items-center justify-center rounded-full",
            "backdrop-blur-[2px] bg-background/30"
          )}
        >
          <Lock className="size-5 text-muted-foreground" />
        </motion.div>
      )}

      {/* Unlocked indicator (small mint check badge) */}
      {isUnlocked && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{
            type: "spring",
            stiffness: 320,
            damping: 18,
            delay: 0.3,
          }}
          className={cn(
            "absolute -top-1 -right-1 flex size-6 items-center justify-center rounded-full",
            "bg-mint text-background shadow-[0_0_12px_var(--mint)]",
            "ring-2 ring-background"
          )}
          aria-label="باز شده"
        >
          <Check className="size-3.5" strokeWidth={3} />
        </motion.div>
      )}
    </div>
  );
}

/* ============ Achievement Card ============ */
function AchievementCard({
  achievement,
  index,
}: {
  achievement: Achievement;
  index: number;
}) {
  const progressText = toPersianDigits(achievement.progress);

  return (
    <Reveal delay={index * 0.1}>
      <motion.div
        whileHover={{ y: -8, scale: 1.03 }}
        transition={{ type: "spring", stiffness: 280, damping: 22 }}
        className={cn(
          "group relative flex h-full flex-col items-center rounded-2xl p-6 text-center",
          "surface glow-border-hover",
          "cursor-default"
        )}
      >
        {/* Badge */}
        <div className="mb-5">
          <BadgeIcon achievement={achievement} />
        </div>

        {/* Title */}
        <h3 className="text-base font-bold leading-snug sm:text-lg">
          {achievement.title}
        </h3>

        {/* Description */}
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground/70">
          {achievement.desc}
        </p>

        {/* Progress bar */}
        <div className="mt-5 w-full">
          <div className="flex items-center gap-3">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border/40">
              <motion.div
                className="h-full rounded-full bg-gradient-to-l from-mint-bright to-mint"
                initial={{ width: 0 }}
                whileInView={{ width: `${achievement.progress}%` }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{
                  duration: 1.1,
                  ease: easeOut,
                  delay: 0.25 + index * 0.1,
                }}
              />
            </div>
            <span
              className={cn(
                "nums shrink-0 text-xs font-bold",
                achievement.unlocked ? "text-mint" : "text-muted-foreground/80"
              )}
              dir="ltr"
            >
              {progressText}٪
            </span>
          </div>
        </div>
      </motion.div>
    </Reveal>
  );
}

/* ============ Main Component ============ */
export function AchievementsShowcase() {
  return (
    <section
      id="achievements"
      className="scroll-mt-24 relative overflow-hidden py-24 sm:py-32"
    >
      {/* Dot pattern background */}
      <div
        aria-hidden="true"
        className="dot-pattern pointer-events-none absolute inset-0 opacity-20"
      />

      {/* Top-center mint glow orb */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/3"
      >
        <div className="h-[40rem] w-[40rem] rounded-full bg-mint/[0.05] blur-[150px]" />
      </div>

      {/* Floating sparkle particles */}
      {SPARKLES.map((s, idx) => (
        <motion.span
          key={idx}
          aria-hidden="true"
          className="pointer-events-none absolute rounded-full bg-mint shadow-[0_0_8px_var(--mint)]"
          style={{
            top: s.top,
            left: s.left,
            width: s.size,
            height: s.size,
          }}
          animate={{
            y: [0, -22, 0],
            opacity: [0.2, 1, 0.2],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: s.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: s.delay,
          }}
        />
      ))}

      <div className="relative z-10 mx-auto max-w-6xl px-6">
        {/* Header */}
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="mb-5 inline-flex items-center gap-2.5 rounded-full border border-mint/20 bg-mint/[0.08] px-4 py-1.5 text-[11px] font-medium text-mint backdrop-blur-sm">
            <Trophy className="size-3.5" />
            دستاوردها و نشان‌ها
          </span>
          <h2 className="text-balance text-3xl font-extrabold leading-[1.2] tracking-tight sm:text-4xl lg:text-5xl">
            هر قدم، یک <span className="text-gradient-mint">دستاورد</span>
          </h2>
          <p className="mt-5 text-pretty text-base leading-[1.9] text-muted-foreground/80">
            با هر فعالیت، نشان جدیدی باز کن و انگیزه‌ات را حفظ کن
          </p>
        </Reveal>

        {/* Achievements grid */}
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {ACHIEVEMENTS.map((achievement, idx) => (
            <AchievementCard
              key={achievement.title}
              achievement={achievement}
              index={idx}
            />
          ))}
        </div>

        {/* Bottom stats row */}
        <div className="mt-14 grid gap-4 sm:grid-cols-3">
          {STATS.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <Reveal key={stat.label} delay={idx * 0.1}>
                <div
                  className={cn(
                    "flex items-center gap-4 rounded-2xl p-4 sm:p-5",
                    "surface surface-hover",
                    "cursor-default transition-colors duration-300"
                  )}
                >
                  {/* Icon box */}
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-mint/20 bg-mint/[0.06]">
                    <Icon className="size-5 text-mint" />
                  </div>

                  {/* Text */}
                  <div className="min-w-0 text-right">
                    <div className="text-sm font-bold leading-snug">
                      {stat.title}
                    </div>
                    <div className="mt-0.5 text-xs leading-relaxed text-muted-foreground/70">
                      {stat.label}
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
