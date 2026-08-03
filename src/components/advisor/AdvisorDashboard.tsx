'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import { MOCK_STUDENTS, SUBJECTS, TOPICS } from '@/lib/constants/mockData';
import {
  StudentProfile,
  StudentStatus,
  StudentRisk,
  StudentAnalysis,
  TrendDirection,
  MoodLevel,
  Task,
  Exam,
  FieldType,
  ActivityType,
  ExamStatus,
} from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { SubjectTopicPicker, TopicSelection } from '@/components/shared/SubjectTopicPicker';
import { Subject } from '@/lib/subjects-types';
import {
  AlertTriangle,
  TrendingUp,
  Minus,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Brain,
  Heart,
  Clock,
  Target,
  BookOpen,
  Timer,
  Zap,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Eye,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Shield,
  Flame,
  Calendar,
  FileText,
  UserCheck,
  ClipboardList,
  Plus,
  Pencil,
  Trash2,
  GraduationCap,
  Search,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

// ===== Helper =====
function toPersianDigits(num: number | string): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return num.toString().split('').map((d) => persianDigits[parseInt(d)] ?? d).join('');
}

// ===== Analysis Engine =====
function computeStudentStatus(student: StudentProfile): StudentStatus {
  const studyRatio = student.studyHoursPerWeek / student.studyHoursTarget;
  if (student.mockExamScore >= 75 && studyRatio >= 0.85 && student.taskCompletionRate >= 75 && student.mood !== 'poor' && student.mood !== 'critical') return 'excellent';
  if (student.mockExamScore < 40 || student.mood === 'critical' || student.attendanceRate < 60 || student.taskCompletionRate < 30) return 'critical';
  if (student.mockExamScore < 55 || student.mood === 'poor' || (student.mockExamScore - student.previousMockScore < -8 && student.studyHoursTrend === 'down') || student.attendanceRate < 70) return 'at-risk';
  if (student.mockExamScore >= 55 && student.taskCompletionRate >= 55 && studyRatio >= 0.65) return 'good';
  return 'fair';
}

function computeRisks(students: StudentProfile[]): StudentRisk[] {
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

function computeAnalyses(students: StudentProfile[]): StudentAnalysis[] {
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
const STATUS_CONFIG: Record<StudentStatus, { label: string; color: string; bg: string; ring: string; icon: React.ReactNode }> = {
  excellent: { label: 'عالی', color: 'text-[var(--accent)]', bg: 'bg-[var(--accent-soft)]', ring: 'ring-[var(--accent)]/30', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  good: { label: 'خوب', color: 'text-[var(--accent)]', bg: 'bg-[var(--accent-soft)]', ring: 'ring-[var(--accent)]/20', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  fair: { label: 'متوسط', color: 'text-[var(--warning)]', bg: 'bg-[var(--warning)]/10', ring: 'ring-[var(--warning)]/30', icon: <Minus className="w-3.5 h-3.5" /> },
  'at-risk': { label: 'در خطر', color: 'text-orange-400', bg: 'bg-orange-400/10', ring: 'ring-orange-400/30', icon: <AlertCircle className="w-3.5 h-3.5" /> },
  critical: { label: 'بحرانی', color: 'text-[var(--danger)]', bg: 'bg-[var(--danger)]/15', ring: 'ring-[var(--danger)]/40', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
};

const TREND_CONFIG: Record<TrendDirection, { icon: React.ReactNode; color: string }> = {
  up: { icon: <ArrowUpRight className="w-3.5 h-3.5" />, color: 'text-[var(--accent)]' },
  down: { icon: <ArrowDownRight className="w-3.5 h-3.5" />, color: 'text-[var(--danger)]' },
  stable: { icon: <Minus className="w-3.5 h-3.5" />, color: 'text-[var(--foreground-muted)]' },
};

// Mood is rendered via color + label only (no emoji decorations) for a cleaner minimalist UI.
const MOOD_CONFIG: Record<MoodLevel, { label: string; color: string; bg: string; ring: string; dot: string }> = {
  excellent: { label: 'عالی', color: 'text-[var(--accent)]', bg: 'bg-[var(--accent-soft)]', ring: 'ring-[var(--accent)]/40', dot: 'bg-[var(--accent)]' },
  good: { label: 'خوب', color: 'text-[var(--accent)]', bg: 'bg-[var(--accent-soft)]', ring: 'ring-[var(--accent)]/30', dot: 'bg-[var(--accent)]' },
  fair: { label: 'متوسط', color: 'text-[var(--warning)]', bg: 'bg-[var(--warning)]/10', ring: 'ring-[var(--warning)]/40', dot: 'bg-[var(--warning)]' },
  poor: { label: 'ضعیف', color: 'text-orange-400', bg: 'bg-orange-400/10', ring: 'ring-orange-400/40', dot: 'bg-orange-400' },
  critical: { label: 'بحرانی', color: 'text-[var(--danger)]', bg: 'bg-[var(--danger)]/15', ring: 'ring-[var(--danger)]/40', dot: 'bg-[var(--danger)]' },
};

const RISK_CONFIG = {
  high: { label: 'بالا', color: 'text-[var(--danger)]', bg: 'bg-[var(--danger)]/15', border: 'border-[var(--danger)]/30', dot: 'bg-[var(--danger)]' },
  medium: { label: 'متوسط', color: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/30', dot: 'bg-orange-400' },
  low: { label: 'پایین', color: 'text-[var(--accent)]', bg: 'bg-[var(--accent-soft)]', border: 'border-[var(--accent)]/30', dot: 'bg-[var(--accent)]' },
};

const EXAM_STATUS_CONFIG: Record<ExamStatus, { label: string; color: string; bg: string }> = {
  upcoming: { label: 'پیش‌رو', color: 'text-[#8B5CF6]', bg: 'bg-[#8B5CF6]/15' },
  'in-progress': { label: 'در حال برگزاری', color: 'text-[var(--warning)]', bg: 'bg-[var(--warning)]/15' },
  completed: { label: 'برگزار شده', color: 'text-[var(--accent)]', bg: 'bg-[var(--accent-soft)]' },
};

const ALL_ACTIVITY_TYPES: ActivityType[] = ['مطالعه', 'مرور', 'تست آموزشی', 'تست سنجشی'];

// ===== Sub-Components =====
function MetricBar({ value, max, color, label }: { value: number; max: number; color: string; label: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-[var(--foreground-muted)] w-16 text-right shrink-0 truncate">{label}</span>
      <div className="flex-1 h-1.5 bg-[var(--bg-overlay)] rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
      <span className="text-[11px] text-[var(--foreground)] w-8 text-left shrink-0 font-medium tabular-nums">{toPersianDigits(value)}</span>
    </div>
  );
}

function MiniRadar({ grades, size = 140 }: { grades: Record<string, number>; size?: number }) {
  const entries = Object.entries(grades);
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 18;
  const points = entries.map(([_, val], i) => {
    const angle = (Math.PI * 2 * i) / entries.length - Math.PI / 2;
    return { x: cx + r * (val / 20) * Math.cos(angle), y: cy + r * (val / 20) * Math.sin(angle) };
  });
  const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto block">
      <defs>
        <radialGradient id="radarFill" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.08" />
        </radialGradient>
      </defs>
      {[0.25, 0.5, 0.75, 1].map((s) => (
        <circle key={s} cx={cx} cy={cy} r={r * s} fill="none" stroke="var(--border)" strokeWidth={1} />
      ))}
      {entries.map(([_, _v], i) => {
        const a = (Math.PI * 2 * i) / entries.length - Math.PI / 2;
        return <line key={i} x1={cx} y1={cy} x2={cx + r * Math.cos(a)} y2={cy + r * Math.sin(a)} stroke="var(--border)" strokeWidth={1} />;
      })}
      <path d={pathData} fill="url(#radarFill)" stroke="var(--accent)" strokeWidth={1.5} strokeLinejoin="round" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3} fill="var(--accent)" stroke="var(--bg-elevated)" strokeWidth={1.5} />
      ))}
      {entries.map(([name], i) => {
        const a = (Math.PI * 2 * i) / entries.length - Math.PI / 2;
        return (
          <text
            key={i}
            x={cx + (r + 12) * Math.cos(a)}
            y={cy + (r + 12) * Math.sin(a)}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-[var(--foreground-muted)]"
            style={{ fontSize: size < 150 ? '8px' : '10px', fontFamily: 'var(--font-vazirmatn)' }}
          >
            {name}
          </text>
        );
      })}
    </svg>
  );
}

// ===== Shared Field components (for modals) =====
function ModalInput({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="text-[11px] text-[var(--foreground-muted)] mb-1.5 block font-medium">{label}</label>
      <input
        {...props}
        className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)] focus:outline-none focus:border-[var(--accent)]/40 focus:bg-[var(--bg-overlay)] transition-colors"
      />
    </div>
  );
}

