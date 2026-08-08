"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Check,
  ArrowLeft,
  ArrowRight,
  Clock,
  CheckCircle2,
  UserPlus,
  Target,
  Calendar,
  Rocket,
  Mail,
  User,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ParallaxGrid } from "./parallax-grid";
import { useConfettiOnClick } from "./use-confetti";

const easeOut = [0.16, 1, 0.3, 1] as const;

/* ───────── helpers ───────── */
const toPersian = (n: number) =>
  String(n).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);

/* ───────── Reveal wrapper ───────── */
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

/* ───────── step data ───────── */
const STEPS = [
  {
    number: "۰۱",
    title: "ثبت‌نام کن",
    desc: "با ایمیل یا شماره موبایل، در کمتر از ۳۰ ثانیه ثبت‌نام کن. بدون نیاز به کارت بانکی.",
    bullets: ["ثبت‌نام با ایمیل", "بدون کارت بانکی", "تأیید فوری"],
    duration: "۳۰ ثانیه",
    label: "ثبت‌نام",
    icon: UserPlus,
  },
  {
    number: "۰۲",
    title: "هدف‌ات رو تنظیم کن",
    desc: "هدف اصلی‌ات رو انتخاب کن تا روال برنامه‌ات رو شخصی‌سازی کنه.",
    bullets: ["کنکور، تقویتی یا مهارت", "تعیین سطح اولیه", "برنامه شخصی‌سازی‌شده"],
    duration: "۲۰ ثانیه",
    label: "تنظیم هدف",
    icon: Target,
  },
  {
    number: "۰۳",
    title: "برنامه‌ات رو بساز",
    desc: "هوش مصنوعی روال، اولین برنامه هفتگی‌ات رو در چند ثانیه می‌سازد.",
    bullets: ["برنامه هفتگی هوشمند", "فلش‌کارت‌های آماده", "یادآوری خودکار"],
    duration: "۴۰ ثانیه",
    label: "ساخت برنامه",
    icon: Calendar,
  },
  {
    number: "۰۴",
    title: "شروع کن!",
    desc: "همه چیز آماده‌ست. اولین جلسه تمرکز عمیق‌ات رو شروع کن.",
    bullets: ["داشبورد فعال", "نخستین دستاورد", "پشتیبانی همیشگی"],
    duration: "آنی",
    label: "شروع",
    icon: Rocket,
  },
] as const;

