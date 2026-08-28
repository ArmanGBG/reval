import { describe, expect, it } from 'vitest';
import { getExamParticipantStatus, isExamParticipantStatus, toggleExamCompletion } from '@/lib/exam-lifecycle';
import type { Exam } from '@/lib/types';

const exam = {
  participantStates: [
    { studentId: 'student-1', status: 'INCOMPLETE' },
    { studentId: 'student-2', status: 'COMPLETED' },
  ],
} as Exam;

describe('exam participant lifecycle', () => {
  it('keeps each group participant status independent', () => {
    expect(getExamParticipantStatus(exam, 'student-1')).toBe('INCOMPLETE');
    expect(getExamParticipantStatus(exam, 'student-2')).toBe('COMPLETED');
    expect(getExamParticipantStatus(exam, 'student-3')).toBe('PENDING');
  });

  it('toggles completion without conflating incomplete state', () => {
    expect(toggleExamCompletion('PENDING')).toBe('COMPLETED');
    expect(toggleExamCompletion('INCOMPLETE')).toBe('COMPLETED');
    expect(toggleExamCompletion('COMPLETED')).toBe('PENDING');
  });

  it('accepts only participant lifecycle statuses', () => {
    expect(isExamParticipantStatus('INCOMPLETE')).toBe(true);
    expect(isExamParticipantStatus('upcoming')).toBe(false);
  });
});
