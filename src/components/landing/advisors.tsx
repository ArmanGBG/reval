"use client";

import * as React from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { Send } from "lucide-react";

// ===== Advisors section (on the main landing page) =====
// Slim section that sits between Features and Team on the main landing
// page. Shows only the advisor intro (eyebrow + H2 + paragraph + 2 CTAs).
//
// The detailed advisor features (image + 4 cards) and the teams &
// institutes sub-section live on a dedicated AdvisorsPage that the user
// reaches by clicking "اطلاعات بیشتر".
//
// CTAs:
//   - "اطلاعات بیشتر" → calls onMoreInfo() to switch the LandingPage view
//     to the dedicated advisors page (separate "page" within the same `/`
//     route, since the sandbox only exposes one route).
//   - "ارتباط با ما" → opens https://t.me/RevalSupport in a new tab
//     (with the Send Lucide icon as the Telegram glyph).
const easeOut = [0.16, 1, 0.3, 1] as const;
const TELEGRAM_HANDLE = process.env.NEXT_PUBLIC_ADVISOR_TELEGRAM_HANDLE || "RevalSupport";
const TELEGRAM_URL = `https://t.me/${TELEGRAM_HANDLE}`;

export function Advisors({ onMoreInfo }: { onMoreInfo: () => void }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const reduceMotion = useReducedMotion();

  return (
    <section
      id="advisors"
      className="relative scroll-mt-16 overflow-hidden border-b border-border/50 py-24 sm:py-32"
    >
      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        <motion.div
          ref={ref}
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: reduceMotion ? 0.12 : 0.6, ease: easeOut }}
          className="mb-12 max-w-2xl text-right"
        >
          {/* H2 — per user's request, just "مشاور تحصیلی" (the previous
              "یه مشاورِ خوب، کارِ خوبش رو می‌کنه" is removed). */}
          <span className="text-xs font-bold text-mint">برای مشاوران</span>
          <h2 className="mt-3 text-balance text-3xl font-black leading-tight text-foreground sm:text-5xl">
            مشاور تحصیلی
          </h2>
          <p className="mt-4 text-sm font-medium leading-8 text-muted-foreground sm:text-base">
            یه مشاورِ خوب نباید بیشترِ وقتش رو صرف محاسبه ساعت‌های مطالعه و نوشتنِ برنامه‌های تکراری بکنه. رِوال این کارهای زمان‌بر رو راحت‌تر و منظم‌تر می‌کنه و تمامِ نمودارها و وضعیتِ دانش‌آموز رو خیلی شفاف بهت نشون می‌ده. اینطوری می‌تونی وقت و انرژیت رو بذاری روی کارِ اصلی: یعنی ارتباط گرفتن با دانش‌آموز و حل کردن گره‌های ذهنیش. ضمناً، با دوره‌های تخصصی ما، می‌تونی مهارت‌های مشاوره‌ات رو حسابی آپدیت کنی.
          </p>

          {/* Two CTAs side-by-side (stack on mobile):
              - "اطلاعات بیشتر" (primary, filled mint) → onMoreInfo
              - "ارتباط با ما" (secondary, outlined with Send icon) → Telegram */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={onMoreInfo}
              className="inline-flex h-11 shrink-0 items-center justify-center rounded-full bg-mint px-5 text-sm font-semibold text-[#06120c] shadow-[0_8px_32px_-8px_var(--mint)] transition-all duration-300 hover:brightness-110 hover:scale-[1.02] focus-ring-mint"
            >
              اطلاعات بیشتر
            </button>
            <a
              href={TELEGRAM_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full border border-mint/40 bg-transparent px-5 text-sm font-semibold text-mint transition-all hover:bg-mint/[0.06] hover:border-mint/60 focus-ring-mint"
            >
              <Send className="size-4" aria-hidden="true" />
              ارتباط با ما
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
