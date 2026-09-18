"use client";

import * as React from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { Users, BookOpen, UserCheck, Send, ArrowLeft, Clock } from "lucide-react";

// ===== Team section (4-box "final sections" on the main landing page) =====
// Replaces the old inline Team section. The 3 team member cards have been
// moved to the dedicated `TeamPage` component (reached by clicking the
// "داستانِ ما رو بشنو" CTA in Box 1, or the "تیم ما" item in the Header).
//
// 4 boxes in a 2x2 grid (desktop) / single column (mobile):
//   1. Team intro — "ما کی هستیم؟" + CTA "داستانِ ما رو بشنو" → onTeamClick
//   2. Articles — "خوندنی‌های رِوال" + "⏳ به‌زودی منتشر می‌شود" tag
//   3. Choose advisor — "پیدا کردنِ یه مشاورِ مخصوص خودت" + "⏳ در حال توسعه" tag
//   4. Contact + social — "صدای شما رو می‌شنویم!" + CTA "پشتیبانی و راه‌های ارتباطی"
//      → https://t.me/RevalSupport (with Send icon) + Instagram icon
//
// Icons are used here per the user's request (they explicitly asked for
// "دکمه و آیکون‌ها" in Box 4, and icons help distinguish the 4 boxes).
const easeOut = [0.16, 1, 0.3, 1] as const;
const TELEGRAM_HANDLE = process.env.NEXT_PUBLIC_ADVISOR_TELEGRAM_HANDLE || "RevalSupport";
const TELEGRAM_URL = `https://t.me/${TELEGRAM_HANDLE}`;
const INSTAGRAM_HANDLE = "reval_academy_";
const INSTAGRAM_URL = `https://instagram.com/${INSTAGRAM_HANDLE}`;

