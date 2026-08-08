"use client";

import * as React from "react";
import { motion, AnimatePresence, useScroll, useSpring } from "framer-motion";
import { ArrowUp } from "lucide-react";

const COOKIE_CONSENT_KEY = "reval-cookie-consent";

/**
 * Floating "back to top" button.
 * Appears after the user scrolls past ~40% of the first viewport.
 * Shows a circular progress ring driven by global scroll progress.
 *
 * Automatically shifts up (or hides) when the cookie consent banner is
 * visible to avoid overlap.
 */
export function BackToTop() {
  const { scrollYProgress } = useScroll();
  const pathLength = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001,
  });

  const [visible, setVisible] = React.useState(false);
  const [cookieVisible, setCookieVisible] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > window.innerHeight * 0.6);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Listen for cookie consent visibility (custom event from CookieConsent)
  React.useEffect(() => {
    const checkCookie = () => {
      const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
      setCookieVisible(!stored);
    };
    checkCookie();

    const onCookieShow = () => setCookieVisible(true);
    const onCookieHide = () => setCookieVisible(false);
    window.addEventListener("reval:cookie-show", onCookieShow);
    window.addEventListener("reval:cookie-hide", onCookieHide);
    window.addEventListener("storage", checkCookie);
    return () => {
      window.removeEventListener("reval:cookie-show", onCookieShow);
      window.removeEventListener("reval:cookie-hide", onCookieHide);
      window.removeEventListener("storage", checkCookie);
    };
  }, []);

  const handleClick = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // When cookie banner is visible, shift the button up above the banner
  const bottomOffset = cookieVisible ? "bottom-32" : "bottom-6";

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.6, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.6, y: 20 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          whileHover={{ scale: 1.08, y: -2 }}
          whileTap={{ scale: 0.92 }}
          onClick={handleClick}
          aria-label="بازگشت به بالا"
          className={`group touch-target fixed left-6 z-50 flex size-12 items-center justify-center rounded-full border border-mint/30 bg-card/80 backdrop-blur-xl shadow-[0_8px_32px_-8px_color-mix(in_oklch,var(--mint)_40%,transparent)] transition-all duration-500 hover:border-mint/60 hover:bg-card/95 focus-ring-mint ${bottomOffset}`}
        >
          {/* Progress ring */}
          <svg
            viewBox="0 0 36 36"
            className="absolute inset-0 size-full -rotate-90"
            aria-hidden="true"
          >
            <circle
              cx="18"
              cy="18"
              r="16"
              fill="none"
              stroke="oklch(1 0 0 / 8%)"
              strokeWidth="2"
            />
            <motion.circle
              cx="18"
              cy="18"
              r="16"
              fill="none"
              stroke="var(--mint)"
              strokeWidth="2"
              strokeLinecap="round"
              style={{ pathLength }}
            />
          </svg>
          <ArrowUp className="size-4 text-mint transition-transform duration-300 group-hover:-translate-y-0.5" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
