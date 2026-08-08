"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Users,
  GraduationCap,
  BookOpen,
  Building2,
  Check,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ParallaxGrid } from "./parallax-grid";

const easeOut = [0.16, 1, 0.3, 1] as const;

const PERSIAN_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
const toPersian = (n: number) =>
  String(n).replace(/\d/g, (d) => PERSIAN_DIGITS[Number(d)]);

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

/* ============ Persona data ============ */
const PERSONAS = [
  {
    icon: GraduationCap,
    title: "دانش‌آموزان کنکور",
    desc: "برای رسیدن به رشته رویایی‌ات، برنامه‌ریزی اصولی و تمرکز عمیق لازم داری",
    features: ["برنامه ۹۰ روزه کنکور", "فلش‌کارت‌های کنکوری", "آزمون آزمایشی هفتگی"],
  },
  {
    icon: BookOpen,
    title: "دانشجویان دانشگاهی",
    desc: "برای مدیریت پروژه‌ها و امتحانات، روال بهت کمک می‌کنه منظم بمونی",
    features: ["تقویم امتحانات", "نمودار پیشرفت", "یادداشت‌برداری هوشمند"],
  },
  {
    icon: Users,
    title: "مشاوران تحصیلی",
    desc: "اگر مشاور هستی، با روال دانش‌آموزانت رو بهتر مدیریت کن",
    features: ["مدیرت چند دانش‌آموز", "گزارش‌های مشترک", "برنامه‌ریزی گروهی"],
  },
  {
    icon: Building2,
    title: "آموزشگاه‌ها و مدارس",
    desc: "برای آموزشگاه‌ها، روال یک پلتفرم کامل مدیریت یادگیری ارائه می‌ده",
    features: ["پنل مدیریت", "گزارش‌های سازمانی", "یکپارچه‌سازی با سامانه"],
  },
] as const;

/* ============ Component ============ */
export function UseCasesShowcase() {
  return (
    <section
      id="use-cases"
      className="scroll-mt-24 relative overflow-hidden py-24 sm:py-32"
    >
      <ParallaxGrid strength={40} opacity={0.1} />

      {/* Top-left mint glow orb */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 -top-32 h-[32rem] w-[32rem] rounded-full bg-mint/[0.05] blur-[140px]"
      />

      <div className="relative z-10 mx-auto max-w-6xl px-6">
        {/* Header */}
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="mb-5 inline-flex items-center gap-2.5 rounded-full border border-mint/20 bg-mint/[0.08] px-4 py-1.5 text-[11px] font-medium text-mint backdrop-blur-sm">
            <Users className="size-3.5" />
            برای چه کسانی؟
          </span>
          <h2 className="text-balance text-3xl font-extrabold leading-[1.2] tracking-tight sm:text-4xl lg:text-5xl">
            روال برای <span className="text-gradient-mint">هر کسی</span> که یاد
            می‌گیرد
          </h2>
          <p className="mt-5 text-pretty text-base leading-[1.9] text-muted-foreground/80">
            چه دانش‌آموز کنکور باشی، چه دانشجو، چه مدرس — روال با نیازهای تو سازگار
            می‌شه
          </p>
        </Reveal>

        {/* Persona grid */}
        <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PERSONAS.map((persona, idx) => {
            const Icon = persona.icon;
            const number = toPersian(idx + 1).padStart(2, "۰");
            return (
              <Reveal key={persona.title} delay={idx * 0.1}>
                <motion.div
                  whileHover={{ y: -6, scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className={cn(
                    "group relative flex h-full flex-col overflow-hidden rounded-2xl p-5",
                    "surface glow-border-hover",
                    "cursor-default transition-colors duration-300"
                  )}
                >
                  {/* Numbered badge in top-right corner */}
                  <div
                    aria-hidden
                    className="absolute right-4 top-4 z-10 flex size-9 items-center justify-center rounded-lg border border-mint/40 bg-background/85 text-xs font-bold text-mint shadow-[0_2px_12px_rgba(0,0,0,0.25)] backdrop-blur-md"
                  >
                    <span className="nums">{number}</span>
                  </div>

                  {/* Persona illustration area */}
                  <div className="relative mb-5 flex h-28 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-mint-bright to-mint">
                    {/* soft highlight glow */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.22),transparent_60%)]" />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.7, rotate: -8 }}
                      whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                      viewport={{ once: true, margin: "-60px" }}
                      transition={{
                        duration: 0.6,
                        ease: easeOut,
                        delay: idx * 0.1 + 0.1,
                      }}
                      className="relative z-10"
                    >
                      <Icon
                        className="size-14 text-[#06120c] drop-shadow-[0_2px_8px_rgba(0,0,0,0.15)]"
                        strokeWidth={1.6}
                      />
                    </motion.div>
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-bold leading-snug">
                    {persona.title}
                  </h3>

                  {/* Description */}
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground/75">
                    {persona.desc}
                  </p>

                  {/* Feature list */}
                  <ul className="mt-4 space-y-2.5">
                    {persona.features.map((feature, i) => (
                      <motion.li
                        key={feature}
                        className="flex items-start gap-2 text-xs text-foreground/80"
                        initial={{ opacity: 0, x: 8 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{
                          duration: 0.3,
                          ease: easeOut,
                          delay: idx * 0.1 + 0.2 + i * 0.06,
                        }}
                      >
                        <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-mint/10">
                          <Check className="size-2.5 text-mint" strokeWidth={3} />
                        </span>
                        <span>{feature}</span>
                      </motion.li>
                    ))}
                  </ul>

                  {/* Learn more link */}
                  <a
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    className="focus-ring-mint touch-target mt-5 inline-flex items-center gap-1.5 self-start text-xs font-semibold text-mint transition-all hover:gap-2.5"
                  >
                    بیشتر بدان
                    <ArrowLeft className="size-3.5" />
                  </a>
                </motion.div>
              </Reveal>
            );
          })}
        </div>

        {/* Bottom CTA — wide gradient-bordered card */}
        <Reveal delay={0.2}>
          <div className="gradient-border-active relative mt-14 overflow-hidden rounded-2xl">
            {/* subtle inner accent */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_50%,color-mix(in_oklch,var(--mint)_8%,transparent),transparent_55%)]"
            />
            <div className="relative flex flex-col items-center justify-between gap-6 p-6 sm:p-8 md:flex-row md:gap-8">
              {/* Left: text */}
              <div className="text-center md:text-right">
                <div className="flex items-center justify-center gap-2 md:justify-start">
                  <Sparkles className="size-5 text-mint" />
                  <h3 className="text-xl font-extrabold tracking-tight sm:text-2xl">
                    هنوز مطمئن نیستی؟
                  </h3>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground/80">
                  تیم مشاوره ما کمک می‌کنه بهترین مسیر یادگیری رو برای خودت پیدا
                  کنی
                </p>
              </div>
              {/* Right: button */}
              <a
                href="#"
                onClick={(e) => e.preventDefault()}
                className="focus-ring-mint touch-target shine-sweep relative inline-flex shrink-0 items-center gap-2 overflow-hidden rounded-xl bg-mint px-6 py-3 text-sm font-bold text-[#06120c] shadow-[0_0_24px_color-mix(in_oklch,var(--mint)_35%,transparent)] transition-all hover:scale-[1.03] hover:shadow-[0_0_32px_color-mix(in_oklch,var(--mint)_55%,transparent)]"
              >
                با ما مشورت کن
                <ArrowLeft className="size-4" />
              </a>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
