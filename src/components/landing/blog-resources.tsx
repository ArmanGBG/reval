"use client";

import * as React from "react";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Clock,
  ArrowLeft,
  BookOpen,
  Brain,
  TrendingUp,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ParallaxGrid } from "./parallax-grid";

const easeOut = [0.16, 1, 0.3, 1] as const;

/* ============ Data ============ */
const CATEGORIES = [
  "همه",
  "یادگیری",
  "تمرکز",
  "کنکور",
  "روان‌شناسی",
  "تکنولوژی آموزشی",
] as const;

type Category = (typeof CATEGORIES)[number];

type Article = {
  category: string;
  title: string;
  excerpt: string;
  author: string;
  date: string;
  readingTime: string;
  icon: React.ComponentType<{ className?: string }>;
};

const ARTICLES: Article[] = [
  {
    category: "یادگیری",
    title: "۵ تکنیک طلایی برای یادگیری عمیق",
    excerpt:
      "با این روش‌های اثبات‌شده، یادگیری رو از سطحی به عمیق تبدیل کن و در ذهنت حک کن...",
    author: "دکتر مریم احمدی",
    date: "۱۵ مرداد ۱۴۰۳",
    readingTime: "۸ دقیقه",
    icon: Brain,
  },
  {
    category: "تمرکز",
    title: "چطور در دنیای پر حواس‌پرتی تمرکز کنیم؟",
    excerpt:
      "تمرکز عمیق مهارت قرن بیست‌ویکم است. روش‌های عملی برای بازپس‌گیری توجه...",
    author: "علی رضایی",
    date: "۱۰ مرداد ۱۴۰۳",
    readingTime: "۱۲ دقیقه",
    icon: BookOpen,
  },
  {
    category: "کنکور",
    title: "برنامه‌ریزی ۹۰ روزه تا کنکور",
    excerpt:
      "یک نقشه راه دقیق و قابل اجرا برای ۹۰ روز پایانی قبل از کنکور...",
    author: "پشتیبانی روال",
    date: "۵ مرداد ۱۴۰۳",
    readingTime: "۱۵ دقیقه",
    icon: TrendingUp,
  },
];

/* ============ Helpers ============ */
function getInitials(name: string): string {
  const cleaned = name.replace(/^دکتر\s+/, "");
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "؟";
  if (parts.length === 1) return parts[0].charAt(0);
  return parts[0].charAt(0) + parts[1].charAt(0);
}

