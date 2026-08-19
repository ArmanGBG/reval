import { describe, expect, it } from 'vitest';
import { filterTasksForReport } from '@/lib/analytics';
import type { Task } from '@/lib/types';

describe('completed task report date', () => {
  it('reports a future-scheduled task in the period where it was completed', () => {
    const task: Task = {
      id: 'persian-range', studentId: 'student', subjectId: 'persian-3', subject: 'فارسی 3', subjectColor: '#777',
      topic: 'درس پنجم و ششم', fieldType: 'نهایی', activityTypes: ['مطالعه'], targetTimeMinutes: 90,
      actualTimeMinutes: 90, targetTestCount: 20, actualTestCount: 20, status: 'COMPLETED', completed: true,
      date: '2026-08-24', updatedAt: '2026-08-19T16:13:38.660Z', order: 0, createdBy: 'student', detailsCompleted: true,
      chapterId: 'chapter-2', topicIds: ['lesson-5', 'lesson-6'], curriculumMode: 'BOOK', pageStart: 40, pageEnd: 50,
    };

    const result = filterTasksForReport([task], 'هفته جاری', 'همه', new Date('2026-08-19T12:00:00Z'));
    expect(result).toEqual([task]);
  });
});
