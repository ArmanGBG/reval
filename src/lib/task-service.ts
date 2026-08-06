// ===== Task Service =====
// Single source of truth for all task API operations.
// The Zustand store calls these functions and keeps a local cache for UI.
// The DB (via /api/tasks) is the canonical data store — never read tasks
// from MOCK_TASKS for display; always go through this service.

import { Task } from '@/lib/types';

// Types for API payloads — what the client sends to the API.
// Note: `id` is NOT in the create payload (the DB generates it).
export interface CreateTaskPayload {
  studentId: string;
  subjectId: string;
  topic?: string | null;
  fieldType: Task['fieldType'];
  activityTypes?: string[] | null;
  targetTimeMinutes?: number | null;
  actualTimeMinutes?: number | null;
  targetTestCount?: number | null;
  actualTestCount?: number | null;
  completed?: boolean | null;
  detailsCompleted: boolean;
  date: string;
  order?: number;
  createdBy?: string;
  createdById?: string | null;
  chapterId?: string | null;
  topicId?: string | null;
  topicModeId?: string | null;
  pageStart?: number | null;
  pageEnd?: number | null;
}

export type UpdateTaskPayload = Omit<Partial<CreateTaskPayload>, 'subjectId'> & {
  subjectId?: string | null;
};

// Cast the API response (where activityTypes may be a JSON string or already
// parsed array) into a properly-typed Task.
function normalizeTask(raw: Record<string, unknown>): Task {
  let activityTypes: string[] | null = null;
  if (Array.isArray(raw.activityTypes)) {
    activityTypes = raw.activityTypes as string[];
  } else if (typeof raw.activityTypes === 'string') {
    try {
      const parsed = JSON.parse(raw.activityTypes);
      activityTypes = Array.isArray(parsed) ? parsed : [];
    } catch {
      activityTypes = [];
    }
  }
  return {
    id: raw.id as string,
    studentId: raw.studentId as string,
    subjectId: raw.subjectId as string,
    subject: raw.subject as string,
    subjectColor: raw.subjectColor as string,
    topic: (raw.topic as string | null) ?? null,
    fieldType: raw.fieldType as Task['fieldType'],
    activityTypes: activityTypes as Task['activityTypes'],
    targetTimeMinutes: (raw.targetTimeMinutes as number | null) ?? null,
    actualTimeMinutes:
      raw.actualTimeMinutes === null || raw.actualTimeMinutes === undefined
        ? null
        : (raw.actualTimeMinutes as number),
    targetTestCount: (raw.targetTestCount as number | null) ?? null,
    actualTestCount:
      raw.actualTestCount === null || raw.actualTestCount === undefined
        ? null
        : (raw.actualTestCount as number),
    completed:
      raw.completed === true ? true : raw.completed === false ? false : null,
    detailsCompleted: raw.detailsCompleted !== false,
    date: raw.date as string,
    order: raw.order as number,
    createdBy: raw.createdBy as Task['createdBy'],
    createdById: (raw.createdById as string | null) ?? null,
    chapterId: (raw.chapterId as string | null) ?? null,
    topicId: (raw.topicId as string | null) ?? null,
    topicModeId: (raw.topicModeId as string | null) ?? null,
    pageStart: (raw.pageStart as number | null) ?? null,
    pageEnd: (raw.pageEnd as number | null) ?? null,
  };
}

// ===== loadTasks =====
// Fetch tasks for a student, optionally filtered by date or date range.
// Returns a normalized Task[].
export async function loadTasks(opts: {
  studentId: string;
  date?: string;
  startDate?: string;
  endDate?: string;
}): Promise<Task[]> {
  const params = new URLSearchParams();
  params.set('studentId', opts.studentId);
  if (opts.date) params.set('date', opts.date);
  if (opts.startDate) params.set('startDate', opts.startDate);
  if (opts.endDate) params.set('endDate', opts.endDate);

  const res = await fetch(`/api/tasks?${params.toString()}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'خطا در بارگذاری وظایف');
  }
  const data = await res.json();
  const tasks = Array.isArray(data.tasks) ? data.tasks : [];
  return tasks.map((t: Record<string, unknown>) => normalizeTask(t));
}

// ===== createTask =====
// Create a single task. Returns the created task (with DB-generated id).
export async function createTask(
  payload: CreateTaskPayload,
): Promise<Task> {
  const res = await fetch('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'خطا در ایجاد وظیفه');
  }
  const data = await res.json();
  return normalizeTask(data.task as Record<string, unknown>);
}

// ===== createTasksBatch =====
// Create multiple tasks at once (for AI plan parser or weekly planner).
// Returns the created tasks.
export async function createTasksBatch(
  payloads: CreateTaskPayload[],
): Promise<Task[]> {
  if (payloads.length === 0) return [];
  const res = await fetch('/api/tasks/batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tasks: payloads }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'خطا در ایجاد دسته‌ای وظایف');
  }
  const data = await res.json();
  const tasks = Array.isArray(data.tasks) ? data.tasks : [];
  return tasks.map((t: Record<string, unknown>) => normalizeTask(t));
}

// ===== updateTask =====
// Partial-update a task. Returns the updated task.
export async function updateTask(
  taskId: string,
  updates: UpdateTaskPayload,
): Promise<Task> {
  const res = await fetch(`/api/tasks/${taskId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'خطا در به‌روزرسانی وظیفه');
  }
  const data = await res.json();
  return normalizeTask(data.task as Record<string, unknown>);
}

// ===== deleteTask =====
// Delete a task by id. Returns void (throws on error).
export async function deleteTask(taskId: string): Promise<void> {
  const res = await fetch(`/api/tasks/${taskId}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'خطا در حذف وظیفه');
  }
}

// ===== reorderTasks =====
// Update the `order` field for multiple tasks (used by drag-and-drop).
// Sends a batch PATCH with { id, order } pairs.
export async function reorderTasks(
  ordered: { id: string; order: number }[],
): Promise<void> {
  if (ordered.length === 0) return;
  const res = await fetch('/api/tasks/batch', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tasks: ordered }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'خطا در مرتب‌سازی وظایف');
  }
}