export function Team({ onTeamClick }: { onTeamClick: () => void }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const reduceMotion = useReducedMotion();

  return (
    <section
      id="team"
      className="relative scroll-mt-16 border-b border-border/50 py-24 sm:py-32"
    >
      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        <motion.div
          ref={ref}
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: reduceMotion ? 0.12 : 0.6, ease: easeOut }}
        >
          <div className="mb-12 max-w-2xl text-right">
            <span className="text-xs font-bold text-mint">بخش‌های نهایی</span>
            <h2 className="mt-3 text-balance text-3xl font-black leading-tight text-foreground sm:text-5xl">
              بیشتر با رِوال آشنا شو
            </h2>
          </div>

          {/* 2x2 grid of boxes (desktop) / single column (mobile) */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6">
            {/* ===== Box 1: Team intro with CTA ===== */}
            <Box
              index={0}
              eyebrow="بچه‌های تیم رِوال"
              icon={<Users className="size-5" strokeWidth={2.2} aria-hidden="true" />}
              title="ما کی هستیم؟"
              body="ما تیمی هستیم که خودمون مسیر سختِ آموزش رو رفتیم و حالا با بررسی مشکلات شما و کمک گرفتن از متخصصین، می‌خوایم یه ابزارِ واقعی و به‌دردبخور برای درس خوندن بسازیم."
            >
              <button
                type="button"
                onClick={onTeamClick}
                className="group inline-flex h-10 items-center gap-1.5 rounded-full bg-mint px-4 text-xs font-semibold text-[#06120c] transition-all hover:brightness-110 hover:scale-[1.02]"
              >
                داستانِ ما رو بشنو
                <ArrowLeft className="size-3.5 flip-rtl transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />
              </button>
            </Box>

            {/* ===== Box 2: Articles (tag: coming soon) ===== */}
            <Box
              index={1}
              eyebrow="مقالات و جستارها"
              icon={<BookOpen className="size-5" strokeWidth={2.2} aria-hidden="true" />}
              title="خوندنی‌های رِوال"
              body="مقاله‌ها و یادداشت‌های خودمونی و کاربردی درباره‌ی روش‌های تمرکز، فرار از کمال‌گرایی و اینکه چطور کمتر حرص بخوریم و بهتر یاد بگیریم."
            >
              <ComingSoonTag text="به‌زودی منتشر می‌شود" />
            </Box>

            {/* ===== Box 3: Choose advisor — CTA to Telegram ===== */}
            <Box
              index={2}
              eyebrow="انتخاب مشاور"
              icon={<UserCheck className="size-5" strokeWidth={2.2} aria-hidden="true" />}
              title="پیدا کردنِ یه مشاورِ مخصوص خودت"
              body="اینجا می‌تونی رزومه‌ی مشاورهای مختلف رو ببینی، نظر بقیه‌ی بچه‌ها رو بخونی و مشاوری رو انتخاب کنی که دقیقا حرفت رو می‌فهمه و باهات جوره."
            >
              <a
                href={TELEGRAM_URL}
                target="_blank"
                rel="noreferrer"
                className="group inline-flex h-10 items-center gap-1.5 rounded-full bg-mint px-4 text-xs font-semibold text-[#06120c] transition-all hover:brightness-110 hover:scale-[1.02]"
              >
                <Send className="size-3.5" aria-hidden="true" />
                ارتباط با مشاور
                <ArrowLeft className="size-3.5 flip-rtl transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />
              </a>
            </Box>

            {/* ===== Box 4: Contact + social ===== */}
            <Box
              index={3}
              eyebrow="ارتباط با ما و شبکه‌های اجتماعی"
              icon={<Send className="size-5" strokeWidth={2.2} aria-hidden="true" />}
              title="صدای شما رو می‌شنویم!"
              body="مشتاقِ شنیدن نظرات، پیشنهادها و دغدغه‌هات هستیم. برای باخبر شدن از آپدیت‌های جدیدِ پلتفرم و خوندنِ نکاتِ کوتاه، توی شبکه‌های اجتماعی کنارمون باش."
            >
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={TELEGRAM_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="group inline-flex h-10 items-center gap-1.5 rounded-full bg-mint px-4 text-xs font-semibold text-[#06120c] transition-all hover:brightness-110 hover:scale-[1.02]"
                >
                  <Send className="size-3.5" aria-hidden="true" />
                  پشتیبانی و راه‌های ارتباطی
                  <ArrowLeft className="size-3.5 flip-rtl transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />
                </a>
                {/* Instagram icon-only button */}
                <a
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="اینستاگرام روال"
                  className="inline-flex size-10 items-center justify-center rounded-full border border-mint/30 bg-transparent text-mint transition-all hover:bg-mint/[0.06] hover:border-mint/60"
                >
                  <InstagramGlyph className="size-4" aria-hidden="true" />
                </a>
              </div>
            </Box>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ===== Reusable Box wrapper =====
// Rounded card with: icon chip, eyebrow, title, body paragraph, and a
// slot for the bottom action (CTA button or "coming soon" tag).
function Box({
  index,
  eyebrow,
  icon,
  title,
  body,
  children,
}: {
  index: number;
  eyebrow: string;
  icon: React.ReactNode;
  title: string;
  body: string;
  children?: React.ReactNode;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      ref={ref}
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{
        duration: reduceMotion ? 0.12 : 0.45,
        delay: reduceMotion ? 0 : index * 0.08,
        ease: easeOut,
      }}
      className="group flex flex-col rounded-2xl border border-border/40 bg-card/20 p-6 transition-colors duration-300 hover:border-mint/30 sm:p-7"
    >
      <div className="flex size-10 items-center justify-center rounded-xl bg-mint/15 text-mint transition-colors group-hover:bg-mint group-hover:text-[#06120c]">
        {icon}
      </div>
      <p className="mt-4 text-xs font-bold text-mint">{eyebrow}</p>
      <h3 className="mt-2 text-base font-black leading-snug text-foreground sm:text-lg">
        {title}
      </h3>
      <p className="mt-2 flex-1 text-sm leading-8 text-muted-foreground">
        {body}
      </p>
      {/* Bottom action slot (CTA button or "coming soon" tag) */}
      <div className="mt-5">{children}</div>
    </motion.div>
  );
}

// ===== "Coming soon" tag (for boxes 2 and 3 that have no live destination yet) =====
function ComingSoonTag({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/30 px-3 py-1.5 text-xs font-medium text-muted-foreground">
      <Clock className="size-3.5" aria-hidden="true" />
      {text}
    </span>
  );
}

// ===== Instagram glyph =====
// Lucide's `Instagram` icon is imported directly at the top of this file
// (for the icon-only button). But since the user wants the Instagram
// "brand" look without a heavy SVG, we use a minimal inline glyph here
// (a rounded-square camera outline — same visual as the Lucide Instagram
// icon, just rendered inline so it stays consistent with the mint accent).
function InstagramGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}
