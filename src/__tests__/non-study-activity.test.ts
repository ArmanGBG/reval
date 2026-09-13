import { describe, expect, it } from 'vitest';
import { NON_STUDY_CATEGORIES, isNonStudyCategoryKey, nonStudyCategory, sumNonStudyMinutes, sumNonStudyMinutesByCategory } from '@/lib/non-study-activity';
import { filterNonStudyActivitiesForRange } from '@/lib/non-study-activity-report';
import { isHomeworkWithoutDetails, homeworkNudgeMessage } from '@/components/plan/ClassHomeworkDialog';
import { studentCanEditTask } from '@/lib/class-task';
import type { NonStudyActivity, Task } from '@/lib/types';

function activity(overrides: Partial<NonStudyActivity>): NonStudyActivity {
  return {
    id: overrides.id ?? 'a1',
    studentId: 'student',
    category: 'MEDIA',
    durationMinutes: null,
    date: '2026-09-13',
    createdAt: '2026-09-13T10:00:00.000Z',
    ...overrides,
  };
}

describe('non-study activity registry', () => {
  it('exposes the six spec categories with icons', () => {
    expect(NON_STUDY_CATEGORIES.map((c) => c.key)).toEqual(['MEDIA', 'GAMES', 'SOCIAL', 'HEALTH', 'LANGUAGE', 'MUSIC']);
    expect(NON_STUDY_CATEGORIES[0]).toMatchObject({ label: 'رسانه و فضای مجازی', icon: '📱' });
    expect(NON_STUDY_CATEGORIES[4]).toMatchObject({ label: 'کلاس زبان', icon: '🗣️' });
    expect(NON_STUDY_CATEGORIES[5]).toMatchObject({ label: 'کلاس موسیقی', icon: '🎵' });
  });

  it('validates category keys and falls back for unknown values', () => {
    expect(isNonStudyCategoryKey('HEALTH')).toBe(true);
    expect(isNonStudyCategoryKey('LANGUAGE')).toBe(true);
    expect(isNonStudyCategoryKey('MUSIC')).toBe(true);
    expect(isNonStudyCategoryKey('درسی')).toBe(false);
    expect(nonStudyCategory('GAMES').label).toBe('بازی و سرگرمی');
    // legacy SKILL records map to کلاس زبان
    expect(nonStudyCategory('SKILL').label).toBe('کلاس زبان');
    expect(nonStudyCategory('UNKNOWN').label).toBe('سایر');
  });
});

describe('non-study activity aggregation', () => {
  it('sums minutes per category and counts entries without duration', () => {
    const totals = sumNonStudyMinutesByCategory([
      activity({ category: 'MEDIA', durationMinutes: 30 }),
      activity({ category: 'MEDIA', durationMinutes: 45 }),
      activity({ category: 'HEALTH', durationMinutes: null }),
    ]);
    const media = totals.find((t) => t.key === 'MEDIA');
    const health = totals.find((t) => t.key === 'HEALTH');
    expect(media?.minutes).toBe(75);
    expect(media?.count).toBe(2);
    expect(health?.minutes).toBe(0);
    expect(health?.count).toBe(1);
    // categories with no entries are not listed
    expect(totals.find((t) => t.key === 'GAMES')).toBeUndefined();
  });

  it('treats missing duration as zero in the grand total', () => {
    expect(sumNonStudyMinutes([
      activity({ durationMinutes: 60 }),
      activity({ durationMinutes: null }),
    ])).toBe(60);
  });
});

describe('non-study activity range filtering', () => {
  const inRange = [
    activity({ id: 'd1', date: '2026-09-13', durationMinutes: 20 }),
    activity({ id: 'd2', date: '2026-09-15', durationMinutes: 10 }),
  ];
  const outOfRange = [
    activity({ id: 'd3', date: '2026-09-20', durationMinutes: 99 }),
    activity({ id: 'd4', date: '2026-09-01', durationMinutes: 99 }),
  ];

  it('keeps only activities inside the resolved range', () => {
    // روزانه resolves to today; use a fixed "now" to keep the test deterministic
    const now = new Date('2026-09-13T12:00:00');
    const filtered = filterNonStudyActivitiesForRange([...inRange, ...outOfRange], 'روزانه', now);
    expect(filtered.map((a) => a.id)).toEqual(['d1']);
  });

  it('returns everything for بازه دلخواه without a custom range', () => {
    const all = [...inRange, ...outOfRange];
    expect(filterNonStudyActivitiesForRange(all, 'بازه دلخواه', new Date(), null)).toHaveLength(all.length);
  });

  it('filters by the custom range when provided', () => {
    const filtered = filterNonStudyActivitiesForRange(
      [...inRange, ...outOfRange],
      'بازه دلخواه',
      new Date(),
      { start: '2026-09-13', end: '2026-09-15' },
    );
    expect(filtered.map((a) => a.id)).toEqual(['d1', 'd2']);
  });

  it('returns unfiltered when the custom range is missing for بازه دلخواه', () => {
    const all = [...inRange, ...outOfRange];
    expect(filterNonStudyActivitiesForRange(all, 'بازه دلخواه', new Date(), null)).toHaveLength(all.length);
    expect(filterNonStudyActivitiesForRange(all, 'بازه دلخواه', new Date(), undefined)).toHaveLength(all.length);
  });
});

describe('class homework task', () => {
  const baseHomework: Pick<Task, 'createdBy' | 'status' | 'activityTypes' | 'detailsCompleted' | 'classHomeworkOfId' | 'targetTimeMinutes' | 'targetTestCount' | 'chapterId' | 'topicIds' | 'topicModeId'> = {
    createdBy: 'advisor',
    status: 'PENDING',
    activityTypes: ['تست آموزشی'],
    detailsCompleted: false,
    classHomeworkOfId: 'class-1',
    targetTimeMinutes: null,
    targetTestCount: null,
    chapterId: null,
    topicIds: [],
    topicModeId: null,
  };

  it('detects a homework task with no student-filled details', () => {
    expect(isHomeworkWithoutDetails(baseHomework)).toBe(true);
    expect(isHomeworkWithoutDetails({ ...baseHomework, targetTimeMinutes: 45 })).toBe(false);
    expect(isHomeworkWithoutDetails({ ...baseHomework, targetTestCount: 20 })).toBe(false);
    expect(isHomeworkWithoutDetails({ ...baseHomework, topicIds: ['t1'] })).toBe(false);
    expect(isHomeworkWithoutDetails({ ...baseHomework, chapterId: 'ch1' })).toBe(false);
    // not a homework task at all
    expect(isHomeworkWithoutDetails({ ...baseHomework, classHomeworkOfId: null })).toBe(false);
  });

  it('lets the student edit an advisor-created homework task (to fill details)', () => {
    expect(studentCanEditTask(baseHomework)).toBe(true);
    // advisor-created standard task without the homework link stays locked
    expect(studentCanEditTask({ ...baseHomework, classHomeworkOfId: null })).toBe(false);
  });

  it('exposes the analytics nudge message', () => {
    expect(homeworkNudgeMessage()).toContain('آنالیز جامع');
  });
});
