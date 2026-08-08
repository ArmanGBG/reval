"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  ClipboardList,
  Wand2,
  TrendingUp,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ParallaxGrid } from "./parallax-grid";

const easeOut = [0.16, 1, 0.3, 1] as const;

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

/* ============ Data ============ */
const STEPS = [
  {
    number: "۰۱",
    icon: ClipboardList,
    title: "ثبت‌نام و تنظیم",
    desc: "در کمتر از ۲ دقیقه ثبت‌نام کنید و سطح تحصیلی خود را تنظیم کنید.",
  },
  {
    number: "۰۲",
    icon: Wand2,
    title: "برنامه‌ریزی هوشمند",
    desc: "روال بر اساس اهداف و نقاط ضعف، یک برنامه شخصی‌سازی‌شده می‌سازد.",
  },
  {
    number: "۰۳",
    icon: TrendingUp,
    title: "پیشرفت مستمر",
    desc: "هر روز تمرکز عمیق، مرور هوشمند و تحلیل دقیق. نتیجه: رشد مستمر.",
  },
] as const;

/* ============ Step Card ============ */
function StepCard({
  step,
  index,
  isLast,
}: {
  step: (typeof STEPS)[number];
  index: number;
  isLast: boolean;
}) {
  const Icon = step.icon;

  return (
    <div className="flex flex-1 items-start gap-0">
      {/* Card */}
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className={cn(
          "group relative flex-1 rounded-2xl p-6 sm:p-8",
          "surface surface-hover",
          "cursor-default transition-colors duration-300"
        )}
      >
        {/* Step number */}
        <span className="mb-4 block text-5xl font-black leading-none text-gradient-mint-bright sm:text-6xl">
          {step.number}
        </span>

        {/* Icon */}
        <div className="mb-4 flex size-12 items-center justify-center rounded-xl border border-mint/20 bg-mint/[0.06]">
          <Icon className="size-5 text-mint" />
        </div>

        {/* Title */}
        <h3 className="text-base font-bold leading-snug sm:text-lg">
          {step.title}
        </h3>

        {/* Description */}
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground/70">
          {step.desc}
        </p>
      </motion.div>

      {/* Connecting arrow (desktop only, not on last step) */}
      {!isLast && (
        <div className="hidden shrink-0 items-center px-3 lg:flex">
          <ArrowLeft className="size-5 text-mint/40" />
        </div>
      )}
    </div>
  );
}

/* ============ Component ============ */
export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-24 relative overflow-hidden py-24 sm:py-32"
    >
      <ParallaxGrid />

      <div className="relative z-10 mx-auto max-w-6xl px-6">
        {/* Header */}
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="mb-5 inline-flex items-center gap-2.5 rounded-full border border-mint/20 bg-mint/[0.08] px-4 py-1.5 text-[11px] font-medium text-mint backdrop-blur-sm">
            <span className="size-1.5 rounded-full bg-mint shadow-[0_0_8px_var(--mint)]" />
            نحوه کار
          </span>
          <h2 className="text-balance text-3xl font-extrabold leading-[1.2] tracking-tight sm:text-4xl lg:text-5xl">
            سه قدم تا تحول تحصیلی
          </h2>
          <p className="mt-5 text-pretty text-base leading-[1.9] text-muted-foreground/80">
            از ثبت‌نام تا نتیجه، فقط سه قدم فاصله دارید.
          </p>
        </Reveal>

        {/* Steps - vertical on mobile, horizontal on desktop */}
        <div className="mt-14 flex flex-col gap-4 lg:flex-row lg:gap-0">
          {STEPS.map((step, idx) => (
            <Reveal key={step.number} delay={idx * 0.12}>
              <StepCard
                step={step}
                index={idx}
                isLast={idx === STEPS.length - 1}
              />
            </Reveal>
          ))}
        </div>

        {/* Connecting lines for mobile (vertical) */}
        <div className="flex flex-col items-center gap-2 lg:hidden">
          {/* This is handled by the flex-col gap above, no extra elements needed */}
        </div>

        {/* Bottom CTA */}
        <Reveal delay={0.3} className="mt-14 text-center">
          <p className="mb-5 text-lg font-semibold text-foreground/90">
            آماده‌ای شروع کنی؟
          </p>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            className={cn(
              "inline-flex items-center gap-2.5 rounded-full px-8 py-3.5",
              "bg-mint text-[13px] font-bold text-mint-foreground shadow-[0_0_24px_var(--mint)/0.3]",
              "transition-shadow duration-300 hover:shadow-[0_0_32px_var(--mint)/0.5]"
            )}
          >
            شروع کن
            <ArrowLeft className="size-4" />
          </motion.button>
        </Reveal>
      </div>
    </section>
  );
}
