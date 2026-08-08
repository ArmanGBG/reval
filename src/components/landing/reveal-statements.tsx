"use client";

import * as React from "react";
import {
  motion,
  useScroll,
  useTransform,
  useMotionValue,
  MotionValue,
} from "framer-motion";
import { cn } from "@/lib/utils";

const STATEMENTS = [
  {
    kicker: "اصل اول",
    title: "شفافیت مطلق",
    sub: "پایان آشفتگی ذهنی",
    desc: "هر تصمیم، هر اقدام و هر نتیجه در یک نمای واحد و قابل فهم. چیزی برای پنهان کردن نیست.",
  },
  {
    kicker: "اصل دوم",
    title: "تمرکز بر تلاش تعمدی",
    sub: "نه تکیه بر شانس",
    desc: "سیستم روال، شانس را از معادله خارج می‌کند و روی آنچه واقعاً قابل کنترل است متمرکز می‌شود.",
  },
  {
    kicker: "اصل سوم",
    title: "تسلط بر مسیر موفقیت",
    sub: "رسیدن به وضعیت روال",
    desc: "وقتی تلاش تعمدی تکرار شود، به وضعیت روال می‌رسید؛ جایی که پیشرفت دیگر تصادفی نیست.",
  },
];

const N = STATEMENTS.length;

/** Split a string into words for staggered reveal */
function WordsReveal({
  text,
  active,
  className,
}: {
  text: string;
  active: boolean;
  className?: string;
}) {
  const words = text.split(" ");
  return (
    <span className={className}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          className="inline-block"
          initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
          animate={
            active
              ? { opacity: 1, y: 0, filter: "blur(0px)" }
              : { opacity: 0, y: 12, filter: "blur(6px)" }
          }
          transition={{
            duration: 0.5,
            ease: [0.16, 1, 0.3, 1],
            delay: active ? i * 0.06 : 0,
          }}
        >
          {word}
          {i < words.length - 1 && "\u00A0"}
        </motion.span>
      ))}
    </span>
  );
}

function Statement({
  progress,
  i,
  active,
}: {
  progress: MotionValue<number>;
  i: number;
  active: boolean;
}) {
  const center = (i + 0.5) / N;
  const half = 1 / N;
  const start = center - half;
  const end = center + half;

  const opacity = useTransform(
    progress,
    [start, start + 0.06, end - 0.06, end],
    [0, 1, 1, 0.12]
  );
  const y = useTransform(progress, [start, center, end], [50, 0, -40]);
  const scale = useTransform(progress, [start, center, end], [0.96, 1, 0.93]);
  const blur = useTransform(progress, [start, center, end], [4, 0, 3]);

  const s = STATEMENTS[i];
  return (
    <motion.div
      style={{ opacity, y, scale, filter: useTransform(blur, (v) => `blur(${v}px)`) }}
      className="absolute inset-0 flex flex-col items-center justify-center"
      aria-hidden={!active}
    >
      {/* Kicker badge — slides in from right with spring */}
      <motion.span
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: active ? 1 : 0, x: active ? 0 : 24 }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 20,
          duration: 0.6,
        }}
        className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-mint/20 bg-mint/[0.08] px-4 py-1.5 text-[11px] font-medium text-mint backdrop-blur-md shadow-[0_4px_24px_-8px_var(--mint)]"
      >
        <span className="relative flex size-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mint opacity-60" />
          <span className="relative inline-flex size-1.5 rounded-full bg-mint shadow-[0_0_8px_var(--mint)]" />
        </span>
        {s.kicker}
      </motion.span>

      {/* Title with word-by-word reveal */}
      <h2 className="text-balance text-4xl font-extrabold leading-[1.2] tracking-tight sm:text-5xl lg:text-[3.5rem]">
        <WordsReveal
          text={`${s.title}:`}
          active={active}
          className="text-foreground"
        />{" "}
        <WordsReveal
          text={s.sub}
          active={active}
          className="text-gradient-mint"
        />
      </h2>

      {/* Description — fades in after title with slight delay */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: active ? 1 : 0, y: active ? 0 : 10 }}
        transition={{
          duration: 0.6,
          ease: [0.16, 1, 0.3, 1],
          delay: active ? 0.3 : 0,
        }}
        className="mt-6 max-w-xl text-pretty text-base leading-[1.9] text-muted-foreground/80 sm:text-lg"
      >
        {s.desc}
      </motion.p>
    </motion.div>
  );
}

