"use client";

import { motion } from "framer-motion";
import { useState, useMemo } from "react";
import {
  Calculator,
  Users,
  Calendar,
  TrendingDown,
  Sparkles,
  Check,
  Wallet,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatedCounter } from "./animated-counter";

const easeOut = [0.16, 1, 0.3, 1] as const;

/** Convert a number to Persian digits (۰۱۲۳۴۵۶۷۸۹). */
const toPersian = (n: number): string =>
  String(n).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);

/** Format a number with thousands separators (Persian digits). */
const toPersianGrouped = (n: number): string =>
  toPersian(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, "،");

/** Traditional private tutor monthly cost (هزار تومان per student per month). */
const TUTOR_MONTHLY = 250;

type PlanId = "student" | "pro" | "org";

interface PlanOption {
  id: PlanId;
  name: string;
  price: number; // هزار تومان / ماه
  priceLabel: string;
  badge?: string;
  popular?: boolean;
}

const PLAN_OPTIONS: PlanOption[] = [
  {
    id: "student",
    name: "دانش‌آموز",
    price: 0,
    priceLabel: "رایگان",
  },
  {
    id: "pro",
    name: "مشاور حرفه‌ای",
    price: 49,
    priceLabel: "۴۹",
    badge: "محبوب‌ترین",
    popular: true,
  },
  {
    id: "org",
    name: "سازمانی",
    price: 99,
    priceLabel: "۹۹",
  },
];

/** Compute savings, traditional cost and Reval cost (هزار تومان). */
function computeSavings(plan: PlanId, students: number, months: number) {
  const planPrice = PLAN_OPTIONS.find((p) => p.id === plan)?.price ?? 0;
  const traditionalCost = TUTOR_MONTHLY * students * months;
  const revalCost = planPrice * students * months;

  let savings: number;
  if (plan === "student") {
    // Free plan → full savings vs traditional tutoring.
    savings = TUTOR_MONTHLY * students * months;
  } else if (plan === "org") {
    // Volume discount bonus of +10%.
    savings = (TUTOR_MONTHLY - planPrice) * students * months * 1.1;
  } else {
    savings = (TUTOR_MONTHLY - planPrice) * students * months;
  }

  return { savings, traditionalCost, revalCost };
}

