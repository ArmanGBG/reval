"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useInView, AnimatePresence } from "framer-motion";
import {
  Instagram,
  Linkedin,
  Twitter,
  Send,
  Mail,
  Phone,
  MapPin,
  Check,
  Loader2,
  Heart,
  ArrowUp,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { Logo } from "./logo";
import { cn } from "@/lib/utils";

const easeOut = [0.16, 1, 0.3, 1] as const;
const springBounce = { type: "spring" as const, stiffness: 300, damping: 15 };

/* ───────── Data ───────── */

const COLUMNS = [
  {
    title: "محصولات",
    links: [
      { label: "امکانات", href: "#features" },
      { label: "برای دانش‌آموزان", href: "#features-student" },
      { label: "برای مشاوران", href: "#features-counselor" },
      { label: "قیمت‌گذاری", href: "#pricing" },
    ],
  },
  {
    title: "شرکت",
    links: [
      { label: "تیم ما", href: "#team" },
      { label: "درباره روال", href: "#team" },
      { label: "بلاگ", href: "#", external: true },
      { label: "فرصت‌های شغلی", href: "#", external: true },
    ],
  },
  {
    title: "دسترسی",
    links: [
      { label: "ورود", href: "#login" },
      { label: "ثبت‌نام رایگان", href: "#signup" },
      { label: "پنل مشاور", href: "#login" },
      { label: "پنل دانش‌آموز", href: "#login" },
    ],
  },
  {
    title: "قوانین",
    links: [
      { label: "شرایط استفاده", href: "#" },
      { label: "حریم خصوصی", href: "#" },
      { label: "سیاست بازگشت وجه", href: "#" },
      { label: "نقشه سایت", href: "#" },
    ],
  },
];

const SOCIAL = [
  {
    icon: Instagram,
    href: "#",
    label: "اینستاگرام",
    hoverCss:
      "hover:border-rose-400/40 hover:text-rose-400 hover:bg-rose-500/[0.08] hover:shadow-[0_0_14px_-2px_oklch(0.65_0.2_10_/_0.35)]",
  },
  {
    icon: Send,
    href: "#",
    label: "تلگرام",
    hoverCss:
      "hover:border-sky-400/40 hover:text-sky-400 hover:bg-sky-500/[0.08] hover:shadow-[0_0_14px_-2px_oklch(0.7_0.15_210_/_0.35)]",
  },
  {
    icon: Linkedin,
    href: "#",
    label: "لینکدین",
    hoverCss:
      "hover:border-blue-400/40 hover:text-blue-400 hover:bg-blue-500/[0.08] hover:shadow-[0_0_14px_-2px_oklch(0.62_0.2_260_/_0.35)]",
  },
  {
    icon: Twitter,
    href: "#",
    label: "توییتر",
    hoverCss:
      "hover:border-cyan-400/40 hover:text-cyan-400 hover:bg-cyan-500/[0.08] hover:shadow-[0_0_14px_-2px_oklch(0.72_0.13_195_/_0.35)]",
  },
];

/* ───────── Animated social icon ───────── */

function SocialIcon({ social }: { social: (typeof SOCIAL)[number] }) {
  const [hovered, setHovered] = React.useState(false);

  return (
    <motion.a
      href={social.href}
      aria-label={social.label}
      target="_blank"
      rel="noopener noreferrer"
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      animate={{ scale: hovered ? 1.18 : 1, y: hovered ? -2 : 0 }}
      transition={springBounce}
      className={cn(
        "touch-target flex size-10 items-center justify-center rounded-xl border border-border/40 bg-card/30 text-muted-foreground/60 transition-all duration-300 focus-ring-mint",
        social.hoverCss
      )}
    >
      <social.icon className="size-[18px]" />
    </motion.a>
  );
}

/* ───────── Newsletter form ───────── */

function NewsletterForm() {
  const [email, setEmail] = React.useState("");
  const [focused, setFocused] = React.useState(false);
  const [status, setStatus] = React.useState<"idle" | "loading" | "success">(
    "idle"
  );

  const hasValue = email.length > 0;
  const isFloating = focused || hasValue;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || status === "loading") return;
    setStatus("loading");
    setTimeout(() => {
      setStatus("success");
      setTimeout(() => {
        setStatus("idle");
        setEmail("");
      }, 3000);
    }, 1200);
  };

  return (
    <div className="relative overflow-hidden rounded-2xl p-[1.5px]">
      {/* Animated conic-gradient border */}
      <div
        className="pointer-events-none absolute -inset-[1px] rounded-2xl shimmer-border"
        aria-hidden="true"
      />
      {/* Inner glow tint */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl"
        aria-hidden="true"
        style={{
          background:
            "linear-gradient(135deg, color-mix(in oklch, var(--mint) 8%, transparent) 0%, transparent 50%, color-mix(in oklch, var(--mint-bright) 6%, transparent) 100%)",
        }}
      />

      <div className="relative flex flex-col items-start justify-between gap-6 rounded-2xl border border-border/50 bg-card/80 p-7 backdrop-blur-sm sm:flex-row sm:items-center">
        <div className="flex items-start gap-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-mint/20 bg-mint/[0.06]">
            <Sparkles className="size-5 text-mint" />
          </div>
          <div>
            <h3 className="font-yekan text-base font-bold text-foreground">
              در جریان باشید
            </h3>
            <p className="mt-1 text-sm text-muted-foreground/70">
              جدیدترین به‌روزرسانی‌ها و راهنمایی‌های تحصیلی رو دریافت کنید.
            </p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {status === "success" ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={springBounce}
              className="flex items-center gap-2.5 text-sm font-medium text-mint"
            >
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ ...springBounce, delay: 0.1 }}
                className="flex size-6 items-center justify-center rounded-full bg-mint/15"
              >
                <Check className="size-3.5" strokeWidth={2.5} />
              </motion.span>
              عضویت با موفقیت انجام شد
            </motion.div>
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex w-full max-w-sm items-center gap-2.5"
              onSubmit={handleSubmit}
            >
              {/* Floating label input */}
              <div className="relative h-11 flex-1">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  id="footer-email"
                  className="peer h-full w-full rounded-full border border-border/50 bg-background/50 px-5 pt-2 text-sm text-foreground placeholder-transparent transition-all duration-300 focus:border-mint/30 focus:outline-none focus:ring-2 focus:ring-mint/15"
                  placeholder="ایمیل شما"
                />
                <label
                  htmlFor="footer-email"
                  className={cn(
                    "pointer-events-none absolute transition-all duration-300 ease-out",
                    isFloating
                      ? "top-1.5 right-4 text-[10px] font-medium text-mint/70"
                      : "top-1/2 right-5 -translate-y-1/2 text-sm text-muted-foreground/50"
                  )}
                >
                  ایمیل شما
                </label>
              </div>

              {/* Submit button with shine sweep */}
              <button
                type="submit"
                disabled={status === "loading"}
                className="group relative h-11 shrink-0 overflow-hidden rounded-full bg-mint px-6 text-sm font-semibold text-[#06120c] shadow-[0_4px_20px_-4px_var(--mint)] transition-all duration-300 hover:brightness-110 hover:shadow-[0_8px_28px_-4px_var(--mint-bright)] disabled:opacity-70"
              >
                <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full" />
                <span className="relative flex items-center gap-1.5">
                  {status === "loading" ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    "عضویت"
                  )}
                </span>
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ───────── Animated uptime counter ───────── */

