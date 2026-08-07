'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/lib/store';

// ===== Navbar Component =====
export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const { setCurrentView } = useAppStore();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? 'surface-glass' : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-[var(--radius)] bg-[var(--accent)] flex items-center justify-center">
            <span className="text-[var(--bg-deep)] font-black text-base">ر</span>
          </div>
          <span className="text-lg font-bold text-[var(--foreground)]">روال</span>
        </div>

        {/* Nav Links — desktop only */}
        <div className="hidden md:flex items-center gap-8">
          <a
            href="#features"
            className="link-underline text-sm text-[var(--foreground-muted)]"
          >
            ویژگی‌ها
          </a>
          <a
            href="#how-it-works"
            className="link-underline text-sm text-[var(--foreground-muted)]"
          >
            نحوه کار
          </a>
          <a
            href="#testimonials"
            className="link-underline text-sm text-[var(--foreground-muted)]"
          >
            نظرات
          </a>
        </div>

        {/* CTA — both sign-up and login entry points */}
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setCurrentView('login')}
            className="btn-hover px-4 py-2.5 rounded-[var(--radius)] border border-[var(--border-strong)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] font-medium text-sm min-h-[44px] flex items-center transition-colors"
          >
            ورود
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setCurrentView('onboarding')}
            className="btn-hover glow-hover px-5 py-2.5 rounded-[var(--radius)] bg-[var(--accent)] text-[var(--bg-deep)] font-bold text-sm min-h-[44px] flex items-center"
          >
            شروع کن
          </motion.button>
        </div>
      </div>
    </motion.nav>
  );
}
