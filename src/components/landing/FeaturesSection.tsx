'use client';

import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import { AnimatedSection, fadeInUp, staggerContainer, FEATURES, SectionHeading } from './landing-helpers';

// ===== Features Section =====
export function FeaturesSection() {
  return (
    <section id="features" className="relative py-16 md:py-24 px-4 md:px-6">
      <div className="max-w-7xl mx-auto">
        <SectionHeading
          eyebrow="ابزارهای قدرتمند"
          eyebrowIcon={Zap}
          title="همه چیز که برای"
          highlight="موفقیت"
          subtitle="از برنامه‌ریزی هوشمند تا مدیریت استرس، روال تمام ابزارهای مورد نیاز تو رو در اختیارت می‌ذاره"
        />

        {/* Mobile: vertical full-width list */}
        <div className="md:hidden max-w-md mx-auto flex flex-col gap-3">
          {FEATURES.map((feature, index) => (
            <AnimatedSection key={feature.title} delay={index * 0.05}>
              <div className="card-hover edge-highlight flex items-start gap-4 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl p-4 min-h-[44px]">
                <div
                  className="flex-shrink-0 w-12 h-12 rounded-xl bg-[var(--accent-soft)] flex items-center justify-center"
                >
                  <feature.icon className="w-6 h-6 text-[var(--accent)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-[var(--foreground)] mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-[var(--foreground-muted)] leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>

        {/* Desktop: multi-column grid with hover-lift cards */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={staggerContainer}
          className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {FEATURES.map((feature) => (
            <motion.div
              key={feature.title}
              variants={fadeInUp}
              className="card-hover edge-highlight group bg-[var(--bg-elevated)] border border-[var(--border)] rounded-[var(--radius-lg)] p-6"
            >
              <div
                className="w-14 h-14 rounded-2xl bg-[var(--accent-soft)] flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-105"
              >
                <feature.icon className="w-7 h-7 text-[var(--accent)]" />
              </div>
              <h3 className="text-lg font-bold text-[var(--foreground)] mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-[var(--foreground-muted)] leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
