'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import {
  Sparkles,
  CheckCircle2,
  Timer,
  ChevronDown,
} from 'lucide-react';

// ===== Hero Section =====
export function HeroSection() {
  const { setCurrentView } = useAppStore();
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 500], [0, 120]);
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-16 pb-12 md:pb-0">
      {/* ONE subtle accent glow behind hero headline — no other orbs */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/3 right-1/2 translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] rounded-full bg-[radial-gradient(circle,var(--accent-soft)_0%,transparent_70%)] blur-3xl opacity-70"
      />

      <motion.div
        style={{ y: heroY, opacity: heroOpacity }}
        className="relative z-10 w-full max-w-7xl mx-auto px-4 md:px-6"
      >
        {/* ===== Mobile layout: full-bleed single column ===== */}
        <div className="md:hidden max-w-md mx-auto text-center pt-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--accent-soft)] border border-[var(--accent-soft)] mb-5"
          >
            <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span className="text-xs text-[var(--accent)] font-medium">همراه هوشمند کنکور</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-4xl font-black text-[var(--foreground)] leading-[1.15] mb-5"
          >
            مسیر مطالعه‌ات رو{' '}
            <span className="text-[var(--accent)]">
              هموار
            </span>{' '}
            کن
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-base text-[var(--foreground-muted)] leading-relaxed mb-7"
          >
            روال، اپلیکیشن مدیریت مطالعه و بهره‌وری دانش‌آموزی. برنامه‌ریزی هوشمند، ابزارهای تمرکز و تحلیل پیشرفت — همه در یک جا.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-col gap-3 mb-6"
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setCurrentView('onboarding')}
              className="btn-hover glow-hover w-full px-6 py-4 rounded-2xl bg-[var(--accent)] text-[var(--bg-deep)] font-bold text-base min-h-[52px]"
            >
              شروع کن
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="btn-hover w-full px-6 py-4 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-strong)] text-[var(--foreground)] font-bold text-base min-h-[52px]"
            >
              بیشتر بدون
            </motion.button>
          </motion.div>

          {/* Social proof — mobile */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="flex items-center justify-center gap-2.5"
          >
            <div className="flex -space-x-2 space-x-reverse">
              {['🦊', '🐺', '🦁', '🐯'].map((emoji, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full bg-[var(--bg-overlay)] border-2 border-[var(--bg-base)] flex items-center justify-center text-sm"
                >
                  {emoji}
                </div>
              ))}
            </div>
            <div className="text-xs">
              <span className="text-[var(--foreground)] font-bold">+۱۲,۰۰۰</span>
              <span className="text-[var(--foreground-muted)]"> دانش‌آموز فعال</span>
            </div>
          </motion.div>
        </div>

        {/* ===== Desktop layout: split (text right, mockup left) ===== */}
        <div className="hidden md:flex flex-row items-center gap-12 lg:gap-16 py-20">
          {/* Text — appears on RIGHT in RTL */}
          <div className="flex-1 text-right">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--accent-soft)] border border-[var(--accent-soft)] mb-6"
            >
              <Sparkles className="w-4 h-4 text-[var(--accent)]" />
              <span className="text-sm text-[var(--accent)] font-medium">همراه هوشمند کنکور</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-5xl lg:text-6xl font-black text-[var(--foreground)] leading-[1.1] mb-6 tracking-tight"
            >
              مسیر مطالعه‌ات رو{' '}
              <span className="text-[var(--accent)]">
                هموار
              </span>{' '}
              کن
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-lg lg:text-xl text-[var(--foreground-muted)] leading-relaxed mb-8 max-w-xl mr-0"
            >
              روال، اپلیکیشن مدیریت مطالعه و بهره‌وری دانش‌آموزی. برنامه‌ریزی هوشمند، ابزارهای تمرکز و تحلیل پیشرفت — همه در یک جا.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex flex-row items-center gap-4 justify-start mb-8"
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setCurrentView('onboarding')}
                className="btn-hover glow-hover px-8 py-4 rounded-2xl bg-[var(--accent)] text-[var(--bg-deep)] font-bold text-base min-w-[200px]"
              >
                شروع کن
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="btn-hover px-8 py-4 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-strong)] text-[var(--foreground)] font-bold text-base min-w-[200px]"
              >
                بیشتر بدون
              </motion.button>
            </motion.div>

            {/* Social proof — desktop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="flex items-center gap-3 justify-start"
            >
              <div className="flex -space-x-2 space-x-reverse">
                {['🦊', '🐺', '🦁', '🐯'].map((emoji, i) => (
                  <div
                    key={i}
                    className="w-9 h-9 rounded-full bg-[var(--bg-overlay)] border-2 border-[var(--bg-base)] flex items-center justify-center text-base"
                  >
                    {emoji}
                  </div>
                ))}
              </div>
              <div className="text-sm">
                <span className="text-[var(--foreground)] font-bold">+۱۲,۰۰۰</span>
                <span className="text-[var(--foreground-muted)]"> دانش‌آموز فعال</span>
              </div>
            </motion.div>
          </div>

          {/* Phone Mockup — appears on LEFT in RTL */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex-1 relative max-w-sm lg:max-w-md"
          >
            <div className="relative">
              {/* Single subtle glow behind phone */}
              <div
                aria-hidden
                className="absolute inset-0 bg-[var(--accent-glow)] blur-[60px] rounded-full scale-75 opacity-60"
              />

              {/* Phone frame */}
              <div className="relative bg-[var(--bg-elevated)] rounded-[2.5rem] border border-[var(--border-strong)] p-3 shadow-[0_24px_64px_-16px_rgba(0,0,0,0.7)]">
                <div className="bg-[var(--bg-deep)] rounded-[2rem] overflow-hidden aspect-[9/16]">
                  <img
                    src="/hero-illustration.png"
                    alt="اپلیکیشن روال"
                    className="w-full h-full object-cover object-center"
                  />
                </div>
              </div>

              {/* Floating badge — top */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -top-4 -right-4 surface-glass rounded-2xl px-4 py-3 shadow-lg"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[var(--accent-soft)] flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-[var(--accent)]" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[var(--foreground)]">وظیفه انجام شد</p>
                    <p className="text-[10px] text-[var(--foreground-muted)]">ریاضی — حد و پیوستگی</p>
                  </div>
                </div>
              </motion.div>

              {/* Floating badge — bottom */}
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                className="absolute -bottom-2 -left-4 surface-glass rounded-2xl px-4 py-3 shadow-lg"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[var(--accent-soft)] flex items-center justify-center">
                    <Timer className="w-4 h-4 text-[var(--accent)]" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[var(--foreground)]">۲۵ دقیقه مطالعه</p>
                    <p className="text-[10px] text-[var(--foreground-muted)]">پومودورو فعال</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Scroll indicator — desktop only */}
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="hidden md:block absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <ChevronDown className="w-6 h-6 text-[var(--foreground-subtle)]" />
      </motion.div>
    </section>
  );
}
