'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, Clock, Target, Award, Calendar, Flame, Sparkles, ChevronLeft,
} from 'lucide-react';
import type { Task } from '@/lib/types';
import {
  toPersianDigits,
  minutesToHoursLabel,
  getWeekDays,
  getPersianWeekdayName,
  formatPersianDateShort,
} from '@/lib/persian-date';

// =================================================================
// WeeklyReviewCard
// A reflective summary of the past 7 days shown on the student
// dashboard. Designed to motivate by surfacing concrete achievements
// (total hours, tasks completed, streak, top subject, best day).
//
// Renders once per week — automatically dismissible after 7 days from
// the last dismissed date via localStorage. Always visible on Fridays
// (Persian weekend) to encourage weekly planning.
// =================================================================

interface WeeklyReviewCardProps {
  tasks: Task[];
  streakDays: number;
}

const STORAGE_KEY = 'reval:weekly-review-dismissed';

function getDismissedWeekStart(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function setDismissedWeekStart(weekStartISO: string) {
  try {
    localStorage.setItem(STORAGE_KEY, weekStartISO);
  } catch {
    // ignore
  }
}

function startOfWeekISO(): string {
  const today = new Date();
  const weekDays = getWeekDays(today);
  return weekDays[0].toISOString().slice(0, 10);
}

export default function WeeklyReviewCard({ tasks, streakDays }: WeeklyReviewCardProps) {
  const [dismissed, setDismissed] = useState<string | null>(() => getDismissedWeekStart());

  // ----- Determine if the card should be shown this week -----
  const showThisWeek = useMemo(() => {
    const thisWeekStart = startOfWeekISO();
    return dismissed !== thisWeekStart;
  }, [dismissed]);

  // ----- Compute weekly stats from the last 7 days of tasks -----
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 6);
    weekAgo.setHours(0, 0, 0, 0);

    const weekTasks = tasks.filter((t) => {
      const d = new Date(t.date);
      return d >= weekAgo && d <= today;
    });

    const completed = weekTasks.filter((t) => t.completed === true);
    const skipped = weekTasks.filter((t) => t.completed === false);
    const totalMinutes = completed.reduce(
      (sum, t) => sum + (t.actualTimeMinutes ?? t.targetTimeMinutes ?? 0),
      0,
    );
    const totalTests = completed.reduce(
      (sum, t) => sum + (t.actualTestCount ?? t.targetTestCount ?? 0),
      0,
    );
    const completionRate = weekTasks.length === 0
      ? 0
      : Math.round((completed.length / weekTasks.length) * 100);

    // Per-day study minutes for the last 7 days
    const dayBuckets: { date: Date; minutes: number; label: string }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const next = new Date(d);
      next.setDate(d.getDate() + 1);
      const minutes = completed
        .filter((t) => {
          const td = new Date(t.date);
          return td >= d && td < next;
        })
        .reduce((sum, t) => sum + (t.actualTimeMinutes ?? t.targetTimeMinutes ?? 0), 0);
      dayBuckets.push({
        date: d,
        minutes,
        label: getPersianWeekdayName(d),
      });
    }

    // Top subject by total minutes
    const subjectMinutes: Record<string, number> = {};
    for (const t of completed) {
      const m = t.actualTimeMinutes ?? t.targetTimeMinutes ?? 0;
      subjectMinutes[t.subject] = (subjectMinutes[t.subject] ?? 0) + m;
    }
    const topSubject = Object.entries(subjectMinutes).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

    // Best day (most minutes)
    const bestDay = [...dayBuckets].sort((a, b) => b.minutes - a.minutes)[0];

    return {
      completedCount: completed.length,
      skippedCount: skipped.length,
      totalTasks: weekTasks.length,
      totalMinutes,
      totalTests,
      completionRate,
      dayBuckets,
      topSubject,
      bestDay,
    };
  }, [tasks]);

  // Don't render if dismissed this week or if no activity at all
  if (!showThisWeek) return null;
  if (stats.totalTasks === 0 && stats.totalMinutes === 0) return null;

  const maxDayMinutes = Math.max(60, ...stats.dayBuckets.map((d) => d.minutes));

  const handleDismiss = () => {
    const weekStart = startOfWeekISO();
    setDismissedWeekStart(weekStart);
    setDismissed(weekStart);
  };

  return (
    <WeeklyReviewContent
      stats={stats}
      streakDays={streakDays}
      maxDayMinutes={maxDayMinutes}
      onDismiss={handleDismiss}
    />
  );
}

// ----- Inner content (re-mounts on dismiss via key) -----
type WeeklyStats = {
  completedCount: number;
  skippedCount: number;
  totalTasks: number;
  totalMinutes: number;
  totalTests: number;
  completionRate: number;
  dayBuckets: { date: Date; minutes: number; label: string }[];
  topSubject: string | null;
  bestDay: { date: Date; minutes: number; label: string } | undefined;
};

