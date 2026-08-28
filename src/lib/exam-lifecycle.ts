import type { Exam, ExamParticipantStatus } from '@/lib/types';

export const EXAM_PARTICIPANT_STATUSES = ['PENDING', 'COMPLETED', 'INCOMPLETE'] as const;

export function isExamParticipantStatus(value: unknown): value is ExamParticipantStatus {
  return EXAM_PARTICIPANT_STATUSES.includes(value as ExamParticipantStatus);
}

export function getExamParticipantStatus(exam: Exam, studentId: string): ExamParticipantStatus {
  return (exam.participantStates ?? []).find((participant) => participant.studentId === studentId)?.status ?? 'PENDING';
}

export function toggleExamCompletion(status: ExamParticipantStatus): ExamParticipantStatus {
  return status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
}
