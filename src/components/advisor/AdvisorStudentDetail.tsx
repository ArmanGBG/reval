'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import { MOCK_STUDENTS } from '@/lib/constants/mockData';
import { Task } from '@/lib/types';
import {
  Heart,
  Brain,
  Clock,
  Target,
  BookOpen,
  Timer,
  Eye,
  ChevronRight,
  Sparkles,
  Zap,
  CheckCircle2,
  XCircle,
  FileText,
  ClipboardList,
  Plus,
  Pencil,
  Trash2,
  GraduationCap,
  Calendar,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { TaskModal } from './TaskModal';
import { ExamModal } from './ExamModal';
import { Card, SectionHeader, MetricBar, MiniRadar } from './advisor-ui';
import { toPersianDigits, computeStudentStatus, computeRisks, computeAnalyses, STATUS_CONFIG, MOOD_CONFIG, EXAM_STATUS_CONFIG } from './advisor-helpers';

// ===== ADVISOR VIEW 3: Student Detail =====
export function AdvisorStudentDetail() {
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
