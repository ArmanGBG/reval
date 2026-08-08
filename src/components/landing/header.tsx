"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Menu, X } from "lucide-react";
import { Logo } from "./logo";
import { cn } from "@/lib/utils";
import { useConfettiOnClick } from "./use-confetti";

const NAV = [
  {
    label: "امکانات",
    href: "#features",
    children: [
      { label: "برای دانش‌آموزان", desc: "میز کار تمرکز فردی", href: "#features-student" },
      { label: "برای مشاوران", desc: "مرکز فرماندهی داده‌محور", href: "#features-counselor" },
    ],
  },
  { label: "قیمت محصولات", href: "#pricing" },
  { label: "تیم ما", href: "#team" },
];

export function Header() {
  const [scrolled, setScrolled] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [openMenu, setOpenMenu] = React.useState<string | null>(null);
  const onConfetti = useConfettiOnClick(45);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
      <div
        className={cn(
          "mx-auto transition-all duration-500 ease-out",
          scrolled
            ? "border-b border-border/60 bg-background/75 backdrop-blur-2xl shadow-[0_8px_40px_-12px_oklch(0_0_0/0.3)]"
            : "border-b border-transparent bg-transparent"
        )}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
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
            {NAV.map((item) =>
              item.children ? (
                <div
                  key={item.label}
                  className="relative"
                  onMouseEnter={() => setOpenMenu(item.label)}
                  onMouseLeave={() => setOpenMenu(null)}
                >
                  <button
                    className="underline-grow flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm text-muted-foreground transition-all duration-200 hover:bg-white/[0.04] hover:text-foreground"
                    onClick={() =>
                      setOpenMenu((v) => (v === item.label ? null : item.label))
                    }
                  >
                    {item.label}
                    <ChevronDown
                      className={cn(
                        "size-3.5 transition-transform duration-300",
                        openMenu === item.label && "rotate-180"
                      )}
                    />
                  </button>
                  <AnimatePresence>
                    {openMenu === item.label && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.97 }}
                        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute right-0 top-full pt-2"
                      >
                        <div className="surface w-64 overflow-hidden rounded-2xl p-1.5 shadow-2xl shadow-black/40">
                          {item.children.map((child) => (
                            <Link
                              key={child.label}
                              href={child.href}
                              onClick={() => setOpenMenu(null)}
                              className="block rounded-xl px-3.5 py-3 transition-all duration-200 hover:bg-white/[0.06] group/item"
                            >
                              <div className="text-sm font-medium text-foreground group-hover/item:text-mint transition-colors duration-200">
                                {child.label}
                              </div>
                              <div className="mt-0.5 text-xs text-muted-foreground">
                                {child.desc}
                              </div>
                            </Link>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link
                  key={item.label}
                  href={item.href}
                  className="underline-grow rounded-lg px-3.5 py-2 text-sm text-muted-foreground transition-all duration-200 hover:bg-white/[0.04] hover:text-foreground"
                >
                  {item.label}
                </Link>
              )
            )}
          </nav>

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
                  <React.Fragment key={item.label}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="touch-target rounded-xl px-4 py-3.5 text-base font-medium text-foreground/90 transition-all hover:bg-white/[0.06] focus-ring-mint"
                    >
                      {item.label}
                    </Link>
                    {item.children?.map((c) => (
                      <Link
                        key={c.label}
                        href={c.href}
                        onClick={() => setOpen(false)}
                        className="touch-target rounded-xl pr-8 py-3 text-sm text-muted-foreground transition-all hover:bg-white/[0.04] hover:text-foreground focus-ring-mint"
                      >
                        {c.label}
                      </Link>
                    ))}
                  </React.Fragment>
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
