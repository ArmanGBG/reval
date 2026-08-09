/**
 * Analytics aggregation helpers — pure functions that turn a Task[] into the
 * shape the charts in AnalyticsView consume. Replaces the old MOCK_*_DATA
 * constants with real, time-filtered, field-filtered task data.
 *
 * All functions are side-effect-free and deterministic given the same inputs.
 */

import type { Task, FieldType, ActivityType } from '@/lib/types';
import {
  PERSIAN_WEEKDAYS,
  toISODate,
  getWeekDays,
  getTodayJalali,
  getFirstDayOfJalaliMonth,
  getDaysInJalaliMonth,
} from '@/lib/persian-date';

const isCompletedTask = (task: Task) => task.status === 'COMPLETED' || (task.status === undefined && task.completed === true);

// ===== Filter types (mirror AnalyticsView's local types) =====
export type TimeFilter = 'روزانه' | 'هفته جاری' | 'ماهانه' | 'بازه دلخواه';
export type FieldFilter = 'همه' | 'کنکوری' | 'نهایی';

// ===== Date-range resolution =====
/**
 * Returns the [startDate, endDate] ISO strings (inclusive) for a given
 * TimeFilter. For "بازه دلخواه" returns null (no date restriction).
 */
export function resolveDateRange(timeFilter: TimeFilter, now: Date = new Date()): { start: string; end: string } | null {
  if (timeFilter === 'بازه دلخواه') return null;
  if (timeFilter === 'روزانه') {
    const today = toISODate(now);
    return { start: today, end: today };
  }
  if (timeFilter === 'هفته جاری') {
    const days = getWeekDays(now);
    return { start: toISODate(days[0]), end: toISODate(days[6]) };
  }
  // ماهانه — current Jalali month
  const j = getTodayJalali();
  const first = getFirstDayOfJalaliMonth(j.jy, j.jm);
  const last = new Date(first);
  last.setDate(last.getDate() + getDaysInJalaliMonth(j.jy, j.jm) - 1);
  return { start: toISODate(first), end: toISODate(last) };
}

// ===== Task filtering =====
/**
 * Filter tasks by the user's selected time + field filters, plus the
 * "detailsCompleted !== false" guard so incomplete drafts don't pollute
 * analytics.
 */
export function filterTasksForReport(
  tasks: Task[],
  timeFilter: TimeFilter,
  fieldFilter: FieldFilter,
  now: Date = new Date(),
  customRange?: { start: string; end: string } | null,
): Task[] {
  const range = timeFilter === 'بازه دلخواه' ? customRange ?? null : resolveDateRange(timeFilter, now);
  return tasks.filter((t) => {
    if (t.status === 'DRAFT' || (t.status === undefined && t.detailsCompleted === false)) return false;
    if (range) {
      if (t.date < range.start || t.date > range.end) return false;
    }
    if (fieldFilter === 'کنکوری' && t.fieldType !== 'کنکور') return false;
    if (fieldFilter === 'نهایی' && t.fieldType !== 'نهایی') return false;
    return true;
  });
}

// ===== KPI totals =====
export interface KpiTotals {
  /** Total actual study hours from completed tasks */
  totalHours: number;
  /** Total actual test count from completed tasks */
  totalTests: number;
  /** Adherence rate: completed / total * 100 (rounded) */
  adherenceRate: number;
  /** Average daily hours across the active days in the range */
  dailyAvgHours: number;
}

export function computeKpiTotals(tasks: Task[]): KpiTotals {
  // Only completed tasks contribute actual time/tests
  const completed = tasks.filter(isCompletedTask);
  const totalMinutes = completed.reduce((sum, t) => sum + (t.actualTimeMinutes ?? 0), 0);
  const totalHours = totalMinutes / 60;
  const totalTests = completed.reduce((sum, t) => sum + (t.actualTestCount ?? 0), 0);
  const totalTasks = tasks.length;
  const completedCount = completed.length;
  const adherenceRate = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;
  // Daily average: divide by the number of UNIQUE active days (any task), not 7
  const activeDays = new Set(tasks.map((t) => t.date));
  const dailyAvgHours = activeDays.size > 0 ? totalHours / activeDays.size : 0;
  return { totalHours, totalTests, adherenceRate, dailyAvgHours };
}

// ===== Daily trend chart data =====
export interface DailyDatum {
  day: string; // Persian weekday name (شنبه..جمعه) OR date label for monthly
  hours: number; // total actual hours
  tests: number; // total actual tests
}

