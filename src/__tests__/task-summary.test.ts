import { describe, expect, it } from 'vitest';
import { formatTaskCurriculum } from '@/lib/task-summary';

describe('task curriculum summary', () => {
  it('renders every selected topic in curriculum order', () => {
    expect(formatTaskCurriculum({
      topic: 'متن قدیمی',
      topics: [
        { id: 'a', chapterId: 'c', topicNo: 1, title: 'آغاز زیست‌شناسی' },
        { id: 'b', chapterId: 'c', topicNo: 2, title: 'گستره حیات' },
      ],
      pageStart: 4,
      pageEnd: 12,
    })).toBe('گفتار ۱: آغاز زیست‌شناسی، گفتار ۲: گستره حیات · صفحات ۴ تا ۱۲');
  });

  it('falls back to the server-derived legacy summary', () => {
    expect(formatTaskCurriculum({ topic: 'فصل اول', topics: [], pageStart: null, pageEnd: null })).toBe('فصل اول');
  });
});
