"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Building2,
  Brain,
  GraduationCap,
  BookOpen,
  Target,
  Award,
  Landmark,
  Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ParallaxGrid } from "./parallax-grid";
import { AnimatedCounter } from "./animated-counter";

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
const INSTITUTIONS = [
  {
    icon: Building2,
    name: "موسسه گیلان",
    desc: "برترین موسسه کنکور شمال",
  },
  {
    icon: Brain,
    name: "آکادمی نور",
    desc: "پیشرو در آموزش هوشمند",
  },
  {
    icon: GraduationCap,
    name: "کانون استادان",
    desc: "شبکه استادان برتر کشور",
  },
  {
    icon: BookOpen,
    name: "هوشمند آموزش",
    desc: "فناوری آموزشی پیشرفته",
  },
  {
    icon: Target,
    name: "مرکز پارس",
    desc: "تمرکز بر نتیجه‌گیری",
  },
  {
    icon: Award,
    name: "موسسه آینده",
    desc: "آماده‌سازی آینده‌سازان",
  },
  {
    icon: Landmark,
    name: "آموزشگاه پارسیان",
    desc: "سابقه ۲۰ ساله",
  },
  {
    icon: Trophy,
    name: "موسسه طلایی",
    desc: "کیفیت طلایی آموزش",
  },
] as const;

const STATS = [
  { value: 12, suffix: "+", label: "موسسه" },
  { value: 5000, suffix: "+", label: "دانش‌آموز" },
  { value: 98, suffix: "٪", label: "رضایت" },
  { value: 3, suffix: "", label: "سال تجربه" },
] as const;

/* ============ Component ============ */
export function TrustedBy() {
  return (
    <section
      id="trusted-by"
      className="scroll-mt-24 relative overflow-hidden py-24 sm:py-32"
    >
      <ParallaxGrid />

      <div className="relative z-10 mx-auto max-w-6xl px-6">
        {/* Header */}
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="mb-5 inline-flex items-center gap-2.5 rounded-full border border-mint/20 bg-mint/[0.08] px-4 py-1.5 text-[11px] font-medium text-mint backdrop-blur-sm">
            <span className="size-1.5 rounded-full bg-mint shadow-[0_0_8px_var(--mint)]" />
            مورد اعتماد
          </span>
          <h2 className="text-balance text-3xl font-extrabold leading-[1.2] tracking-tight sm:text-4xl lg:text-5xl">
            مورد اعتماد بهترین‌های حوزه آموزش
          </h2>
        </Reveal>

        {/* Institution grid */}
        <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {INSTITUTIONS.map((inst, idx) => {
            const Icon = inst.icon;
            return (
              <Reveal key={inst.name} delay={idx * 0.07}>
                <motion.div
                  whileHover={{ y: -4, scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className={cn(
                    "group relative rounded-2xl p-5",
                    "surface glow-border-hover corner-sparkle",
                    "cursor-default transition-colors duration-300"
                  )}
                >
                  {/* Icon */}
                  <div className="mb-4 flex size-11 items-center justify-center rounded-xl border border-mint/20 bg-mint/[0.06]">
                    <Icon className="size-5 text-mint" />
                  </div>
                  {/* Name */}
                  <h3 className="text-sm font-bold leading-snug">
                    {inst.name}
                  </h3>
                  {/* Description */}
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground/70">
                    {inst.desc}
                  </p>
                </motion.div>
              </Reveal>
            );
          })}
        </div>

        {/* Stats row */}
        <Reveal delay={0.3}>
          <div className="mt-16 grid grid-cols-2 gap-6 rounded-2xl border border-white/[0.06] bg-surface/60 p-8 backdrop-blur-md sm:grid-cols-4">
            {STATS.map((stat, idx) => (
              <div
                key={stat.label}
                className="flex flex-col items-center gap-1.5 text-center"
              >
                <div className="text-3xl font-extrabold sm:text-4xl">
                  <AnimatedCounter
                    target={stat.value}
                    suffix={stat.suffix}
                    duration={2}
                    className="text-gradient-mint"
                  />
                </div>
                <span className="text-xs font-medium text-muted-foreground/70">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