/* ============ Component ============ */
export function BlogResources() {
  const [activeCategory, setActiveCategory] = useState<Category>("همه");

  return (
    <section id="blog" className="relative scroll-mt-24 py-20 sm:py-28">
      {/* Background decorations */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-20 right-0 size-[420px] rounded-full bg-mint/[0.05] blur-[150px]"
      />
      <ParallaxGrid strength={40} opacity={0.1} />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: easeOut }}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="mb-5 inline-flex items-center gap-2.5 rounded-full border border-mint/20 bg-mint/[0.08] px-4 py-1.5 text-[11px] font-medium text-mint backdrop-blur-sm">
            <BookOpen className="size-3.5" />
            بلاگ و منابع
          </span>
          <h2 className="text-balance text-3xl font-extrabold leading-[1.2] tracking-tight sm:text-4xl lg:text-5xl">
            یاد بگیر، <span className="text-gradient-mint">رشد کن</span>
          </h2>
          <p className="mt-5 text-pretty leading-[1.9] text-muted-foreground/80">
            مقالات منتخب درباره یادگیری، تمرکز و کنکور
          </p>
        </motion.div>

        {/* Category filter chips */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: easeOut, delay: 0.1 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-2"
        >
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                aria-pressed={isActive}
                className={cn(
                  "touch-target focus-ring-mint rounded-full border px-4 py-1.5 text-xs font-medium transition-all duration-300",
                  isActive
                    ? "border-mint/50 bg-mint/[0.12] text-mint shadow-[0_0_18px_-4px_var(--mint)]"
                    : "border-white/[0.08] bg-white/[0.02] text-muted-foreground/80 hover:border-mint/25 hover:text-mint"
                )}
              >
                {cat}
              </button>
            );
          })}
        </motion.div>

        {/* Articles grid */}
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {ARTICLES.map((article, idx) => {
            const Icon = article.icon;
            return (
              <motion.article
                key={article.title}
                initial={{ opacity: 0, y: 32, scale: 0.97 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.7, ease: easeOut, delay: idx * 0.12 }}
                whileHover={{ y: -6, scale: 1.02 }}
                className={cn(
                  "group relative flex flex-col overflow-hidden rounded-2xl",
                  "surface surface-hover glow-border-hover"
                )}
              >
                {/* Header image placeholder */}
                <div className="relative h-44 overflow-hidden border-b border-white/[0.05]">
                  <div className="absolute inset-0 bg-gradient-to-br from-mint/10 via-mint/5 to-transparent" />
                  <div className="dot-pattern absolute inset-0 opacity-60" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex size-14 items-center justify-center rounded-2xl border border-mint/20 bg-mint/[0.06] text-mint backdrop-blur-sm transition-transform duration-500 group-hover:scale-110">
                      <Icon className="size-7" />
                    </div>
                  </div>

                  {/* Category badge (top-right) */}
                  <span className="absolute right-3 top-3 rounded-full border border-mint/30 bg-background/70 px-2.5 py-1 text-[10px] font-medium text-mint backdrop-blur-md">
                    {article.category}
                  </span>

                  {/* Reading time badge (top-left) */}
                  <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full border border-white/10 bg-background/70 px-2.5 py-1 text-[10px] font-medium text-muted-foreground backdrop-blur-md">
                    <Clock className="size-3" />
                    <span className="nums">{article.readingTime}</span>
                  </span>
                </div>

                {/* Body */}
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="text-base font-bold leading-[1.6] tracking-tight">
                    {article.title}
                  </h3>
                  <p className="mt-2 line-clamp-2 text-sm leading-[1.8] text-muted-foreground/70">
                    {article.excerpt}
                  </p>

                  {/* Author row */}
                  <div className="mt-5 flex items-center gap-2.5">
                    <div className="flex size-8 items-center justify-center rounded-full bg-mint/[0.12] text-[11px] font-bold text-mint">
                      {getInitials(article.author)}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold leading-tight">
                        {article.author}
                      </span>
                      <span className="mt-0.5 inline-flex items-center gap-1 text-[10px] text-muted-foreground/60">
                        <Calendar className="size-2.5" />
                        <span className="nums">{article.date}</span>
                      </span>
                    </div>
                  </div>

                  {/* Read more link */}
                  <div className="mt-5 border-t border-white/[0.05] pt-4">
                    <a
                      href="#blog"
                      className="group/link focus-ring-mint touch-target inline-flex items-center gap-1.5 text-xs font-semibold text-mint transition-colors hover:text-mint-bright"
                    >
                      ادامه مطلب
                      <ArrowLeft className="size-3.5 transition-transform duration-300 group-hover/link:-translate-x-1" />
                    </a>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: easeOut, delay: 0.2 }}
          className="mt-14 flex flex-col items-center gap-5"
        >
          <a
            href="#blog"
            className="shine-sweep focus-ring-mint touch-target group/cta inline-flex items-center gap-2 rounded-full bg-mint px-6 py-3 text-sm font-bold text-background shadow-[0_10px_30px_-10px_var(--mint)] transition-all duration-300 hover:shadow-[0_14px_40px_-10px_var(--mint)]"
          >
            مشاهده همه مقالات
            <ArrowLeft className="size-4 transition-transform duration-300 group-hover/cta:-translate-x-1" />
          </a>
          <div className="inline-flex items-center gap-2 text-xs text-muted-foreground/70">
            <span className="size-1.5 rounded-full bg-mint shadow-[0_0_8px_var(--mint)]" />
            بیش از <span className="nums">۲۰۰</span> مقاله تخصصی
          </div>
        </motion.div>
      </div>
    </section>
  );
}
