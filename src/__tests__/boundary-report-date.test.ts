import { describe, expect, it } from 'vitest';
import { filterTasksForReport, buildDailyTrend, buildActivityBreakdown, resolveDateRange, getReportDate } from '@/lib/analytics';
import type { Task } from '@/lib/types';

function completedTaskOn(date: string, overrides: Partial<Task> = {}): Task {
  return {
    id: `t-${date}-${Math.random().toString(36).slice(2, 8)}`,
    studentId: 's', subject: 'زیست', subjectColor: '#000',
    topic: null, fieldType: 'کنکور', activityTypes: ['مطالعه'],
    targetTimeMinutes: 60, actualTimeMinutes: 60,
    targetTestCount: 10, actualTestCount: 10,
    status: 'COMPLETED', completed: true, date, order: 0, createdBy: 'student',
    ...overrides,
  };
}

describe('getReportDate — single source of truth', () => {
  it('always returns the SCHEDULED date (t.date), regardless of completion status or updatedAt', () => {
    const scheduledDate = '2026-09-23'; // مهر 1

    // Completed early (updatedAt before schedule)
    const completedEarly = completedTaskOn(scheduledDate, { updatedAt: '2026-09-21T10:00:00Z' });
    expect(getReportDate(completedEarly)).toBe(scheduledDate);

    // Completed late (updatedAt after schedule)
    const completedLate = completedTaskOn(scheduledDate, { updatedAt: '2026-09-25T10:00:00Z' });
    expect(getReportDate(completedLate)).toBe(scheduledDate);

    // No updatedAt at all (pending)
    const pending = completedTaskOn(scheduledDate, { status: 'PENDING', completed: null, updatedAt: undefined, actualTimeMinutes: null });
    expect(getReportDate(pending)).toBe(scheduledDate);
  });
});

describe('resolveDateRange — ماهانه honors `now` parameter', () => {
  it('returns Mehr range when now = Sept 23, 2026 (Mehr 1, 1405)', () => {
    const now = new Date(2026, 8, 23, 14, 0); // Sept 23, 2026
    const range = resolveDateRange('ماهانه', now);
    expect(range).toEqual({ start: '2026-09-23', end: '2026-10-22' });
  });
  it('returns Shahrivar range when now = Sept 22, 2026 (Shahrivar 31, 1405)', () => {
    const now = new Date(2026, 8, 22, 14, 0); // Sept 22, 2026
    const range = resolveDateRange('ماهانه', now);
    expect(range).toEqual({ start: '2026-08-23', end: '2026-09-22' });
  });
  it('different `now` values produce different ranges', () => {
    const shahrivar = resolveDateRange('ماهانه', new Date(2026, 8, 22, 14, 0));
    const mehr = resolveDateRange('ماهانه', new Date(2026, 8, 23, 14, 0));
    expect(shahrivar).not.toEqual(mehr);
  });
});

describe('SHAHRIVAR→MEHR BOUNDARY — tasks always reported by scheduled date', () => {
  // REGRESSION TEST for the user-reported bug: "selecting 1-10 Mehr shows no
  // data even though the task is done and its checkmark is checked".
  //
  // Scenario: student completes a مهر-scheduled task early, on شهریور 30.
  // With the previous option-A logic (updatedAt), this task was filtered OUT
  // of any مهر range because updatedAt=شهریور 30 was outside the range — even
  // though the task was clearly planned for مهر. Option B (always use t.date)
  // fixes this by placing the task in its scheduled period.
  it('REGRESSION: future-scheduled task completed early appears in its scheduled range', () => {
    const customRange = { start: '2026-09-23', end: '2026-09-25' }; // مهر 1-3
    const futureTask = completedTaskOn('2026-09-24', {
      updatedAt: '2026-09-21T10:00:00Z', // completed today = شهریور 30
      actualTimeMinutes: 60,
    });
    const now = new Date('2026-09-21T14:00:00Z'); // today = شهریور 30

    const filtered = filterTasksForReport([futureTask], 'بازه دلخواه', 'همه', now, customRange);
    expect(filtered).toHaveLength(1); // kept because t.date='2026-09-24' is in range

    const trend = buildDailyTrend(filtered, 'بازه دلخواه', now, customRange);
    const totalHoursInChart = trend.reduce((s, b) => s + b.hours, 0);
    // Chart shows the 1 hour the KPI counts — no silent loss.
    expect(totalHoursInChart).toBe(1);
  });

  it('ماهانه on Mehr 1: a task scheduled in Mehr shows in the Mehr report', () => {
    // Today is Mehr 1, 1405. A task was scheduled for Mehr 1 and completed on Mehr 1.
    const now = new Date(2026, 8, 23, 14, 0);
    const mehrTask = completedTaskOn('2026-09-23', {
      updatedAt: '2026-09-23T10:00:00Z', // completed Mehr 1 morning
      actualTimeMinutes: 60,
    });

    const filtered = filterTasksForReport([mehrTask], 'ماهانه', 'همه', now);
    expect(filtered).toHaveLength(1);

    const trend = buildDailyTrend(filtered, 'ماهانه', now);
    const totalHoursInChart = trend.reduce((s, b) => s + b.hours, 0);
    expect(totalHoursInChart).toBe(1);
  });

  it('a task scheduled in Shahrivar 31 does NOT appear in a Mehr-only range', () => {
    // Task was planned for the last day of Shahrivar. Even if it was
    // completed on مهر 1 morning, it belongs to the Shahrivar report
    // (its scheduled period), not the Mehr report.
    const shahrivarTask = completedTaskOn('2026-09-22', {
      updatedAt: '2026-09-23T10:00:00Z', // completed Mehr 1 morning
      actualTimeMinutes: 60,
    });

    // Custom range strictly inside Mehr
    const mehrRange = { start: '2026-09-23', end: '2026-09-25' }; // مهر 1-3
    const filtered = filterTasksForReport([shahrivarTask], 'بازه دلخواه', 'همه', new Date('2026-09-23T14:00:00Z'), mehrRange);
    expect(filtered).toHaveLength(0);
  });

  it('buildActivityBreakdown aligns with buildDailyTrend at boundary', () => {
    const customRange = { start: '2026-09-22', end: '2026-09-24' }; // spans boundary
    const boundaryTask = completedTaskOn('2026-09-23', {
      updatedAt: '2026-09-21T10:00:00Z', // completed early
      actualTimeMinutes: 60,
      activityTypes: ['مطالعه', 'تست آموزشی'],
    });
    const tasks = [boundaryTask];
    const now = new Date('2026-09-21T14:00:00Z');

    const trend = buildDailyTrend(tasks, 'بازه دلخواه', now, customRange);
    const breakdown = buildActivityBreakdown(tasks, 'بازه دلخواه', now, customRange);

    // Total hours should match across both views
    const trendTotal = trend.reduce((s, b) => s + b.hours, 0);
    const breakdownTotal = breakdown.reduce((s, b) => s + b.مطالعه + b.مرور + b.تست_آموزشی + b.تست_سنجشی + b.کلاس_ویدیو, 0);
    expect(trendTotal).toBe(1);
    expect(breakdownTotal).toBe(1);
  });
});
