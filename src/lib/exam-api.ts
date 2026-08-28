import type { Exam, FieldType } from '@/lib/types';

type ExamRow = {
  id: string;
  title: string;
  subject: string;
  subjectColor: string;
  scope: string;
  description: string | null;
  subjectId: string | null;
  fieldType: string | null;
  chapterId: string | null;
  topicId: string | null;
  topicModeId: string | null;
  curriculumMode: string | null;
  curriculumLabel: string | null;
  pageStart: number | null;
  pageEnd: number | null;
  date: string;
  startTime: string;
  duration: number;
  totalScore: number;
  status: string;
  createdById: string;
  createdAt: Date;
  participants: Array<{ studentId: string; lifecycleStatus: string }>;
  results: Array<{ studentId: string; score: number | null; rank: number | null }>;
  analysisTasks?: Array<{
    id: string;
    examId: string;
    studentId: string;
    date: string;
    status: string;
    completed: boolean | null;
    actualTimeMinutes: number | null;
    advisorNote: string | null;
    createdBy: string;
    createdById: string | null;
    createdAt: Date;
    updatedAt: Date;
  }>;
  subjectAnalyses?: Array<{
    id: string;
    examId: string;
    studentId: string;
    subjectName: string;
    analyzed: boolean;
    note: string | null;
    updatedAt: Date;
  }>;
};

function normalizeAnalysisTaskStatus(status: string): 'PENDING' | 'COMPLETED' | 'INCOMPLETE' {
  if (status === 'COMPLETED' || status === 'INCOMPLETE') return status;
  return 'PENDING';
}

export function parseExamResponse(row: ExamRow): Exam {
  return {
    id: row.id,
    title: row.title,
    subject: row.subject,
    subjectColor: row.subjectColor,
    scope: row.scope === 'SUBJECT' ? 'SUBJECT' : 'COMPREHENSIVE',
    description: row.description,
    subjectId: row.subjectId,
    fieldType: row.fieldType as FieldType | null,
    chapterId: row.chapterId,
    topicId: row.topicId,
    topicModeId: row.topicModeId,
    curriculumMode: row.curriculumMode === 'BOOK' || row.curriculumMode === 'THEMATIC' ? row.curriculumMode : null,
    curriculumLabel: row.curriculumLabel,
    pageStart: row.pageStart,
    pageEnd: row.pageEnd,
    date: row.date,
    startTime: row.startTime,
    duration: row.duration,
    totalScore: row.totalScore,
    studentIds: row.participants.map((participant) => participant.studentId),
    participantStates: row.participants.map((participant) => ({
      studentId: participant.studentId,
      status: participant.lifecycleStatus === 'COMPLETED' || participant.lifecycleStatus === 'INCOMPLETE'
        ? participant.lifecycleStatus
        : 'PENDING',
    })),
    analysisTasks: (row.analysisTasks ?? []).map((task) => {
      const status = normalizeAnalysisTaskStatus(task.status);
      return {
        ...task,
        status,
        completed: status === 'COMPLETED' ? true : null,
        createdBy: task.createdBy === 'advisor' ? 'advisor' : 'student',
        createdAt: task.createdAt.toISOString(),
        updatedAt: task.updatedAt.toISOString(),
      };
    }),
    subjectAnalyses: (row.subjectAnalyses ?? []).map((analysis) => ({
      ...analysis,
      updatedAt: analysis.updatedAt.toISOString(),
    })),
    status: row.status as Exam['status'],
    results: row.results.map((result) => ({
      studentId: result.studentId,
      score: result.score,
      rank: result.rank,
    })),
    createdBy: row.createdById,
    createdAt: row.createdAt.toISOString(),
  };
}
