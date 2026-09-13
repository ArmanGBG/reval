// ===== Sleep Service =====
// API client for sleep records. Mirrors non-study-activity-service.

import { apiFetch, parseError } from '@/lib/api-client';
import { type SleepRecordData, type SleepType, isValidTimeString, nightSleepMinutes } from '@/lib/sleep';

export interface SaveNightSleepPayload {
  studentId: string;
  date: string;
  startTime: string; // bedtime HH:mm
  endTime: string; // wake HH:mm
}

export interface SaveNapPayload {
  studentId: string;
  date: string;
  startTime: string;
  durationMinutes: number;
}

function normalize(raw: Record<string, unknown>): SleepRecordData {
  return {
    id: raw.id as string,
    studentId: raw.studentId as string,
    type: raw.type as SleepType,
    date: raw.date as string,
    startTime: raw.startTime as string,
    endTime: (raw.endTime as string | null) ?? null,
    durationMinutes: raw.durationMinutes as number,
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : undefined,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : undefined,
  };
}

export async function loadSleepRecords(studentId: string): Promise<SleepRecordData[]> {
  const params = new URLSearchParams({ studentId });
  const res = await apiFetch(`/api/sleep?${params.toString()}`, { method: 'GET' });
  if (!res.ok) throw new Error(await parseError(res, 'خطا در بارگذاری خواب'));
  const data = await res.json();
  return Array.isArray(data.records) ? (data.records as Record<string, unknown>[]).map(normalize) : [];
}

export async function saveNightSleep(payload: SaveNightSleepPayload): Promise<SleepRecordData> {
  if (!isValidTimeString(payload.startTime) || !isValidTimeString(payload.endTime)) {
    throw new Error('ساعت خواب و بیداری معتبر نیست');
  }
  const res = await apiFetch('/api/sleep', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      studentId: payload.studentId,
      type: 'NIGHT',
      date: payload.date,
      startTime: payload.startTime.trim(),
      endTime: payload.endTime.trim(),
      durationMinutes: nightSleepMinutes(payload.startTime.trim(), payload.endTime.trim()),
    }),
  });
  if (!res.ok) throw new Error(await parseError(res, 'خطا در ثبت خواب شبانه'));
  return normalize((await res.json()).record as Record<string, unknown>);
}

export async function saveNap(payload: SaveNapPayload): Promise<SleepRecordData> {
  if (!isValidTimeString(payload.startTime)) throw new Error('ساعت شروع چرت معتبر نیست');
  if (!Number.isFinite(payload.durationMinutes) || payload.durationMinutes <= 0 || payload.durationMinutes > 480) {
    throw new Error('مدت چرت باید بین ۱ تا ۴۸۰ دقیقه باشد');
  }
  const res = await apiFetch('/api/sleep', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      studentId: payload.studentId,
      type: 'NAP',
      date: payload.date,
      startTime: payload.startTime.trim(),
      durationMinutes: Math.round(payload.durationMinutes),
    }),
  });
  if (!res.ok) throw new Error(await parseError(res, 'خطا در ثبت چرت'));
  return normalize((await res.json()).record as Record<string, unknown>);
}

export async function deleteSleepRecord(id: string): Promise<void> {
  const res = await apiFetch(`/api/sleep/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(await parseError(res, 'خطا در حذف رکورد خواب'));
}
