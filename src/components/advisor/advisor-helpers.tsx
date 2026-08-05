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
  if (student.mockExamScore >= 75 && studyRatio >= 0.85 && student.taskCompletionRate >= 75 && student.mood !== 'poor' && student.mood !== 'critical') return 'excellent';
  if (student.mockExamScore < 40 || student.mood === 'critical' || student.attendanceRate < 60 || student.taskCompletionRate < 30) return 'critical';
  if (student.mockExamScore < 55 || student.mood === 'poor' || (student.mockExamScore - student.previousMockScore < -8 && student.studyHoursTrend === 'down') || student.attendanceRate < 70) return 'at-risk';
  if (student.mockExamScore >= 55 && student.taskCompletionRate >= 55 && studyRatio >= 0.65) return 'good';
  return 'fair';
}

export function computeRisks(students: StudentProfile[]): StudentRisk[] {
  return students.map((student) => {
    const reasons: string[] = [];
    let level: 'high' | 'medium' | 'low' = 'low';
    const scoreDiff = student.mockExamScore - student.previousMockScore;

    if (student.mockExamScore < 40) { reasons.push(`نمره آزمون بسیار پایین (${toPersianDigits(student.mockExamScore)})`); level = 'high'; }
    if (scoreDiff < -8) { reasons.push(`افت شدید نمره (${toPersianDigits(Math.abs(scoreDiff))} نمره کاهش)`); level = 'high'; }
    if (student.studyHoursTrend === 'down' && student.studyHoursPerWeek < student.studyHoursTarget * 0.7) { reasons.push(`کاهش ساعت مطالعه (${toPersianDigits(student.studyHoursPerWeek)} ساعت از ${toPersianDigits(student.studyHoursTarget)})`); level = level === 'high' ? 'high' : 'medium'; }
    if (student.mood === 'critical' || student.mood === 'poor') { reasons.push(`وضعیت روحی ${student.mood === 'critical' ? 'بحرانی' : 'ضعیف'}`); level = 'high'; }
    if (student.attendanceRate < 65) { reasons.push(`حضور کم (${toPersianDigits(student.attendanceRate)}٪)`); level = level === 'high' ? 'high' : 'medium'; }
    if (student.taskCompletionRate < 35) { reasons.push(`تکمیل وظایف پایین (${toPersianDigits(student.taskCompletionRate)}٪)`); level = level === 'high' ? 'high' : 'medium'; }
    if (student.stressLevel >= 8) { reasons.push(`استرس بالا (${toPersianDigits(student.stressLevel)}/۱۰)`); level = level === 'high' ? 'high' : 'medium'; }
    if (student.motivationLevel <= 3) { reasons.push(`انگیزه پایین (${toPersianDigits(student.motivationLevel)}/۱۰)`); level = level === 'high' ? 'high' : 'medium'; }

    let immediateAction = '';
    if (level === 'high') {
      if (student.mood === 'critical' || student.mood === 'poor') immediateAction = 'جلسه فوری با روانشناس + بازنگری برنامه';
      else if (student.attendanceRate < 65) immediateAction = 'تماس با خانواده + بررسی موانع حضور';
      else immediateAction = 'جلسه اضطراری + تمرکز بر ۲ درس ضعیف';
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

    if (student.mockExamScore >= 70) strengths.push(`نمره آزمون خوب (${toPersianDigits(student.mockExamScore)})`);
    if (student.studyHoursTrend === 'up') strengths.push('روند افزایشی ساعت مطالعه');
    if (student.attendanceRate >= 90) strengths.push(`حضور منظم (${toPersianDigits(student.attendanceRate)}٪)`);
    if (student.taskCompletionRate >= 80) strengths.push(`تکمیل بالا (${toPersianDigits(student.taskCompletionRate)}٪)`);
    if (student.motivationLevel >= 7) strengths.push(`انگیزه بالا (${toPersianDigits(student.motivationLevel)}/۱۰)`);
    if (student.pomodoroSessionsPerWeek >= 15) strengths.push('استفاده منظم از پومودورو');
    const strongSubjects = Object.entries(student.schoolGrades).filter(([_, g]) => g >= 17).map(([n]) => n);
    if (strongSubjects.length > 0) strengths.push(`قوی در: ${strongSubjects.join('، ')}`);

    if (student.mockExamScore < 55) weaknesses.push(`نمره پایین (${toPersianDigits(student.mockExamScore)})`);
    if (student.studyHoursTrend === 'down') weaknesses.push('کاهش ساعت مطالعه');
    if (student.attendanceRate < 75) weaknesses.push(`حضور ناکافی (${toPersianDigits(student.attendanceRate)}٪)`);
    if (student.taskCompletionRate < 50) weaknesses.push(`تکمیل پایین (${toPersianDigits(student.taskCompletionRate)}٪)`);
    if (student.stressLevel >= 7) weaknesses.push(`استرس بالا (${toPersianDigits(student.stressLevel)}/۱۰)`);
    const weakSubjects = Object.entries(student.schoolGrades).filter(([_, g]) => g < 13).map(([n]) => n);
    if (weakSubjects.length > 0) weaknesses.push(`ضعیف در: ${weakSubjects.join('، ')}`);
    const deficit = student.studyHoursTarget - student.studyHoursPerWeek;
    if (deficit > 10) weaknesses.push(`کمبود ${toPersianDigits(deficit)} ساعت مطالعه`);

    let psychologicalAssessment = '';
    if (student.mood === 'critical') psychologicalAssessment = 'وضعیت بحرانی. نیاز به ارجاع فوری به روانشناس. علائم فرسودگی و احتمال افسردگی.';
    else if (student.mood === 'poor') psychologicalAssessment = 'وضعیت ضعیف. نشانه‌های فرسودگی تحصیلی. نیاز به کاهش فشار و تمرکز بر سلامت روان.';
    else if (student.stressLevel >= 7 && student.motivationLevel <= 5) psychologicalAssessment = 'استرس بالا + انگیزه پایین - الگوی خطرناک. احتمال شروع فرسودگی.';
    else if (student.stressLevel >= 7) psychologicalAssessment = 'استرس بالا اما انگیزه حفظ شده. در معرض خطر فرسودگی.';
    else if (student.motivationLevel >= 7 && student.stressLevel <= 5) psychologicalAssessment = 'تعادل خوب بین انگیزه و استرس. ادامه روند فعلی توصیه می‌شود.';
    else psychologicalAssessment = 'وضعیت متوسط. نیاز به پیگیری و تقویت انگیزه.';

    if (weakSubjects.length > 0) interventions.push(`تخصیص ${toPersianDigits(weakSubjects.length * 2)} ساعت اضافی برای ${weakSubjects.join(' و ')} - مطالعه صبحگاهی`);
    if (student.studyHoursTrend === 'down') interventions.push(`بازنگری برنامه: کاهش حجم و افزایش کیفیت - تکنیک پومودورو`);
    if (student.taskCompletionRate < 50) interventions.push(`شروع با وظایف کوچک‌تر: تقسیم هر وظیفه به ${toPersianDigits(3)} بخش`);
    if (student.stressLevel >= 7) interventions.push('استفاده روزانه از اورژانس استرس + تمرین ذهن‌آگاهی ۱۰ دقیقه');
    if (student.attendanceRate < 75) interventions.push('برنامه انعطاف‌پذیر: امکان جبران آنلاین + جلسه هفتگی');
    if (student.motivationLevel <= 4) interventions.push('هدف‌گذاری خرد: اهداف روزانه کوچک + پاداش هفتگی');
    if (student.flashcardsMastered < student.flashcardsTotal * 0.4) interventions.push(`${toPersianDigits(15)} دقیقه فلش‌کارت قبل از خواب - دروس ضعیف`);
    if (student.mockExamScore >= 75 && student.taskCompletionRate >= 80) interventions.push('ادامه روند + تست‌های سنجشی سخت‌تر + مدیریت زمان آزمون');
    if (student.weeksUntilExam <= 16 && student.mockExamScore < 60) interventions.push('تمرکز بر تست‌زنی دروس با بالاترین ضریب + مرور سریع');

    return { studentId: student.id, strengths, weaknesses, psychologicalAssessment, interventions };
  });
}

// ===== UI Configs (using new design tokens) =====
export const STATUS_CONFIG: Record<StudentStatus, { label: string; color: string; bg: string; ring: string; icon: React.ReactNode }> = {
  excellent: { label: 'عالی', color: 'text-[var(--accent)]', bg: 'bg-[var(--accent-soft)]', ring: 'ring-[var(--accent)]/30', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  good: { label: 'خوب', color: 'text-[var(--accent)]', bg: 'bg-[var(--accent-soft)]', ring: 'ring-[var(--accent)]/20', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  fair: { label: 'متوسط', color: 'text-[var(--warning)]', bg: 'bg-[var(--warning)]/10', ring: 'ring-[var(--warning)]/30', icon: <Minus className="w-3.5 h-3.5" /> },
  'at-risk': { label: 'در خطر', color: 'text-orange-400', bg: 'bg-orange-400/10', ring: 'ring-orange-400/30', icon: <AlertCircle className="w-3.5 h-3.5" /> },
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
  poor: { label: 'ضعیف', color: 'text-orange-400', bg: 'bg-orange-400/10', ring: 'ring-orange-400/40', dot: 'bg-orange-400' },
  critical: { label: 'بحرانی', color: 'text-[var(--danger)]', bg: 'bg-[var(--danger)]/15', ring: 'ring-[var(--danger)]/40', dot: 'bg-[var(--danger)]' },
};

export const RISK_CONFIG = {
  high: { label: 'بالا', color: 'text-[var(--danger)]', bg: 'bg-[var(--danger)]/15', border: 'border-[var(--danger)]/30', dot: 'bg-[var(--danger)]' },
  medium: { label: 'متوسط', color: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/30', dot: 'bg-orange-400' },
  low: { label: 'پایین', color: 'text-[var(--accent)]', bg: 'bg-[var(--accent-soft)]', border: 'border-[var(--accent)]/30', dot: 'bg-[var(--accent)]' },
};

export const EXAM_STATUS_CONFIG: Record<ExamStatus, { label: string; color: string; bg: string }> = {
  upcoming: { label: 'پیش‌رو', color: 'text-[#8B5CF6]', bg: 'bg-[#8B5CF6]/15' },
  'in-progress': { label: 'در حال برگزاری', color: 'text-[var(--warning)]', bg: 'bg-[var(--warning)]/15' },
  completed: { label: 'برگزار شده', color: 'text-[var(--accent)]', bg: 'bg-[var(--accent-soft)]' },
};

export const ALL_ACTIVITY_TYPES: ActivityType[] = ['مطالعه', 'مرور', 'تست آموزشی', 'تست سنجشی'];
