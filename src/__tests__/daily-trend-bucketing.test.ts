import { describe, expect, it } from 'vitest';
import { buildActivityBreakdown, buildDailyTrend } from '@/lib/analytics';
import type { Task } from '@/lib/types';

function completedTaskOn(date: string, minutes = 60): Task {
  return {
    id: `t-${date}`, studentId: 's', subject: 'زیست', subjectColor: '#000',
    topic: null, fieldType: 'کنکور', activityTypes: ['مطالعه'],
    targetTimeMinutes: minutes, actualTimeMinutes: minutes,
    targetTestCount: 10, actualTestCount: 10,
    status: 'COMPLETED', completed: true, date, order: 0, createdBy: 'student',
  };
}

describe('buildDailyTrend custom-range bucketing', () => {
  it('keeps a daily label per day for short ranges (≤ 16 days)', () => {
    const trend = buildDailyTrend([completedTaskOn('2026-08-01')], 'بازه دلخواه', new Date('2026-08-15'), { start: '2026-08-01', end: '2026-08-10' });
    expect(trend).toHaveLength(10);
    expect(trend[0].day).not.toContain('–');
  });

  it('buckets long ranges into ~12 grouped points labeled by bucket start', () => {
    // 45 days → bucketSize 4 → 12 buckets (the last one may hold fewer days)
    const trend = buildDailyTrend([], 'بازه دلخواه', new Date(), { start: '2026-07-01', end: '2026-08-14' });
    expect(trend.length).toBeLessThanOrEqual(13);
    expect(trend.length).toBeGreaterThanOrEqual(11);
    // labels are short single-date labels (bucket start) — no «from–to» spans
    expect(trend.every((point) => !point.day.includes('–'))).toBe(true);
    // labels are unique per bucket
    expect(new Set(trend.map((point) => point.day)).size).toBe(trend.length);
  });

  it('aggregates hours and tests inside each bucket', () => {
    // 40 days, a task on each of the first 8 days (2 buckets of 4 at bucketSize=4)
    const tasks = Array.from({ length: 8 }, (_, i) => completedTaskOn(`2026-07-0${i + 1}`, 60));
    const trend = buildDailyTrend(tasks, 'بازه دلخواه', new Date(), { start: '2026-07-01', end: '2026-08-09' });
    // bucketSize = ceil(40/12) = 4 → first bucket = days 1-4 = 4 hours, 40 tests
    expect(trend[0].hours).toBeCloseTo(4, 5);
    expect(trend[0].tests).toBe(40);
    expect(trend[1].hours).toBeCloseTo(4, 5);
  });
});

describe('buildActivityBreakdown custom-range alignment', () => {
  it('aggregates values into the same buckets as buildDailyTrend', () => {
    // 40 days of study tasks every 3 days
    const tasks = Array.from({ length: 14 }, (_, i) => completedTaskOn(`2026-07-0${(i % 9) + 1}`, 60));
    const range = { start: '2026-07-01', end: '2026-08-09' }; // 40 days → bucketSize 4
    const trend = buildDailyTrend(tasks, 'بازه دلخواه', new Date(), range);
    const breakdown = buildActivityBreakdown(tasks, 'بازه دلخواه', new Date(), range);
    // same labels in the same order
    expect(breakdown.map((d) => d.name)).toEqual(trend.map((d) => d.day));
    // total study hours preserved across buckets (each task = 60 min = 1h)
    const totalHours = breakdown.reduce((sum, d) => sum + d.مطالعه, 0);
    expect(totalHours).toBeCloseTo(tasks.length, 5);
  });
});
