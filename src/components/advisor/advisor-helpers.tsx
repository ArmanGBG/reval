import {
  StudentProfile,
  StudentStatus,
  StudentRisk,
  StudentAnalysis,
  TrendDirection,
  MoodLevel,
  ActivityType,
  ExamStatus,
} from '@/lib/types';
import {
  AlertTriangle,
  TrendingUp,
  Minus,
  AlertCircle,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

// ===== Helper =====
export function toPersianDigits(num: number | string): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return num.toString().split('').map((d) => persianDigits[parseInt(d)] ?? d).join('');
}

// ===== Analysis Engine =====
export function computeStudentStatus(student: StudentProfile): StudentStatus {
  const studyRatio = student.studyHoursPerWeek / student.studyHoursTarget;
  if (studyRatio >= 0.85 && student.taskCompletionRate >= 75) return 'excellent';
  if (student.taskCompletionRate < 30) return 'critical';
  if (student.studyHoursTrend === 'down' || student.taskCompletionRate < 55) return 'at-risk';
  if (student.taskCompletionRate >= 55 && studyRatio >= 0.65) return 'good';
  return 'fair';
}

export function computeRisks(students: StudentProfile[]): StudentRisk[] {
  return students.map((student) => {
    const reasons: string[] = [];
    let level: 'high' | 'medium' | 'low' = 'low';
    if (student.studyHoursTrend === 'down' && student.studyHoursPerWeek < student.studyHoursTarget * 0.7) { reasons.push(`کاهش ساعت مطالعه (${toPersianDigits(student.studyHoursPerWeek)} ساعت از ${toPersianDigits(student.studyHoursTarget)})`); level = 'medium'; }
    if (student.taskCompletionRate < 35) { reasons.push(`تکمیل وظایف پایین (${toPersianDigits(student.taskCompletionRate)}٪)`); level = level === 'medium' ? 'high' : 'medium'; }

    let immediateAction = '';
    if (level === 'high') {
      immediateAction = 'بازبینی فوری برنامه و تسک‌های انجام‌نشده';
    } else if (level === 'medium') {
      immediateAction = 'جلسه هفتگی + هدف‌گذاری خرد';
    } else {
      immediateAction = 'ادامه برنامه + تشویق و تثبیت';
    }

    return { studentId: student.id, level, reasons, immediateAction };
  });
}

export function computeAnalyses(students: StudentProfile[]): StudentAnalysis[] {
  return students.map((student) => {
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const interventions: string[] = [];

    if (student.studyHoursTrend === 'up') strengths.push('روند افزایشی ساعت مطالعه');
    if (student.taskCompletionRate >= 80) strengths.push(`تکمیل بالا (${toPersianDigits(student.taskCompletionRate)}٪)`);

    if (student.studyHoursTrend === 'down') weaknesses.push('کاهش ساعت مطالعه');
    if (student.taskCompletionRate < 50) weaknesses.push(`تکمیل پایین (${toPersianDigits(student.taskCompletionRate)}٪)`);
    const deficit = student.studyHoursTarget - student.studyHoursPerWeek;
    if (deficit > 10) weaknesses.push(`کمبود ${toPersianDigits(deficit)} ساعت مطالعه`);

    const psychologicalAssessment = '';

    if (student.studyHoursTrend === 'down') interventions.push('بازنگری برنامه: کاهش حجم و افزایش کیفیت جلسات مطالعه');
    if (student.taskCompletionRate < 50) interventions.push(`شروع با وظایف کوچک‌تر: تقسیم هر وظیفه به ${toPersianDigits(3)} بخش`);

    return { studentId: student.id, strengths, weaknesses, psychologicalAssessment, interventions };
  });
}

