'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Check, X, CalendarDays, Clock, Target, ChevronLeft, Inbox,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '@/lib/store';
import { Task } from '@/lib/types';
import {
  toPersianDigits,
  minutesToHours,
  getPersianWeekdayName,
  formatPersianDate,
  getRelativeDayLabel,
} from '@/lib/persian-date';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import ManualEntrySheet from './ManualEntrySheet';
import { WeeklyPlanner } from './WeeklyPlanner';
import { PersianCalendar } from './PersianCalendar';
import { SortableTaskList } from './SortableTaskList';
import type { TaskCardCapabilities } from './TaskCard';
import { TaskDetailsDialog } from './TaskDetailsDialog';
import { TaskActionDialog } from './TaskActionDialog';
import { useCurrentStudentId, parseLocalDate } from '@/lib/student-utils';
import TaskStatsWidget from './TaskStatsWidget';
import { canMoveTaskToDate, isTaskVisibleOnScheduledDay, moveTaskToDateTransition, moveTaskToIncompleteTransition } from '@/lib/task-status';

// ===== Minimal Stats Bar (hours + tests only) =====
function MiniStatsBar({ totalHours, totalTests }: { totalHours: number; totalTests: number }) {
  if (totalHours === 0 && totalTests === 0) return null;
  return (
    <div className="flex items-center gap-3 text-xs text-[var(--foreground-muted)]">
      {totalHours > 0 && (
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3 text-[var(--foreground-subtle)]" />
          {toPersianDigits(totalHours)} ساعت
        </span>
      )}
      {totalTests > 0 && (
        <>
          <span className="w-px h-3 bg-[var(--border)]" />
          <span className="flex items-center gap-1">
            <Target className="w-3 h-3 text-[var(--foreground-subtle)]" />
            {toPersianDigits(totalTests)} تست
          </span>
        </>
      )}
    </div>
  );
}

// ===== Plan Tab Toggle (daily / incompletes) =====
function PlanTabToggle({
  tab,
  onChange,
  draftCount,
  incompleteCount,
}: {
  tab: 'daily' | 'draft' | 'incomplete';
  onChange: (t: 'daily' | 'draft' | 'incomplete') => void;
  draftCount: number;
  incompleteCount: number;
}) {
  return (
    <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)]">
      <button
        onClick={() => onChange('daily')}
        className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all min-h-[36px] flex items-center gap-1.5 ${
          tab === 'daily'
            ? 'bg-[var(--accent)] text-[var(--bg-deep)]'
            : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
        }`}
      >
        <CalendarDays className="w-3.5 h-3.5" />
        برنامه روز
      </button>
      <button
        onClick={() => onChange('draft')}
        className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all min-h-[36px] ${tab === 'draft' ? 'bg-[var(--accent)] text-[var(--bg-deep)]' : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'}`}
      >
        پیش‌نویس‌ها{draftCount > 0 ? ` ${toPersianDigits(draftCount)}` : ''}
      </button>
      <button
        onClick={() => onChange('incomplete')}
        className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all min-h-[36px] flex items-center gap-1.5 ${
          tab === 'incomplete'
            ? 'bg-[var(--warning)] text-[var(--bg-deep)]'
            : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
        }`}
      >
        <Inbox className="w-3.5 h-3.5" />
        ناقصی‌ها
        {incompleteCount > 0 && (
          <span
            className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold ${
              tab === 'incomplete'
                ? 'bg-[var(--bg-deep)]/20 text-[var(--bg-deep)]'
                : 'bg-[var(--warning)]/20 text-[var(--warning)]'
            }`}
          >
            {toPersianDigits(incompleteCount)}
          </span>
        )}
      </button>
    </div>
  );
}

export interface PlanTargetStudent {
  id: string;
  grade: string;
  major: string;
}

export interface PlanActor {
  role: 'STUDENT' | 'ADVISOR';
  id: string;
}

