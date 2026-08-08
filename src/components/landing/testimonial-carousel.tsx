"use client";

import * as React from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Quote, Star, BadgeCheck, ChevronLeft, ChevronRight, Pause } from "lucide-react";
import { cn } from "@/lib/utils";

const TESTIMONIALS = [
  {
    img: "/testimonials/p1.png",
    name: "نگار محمدی",
    role: "دانش‌آموز کنکوری",
    quote:
      "قبل از روال، روزها بدون جهت می‌گذشتند. حالا هر صبح دقیقاً می‌دانم اولین کاری که باید انجام دهم چیست.",
  },
  {
    img: "/testimonials/p2.png",
    name: "سینا رحیمی",
    role: "دانش‌آموز",
    quote:
      "فلش‌کارت‌های روال، مرور را از یک زحمت خسته‌کننده به یک عادت لذت‌بخش تبدیل کرد.",
  },
  {
    img: "/testimonials/p3.png",
    name: "دکتر سحر کریمی",
    role: "مشاور تحصیلی",
    quote:
      "رادار دانش‌آموز باعث شد قبل از افت نمره مداخله کنم. این سطح از دید برای من بی‌سابقه است.",
  },
  {
    img: "/testimonials/p4.png",
    name: "مهندس امیر طاهری",
    role: "مدیر موسسه",
    quote:
      "برنامه‌ساز با درگ اند دراپ، زمان چیدمان برنامه هفتگی را به یک‌سوم کاهش داد.",
  },
];

const AUTOPLAY_INTERVAL = 5000;

/* ============ Shimmer Stars ============ */
function ShimmerStars() {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <motion.span
          key={i}
          className="text-mint"
          animate={{ opacity: [1, 0.4, 1] }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.15,
          }}
        >
          <Star className="size-4 fill-current" />
        </motion.span>
      ))}
    </div>
  );
}

/* ============ Progress Bar ============ */
function AutoPlayProgress({
  progress,
  paused,
}: {
  progress: number;
  paused: boolean;
}) {
  return (
    <div className="relative h-1 w-full overflow-hidden rounded-full bg-border/30">
      <motion.div
        className="absolute inset-y-0 right-0 rounded-full bg-gradient-to-l from-mint to-mint-bright"
        style={{ width: `${progress * 100}%` }}
        transition={{ duration: 0.1, ease: "linear" }}
      />
      {paused && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        >
          <Pause className="size-2.5 text-mint" />
        </motion.div>
      )}
    </div>
  );
}

