import type { TaskStatus } from '@/lib/types';

export const TASK_STATUSES: TaskStatus[] = ['DRAFT', 'PENDING', 'COMPLETED', 'SKIPPED', 'INCOMPLETE'];

export const STUDENT_ADVISOR_TASK_PATCH_FIELDS = ['status', 'completed', 'actualTimeMinutes', 'actualTestCount'] as const;
export const ADVISOR_PLAN_TASK_PATCH_FIELDS = [
  'subjectId', 'fieldType', 'activityTypes', 'targetTimeMinutes', 'targetTestCount',
  'detailsCompleted', 'date', 'order', 'status', 'completed', 'actualTimeMinutes', 'actualTestCount', 'chapterId', 'topicId', 'topicIds',
  'topicModeId', 'topicModeSubtopicIds', 'curriculumMode', 'pageStart', 'pageEnd',
  'teacherClassName', 'sessionNumber', 'bookName', 'testDescription',
  'advisorNote',
] as const;
export const STUDENT_CLASS_DRAFT_COMPLETION_FIELDS = [
  'subjectId', 'fieldType', 'activityTypes', 'targetTimeMinutes', 'actualTimeMinutes',
  'targetTestCount', 'actualTestCount', 'completed', 'status', 'detailsCompleted',
  'chapterId', 'topicId', 'topicIds', 'topicModeId', 'topicModeSubtopicIds',
  'curriculumMode', 'pageStart', 'pageEnd', 'teacherClassName', 'sessionNumber',
  'bookName', 'testDescription',
] as const;

export function isTaskStatus(value: unknown): value is TaskStatus {
  return typeof value === 'string' && TASK_STATUSES.includes(value as TaskStatus);
}

export function legacyTaskStatus(detailsCompleted: boolean, completed: boolean | null): TaskStatus {
  if (!detailsCompleted) return 'DRAFT';
  if (completed === true) return 'COMPLETED';
  if (completed === false) return 'SKIPPED';
  return 'PENDING';
}

export function validateTaskLifecycle(
  status: TaskStatus,
  detailsCompleted: boolean,
  completed: boolean | null,
  allowIncompleteDetails = false,
): string | null {
  if (status === 'DRAFT' && (detailsCompleted || completed !== null)) return 'DRAFT باید بدون جزئیات اجرایی و بدون نتیجه باشد';
  if (status === 'PENDING' && ((!detailsCompleted && !allowIncompleteDetails) || completed !== null)) return 'PENDING باید جزئیات کامل و نتیجه خالی داشته باشد';
  if (status === 'COMPLETED' && ((!detailsCompleted && !allowIncompleteDetails) || completed !== true)) return 'COMPLETED باید جزئیات کامل و نتیجه true داشته باشد';
  if (status === 'SKIPPED' && ((!detailsCompleted && !allowIncompleteDetails) || completed !== false)) return 'SKIPPED باید جزئیات کامل و نتیجه false داشته باشد';
  if (status === 'INCOMPLETE' && ((!detailsCompleted && !allowIncompleteDetails) || completed !== null)) return 'INCOMPLETE باید جزئیات کامل و نتیجه خالی داشته باشد';
  return null;
}

export function completedValueForTaskStatus(status: TaskStatus): boolean | null {
  if (status === 'COMPLETED') return true;
  if (status === 'SKIPPED') return false;
  return null;
}

export function canMoveTaskToDate(status: TaskStatus): boolean {
  return status === 'PENDING' || status === 'INCOMPLETE';
}

export function moveTaskToDateTransition(date: string) {
  return { date, status: 'PENDING' as const, completed: null };
}

export function moveTaskToIncompleteTransition() {
  return { status: 'INCOMPLETE' as const, completed: null };
}

export function isTaskVisibleOnScheduledDay(status: TaskStatus | undefined, detailsCompleted: boolean | undefined): boolean {
  if (status === 'DRAFT' || status === 'PENDING' || status === 'COMPLETED' || status === 'SKIPPED' || status === 'INCOMPLETE') return true;
  return detailsCompleted !== false;
}

export function isStudentAdvisorTaskPatch(body: Record<string, unknown>): boolean {
  const allowed = new Set<string>(STUDENT_ADVISOR_TASK_PATCH_FIELDS);
  return Object.keys(body).length > 0 && Object.keys(body).every((key) => allowed.has(key));
}

export function isStudentClassDraftCompletionPatch(body: Record<string, unknown>): boolean {
  const allowed = new Set<string>(STUDENT_CLASS_DRAFT_COMPLETION_FIELDS);
  if (Object.keys(body).length === 0 || !Object.keys(body).every((key) => allowed.has(key))) return false;
  if (body.status !== 'PENDING' || typeof body.detailsCompleted !== 'boolean' || body.completed !== null) return false;
  return Array.isArray(body.activityTypes)
    && body.activityTypes.length === 1
    && body.activityTypes[0] === 'کلاس/ویدیو';
}

export function isAdvisorPlanTaskPatch(body: Record<string, unknown>): boolean {
  const allowed = new Set<string>(ADVISOR_PLAN_TASK_PATCH_FIELDS);
  if (Object.keys(body).length === 0 || !Object.keys(body).every((key) => allowed.has(key))) return false;
  if ('status' in body && body.status !== 'DRAFT' && body.status !== 'PENDING') return false;
  if ('completed' in body && body.completed !== null) return false;
  if ('actualTimeMinutes' in body && body.actualTimeMinutes !== null && (typeof body.actualTimeMinutes !== 'number' || body.actualTimeMinutes < 0)) return false;
  if ('actualTestCount' in body && body.actualTestCount !== null && (typeof body.actualTestCount !== 'number' || body.actualTestCount < 0)) return false;
  return true;
}

export function isAdvisorMoveTaskPatch(body: Record<string, unknown>): boolean {
  const keys = Object.keys(body).sort();
  return keys.length === 3 && keys[0] === 'completed' && keys[1] === 'date' && keys[2] === 'status'
    && typeof body.date === 'string' && body.status === 'PENDING' && body.completed === null;
}
