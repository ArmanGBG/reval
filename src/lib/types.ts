// ===== Reval (روال) - Type Definitions =====

// ===== Role-Based Access Control =====
export type UserRole = 'STUDENT' | 'ADVISOR' | 'INSTITUTE_MANAGER' | 'SUPER_ADMIN';

// Student views (personal command center)
export type StudentView = 'dashboard' | 'plan' | 'tools' | 'analytics' | 'settings';

// Advisor views (CRM/management panel)
export type AdvisorView = 'advisor-dashboard' | 'advisor-students' | 'advisor-student-detail' | 'advisor-settings' | 'advisor-messages';

// Institute Manager views (B2B SaaS panel)
export type InstituteManagerView = 'institute-dashboard' | 'institute-advisors' | 'institute-students' | 'institute-settings';

// Super Admin views (God Mode command center)
export type SuperAdminView = 'sa-dashboard' | 'sa-subjects' | 'sa-institutes' | 'sa-institute-detail' | 'sa-users' | 'sa-user-detail' | 'sa-settings' | 'sa-messages';

// Top-level navigation (before auth)
export type TopView = 'landing' | 'onboarding' | 'login';

// Unified view name
export type ViewName = TopView | StudentView | AdvisorView | InstituteManagerView | SuperAdminView;

export type Grade = 'دهم' | 'یازدهم' | 'دوازدهم' | 'فارغ‌التحصیل';
export type Major = 'تجربی' | 'ریاضی' | 'انسانی';
export type FieldType = 'کنکور' | 'نهایی';
export type ActivityType = 'مطالعه' | 'مرور' | 'تست آموزشی' | 'تست سنجشی' | 'کلاس/ویدیو';
export type TaskStatus = 'DRAFT' | 'PENDING' | 'COMPLETED' | 'SKIPPED' | 'INCOMPLETE';

export interface User {
  id: string;
  name: string;
  avatar: string;
  grade: Grade;
  major: Major;
  phone: string;
  assignedAdvisorId: string | null;
}

export interface Task {
  id: string;
  studentId: string; // which student this task belongs to
  subject: string;
  subjectColor: string;
  subjectId?: string | null;
  topic: string | null;
  fieldType: FieldType | null;
  activityTypes: ActivityType[] | null;
  targetTimeMinutes: number | null;
  actualTimeMinutes: number | null;
  targetTestCount: number | null;
  actualTestCount: number | null;
  status?: TaskStatus;
  completed: boolean | null; // null = pending, true = done, false = skipped
  date: string; // ISO date string
  order: number;
  createdBy: 'student' | 'advisor'; // who created this task
  createdById?: string | null; // the advisor/user ID who created it (if createdBy='advisor')
  teacherClassName?: string | null;
  sessionNumber?: string | null;
  bookName?: string | null;
  testDescription?: string | null;
  // Linked curriculum IDs (Task 12-a schema). When set, the API uses these
  // to auto-populate the text subject/subjectColor/topic fields from the DB.
  chapterId?: string | null;
  topicId?: string | null;
  topicIds?: string[];
  topics?: Array<{ id: string; title: string; topicNo: number; chapterId: string }>;
  topicModeId?: string | null;
  curriculumMode?: 'BOOK' | 'THEMATIC' | null;
  topicModeSubtopicIds?: string[];
  topicModeSubtopics?: Array<{ id: string; title: string; subtopicNo: number; topicModeId: string }>;
  pageStart?: number | null;
  pageEnd?: number | null;
  detailsCompleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  imageUrl?: string;
  isSystem: boolean;
  mastery: 'mastered' | 'review' | 'weak';
  subject?: string;
  // ===== SM-2 Spaced Repetition Fields =====
  // Days until next review (0 = due today).
  interval?: number;
  // Number of consecutive successful reviews.
  repetition?: number;
  // Ease factor (multiplier for interval growth). Default 2.5, min 1.3.
  easeFactor?: number;
  // ISO date string when this card is due next.
  dueDate?: string;
  // ISO date string of the last review (or undefined if never reviewed).
  lastReviewed?: string;
  // Total number of times this card has been reviewed.
  reviewCount?: number;
  // Total number of times the student forgot this card (quality < 3).
  lapseCount?: number;
}

export interface Ticket {
  id: string;
  topic: string;
  subject: string;
  message: string;
  status: 'open' | 'answered' | 'closed';
  createdAt: string;
}

