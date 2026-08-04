'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Settings, Trash2, Clock, Target, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '@/lib/store';
import { Task } from '@/lib/types';
import { getRandomSuccessMessage, getRandomFailureMessage, getGreeting, getPersianDate } from '@/lib/constants/feedbackMessages';
import { toPersianDigits, minutesToHours, getRelativeDayLabel, getPersianWeekdayName, formatPersianDate } from '@/lib/persian-date';
import { useCurrentStudentId, parseLocalDate } from '@/lib/student-utils';
import { SortableTaskList } from '@/components/plan/SortableTaskList';
import { PartialCompletionSheet } from './PartialCompletionSheet';

// ===== Main Component =====
export default function Dashboard() {
  const { user, tasks, updateTask, deleteTask, resetTask, reorderTasks } = useAppStore();
  const studentId = useCurrentStudentId();
  const [partialTask, setPartialTask] = useState<Task | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Today's tasks
  const todayDate = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);
  const todayTasks = useMemo(
    () =>
      tasks
        .filter((t) => t.date === todayDate && t.studentId === studentId)
        .sort((a, b) => {
          const aPending = a.completed === null ? 0 : 1;
          const bPending = b.completed === null ? 0 : 1;
          if (aPending !== bPending) return aPending - bPending;
          return a.order - b.order;
        }),
    [tasks, todayDate, studentId]
  );

  // Simple stats
  const totalHours = useMemo(
    () => minutesToHours(todayTasks.reduce((sum, t) => sum + t.targetTimeMinutes, 0)),
    [todayTasks]
  );
  const totalTests = useMemo(
    () => todayTasks.reduce((sum, t) => sum + t.targetTestCount, 0),
    [todayTasks]
  );

  const userName = user?.name ?? 'رفیق';
  const greeting = getGreeting(userName);
  const todayLabel = `${getPersianWeekdayName(new Date())} · ${formatPersianDate(new Date())}`;

  // Handlers
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

  const handlePartialOpen = useCallback((task: Task) => {
    setPartialTask(task);
    setSheetOpen(true);
  }, []);

  const handlePartialSave = useCallback((id: string, actualTime: number, actualTests: number) => {
    updateTask(id, { actualTimeMinutes: actualTime, actualTestCount: actualTests, completed: true });
    setSheetOpen(false);
    toast.success(getRandomSuccessMessage());
  }, [updateTask]);

  return (
    <div dir="rtl" className="max-w-2xl mx-auto px-4 md:px-0 py-6">
      {/* ===== Simple Header ===== */}
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-[var(--foreground)]">{greeting}</h1>
        <p className="text-xs text-[var(--foreground-muted)] mt-1">{todayLabel}</p>
        {/* Minimal stats — only hours + tests */}
        {(totalHours > 0 || totalTests > 0) && (
          <div className="flex items-center gap-3 mt-2 text-xs text-[var(--foreground-muted)]">
            {totalHours > 0 && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {toPersianDigits(totalHours)} ساعت
              </span>
            )}
            {totalTests > 0 && (
              <span className="flex items-center gap-1">
                <Target className="w-3 h-3" />
                {toPersianDigits(totalTests)} تست
              </span>
            )}
          </div>
        )}
      </div>

      {/* ===== Single Task List ===== */}
      {todayTasks.length === 0 ? (
        <div className="surface-1 rounded-2xl p-10 text-center">
          <p className="text-sm text-[var(--foreground-muted)]">برنامه‌ای برای امروز ثبت نشده</p>
          <p className="text-xs text-[var(--foreground-subtle)] mt-1">از بخش «برنامه» تسک اضافه کنید</p>
        </div>
      ) : (
        <SortableTaskList
          tasks={todayTasks}
          onComplete={handleComplete}
          onSkip={handleSkip}
          onDelete={handleDelete}
          onSettings={handlePartialOpen}
          onReset={handleReset}
          onReorder={reorderTasks}
        />
      )}

      {/* Partial completion sheet */}
      <PartialCompletionSheet
        task={partialTask}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onSave={handlePartialSave}
      />
    </div>
  );
}
