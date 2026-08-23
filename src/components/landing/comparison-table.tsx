"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Check,
  Minus,
  Sparkles,
  Cpu,
  Users,
  BarChart3,
  Headphones,
  Flame,
  Info,
} from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { ParallaxGrid } from "./parallax-grid";

const easeOut = [0.16, 1, 0.3, 1] as const;

type Row = {
  label: string;
  values: [boolean | string, boolean | string, boolean | string];
  section?: string;
  description?: string;
};

const COMPARISON: Row[] = [
  {
    section: "هسته محصول",
    label: "فهرست کارهای روزانه",
    values: [true, true, true],
    description: "مدیریت و سازماندهی وظایف روزانه دانش‌آموز",
  },
  {
    label: "فلش‌کارت‌های یادگیری",
    values: ["تا ۵۰", "نامحدود", "نامحدود"],
    description: "فلش‌کارت‌ها با تکرار فاصله‌دار برای یادگیری بهتر",
  },
  { label: "آمار هفتگی", values: [true, true, true], description: "گزارش آماری از عملکرد هفتگی" },
  {
    label: "رادار دانش‌آموز",
    values: [false, true, true],
    description: "نمودار راداری برای شناسایی نقاط قوت و ضعف",
  },
  {
    section: "همکاری",
    label: "تیم‌های مشترک",
    values: ["۱ نفر", "تا ۱۰ نفر", "نامحدود"],
    description: "امکان کار تیمی بین مشاور و دانش‌آموزان",
  },
  { label: "نقش‌های چندگانه", values: [false, true, true], description: "تعریف نقش مختلف برای اعضای تیم" },
  {
    label: "گزارش‌های مشترک",
    values: [false, true, true],
    description: "اشتراک‌گذاری گزارش‌ها بین مشاور و دانش‌آموز",
  },
  {
    section: "تحلیل و گزارش",
    label: "نمودارهای انطباق نئونی",
    values: [false, true, true],
    description: "نمودارهای پیشرفته انطباق با منحنی نئونی",
  },
  {
    label: "گزارش‌های سفارشی",
    values: [false, false, true],
    description: "ایجاد گزارش‌های سفارشی بر اساس نیاز سازمان",
  },
  {
    label: "خروجی Excel/PDF",
    values: [false, true, true],
    description: "خروجی‌گیری در قالب‌های مختلف",
  },
  {
    section: "پشتیبانی",
    label: "جامعه کاربران",
    values: [true, true, true],
    description: "دسترسی به جامعه و انجمن کاربران روال",
  },
  {
    label: "پشتیبانی اختصاصی",
    values: [false, true, true],
    description: "پشتیبانی اختصاصی با زمان پاسخگویی تضمین‌شده",
  },
  {
    label: "مدیر حساب اختصاصی",
    values: [false, false, true],
    description: "مدیر حساب اختصاصی برای سازمان‌ها",
  },
  {
    label: "SLA و قرارداد سازمانی",
    values: [false, false, true],
    description: "قرارداد سطح خدمات و امنیت سازمانی",
  },
];

const PLANS = ["دانش‌آموز", "مشاور حرفه‌ای", "سازمانی"];

/* Section icon mapping */
const SECTION_ICONS: Record<string, React.ElementType> = {
  "هسته محصول": Cpu,
  همکاری: Users,
  "تحلیل و گزارش": BarChart3,
  پشتیبانی: Headphones,
};

function CellValue({ value }: { value: boolean | string }) {
  if (typeof value === "boolean") {
    return value ? (
      <span className="mx-auto flex size-6 items-center justify-center rounded-full bg-mint/12 text-mint">
        <Check className="size-3.5" strokeWidth={3} />
      </span>
    ) : (
      <span className="mx-auto flex size-6 items-center justify-center rounded-full bg-muted/20 text-muted-foreground/40">
        <Minus className="size-3.5" />
      </span>
    );
  }
  return (
    <span className="nums text-sm font-semibold text-foreground/90">{value}</span>
  );
}

