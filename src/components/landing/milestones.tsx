"use client";

import * as React from "react";
import {
  motion,
  useScroll,
  useTransform,
  useInView,
} from "framer-motion";
import {
  Rocket,
  FlaskConical,
  TrendingUp,
  Award,
  RefreshCw,
  Building2,
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
const MILESTONES = [
  {
    year: "۱۴۰۰",
    title: "تاسیس روال",
    desc: "ایده‌ای برای پایان آشفتگی تحصیلی به دنیا آمد",
    icon: Rocket,
  },
  {
    year: "۱۴۰۱",
    title: "اولین نسخه آزمایشی",
    desc: "۵۰۰ دانش‌آموز اولیه شروع به کار کردند",
    icon: FlaskConical,
  },
  {
    year: "۱۴۰۲",
    title: "رشد ۱۰ برابری",
    desc: "از ۵۰۰ به ۵۰۰۰ کاربر فعال رسیدیم",
    icon: TrendingUp,
  },
  {
    year: "۱۴۰۲",
    title: "جایزه نوآوری",
    desc: "برنده جایزه نوآوری در حوزه EdTech",
    icon: Award,
  },
  {
    year: "۱۴۰۳",
    title: "نسخه ۲.۰",
    desc: "بازطراحی کامل با امکانات مشاوران",
    icon: RefreshCw,
  },
  {
    year: "۱۴۰۴",
    title: "گسترش سازمانی",
    desc: "ورود به بازار موسسات آموزشی بزرگ",
    icon: Building2,
  },
] as const;

/* ============ Timeline Progress Line ============ */
function TimelineProgress({
  containerRef,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"],
  });

  const height = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <motion.div
      style={{ height }}
      className="absolute top-0 w-full rounded-full bg-mint/80"
    />
  );
}

/* ============ Glowing Dot ============ */
function GlowingDot({ delay = 0 }: { delay?: number }) {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      whileInView={{ scale: 1, opacity: 1 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{
        duration: 0.5,
        ease: easeOut,
        delay,
      }}
      className="relative z-10 flex items-center justify-center"
    >
      {/* Outer glow ring */}
      <span className="absolute size-5 rounded-full bg-mint/20 blur-sm" />
      {/* Inner glow pulse */}
      <motion.span
        animate={{
          boxShadow: [
            "0 0 6px var(--mint)",
            "0 0 14px var(--mint-bright)",
            "0 0 6px var(--mint)",
          ],
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay,
        }}
        className="relative size-3 rounded-full bg-mint"
      />
    </motion.div>
  );
}