export function RevealStatements() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const activeIndex = React.useRef(0);
  const [active, setActive] = React.useState(0);
  React.useEffect(() => {
    const unsub = scrollYProgress.on("change", (v) => {
      const idx = Math.min(N - 1, Math.max(0, Math.floor(v * N)));
      if (idx !== activeIndex.current) {
        activeIndex.current = idx;
        setActive(idx);
      }
    });
    return () => unsub();
  }, [scrollYProgress]);

  // Aurora background positions shift with scroll
  const auroraX1 = useTransform(scrollYProgress, [0, 1], [30, 70]);
  const auroraX2 = useTransform(scrollYProgress, [0, 1], [70, 30]);
  const auroraY1 = useTransform(scrollYProgress, [0, 1], [20, 60]);
  const streakX = useTransform(scrollYProgress, [0, 0.5, 1], [-100, 0, 100]);

  return (
    <section
      ref={containerRef}
      className="relative h-[320vh]"
      aria-label="اصول روال"
    >
      <div className="sticky top-0 flex h-[100svh] items-center justify-center overflow-hidden">
        {/* Background atmosphere — dramatic aurora effect */}
        <div className="pointer-events-none absolute inset-0">
          {/* Primary aurora orb */}
          <motion.div
            className="absolute left-1/2 top-1/2 h-[55rem] w-[55rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-mint/[0.06] blur-[140px]"
            animate={{ scale: [1, 1.08, 1], opacity: [0.06, 0.09, 0.06] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          {/* Aurora gradient layer 1 — shifts with scroll */}
          <motion.div
            className="absolute h-[40rem] w-[60rem] rounded-full bg-mint/[0.05] blur-[120px]"
            style={{
              left: useTransform(auroraX1, (v) => `${v}%`),
              top: useTransform(auroraY1, (v) => `${v}%`),
              translateX: "-50%",
              translateY: "-50%",
            }}
          />
          {/* Aurora gradient layer 2 — shifts opposite */}
          <motion.div
            className="absolute h-[30rem] w-[40rem] rounded-full bg-mint/[0.04] blur-[100px]"
            style={{
              right: useTransform(auroraX2, (v) => `${v}%`),
              bottom: useTransform(auroraY1, (v) => `${v}%`),
            }}
          />
          {/* Aurora gradient layer 3 — warm accent */}
          <motion.div
            className="absolute h-[20rem] w-[30rem] rounded-full bg-mint-bright/[0.03] blur-[90px]"
            style={{
              left: useTransform(auroraX2, (v) => `${v}%`),
              top: useTransform(auroraY1, (v) => `${100 - v}%`),
              translateX: "-50%",
              translateY: "-50%",
            }}
          />
          {/* Horizontal light streaks that sweep during transitions */}
          <motion.div
            className="absolute top-[30%] h-[1px] w-full bg-gradient-to-l from-transparent via-mint/20 to-transparent blur-sm"
            style={{ x: streakX }}
          />
          <motion.div
            className="absolute top-[60%] h-[1px] w-full bg-gradient-to-l from-transparent via-mint-bright/15 to-transparent blur-sm"
            style={{ x: useTransform(streakX, (v) => -v) }}
          />
        </div>

        {/* Progress rail — enhanced with dot markers & glow trail */}
        <div className="absolute inset-x-0 top-24 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <span className="nums text-xs font-medium text-muted-foreground/60 tabular-nums">
              {String(active + 1).padStart(2, "0")} /{" "}
              {String(N).padStart(2, "0")}
            </span>
            <div className="relative h-px flex-1 overflow-visible rounded-full bg-border/50">
              {/* Glow trail behind progress fill */}
              <motion.div
                className="absolute top-1/2 h-3 -translate-y-1/2 rounded-full bg-mint/15 blur-md"
                style={{
                  width: useTransform(scrollYProgress, (v) => `${v * 100}%`),
                }}
              />
              {/* Main progress fill */}
              <motion.div
                className="relative h-full rounded-full bg-gradient-to-l from-mint-bright to-mint"
                style={{ scaleX: scrollYProgress, transformOrigin: "right" }}
              />
              {/* Dot markers at each 1/N position */}
              {Array.from({ length: N }).map((_, i) => {
                const pos = (i + 0.5) / N;
                const isPassed = active >= i;
                const isActive = active === i;
                return (
                  <motion.span
                    key={i}
                    className={cn(
                      "absolute top-1/2 -translate-y-1/2 rounded-full transition-all duration-500",
                      isActive
                        ? "size-2.5 bg-mint shadow-[0_0_10px_var(--mint)]"
                        : isPassed
                          ? "size-1.5 bg-mint/70"
                          : "size-1.5 bg-border"
                    )}
                    style={{ left: `${pos * 100}%`, marginLeft: "-3px" }}
                  >
                    {/* Active dot pulse */}
                    {isActive && (
                      <motion.span
                        className="absolute inset-0 rounded-full bg-mint/50"
                        animate={{ scale: [1, 2.5, 1], opacity: [0.6, 0, 0.6] }}
                        transition={{
                          duration: 1.8,
                          repeat: Infinity,
                          ease: "easeOut",
                        }}
                      />
                    )}
                  </motion.span>
                );
              })}
            </div>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-4xl px-6 text-center">
          {STATEMENTS.map((_, i) => (
            <Statement
              key={i}
              progress={scrollYProgress}
              i={i}
              active={i === active}
            />
          ))}
        </div>

        {/* Bottom dots — line-connected dot system with ripple and fill */}
        <div className="absolute bottom-24 flex items-center">
          {STATEMENTS.map((_, i) => {
            const isActive = i === active;
            const isPassed = i <= active;
            return (
              <React.Fragment key={i}>
                {/* Connecting line between dots */}
                {i > 0 && (
                  <motion.span
                    className="block h-[2px] w-6 origin-right"
                    initial={false}
                    animate={{
                      scaleX: isPassed ? 1 : 0,
                      backgroundColor: isPassed
                        ? "var(--mint)"
                        : "rgba(255,255,255,0.08)",
                    }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    style={{ background: isPassed ? "var(--mint)" : "rgba(255,255,255,0.08)" }}
                  />
                )}
                {/* Dot with ripple when active */}
                <motion.span
                  className={cn(
                    "relative rounded-full transition-all duration-500",
                    isActive
                      ? "size-3 bg-mint shadow-[0_0_12px_color-mix(in_oklch,var(--mint)_40%,transparent)]"
                      : "size-2 bg-white/12"
                  )}
                  layout
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                >
                  {/* Ripple effect on active dot */}
                  {isActive && (
                    <>
                      <motion.span
                        className="absolute inset-0 rounded-full border border-mint/50"
                        animate={{
                          scale: [1, 2.2],
                          opacity: [0.7, 0],
                        }}
                        transition={{
                          duration: 1.2,
                          repeat: Infinity,
                          ease: "easeOut",
                        }}
                      />
                      <motion.span
                        className="absolute inset-0 rounded-full border border-mint/30"
                        animate={{
                          scale: [1, 3],
                          opacity: [0.4, 0],
                        }}
                        transition={{
                          duration: 1.2,
                          repeat: Infinity,
                          ease: "easeOut",
                          delay: 0.3,
                        }}
                      />
                    </>
                  )}
                </motion.span>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </section>
  );
}