export function ComparisonTable() {
  return (
    <section id="comparison" className="relative scroll-mt-24 py-20">
      {/* Parallax grid background */}
      <ParallaxGrid strength={60} opacity={0.15} />
      {/* Gradient mesh background */}
      <div className="pointer-events-none absolute inset-0 mesh-grad-bg opacity-40" />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.75, ease: easeOut }}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="mb-5 inline-flex items-center gap-2.5 rounded-full border border-mint/20 bg-mint/[0.08] px-4 py-1.5 text-[11px] font-medium text-mint backdrop-blur-sm">
            <Sparkles className="size-3.5" />
            مقایسه پلن‌ها
          </span>
          <h2 className="text-balance text-3xl font-extrabold leading-[1.2] tracking-tight sm:text-4xl lg:text-5xl">
            کدام پلن برای شما{" "}
            <span className="text-gradient-mint animated-gradient-underline">مناسب است؟</span>
          </h2>
          <p className="mt-5 text-pretty leading-[1.9] text-muted-foreground/80">
            مقایسه شفاف و دقیق تمام امکانات هر پلن در یک جدول.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.8, ease: easeOut }}
          className="mt-14 overflow-hidden rounded-3xl border border-border/60 bg-card/30 backdrop-blur-sm"
        >
          {/* Header row */}
          <div className="grid grid-cols-[1.6fr_1fr_1fr_1fr] items-stretch border-b border-border/60 bg-background/40">
            <div className="px-5 py-5 text-xs font-medium text-muted-foreground/70 sm:px-6 sm:text-sm">
              امکانات
            </div>
            {PLANS.map((p, i) => (
              <div
                key={p}
                className={cn(
                  "relative px-3 py-5 text-center sm:px-4",
                  i === 1 && "bg-mint/[0.06]"
                )}
              >
                {i === 1 && (
                  <span className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-l from-mint-bright to-mint" />
                )}
                <div
                  className={cn(
                    "text-xs font-bold sm:text-sm",
                    i === 1 ? "text-mint animated-gradient-underline" : "text-foreground"
                  )}
                >
                  {p}
                </div>
                {i === 1 && (
                  <div className="mt-1 text-[10px] font-medium text-mint/70">
                    محبوب‌ترین
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Body rows */}
          <div className="divide-y divide-border/40">
            {COMPARISON.map((row, idx) => (
              <React.Fragment key={row.label}>
                {row.section && (
                  <motion.div
                    initial={{ opacity: 0, x: 12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ duration: 0.5, ease: easeOut }}
                    className="relative grid grid-cols-[1.6fr_1fr_1fr_1fr] items-center bg-background/20 px-5 py-2.5 sm:px-6"
                  >
                    {/* Gradient left border for section headers */}
                    <div className="absolute inset-y-0 right-0 w-1 rounded-full bg-gradient-to-b from-mint-bright to-mint/30" />
                    <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-mint/80 animated-gradient-underline">
                      {(() => {
                        const Icon = SECTION_ICONS[row.section!];
                        return Icon ? (
                          <Icon className="size-3.5 text-mint/60" />
                        ) : null;
                      })()}
                      {row.section}
                    </div>
                    <div className="col-span-3" />
                  </motion.div>
                )}
                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-20px" }}
                  transition={{ duration: 0.4, delay: idx * 0.03, ease: easeOut }}
                  className="group/row grid grid-cols-[1.6fr_1fr_1fr_1fr] items-center px-5 py-3.5 transition-colors duration-200 hover:bg-mint/[0.04] sm:px-6"
                >
                  <div className="flex items-center gap-1.5 text-xs text-foreground/85 transition-transform duration-200 group-hover/row:translate-x-1 sm:text-sm">
                    {row.label}
                    {row.description && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="size-3 shrink-0 text-muted-foreground/40 transition-colors hover:text-mint/70" />
                        </TooltipTrigger>
                        <TooltipContent
                          side="top"
                          className="max-w-[200px] text-[11px] leading-relaxed"
                        >
                          {row.description}
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                  {row.values.map((v, i) => (
                    <div
                      key={i}
                      className={cn(
                        "px-3 py-1 text-center transition-colors duration-200 group-hover/row:bg-mint/[0.02] sm:px-4",
                        i === 1 && "bg-mint/[0.04]"
                      )}
                    >
                      <CellValue value={v} />
                    </div>
                  ))}
                </motion.div>
              </React.Fragment>
            ))}
          </div>

          {/* CTA row */}
          <div className="grid grid-cols-[1.6fr_1fr_1fr_1fr] items-center border-t border-border/60 bg-background/40 px-5 py-5 sm:px-6">
            <div className="text-xs text-muted-foreground/70 sm:text-sm">
              شروع کنید
            </div>
            {[
              { label: "شروع رایگان", price: "رایگان" },
              { label: "شروع آزمایشی", price: "۲۴۹ هزار" },
              { label: "تماس با فروش", price: "توافقی" },
            ].map((item, i) => (
              <div
                key={i}
                className={cn(
                  "relative px-3 text-center sm:px-4",
                  i === 1 && "bg-mint/[0.06]"
                )}
              >
                {/* "Most Popular" floating indicator with Flame + pulsing glow */}
                {i === 1 && (
                  <div className="absolute -top-5 right-2 flex items-center gap-1 rounded-full border border-mint/25 bg-mint/10 px-2 py-0.5 text-[9px] font-medium text-mint glow-pulse-mint sm:right-4">
                    <Flame className="size-2.5" />
                    محبوب‌ترین
                  </div>
                )}
                <a
                  href="#signup"
                  className={cn(
                    "shine-sweep inline-flex items-center justify-center rounded-full h-9 px-4 text-xs font-semibold transition-all duration-300",
                    i === 1
                      ? "bg-mint text-[#06120c] shadow-[0_4px_20px_-4px_var(--mint)] hover:brightness-110 hover:scale-105"
                      : "border border-border/60 bg-card/40 text-foreground hover:bg-card/70"
                  )}
                >
                  {item.label}
                  {/* Pulse glow on featured CTA */}
                  {i === 1 && (
                    <motion.span
                      className="absolute inset-0 rounded-full bg-mint/30"
                      animate={{
                        boxShadow: [
                          "0 0 0 0 color-mix(in oklch, var(--mint) 40%, transparent)",
                          "0 0 0 8px color-mix(in oklch, var(--mint) 0%, transparent)",
                        ],
                      }}
                      transition={{
                        duration: 1.6,
                        repeat: Infinity,
                        ease: "easeOut",
                      }}
                    />
                  )}
                </a>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Mobile note */}
        <p className="mt-5 text-center text-[11px] text-muted-foreground/60 sm:hidden">
          برای مشاهده بهتر، صفحه را در حالت افقی بچرخانید.
        </p>
      </div>
    </section>
  );
}