/* ============ Milestone Card ============ */
function MilestoneCard({
  milestone,
  index,
  side,
}: {
  milestone: (typeof MILESTONES)[number];
  index: number;
  side: "left" | "right";
}) {
  const Icon = milestone.icon;
  const delay = index * 0.15;

  return (
    <Reveal delay={delay}>
      <motion.div
        whileHover={{ y: -3 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className={cn(
          "group relative rounded-2xl p-5 sm:p-6",
          "surface glow-border-hover",
          "cursor-default transition-colors duration-300"
        )}
      >
        {/* Year badge */}
        <span
          className={cn(
            "mb-3 inline-flex items-center rounded-lg border border-mint/20 bg-mint/[0.08] px-3 py-1",
            "text-xs font-bold text-mint backdrop-blur-sm"
          )}
        >
          {milestone.year}
        </span>

        {/* Icon box */}
        <div className="mb-3 flex size-10 items-center justify-center rounded-xl border border-mint/20 bg-mint/[0.06]">
          <Icon className="size-4 text-mint" />
        </div>

        {/* Title */}
        <h3 className="text-sm font-bold leading-snug sm:text-base">
          {milestone.title}
        </h3>

        {/* Description */}
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground/70 sm:text-sm">
          {milestone.desc}
        </p>
      </motion.div>
    </Reveal>
  );
}

/* ============ Main Component ============ */
export function Milestones() {
  const sectionRef = React.useRef<HTMLDivElement>(null);
  const timelineRef = React.useRef<HTMLDivElement>(null);

  return (
    <section
      id="milestones"
      ref={sectionRef}
      className="scroll-mt-24 relative overflow-hidden py-24 sm:py-32"
    >
      {/* ParallaxGrid background */}
      <ParallaxGrid />

      {/* Mint glow orb */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2"
        aria-hidden="true"
      >
        <div className="size-[500px] rounded-full bg-mint/[0.04] blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-6">
        {/* Header */}
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="mb-5 inline-flex items-center gap-2.5 rounded-full border border-mint/20 bg-mint/[0.08] px-4 py-1.5 text-[11px] font-medium text-mint backdrop-blur-sm">
            <span className="size-1.5 rounded-full bg-mint shadow-[0_0_8px_var(--mint)]" />
            مسیر ما
          </span>
          <h2 className="text-balance text-3xl font-extrabold leading-[1.2] tracking-tight sm:text-4xl lg:text-5xl">
            مسیر روال از نقطه شروع تا{" "}
            <span className="text-gradient-mint">امروز</span>
          </h2>
          <p className="mt-5 text-pretty text-base leading-[1.9] text-muted-foreground/80">
            از یک ایده ساده تا پلتفرمی که هزاران دانش‌آموز روی آن حساب می‌کنند،
            هر قدم ما با نوآوری و تعهد همراه بوده.
          </p>
        </Reveal>

        {/* Timeline */}
        <div
          ref={timelineRef}
          className="relative mt-16 sm:mt-20"
        >
          {/* ==================== MOBILE: Right-side timeline ==================== */}
          <div className="relative lg:hidden">
            {/* Timeline vertical line - background track */}
            <div className="absolute right-[18px] top-0 bottom-0 w-[2px] bg-border/40" />
            {/* Timeline progress fill */}
            <TimelineProgress containerRef={timelineRef} />

            <div className="flex flex-col gap-8">
              {MILESTONES.map((milestone, idx) => (
                <div key={idx} className="relative flex items-start gap-5">
                  {/* Dot on the timeline */}
                  <div className="relative flex shrink-0 flex-col items-center">
                    <div className="relative mt-5">
                      <GlowingDot delay={idx * 0.15} />
                    </div>
                  </div>

                  {/* Card */}
                  <MilestoneCard
                    milestone={milestone}
                    index={idx}
                    side="right"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* ==================== DESKTOP: Center timeline, alternating ==================== */}
          <div className="relative hidden lg:block">
            {/* Center vertical line - background track */}
            <div className="absolute left-1/2 top-0 bottom-0 w-[2px] -translate-x-1/2 bg-border/40" />
            {/* Center timeline progress fill */}
            <div className="absolute left-1/2 top-0 bottom-0 w-[2px] -translate-x-1/2">
              <TimelineProgress containerRef={timelineRef} />
            </div>

            <div className="flex flex-col gap-12">
              {MILESTONES.map((milestone, idx) => {
                const isLeft = idx % 2 === 0;

                return (
                  <div
                    key={idx}
                    className="relative grid grid-cols-[1fr_auto_1fr] items-center gap-8"
                  >
                    {/* Left side */}
                    <div
                      className={cn(
                        "flex justify-end",
                        !isLeft && "order-3"
                      )}
                    >
                      {isLeft ? (
                        <MilestoneCard
                          milestone={milestone}
                          index={idx}
                          side="left"
                        />
                      ) : (
                        <div />
                      )}
                    </div>

                    {/* Center dot */}
                    <div
                      className={cn(
                        "relative z-10 flex items-center justify-center",
                        isLeft ? "order-2" : "order-2"
                      )}
                    >
                      <GlowingDot delay={idx * 0.15} />
                    </div>

                    {/* Right side */}
                    <div
                      className={cn(
                        "flex justify-start",
                        isLeft && "order-3"
                      )}
                    >
                      {!isLeft ? (
                        <MilestoneCard
                          milestone={milestone}
                          index={idx}
                          side="right"
                        />
                      ) : (
                        <div />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
