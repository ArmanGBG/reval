// ===== School Presence Service =====
// Client-side API caller for SchoolPresence records.

import { apiFetch, parseError } from '@/lib/api-client';
import { SchoolPresence } from '@/lib/types';
import { isValidTimeString } from '@/lib/school-presence';

export interface SaveSchoolPresencePayload {
  userId: string;
  date: string;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
}

function normalize(raw: Record<string, unknown>): SchoolPresence {
  return {
    id: raw.id as string,
    userId: (raw.userId ?? raw.studentId) as string,
    date: raw.date as string,
    startTime: raw.startTime as string,
    endTime: raw.endTime as string,
    durationMinutes: raw.durationMinutes as number,
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : undefined,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : undefined,
  };
}

export async function loadSchoolPresences(studentId: string, startDate?: string, endDate?: string): Promise<SchoolPresence[]> {
  const params = new URLSearchParams({ studentId });
  if (startDate) params.set('startDate', startDate);
  if (endDate) params.set('endDate', endDate);

  const res = await apiFetch(`/api/school-presence?${params.toString()}`, { method: 'GET' });
  if (!res.ok) throw new Error(await parseError(res, 'خطا در بارگذاری ساعات مدرسه'));
  const data = await res.json();
  return Array.isArray(data.schoolPresences)
    ? (data.schoolPresences as Record<string, unknown>[]).map(normalize)
    : [];
}

export async function saveSchoolPresence(payload: SaveSchoolPresencePayload): Promise<SchoolPresence> {
  if (!isValidTimeString(payload.startTime) || !isValidTimeString(payload.endTime)) {
    throw new Error('ساعت شروع و پایان مدرسه معتبر نیست');
  }

  const res = await apiFetch('/api/school-presence', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error(await parseError(res, 'خطا در ثبت ساعت مدرسه'));
  const data = await res.json();
  return normalize(data.schoolPresence as Record<string, unknown>);
}

export async function deleteSchoolPresence(id: string): Promise<void> {
  const res = await apiFetch(`/api/school-presence?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(await parseError(res, 'خطا در حذف ساعت مدرسه'));
}
