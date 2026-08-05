'use client';

import { motion } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import { Shield, Zap } from 'lucide-react';
import { AnimatedSection } from './landing-helpers';

// ===== CTA Section =====
export function CTASection() {
  const { setCurrentView } = useAppStore();

  return (
    <section className="relative py-12 md:py-24 px-4 md:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Mobile: full-width gradient panel with full-width button */}
        <AnimatedSection className="md:hidden">
          <div className="relative overflow-hidden rounded-2xl bg-[var(--bg-elevated)] border border-[var(--accent-soft)] p-6 edge-highlight">
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-bl from-[var(--accent-soft)] via-transparent to-transparent"
            />
            <div className="relative text-center">
              <h2 className="text-2xl font-black text-[var(--foreground)] mb-3 leading-tight">
                آماده‌ای مسیرت رو{' '}
                <span className="text-[var(--accent)]">شروع</span> کنی؟
              </h2>
              <p className="text-sm text-[var(--foreground-muted)] mb-6 leading-relaxed">
                همین الان ثبت‌نام کن و به هزاران دانش‌آموز دیگر بپیوند. روال رایگانه!
              </p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setCurrentView('onboarding')}
                className="btn-hover glow-hover w-full px-6 py-4 rounded-2xl bg-[var(--accent)] text-[var(--bg-deep)] font-bold text-base min-h-[52px]"
              >
                شروع کن
              </motion.button>
              <div className="mt-5 flex items-center justify-center gap-4 text-xs text-[var(--foreground-muted)]">
                <div className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-[var(--accent)]" />
                  <span>بدون کارت بانکی</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-[var(--accent)]" />
                  <span>شروع فوری</span>
                </div>
              </div>
            </div>
          </div>
        </AnimatedSection>

        {/* Desktop: large gradient panel */}
        <AnimatedSection className="hidden md:block">
          <div className="relative overflow-hidden rounded-[var(--radius-xl)] bg-[var(--bg-elevated)] border border-[var(--accent-soft)] p-12 lg:p-16 edge-highlight">
            {/* Gradient background layer */}
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-bl from-[var(--accent-soft)] via-[var(--accent-soft)] to-transparent opacity-80"
            />
            <div
              aria-hidden
              className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-32 bg-[var(--accent-glow)] blur-[80px] opacity-50"
            />

            <div className="relative text-center max-w-2xl mx-auto">
              <h2 className="text-3xl lg:text-4xl font-black text-[var(--foreground)] mb-4 leading-tight">
                آماده‌ای مسیرت رو{' '}
                <span className="bg-gradient-to-l from-[var(--accent-hover)] to-[var(--accent)] bg-clip-text text-transparent">
                  شروع
                </span>{' '}
                کنی؟
              </h2>
              <p className="text-base lg:text-lg text-[var(--foreground-muted)] mb-8 leading-relaxed">
                همین الان ثبت‌نام کن و به هزاران دانش‌آموز دیگر بپیوند. روال رایگانه!
              </p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setCurrentView('onboarding')}
                className="btn-hover glow-hover px-10 py-4 rounded-2xl bg-[var(--accent)] text-[var(--bg-deep)] font-bold text-lg shadow-[0_8px_24px_-6px_var(--accent-glow)]"
              >
                شروع کن
              </motion.button>
              <div className="mt-6 flex items-center justify-center gap-6 text-sm text-[var(--foreground-muted)]">
                <div className="flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-[var(--accent)]" />
                  <span>بدون نیاز به کارت بانکی</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-[var(--accent)]" />
                  <span>شروع فوری</span>
                </div>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
