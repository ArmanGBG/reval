'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, Target } from 'lucide-react';
import { toPersianDigits } from '@/lib/persian-date';

// ===== Animated Counter =====
function AnimatedCounter({ value, decimals = 0 }: { value: number; decimals?: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (value === 0) {
      setDisplay(0);
      return;
    }
    const duration = 800; // ms
    const startTime = Date.now();
    const startVal = 0;

    function tick() {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(startVal + (value - startVal) * eased);
      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    }
    requestAnimationFrame(tick);
  }, [value]);

  const formatted = decimals > 0
    ? display.toFixed(decimals)
    : Math.round(display).toString();

  return <>{toPersianDigits(formatted)}</>;
}

interface TaskStats {
  totalTasks: number;
  completedCount: number;
  totalStudyHours: number;
  totalTests: number;
}

// ===== Single Stat Card =====
function StatCard({
  icon: Icon,
  value,
  label,
  accentColor,
  decimals = 0,
  delay = 0,
}: {
  icon: typeof CheckCircle;
  value: number;
  label: string;
  accentColor?: string;
  decimals?: number;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }}
      className="surface-1 edge-highlight card-hover rounded-[var(--radius-lg)] p-3 md:p-4 flex flex-col items-center gap-1 text-center"
    >
      <Icon
        className="w-4 h-4 shrink-0"
        style={{ color: accentColor || 'var(--foreground-subtle)' }}
      />
      <span
        className="text-xl md:text-2xl font-bold tabular-nums leading-none"
        style={{ color: accentColor || 'var(--foreground)' }}
      >
        <AnimatedCounter value={value} decimals={decimals} />
      </span>
      <span className="text-[10px] md:text-xs text-[var(--foreground-muted)] leading-tight">
        {label}
      </span>
    </motion.div>
  );
}

// ===== Main Widget =====
export default function TaskStatsWidget({ stats }: { stats: TaskStats }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
      <StatCard
        icon={CheckCircle}
        value={stats.totalTasks}
        label="تسک امروز"
        accentColor="var(--foreground)"
        delay={0}
      />
      <StatCard
        icon={CheckCircle}
        value={stats.completedCount}
        label="انجام‌شده"
        accentColor="var(--accent)"
        delay={0.06}
      />
      <StatCard
        icon={Clock}
        value={stats.totalStudyHours}
        label="ساعت مطالعه"
        decimals={1}
        delay={0.12}
      />
      <StatCard
        icon={Target}
        value={stats.totalTests}
        label="تست زده‌شده"
        delay={0.18}
      />
    </div>
  );
}
