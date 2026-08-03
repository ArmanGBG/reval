'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check, X, Settings, Calendar, Bell, Diamond, Clock, Trophy,
  FileText, Flame, Target, ChevronLeft,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '@/lib/store';
import { Task, Exam } from '@/lib/types';
import {
  getRandomSuccessMessage,
  getRandomFailureMessage,
  getGreeting,
  getPersianDate,
} from '@/lib/constants/feedbackMessages';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Current student ID (matches MOCK_STUDENTS s1)
const CURRENT_STUDENT_ID = 's1';

// ===== Helper: Convert number to Persian digits =====
function toPersianDigits(num: number | string): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return num
    .toString()
    .split('')
    .map((d) => persianDigits[parseInt(d)] ?? d)
    .join('');
}

// ============================================================
// MOBILE HEADER (sticky glassmorphism — mobile only)
// ============================================================
function MobileDashboardHeader({ userName }: { userName: string }) {
  const [greeting] = useState(() => getGreeting(userName));

  return (
    <div className="md:hidden sticky top-0 z-30 -mx-4 px-4 py-3 surface-glass border-b border-[var(--border)] mb-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          <span className="text-[11px] text-[var(--foreground-muted)] font-medium tracking-wide">
            {getPersianDate()}
          </span>
          <h1 className="text-base font-bold text-[var(--foreground)] leading-snug line-clamp-2">
            {greeting}
          </h1>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            className="icon-btn min-w-[40px] min-h-[40px] flex items-center justify-center rounded-[var(--radius)] bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--foreground-muted)]"
            aria-label="تقویم"
          >
            <Calendar className="w-5 h-5" />
          </button>
          <button
            className="icon-btn min-w-[40px] min-h-[40px] flex items-center justify-center rounded-[var(--radius)] bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--foreground-muted)] relative"
            aria-label="اعلان‌ها"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 left-2 w-2 h-2 bg-[var(--accent)] rounded-full ring-2 ring-[var(--bg-elevated)]" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// DESKTOP HEADER (rich, breadcrumb-style — desktop only)
// ============================================================
function DesktopDashboardHeader({ userName }: { userName: string }) {
  const [greeting] = useState(() => getGreeting(userName));

  return (
    <div className="hidden md:flex items-end justify-between mb-8 pb-6 border-b border-[var(--border)]">
      <div className="flex flex-col gap-2 min-w-0">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-[var(--foreground-subtle)] font-semibold">
          <span>داشبورد</span>
          <ChevronLeft className="w-3 h-3 flip-rtl" />
          <span className="text-[var(--accent)]">امروز</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-[var(--foreground)] leading-tight">
          {greeting}
        </h1>
        <span className="text-sm text-[var(--foreground-muted)] font-medium">
          {getPersianDate()}
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          className="icon-btn h-10 px-3 flex items-center gap-2 rounded-[var(--radius)] bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] text-sm font-medium"
          aria-label="تقویم"
        >
          <Calendar className="w-4 h-4" />
          <span>تقویم</span>
        </button>
        <button
          className="icon-btn h-10 px-3 flex items-center gap-2 rounded-[var(--radius)] bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] text-sm font-medium relative"
          aria-label="اعلان‌ها"
        >
          <Bell className="w-4 h-4" />
          <span className="bg-[var(--accent-soft)] text-[var(--accent)] text-[10px] font-bold rounded-full px-1.5 py-0.5">
            ۳
          </span>
        </button>
      </div>
    </div>
  );
}

// ============================================================
// DAILY PROGRESS CARD
// ============================================================
function DailyProgress({ completedCount, totalCount }: { completedCount: number; totalCount: number }) {
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const remaining = Math.max(0, totalCount - completedCount);

  return (
    <div className="surface-1 edge-highlight card-hover rounded-[var(--radius-lg)] p-4 md:p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-[var(--radius-sm)] bg-[var(--accent-soft)] flex items-center justify-center">
            <Target className="w-4 h-4 text-[var(--accent)]" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-[var(--foreground)]">پیشرفت امروز</span>
            <span className="text-[11px] text-[var(--foreground-muted)]">
              {toPersianDigits(completedCount)} از {toPersianDigits(totalCount)} وظیفه
            </span>
          </div>
        </div>
        <motion.span
          key={percentage}
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-2xl md:text-3xl font-bold text-[var(--accent)] tabular-nums"
        >
          {toPersianDigits(percentage)}<span className="text-base">٪</span>
        </motion.span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2.5 bg-[var(--bg-overlay)] rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full relative"
          style={{
            background: `linear-gradient(90deg, var(--accent) 0%, var(--accent-hover) 100%)`,
          }}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>

      {remaining > 0 && (
        <div className="flex items-center gap-1.5 mt-3 text-[11px] text-[var(--foreground-muted)]">
          <Flame className="w-3.5 h-3.5 text-[var(--warning)]" />
          <span>{toPersianDigits(remaining)} وظیفه باقی‌مانده — بزن بریم!</span>
        </div>
      )}
      {remaining === 0 && totalCount > 0 && (
        <div className="flex items-center gap-1.5 mt-3 text-[11px] text-[var(--accent)]">
          <Check className="w-3.5 h-3.5" />
          <span>هدف امروز کامل شد — برکانا! 🔥</span>
        </div>
      )}
    </div>
  );
}

// ============================================================
// TASK CARD (dashboard variant — read-only display)
// ============================================================
function DashboardTaskCard({
  task,
  index,
  onComplete,
  onSkip,
  onPartialOpen,
}: {
  task: Task;
  index: number;
  onComplete: () => void;
  onSkip: () => void;
  onPartialOpen: () => void;
}) {
  const isCompleted = task.completed === true;
  const isSkipped = task.completed === false;
  const isPending = task.completed === null;

  const accentBorder = isCompleted
    ? 'before:bg-[var(--accent)]'
    : isSkipped
      ? 'before:bg-[var(--danger)]'
      : 'before:bg-transparent';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={`surface-1 edge-highlight card-hover relative overflow-hidden rounded-[var(--radius-lg)] p-3.5 md:p-4
        before:absolute before:right-0 before:top-0 before:bottom-0 before:w-[3px]
        ${accentBorder}
        ${isCompleted || isSkipped ? 'opacity-65' : ''}
      `}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: task.subjectColor }}
            />
            <span className="font-bold text-[var(--foreground)] text-sm truncate">{task.subject}</span>
            <span
              className={`text-[9px] px-1.5 py-0.5 rounded font-medium shrink-0 ${
                task.fieldType === 'کنکور'
                  ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                  : 'bg-[rgba(245,181,68,0.12)] text-[var(--warning)]'
              }`}
            >
              {task.fieldType}
            </span>
          </div>
          <p className="text-xs text-[var(--foreground-muted)] mb-2 line-clamp-1">{task.topic}</p>
          <div className="flex items-center gap-3 text-[11px] text-[var(--foreground-muted)]">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {toPersianDigits(task.targetTimeMinutes)} دقیقه
            </span>
            {task.targetTestCount > 0 && (
              <span className="flex items-center gap-1">
                <FileText className="w-3 h-3" />
                {toPersianDigits(task.targetTestCount)} تست
              </span>
            )}
          </div>
        </div>

        {isPending && (
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={onComplete}
              className="icon-btn w-9 h-9 rounded-[var(--radius-sm)] bg-[var(--accent-soft)] text-[var(--accent)] border border-[rgba(62,180,137,0.2)] flex items-center justify-center hover:bg-[rgba(62,180,137,0.2)]"
              aria-label="انجام شد"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={onSkip}
              className="icon-btn w-9 h-9 rounded-[var(--radius-sm)] bg-[rgba(239,68,68,0.1)] text-[#F87171] border border-[rgba(239,68,68,0.2)] flex items-center justify-center hover:bg-[rgba(239,68,68,0.2)]"
              aria-label="نادیده گرفته"
            >
              <X className="w-4 h-4" />
            </button>
            <button
              onClick={onPartialOpen}
              className="icon-btn w-9 h-9 rounded-[var(--radius-sm)] bg-[rgba(255,255,255,0.04)] text-[var(--foreground-muted)] border border-[var(--border)] flex items-center justify-center hover:text-[var(--foreground)]"
              aria-label="تکمیل جزئی"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        )}

        {(isCompleted || isSkipped) && (
          <div className="flex items-center shrink-0">
            {isCompleted && (
              <span className="flex items-center gap-1 text-[var(--accent)] text-[11px] font-medium bg-[var(--accent-soft)] px-2 py-1 rounded-md">
                <Check className="w-3.5 h-3.5" />
                انجام شد
              </span>
            )}
            {isSkipped && (
              <span className="flex items-center gap-1 text-[#F87171] text-[11px] font-medium bg-[rgba(239,68,68,0.12)] px-2 py-1 rounded-md">
                <X className="w-3.5 h-3.5" />
                نادیده
              </span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ============================================================
// UPCOMING EXAMS
// ============================================================
function UpcomingExams({ exams }: { exams: Exam[] }) {
  const upcomingExams = useMemo(
    () => exams
      .filter((e) => e.studentIds.includes(CURRENT_STUDENT_ID) && e.status === 'upcoming')
      .sort((a, b) => a.date.localeCompare(b.date)),
    [exams]
  );

  if (upcomingExams.length === 0) return null;

  return (
    <div>
      <SectionHeader icon={<FileText className="w-4 h-4" />} title="آزمون‌های پیش رو" count={upcomingExams.length} />
      <div className="space-y-2.5">
        {upcomingExams.map((exam, index) => (
          <motion.div
            key={exam.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.07 }}
            className="surface-1 edge-highlight card-hover rounded-[var(--radius-lg)] p-3.5 md:p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-10 h-10 rounded-[var(--radius)] flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${exam.subjectColor}1A` }}
                >
                  <Trophy className="w-5 h-5" style={{ color: exam.subjectColor }} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[var(--foreground)] truncate">{exam.title}</p>
                  <p className="text-xs text-[var(--foreground-muted)] truncate">{exam.subject}</p>
                </div>
              </div>
              <div className="text-left shrink-0">
                <div className="flex items-center gap-1.5 text-xs text-[var(--foreground-muted)]">
                  <Calendar className="w-3.5 h-3.5" />
                  <span className="tabular-nums">{toPersianDigits(parseInt(exam.date.split('-')[2]))}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-[var(--foreground-muted)] mt-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="tabular-nums">{toPersianDigits(exam.startTime)}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-2.5 pt-2.5 border-t border-[var(--border)] text-[11px] text-[var(--foreground-muted)]">
              <span>مدت: <span className="text-[var(--foreground)] font-medium">{toPersianDigits(exam.duration)} دقیقه</span></span>
              <span className="w-px h-3 bg-[var(--border)]" />
              <span>نمره کل: <span className="text-[var(--foreground)] font-medium">{toPersianDigits(exam.totalScore)}</span></span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// COMPLETED EXAMS
// ============================================================
function CompletedExams({ exams }: { exams: Exam[] }) {
  const completedExams = useMemo(
    () => exams
      .filter((e) => e.studentIds.includes(CURRENT_STUDENT_ID) && e.status === 'completed')
      .sort((a, b) => b.date.localeCompare(a.date)),
    [exams]
  );

  if (completedExams.length === 0) return null;

  return (
    <div>
      <SectionHeader icon={<Trophy className="w-4 h-4 text-[var(--warning)]" />} title="نتایج آزمون‌ها" count={completedExams.length} />
      <div className="space-y-2.5">
        {completedExams.map((exam, index) => {
          const myResult = exam.results.find((r) => r.studentId === CURRENT_STUDENT_ID);
          const scorePercent = myResult?.score ? Math.round((myResult.score / exam.totalScore) * 100) : 0;
          const scoreColor = scorePercent >= 80 ? 'var(--accent)' : scorePercent >= 60 ? 'var(--warning)' : '#EF4444';

          return (
            <motion.div
              key={exam.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.07 }}
              className="surface-1 edge-highlight card-hover rounded-[var(--radius-lg)] p-3.5 md:p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-[var(--radius)] flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${exam.subjectColor}1A` }}
                  >
                    <FileText className="w-5 h-5" style={{ color: exam.subjectColor }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[var(--foreground)] truncate">{exam.title}</p>
                    <p className="text-xs text-[var(--foreground-muted)] truncate">{exam.subject}</p>
                  </div>
                </div>
                {myResult?.score !== null && myResult?.score !== undefined && (
                  <div className="text-center shrink-0">
                    <p className="text-xl font-bold tabular-nums" style={{ color: scoreColor }}>
                      {toPersianDigits(myResult.score)}
                    </p>
                    <p className="text-[10px] text-[var(--foreground-muted)]">از {toPersianDigits(exam.totalScore)}</p>
                  </div>
                )}
              </div>
              {myResult?.score !== null && myResult?.score !== undefined && (
                <div className="mt-3">
                  <div className="w-full h-1.5 bg-[var(--bg-overlay)] rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: scoreColor }}
                      initial={{ width: 0 }}
                      animate={{ width: `${scorePercent}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                    />
                  </div>
                  {myResult.rank && (
                    <p className="text-[10px] text-[var(--foreground-muted)] mt-1.5">
                      رتبه {toPersianDigits(myResult.rank)} از {toPersianDigits(exam.studentIds.length)}
                    </p>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// SECTION HEADER
// ============================================================
function SectionHeader({ icon, title, count, action }: { icon: React.ReactNode; title: string; count?: number; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <span className="text-[var(--foreground-muted)]">{icon}</span>
        <h3 className="text-sm font-bold text-[var(--foreground)]">{title}</h3>
        {count !== undefined && count > 0 && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[var(--accent-soft)] text-[var(--accent)] font-bold">
            {toPersianDigits(count)}
          </span>
        )}
      </div>
      {action}
    </div>
  );
}

// ============================================================
// QUICK STATS (desktop sidebar)
// ============================================================
function QuickStats({ tasks }: { tasks: Task[] }) {
  const todayDate = new Date().toISOString().split('T')[0];
  const todayTasks = tasks.filter((t) => t.date === todayDate && t.studentId === CURRENT_STUDENT_ID);
  const completed = todayTasks.filter((t) => t.completed === true).length;
  const totalTests = todayTasks.reduce((sum, t) => sum + (t.actualTestCount ?? t.targetTestCount), 0);
  const totalMinutes = todayTasks.reduce((sum, t) => sum + (t.actualTimeMinutes ?? t.targetTimeMinutes), 0);
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;

  const stats = [
    { label: 'وظایف امروز', value: toPersianDigits(todayTasks.length), icon: FileText, color: 'var(--accent)' },
    { label: 'انجام شده', value: toPersianDigits(completed), icon: Check, color: 'var(--accent)' },
    { label: 'ساعت مطالعه', value: `${toPersianDigits(hours)}:${toPersianDigits(mins.toString().padStart(2, '0'))}`, icon: Clock, color: 'var(--warning)' },
    { label: 'تست‌ها', value: toPersianDigits(totalTests), icon: Target, color: '#A78BFA' },
  ];

  return (
    <div className="grid grid-cols-2 gap-2.5">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className="surface-1 edge-highlight rounded-[var(--radius)] p-3 flex flex-col gap-1.5"
          >
            <Icon className="w-4 h-4" style={{ color: stat.color }} />
            <span className="text-lg font-bold text-[var(--foreground)] tabular-nums leading-none">{stat.value}</span>
            <span className="text-[10px] text-[var(--foreground-muted)]">{stat.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// PARTIAL COMPLETION BOTTOM SHEET
// ============================================================
function PartialCompletionSheet({
  task,
  open,
  onOpenChange,
  onSave,
}: {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, actualTime: number, actualTests: number) => void;
}) {
  const [actualTime, setActualTime] = useState('');
  const [actualTests, setActualTests] = useState('');

  const handleSave = useCallback(() => {
    if (!task) return;
    const time = parseInt(actualTime) || 0;
    const tests = parseInt(actualTests) || 0;
    onSave(task.id, time, tests);
    setActualTime('');
    setActualTests('');
    onOpenChange(false);
  }, [task, actualTime, actualTests, onSave, onOpenChange]);

  if (!task) return null;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="surface-2 border-t border-[var(--border-strong)]">
        <DrawerHeader className="text-right">
          <DrawerTitle className="text-[var(--foreground)] text-base">ثبت تکمیل جزئی</DrawerTitle>
          <DrawerDescription className="text-[var(--foreground-muted)] text-sm">
            {task.subject} - {task.topic}
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 pb-2 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="actual-time" className="text-[var(--foreground)] text-sm">
              زمان واقعی مطالعه
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="actual-time"
                type="number"
                inputMode="numeric"
                placeholder={toPersianDigits(task.targetTimeMinutes)}
                value={actualTime}
                onChange={(e) => setActualTime(e.target.value)}
                className="bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--foreground)] text-right"
                dir="ltr"
              />
              <span className="text-xs text-[var(--foreground-muted)] whitespace-nowrap">دقیقه</span>
            </div>
            <span className="text-xs text-[var(--foreground-muted)]">
              هدف: {toPersianDigits(task.targetTimeMinutes)} دقیقه
            </span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="actual-tests" className="text-[var(--foreground)] text-sm">
              تعداد تست‌های حل شده
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="actual-tests"
                type="number"
                inputMode="numeric"
                placeholder={toPersianDigits(task.targetTestCount)}
                value={actualTests}
                onChange={(e) => setActualTests(e.target.value)}
                className="bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--foreground)] text-right"
                dir="ltr"
              />
              <span className="text-xs text-[var(--foreground-muted)] whitespace-nowrap">تست</span>
            </div>
            <span className="text-xs text-[var(--foreground-muted)]">
              هدف: {toPersianDigits(task.targetTestCount)} تست
            </span>
          </div>
        </div>

        <DrawerFooter className="pt-4">
          <Button
            onClick={handleSave}
            className="glow-hover w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--bg-deep)] font-bold min-h-[44px]"
          >
            ذخیره
          </Button>
          <DrawerClose asChild>
            <Button
              variant="ghost"
              className="w-full text-[var(--foreground-muted)] hover:text-[var(--foreground)] min-h-[44px]"
            >
              انصراف
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

// ============================================================
// UPSELL BANNER
// ============================================================
function UpsellBanner({ hasAdvisor }: { hasAdvisor: boolean }) {
  if (hasAdvisor) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.4 }}
      className="card-hover cursor-pointer rounded-[var(--radius-lg)] overflow-hidden relative"
    >
      <div className="surface-1 edge-highlight p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-[var(--radius)] bg-[var(--accent-soft)] flex items-center justify-center shrink-0">
          <Diamond className="w-5 h-5 text-[var(--accent)]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-[var(--foreground)]">نیاز به مشاور داری؟!</p>
          <p className="text-xs text-[var(--foreground-muted)] mt-0.5">همین الان با مشاوران ما صحبت کن</p>
        </div>
        <ChevronLeft className="w-5 h-5 text-[var(--accent)] flip-rtl shrink-0" />
      </div>
    </motion.div>
  );
}

// ============================================================
// MAIN DASHBOARD COMPONENT
// ============================================================
export default function Dashboard() {
  const { user, tasks, exams, updateTask } = useAppStore();
  const [partialTask, setPartialTask] = useState<Task | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Filter today's tasks for the current student
  const todayDate = useMemo(() => new Date().toISOString().split('T')[0], []);
  const todayTasks = useMemo(
    () =>
      tasks
        .filter((t) => t.date === todayDate && t.studentId === CURRENT_STUDENT_ID)
        .sort((a, b) => a.order - b.order),
    [tasks, todayDate]
  );

  // Calculate completion stats
  const completedCount = useMemo(
    () => todayTasks.filter((t) => t.completed === true).length,
    [todayTasks]
  );
  const totalCount = todayTasks.length;

  // Check if student has an advisor
  const hasAdvisor = user?.assignedAdvisorId !== null && user?.assignedAdvisorId !== undefined;

  // Handlers
  const handleComplete = useCallback(
    (taskId: string) => {
      updateTask(taskId, { completed: true });
      toast.success(getRandomSuccessMessage(), {
        style: {
          background: 'var(--bg-overlay)',
          border: '1px solid var(--accent-glow)',
          color: 'var(--accent)',
        },
      });
    },
    [updateTask]
  );

  const handleSkip = useCallback(
    (taskId: string) => {
      updateTask(taskId, { completed: false });
      toast(getRandomFailureMessage(), {
        style: {
          background: 'var(--bg-overlay)',
          border: '1px solid rgba(239,68,68,0.3)',
          color: '#F87171',
        },
      });
    },
    [updateTask]
  );

  const handlePartialOpen = useCallback((task: Task) => {
    setPartialTask(task);
    setSheetOpen(true);
  }, []);

  const handlePartialSave = useCallback(
    (id: string, actualTime: number, actualTests: number) => {
      updateTask(id, {
        actualTimeMinutes: actualTime,
        actualTestCount: actualTests,
        completed: true,
      });
      toast.success(getRandomSuccessMessage(), {
        style: {
          background: 'var(--bg-overlay)',
          border: '1px solid var(--accent-glow)',
          color: 'var(--accent)',
        },
      });
    },
    [updateTask]
  );

  const userName = user?.name ?? 'رفیق';

  return (
    <div dir="rtl">
      {/* MOBILE LAYOUT (single column, max-w-md) */}
      <div className="md:hidden max-w-md mx-auto px-4">
        <MobileDashboardHeader userName={userName} />

        <div className="mb-5">
          <DailyProgress completedCount={completedCount} totalCount={totalCount} />
        </div>

        <div className="mb-6">
          <UpcomingExams exams={exams} />
        </div>

        <div className="mb-6">
          <SectionHeader icon={<FileText className="w-4 h-4" />} title="وظایف امروز" count={totalCount} />
          <div className="space-y-2.5">
            <AnimatePresence>
              {todayTasks.map((task, index) => (
                <DashboardTaskCard
                  key={task.id}
                  task={task}
                  index={index}
                  onComplete={() => handleComplete(task.id)}
                  onSkip={() => handleSkip(task.id)}
                  onPartialOpen={() => handlePartialOpen(task)}
                />
              ))}
            </AnimatePresence>

            {todayTasks.length === 0 && (
              <div className="surface-1 rounded-[var(--radius-lg)] p-8 text-center">
                <p className="text-[var(--foreground-muted)] text-sm">وظیفه‌ای برای امروز ثبت نشده</p>
                <p className="text-xs text-[var(--foreground-subtle)] mt-1">از بخش برنامه‌ریزی وظایف خود رو اضافه کن</p>
              </div>
            )}
          </div>
        </div>

        <div className="mb-6">
          <CompletedExams exams={exams} />
        </div>

        <UpsellBanner hasAdvisor={hasAdvisor} />

        <PartialCompletionSheet
          task={partialTask}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          onSave={handlePartialSave}
        />
      </div>

      {/* DESKTOP LAYOUT (12-col grid: main + sidebar) */}
      <div className="hidden md:block">
        <DesktopDashboardHeader userName={userName} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ===== Main column (tasks) — col-span-2 ===== */}
          <div className="lg:col-span-2 space-y-6">
            <section>
              <SectionHeader icon={<FileText className="w-4 h-4" />} title="وظایف امروز" count={totalCount} />
              <div className="space-y-3">
                <AnimatePresence>
                  {todayTasks.map((task, index) => (
                    <DashboardTaskCard
                      key={task.id}
                      task={task}
                      index={index}
                      onComplete={() => handleComplete(task.id)}
                      onSkip={() => handleSkip(task.id)}
                      onPartialOpen={() => handlePartialOpen(task)}
                    />
                  ))}
                </AnimatePresence>

                {todayTasks.length === 0 && (
                  <div className="surface-1 rounded-[var(--radius-lg)] p-12 text-center">
                    <p className="text-[var(--foreground-muted)] text-base">وظیفه‌ای برای امروز ثبت نشده</p>
                    <p className="text-xs text-[var(--foreground-subtle)] mt-2">از بخش برنامه‌ریزی وظایف خود رو اضافه کن</p>
                  </div>
                )}
              </div>
            </section>

            <section>
              <CompletedExams exams={exams} />
            </section>

            <UpsellBanner hasAdvisor={hasAdvisor} />
          </div>

          {/* ===== Sidebar (right in RTL = first child) — col-span-1 ===== */}
          <aside className="lg:col-span-1 space-y-5">
            <DailyProgress completedCount={completedCount} totalCount={totalCount} />

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground-subtle)] mb-3 px-1">
                آمار سریع
              </h3>
              <QuickStats tasks={tasks} />
            </div>

            <UpcomingExams exams={exams} />
          </aside>
        </div>

        <PartialCompletionSheet
          task={partialTask}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          onSave={handlePartialSave}
        />
      </div>
    </div>
  );
}
