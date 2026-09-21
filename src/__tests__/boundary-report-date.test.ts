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
  it('uses updatedAt for completed tasks', () => {
    const t = completedTaskOn('2026-09-22', { updatedAt: '2026-09-23T10:00:00Z' });
    expect(getReportDate(t)).toBe('2026-09-23');
  });
  it('falls back to t.date when updatedAt is missing', () => {
    const t = completedTaskOn('2026-09-22');
    expect(getReportDate(t)).toBe('2026-09-22');
  });
  it('uses t.date for non-completed tasks', () => {
    const t = completedTaskOn('2026-09-22', { status: 'PENDING', completed: null, updatedAt: '2026-09-23T10:00:00Z' });
    expect(getReportDate(t)).toBe('2026-09-22');
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

describe('SHAHRIVAR→MEHR BOUNDARY — filter and chart agree', () => {
  // REGRESSION TEST: previously `filterTasksForReport` used `updatedAt` while
  // `buildDailyTrend` and `buildActivityBreakdown` bucketed by `t.date`. A task
  // scheduled on شهریور 31 but completed on ۱ مهر morning was kept by the
  // filter (so KPI counted it) but lost from the chart (silent zero).
  it('custom range spanning Shahrivar→Mehr: boundary task in chart matches KPI count', () => {
    const customRange = { start: '2026-09-23', end: '2026-09-25' }; // Mehr 1-3
    const boundaryTask = completedTaskOn('2026-09-22', {
      updatedAt: '2026-09-23T10:00:00Z', // completed on Mehr 1 morning
      actualTimeMinutes: 60,
    });
    const tasks = [boundaryTask];
    const now = new Date('2026-09-23T14:00:00');

    const filtered = filterTasksForReport(tasks, 'بازه دلخواه', 'همه', now, customRange);
    expect(filtered).toHaveLength(1); // filter keeps it (reportDate=Sept 23 in range)

    const trend = buildDailyTrend(filtered, 'بازه دلخواه', now, customRange);
    const totalHoursInChart = trend.reduce((s, b) => s + b.hours, 0);
    // FIXED: chart must now show the 1 hour the KPI counts
    expect(totalHoursInChart).toBe(1);
  });

  it('ماهانه on Mehr 1: task scheduled Shahrivar 31 but completed Mehr 1 → in chart', () => {
    // Today is Mehr 1, 1405
    const now = new Date(2026, 8, 23, 14, 0);
    // Task scheduled Shahrivar 31 but completed Mehr 1 morning
    const boundaryTask = completedTaskOn('2026-09-22', {
      updatedAt: '2026-09-23T10:00:00Z',
      actualTimeMinutes: 60,
    });

    const filtered = filterTasksForReport([boundaryTask], 'ماهانه', 'همه', now);
    expect(filtered).toHaveLength(1);

    const trend = buildDailyTrend(filtered, 'ماهانه', now);
    const totalHoursInChart = trend.reduce((s, b) => s + b.hours, 0);
    // FIXED: bucketed by reportDate=Sept 23 (Mehr 1) which falls in bucket 1
    expect(totalHoursInChart).toBe(1);
  });

  it('buildActivityBreakdown aligns with buildDailyTrend at boundary', () => {
    const customRange = { start: '2026-09-22', end: '2026-09-24' }; // spans boundary
    const boundaryTask = completedTaskOn('2026-09-22', {
      updatedAt: '2026-09-23T10:00:00Z',
      actualTimeMinutes: 60,
      activityTypes: ['مطالعه', 'تست آموزشی'],
    });
    const tasks = [boundaryTask];
    const now = new Date('2026-09-23T14:00:00');

    const trend = buildDailyTrend(tasks, 'بازه دلخواه', now, customRange);
    const breakdown = buildActivityBreakdown(tasks, 'بازه دلخواه', now, customRange);

    // Total hours should match across both views
    const trendTotal = trend.reduce((s, b) => s + b.hours, 0);
    const breakdownTotal = breakdown.reduce((s, b) => s + b.مطالعه + b.مرور + b.تست_آموزشی + b.تست_سنجشی + b.کلاس_ویدیو, 0);
    expect(trendTotal).toBe(1);
    expect(breakdownTotal).toBe(1);
  });
});