function UptimeCounter() {
  const [displayUptime, setDisplayUptime] = React.useState(0);
  const targetUptime = 99.9;

  React.useEffect(() => {
    let frame: number;
    const duration = 1500;
    const start = performance.now();

    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayUptime(Math.round(eased * targetUptime * 10) / 10);
      if (progress < 1) {
        frame = requestAnimationFrame(animate);
      }
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <span className="nums font-semibold text-mint/80">
      {displayUptime.toFixed(1)}٪
    </span>
  );
}

/* ───────── Link column with reveal animation ───────── */

function FooterColumn({
  col,
  index,
}: {
  col: (typeof COLUMNS)[number];
  index: number;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.08, ease: easeOut }}
    >
      {/* Title with mint accent bar on the right (RTL) */}
      <h3 className="relative pr-3 font-yekan text-sm font-bold text-foreground/90">
        <span className="absolute right-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-full bg-gradient-to-b from-mint to-mint-bright/60" />
        {col.title}
      </h3>
      <ul className="mt-5 space-y-3">
        {col.links.map((l) => (
          <li key={l.label}>
            <Link
              href={l.href}
              className="underline-grow touch-target inline-flex items-center gap-1.5 text-sm text-muted-foreground/60 transition-colors duration-200 hover:text-foreground focus-ring-mint"
            >
              {l.label}
              {"external" in l && l.external && (
                <ExternalLink className="size-3 opacity-40" />
              )}
            </Link>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

/* ───────── Contact item with hover ───────── */

function ContactItem({
  icon: Icon,
  children,
  href,
}: {
  icon: React.ElementType;
  children: React.ReactNode;
  href?: string;
}) {
  const Comp = href ? "a" : "div";
  const linkProps = href
    ? { href, target: href.startsWith("mailto") ? undefined : "_blank" as const }
    : {};

  return (
    <Comp
      {...linkProps}
      className={cn(
        "flex items-center gap-3 text-sm text-muted-foreground/70 transition-all duration-200",
        href && "hover:text-foreground"
      )}
    >
      <span className="flex size-8 items-center justify-center rounded-lg border border-border/30 bg-card/40">
        <Icon className="size-3.5 text-mint/70" />
      </span>
      {children}
    </Comp>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   MAIN FOOTER
   ══════════════════════════════════════════════════════════════════════════ */

export function Footer() {
  const footerRef = React.useRef<HTMLElement>(null);
  const footerInView = useInView(footerRef, { once: true, margin: "-60px" });

  return (
    <footer
      ref={footerRef}
      className="relative mt-auto border-t border-border/60 bg-background"
    >
      {/* ── Top accent line — animated gradient ── */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-mint/30 to-transparent" />
      {/* Secondary accent glow */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-mint/[0.03] to-transparent" />

      <div className="mx-auto max-w-7xl px-4 pt-16 pb-10 sm:px-6 sm:pt-20 lg:px-8 lg:pt-24">
        {/* ── Main grid: Brand (left) + Link columns (right) ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={footerInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: easeOut }}
          className="grid gap-12 lg:grid-cols-[1.3fr_3fr]"
        >
          {/* ── Brand column ── */}
          <div>
            <Logo size={30} />
            <p className="mt-5 max-w-xs text-pretty text-sm leading-[1.9] text-muted-foreground/80">
              پایان آشفتگی؛ همه‌چیز روی{" "}
              <span className="font-semibold text-mint/90">روال</span>.
              میز کار اختصاصی برای تمرکز عمیق و مدیریت داده‌محور تحصیلی.
            </p>

            {/* Contact info */}
            <div className="mt-7 space-y-3">
              <ContactItem icon={Mail} href="mailto:hello@reval.ir">
                hello@reval.ir
              </ContactItem>
              <ContactItem icon={Phone} href="tel:+982191000000">
                <span className="nums">۰۲۱ - ۹۱۰۰ ۰۰۰۰</span>
              </ContactItem>
              <ContactItem icon={MapPin}>تهران، ایران</ContactItem>
            </div>

            {/* Social icons */}
            <div className="mt-7 flex items-center gap-2.5">
              {SOCIAL.map((s) => (
                <SocialIcon key={s.label} social={s} />
              ))}
            </div>
          </div>

          {/* ── Link columns ── */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {COLUMNS.map((col, i) => (
              <FooterColumn key={col.title} col={col} index={i} />
            ))}
          </div>
        </motion.div>

        {/* ── Newsletter ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={footerInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.15, ease: easeOut }}
          className="mt-14"
        >
          <NewsletterForm />
        </motion.div>

        {/* ── Bottom bar ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={footerInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.25, ease: easeOut }}
          className="mt-12 flex flex-col items-center gap-6 border-t border-border/40 pt-8 sm:flex-row sm:justify-between"
        >
          {/* Left: copyright + made with love */}
          <div className="flex flex-col items-center gap-2 sm:items-start">
            <p className="text-xs text-muted-foreground/60">
              © <span className="nums">۱۴۰۴</span> روال — تمام حقوق
              محفوظ است.
            </p>
            <p className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground/40">
              ساخته‌شده با
              <Heart className="size-3 text-rose-400/70" fill="currentColor" />
              در ایران
            </p>
          </div>

          {/* Center: uptime indicator */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground/60">
            <span className="inline-flex items-center gap-2.5 rounded-full border border-mint/15 bg-mint/[0.04] px-3 py-1">
              <span className="relative flex size-2 items-center justify-center">
                <span className="absolute size-2 rounded-full bg-mint animate-ping opacity-40" />
                <span className="size-1.5 rounded-full bg-mint shadow-[0_0_6px_var(--mint)]" />
              </span>
              <span className="flex items-center gap-1.5">
                <UptimeCounter />
                <span className="text-muted-foreground/50">عملیاتی</span>
              </span>
            </span>
          </div>

          {/* Right: quick bottom links */}
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground/50 sm:justify-end">
            <Link
              href="#"
              className="transition-colors duration-200 hover:text-foreground focus-ring-mint"
            >
              شرایط استفاده
            </Link>
            <span className="text-border/60" aria-hidden="true">·</span>
            <Link
              href="#"
              className="transition-colors duration-200 hover:text-foreground focus-ring-mint"
            >
              حریم خصوصی
            </Link>
            <span className="text-border/60" aria-hidden="true">·</span>
            <Link
              href="#"
              className="transition-colors duration-200 hover:text-foreground focus-ring-mint"
            >
              نقشه سایت
            </Link>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