// ===== UI Configs (using new design tokens) =====
export const STATUS_CONFIG: Record<StudentStatus, { label: string; color: string; bg: string; ring: string; icon: React.ReactNode }> = {
  excellent: { label: 'عالی', color: 'text-[var(--accent)]', bg: 'bg-[var(--accent-soft)]', ring: 'ring-[var(--accent)]/30', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  good: { label: 'خوب', color: 'text-[var(--accent)]', bg: 'bg-[var(--accent-soft)]', ring: 'ring-[var(--accent)]/20', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  fair: { label: 'متوسط', color: 'text-[var(--warning)]', bg: 'bg-[var(--warning)]/10', ring: 'ring-[var(--warning)]/30', icon: <Minus className="w-3.5 h-3.5" /> },
  'at-risk': { label: 'در خطر', color: 'text-[var(--warning)]', bg: 'bg-[var(--warning)]/10', ring: 'ring-[var(--warning)]/30', icon: <AlertCircle className="w-3.5 h-3.5" /> },
  critical: { label: 'بحرانی', color: 'text-[var(--danger)]', bg: 'bg-[var(--danger)]/15', ring: 'ring-[var(--danger)]/40', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
};

export const TREND_CONFIG: Record<TrendDirection, { icon: React.ReactNode; color: string }> = {
  up: { icon: <ArrowUpRight className="w-3.5 h-3.5" />, color: 'text-[var(--accent)]' },
  down: { icon: <ArrowDownRight className="w-3.5 h-3.5" />, color: 'text-[var(--danger)]' },
  stable: { icon: <Minus className="w-3.5 h-3.5" />, color: 'text-[var(--foreground-muted)]' },
};

// Mood is rendered via color + label only (no emoji decorations) for a cleaner minimalist UI.
export const MOOD_CONFIG: Record<MoodLevel, { label: string; color: string; bg: string; ring: string; dot: string }> = {
  excellent: { label: 'عالی', color: 'text-[var(--accent)]', bg: 'bg-[var(--accent-soft)]', ring: 'ring-[var(--accent)]/40', dot: 'bg-[var(--accent)]' },
  good: { label: 'خوب', color: 'text-[var(--accent)]', bg: 'bg-[var(--accent-soft)]', ring: 'ring-[var(--accent)]/30', dot: 'bg-[var(--accent)]' },
  fair: { label: 'متوسط', color: 'text-[var(--warning)]', bg: 'bg-[var(--warning)]/10', ring: 'ring-[var(--warning)]/40', dot: 'bg-[var(--warning)]' },
  poor: { label: 'ضعیف', color: 'text-[var(--warning)]', bg: 'bg-[var(--warning)]/10', ring: 'ring-[var(--warning)]/40', dot: 'bg-[var(--warning)]' },
  critical: { label: 'بحرانی', color: 'text-[var(--danger)]', bg: 'bg-[var(--danger)]/15', ring: 'ring-[var(--danger)]/40', dot: 'bg-[var(--danger)]' },
};

export const RISK_CONFIG = {
  high: { label: 'بالا', color: 'text-[var(--danger)]', bg: 'bg-[var(--danger)]/15', border: 'border-[var(--danger)]/30', dot: 'bg-[var(--danger)]' },
  medium: { label: 'متوسط', color: 'text-[var(--warning)]', bg: 'bg-[var(--warning)]/10', border: 'border-[var(--warning)]/30', dot: 'bg-[var(--warning)]' },
  low: { label: 'پایین', color: 'text-[var(--accent)]', bg: 'bg-[var(--accent-soft)]', border: 'border-[var(--accent)]/30', dot: 'bg-[var(--accent)]' },
};

export const EXAM_STATUS_CONFIG: Record<ExamStatus, { label: string; color: string; bg: string }> = {
  upcoming: { label: 'پیش‌رو', color: 'text-[var(--accent)]', bg: 'bg-[var(--accent-soft)]' },
  'in-progress': { label: 'در حال برگزاری', color: 'text-[var(--warning)]', bg: 'bg-[var(--warning)]/15' },
  completed: { label: 'برگزار شده', color: 'text-[var(--accent)]', bg: 'bg-[var(--accent-soft)]' },
};

export const ALL_ACTIVITY_TYPES: ActivityType[] = ['مطالعه', 'مرور', 'تست آموزشی', 'تست سنجشی', 'کلاس/ویدیو'];
