'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import {
  PERSIAN_WEEKDAYS,
  PERSIAN_MONTHS,
  toJalali,
  jalaliToDate,
  getPersianWeekday,
  toISODate,
  isSameDay,
  isToday,
  getDaysInJalaliMonth,
  toPersianDigits,
} from '@/lib/persian-date';
import { parseLocalDate } from '@/lib/student-utils';

interface PersianCalendarProps {
  selectedDate: string; // ISO date string
  onSelect: (dateStr: string) => void;
  // Optional: tasks count per date for indicators
  taskCountByDate?: Record<string, number>;
  // Optional: completed count per date
  completedCountByDate?: Record<string, number>;
}

export function PersianCalendar({
  selectedDate,
  onSelect,
  taskCountByDate = {},
  completedCountByDate = {},
}: PersianCalendarProps) {
  const { checkDateRollover } = useAppStore();
  const [currentLocalToday, setCurrentLocalToday] = useState(() => new Date());
  const initialJalali = toJalali(currentLocalToday);
  const [viewYear, setViewYear] = useState(initialJalali.jy);
  const [viewMonth, setViewMonth] = useState(initialJalali.jm); // 1-12

  // Sync view when selectedDate changes (e.g. from parent or date rollover)
  useEffect(() => {
    const selectedJalali = toJalali(parseLocalDate(selectedDate));
    setViewYear(selectedJalali.jy);
    setViewMonth(selectedJalali.jm);
  }, [selectedDate]);

  // Handle Tab Visibility / Focus / Stale State (Midnight Rollover)
  useEffect(() => {
    const syncTodayAndRollover = () => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
        return;
      }

      // Re-calculate local browser time strictly relying on local Date (not UTC)
      const now = new Date();
      const currentIso = toISODate(now);
      const prevIso = toISODate(currentLocalToday);

      if (currentIso !== prevIso) {
        setCurrentLocalToday(now);
      }

      // Trigger Zustand state rollover check
      checkDateRollover();
    };

    // Run check on mount
    syncTodayAndRollover();

    document.addEventListener('visibilitychange', syncTodayAndRollover);
    window.addEventListener('focus', syncTodayAndRollover);

    // Periodic check every 30 seconds for foreground midnight transition
    const interval = setInterval(syncTodayAndRollover, 30000);

    return () => {
      document.removeEventListener('visibilitychange', syncTodayAndRollover);
      window.removeEventListener('focus', syncTodayAndRollover);
      clearInterval(interval);
    };
  }, [checkDateRollover, currentLocalToday]);

  // Generate calendar grid for the month
  const calendarDays = useMemo(() => {
    const daysInMonth = getDaysInJalaliMonth(viewYear, viewMonth);
    const firstDay = jalaliToDate(viewYear, viewMonth, 1);
    const firstWeekday = getPersianWeekday(firstDay); // 0-6 (Sat=0)

    const days: ({ date: Date; dateStr: string; day: number; isCurrentMonth: true } | null)[] = [];

    // Empty cells before the first day
    for (let i = 0; i < firstWeekday; i++) {
      days.push(null);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = jalaliToDate(viewYear, viewMonth, day);
      days.push({
        date,
        dateStr: toISODate(date),
        day,
        isCurrentMonth: true,
      });
    }

    return days;
  }, [viewYear, viewMonth]);

  const selectedDateObj = parseLocalDate(selectedDate);
  const isSelectedMonth =
    toJalali(selectedDateObj).jy === viewYear && toJalali(selectedDateObj).jm === viewMonth;

  const goToPrevMonth = () => {
    if (viewMonth === 1) {
      setViewMonth(12);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const goToNextMonth = () => {
    if (viewMonth === 12) {
      setViewMonth(1);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const goToToday = () => {
    const now = new Date();
    setCurrentLocalToday(now);
    const nowJalali = toJalali(now);
    setViewYear(nowJalali.jy);
    setViewMonth(nowJalali.jm);
    onSelect(toISODate(now));
  };

  const currentTodayISODate = toISODate(currentLocalToday);

  return (
    <div className="surface-1 rounded-2xl p-3">
      {/* Header: month name + nav */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={goToPrevMonth}
          className="icon-btn w-7 h-7 rounded-lg flex items-center justify-center text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
          aria-label="ماه قبل"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            className="text-sm font-bold text-[var(--foreground)] hover:text-[var(--accent)] transition-colors"
            title="برو به امروز"
          >
            {PERSIAN_MONTHS[viewMonth - 1]} {toPersianDigits(viewYear)}
          </button>
          {selectedDate !== currentTodayISODate && (
            <button
              onClick={goToToday}
              className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-[var(--bg-deep)] transition-colors"
              title="انتقال به تاریخ امروز"
            >
              امروز
            </button>
          )}
        </div>
        <button
          onClick={goToNextMonth}
          className="icon-btn w-7 h-7 rounded-lg flex items-center justify-center text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
          aria-label="ماه بعد"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {PERSIAN_WEEKDAYS.map((day) => (
          <div
            key={day}
            className="text-center text-[9px] font-medium text-[var(--foreground-subtle)] py-1 truncate"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((dayInfo, idx) => {
          if (!dayInfo) {
            return <div key={`empty-${idx}`} />;
          }
          const isSelected = dayInfo.dateStr === selectedDate;
          const isTodayCell = dayInfo.dateStr === currentTodayISODate;
          const taskCount = taskCountByDate[dayInfo.dateStr] || 0;
          const completedCount = completedCountByDate[dayInfo.dateStr] || 0;
          const allDone = taskCount > 0 && completedCount === taskCount;

          return (
            <button
              key={dayInfo.dateStr}
              onClick={() => onSelect(dayInfo.dateStr)}
              className={`relative aspect-square rounded-lg text-xs font-medium transition-all btn-hover flex flex-col items-center justify-center ${
                isSelected
                  ? 'bg-[var(--accent)] text-[var(--bg-deep)] font-bold'
                  : isTodayCell
                    ? 'bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent)]/30'
                    : 'text-[var(--foreground-muted)] hover:bg-[var(--bg-overlay)] hover:text-[var(--foreground)]'
              }`}
            >
              <span>{toPersianDigits(dayInfo.day)}</span>
              {/* Task indicator dot */}
              {taskCount > 0 && !isSelected && (
                <span
                  className={`absolute bottom-1 w-1 h-1 rounded-full ${
                    allDone ? 'bg-[var(--accent)]' : 'bg-[var(--foreground-subtle)]'
                  }`}
                />
              )}
              {/* Selected day with tasks: show count */}
              {isSelected && taskCount > 0 && (
                <span className="absolute bottom-0.5 text-[8px] opacity-80">
                  {toPersianDigits(taskCount)}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