// ===== Main Component =====
export default function PlanView({ targetStudent, actor }: { targetStudent?: PlanTargetStudent; actor?: PlanActor } = {}) {
  const {
    tasks,
    addTask,
    updateTask,
    deleteTask,
    resetTask,
    reorderTasks,
    loadTasksForStudent,
    selectedDate,
    setSelectedDate,
  } = useAppStore();
  const currentStudentId = useCurrentStudentId();
  const studentId = targetStudent?.id ?? currentStudentId;
  const isAdvisorWorkspace = actor?.role === 'ADVISOR';
  const getTaskCapabilities = useCallback((task: Task): TaskCardCapabilities => {
    if (!isAdvisorWorkspace) return {};
    const ownsTask = task.createdBy === 'advisor'
      && task.createdById === actor?.id
      && task.status !== 'COMPLETED'
      && task.status !== 'SKIPPED';
    return { complete: false, reset: false, partial: false, action: ownsTask, edit: true, deleteDraft: ownsTask, drag: false };
  }, [actor?.id, isAdvisorWorkspace]);

  // Local state
  const [addDrawerOpen, setAddDrawerOpen] = useState(false);
  const [weeklyPlannerOpen, setWeeklyPlannerOpen] = useState(false);
  const [settingsTaskId, setSettingsTaskId] = useState<string | null>(null);
  const [detailsTaskId, setDetailsTaskId] = useState<string | null>(null);
  const [planTab, setPlanTab] = useState<'daily' | 'draft' | 'incomplete'>('daily');
  const [actionTaskId, setActionTaskId] = useState<string | null>(null);

  // Filter tasks for current student + selected date.
  // Dated drafts stay visible on their scheduled day so weekly-plan placeholders
  // can be completed in context. INCOMPLETE tasks live only in their own tab.
  // Sort: pending first (by order), then completed/skipped at the bottom
  const filteredTasks = useMemo(() => {
    return tasks
      .filter(
        (t) =>
          t.date === selectedDate &&
          t.studentId === studentId &&
          isTaskVisibleOnScheduledDay(t.status, t.detailsCompleted)
      )
      .sort((a, b) => {
        // Pending tasks first, then completed/skipped
        const aPending = a.completed === null ? 0 : 1;
        const bPending = b.completed === null ? 0 : 1;
        if (aPending !== bPending) return aPending - bPending;
        return a.order - b.order;
      });
  }, [tasks, selectedDate, studentId]);

  // Incomplete tasks (detailsCompleted === false) for this student — shown in
  // the "ناقصی‌ها" tab. Sorted by creation order (most recent first).
  const incompleteTasks = useMemo(() => {
    return tasks
      .filter((t) => t.studentId === studentId && t.status === 'INCOMPLETE')
      .sort((a, b) => b.order - a.order);
  }, [tasks, studentId]);

  const draftTasks = useMemo(() => tasks.filter((t) => t.studentId === studentId && t.status === 'DRAFT'), [tasks, studentId]);
  const secondaryTabTasks = planTab === 'draft' ? draftTasks : incompleteTasks;

  // Dynamic header title
  const headerTitle = useMemo(() => {
    const date = parseLocalDate(selectedDate);
    return getRelativeDayLabel(date);
  }, [selectedDate]);

  // Day subtitle (weekday + Persian date)
  const daySubtitle = useMemo(() => {
    const date = parseLocalDate(selectedDate);
    return `${getPersianWeekdayName(date)} · ${formatPersianDate(date)}`;
  }, [selectedDate]);

  // Simplified stats: only total hours and test count
  const dateStats = useMemo(() => {
    const totalMinutes = filteredTasks.reduce((sum, t) => sum + (t.targetTimeMinutes ?? 0), 0);
    const totalTests = filteredTasks.reduce((sum, t) => sum + (t.targetTestCount ?? 0), 0);
    return {
      totalHours: minutesToHours(totalMinutes),
      totalTests,
    };
  }, [filteredTasks]);

  // Task stats for the widget
  const taskStats = useMemo(() => {
    const totalTasks = filteredTasks.length;
    const completedCount = filteredTasks.filter((t) => t.completed === true).length;
    const totalActualMinutes = filteredTasks.reduce((sum, t) => sum + (t.actualTimeMinutes ?? 0), 0);
    const totalStudyHours = minutesToHours(totalActualMinutes);
    const totalTestsTaken = filteredTasks.reduce((sum, t) => sum + (t.actualTestCount ?? 0), 0);
    return { totalTasks, completedCount, totalStudyHours, totalTests: totalTestsTaken };
  }, [filteredTasks]);

  // Task counts per date (for calendar indicators)
  const taskCountByDate = useMemo(() => {
    const map: Record<string, number> = {};
    for (const t of tasks) {
      if (t.studentId === studentId && isTaskVisibleOnScheduledDay(t.status, t.detailsCompleted)) {
        map[t.date] = (map[t.date] || 0) + 1;
      }
    }
    return map;
  }, [tasks]);

  const completedCountByDate = useMemo(() => {
    const map: Record<string, number> = {};
    for (const t of tasks) {
      if (t.studentId === studentId && t.completed === true) {
        map[t.date] = (map[t.date] || 0) + 1;
      }
    }
    return map;
  }, [tasks]);

  // Settings task
  const settingsTask = useMemo(() => tasks.find((t) => t.id === settingsTaskId), [tasks, settingsTaskId]);

  // ===== Handlers =====
  const handleComplete = useCallback(
    async (taskId: string) => {
      const task = tasks.find((item) => item.id === taskId);
      await updateTask(taskId, { status: 'COMPLETED', completed: true, actualTimeMinutes: task?.actualTimeMinutes ?? task?.targetTimeMinutes ?? 0, actualTestCount: task?.actualTestCount ?? task?.targetTestCount ?? 0 });
    },
    [tasks, updateTask]
  );

  const handleSkip = useCallback(
    async (taskId: string) => {
      await updateTask(taskId, { status: 'SKIPPED', completed: false });
    },
    [updateTask]
  );

  const handleReset = useCallback(
    async (taskId: string) => {
      await resetTask(taskId);
    },
    [resetTask]
  );

  const handleDeleteTask = useCallback(
    async (taskId: string) => {
      await deleteTask(taskId);
      toast('تسک حذف شد', {
        style: { background: 'var(--bg-overlay)', border: '1px solid var(--border-strong)', color: 'var(--foreground-muted)' },
      });
    },
    [deleteTask]
  );

  // ===== Task action dialog handlers =====
  const actionTask = useMemo(
    () => tasks.find((t) => t.id === actionTaskId) ?? null,
    [tasks, actionTaskId]
  );

  const handleMoveDate = useCallback(
    async (taskId: string, newDate: string) => {
      const task = tasks.find((item) => item.id === taskId);
      if (!task) return;
      if (isAdvisorWorkspace && !(task.createdBy === 'advisor' && task.createdById === actor?.id)) throw new Error('فقط تسک‌های ساخته‌شده توسط خود مشاور قابل جابه‌جایی هستند');
      if (!isAdvisorWorkspace && task.createdBy !== 'student') throw new Error('انتقال روز برای تسک مشاور مجاز نیست');
      if (!task.status || !canMoveTaskToDate(task.status)) throw new Error('فقط تسک فعال یا ناقص قابل برنامه‌ریزی مجدد است');
      await updateTask(taskId, moveTaskToDateTransition(newDate));
      await loadTasksForStudent(task.studentId);
      setSelectedDate(newDate);
      setPlanTab('daily');
      const d = parseLocalDate(newDate);
      toast.success(`تسک به ${getPersianWeekdayName(d)} ${formatPersianDate(d)} منتقل شد`, {
        style: { background: 'var(--bg-overlay)', border: '1px solid var(--border-strong)', color: 'var(--accent)' },
      });
    },
    [actor?.id, isAdvisorWorkspace, tasks, updateTask, loadTasksForStudent, setSelectedDate]
  );

  const handleMoveToIncomplete = useCallback(
    async (taskId: string) => {
      const task = tasks.find((item) => item.id === taskId);
      if (!task) throw new Error('تسک یافت نشد');
      if (task.status === 'DRAFT' || !task.detailsCompleted) throw new Error('ابتدا جزئیات پیش‌نویس را تکمیل کنید');
      await updateTask(taskId, moveTaskToIncompleteTransition());
      toast('تسک به ناقصی‌ها منتقل شد', {
        style: { background: 'var(--bg-overlay)', border: '1px solid var(--border-strong)', color: 'var(--warning)' },
      });
    },
    [tasks, updateTask]
  );

  const handleActionDelete = useCallback(
    async (taskId: string) => {
      const task = tasks.find((item) => item.id === taskId);
      const allowed = isAdvisorWorkspace
        ? task?.createdBy === 'advisor' && task.createdById === actor?.id && task.status !== 'COMPLETED' && task.status !== 'SKIPPED'
        : task?.createdBy === 'student';
      if (!allowed) {
        toast.error(isAdvisorWorkspace ? 'فقط تسک‌های ساخته‌شده توسط خود مشاور قابل حذف هستند' : 'تسک‌های مشاور قابل حذف نیستند');
        return;
      }
      await deleteTask(taskId);
      toast('تسک حذف شد', {
        style: { background: 'var(--bg-overlay)', border: '1px solid var(--border-strong)', color: 'var(--foreground-muted)' },
      });
    },
    [actor?.id, deleteTask, isAdvisorWorkspace, tasks]
  );

  const handleReorder = useCallback(
    (reordered: Task[]) => {
      if (isAdvisorWorkspace) return;
      reorderTasks(reordered);
    },
    [isAdvisorWorkspace, reorderTasks]
  );

  const handleManualSubmit = useCallback(
    (task: Task) => addTask(task),
    [addTask]
  );


  const handleSettingsSave = useCallback(() => {
    if (!settingsTaskId) return;
    setSettingsTaskId(null);
  }, [settingsTaskId]);

  return (
    <div dir="rtl">
      {/* ===================================================
          MOBILE LAYOUT (single column, max-w-md)
          =================================================== */}
      <div className="md:hidden max-w-md mx-auto px-4 pt-6 pb-28">
        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <motion.h1
            key={planTab === 'incomplete' ? 'ناقصی‌ها' : headerTitle}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-bold text-[var(--foreground)]"
          >
            {planTab === 'incomplete' ? 'ناقصی‌ها' : headerTitle}
          </motion.h1>
          <div className="flex items-center gap-2">
            {planTab === 'daily' && (
              <button
                onClick={() => setWeeklyPlannerOpen(true)}
                className="icon-btn w-10 h-10 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] flex items-center justify-center text-[var(--foreground-muted)] hover:text-[var(--accent)]"
                aria-label="برنامه هفتگی"
              >
                <CalendarDays className="w-4.5 h-4.5" />
              </button>
            )}
          </div>
        </div>
        <p className="text-xs text-[var(--foreground-muted)] mb-3">
          {planTab === 'incomplete' ? 'تسک‌های ناقص برای تکمیل بعدی' : daySubtitle}
        </p>

        {/* Plan Tab Toggle */}
        <div className="mb-4">
          <PlanTabToggle tab={planTab} onChange={setPlanTab} draftCount={draftTasks.length} incompleteCount={incompleteTasks.length} />
        </div>

        {planTab === 'daily' ? (
          <>
            {/* Task Stats Widget */}
            <TaskStatsWidget stats={taskStats} />

            {/* Persian Calendar */}
            <div className="mt-4 mb-5">
              <PersianCalendar
                selectedDate={selectedDate}
                onSelect={setSelectedDate}
                taskCountByDate={taskCountByDate}
                completedCountByDate={completedCountByDate}
              />
            </div>

            {/* Task Cards */}
            <div className="space-y-3">
              {filteredTasks.length === 0 ? (
                <EmptyState />
              ) : (
                <SortableTaskList
                  tasks={filteredTasks}
                  onComplete={handleComplete}
                  onSkip={handleSkip}
                  onDelete={handleDeleteTask}
                  onAction={setActionTaskId}
                  onSettings={setSettingsTaskId}
                  onReset={handleReset}
                  onReorder={handleReorder}
                  onEdit={setDetailsTaskId}
                  getCapabilities={getTaskCapabilities}
                  sortable={!isAdvisorWorkspace}
                />
              )}
            </div>
          </>
        ) : (
          /* Draft and incomplete tasks tabs */
          <div className="space-y-3">
            {secondaryTabTasks.length === 0 ? (
              <IncompleteEmptyState draft={planTab === 'draft'} />
            ) : (
              <SortableTaskList
                tasks={secondaryTabTasks}
                onComplete={handleComplete}
                onSkip={handleSkip}
                onDelete={handleDeleteTask}
                onAction={setActionTaskId}
                onSettings={setSettingsTaskId}
                onReset={handleReset}
                onReorder={handleReorder}
                onEdit={setDetailsTaskId}
                getCapabilities={getTaskCapabilities}
                sortable={!isAdvisorWorkspace}
              />
            )}
          </div>
        )}

        {/* FAB: Add Task (daily tab only) */}
        {planTab === 'daily' && (
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => setAddDrawerOpen(true)}
            className="glow-hover fixed bottom-24 left-4 z-40 bg-[var(--accent)] text-[var(--bg-deep)] px-4 py-3 rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.3)] flex items-center gap-2 font-medium text-sm hover:bg-[var(--accent-hover)] min-h-[48px]"
            aria-label="اضافه کردن تسک"
          >
            <Plus className="w-5 h-5" />
            <span>تسک جدید</span>
          </motion.button>
        )}
      </div>

      {/* ===================================================
          DESKTOP LAYOUT (calendar + task list sidebar)
          =================================================== */}
      <div className="hidden md:block">
        {/* Desktop Header */}
        <div className="flex items-end justify-between mb-6 pb-6 border-b border-[var(--border)]">
          <div className="flex flex-col gap-2 min-w-0">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-[var(--foreground-subtle)] font-semibold">
              <span>برنامه‌ریزی</span>
              <ChevronLeft className="w-3 h-3 flip-rtl" />
              <span className="text-[var(--accent)]">{planTab === 'draft' ? 'پیش‌نویس‌ها' : planTab === 'incomplete' ? 'ناقصی‌ها' : headerTitle}</span>
            </div>
            <motion.h1
              key={planTab === 'incomplete' ? 'ناقصی‌ها' : headerTitle}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl md:text-4xl font-bold text-[var(--foreground)]"
            >
              {planTab === 'draft' ? 'پیش‌نویس‌ها' : planTab === 'incomplete' ? 'ناقصی‌ها' : headerTitle}
            </motion.h1>
            <p className="text-sm text-[var(--foreground-muted)]">
              {planTab === 'draft' ? 'پیش‌نویس‌های نیازمند تکمیل جزئیات' : planTab === 'incomplete' ? 'تسک‌های ناقص برای تکمیل بعدی' : daySubtitle}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <PlanTabToggle tab={planTab} onChange={setPlanTab} draftCount={draftTasks.length} incompleteCount={incompleteTasks.length} />
            {planTab === 'daily' && (
              <button
                onClick={() => setWeeklyPlannerOpen(true)}
                className="btn-hover flex items-center gap-2 h-10 px-4 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--foreground-muted)] hover:text-[var(--accent)] text-sm font-medium"
              >
                <CalendarDays className="w-4 h-4" />
                برنامه هفتگی
              </button>
            )}
          </div>
        </div>

        {planTab === 'daily' ? (
          /* 2-col: calendar sidebar + task list */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* ===== Left: Calendar + Add Task ===== */}
            <aside className="lg:col-span-1 space-y-4">
              <PersianCalendar
                selectedDate={selectedDate}
                onSelect={setSelectedDate}
                taskCountByDate={taskCountByDate}
                completedCountByDate={completedCountByDate}
              />

              {/* Add task CTA */}
              <div className="surface-1 edge-highlight card-hover rounded-[var(--radius-lg)] p-4">
                <button
                  onClick={() => setAddDrawerOpen(true)}
                  className="glow-hover btn-hover flex items-center justify-center gap-2 w-full py-2.5 rounded-[var(--radius)] bg-[var(--accent)] text-[var(--bg-deep)] font-semibold text-sm min-h-[44px]"
                >
                  <Plus className="w-4 h-4" />
                  تسک جدید
                </button>
              </div>

              {/* Task Stats Widget (desktop sidebar) */}
              <TaskStatsWidget stats={taskStats} />
            </aside>

            {/* ===== Right: Task List ===== */}
            <div className="lg:col-span-2 space-y-3">
              {filteredTasks.length === 0 ? (
                <EmptyState />
              ) : (
                <SortableTaskList
                  tasks={filteredTasks}
                  onComplete={handleComplete}
                  onSkip={handleSkip}
                  onDelete={handleDeleteTask}
                  onAction={setActionTaskId}
                  onSettings={setSettingsTaskId}
                  onReset={handleReset}
                  onReorder={handleReorder}
                  onEdit={setDetailsTaskId}
                  getCapabilities={getTaskCapabilities}
                  sortable={!isAdvisorWorkspace}
                />
              )}
            </div>
          </div>
        ) : (
          /* Draft or incomplete tasks tab — full width */
          <div className="max-w-3xl mx-auto space-y-3">
            {secondaryTabTasks.length === 0 ? (
              <IncompleteEmptyState draft={planTab === 'draft'} />
            ) : (
              <SortableTaskList
                tasks={secondaryTabTasks}
                onComplete={handleComplete}
                onSkip={handleSkip}
                onDelete={handleDeleteTask}
                onAction={setActionTaskId}
                onSettings={setSettingsTaskId}
                onReset={handleReset}
                onReorder={handleReorder}
                onEdit={setDetailsTaskId}
                getCapabilities={getTaskCapabilities}
                sortable={!isAdvisorWorkspace}
              />
            )}
          </div>
        )}
      </div>

      {/* ===================================================
          SHARED MODALS
          =================================================== */}
      <ManualEntrySheet
        open={addDrawerOpen}
        onOpenChange={setAddDrawerOpen}
        selectedDate={selectedDate}
        existingTaskCount={tasks.filter((t) => t.date === selectedDate && t.studentId === studentId).length}
        onSubmit={handleManualSubmit}
        onSaved={(task) => { if (task.status === 'DRAFT') setPlanTab('draft'); }}
        studentId={studentId}
        grade={targetStudent?.grade}
        major={targetStudent?.major}
        createdBy={isAdvisorWorkspace ? 'advisor' : 'student'}
        createdById={isAdvisorWorkspace ? actor?.id ?? null : null}
      />


      <WeeklyPlanner
        open={weeklyPlannerOpen}
        onOpenChange={setWeeklyPlannerOpen}
        targetStudent={targetStudent}
        actor={actor}
      />
      <TaskDetailsDialog
        task={tasks.find((task) => task.id === detailsTaskId) ?? null}
        open={!!detailsTaskId}
        onOpenChange={(nextOpen) => !nextOpen && setDetailsTaskId(null)}
        grade={targetStudent?.grade ?? useAppStore.getState().user?.grade ?? 'دوازدهم'}
        major={targetStudent?.major ?? useAppStore.getState().user?.major ?? 'تجربی'}
        onSave={async (updates) => {
          if (!detailsTaskId) return;
          if (isAdvisorWorkspace) {
            const task = tasks.find((item) => item.id === detailsTaskId);
            if (!task || task.createdBy !== 'advisor' || task.createdById !== actor?.id || task.status === 'COMPLETED' || task.status === 'SKIPPED') {
              toast.error('فقط تسک‌های ساخته‌شده توسط خود مشاور قابل ویرایش هستند');
              return;
            }
          }
          const taskDate = tasks.find((task) => task.id === detailsTaskId)?.date;
          await updateTask(detailsTaskId, updates);
          if (taskDate) setSelectedDate(taskDate);
          setPlanTab('daily');
        }}
      />

      {/* Settings / Partial Completion Dialog */}
      <Dialog open={!!settingsTaskId} onOpenChange={(open) => !open && setSettingsTaskId(null)}>
        <DialogContent className="surface-2 border-[var(--border-strong)] text-[var(--foreground)] max-w-[calc(100%-2rem)] sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-[var(--foreground)] text-right text-base">ثبت بخشی از تسک</DialogTitle>
            <DialogDescription className="text-[var(--foreground-muted)] text-right text-xs">
               {settingsTask?.subject}{settingsTask?.topic ? ` - ${settingsTask.topic}` : ''}
            </DialogDescription>
          </DialogHeader>
          {settingsTask && (
            <div className="space-y-4 py-2">
              <div>
                <label className="text-xs text-[var(--foreground-muted)] mb-1.5 block">زمان واقعی (دقیقه)</label>
                <input
                  type="number"
                  value={settingsTask.actualTimeMinutes ?? ''}
                  onChange={(e) => updateTask(settingsTask.id, { actualTimeMinutes: Number(e.target.value) || null })}
                  className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-3 h-10 text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]/40"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="text-xs text-[var(--foreground-muted)] mb-1.5 block">تعداد تست واقعی</label>
                <input
                  type="number"
                  value={settingsTask.actualTestCount ?? ''}
                  onChange={(e) => updateTask(settingsTask.id, { actualTestCount: Number(e.target.value) || null })}
                  className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-3 h-10 text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]/40"
                  dir="ltr"
                />
              </div>
            </div>
          )}
          <div className="flex gap-2 pt-4 border-t border-[var(--border)]">
            <button
              onClick={handleSettingsSave}
              className="btn-hover glow-hover flex-1 h-10 rounded-lg bg-[var(--accent)] text-[var(--bg-deep)] font-semibold text-sm"
            >
              ذخیره
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ===== Task Action Dialog (move to day / move to incompletes / delete) ===== */}
      <TaskActionDialog
        task={actionTask}
        open={!!actionTaskId}
        onOpenChange={(open) => !open && setActionTaskId(null)}
        onMoveDate={handleMoveDate}
        onMoveToIncomplete={handleMoveToIncomplete}
        onDelete={handleActionDelete}
        taskCountByDate={taskCountByDate}
        capabilities={isAdvisorWorkspace ? {
          moveDate: actionTask?.status === 'PENDING' || actionTask?.status === 'INCOMPLETE',
          moveToIncomplete: false,
          delete: Boolean(actionTask && actionTask.createdBy === 'advisor' && actionTask.createdById === actor?.id && actionTask.status !== 'COMPLETED' && actionTask.status !== 'SKIPPED'),
        } : undefined}
      />
    </div>
  );
}

