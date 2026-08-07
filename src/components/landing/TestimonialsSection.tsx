'use client';

import { motion } from 'framer-motion';
import { Users, Star, Quote } from 'lucide-react';
import { fadeInUp, staggerContainer, TESTIMONIALS, SectionHeading } from './landing-helpers';

// ===== Testimonials Section =====
export function TestimonialsSection() {
  return (
    <section id="testimonials" className="relative py-16 md:py-24 px-4 md:px-6">
      <div className="max-w-7xl mx-auto">
        <SectionHeading
          eyebrow="نظرات کاربران"
          eyebrowIcon={Users}
          title="دانش‌آموزا"
          highlight="راضین"
          subtitle="ببین دیگران چه می‌گن درباره تجربه‌شون با روال"
        />

        {/* Mobile: horizontal snap-scroll carousel */}
        <div className="md:hidden -mx-4 px-4 overflow-x-auto snap-x snap-mandatory flex gap-4 pb-4 custom-scrollbar">
          {TESTIMONIALS.map((testimonial, idx) => (
            <div
              key={testimonial.name}
              className={`flex-shrink-0 w-[85%] snap-center bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl p-5 card-hover edge-highlight relative overflow-hidden ${idx % 2 === 0 ? 'rotate-[0.5deg]' : 'rotate-[-0.5deg]'}`}
            >
              {/* Quote watermark */}
              <Quote className="absolute -top-1 -left-1 w-16 h-16 text-[var(--accent)]/[0.06] pointer-events-none" />
              <div className="flex items-center gap-1 mb-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-[var(--accent)] text-[var(--accent)]" />
                ))}
              </div>
              <p className="text-sm text-[var(--foreground)] leading-relaxed mb-4">
                {testimonial.text}
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--bg-overlay)] flex items-center justify-center text-lg">
                  {testimonial.avatar}
                </div>
                <div>
                  <p className="text-sm font-bold text-[var(--foreground)]">{testimonial.name}</p>
                  <p className="text-xs text-[var(--foreground-muted)]">{testimonial.grade}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop: 3-column grid */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={staggerContainer}
          className="hidden md:grid grid-cols-3 gap-6"
        >
          {TESTIMONIALS.map((testimonial, idx) => (
            <motion.div
              key={testimonial.name}
              variants={fadeInUp}
              className={`card-hover edge-highlight bg-[var(--bg-elevated)] border border-[var(--border)] rounded-[var(--radius-lg)] p-6 relative overflow-hidden ${idx % 2 === 0 ? 'rotate-[0.5deg]' : 'rotate-[-0.5deg]'}`}
            >
              {/* Quote watermark */}
              <Quote className="absolute -top-1 -left-1 w-20 h-20 text-[var(--accent)]/[0.06] pointer-events-none" />
              <div className="flex items-center gap-1 mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-[var(--accent)] text-[var(--accent)]" />
                ))}
              </div>
              <p className="text-sm text-[var(--foreground)] leading-relaxed mb-5">
                {testimonial.text}
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--bg-overlay)] flex items-center justify-center text-lg">
                  {testimonial.avatar}
                </div>
                <div>
                  <p className="text-sm font-bold text-[var(--foreground)]">{testimonial.name}</p>
                  <p className="text-xs text-[var(--foreground-muted)]">{testimonial.grade}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
