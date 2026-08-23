"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { AnimatedCounter } from "./animated-counter";
import {
  Quote,
  Star,
  TrendingUp,
  Clock,
  Trophy,
  BadgeCheck,
  ArrowLeft,
  Sparkles,
} from "lucide-react";

const easeOut = [0.16, 1, 0.3, 1] as const;

const PERSIAN_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
const toPersian = (n: number | string) =>
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
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.75, ease: easeOut, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ============ Featured testimonial data ============ */
const FEATURED = {
  quote:
    "با روال، از یک دانش‌آموز معمولی به رتبه برتر کنکور رسیدم. برنامه‌ریزی هوشمند، رادار ضعف و فلش‌کارت‌های اصولی، مسیر من را کاملاً دگرگون کردند. هر صبح دقیقاً می‌دانم چه کار کنم و کجا ایستاده‌ام.",
  name: "آرشام رضایی",
  role: "رتبه برتر کنکور ریاضی",
  school: "موسسه آموزشی پارس",
  initials: "آر",
};

/* ============ 6 testimonial cards data ============ */
const TESTIMONIALS = [
  {
    name: "نگار محمدی",
    role: "دانش‌آموز کنکوری",
    initials: "نگ",
    quote:
      "قبل از روال، روزها بدون جهت می‌گذشتند. حالا هر صبح دقیقاً می‌دانم اولین کاری که باید انجام دهم چیست. رادار دانش‌آموز به من نشان می‌دهد کجا قوی‌ترم و کجا باید بیشتر تمرین کنم. این دید ۳۶۰ درجه‌ای واقعاً تغییرآفرین است.",
  },
  {
    name: "سینا رحیمی",
    role: "دانش‌آموز تیزهوشان",
    initials: "سی",
    quote:
      "فلش‌کارت‌های روال، مرور را از یک زحمت خسته‌کننده به یک عادت لذت‌بخش تبدیل کرد. سیستم تکرار فاصله‌دار هوشمند، مطالبی که نزدیک فراموشی هستند را در بهترین زمان یادآوری می‌کند.",
  },
  {
    name: "دکتر سحر کریمی",
    role: "مشاور تحصیلی",
    initials: "سح",
    quote:
      "رادار دانش‌آموز باعث شد قبل از افت نمره مداخله کنم. این سطح از دید برای من بی‌سابقه است. الان می‌توانم برای هر دانش‌آموز برنامه اختصاصی بسازم و پیشرفتشان را به‌صورت آنی پیگیری کنم.",
  },
  {
    name: "مهندس امیر طاهری",
    role: "مدیر موسسه",
    initials: "ام",
    quote:
      "برنامه‌ساز با درگ اند دراپ، زمان چیدمان برنامه هفتگی را به یک‌سوم کاهش داد. گزارش‌های سفارشی و تحلیل داده‌های سازمانی به ما کمک کرد تا تصمیم‌گیری‌های بهتری داشته باشیم.",
  },
  {
    name: "الهام حسینی",
    role: "دانشجوی پزشکی",
    initials: "اله",
    quote:
      "حجم مطالب پزشکی واقعاً ترسناک است. روال با دسته‌بندی هوشمند و یادآوری به‌موقع، باعث شد هیچ مبحثی جا نیفتد. الان با اطمینان کامل امتحان می‌دهم.",
  },
  {
    name: "پارسا نوری",
    role: "دانش‌آموز",
    initials: "پا",
    quote:
      "آمار و نمودارهای روال، انگیزه من را چند برابر کرد. دیدن رشد روزانه‌ام حس فوق‌العاده‌ای داره. هر هفته با نگاه به گزارش، می‌فهمم چقدر جلو رفتدم.",
  },
];

/* ============ Bottom stats data ============ */
const STATS = [
  { value: 5000, suffix: "+", label: "دانش‌آموز فعال" },
  { staticValue: "۴.۹ از ۵", label: "امتیاز کاربران" },
  { value: 92, suffix: "٪", label: "رضایت کلی" },
  { value: 1200, suffix: "+", label: "داستان موفقیت" },
];