function WeeklyReviewContent({
  stats,
  streakDays,
  maxDayMinutes,
  onDismiss,
}: {
  stats: WeeklyStats;
  streakDays: number;
  maxDayMinutes: number;
  onDismiss: () => void;
}) {
  const rangeStart = stats.dayBuckets[0]?.date;
  const rangeEnd = stats.dayBuckets[6]?.date;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="relative rounded-[var(--radius-xl)] overflow-hidden mb-5 border border-[var(--border-strong)] gradient-border"
      style={{
        background:
          'linear-gradient(135deg, var(--bg-elevated) 0%, var(--bg-elevated) 60%, var(--accent-soft) 100%)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
      }}
    >
      {/* Decorative accent radial (subtle) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 80% at 90% 0%, var(--accent-soft), transparent 60%)',
        }}
      />

      <div className="relative z-10 p-4 md:p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4 gap-2">
          <div className="flex items-center gap-2.5">
            <div
              className="w-10 h-10 rounded-[var(--radius)] flex items-center justify-center shrink-0"
              style={{
                backgroundColor: 'var(--accent-soft)',
                border: '1px solid var(--border-strong)',
              }}
            >
              <Sparkles className="w-5 h-5 text-[var(--accent)]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--foreground)] flex items-center gap-1.5">
                مرور هفته
                <span className="text-[10px] font-medium text-[var(--accent)] bg-[var(--accent-soft)] px-1.5 py-0.5 rounded-md border border-[var(--border-strong)]">
                  ۷ روز گذشته
                </span>
              </h3>
              {rangeStart && rangeEnd && (
                <p className="text-[11px] text-[var(--foreground-muted)] mt-0.5 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatPersianDateShort(rangeStart)} تا {formatPersianDateShort(rangeEnd)}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onDismiss}
            className="text-[var(--foreground-subtle)] hover:text-[var(--foreground)] text-xs flex items-center gap-0.5 transition-colors"
            aria-label="بستن"
          >
            بستن
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* KPI grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
          <KpiPill
            icon={<Clock className="w-3.5 h-3.5" />}
            label="مجموع ساعت"
            value={minutesToHoursLabel(stats.totalMinutes)}
            accent="var(--accent)"
          />
          <KpiPill
            icon={<Target className="w-3.5 h-3.5" />}
            label="تسک انجام‌شده"
            value={`${toPersianDigits(stats.completedCount)} از ${toPersianDigits(stats.totalTasks)}`}
            accent="var(--accent)"
          />
          <KpiPill
            icon={<TrendingUp className="w-3.5 h-3.5" />}
            label="نرخ انجام"
            value={`${toPersianDigits(stats.completionRate)}٪`}
            accent={stats.completionRate >= 75 ? 'var(--success)' : stats.completionRate >= 50 ? 'var(--accent)' : 'var(--danger)'}
          />
          <KpiPill
            icon={<Award className="w-3.5 h-3.5" />}
            label="تست زده‌شده"
            value={toPersianDigits(stats.totalTests)}
            accent="var(--accent)"
          />
        </div>

        {/* Daily bar chart */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] text-[var(--foreground-muted)] font-medium">روند روزانه</span>
            {stats.bestDay && stats.bestDay.minutes > 0 && (
              <span className="text-[10px] text-[var(--accent)] bg-[var(--accent-soft)] px-1.5 py-0.5 rounded-md border border-[var(--border-strong)]">
                بهترین روز: {stats.bestDay.label}
              </span>
            )}
          </div>
          <div className="flex items-end justify-between gap-1.5 h-20" dir="ltr">
            {stats.dayBuckets.map((d, i) => {
              const heightPct = Math.max(4, (d.minutes / maxDayMinutes) * 100);
              const isBest = d.date.toDateString() === stats.bestDay?.date.toDateString() && d.minutes > 0;
              return (
                <div key={i} className="flex flex-col items-center gap-1 flex-1 min-w-0">
                  <div className="w-full h-16 flex items-end">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${heightPct}%` }}
                      transition={{ duration: 0.5, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                      className="w-full rounded-t-md min-h-[3px]"
                      style={{
                        backgroundColor: isBest ? 'var(--accent)' : 'var(--accent-soft)',
                        opacity: isBest ? 1 : 0.55,
                      }}
                      title={`${d.label}: ${minutesToHoursLabel(d.minutes)}`}
                    />
                  </div>
                  <span className="text-[9px] text-[var(--foreground-subtle)] truncate w-full text-center">
                    {d.label.slice(0, 2)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Achievements row */}
        <div className="flex flex-wrap gap-1.5">
          {stats.topSubject && (
            <AchievementBadge icon={<Award className="w-3 h-3" />} label={`بیشترین زمان: ${stats.topSubject}`} />
          )}
          {streakDays > 0 && (
            <AchievementBadge icon={<Flame className="w-3 h-3" />} label={`${toPersianDigits(streakDays)} روز پیاپی`} gold />
          )}
          {stats.completionRate >= 75 && stats.totalTasks > 0 && (
            <AchievementBadge icon={<Sparkles className="w-3 h-3" />} label="هفته‌ی موفق!" gold />
          )}
          {stats.skippedCount === 0 && stats.totalTasks > 0 && (
            <AchievementBadge icon={<Target className="w-3 h-3" />} label="بدون تسک رد شده" />
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ----- Helpers -----

function KpiPill({
  icon, label, value, accent,
}: { icon: React.ReactNode; label: string; value: string; accent: string }) {
  return (
    <div
      className="rounded-[var(--radius)] p-2.5 border border-[var(--border)] flex items-center gap-2"
      style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}
    >
      <div
        className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${accent}1a`, color: accent }}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] text-[var(--foreground-muted)] truncate">{label}</div>
        <div className="text-xs font-bold text-[var(--foreground)] truncate">{value}</div>
      </div>
    </div>
  );
}

function AchievementBadge({
  icon, label, gold = false,
}: { icon: React.ReactNode; label: string; gold?: boolean }) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      className={`text-[10px] px-2 py-1 rounded-md flex items-center gap-1 font-medium ${
        gold
          ? 'bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--border-strong)]'
          : 'bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--border)]'
      }`}
    >
      {icon}
      {label}
    </motion.span>
  );
}
