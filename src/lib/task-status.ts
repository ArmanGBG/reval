import type { TaskStatus } from '@/lib/types';

export const TASK_STATUSES: TaskStatus[] = ['DRAFT', 'PENDING', 'COMPLETED', 'SKIPPED', 'INCOMPLETE'];

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
