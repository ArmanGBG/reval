import type { Task } from '@/lib/types';

function toPersianDigits(value: number): string {
  return String(value).replace(/\d/g, (digit) => '۰۱۲۳۴۵۶۷۸۹'[Number(digit)]);
}

export function formatTaskCurriculum(task: Pick<Task, 'topic' | 'topics' | 'chapter' | 'pageStart' | 'pageEnd'>): string | null {
  const chapterText = task.chapter
    ? `فصل ${toPersianDigits(task.chapter.chapterNo)}: ${task.chapter.title}`
    : null;
  const topicText = task.topics?.length
    ? task.topics.map((topic) => `گفتار ${toPersianDigits(topic.topicNo)}: ${topic.title}`).join('، ')
    : task.topic;
  const pageText = task.pageStart != null && task.pageEnd != null
    ? `صفحات ${toPersianDigits(task.pageStart)} تا ${toPersianDigits(task.pageEnd)}`
    : task.pageStart != null ? `از صفحه ${toPersianDigits(task.pageStart)}` : null;
  return [chapterText, topicText && topicText !== task.chapter?.title ? topicText : null, pageText].filter(Boolean).join(' · ') || null;
}