/**
 * Build the "روند روزانه" bar-chart dataset.
 *
 * - روزانه / هفته جاری: 7 bars, one per weekday, labeled شنبه..جمعه
 * - ماهانه: 6 bars, each = 5-day bucket of the current Jalali month
 * - بازه دلخواه: last 14 days, one bar per day (labeled with day-of-month)
 */
export function buildDailyTrend(tasks: Task[], timeFilter: TimeFilter, now: Date = new Date()): DailyDatum[] {
  const completed = tasks.filter(isCompletedTask);

  if (timeFilter === 'روزانه' || timeFilter === 'هفته جاری') {
    // 7 bars by weekday
    const weekDays = getWeekDays(now);
    return PERSIAN_WEEKDAYS.map((dayName, i) => {
      const dayStr = toISODate(weekDays[i]);
      const dayTasks = completed.filter((t) => t.date === dayStr);
      const minutes = dayTasks.reduce((s, t) => s + (t.actualTimeMinutes ?? 0), 0);
      const tests = dayTasks.reduce((s, t) => s + (t.actualTestCount ?? 0), 0);
      return { day: dayName, hours: Math.round((minutes / 60) * 10) / 10, tests };
    });
  }

  if (timeFilter === 'ماهانه') {
    // Bucket the current Jalali month into 6 parts of ~5 days each
    const j = getTodayJalali();
    const daysInMonth = getDaysInJalaliMonth(j.jy, j.jm);
    const first = getFirstDayOfJalaliMonth(j.jy, j.jm);
    const bucketCount = 6;
    const bucketSize = Math.ceil(daysInMonth / bucketCount);
    const buckets: DailyDatum[] = [];
    for (let b = 0; b < bucketCount; b++) {
      const startDay = b * bucketSize + 1;
      const endDay = Math.min(startDay + bucketSize - 1, daysInMonth);
      if (startDay > daysInMonth) break;
      const start = new Date(first);
      start.setDate(first.getDate() + startDay - 1);
      const end = new Date(first);
      end.setDate(first.getDate() + endDay - 1);
      const startStr = toISODate(start);
      const endStr = toISODate(end);
      const bucketTasks = completed.filter((t) => t.date >= startStr && t.date <= endStr);
      const minutes = bucketTasks.reduce((s, t) => s + (t.actualTimeMinutes ?? 0), 0);
      const tests = bucketTasks.reduce((s, t) => s + (t.actualTestCount ?? 0), 0);
      buckets.push({
        day: `${startDay}-${endDay}`,
        hours: Math.round((minutes / 60) * 10) / 10,
        tests,
      });
    }
    return buckets;
  }

  // بازه دلخواه — last 14 days
  const result: DailyDatum[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dayStr = toISODate(d);
    const dayTasks = completed.filter((t) => t.date === dayStr);
    const minutes = dayTasks.reduce((s, t) => s + (t.actualTimeMinutes ?? 0), 0);
    const tests = dayTasks.reduce((s, t) => s + (t.actualTestCount ?? 0), 0);
    const dayLabel = `${d.getDate()}/${d.getMonth() + 1}`;
    result.push({ day: dayLabel, hours: Math.round((minutes / 60) * 10) / 10, tests });
  }
  return result;
}

// ===== Subject distribution (pie chart) =====
export interface SubjectDatum {
  name: string;
  value: number; // hours
  fill: string; // hex color
}

/**
 * Build the "سهم دروس" pie-chart dataset — one slice per subject, value = hours.
 * Subjects with 0 hours are excluded so the pie isn't cluttered.
 */
export function buildSubjectDistribution(tasks: Task[]): SubjectDatum[] {
  const completed = tasks.filter(isCompletedTask);
  const bySubject = new Map<string, { minutes: number; color: string }>();
  for (const t of completed) {
    const entry = bySubject.get(t.subject) ?? { minutes: 0, color: t.subjectColor || '#5E6AD2' };
    entry.minutes += t.actualTimeMinutes ?? 0;
    bySubject.set(t.subject, entry);
  }
  const result: SubjectDatum[] = [];
  for (const [name, entry] of bySubject) {
    if (entry.minutes <= 0) continue;
    result.push({
      name,
      value: Math.round((entry.minutes / 60) * 10) / 10,
      fill: entry.color,
    });
  }
  // Sort descending so the pie reads top-to-bottom by study time
  result.sort((a, b) => b.value - a.value);
  return result;
}

// ===== Activity type breakdown (stacked bar chart) =====
export interface ActivityDatum {
  name: string; // weekday label or date label
  مطالعه: number;
  مرور: number;
  تست_آموزشی: number;
  تست_سنجشی: number;
  کلاس_ویدیو: number;
}

