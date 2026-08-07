'use client';

import { STATS, StatCard } from './landing-helpers';

// ===== Stats Section =====
export function StatsSection() {
  return (
    <section className="relative py-12 md:py-20 px-4 md:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Mobile: 2x2 grid, no container card */}
        <div className="md:hidden max-w-md mx-auto grid grid-cols-2 gap-3">
          {STATS.map((stat) => (
            <StatCard key={stat.label} stat={stat} />
          ))}
        </div>

        {/* Desktop: 4-column row inside a surfaced panel */}
        <div className="hidden md:block bg-[var(--bg-elevated)] rounded-[var(--radius-xl)] border border-[var(--border)] p-10 lg:p-12 relative overflow-hidden edge-highlight">
          <div
            aria-hidden
            className="absolute inset-0 bg-[var(--accent-soft)] opacity-30"
          />
          <div className="relative grid grid-cols-4 gap-6">
            {STATS.map((stat) => (
              <StatCard key={stat.label} stat={stat} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
