'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Check, Calendar, ChevronDown, ChevronLeft, ChevronRight, Loader2, Clock, Target, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { useAppStore } from '@/lib/store';
import { Task, ActivityType, FieldType } from '@/lib/types';
import { Subject } from '@/lib/subjects-types';
import {
  TaskSubjectPicker,
  TaskSelection,
} from '@/components/shared/TaskSubjectPicker';
import {
  PERSIAN_WEEKDAYS,
  PERSIAN_WEEKDAYS_SHORT,
  PERSIAN_MONTHS,
  toPersianDigits,
  getWeekDays,
  toISODate,
  isToday,
  isSameDay,
  formatPersianDate,
  getPersianWeekdayName,
  getPersianWeekday,
  toJalali,
  jalaliToDate,
  getDaysInJalaliMonth,
  getFirstDayOfJalaliMonth,
  getTodayJalali,
} from '@/lib/persian-date';
import { useCurrentStudentId } from '@/lib/student-utils';
import { TaskDetailsDialog } from './TaskDetailsDialog';
import { PersianDateRangePicker } from '@/components/shared/PersianDateRangePicker';
import type { PlanActor, PlanTargetStudent } from './PlanView';

// ===== Types =====
interface WeekdayPlan {
  date: Date;
  dateStr: string;
  tasks: Task[];
}

interface WeeklyPlannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetStudent?: PlanTargetStudent;
  actor?: PlanActor;
}

type QuickSubject = Subject & { resolvedFieldType: FieldType };

type RangeMode = 'week' | 'custom';

interface JalaliYMD {
  jy: number;
  jm: number;
  jd: number;
}

const ACTIVITY_TYPES: ActivityType[] = ['مطالعه', 'مرور', 'تست آموزشی', 'تست سنجشی', 'کلاس/ویدیو'];

const TIME_QUICK_PICKS = [60, 90, 120];
const TEST_QUICK_PICKS = [20, 30, 40];

