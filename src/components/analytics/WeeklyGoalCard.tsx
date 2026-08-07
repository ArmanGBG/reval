'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Pencil,
  Target,
  Check,
  X,
  Award,
  CalendarDays,
  Flame,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { Task } from '@/lib/types';
import {
  PERSIAN_WEEKDAYS,
  PERSIAN_WEEKDAYS_SHORT,
  toPersianDigits,
  getWeekDays,
  toISODate,
  isToday,
} from '@/lib/persian-date';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import CircularProgress from '@/components/shared/CircularProgress';

// ===== Geometry constants for the progress ring =====
const RING_SIZE = 160;
const STROKE_WIDTH = 12;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2; // 74
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// ===== Preset hour options for the editor =====
const PRESET_HOURS = [15, 20, 25, 30];

// Minutes a task contributed to study time. Falls back to the
// target time when the student hasn't logged the actual minutes yet,
// so the ring still reflects planned effort.
function taskHours(task: Task): number {
  const minutes = task.actualTimeMinutes ?? task.targetTimeMinutes ?? 0;
  return minutes / 60;
}

// Format an hour value for display: integer if whole, one decimal otherwise.
function formatHoursLabel(hours: number): string {
  if (hours === 0) return '۰';
  const rounded = Math.round(hours * 10) / 10;
  if (Number.isInteger(rounded)) return toPersianDigits(rounded);
  return toPersianDigits(rounded.toFixed(1));
}

interface DayBucket {
  date: Date;
  iso: string;
  hours: number;
  isToday: boolean;
  weekdayName: string;
  weekdayShort: string;
}

