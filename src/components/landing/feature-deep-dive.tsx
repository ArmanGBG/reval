"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Check,
  Calendar,
  Clock,
  Search,
  Layers,
  Brain,
  Radar as RadarIcon,
  LayoutGrid,
  BarChart3,
  Plus,
  RotateCw,
  ChevronLeft,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ParallaxGrid } from "./parallax-grid";

const easeOut = [0.16, 1, 0.3, 1] as const;

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

/* ============ Section header ============ */
function SectionHeader({
  kicker,
  title,
  desc,
  id,
}: {
  kicker: string;
  title: string;
  desc: string;
  id?: string;
}) {
  return (
    <Reveal className="mx-auto max-w-2xl text-center">
      <span className="mb-5 inline-flex items-center gap-2.5 rounded-full border border-mint/20 bg-mint/[0.08] px-4 py-1.5 text-[11px] font-medium text-mint backdrop-blur-sm">
        <span className="size-1.5 rounded-full bg-mint shadow-[0_0_8px_var(--mint)]" />
        {kicker}
      </span>
      <h2 className="text-balance text-3xl font-extrabold leading-[1.2] tracking-tight sm:text-4xl lg:text-5xl">
        {title}
      </h2>
      <p className="mt-5 text-pretty text-base leading-[1.9] text-muted-foreground/80">
        {desc}
      </p>
    </Reveal>
  );
}

/* ============ Feature row (alternating) ============ */
function FeatureRow({
  reverse,
  text,
  mockup,
}: {
  reverse?: boolean;
  text: React.ReactNode;
  mockup: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "grid items-center gap-10 lg:grid-cols-2 lg:gap-20",
        reverse && "lg:[&>*:first-child]:order-2"
      )}
    >
      <Reveal>{mockup}</Reveal>
      <Reveal delay={0.12}>{text}</Reveal>
    </div>
  );
}

