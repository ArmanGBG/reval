'use client';

import { useMemo } from 'react';
import { Calendar } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import {
  PERSIAN_MONTHS,
  PERSIAN_WEEKDAYS_SHORT,
  toPersianDigits,
  toJalali,
  toISODate,
  minutesToHoursLabel,
} from '@/lib/persian-date';

// ===== StudyHeatmap =====
// A GitHub-style contribution graph showing study activity over the
// past 3 months (2 months on mobile). Each square represents one day,
// colored by study intensity derived from completed tasks.
// ================================================================

// Day labels (right side): Sat–Fri
const DAY_LABELS = PERSIAN_WEEKDAYS_SHORT; // ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج']

// Color levels by study intensity — single-hue accent scale
function getSquareColor(minutes: number): string {
  if (minutes === 0) return 'var(--bg-elevated)';
  if (minutes <= 30) return 'rgba(94, 106, 210, 0.18)';
  if (minutes <= 60) return 'rgba(94, 106, 210, 0.35)';
  if (minutes <= 120) return 'rgba(94, 106, 210, 0.6)';
  return 'var(--accent)'; // 120+ min
}

function getSquareBorder(minutes: number): string {
  if (minutes === 0) return '1px solid var(--border)';
  if (minutes <= 30) return '1px solid rgba(94, 106, 210, 0.2)';
  if (minutes <= 60) return '1px solid rgba(94, 106, 210, 0.3)';
  if (minutes <= 120) return '1px solid rgba(94, 106, 210, 0.4)';
  return '1px solid rgba(94, 106, 210, 0.55)';
}