const ACTIVITY_KEYS: ActivityType[] = ['مطالعه', 'مرور', 'تست آموزشی', 'تست سنجشی', 'کلاس/ویدیو'];

/**
 * Build the "نوع فعالیت" stacked-bar dataset.
 *
 * For each completed task, distribute its actualTimeMinutes evenly across its
 * declared activityTypes. This is a reasonable approximation: if a task says
 * it included مطالعه + تست آموزشی, we split the time 50/50 between those two.
 */
export function buildActivityBreakdown(tasks: Task[], timeFilter: TimeFilter, now: Date = new Date()): ActivityDatum[] {
  const completed = tasks.filter(isCompletedTask);

  // Reuse the same X-axis logic as buildDailyTrend so the activity chart lines
  // up with the daily trend chart for the same filter.
  const labels = buildDailyTrend(tasks, timeFilter, now).map((d) => d.day);

  // Determine which ISO date strings map to each label
  let labelToDates: Map<string, string[]>;
  if (timeFilter === 'روزانه' || timeFilter === 'هفته جاری') {
    const weekDays = getWeekDays(now);
    labelToDates = new Map(PERSIAN_WEEKDAYS.map((name, i) => [name, [toISODate(weekDays[i])]]));
  } else if (timeFilter === 'ماهانه') {
    const j = getTodayJalali();
    const daysInMonth = getDaysInJalaliMonth(j.jy, j.jm);
    const first = getFirstDayOfJalaliMonth(j.jy, j.jm);
    const bucketCount = 6;
    const bucketSize = Math.ceil(daysInMonth / bucketCount);
    labelToDates = new Map();
    for (let b = 0; b < bucketCount; b++) {
      const startDay = b * bucketSize + 1;
      const endDay = Math.min(startDay + bucketSize - 1, daysInMonth);
      if (startDay > daysInMonth) break;
      const label = `${startDay}-${endDay}`;
      const dates: string[] = [];
      for (let d = startDay; d <= endDay; d++) {
        const date = new Date(first);
        date.setDate(first.getDate() + d - 1);
        dates.push(toISODate(date));
      }
      labelToDates.set(label, dates);
    }
  } else {
    // بازه دلخواه — last 14 days, label = "day/month"
    labelToDates = new Map();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const label = `${d.getDate()}/${d.getMonth() + 1}`;
      const arr = labelToDates.get(label) ?? [];
      arr.push(toISODate(d));
      labelToDates.set(label, arr);
    }
  }

  return labels.map((label) => {
    const dates = labelToDates.get(label) ?? [];
    const dateSet = new Set(dates);
    const dayTasks = completed.filter((t) => dateSet.has(t.date));
    const datum: ActivityDatum = {
      name: label,
      مطالعه: 0,
      مرور: 0,
      تست_آموزشی: 0,
      تست_سنجشی: 0,
      کلاس_ویدیو: 0,
    };
    for (const t of dayTasks) {
      const minutes = t.actualTimeMinutes ?? 0;
      const acts = (t.activityTypes ?? []).filter((a) => ACTIVITY_KEYS.includes(a));
      if (acts.length === 0 || minutes <= 0) continue;
      const per = minutes / acts.length;
      for (const a of acts) {
        if (a === 'تست آموزشی') datum.تست_آموزشی += per;
        else if (a === 'تست سنجشی') datum.تست_سنجشی += per;
        else if (a === 'مطالعه') datum.مطالعه += per;
        else if (a === 'مرور') datum.مرور += per;
        else if (a === 'کلاس/ویدیو') datum.کلاس_ویدیو += per;
      }
    }
    // Round each bucket to integer minutes (chart displays whole minutes)
    datum.مطالعه = Math.round(datum.مطالعه);
    datum.مرور = Math.round(datum.مرور);
    datum.تست_آموزشی = Math.round(datum.تست_آموزشی);
    datum.تست_سنجشی = Math.round(datum.تست_سنجشی);
    datum.کلاس_ویدیو = Math.round(datum.کلاس_ویدیو);
    return datum;
  });
}

// ===== Smart insights =====
export interface InsightDatum {
  title: string;
  value: string;
  color: string;
}

/**
 * Compute the four "بینش‌های هوشمند" cards from real data:
 * 1. بیشترین مطالعه — subject with max actual hours
 * 2. کمترین مطالعه — subject with min non-zero hours (or "—" if none)
 * 3. منظم‌ترین درس — subject with highest completion rate (min 3 tasks)
 * 4. بیشترین کنسلی — subject with most skipped tasks
 */
