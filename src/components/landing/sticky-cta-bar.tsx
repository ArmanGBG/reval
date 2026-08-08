"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { LogoMark } from "./logo";
import { useConfettiOnClick } from "./use-confetti";

const easeOut = [0.16, 1, 0.3, 1] as const;

/**
 * Sticky CTA bar that appears after scrolling past the hero section.
 * Desktop only (hidden on mobile). Disappears near the footer.
 * Glassmorphism background with mint accent line on top.
 */
export function StickyCTABar() {
  const [visible, setVisible] = React.useState(false);
  const onConfetti = useConfettiOnClick(45);

  React.useEffect(() => {
    const heroEl = document.getElementById("top");
    const footerEl = document.querySelector("footer");

    if (!heroEl) return;

    const heroObserver = new IntersectionObserver(
      ([entry]) => {
        // When hero is NOT intersecting (scrolled past), show bar
        setVisible(!entry.isIntersecting);
      },
      { threshold: 0, rootMargin: "0px 0px -10% 0px" }
    );

    heroObserver.observe(heroEl);

    // When footer comes into view, hide the bar
    let footerObserver: IntersectionObserver | null = null;
    if (footerEl) {
      footerObserver = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setVisible(false);
          } else {
            // Re-check if we're past hero
            const heroRect = heroEl.getBoundingClientRect();
            setVisible(heroRect.bottom < 0);
          }
        },
        { threshold: 0, rootMargin: "0px 0px 100px 0px" }
      );
      footerObserver.observe(footerEl);
    }

    return () => {
      heroObserver.disconnect();
      footerObserver?.disconnect();
    };
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ duration: 0.4, ease: easeOut }}
          className="fixed inset-x-0 bottom-0 z-40 hidden lg:block"
        >
          {/* Mint accent line on top */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-mint/40 to-transparent" />

          <div className="glass">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
              {/* Left: Logo + tagline */}
              <div className="flex items-center gap-3">
                <LogoMark size={22} />
                <span className="text-sm font-medium text-muted-foreground/80">
                  پایان آشفتگی؛ همه چیز روی روال
                </span>
              </div>

              {/* Right: CTA button */}
              <a
                href="#signup"
                onClick={onConfetti}
                className="group touch-target relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-mint px-5 py-2.5 text-sm font-semibold text-[#06120c] shadow-[0_8px_28px_-6px_var(--mint)] transition-all duration-300 hover:shadow-[0_12px_36px_-4px_var(--mint-bright)] hover:brightness-110 hover:scale-[1.02] focus-ring-mint"
              >
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-l from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                ثبت‌نام رایگان
                <ArrowLeft className="size-3.5 transition-transform duration-300 group-hover:-translate-x-1" />
              </a>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
