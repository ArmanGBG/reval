"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Logo } from "./logo";
import { cn } from "@/lib/utils";
import { useConfettiOnClick } from "./use-confetti";

const NAV = [
  { label: "دموی محصول", href: "#features" },
  { label: "تیم ما", href: "#team" },
];

export function Header() {
  const [open, setOpen] = React.useState(false);
  const onConfetti = useConfettiOnClick(45);

  React.useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-x-0 top-0 z-50"
    >
      <div className="mx-auto border-b border-border/50 bg-background/70 backdrop-blur-2xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link
            href="#top"
            className="group flex items-center gap-2.5 rounded-xl outline-none transition-all duration-300 hover:bg-white/[0.03] px-2 py-1.5"
            aria-label="روال — خانه"
          >
            <span className="transition-transform duration-500 group-hover:rotate-[8deg] group-hover:scale-110">
              <Logo size={26} />
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 lg:flex" aria-label="منوی اصلی">
            {NAV.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="underline-grow rounded-lg px-3.5 py-2 text-sm text-muted-foreground transition-all duration-200 hover:bg-white/[0.04] hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex-1" />

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Link
              href="#login"
              className="hidden touch-target rounded-lg px-3.5 py-2 text-sm text-muted-foreground transition-all duration-200 hover:bg-white/[0.04] hover:text-foreground focus-ring-mint sm:inline-flex"
            >
              ورود
            </Link>
            <Link
              href="#signup"
              onClick={onConfetti}
              className="group relative touch-target inline-flex items-center gap-1.5 overflow-hidden rounded-full bg-mint px-5 py-2.5 text-sm font-semibold text-[#06120c] shadow-[0_8px_32px_-8px_var(--mint)] transition-all duration-300 hover:shadow-[0_12px_44px_-6px_var(--mint-bright)] hover:brightness-110 hover:scale-[1.02] focus-ring-mint"
            >
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-l from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              ثبت‌نام رایگان
            </Link>
            <button
              className="inline-flex size-10 items-center justify-center rounded-xl text-muted-foreground transition-all duration-200 hover:bg-white/[0.06] hover:text-foreground focus-ring-mint lg:hidden"
              onClick={() => setOpen(true)}
              aria-label="باز کردن منو"
            >
              <Menu className="size-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 lg:hidden"
          >
            <div
              className="absolute inset-0 bg-background/80 backdrop-blur-2xl"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-y-0 right-0 flex w-[84%] max-w-sm flex-col border-l border-border/40 bg-background/95 backdrop-blur-xl p-6 shadow-2xl shadow-black/50"
            >
              <div className="flex items-center justify-between">
                <Logo size={26} />
                <button
                  className="inline-flex size-10 items-center justify-center rounded-xl text-muted-foreground transition-all hover:bg-white/[0.06] hover:text-foreground focus-ring-mint"
                  onClick={() => setOpen(false)}
                  aria-label="بستن منو"
                >
                  <X className="size-5" />
                </button>
              </div>
              <nav className="mt-8 flex flex-col gap-1" aria-label="منوی موبایل">
                {NAV.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="touch-target rounded-xl px-4 py-3.5 text-base font-medium text-foreground/90 transition-all hover:bg-white/[0.06] focus-ring-mint"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
              <div className="mt-auto flex flex-col gap-3">
                <Link
                  href="#login"
                  onClick={() => setOpen(false)}
                  className="touch-target rounded-full border border-border px-5 py-3 text-center text-sm font-medium text-foreground transition-all hover:bg-white/[0.06] focus-ring-mint"
                >
                  ورود
                </Link>
                <Link
                  href="#signup"
                  onClick={() => setOpen(false)}
                  className="touch-target rounded-full bg-mint px-5 py-3 text-center text-sm font-semibold text-[#06120c] shadow-[0_8px_24px_-6px_var(--mint)] focus-ring-mint"
                >
                  ثبت‌نام رایگان
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
