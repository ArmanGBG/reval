"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Plug,
  Calendar,
  MessageSquare,
  Cloud,
  FileText,
  Video,
  Github,
  Figma,
  Send,
  Code,
  Webhook,
  ArrowLeft,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

const easeOut = [0.16, 1, 0.3, 1] as const;

/* ============ Reveal wrapper ============ */
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

/* ============ Integration data ============ */
type Integration = {
  icon: React.ComponentType<{ className?: string }>;
  name: string;
  category: string;
  /** Tailwind bg + text color classes for the icon container */
  iconBg: string;
  iconColor: string;
  connected: boolean;
};

const INTEGRATIONS: Integration[] = [
  {
    icon: Calendar,
    name: "تقویم گوگل",
    category: "تقویم",
    iconBg: "bg-rose-500/20",
    iconColor: "text-rose-400",
    connected: true,
  },
  {
    icon: MessageSquare,
    name: "اسلک",
    category: "پیام‌رسان",
    iconBg: "bg-purple-500/20",
    iconColor: "text-purple-400",
    connected: true,
  },
  {
    icon: Cloud,
    name: "دراپ‌باکس",
    category: "ذخیره‌سازی",
    iconBg: "bg-sky-500/20",
    iconColor: "text-sky-400",
    connected: false,
  },
  {
    icon: FileText,
    name: "نوتشن",
    category: "یادداشت",
    iconBg: "bg-amber-500/20",
    iconColor: "text-amber-400",
    connected: true,
  },
  {
    icon: Video,
    name: "زوم",
    category: "ویدیو کنفرانس",
    iconBg: "bg-blue-500/20",
    iconColor: "text-blue-400",
    connected: false,
  },
  {
    icon: Github,
    name: "گیت‌هاب",
    category: "کدنویسی",
    iconBg: "bg-zinc-500/20",
    iconColor: "text-zinc-300",
    connected: true,
  },
  {
    icon: Figma,
    name: "فigma",
    category: "طراحی",
    iconBg: "bg-pink-500/20",
    iconColor: "text-pink-400",
    connected: false,
  },
  {
    icon: Send,
    name: "تلیگرام",
    category: "پیام‌رسان",
    iconBg: "bg-cyan-500/20",
    iconColor: "text-cyan-400",
    connected: true,
  },
];

const BOTTOM_STATS = [
  {
    icon: Plug,
    text: "بیش از ۲۰",
    label: "یکپارچه‌سازی",
    nums: true,
  },
  {
    icon: Code,
    text: "API عمومی",
    label: "در دسترس عموم",
    nums: false,
  },
  {
    icon: Webhook,
    text: "Webhook",
    label: "پشتیبانی می‌شه",
    nums: false,
  },
] as const;

/* ============ Component ============ */
export function IntegrationsShowcase() {
  return (
    <section
      id="integrations"
      className="scroll-mt-24 relative overflow-hidden py-24 sm:py-32"
    >
      {/* Background decorations */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 dot-pattern opacity-20"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 -top-32 -translate-x-1/2 h-[32rem] w-[32rem] rounded-full bg-mint/[0.05] blur-[140px]"
      />

      <div className="relative z-10 mx-auto max-w-6xl px-6">
        {/* Header */}
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="mb-5 inline-flex items-center gap-2.5 rounded-full border border-mint/20 bg-mint/[0.08] px-4 py-1.5 text-[11px] font-medium text-mint backdrop-blur-sm">
            <Plug className="size-3.5" />
            یکپارچه‌سازی
          </span>
          <h2 className="text-balance text-3xl font-extrabold leading-[1.2] tracking-tight sm:text-4xl lg:text-5xl">
            روال با ابزارهای{" "}
            <span className="text-gradient-mint">محبوب</span> تو کار می‌کنه
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground/70 sm:text-base">
            از تقویم گوگل تا اسلک، روال به‌راحتی با ابزارهایی که هر روز استفاده
            می‌کنی متصل می‌شه
          </p>
        </Reveal>

        {/* Integration grid */}
        <div className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {INTEGRATIONS.map((it, idx) => {
            const Icon = it.icon;
            return (
              <Reveal key={it.name} delay={idx * 0.05}>
                <motion.div
                  whileHover={{ y: -4, scale: 1.03 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className={cn(
                    "group relative flex h-full flex-col items-center gap-3 rounded-2xl p-5 text-center",
                    "surface surface-hover glow-border-hover",
                    "cursor-default"
                  )}
                >
                  {/* Icon container */}
                  <div
                    className={cn(
                      "relative flex size-16 items-center justify-center rounded-2xl",
                      "border border-white/10",
                      it.iconBg
                    )}
                  >
                    {/* subtle top highlight */}
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-x-3 top-1 h-1/3 rounded-full bg-white/10 blur-[2px]"
                    />
                    <Icon className={cn("size-7", it.iconColor)} />
                  </div>

                  {/* Name */}
                  <h3 className="text-sm font-semibold leading-snug">
                    {it.name}
                  </h3>

                  {/* Category */}
                  <p className="text-xs text-muted-foreground/60">
                    {it.category}
                  </p>

                  {/* Status badge */}
                  <span
                    className={cn(
                      "mt-auto inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium",
                      it.connected
                        ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                        : "border border-white/10 bg-white/[0.04] text-muted-foreground/70"
                    )}
                  >
                    {it.connected ? (
                      <>
                        <span className="relative flex size-1.5">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                          <span className="relative inline-flex size-1.5 rounded-full bg-emerald-400" />
                        </span>
                        متصل
                      </>
                    ) : (
                      "در دسترس"
                    )}
                  </span>
                </motion.div>
              </Reveal>
            );
          })}
        </div>

        {/* Bottom stats row */}
        <Reveal delay={0.15}>
          <div className="mt-14 grid grid-cols-1 gap-4 rounded-2xl border border-white/[0.06] bg-surface/60 p-6 backdrop-blur-md sm:grid-cols-3 sm:p-8">
            {BOTTOM_STATS.map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{
                    duration: 0.6,
                    ease: easeOut,
                    delay: 0.15 + idx * 0.08,
                  }}
                  className={cn(
                    "flex items-center gap-4 rounded-xl p-3",
                    idx !== 0 && "sm:border-r sm:border-white/[0.06] sm:pr-6"
                  )}
                >
                  {/* mint-bordered icon box */}
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-mint/25 bg-mint/[0.06]">
                    <Icon className="size-5 text-mint" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-base font-bold leading-snug">
                      {stat.nums ? (
                        <span className="nums">{stat.text}</span>
                      ) : (
                        stat.text
                      )}
                    </span>
                    <span className="text-xs text-muted-foreground/60">
                      {stat.label}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </Reveal>

        {/* CTA row */}
        <Reveal delay={0.25}>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 text-center sm:flex-row sm:gap-6">
            <p className="text-sm text-muted-foreground/80 sm:text-base">
              می‌خوای یکپارچه‌سازی اختصاصی بسازی؟
            </p>
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              className={cn(
                "group inline-flex items-center gap-2 rounded-xl border border-white/10 bg-transparent px-5 py-2.5 text-sm font-semibold",
                "transition-all duration-300",
                "hover:border-mint/40 hover:bg-mint/[0.06] hover:text-mint",
                "focus-ring-mint touch-target"
              )}
            >
              مستندات API
              <ArrowLeft className="size-4 transition-transform duration-300 group-hover:-translate-x-1" />
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