/* ============ Featured metric item ============ */
function FeaturedMetric({
  icon: Icon,
  label,
  children,
  delay,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, ease: easeOut, delay }}
      className="group relative overflow-hidden rounded-2xl border border-mint/15 bg-mint/[0.04] p-5 transition-colors duration-300 hover:border-mint/35 hover:bg-mint/[0.07]"
    >
      {/* corner glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-6 -top-6 size-16 rounded-full bg-mint/15 blur-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
      />
      <div className="relative flex items-center gap-2.5 text-mint">
        <span className="flex size-9 items-center justify-center rounded-xl border border-mint/20 bg-mint/10">
          <Icon className="size-5" />
        </span>
        <span className="text-xs font-medium text-muted-foreground/80">
          {label}
        </span>
      </div>
      <div className="relative mt-3 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
        {children}
      </div>
    </motion.div>
  );
}

/* ============ Testimonial card ============ */
function TestimonialCard({
  testimonial,
  index,
}: {
  testimonial: (typeof TESTIMONIALS)[number];
  index: number;
}) {
  return (
    <Reveal delay={index * 0.08} className="h-full">
      <motion.figure
        whileHover={{ y: -6 }}
        transition={{ type: "spring", stiffness: 300, damping: 22 }}
        className="surface surface-hover glow-border-hover group relative flex h-full flex-col overflow-hidden rounded-2xl p-6"
      >
        {/* Quote icon at top-right */}
        <Quote
          aria-hidden
          className="pointer-events-none absolute left-5 top-5 size-8 text-mint/60"
        />

        {/* 5-star rating row */}
        <div className="mb-4 flex items-center gap-1 text-mint">
          {Array.from({ length: 5 }).map((_, s) => (
            <motion.span
              key={s}
              initial={{ opacity: 0, scale: 0.6 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.4,
                ease: easeOut,
                delay: index * 0.08 + s * 0.05,
              }}
            >
              <Star className="size-4 fill-current" />
            </motion.span>
          ))}
        </div>

        {/* Testimonial text */}
        <blockquote className="flex-1 text-pretty text-sm leading-relaxed text-foreground/85 line-clamp-4">
          {testimonial.quote}
        </blockquote>

        {/* Divider */}
        <div className="my-5 h-px w-full bg-gradient-to-l from-transparent via-border to-transparent" />

        {/* Author row */}
        <figcaption className="flex items-center gap-3">
          <div
            className="flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-[#06120c] shadow-[0_0_18px_-4px_var(--mint)]"
            style={{
              background:
                "linear-gradient(135deg, var(--mint-bright), var(--mint))",
            }}
          >
            {testimonial.initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-sm font-semibold text-foreground">
                {testimonial.name}
              </span>
            </div>
            <div className="truncate text-xs text-muted-foreground/70">
              {testimonial.role}
            </div>
          </div>
          {/* Verified badge */}
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-mint/25 bg-mint/[0.08] px-2 py-1 text-[10px] font-medium text-mint">
            <BadgeCheck className="size-3" />
            تایید شده
          </span>
        </figcaption>
      </motion.figure>
    </Reveal>
  );
}

/* ============ Bottom stat item ============ */
function StatItem({
  value,
  suffix,
  staticValue,
  label,
}: {
  value?: number;
  suffix?: string;
  staticValue?: string;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 text-center">
      <div className="nums text-2xl font-extrabold text-mint text-glow-mint sm:text-3xl">
        {value !== undefined ? (
          <AnimatedCounter target={value} suffix={suffix} />
        ) : (
          <motion.span
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: easeOut }}
          >
            {staticValue}
          </motion.span>
        )}
      </div>
      <div className="text-xs text-muted-foreground/70 sm:text-sm">
        {label}
      </div>
    </div>
  );
}

