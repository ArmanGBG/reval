// ===== Subject Management Types =====
// These mirror the Prisma models for client-side use.
//
// Subject stores shared metadata. Eligibility and both curriculum structures
// are scoped to GradeSubject.

export interface Topic {
  id: string;
  chapterId: string;
  title: string;
  topicNo: number;
  pageStart: number | null;
  pageEnd: number | null;
  sortOrder: number;
  isActive: boolean;
}

export interface Chapter {
  id: string;
  gradeSubjectId: string;
  title: string;
  chapterNo: number;
  pageStart: number | null;
  pageEnd: number | null;
  sortOrder: number;
  isActive: boolean;
  topics?: Topic[];
}

export interface TopicMode {
  id: string;
  gradeSubjectId: string;
  title: string;
  description: string | null;
  modeNo: number;
  sortOrder: number;
  isActive: boolean;
  subtopics?: TopicModeSubtopic[];
}

export interface TopicModeSubtopic {
  id: string;
  topicModeId: string;
  title: string;
  subtopicNo: number;
  sortOrder: number;
  isActive: boolean;
}

export interface GradeSubject {
  id: string;
  subjectId: string;
  grade: string; // دهم | یازدهم | دوازدهم
  major: string; // تجربی | ریاضی | انسانی
  sortOrder: number;
  isKonkur: boolean;
  isFinal: boolean;
  isActive: boolean;
  chapters?: Chapter[];
  topicModes?: TopicMode[];
}

export interface Subject {
  id: string;
  name: string;
  color: string;
  icon: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  grades?: GradeSubject[];
}

// ===== Constants =====
// Valid subject-grade values (the user-facing Grade type in lib/types.ts
// also includes "فارغ‌التحصیل" for user profiles, but GradeSubject.grade
// is restricted to the three below per the API).
export const GRADES = ['دهم', 'یازدهم', 'دوازدهم'] as const;
export const MAJORS = ['تجربی', 'ریاضی', 'انسانی'] as const;
