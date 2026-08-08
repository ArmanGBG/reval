"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  HelpCircle,
  MessageCircleQuestion,
  Search,
  X,
  Lightbulb,
  Mail,
} from "lucide-react";
import { cn } from "@/lib/utils";

const easeOut = [0.16, 1, 0.3, 1] as const;

/** Spring configs for organic accordion motion */
const springExpand = { type: "spring" as const, stiffness: 200, damping: 22 };
const springBounce = { type: "spring" as const, stiffness: 300, damping: 15 };
const springGentle = { type: "spring" as const, stiffness: 170, damping: 20 };

/** Persian digits for numbering */
const PERSIAN_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
function toPersianNum(n: number): string {
  return String(n).replace(/\d/g, (d) => PERSIAN_DIGITS[Number(d)]);
}

const FAQS = [
  {
    q: "آیا روال برای دانش‌آموزان کنکور مناسب است؟",
    a: "بله. روال مخصوص دانش‌آموزان کنکوری طراحی شده است. سیستم تمرکز عمیق، فلش‌کارت‌های تکرار فاصله‌دار و گزارش‌های هفتگی به شما کمک می‌کند تا در مسیر کنکور پیشرفت قابل‌سنجش و پایدار داشته باشید.",
  },
  {
    q: "آیا می‌توانم برنامه مشاور را با میز کار دانش‌آموز همگام کنم؟",
    a: "بله. هر تغییری که مشاور در سازنده برنامه هفتگی ایجاد می‌کند، به‌صورت آنی در میز کار دانش‌آموز ظاهر می‌شود. این همگام‌سازی دوطرفه است و گزارش‌های پیشرفت نیز به مشاور منتقل می‌شوند.",
  },
  {
    q: "آیا داده‌های من امن هستند؟",
    a: "رمزگذاری سرتاسری (end-to-end)، سرورهای ایرانی و رعایت کامل سیاست حریم خصوصی. ما هیچ‌گاه داده‌های شما را به شخص ثالثی نمی‌فروشیم. شما هر زمان بخواهید می‌توانید حساب خود را حذف کنید و تمام داده‌هایتان پاک خواهد شد.",
  },
  {
    q: "اگر از پلن رایگان فراتر بروم چه می‌شود؟",
    a: "هنگامی که به محدودیت پلن رایگان (مثلاً ۵۰ فلش‌کارت) برسید، روال به شما اطلاع می‌دهد و می‌توانید به سادگی به پلن حرفه‌ای ارتقا دهید. داده‌های فعلی شما کاملاً حفظ می‌شوند.",
  },
  {
    q: "آیا نسخه موبایل وجود دارد؟",
    a: "روال یک اپلیکیشن وب پیشرفته (PWA) است که در همه دستگاه‌ها به‌صورت واکنش‌گرا کار می‌کند. می‌توانید آن را به صفحه خانه موبایل خود اضافه کنید تا تجربه‌ای شبیه اپلیکیشن بومی داشته باشید.",
  },
  {
    q: "آیا تخفیف دانش‌آموزی ارائه می‌دهیم؟",
    a: "بله. برای دانش‌آموزان کنکوری که توان پرداخت کامل ندارند، تخفیف‌های ویژه‌ای در نظر گرفته شده است. برای دریافت کد تخفیف، با پشتیبانی از طریق فرم تماس در ارتباط باشید.",
  },
];

/** "Did you know?" tips */
const TIPS = [
  "تحقیقات نشان می‌دهد تکرار فاصله‌دار می‌تواند یادگیری را تا ۲۰۰٪ افزایش دهد.",
  "دانش‌آموزانی که از برنامه‌ریزی روزانه استفاده می‌کنند، ۴۰٪ بیشتر به اهداف خود می‌رسند.",
  "روال بیش از ۱۲,۰۰۰ فلش‌کارت تولیدشده توسط مشاوران را در اختیار دارد.",
];

/** Get preview text (first 40 chars + ellipsis) */
function getPreview(text: string, maxLen = 40): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen) + "...";
}

