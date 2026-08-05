'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Settings, Trash2, Clock, Target, RotateCcw, Calendar, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { useAppStore } from '@/lib/store';
import { Task, ActivityType, FieldType } from '@/lib/types';
import { Subject } from '@/lib/subjects-types';
import { SubjectTopicPicker, TopicSelection } from '@/components/shared/SubjectTopicPicker';
import { getRandomSuccessMessage, getRandomFailureMessage, getGreeting, getPersianDate } from '@/lib/constants/feedbackMessages';
import {
  toPersianDigits,
  minutesToHours,
  getRelativeDayLabel,
  getPersianWeekdayName,
  formatPersianDate,
  toISODate,
  getWeekDays,
  getTodayJalali,
  getDaysInJalaliMonth,
  getFirstDayOfJalaliMonth,
  PERSIAN_MONTHS,
} from '@/lib/persian-date';
import { useCurrentStudentId, parseLocalDate } from '@/lib/student-utils';
import { SortableTaskList } from '@/components/plan/SortableTaskList';
import { PartialCompletionSheet } from './PartialCompletionSheet';

// ===== Date Range Types & Constants =====
type DateRangeMode = 'today' | 'week' | 'month' | 'custom';

const DATE_RANGE_OPTIONS: { mode: DateRangeMode; label: string }[] = [
  { mode: 'today', label: 'امروز' },
  { mode: 'week', label: 'این هفته' },
  { mode: 'month', label: 'این ماه' },
  { mode: 'custom', label: 'بازه دلخواه' },
];

// ===== FilterPill (same style as AnalyticsView) =====
function FilterPill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`btn-hover shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all min-h-[44px] border ${
        active
          ? 'bg-[var(--accent)] text-[var(--bg-deep)] border-[var(--accent)] shadow-[0_4px_12px_-2px_var(--accent-glow)]'
          : 'surface-1 text-[var(--foreground-muted)] border-[var(--border)] hover:border-[var(--border-strong)] hover:text-[var(--foreground)]'
      }`}
    >
      {children}
    </button>
  );
}

