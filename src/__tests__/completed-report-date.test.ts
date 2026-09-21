import { describe, expect, it } from 'vitest';
import { filterTasksForReport, getReportDate } from '@/lib/analytics';
import type { Task } from '@/lib/types';

describe('completed task report date', () => {
  // A task is placed in the report for its SCHEDULED period, not for when it
  // was completed. This matches the student's mental model: "show me what I
  // planned for this period". Completing a task early (or late) does not move
  // it to a different period — it just decides whether its hours/tests count
  // toward the KPI (only completed tasks contribute actual time).

  it('places a future-scheduled task in the SCHEDULED period, not the completion period', () => {
    // Task scheduled for Aug 24, completed early on Aug 19.
    const task: Task = {
      id: 'persian-range', studentId: 'student', subjectId: 'persian-3', subject: 'فارسی 3', subjectColor: '#777',
      topic: 'درس پنجم و ششم', fieldType: 'نهایی', activityTypes: ['مطالعه'], targetTimeMinutes: 90,
      actualTimeMinutes: 90, targetTestCount: 20, actualTestCount: 20, status: 'COMPLETED', completed: true,
      date: '2026-08-24', updatedAt: '2026-08-19T16:13:38.660Z', order: 0, createdBy: 'student', detailsCompleted: true,
      chapterId: 'chapter-2', topicIds: ['lesson-5', 'lesson-6'], curriculumMode: 'BOOK', pageStart: 40, pageEnd: 50,
    };

    // Report for the week the task was COMPLETED in (Aug 15-21 around Aug 19)
    // → task should NOT appear (it was scheduled for the following week).
    const completionWeekResult = filterTasksForReport([task], 'هفته جاری', 'همه', new Date('2026-08-19T12:00:00Z'));
    expect(completionWeekResult).toEqual([]);

    // Report for the week the task was SCHEDULED in (Aug 22-28 around Aug 24)
    // → task SHOULD appear (this is its planned period).
    const scheduledWeekResult = filterTasksForReport([task], 'هفته جاری', 'همه', new Date('2026-08-24T12:00:00Z'));
    expect(scheduledWeekResult).toEqual([task]);
  });

  it('getReportDate always returns t.date regardless of completion status', () => {
    const scheduledDate = '2026-09-23'; // مهر 1
    // Completed today (شهریور 30) — updatedAt is in the past relative to schedule.
    const completedEarly: Task = {
      id: 't1', studentId: 's', subject: 'bio', subjectColor: '#000',
      topic: null, fieldType: 'کنکور', activityTypes: ['مطالعه'],
      targetTimeMinutes: 60, actualTimeMinutes: 60,
      targetTestCount: 0, actualTestCount: 0,
      status: 'COMPLETED', completed: true,
      date: scheduledDate,
      updatedAt: '2026-09-21T10:00:00Z', // today = شهریور 30
      order: 0, createdBy: 'student', detailsCompleted: true,
    };
    // Pending — no updatedAt.
    const pending: Task = {
      ...completedEarly,
      id: 't2', status: 'PENDING', completed: null, actualTimeMinutes: null, updatedAt: undefined,
    };
    // Skipped.
    const skipped: Task = {
      ...completedEarly,
      id: 't3', status: 'SKIPPED', completed: false, actualTimeMinutes: null, updatedAt: '2026-09-21T11:00:00Z',
    };

    // All three return the SCHEDULED date, not updatedAt.
    expect(getReportDate(completedEarly)).toBe(scheduledDate);
    expect(getReportDate(pending)).toBe(scheduledDate);
    expect(getReportDate(skipped)).toBe(scheduledDate);
  });

  it('REGRESSION: future-scheduled task completed early still appears in its scheduled range', () => {
    // This is the exact bug the user reported: "selecting 1-10 Mehr shows no
    // data even though the task is done and its checkmark is checked". With
    // the OLD option-A logic (updatedAt), completing a Mehr-scheduled task
    // on شهریور 30 would filter it out of the Mehr range. Option B fixes this.
    const task: Task = {
      id: 'mehr-task', studentId: 'student', subjectId: 'bio-3', subject: 'زیست 3', subjectColor: '#3EBA8C',
      topic: 'فصل ۱', fieldType: 'کنکور', activityTypes: ['مطالعه'],
      targetTimeMinutes: 90, actualTimeMinutes: 75,
      targetTestCount: 30, actualTestCount: 25,
      status: 'COMPLETED', completed: true,
      date: '2026-09-25', // scheduled مهر 3
      updatedAt: '2026-09-21T15:00:00Z', // completed today = شهریور 30
      order: 0, createdBy: 'student', detailsCompleted: true,
    };

    // Custom range: مهر 1-10 (Sept 23 - Oct 2)
    const customRange = { start: '2026-09-23', end: '2026-10-02' };
    const result = filterTasksForReport([task], 'بازه دلخواه', 'همه', new Date('2026-09-21T15:00:00Z'), customRange);
    expect(result).toEqual([task]);
  });
});