// ===== Empty State =====
function EmptyState() {
  return (
    <div className="surface-1 rounded-2xl p-10 text-center">
      <div className="w-12 h-12 rounded-2xl bg-[var(--accent-soft)] flex items-center justify-center mx-auto mb-3">
        <Plus className="w-5 h-5 text-[var(--accent)]" />
      </div>
      <p className="text-sm text-[var(--foreground)] font-medium mb-1">برنامه‌ای برای این روز ثبت نشده</p>
      <p className="text-xs text-[var(--foreground-muted)]">از دکمه تسک جدید یا برنامه هفتگی استفاده کنید</p>
    </div>
  );
}

// ===== Incomplete Empty State =====
function IncompleteEmptyState({ draft = false }: { draft?: boolean }) {
  return (
    <div className="surface-1 rounded-2xl p-10 text-center">
      <div className="w-12 h-12 rounded-2xl bg-[rgba(216,150,20,0.12)] flex items-center justify-center mx-auto mb-3">
        <Inbox className="w-5 h-5 text-[var(--warning)]" />
      </div>
      <p className="text-sm text-[var(--foreground)] font-medium mb-1">{draft ? 'پیش‌نویسی وجود ندارد' : 'تسک ناقصی وجود ندارد'}</p>
      <p className="text-xs text-[var(--foreground-muted)]">
        {draft ? 'تسک‌هایی که جزئیاتشان را مشخص نکرده‌اید اینجا نمایش داده می‌شوند' : 'تسک‌های انجام‌نشده یا منتقل‌شده به ناقصی‌ها اینجا نمایش داده می‌شوند'}
      </p>
    </div>
  );
}
