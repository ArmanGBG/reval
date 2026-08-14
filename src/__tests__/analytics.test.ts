import { describe, expect, it } from 'vitest';
import { buildActivityBreakdown, buildDailyTrend, buildSubjectDistribution } from '@/lib/analytics';
import type { Task } from '@/lib/types';

function completedTask(overrides: Partial<Task>): Task {
  return {
    id: 'task-1',
    studentId: 'student-1',
    subjectId: 'subject-1',
    subject: 'شیمی ۳',
    subjectColor: '#4A7FB5',
    topic: null,
    fieldType: 'کنکور',
    activityTypes: ['مطالعه'],
    targetTimeMinutes: 60,
    actualTimeMinutes: 60,
    targetTestCount: 0,
    actualTestCount: 0,
    status: 'COMPLETED',
    completed: true,
    detailsCompleted: true,
    date: '2026-08-14',
    order: 0,
    createdBy: 'student',
    ...overrides,
  };
}

describe('analytics report datasets', () => {
  it('uses Jalali labels for custom date ranges', () => {
    const data = buildDailyTrend(
      [completedTask({})],
      'بازه دلخواه',
      new Date(2026, 7, 14),
      { start: '2026-08-14', end: '2026-08-14' },
    );
    expect(data).toHaveLength(1);
    expect(data[0].day).toMatch(/[آ-ی]/);
    expect(data[0].day).not.toMatch(/\d/);
  });

  it('aggregates completed study time by subject', () => {
    const data = buildSubjectDistribution([
      completedTask({ actualTimeMinutes: 90 }),
      completedTask({ id: 'task-2', actualTimeMinutes: 30 }),
      completedTask({ id: 'task-3', subject: 'فیزیک ۳', subjectId: 'subject-2', actualTimeMinutes: 60 }),
    ]);
    expect(data).toEqual([
      { name: 'شیمی ۳', value: 2, fill: '#4A7FB5' },
      { name: 'فیزیک ۳', value: 1, fill: '#4A7FB5' },
    ]);
  });

  it('splits daily time across selected study methods', () => {
    const data = buildActivityBreakdown(
      [completedTask({ activityTypes: ['مرور', 'تست آموزشی'], actualTimeMinutes: 60 })],
      'بازه دلخواه',
      new Date(2026, 7, 14),
      { start: '2026-08-14', end: '2026-08-14' },
    );
    expect(data[0].مرور).toBe(30);
    expect(data[0].تست_آموزشی).toBe(30);
    expect(data[0].مطالعه).toBe(0);
  });
});