export function computeInsights(tasks: Task[]): {
  mostStudied: InsightDatum;
  leastStudied: InsightDatum;
  mostConsistent: InsightDatum;
  mostSkipped: InsightDatum;
} {
  // Use ALL tasks (not just completed) so we can see skipped ones too
  const subjects = new Map<string, { color: string; minutes: number; total: number; completed: number; skipped: number }>();
  for (const t of tasks) {
    if (t.status === 'DRAFT' || (t.status === undefined && t.detailsCompleted === false)) continue;
    const entry = subjects.get(t.subject) ?? {
      color: t.subjectColor || '#5E6AD2',
      minutes: 0,
      total: 0,
      completed: 0,
      skipped: 0,
    };
    if (isCompletedTask(t)) {
      entry.minutes += t.actualTimeMinutes ?? 0;
      entry.completed += 1;
    }
    if (t.status === 'SKIPPED' || (t.status === undefined && t.completed === false)) entry.skipped += 1;
    entry.total += 1;
    subjects.set(t.subject, entry);
  }

  const entries = [...subjects.entries()];

  // Format a minutes value as "X ساعت" or "Y دقیقه" when under 30 min
  const fmtDuration = (minutes: number): string => {
    if (minutes >= 30) return `${Math.round((minutes / 60) * 10) / 10} ساعت`;
    if (minutes > 0) return `${Math.round(minutes)} دقیقه`;
    return '۰ دقیقه';
  };

  // 1. Most studied (by minutes)
  const sortedByMin = [...entries].sort((a, b) => b[1].minutes - a[1].minutes);
  const most = sortedByMin[0];
  const mostStudied: InsightDatum = most && most[1].minutes > 0
    ? { title: 'بیشترین مطالعه', value: `${most[0]} - ${fmtDuration(most[1].minutes)}`, color: most[1].color }
    : { title: 'بیشترین مطالعه', value: 'داده‌ای نیست', color: '#5E6AD2' };

  // 2. Least studied (smallest non-zero minutes)
  const nonZero = sortedByMin.filter(([, v]) => v.minutes > 0);
  const least = nonZero[nonZero.length - 1];
  const leastStudied: InsightDatum = least
    ? { title: 'کمترین مطالعه', value: `${least[0]} - ${fmtDuration(least[1].minutes)}`, color: least[1].color }
    : { title: 'کمترین مطالعه', value: 'داده‌ای نیست', color: '#D89614' };

  // 3. Most consistent (highest completion rate, min 3 tasks)
  const withMin = entries.filter(([, v]) => v.total >= 3);
  const sortedByRate = withMin.sort((a, b) => {
    const ra = a[1].total > 0 ? a[1].completed / a[1].total : 0;
    const rb = b[1].total > 0 ? b[1].completed / b[1].total : 0;
    return rb - ra;
  });
  const consistent = sortedByRate[0];
  const mostConsistent: InsightDatum = consistent
    ? { title: 'منظم‌ترین درس', value: `${consistent[0]} (${Math.round((consistent[1].completed / consistent[1].total) * 100)}٪)`, color: consistent[1].color }
    : { title: 'منظم‌ترین درس', value: 'داده‌ای نیست', color: '#5E6AD2' };

  // 4. Most skipped (most skipped tasks, ties broken by skip ratio)
  const withSkips = entries.filter(([, v]) => v.skipped > 0);
  const sortedBySkips = withSkips.sort((a, b) => {
    if (b[1].skipped !== a[1].skipped) return b[1].skipped - a[1].skipped;
    const ra = a[1].total > 0 ? a[1].skipped / a[1].total : 0;
    const rb = b[1].total > 0 ? b[1].skipped / b[1].total : 0;
    return rb - ra;
  });
  const skipped = sortedBySkips[0];
  const mostSkipped: InsightDatum = skipped
    ? { title: 'بیشترین کنسلی', value: `${skipped[0]} (${skipped[1].skipped} تسک)`, color: '#E5484D' }
    : { title: 'بیشترین کنسلی', value: 'نداریم 🎉', color: '#5E6AD2' };

  return { mostStudied, leastStudied, mostConsistent, mostSkipped };
}

// ===== Helpers for chart legend =====
/** Returns true if there are any completed tasks in the filtered set. */
export function hasAnyCompletedData(tasks: Task[]): boolean {
  return tasks.some(isCompletedTask);
}