export default function WeeklyGoalCard() {
  const tasks = useAppStore((s) => s.tasks);
  const weeklyGoalHours = useAppStore((s) => s.weeklyGoalHours);
  const setWeeklyGoalHours = useAppStore((s) => s.setWeeklyGoalHours);

  const [editOpen, setEditOpen] = useState(false);
  const [draftHours, setDraftHours] = useState(weeklyGoalHours);

  // ===== Build the current Persian week (Sat → Fri) =====
  const weekDays = useMemo(() => getWeekDays(new Date()), []);
  const weekDaySet = useMemo(
    () => new Set(weekDays.map(toISODate)),
    [weekDays],
  );

  // ===== Completed tasks that fall inside this week =====
  const weekTasks = useMemo(
    () =>
      tasks.filter(
        (t) =>
          t.completed === true &&
          typeof t.date === 'string' &&
          weekDaySet.has(t.date),
      ),
    [tasks, weekDaySet],
  );

  // ===== Per-day breakdown =====
  const dailyBuckets: DayBucket[] = useMemo(() => {
    const buckets: DayBucket[] = weekDays.map((d, idx) => ({
      date: d,
      iso: toISODate(d),
      hours: 0,
      isToday: isToday(d),
      weekdayName: PERSIAN_WEEKDAYS[idx],
      weekdayShort: PERSIAN_WEEKDAYS_SHORT[idx],
    }));
    const byIso = new Map(buckets.map((b) => [b.iso, b]));
    for (const t of weekTasks) {
      const entry = byIso.get(t.date);
      if (entry) entry.hours += taskHours(t);
    }
    // Round each day to 1 decimal to avoid floating drift
    for (const b of buckets) b.hours = Math.round(b.hours * 10) / 10;
    return buckets;
  }, [weekDays, weekTasks]);

  // ===== Aggregate stats =====
  const totalHours = useMemo(
    () =>
      Math.round(
        dailyBuckets.reduce((s, d) => s + d.hours, 0) * 10,
      ) / 10,
    [dailyBuckets],
  );
  const goalProgressPct = Math.min(
    100,
    weeklyGoalHours > 0 ? (totalHours / weeklyGoalHours) * 100 : 0,
  );
  const activeDays = dailyBuckets.filter((d) => d.hours > 0).length;
  const dailyAverage =
    Math.round((totalHours / 7) * 10) / 10;
  const bestDay: DayBucket = dailyBuckets.length
    ? dailyBuckets.reduce(
        (best, d) => (d.hours > best.hours ? d : best),
        dailyBuckets[0],
      )
    : {
        date: new Date(),
        iso: '',
        hours: 0,
        isToday: false,
        weekdayName: '—',
        weekdayShort: '—',
      };
  const maxDayHours = Math.max(
    0.1,
    ...dailyBuckets.map((d) => d.hours),
  );

  // (formerly used for gold treatment on high-volume days — now monochrome)
  const exceedsThreshold = Math.max(dailyAverage, 0.001);
  void exceedsThreshold;

  // SVG stroke-dashoffset (animates from full → target)
  const ringOffset = CIRCUMFERENCE - (goalProgressPct / 100) * CIRCUMFERENCE;

  // ===== Edit dialog handlers =====
  const openEditor = () => {
    setDraftHours(weeklyGoalHours);
    setEditOpen(true);
  };
  const cancelEditor = () => setEditOpen(false);
  const saveEditor = () => {
    setWeeklyGoalHours(draftHours);
    setEditOpen(false);
  };

  return (
    <>
      <motion.section
        dir="rtl"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="surface-1 edge-highlight rounded-[var(--radius-lg)] p-4 md:p-6"
        aria-label="هدف هفتگی مطالعه"
      >
        {/* ===== Header ===== */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-[var(--radius)] flex items-center justify-center"
              style={{ backgroundColor: 'var(--accent-soft)' }}
            >
              <Target className="w-[18px] h-[18px] text-[var(--accent)]" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-bold text-[var(--foreground)] leading-tight">
                هدف هفتگی
              </h2>
              <p className="text-[11px] text-[var(--foreground-muted)] mt-0.5">
                پیشرفت مطالعه این هفته شمسی
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={openEditor}
            aria-label="ویرایش هدف هفتگی"
            className="btn-hover w-9 h-9 rounded-full surface-2 border border-[var(--border)] flex items-center justify-center text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:border-[var(--border-strong)] transition-colors"
          >
            <Pencil className="w-4 h-4" />
          </button>
        </div>

        {/* ===== Ring + Bar chart row ===== */}
        <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
          {/* Progress ring — using CircularProgress component */}
          <div className="flex flex-col items-center shrink-0">
            <CircularProgress
              value={goalProgressPct}
              size={140}
              strokeWidth={10}
              showValue={false}
              centerContent={
                <div className="flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-[var(--foreground)] tabular-nums leading-none">
                    {formatHoursLabel(totalHours)}
                  </span>
                  <span className="text-[11px] text-[var(--foreground-muted)] mt-1">
                    ساعت
                  </span>
                  <span className="text-[10px] text-[var(--foreground-subtle)] mt-2">
                    از {toPersianDigits(weeklyGoalHours)} ساعت هدف
                  </span>
                </div>
              }
            />
            {/* Progress percent chip */}
            <div
              className="mt-3 px-3 py-1 rounded-full text-[11px] font-bold tabular-nums"
              style={{
                backgroundColor: 'var(--accent-soft)',
                color: 'var(--accent)',
              }}
            >
              {toPersianDigits(Math.round(goalProgressPct))}٪ تحقق
            </div>
          </div>

          {/* 7-day bar chart */}
          <div className="flex-1 w-full">
            <div
              className="flex items-end justify-between gap-1.5 sm:gap-2 h-32 md:h-36"
              dir="rtl"
              role="list"
              aria-label="ساعت مطالعه روزانه"
            >
              {dailyBuckets.map((b, idx) => {
                const heightPct = (b.hours / maxDayHours) * 100;
                const barColor = 'var(--accent)';
                return (
                  <div
                    key={b.iso}
                    role="listitem"
                    className="flex-1 flex flex-col items-center justify-end gap-1.5 h-full min-w-0"
                  >
                    {/* Bar */}
                    <div className="relative w-full flex items-end justify-center h-full">
                      {/* Today's marker dot */}
                      {b.isToday && (
                        <span
                          className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full"
                          style={{
                            backgroundColor: 'var(--accent)',
                            boxShadow: 'none',
                          }}
                          aria-hidden="true"
                        />
                      )}
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.max(heightPct, b.hours > 0 ? 6 : 2)}%` }}
                        transition={{
                          duration: 0.6,
                          delay: 0.1 + idx * 0.05,
                          ease: 'easeOut',
                        }}
                        className="w-full max-w-[28px] rounded-t-md"
                        style={{
                          backgroundColor: barColor,
                          boxShadow: 'none',
                          opacity: b.hours > 0 ? 1 : 0.25,
                          minHeight: b.hours > 0 ? 6 : 2,
                        }}
                        aria-label={`${b.weekdayName}: ${formatHoursLabel(b.hours)} ساعت`}
                      />
                    </div>
                    {/* Weekday short name */}
                    <span
                      className={`text-[10px] sm:text-[11px] truncate ${
                        b.isToday
                          ? 'text-[var(--accent)] font-bold'
                          : 'text-[var(--foreground-muted)]'
                      }`}
                    >
                      {b.weekdayShort}
                    </span>
                    {/* Hour value (hidden on very small screens) */}
                    <span
                      className="text-[9px] sm:text-[10px] text-[var(--foreground-subtle)] tabular-nums leading-none"
                    >
                      {b.hours > 0 ? formatHoursLabel(b.hours) : '—'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ===== Stats row ===== */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-5 pt-5 border-t border-[var(--border)]">
          <StatChip
            icon={<CalendarDays className="w-3.5 h-3.5" />}
            label="میانگین روزانه"
            value={`${formatHoursLabel(dailyAverage)} ساعت`}
          />
          <StatChip
            icon={<Award className="w-3.5 h-3.5" />}
            label="بهترین روز"
            value={
              bestDay.hours > 0
                ? `${bestDay.weekdayName} · ${formatHoursLabel(bestDay.hours)}`
                : '—'
            }
          />
          <StatChip
            icon={<Flame className="w-3.5 h-3.5" />}
            label="روزهای فعال"
            value={`${toPersianDigits(activeDays)} از ${toPersianDigits(7)}`}
          />
        </div>
      </motion.section>

      {/* ===== Edit Goal Dialog ===== */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent
          dir="rtl"
          className="sm:max-w-md surface-2 border-[var(--border-strong)]"
        >
          <DialogHeader>
            <DialogTitle className="text-right text-[var(--foreground)]">
              ویرایش هدف هفتگی
            </DialogTitle>
            <DialogDescription className="text-right text-[var(--foreground-muted)]">
              ساعت مطالعه هدف در هفته را تنظیم کنید
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Current value display */}
            <div className="flex items-center justify-center gap-2">
              <span className="text-4xl font-bold text-[var(--foreground)] tabular-nums">
                {toPersianDigits(draftHours)}
              </span>
              <span className="text-sm text-[var(--foreground-muted)] mt-2">
                ساعت در هفته
              </span>
            </div>

            {/* Slider */}
            <div className="px-1">
              <Slider
                dir="ltr"
                min={10}
                max={40}
                step={1}
                value={[draftHours]}
                onValueChange={(val) =>
                  setDraftHours(Array.isArray(val) ? val[0] : val)
                }
                className="[&_[data-slot=slider-track]]:bg-[rgba(255,255,255,0.08)] [&_[data-slot=slider-range]]:bg-[var(--accent)] [&_[data-slot=slider-thumb]]:border-[var(--accent)] [&_[data-slot=slider-thumb]]:bg-[var(--bg-elevated)]"
                aria-label="ساعت هدف هفتگی"
              />
              <div className="flex justify-between mt-2 text-[10px] text-[var(--foreground-subtle)] tabular-nums">
                <span>{toPersianDigits(10)}</span>
                <span>{toPersianDigits(25)}</span>
                <span>{toPersianDigits(40)}</span>
              </div>
            </div>

            {/* Preset buttons */}
            <div className="flex flex-wrap gap-2 justify-center">
              {PRESET_HOURS.map((h) => {
                const active = draftHours === h;
                return (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setDraftHours(h)}
                    className={`btn-hover px-4 py-2 rounded-full text-sm font-medium transition-all min-h-[40px] border tabular-nums ${
                      active
                        ? 'bg-[var(--accent)] text-[var(--bg-deep)] border-[var(--accent)] shadow-[0_4px_12px_-2px_var(--accent-glow)]'
                        : 'surface-1 text-[var(--foreground-muted)] border-[var(--border)] hover:border-[var(--border-strong)] hover:text-[var(--foreground)]'
                    }`}
                  >
                    {toPersianDigits(h)} ساعت
                  </button>
                );
              })}
            </div>
          </div>

          <DialogFooter className="flex-row gap-2 sm:justify-start">
            <button
              type="button"
              onClick={saveEditor}
              className="btn-hover inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-bold bg-[var(--accent)] text-[var(--bg-deep)] border border-[var(--accent)] shadow-[0_4px_12px_-2px_var(--accent-glow)] min-h-[44px]"
            >
              <Check className="w-4 h-4" />
              ذخیره
            </button>
            <button
              type="button"
              onClick={cancelEditor}
              className="btn-hover inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-medium surface-1 text-[var(--foreground-muted)] border border-[var(--border)] hover:border-[var(--border-strong)] hover:text-[var(--foreground)] min-h-[44px]"
            >
              <X className="w-4 h-4" />
              انصراف
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ===== Small stat chip used in the stats row =====
function StatChip({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="surface-2 rounded-[var(--radius)] px-3 py-2.5 flex flex-col gap-1 min-w-0">
      <div className="flex items-center gap-1.5 text-[var(--foreground-muted)]">
        <span className="shrink-0">{icon}</span>
        <span className="text-[10px] sm:text-[11px] truncate">{label}</span>
      </div>
      <span className="text-xs sm:text-sm font-bold text-[var(--foreground)] tabular-nums truncate">
        {value}
      </span>
    </div>
  );
}
