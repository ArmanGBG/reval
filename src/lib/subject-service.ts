import { apiFetch } from '@/lib/api-client';

export type SubjectOption = {
  id: string;
  name: string;
  color: string;
};

export async function loadSubjectOptions(): Promise<SubjectOption[]> {
  const response = await apiFetch('/api/subjects', { cache: 'no-store' });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'خطا در بارگذاری دروس');
  return Array.isArray(data.subjects)
    ? data.subjects.map((subject: SubjectOption) => ({
        id: subject.id,
        name: subject.name,
        color: subject.color,
      }))
    : [];
}
