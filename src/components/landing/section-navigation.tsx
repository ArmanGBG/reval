"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

type SectionItem = {
  id: string;
  label: string;
};

const SECTIONS: SectionItem[] = [
  { id: "top", label: "آغاز" },
  { id: "features", label: "دموی محصول" },
  { id: "team", label: "تیم" },
];

/**
 * Vertical section navigation dots, fixed on the right side of the viewport.
 * Highlights the current section using IntersectionObserver.
 * Clicking a dot smooth-scrolls to the section.
 * Features: connected dots with filled progress line, pulsing glow ring on active.
 */
export function SectionNavigation() {
  const [activeId, setActiveId] = React.useState<string>("");
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > window.innerHeight * 0.4);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  React.useEffect(() => {
    const observers: IntersectionObserver[] = [];
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (!el) return;
      const io = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveId(s.id);
        },
        { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
      );
      io.observe(el);
      observers.push(io);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  const handleClick = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const activeIndex = SECTIONS.findIndex((s) => s.id === activeId);

  return (
    <AnimatePresence>
      {visible && (
        <motion.nav
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          aria-label="ناوبری بخش‌ها"
          className="fixed right-5 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-center gap-3 lg:flex"
        >
          {/* Vertical progress line behind dots */}
          <div className="pointer-events-none absolute right-[5px] top-1/2 -translate-y-1/2">
            {/* Track line (unfilled) */}
            <div
              className="w-px bg-muted-foreground/15"
              style={{
                height: `${(SECTIONS.length - 1) * 12 + (SECTIONS.length - 1) * 3}px`,
              }}
            />
            {/* Filled line up to active dot */}
            <motion.div
              className="absolute top-0 w-px bg-mint origin-top"
              animate={{
                height: `${Math.max(0, activeIndex) * 15}px`,
              }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>

          {SECTIONS.map((s, idx) => {
            const active = activeId === s.id;
            return (
              <button
                key={s.id}
                onClick={() => handleClick(s.id)}
                aria-label={s.label}
                aria-current={active ? "true" : undefined}
                className="group relative flex items-center justify-end gap-2"
              >
                {/* Label tooltip */}
                <span
                  className={cn(
                    "pointer-events-none whitespace-nowrap rounded-md bg-card/80 px-2.5 py-1 text-[10px] font-medium text-foreground opacity-0 backdrop-blur-md transition-all duration-300 group-hover:opacity-100",
                    active && "opacity-100 text-mint"
                  )}
                >
                  {s.label}
                </span>
                {/* Dot */}
                <span className="relative flex items-center justify-center">
                  <span
                    className={cn(
                      "rounded-full transition-all duration-300",
                      active
                        ? "size-3 bg-mint shadow-[0_0_12px_var(--mint)]"
                        : "size-2 bg-muted-foreground/40 group-hover:bg-mint/60"
                    )}
                  />
                  {active && (
                    <>
                      {/* Pronounced glow ring that pulses */}
                      <motion.span
                        layoutId="section-nav-active"
                        className="absolute -inset-1.5 rounded-full border-2 border-mint/30"
                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                      />
                      <motion.span
                        className="absolute -inset-1 rounded-full border border-mint/20"
                        animate={{
                          scale: [1, 1.8],
                          opacity: [0.6, 0],
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: "easeOut",
                        }}
                      />
                      <motion.span
                        className="absolute -inset-2 rounded-full border border-mint/10"
                        animate={{
                          scale: [1, 2.2],
                          opacity: [0.3, 0],
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: "easeOut",
                          delay: 0.5,
                        }}
                      />
                    </>
                  )}
                </span>
              </button>
            );
          })}
        </motion.nav>
      )}
    </AnimatePresence>
  );
}
