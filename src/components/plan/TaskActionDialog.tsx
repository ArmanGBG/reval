'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarDays, Inbox, Trash2, ChevronLeft, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { PersianCalendar } from './PersianCalendar';
import { Task } from '@/lib/types';
import { formatPersianDate, getPersianWeekdayName } from '@/lib/persian-date';
import { parseLocalDate } from '@/lib/student-utils';

type ActionMode = 'menu' | 'move-date';

interface TaskActionDialogProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMoveDate: (taskId: string, newDate: string) => void;
  onMoveToIncomplete: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  /** task counts per date — passed to the calendar for indicators */
  taskCountByDate?: Record<string, number>;
}

/**
 * Task action dialog — opens when the user clicks the X / dismiss button on a
 * task card. Replaces the old "skip" (mark as completed=false) behavior with a
 * 3-way choice:
 *
 *   1. انتقال به روز مشخص — pick a day from the Persian calendar; the task
 *      moves to that day and shows up in its daily plan.
 *   2. انتقال به ناقصی‌ها — marks detailsCompleted=false so the task leaves
 *      the daily plan and appears in the "ناقصی‌ها" tab for later completion.
 *   3. حذف کل تسک — permanently deletes the task.
 */
export function TaskActionDialog({
  task,
  open,
  onOpenChange,
  onMoveDate,
  onMoveToIncomplete,
  onDelete,
  taskCountByDate = {},
}: TaskActionDialogProps) {
  const [mode, setMode] = useState<ActionMode>('menu');
  const [pickedDate, setPickedDate] = useState<string>('');

  // Reset to the menu whenever the dialog re-opens or the task changes.
  useEffect(() => {
    if (open) {
      setMode('menu');
      setPickedDate(task?.date ?? '');
    }
  }, [open, task?.id]);

  const handleClose = () => {
    onOpenChange(false);
  };

  const handlePickMoveDate = () => setMode('move-date');

  const handleConfirmMoveDate = () => {
    if (!task || !pickedDate) return;
    onMoveDate(task.id, pickedDate);
    handleClose();
  };

  const handleMoveToIncomplete = () => {
    if (!task) return;
    onMoveToIncomplete(task.id);
    handleClose();
  };

  const handleDelete = () => {
    if (!task) return;
    onDelete(task.id);
    handleClose();
  };

  const pickedDateLabel = pickedDate
    ? `${getPersianWeekdayName(parseLocalDate(pickedDate))} · ${formatPersianDate(parseLocalDate(pickedDate))}`
    : '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="surface-2 border-[var(--border-strong)] text-[var(--foreground)] max-w-[calc(100%-2rem)] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[var(--foreground)] text-right text-base">
            {mode === 'menu' ? 'با این تسک چی کار کنم؟' : 'انتقال به روز مشخص'}
          </DialogTitle>
          <DialogDescription className="text-[var(--foreground-muted)] text-right text-xs">
            {task?.subject}
            {task?.topic ? ` - ${task.topic}` : ''}
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {mode === 'menu' ? (
            <motion.div
              key="menu"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-2.5 py-1"
            >
              {/* Option 1: Move to a specific day */}
              <button
                onClick={handlePickMoveDate}
                className="group w-full flex items-center gap-3 p-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] hover:border-[var(--accent)]/40 hover:bg-[var(--accent-soft)] transition-all text-right min-h-[56px]"
              >
                <div className="w-10 h-10 rounded-lg bg-[var(--accent-soft)] flex items-center justify-center shrink-0">
                  <CalendarDays className="w-5 h-5 text-[var(--accent)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-[var(--foreground)]">انتقال به روز مشخص</div>
                  <div className="text-xs text-[var(--foreground-muted)] mt-0.5">با انتخاب روز از تقویم، تسک در اون روز نمایش داده میشه</div>
                </div>
                <ChevronLeft className="w-4 h-4 text-[var(--foreground-subtle)] flip-rtl group-hover:text-[var(--accent)] transition-colors" />
              </button>

              {/* Option 2: Move to incompletes */}
              <button
                onClick={handleMoveToIncomplete}
                className="group w-full flex items-center gap-3 p-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] hover:border-[var(--warning)]/40 hover:bg-[rgba(216,150,20,0.08)] transition-all text-right min-h-[56px]"
              >
                <div className="w-10 h-10 rounded-lg bg-[rgba(216,150,20,0.12)] flex items-center justify-center shrink-0">
                  <Inbox className="w-5 h-5 text-[var(--warning)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-[var(--foreground)]">انتقال به ناقصی‌ها</div>
                  <div className="text-xs text-[var(--foreground-muted)] mt-0.5">برای تکمیل بعدی به تب ناقصی‌ها منتقل میشه</div>
                </div>
                <ChevronLeft className="w-4 h-4 text-[var(--foreground-subtle)] flip-rtl group-hover:text-[var(--warning)] transition-colors" />
              </button>

              {/* Option 3: Delete */}
              <button
                onClick={handleDelete}
                className="group w-full flex items-center gap-3 p-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] hover:border-[var(--danger)]/40 hover:bg-[rgba(229,72,77,0.08)] transition-all text-right min-h-[56px]"
              >
                <div className="w-10 h-10 rounded-lg bg-[rgba(229,72,77,0.12)] flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5 text-[var(--danger)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-[var(--foreground)]">حذف کل تسک</div>
                  <div className="text-xs text-[var(--foreground-muted)] mt-0.5">تسک برای همیشه حذف میشه</div>
                </div>
                <ChevronLeft className="w-4 h-4 text-[var(--foreground-subtle)] flip-rtl group-hover:text-[var(--danger)] transition-colors" />
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="move-date"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="py-1"
            >
              {/* Calendar picker */}
              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-base)] p-3">
                <PersianCalendar
                  selectedDate={pickedDate}
                  onSelect={setPickedDate}
                  taskCountByDate={taskCountByDate}
                />
              </div>

              {/* Picked date label + confirm */}
              {pickedDate && (
                <div className="mt-3 flex items-center justify-between gap-2 px-1">
                  <span className="text-xs text-[var(--foreground-muted)]">
                    روز انتخابی: <span className="text-[var(--foreground)] font-medium">{pickedDateLabel}</span>
                  </span>
                </div>
              )}

              <div className="flex gap-2 pt-4 mt-2 border-t border-[var(--border)]">
                <button
                  onClick={() => setMode('menu')}
                  className="btn-hover flex-1 h-10 rounded-lg border border-[var(--border)] text-[var(--foreground-muted)] text-sm font-medium"
                >
                  بازگشت
                </button>
                <button
                  onClick={handleConfirmMoveDate}
                  disabled={!pickedDate}
                  className="btn-hover glow-hover flex-1 h-10 rounded-lg bg-[var(--accent)] text-[var(--bg-deep)] font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  انتقال
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {mode === 'menu' && (
          <div className="pt-3 mt-1 border-t border-[var(--border)]">
            <button
              onClick={handleClose}
              className="btn-hover w-full h-10 rounded-lg border border-[var(--border)] text-[var(--foreground-muted)] text-sm font-medium"
            >
              انصراف
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