function FeatureText({
  icon,
  badge,
  title,
  desc,
  points,
}: {
  icon: React.ReactNode;
  badge: string;
  title: string;
  desc: string;
  points: string[];
}) {
  return (
    <div>
      {/* Icon container with rotating gradient border on hover */}
      <div className="group/icon relative mb-5 size-12 rounded-2xl">
        {/* Default icon background */}
        <div className="absolute inset-0 rounded-2xl border border-mint/20 bg-mint/[0.08] shadow-[0_0_20px_color-mix(in_oklch,var(--mint)_15%,transparent)] transition-opacity duration-300 group-hover/icon:opacity-0" />
        {/* Rotating conic-gradient border — visible on hover */}
        <motion.div
          className="absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover/icon:opacity-100"
          style={{
            background:
              "conic-gradient(from 0deg, var(--mint), transparent 30%, var(--mint-bright) 55%, transparent 80%, var(--mint))",
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        />
        {/* Inner fill to carve out the center → creates border ring effect */}
        <div className="absolute inset-[2px] rounded-[14px] bg-card opacity-0 transition-opacity duration-300 group-hover/icon:opacity-100" />
        {/* Icon */}
        <div className="relative z-10 flex h-full w-full items-center justify-center text-mint">
          {icon}
        </div>
      </div>
      <span className="text-xs font-semibold text-mint/90 tracking-wide">{badge}</span>
      <h3 className="mt-2.5 text-2xl font-extrabold tracking-tight sm:text-3xl">
        {title}
      </h3>
      <p className="mt-3 text-pretty leading-[1.9] text-muted-foreground/80">
        {desc}
      </p>
      <ul className="mt-6 space-y-3">
        {points.map((p, i) => (
          <motion.li
            key={p}
            className="flex items-start gap-3 text-sm text-foreground/90"
            initial={{ opacity: 0, x: 10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, ease: easeOut, delay: i * 0.07 }}
          >
            <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-mint/10">
              <Check className="size-3 text-mint" />
            </span>
            <span>{p}</span>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}

/* ============ Mockup: To-do list ============ */
function TodoMockup() {
  const tasks = [
    { text: "مرور فصل ۳ فیزیک — حرکت", time: "۰۸:۰۰", tag: "فیزیک", done: true, tint: "mint" },
    { text: "تمرین ۲۰تایی مشتق", time: "۱۰:۳۰", tag: "ریاضی", done: true, tint: "sky" },
    { text: "حفظ ۱۵ واژه کنکور", time: "۱۴:۰۰", tag: "زبان", done: false, tint: "amber" },
    { text: "خلاصه‌نویسی تاریخ ایران", time: "۱۷:۰۰", tag: "تاریخ", done: false, tint: "rose" },
  ];

  const tagTints: Record<string, string> = {
    mint: "bg-mint/10 text-mint",
    sky: "bg-sky-400/10 text-sky-300",
    amber: "bg-amber-400/10 text-amber-300",
    rose: "bg-rose-400/10 text-rose-300",
  };

  const circumference = 2 * Math.PI * 15;
  const progress = 2 / 4;
  const dashOffset = circumference * (1 - progress);

  return (
    <div className="surface surface-hover rounded-3xl p-2">
      <div className="rounded-[1.25rem] bg-card/80 p-5">
        {/* header */}
        <div className="mb-5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2.5 text-foreground">
              <Calendar className="size-4 text-mint" />
              <span className="text-sm font-semibold">برنامه امروز</span>
            </div>
            <div className="nums mt-1 text-xs text-muted-foreground/70">
              پنجشنبه ۱۵ مرداد ۱۴۰۳
            </div>
          </div>
          {/* progress ring — animated dash */}
          <div className="relative size-12">
            <svg viewBox="0 0 36 36" className="size-12 -rotate-90">
              <circle cx="18" cy="18" r="15" fill="none" stroke="oklch(1 0 0 / 0.08)" strokeWidth="3" />
              <motion.circle
                cx="18"
                cy="18"
                r="15"
                fill="none"
                stroke="var(--mint)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                whileInView={{ strokeDashoffset: dashOffset }}
                viewport={{ once: true }}
                transition={{ duration: 1.2, ease: easeOut }}
                style={{ filter: "drop-shadow(0 0 4px var(--mint))" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="nums text-[10px] font-bold text-foreground">۲/۴</span>
            </div>
          </div>
        </div>

        {/* list — staggered slide-in */}
        <div className="space-y-2.5">
          {tasks.map((t, i) => (
            <motion.div
              key={t.text}
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, ease: easeOut, delay: i * 0.08 }}
              className="group flex items-center gap-3 rounded-xl border border-border/50 bg-background/30 px-3.5 py-3 transition-all duration-200 hover:border-border/80 hover:bg-background/50"
            >
              <motion.span
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-md border transition-all duration-200",
                  t.done
                    ? "border-mint bg-mint text-[#06120c] shadow-[0_0_8px_color-mix(in_oklch,var(--mint)_30%,transparent)]"
                    : "border-border bg-transparent group-hover:border-mint/30"
                )}
                animate={t.done ? { scale: [1, 1.25, 1] } : undefined}
                transition={t.done ? { duration: 0.35, delay: i * 0.08 + 0.5, ease: easeOut } : undefined}
              >
                {t.done && <Check className="size-3.5" strokeWidth={3} />}
              </motion.span>
              <span
                className={cn(
                  "flex-1 text-sm",
                  t.done && "text-muted-foreground/60 line-through"
                )}
              >
                {t.text}
              </span>
              <span
                className={cn(
                  "hidden rounded-md px-2 py-0.5 text-[10px] font-medium sm:inline",
                  tagTints[t.tint]
                )}
              >
                {t.tag}
              </span>
              <span className="nums text-[11px] text-muted-foreground/70">{t.time}</span>
            </motion.div>
          ))}
          <button className="flex w-full items-center gap-2 rounded-xl border border-dashed border-border/60 px-3.5 py-3 text-xs text-muted-foreground/60 transition-all duration-300 hover:border-mint/40 hover:text-mint hover:shadow-[0_0_16px_color-mix(in_oklch,var(--mint)_15%,transparent)]">
            <Plus className="size-3.5" />
            افزودن تسک
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============ Mockup: Flashcards ============ */
function FlashcardMockup() {
  const [mousePos, setMousePos] = React.useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = React.useState(false);
  const [sparkles, setSparkles] = React.useState(false);
  const cardRef = React.useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    setMousePos({ x, y });
  };

  const handleSparkle = () => {
    setSparkles(true);
    setTimeout(() => setSparkles(false), 700);
  };

  return (
    <div className="surface surface-hover rounded-3xl p-2">
      <div
        ref={cardRef}
        className="relative rounded-[1.25rem] bg-card/80 p-6"
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => {
          setIsHovering(false);
          setMousePos({ x: 0, y: 0 });
        }}
        style={{ perspective: 800 }}
      >
        {/* stacked back cards — parallax drift */}
        <motion.div
          className="absolute inset-x-8 top-4 h-[calc(100%-2rem)] rounded-2xl border border-border/40 bg-background/20"
          animate={{
            x: isHovering ? mousePos.x * -8 : 0,
            y: isHovering ? mousePos.y * -4 : 0,
          }}
          transition={{ type: "spring", stiffness: 150, damping: 20 }}
        />
        <motion.div
          className="absolute inset-x-6 top-3 h-[calc(100%-1.5rem)] rounded-2xl border border-border/50 bg-background/40"
          animate={{
            x: isHovering ? mousePos.x * -4 : 0,
            y: isHovering ? mousePos.y * -2 : 0,
          }}
          transition={{ type: "spring", stiffness: 150, damping: 20 }}
        />

        {/* front card — 3D tilt on hover */}
        <motion.div
          className="relative rounded-2xl border border-border/60 bg-background/60 p-6 shadow-xl shadow-black/20"
          style={{ transformStyle: "preserve-3d" }}
          animate={{
            rotateY: isHovering ? mousePos.x * 5 : 0,
            rotateX: isHovering ? -mousePos.y * 5 : 0,
          }}
          transition={{ type: "spring", stiffness: 200, damping: 25 }}
        >
          <div className="flex items-center justify-between">
            <span className="rounded-md bg-mint/10 px-2.5 py-0.5 text-[10px] font-medium text-mint">
              شیمی
            </span>
            <span className="nums text-[11px] text-muted-foreground/70">کارت ۳ از ۱۲</span>
          </div>
          <p className="mt-5 text-center text-lg font-bold leading-relaxed">
            فرمول حجم گاز در شرایط استاندارد (STP) چیست؟
          </p>
          <div className="mt-5 flex justify-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-border/60 px-3.5 py-1.5 text-[11px] text-muted-foreground/70 backdrop-blur-sm">
              <RotateCw className="size-3" />
              برای پاسخ کلیک کن
            </span>
          </div>
          <div className="mt-6 flex items-center gap-2.5">
            <button className="flex-1 rounded-xl border border-border/60 bg-background/50 py-2.5 text-xs font-medium text-muted-foreground transition-all hover:text-foreground hover:bg-background/70">
              دوباره
            </button>
            <motion.button
              className="relative flex-1 overflow-hidden rounded-xl bg-mint py-2.5 text-xs font-semibold text-[#06120c] shadow-[0_4px_16px_-4px_var(--mint)] hover:brightness-110 transition-all"
              whileTap={{ scale: 0.95 }}
              onClick={handleSparkle}
            >
              {/* Sparkle burst overlay */}
              {sparkles && (
                <motion.div
                  className="absolute inset-0 bg-white/20"
                  initial={{ scale: 0, opacity: 1 }}
                  animate={{ scale: 2.5, opacity: 0 }}
                  transition={{ duration: 0.5 }}
                />
              )}
              {/* Sparkle particles */}
              {sparkles &&
                Array.from({ length: 6 }).map((_, i) => {
                  const angle = (i / 6) * Math.PI * 2;
                  return (
                    <motion.span
                      key={i}
                      className="absolute left-1/2 top-1/2 size-1 rounded-full bg-mint-bright"
                      initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                      animate={{
                        x: Math.cos(angle) * 20,
                        y: Math.sin(angle) * 20,
                        opacity: 0,
                        scale: 0.3,
                      }}
                      transition={{ duration: 0.45, ease: "easeOut" }}
                    />
                  );
                })}
              حفظ شد
            </motion.button>
          </div>
        </motion.div>

        {/* progress — animated width on view */}
        <div className="mt-5 flex items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border/50">
            <motion.div
              className="h-full rounded-full bg-gradient-to-l from-mint-bright to-mint"
              initial={{ width: 0 }}
              whileInView={{ width: "25%" }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: easeOut, delay: 0.3 }}
            />
          </div>
          <span className="nums text-[11px] text-muted-foreground/70">۲۵٪</span>
        </div>
      </div>
    </div>
  );
}

/* ============ Mockup: Student Radar ============ */
function RadarMockup() {
  const students = [
    { name: "آرمان رضایی", status: "focus", pct: "۹۲٪", color: "mint" },
    { name: "سارا محمدی", status: "focus", pct: "۸۸٪", color: "mint" },
    { name: "نیما کاظمی", status: "risk", pct: "۴۱٪", color: "amber" },
    { name: "مهسا اکبری", status: "idle", pct: "۱۲٪", color: "gray" },
  ];
  const statusText: Record<string, string> = {
    focus: "در تمرکز عمیق",
    risk: "نیاز به توجه",
    idle: "غیرفعال",
  };
  return (
    <div className="surface surface-hover rounded-3xl p-2">
      <div className="rounded-[1.25rem] bg-card/80 p-5">
        {/* search bar with focus/hover glow */}
        <motion.div
          className="mb-4 flex items-center gap-2.5 rounded-xl border border-border/50 bg-background/30 px-3.5 py-2.5 transition-colors duration-200"
          whileHover={{
            boxShadow: "0 0 16px color-mix(in_oklch, var(--mint) 15%, transparent)",
          }}
          transition={{ duration: 0.2 }}
        >
          <Search className="size-4 text-muted-foreground/60 transition-colors group-hover:text-mint" />
          <span className="text-xs text-muted-foreground/60">جست‌وجوی دانش‌آموز…</span>
        </motion.div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* radar */}
          <div className="relative mx-auto aspect-square w-full max-w-[15rem]">
            <div className="absolute inset-0 rounded-full border border-border/50" />
            <div className="absolute inset-[14%] rounded-full border border-border/40" />
            <div className="absolute inset-[30%] rounded-full border border-border/30" />
            <div className="absolute inset-[46%] rounded-full border border-border/20" />
            <div className="absolute inset-x-1/2 top-0 bottom-0 w-px -translate-x-1/2 bg-border/30" />
            <div className="absolute inset-y-1/2 right-0 left-0 h-px -translate-y-1/2 bg-border/30" />
            {/* sweep — fading comet trail */}
            <motion.div
              className="absolute inset-0 origin-center rounded-full"
              style={{
                background:
                  "conic-gradient(from 0deg, transparent 0deg, color-mix(in oklch, var(--mint) 6%, transparent) 10deg, color-mix(in oklch, var(--mint) 12%, transparent) 25deg, color-mix(in oklch, var(--mint) 22%, transparent) 40deg, transparent 55deg)",
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            />
            {/* blips — pulsing with varying intensities */}
            <motion.span
              className="absolute right-[22%] top-[30%] size-2 rounded-full bg-mint shadow-[0_0_12px_var(--mint)]"
              animate={{ scale: [1, 1.4, 1], opacity: [1, 0.7, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.span
              className="absolute left-[28%] top-[40%] size-2 rounded-full bg-mint shadow-[0_0_12px_var(--mint)]"
              animate={{ scale: [1, 1.3, 1], opacity: [1, 0.8, 1] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            />
            <motion.span
              className="absolute right-[38%] bottom-[28%] size-2 rounded-full bg-amber-400 shadow-[0_0_12px_oklch(0.75_0.18_70)]"
              animate={{ scale: [1, 1.5, 1], opacity: [1, 0.6, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
            />
            <motion.span
              className="absolute left-[40%] bottom-[40%] size-1.5 rounded-full bg-muted-foreground/40"
              animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.2, 0.4] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <RadarIcon className="size-5 text-mint/60" />
            </div>
          </div>

          {/* list — hover glow */}
          <div className="space-y-2.5">
            {students.map((s) => (
              <motion.div
                key={s.name}
                className="flex items-center gap-3 rounded-xl border border-border/50 bg-background/30 px-3.5 py-2.5 transition-colors duration-200"
                whileHover={{
                  boxShadow: "0 0 14px color-mix(in_oklch, var(--mint) 12%, transparent)",
                  borderColor: "color-mix(in oklch, var(--mint) 25%, transparent)",
                }}
                transition={{ duration: 0.2 }}
              >
                <span className="relative flex size-8 items-center justify-center rounded-full bg-card text-[10px] font-bold text-foreground shadow-sm">
                  {s.name.charAt(0)}
                  <span
                    className={cn(
                      "absolute -bottom-0 -right-0 size-2.5 rounded-full border-2 border-card",
                      s.color === "mint" && "bg-mint shadow-[0_0_6px_var(--mint)]",
                      s.color === "amber" && "bg-amber-400",
                      s.color === "gray" && "bg-muted-foreground/40"
                    )}
                  />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-medium text-foreground">
                    {s.name}
                  </div>
                  <div className="text-[10px] text-muted-foreground/60">
                    {statusText[s.status]}
                  </div>
                </div>
                <span className="nums text-xs font-semibold text-foreground">
                  {s.pct}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============ Mockup: Schedule builder ============ */
function ScheduleMockup() {
  const days = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه"];
  const cards: Record<string, { t: string; sub: string; c: string }[]> = {
    شنبه: [
      { t: "فیزیک", sub: "مکانیک", c: "mint" },
      { t: "ریاضی", sub: "مشتق", c: "sky" },
    ],
    یکشنبه: [{ t: "زبان", sub: "واژگان", c: "amber" }],
    دوشنبه: [{ t: "شیمی", sub: "حل تمرین", c: "mint" }],
    سه‌شنبه: [{ t: "تاریخ", sub: "خلاصه", c: "sky" }],
  };
  const tone: Record<string, string> = {
    mint: "border-mint/30 bg-gradient-to-br from-mint/15 to-mint/5 text-mint",
    sky: "border-sky-400/30 bg-gradient-to-br from-sky-400/12 to-sky-400/4 text-sky-300",
    amber: "border-amber-400/30 bg-gradient-to-br from-amber-400/12 to-amber-400/4 text-amber-300",
  };
  return (
    <div className="surface surface-hover rounded-3xl p-2">
      <div className="rounded-[1.25rem] bg-card/80 p-5">
        <div className="mb-5 flex items-center justify-between">
          <span className="text-sm font-semibold">سازنده برنامه هفتگی</span>
          <span className="nums rounded-lg bg-background/50 px-2.5 py-1 text-[10px] text-muted-foreground/70 border border-border/30">
            هفته ۳۳
          </span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {days.map((d, idx) => (
            <motion.div
              key={d}
              className="min-h-[9rem] rounded-xl border border-border/40 bg-background/25 p-1.5"
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, ease: easeOut, delay: idx * 0.1 }}
            >
              <div className="mb-2 flex items-center justify-between px-1">
                <span className="text-[10px] font-medium text-muted-foreground/70">{d}</span>
                <span className="nums text-[9px] text-muted-foreground/50">{idx + 1}</span>
              </div>
              <div className="space-y-1.5">
                {cards[d]?.map((c, i) => {
                  const dragging = idx === 1 && i === 0;
                  return (
                    <motion.div
                      key={i}
                      className={cn(
                        "rounded-lg border px-2 py-1.5 text-[10px] transition-all",
                        tone[c.c],
                        dragging &&
                          "rotate-2 shadow-lg shadow-black/40 ring-2 ring-mint/40"
                      )}
                      animate={
                        dragging
                          ? { y: [0, -3, 0], rotate: [2, 1.5, 2] }
                          : undefined
                      }
                      transition={
                        dragging
                          ? { duration: 2, repeat: Infinity, ease: "easeInOut" }
                          : undefined
                      }
                    >
                      <div className="font-semibold">{c.t}</div>
                      <div className="opacity-70">{c.sub}</div>
                    </motion.div>
                  );
                })}
                {/* drop zone — pulsing */}
                <motion.div
                  className="rounded-lg border border-dashed border-border/50 px-2 py-1.5 text-[10px] text-muted-foreground/40"
                  animate={{ opacity: [0.4, 0.7, 0.4] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  + رها کن
                </motion.div>
              </div>
            </motion.div>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-2 text-[10px] text-muted-foreground/60">
          <Layers className="size-3 text-mint" />
          درگ اند دراپ برای چیدمان مجدد — همه چیز همگام می‌شود
        </div>
      </div>
    </div>
  );
}

/* ============ Mockup: Data analysis ============ */
function DataMockup() {
  const bars = [42, 58, 50, 71, 64, 83, 95];
  const max = 100;
  const highestIdx = bars.indexOf(Math.max(...bars));

  const barGradient = (b: number) => {
    if (b >= 80)
      return "linear-gradient(to top, color-mix(in oklch, var(--mint) 50%, transparent), var(--mint-bright))";
    if (b >= 60)
      return "linear-gradient(to top, color-mix(in oklch, var(--mint) 35%, transparent), color-mix(in oklch, var(--mint) 70%, transparent))";
    return "linear-gradient(to top, color-mix(in oklch, var(--mint) 20%, transparent), color-mix(in oklch, var(--mint) 40%, transparent))";
  };

  return (
    <div className="surface surface-hover rounded-3xl p-2">
      <div className="rounded-[1.25rem] bg-card/80 p-5">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <BarChart3 className="size-4 text-mint" />
              <span className="text-sm font-semibold">میزان انطباق برنامه</span>
            </div>
            <div className="nums mt-1 text-[11px] text-muted-foreground/70">
              میانگین هفتگی
            </div>
          </div>
          <div className="text-left">
            <div className="nums text-2xl font-extrabold text-mint drop-shadow-[0_0_14px_var(--mint)]">
              ۸۳٪
            </div>
            <motion.span
              className="nums text-[10px] font-medium text-mint/70 inline-block"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              ▲ ۱۲٪
            </motion.span>
          </div>
        </div>

        {/* bar chart — gradient fill */}
        <div className="flex h-32 items-end justify-between gap-2.5 rounded-xl border border-border/40 bg-background/25 p-3">
          {bars.map((b, i) => (
            <div key={i} className="relative flex flex-1 flex-col items-center gap-1.5">
              {/* Star indicator on highest bar */}
              {i === highestIdx && (
                <motion.span
                  className="absolute -top-3 left-1/2 -translate-x-1/2 z-10"
                  initial={{ opacity: 0, y: 5 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.06 + 0.6 }}
                >
                  <Star className="size-3 fill-mint text-mint" />
                </motion.span>
              )}
              <div className="flex w-full flex-1 items-end">
                <motion.div
                  initial={{ height: 0 }}
                  whileInView={{ height: `${(b / max) * 100}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.9, ease: easeOut, delay: i * 0.06 }}
                  className={cn(
                    "w-full rounded-t-md transition-all",
                    b >= 80 && "shadow-[0_0_20px_var(--mint)]"
                  )}
                  style={{ background: barGradient(b) }}
                />
              </div>
              <span className="nums text-[9px] text-muted-foreground/50">
                {["ش", "ی", "د", "س", "چ", "پ", "ج"][i]}
              </span>
            </div>
          ))}
        </div>

        {/* stats — hover lift with glow */}
        <div className="mt-4 grid grid-cols-3 gap-2.5">
          {[
            { l: "تسک‌های کامل", v: "۱۸۶", u: "" },
            { l: "زمان تمرکز", v: "۴۲", u: "ساعت" },
            { l: "روز پیاپی", v: "۱۴", u: "" },
          ].map((s) => (
            <motion.div
              key={s.l}
              className="rounded-xl border border-border/50 bg-background/30 p-3 text-center transition-colors duration-200"
              whileHover={{
                y: -2,
                boxShadow: "0 4px 20px -4px color-mix(in_oklch, var(--mint) 20%, transparent)",
                borderColor: "color-mix(in oklch, var(--mint) 30%, transparent)",
              }}
              transition={{ duration: 0.2 }}
            >
              <div className="nums text-base font-bold text-foreground">
                {s.v}
                <span className="mr-1 text-[10px] font-normal text-muted-foreground/60">
                  {s.u}
                </span>
              </div>
              <div className="mt-0.5 text-[10px] text-muted-foreground/60">{s.l}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============ Section ============ */
export function FeatureDeepDive() {
  return (
    <section id="features" className="relative py-28 sm:py-36">
      <ParallaxGrid strength={120} opacity={0.3} />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* PART A — Student Workspace */}
        <div id="features-student" className="scroll-mt-24">
          <SectionHeader
            kicker="میز کار دانش‌آموز"
            title="ایزولاسیون شناختی برای حداکثر تمرکز"
            desc="فضایی ایزوله و آرام، طراحی‌شده برای اینکه ذهن دانش‌آموز فقط روی یک چیز متمرکز بماند: گام بعدی."
          />
          <div className="mt-20 space-y-28">
            <FeatureRow
              text={
                <FeatureText
                  icon={<Check className="size-5" />}
                  badge="قابلیت ۰۱"
                  title="فهرست کارهای روزانه"
                  desc="برنامه روزانه را به گام‌های ریز و قابل‌لمس بشکنید. هر تیک، یک پالس دوپامین کوچک و یک نشانه از پیشرفت واقعی."
                  points={[
                    "اولویت‌بندی هوشمند بر اساس اهمیت و فوریت",
                    "تخمین زمان واقعی هر تسک",
                    "همگام‌سازی خودکار با برنامه مشاور",
                  ]}
                />
              }
              mockup={<TodoMockup />}
            />
            <FeatureRow
              reverse
              text={
                <FeatureText
                  icon={<Brain className="size-5" />}
                  badge="قابلیت ۰۲"
                  title="فلش‌کارت‌های یادگیری پایدار"
                  desc="عادت یادگیری را با تکرار فاصله‌دار بسازید. روال، لحظه مرور طلایی را می‌داند و از شما می‌خواهد در همان لحظه ظاهر شوید."
                  points={[
                    "الگوریتم تکرار فاصله‌دار (Spaced repetition)",
                    "آمار دقیق حفظ و فراموشی",
                    "تبدیل هر پاسخ به یک عادت پایدار",
                  ]}
                />
              }
              mockup={<FlashcardMockup />}
            />
          </div>
        </div>

        {/* divider */}
        <div className="my-28 h-px w-full bg-gradient-to-l from-transparent via-border to-transparent" />

        {/* PART B — Counselor Command Center */}
        <div id="features-counselor" className="scroll-mt-24">
          <SectionHeader
            kicker="مرکز فرماندهی مشاور"
            title="مدیریت داده‌محور و هوشمندانه"
            desc="تمام دانش‌آموزانتان در یک نگاه. تصمیم‌گیری بر اساس داده، نه حدس و گمان."
          />
          <div className="mt-20 space-y-28">
            <FeatureRow
              text={
                <FeatureText
                  icon={<RadarIcon className="size-5" />}
                  badge="قابلیت ۰۱"
                  title="رادار دانش‌آموز"
                  desc="وضعیت تمرکز هر دانش‌آموز را در لحظه ببینید. قبل از اینکه افت عملکرد به نمره تبدیل شود، آن را تشخیص دهید."
                  points={[
                    "ردیابی لحظه‌ای وضعیت تمرکز",
                    "هشدار خودکار برای دانش‌آموزان در معرض ریسک",
                    "نمای ۳۶۰درجه از پیشرفت هر فرد",
                  ]}
                />
              }
              mockup={<RadarMockup />}
            />
            <FeatureRow
              reverse
              text={
                <FeatureText
                  icon={<LayoutGrid className="size-5" />}
                  badge="قابلیت ۰۲"
                  title="سازنده برنامه با درگ اند دراپ"
                  desc="برنامه هفتگی را با یک درگ ساده بازچینی کنید. تغییرات به‌صورت زنده برای دانش‌آموز اعمال می‌شود."
                  points={[
                    "چیدمان بصری درگ اند دراپ",
                    "همگام‌سازی آنی با میز کار دانش‌آموز",
                    "قالب‌های آماده برای برنامه‌های رایج",
                  ]}
                />
              }
              mockup={<ScheduleMockup />}
            />
            <FeatureRow
              text={
                <FeatureText
                  icon={<BarChart3 className="size-5" />}
                  badge="قابلیت ۰۳"
                  title="تحلیل داده با نمودارهای انطباق نئونی"
                  desc="میزان انطباق هر دانش‌آموز با برنامه‌اش را در نمودارهایی نئونی و واضح ببینید. داده‌هایی که برای تصمیم‌گیری واقعی آماده‌اند."
                  points={[
                    "نمودارهای انطباق با درخشش نئونی",
                    "مقایسه عملکرد در بازه‌های زمانی مختلف",
                    "گزارش‌های آماده برای جلسات مشاوره",
                  ]}
                />
              }
              mockup={<DataMockup />}
            />
          </div>
        </div>

        {/* CTA */}
        <Reveal className="mt-28">
          <div className="surface relative overflow-hidden rounded-3xl p-10 text-center sm:p-14">
            <div className="absolute -top-1/2 left-1/2 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-mint/[0.12] blur-[140px]" />
            <div className="relative">
              <h3 className="text-balance text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-4xl">
                آماده‌اید همه چیز را روی{" "}
                <span className="text-gradient-mint">روال</span> بیاورید؟
              </h3>
              <p className="mx-auto mt-4 max-w-md text-sm leading-[1.9] text-muted-foreground/80">
                همین حالا شروع کنید. اولین هفته رایگان است.
              </p>
              <a
                href="#signup"
                className="group mt-8 inline-flex items-center gap-2.5 rounded-full bg-mint px-7 py-3.5 text-sm font-semibold text-[#06120c] shadow-[0_14px_44px_-10px_var(--mint)] transition-all duration-300 hover:shadow-[0_18px_52px_-8px_var(--mint-bright)] hover:brightness-110 hover:scale-[1.02]"
              >
                شروع رایگان
                <ChevronLeft className="size-4 transition-transform duration-300 group-hover:-translate-x-1" />
              </a>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
