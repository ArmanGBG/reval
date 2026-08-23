"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Keyboard } from "lucide-react";

const easeOut = [0.16, 1, 0.3, 1] as const;

type SectionShortcut = {
  key: string;
  id: string;
  label: string;
};

const SECTIONS: SectionShortcut[] = [
  { key: "1", id: "top", label: "آغاز" },
  { key: "2", id: "features", label: "دموی محصول" },
  { key: "3", id: "team", label: "تیم" },
];

/**
 * Global keyboard shortcuts for power users.
 *
 * Keys:
 *   1-3  — Jump to each section (smooth scroll)
 *   ?    — Toggle this help overlay
 *   Home — Scroll to top
 *   End  — Scroll to bottom
 *   Esc  — Close help overlay
 *
 * Ignores keystrokes when the user is typing in an input/textarea/select
 * or when an element is contentEditable.
 */
export function KeyboardShortcuts() {
  const [helpOpen, setHelpOpen] = React.useState(false);
  const [hintVisible, setHintVisible] = React.useState(false);

  // Show a subtle hint after 4s of inactivity (only once per session)
  React.useEffect(() => {
    if (sessionStorage.getItem("reval-kb-hint-shown")) return;

    let timeout: ReturnType<typeof setTimeout>;
    const showHint = () => {
      timeout = setTimeout(() => {
        setHintVisible(true);
        sessionStorage.setItem("reval-kb-hint-shown", "1");
        // Auto-hide after 6 seconds
        setTimeout(() => setHintVisible(false), 6000);
      }, 4000);
    };
    showHint();
    return () => clearTimeout(timeout);
  }, []);

  React.useEffect(() => {
    const isTyping = (el: EventTarget | null) => {
      if (!(el instanceof HTMLElement)) return false;
      const tag = el.tagName.toLowerCase();
      return (
        tag === "input" ||
        tag === "textarea" ||
        tag === "select" ||
        el.isContentEditable
      );
    };

    const onKey = (e: KeyboardEvent) => {
      // Toggle help with "?"
      if (e.key === "?" && !isTyping(e.target)) {
        e.preventDefault();
        setHelpOpen((v) => !v);
        return;
      }

      // Close help with Escape
      if (e.key === "Escape") {
        setHelpOpen(false);
        return;
      }

      // Ignore shortcuts when typing
      if (isTyping(e.target)) return;

      // Home / End
      if (e.key === "Home") {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      if (e.key === "End") {
        e.preventDefault();
        window.scrollTo({
          top: document.body.scrollHeight,
          behavior: "smooth",
        });
        return;
      }

      // Number keys 1-3 for sections
      const section = SECTIONS.find((s) => s.key === e.key);
      if (section) {
        e.preventDefault();
        const el = document.getElementById(section.id);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        setHintVisible(false);
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      {/* ─── Subtle hint chip ─── */}
      <AnimatePresence>
        {hintVisible && !helpOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.4, ease: easeOut }}
            className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 lg:hidden"
          >
            <button
              onClick={() => {
                setHelpOpen(true);
                setHintVisible(false);
              }}
              className="glass flex items-center gap-2.5 rounded-full px-4 py-2.5 text-xs text-muted-foreground/90 shadow-lg transition-all duration-300 hover:text-foreground"
            >
              <Keyboard className="size-3.5 text-mint" />
              <span>برای میان‌برها</span>
              <kbd className="nums rounded border border-border/60 bg-card/60 px-1.5 py-0.5 text-[10px] font-semibold text-foreground">
                ?
              </kbd>
              <span>را بزنید</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Help overlay ─── */}
      <AnimatePresence>
        {helpOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[70] flex items-center justify-center p-4"
            onClick={() => setHelpOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-label="میان‌برهای صفحه‌کلید"
          >
            <div className="absolute inset-0 bg-background/80 backdrop-blur-md" />
            <motion.div
              initial={{ scale: 0.95, y: 12, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 12, opacity: 0 }}
              transition={{ duration: 0.3, ease: easeOut }}
              onClick={(e) => e.stopPropagation()}
              className="surface relative w-full max-w-md rounded-3xl p-7 shadow-2xl"
            >
              {/* Mint top accent */}
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px rounded-t-3xl bg-gradient-to-l from-transparent via-mint/50 to-transparent" />

              {/* Header */}
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl border border-mint/20 bg-mint/[0.08]">
                  <Keyboard className="size-5 text-mint" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    میان‌برهای صفحه‌کلید
                  </h3>
                  <p className="text-xs text-muted-foreground/70">
                    برای کاربران حرفه‌ای روال
                  </p>
                </div>
              </div>

              {/* Section shortcuts */}
              <div className="mt-6">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                  ناوبری بخش‌ها
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {SECTIONS.map((s) => (
                    <button
                      key={s.key}
                      onClick={() => {
                        const el = document.getElementById(s.id);
                        if (el) {
                          el.scrollIntoView({
                            behavior: "smooth",
                            block: "start",
                          });
                        }
                        setHelpOpen(false);
                      }}
                      className="group flex items-center justify-between rounded-xl border border-border/40 bg-card/30 px-3 py-2.5 text-sm transition-all duration-200 hover:border-mint/30 hover:bg-mint/[0.04]"
                    >
                      <span className="text-foreground/85 group-hover:text-mint">
                        {s.label}
                      </span>
                      <kbd className="nums flex size-6 items-center justify-center rounded-md border border-border/60 bg-background/60 text-[11px] font-bold text-muted-foreground group-hover:border-mint/40 group-hover:text-mint">
                        {s.key}
                      </kbd>
                    </button>
                  ))}
                </div>
              </div>

              {/* Other shortcuts */}
              <div className="mt-5">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                  سایر
                </p>
                <div className="space-y-2">
                  {[
                    { keys: ["?"], label: "نمایش این راهنما" },
                    { keys: ["Home"], label: "رفتن به بالا" },
                    { keys: ["End"], label: "رفتن به پایین" },
                    { keys: ["Esc"], label: "بستن این پنجره" },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between rounded-lg px-3 py-2 text-sm"
                    >
                      <span className="text-muted-foreground/80">
                        {item.label}
                      </span>
                      <div className="flex gap-1">
                        {item.keys.map((k) => (
                          <kbd
                            key={k}
                            className="nums rounded-md border border-border/60 bg-background/60 px-2 py-0.5 text-[11px] font-bold text-muted-foreground"
                          >
                            {k}
                          </kbd>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="mt-6 flex items-center justify-between border-t border-border/40 pt-4 text-xs text-muted-foreground/60">
                <span>برای بستن، خارج از پنجره را کلیک کنید</span>
                <button
                  onClick={() => setHelpOpen(false)}
                  className="rounded-full bg-mint h-9 px-4 text-xs font-semibold text-[#06120c] transition-all duration-200 hover:brightness-110"
                >
                  بستن
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
