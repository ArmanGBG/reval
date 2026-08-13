"use client";

import * as React from "react";
import Image from "next/image";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

const easeOut = [0.16, 1, 0.3, 1] as const;

const FEATURES = [
  {
    number: "۰۱",
    title: "برنامه‌ریزی هوشمند",
    description:
      "اضافه کردن تسک به صورت روزانه و بازه دلخواه، تعریف‌شده با تمام جزئیات و نیازهای یک دانش‌آموز. هم امتحانات نهایی، هم کنکور!",
    accent: "from-emerald-500 to-mint",
    screenshot: "/landing-shots/feature-planning.png",
    screenshotAlt: "نمای برنامه هفتگی روال با تسک‌های روزانه",
  },
  {
    number: "۰۲",
    title: "آنالیز جامع عملکرد",
    description:
      "آنالیز جامع موارد مطالعه‌شده به صورت روزانه و بازه دلخواه، بر اساس عملکرد خودت. گزارش آماری به تفکیک دروس بگیر!",
    accent: "from-cyan-500 to-mint",
    screenshot: "/landing-shots/feature-analytics.png",
    screenshotAlt: "گزارش آماری و نقشه حرارتی مطالعه در روال",
  },
  {
    number: "۰۳",
    title: "روتین‌های حفظی",
    description:
      "روتین‌های حفظی امتحان نهایی و کنکور رو مرور کن! لغات ادبیات و مطالب کلیدی هر درس، روی نوک انگشتت.",
    accent: "from-violet-500 to-mint",
    screenshot: "/landing-shots/feature-flashcards.png",
    screenshotAlt: "فلش‌کارت هوشمند با مرور فاصله‌دار روال",
  },
  {
    number: "۰۴",
    title: "ویژه مشاوران",
    description:
      "امکان پایش دانش‌آموزان مختلف به تفکیک پنل، ارائه برنامه، آزمون، و رصد اطلاعات مطالعه دانش‌آموز با بازه دلخواه.",
    accent: "from-amber-500 to-mint",
    screenshot: "/landing-shots/feature-advisor.png",
    screenshotAlt: "پنل مشاور روال با توزیع وضعیت دانش‌آموزان",
  },
];

function FeatureCard({
  feature,
  index,
  onImageClick,
}: {
  feature: (typeof FEATURES)[number];
  index: number;
  onImageClick?: () => void;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40, filter: "blur(8px)" }}
      animate={inView ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
      transition={{ duration: 0.7, delay: index * 0.12, ease: easeOut }}
      whileHover={{ y: -7, rotateX: 1.5, rotateY: index % 2 === 0 ? -1.5 : 1.5, scale: 1.008 }}
      whileTap={{ scale: 0.995 }}
      style={{ transformPerspective: 1000, transformStyle: "preserve-3d" }}
      className="glass-panel group relative flex flex-col overflow-hidden rounded-2xl border border-white/[0.07] bg-background/55 transition-colors duration-300 hover:border-mint/25 hover:shadow-[0_24px_70px_-32px_var(--mint)]"
    >
      {/* Subtle gradient glow on hover */}
      <div
        className="pointer-events-none absolute -top-1/2 -right-1/2 h-[120%] w-[120%] rounded-full opacity-0 blur-[100px] transition-opacity duration-500 group-hover:opacity-[0.07]"
        style={{
          background: `linear-gradient(135deg, var(--mint), transparent)`,
        }}
      />

      {/* Screenshot — browser-frame style preview */}
        <button
          type="button"
          onClick={onImageClick}
          className="relative aspect-[16/10] overflow-hidden border-b border-border/40 bg-background/60"
          style={{ transform: "translateZ(24px)" }}
        >
          {/* Browser chrome dots */}
          <div className="absolute left-4 top-3 z-20 flex gap-1.5">
            <span className="size-2.5 rounded-full bg-white/15" />
            <span className="size-2.5 rounded-full bg-white/15" />
            <span className="size-2.5 rounded-full bg-white/15" />
          </div>
          <Image
            src={feature.screenshot}
            alt={feature.screenshotAlt}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 600px"
            className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.03]"
          />
          {/* Subtle top fade for the chrome dots legibility */}
          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-12 bg-gradient-to-b from-background/50 to-transparent" />
        </button>

      {/* Content */}
      <div className="relative flex flex-1 flex-col p-6 sm:p-7" style={{ transform: "translateZ(16px)" }}>
        {/* Icon */}
        <div className="relative mb-4 inline-flex h-9 min-w-9 items-center justify-center self-start border-b border-mint/40 font-mono text-xs font-black text-mint">
          {feature.number}
        </div>

        {/* Title */}
        <h3 className="relative mb-2.5 font-extrabold text-lg leading-snug tracking-tight text-foreground sm:text-xl">
          {feature.title}
        </h3>

        {/* Description */}
        <p className="relative text-sm leading-relaxed text-muted-foreground/80 sm:text-[0.938rem]">
          {feature.description}
        </p>

        {/* Bottom accent line */}
        <div
          className="mt-auto pt-6 h-[2px] w-12 rounded-full opacity-40 transition-all duration-300 group-hover:w-20 group-hover:opacity-70"
          style={{
            background: `linear-gradient(to right, var(--mint), transparent)`,
          }}
        />
      </div>
    </motion.div>
  );
}

export function Features() {
  const headerRef = React.useRef<HTMLDivElement>(null);
  const headerInView = useInView(headerRef, { once: true, margin: "-60px" });
  const [lightbox, setLightbox] = React.useState<string | null>(null);

  return (
    <section id="features" className="relative overflow-hidden py-20 sm:py-28 lg:py-36">
      <div className="aurora pointer-events-none absolute inset-0 opacity-50" aria-hidden="true" />
      <div className="mx-auto max-w-6xl px-5 sm:px-8 lg:px-12">
        {/* Section header */}
        <motion.div
          ref={headerRef}
          initial={{ opacity: 0, y: 30 }}
          animate={headerInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: easeOut }}
          className="mb-14 text-center sm:mb-18"
        >
          <h2 className="text-balance text-2xl font-extrabold leading-tight tracking-tight text-foreground sm:text-3xl lg:text-4xl">
            <span className="text-gradient-mint">روال دقیقا چی کار میکنه؟</span>
          </h2>
        </motion.div>

        {/* Feature cards grid */}
        <div className="grid gap-5 sm:grid-cols-2 sm:gap-6 lg:gap-8">
          {FEATURES.map((feature, i) => (
            <FeatureCard key={i} feature={feature} index={i} onImageClick={() => setLightbox(feature.screenshot)} />
          ))}
        </div>
      </div>

      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-sm"
            onClick={() => setLightbox(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.25, ease: easeOut }}
              className="relative mx-4 max-h-[90vh] max-w-6xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={lightbox}
                alt="بازشوی screenshots"
                width={1400}
                height={900}
                priority
                className="rounded-2xl border border-white/10 shadow-2xl"
              />
              <button
                onClick={() => setLightbox(null)}
                className="absolute -top-3 -left-3 flex size-10 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md transition-colors hover:bg-black/80"
                aria-label="بستن"
              >
                <X className="size-5" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
