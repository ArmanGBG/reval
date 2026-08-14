import { db } from '@/lib/db';

export async function findActiveGradeSubject(subjectId: string, gradeSubjectId: string) {
  return db.gradeSubject.findFirst({
    where: { id: gradeSubjectId, subjectId, isActive: true, subject: { isActive: true } },
    select: { id: true, subjectId: true, grade: true, major: true },
  });
}

export async function findActiveTopicMode(subjectId: string, gradeSubjectId: string, modeId: string) {
  return db.topicMode.findFirst({
    where: {
      id: modeId,
      gradeSubjectId,
      isActive: true,
      gradeSubject: { subjectId, isActive: true },
    },
    include: {
      subtopics: { where: { isActive: true }, orderBy: { subtopicNo: 'asc' } },
    },
  });
}

export function parsePositiveInteger(value: unknown): number | null {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 ? value : null;
}

export function parseNonNegativeInteger(value: unknown): number | null {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 ? value : null;
}

export function parseRequiredText(value: unknown, field: string): { value: string } | { error: string } {
  if (typeof value !== 'string' || !value.trim()) return { error: `${field} الزامی است` };
  return { value: value.trim() };
}

export function parseNullableText(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  return typeof value === 'string' ? value.trim() || null : undefined;
}

export async function syncTopicModeTaskSummaries(modeId: string) {
  const mode = await db.topicMode.findUnique({ where: { id: modeId }, select: { title: true } });
  if (!mode) return;
  const tasks = await db.task.findMany({
    where: { topicModeId: modeId },
    select: {
      id: true,
      topicModeSubtopics: {
        select: { subtopic: { select: { title: true, subtopicNo: true } } },
      },
    },
  });
  if (tasks.length === 0) return;
  await db.$transaction(tasks.map((task) => {
    const titles = task.topicModeSubtopics
      .map((row) => row.subtopic)
      .sort((a, b) => a.subtopicNo - b.subtopicNo)
      .map((subtopic) => subtopic.title);
    return db.task.update({ where: { id: task.id }, data: { topic: [mode.title, ...titles].join(' · ') } });
  }));
}
