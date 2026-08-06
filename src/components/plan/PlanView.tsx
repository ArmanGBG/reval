'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Wand2, Check, X, CalendarDays, Clock, Target, ChevronLeft,
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
import AiEntryModal from './AiEntryModal';
import { WeeklyPlanner } from './WeeklyPlanner';
import { PersianCalendar } from './PersianCalendar';
import { SortableTaskList } from './SortableTaskList';
import { TaskDetailsDialog } from './TaskDetailsDialog';
import { useCurrentStudentId, parseLocalDate } from '@/lib/student-utils';

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

// ===== Pattern Button (shared) =====
function PatternButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="btn-hover nav-item-hover text-sm text-[var(--accent)] font-medium px-3 py-2 rounded-[var(--radius)] border border-[var(--accent)]/30 hover:bg-[var(--accent-soft)] min-h-[40px] flex items-center gap-1.5"
    >
      <CalendarDays className="w-4 h-4" />
      <span>الگو</span>
    </button>
  );
}

// ===== Main Component =====
export default function PlanView() {
  const {
    tasks,
    addTask,
    addTasks,
    updateTask,
    deleteTask,
    resetTask,
    reorderTasks,
    selectedDate,
    setSelectedDate,
  } = useAppStore();
  const studentId = useCurrentStudentId();

  // Local state
  const [addDrawerOpen, setAddDrawerOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [weeklyPlannerOpen, setWeeklyPlannerOpen] = useState(false);
  const [settingsTaskId, setSettingsTaskId] = useState<string | null>(null);
  const [detailsTaskId, setDetailsTaskId] = useState<string | null>(null);

  // Filter tasks for current student + selected date
  // Sort: pending first (by order), then completed/skipped at the bottom
  const filteredTasks = useMemo(() => {
    return tasks
      .filter((t) => t.date === selectedDate && t.studentId === studentId)
      .sort((a, b) => {
        // Pending tasks first, then completed/skipped
        const aPending = a.completed === null ? 0 : 1;
        const bPending = b.completed === null ? 0 : 1;
        if (aPending !== bPending) return aPending - bPending;
        return a.order - b.order;
      });
  }, [tasks, selectedDate]);

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

  // Task counts per date (for calendar indicators)
  const taskCountByDate = useMemo(() => {
    const map: Record<string, number> = {};
    for (const t of tasks) {
      if (t.studentId === studentId) {
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
      await updateTask(taskId, { completed: true });
    },
    [updateTask]
  );

  const handleSkip = useCallback(
    async (taskId: string) => {
      await updateTask(taskId, { completed: false });
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

  const handleReorder = useCallback(
    (reordered: Task[]) => {
      reorderTasks(reordered);
    },
    [reorderTasks]
  );

  const handleManualSubmit = useCallback(
    (task: Task) => {
      addTask(task);
    },
    [addTask]
  );

  const handleAIConfirm = useCallback(
    (newTasks: Task[]) => {
      addTasks(newTasks);
    },
    [addTasks]
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
            key={headerTitle}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-bold text-[var(--foreground)]"
          >
            {headerTitle}
          </motion.h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setWeeklyPlannerOpen(true)}
              className="icon-btn w-10 h-10 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] flex items-center justify-center text-[var(--foreground-muted)] hover:text-[var(--accent)]"
              aria-label="برنامه هفتگی"
            >
              <CalendarDays className="w-4.5 h-4.5" />
            </button>
            <PatternButton onClick={() => setAiModalOpen(true)} />
          </div>
        </div>
        <p className="text-xs text-[var(--foreground-muted)] mb-3">{daySubtitle}</p>

        <MiniStatsBar totalHours={dateStats.totalHours} totalTests={dateStats.totalTests} />

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
            <EmptyState onAdd={() => setAddDrawerOpen(true)} />
          ) : (
            <SortableTaskList
              tasks={filteredTasks}
              onComplete={handleComplete}
              onSkip={handleSkip}
              onDelete={handleDeleteTask}
              onSettings={setSettingsTaskId}
              onReset={handleReset}
              onReorder={handleReorder}
              onEdit={setDetailsTaskId}
            />
          )}
        </div>

        {/* FAB: Add Task */}
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => setAddDrawerOpen(true)}
          className="glow-hover fixed bottom-24 left-4 z-40 bg-[var(--accent)] text-[var(--bg-deep)] px-4 py-3 rounded-2xl shadow-[0_8px_24px_-6px_var(--accent-glow)] flex items-center gap-2 font-medium text-sm hover:bg-[var(--accent-hover)] min-h-[48px]"
          aria-label="اضافه کردن تسک"
        >
          <Plus className="w-5 h-5" />
          <span>تسک جدید</span>
        </motion.button>
      </div>

      {/* ===================================================
          DESKTOP LAYOUT (calendar + task list sidebar)
          =================================================== */}
      <div className="hidden md:block">
        {/* Desktop Header */}
        <div className="flex items-end justify-between mb-8 pb-6 border-b border-[var(--border)]">
          <div className="flex flex-col gap-2 min-w-0">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-[var(--foreground-subtle)] font-semibold">
              <span>برنامه‌ریزی</span>
              <ChevronLeft className="w-3 h-3 flip-rtl" />
              <span className="text-[var(--accent)]">{headerTitle}</span>
            </div>
            <motion.h1
              key={headerTitle}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl md:text-4xl font-bold text-[var(--foreground)]"
            >
              {headerTitle}
            </motion.h1>
            <p className="text-sm text-[var(--foreground-muted)]">{daySubtitle}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setWeeklyPlannerOpen(true)}
              className="btn-hover flex items-center gap-2 h-10 px-4 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--foreground-muted)] hover:text-[var(--accent)] text-sm font-medium"
            >
              <CalendarDays className="w-4 h-4" />
              برنامه هفتگی
            </button>
            <PatternButton onClick={() => setAiModalOpen(true)} />
          </div>
        </div>

        {/* 2-col: calendar sidebar + task list */}
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
              <button
                onClick={() => setAiModalOpen(true)}
                className="btn-hover flex items-center justify-center gap-2 w-full py-2.5 mt-2 rounded-[var(--radius)] border border-[var(--accent)]/30 bg-[var(--accent-soft)] text-[var(--accent)] font-medium text-sm min-h-[44px]"
              >
                <Wand2 className="w-4 h-4" />
                هوش مصنوعی
              </button>
            </div>

            {/* Mini stats */}
            <div className="surface-1 rounded-[var(--radius-lg)] p-4">
              <h3 className="text-[10px] uppercase tracking-wider text-[var(--foreground-subtle)] font-semibold mb-3">
                خلاصه روز
              </h3>
              <div className="flex items-center gap-4">
                <div className="flex flex-col">
                  <span className="text-xl font-bold text-[var(--foreground)]">
                    {toPersianDigits(dateStats.totalHours)}
                  </span>
                  <span className="text-[10px] text-[var(--foreground-subtle)]">ساعت</span>
                </div>
                {dateStats.totalTests > 0 && (
                  <div className="w-px h-8 bg-[var(--border)]" />
                )}
                {dateStats.totalTests > 0 && (
                  <div className="flex flex-col">
                    <span className="text-xl font-bold text-[var(--foreground)]">
                      {toPersianDigits(dateStats.totalTests)}
                    </span>
                    <span className="text-[10px] text-[var(--foreground-subtle)]">تست</span>
                  </div>
                )}
              </div>
            </div>
          </aside>

          {/* ===== Right: Task List ===== */}
          <div className="lg:col-span-2 space-y-3">
            {filteredTasks.length === 0 ? (
              <EmptyState onAdd={() => setAddDrawerOpen(true)} />
            ) : (
              <SortableTaskList
                tasks={filteredTasks}
                onComplete={handleComplete}
                onSkip={handleSkip}
                onDelete={handleDeleteTask}
                onSettings={setSettingsTaskId}
                onReset={handleReset}
                onReorder={handleReorder}
                onEdit={setDetailsTaskId}
              />
            )}
          </div>
        </div>
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
      />

      <AiEntryModal
        open={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        selectedDate={selectedDate}
        existingTaskCount={tasks.filter((t) => t.date === selectedDate && t.studentId === studentId).length}
        onConfirm={handleAIConfirm}
      />

      <WeeklyPlanner
        open={weeklyPlannerOpen}
        onOpenChange={setWeeklyPlannerOpen}
      />
      <TaskDetailsDialog task={tasks.find(t => t.id === detailsTaskId) ?? null} open={!!detailsTaskId} onOpenChange={v => !v && setDetailsTaskId(null)} grade={useAppStore.getState().user?.grade ?? 'دوازدهم'} major={useAppStore.getState().user?.major ?? 'تجربی'} onSave={updates => updateTask(detailsTaskId!, updates)} />

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
    </div>
  );
}

// ===== Empty State =====
function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="surface-1 rounded-2xl p-10 text-center">
      <div className="w-12 h-12 rounded-2xl bg-[var(--accent-soft)] flex items-center justify-center mx-auto mb-3">
        <Plus className="w-5 h-5 text-[var(--accent)]" />
      </div>
      <p className="text-sm text-[var(--foreground)] font-medium mb-1">برنامه‌ای برای این روز ثبت نشده</p>
      <p className="text-xs text-[var(--foreground-muted)] mb-4">یک تسک جدید اضافه کنید یا از برنامه هفتگی استفاده کنید</p>
      <button
        onClick={onAdd}
        className="btn-hover glow-hover inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-[var(--accent)] text-[var(--bg-deep)] font-semibold text-sm"
      >
        <Plus className="w-4 h-4" />
        تسک جدید
      </button>
    </div>
  );
}