/* ============ Main component ============ */
export function TestimonialsWall() {
  return (
    <section
      id="stories"
      className="relative scroll-mt-24 overflow-hidden py-24 sm:py-32"
    >
      {/* Background decorations */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {/* Top-right large mint glow orb */}
        <div className="absolute -right-32 -top-32 h-[34rem] w-[34rem] rounded-full bg-mint/[0.06] blur-[140px]" />
        {/* Subtle dot-pattern overlay */}
        <div className="dot-pattern absolute inset-0 opacity-[0.5]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ============ Section header ============ */}
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="mb-5 inline-flex items-center gap-2.5 rounded-full border border-mint/20 bg-mint/[0.08] px-4 py-1.5 text-[11px] font-medium text-mint backdrop-blur-sm">
            <Quote className="size-3.5" />
            داستان‌های موفقیت
          </span>
          <h2 className="text-balance text-3xl font-extrabold leading-[1.2] tracking-tight sm:text-4xl lg:text-5xl">
            تجربه‌های <span className="text-gradient-mint">واقعی</span>، نتایج واقعی
          </h2>
          <p className="mt-5 text-pretty leading-[1.9] text-muted-foreground/80">
            بیش از <span className="nums font-semibold text-foreground">۵۰۰۰</span>{" "}
            دانش‌آموز با روال به اهدافشون رسیدن. این داستان چند نفرشونه.
          </p>
        </Reveal>

        {/* ============ Featured testimonial ============ */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.85, ease: easeOut, delay: 0.1 }}
          className="premium-card relative mt-16 overflow-hidden rounded-3xl p-6 sm:p-10 lg:p-12"
        >
          {/* decorative inner glow */}
          <div
            aria-hidden
            className="pointer-events-none absolute -left-20 top-1/2 h-[24rem] w-[24rem] -translate-y-1/2 rounded-full bg-mint/[0.05] blur-[100px]"
          />

          <div className="relative grid items-center gap-8 lg:grid-cols-5 lg:gap-12">
            {/* Left side (40%) — quote + author */}
            <div className="lg:col-span-2">
              {/* Large quote mark */}
              <Quote
                aria-hidden
                className="size-12 text-mint/70 drop-shadow-[0_0_20px_var(--mint)]"
              />
              <blockquote className="mt-5 text-pretty text-xl font-bold leading-[1.6] text-foreground sm:text-2xl">
                «{FEATURED.quote}»
              </blockquote>

              {/* Author info */}
              <div className="mt-7 flex items-center gap-4">
                <div
                  className="flex size-14 shrink-0 items-center justify-center rounded-full text-lg font-extrabold text-[#06120c] shadow-[0_0_24px_-4px_var(--mint)]"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--mint-bright), var(--mint))",
                  }}
                >
                  {FEATURED.initials}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-base font-bold text-foreground">
                      {FEATURED.name}
                    </span>
                    <BadgeCheck className="size-4 shrink-0 text-mint" />
                  </div>
                  <div className="truncate text-xs text-muted-foreground/80">
                    {FEATURED.role}
                  </div>
                  <div className="truncate text-[11px] text-muted-foreground/60">
                    {FEATURED.school}
                  </div>
                </div>
              </div>
            </div>

            {/* Right side (60%) — results panel */}
            <div className="lg:col-span-3">
              <div className="mb-4 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-mint/80">
                <Sparkles className="size-3.5" />
                نتایج قابل اندازه‌گیری
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                {/* Metric 1 — score growth */}
                <FeaturedMetric
                  icon={TrendingUp}
                  label="رشد نمره"
                  delay={0.15}
                >
                  <span className="nums inline-flex items-baseline gap-1.5">
                    <span className="text-base font-semibold text-muted-foreground/70">
                      ۲۳٪
                    </span>
                    <span className="text-mint/70">→</span>
                    <AnimatedCounter
                      target={89}
                      suffix="٪"
                      className="text-mint text-glow-mint"
                    />
                  </span>
                </FeaturedMetric>

                {/* Metric 2 — study time */}
                <FeaturedMetric
                  icon={Clock}
                  label="زمان مطالعه"
                  delay={0.25}
                >
                  <span className="nums inline-flex items-baseline gap-1.5">
                    <AnimatedCounter
                      target={3}
                      suffix=".۵×"
                      className="text-mint text-glow-mint"
                    />
                    <span className="text-sm font-medium text-muted-foreground/70">
                      بیشتر
                    </span>
                  </span>
                </FeaturedMetric>

                {/* Metric 3 — konkur rank */}
                <FeaturedMetric
                  icon={Trophy}
                  label="رتبه کنکور"
                  delay={0.35}
                >
                  <span className="nums inline-flex items-baseline gap-1.5">
                    <span className="text-base font-semibold text-muted-foreground/70">
                      Top
                    </span>
                    <motion.span
                      initial={{ opacity: 0, scale: 0.7 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{
                        duration: 0.5,
                        ease: easeOut,
                        delay: 0.6,
                      }}
                      className="text-mint text-glow-mint"
                    >
                      ۱٪
                    </motion.span>
                  </span>
                </FeaturedMetric>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ============ 6 testimonial cards (masonry grid) ============ */}
        <div className="mt-16 grid items-start gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <TestimonialCard key={t.name} testimonial={t} index={i} />
          ))}
        </div>

        {/* ============ Bottom stats bar ============ */}
        <Reveal delay={0.1} className="mt-20">
          <div className="gradient-border-active relative overflow-hidden rounded-3xl border border-border/40 bg-card/30 px-6 py-8 backdrop-blur-sm sm:px-10">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-gradient-to-l from-mint/[0.04] via-transparent to-mint/[0.04]"
            />
            <div className="relative grid grid-cols-2 gap-6 sm:gap-8 lg:grid-cols-4">
              {STATS.map((s) => (
                <StatItem
                  key={s.label}
                  value={s.value}
                  suffix={s.suffix}
                  staticValue={s.staticValue}
                  label={s.label}
                />
              ))}
            </div>
          </div>
        </Reveal>

        {/* ============ CTA ============ */}
        <Reveal delay={0.15} className="mt-16 text-center">
          <div className="mx-auto max-w-2xl">
            <div className="mb-5 flex items-center justify-center gap-2 text-muted-foreground/80">
              <span className="h-px w-8 bg-gradient-to-l from-transparent to-border" />
              <Sparkles className="size-4 text-mint" />
              <span className="text-sm font-medium">
                داستان موفقیت تو رو هم بگو!
              </span>
              <span className="h-px w-8 bg-gradient-to-r from-transparent to-border" />
            </div>
            <motion.a
              href="#"
              onClick={(e) => e.preventDefault()}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="shine-sweep focus-ring-mint inline-flex items-center gap-2 rounded-full bg-mint h-12 px-6 text-sm font-semibold text-[#06120c] shadow-[0_0_24px_-6px_var(--mint)] transition-shadow duration-300 hover:shadow-[0_0_32px_-4px_var(--mint)]"
            >
              تجربه‌ات رو به اشتراک بذار
              <ArrowLeft className="size-4" />
            </motion.a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
