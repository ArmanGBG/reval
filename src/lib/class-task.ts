import type { ActivityType, Task } from '@/lib/types';

export const CLASS_ACTIVITY_TYPES: ActivityType[] = ['کلاس/ویدیو'];

export function isClassActivityTypes(value: unknown): value is ['کلاس/ویدیو'] {
  return Array.isArray(value) && value.length === 1 && value[0] === 'کلاس/ویدیو';
}

export function isClassTask(task: Pick<Task, 'activityTypes'>): boolean {
  return isClassActivityTypes(task.activityTypes);
}

export function withoutClassActivity(activityTypes: ActivityType[] | null | undefined): ActivityType[] {
  return (activityTypes ?? []).filter((activity) => activity !== 'کلاس/ویدیو');
}

export function classSessionDetailsComplete(teacherClassName: unknown, sessionNumber: unknown): boolean {
  return typeof teacherClassName === 'string'
    && teacherClassName.trim().length > 0
    && typeof sessionNumber === 'string'
    && sessionNumber.trim().length > 0;
}

export function buildClassDraft({
  id,
  studentId,
  subjectId,
  subject,
  subjectColor,
  teacherClassName,
  sessionNumber,
  date,
  order,
  createdBy,
  createdById,
}: {
  id: string;
  studentId: string;
  subjectId: string;
  subject: string;
  subjectColor: string;
  teacherClassName: string;
  sessionNumber: string;
  date: string;
  order: number;
  createdBy: Task['createdBy'];
  createdById: string | null;
}): Task {
  return {
    id,
    studentId,
    subjectId,
    subject,
    subjectColor,
    topic: null,
    fieldType: null,
    activityTypes: CLASS_ACTIVITY_TYPES,
    targetTimeMinutes: null,
    actualTimeMinutes: null,
    targetTestCount: null,
    actualTestCount: null,
    status: 'DRAFT',
    completed: null,
    date,
    order,
    createdBy,
    createdById,
    chapterId: null,
    topicId: null,
    topicIds: [],
    topicModeId: null,
    curriculumMode: null,
    topicModeSubtopicIds: [],
    pageStart: null,
    pageEnd: null,
    teacherClassName: teacherClassName.trim(),
    sessionNumber: sessionNumber.trim(),
    detailsCompleted: false,
  };
}
