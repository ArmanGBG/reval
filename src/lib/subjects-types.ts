// ===== Subject Management Types =====
// These mirror the Prisma models for client-side use.

export interface Topic {
  id: string;
  chapterId: string;
  title: string;
  topicNo: number;
  sortOrder: number;
  isActive: boolean;
}

export interface Chapter {
  id: string;
  subjectId: string;
  grade: string;
  title: string;
  chapterNo: number;
  assessmentType: string | null;
  weight: number | null;
  sortOrder: number;
  isActive: boolean;
  topics?: Topic[];
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
  grade: string;
  major: string;
  depth: number;
  allowOptionalSubtopic: boolean;
  sortOrder: number;
  isActive: boolean;
}

export interface Subject {
  id: string;
  name: string;
  color: string;
  icon: string | null;
  sortOrder: number;
  assessmentType: string; // "کنکور" | "نهایی" | "هر دو"
  displayStrategy: string; // "chapter" | "topic" | "both"
  category: string; // "اختصاصی" | "عمومی"
  finalStrategy: string | null; // "default" | "weight_based" | "high_weight_chapters" | "book_based"
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  grades?: GradeSubject[];
  chapters?: Chapter[];
  topicModes?: TopicMode[];
}

// ===== Constants =====
export const GRADES = ['دهم', 'یازدهم', 'دوازدهم', 'پشت کنکوری'] as const;
export const MAJORS = ['تجربی', 'ریاضی', 'انسانی', 'معارف', 'همه'] as const;
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
