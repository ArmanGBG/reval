// ===== Task Service =====
// Single source of truth for all task API operations.
// The Zustand store calls these functions and keeps a local cache for UI.
// The DB (via /api/tasks) is the canonical data store for displayed tasks.

import { Task } from '@/lib/types';
import { apiFetch, parseError } from '@/lib/api-client';
import { isClassTask } from '@/lib/class-task';

// Types for API payloads — what the client sends to the API.
// Note: `id` is NOT in the create payload (the DB generates it).
export interface CreateTaskPayload {
  studentId: string;
  subjectId: string;
  topic?: string | null;
  fieldType?: Task['fieldType'];
  activityTypes?: Task['activityTypes'];
  targetTimeMinutes?: number | null;
  actualTimeMinutes?: number | null;
  targetTestCount?: number | null;
  actualTestCount?: number | null;
  completed?: boolean | null;
  status?: Task['status'];
  detailsCompleted: boolean;
  date: string;
  order?: number;
  createdBy?: Task['createdBy'];
  createdById?: string | null;
  chapterId?: string | null;
  topicId?: string | null;
  topicIds?: string[];
  topicModeId?: string | null;
  curriculumMode?: Task['curriculumMode'];
  topicModeSubtopicIds?: string[];
  pageStart?: number | null;
  pageEnd?: number | null;
  teacherClassName?: string | null;
  sessionNumber?: string | null;
  bookName?: string | null;
  testDescription?: string | null;
  advisorNote?: string | null;
}

export type UpdateTaskPayload = Omit<Partial<CreateTaskPayload>, 'studentId' | 'createdBy' | 'createdById' | 'subjectId' | 'topic'> & {
  subjectId?: string | null;
};

export function buildTaskDetailsUpdate(task: Task, nextTask: Task): UpdateTaskPayload {
  const {
    id: _id,
    studentId: _studentId,
    createdBy: _createdBy,
    createdById: _createdById,
    subject: _subject,
    subjectColor: _subjectColor,
    topic: _topic,
    topics: _topics,
    topicModeSubtopics: _topicModeSubtopics,
    createdAt: _createdAt,
    updatedAt: _updatedAt,
    date: _date,
    order: _order,
    ...draftUpdates
  } = nextTask;
  const updates: UpdateTaskPayload = { ...draftUpdates };
  if (task.status === 'COMPLETED' || task.status === 'SKIPPED') {
    delete updates.status;
    delete updates.completed;
    if (isClassTask(task)) {
      updates.detailsCompleted = nextTask.detailsCompleted;
    } else {
      delete updates.actualTimeMinutes;
      delete updates.actualTestCount;
      delete updates.detailsCompleted;
    }
  }
  return updates;
}

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
  const status: Task['status'] =
    raw.status === 'DRAFT' ||
    raw.status === 'PENDING' ||
    raw.status === 'COMPLETED' ||
    raw.status === 'SKIPPED' ||
    raw.status === 'INCOMPLETE'
      ? raw.status
      : raw.detailsCompleted === false
        ? 'DRAFT'
        : raw.completed === true
          ? 'COMPLETED'
          : raw.completed === false
            ? 'SKIPPED'
            : 'PENDING';
  return {
    id: raw.id as string,
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : undefined,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : undefined,
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
    status,
    completed:
      raw.completed === true ? true : raw.completed === false ? false : null,
    detailsCompleted: raw.detailsCompleted !== false,
    date: raw.date as string,
    order: raw.order as number,
    createdBy: raw.createdBy as Task['createdBy'],
    createdById: (raw.createdById as string | null) ?? null,
    chapterId: (raw.chapterId as string | null) ?? null,
    chapter: raw.chapter && typeof raw.chapter === 'object'
      ? raw.chapter as { id: string; title: string; chapterNo: number }
      : null,
    topicId: (raw.topicId as string | null) ?? null,
    topicIds: Array.isArray(raw.topicIds)
      ? raw.topicIds.filter((id): id is string => typeof id === 'string')
      : typeof raw.topicId === 'string' ? [raw.topicId] : [],
    topics: Array.isArray(raw.topics)
      ? raw.topics.filter((topic): topic is { id: string; title: string; topicNo: number; chapterId: string } => {
          if (!topic || typeof topic !== 'object') return false;
          const value = topic as Record<string, unknown>;
          return typeof value.id === 'string' && typeof value.title === 'string' && typeof value.topicNo === 'number' && typeof value.chapterId === 'string';
        })
      : [],
    topicModeId: (raw.topicModeId as string | null) ?? null,
    curriculumMode: raw.curriculumMode === 'BOOK' || raw.curriculumMode === 'THEMATIC' ? raw.curriculumMode : null,
    topicModeSubtopicIds: Array.isArray(raw.topicModeSubtopicIds)
      ? raw.topicModeSubtopicIds.filter((id): id is string => typeof id === 'string')
      : [],
    topicModeSubtopics: Array.isArray(raw.topicModeSubtopics)
      ? raw.topicModeSubtopics.filter((subtopic): subtopic is { id: string; title: string; subtopicNo: number; topicModeId: string } => {
          if (!subtopic || typeof subtopic !== 'object') return false;
          const value = subtopic as Record<string, unknown>;
          return typeof value.id === 'string' && typeof value.title === 'string' && typeof value.subtopicNo === 'number' && typeof value.topicModeId === 'string';
        })
      : [],
    pageStart: (raw.pageStart as number | null) ?? null,
    pageEnd: (raw.pageEnd as number | null) ?? null,
    teacherClassName: (raw.teacherClassName as string | null) ?? null,
    sessionNumber: (raw.sessionNumber as string | null) ?? null,
    bookName: (raw.bookName as string | null) ?? null,
    testDescription: (raw.testDescription as string | null) ?? null,
    advisorNote: (raw.advisorNote as string | null) ?? null,
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

  const res = await apiFetch(`/api/tasks?${params.toString()}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    throw new Error(await parseError(res, 'خطا در بارگذاری وظایف'));
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
  const res = await apiFetch('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(await parseError(res, 'خطا در ایجاد وظیفه'));
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
  const res = await apiFetch('/api/tasks/batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tasks: payloads }),
  });
  if (!res.ok) {
    throw new Error(await parseError(res, 'خطا در ایجاد دسته‌ای وظایف'));
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
  const res = await apiFetch(`/api/tasks/${taskId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) {
    throw new Error(await parseError(res, 'خطا در به‌روزرسانی وظیفه'));
  }
  const data = await res.json();
  return normalizeTask(data.task as Record<string, unknown>);
}

// ===== deleteTask =====
// Delete a task by id. Returns void (throws on error).
export async function deleteTask(taskId: string): Promise<void> {
  const res = await apiFetch(`/api/tasks/${taskId}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    throw new Error(await parseError(res, 'خطا در حذف وظیفه'));
  }
}

// ===== AuthError re-export for callers =====
// Allows components to check `err instanceof AuthError` and suppress
// duplicate error toasts (the global handler already shows a redirect notice).
export { AuthError } from '@/lib/api-client';

// ===== reorderTasks =====
// Update the `order` field for multiple tasks (used by drag-and-drop).
// Sends a batch PATCH with { id, order } pairs.
export async function reorderTasks(
  ordered: { id: string; order: number }[],
): Promise<void> {
  if (ordered.length === 0) return;
  const res = await apiFetch('/api/tasks/batch', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tasks: ordered }),
  });
  if (!res.ok) {
    throw new Error(await parseError(res, 'خطا در مرتب‌سازی وظایف'));
  }
}
