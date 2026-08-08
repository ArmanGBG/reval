"use client";

import * as React from "react";
import { motion, useInView } from "framer-motion";
import { BarChart3, Brain, Target, Clock } from "lucide-react";
import { AnimatedCounter } from "./animated-counter";
import { cn } from "@/lib/utils";

const easeOut = [0.16, 1, 0.3, 1] as const;

/* ============ Mini Bar Chart Visualization ============ */
function MiniBarChart() {
  const ref = React.useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  /* 7 bars with different heights representing weekly activity */
  const barHeights = [65, 45, 80, 55, 90, 70, 85];

  return (
    <div ref={ref} className="flex items-end gap-1 h-10">
      {barHeights.map((h, i) => (
        <motion.div
          key={i}
          className="w-2 rounded-t-sm bg-mint/40"
          initial={{ height: 0 }}
          animate={inView ? { height: `${(h / 100) * 40}px` } : { height: 0 }}
          transition={{
            duration: 0.6,
            ease: easeOut,
            delay: i * 0.08,
          }}
        />
      ))}
    </div>
  );
}

/* ============ Circular Progress Indicator ============ */
function CircularProgress({
  value,
  size = 44,
  strokeWidth = 3.5,
}: {
  value: number; // 0-100
  size?: number;
  strokeWidth?: number;
}) {
  const ref = React.useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="-rotate-90"
    >
      {/* Background circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-border/40"
      />
      {/* Progress circle */}
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        className="text-mint"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={
          inView
            ? { strokeDashoffset: offset }
            : { strokeDashoffset: circumference }
        }
        transition={{ duration: 1.5, ease: easeOut, delay: 0.3 }}
      />
    </svg>
  );
}

/* ============ Mini Clock Visualization ============ */
function MiniClock() {
  const ref = React.useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <div ref={ref} className="relative size-10">
      <svg viewBox="0 0 40 40" className="size-full">
        {/* Clock face */}
        <circle
          cx="20"
          cy="20"
          r="17"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-border/40"
        />
        {/* Hour marks */}
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i * 30 * Math.PI) / 180;
          const x1 = 20 + 14 * Math.sin(angle);
          const y1 = 20 - 14 * Math.cos(angle);
          const x2 = 20 + 16 * Math.sin(angle);
          const y2 = 20 - 16 * Math.cos(angle);
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="currentColor"
              strokeWidth="1"
              className="text-border/30"
            />
          );
        })}
        {/* Hour hand */}
        <motion.line
          x1="20"
          y1="20"
          x2="20"
          y2="10"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="text-mint/70"
          initial={{ rotate: 0 }}
          animate={inView ? { rotate: 255 } : { rotate: 0 }}
          transition={{ duration: 1.2, ease: easeOut, delay: 0.2 }}
          style={{ originX: "20px", originY: "20px" }}
        />
        {/* Minute hand */}
        <motion.line
          x1="20"
          y1="20"
          x2="20"
          y2="7"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          className="text-mint"
          initial={{ rotate: 0 }}
          animate={inView ? { rotate: 180 } : { rotate: 0 }}
          transition={{ duration: 1.5, ease: easeOut, delay: 0.3 }}
          style={{ originX: "20px", originY: "20px" }}
        />
        {/* Center dot */}
        <circle cx="20" cy="20" r="1.5" className="fill-mint" />
      </svg>
    </div>
  );
}

/* ============ Counter Dots Visualization ============ */
function FlashcardViz() {
  const ref = React.useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <div ref={ref} className="flex items-center gap-1">
      {/* Stacked cards */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="size-6 rounded-sm border border-mint/20 bg-mint/10"
          initial={{ opacity: 0, x: 10 }}
          animate={inView ? { opacity: 1 - i * 0.2, x: 0 } : {}}
          transition={{ duration: 0.5, ease: easeOut, delay: i * 0.15 }}
          style={{ marginLeft: i > 0 ? -4 : 0 }}
        />
      ))}
      <motion.span
        className="mr-1 text-[10px] text-mint/60"
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        ×۱M
      </motion.span>
    </div>
  );
}

