import type { TaskStatus } from '@/lib/types';

export const TASK_STATUSES: TaskStatus[] = ['DRAFT', 'PENDING', 'COMPLETED', 'SKIPPED', 'INCOMPLETE'];

export const STUDENT_ADVISOR_TASK_PATCH_FIELDS = ['status', 'completed', 'actualTimeMinutes', 'actualTestCount'] as const;

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
): string | null {
  if (status === 'DRAFT' && (detailsCompleted || completed !== null)) return 'DRAFT باید بدون جزئیات اجرایی و بدون نتیجه باشد';
  if (status === 'PENDING' && (!detailsCompleted || completed !== null)) return 'PENDING باید جزئیات کامل و نتیجه خالی داشته باشد';
  if (status === 'COMPLETED' && (!detailsCompleted || completed !== true)) return 'COMPLETED باید جزئیات کامل و نتیجه true داشته باشد';
  if (status === 'SKIPPED' && (!detailsCompleted || completed !== false)) return 'SKIPPED باید جزئیات کامل و نتیجه false داشته باشد';
  if (status === 'INCOMPLETE' && (!detailsCompleted || completed !== null)) return 'INCOMPLETE باید جزئیات کامل و نتیجه خالی داشته باشد';
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

export function isStudentAdvisorTaskPatch(body: Record<string, unknown>): boolean {
  const allowed = new Set<string>(STUDENT_ADVISOR_TASK_PATCH_FIELDS);
  return Object.keys(body).length > 0 && Object.keys(body).every((key) => allowed.has(key));
}
