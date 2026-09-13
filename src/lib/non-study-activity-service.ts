// ===== Non-Study Activity Service =====
// API client for personal, non-curricular activities. Mirrors the
// task-service pattern: the Zustand store calls these and keeps a cache.

import { NonStudyActivity } from '@/lib/types';
import { apiFetch, parseError } from '@/lib/api-client';

export interface CreateNonStudyActivityPayload {
  studentId: string;
  category: string;
  durationMinutes?: number | null;
  date: string;
}

function normalizeActivity(raw: Record<string, unknown>): NonStudyActivity {
  return {
    id: raw.id as string,
    studentId: raw.studentId as string,
    category: raw.category as string,
    durationMinutes:
      raw.durationMinutes === null || raw.durationMinutes === undefined
        ? null
        : (raw.durationMinutes as number),
    date: raw.date as string,
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : undefined,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : undefined,
  };
}

export async function loadNonStudyActivities(opts: {
  studentId: string;
  date?: string;
  startDate?: string;
  endDate?: string;
}): Promise<NonStudyActivity[]> {
  const params = new URLSearchParams();
  params.set('studentId', opts.studentId);
  if (opts.date) params.set('date', opts.date);
  if (opts.startDate) params.set('startDate', opts.startDate);
  if (opts.endDate) params.set('endDate', opts.endDate);
  const res = await apiFetch(`/api/non-study-activities?${params.toString()}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    throw new Error(await parseError(res, 'خطا در بارگذاری فعالیت‌های غیردرسی'));
  }
  const data = await res.json();
  const activities = Array.isArray(data.activities) ? data.activities : [];
  return activities.map((item: Record<string, unknown>) => normalizeActivity(item));
}

export async function createNonStudyActivity(
  payload: CreateNonStudyActivityPayload,
): Promise<NonStudyActivity> {
  const res = await apiFetch('/api/non-study-activities', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(await parseError(res, 'خطا در ثبت فعالیت غیردرسی'));
  }
  const data = await res.json();
  return normalizeActivity(data.activity as Record<string, unknown>);
}

export async function deleteNonStudyActivity(activityId: string): Promise<void> {
  const res = await apiFetch(`/api/non-study-activities/${activityId}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    throw new Error(await parseError(res, 'خطا در حذف فعالیت غیردرسی'));
  }
}
