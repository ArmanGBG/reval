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
  const { createExamAnalysisTask, updateExamAnalysisTask } = useAppStore();
  const existing = exam.analysisTasks?.find((task) => task.studentId === studentId) ?? null;
  const [date, setDate] = useState(existing?.date ?? exam.date);
  const [advisorNote, setAdvisorNote] = useState(existing?.advisorNote ?? '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDate(existing?.date ?? exam.date);
    setAdvisorNote(existing?.advisorNote ?? '');
  }, [exam.date, existing?.advisorNote, existing?.date, open]);

  const save = async () => {
    setSaving(true);
    try {
      if (existing) {
        if (!isAdvisor) {
          toast.info('تسک تحلیل این آزمون قبلاً به برنامه اضافه شده است');
          onOpenChange(false);
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
        <DialogFooter><button type="button" disabled={saving} onClick={save} className="h-11 w-full rounded-xl bg-[#E57373] px-5 text-sm font-bold text-[#241315] disabled:opacity-50 sm:w-auto">{saving ? 'در حال ذخیره...' : existing ? isAdvisor ? 'ذخیره توضیحات' : 'مشاهده در برنامه' : 'افزودن تسک تحلیل'}</button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