// ============================================================
// Main Component — reads REAL tasks from store, immediate sync
// ============================================================
export function WeeklyPlanner({ open, onOpenChange, targetStudent, actor }: WeeklyPlannerProps) {
  const { user, tasks, addTask, updateTask, deleteTask, resetTask } = useAppStore();
  const currentStudentId = useCurrentStudentId();
  const studentId = targetStudent?.id ?? currentStudentId;
  const isAdvisorWorkspace = actor?.role === 'ADVISOR';
  const canManageTask = useCallback((task: Task) => !isAdvisorWorkspace || (
    task.createdBy === 'advisor'
    && task.createdById === actor?.id
    && task.status !== 'COMPLETED'
    && task.status !== 'SKIPPED'
  ), [actor?.id, isAdvisorWorkspace]);
  // The assigned advisor can edit plan details for every task. Destructive
  // actions remain guarded by canManageTask and task ownership.
  const canEditTask = useCallback((_task: Task) => true, []);

  // Available subjects
  const [subjects, setSubjects] = useState<QuickSubject[]>([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);

  // Which day's "add subject" picker is open
  const [addingToDay, setAddingToDay] = useState<string | null>(null); // dateStr

  // Which subject is being edited
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  // Range mode
  const [rangeMode, setRangeMode] = useState<RangeMode>('week');

  // Week offset (0 = current week, 1 = next week)
  const [weekOffset, setWeekOffset] = useState(0);

  // Custom range dates (as Date objects)
  const [customStartDate, setCustomStartDate] = useState<Date | null>(null);
  const [customEndDate, setCustomEndDate] = useState<Date | null>(null);

  // Get the days to display based on mode
  const displayDays = useMemo(() => {
    if (rangeMode === 'week') {
      const today = new Date();
      today.setDate(today.getDate() + weekOffset * 7);
      return getWeekDays(today);
    }
    // Custom mode
    if (customStartDate && customEndDate) {
      const start = customStartDate;
      const end = customEndDate;
      // Ensure start <= end
      const s = start <= end ? start : end;
      const e = start <= end ? end : start;
      const diffMs = e.getTime() - s.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1;
      if (diffDays > 60) return []; // safety limit
      const days: Date[] = [];
      for (let i = 0; i < diffDays; i++) {
        const d = new Date(s);
        d.setDate(s.getDate() + i);
        days.push(d);
      }
      return days;
    }
    return [];
  }, [rangeMode, weekOffset, customStartDate, customEndDate]);

  // Build plan: tasks grouped by date
  const weekPlan: WeekdayPlan[] = useMemo(() => {
    return displayDays.map((date) => {
      const dateStr = toISODate(date);
      const dayTasks = tasks
        .filter((t) => t.date === dateStr && t.studentId === (studentId))
        .sort((a, b) => {
          const aPending = a.completed === null ? 0 : 1;
          const bPending = b.completed === null ? 0 : 1;
          if (aPending !== bPending) return aPending - bPending;
          return a.order - b.order;
        });
      return { date, dateStr, tasks: dayTasks };
    });
  }, [displayDays, tasks, studentId]);

  // ===== Fetch subjects =====
  const fetchSubjects = useCallback(async () => {
    setSubjectsLoading(true);
    try {
      const grade = targetStudent?.grade ?? user?.grade ?? 'دوازدهم';
      const major = targetStudent?.major ?? user?.major ?? 'تجربی';
      const [konkurRes, finalRes] = await Promise.all([
        fetch(`/api/subjects/for-task?fieldType=${encodeURIComponent('کنکور')}&grade=${encodeURIComponent(grade)}&major=${encodeURIComponent(major)}`),
        fetch(`/api/subjects/for-task?fieldType=${encodeURIComponent('نهایی')}&grade=${encodeURIComponent(grade)}&major=${encodeURIComponent(major)}`),
      ]);
      const konkurData = await konkurRes.json();
      const finalData = await finalRes.json();
      if (!konkurRes.ok || !finalRes.ok) throw new Error(konkurData.error || finalData.error);
      const resolved = new Map<string, QuickSubject>();
      for (const subject of konkurData.subjects || []) resolved.set(subject.id, { ...subject, resolvedFieldType: 'کنکور' });
      for (const subject of finalData.subjects || []) if (!resolved.has(subject.id)) resolved.set(subject.id, { ...subject, resolvedFieldType: 'نهایی' });
      setSubjects([...resolved.values()]);
    } catch {
      setSubjects([]);
    } finally {
      setSubjectsLoading(false);
    }
  }, [targetStudent?.grade, targetStudent?.major, user?.grade, user?.major]);

  useEffect(() => {
    if (open) fetchSubjects();
  }, [open, fetchSubjects]);

  // ===== Add subject to a day (IMMEDIATE — creates real task) =====
  const addSubjectToDay = async (dateStr: string, subject: QuickSubject) => {
    const existingCount = tasks.filter((t) => t.date === dateStr && t.studentId === (studentId)).length;
    const newTask: Task = {
      id: crypto.randomUUID(),
      studentId: studentId,
      subject: subject.name,
      subjectId: subject.id,
      subjectColor: subject.color,
      topic: null,
      fieldType: subject.resolvedFieldType,
      activityTypes: null,
      targetTimeMinutes: null,
      actualTimeMinutes: null,
      targetTestCount: null,
      actualTestCount: null,
      status: 'DRAFT',
      completed: null,
      date: dateStr,
      order: existingCount,
      createdBy: isAdvisorWorkspace ? 'advisor' : 'student',
      createdById: isAdvisorWorkspace ? actor?.id ?? null : null,
      detailsCompleted: false,
    };
    try {
      await addTask(newTask);
      setAddingToDay(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'افزودن درس به برنامه ناموفق بود');
    }
  };

  // ===== Stats =====
  const totalTasks = weekPlan.reduce((acc, day) => acc + day.tasks.length, 0);
  const totalDetailed = weekPlan.reduce(
    (acc, day) => acc + day.tasks.filter((t) => t.detailsCompleted).length,
    0
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="surface-2 border-[var(--border-strong)] text-[var(--foreground)] max-w-[calc(100%-1rem)] sm:max-w-4xl max-h-[92vh] overflow-hidden flex flex-col rounded-2xl p-0" dir="rtl">
        {/* ===== Header ===== */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[var(--accent-soft)] flex items-center justify-center">
              <Calendar className="w-4.5 h-4.5 text-[var(--accent)]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--foreground)]">برنامه هفتگی</h2>
              <p className="text-[11px] text-[var(--foreground-muted)]">
                {toPersianDigits(totalTasks)} تسک · {toPersianDigits(totalDetailed)} با جزئیات
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {rangeMode === 'week' && (
              <>
                <button
                  onClick={() => setWeekOffset((v) => v - 1)}
                  className="icon-btn w-7 h-7 rounded-lg border border-[var(--border)] flex items-center justify-center text-[var(--foreground-muted)] hover:text-[var(--foreground)] text-xs"
                >
                  {'<'}
                </button>
                <button
                  onClick={() => setWeekOffset(0)}
                  className="btn-hover h-7 px-3 rounded-lg border border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] text-xs font-medium"
                >
                  {weekOffset === 0 ? 'این هفته' : weekOffset > 0 ? `${toPersianDigits(weekOffset)} هفته بعد` : `${toPersianDigits(Math.abs(weekOffset))} هفته قبل`}
                </button>
                <button
                  onClick={() => setWeekOffset((v) => v + 1)}
                  className="icon-btn w-7 h-7 rounded-lg border border-[var(--border)] flex items-center justify-center text-[var(--foreground-muted)] hover:text-[var(--foreground)] text-xs"
                >
                  {'>'}
                </button>
              </>
            )}
            <button
              onClick={() => onOpenChange(false)}
              className="icon-btn w-8 h-8 rounded-lg border border-[var(--border)] flex items-center justify-center text-[var(--foreground-muted)] ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ===== Range mode selector ===== */}
        <div className="px-5 py-3 border-b border-[var(--border)] shrink-0 flex flex-wrap items-center gap-3">
          <div className="flex gap-1 bg-[var(--bg-overlay)] rounded-xl p-1">
            {([
              { key: 'week' as RangeMode, label: 'هفتگی' },
              { key: 'custom' as RangeMode, label: 'بازه دلخواه' },
            ]).map((mode) => (
              <button
                key={mode.key}
                onClick={() => {
                  setRangeMode(mode.key);
                  if (mode.key === 'custom' && !customStartDate) {
                    // Initialize custom range to current week
                    const today = new Date();
                    const weekD = getWeekDays(today);
                    setCustomStartDate(weekD[0]);
                    setCustomEndDate(weekD[6]);
                  }
                }}
                className={`btn-hover h-8 min-w-[4.5rem] px-3 rounded-lg text-xs font-semibold ${
                  rangeMode === mode.key
                    ? 'bg-[var(--accent)] text-[var(--bg-deep)]'
                    : 'text-[var(--foreground-muted)]'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>

        {/* ===== Custom range picker ===== */}
        {rangeMode === 'custom' && (
          <div className="px-5 py-3 border-b border-[var(--border)] shrink-0">
            <PersianDateRangePicker
              value={customStartDate && customEndDate ? { start: toISODate(customStartDate), end: toISODate(customEndDate) } : null}
              onChange={(range) => {
                setCustomStartDate(range ? new Date(`${range.start}T00:00:00`) : null);
                setCustomEndDate(range ? new Date(`${range.end}T00:00:00`) : null);
              }}
            />
          </div>
        )}

        {/* ===== Days grid ===== */}
        <div className="flex-1 overflow-y-auto px-5 py-4 custom-scrollbar">
          <div className={`grid gap-3 ${
            displayDays.length <= 4
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
              : displayDays.length <= 7
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
          }`}>
            {weekPlan.map((dayPlan) => (
              <DayColumn
                key={dayPlan.dateStr}
                 dayPlan={dayPlan}
                 onAdd={() => setAddingToDay(dayPlan.dateStr)}
                  canManage={canManageTask}
                  canEdit={canEditTask}
                  canComplete={!isAdvisorWorkspace}
                 onRemove={(taskId) => {
                   const task = tasks.find((item) => item.id === taskId);
                   if (task && canManageTask(task)) deleteTask(taskId);
                 }}
                  onEdit={(taskId) => {
                    const task = tasks.find((item) => item.id === taskId);
                    if (task && canEditTask(task)) setEditingTaskId(taskId);
                  }}
                onToggleComplete={(taskId) => {
                  const task = tasks.find((t) => t.id === taskId);
                   if (task && !isAdvisorWorkspace) {
                     if (!task.detailsCompleted) setEditingTaskId(task.id);
                      else if (task.status === 'PENDING' || (task.status === undefined && task.completed === null)) {
                        updateTask(taskId, {
                          status: 'COMPLETED',
                          completed: true,
                          actualTimeMinutes: task.actualTimeMinutes ?? task.targetTimeMinutes ?? 0,
                          actualTestCount: task.actualTestCount ?? task.targetTestCount ?? 0,
                        });
                    } else {
                      resetTask(taskId);
                    }
                  }
                }}
              />
            ))}
          </div>
        </div>

        {/* ===== Footer ===== */}
        <div className="px-5 py-3 border-t border-[var(--border)] flex items-center justify-between gap-3 shrink-0">
          <p className="text-[11px] text-[var(--foreground-muted)]">
            روی هر درس کلیک کنید تا جزئیاتش را ویرایش کنید
          </p>
          <button
            onClick={() => onOpenChange(false)}
            className="btn-hover glow-hover h-10 px-6 rounded-xl bg-[var(--accent)] text-[var(--bg-deep)] font-bold text-sm"
          >
            بستن
          </button>
        </div>

        {/* ===== Add Subject Picker Modal ===== */}
        {addingToDay && (
          <AddSubjectModal
            dayLabel={getPersianWeekdayName(new Date(addingToDay))}
            dateLabel={formatPersianDate(new Date(addingToDay))}
            subjects={subjects}
            loading={subjectsLoading}
            onClose={() => setAddingToDay(null)}
            onSelect={(subject) => addSubjectToDay(addingToDay, subject)}
          />
        )}

        {/* ===== Edit Task Details Modal ===== */}
        {editingTaskId && (
           <TaskDetailsDialog task={tasks.find(t => t.id === editingTaskId) ?? null} open grade={targetStudent?.grade ?? user?.grade ?? 'دوازدهم'} major={targetStudent?.major ?? user?.major ?? 'تجربی'} onOpenChange={v => !v && setEditingTaskId(null)} onSave={updates => updateTask(editingTaskId, updates)} />
        )}
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// Day Column — shows REAL tasks
// ============================================================
function DayColumn({
  dayPlan,
  canManage,
  canEdit,
  canComplete,
  onAdd,
  onRemove,
  onEdit,
  onToggleComplete,
}: {
  dayPlan: WeekdayPlan;
  canManage: (task: Task) => boolean;
  canEdit: (task: Task) => boolean;
  canComplete: boolean;
  onAdd: () => void;
  onRemove: (taskId: string) => void;
  onEdit: (taskId: string) => void;
  onToggleComplete: (taskId: string) => void;
}) {
  const dayName = getPersianWeekdayName(dayPlan.date);
  const dateLabel = formatPersianDate(dayPlan.date);
  const isTodayCell = isToday(dayPlan.date);

  return (
    <div className={`surface-1 rounded-xl overflow-hidden ${isTodayCell ? 'ring-1 ring-[var(--accent)]/40' : ''}`}>
      {/* Day header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-[var(--foreground)]">{dayName}</span>
          {isTodayCell && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
              امروز
            </span>
          )}
        </div>
      </div>
      <div className="px-3 pb-1">
        <span className="text-[10px] text-[var(--foreground-subtle)]">{dateLabel}</span>
      </div>

      {/* Tasks list */}
      <div className="p-2 space-y-1.5 min-h-[60px]">
        {dayPlan.tasks.length === 0 ? (
          <p className="text-[10px] text-[var(--foreground-subtle)] text-center py-3">خالی</p>
        ) : (
          dayPlan.tasks.map((task) => (
            <TaskChip
              key={task.id}
              task={task}
              canManage={canManage(task)}
              canEdit={canEdit(task)}
              canComplete={canComplete}
              onClick={() => onEdit(task.id)}
              onRemove={() => onRemove(task.id)}
              onToggleComplete={() => onToggleComplete(task.id)}
            />
          ))
        )}
      </div>

      {/* Add button */}
      <button
        onClick={onAdd}
        className="btn-hover w-full flex items-center justify-center gap-1.5 py-2 border-t border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--accent)] text-[11px] font-medium"
      >
        <Plus className="w-3 h-3" />
        درس
      </button>
    </div>
  );
}

// ============================================================
// Task Chip (clickable to edit)
// ============================================================
function TaskChip({
  task,
  canManage,
  canEdit,
  canComplete,
  onClick,
  onRemove,
  onToggleComplete,
}: {
  task: Task;
  canManage: boolean;
  canEdit: boolean;
  canComplete: boolean;
  onClick: () => void;
  onRemove: () => void;
  onToggleComplete: () => void;
}) {
  const hasDetails = task.detailsCompleted;
  const isDone = task.completed === true;

  return (
    <div className="group flex items-center gap-1.5">
      {/* Complete toggle */}
      {canComplete && <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleComplete();
        }}
        className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
          isDone
            ? 'bg-[var(--accent)] border-[var(--accent)] text-[var(--bg-deep)]'
            : 'border-[var(--border-strong)] text-transparent hover:border-[var(--accent)]'
        }`}
      >
         {hasDetails ? <Check className="w-3 h-3" /> : null}
      </button>}

      {/* Subject chip — click to edit */}
      <button
        onClick={canEdit ? onClick : undefined}
        className={`btn-hover relative overflow-hidden flex-1 px-2.5 py-2.5 rounded-lg border text-right ${
          hasDetails
            ? 'bg-[var(--accent-soft)] border-[var(--accent)]/20'
            : 'bg-[var(--bg-elevated)] border-[var(--border)]'
        } ${isDone ? 'opacity-50 line-through' : ''}`}
      >
        <span aria-hidden className="absolute top-0 left-0 right-0 h-[2px]" style={{ backgroundColor: task.subjectColor }} />
        <span className="flex items-center gap-2">
          <span className="text-xs font-medium text-[var(--foreground)] truncate flex-1">{task.subject}</span>
          {hasDetails && !isDone && <Check className="w-3 h-3 text-[var(--accent)] shrink-0" />}
          {!hasDetails && <span className="text-[9px] text-[var(--warning)] shrink-0">تکمیل جزئیات</span>}
        </span>
        {(task.teacherClassName || task.bookName) && <span className="mt-1 block text-[9px] text-[var(--foreground-subtle)] truncate">{[task.teacherClassName && `دبیر: ${task.teacherClassName}`, task.bookName && `کتاب: ${task.bookName}`].filter(Boolean).join(' · ')}</span>}
      </button>

      {/* Remove */}
      {canManage && <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="icon-btn w-6 h-6 rounded flex items-center justify-center text-[var(--foreground-subtle)] hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X className="w-3 h-3" />
      </button>}
    </div>
  );
}

// ============================================================
// Add Subject Modal
// ============================================================
function AddSubjectModal({
  dayLabel,
  dateLabel,
  subjects,
  loading,
  onClose,
  onSelect,
}: {
  dayLabel: string;
  dateLabel: string;
  subjects: QuickSubject[];
  loading: boolean;
  onClose: () => void;
  onSelect: (subject: QuickSubject) => void;
}) {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="surface-2 border-[var(--border-strong)] text-[var(--foreground)] max-w-[calc(100%-2rem)] sm:max-w-sm rounded-2xl" dir="rtl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-[var(--foreground)]">
              افزودن درس به {dayLabel}
            </h2>
            <p className="text-[11px] text-[var(--foreground-muted)] mt-0.5">{dateLabel}</p>
          </div>
          <button
            onClick={onClose}
            className="icon-btn w-8 h-8 rounded-lg border border-[var(--border)] flex items-center justify-center text-[var(--foreground-muted)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8 text-[var(--foreground-muted)]">
            <Loader2 className="w-5 h-5 animate-spin ml-2" />
            <span className="text-xs">در حال بارگذاری...</span>
          </div>
        ) : subjects.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-xs text-[var(--foreground-muted)]">درسی یافت نشد</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {subjects.map((s) => (
              <button
                key={s.id}
                onClick={() => onSelect(s)}
                className="btn-hover flex items-center gap-2 py-2.5 px-3 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--foreground)] hover:border-[var(--accent)]/30 text-sm"
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: s.color }}
                />
                <span className="truncate">{s.name}</span>
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// Edit Task Details Modal
// ============================================================
function EditTaskModal({
  task,
  onClose,
  onUpdate,
  onToggleActivity,
}: {
  task: Task;
  onClose: () => void;
  onUpdate: (updates: Partial<Task>) => void;
  onToggleActivity: (act: ActivityType) => void;
}) {
  const { user } = useAppStore();
  const dayLabel = getPersianWeekdayName(new Date(task.date));

  // Initial selection derived from the existing task
  const [selection, setSelection] = useState<TaskSelection>(
    task.topic && task.topic !== 'عمومی'
      ? {
          subjectId: task.subjectId ?? undefined,
          subjectName: task.subject,
          subjectColor: task.subjectColor,
          displayText: task.topic,
          chapterId: task.chapterId ?? undefined,
          topicId: task.topicId ?? undefined,
          topicIds: task.topicIds ?? [],
          topicModeId: task.topicModeId ?? undefined,
          curriculumMode: task.curriculumMode ?? undefined,
          topicModeSubtopicIds: task.topicModeSubtopicIds ?? [],
        }
      : {
          subjectId: task.subjectId ?? undefined,
          subjectName: task.subject,
          subjectColor: task.subjectColor,
        },
  );

  const [teacherClassName, setTeacherClassName] = useState(task.teacherClassName ?? '');
  const [sessionNumber, setSessionNumber] = useState(task.sessionNumber ?? '');
  const [bookName, setBookName] = useState(task.bookName ?? '');
  const [testDescription, setTestDescription] = useState(task.testDescription ?? '');
  const [teacherClassSuggestions, setTeacherClassSuggestions] = useState<string[]>([]);
  const [bookSuggestions, setBookSuggestions] = useState<string[]>([]);

  const handleChange = useCallback(
    (next: TaskSelection) => {
      setSelection(next);
      onUpdate({
        subjectId: next.subjectId ?? task.subjectId ?? null,
        topic: next.displayText || 'عمومی',
        subject: next.subjectName || task.subject,
        subjectColor: next.subjectColor || task.subjectColor,
        chapterId: next.chapterId ?? null,
        topicId: next.topicId ?? null,
        topicIds: next.topicIds ?? [],
        topicModeId: next.topicModeId ?? null,
        curriculumMode: next.curriculumMode ?? null,
        topicModeSubtopicIds: next.topicModeSubtopicIds ?? [],
        pageStart: next.pageStart ?? null,
        pageEnd: next.pageEnd ?? null,
      });
    },
    [onUpdate, task.subjectId, task.subject, task.subjectColor],
  );

  // Fetch suggestions when activity types change
  useEffect(() => {
    const hasClassVideo = (task.activityTypes ?? []).includes('کلاس/ویدیو');
    const hasTestDetails = (task.activityTypes ?? []).includes('تست آموزشی') || (task.activityTypes ?? []).includes('تست سنجشی');

    if (!task.subjectId || (!hasClassVideo && !hasTestDetails)) {
      setTeacherClassSuggestions([]);
      setBookSuggestions([]);
      return;
    }
    const subjectId = task.subjectId;

    const fetchSuggestions = async () => {
      const promises: Promise<void>[] = [];
      if (hasClassVideo) {
        promises.push(
          fetch(`/api/task-suggestions?studentId=${encodeURIComponent(task.studentId)}&subjectId=${encodeURIComponent(subjectId)}&type=teacherClass`)
            .then(r => r.ok ? r.json() : { values: [] })
            .then(data => setTeacherClassSuggestions(data.values || []))
            .catch(() => setTeacherClassSuggestions([]))
        );
      }
      if (hasTestDetails) {
        promises.push(
          fetch(`/api/task-suggestions?studentId=${encodeURIComponent(task.studentId)}&subjectId=${encodeURIComponent(subjectId)}&type=book`)
            .then(r => r.ok ? r.json() : { values: [] })
            .then(data => setBookSuggestions(data.values || []))
            .catch(() => setBookSuggestions([]))
        );
      }
      if (promises.length === 0) {
        setTeacherClassSuggestions([]);
        setBookSuggestions([]);
      }
      await Promise.all(promises);
    };

    fetchSuggestions();
  }, [task.activityTypes, task.subjectId, task.studentId]);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="surface-2 border-[var(--border-strong)] text-[var(--foreground)] max-w-[calc(100%-2rem)] sm:max-w-md max-h-[90vh] overflow-y-auto rounded-2xl" dir="rtl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: task.subjectColor }}
            />
            <h2 className="text-sm font-bold text-[var(--foreground)]">{task.subject}</h2>
            <span className="text-[var(--foreground-muted)] text-xs font-normal">· {dayLabel}</span>
          </div>
          <button
            onClick={onClose}
            className="icon-btn w-8 h-8 rounded-lg border border-[var(--border)] flex items-center justify-center text-[var(--foreground-muted)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Subject + topic picker */}
          <div>
            <label className="text-[11px] font-medium text-[var(--foreground-muted)] mb-1.5 block">
              درس و مبحث
            </label>
            <TaskSubjectPicker
              fieldType={task.fieldType}
              grade={user?.grade || 'دوازدهم'}
              major={user?.major || 'تجربی'}
              value={selection}
              onChange={handleChange}
            />
          </div>

          {/* Activity types */}
          <div>
            <label className="text-[11px] font-medium text-[var(--foreground-muted)] mb-1.5 block">
              نوع فعالیت
            </label>
            <div className="flex flex-wrap gap-1.5">
              {ACTIVITY_TYPES.map((act) => (
                <button
                  key={act}
                  onClick={() => onToggleActivity(act)}
                  className={`btn-hover px-3 py-2 rounded-lg text-xs font-medium border ${
                    (task.activityTypes ?? []).includes(act)
                      ? 'bg-[var(--accent)] text-[var(--bg-deep)] border-[var(--accent)]'
                      : 'bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--foreground-muted)]'
                  }`}
                >
                  {act}
                </button>
              ))}
            </div>
          </div>

          {(task.activityTypes ?? []).includes('کلاس/ویدیو') && (
            <div className="space-y-3 p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)]">
              <p className="text-[10px] text-[var(--foreground-subtle)] font-medium">جزئیات کلاس/ویدیو (اختیاری)</p>
              <div>
                <label className="text-[11px] text-[var(--foreground-muted)] mb-1.5 block">نام دبیر و کلاس</label>
                {teacherClassSuggestions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {teacherClassSuggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => {
                          setTeacherClassName(suggestion);
                          onUpdate({ teacherClassName: suggestion });
                        }}
                        className={`px-2.5 py-1 rounded-md text-[11px] border ${teacherClassName === suggestion ? 'bg-[var(--accent-soft)] border-[var(--accent)]/30 text-[var(--accent)]' : 'border-[var(--border)] text-[var(--foreground-muted)]'}`}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
                <input
                  type="text"
                  value={teacherClassName}
                  onChange={(e) => {
                    setTeacherClassName(e.target.value);
                    onUpdate({ teacherClassName: e.target.value || null });
                  }}
                  placeholder="مثلاً استاد محمدی - کلاس ۱۰"
                  className="w-full h-10 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] px-3 text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]/40"
                />
              </div>
              <div>
                <label className="text-[11px] text-[var(--foreground-muted)] mb-1.5 block">شماره جلسه</label>
                <input
                  type="text"
                  value={sessionNumber}
                  onChange={(e) => {
                    setSessionNumber(e.target.value);
                    onUpdate({ sessionNumber: e.target.value || null });
                  }}
                  placeholder="مثلاً جلسه ۱۲"
                  className="w-full h-10 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] px-3 text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]/40"
                />
              </div>
            </div>
          )}

          {((task.activityTypes ?? []).includes('تست آموزشی') || (task.activityTypes ?? []).includes('تست سنجشی')) && (
            <div className="space-y-3 p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)]">
              <p className="text-[10px] text-[var(--foreground-subtle)] font-medium">جزئیات تست (اختیاری)</p>
              <div>
                <label className="text-[11px] text-[var(--foreground-muted)] mb-1.5 block">نام کتاب</label>
                {bookSuggestions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {bookSuggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => {
                          setBookName(suggestion);
                          onUpdate({ bookName: suggestion });
                        }}
                        className={`px-2.5 py-1 rounded-md text-[11px] border ${bookName === suggestion ? 'bg-[var(--accent-soft)] border-[var(--accent)]/30 text-[var(--accent)]' : 'border-[var(--border)] text-[var(--foreground-muted)]'}`}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
                <input
                  type="text"
                  value={bookName}
                  onChange={(e) => {
                    setBookName(e.target.value);
                    onUpdate({ bookName: e.target.value || null });
                  }}
                  placeholder="مثلاً زیست‌شناسی نشر الگو"
                  className="w-full h-10 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] px-3 text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]/40"
                />
              </div>
              <div>
                <label className="text-[11px] text-[var(--foreground-muted)] mb-1.5 block">توضیح شماره تست‌ها</label>
                <input
                  type="text"
                  value={testDescription}
                  onChange={(e) => {
                    setTestDescription(e.target.value);
                    onUpdate({ testDescription: e.target.value || null });
                  }}
                  placeholder="مثلاً تست‌های ۱۲۰ تا ۱۵۰"
                  className="w-full h-10 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] px-3 text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]/40"
                />
              </div>
            </div>
          )}

          {/* Duration & test count */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium text-[var(--foreground-muted)] mb-1.5 block flex items-center gap-1">
                <Clock className="w-3 h-3" />
                زمان (دقیقه)
              </label>
              <input
                type="number"
                value={task.targetTimeMinutes ?? ''}
                onChange={(e) => onUpdate({ targetTimeMinutes: Number(e.target.value) })}
                className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-3 h-10 text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]/40"
                dir="ltr"
              />
              <div className="flex gap-1 mt-1.5">
                {TIME_QUICK_PICKS.map((m) => (
                  <button
                    key={m}
                    onClick={() => onUpdate({ targetTimeMinutes: m })}
                    className={`btn-hover flex-1 h-7 rounded text-[10px] font-medium border ${
                      task.targetTimeMinutes === m
                        ? 'bg-[var(--accent-soft)] border-[var(--accent)]/30 text-[var(--accent)]'
                        : 'border-[var(--border)] text-[var(--foreground-muted)]'
                    }`}
                  >
                    {toPersianDigits(m)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[11px] font-medium text-[var(--foreground-muted)] mb-1.5 block flex items-center gap-1">
                <Target className="w-3 h-3" />
                تعداد تست
              </label>
              <input
                type="number"
                value={task.targetTestCount ?? ''}
                onChange={(e) => onUpdate({ targetTestCount: Number(e.target.value) })}
                className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-3 h-10 text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]/40"
                dir="ltr"
              />
              <div className="flex gap-1 mt-1.5">
                {TEST_QUICK_PICKS.map((t) => (
                  <button
                    key={t}
                    onClick={() => onUpdate({ targetTestCount: t })}
                    className={`btn-hover flex-1 h-7 rounded text-[10px] font-medium border ${
                      task.targetTestCount === t
                        ? 'bg-[var(--accent-soft)] border-[var(--accent)]/30 text-[var(--accent)]'
                        : 'border-[var(--border)] text-[var(--foreground-muted)]'
                    }`}
                  >
                    {toPersianDigits(t)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Field type */}
          <div>
            <label className="text-[11px] font-medium text-[var(--foreground-muted)] mb-1.5 block">
              حوزه
            </label>
            <div className="flex gap-2">
              {(['کنکور', 'نهایی'] as FieldType[]).map((ft) => (
                <button
                  key={ft}
                  onClick={() => onUpdate({ fieldType: ft })}
                  className={`btn-hover flex-1 h-9 rounded-lg text-xs font-medium border ${
                    task.fieldType === ft
                      ? 'bg-[var(--accent-soft)] border-[var(--accent)]/30 text-[var(--accent)]'
                      : 'bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--foreground-muted)]'
                  }`}
                >
                  {ft}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-4 border-t border-[var(--border)]">
          <button
            onClick={onClose}
            className="btn-hover glow-hover flex-1 h-10 rounded-xl bg-[var(--accent)] text-[var(--bg-deep)] font-bold text-sm"
          >
            تایید
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// Mini Month Calendar — Jalali inline date picker
// ============================================================
function MiniMonthCalendar({
  jy,
  jm,
  startDate,
  endDate,
  pickerTarget,
  onPrevMonth,
  onNextMonth,
  onDayClick,
}: {
  jy: number;
  jm: number;
  startDate: Date | null;
  endDate: Date | null;
  pickerTarget: 'start' | 'end' | null;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onDayClick: (date: Date) => void;
}) {
  const daysInMonth = getDaysInJalaliMonth(jy, jm);
  const firstDayDate = getFirstDayOfJalaliMonth(jy, jm);
  const firstWeekday = getPersianWeekday(firstDayDate); // 0=Sat, 6=Fri

  // Build grid cells: empty slots before first day, then day numbers
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null); // empty slots
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  // Determine which dates are in the selected range
  const todayDate = new Date();
  const todayJal = toJalali(todayDate);

  function isInRange(dayNum: number): boolean {
    const date = jalaliToDate(jy, jm, dayNum);
    if (!startDate || !endDate) {
      // If only one is set, highlight just that day
      if (startDate && isSameDay(date, startDate)) return true;
      if (endDate && isSameDay(date, endDate)) return true;
      return false;
    }
    const s = startDate <= endDate ? startDate : endDate;
    const e = startDate <= endDate ? endDate : startDate;
    return date >= s && date <= e;
  }

  function isStart(dayNum: number): boolean {
    if (!startDate) return false;
    return isSameDay(jalaliToDate(jy, jm, dayNum), startDate);
  }

  function isEnd(dayNum: number): boolean {
    if (!endDate) return false;
    return isSameDay(jalaliToDate(jy, jm, dayNum), endDate);
  }

  function isToday(dayNum: number): boolean {
    return todayJal.jy === jy && todayJal.jm === jm && todayJal.jd === dayNum;
  }

  return (
    <div className="mt-3 surface-1 rounded-xl p-3 max-w-[280px]" dir="rtl">
      {/* Month header */}
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={onNextMonth}
          className="icon-btn w-6 h-6 rounded-md border border-[var(--border)] flex items-center justify-center text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
        <span className="text-xs font-bold text-[var(--foreground)]">
          {PERSIAN_MONTHS[jm - 1]} {toPersianDigits(jy)}
        </span>
        <button
          onClick={onPrevMonth}
          className="icon-btn w-6 h-6 rounded-md border border-[var(--border)] flex items-center justify-center text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-0 mb-1">
        {PERSIAN_WEEKDAYS_SHORT.map((d, i) => (
          <div
            key={i}
            className="text-center text-[9px] font-medium text-[var(--foreground-subtle)] py-1"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-0">
        {cells.map((dayNum, idx) => {
          if (dayNum === null) {
            return <div key={`empty-${idx}`} className="h-7" />;
          }

          const inRange = isInRange(dayNum);
          const isStartDay = isStart(dayNum);
          const isEndDay = isEnd(dayNum);
          const isTodayDay = isToday(dayNum);
          const isEdge = isStartDay || isEndDay;

          return (
            <button
              key={dayNum}
              onClick={() => onDayClick(jalaliToDate(jy, jm, dayNum))}
              className={`
                h-7 w-full flex items-center justify-center text-[11px] font-medium rounded-md
                transition-all duration-150
                ${isEdge
                  ? 'bg-[var(--accent)] text-[var(--bg-deep)] font-bold rounded-lg'
                  : inRange
                    ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                    : isTodayDay
                      ? 'text-[var(--accent)] font-bold ring-1 ring-[var(--accent)]/40'
                      : 'text-[var(--foreground-muted)] hover:bg-[var(--bg-overlay)] hover:text-[var(--foreground)]'
                }
              `}
            >
              {toPersianDigits(dayNum)}
            </button>
          );
        })}
      </div>

      {/* Hint */}
      <p className="text-[9px] text-[var(--foreground-subtle)] text-center mt-2">
        {pickerTarget === 'start' ? 'تاریخ شروع را انتخاب کنید' : 'تاریخ پایان را انتخاب کنید'}
      </p>
    </div>
  );
}