/* ───────── Step Navigator ───────── */
function StepNavigator({
  step,
  onStepClick,
}: {
  step: number;
  onStepClick: (idx: number) => void;
}) {
  // progress across segments: 0 -> step 1, STEPS.length-1 -> last step
  const progress = STEPS.length > 1 ? (step / (STEPS.length - 1)) * 100 : 0;

  return (
    <div className="relative mx-auto max-w-2xl px-4">
      {/* Track + progress (background line + animated fill) */}
      <div className="relative mb-3 h-0.5 w-full rounded-full bg-white/[0.06]">
        <motion.div
          initial={{ width: "0%" }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.6, ease: easeOut }}
          className="absolute inset-y-0 right-0 rounded-full bg-gradient-to-l from-mint via-mint to-mint-bright shadow-[0_0_12px_var(--mint)/0.5]"
        />
      </div>

      {/* Circles row — flex-row-reverse so step 1 sits on the right (RTL) */}
      <div className="flex flex-row-reverse items-start justify-between">
        {STEPS.map((s, idx) => {
          const isCompleted = idx < step;
          const isActive = idx === step;
          const Icon = s.icon;
          return (
            <button
              key={s.number}
              type="button"
              onClick={() => onStepClick(idx)}
              aria-label={`قدم ${s.number}: ${s.label}`}
              aria-current={isActive ? "step" : undefined}
              className={cn(
                "group flex flex-1 cursor-pointer flex-col items-center gap-2 touch-target outline-none focus-ring-mint"
              )}
            >
              <motion.span
                initial={false}
                animate={
                  isActive
                    ? { scale: 1.08 }
                    : { scale: 1 }
                }
                transition={{ type: "spring", stiffness: 320, damping: 20 }}
                className={cn(
                  "relative flex size-12 items-center justify-center rounded-full border text-sm font-bold transition-colors duration-300",
                  isActive &&
                    "border-mint bg-mint text-mint-foreground shadow-[0_0_24px_var(--mint)/0.55]",
                  isCompleted &&
                    "border-mint/50 bg-mint/15 text-mint",
                  !isActive &&
                    !isCompleted &&
                    "border-white/[0.1] bg-white/[0.02] text-muted-foreground/50 group-hover:border-mint/30 group-hover:text-mint/80"
                )}
              >
                {isCompleted ? (
                  <Check className="size-5" />
                ) : (
                  <span className="nums">{s.number}</span>
                )}
                {isActive && (
                  <motion.span
                    layoutId="step-active-ring"
                    className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-mint/40"
                    transition={{ type: "spring", stiffness: 320, damping: 24 }}
                  />
                )}
              </motion.span>
              {/* Label */}
              <span
                className={cn(
                  "flex items-center gap-1 text-[11px] font-medium transition-colors duration-300 sm:text-xs",
                  isActive
                    ? "text-mint"
                    : isCompleted
                      ? "text-foreground/80"
                      : "text-muted-foreground/50"
                )}
              >
                <Icon className="size-3 opacity-70" />
                {s.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ───────── Mockup: Step 1 — Signup form ───────── */
function SignupMockup() {
  const fields = [
    { icon: User, label: "نام و نام خانوادگی", placeholder: "مثلاً آرمان رضایی" },
    { icon: Mail, label: "ایمیل", placeholder: "arman@example.com" },
    { icon: Lock, label: "رمز عبور", placeholder: "••••••••" },
  ] as const;

  return (
    <div className="flex flex-col gap-4 p-5">
      {/* Heading */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl border border-mint/20 bg-mint/[0.08]">
            <UserPlus className="size-4 text-mint" />
          </div>
          <div>
            <p className="text-sm font-bold">حساب بساز</p>
            <p className="text-[10px] text-muted-foreground/60">کمتر از ۳۰ ثانیه</p>
          </div>
        </div>
        <span className="rounded-md bg-mint/10 px-2 py-0.5 text-[10px] font-medium text-mint">
          قدم ۱ از ۴
        </span>
      </div>

      {/* Input fields */}
      <div className="flex flex-col gap-3">
        {fields.map((f, i) => {
          const Icon = f.icon;
          return (
            <motion.div
              key={f.label}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, ease: easeOut, delay: 0.1 + i * 0.12 }}
              className="flex flex-col gap-1.5"
            >
              <label className="text-[10px] font-medium text-muted-foreground/70">
                {f.label}
              </label>
              <div className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-2.5">
                <Icon className="size-3.5 shrink-0 text-muted-foreground/50" />
                <span className="text-[11px] text-muted-foreground/40">
                  {f.placeholder}
                </span>
                <span className="mr-auto h-3.5 w-px animate-pulse bg-mint/70" />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Submit button */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: easeOut, delay: 0.5 }}
        className="mt-1 flex items-center justify-center gap-2 rounded-lg bg-mint px-4 py-2.5 text-xs font-bold text-mint-foreground shadow-[0_0_18px_var(--mint)/0.35]"
      >
        <Sparkles className="size-3.5" />
        ثبت‌نام و شروع
      </motion.div>

      <p className="text-center text-[10px] text-muted-foreground/50">
        با ثبت‌نام، قوانین رو می‌پذیری
      </p>
    </div>
  );
}

/* ───────── Mockup: Step 2 — Goal selection ───────── */
function GoalMockup() {
  const goals = [
    { id: "konkur", icon: Target, label: "کنکور", desc: "آمادگی کنکور سراسری", selected: true },
    { id: "boost", icon: Rocket, label: "تقویتی", desc: "جبران ضعف درسی", selected: false },
    { id: "skill", icon: Sparkles, label: "مهارت", desc: "یادگیری مهارت جدید", selected: false },
  ] as const;

  return (
    <div className="flex flex-col gap-4 p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl border border-mint/20 bg-mint/[0.08]">
            <Target className="size-4 text-mint" />
          </div>
          <div>
            <p className="text-sm font-bold">هدف‌ات چیه؟</p>
            <p className="text-[10px] text-muted-foreground/60">یک گزینه انتخاب کن</p>
          </div>
        </div>
        <span className="rounded-md bg-mint/10 px-2 py-0.5 text-[10px] font-medium text-mint">
          قدم ۲ از ۴
        </span>
      </div>

      <div className="flex flex-col gap-2.5">
        {goals.map((g, i) => {
          const Icon = g.icon;
          return (
            <motion.div
              key={g.id}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, ease: easeOut, delay: 0.1 + i * 0.1 }}
              className={cn(
                "flex items-center gap-3 rounded-xl border p-3 transition-colors duration-300",
                g.selected
                  ? "border-mint/40 bg-mint/[0.08] shadow-[0_0_16px_var(--mint)/0.18]"
                  : "border-white/[0.07] bg-white/[0.02]"
              )}
            >
              <div
                className={cn(
                  "flex size-9 items-center justify-center rounded-lg",
                  g.selected ? "bg-mint/20" : "bg-white/[0.04]"
                )}
              >
                <Icon
                  className={cn(
                    "size-4",
                    g.selected ? "text-mint" : "text-muted-foreground/60"
                  )}
                />
              </div>
              <div className="flex flex-1 flex-col">
                <p className="text-xs font-semibold">{g.label}</p>
                <p className="text-[10px] text-muted-foreground/60">{g.desc}</p>
              </div>
              {/* Radio indicator */}
              <span
                className={cn(
                  "flex size-4 items-center justify-center rounded-full border transition-colors duration-300",
                  g.selected ? "border-mint bg-mint" : "border-white/[0.15]"
                )}
              >
                {g.selected && <span className="size-1.5 rounded-full bg-mint-foreground" />}
              </span>
            </motion.div>
          );
        })}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: easeOut, delay: 0.45 }}
        className="mt-1 flex items-center justify-center gap-2 rounded-lg bg-mint px-4 py-2.5 text-xs font-bold text-mint-foreground shadow-[0_0_18px_var(--mint)/0.35]"
      >
        ادامه
        <ArrowLeft className="size-3.5" />
      </motion.div>
    </div>
  );
}

/* ───────── Mockup: Step 3 — Weekly schedule ───────── */
function ScheduleMockup() {
  const days = ["شنبه", "یک‌شنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنج‌شنبه", "جمعه"] as const;
  const slots = ["صبح", "ظهر", "عصر"] as const;
  // Pre-seeded schedule: each [day][slot] => active boolean
  const cells: boolean[][] = [
    [true, true, false],
    [true, false, true],
    [true, true, true],
    [false, true, true],
    [true, true, false],
    [true, false, true],
    [false, false, true],
  ];

  return (
    <div className="flex flex-col gap-4 p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl border border-mint/20 bg-mint/[0.08]">
            <Calendar className="size-4 text-mint" />
          </div>
          <div>
            <p className="text-sm font-bold">برنامه هفتگی</p>
            <p className="text-[10px] text-muted-foreground/60">توسط هوش مصنوعی روال</p>
          </div>
        </div>
        <span className="rounded-md bg-mint/10 px-2 py-0.5 text-[10px] font-medium text-mint">
          قدم ۳ از ۴
        </span>
      </div>

      {/* Schedule grid */}
      <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] p-2">
        {/* Header row */}
        <div className="grid grid-cols-[3rem_repeat(7,1fr)] gap-1">
          <div />
          {days.map((d) => (
            <div
              key={d}
              className="py-1 text-center text-[8px] font-medium text-muted-foreground/60 sm:text-[9px]"
            >
              {d.slice(0, 3)}
            </div>
          ))}
        </div>
        {/* Slot rows */}
        {slots.map((slot, sIdx) => (
          <div
            key={slot}
            className="grid grid-cols-[3rem_repeat(7,1fr)] items-center gap-1 py-0.5"
          >
            <div className="text-[9px] font-medium text-muted-foreground/50">
              {slot}
            </div>
            {days.map((_, dIdx) => {
              const active = cells[dIdx][sIdx];
              return (
                <motion.div
                  key={`${slot}-${dIdx}`}
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    duration: 0.35,
                    ease: easeOut,
                    delay: 0.15 + (sIdx * 7 + dIdx) * 0.025,
                  }}
                  className={cn(
                    "mx-auto h-5 w-full rounded-md",
                    active
                      ? "bg-gradient-to-br from-mint-bright/80 to-mint shadow-[0_0_8px_var(--mint)/0.4]"
                      : "bg-white/[0.04]"
                  )}
                />
              );
            })}
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { v: "۱۸", l: "جلسه هفتگی" },
          { v: "۲۱س", l: "زمان تمرکز" },
          { v: "۶", l: "موضوع فعال" },
        ].map((s) => (
          <div
            key={s.l}
            className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2 text-center"
          >
            <p className="nums text-sm font-extrabold text-mint">{s.v}</p>
            <p className="text-[9px] text-muted-foreground/60">{s.l}</p>
          </div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: easeOut, delay: 0.6 }}
        className="flex items-center justify-center gap-2 rounded-lg bg-mint px-4 py-2.5 text-xs font-bold text-mint-foreground shadow-[0_0_18px_var(--mint)/0.35]"
      >
        <Sparkles className="size-3.5" />
        برنامه رو ذخیره کن
      </motion.div>
    </div>
  );
}

/* ───────── Mockup: Step 4 — Success screen ───────── */
function SuccessMockup() {
  const actions = [
    { icon: Rocket, label: "شروع جلسه" },
    { icon: Target, label: "دیدن برنامه" },
    { icon: Sparkles, label: "کاوش داشبورد" },
  ] as const;

  return (
    <div className="flex flex-col items-center gap-5 p-6 text-center">
      <div className="flex items-center justify-between self-stretch">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl border border-mint/20 bg-mint/[0.08]">
            <Rocket className="size-4 text-mint" />
          </div>
          <div>
            <p className="text-sm font-bold">همه آماده‌ست!</p>
            <p className="text-[10px] text-muted-foreground/60">قدم نهایی</p>
          </div>
        </div>
        <span className="rounded-md bg-mint/10 px-2 py-0.5 text-[10px] font-medium text-mint">
          قدم ۴ از ۴
        </span>
      </div>

      {/* Big check */}
      <motion.div
        initial={{ scale: 0, rotate: -30 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 240, damping: 16, delay: 0.15 }}
        className="relative flex size-20 items-center justify-center"
      >
        <span className="absolute inset-0 rounded-full bg-mint/20 blur-xl" />
        <span className="absolute inset-0 rounded-full border-2 border-mint/40" />
        <motion.span
          initial={{ scale: 0.8, opacity: 0.6 }}
          animate={{ scale: [0.8, 1.15, 1], opacity: 1 }}
          transition={{ duration: 0.6, ease: easeOut, delay: 0.2 }}
          className="relative flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-mint-bright to-mint shadow-[0_0_28px_var(--mint)/0.6]"
        >
          <Check className="size-9 text-mint-foreground" strokeWidth={3} />
        </motion.span>
      </motion.div>

      {/* Heading */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: easeOut, delay: 0.35 }}
      >
        <p className="text-base font-extrabold">آماده‌ای!</p>
        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground/70">
          اولین جلسه تمرکز عمیق‌ات رو همین حالا شروع کن
        </p>
      </motion.div>

      {/* Quick action buttons */}
      <div className="grid w-full grid-cols-3 gap-2">
        {actions.map((a, i) => {
          const Icon = a.icon;
          return (
            <motion.button
              key={a.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: easeOut, delay: 0.45 + i * 0.08 }}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-xl border border-white/[0.07] bg-white/[0.02] p-2.5 transition-colors duration-300",
                "hover:border-mint/30 hover:bg-mint/[0.04]"
              )}
            >
              <span className="flex size-8 items-center justify-center rounded-lg bg-mint/10">
                <Icon className="size-3.5 text-mint" />
              </span>
              <span className="text-[9px] font-medium text-foreground/80">{a.label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

/* ───────── Mockup router ───────── */
function StepMockup({ step }: { step: number }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={step}
        initial={{ opacity: 0, x: 24, scale: 0.98 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: -24, scale: 0.98 }}
        transition={{ duration: 0.4, ease: easeOut }}
        className="h-full"
      >
        {step === 0 && <SignupMockup />}
        {step === 1 && <GoalMockup />}
        {step === 2 && <ScheduleMockup />}
        {step === 3 && <SuccessMockup />}
      </motion.div>
    </AnimatePresence>
  );
}

/* ───────── Floating decorations ───────── */
function MockupDecorations() {
  return (
    <>
      <motion.div
        animate={{ y: [0, -18, 0], x: [0, 6, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute -right-10 top-8 size-32 rounded-full bg-mint/[0.10] blur-[60px]"
        aria-hidden="true"
      />
      <motion.div
        animate={{ y: [0, 14, 0], x: [0, -8, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
        className="pointer-events-none absolute -left-8 bottom-12 size-36 rounded-full bg-mint-bright/[0.08] blur-[70px]"
        aria-hidden="true"
      />
      {[
        { x: "-left-2", y: "top-[18%]", delay: 0 },
        { x: "-right-3", y: "top-[28%]", delay: 1.2 },
        { x: "left-[22%]", y: "-top-2", delay: 0.8 },
        { x: "right-[18%]", y: "-bottom-1", delay: 2 },
        { x: "-left-4", y: "bottom-[24%]", delay: 2.5 },
      ].map((dot, i) => (
        <motion.span
          key={i}
          animate={{ opacity: [0.25, 0.8, 0.25], scale: [1, 1.3, 1] }}
          transition={{
            duration: 3.4,
            repeat: Infinity,
            ease: "easeInOut",
            delay: dot.delay,
          }}
          className={cn(
            "pointer-events-none absolute size-1.5 rounded-full bg-mint/50 shadow-[0_0_8px_var(--mint)]",
            dot.x,
            dot.y
          )}
          aria-hidden="true"
        />
      ))}
    </>
  );
}

/* ═══════════════ Main Component ═══════════════ */
export function OnboardingFlow() {
  const [step, setStep] = React.useState(0);
  const fireConfetti = useConfettiOnClick();

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const isFirst = step === 0;

  const goNext = React.useCallback(() => {
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }, []);

  const goPrev = React.useCallback(() => {
    setStep((s) => Math.max(s - 1, 0));
  }, []);

  const handleFinalClick = React.useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      fireConfetti(e);
      // Reset back to step 1 after celebration so the user can replay
      window.setTimeout(() => setStep(0), 600);
    },
    [fireConfetti]
  );

  // Progress percent for the navigator fill
  const progress = STEPS.length > 1 ? (step / (STEPS.length - 1)) * 100 : 0;

  return (
    <section
      id="onboarding"
      className="scroll-mt-24 relative overflow-hidden py-24 sm:py-32"
      aria-labelledby="onboarding-heading"
    >
      <ParallaxGrid strength={50} opacity={0.12} />

      {/* Background decorations */}
      <div
        className="pointer-events-none absolute -top-20 right-0 h-[32rem] w-[32rem] rounded-full bg-mint/[0.06] blur-[140px]"
        aria-hidden="true"
      />
      <div
        className="dot-pattern pointer-events-none absolute inset-0 opacity-[0.18]"
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto max-w-6xl px-6">
        {/* ─── Header ─── */}
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="mb-5 inline-flex items-center gap-2.5 rounded-full border border-mint/20 bg-mint/[0.08] px-4 py-1.5 text-[11px] font-medium text-mint backdrop-blur-sm">
            <Sparkles className="size-3.5" />
            شروع در <span className="nums">۴</span> قدم
          </span>
          <h2
            id="onboarding-heading"
            className="text-balance text-3xl font-extrabold leading-[1.2] tracking-tight sm:text-4xl lg:text-5xl"
          >
            از صفر تا <span className="text-gradient-mint">راه‌اندازی</span> در{" "}
            <span className="nums">۲</span> دقیقه
          </h2>
          <p className="mt-5 text-pretty text-base leading-[1.9] text-muted-foreground/80">
            بدون پیچیدگی، بدون نیاز به دانش فنی. فقط مراحل رو دنبال کن.
          </p>
        </Reveal>

        {/* ─── Step navigator ─── */}
        <Reveal delay={0.1} className="mt-12">
          <StepNavigator step={step} onStepClick={setStep} />
        </Reveal>

        {/* ─── Main content grid ─── */}
        <div className="mt-12 grid items-center gap-8 lg:grid-cols-[1fr_1fr] lg:gap-12">
          {/* LEFT: text content */}
          <Reveal delay={0.15} className="order-2 lg:order-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.4, ease: easeOut }}
              >
                {/* Step number badge */}
                <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-mint/20 bg-mint/[0.08] px-3 py-1 text-[11px] font-bold text-mint">
                  <span className="nums">قدم {current.number}</span>
                </span>

                {/* Title */}
                <h3 className="text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl">
                  {current.title}
                </h3>

                {/* Description */}
                <p className="mt-3 text-pretty text-sm leading-relaxed text-muted-foreground/80 sm:text-base">
                  {current.desc}
                </p>

                {/* Bullets */}
                <ul className="mt-5 flex flex-col gap-2.5">
                  {current.bullets.map((b, i) => (
                    <motion.li
                      key={b}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.35, ease: easeOut, delay: 0.1 + i * 0.08 }}
                      className="flex items-center gap-2.5"
                    >
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-mint/15">
                        <Check className="size-3 text-mint" strokeWidth={3} />
                      </span>
                      <span className="text-sm text-foreground/85">{b}</span>
                    </motion.li>
                  ))}
                </ul>

                {/* Duration badge */}
                <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-mint/20 bg-mint/[0.06] px-3 py-1.5 text-[11px] font-medium text-mint">
                  <Clock className="size-3.5" />
                  <span>زمان تقریبی: </span>
                  <span className="nums font-bold">{current.duration}</span>
                </div>

                {/* Navigation buttons */}
                <div className="mt-7 flex items-center gap-3">
                  <motion.button
                    type="button"
                    onClick={goPrev}
                    disabled={isFirst}
                    whileHover={isFirst ? undefined : { scale: 1.03 }}
                    whileTap={isFirst ? undefined : { scale: 0.97 }}
                    aria-label="قدم قبلی"
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full border border-white/[0.08] px-5 py-2.5 text-xs font-medium transition-all duration-300 touch-target focus-ring-mint",
                      isFirst
                        ? "cursor-not-allowed border-white/[0.04] text-muted-foreground/30 opacity-60"
                        : "text-foreground/80 hover:border-mint/30 hover:text-mint"
                    )}
                  >
                    <ArrowRight className="size-3.5" />
                    قبلی
                  </motion.button>

                  {isLast ? (
                    <motion.button
                      type="button"
                      onClick={handleFinalClick}
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.97 }}
                      className={cn(
                        "inline-flex items-center gap-2 rounded-full bg-mint px-6 py-2.5 text-xs font-bold text-mint-foreground shadow-[0_0_24px_var(--mint)/0.4] transition-shadow duration-300 hover:shadow-[0_0_32px_var(--mint)/0.6] touch-target focus-ring-mint shine-sweep relative overflow-hidden"
                      )}
                    >
                      <Sparkles className="size-3.5" />
                      شروع کن
                    </motion.button>
                  ) : (
                    <motion.button
                      type="button"
                      onClick={goNext}
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.97 }}
                      aria-label="قدم بعدی"
                      className={cn(
                        "inline-flex items-center gap-2 rounded-full bg-mint px-6 py-2.5 text-xs font-bold text-mint-foreground shadow-[0_0_24px_var(--mint)/0.4] transition-shadow duration-300 hover:shadow-[0_0_32px_var(--mint)/0.6] touch-target focus-ring-mint shine-sweep relative overflow-hidden"
                      )}
                    >
                      بعدی
                      <ArrowLeft className="size-3.5" />
                    </motion.button>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </Reveal>

          {/* RIGHT: visual mockup */}
          <Reveal delay={0.2} className="order-1 lg:order-2">
            <div className="relative mx-auto max-w-md">
              {/* Decorations behind */}
              <MockupDecorations />

              {/* Mockup frame */}
              <div
                className={cn(
                  "relative overflow-hidden rounded-2xl",
                  "glass surface glow-border-hover"
                )}
              >
                {/* Window chrome */}
                <div className="flex items-center gap-2 border-b border-white/[0.06] bg-[oklch(0.12_0.005_264)] px-4 py-2.5">
                  <span className="size-2.5 rounded-full bg-[oklch(0.55_0.15_25)]" />
                  <span className="size-2.5 rounded-full bg-[oklch(0.72_0.14_85)]" />
                  <span className="size-2.5 rounded-full bg-mint/40" />
                  <span className="mx-auto text-[10px] font-medium text-muted-foreground/40">
                    app.reval.ir/onboarding
                  </span>
                </div>

                {/* Mockup content */}
                <div
                  className="min-h-[420px] bg-[oklch(0.135_0.005_264)]"
                  style={{ direction: "rtl" }}
                >
                  <StepMockup step={step} />
                </div>

                {/* Top shine line */}
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-mint/25 to-transparent" />
              </div>

              {/* Progress caption below mockup */}
              <div className="mt-4 flex items-center justify-between text-[10px] text-muted-foreground/60">
                <span>
                  قدم{" "}
                  <span className="nums font-bold text-mint">
                    {toPersian(step + 1)}
                  </span>{" "}
                  از{" "}
                  <span className="nums font-bold">{toPersian(STEPS.length)}</span>
                </span>
                <span className="nums">{Math.round(progress)}٪ تکمیل شده</span>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
