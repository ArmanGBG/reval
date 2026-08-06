'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Settings, Trash2, Clock, Target, RotateCcw, Calendar, TrendingUp, ChevronLeft, Plus, Focus } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { useAppStore } from '@/lib/store';
import { Task, ActivityType, FieldType } from '@/lib/types';
import {
  TaskSubjectPicker,
  TaskSelection,
} from '@/components/shared/TaskSubjectPicker';
import { getRandomSuccessMessage, getRandomFailureMessage, getGreeting, getPersianDate } from '@/lib/constants/feedbackMessages';
import {
  toPersianDigits,
  minutesToHours,
  minutesToHoursLabel,
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
import { TaskDetailsDialog } from '@/components/plan/TaskDetailsDialog';
import { useCelebration } from '@/hooks/use-celebration';
import UpcomingExamsCard from './UpcomingExamsCard';
import WeeklyReviewCard from './WeeklyReviewCard';
import SubjectMasteryCard from './SubjectMasteryCard';

// ===== Motivational Quotes =====
const MOTIVATIONAL_QUOTES: { text: string; author?: string }[] = [
  { text: 'موفقیت، مجموع تلاش‌های کوچک است که هر روز تکرار می‌شوند.', author: 'رابرت کولیر' },
  { text: 'دانش، قدرتی است که هیچ‌کس نمی‌تواند از تو بگیرد.' },
  { text: 'هر لحظه که صرف یادگیری می‌شود، لحظه‌ای ارزشمند است.' },
  { text: 'تنها راه انجام کار بزرگ، عاشق بودن به آن است.', author: 'استیو جابز' },
  { text: 'اگر فکر می‌کنی می‌توانی یا نمی‌توانی، در هر دو حال حق با توست.', author: 'هنری فورد' },
  { text: 'موفقیت نتیجه‌ی آمادگی، کار سخت و یادگیری از شکست است.', author: 'کالین پاول' },
  { text: 'هر متخصصی روزی مبتدی بوده است.', author: 'هلن هیز' },
  { text: 'سخت‌ترین قدم، همان قدم اول است. بعد از آن، بقیه‌ی راه راحت‌تر می‌شود.' },
  { text: 'قدرت تمرکز مانند عضله است: هرچه بیشتر تمرین کنی، قوی‌تر می‌شود.' },
  { text: 'شکست، پایان راه نیست؛ بلکه فرصتی برای شروع دوباره است.', author: 'رابرت کیوساکی' },
  { text: 'آینده‌ی تو با تصمیم‌های امروزت ساخته می‌شود، نه با رویاهای فردات.' },
  { text: 'دانش‌آموزی که از اشتباهاتش درس می‌گیرد، از دانش‌آموزی که هرگز اشتباه نمی‌کند جلوتر است.' },
];

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
      className={`shrink-0 px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ease-out min-h-[44px] border ${
        active
          ? 'bg-[var(--accent)] text-[var(--bg-deep)] border-[var(--accent)] shadow-[0_4px_16px_-2px_var(--accent-glow)] scale-[1.02]'
          : 'surface-1 text-[var(--foreground-muted)] border-[var(--border)] hover:border-[var(--border-strong)] hover:text-[var(--foreground)] hover:scale-[1.01] active:scale-[0.98]'
      }`}
    >
      {children}
    </button>
  );
}

