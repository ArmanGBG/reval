"use client";

import * as React from "react";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
} from "framer-motion";

export function Hero() {
  const heroRef = React.useRef<HTMLElement>(null);
  const [step, setStep] = React.useState(0);
  const [compactScroll, setCompactScroll] = React.useState(false);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end end"],
  });

  React.useEffect(() => {
    const media = window.matchMedia("(max-width: 639px)");
    const sync = () => setCompactScroll(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useMotionValueEvent(scrollYProgress, "change", (progress) => {
    const firstBoundary = compactScroll ? 0.18 : 0.25;
    const secondBoundary = compactScroll ? 0.42 : 0.52;
    setStep(progress < firstBoundary ? 0 : progress < secondBoundary ? 1 : 2);
  });

  return (
    <section
      id="top"
      ref={heroRef}
      className="relative h-[240svh] border-b border-border/50 sm:h-[360svh]"
      aria-labelledby="hero-title"
    >
      <div className="sticky top-0 flex h-[100svh] items-center overflow-hidden pt-16">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute inset-0 grid-bg opacity-[0.14]" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-mint/50 to-transparent" />
          <div className="absolute inset-x-[12%] top-1/2 h-px bg-gradient-to-l from-transparent via-white/[0.05] to-transparent" />
        </div>

        <div className="relative mx-auto flex w-full max-w-5xl flex-col items-center px-5 pb-16 text-center sm:px-8">
          <div className="flex min-h-[20rem] w-full items-center justify-center sm:min-h-[24rem]">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={step}
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 22, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -22, filter: "blur(8px)" }}
                transition={{ duration: reduceMotion ? 0.12 : 0.62, ease: [0.16, 1, 0.3, 1] }}
                className="mx-auto max-w-4xl"
              >
                <h1
                  id="hero-title"
                  className="text-balance text-4xl font-black leading-[1.35] text-foreground sm:text-5xl lg:text-7xl"
                >
                  {step === 0 ? (
                    <>
                      تو <span className="text-[var(--danger)]">بن بست</span> برنامه‌ریزی و <span className="text-mint">آنالیز</span> دقیق گیر کردی؟
                    </>
                  ) : step === 1 ? (
                    <>
                      نمی‌تونی مشاور <span className="text-mint">مناسب</span> خودت رو پیدا کنی؟
                    </>
                  ) : (
                    <>
                      ما اینجاییم همه چی بیفته رو{" "}
                      <span className="text-mint">روال</span>!
                    </>
                  )}
                </h1>

                {step === 2 && (
                  <motion.p
                    initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: reduceMotion ? 0.12 : 0.55, delay: reduceMotion ? 0 : 0.18 }}
                    className="mx-auto mt-7 max-w-3xl text-sm font-normal leading-8 text-muted-foreground sm:text-base"
                  >
                    با روال، درس خوندنت از گیجی درمیاد! خیلی راحت می‌بینی برای هر درس چقدر تست زدی، چقدر کلاس رفتی و کجای کاری. تازه، ما یه مشاور کاردرستِ مخصوص خودت پیدا می‌کنیم که مستقیم تو خود اپلیکیشن بهت وصل می‌شه تا زحمت برنامه‌ریزی رو بکشه و قدم به قدم همراهت باشه.
                  </motion.p>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <div
            className="absolute bottom-3 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 text-muted-foreground/75"
            aria-label="برای ادامه اسکرول کنید"
          >
            <span className="whitespace-nowrap text-[10px] font-medium">اسکرول کن</span>
            <motion.span
              animate={reduceMotion ? undefined : { y: [0, 6, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="flex h-8 w-5 items-start justify-center rounded-full border border-mint/50 p-1"
              aria-hidden="true"
            >
              <span className="h-1.5 w-1 rounded-full bg-mint" />
            </motion.span>
          </div>
        </div>
      </div>
    </section>
  );
}