function FaqItem({
  q,
  a,
  index,
  isOpen,
  onToggle,
  isHovered,
}: {
  q: string;
  a: string;
  index: number;
  isOpen: boolean;
  onToggle: () => void;
  isHovered: boolean;
}) {
  const persianIndex = toPersianNum(index + 1).padStart(2, "۰");

  return (
    <div
      className={cn(
        "surface rounded-2xl transition-all duration-300",
        isOpen
          ? "glow-mint border-mint/30 gradient-border-active"
          : "hover:border-border/80"
      )}
    >
      <button
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-right"
      >
        <span className="flex-1 flex items-start gap-3">
          {/* Numbered indicator with mint color badge */}
          <span
            className={cn(
              "shrink-0 mt-0.5 flex size-7 items-center justify-center rounded-lg text-[11px] font-bold transition-all duration-300",
              isOpen
                ? "bg-mint/20 text-mint glow-pulse-mint"
                : "bg-mint/[0.08] text-mint/70"
            )}
          >
            <span className="nums">{persianIndex}</span>
          </span>
          <span className="flex-1">
            <span className="text-base font-semibold text-foreground sm:text-lg">
              {q}
            </span>
            {/* Hover preview when not open */}
            <AnimatePresence>
              {isHovered && !isOpen && (
                <motion.span
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2, ease: easeOut }}
                  className="block overflow-hidden text-xs leading-relaxed text-muted-foreground/50 mt-1"
                >
                  {getPreview(a)}
                </motion.span>
              )}
            </AnimatePresence>
          </span>
        </span>
        <motion.span
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={springBounce}
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-full border transition-colors duration-300",
            isOpen
              ? "border-mint/40 bg-mint/10 text-mint"
              : "border-border/50 text-muted-foreground"
          )}
        >
          <Plus className="size-4" strokeWidth={2.5} />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={springExpand}
            className="overflow-hidden"
          >
            <div className="px-6 pb-5 pr-[3.25rem]">
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...springGentle, delay: 0.08 }}
                className="text-sm leading-[1.95] text-muted-foreground/85 sm:text-[0.95rem]"
              >
                {a}
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function FaqSection() {
  const [openIdx, setOpenIdx] = React.useState<number | null>(0);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [hoveredIdx, setHoveredIdx] = React.useState<number | null>(null);
  const [currentTip, setCurrentTip] = React.useState(0);

  // Rotate tips
  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % TIPS.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  // Magnetic glow cursor tracking
  const searchRef = React.useRef<HTMLDivElement>(null);
  const handleSearchMouseMove = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!searchRef.current) return;
      const rect = searchRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      searchRef.current.style.setProperty("--glow-x", `${x}%`);
      searchRef.current.style.setProperty("--glow-y", `${y}%`);
    },
    []
  );

  const filteredFaqs = React.useMemo(() => {
    if (!searchQuery.trim()) return FAQS.map((f, i) => ({ ...f, originalIndex: i }));
    const q = searchQuery.trim().toLowerCase();
    return FAQS.map((f, i) => ({ ...f, originalIndex: i })).filter((f) =>
      f.q.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const hasResults = filteredFaqs.length > 0;

  return (
    <section id="faq" className="relative scroll-mt-24 py-28 sm:py-36">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/4 h-[40rem] w-[40rem] -translate-x-1/2 rounded-full bg-mint/[0.05] blur-[150px]" />
      </div>
      {/* Dot pattern subtle bg */}
      <div className="pointer-events-none absolute inset-0 dot-pattern opacity-30" />

      <div className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.75, ease: easeOut }}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="mb-5 inline-flex items-center gap-2.5 rounded-full border border-mint/20 bg-mint/[0.08] px-4 py-1.5 text-[11px] font-medium text-mint backdrop-blur-sm">
            <MessageCircleQuestion className="size-3.5" />
            سوالات متداول
          </span>
          <h2 className="text-balance text-3xl font-extrabold leading-[1.2] tracking-tight sm:text-4xl lg:text-5xl">
            هر چه باید بدانید،{" "}
            <span className="text-gradient-mint animated-gradient-underline">در یک نگاه</span>
          </h2>
          <p className="mt-5 text-pretty leading-[1.9] text-muted-foreground/80">
            پاسخ شفاف به رایج‌ترین پرسش‌های کاربران. اگر سوال دیگری دارید، با
            پشتیبانی ما در ارتباط باشید.
          </p>
        </motion.div>

        {/* Search / Filter Input with magnetic glow */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5, ease: easeOut, delay: 0.1 }}
          className="mx-auto mt-8 max-w-lg"
        >
          <div
            ref={searchRef}
            onMouseMove={handleSearchMouseMove}
            className="magnetic-glow glass rounded-xl transition-all duration-300 focus-within:shadow-[0_0_0_1px_color-mix(in_oklch,var(--mint)_30%,transparent),0_0_20px_-4px_color-mix(in_oklch,var(--mint)_25%,transparent)]"
          >
            <div className="flex items-center gap-3 px-4 py-3">
              <Search className="size-4 shrink-0 text-muted-foreground/50 transition-colors duration-300 group-focus-within:text-mint" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجو در سوالات..."
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 outline-none"
              />
              <AnimatePresence>
                {searchQuery && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    transition={springBounce}
                    onClick={() => setSearchQuery("")}
                    className="flex size-5 items-center justify-center rounded-full bg-muted-foreground/15 text-muted-foreground/60 hover:bg-muted-foreground/25 hover:text-foreground transition-colors"
                  >
                    <X className="size-3" />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* FAQ Items with AnimatePresence for filter */}
        <div className="mt-10 space-y-3.5">
          <AnimatePresence mode="popLayout">
            {hasResults ? (
              filteredFaqs.map((f, i) => (
                <motion.div
                  key={f.q}
                  layout
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  transition={{ ...springGentle, delay: i * 0.04 }}
                >
                  <div
                    onMouseEnter={() => setHoveredIdx(f.originalIndex)}
                    onMouseLeave={() => setHoveredIdx(null)}
                  >
                    <FaqItem
                      q={f.q}
                      a={f.a}
                      index={f.originalIndex}
                      isOpen={openIdx === f.originalIndex}
                      onToggle={() =>
                        setOpenIdx(openIdx === f.originalIndex ? null : f.originalIndex)
                      }
                      isHovered={hoveredIdx === f.originalIndex}
                    />
                  </div>
                </motion.div>
              ))
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={springGentle}
                className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border/30 bg-card/20 py-14 text-center"
              >
                <div className="flex size-12 items-center justify-center rounded-full bg-mint/[0.06]">
                  <Search className="size-5 text-mint/50" />
                </div>
                <p className="text-sm font-medium text-muted-foreground/70">
                  نتیجه‌ای یافت نشد
                </p>
                <p className="text-xs text-muted-foreground/40">
                  عبارت دیگری را جستجو کنید
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* "Did you know?" tip card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.6, ease: easeOut, delay: 0.2 }}
          className="mt-10 overflow-hidden rounded-2xl border border-mint/15 bg-mint/[0.04] p-5"
        >
          <div className="flex items-start gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-mint/10 text-mint">
              <Lightbulb className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-mint/70">
                آیا می‌دانستید؟
              </div>
              <AnimatePresence mode="wait">
                <motion.p
                  key={currentTip}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.4, ease: easeOut }}
                  className="mt-1.5 text-sm leading-[1.85] text-foreground/80"
                >
                  {TIPS[currentTip]}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* Bottom CTA — still have questions? */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, ease: easeOut }}
          className="mt-12"
        >
          <div className="surface rounded-2xl p-6 text-center sm:p-8">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <div className="flex size-10 items-center justify-center rounded-xl border border-mint/20 bg-mint/[0.08] text-mint">
                <Mail className="size-5" />
              </div>
              <div className="text-right">
                <h3 className="text-base font-bold text-foreground sm:text-lg">
                  هنوز سوالی دارید؟
                </h3>
                <p className="mt-1 text-sm text-muted-foreground/70">
                  تیم پشتیبانی ما آماده پاسخگویی به سوالات شماست.
                </p>
              </div>
              <a
                href="#team"
                className="shine-sweep inline-flex items-center gap-2 rounded-full bg-mint px-5 py-2.5 text-sm font-semibold text-[#06120c] shadow-[0_6px_24px_-4px_var(--mint)] transition-all duration-300 hover:brightness-110 hover:scale-[1.02]"
              >
                <HelpCircle className="size-4" />
                با ما گفتگو کنید
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
