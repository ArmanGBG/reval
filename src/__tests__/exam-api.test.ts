import { describe, expect, it } from 'vitest';
import { parseExamResponse } from '@/lib/exam-api';

describe('exam API response', () => {
  it('preserves comprehensive and optional planning details', () => {
    const exam = parseExamResponse({
      id: 'exam-1',
      title: 'آزمون جامع شهریور',
      subject: 'آزمون جامع',
      subjectColor: '#E57373',
      scope: 'COMPREHENSIVE',
      description: 'مرور همه درس‌ها',
      subjectId: null,
      fieldType: null,
      chapterId: null,
      topicId: null,
      topicModeId: null,
      curriculumMode: null,
      curriculumLabel: null,
      pageStart: null,
      pageEnd: null,
      date: '2026-08-28',
      startTime: '08:00',
      duration: 90,
      totalScore: 100,
      status: 'upcoming',
      createdById: 'student-1',
      createdAt: new Date('2026-08-28T08:00:00Z'),
      participants: [{ studentId: 'student-1', lifecycleStatus: 'PENDING' }],
      results: [],
      analysisTasks: [{
        id: 'analysis-1', examId: 'exam-1', studentId: 'student-1', date: '2026-08-29',
        status: 'INCOMPLETE', completed: null, actualTimeMinutes: 35, advisorNote: 'غلط‌ها را دسته‌بندی کن',
        createdBy: 'advisor', createdById: 'advisor-1', createdAt: new Date('2026-08-28T09:00:00Z'), updatedAt: new Date('2026-08-28T10:00:00Z'),
      }],
      subjectAnalyses: [{
        id: 'subject-analysis-1', examId: 'exam-1', studentId: 'student-1', subjectName: 'زیست',
        analyzed: false, note: 'در ژنتیک مشکل داشتم', updatedAt: new Date('2026-08-28T11:00:00Z'),
      }],
    });

    expect(exam.scope).toBe('COMPREHENSIVE');
    expect(exam.subjectId).toBeNull();
    expect(exam.studentIds).toEqual(['student-1']);
    expect(exam.analysisTasks[0]).toMatchObject({ status: 'INCOMPLETE', actualTimeMinutes: 35, createdBy: 'advisor' });
    expect(exam.subjectAnalyses[0]).toMatchObject({ subjectName: 'زیست', analyzed: false, note: 'در ژنتیک مشکل داشتم' });
  });

  it('maps a subject exam curriculum label and result', () => {
    const exam = parseExamResponse({
      id: 'exam-2', title: 'آزمون فصل یک', subject: 'زیست‌شناسی ۱', subjectColor: '#3EB489',
      scope: 'SUBJECT', description: null, subjectId: 'subject-1', fieldType: 'کنکور',
      chapterId: 'chapter-1', topicId: 'topic-1', topicModeId: null, curriculumMode: 'BOOK',
      curriculumLabel: 'فصل ۱: دنیای زنده', pageStart: 1, pageEnd: 20, date: '2026-08-29',
      startTime: '09:00', duration: 60, totalScore: 20, status: 'completed', createdById: 'advisor-1',
      createdAt: new Date('2026-08-28T08:00:00Z'), participants: [{ studentId: 'student-1', lifecycleStatus: 'COMPLETED' }],
      results: [{ studentId: 'student-1', score: 18, rank: 2 }],
    });

    expect(exam.scope).toBe('SUBJECT');
    expect(exam.curriculumMode).toBe('BOOK');
    expect(exam.curriculumLabel).toContain('فصل ۱');
    expect(exam.results[0]).toEqual({ studentId: 'student-1', score: 18, rank: 2 });
    expect(exam.participantStates[0]).toEqual({ studentId: 'student-1', status: 'COMPLETED' });
  });
});
