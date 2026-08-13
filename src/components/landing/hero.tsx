"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";

const spring = { stiffness: 90, damping: 22, mass: 0.8 };

export function Hero() {
  const [messageStep, setMessageStep] = React.useState<0 | 1>(0);
  const heroRef = React.useRef<HTMLElement>(null);
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const smoothX = useSpring(pointerX, spring);
  const smoothY = useSpring(pointerY, spring);
  const rotateY = useTransform(smoothX, [-0.5, 0.5], [-4, 4]);
  const rotateX = useTransform(smoothY, [-0.5, 0.5], [3, -3]);
  const cardX = useTransform(smoothX, [-0.5, 0.5], [-12, 12]);
  const cardY = useTransform(smoothY, [-0.5, 0.5], [-8, 8]);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end end"],
  });

  useMotionValueEvent(scrollYProgress, "change", (progress) => {
    setMessageStep(progress >= 0.22 ? 1 : 0);
  });

  const onPointerMove = (event: React.PointerEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    pointerX.set((event.clientX - rect.left) / rect.width - 0.5);
    pointerY.set((event.clientY - rect.top) / rect.height - 0.5);
  };

  return (
    <section
      id="top"
      ref={heroRef}
      className="relative h-[175svh] border-b border-border/50"
      aria-labelledby="hero-title"
    >
      <div
        onPointerMove={onPointerMove}
        onPointerLeave={() => { pointerX.set(0); pointerY.set(0); }}
        className="sticky top-0 h-[100svh] overflow-hidden pt-20"
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 grid-bg opacity-[0.16]" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-mint/50 to-transparent" />
          <motion.div
            style={{ x: cardX, y: cardY }}
            className="absolute left-[12%] top-[18%] h-64 w-64 rounded-full bg-mint/[0.06] blur-[100px]"
          />
          <div className="absolute bottom-0 right-0 h-80 w-80 bg-mint/[0.035] blur-[120px]" />
        </div>

        <div className="relative mx-auto grid min-h-[calc(100svh-5rem)] max-w-7xl items-center gap-10 px-5 pb-12 pt-8 lg:grid-cols-[0.88fr_1.12fr] lg:px-8 lg:pb-16 lg:pt-10">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-20 -translate-y-6 py-5 text-right sm:-translate-y-8"
        >
          <div className="flex min-h-[13rem] items-center sm:min-h-[15rem]">
            <AnimatePresence mode="wait" initial={false}>
              {messageStep === 0 ? (
                <motion.div
                  key="problem"
                  initial={{ opacity: 0, y: 16, filter: "blur(5px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -12, filter: "blur(5px)" }}
                  transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
                  className="max-w-xl"
                >
                  <h1 id="hero-title" className="text-balance text-3xl font-black leading-[1.35] text-foreground sm:text-4xl lg:text-[2.85rem]">
                    تو <span className="text-[#ef7777] [text-shadow:0_0_22px_rgba(239,119,119,0.28)]">بن‌بست</span> برنامه‌ریزی و <span className="text-[#ef7777] [text-shadow:0_0_22px_rgba(239,119,119,0.28)]">آنالیز</span> شخصی گیر کردی؟
                  </h1>
                  <p className="mt-5 max-w-lg text-sm font-normal leading-7 text-muted-foreground sm:text-[15px]">
                    سنجش زمان مطالعه هر درس و نوع فعالیت‌ها، کمک می‌کند دقیق‌تر تصمیم بگیری و مسیر کنکور را با اطمینان بیشتری ادامه بدهی.
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="solution"
                  initial={{ opacity: 0, y: 16, filter: "blur(5px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -12, filter: "blur(5px)" }}
                  transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
                  className="max-w-xl"
                >
                  <h1 className="text-balance text-3xl font-black leading-[1.35] text-foreground sm:text-4xl lg:text-[2.85rem]">
                    ما اینجاییم همه‌چی بیفته رو <span className="text-mint [text-shadow:0_0_24px_color-mix(in_oklch,var(--mint)_32%,transparent)]">روال</span>.
                  </h1>
                  <p className="mt-5 max-w-lg text-sm font-normal leading-7 text-muted-foreground sm:text-[15px]">
                    برنامه‌ریزی، ثبت عملکرد و تحلیل مطالعه در یک مسیر ساده؛ تا هر روز بدانی کجایی و قدم بعدی چیست.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="#signup" className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-mint px-6 text-sm font-bold text-[#06120c] shadow-[0_14px_42px_-12px_var(--mint)] transition-all hover:brightness-110 hover:shadow-[0_18px_50px_-10px_var(--mint-bright)] focus-ring-mint">
              ساخت حساب رایگان
              <span className="text-base leading-none transition-transform group-hover:-translate-x-1">←</span>
            </Link>
            <Link href="#login" className="inline-flex min-h-12 items-center justify-center rounded-full border border-border/80 bg-background/40 px-6 text-sm font-semibold text-foreground backdrop-blur-xl transition-colors hover:border-mint/30 hover:bg-mint/[0.05] focus-ring-mint">
              ورود به حساب
            </Link>
          </div>

        </motion.div>

        <div className="relative z-10 min-h-[390px] sm:min-h-[500px] lg:min-h-[570px]" style={{ perspective: 1200 }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
            className="glass-panel border-glow-mint absolute inset-x-2 top-8 overflow-hidden rounded-2xl border border-mint/20 bg-[var(--bg-elevated)]/80 shadow-[0_36px_100px_-36px_rgba(0,0,0,0.85)] sm:inset-x-8 lg:inset-x-4"
          >
            <motion.div
              aria-hidden="true"
              className="pointer-events-none absolute -inset-px z-20 rounded-2xl border border-mint/20"
              animate={{ opacity: [0.35, 0.8, 0.35] }}
              transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
            />
            <div className="flex h-10 items-center gap-1.5 border-b border-border/70 bg-background/70 px-4">
              <span className="size-2 rounded-full bg-mint/70" />
              <span className="size-2 rounded-full bg-white/20" />
              <span className="size-2 rounded-full bg-white/10" />
              <span className="mr-auto text-[9px] text-muted-foreground">داشبورد امروز</span>
            </div>
            <Image
              src="/landing-shots/feature-planning.png"
              alt="نمای برنامه‌ریزی روزانه روال"
              width={1280}
              height={820}
              priority
              className="h-auto w-full object-cover object-top"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/30 via-transparent to-transparent" />
          </motion.div>

        </div>
        </div>
      </div>
    </section>
  );
}
