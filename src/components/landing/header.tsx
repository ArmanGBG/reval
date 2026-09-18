"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, Moon, Sun, X } from "lucide-react";
import { Logo } from "./logo";
import { cn } from "@/lib/utils";
import { useConfettiOnClick } from "./use-confetti";
import { useAppStore } from "@/lib/store";

// Nav items support two modes:
//   - `href` → renders a <Link> that scrolls to a hash on the landing page
//   - `action` → renders a <button> that calls the corresponding callback
//     (switches the LandingPage view to the dedicated advisors / team page,
//      or for "demo" switches back to main landing and scrolls to #features).
type NavItem = { label: string; href: string } | { label: string; action: "advisors-page" | "team-page" | "demo" };

const NAV: NavItem[] = [
  { label: "دموی محصول", action: "demo" },
  { label: "مشاوران", action: "advisors-page" },
  { label: "تیم ما", action: "team-page" },
];

export function Header({
  onAdvisorsClick,
  onTeamClick,
  onDemoClick,
}: {
  onAdvisorsClick?: () => void;
  onTeamClick?: () => void;
  onDemoClick?: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const onConfetti = useConfettiOnClick(45);
  const theme = useAppStore((s) => s.theme);
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const isLight = theme === "light";

  React.useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Shared click handler for action nav items — triggers the right
  // callback (switches the LandingPage view) and also closes the mobile
  // drawer if open.
  const handleActionClick = (action: "advisors-page" | "team-page" | "demo") => {
    if (action === "advisors-page") onAdvisorsClick?.();
    else if (action === "team-page") onTeamClick?.();
    else if (action === "demo") onDemoClick?.();
    setOpen(false);
  };

  // Helper: render a nav item as either a <Link> (href mode) or a <button>
  // (action mode). Used by both the desktop nav and the mobile drawer.
  const renderNavItem = (item: NavItem, index: number) => {
    if ("action" in item) {
      return (
        <button
          key={item.label}
          type="button"
          onClick={() => handleActionClick(item.action)}
          className="underline-grow rounded-lg px-3.5 py-2 text-sm text-muted-foreground transition-all duration-200 hover:bg-foreground/[0.05] hover:text-foreground"
        >
          {item.label}
        </button>
      );
    }
    return (
      <Link
        key={item.label}
        href={item.href}
        onClick={() => setOpen(false)}
        className="underline-grow rounded-lg px-3.5 py-2 text-sm text-muted-foreground transition-all duration-200 hover:bg-foreground/[0.05] hover:text-foreground"
      >
        {item.label}
      </Link>
    );
  };

  // Mobile-drawer variant: bigger touch target, different padding. Same
  // href-vs-action logic.
  const renderMobileNavItem = (item: NavItem, index: number) => {
    if ("action" in item) {
      return (
        <button
          key={item.label}
          type="button"
          onClick={() => handleActionClick(item.action)}
          className="touch-target rounded-xl px-4 py-3.5 text-base font-medium text-foreground/90 transition-all hover:bg-foreground/[0.06] focus-ring-mint text-right"
        >
          {item.label}
        </button>
      );
    }
    return (
      <Link
        key={item.label}
        href={item.href}
        onClick={() => setOpen(false)}
        className="touch-target rounded-xl px-4 py-3.5 text-base font-medium text-foreground/90 transition-all hover:bg-foreground/[0.06] focus-ring-mint"
      >
        {item.label}
      </Link>
    );
  };

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
            className="group flex items-center gap-2.5 rounded-xl outline-none transition-all duration-300 hover:bg-foreground/[0.04] px-2 py-1.5"
            aria-label="روال — خانه"
          >
            <span className="transition-transform duration-500 group-hover:rotate-[8deg] group-hover:scale-110">
              <Logo size={26} />
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 lg:flex" aria-label="منوی اصلی">
            {NAV.map(renderNavItem)}
          </nav>

          <div className="flex-1" />

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex size-10 items-center justify-center rounded-xl text-muted-foreground transition-all duration-200 hover:bg-foreground/[0.06] hover:text-foreground focus-ring-mint"
              aria-label={isLight ? "تغییر به تم تاریک" : "تغییر به تم روشن"}
              title={isLight ? "تغییر به تم تاریک" : "تغییر به تم روشن"}
            >
              {isLight ? <Moon className="size-5" /> : <Sun className="size-5" />}
            </button>
            <Link
              href="#login"
              className="hidden touch-target rounded-lg px-3.5 py-2 text-sm text-muted-foreground transition-all duration-200 hover:bg-foreground/[0.05] hover:text-foreground focus-ring-mint sm:inline-flex"
            >
              ورود
            </Link>
            <Link
              href="#signup"
              onClick={onConfetti}
              className="group relative inline-flex items-center gap-1.5 overflow-hidden rounded-full bg-mint h-11 px-5 text-sm font-semibold text-[#06120c] shadow-[0_8px_32px_-8px_var(--mint)] transition-all duration-300 hover:shadow-[0_12px_44px_-6px_var(--mint-bright)] hover:brightness-110 hover:scale-[1.02] focus-ring-mint"
            >
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-l from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              ثبت‌نام رایگان
            </Link>
            <button
              className="inline-flex size-10 items-center justify-center rounded-xl text-muted-foreground transition-all duration-200 hover:bg-foreground/[0.06] hover:text-foreground focus-ring-mint lg:hidden"
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
                  className="inline-flex size-10 items-center justify-center rounded-xl text-muted-foreground transition-all hover:bg-foreground/[0.06] hover:text-foreground focus-ring-mint"
                  onClick={() => setOpen(false)}
                  aria-label="بستن منو"
                >
                  <X className="size-5" />
                </button>
              </div>
              <nav className="mt-8 flex flex-col gap-1" aria-label="منوی موبایل">
                {NAV.map(renderMobileNavItem)}
              </nav>
              <div className="mt-auto flex flex-col gap-3">
                <Link
                  href="#login"
                  onClick={() => setOpen(false)}
                  className="flex h-11 items-center justify-center rounded-full border border-border px-5 text-sm font-medium text-foreground transition-all hover:bg-foreground/[0.06] focus-ring-mint"
                >
                  ورود
                </Link>
                <Link
                  href="#signup"
                  onClick={() => setOpen(false)}
                  className="flex h-11 items-center justify-center rounded-full bg-mint px-5 text-sm font-semibold text-[#06120c] shadow-[0_8px_24px_-6px_var(--mint)] focus-ring-mint"
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