/* ============ Main Carousel ============ */
export function TestimonialCarousel() {
  const [current, setCurrent] = React.useState(0);
  const [paused, setPaused] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [direction, setDirection] = React.useState<1 | -1>(1);

  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const progressRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const total = TESTIMONIALS.length;

  /* Advance to next slide */
  const next = React.useCallback(() => {
    setDirection(1);
    setCurrent((prev) => (prev + 1) % total);
    setProgress(0);
  }, [total]);

  /* Go to previous slide */
  const prev = React.useCallback(() => {
    setDirection(-1);
    setCurrent((prev) => (prev - 1 + total) % total);
    setProgress(0);
  }, [total]);

  /* Go to specific slide */
  const goTo = React.useCallback(
    (index: number) => {
      setDirection(index > current ? 1 : -1);
      setCurrent(index);
      setProgress(0);
    },
    [current]
  );

  /* Autoplay logic */
  React.useEffect(() => {
    if (paused) {
      if (timerRef.current) clearInterval(timerRef.current);
      if (progressRef.current) clearInterval(progressRef.current);
      return;
    }

    /* Progress tick (update every 50ms for smooth bar) */
    progressRef.current = setInterval(() => {
      setProgress((p) => {
        const next = p + 50 / AUTOPLAY_INTERVAL;
        return next > 1 ? 1 : next;
      });
    }, 50);

    /* Auto-advance */
    timerRef.current = setInterval(() => {
      next();
    }, AUTOPLAY_INTERVAL);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, [paused, next]);

  /* Slide animation variants */
  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.95,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -300 : 300,
      opacity: 0,
      scale: 0.95,
    }),
  };

  const t = TESTIMONIALS[current];

  return (
    <section
      id="testimonials"
      className="relative scroll-mt-24 py-20 sm:py-28"
    >
      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mb-14 text-center"
        >
          <span className="mb-5 inline-flex items-center gap-2.5 rounded-full border border-mint/20 bg-mint/[0.08] px-4 py-1.5 text-[11px] font-medium text-mint backdrop-blur-sm">
            <Quote className="size-3.5" />
            صدای کاربران
          </span>
          <h2 className="text-balance text-3xl font-extrabold leading-[1.2] tracking-tight sm:text-4xl lg:text-5xl">
            کسانی که روال را{" "}
            <span className="text-gradient-mint">تجربه کردند</span>
          </h2>
        </motion.div>

        {/* Carousel Container */}
        <div
          className="relative"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {/* Glassmorphism card */}
          <div className="relative overflow-hidden rounded-3xl glass p-6 sm:p-10 lg:p-14">
            {/* Decorative large quotation mark */}
            <Quote className="absolute right-6 top-6 size-16 text-mint/[0.07] sm:right-10 sm:top-10 sm:size-24 lg:right-14 lg:top-14 lg:size-32" />

            {/* AnimatePresence for slide transitions */}
            <AnimatePresence initial={false} custom={direction} mode="wait">
              <motion.div
                key={current}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: "spring", stiffness: 300, damping: 30 },
                  opacity: { duration: 0.3 },
                  scale: { duration: 0.3 },
                }}
                className="flex flex-col items-center text-center"
              >
                {/* Quote text */}
                <blockquote className="relative z-10 max-w-2xl text-pretty text-lg leading-[2] text-foreground/90 sm:text-xl lg:text-2xl lg:leading-[2.1]">
                  «{t.quote}»
                </blockquote>

                {/* Star rating */}
                <div className="mt-6">
                  <ShimmerStars />
                </div>

                {/* Person info */}
                <div className="mt-8 flex flex-col items-center gap-3">
                  <div className="relative size-16 overflow-hidden rounded-full ring-2 ring-mint/20 sm:size-20">
                    <Image
                      src={t.img}
                      alt={t.name}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-foreground sm:text-lg">
                      {t.name}
                    </span>
                    <BadgeCheck className="size-4 text-mint sm:size-5" />
                  </div>
                  <span className="text-xs text-muted-foreground/70 sm:text-sm">
                    {t.role}
                  </span>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Pause indicator */}
            <AnimatePresence>
              {paused && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="pointer-events-none absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-background/60 px-3 py-1.5 text-xs text-muted-foreground/60 backdrop-blur-sm"
                >
                  <Pause className="size-3" />
                  توقف
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Previous button */}
          <button
            onClick={prev}
            aria-label="نظر قبلی"
            className="absolute left-2 top-1/2 z-20 -translate-y-1/2 flex size-10 items-center justify-center rounded-full border border-border/40 bg-card/60 text-muted-foreground/70 backdrop-blur-sm transition-all hover:border-mint/30 hover:bg-card/80 hover:text-mint sm:left-4 sm:size-12"
          >
            <ChevronLeft className="size-5 sm:size-6" />
          </button>

          {/* Next button */}
          <button
            onClick={next}
            aria-label="نظر بعدی"
            className="absolute right-2 top-1/2 z-20 -translate-y-1/2 flex size-10 items-center justify-center rounded-full border border-border/40 bg-card/60 text-muted-foreground/70 backdrop-blur-sm transition-all hover:border-mint/30 hover:bg-card/80 hover:text-mint sm:right-4 sm:size-12"
          >
            <ChevronRight className="size-5 sm:size-6" />
          </button>
        </div>

        {/* Navigation dots + progress bar */}
        <div className="mt-8 flex flex-col items-center gap-4">
          {/* Dots */}
          <div className="flex items-center gap-2.5">
            {TESTIMONIALS.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                aria-label={`نظر ${i + 1}`}
                className={cn(
                  "relative h-2.5 rounded-full transition-all duration-500",
                  i === current
                    ? "w-8 bg-mint shadow-[0_0_10px_var(--mint)]"
                    : "w-2.5 bg-border/50 hover:bg-mint/40"
                )}
              >
                {i === current && (
                  <motion.div
                    layoutId="carousel-dot-glow"
                    className="absolute inset-0 rounded-full bg-mint/30 blur-sm"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Progress bar */}
          <div className="w-48">
            <AutoPlayProgress progress={progress} paused={paused} />
          </div>
        </div>
      </div>
    </section>
  );
}
