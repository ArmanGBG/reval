'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Check, Calendar, ChevronDown, Loader2, Clock, Target, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { useAppStore } from '@/lib/store';
import { Task, ActivityType, FieldType } from '@/lib/types';
import { Subject, TopicSelection } from '@/lib/subjects-types';
import { SubjectTopicPicker } from '@/components/shared/SubjectTopicPicker';
import {
  PERSIAN_WEEKDAYS,
  toPersianDigits,
  getWeekDays,
  toISODate,
  isToday,
  formatPersianDate,
  getPersianWeekdayName,
} from '@/lib/persian-date';

// ===== Types =====
interface WeekdayPlan {
  date: Date;
  dateStr: string;
  tasks: Task[];
}

interface WeeklyPlannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ACTIVITY_TYPES: ActivityType[] = ['مطالعه', 'مرور', 'تست آموزشی', 'تست سنجشی'];

// ============================================================
// Main Component — reads REAL tasks from store, immediate sync
// ============================================================
export function WeeklyPlanner({ open, onOpenChange }: WeeklyPlannerProps) {
  const { user, tasks, addTask, updateTask, deleteTask, resetTask } = useAppStore();

  // Field type for adding new subjects
  const [fieldType, setFieldType] = useState<FieldType>('کنکور');

  // Available subjects
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);

  // Which day's "add subject" picker is open
  const [addingToDay, setAddingToDay] = useState<string | null>(null); // dateStr

  // Which subject is being edited
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  // Week offset (0 = current week, 1 = next week)
  const [weekOffset, setWeekOffset] = useState(0);

  // Get the 7 days of the selected week
  const weekDays = useMemo(() => {
    const today = new Date();
    today.setDate(today.getDate() + weekOffset * 7);
    return getWeekDays(today);
  }, [weekOffset]);

  // Build plan: tasks grouped by date
  const weekPlan: WeekdayPlan[] = useMemo(() => {
    return weekDays.map((date) => {
      const dateStr = toISODate(date);
      const dayTasks = tasks
        .filter((t) => t.date === dateStr && t.studentId === (user?.id || 's1'))
        .sort((a, b) => {
          const aPending = a.completed === null ? 0 : 1;
          const bPending = b.completed === null ? 0 : 1;
          if (aPending !== bPending) return aPending - bPending;
          return a.order - b.order;
        });
      return { date, dateStr, tasks: dayTasks };
    });
  }, [weekDays, tasks, user]);

  // ===== Fetch subjects =====
  const fetchSubjects = useCallback(async (ft: FieldType) => {
    setSubjectsLoading(true);
    try {
      const grade = user?.grade || 'دوازدهم';
      const major = user?.major || 'تجربی';
      const res = await fetch(
        `/api/subjects/for-task?fieldType=${encodeURIComponent(ft)}&grade=${encodeURIComponent(grade)}&major=${encodeURIComponent(major)}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSubjects(data.subjects || []);
    } catch {
      setSubjects([]);
    } finally {
      setSubjectsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (open) fetchSubjects(fieldType);
  }, [open, fieldType, fetchSubjects]);

  // ===== Add subject to a day (IMMEDIATE — creates real task) =====
  const addSubjectToDay = (dateStr: string, subject: Subject) => {
    const existingCount = tasks.filter((t) => t.date === dateStr && t.studentId === (user?.id || 's1')).length;
    const newTask: Task = {
      id: crypto.randomUUID(),
      studentId: user?.id || 's1',
      subject: subject.name,
      subjectColor: subject.color,
      topic: 'عمومی',
      fieldType,
      activityTypes: ['مطالعه'],
      targetTimeMinutes: 60,
      actualTimeMinutes: null,
      targetTestCount: 0,
      actualTestCount: null,
      completed: null,
      date: dateStr,
      order: existingCount,
      createdBy: 'student',
    };
    addTask(newTask);
    setAddingToDay(null);
  };

  // ===== Stats =====
  const totalTasks = weekPlan.reduce((acc, day) => acc + day.tasks.length, 0);
  const totalDetailed = weekPlan.reduce(
    (acc, day) => acc + day.tasks.filter((t) => t.topic !== 'عمومی' || t.activityTypes.length > 0).length,
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
            <button
              onClick={() => onOpenChange(false)}
              className="icon-btn w-8 h-8 rounded-lg border border-[var(--border)] flex items-center justify-center text-[var(--foreground-muted)] ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ===== Field type selector ===== */}
        <div className="px-5 py-3 border-b border-[var(--border)] shrink-0">
          <div className="flex gap-1 bg-[var(--bg-overlay)] rounded-xl p-1 w-full max-w-xs">
            {(['کنکور', 'نهایی'] as FieldType[]).map((ft) => (
              <button
                key={ft}
                onClick={() => setFieldType(ft)}
                className={`btn-hover flex-1 h-8 rounded-lg text-xs font-semibold ${
                  fieldType === ft
                    ? 'bg-[var(--accent)] text-[var(--bg-deep)]'
                    : 'text-[var(--foreground-muted)]'
                }`}
              >
                {ft}
              </button>
            ))}
          </div>
        </div>

        {/* ===== Days grid ===== */}
        <div className="flex-1 overflow-y-auto px-5 py-4 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {weekPlan.map((dayPlan) => (
              <DayColumn
                key={dayPlan.dateStr}
                dayPlan={dayPlan}
                onAdd={() => setAddingToDay(dayPlan.dateStr)}
                onRemove={(taskId) => deleteTask(taskId)}
                onEdit={(taskId) => setEditingTaskId(taskId)}
                onToggleComplete={(taskId) => {
                  const task = tasks.find((t) => t.id === taskId);
                  if (task) {
                    if (task.completed === null) {
                      updateTask(taskId, { completed: true });
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
          <EditTaskModal
            task={tasks.find((t) => t.id === editingTaskId)!}
            onClose={() => setEditingTaskId(null)}
            onUpdate={(updates) => updateTask(editingTaskId, updates)}
            onToggleActivity={(act) => {
              const task = tasks.find((t) => t.id === editingTaskId);
              if (!task) return;
              const has = task.activityTypes.includes(act);
              updateTask(editingTaskId, {
                activityTypes: has
                  ? task.activityTypes.filter((a) => a !== act)
                  : [...task.activityTypes, act],
              });
            }}
          />
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
  onAdd,
  onRemove,
  onEdit,
  onToggleComplete,
}: {
  dayPlan: WeekdayPlan;
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
  onClick,
  onRemove,
  onToggleComplete,
}: {
  task: Task;
  onClick: () => void;
  onRemove: () => void;
  onToggleComplete: () => void;
}) {
  const hasDetails = task.topic !== 'عمومی' || task.activityTypes.length > 1 || task.targetTimeMinutes !== 60;
  const isDone = task.completed === true;

  return (
    <div className="group flex items-center gap-1.5">
      {/* Complete toggle */}
      <button
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
        <Check className="w-3 h-3" />
      </button>

      {/* Subject chip — click to edit */}
      <button
        onClick={onClick}
        className={`btn-hover flex-1 flex items-center gap-2 px-2.5 py-2 rounded-lg border text-right ${
          hasDetails
            ? 'bg-[var(--accent-soft)] border-[var(--accent)]/20'
            : 'bg-[var(--bg-elevated)] border-[var(--border)]'
        } ${isDone ? 'opacity-50 line-through' : ''}`}
      >
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: task.subjectColor }}
        />
        <span className="text-xs font-medium text-[var(--foreground)] truncate flex-1">
          {task.subject}
        </span>
        {hasDetails && !isDone && (
          <Check className="w-3 h-3 text-[var(--accent)] shrink-0" />
        )}
      </button>

      {/* Remove */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="icon-btn w-6 h-6 rounded flex items-center justify-center text-[var(--foreground-subtle)] hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X className="w-3 h-3" />
      </button>
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
  subjects: Subject[];
  loading: boolean;
  onClose: () => void;
  onSelect: (subject: Subject) => void;
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
  // Find the subject to use SubjectTopicPicker
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const subject = useMemo(() => subjects.find((s) => s.name === task.subject) || null, [subjects, task.subject]);

  useEffect(() => {
    // Fetch subjects to get the full Subject object for the picker
    async function fetchSubjects() {
      try {
        const res = await fetch('/api/subjects?include=tree');
        const data = await res.json();
        if (res.ok) setSubjects(data.subjects || []);
      } catch {
        // ignore
      }
    }
    fetchSubjects();
  }, []);

  const topicSelection: TopicSelection | null = task.topic && task.topic !== 'عمومی'
    ? { displayText: task.topic, mode: 'chapter' }
    : null;

  const dayLabel = getPersianWeekdayName(new Date(task.date));

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
          {/* Topic picker */}
          {subject && (
            <div>
              <label className="text-[11px] font-medium text-[var(--foreground-muted)] mb-1.5 block">
                مبحث
              </label>
              <SubjectTopicPicker
                subject={subject}
                defaultGrade="دوازدهم"
                value={topicSelection}
                onChange={(sel) => onUpdate({ topic: sel?.displayText || 'عمومی' })}
              />
            </div>
          )}

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
                    task.activityTypes.includes(act)
                      ? 'bg-[var(--accent)] text-[var(--bg-deep)] border-[var(--accent)]'
                      : 'bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--foreground-muted)]'
                  }`}
                >
                  {act}
                </button>
              ))}
            </div>
          </div>

          {/* Duration & test count */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium text-[var(--foreground-muted)] mb-1.5 block flex items-center gap-1">
                <Clock className="w-3 h-3" />
                زمان (دقیقه)
              </label>
              <input
                type="number"
                value={task.targetTimeMinutes}
                onChange={(e) => onUpdate({ targetTimeMinutes: Number(e.target.value) })}
                className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-3 h-10 text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]/40"
                dir="ltr"
              />
              <div className="flex gap-1 mt-1.5">
                {[30, 60, 90, 120].map((m) => (
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
                value={task.targetTestCount}
                onChange={(e) => onUpdate({ targetTestCount: Number(e.target.value) })}
                className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-3 h-10 text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]/40"
                dir="ltr"
              />
              <div className="flex gap-1 mt-1.5">
                {[0, 10, 20, 30].map((t) => (
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
