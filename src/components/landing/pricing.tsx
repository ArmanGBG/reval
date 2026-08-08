"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Sparkles, Zap, ChevronDown, TrendingDown } from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useConfettiOnClick } from "./use-confetti";

const easeOut = [0.16, 1, 0.3, 1] as const;

type BillingCycle = "monthly" | "yearly";

interface Plan {
  name: string;
  desc: string;
  monthlyPrice: string;
  yearlyPrice: string;
  period: string;
  yearlyPeriod: string;
  features: string[];
  featureBadges?: Record<number, "new" | "popular">;
  cta: string;
  featured: boolean;
  isFree: boolean;
  isCustom: boolean;
  yearlySavings?: string;
}

const PLANS: Plan[] = [
  {
    name: "دانش‌آموز",
    desc: "برای شروع تمرکز عمیق",
    monthlyPrice: "رایگان",
    yearlyPrice: "رایگان",
    period: "",
    yearlyPeriod: "",
    features: [
      "فهرست کارهای روزانه",
      "تا ۵۰ فلش‌کارت",
      "آمار هفتگی",
      "پشتیبانی جامعه کاربران",
    ],
    cta: "شروع رایگان",
    featured: false,
    isFree: true,
    isCustom: false,
  },
  {
    name: "مشاور حرفه‌ای",
    desc: "برای مشاوران حرفه‌ای",
    monthlyPrice: "۲۴۹",
    yearlyPrice: "۱۹۹",
    period: "هزار تومان / ماه",
    yearlyPeriod: "هزار تومان / ماه",
    features: [
      "رادار دانش‌آموز بی‌نهایت",
      "سازنده برنامه با درگ اند دراپ",
      "تحلیل داده و نمودارهای انطباق",
      "تیم‌های تا ۱۰ نفره",
      "پشتیبانی اختصاصی",
    ],
    featureBadges: { 0: "popular", 1: "new" },
    cta: "شروع آزمایشی",
    featured: true,
    isFree: false,
    isCustom: false,
    yearlySavings: "۲۰٪",
  },
  {
    name: "سازمانی",
    desc: "برای موسسات بزرگ",
    monthlyPrice: "توافقی",
    yearlyPrice: "توافقی",
    period: "",
    yearlyPeriod: "",
    features: [
      "کاربران نامحدود",
      "اتصال به شبکه امن روال",
      "گزارش‌های سفارشی",
      "مدیر حساب اختصاصی",
      "SLA و امنیت سازمانی",
    ],
    featureBadges: { 2: "new" },
    cta: "تماس با فروش",
    featured: false,
    isFree: false,
    isCustom: true,
  },
];

function BillingToggle({
  billing,
  onToggle,
}: {
  billing: BillingCycle;
  onToggle: () => void;
}) {
  const [isAnimating, setIsAnimating] = React.useState(false);

  const handleToggle = () => {
    setIsAnimating(true);
    onToggle();
    setTimeout(() => setIsAnimating(false), 400);
  };

  return (
    <div className="flex items-center justify-center gap-4">
      <div
        className="relative flex items-center rounded-full border border-border/50 bg-card/40 p-1"
        role="radiogroup"
        aria-label="نوع صورتحساب"
      >
        {/* Sliding indicator with spring bounce */}
        <motion.div
          className="absolute top-1 bottom-1 rounded-full bg-mint/15 border border-mint/25"
          layoutId="billing-indicator"
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 25,
            mass: 0.8,
          }}
          style={{
            width: "calc(50% - 4px)",
            left: billing === "monthly" ? "4px" : "calc(50% + 0px)",
          }}
        />
        <button
          role="radio"
          aria-checked={billing === "monthly"}
          onClick={billing === "yearly" ? handleToggle : undefined}
          className={cn(
            "relative z-10 rounded-full px-5 py-2 text-sm font-medium transition-colors duration-200",
            billing === "monthly"
              ? "text-mint"
              : "text-muted-foreground/70 hover:text-foreground"
          )}
        >
          ماهانه
        </button>
        <button
          role="radio"
          aria-checked={billing === "yearly"}
          onClick={billing === "monthly" ? handleToggle : undefined}
          className={cn(
            "relative z-10 rounded-full px-5 py-2 text-sm font-medium transition-colors duration-200",
            billing === "yearly"
              ? "text-mint"
              : "text-muted-foreground/70 hover:text-foreground"
          )}
        >
          سالانه
        </button>
      </div>

      {/* Savings badge with spring animation */}
      <AnimatePresence>
        {billing === "yearly" && (
          <motion.span
            initial={{ opacity: 0, scale: 0.6, x: -12 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.6, x: -12 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 15,
              mass: 0.6,
            }}
            className="inline-flex items-center gap-1.5 rounded-full border border-mint/30 bg-mint/[0.08] px-3 py-1 text-[11px] font-semibold text-mint"
          >
            <Sparkles className="size-3" />
            ذخیره ۲۰٪
          </motion.span>
        )}
      </AnimatePresence>

      {/* Spring bounce indicator */}
      {isAnimating && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: [0.8, 1.15, 1], opacity: [0, 1, 0] }}
          transition={{ duration: 0.4, ease: easeOut }}
          className="absolute size-2 rounded-full bg-mint"
        />
      )}
    </div>
  );
}

