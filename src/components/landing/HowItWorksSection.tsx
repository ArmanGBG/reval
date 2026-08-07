'use client';

import { AnimatedSection, STEPS, SectionHeading } from './landing-helpers';
import { Play } from 'lucide-react';

// ===== How It Works Section =====
export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="relative py-16 md:py-24 px-4 md:px-6">
      <div className="max-w-7xl mx-auto">
        <SectionHeading
          eyebrow="ساده و سریع"
          eyebrowIcon={Play}
          title="در"
          highlight="سه قدم"
          subtitle="فقط چند دقیقه وقت بذار و مسیر مطالعه‌ات رو شروع کن"
        />

        {/* Mobile: vertical step list */}
        <div className="md:hidden max-w-md mx-auto flex flex-col gap-4">
          {STEPS.map((step, index) => (
            <AnimatedSection key={step.number} delay={index * 0.1}>
              <div className="relative flex items-start gap-4 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl p-5 card-hover edge-highlight">
                {/* Step number badge */}
                <div className="flex-shrink-0 relative">
                  <div className="w-14 h-14 rounded-2xl bg-[var(--accent-soft)] border border-[var(--accent-soft)] flex items-center justify-center">
                    <step.icon className="w-6 h-6 text-[var(--accent)]" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[var(--accent)] text-[var(--bg-deep)] text-xs font-black flex items-center justify-center">
                    {step.number}
                  </span>
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="text-base font-bold text-[var(--foreground)] mb-1">
                    {step.title}
                  </h3>
                  <p className="text-sm text-[var(--foreground-muted)] leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>

        {/* Desktop: horizontal 3-step flow with connecting line */}
        <div className="hidden md:grid grid-cols-3 gap-8 relative">
          {/* Connecting line */}
          <div
            aria-hidden
            className="absolute top-12 right-[16.66%] left-[16.66%] h-px bg-[var(--border-strong)]"
          />

          {STEPS.map((step, index) => (
            <AnimatedSection key={step.number} delay={index * 0.15}>
              <div className="relative text-center">
                {/* Step number circle */}
                <div className="relative mx-auto w-24 h-24 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-strong)] flex items-center justify-center mb-6 card-hover edge-highlight">
                  <div className="absolute inset-0 rounded-2xl bg-[var(--accent-soft)] opacity-50" />
                  <span className="relative text-4xl font-black text-[var(--accent)]">
                    {step.number}
                  </span>
                </div>

                <div className="w-12 h-12 rounded-xl bg-[var(--accent-soft)] flex items-center justify-center mx-auto mb-4">
                  <step.icon className="w-6 h-6 text-[var(--accent)]" />
                </div>

                <h3 className="text-lg font-bold text-[var(--foreground)] mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-[var(--foreground-muted)] leading-relaxed max-w-xs mx-auto">
                  {step.description}
                </p>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
