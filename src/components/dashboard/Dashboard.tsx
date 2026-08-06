'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Target, ChevronLeft, Plus, Share2, Heart } from 'lucide-react';
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
import { getRandomSuccessMessage, getRandomFailureMessage, getGreeting } from '@/lib/constants/feedbackMessages';
import {
  toPersianDigits,
  minutesToHoursLabel,
  getPersianWeekdayName,
  formatPersianDate,
  toISODate,
} from '@/lib/persian-date';
import { useCurrentStudentId } from '@/lib/student-utils';
import { SortableTaskList } from '@/components/plan/SortableTaskList';
import { PartialCompletionSheet } from './PartialCompletionSheet';
import { TaskDetailsDialog } from '@/components/plan/TaskDetailsDialog';
import { useCelebration } from '@/hooks/use-celebration';
import NotificationCenter from '@/components/shared/NotificationCenter';

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

// ===== Time-of-day greeting icon =====
function getTimeOfDayGreeting(): { emoji: string; text: string } {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return { emoji: '🌅', text: 'صبح بخیر' };
  if (hour >= 12 && hour < 17) return { emoji: '☀️', text: 'ظهر بخیر' };
  if (hour >= 17 && hour < 21) return { emoji: '🌆', text: 'عصر بخیر' };
  return { emoji: '🌙', text: 'شب بخیر' };
}

// ===== Motivational Quote Card =====
const BOOKMARKS_KEY = 'reval:bookmarked-quotes:v1';

function getBookmarkedQuotes(): Set<number> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(BOOKMARKS_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as number[]);
  } catch {
    return new Set();
  }
}

function saveBookmarkedQuotes(set: Set<number>) {
  try {
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify([...set]));
  } catch {
    // ignore storage errors
  }
}

