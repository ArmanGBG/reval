"use client";

import * as React from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { Send, Instagram } from "lucide-react";
import { Logo } from "./logo";

// ===== Footer =====
// Standard footer with:
//   - Logo (click → scroll to top)
//   - Nav links (all functional — no dead links):
//       "دموی محصول" → onDemoClick (switches to main landing + scrolls to #features)
//       "مشاوران"    → onAdvisorsClick (switches to AdvisorsPage)
//       "تیم ما"     → onTeamClick (switches to TeamPage)
//   - Social icons:
//       Telegram → https://t.me/RevalSupport (Send icon)
//       Instagram → https://instagram.com/reval_academy_ (Instagram icon)
//   - Copyright text
//
// Per user's request: "هیچ بخشی نباید وجود داشته باشه که با کلیک بر روی اون
// هیچ اتفاقی نیفته و نمایشی باشه صرفا" — every link in the footer must
// trigger a real action.
const easeOut = [0.16, 1, 0.3, 1] as const;
const TELEGRAM_HANDLE = process.env.NEXT_PUBLIC_ADVISOR_TELEGRAM_HANDLE || "RevalSupport";
const TELEGRAM_URL = `https://t.me/${TELEGRAM_HANDLE}`;
const INSTAGRAM_HANDLE = "reval_academy_";
const INSTAGRAM_URL = `https://instagram.com/${INSTAGRAM_HANDLE}`;

export function Footer({
  onAdvisorsClick,
  onTeamClick,
  onDemoClick,
}: {
  onAdvisorsClick?: () => void;
  onTeamClick?: () => void;
  onDemoClick?: () => void;
}) {
  const footerRef = React.useRef<HTMLElement>(null);
  const footerInView = useInView(footerRef, { once: true, margin: "-60px" });
  const reduceMotion = useReducedMotion();

  return (
    <footer
      ref={footerRef}
      className="relative mt-auto border-t border-border/60 bg-background"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-border/40 to-transparent" />
      <div className="mx-auto max-w-7xl px-4 pt-12 pb-10 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={footerInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: reduceMotion ? 0.12 : 0.6, ease: easeOut }}
          className="flex flex-col items-center gap-8 text-center sm:flex-row sm:items-start sm:justify-between sm:gap-6 sm:text-right"
        >
          {/* ===== Logo + tagline ===== */}
          <div className="flex flex-col items-center gap-2 sm:items-start">
            <Link
              href="#top"
              aria-label="روال — خانه"
              className="inline-flex items-center rounded-xl outline-none transition-all duration-300 hover:bg-foreground/[0.04] px-2 py-1.5"
            >
              <Logo size={26} />
            </Link>
            <p className="text-xs text-muted-foreground/70 sm:text-[11px]">
              پلتفرم برنامه‌ریزی و آنالیز فعالیت دانش‌آموز
            </p>
          </div>

          {/* ===== Nav links (all functional) ===== */}
          <nav
            className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm"
            aria-label="فوتر"
          >
            <button
              type="button"
              onClick={onDemoClick}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              دموی محصول
            </button>
            <button
              type="button"
              onClick={onAdvisorsClick}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              مشاوران
            </button>
            <button
              type="button"
              onClick={onTeamClick}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              تیم ما
            </button>
            <Link
              href="#login"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              ورود
            </Link>
            <Link
              href="#signup"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              ثبت‌نام
            </Link>
          </nav>

          {/* ===== Social icons (Telegram + Instagram) ===== */}
          <div className="flex items-center gap-2">
            <a
              href={TELEGRAM_URL}
              target="_blank"
              rel="noreferrer"
              aria-label={`تلگرام روال (@${TELEGRAM_HANDLE})`}
              className="inline-flex size-10 items-center justify-center rounded-xl border border-border/60 text-muted-foreground transition-all hover:border-mint/40 hover:text-mint hover:bg-mint/[0.06]"
            >
              <Send className="size-4" aria-hidden="true" />
            </a>
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noreferrer"
              aria-label={`اینستاگرام روال (@${INSTAGRAM_HANDLE})`}
              className="inline-flex size-10 items-center justify-center rounded-xl border border-border/60 text-muted-foreground transition-all hover:border-mint/40 hover:text-mint hover:bg-mint/[0.06]"
            >
              <Instagram className="size-4" aria-hidden="true" />
            </a>
          </div>
        </motion.div>

        {/* ===== Copyright ===== */}
        <div className="mt-8 border-t border-border/30 pt-6 text-center">
          <p className="text-xs text-muted-foreground/60">
            © <span className="nums">۱۴۰۵</span> روال — تمام حقوق محفوظ است.
          </p>
        </div>
      </div>
    </footer>
  );
}
