"use client";

import * as React from "react";
import { motion, useInView } from "framer-motion";
import { CalendarDays, BarChart3, BookOpen, Users } from "lucide-react";

const easeOut = [0.16, 1, 0.3, 1] as const;

const FEATURES = [
  {
    icon: CalendarDays,
    title: "برنامه‌ریزی هوشمند",
    description:
      "اضافه کردن تسک به صورت روزانه و بازه دلخواه، تعریف‌شده با تمام جزئیات و نیازهای یک دانش‌آموز. هم امتحانات نهایی، هم کنکور!",
    accent: "from-emerald-500 to-mint",
  },
  {
    icon: BarChart3,
    title: "آنالیز جامع عملکرد",
    description:
      "آنالیز جامع موارد مطالعه‌شده به صورت روزانه و بازه دلخواه، بر اساس عملکرد خودت. گزارش آماری به تفکیک دروس بگیر!",
    accent: "from-cyan-500 to-mint",
  },
  {
    icon: BookOpen,
    title: "روتین‌های حفظی",
    description:
      "روتین‌های حفظی امتحان نهایی و کنکور رو مرور کن! لغات ادبیات و مطالب کلیدی هر درس، روی نوک انگشتت.",
    accent: "from-violet-500 to-mint",
  },
  {
    icon: Users,
    title: "ویژه مشاوران",
    description:
      "امکان پایش دانش‌آموزان مختلف به تفکیک پنل، ارائه برنامه، آزمون، و رصد اطلاعات مطالعه دانش‌آموز با بازه دلخواه.",
    accent: "from-amber-500 to-mint",
  },
];

function FeatureCard({
  feature,
  index,
}: {
  feature: (typeof FEATURES)[number];
  index: number;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40, filter: "blur(8px)" }}
      animate={inView ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
      transition={{ duration: 0.7, delay: index * 0.12, ease: easeOut }}
      className="group relative overflow-hidden rounded-2xl border border-border/40 bg-surface p-6 sm:p-8 transition-all duration-300 hover:border-border/70 hover:shadow-[0_8px_40px_-12px_rgba(0,0,0,0.4)]"
    >
      {/* Subtle gradient glow on hover */}
      <div
        className="pointer-events-none absolute -top-1/2 -right-1/2 h-[120%] w-[120%] rounded-full opacity-0 blur-[100px] transition-opacity duration-500 group-hover:opacity-[0.07]"
        style={{
          background: `linear-gradient(135deg, var(--mint), transparent)`,
        }}
      />

      {/* Icon */}
      <div className="relative mb-5 inline-flex items-center justify-center rounded-xl border border-border/30 bg-background/50 p-3">
        <feature.icon className="size-6 text-mint" />
        <div className="absolute inset-0 rounded-xl bg-mint/[0.04] blur-sm" />
      </div>

      {/* Title */}
      <h3 className="relative mb-3 font-extrabold text-lg leading-snug tracking-tight text-foreground sm:text-xl">
        {feature.title}
      </h3>

      {/* Description */}
      <p className="relative text-sm leading-relaxed text-muted-foreground/80 sm:text-[0.938rem]">
        {feature.description}
      </p>

      {/* Bottom accent line */}
      <div
        className="mt-6 h-[2px] w-12 rounded-full opacity-40 transition-all duration-300 group-hover:w-20 group-hover:opacity-70"
        style={{
          background: `linear-gradient(to right, var(--mint), transparent)`,
        }}
      />
    </motion.div>
  );
}

export function Features() {
  const headerRef = React.useRef<HTMLDivElement>(null);
  const headerInView = useInView(headerRef, { once: true, margin: "-60px" });

  return (
    <section id="features" className="relative py-20 sm:py-28 lg:py-36">
      <div className="mx-auto max-w-6xl px-5 sm:px-8 lg:px-12">
        {/* Section header */}
        <motion.div
          ref={headerRef}
          initial={{ opacity: 0, y: 30 }}
          animate={headerInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: easeOut }}
          className="mb-14 text-center sm:mb-18"
        >
          <span className="mb-4 inline-block rounded-full border border-mint/20 bg-mint/[0.06] px-4 py-1.5 text-xs font-semibold text-mint">
            امکانات
          </span>
          <h2 className="text-balance text-2xl font-extrabold leading-tight tracking-tight text-foreground sm:text-3xl lg:text-4xl">
            هر چی که برای <span className="text-gradient-mint">ترقی تحصیلی</span> نیاز داری
          </h2>
        </motion.div>

        {/* Feature cards grid */}
        <div className="grid gap-5 sm:grid-cols-2 sm:gap-6 lg:gap-8">
          {FEATURES.map((feature, i) => (
            <FeatureCard key={i} feature={feature} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