export default function StudyHeatmap() {
  const tasks = useAppStore((s) => s.tasks);

  // Compute study minutes per day from completed tasks
  const { dayData, weeks, monthLabels, totalWeeks } = useMemo(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    // Determine number of months based on viewport width
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const monthsToShow = isMobile ? 2 : 3;

    // Calculate start date (start from Saturday of the week that begins the period)
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - (monthsToShow * 30 + 6));
    // Snap to the next Saturday from startDate
    const startDay = startDate.getDay(); // 0=Sun, 6=Sat
    const daysToSaturday = startDay === 6 ? 0 : (6 - startDay + 7) % 7;
    // Actually we want to go back to the previous Saturday
    const daysSinceSaturday = startDay === 6 ? 0 : (startDay + 1) % 7;
    startDate.setDate(startDate.getDate() + (7 - daysSinceSaturday) % 7 - 7);
    // Simpler: find Saturday on or before startDate
    const jsDay = startDate.getDay();
    const satOffset = jsDay === 6 ? 0 : -(jsDay + 1);
    startDate.setDate(startDate.getDate() + satOffset);
    startDate.setHours(0, 0, 0, 0);

    // Build day→minutes map from completed tasks
    const dayMinutesMap: Record<string, number> = {};
    for (const task of tasks) {
      if (task.completed !== true) continue;
      const minutes = task.status === 'COMPLETED' ? (task.actualTimeMinutes ?? 0) : 0;
      if (minutes <= 0) continue;
      const dayKey = task.date.slice(0, 10); // YYYY-MM-DD
      dayMinutesMap[dayKey] = (dayMinutesMap[dayKey] ?? 0) + minutes;
    }

    // Generate weeks array (each week = 7 days, Sat–Fri)
    const weeks: { date: Date; minutes: number; isoDate: string }[][] = [];
    const monthLabels: { label: string; weekIndex: number }[] = [];
    let current = new Date(startDate);
    let weekIndex = 0;
    let lastSeenMonth = -1;

    while (current <= today || weekIndex < 2) {
      const week: { date: Date; minutes: number; isoDate: string }[] = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(current);
        d.setDate(current.getDate() + i);
        const iso = toISODate(d);
        week.push({
          date: d,
          minutes: dayMinutesMap[iso] ?? 0,
          isoDate: iso,
        });
        // Track month labels (show label when month changes)
        const j = toJalali(d);
        if (j.jm !== lastSeenMonth && i === 0) {
          monthLabels.push({
            label: PERSIAN_MONTHS[j.jm - 1],
            weekIndex,
          });
          lastSeenMonth = j.jm;
        }
      }
      weeks.push(week);
      current.setDate(current.getDate() + 7);
      weekIndex++;
    }

    return {
      dayData: dayMinutesMap,
      weeks,
      monthLabels,
      totalWeeks: weeks.length,
    };
  }, [tasks]);

  // Compute total study minutes for the period
  const totalMinutes = useMemo(() => {
    let sum = 0;
    for (const week of weeks) {
      for (const day of week) {
        sum += day.minutes;
      }
    }
    return sum;
  }, [weeks]);

  // Active days count
  const activeDays = useMemo(() => {
    let count = 0;
    for (const week of weeks) {
      for (const day of week) {
        if (day.minutes > 0) count++;
      }
    }
    return count;
  }, [weeks]);

  // Legend items
  const legendItems = [
    { color: 'var(--bg-elevated)', border: '1px solid var(--border)', label: 'بدون مطالعه' },
    { color: 'rgba(94, 106, 210, 0.18)', border: '1px solid rgba(94, 106, 210, 0.2)', label: 'کم' },
    { color: 'rgba(94, 106, 210, 0.35)', border: '1px solid rgba(94, 106, 210, 0.3)', label: 'متوسط' },
    { color: 'rgba(94, 106, 210, 0.6)', border: '1px solid rgba(94, 106, 210, 0.4)', label: 'زیاد' },
    { color: 'var(--accent)', border: '1px solid rgba(94, 106, 210, 0.55)', label: 'خیلی زیاد' },
  ];

  return (
    <div
      className="rounded-[var(--radius-lg)] border border-[var(--border)] card-hover edge-highlight overflow-hidden"
      style={{ backgroundColor: 'var(--bg-elevated)' }}
    >
      <div className="p-4 md:p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-[var(--radius-sm)] flex items-center justify-center float-subtle"
              style={{
                backgroundColor: 'var(--accent-soft)',
                border: '1px solid var(--border-strong)',
              }}
            >
              <Calendar className="w-4 h-4 text-[var(--accent)]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--foreground)]">نقشه مطالعه</h3>
              <p className="text-[10px] text-[var(--foreground-muted)]">
                {toPersianDigits(activeDays)} روز فعال از {toPersianDigits(weeks.length * 7)} روز
              </p>
            </div>
          </div>
          <div className="text-[10px] font-medium px-2 py-1 rounded-md text-[var(--accent)]" style={{ backgroundColor: 'var(--accent-soft)' }}>
            {minutesToHoursLabel(totalMinutes)}
          </div>
        </div>

        {/* Month labels */}
        <div className="flex mb-1.5" dir="ltr" style={{ paddingRight: '1.5rem' }}>
          {monthLabels.map((ml, i) => {
            // Calculate left offset based on week index
            const nextWeekIndex = i < monthLabels.length - 1 ? monthLabels[i + 1].weekIndex : totalWeeks;
            const spanWeeks = nextWeekIndex - ml.weekIndex;
            return (
              <div
                key={`${ml.label}-${ml.weekIndex}`}
                className="text-[9px] text-[var(--foreground-muted)] font-medium whitespace-nowrap"
                style={{
                  width: `${(spanWeeks / totalWeeks) * 100}%`,
                  textAlign: 'start',
                }}
              >
                {ml.label}
              </div>
            );
          })}
        </div>

        {/* Heatmap grid */}
        <div className="flex gap-0.5" dir="ltr">
          {/* Day labels on the right side (for LTR flex, this is actually at the end) */}
          <div className="flex flex-col gap-0.5 shrink-0" dir="rtl">
            {DAY_LABELS.map((label, i) => (
              <div
                key={i}
                className="w-5 h-[11px] flex items-center justify-center text-[8px] text-[var(--foreground-subtle)] font-medium"
              >
                {/* Show only every other day label to save space */}
                {i % 2 === 0 ? label : ''}
              </div>
            ))}
          </div>

          {/* Weeks columns */}
          <div className="flex gap-[2px] flex-1 overflow-x-auto no-scrollbar">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[2px]">
                {week.map((day, di) => {
                  const isToday = toISODate(new Date()) === day.isoDate;
                  const jalali = toJalali(day.date);
                  const tooltipText = day.minutes > 0
                    ? `${toPersianDigits(jalali.jd)} ${PERSIAN_MONTHS[jalali.jm - 1]}: ${minutesToHoursLabel(day.minutes)}`
                    : `${toPersianDigits(jalali.jd)} ${PERSIAN_MONTHS[jalali.jm - 1]}: بدون مطالعه`;

                  return (
                    <div
                      key={di}
                      title={tooltipText}
                      className="w-[11px] h-[11px] rounded-[2px] cursor-default transition-all duration-150"
                      style={{
                        backgroundColor: getSquareColor(day.minutes),
                        border: isToday
                          ? '1.5px solid var(--accent)'
                          : getSquareBorder(day.minutes),
                        boxShadow: 'none',
                      }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between mt-3" dir="ltr">
          <span className="text-[9px] text-[var(--foreground-subtle)]">کمتر</span>
          <div className="flex gap-[3px]">
            {legendItems.map((item, i) => (
              <div
                key={i}
                className="w-[11px] h-[11px] rounded-[2px]"
                style={{
                  backgroundColor: item.color,
                  border: item.border,
                }}
                title={item.label}
              />
            ))}
          </div>
          <span className="text-[9px] text-[var(--foreground-subtle)]">بیشتر</span>
        </div>
      </div>
    </div>
  );
}
