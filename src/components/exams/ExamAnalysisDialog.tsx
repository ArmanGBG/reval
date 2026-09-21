'use client';

import { useEffect, useState } from 'react';
import { ClipboardCheck } from 'lucide-react';
import { toast } from 'sonner';
import type { Exam, ExamAnalysisTask } from '@/lib/types';
import { useAppStore } from '@/lib/store';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PersianDatePicker } from '@/components/shared/PersianDatePicker';

export function ExamAnalysisDialog({
  exam,
  studentId,
  isAdvisor,
  open,
  onOpenChange,
}: {
  exam: Exam;
  studentId: string;
  isAdvisor: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { createExamAnalysisTask, updateExamAnalysisTask, navigateTo, setSelectedDate } = useAppStore();
  const existing = exam.analysisTasks?.find((task) => task.studentId === studentId) ?? null;
  const [date, setDate] = useState(existing?.date ?? exam.date);
  const [advisorNote, setAdvisorNote] = useState(existing?.advisorNote ?? '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDate(existing?.date ?? exam.date);
    setAdvisorNote(existing?.advisorNote ?? '');
  }, [exam.date, existing?.advisorNote, existing?.date, open]);

  // Jump the user to the daily plan view pinned to the analysis task's date.
  // - Student: opens the daily plan with the task's scheduled date selected.
  // - Advisor: opens the selected student's workspace (their daily plan is
  //   the default tab) so they can see the same task in context. The
  //   AdvisorStudentDetail component syncs its `selectedDate` from the store
  //   on mount, so setting it here is enough.
  const goToPlan = () => {
    const targetDate = existing?.date ?? date;
    setSelectedDate(targetDate);
    if (isAdvisor) {
      navigateTo({ view: 'advisor-student-detail', selectedStudentId: studentId });
    } else {
      navigateTo({ view: 'plan', planTab: 'daily' });
    }
    onOpenChange(false);
  };

  const save = async () => {
    setSaving(true);
    try {
      if (existing) {
        if (!isAdvisor) {
          // Student reopens an existing analysis task — jump straight to the
          // daily plan view, pinned to the task's scheduled date. Previously
          // this showed a misleading "already added" toast and closed the
          // dialog without any navigation.
          goToPlan();
          return;
        }
        await updateExamAnalysisTask(exam.id, { studentId, date, advisorNote: advisorNote.trim() || null });
        toast.success('توضیحات تسک تحلیل به‌روزرسانی شد');
      } else {
        await createExamAnalysisTask(exam.id, { studentId, date, ...(isAdvisor ? { advisorNote: advisorNote.trim() || null } : {}) });
        toast.success('تسک تحلیل آزمون به برنامه اضافه شد');
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'ثبت تسک تحلیل ناموفق بود');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-w-[calc(100%-2rem)] rounded-2xl border-[var(--border-strong)] bg-[var(--bg-overlay)] text-[var(--foreground)] sm:max-w-md">
        <DialogHeader className="text-right">
          <span className="mb-2 flex size-10 items-center justify-center rounded-xl border border-[#E57373]/25 bg-[#E57373]/10 text-[#EF9A9A]"><ClipboardCheck className="size-5" /></span>
          <DialogTitle>{existing ? 'ویرایش تسک تحلیل آزمون' : 'افزودن تسک تحلیل آزمون'}</DialogTitle>
          <DialogDescription>{exam.title} · این تسک مستقل است و فقط به آزمون لینک می‌شود.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <PersianDatePicker value={date} onChange={setDate} label="تاریخ انجام تحلیل" />
          {isAdvisor && <label className="block text-xs text-[var(--foreground-muted)]">توضیح مشاور (اختیاری)<textarea value={advisorNote} onChange={(event) => setAdvisorNote(event.target.value)} rows={4} placeholder="راهنمای تحلیل، بخش‌های مهم یا نکته‌ای برای دانش‌آموز" className="mt-1.5 w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-3 text-sm outline-none focus:border-[#E57373]/50" /></label>}
          {existing && !isAdvisor && <p className="rounded-xl border border-[var(--accent)]/20 bg-[var(--accent-soft)] p-3 text-xs leading-6 text-[var(--foreground-muted)]">این تسک قبلاً ساخته شده و در برنامه قابل انجام، انتقال به ناقصی‌ها و ثبت زمان واقعی است.</p>}
        </div>
        <DialogFooter>
          {/* When the task already exists AND the advisor is editing, show two
              buttons: a primary "save notes" (which calls save() →
              updateExamAnalysisTask) and a secondary "go to plan" shortcut so
              the advisor can jump straight to the student's daily plan
              without re-saving. For students, the single primary button is
              re-purposed as "go to plan" since they can't edit the note. */}
          {existing && isAdvisor ? (
            <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={saving}
                onClick={goToPlan}
                className="h-11 w-full rounded-xl border border-[var(--border-strong)] bg-[var(--bg-elevated)] px-5 text-sm font-bold text-[var(--foreground-muted)] transition-colors hover:border-[var(--accent)]/40 hover:text-[var(--accent)] disabled:opacity-50 sm:w-auto"
              >
                مشاهده در برنامه
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={save}
                className="h-11 w-full rounded-xl bg-[#E57373] px-5 text-sm font-bold text-[#241315] disabled:opacity-50 sm:w-auto"
              >
                {saving ? 'در حال ذخیره...' : 'ذخیره توضیحات'}
              </button>
            </div>
          ) : (
            <button type="button" disabled={saving} onClick={save} className="h-11 w-full rounded-xl bg-[#E57373] px-5 text-sm font-bold text-[#241315] disabled:opacity-50 sm:w-auto">{saving ? 'در حال ذخیره...' : existing ? 'مشاهده در برنامه' : 'افزودن تسک تحلیل'}</button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