export interface DailyInsight {
  topSubject: string;
  lowestSubject: string;
  mostConsistent: string;
  mostCancelled: string;
  topSubjectHours: number;
  lowestSubjectHours: number;
  mostConsistentRate: number;
  mostCancelledRate: number;
}

export interface KPIData {
  totalTime: number;
  totalTests: number;
  adherenceRate: number;
  dailyAverage: number;
}

// ===== Advisor Dashboard Types =====

export type StudentStatus = 'excellent' | 'good' | 'fair' | 'at-risk' | 'critical';
export type TrendDirection = 'up' | 'down' | 'stable';
export type MoodLevel = 'excellent' | 'good' | 'fair' | 'poor' | 'critical';

export interface StudentProfile {
  id: string;
  name: string;
  avatar: string;
  grade: Grade;
  major: Major;
  // Study metrics
  studyHoursPerWeek: number;
  studyHoursTrend: TrendDirection;

  // Performance
  mockExamScore: number;
  previousMockScore: number;
  konkurPercentile: number;
  schoolGrades: Record<string, number>;

  // Behavior
  attendanceRate: number;
  taskCompletionRate: number;
  pomodoroSessionsPerWeek: number;
  flashcardsMastered: number;
  flashcardsTotal: number;

  // Wellbeing
  mood: MoodLevel;
  motivationLevel: number;
  stressLevel: number;

  // Meta
  advisorNotes: string;
  lastSessionDate: string;
  weeksUntilExam: number;
}

export interface StudentRisk {
  studentId: string;
  level: 'high' | 'medium' | 'low';
  reasons: string[];
  immediateAction: string;
}

export interface StudentAnalysis {
  studentId: string;
  strengths: string[];
  weaknesses: string[];
  psychologicalAssessment: string;
  interventions: string[];
}

// ===== Institute Manager Types =====

export interface InstituteAdvisor {
  id: string;
  name: string;
  phone: string;
  avatar: string;
  specialty: string;
  studentCount: number;
  isActive: boolean;
  joinDate: string;
}

export interface InstituteStudent {
  id: string;
  name: string;
  phone: string;
  avatar: string;
  grade: Grade;
  major: Major;
  assignedAdvisorId: string | null;
  weeklyCompletionRate: number;
  totalStudyHours: number;
  mockExamScore: number;
  status: StudentStatus;
  joinDate: string;
}

export interface InstituteProfile {
  name: string;
  logoUrl: string | null;
}

// ===== Exam Types =====

export type ExamStatus = 'upcoming' | 'in-progress' | 'completed';

export interface ExamResult {
  studentId: string;
  score: number | null;
  rank: number | null;
}

export interface Exam {
  id: string;
  title: string;
  subject: string;
  subjectColor: string;
  date: string; // ISO date string
  startTime: string; // e.g., "08:00"
  duration: number; // minutes
  totalScore: number;
  studentIds: string[];
  status: ExamStatus;
  results: ExamResult[];
  createdBy: string; // advisor ID
  createdAt: string;
}

// ===== Super Admin Types =====

export type SubscriptionPlan = 'free' | 'basic' | 'pro' | 'enterprise';
export type InstituteStatus = 'active' | 'suspended' | 'trial';

export interface PlatformInstitute {
  id: string;
  name: string;
  logoUrl: string | null;
  managerName: string;
  managerPhone: string;
  subscriptionPlan: SubscriptionPlan;
  status: InstituteStatus;
  studentCount: number;
  advisorCount: number;
  createdAt: string;
  avgCompletionRate: number;
}

export type GlobalUserRole = 'student' | 'advisor' | 'institute_manager';
export type UserAccountStatus = 'active' | 'suspended';

export interface GlobalUser {
  id: string;
  name: string;
  avatar: string;
  phone: string;
  role: GlobalUserRole;
  grade: string | null;
  major: string | null;
  assignedAdvisorId: string | null;
  instituteId: string | null;
  instituteName: string;
  status: UserAccountStatus;
  completionRate: number;
  studyHours: number;
  joinDate: string;
}

// ===== Notification Types =====

export type NotificationType = 'message';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  icon: string; // Lucide icon name
  color: string; // CSS color value (e.g., 'var(--danger)')
  read: boolean;
  createdAt: number; // timestamp
  // ===== DB-backed message fields =====
  // Present when this notification is a DB message (advisor/super-admin → student).
  // Used by markNotificationRead() to call the mark-as-read API.
  messageId?: string;
  // The display name of the sender (e.g. "مشاور" or "سوپر ادمین").
  senderName?: string;
}
