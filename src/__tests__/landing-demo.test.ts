import { describe, expect, it } from 'vitest';
import { toISODate } from '@/lib/persian-date';
import { buildDailyTrend, filterTasksForReport } from '@/lib/analytics';
import type { Task } from '@/lib/types';

describe('landing interactive demo report date', () => {
  it('keeps a completed demo task in the local daily report range', () => {
    const now = new Date(2026, 7, 15, 23, 30);
    const task: Task = {
      id: 'landing-demo-task',
      studentId: 'landing-demo',
      subjectId: 'landing-demo-subject',
      subject: 'تست زیست',
      subjectColor: '#3EBA8C',
      topic: 'فصل اول',
      fieldType: 'کنکور',
      activityTypes: ['تست آموزشی'],
      targetTimeMinutes: 45,
      actualTimeMinutes: 45,
      targetTestCount: 30,
      actualTestCount: 30,
      status: 'COMPLETED',
      completed: true,
      detailsCompleted: true,
      date: toISODate(now),
      order: 0,
      createdBy: 'student',
    };

    const filtered = filterTasksForReport([task], 'روزانه', 'همه', now);
    const trend = buildDailyTrend(filtered, 'روزانه', now);

    expect(filtered).toHaveLength(1);
    expect(trend.reduce((sum, item) => sum + item.hours, 0)).toBe(0.8);
  });
});