function ModalSelect({ label, children, ...props }: { label: string; children: React.ReactNode } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div>
      <label className="text-[11px] text-[var(--foreground-muted)] mb-1.5 block font-medium">{label}</label>
      <select
        {...props}
        className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]/40 focus:bg-[var(--bg-overlay)] transition-colors"
      >
        {children}
      </select>
    </div>
  );
}

// ===== Task Modal (Add / Edit) — New Flow: field type → subject (filtered) → topic picker =====
function TaskModal({
  open,
  onOpenChange,
  studentId,
  editTask,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  editTask: Task | null;
}) {
  const { addTask, updateTask, selectedStudentId } = useAppStore();
  const isEdit = editTask !== null;

  // Find the selected student to read their grade + major
  const student = MOCK_STUDENTS.find(s => s.id === (selectedStudentId || studentId));
  const studentGrade = student?.grade || 'دوازدهم';
  const studentMajor = student?.major || 'تجربی';

  // Form state — new flow
  const [fieldType, setFieldType] = useState<FieldType>(editTask?.fieldType ?? 'کنکور');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [topicSelection, setTopicSelection] = useState<TopicSelection | null>(
    editTask?.topic ? { displayText: editTask.topic, mode: 'chapter' } : null
  );
  const [activityTypes, setActivityTypes] = useState<ActivityType[]>(editTask?.activityTypes ?? []);
  const [targetTimeMinutes, setTargetTimeMinutes] = useState(editTask?.targetTimeMinutes ?? 60);
  const [targetTestCount, setTargetTestCount] = useState(editTask?.targetTestCount ?? 20);
  const [date, setDate] = useState(editTask?.date ?? new Date().toISOString().split('T')[0]);

  // Fetch subjects whenever fieldType changes or modal opens
  const fetchSubjects = useCallback(async (ft: FieldType) => {
    setSubjectsLoading(true);
    try {
      const res = await fetch(
        `/api/subjects/for-task?fieldType=${encodeURIComponent(ft)}&grade=${encodeURIComponent(studentGrade)}&major=${encodeURIComponent(studentMajor)}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSubjects(data.subjects || []);
      // If editing, try to match the existing subject
      if (editTask?.subject) {
        const match = (data.subjects || []).find((s: Subject) => s.name === editTask.subject);
        if (match) setSelectedSubject(match);
      }
    } catch {
      setSubjects([]);
    } finally {
      setSubjectsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentGrade, studentMajor]);

  useEffect(() => {
    if (open) fetchSubjects(fieldType);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, fieldType]);

  // Reset form when modal opens or editTask changes
  const resetForm = () => {
    setFieldType(editTask?.fieldType ?? 'کنکور');
    setSelectedSubject(null);
    setTopicSelection(editTask?.topic ? { displayText: editTask.topic, mode: 'chapter' } : null);
    setActivityTypes(editTask?.activityTypes ?? []);
    setTargetTimeMinutes(editTask?.targetTimeMinutes ?? 60);
    setTargetTestCount(editTask?.targetTestCount ?? 20);
    setDate(editTask?.date ?? new Date().toISOString().split('T')[0]);
  };

  const toggleActivity = (act: ActivityType) => {
    setActivityTypes(prev =>
      prev.includes(act) ? prev.filter(a => a !== act) : [...prev, act]
    );
  };

  const handleSubmit = () => {
    if (!selectedSubject) {
      toast.error('لطفاً درس را انتخاب کنید');
      return;
    }
    if (activityTypes.length === 0) {
      toast.error('لطفاً حداقل یک نوع فعالیت انتخاب کنید');
      return;
    }

    const subjectColor = selectedSubject.color;
    const topic = topicSelection?.displayText || 'عمومی';

    if (isEdit && editTask) {
      updateTask(editTask.id, {
        subject: selectedSubject.name,
        subjectColor,
        topic,
        fieldType,
        activityTypes,
        targetTimeMinutes,
        targetTestCount,
        date,
      });
      toast.success('وظیفه با موفقیت ویرایش شد');
    } else {
      const newTask: Task = {
        id: crypto.randomUUID(),
        studentId,
        subject: selectedSubject.name,
        subjectColor,
        topic,
        fieldType,
        activityTypes,
        targetTimeMinutes,
        actualTimeMinutes: null,
        targetTestCount,
        actualTestCount: null,
        completed: null,
        date,
        order: Date.now(),
        createdBy: 'advisor',
      };
      addTask(newTask);
      toast.success('وظیفه جدید با موفقیت اضافه شد');
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="bg-[var(--bg-overlay)] border-[var(--border-strong)] text-[var(--foreground)] max-h-[90vh] overflow-y-auto rounded-2xl" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-[var(--foreground)] text-base">{isEdit ? 'ویرایش وظیفه' : 'افزودن وظیفه جدید'}</DialogTitle>
          <DialogDescription className="text-[var(--foreground-muted)]">
            {isEdit ? 'جزئیات وظیفه را ویرایش کنید' : 'یک وظیفه جدید برای دانش‌آموز تعریف کنید'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Step 1: Field Type */}
          <div>
            <label className="text-[11px] text-[var(--foreground-muted)] mb-1.5 block font-medium">حوزه</label>
            <div className="flex gap-2.5">
              {(['کنکور', 'نهایی'] as FieldType[]).map(ft => (
                <button
                  key={ft}
                  onClick={() => {
                    setFieldType(ft);
                    setSelectedSubject(null);
                    setTopicSelection(null);
                  }}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium border btn-hover ${
                    fieldType === ft
                      ? 'bg-[var(--accent-soft)] border-[var(--accent)]/30 text-[var(--accent)]'
                      : 'bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                  }`}
                >
                  {ft}
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Subject (filtered by field type) */}
          <div>
            <label className="text-[11px] text-[var(--foreground-muted)] mb-1.5 block font-medium">
              درس
              <span className="text-[var(--foreground-subtle)] mr-1">
                ({fieldType === 'کنکور' ? 'اختصاصی کنکور' : 'امتحانات نهایی'})
              </span>
            </label>
            {subjectsLoading ? (
              <div className="text-xs text-[var(--foreground-muted)] py-3 text-center">در حال بارگذاری...</div>
            ) : subjects.length === 0 ? (
              <div className="text-xs text-[var(--foreground-muted)] py-3 text-center">درسی یافت نشد</div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {subjects.map(s => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setSelectedSubject(s);
                      setTopicSelection(null);
                    }}
                    className={`btn-hover flex items-center gap-2 py-2.5 px-3 rounded-lg text-sm border ${
                      selectedSubject?.id === s.id
                        ? 'bg-[var(--accent-soft)] border-[var(--accent)]/30 text-[var(--accent)]'
                        : 'bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                    }`}
                  >
                    <span className="text-base">{s.icon || '📚'}</span>
                    <span className="truncate text-right flex-1">{s.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Step 3: Topic Picker (dynamic) */}
          {selectedSubject && (
            <div>
              <label className="text-[11px] text-[var(--foreground-muted)] mb-1.5 block font-medium">مبحث</label>
              <SubjectTopicPicker
                subject={selectedSubject}
                defaultGrade={studentGrade}
                value={topicSelection}
                onChange={setTopicSelection}
              />
            </div>
          )}

          {/* Activity Types */}
          <div>
            <label className="text-[11px] text-[var(--foreground-muted)] mb-2 block font-medium">نوع فعالیت</label>
            <div className="grid grid-cols-2 gap-2">
              {ALL_ACTIVITY_TYPES.map(act => (
                <label
                  key={act}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border cursor-pointer nav-item-hover ${
                    activityTypes.includes(act)
                      ? 'bg-[var(--accent-soft)] border-[var(--accent)]/30 text-[var(--accent)]'
                      : 'bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                  }`}
                >
                  <Checkbox
                    checked={activityTypes.includes(act)}
                    onCheckedChange={() => toggleActivity(act)}
                    className="border-[var(--border-strong)] data-[state=checked]:bg-[var(--accent)] data-[state=checked]:border-[var(--accent)]"
                  />
                  <span className="text-sm">{act}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <ModalInput
              label="زمان هدف (دقیقه)"
              type="number"
              value={targetTimeMinutes}
              onChange={(e) => setTargetTimeMinutes(Number(e.target.value))}
              min={1}
            />
            <ModalInput
              label="تعداد تست هدف"
              type="number"
              value={targetTestCount}
              onChange={(e) => setTargetTestCount(Number(e.target.value))}
              min={0}
            />
          </div>

          <ModalInput
            label="تاریخ"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <DialogClose asChild>
            <button className="px-4 py-2.5 text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] btn-hover rounded-lg">
              انصراف
            </button>
          </DialogClose>
          <button
            onClick={handleSubmit}
            className="px-6 py-2.5 bg-[var(--accent)] text-[var(--bg-deep)] rounded-lg text-sm font-semibold glow-hover"
          >
            {isEdit ? 'ذخیره تغییرات' : 'افزودن وظیفه'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ===== Exam Modal (Single Student) =====
function ExamModal({
  open,
  onOpenChange,
  studentId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
}) {
  const { addExam } = useAppStore();

  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('08:00');
  const [duration, setDuration] = useState(90);
  const [totalScore, setTotalScore] = useState(100);

  const resetForm = () => {
    setTitle('');
    setSubject('');
    setDate(new Date().toISOString().split('T')[0]);
    setStartTime('08:00');
    setDuration(90);
    setTotalScore(100);
  };

  const handleSubmit = () => {
    if (!title) {
      toast.error('لطفاً عنوان آزمون را وارد کنید');
      return;
    }
    if (!subject) {
      toast.error('لطفاً درس را انتخاب کنید');
      return;
    }

    const subjectObj = SUBJECTS.find(s => s.name === subject);
    const subjectColor = subjectObj?.color ?? '#8B5CF6';

    const newExam: Exam = {
      id: crypto.randomUUID(),
      title,
      subject,
      subjectColor,
      date,
      startTime,
      duration,
      totalScore,
      studentIds: [studentId],
      status: 'upcoming',
      results: [],
      createdBy: 'adv1',
      createdAt: new Date().toISOString(),
    };
    addExam(newExam);
    toast.success('آزمون با موفقیت ثبت شد');
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="bg-[var(--bg-overlay)] border-[var(--border-strong)] text-[var(--foreground)] max-h-[90vh] overflow-y-auto rounded-2xl" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-[var(--foreground)] text-base">ثبت آزمون جدید</DialogTitle>
          <DialogDescription className="text-[var(--foreground-muted)]">
            یک آزمون جدید برای این دانش‌آموز ثبت کنید
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <ModalInput
            label="عنوان آزمون"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="مثلاً: آزمون جامع ریاضی - اسفند"
          />
          <ModalSelect label="درس" value={subject} onChange={(e) => setSubject(e.target.value)}>
            <option value="">انتخاب درس...</option>
            {SUBJECTS.map(s => (
              <option key={s.name} value={s.name}>{s.name}</option>
            ))}
          </ModalSelect>
          <ModalInput label="تاریخ" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <ModalInput label="ساعت شروع" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            <ModalInput label="مدت (دقیقه)" type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} min={1} />
          </div>
          <ModalInput label="نمره کل" type="number" value={totalScore} onChange={(e) => setTotalScore(Number(e.target.value))} min={1} />
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <DialogClose asChild>
            <button className="px-4 py-2.5 text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] btn-hover rounded-lg">
              انصراف
            </button>
          </DialogClose>
          <button
            onClick={handleSubmit}
            className="px-6 py-2.5 bg-[#8B5CF6] text-white rounded-lg text-sm font-semibold btn-hover"
          >
            ثبت آزمون
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ===== Group Exam Modal =====
function GroupExamModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { addExam } = useAppStore();
  const students = MOCK_STUDENTS;

  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('08:00');
  const [duration, setDuration] = useState(90);
  const [totalScore, setTotalScore] = useState(100);

  const resetForm = () => {
    setSelectedStudentIds([]);
    setTitle('');
    setSubject('');
    setDate(new Date().toISOString().split('T')[0]);
    setStartTime('08:00');
    setDuration(90);
    setTotalScore(100);
  };

  const toggleStudent = (id: string) => {
    setSelectedStudentIds(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedStudentIds(students.map(s => s.id));
  };

  const deselectAll = () => {
    setSelectedStudentIds([]);
  };

  const handleSubmit = () => {
    if (selectedStudentIds.length === 0) {
      toast.error('لطفاً حداقل یک دانش‌آموز انتخاب کنید');
      return;
    }
    if (!title) {
      toast.error('لطفاً عنوان آزمون را وارد کنید');
      return;
    }
    if (!subject) {
      toast.error('لطفاً درس را انتخاب کنید');
      return;
    }

    const subjectObj = SUBJECTS.find(s => s.name === subject);
    const subjectColor = subjectObj?.color ?? '#8B5CF6';

    const newExam: Exam = {
      id: crypto.randomUUID(),
      title,
      subject,
      subjectColor,
      date,
      startTime,
      duration,
      totalScore,
      studentIds: selectedStudentIds,
      status: 'upcoming',
      results: [],
      createdBy: 'adv1',
      createdAt: new Date().toISOString(),
    };
    addExam(newExam);
    toast.success(`آزمون با موفقیت برای ${toPersianDigits(selectedStudentIds.length)} دانش‌آموز ثبت شد`);
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="bg-[var(--bg-overlay)] border-[var(--border-strong)] text-[var(--foreground)] max-h-[90vh] overflow-y-auto rounded-2xl" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-[var(--foreground)] text-base">آزمون جدید برای گروه</DialogTitle>
          <DialogDescription className="text-[var(--foreground-muted)]">
            یک آزمون برای چند دانش‌آموز ثبت کنید
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] text-[var(--foreground-muted)] font-medium">انتخاب دانش‌آموزان</label>
              <div className="flex gap-2">
                <button onClick={selectAll} className="text-[11px] text-[var(--accent)] hover:text-[var(--accent-hover)] btn-hover">همه</button>
                <span className="text-[var(--foreground-subtle)]">|</span>
                <button onClick={deselectAll} className="text-[11px] text-[var(--foreground-muted)] hover:text-[var(--foreground)] btn-hover">هیچکدام</button>
              </div>
            </div>
            <div className="max-h-48 overflow-y-auto bg-[var(--bg-elevated)] rounded-lg border border-[var(--border)] p-2 space-y-1 custom-scrollbar">
              {students.map(student => {
                const status = computeStudentStatus(student);
                const config = STATUS_CONFIG[status];
                const checked = selectedStudentIds.includes(student.id);
                return (
                  <label
                    key={student.id}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer nav-item-hover ${
                      checked
                        ? 'bg-[#8B5CF6]/10 border border-[#8B5CF6]/30'
                        : 'hover:bg-[var(--bg-overlay)] border border-transparent'
                    }`}
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => toggleStudent(student.id)}
                      className="border-[var(--border-strong)] data-[state=checked]:bg-[#8B5CF6] data-[state=checked]:border-[#8B5CF6]"
                    />
                    <span className="text-lg">{student.avatar}</span>
                    <span className="text-sm text-[var(--foreground)] flex-1">{student.name}</span>
                    <span className={`text-[10px] ${config.color}`}>{config.label}</span>
                  </label>
                );
              })}
            </div>
            {selectedStudentIds.length > 0 && (
              <p className="text-[11px] text-[#8B5CF6] mt-1.5 font-medium">{toPersianDigits(selectedStudentIds.length)} دانش‌آموز انتخاب شده</p>
            )}
          </div>

          <ModalInput label="عنوان آزمون" type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثلاً: آزمون جامع ریاضی - اسفند" />
          <ModalSelect label="درس" value={subject} onChange={(e) => setSubject(e.target.value)}>
            <option value="">انتخاب درس...</option>
            {SUBJECTS.map(s => (
              <option key={s.name} value={s.name}>{s.name}</option>
            ))}
          </ModalSelect>
          <ModalInput label="تاریخ" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <ModalInput label="ساعت شروع" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            <ModalInput label="مدت (دقیقه)" type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} min={1} />
          </div>
          <ModalInput label="نمره کل" type="number" value={totalScore} onChange={(e) => setTotalScore(Number(e.target.value))} min={1} />
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <DialogClose asChild>
            <button className="px-4 py-2.5 text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] btn-hover rounded-lg">
              انصراف
            </button>
          </DialogClose>
          <button
            onClick={handleSubmit}
            className="px-6 py-2.5 bg-[#8B5CF6] text-white rounded-lg text-sm font-semibold btn-hover"
          >
            ثبت آزمون گروهی
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ===== Section Header (reusable) =====
function SectionHeader({ icon, title, accent = 'var(--accent)', action }: { icon: React.ReactNode; title: string; accent?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2.5">
        <span className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `color-mix(in srgb, ${accent} 12%, transparent)`, color: accent }}>
          {icon}
        </span>
        <h3 className="text-sm font-bold text-[var(--foreground)]">{title}</h3>
      </div>
      {action}
    </div>
  );
}

// ===== Card wrapper (reusable) =====
function Card({ className = '', children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`surface-1 rounded-xl md:rounded-2xl p-4 md:p-5 ${className}`} {...rest}>
      {children}
    </div>
  );
}

// ===== ADVISOR VIEW 1: Dashboard (Global KPIs) =====
function AdvisorDashboardHome() {
  const students = MOCK_STUDENTS;
  const risks = useMemo(() => computeRisks(students), [students]);
  const statuses = useMemo(() => students.map(s => computeStudentStatus(s)), [students]);

  const statusCounts = useMemo(() => {
    const c = { excellent: 0, good: 0, fair: 0, 'at-risk': 0, critical: 0 };
    statuses.forEach(s => c[s]++);
    return c;
  }, [statuses]);

  const avgScore = Math.round(students.reduce((a, s) => a + s.mockExamScore, 0) / students.length);
  const avgStudy = Math.round(students.reduce((a, s) => a + s.studyHoursPerWeek, 0) / students.length);
  const avgAdherence = Math.round(students.reduce((a, s) => a + s.taskCompletionRate, 0) / students.length);
  const atRiskCount = statusCounts['at-risk'] + statusCounts.critical;

  const kpis = [
    { icon: <Users className="w-4 h-4" />, label: 'کل دانش‌آموزان', value: toPersianDigits(students.length), sub: 'تحت نظارت', accent: 'var(--accent)' },
    { icon: <AlertTriangle className="w-4 h-4" />, label: 'نیاز به مداخله', value: toPersianDigits(atRiskCount), sub: 'دانش‌آموز', accent: 'var(--danger)' },
    { icon: <Target className="w-4 h-4" />, label: 'میانگین نمره', value: toPersianDigits(avgScore), sub: 'آزمون آزمایشی', accent: 'var(--accent)' },
    { icon: <UserCheck className="w-4 h-4" />, label: 'میانگین رعایت', value: `${toPersianDigits(avgAdherence)}٪`, sub: 'تکمیل وظایف', accent: 'var(--warning)' },
  ];

  const statusBars = (Object.entries(statusCounts) as [StudentStatus, number][]).map(([status, count]) => ({
    status, count, config: STATUS_CONFIG[status], pct: Math.round((count / students.length) * 100),
  }));

  const activeRisks = risks.filter(r => r.level !== 'low');

  return (
    <div className="space-y-4 md:space-y-5">
      {/* Top row: KPI cards (mobile: 2-col grid, desktop: 4-col span 3 each) */}
      <div className="grid grid-cols-2 md:grid-cols-12 gap-3 md:gap-4">
        {kpis.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="md:col-span-3 surface-1 card-hover rounded-xl md:rounded-2xl p-4 md:p-5 edge-highlight"
          >
            <div className="flex items-center gap-2 mb-3">
              <span
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `color-mix(in srgb, ${kpi.accent} 12%, transparent)`, color: kpi.accent }}
              >
                {kpi.icon}
              </span>
              <span className="text-[11px] md:text-xs text-[var(--foreground-muted)] font-medium">{kpi.label}</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <p className="text-2xl md:text-3xl font-black text-[var(--foreground)] tabular-nums">{kpi.value}</p>
              <span className="text-[10px] md:text-[11px] text-[var(--foreground-subtle)]">{kpi.sub}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Middle row: status distribution (col-span-4) + study hours chart (col-span-8) — desktop only split; mobile stacks */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4">
        {/* Status distribution — mobile: horizontal bars, desktop: stacked bars */}
        <Card className="md:col-span-4">
          <SectionHeader icon={<Activity className="w-4 h-4" />} title="توزیع وضعیت دانش‌آموزان" />
          <div className="space-y-2.5">
            {statusBars.map(({ status, count, config, pct }) => (
              <div key={status}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className={config.color}>{config.icon}</span>
                    <span className="text-[11px] text-[var(--foreground-muted)] font-medium">{config.label}</span>
                  </div>
                  <span className="text-[11px] text-[var(--foreground)] font-bold tabular-nums">{toPersianDigits(count)}</span>
                </div>
                <div className="h-2 bg-[var(--bg-overlay)] rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${config.bg}`}
                    style={{ backgroundColor: 'currentColor' }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <div className={`h-full w-full ${config.bg}`} />
                  </motion.div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Study hours chart — full width on mobile, col-span-8 on desktop */}
        <Card className="md:col-span-8">
          <SectionHeader
            icon={<Clock className="w-4 h-4" />}
            title="ساعت مطالعه هفتگی"
            action={<span className="text-[11px] text-[var(--foreground-muted)]">هدف: <span className="text-[var(--foreground)] font-medium">۵۰ ساعت</span></span>}
          />
          <div className="space-y-2.5 max-h-72 overflow-y-auto custom-scrollbar pr-1">
            {students.map(student => (
              <MetricBar
                key={student.id}
                label={student.name.split(' ')[0]}
                value={student.studyHoursPerWeek}
                max={50}
                color={
                  student.studyHoursPerWeek >= student.studyHoursTarget
                    ? 'var(--accent)'
                    : student.studyHoursPerWeek >= student.studyHoursTarget * 0.7
                      ? 'var(--warning)'
                      : 'var(--danger)'
                }
              />
            ))}
          </div>
        </Card>
      </div>

      {/* Bottom row: red flags — full width, inner 3-col grid on desktop */}
      <Card className="border-[var(--danger)]/20">
        <SectionHeader
          icon={<Flame className="w-4 h-4" />}
          title="پرچم‌های قرمز"
          accent="var(--danger)"
          action={
            <span className="text-[11px] text-[var(--danger)] font-medium px-2.5 py-1 rounded-full bg-[var(--danger)]/10">
              {toPersianDigits(activeRisks.length)} مورد
            </span>
          }
        />
        {activeRisks.length === 0 ? (
          <div className="text-center py-6">
            <CheckCircle2 className="w-8 h-8 text-[var(--accent)] mx-auto mb-2" />
            <p className="text-sm text-[var(--foreground-muted)]">پرچم قرمزی شناسایی نشده</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {activeRisks.map(risk => {
              const student = students.find(s => s.id === risk.studentId)!;
              const config = RISK_CONFIG[risk.level];
              return (
                <div
                  key={risk.studentId}
                  className={`rounded-xl p-3.5 border ${config.border} ${config.bg} card-hover`}
                >
                  <div className="flex items-center gap-2.5 mb-2">
                    <span className="text-xl">{student.avatar}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[var(--foreground)] truncate">{student.name}</p>
                      <p className="text-[10px] text-[var(--foreground-muted)] truncate">{risk.reasons[0]}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${config.bg} ${config.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
                      {config.label}
                    </span>
                  </div>
                  <div className="flex items-start gap-1.5 pt-2 border-t border-[var(--border)]">
                    <Zap className="w-3 h-3 text-[var(--accent)] mt-0.5 shrink-0" />
                    <p className="text-[11px] text-[var(--foreground-muted)] leading-relaxed">{risk.immediateAction}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

// ===== ADVISOR VIEW 2: Students List =====
function AdvisorStudentsList() {
  const { setCurrentView, setSelectedStudentId } = useAppStore();
  const students = MOCK_STUDENTS;
  const [searchQuery, setSearchQuery] = useState('');
  const [groupExamOpen, setGroupExamOpen] = useState(false);

  const filteredStudents = useMemo(() => {
    if (!searchQuery) return students;
    return students.filter(s => s.name.includes(searchQuery) || s.grade.includes(searchQuery) || s.major.includes(searchQuery));
  }, [students, searchQuery]);

  const handleStudentClick = (studentId: string) => {
    setSelectedStudentId(studentId);
    setCurrentView('advisor-student-detail');
  };

  return (
    <div className="space-y-4">
      {/* Toolbar: search + group exam button */}
      <div className="flex gap-2 items-stretch">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--foreground-subtle)] pointer-events-none" />
          <input
            type="text"
            placeholder="جستجوی دانش‌آموز..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl pr-10 pl-4 py-3 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)] focus:outline-none focus:border-[var(--accent)]/40 focus:bg-[var(--bg-overlay)] transition-colors"
          />
        </div>
        <button
          onClick={() => setGroupExamOpen(true)}
          className="flex items-center gap-2 bg-[#8B5CF6]/10 border border-[#8B5CF6]/30 text-[#8B5CF6] rounded-xl px-4 py-3 text-sm font-medium btn-hover shrink-0"
        >
          <GraduationCap className="w-4 h-4" />
          <span className="hidden sm:inline">آزمون جدید</span>
        </button>
      </div>

      {/* Result count */}
      <div className="flex items-center justify-between px-1">
        <p className="text-[11px] text-[var(--foreground-muted)]">
          <span className="text-[var(--foreground)] font-bold tabular-nums">{toPersianDigits(filteredStudents.length)}</span> دانش‌آموز
        </p>
      </div>

      {/* ===== Mobile: vertical list of student cards ===== */}
      <div className="md:hidden space-y-3">
        {filteredStudents.map((student, index) => {
          const status = computeStudentStatus(student);
          const config = STATUS_CONFIG[status];
          const trend = TREND_CONFIG[student.studyHoursTrend];
          const scoreDiff = student.mockExamScore - student.previousMockScore;

          return (
            <motion.div
              key={student.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index * 0.04, 0.3), duration: 0.3 }}
              onClick={() => handleStudentClick(student.id)}
              className="surface-1 card-hover rounded-2xl p-4 cursor-pointer edge-highlight"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-11 h-11 rounded-xl bg-[var(--bg-overlay)] flex items-center justify-center text-xl shrink-0">{student.avatar}</span>
                  <div className="min-w-0">
                    <p className="font-bold text-[var(--foreground)] truncate">{student.name}</p>
                    <p className="text-[11px] text-[var(--foreground-muted)] truncate">{student.grade} - {student.major} | {student.goal}</p>
                  </div>
                </div>
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold ${config.bg} ${config.color} ring-1 ${config.ring} shrink-0`}>
                  {config.icon} {config.label}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2 pt-3 border-t border-[var(--border)]">
                <div className="text-center">
                  <p className="text-[10px] text-[var(--foreground-muted)] mb-0.5">نمره</p>
                  <p className="text-sm font-bold text-[var(--foreground)] tabular-nums">{toPersianDigits(student.mockExamScore)}</p>
                  <p className={`text-[9px] tabular-nums ${scoreDiff >= 0 ? 'text-[var(--accent)]' : 'text-[var(--danger)]'}`}>{scoreDiff >= 0 ? '+' : ''}{toPersianDigits(scoreDiff)}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-[var(--foreground-muted)] mb-0.5">ساعت/هفته</p>
                  <p className="text-sm font-bold text-[var(--foreground)] tabular-nums">{toPersianDigits(student.studyHoursPerWeek)}</p>
                  <p className="text-[9px] text-[var(--foreground-subtle)]">از {toPersianDigits(student.studyHoursTarget)}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-[var(--foreground-muted)] mb-0.5">تکمیل</p>
                  <p className="text-sm font-bold text-[var(--foreground)] tabular-nums">{toPersianDigits(student.taskCompletionRate)}٪</p>
                  <p className="text-[9px] text-[var(--foreground-subtle)]">وظایف</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-[var(--foreground-muted)] mb-0.5">روند</p>
                  <span className={`inline-flex items-center justify-center ${trend.color}`}>{trend.icon}</span>
                  <p className="text-[9px] text-[var(--foreground-subtle)]">مطالعه</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ===== Desktop: dense data table ===== */}
      <div className="hidden md:block surface-1 rounded-2xl overflow-hidden">
        {/* Header row */}
        <div className="grid grid-cols-12 gap-3 px-5 py-3 text-[11px] font-semibold text-[var(--foreground-muted)] border-b border-[var(--border)] bg-[var(--bg-overlay)]/40 uppercase tracking-wide">
          <div className="col-span-4">دانش‌آموز</div>
          <div className="col-span-1 text-center">نمره</div>
          <div className="col-span-2 text-center">وضعیت</div>
          <div className="col-span-1 text-center">تکمیل</div>
          <div className="col-span-2 text-center">ساعت مطالعه</div>
          <div className="col-span-1 text-center">روند</div>
          <div className="col-span-1 text-center">عملیات</div>
        </div>
        {/* Data rows */}
        <div>
          {filteredStudents.map((student, index) => {
            const status = computeStudentStatus(student);
            const config = STATUS_CONFIG[status];
            const trend = TREND_CONFIG[student.studyHoursTrend];
            const scoreDiff = student.mockExamScore - student.previousMockScore;

            return (
              <motion.button
                key={student.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: Math.min(index * 0.03, 0.25) }}
                onClick={() => handleStudentClick(student.id)}
                className="grid grid-cols-12 gap-3 px-5 py-3.5 items-center text-sm w-full text-right nav-item-hover border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-overlay)]/40"
              >
                <div className="col-span-4 flex items-center gap-3 min-w-0">
                  <span className="w-10 h-10 rounded-xl bg-[var(--bg-overlay)] flex items-center justify-center text-lg shrink-0">{student.avatar}</span>
                  <div className="min-w-0 text-right">
                    <p className="font-bold text-[var(--foreground)] truncate">{student.name}</p>
                    <p className="text-[11px] text-[var(--foreground-muted)] truncate">{student.grade} - {student.major} · {student.goal}</p>
                  </div>
                </div>
                <div className="col-span-1 text-center">
                  <p className="font-bold text-[var(--foreground)] tabular-nums">{toPersianDigits(student.mockExamScore)}</p>
                  <p className={`text-[10px] tabular-nums ${scoreDiff >= 0 ? 'text-[var(--accent)]' : 'text-[var(--danger)]'}`}>{scoreDiff >= 0 ? '▲' : '▼'} {toPersianDigits(Math.abs(scoreDiff))}</p>
                </div>
                <div className="col-span-2 flex justify-center">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold ${config.bg} ${config.color} ring-1 ${config.ring}`}>
                    {config.icon} {config.label}
                  </span>
                </div>
                <div className="col-span-1 text-center">
                  <p className="font-bold text-[var(--foreground)] tabular-nums">{toPersianDigits(student.taskCompletionRate)}٪</p>
                </div>
                <div className="col-span-2 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <div className="flex-1 max-w-[60px] h-1.5 bg-[var(--bg-overlay)] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min((student.studyHoursPerWeek / student.studyHoursTarget) * 100, 100)}%`,
                          backgroundColor: student.studyHoursPerWeek >= student.studyHoursTarget ? 'var(--accent)' : student.studyHoursPerWeek >= student.studyHoursTarget * 0.7 ? 'var(--warning)' : 'var(--danger)',
                        }}
                      />
                    </div>
                    <span className="text-[11px] text-[var(--foreground)] tabular-nums">{toPersianDigits(student.studyHoursPerWeek)}/{toPersianDigits(student.studyHoursTarget)}</span>
                  </div>
                </div>
                <div className="col-span-1 text-center">
                  <span className={`inline-flex items-center justify-center ${trend.color}`}>{trend.icon}</span>
                </div>
                <div className="col-span-1 flex justify-center">
                  <span className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--foreground-subtle)] icon-btn border border-[var(--border)]">
                    <ChevronLeft className="w-3.5 h-3.5 flip-rtl" />
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Group Exam Modal */}
      <GroupExamModal open={groupExamOpen} onOpenChange={setGroupExamOpen} />
    </div>
  );
}

// ===== ADVISOR VIEW 3: Student Detail =====
function AdvisorStudentDetail() {
  const { selectedStudentId, setCurrentView, setSelectedStudentId, tasks, exams, addTask, updateTask, deleteTask, addExam } = useAppStore();
  const students = MOCK_STUDENTS;
  const analyses = useMemo(() => computeAnalyses(students), [students]);

  const student = students.find(s => s.id === selectedStudentId) || null;
  const analysis = analyses.find(a => a.studentId === selectedStudentId) || null;
  const status = student ? computeStudentStatus(student) : null;
  const risk = student ? computeRisks([student])[0] : null;

  // Task management state
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Exam modal state
  const [examModalOpen, setExamModalOpen] = useState(false);

  // Filter tasks and exams for this student
  const studentTasks = useMemo(() =>
    tasks.filter(t => t.studentId === selectedStudentId),
    [tasks, selectedStudentId]
  );

  const studentExams = useMemo(() =>
    exams.filter(e => e.studentIds.includes(selectedStudentId ?? '')),
    [exams, selectedStudentId]
  );

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setTaskModalOpen(true);
  };

  const handleDeleteTask = (taskId: string) => {
    deleteTask(taskId);
    toast.success('وظیفه حذف شد');
  };

  const handleAddTask = () => {
    setEditingTask(null);
    setTaskModalOpen(true);
  };

  if (!student || !analysis || !status || !risk) {
    return (
      <div className="surface-1 rounded-2xl p-8 text-center">
        <Eye className="w-10 h-10 text-[var(--foreground-subtle)] mx-auto mb-3" />
        <p className="text-[var(--foreground)] font-bold">دانش‌آموزی انتخاب نشده</p>
      </div>
    );
  }

  const scoreDiff = student.mockExamScore - student.previousMockScore;
  const profileKpis = [
    { label: 'نمره آزمون', value: toPersianDigits(student.mockExamScore), sub: `${scoreDiff >= 0 ? '+' : ''}${toPersianDigits(scoreDiff)}`, accent: scoreDiff >= 0 ? 'var(--accent)' : 'var(--danger)' },
    { label: 'ساعت مطالعه', value: toPersianDigits(student.studyHoursPerWeek), sub: `از ${toPersianDigits(student.studyHoursTarget)}`, accent: 'var(--accent)' },
    { label: 'حضور', value: `${toPersianDigits(student.attendanceRate)}٪`, sub: 'در کلاس', accent: 'var(--accent)' },
    { label: 'تکمیل وظایف', value: `${toPersianDigits(student.taskCompletionRate)}٪`, sub: 'این هفته', accent: 'var(--accent)' },
  ];

  const moodAccent = student.mood === 'critical' ? 'var(--danger)' : student.mood === 'poor' ? 'orange' : student.mood === 'fair' ? 'var(--warning)' : 'var(--accent)';

  return (
    <div className="space-y-4">
      {/* ===== Back button (sticky on mobile) ===== */}
      <div className="md:sticky md:top-4 z-20 -mx-4 md:mx-0 px-4 md:px-0 py-3 md:py-0 md:static bg-[rgba(10,10,13,0.85)] md:bg-transparent backdrop-blur-xl md:backdrop-blur-none border-b md:border-0 border-[var(--border)]">
        <button
          onClick={() => { setSelectedStudentId(null); setCurrentView('advisor-students'); }}
          className="flex items-center gap-2 text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] btn-hover min-h-[44px]"
        >
          <ChevronRight className="w-4 h-4 flip-rtl" />
          <span>بازگشت به لیست</span>
        </button>
      </div>

      {/* ===== Desktop 12-col grid layout ===== */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* ===== RIGHT (sticky) — Profile + Wellbeing + Interventions + Notes ===== */}
        {/* In RTL with grid-cols-12, the first child appears on the right. We want profile on right, so right column is rendered first. */}
        <div className="md:col-span-4 order-1 md:order-1">
          <div className="md:sticky md:top-4 space-y-4">
            {/* Profile card */}
            <Card>
              <div className="flex items-start gap-3 mb-4">
                <span className="w-14 h-14 rounded-2xl bg-[var(--bg-overlay)] flex items-center justify-center text-2xl shrink-0">{student.avatar}</span>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-[var(--foreground)] truncate">{student.name}</h3>
                  <p className="text-[11px] text-[var(--foreground-muted)] truncate">{student.grade} - {student.major} | {student.goal}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${STATUS_CONFIG[status].bg} ${STATUS_CONFIG[status].color} ring-1 ${STATUS_CONFIG[status].ring}`}>
                      {STATUS_CONFIG[status].icon} {STATUS_CONFIG[status].label}
                    </span>
                    <span className="text-[10px] text-[var(--foreground-muted)]">{toPersianDigits(student.weeksUntilExam)} هفته تا کنکور</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {profileKpis.map(kpi => (
                  <div key={kpi.label} className="bg-[var(--bg-overlay)]/60 rounded-lg p-2.5 border border-[var(--border)]">
                    <p className="text-[10px] text-[var(--foreground-muted)] mb-0.5">{kpi.label}</p>
                    <p className="text-base font-black text-[var(--foreground)] tabular-nums">{kpi.value}</p>
                    <p className="text-[10px] tabular-nums" style={{ color: kpi.accent }}>{kpi.sub}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Wellbeing card */}
            <Card>
              <SectionHeader icon={<Heart className="w-4 h-4" />} title="وضعیت روانی" accent={moodAccent === 'orange' ? '#FB923C' : moodAccent} />
              <div className="flex items-center gap-3 mb-4">
                <span className={`w-10 h-10 rounded-xl flex items-center justify-center ring-1 ${MOOD_CONFIG[student.mood].bg} ${MOOD_CONFIG[student.mood].ring}`}>
                  <span className={`w-2.5 h-2.5 rounded-full ${MOOD_CONFIG[student.mood].dot}`} />
                </span>
                <div>
                  <p className={`font-bold ${MOOD_CONFIG[student.mood].color}`}>{MOOD_CONFIG[student.mood].label}</p>
                  <p className="text-[11px] text-[var(--foreground-muted)]">آخرین جلسه: {toPersianDigits(student.lastSessionDate)}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] text-[var(--foreground-muted)] font-medium">انگیزه</span>
                    <span className="text-[11px] text-[var(--foreground)] tabular-nums">{toPersianDigits(student.motivationLevel)}/۱۰</span>
                  </div>
                  <div className="w-full h-2 bg-[var(--bg-overlay)] rounded-full overflow-hidden">
                    <motion.div className="h-full rounded-full" style={{ backgroundColor: student.motivationLevel >= 7 ? 'var(--accent)' : student.motivationLevel >= 4 ? 'var(--warning)' : 'var(--danger)' }} initial={{ width: 0 }} animate={{ width: `${student.motivationLevel * 10}%` }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] text-[var(--foreground-muted)] font-medium">استرس</span>
                    <span className="text-[11px] text-[var(--foreground)] tabular-nums">{toPersianDigits(student.stressLevel)}/۱۰</span>
                  </div>
                  <div className="w-full h-2 bg-[var(--bg-overlay)] rounded-full overflow-hidden">
                    <motion.div className="h-full rounded-full" style={{ backgroundColor: student.stressLevel <= 3 ? 'var(--accent)' : student.stressLevel <= 6 ? 'var(--warning)' : 'var(--danger)' }} initial={{ width: 0 }} animate={{ width: `${student.stressLevel * 10}%` }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-4">
                <div className="bg-[var(--bg-overlay)]/60 rounded-lg p-2.5 text-center border border-[var(--border)]">
                  <Timer className="w-4 h-4 text-[#8B5CF6] mx-auto mb-1" />
                  <p className="text-sm font-bold text-[var(--foreground)] tabular-nums">{toPersianDigits(student.pomodoroSessionsPerWeek)}</p>
                  <p className="text-[10px] text-[var(--foreground-muted)]">پومودورو/هفته</p>
                </div>
                <div className="bg-[var(--bg-overlay)]/60 rounded-lg p-2.5 text-center border border-[var(--border)]">
                  <BookOpen className="w-4 h-4 text-[var(--warning)] mx-auto mb-1" />
                  <p className="text-sm font-bold text-[var(--foreground)] tabular-nums">{toPersianDigits(student.flashcardsMastered)}/{toPersianDigits(student.flashcardsTotal)}</p>
                  <p className="text-[10px] text-[var(--foreground-muted)]">فلش‌کارت</p>
                </div>
              </div>
            </Card>

            {/* Strengths & Weaknesses (compact, stacked in right column on desktop) */}
            <Card>
              <SectionHeader icon={<Sparkles className="w-4 h-4" />} title="نقاط قوت و ضعف" />
              <div className="space-y-3">
                <div className="rounded-lg p-3 bg-[var(--accent-soft)] border border-[var(--accent)]/20">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[var(--accent)]" />
                    <h4 className="text-[11px] font-bold text-[var(--accent)] uppercase tracking-wide">قوت</h4>
                  </div>
                  <div className="space-y-1.5">
                    {analysis.strengths.length > 0 ? analysis.strengths.map((s, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="w-1 h-1 rounded-full bg-[var(--accent)] mt-2 shrink-0" />
                        <span className="text-[12px] text-[var(--foreground)] leading-relaxed">{s}</span>
                      </div>
                    )) : <p className="text-[12px] text-[var(--foreground-muted)]">نقطه قوت مشخصی شناسایی نشده</p>}
                  </div>
                </div>
                <div className="rounded-lg p-3 bg-[var(--danger)]/10 border border-[var(--danger)]/20">
                  <div className="flex items-center gap-2 mb-2">
                    <XCircle className="w-3.5 h-3.5 text-[var(--danger)]" />
                    <h4 className="text-[11px] font-bold text-[var(--danger)] uppercase tracking-wide">ضعف</h4>
                  </div>
                  <div className="space-y-1.5">
                    {analysis.weaknesses.length > 0 ? analysis.weaknesses.map((w, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="w-1 h-1 rounded-full bg-[var(--danger)] mt-2 shrink-0" />
                        <span className="text-[12px] text-[var(--foreground)] leading-relaxed">{w}</span>
                      </div>
                    )) : <p className="text-[12px] text-[var(--foreground-muted)]">نقطه ضعف مشخصی شناسایی نشده</p>}
                  </div>
                </div>
              </div>
            </Card>

            {/* Psychological assessment */}
            <Card>
              <SectionHeader icon={<Brain className="w-4 h-4" />} title="ارزیابی روانشناختی" accent="#EC4899" />
              <p className="text-[13px] text-[var(--foreground)] leading-relaxed">{analysis.psychologicalAssessment}</p>
            </Card>

            {/* Interventions */}
            <Card>
              <SectionHeader icon={<Zap className="w-4 h-4" />} title="برنامه مداخله‌ای" />
              <div className="space-y-2.5">
                {analysis.interventions.map((intervention, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-lg bg-[var(--accent-soft)] flex items-center justify-center text-[11px] font-bold text-[var(--accent)] shrink-0 tabular-nums">{toPersianDigits(i + 1)}</span>
                    <span className="text-[13px] text-[var(--foreground)] leading-relaxed">{intervention}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Notes + Weekly Template */}
            <Card>
              <SectionHeader icon={<FileText className="w-4 h-4" />} title="یادداشت‌ها و الگوها" accent="#8B5CF6" />
              <div className="bg-[var(--bg-overlay)]/60 rounded-lg p-3 border border-[var(--border)] mb-3">
                <p className="text-[10px] text-[var(--foreground-muted)] mb-1 font-medium">یادداشت مشاور:</p>
                <p className="text-[12px] text-[var(--foreground)] leading-relaxed">{student.advisorNotes}</p>
              </div>
              <p className="text-[11px] text-[var(--foreground-muted)] mb-2">تخصیص الگوی هفتگی:</p>
              <div className="grid grid-cols-2 gap-2">
                {['الگوی فشرده کنکور', 'الگوی متعادل', 'الگوی مرور', 'الگوی سفارشی'].map((template) => (
                  <button
                    key={template}
                    className="bg-[var(--bg-overlay)]/60 border border-[var(--border)] rounded-lg p-2.5 text-[12px] text-[var(--foreground-muted)] hover:border-[#8B5CF6]/30 hover:text-[var(--foreground)] nav-item-hover text-center"
                  >
                    {template}
                  </button>
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* ===== LEFT (col-span-8) — Radar+Grades, Tasks, Exams ===== */}
        <div className="md:col-span-8 order-2 md:order-2 space-y-4">
          {/* Radar chart + grades */}
          <Card>
            <SectionHeader
              icon={<Target className="w-4 h-4" />}
              title="نمرات دروس"
              action={<span className="text-[11px] text-[var(--foreground-muted)]">{toPersianDigits(Object.keys(student.schoolGrades).length)} درس</span>}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div className="flex items-center justify-center py-2">
                <MiniRadar grades={student.schoolGrades} size={180} />
              </div>
              <div className="space-y-2">
                {Object.entries(student.schoolGrades).map(([subject, grade]) => (
                  <MetricBar
                    key={subject}
                    label={subject}
                    value={grade}
                    max={20}
                    color={grade >= 17 ? 'var(--accent)' : grade >= 14 ? 'var(--warning)' : 'var(--danger)'}
                  />
                ))}
              </div>
            </div>
          </Card>

          {/* Tasks section */}
          <Card>
            <SectionHeader
              icon={<ClipboardList className="w-4 h-4" />}
              title="وظایف دانش‌آموز"
              action={
                <button
                  onClick={handleAddTask}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--accent-soft)] border border-[var(--accent)]/30 rounded-lg text-[11px] font-medium text-[var(--accent)] btn-hover"
                >
                  <Plus className="w-3.5 h-3.5" />
                  افزودن وظیفه
                </button>
              }
            />
            {studentTasks.length === 0 ? (
              <div className="text-center py-8">
                <ClipboardList className="w-8 h-8 text-[var(--foreground-subtle)] mx-auto mb-2" />
                <p className="text-sm text-[var(--foreground-muted)]">هنوز وظیفه‌ای برای این دانش‌آموز تعریف نشده</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[28rem] overflow-y-auto custom-scrollbar pr-1 -mr-1">
                {studentTasks.map((task, index) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: Math.min(index * 0.03, 0.25) }}
                    className="flex items-center gap-3 bg-[var(--bg-overlay)]/50 rounded-lg p-3 border border-[var(--border)] hover:border-[var(--border-strong)] transition-colors group"
                  >
                    <div className="w-1 h-10 rounded-full shrink-0" style={{ backgroundColor: task.subjectColor }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-medium text-[var(--foreground)] truncate">{task.subject}</span>
                        <span className="text-[var(--foreground-subtle)] text-xs">-</span>
                        <span className="text-xs text-[var(--foreground-muted)] truncate">{task.topic}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          task.fieldType === 'کنکور' ? 'bg-[var(--accent-soft)] text-[var(--accent)]' : 'bg-[var(--warning)]/10 text-[var(--warning)]'
                        }`}>
                          {task.fieldType}
                        </span>
                        {task.activityTypes.map(at => (
                          <span key={at} className="px-1.5 py-0.5 rounded text-[10px] bg-[var(--bg-overlay)] text-[var(--foreground-muted)]">{at}</span>
                        ))}
                        <span className="text-[10px] text-[var(--foreground-subtle)] flex items-center gap-0.5">
                          <Clock className="w-3 h-3" />
                          {toPersianDigits(task.targetTimeMinutes)} دقیقه
                        </span>
                        {task.targetTestCount > 0 && (
                          <span className="text-[10px] text-[var(--foreground-subtle)] flex items-center gap-0.5">
                            <Target className="w-3 h-3" />
                            {toPersianDigits(task.targetTestCount)} تست
                          </span>
                        )}
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0 ${
                      task.createdBy === 'advisor'
                        ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                        : 'bg-[var(--bg-overlay)] text-[var(--foreground-muted)]'
                    }`}>
                      {task.createdBy === 'advisor' ? 'مشاور' : 'خودم'}
                    </span>
                    {task.completed !== null && (
                      <span className={`shrink-0 ${task.completed ? 'text-[var(--accent)]' : 'text-[var(--foreground-subtle)]'}`}>
                        {task.completed ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      </span>
                    )}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleEditTask(task); }}
                        className="p-1.5 rounded-lg text-[var(--foreground-muted)] icon-btn border border-transparent"
                        aria-label="ویرایش وظیفه"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }}
                        className="p-1.5 rounded-lg text-[var(--foreground-muted)] hover:text-[var(--danger)] icon-btn border border-transparent"
                        aria-label="حذف وظیفه"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </Card>

          {/* Exams section */}
          <Card>
            <SectionHeader
              icon={<GraduationCap className="w-4 h-4" />}
              title="آزمون‌ها"
              accent="#8B5CF6"
              action={
                <button
                  onClick={() => setExamModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 rounded-lg text-[11px] font-medium text-[#8B5CF6] btn-hover"
                >
                  <Plus className="w-3.5 h-3.5" />
                  ثبت آزمون
                </button>
              }
            />
            {studentExams.length === 0 ? (
              <div className="text-center py-8">
                <GraduationCap className="w-8 h-8 text-[var(--foreground-subtle)] mx-auto mb-2" />
                <p className="text-sm text-[var(--foreground-muted)]">هنوز آزمونی برای این دانش‌آموز ثبت نشده</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[28rem] overflow-y-auto custom-scrollbar pr-1 -mr-1">
                {studentExams.map((exam, index) => {
                  const statusConfig = EXAM_STATUS_CONFIG[exam.status];
                  const studentResult = exam.results.find(r => r.studentId === selectedStudentId);
                  return (
                    <motion.div
                      key={exam.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: Math.min(index * 0.03, 0.25) }}
                      className="bg-[var(--bg-overlay)]/50 rounded-lg p-3 border border-[var(--border)] hover:border-[var(--border-strong)] transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-1 h-8 rounded-full shrink-0" style={{ backgroundColor: exam.subjectColor }} />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-[var(--foreground)] truncate">{exam.title}</p>
                            <p className="text-[10px] text-[var(--foreground-muted)]">{exam.subject}</p>
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0 ${statusConfig.bg} ${statusConfig.color}`}>
                          {statusConfig.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-[var(--foreground-muted)] flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {toPersianDigits(exam.date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {toPersianDigits(exam.startTime)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Timer className="w-3 h-3" />
                          {toPersianDigits(exam.duration)} دقیقه
                        </span>
                        <span className="flex items-center gap-1">
                          <Target className="w-3 h-3" />
                          از {toPersianDigits(exam.totalScore)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {toPersianDigits(exam.studentIds.length)} نفر
                        </span>
                      </div>
                      {exam.status === 'completed' && studentResult && studentResult.score !== null && (
                        <div className="mt-2 pt-2 border-t border-[var(--border)]">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-[var(--foreground-muted)]">نتیجه:</span>
                            <span className={`text-sm font-bold ${
                              studentResult.score >= exam.totalScore * 0.7 ? 'text-[var(--accent)]' :
                              studentResult.score >= exam.totalScore * 0.5 ? 'text-[var(--warning)]' : 'text-[var(--danger)]'
                            }`}>
                              {toPersianDigits(studentResult.score)}
                            </span>
                            <span className="text-[10px] text-[var(--foreground-muted)]">از {toPersianDigits(exam.totalScore)}</span>
                            {studentResult.rank !== null && (
                              <>
                                <span className="text-[10px] text-[var(--foreground-subtle)]">|</span>
                                <span className="text-[10px] text-[var(--foreground-muted)]">رتبه: {toPersianDigits(studentResult.rank)}</span>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Task Modal */}
      <TaskModal
        open={taskModalOpen}
        onOpenChange={setTaskModalOpen}
        studentId={selectedStudentId!}
        editTask={editingTask}
      />

      {/* Exam Modal */}
      <ExamModal
        open={examModalOpen}
        onOpenChange={setExamModalOpen}
        studentId={selectedStudentId!}
      />
    </div>
  );
}

// ===== Advisor Settings =====
function AdvisorSettings() {
  const { hapticFeedback, notificationReminders, setHapticFeedback, setNotificationReminders } = useAppStore();

  return (
    <div className="space-y-4 md:space-y-5" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-2.5 pb-2">
        <span className="w-9 h-9 rounded-xl bg-[var(--accent-soft)] flex items-center justify-center">
          <Shield className="w-4.5 h-4.5 text-[var(--accent)]" />
        </span>
        <div>
          <h2 className="text-lg font-bold text-[var(--foreground)]">تنظیمات مشاور</h2>
          <p className="text-[11px] text-[var(--foreground-muted)]">پیکربندی پنل شخصی</p>
        </div>
      </div>

      {/* Two-column layout on desktop, stacked on mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* App Settings */}
        <Card className="md:col-span-1">
          <SectionHeader icon={<Activity className="w-4 h-4" />} title="تنظیمات اپلیکیشن" />
          <div className="space-y-2">
            <div className="flex items-center justify-between min-h-[52px] py-2 border-b border-[var(--border)] last:border-0">
              <div>
                <p className="text-[var(--foreground)] text-sm font-medium">بازخورد لرزشی</p>
                <p className="text-[var(--foreground-muted)] text-[11px] mt-0.5">لرزش هنگام تعامل</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={hapticFeedback}
                  onChange={(e) => setHapticFeedback(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-[var(--bg-overlay)] border border-[var(--border)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--accent)] peer-checked:border-[var(--accent)]"></div>
              </label>
            </div>
            <div className="flex items-center justify-between min-h-[52px] py-2 border-b border-[var(--border)] last:border-0">
              <div>
                <p className="text-[var(--foreground)] text-sm font-medium">یادآوری اعلان‌ها</p>
                <p className="text-[var(--foreground-muted)] text-[11px] mt-0.5">اعلان برای برنامه مطالعه</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationReminders}
                  onChange={(e) => setNotificationReminders(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-[var(--bg-overlay)] border border-[var(--border)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--accent)] peer-checked:border-[var(--accent)]"></div>
              </label>
            </div>
          </div>
        </Card>

        {/* Quick stats card */}
        <Card className="md:col-span-1">
          <SectionHeader icon={<Sparkles className="w-4 h-4" />} title="خلاصه فعالیت" />
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[var(--bg-overlay)]/60 rounded-lg p-3 border border-[var(--border)]">
              <p className="text-2xl font-black text-[var(--accent)] tabular-nums">{toPersianDigits(MOCK_STUDENTS.length)}</p>
              <p className="text-[11px] text-[var(--foreground-muted)] mt-0.5">دانش‌آموز فعال</p>
            </div>
            <div className="bg-[var(--bg-overlay)]/60 rounded-lg p-3 border border-[var(--border)]">
              <p className="text-2xl font-black text-[var(--warning)] tabular-nums">
                {toPersianDigits(MOCK_STUDENTS.filter(s => {
                  const st = computeStudentStatus(s);
                  return st === 'at-risk' || st === 'critical';
                }).length)}
              </p>
              <p className="text-[11px] text-[var(--foreground-muted)] mt-0.5">نیازمند مداخله</p>
            </div>
            <div className="bg-[var(--bg-overlay)]/60 rounded-lg p-3 border border-[var(--border)]">
              <p className="text-2xl font-black text-[var(--accent)] tabular-nums">
                {toPersianDigits(Math.round(MOCK_STUDENTS.reduce((a, s) => a + s.mockExamScore, 0) / MOCK_STUDENTS.length))}
              </p>
              <p className="text-[11px] text-[var(--foreground-muted)] mt-0.5">میانگین نمره</p>
            </div>
            <div className="bg-[var(--bg-overlay)]/60 rounded-lg p-3 border border-[var(--border)]">
              <p className="text-2xl font-black text-[#8B5CF6] tabular-nums">
                {toPersianDigits(Math.round(MOCK_STUDENTS.reduce((a, s) => a + s.studyHoursPerWeek, 0) / MOCK_STUDENTS.length))}
              </p>
              <p className="text-[11px] text-[var(--foreground-muted)] mt-0.5">میانگین ساعت</p>
            </div>
          </div>
        </Card>
      </div>

      {/* About */}
      <Card>
        <SectionHeader icon={<FileText className="w-4 h-4" />} title="درباره پنل مشاور" accent="#8B5CF6" />
        <p className="text-[13px] text-[var(--foreground)] leading-relaxed">
          این پنل به مشاوران تحصیلی امکان مدیریت و تحلیل وضعیت دانش‌آموزان را می‌دهد. از اینجا می‌توانید پروفایل دانش‌آموزان را مشاهده، ارزیابی روانشناختی انجام و برنامه مداخله‌ای تعریف کنید.
        </p>
      </Card>

      {/* Version */}
      <div className="text-center space-y-1 pb-4 pt-2">
        <p className="text-[var(--foreground-muted)] text-sm font-medium">روال نسخه ۱.۰.۰ — پنل مشاور</p>
        <p className="text-[var(--foreground-subtle)] text-xs">ساخته شده برای مشاوران تحصیلی</p>
      </div>
    </div>
  );
}

// ===== Main Advisor Panel (router) =====
export default function AdvisorPanel() {
  const { currentView } = useAppStore();

  return (
    <div className="space-y-5 md:space-y-8" dir="rtl">
      {/* Mobile sticky glass header (glassmorphism allowed here per design rules) */}
      <header className="md:hidden sticky top-0 z-30 -mx-4 px-4 py-3 bg-[rgba(10,10,13,0.75)] backdrop-blur-xl border-b border-[var(--border)]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-[var(--accent)] leading-tight">پنل مشاور</h1>
            <p className="text-[11px] text-[var(--foreground-muted)] mt-0.5">مدیریت و تحلیل دانش‌آموزان</p>
          </div>
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-[var(--accent-soft)] border border-[var(--border)]">
            <Shield className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span className="text-[11px] font-medium text-[var(--accent)]">مشاور</span>
          </div>
        </div>
      </header>

      {/* Desktop simple header (no glass) */}
      <header className="hidden md:flex items-center justify-between border-b border-[var(--border)] pb-5">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)] leading-tight">پنل مشاور</h1>
          <p className="text-sm text-[var(--foreground-muted)] mt-1">مدیریت و تحلیل دانش‌آموزان</p>
        </div>
        <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-full bg-[var(--accent-soft)] border border-[var(--border)]">
          <Shield className="w-4 h-4 text-[var(--accent)]" />
          <span className="text-xs font-medium text-[var(--accent)]">مشاور تحصیلی</span>
        </div>
      </header>

      {/* Content with AnimatePresence transition */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentView}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          {currentView === 'advisor-dashboard' && <AdvisorDashboardHome />}
          {currentView === 'advisor-students' && <AdvisorStudentsList />}
          {currentView === 'advisor-student-detail' && <AdvisorStudentDetail />}
          {currentView === 'advisor-settings' && <AdvisorSettings />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