// ===== Time-of-day greeting icon =====
function getTimeOfDayGreeting(): { emoji: string; text: string } {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return { emoji: '🌅', text: 'صبح بخیر' };
  if (hour >= 12 && hour < 17) return { emoji: '☀️', text: 'ظهر بخیر' };
  if (hour >= 17 && hour < 21) return { emoji: '🌆', text: 'عصر بخیر' };
  return { emoji: '🌙', text: 'شب بخیر' };
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

// ===== Motivational Quote Card =====
function MotivationalQuoteCard() {
  const [quoteIndex, setQuoteIndex] = useState<number>(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - start.getTime();
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
    return dayOfYear % MOTIVATIONAL_QUOTES.length;
  });

  const handleNext = useCallback(() => {
    setQuoteIndex((prev) => (prev + 1) % MOTIVATIONAL_QUOTES.length);
  }, []);

  const quote = MOTIVATIONAL_QUOTES[quoteIndex];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
      className="relative rounded-[var(--radius-lg)] p-4 overflow-hidden border border-[var(--border)] card-hover mb-5"
      style={{
        backgroundColor: 'var(--bg-elevated)',
      }}
    >
      {/* Accent-soft radial gradient overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 70% at 80% 40%, var(--accent-soft), transparent)',
        }}
      />

      {/* Quote mark watermark */}
      <span
        className="absolute top-2 left-3 pointer-events-none select-none"
        style={{
          fontSize: '4.5rem',
          lineHeight: 1,
          color: 'var(--accent)',
          opacity: 0.06,
        }}
        aria-hidden="true"
      >
        ❝
      </span>

      <div className="relative z-10">
        <p
          className="text-sm leading-7 text-[var(--foreground-muted)] italic mb-2"
          style={{ fontFamily: 'inherit' }}
        >
          {quote.text}
        </p>
        <div className="flex items-center justify-between">
          {quote.author ? (
            <span className="text-xs text-[var(--foreground-subtle)] font-medium">
              — {quote.author}
            </span>
          ) : (
            <span />
          )}
          <button
            onClick={handleNext}
            className="flex items-center gap-1 text-[11px] text-[var(--foreground-subtle)] hover:text-[var(--accent)] transition-colors rounded-md px-2 py-1 hover:bg-[var(--accent-soft)]"
          >
            <span>نقل قول بعدی</span>
            <ChevronLeft className="w-3 h-3 flip-rtl" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ===== Mobile Focus Mode Button =====
// Touch-friendly button that toggles Focus Mode on mobile (where the F
// keyboard shortcut isn't available). Renders only on small screens.
function MobileFocusButton() {
  const toggleFocusMode = useAppStore((s) => s.toggleFocusMode);
  return (
    <button
      onClick={toggleFocusMode}
      className="md:hidden shrink-0 inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-xs font-bold border border-[var(--accent)]/30 bg-[var(--accent-soft)] text-[var(--accent)] active:scale-95 transition-all"
      aria-label="حالت تمرکز"
      title="حالت تمرکز (پنهان کردن منو)"
    >
      <Focus className="w-3.5 h-3.5" />
      تمرکز
    </button>
  );
}

export default function Dashboard() {
  const { user, tasks, tasksLoading, tasksError, loadTasksForStudent, updateTask, deleteTask, resetTask, reorderTasks, streakDays, streakFreezes, streakBest, incrementStreak, setCurrentView, exams } = useAppStore();
  const studentId = useCurrentStudentId();
  const { celebrate } = useCelebration();
  const [partialTask, setPartialTask] = useState<Task | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  useEffect(() => {
    if (studentId !== 's1') void loadTasksForStudent(studentId);
  }, [studentId, loadTasksForStudent]);

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
    () => minutesToHours(rangeTasks.reduce((sum, t) => sum + (t.targetTimeMinutes ?? 0), 0)),
    [rangeTasks]
  );
  const totalTests = useMemo(
    () => rangeTasks.reduce((sum, t) => sum + (t.targetTestCount ?? 0), 0),
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

  // ===== Today's progress stats =====
  const todayISO = toISODate(new Date());
  const todayTasks = useMemo(
    () => tasks.filter((t) => t.date === todayISO && t.studentId === studentId),
    [tasks, todayISO, studentId]
  );
  const todayCompletedCount = useMemo(
    () => todayTasks.filter((t) => t.completed === true).length,
    [todayTasks]
  );
  const todayTotalMinutes = useMemo(
    () => todayTasks.reduce((sum, t) => sum + (t.completed === true ? (t.actualTimeMinutes ?? t.targetTimeMinutes ?? 0) : 0), 0),
    [todayTasks]
  );
  const todayProgress = useMemo(() => {
    const total = todayTasks.length;
    if (total === 0) return 0;
    return Math.round((todayCompletedCount / total) * 100);
  }, [todayTasks, todayCompletedCount]);

  // ===== Labels =====
  const userName = user?.name ?? 'رفیق';
  const greeting = getGreeting(userName);
  const timeOfDay = getTimeOfDayGreeting();

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
    incrementStreak();
    toast.success(getRandomSuccessMessage());
    celebrate('big');
  }, [updateTask, incrementStreak, celebrate]);

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
  }, [rangeTasks]);

  const handlePartialSave = useCallback((id: string, actualTime: number, actualTests: number) => {
    updateTask(id, { actualTimeMinutes: actualTime, actualTestCount: actualTests, completed: true });
    incrementStreak();
    setSheetOpen(false);
    toast.success(getRandomSuccessMessage());
    celebrate('small');
  }, [updateTask, incrementStreak, celebrate]);

  const handleEdit = useCallback((taskId: string) => {
    setEditingTaskId(taskId);
  }, []);

  const editingTask = editingTaskId ? tasks.find((t) => t.id === editingTaskId) ?? null : null;

  // ===== Render =====
  return (
    <div dir="rtl" className="max-w-2xl mx-auto px-4 md:px-0 py-6">
      {/* ===== Header ===== */}
      <div className="mb-4 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl md:text-2xl font-bold text-[var(--foreground)] flex items-center gap-2">
            <span className="text-2xl">{timeOfDay.emoji}</span>
            <span>{greeting}</span>
          </h1>
          <p className="text-xs text-[var(--foreground-muted)] mt-1">{rangeLabel}</p>
        </div>
        {/* Mobile Focus Mode button — touch-friendly, only on mobile */}
        <MobileFocusButton />
      </div>

      {/* ===== Weekly Review Card (dismissible, once per week) ===== */}
      <WeeklyReviewCard tasks={tasks} streakDays={streakDays} />

      {/* ===== Daily Progress Summary + Streak Cards ===== */}
      {todayTasks.length > 0 && (
        <div className="flex gap-3 mb-5">
          {/* Daily Progress Summary Card */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="relative rounded-[var(--radius-lg)] p-4 overflow-hidden border border-[var(--border)] flex-1 min-w-0"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              boxShadow: '0 0 40px -12px var(--accent-glow), inset 0 1px 0 rgba(255,255,255,0.04)',
            }}
          >
            {/* Accent glow background accent */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse 50% 80% at 20% 50%, var(--accent-soft), transparent)',
              }}
            />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[var(--accent)]" />
                  <span className="text-sm font-bold text-[var(--foreground)]">خلاصه امروز</span>
                </div>
                <span className="text-xs font-medium text-[var(--accent)] bg-[var(--accent-soft)] px-2 py-0.5 rounded-md border border-[rgba(62,180,137,0.2)]">
                  {toPersianDigits(todayProgress)}٪
                </span>
              </div>
              <div className="flex items-center gap-4 mb-3">
                <div className="flex items-center gap-1.5 text-sm">
                  <Clock className="w-4 h-4 text-[var(--foreground-muted)]" />
                  <span className="text-[var(--foreground)] font-bold tabular-nums">
                    {todayTotalMinutes > 0 ? minutesToHoursLabel(todayTotalMinutes) : toPersianDigits(0) + ' دقیقه'}
                  </span>
                  <span className="text-[var(--foreground-muted)] text-xs">مطالعه</span>
                </div>
                <span className="w-px h-4 bg-[var(--border)]" />
                <div className="flex items-center gap-1.5 text-sm">
                  <Target className="w-4 h-4 text-[var(--foreground-muted)]" />
                  <span className="text-[var(--foreground)] font-bold tabular-nums">
                    {toPersianDigits(todayCompletedCount)}
                  </span>
                  <span className="text-[var(--foreground-muted)] text-xs">از</span>
                  <span className="text-[var(--foreground)] font-bold tabular-nums">
                    {toPersianDigits(todayTasks.length)}
                  </span>
                  <span className="text-[var(--foreground-muted)] text-xs">تسک</span>
                </div>
              </div>
              {/* Progress bar */}
              <div className="h-1.5 rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: 'var(--accent)' }}
                  initial={{ width: 0 }}
                  animate={{ width: `${todayProgress}%` }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                />
              </div>
            </div>
          </motion.div>

          {/* ===== Streak Card ===== */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
            className="relative rounded-[var(--radius-lg)] p-4 overflow-hidden border border-[var(--border)] flex-shrink-0 group"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              boxShadow: streakDays > 0
                ? '0 0 32px -8px var(--gold-glow), inset 0 1px 0 rgba(255,255,255,0.04)'
                : '0 0 40px -12px var(--accent-glow), inset 0 1px 0 rgba(255,255,255,0.04)',
            }}
          >
            {streakDays > 0 && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'radial-gradient(ellipse 60% 80% at 30% 50%, var(--gold-soft), transparent)',
                }}
              />
            )}
            <div className="relative z-10 flex flex-col items-center justify-center h-full min-w-[5.5rem] gap-1.5">
              <motion.span
                className="text-2xl leading-none"
                animate={
                  streakDays > 0
                    ? { scale: [1, 1.12, 1], filter: ['drop-shadow(0 0 0px var(--gold-glow))', 'drop-shadow(0 0 6px var(--gold-glow))', 'drop-shadow(0 0 0px var(--gold-glow))'] }
                    : {}
                }
                transition={
                  streakDays > 0
                    ? { duration: 1.8, repeat: Infinity, ease: 'easeInOut' }
                    : {}
                }
              >
                {streakDays >= 7 ? '🔥🔥' : streakDays > 0 ? '🔥' : '💤'}
              </motion.span>
              <motion.span
                key={streakDays}
                initial={streakDays > 0 ? { scale: 1.4, opacity: 0.5 } : false}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                className="text-lg font-bold tabular-nums"
                style={{ color: streakDays > 0 ? 'var(--gold)' : 'var(--foreground-muted)' }}
              >
                {toPersianDigits(streakDays)}
              </motion.span>
              <span className="text-[10px] font-medium text-center leading-tight" style={{ color: streakDays > 0 ? 'var(--gold)' : 'var(--foreground-muted)' }}>
                {streakDays >= 7
                  ? 'هفته‌ای کامل!'
                  : streakDays > 0
                    ? 'روز متوالی'
                    : 'شروع کن!'}
              </span>
              {/* Streak Freeze indicator */}
              {streakFreezes > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded-full bg-[rgba(99,179,237,0.1)] border border-[rgba(99,179,237,0.25)]"
                  title={`شما ${toPersianDigits(streakFreezes)} یخ‌کننده دارید — اگر یک روز مطالعه نکنید، استریک حفظ می‌شود`}
                >
                  <span className="text-[11px] leading-none">❄️</span>
                  <span className="text-[10px] font-bold tabular-nums text-[#7DD3FC]">{toPersianDigits(streakFreezes)}</span>
                </motion.div>
              )}
              {/* Personal best (shown on hover) */}
              {streakBest > 0 && streakDays < streakBest && (
                <div className="absolute -bottom-1 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <p className="text-[9px] text-[var(--foreground-subtle)] text-center tabular-nums">
                    رکورد: {toPersianDigits(streakBest)}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* ===== Upcoming Exams Card (student-only) ===== */}
      <UpcomingExamsCard exams={exams} />

      {/* ===== Subject Mastery Card (per-subject progress bars) ===== */}
      <SubjectMasteryCard tasks={tasks} />

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
          className="rounded-[var(--radius-lg)] p-3 mb-5 border border-[var(--border)] relative overflow-hidden"
          style={{
            backgroundColor: 'var(--bg-elevated)',
            boxShadow: '0 0 32px -16px var(--accent-glow), inset 0 1px 0 rgba(255,255,255,0.03)',
          }}
        >
          {/* Subtle accent gradient backdrop */}
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse 50% 90% at 50% 100%, var(--accent-soft), transparent)',
            }}
          />
          <div className="relative z-10 flex items-center justify-around gap-2 text-xs">
            {totalTaskCount > 0 && (
              <div className="flex flex-col items-center gap-1 px-2 py-1 rounded-md transition-colors hover:bg-[rgba(255,255,255,0.03)]">
                <span className="text-[var(--foreground)] font-bold tabular-nums text-sm">
                  {toPersianDigits(totalTaskCount)}
                </span>
                <span className="text-[var(--foreground-muted)]">تسک</span>
              </div>
            )}
            {totalHours > 0 && (
              <>
                <span className="w-px h-8 bg-[var(--border)]" />
                <div className="flex flex-col items-center gap-1 px-2 py-1 rounded-md transition-colors hover:bg-[rgba(255,255,255,0.03)]">
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
                <div className="flex flex-col items-center gap-1 px-2 py-1 rounded-md transition-colors hover:bg-[rgba(255,255,255,0.03)]">
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
                <div className="flex flex-col items-center gap-1 px-2 py-1 rounded-md transition-colors hover:bg-[rgba(255,255,255,0.03)]">
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

      {/* ===== Motivational Quote Card ===== */}
      <MotivationalQuoteCard />

      {/* ===== Task List (grouped by date or flat) ===== */}
      {tasksLoading ? (
        <div className="surface-1 rounded-2xl p-10 text-center text-sm text-[var(--foreground-muted)]">
          در حال بارگذاری تسک‌ها...
        </div>
      ) : tasksError ? (
        <div className="surface-1 rounded-2xl p-6 text-center">
          <p className="text-sm text-[var(--danger)] mb-3">{tasksError}</p>
          <button
            onClick={() => void loadTasksForStudent(studentId)}
            className="h-9 px-4 rounded-lg border border-[var(--border)] text-xs text-[var(--foreground)]"
          >
            تلاش مجدد
          </button>
        </div>
      ) : rangeTasks.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="surface-1 card-hover rounded-2xl p-8 sm:p-10 text-center border border-[var(--border)] overflow-hidden relative"
        >
          {/* Soft accent glow backdrop */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse 60% 70% at 50% 30%, var(--accent-soft), transparent)',
            }}
          />
          <div className="relative z-10 flex flex-col items-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
              className="w-20 h-20 mx-auto rounded-full bg-[var(--accent-soft)] flex items-center justify-center text-4xl mb-4 ring-1 ring-[rgba(62,180,137,0.2)]"
            >
              🎯
            </motion.div>
            <motion.h3
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.12 }}
              className="text-base font-bold text-[var(--foreground)] mb-2"
            >
              هنوز تسکی برای این بازه ثبت نشده
            </motion.h3>
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.18 }}
              className="text-xs text-[var(--foreground-muted)] mb-5 max-w-xs mx-auto leading-6"
            >
              با کلیک روی «برنامه من» می‌تونی اولین تسک امروزت رو اضافه کنی
            </motion.p>
            <motion.button
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.24 }}
              onClick={() => setCurrentView('plan')}
              className="btn-hover inline-flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-bold text-[var(--bg-deep)]"
              style={{
                background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 100%)',
                boxShadow: '0 8px 24px -6px var(--accent-glow)',
              }}
            >
              <Plus className="w-4 h-4" />
              اضافه کردن تسک
            </motion.button>
          </div>
        </motion.div>
      ) : isMultiDay ? (
        /* ===== Multi-day: grouped by date ===== */
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.06 } },
          }}
          className="space-y-2"
        >
          {groupedTasks.map((group) => {
            const completedInGroup = group.tasks.filter((t) => t.completed === true).length;
            return (
              <motion.div
                key={group.date}
                variants={{
                  hidden: { opacity: 0, y: 12 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
                }}
              >
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
              </motion.div>
            );
          })}
        </motion.div>
      ) : (
        /* ===== Single day: stagger wrapper ===== */
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.05 } },
          }}
        >
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
        </motion.div>
      )}

      {/* ===== Partial completion sheet ===== */}
      <PartialCompletionSheet
        task={partialTask}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onSave={handlePartialSave}
      />

      {/* ===== Edit task modal ===== */}
      <TaskDetailsDialog task={editingTask} open={!!editingTask} onOpenChange={v => !v && setEditingTaskId(null)} grade={user?.grade ?? 'دوازدهم'} major={user?.major ?? 'تجربی'} onSave={updates => updateTask(editingTaskId!, updates)} />
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
  const { user } = useAppStore();
  const dayLabel = getPersianWeekdayName(new Date(task.date));

  // Initial selection derived from the existing task — the picker will
  // resolve the subject by name (and pre-fill displayText/chapterId/etc).
  const [selection, setSelection] = useState<TaskSelection>(
    task.topic && task.topic !== 'عمومی'
      ? {
          subjectName: task.subject,
          subjectColor: task.subjectColor,
          displayText: task.topic,
          chapterId: task.chapterId ?? undefined,
          topicId: task.topicId ?? undefined,
          topicModeId: task.topicModeId ?? undefined,
        }
      : {
          subjectName: task.subject,
          subjectColor: task.subjectColor,
        },
  );

  // When the user changes the selection in the picker, forward the
  // displayText (and linked IDs) back to the parent task.
  const handleChange = useCallback(
    (next: TaskSelection) => {
      setSelection(next);
      onUpdate({
        topic: next.displayText || 'عمومی',
        subject: next.subjectName || task.subject,
        subjectColor: next.subjectColor || task.subjectColor,
        chapterId: next.chapterId ?? null,
        topicId: next.topicId ?? null,
        topicModeId: next.topicModeId ?? null,
      });
    },
    [onUpdate, task.subject, task.subjectColor],
  );

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
                value={task.targetTestCount ?? ''}
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
