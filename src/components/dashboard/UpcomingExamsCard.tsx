'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Trophy, AlertCircle } from 'lucide-react';
import type { Exam } from '@/lib/types';
import { toPersianDigits, formatPersianDateFromISO } from '@/lib/persian-date';

// =================================================================
// UpcomingExamsCard
// Shows the student's next 1-3 upcoming exams with a live countdown.
// Renders as a horizontal strip below the streak card on the dashboard.
//
// - Sorts exams by date ascending
// - Only shows upcoming or in-progress exams (not completed)
// - Computes days-until-exam from today
// - Highlights the soonest exam with a red/amber accent
// =================================================================

interface UpcomingExamsCardProps {
  exams: Exam[];
}

function daysUntil(isoDate: string): number {
  const target = new Date(isoDate);
  target.setHours(0, 0, 0, 0);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diff = target.getTime() - now.getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

function urgencyStyle(days: number): {
  border: string;
  glow: string;
  badge: string;
  label: string;
} {
  if (days < 0) {
    return {
      border: 'border-[var(--foreground-subtle)]/30',
      glow: '',
      badge: 'bg-[rgba(255,255,255,0.04)] text-[var(--foreground-muted)]',
      label: 'گذشته',
    };
  }
  if (days === 0) {
    return {
      border: 'border-[var(--danger)]/50',
      glow: 'shadow-[0_0_24px_-8px_rgba(239,68,68,0.4)]',
      badge: 'bg-[rgba(239,68,68,0.15)] text-[var(--danger)]',
      label: 'امروز!',
    };
  }
  if (days <= 3) {
    return {
      border: 'border-[var(--danger)]/40',
      glow: 'shadow-[0_0_20px_-10px_rgba(239,68,68,0.3)]',
      badge: 'bg-[rgba(239,68,68,0.12)] text-[var(--danger)]',
      label: `${toPersianDigits(days)} روز دیگر`,
    };
  }
  if (days <= 7) {
    return {
      border: 'border-[var(--warning)]/40',
      glow: 'shadow-[0_0_20px_-10px_rgba(245,158,11,0.3)]',
      badge: 'bg-[rgba(245,158,11,0.12)] text-[var(--warning)]',
      label: `${toPersianDigits(days)} روز دیگر`,
    };
  }
  return {
    border: 'border-[var(--accent)]/30',
    glow: 'shadow-[0_0_20px_-12px_var(--accent-glow)]',
    badge: 'bg-[var(--accent-soft)] text-[var(--accent)]',
    label: `${toPersianDigits(days)} روز دیگر`,
  };
}

export default function UpcomingExamsCard({ exams }: UpcomingExamsCardProps) {
  const upcoming = useMemo(() => {
    return exams
      .filter((e) => e.status !== 'completed')
      .map((e) => ({ exam: e, days: daysUntil(e.date) }))
      .filter(({ days }) => days >= -1) // include today + future (and just-past)
      .sort((a, b) => a.days - b.days)
      .slice(0, 3);
  }, [exams]);

  if (upcoming.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1], delay: 0.08 }}
      className="mb-4"
    >
      <div className="flex items-center gap-2 mb-2 px-1">
        <Trophy className="w-3.5 h-3.5 text-[var(--gold)]" />
        <span className="text-xs font-bold text-[var(--foreground-muted)]">آزمون‌های پیش رو</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {upcoming.map(({ exam, days }, idx) => {
          const u = urgencyStyle(days);
          const isSoonest = idx === 0;
          return (
            <motion.div
              key={exam.id}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + idx * 0.05, duration: 0.3 }}
              className={`relative rounded-xl p-3 border ${u.border} ${u.glow} bg-[var(--bg-elevated)] overflow-hidden group hover:scale-[1.02] transition-transform cursor-default`}
            >
              {/* Color stripe */}
              <div
                aria-hidden
                className="absolute top-0 right-0 bottom-0 w-1"
                style={{ backgroundColor: exam.subjectColor }}
              />

              {/* Top row: subject + urgency badge */}
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-[var(--foreground)] truncate">
                    {exam.subject}
                  </p>
                  <p className="text-[10px] text-[var(--foreground-muted)] truncate">
                    {exam.title}
                  </p>
                </div>
                <span className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold ${u.badge} ${isSoonest && days <= 3 ? 'animate-pulse' : ''}`}>
                  {u.label}
                </span>
              </div>

              {/* Bottom row: date + time */}
              <div className="flex items-center gap-2 text-[10px] text-[var(--foreground-muted)]">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatPersianDateFromISO(exam.date)}
                </span>
                <span className="w-px h-3 bg-[var(--border)]" />
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {toPersianDigits(exam.startTime)}
                </span>
              </div>

              {/* Days countdown for soonest exam */}
              {isSoonest && days >= 0 && days <= 7 && (
                <div className="mt-2 pt-2 border-t border-[var(--border)] flex items-center gap-1.5">
                  <AlertCircle className="w-3 h-3 text-[var(--warning)] shrink-0" />
                  <span className="text-[10px] text-[var(--foreground-muted)] leading-tight">
                    {days === 0
                      ? 'یادت نره - امروز!'
                      : days === 1
                        ? 'فرداست - آماده‌ای؟'
                        : `${toPersianDigits(days)} روز فرصت داری`}
                  </span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