export function PricingCalculator() {
  const [students, setStudents] = useState(5);
  const [months, setMonths] = useState(12);
  const [plan, setPlan] = useState<PlanId>("pro");

  const { savings, traditionalCost, revalCost } = useMemo(
    () => computeSavings(plan, students, months),
    [plan, students, months],
  );

  return (
    <section
      id="calculator"
      className="relative scroll-mt-24 overflow-hidden py-24 sm:py-32"
    >
      {/* Background decorations */}
      <div className="pointer-events-none absolute inset-0 dot-pattern opacity-20" aria-hidden="true" />
      <div
        className="pointer-events-none absolute left-1/2 top-1/4 h-[40rem] w-[40rem] -translate-x-1/2 -translate-y-1/3 rounded-full bg-mint/[0.06] blur-[150px]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: easeOut }}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="mb-5 inline-flex items-center gap-2.5 rounded-full border border-mint/25 bg-mint/[0.08] px-4 py-1.5 text-[11px] font-medium text-mint backdrop-blur-sm">
            <Calculator className="size-3.5" />
            ماشین حساب پس‌انداز
          </span>
          <h2 className="text-balance text-3xl font-extrabold leading-[1.2] tracking-tight sm:text-4xl lg:text-5xl">
            چقدر <span className="text-gradient-mint animated-gradient-underline">صرفه‌جویی</span> می‌کنی؟
          </h2>
          <p className="mt-5 text-pretty leading-[1.9] text-muted-foreground/80">
            با روال، فقط هزینه یادگیری رو پرداخت می‌کنی؛ نه هزینه‌های پنهان. محاسبه کن و ببین.
          </p>
        </motion.div>

        {/* Two-column layout: inputs (1.1fr) + result (1fr) */}
        <div className="mt-14 grid gap-6 lg:grid-cols-[1.1fr_1fr] lg:gap-8">
          {/* LEFT — Inputs panel */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.7, ease: easeOut }}
            className="glass surface surface-hover relative flex flex-col rounded-3xl p-6 sm:p-8"
          >
            {/* Title row */}
            <div className="mb-7 flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl border border-mint/20 bg-mint/[0.08] text-mint">
                <Wallet className="size-5" />
              </span>
              <div>
                <h3 className="text-lg font-extrabold">تنظیمات پلن تو</h3>
                <p className="text-xs text-muted-foreground/70">
                  مقدارها را تغییر بده تا صرفه‌جویی خودت رو ببینی
                </p>
              </div>
            </div>

            {/* Slider 1 — Students */}
            <div className="mb-7">
              <div className="mb-3 flex items-center justify-between">
                <label
                  htmlFor="calc-students"
                  className="flex items-center gap-2 text-sm font-semibold text-foreground/90"
                >
                  <Users className="size-4 text-mint" />
                  تعداد دانش‌آموزان
                </label>
                <span className="nums rounded-full border border-mint/30 bg-mint/[0.1] px-3 py-0.5 text-sm font-bold text-mint">
                  {toPersian(students)} نفر
                </span>
              </div>
              <input
                id="calc-students"
                type="range"
                min={1}
                max={50}
                value={students}
                onChange={(e) => setStudents(Number(e.target.value))}
                style={{ ["--range-fill" as string]: `${((students - 1) / 49) * 100}%` }}
                className="range-mint h-2 w-full cursor-pointer appearance-none rounded-full focus-ring-mint"
                aria-label="تعداد دانش‌آموزان"
              />
              <div className="mt-2 flex justify-between text-[10px] text-muted-foreground/50">
                <span className="nums">۱</span>
                <span className="nums">۵۰</span>
              </div>
            </div>

            {/* Slider 2 — Months */}
            <div className="mb-7">
              <div className="mb-3 flex items-center justify-between">
                <label
                  htmlFor="calc-months"
                  className="flex items-center gap-2 text-sm font-semibold text-foreground/90"
                >
                  <Calendar className="size-4 text-mint" />
                  مدت اشتراک (ماه)
                </label>
                <span className="nums rounded-full border border-mint/30 bg-mint/[0.1] px-3 py-0.5 text-sm font-bold text-mint">
                  {toPersian(months)} ماه
                </span>
              </div>
              <input
                id="calc-months"
                type="range"
                min={1}
                max={24}
                value={months}
                onChange={(e) => setMonths(Number(e.target.value))}
                style={{ ["--range-fill" as string]: `${((months - 1) / 23) * 100}%` }}
                className="range-mint h-2 w-full cursor-pointer appearance-none rounded-full focus-ring-mint"
                aria-label="مدت اشتراک به ماه"
              />
              <div className="mt-2 flex justify-between text-[10px] text-muted-foreground/50">
                <span className="nums">۱</span>
                <span className="nums">۲۴</span>
              </div>
            </div>

            {/* Plan type — radio cards */}
            <div>
              <p className="mb-3 text-sm font-semibold text-foreground/90">نوع پلن</p>
              <div
                className="grid gap-3 sm:grid-cols-3"
                role="radiogroup"
                aria-label="انتخاب نوع پلن"
              >
                {PLAN_OPTIONS.map((opt) => {
                  const active = plan === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setPlan(opt.id)}
                      className={cn(
                        "touch-target focus-ring-mint relative flex flex-col items-start gap-1 rounded-2xl border p-3.5 text-right transition-all duration-200",
                        active
                          ? "border-mint bg-mint/[0.08] shadow-[0_0_0_1px_var(--mint)]"
                          : "border-border bg-card/40 hover:border-border/80 hover:bg-card/60",
                      )}
                    >
                      {active && (
                        <motion.span
                          layoutId="calc-plan-check"
                          initial={false}
                          className="absolute left-2 top-2 flex size-5 items-center justify-center rounded-full bg-mint text-[#06120c] shadow-[0_0_10px_var(--mint)]"
                        >
                          <Check className="size-3" />
                        </motion.span>
                      )}
                      <span
                        className={cn(
                          "text-sm font-bold",
                          active ? "text-mint" : "text-foreground",
                        )}
                      >
                        {opt.name}
                      </span>
                      <span className="flex items-baseline gap-1">
                        {opt.price === 0 ? (
                          <span className="text-xs font-semibold text-mint">رایگان</span>
                        ) : (
                          <>
                            <span className="nums text-base font-extrabold text-foreground">
                              {opt.priceLabel}
                            </span>
                            <span className="text-[10px] text-muted-foreground/60">
                              هزار تومان / ماه
                            </span>
                          </>
                        )}
                      </span>
                      {opt.badge && (
                        <span className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-mint/15 px-2 py-0.5 text-[9px] font-bold text-mint">
                          <Sparkles className="size-2.5" />
                          {opt.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* RIGHT — Result panel */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.7, ease: easeOut, delay: 0.1 }}
            className="gradient-border-active glow-mint relative flex flex-col justify-between rounded-3xl border border-mint/30 bg-card/50 p-6 sm:p-8"
          >
            <div>
              {/* Big savings label */}
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground/80">
                <TrendingDown className="size-4 text-mint" />
                پس‌انداز سالانه شما
              </div>

              {/* Big animated number */}
              <div className="flex items-baseline gap-2">
                <span className="nums text-4xl font-extrabold text-mint drop-shadow-[0_0_18px_var(--mint)] sm:text-5xl">
                  <AnimatedCounter
                    key={savings}
                    target={savings}
                    suffix=""
                    duration={1.2}
                  />
                </span>
                <span className="text-sm font-semibold text-mint/80">هزار تومان</span>
              </div>

              {/* Breakdown card */}
              <div className="mt-6 rounded-2xl border border-border/40 bg-background/40 p-4">
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-xs text-muted-foreground/60">
                    هزینه سنتی (معلم خصوصی)
                  </span>
                  <span className="nums text-sm font-medium text-muted-foreground/60 line-through decoration-red-400/60">
                    {toPersianGrouped(traditionalCost)}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-xs text-foreground/80">هزینه روال</span>
                  <span className="nums text-sm font-bold text-mint">
                    {toPersianGrouped(revalCost)}
                  </span>
                </div>
                <div className="my-2 flex items-center gap-3">
                  <span className="h-px flex-1 bg-gradient-to-l from-transparent via-border/60 to-transparent" />
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-sm font-semibold text-foreground">صرفه‌جویی شما</span>
                  <span className="nums text-lg font-extrabold text-mint drop-shadow-[0_0_10px_var(--mint)]">
                    {toPersianGrouped(savings)}
                  </span>
                </div>
              </div>

              {/* Perk badges */}
              <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-3">
                {[
                  "بدون قرارداد",
                  "لغو در هر زمان",
                  "پشتیبانی اختصاصی",
                ].map((perk) => (
                  <div
                    key={perk}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-mint/20 bg-mint/[0.05] px-2 py-2 text-center text-[11px] font-medium text-mint/90 sm:text-[11px]"
                  >
                    <Check className="size-3 shrink-0" />
                    <span className="leading-tight">{perk}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA button */}
            <a
              href="#signup"
              className="shine-sweep focus-ring-mint touch-target group/btn mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-mint px-6 py-3.5 text-sm font-bold text-[#06120c] shadow-[0_10px_36px_-8px_var(--mint)] transition-all duration-300 hover:shadow-[0_14px_44px_-6px_var(--mint-bright)] hover:brightness-110 hover:scale-[1.02] sm:w-auto"
            >
              شروع کن
              <ArrowLeft className="size-4 transition-transform duration-300 group-hover/btn:-translate-x-1" />
            </a>
          </motion.div>
        </div>

        {/* Bottom comparison row — 3 cards */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, ease: easeOut, delay: 0.15 }}
          className="mt-8 grid gap-4 sm:grid-cols-3"
        >
          {/* Traditional tutor cost */}
          <div className="surface surface-hover rounded-2xl border border-red-500/20 bg-red-500/[0.04] p-5">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-red-400/80">
              <span className="size-1.5 rounded-full bg-red-400/70" />
              هزینه معلم خصوصی
            </div>
            <div className="nums text-2xl font-extrabold text-foreground/70">
              {toPersianGrouped(traditionalCost)}
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground/60">
              میانگین ۲۵۰ هزار تومان در ماه برای هر دانش‌آموز
            </p>
          </div>

          {/* Reval cost */}
          <div className="surface surface-hover rounded-2xl border border-mint/30 bg-mint/[0.05] p-5">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-mint">
              <span className="size-1.5 rounded-full bg-mint shadow-[0_0_8px_var(--mint)]" />
              هزینه روال
            </div>
            <div className="nums text-2xl font-extrabold text-mint">
              {toPersianGrouped(revalCost)}
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground/60">
              شفاف، بدون هزینه پنهان
            </p>
          </div>

          {/* Savings */}
          <div className="glow-mint surface surface-hover relative overflow-hidden rounded-2xl border border-mint/50 bg-mint/[0.1] p-5">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-mint">
              <TrendingDown className="size-3.5" />
              صرفه‌جویی شما
            </div>
            <div className="nums text-2xl font-extrabold text-mint drop-shadow-[0_0_12px_var(--mint)]">
              {toPersianGrouped(savings)}
            </div>
            <p className="mt-1 text-[11px] text-mint/80">
              هزار تومان پس‌انداز در کل دوره
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