function PriceDisplay({
  plan,
  billing,
}: {
  plan: Plan;
  billing: BillingCycle;
}) {
  const price = billing === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;
  const period = billing === "yearly" ? plan.yearlyPeriod : plan.period;

  return (
    <div className="mt-6 flex items-baseline gap-2">
      <span
        className={cn(
          "nums text-4xl font-extrabold",
          plan.featured
            ? "text-mint drop-shadow-[0_0_12px_var(--mint)]"
            : "text-foreground"
        )}
      >
        {/* AnimatePresence for smooth price number transition */}
        <AnimatePresence mode="wait">
          <motion.span
            key={`${plan.name}-${price}`}
            initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -12, filter: "blur(4px)" }}
            transition={{ duration: 0.3, ease: easeOut }}
            className="inline-block"
          >
            {price}
          </motion.span>
        </AnimatePresence>
      </span>
      {period && (
        <span className="text-xs text-muted-foreground/70">{period}</span>
      )}
    </div>
  );
}

/** Mini savings comparison chart */
function SavingsChart({ billing }: { billing: BillingCycle }) {
  if (billing !== "yearly") return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.4, ease: easeOut }}
      className="mt-6 overflow-hidden rounded-xl border border-border/30 bg-card/20 p-4"
    >
      <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold text-mint/80">
        <TrendingDown className="size-3.5" />
        مقایسه ماهانه و سالانه
      </div>
      <div className="flex items-end justify-center gap-6">
        {/* Monthly bar */}
        <div className="flex flex-col items-center gap-1.5">
          <span className="nums text-[10px] text-muted-foreground/60">۲۴۹</span>
          <div className="mini-bar w-8 bg-muted/40" style={{ height: "56px" }} />
          <span className="text-[9px] text-muted-foreground/50">ماهانه</span>
        </div>
        {/* Yearly bar */}
        <div className="flex flex-col items-center gap-1.5">
          <span className="nums text-[10px] font-semibold text-mint">۱۹۹</span>
          <div
            className="mini-bar w-8 bg-gradient-to-t from-mint/60 to-mint-bright/60"
            style={{ height: "44px" }}
          />
          <span className="text-[9px] text-mint/70">سالانه</span>
        </div>
      </div>
      <div className="mt-3 text-center text-[10px] text-muted-foreground/50">
        ذخیره ۶۰۰ هزار تومان در سال
      </div>
    </motion.div>
  );
}

