// Client-side exam service — wraps fetch calls to /api/exams.
// Used by the Zustand store so components don't deal with fetch directly.

import type { Exam, ExamResult } from '@/lib/types';

export interface CreateExamInput {
  title: string;
  subject: string;
  subjectColor: string;
  date: string;
  startTime: string;
  duration: number;
  totalScore: number;
  studentIds: string[];
  status?: Exam['status'];
}

async function parseError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    return data.error ?? 'خطای ناشناخته';
  } catch {
    return `خطای HTTP ${res.status}`;
  }
}

// Load exams for the current user (advisor sees their created exams,
// student sees exams they're participating in).
export async function loadExams(opts?: {
  advisorId?: string;
  studentId?: string;
}): Promise<Exam[]> {
  const params = new URLSearchParams();
  if (opts?.advisorId) params.set('advisorId', opts.advisorId);
  if (opts?.studentId) params.set('studentId', opts.studentId);

  const qs = params.toString();
  const url = qs ? `/api/exams?${qs}` : '/api/exams';
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(await parseError(res));
  const data = await res.json();
  return data.exams as Exam[];
}

// Create a new exam via the API.
export async function createExam(input: CreateExamInput): Promise<Exam> {
  const res = await fetch('/api/exams', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await parseError(res));
  const data = await res.json();
  return data.exam as Exam;
}

// Update an exam (partial update).
export async function updateExam(
  id: string,
  updates: Partial<CreateExamInput & { status: Exam['status'] }>,
): Promise<Exam> {
  const res = await fetch(`/api/exams/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error(await parseError(res));
  const data = await res.json();
  return data.exam as Exam;
}

// Delete an exam.
export async function deleteExam(id: string): Promise<void> {
  const res = await fetch(`/api/exams/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(await parseError(res));
}

// Save exam results (bulk upsert: replaces all results for this exam).
// Each entry must have a studentId; score and rank are optional.
// Entries with neither score nor rank are dropped.
export async function saveExamResults(
  examId: string,
  results: Array<{ studentId: string; score?: number | null; rank?: number | null }>,
): Promise<ExamResult[]> {
  const res = await fetch(`/api/exams/${examId}/results`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ results }),
  });
  if (!res.ok) throw new Error(await parseError(res));
  const data = await res.json();
  return data.results as ExamResult[];
}

// Load exam results (advisor/manager see all; student sees only their own).
export async function loadExamResults(examId: string): Promise<ExamResult[]> {
  const res = await fetch(`/api/exams/${examId}/results`, { cache: 'no-store' });
  if (!res.ok) throw new Error(await parseError(res));
  const data = await res.json();
  return data.results as ExamResult[];
}
