// ===== Subject Management Types =====
// These mirror the Prisma models for client-side use.
//
// Schema (Task 12-a):
//   - Subject has only: name, color, icon, sortOrder, isKonkur, isActive.
//     Old fields (assessmentType, displayStrategy, category, finalStrategy)
//     are kept here as OPTIONAL for backward-compat with student/advisor
//     components that still reference them — the new API no longer returns
//     these fields, so they will be `undefined` at runtime.
//   - GradeSubject has: subjectId, grade, major, sortOrder, isActive.
//     (depth / allowOptionalSubtopic removed — kept as optional for legacy
//     student/advisor components.)
//   - Chapter belongs to GradeSubject (gradeSubjectId), has pageStart /
//     pageEnd / isLastPage. Old fields (subjectId, grade, assessmentType,
//     weight) kept as optional for backward compat.
//   - Topic has pageStart / pageEnd / isLastPage.
//   - TopicMode: unchanged.

export interface Topic {
  id: string;
  chapterId: string;
  title: string;
  topicNo: number;
  pageStart: number | null;
  pageEnd: number | null;
  isLastPage: boolean;
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
  isLastPage: boolean;
  sortOrder: number;
  isActive: boolean;
  topics?: Topic[];
  // Legacy fields (no longer returned by the API; kept optional for
  // backward-compat with student/advisor components that still read them).
  subjectId?: string;
  grade?: string;
  assessmentType?: string | null;
  weight?: number | null;
}

export interface TopicMode {
  id: string;
  subjectId: string;
  title: string;
  description: string | null;
  modeNo: number;
  sortOrder: number;
  isActive: boolean;
}

export interface GradeSubject {
  id: string;
  subjectId: string;
  grade: string; // دهم | یازدهم | دوازدهم
  major: string; // تجربی | ریاضی | انسانی
  sortOrder: number;
  isActive: boolean;
  chapters?: Chapter[];
  // Legacy fields (no longer returned by the API).
  depth?: number;
  allowOptionalSubtopic?: boolean;
}

export interface Subject {
  id: string;
  name: string;
  color: string;
  icon: string | null;
  sortOrder: number;
  isKonkur: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  grades?: GradeSubject[];
  topicModes?: TopicMode[];
  // Legacy top-level chapters (kept optional for backward compat — new API
  // returns chapters nested under grades[].chapters[], not subject.chapters[]).
  chapters?: Chapter[];
  // Legacy fields (no longer returned by the API).
  assessmentType?: string;
  displayStrategy?: string;
  category?: string;
  finalStrategy?: string | null;
}

// ===== Constants =====
// Valid subject-grade values (the user-facing Grade type in lib/types.ts
// still includes "پشت کنکوری" for user profiles, but GradeSubject.grade
// is restricted to the three below per the API).
export const GRADES = ['دهم', 'یازدهم', 'دوازدهم'] as const;
export const MAJORS = ['تجربی', 'ریاضی', 'انسانی'] as const;

// ===== Legacy dropdown constants (deprecated — kept for backward-compat
// with super-admin components that still reference them; the new schema
// no longer uses assessmentType/displayStrategy/category/finalStrategy/
// depth, but the SuperAdmin UI has not yet been migrated). Do NOT use
// these in new code.
export const ASSESSMENT_TYPES = ['کنکور', 'نهایی', 'هر دو'] as const;
export const DISPLAY_STRATEGIES = [
  { value: 'chapter', label: 'فقط فصل‌به‌فصل' },
  { value: 'topic', label: 'فقط مبحثی' },
  { value: 'both', label: 'هر دو حالت (انتخاب دانش‌آموز)' },
] as const;
export const CATEGORIES = ['اختصاصی', 'عمومی'] as const;
export const FINAL_STRATEGIES = [
  { value: 'default', label: 'پیش‌فرض' },
  { value: 'weight_based', label: 'بارم‌بندی امتحان نهایی' },
  { value: 'high_weight_chapters', label: 'فصل‌های پربارم' },
  { value: 'book_based', label: 'کتاب‌محور' },
] as const;
export const DEPTH_OPTIONS = [
  { value: 1, label: '۱ لایه (فقط فصل)' },
  { value: 2, label: '۲ لایه (پایه ➔ فصل)' },
  { value: 3, label: '۳ لایه (پایه ➔ فصل ➔ گفتار)' },
] as const;