export function Pricing() {
  const [billing, setBilling] = React.useState<BillingCycle>("monthly");
  const [expandedPlan, setExpandedPlan] = React.useState<string | null>(null);
  const onConfetti = useConfettiOnClick(60);

  return (
    <section id="pricing" className="relative scroll-mt-24 py-28 sm:py-36">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/3 h-[44rem] w-[44rem] -translate-x-1/2 rounded-full bg-mint/[0.07] blur-[160px]" />
      </div>
      {/* Dot pattern subtle bg */}
      <div className="pointer-events-none absolute inset-0 dot-pattern opacity-20" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.75, ease: easeOut }}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="mb-5 inline-flex items-center gap-2.5 rounded-full border border-mint/20 bg-mint/[0.08] px-4 py-1.5 text-[11px] font-medium text-mint backdrop-blur-sm">
            <span className="size-1.5 rounded-full bg-mint shadow-[0_0_8px_var(--mint)]" />
            قیمت محصولات
          </span>
          <h2 className="text-balance text-3xl font-extrabold leading-[1.2] tracking-tight sm:text-4xl lg:text-5xl">
            قیمتی ساده، متناسب با{" "}
            <span className="text-gradient-mint animated-gradient-underline">رشد شما</span>
          </h2>
          <p className="mt-5 text-pretty leading-[1.9] text-muted-foreground/80">
            بدون هزینه مخفی. هر زمان خواستید ارتقا دهید یا لغو کنید.
          </p>
        </motion.div>

        {/* Billing toggle */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5, ease: easeOut, delay: 0.1 }}
          className="mt-10"
        >
          <BillingToggle
            billing={billing}
            onToggle={() =>
              setBilling((b) => (b === "monthly" ? "yearly" : "monthly"))
            }
          />
        </motion.div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3 lg:gap-8">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.75, ease: easeOut, delay: i * 0.12 }}
              whileHover={plan.featured ? { y: -8, scale: 1.02 } : { y: -4 }}
              className={cn(
                "relative flex h-full flex-col rounded-3xl p-8 transition-all duration-300",
                plan.featured
                  ? "border-shimmer glow-mint corner-sparkle mesh-grad-bg lg:scale-105 lg:py-10"
                  : "glow-border-hover corner-sparkle border border-border/60 bg-card/40 hover:border-border/90 hover:bg-card/60"
              )}
            >
              {plan.featured && (
                <span className="absolute -top-3.5 right-8 inline-flex items-center gap-1.5 rounded-full bg-mint px-3.5 py-1.5 text-[11px] font-semibold text-[#06120c] shadow-[0_4px_16px_-4px_var(--mint)] glow-pulse-mint">
                  <Sparkles className="size-3.5" />
                  محبوب‌ترین
                </span>
              )}
              <h3 className="text-lg font-extrabold">{plan.name}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground/80">
                {plan.desc}
              </p>
              <PriceDisplay plan={plan} billing={billing} />

              {/* Savings mini chart (only for featured plan) */}
              {plan.featured && (
                <AnimatePresence>
                  <SavingsChart billing={billing} />
                </AnimatePresence>
              )}

              <ul className="mt-7 flex-1 space-y-3.5">
                {plan.features.map((feat, featIdx) => (
                  <li key={feat} className="flex items-start gap-3 text-sm">
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-mint/10">
                      <Check className="size-3 text-mint" />
                    </span>
                    <span className="flex-1 text-foreground/85">{feat}</span>
                    {/* Tooltip badges on features */}
                    {plan.featureBadges?.[featIdx] && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span
                            className={cn(
                              "shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold",
                              plan.featureBadges[featIdx] === "new"
                                ? "tooltip-badge-new"
                                : "tooltip-badge-popular"
                            )}
                          >
                            {plan.featureBadges[featIdx] === "new" ? "جدید" : "محبوب"}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          {plan.featureBadges[featIdx] === "new"
                            ? "این امکان تازه اضافه شده است"
                            : "پرکاربردترین امکان روال"}
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </li>
                ))}
              </ul>

              {/* Expandable "What's included" section */}
              <button
                onClick={() =>
                  setExpandedPlan(expandedPlan === plan.name ? null : plan.name)
                }
                className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground/60 transition-colors hover:text-mint/80"
              >
                <motion.span
                  animate={{ rotate: expandedPlan === plan.name ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ChevronDown className="size-3.5" />
                </motion.span>
                جزئیات بیشتر
              </button>
              <AnimatePresence>
                {expandedPlan === plan.name && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: easeOut }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 space-y-2 border-t border-border/30 pt-3">
                      {plan.features.map((feat) => (
                        <div
                          key={`detail-${feat}`}
                          className="flex items-center gap-2 text-[11px] text-muted-foreground/50"
                        >
                          <span className="size-1 rounded-full bg-mint/30" />
                          {feat}
                        </div>
                      ))}
                      {!plan.isFree && (
                        <div className="mt-2 text-[10px] text-muted-foreground/40">
                          ✓ امکان لغو در هر زمان
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <a
                href="#signup"
                onClick={onConfetti}
                className={cn(
                  "mt-8 shine-sweep inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold transition-all duration-300",
                  plan.featured
                    ? "bg-mint text-[#06120c] shadow-[0_10px_36px_-8px_var(--mint)] hover:shadow-[0_14px_44px_-6px_var(--mint-bright)] hover:brightness-110 hover:scale-[1.02]"
                    : "border border-border/60 bg-card/50 text-foreground hover:bg-card/80 hover:border-border"
                )}
              >
                {plan.featured && <Zap className="size-4" />}
                {plan.cta}
              </a>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
