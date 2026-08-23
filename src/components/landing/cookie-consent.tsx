"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, Settings } from "lucide-react";

const easeOut = [0.16, 1, 0.3, 1] as const;

const STORAGE_KEY = "reval-cookie-consent";

/**
 * GDPR-style cookie consent banner.
 * Shows on first visit, remembers dismissal via localStorage.
 * Glassmorphism background, slides up from bottom on mount.
 * z-index above BackToTop (z-50) but below LoadingScreen (z-100).
 */
export function CookieConsent() {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    // Check if already accepted
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      // Small delay for smooth page load, then show banner
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  // Dispatch custom events when visibility changes so other components
  // (like BackToTop) can react and avoid overlap.
  React.useEffect(() => {
    if (visible) {
      window.dispatchEvent(new CustomEvent("reval:cookie-show"));
    } else {
      window.dispatchEvent(new CustomEvent("reval:cookie-hide"));
    }
  }, [visible]);

  const handleAccept = () => {
    localStorage.setItem(STORAGE_KEY, "accepted");
    setVisible(false);
  };

  const handleSettings = () => {
    // For now, just dismiss — can be expanded to a modal later
    localStorage.setItem(STORAGE_KEY, "settings-viewed");
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.5, ease: easeOut }}
          className="fixed inset-x-0 bottom-0 z-50 p-4 sm:p-6"
        >
          <div className="glass mx-auto max-w-3xl rounded-2xl">
            {/* Subtle mint top accent */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px rounded-t-2xl bg-gradient-to-l from-transparent via-mint/30 to-transparent" />

            <div className="flex flex-col items-start gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
              {/* Cookie icon */}
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-mint/20 bg-mint/[0.08]">
                <Cookie className="size-5 text-mint" />
              </div>

              {/* Text */}
              <p className="flex-1 text-sm leading-[1.9] text-muted-foreground/85">
                ما از کوکی‌ها برای بهبود تجربه کاربری و تحلیل بازدید استفاده
                می‌کنیم. با ادامه استفاده از سایت، شما استفاده از کوکی‌ها را
                می‌پذیرید.
              </p>

              {/* Actions */}
              <div className="flex shrink-0 items-center gap-3">
                <button
                  onClick={handleSettings}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border/50 h-11 px-4 text-sm font-medium text-muted-foreground/80 transition-all duration-300 hover:border-border hover:text-foreground hover:bg-card/40"
                >
                  <Settings className="size-3.5" />
                  تنظیمات
                </button>
                <button
                  onClick={handleAccept}
                  className="inline-flex items-center gap-1.5 rounded-full bg-mint h-11 px-5 text-sm font-semibold text-[#06120c] shadow-[0_6px_24px_-4px_var(--mint)] transition-all duration-300 hover:brightness-110 hover:shadow-[0_10px_32px_-4px_var(--mint-bright)] hover:scale-[1.02]"
                >
                  پذیرش
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