/* ============ Stat Card Data ============ */
const STATS = [
  {
    icon: BarChart3,
    label: "فعالیت روزانه",
    value: "۱۲,۵۰۰+",
    counterTarget: 12500,
    counterSuffix: "+",
    kicker: "کاربر فعال",
    viz: "bar",
  },
  {
    icon: Brain,
    label: "فلش‌کارت مرور شده",
    value: "۲.۱ میلیون",
    counterTarget: 2100,
    counterSuffix: "K",
    kicker: "فلش‌کارت",
    viz: "flashcard",
  },
  {
    icon: Target,
    label: "نرخ انطباق",
    value: "۹۴.۷٪",
    counterTarget: 947,
    counterSuffix: "٪",
    counterDivisor: 10,
    kicker: "بازه اطمینان",
    viz: "circle",
  },
  {
    icon: Clock,
    label: "زمان تمرکز",
    value: "۸.۵ ساعت",
    counterTarget: 85,
    counterSuffix: " ساعت",
    counterDivisor: 10,
    kicker: "میانگین روزانه",
    viz: "clock",
  },
];

/* ============ Stat Card ============ */
function StatCard({
  stat,
  index,
}: {
  stat: (typeof STATS)[0];
  index: number;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const Icon = stat.icon;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, ease: easeOut, delay: index * 0.12 }}
      whileHover={{ y: -6, scale: 1.02 }}
      className={cn(
        "surface surface-hover glow-border-hover relative overflow-hidden rounded-2xl p-6 sm:p-8"
      )}
    >
      {/* Icon in mint-bordered circle */}
      <div className="flex size-12 items-center justify-center rounded-xl border border-mint/20 bg-mint/[0.08]">
        <Icon className="size-5 text-mint sm:size-6" />
      </div>

      {/* Large animated number */}
      <div className="mt-5">
        <div className="nums text-3xl font-extrabold text-foreground sm:text-4xl">
          {stat.viz === "circle" ? (
            // For percentage, use the Persian formatted value directly with animation
            <AnimatedCounter
              target={stat.counterTarget}
              suffix={stat.counterSuffix}
              duration={2}
            />
          ) : stat.viz === "clock" ? (
            <AnimatedCounter
              target={stat.counterTarget}
              suffix={stat.counterSuffix}
              duration={2}
            />
          ) : (
            <AnimatedCounter
              target={stat.counterTarget}
              suffix={stat.counterSuffix}
              duration={2}
            />
          )}
        </div>
      </div>

      {/* Label */}
      <div className="mt-2 text-sm font-semibold text-foreground/80 sm:text-base">
        {stat.label}
      </div>
      <div className="mt-0.5 text-[11px] text-muted-foreground/60">
        {stat.kicker}
      </div>

      {/* Mini visualization */}
      <div className="mt-5">
        {stat.viz === "bar" && <MiniBarChart />}
        {stat.viz === "flashcard" && <FlashcardViz />}
        {stat.viz === "circle" && (
          <div className="flex items-center gap-3">
            <CircularProgress value={94.7} size={44} strokeWidth={3.5} />
            <span className="text-[10px] text-mint/60">۹۴.۷٪ انطباق</span>
          </div>
        )}
        {stat.viz === "clock" && (
          <div className="flex items-center gap-3">
            <MiniClock />
            <span className="text-[10px] text-mint/60">
              ۸.۵ ساعت تمرکز
            </span>
          </div>
        )}
      </div>

      {/* Subtle corner glow */}
      <div className="pointer-events-none absolute -left-8 -top-8 size-24 rounded-full bg-mint/[0.04] blur-2xl" />
    </motion.div>
  );
}

/* ============ Main Component ============ */
export function StatsDashboard() {
  return (
    <section
      id="stats"
      className="relative scroll-mt-24 py-20 sm:py-28"
    >
      {/* Subtle grid background for depth */}
      <div className="pointer-events-none absolute inset-0 bg-grid-faint opacity-40" />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: easeOut }}
          className="mb-14 text-center"
        >
          <span className="mb-5 inline-flex items-center gap-2.5 rounded-full border border-mint/20 bg-mint/[0.08] px-4 py-1.5 text-[11px] font-medium text-mint backdrop-blur-sm">
            <Target className="size-3.5" />
            در یک نگاه
          </span>
          <h2 className="text-balance text-3xl font-extrabold leading-[1.2] tracking-tight sm:text-4xl lg:text-5xl">
            اعداد <span className="text-gradient-mint gradient-shift">حرف</span> می‌زنند
          </h2>
        </motion.div>

        {/* 2x2 grid (desktop) / stacked (mobile) */}
        <div className="grid gap-5 sm:grid-cols-2 lg:gap-6">
          {STATS.map((stat, i) => (
            <StatCard key={stat.label} stat={stat} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