// ===== Helper: Generate all ISO dates in a range (inclusive) =====
function generateDateRange(start: Date, end: Date): string[] {
  const dates: string[] = [];
  const current = new Date(start);
  while (current <= end) {
    dates.push(toISODate(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

// ===== Date Group Header =====
function DateGroupHeader({ dateStr, taskCount, completedCount }: { dateStr: string; taskCount: number; completedCount: number }) {
  const date = parseLocalDate(dateStr);
  const weekday = getPersianWeekdayName(date);
  const persianDate = formatPersianDate(date);
  const isToday = toISODate(new Date()) === dateStr;

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex items-center justify-between py-3 px-1"
    >
      <div className="flex items-center gap-2">
        {isToday && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[var(--accent-soft)] text-[var(--accent)] font-bold border border-[rgba(62,180,137,0.2)]">
            امروز
          </span>
        )}
        <span className="text-sm font-bold text-[var(--foreground)]">{weekday}</span>
        <span className="text-xs text-[var(--foreground-muted)]">·</span>
        <span className="text-xs text-[var(--foreground-muted)]">{persianDate}</span>
      </div>
      <div className="flex items-center gap-2 text-xs text-[var(--foreground-muted)]">
        <span>{toPersianDigits(taskCount)} تسک</span>
        {taskCount > 0 && (
          <>
            <span className="w-px h-3 bg-[var(--border)]" />
            <span className="flex items-center gap-1">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  completedCount === taskCount
                    ? 'bg-[var(--accent)]'
                    : completedCount > 0
                      ? 'bg-[var(--warning)]'
                      : 'bg-[var(--foreground-subtle)]'
                }`}
              />
              {toPersianDigits(Math.round((completedCount / taskCount) * 100))}٪
            </span>
          </>
        )}
      </div>
    </motion.div>
  );
}

// ===== Main Component =====
export default function Dashboard() {
  const { user, tasks, updateTask, deleteTask, resetTask, reorderTasks } = useAppStore();
  const studentId = useCurrentStudentId();
  const [partialTask, setPartialTask] = useState<Task | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  // Date range state
  const [dateRangeMode, setDateRangeMode] = useState<DateRangeMode>('today');
  const [customStart, setCustomStart] = useState<string>(() => toISODate(new Date()));
  const [customEnd, setCustomEnd] = useState<string>(() => toISODate(new Date()));

  // ===== Calculate date range based on mode =====
  const dateRange = useMemo((): string[] => {
    const now = new Date();
    switch (dateRangeMode) {
      case 'today':
        return [toISODate(now)];
      case 'week':
        return getWeekDays(now).map(toISODate);
      case 'month': {
        const { jy, jm } = getTodayJalali();
        const firstDay = getFirstDayOfJalaliMonth(jy, jm);
        const daysInMonth = getDaysInJalaliMonth(jy, jm);
        const lastDay = new Date(firstDay);
        lastDay.setDate(firstDay.getDate() + daysInMonth - 1);
        return generateDateRange(firstDay, lastDay);
      }
      case 'custom': {
        if (!customStart || !customEnd) return [toISODate(now)];
        const start = parseLocalDate(customStart);
        const end = parseLocalDate(customEnd);
        if (start > end) return [];
        return generateDateRange(start, end);
      }
      default:
        return [toISODate(now)];
    }
  }, [dateRangeMode, customStart, customEnd]);

  // Fast lookup set
  const dateSet = useMemo(() => new Set(dateRange), [dateRange]);

  // ===== All tasks within the date range for the current student =====
  const rangeTasks = useMemo(
    () =>
      tasks
        .filter((t) => dateSet.has(t.date) && t.studentId === studentId)
        .sort((a, b) => {
          // Sort by date descending (newest first)
          if (a.date !== b.date) return b.date.localeCompare(a.date);
          // Within same date: pending first
          const aPending = a.completed === null ? 0 : 1;
          const bPending = b.completed === null ? 0 : 1;
          if (aPending !== bPending) return aPending - bPending;
          return a.order - b.order;
        }),
    [tasks, dateSet, studentId]
  );

  // ===== Group tasks by date =====
  const groupedTasks = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const task of rangeTasks) {
      if (!map.has(task.date)) {
        map.set(task.date, []);
      }
      map.get(task.date)!.push(task);
    }
    // Map preserves insertion order; rangeTasks already sorted by date desc
    return Array.from(map.entries()).map(([date, dateTasks]) => ({ date, tasks: dateTasks }));
  }, [rangeTasks]);

  // ===== Aggregated stats for the range =====
  const totalHours = useMemo(
    () => minutesToHours(rangeTasks.reduce((sum, t) => sum + t.targetTimeMinutes, 0)),
    [rangeTasks]
  );
  const totalTests = useMemo(
    () => rangeTasks.reduce((sum, t) => sum + t.targetTestCount, 0),
    [rangeTasks]
  );
  const completionRate = useMemo(() => {
    const total = rangeTasks.length;
    if (total === 0) return 0;
    const completed = rangeTasks.filter((t) => t.completed === true).length;
    return Math.round((completed / total) * 100);
  }, [rangeTasks]);
  const totalTaskCount = rangeTasks.length;
  const isMultiDay = dateRange.length > 1;

  // ===== Labels =====
  const userName = user?.name ?? 'رفیق';
  const greeting = getGreeting(userName);

  const rangeLabel = useMemo(() => {
    const now = new Date();
    switch (dateRangeMode) {
      case 'today':
        return `${getPersianWeekdayName(now)} · ${formatPersianDate(now)}`;
      case 'week': {
        const weekDays = getWeekDays(now);
        return `${formatPersianDate(weekDays[0])} تا ${formatPersianDate(weekDays[6])}`;
      }
      case 'month': {
        const { jy, jm } = getTodayJalali();
        return `${PERSIAN_MONTHS[jm - 1]} ${toPersianDigits(jy)}`;
      }
      case 'custom': {
        if (!customStart || !customEnd) return 'بازه دلخواه';
        try {
          return `${formatPersianDate(parseLocalDate(customStart))} تا ${formatPersianDate(parseLocalDate(customEnd))}`;
        } catch {
          return 'بازه دلخواه';
        }
      }
      default:
        return '';
    }
  }, [dateRangeMode, customStart, customEnd]);

  // ===== Handlers =====
  const handleComplete = useCallback((taskId: string) => {
    updateTask(taskId, { completed: true });
    toast.success(getRandomSuccessMessage());
  }, [updateTask]);

  const handleSkip = useCallback((taskId: string) => {
    updateTask(taskId, { completed: false });
    toast(getRandomFailureMessage());
  }, [updateTask]);

  const handleReset = useCallback((taskId: string) => {
    resetTask(taskId);
    toast('وضعیت برگشت');
  }, [resetTask]);

  const handleDelete = useCallback((taskId: string) => {
    deleteTask(taskId);
    toast('تسک حذف شد');
  }, [deleteTask]);

  const handlePartialOpen = useCallback((id: string) => {
    const task = rangeTasks.find((t) => t.id === id);
    if (task) {
      setPartialTask(task);
      setSheetOpen(true);
    }
  }, []);

  const handlePartialSave = useCallback((id: string, actualTime: number, actualTests: number) => {
    updateTask(id, { actualTimeMinutes: actualTime, actualTestCount: actualTests, completed: true });
    setSheetOpen(false);
    toast.success(getRandomSuccessMessage());
  }, [updateTask]);

  const handleEdit = useCallback((taskId: string) => {
    setEditingTaskId(taskId);
  }, []);

  const editingTask = editingTaskId ? tasks.find((t) => t.id === editingTaskId) ?? null : null;

  // ===== Render =====
  return (
    <div dir="rtl" className="max-w-2xl mx-auto px-4 md:px-0 py-6">
      {/* ===== Header ===== */}
      <div className="mb-4">
        <h1 className="text-xl md:text-2xl font-bold text-[var(--foreground)]">{greeting}</h1>
        <p className="text-xs text-[var(--foreground-muted)] mt-1">{rangeLabel}</p>
      </div>

      {/* ===== Date Range Pills ===== */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar mb-4">
        {DATE_RANGE_OPTIONS.map((opt) => (
          <FilterPill
            key={opt.mode}
            active={dateRangeMode === opt.mode}
            onClick={() => { setDateRangeMode(opt.mode); }}
          >
            {opt.label}
          </FilterPill>
        ))}
      </div>

      {/* ===== Custom Date Pickers (shown only for custom mode) ===== */}
      <AnimatePresence>
        {dateRangeMode === 'custom' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden mb-4"
          >
            <div className="surface-1 rounded-[var(--radius-lg)] p-4 space-y-3 border border-[var(--border)]">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-4 h-4 text-[var(--accent)]" />
                <span className="text-sm font-bold text-[var(--foreground)]">انتخاب بازه زمانی</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs text-[var(--foreground-muted)]">از تاریخ</label>
                  <input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="w-full rounded-[var(--radius)] bg-[rgba(255,255,255,0.04)] border border-[var(--border)] text-[var(--foreground)] text-sm px-3 py-2.5 focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent-glow)] transition-colors"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-[var(--foreground-muted)]">تا تاریخ</label>
                  <input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="w-full rounded-[var(--radius)] bg-[rgba(255,255,255,0.04)] border border-[var(--border)] text-[var(--foreground)] text-sm px-3 py-2.5 focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent-glow)] transition-colors"
                    dir="ltr"
                  />
                </div>
              </div>
              {customStart && customEnd && parseLocalDate(customStart) > parseLocalDate(customEnd) && (
                <p className="text-xs text-[var(--danger)]">تاریخ شروع باید قبل از تاریخ پایان باشد</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== Stats Bar ===== */}
      {(totalHours > 0 || totalTests > 0 || totalTaskCount > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="surface-1 rounded-[var(--radius-lg)] p-3 mb-5 border border-[var(--border)]"
        >
          <div className="flex items-center justify-around gap-2 text-xs">
            {totalTaskCount > 0 && (
              <div className="flex flex-col items-center gap-1">
                <span className="text-[var(--foreground)] font-bold tabular-nums text-sm">
                  {toPersianDigits(totalTaskCount)}
                </span>
                <span className="text-[var(--foreground-muted)]">تسک</span>
              </div>
            )}
            {totalHours > 0 && (
              <>
                <span className="w-px h-8 bg-[var(--border)]" />
                <div className="flex flex-col items-center gap-1">
                  <span className="flex items-center gap-1 text-[var(--foreground)] font-bold tabular-nums text-sm">
                    <Clock className="w-3.5 h-3.5 text-[var(--foreground-subtle)]" />
                    {toPersianDigits(totalHours)}
                  </span>
                  <span className="text-[var(--foreground-muted)]">ساعت</span>
                </div>
              </>
            )}
            {totalTests > 0 && (
              <>
                <span className="w-px h-8 bg-[var(--border)]" />
                <div className="flex flex-col items-center gap-1">
                  <span className="flex items-center gap-1 text-[var(--foreground)] font-bold tabular-nums text-sm">
                    <Target className="w-3.5 h-3.5 text-[var(--foreground-subtle)]" />
                    {toPersianDigits(totalTests)}
                  </span>
                  <span className="text-[var(--foreground-muted)]">تست</span>
                </div>
              </>
            )}
            {totalTaskCount > 0 && (
              <>
                <span className="w-px h-8 bg-[var(--border)]" />
                <div className="flex flex-col items-center gap-1">
                  <span className="flex items-center gap-1 text-[var(--foreground)] font-bold tabular-nums text-sm">
                    <TrendingUp className="w-3.5 h-3.5 text-[var(--foreground-subtle)]" />
                    {toPersianDigits(completionRate)}٪
                  </span>
                  <span className="text-[var(--foreground-muted)]">انجام</span>
                </div>
              </>
            )}
          </div>
        </motion.div>
      )}

      {/* ===== Task List (grouped by date or flat) ===== */}
      {rangeTasks.length === 0 ? (
        <div className="surface-1 rounded-2xl p-10 text-center">
          {dateRangeMode === 'today' ? (
            <>
              <p className="text-sm text-[var(--foreground-muted)]">برنامه‌ای برای امروز ثبت نشده</p>
              <p className="text-xs text-[var(--foreground-subtle)] mt-1">از بخش «برنامه» تسک اضافه کنید</p>
            </>
          ) : (
            <>
              <p className="text-sm text-[var(--foreground-muted)]">تسکی در این بازه زمانی ثبت نشده</p>
              <p className="text-xs text-[var(--foreground-subtle)] mt-1">بازه دیگری را انتخاب کنید</p>
            </>
          )}
        </div>
      ) : isMultiDay ? (
        /* ===== Multi-day: grouped by date ===== */
        <div className="space-y-2">
          {groupedTasks.map((group) => {
            const completedInGroup = group.tasks.filter((t) => t.completed === true).length;
            return (
              <div key={group.date}>
                <DateGroupHeader
                  dateStr={group.date}
                  taskCount={group.tasks.length}
                  completedCount={completedInGroup}
                />
                <SortableTaskList
                  tasks={group.tasks}
                  onComplete={handleComplete}
                  onSkip={handleSkip}
                  onDelete={handleDelete}
                  onSettings={handlePartialOpen}
                  onReset={handleReset}
                  onReorder={reorderTasks}
                  onEdit={handleEdit}
                />
              </div>
            );
          })}
        </div>
      ) : (
        /* ===== Single day: same as before ===== */
        <SortableTaskList
          tasks={rangeTasks}
          onComplete={handleComplete}
          onSkip={handleSkip}
          onDelete={handleDelete}
          onSettings={handlePartialOpen}
          onReset={handleReset}
          onReorder={reorderTasks}
          onEdit={handleEdit}
        />
      )}

      {/* ===== Partial completion sheet ===== */}
      <PartialCompletionSheet
        task={partialTask}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onSave={handlePartialSave}
      />

      {/* ===== Edit task modal ===== */}
      {editingTask && (
        <EditTaskModal
          task={editingTask}
          onClose={() => setEditingTaskId(null)}
          onUpdate={(updates) => updateTask(editingTaskId!, updates)}
          onToggleActivity={(act) => {
            const task = tasks.find((t) => t.id === editingTaskId);
            if (!task) return;
            const has = task.activityTypes.includes(act);
            updateTask(editingTaskId!, {
              activityTypes: has
                ? task.activityTypes.filter((a) => a !== act)
                : [...task.activityTypes, act],
            });
          }}
        />
      )}
    </div>
  );
}

// ============================================================
// Edit Task Details Modal (copied from WeeklyPlanner)
// ============================================================
const ACTIVITY_TYPES: ActivityType[] = ['مطالعه', 'مرور', 'تست آموزشی', 'تست سنجشی'];

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
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const subject = useMemo(() => subjects.find((s) => s.name === task.subject) || null, [subjects, task.subject]);

  useEffect(() => {
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