function MotivationalQuoteCard() {
  const [quoteIndex, setQuoteIndex] = useState<number>(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - start.getTime();
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
    return dayOfYear % MOTIVATIONAL_QUOTES.length;
  });
  const [bookmarked, setBookmarked] = useState<Set<number>>(() => getBookmarkedQuotes());

  const handleNext = useCallback(() => {
    setQuoteIndex((prev) => (prev + 1) % MOTIVATIONAL_QUOTES.length);
  }, []);

  const quote = MOTIVATIONAL_QUOTES[quoteIndex];
  const isBookmarked = bookmarked.has(quoteIndex);

  const handleBookmark = useCallback(() => {
    setBookmarked((prev) => {
      const next = new Set(prev);
      if (next.has(quoteIndex)) {
        next.delete(quoteIndex);
      } else {
        next.add(quoteIndex);
      }
      saveBookmarkedQuotes(next);
      return next;
    });
  }, [quoteIndex]);

  const handleShare = useCallback(() => {
    const text = quote.author
      ? `${quote.text} — ${quote.author}`
      : quote.text;
    navigator.clipboard.writeText(text).then(() => {
      toast('نقل قول کپی شد!');
    }).catch(() => {
      toast('خطا در کپی کردن');
    });
  }, [quote]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
      className="relative rounded-[var(--radius-lg)] p-5 md:p-6 overflow-hidden surface-1 card-hover edge-highlight mb-5"
    >
      {/* Subtle background radial gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 70% 80% at 75% 30%, var(--accent-soft), transparent)',
        }}
      />

      {/* Decorative opening quote mark ❝ */}
      <span
        className="absolute top-1 left-2 pointer-events-none select-none text-6xl leading-none"
        style={{ color: 'var(--accent-soft)' }}
        aria-hidden="true"
      >
        ❝
      </span>

      {/* Decorative closing quote mark ❞ */}
      <span
        className="absolute bottom-1 right-2 pointer-events-none select-none text-6xl leading-none"
        style={{ color: 'var(--accent-soft)' }}
        aria-hidden="true"
      >
        ❞
      </span>

      <div className="relative z-10">
        {/* Quote text with AnimatePresence for smooth transitions */}
        <AnimatePresence mode="wait">
          <motion.p
            key={quoteIndex}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="text-lg font-medium leading-8 text-[var(--foreground)] mb-3"
          >
            {quote.text}
          </motion.p>
        </AnimatePresence>

        {/* Author + Action buttons */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {quote.author ? (
              <span className="text-sm text-[var(--foreground-muted)] font-medium truncate">
                — {quote.author}
              </span>
            ) : (
              <span />
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Bookmark button */}
            <button
              onClick={handleBookmark}
              className="btn-hover flex items-center justify-center w-8 h-8 rounded-lg text-[var(--foreground-subtle)] hover:text-[var(--accent)] hover:bg-[var(--accent-soft)] transition-colors"
              aria-label={isBookmarked ? 'حذف از ذخیره‌شده‌ها' : 'ذخیره نقل قول'}
            >
              <Heart
                className="w-4 h-4"
                fill={isBookmarked ? 'currentColor' : 'none'}
              />
            </button>
            {/* Share button */}
            <button
              onClick={handleShare}
              className="btn-hover flex items-center justify-center w-8 h-8 rounded-lg text-[var(--foreground-subtle)] hover:text-[var(--accent)] hover:bg-[var(--accent-soft)] transition-colors"
              aria-label="اشتراک‌گذاری نقل قول"
            >
              <Share2 className="w-4 h-4" />
            </button>
            {/* Next quote button */}
            <button
              onClick={handleNext}
              className="btn-hover flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg text-[var(--accent)] bg-[var(--accent-soft)] border border-[rgba(62,180,137,0.2)] hover:bg-[rgba(62,180,137,0.2)] transition-colors min-h-[32px]"
            >
              <span>نقل قول بعدی</span>
              <ChevronLeft className="w-3.5 h-3.5 flip-rtl" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}



export default function Dashboard() {
  const { user, tasks, tasksLoading, tasksError, loadTasksForStudent, updateTask, deleteTask, resetTask, reorderTasks, streakDays, streakFreezes, incrementStreak, setCurrentView } = useAppStore();
  const studentId = useCurrentStudentId();
  const { celebrate } = useCelebration();
  const [partialTask, setPartialTask] = useState<Task | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  // Subject filter for today's task list (click a subject chip to focus on it)
  const [subjectFilter, setSubjectFilter] = useState<string | null>(null);

  useEffect(() => {
    if (studentId !== 's1') void loadTasksForStudent(studentId);
  }, [studentId, loadTasksForStudent]);

  // ===== Today's tasks (clean home — today only, no date-range clutter) =====
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
    const task = tasks.find((t) => t.id === id);
    if (task) {
      setPartialTask(task);
      setSheetOpen(true);
    }
  }, [tasks]);

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

  // ===== Today's tasks only (clean home — no date-range clutter) =====
  const todayTaskList = useMemo(
    () =>
      todayTasks
        .filter((t) => subjectFilter === null || t.subject === subjectFilter)
        .slice()
        .sort((a, b) => {
          // Pending first, then by order
          const aPending = a.completed === null ? 0 : 1;
          const bPending = b.completed === null ? 0 : 1;
          if (aPending !== bPending) return aPending - bPending;
          return a.order - b.order;
        }),
    [todayTasks, subjectFilter],
  );

  // ===== Subject chips for legend/filter (only subjects that have tasks today) =====
  const subjectChips = useMemo(() => {
    const map = new Map<string, { name: string; color: string; count: number; completed: number }>();
    for (const t of todayTasks) {
      const entry = map.get(t.subject) ?? { name: t.subject, color: t.subjectColor || 'var(--accent)', count: 0, completed: 0 };
      entry.count += 1;
      if (t.completed === true) entry.completed += 1;
      map.set(t.subject, entry);
    }
    return [...map.entries()].map(([name, v]) => ({ name, color: v.color, count: v.count, completed: v.completed }));
  }, [todayTasks]);

  // ===== Render =====
  return (
    <div dir="rtl" className="max-w-2xl mx-auto px-4 md:px-0 py-6">
      {/* ===== Header ===== */}
      <div className="mb-5 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl md:text-2xl font-bold text-[var(--foreground)] flex items-center gap-2">
            <span className="text-2xl">{timeOfDay.emoji}</span>
            <span>{greeting}</span>
          </h1>
          <p className="text-xs text-[var(--foreground-muted)] mt-1">
            {getPersianWeekdayName(new Date())} · {formatPersianDate(new Date())}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Mobile Notification bell — touch-friendly, only on mobile */}
          <div className="md:hidden">
            <NotificationCenter />
          </div>
        </div>
      </div>

      {/* ===== Motivational Quote Card (kept per user request) ===== */}
      <MotivationalQuoteCard />

      {/* ===== Compact Today Summary + Streak strip (single slim row) ===== */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="flex items-center gap-3 mb-5 rounded-[var(--radius-lg)] border border-[var(--border)] overflow-hidden"
        style={{ backgroundColor: 'var(--bg-elevated)' }}
      >
        {/* Today's completion (left, grows) */}
        <div className="flex-1 min-w-0 px-4 py-3 flex items-center gap-3">
          {/* Mini circular ring */}
          <div className="shrink-0 relative w-12 h-12">
            <svg viewBox="0 0 48 48" className="w-12 h-12 -rotate-90">
              <circle cx="24" cy="24" r="20" fill="none" stroke="var(--border)" strokeWidth="5" />
              <circle
                cx="24" cy="24" r="20" fill="none" stroke="var(--accent)" strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 20}
                strokeDashoffset={2 * Math.PI * 20 * (1 - todayProgress / 100)}
                style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.16,1,0.3,1)' }}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold tabular-nums text-[var(--foreground)]">
              {toPersianDigits(todayProgress)}٪
            </span>
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold text-[var(--foreground)] truncate">
              {todayTasks.length > 0
                ? `${toPersianDigits(todayCompletedCount)} از ${toPersianDigits(todayTasks.length)} تسک امروز`
                : 'تسک امروز'}
            </div>
            <div className="text-[11px] text-[var(--foreground-muted)] tabular-nums truncate">
              {todayTotalMinutes > 0
                ? `${minutesToHoursLabel(todayTotalMinutes)} مطالعه`
                : 'هنوز شروع نکرده‌ای'}
            </div>
          </div>
        </div>

        {/* Divider */}
        <span className="w-px h-9 bg-[var(--border)]" />

        {/* Streak (right, compact) */}
        <div className="px-4 py-3 flex items-center gap-2 shrink-0" title={streakDays > 0 ? `${toPersianDigits(streakDays)} روز متوالی` : 'شروع کن'}>
          <motion.span
            className="text-xl leading-none"
            animate={streakDays > 0 ? { scale: [1, 1.12, 1] } : {}}
            transition={streakDays > 0 ? { duration: 1.8, repeat: Infinity, ease: 'easeInOut' } : {}}
          >
            {streakDays >= 7 ? '🔥🔥' : streakDays > 0 ? '🔥' : '💤'}
          </motion.span>
          <div className="flex flex-col items-start leading-none">
            <span
              className="text-base font-bold tabular-nums"
              style={{ color: streakDays > 0 ? 'var(--gold)' : 'var(--foreground-muted)' }}
            >
              {toPersianDigits(streakDays)}
            </span>
            <span className="text-[9px] text-[var(--foreground-muted)] mt-0.5">
              {streakDays > 0 ? 'روز زنجیر' : 'شروع'}
            </span>
          </div>
          {/* Streak Freeze indicator */}
          {streakFreezes > 0 && (
            <span
              className="flex items-center gap-0.5 ml-1 px-1.5 py-0.5 rounded-full bg-[rgba(99,179,237,0.1)] border border-[rgba(99,179,237,0.25)]"
              title={`${toPersianDigits(streakFreezes)} یخ‌کننده`}
            >
              <span className="text-[10px] leading-none">❄️</span>
              <span className="text-[9px] font-bold tabular-nums text-[#7DD3FC]">{toPersianDigits(streakFreezes)}</span>
            </span>
          )}
        </div>
      </motion.div>

      {/* ===== Task action row: subject chips (left) + add button (right) ===== */}
      {/* The island strip above already shows "X از Y تسک امروز" — no heading duplication */}
      <div className="flex items-center justify-between gap-2 mb-3 px-1">
        {/* Subject legend / quick filter (only when 2+ subjects) */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 min-w-0">
          {subjectChips.length > 1 && (
            <>
              <button
                onClick={() => setSubjectFilter(null)}
                className={`shrink-0 inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full text-[11px] font-medium border transition-all ${
                  subjectFilter === null
                    ? 'bg-[var(--accent-soft)] border-[var(--accent)]/40 text-[var(--accent)]'
                    : 'bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:border-[var(--border-strong)]'
                }`}
              >
                همه
                <span className="tabular-nums opacity-70">{toPersianDigits(todayTasks.length)}</span>
              </button>
              {subjectChips.map((chip) => {
                const active = subjectFilter === chip.name;
                return (
                  <button
                    key={chip.name}
                    onClick={() => setSubjectFilter(active ? null : chip.name)}
                    className={`shrink-0 inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full text-[11px] font-medium border transition-all ${
                      active
                        ? 'border-[var(--border-strong)] text-[var(--foreground)]'
                        : 'bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:border-[var(--border-strong)]'
                    }`}
                    style={active ? { backgroundColor: `${chip.color}1A`, borderColor: `${chip.color}66` } : undefined}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: chip.color }}
                    />
                    {chip.name}
                    <span className="tabular-nums opacity-70">{toPersianDigits(chip.completed)}/{toPersianDigits(chip.count)}</span>
                  </button>
                );
              })}
            </>
          )}
        </div>
        {/* Add task button */}
        <button
          onClick={() => setCurrentView('plan')}
          className="shrink-0 text-xs font-medium text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" />
          افزودن
        </button>
      </div>

      {/* ===== Today's Task List ===== */}
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
      ) : todayTaskList.length === 0 ? (
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
              امروز رو با یک تسک شروع کن
            </motion.h3>
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.18 }}
              className="text-xs text-[var(--foreground-muted)] mb-5 max-w-xs mx-auto leading-6"
            >
              اولین تسک امروزت رو اضافه کن و زنجیره‌ی مطالعه‌ات رو بساز
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
      ) : (
        /* ===== Today's tasks: stagger wrapper ===== */
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.05 } },
          }}
        >
          <SortableTaskList
            tasks={todayTaskList}
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
