'use client';

import { useEffect, useState } from 'react';
import { BookOpenCheck } from 'lucide-react';
import { toast } from 'sonner';
import type { Task } from '@/lib/types';
import { useAppStore } from '@/lib/store';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PersianDatePicker } from '@/components/shared/PersianDatePicker';
import { formatPersianDateFromISO } from '@/lib/persian-date';

/**
 * Creates (or views) the homework task for a class/video task — the same
 * pattern as the exam-analysis task: a linked educational-test task whose
 * date the user picks (not necessarily the class day). The student later
 * fills in test count/time/topic as they see fit; ticking it without details
 * is allowed (they just get a nudge to fill details for richer analytics).
 */
export function ClassHomeworkDialog({
  classTask,
  open,
  onOpenChange,
  onOpenHomework,
}: {
  classTask: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Opens the homework task's edit sheet (details: topic, tests, time). */
  onOpenHomework: (homeworkId: string) => void;
}) {
  const { addTask, user, userRole } = useAppStore();
  const existing = classTask.homeworkForClass ?? null;
  const [date, setDate] = useState(existing?.date ?? classTask.date);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDate(existing?.date ?? classTask.date);
  }, [classTask.date, existing?.date, open]);

  const save = async () => {
    if (existing) {
      onOpenChange(false);
      onOpenHomework(existing.id);
      return;
    }
    setSaving(true);
    try {
      await addTask({
        id: `temp-homework-${classTask.id}`,
        studentId: classTask.studentId,
        subjectId: classTask.subjectId ?? '',
        subject: classTask.subject,
        subjectColor: classTask.subjectColor,
        topic: null,
        fieldType: null,
        activityTypes: ['تست آموزشی'],
        targetTimeMinutes: null,
        actualTimeMinutes: null,
        targetTestCount: null,
        actualTestCount: null,
        status: 'PENDING',
        completed: null,
        detailsCompleted: false,
        date,
        order: 0,
        createdBy: userRole === 'ADVISOR' ? 'advisor' : 'student',
        createdById: userRole === 'ADVISOR' ? user?.id ?? null : null,
        chapterId: null,
        topicId: null,
        topicIds: [],
        topicModeId: null,
        curriculumMode: null,
        topicModeSubtopicIds: [],
        pageStart: null,
        pageEnd: null,
        bookName: null,
        testDescription: null,
        classHomeworkOfId: classTask.id,
      });
      toast.success('تکلیف این کلاس به برنامه اضافه شد');
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'ثبت تکلیف کلاس ناموفق بود');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-w-[calc(100%-2rem)] rounded-2xl border-[var(--border-strong)] bg-[var(--bg-overlay)] text-[var(--foreground)] sm:max-w-md">
        <DialogHeader className="text-right">
          <span className="mb-2 flex size-10 items-center justify-center rounded-xl border border-[var(--accent)]/25 bg-[var(--accent-soft)] text-[var(--accent)]"><BookOpenCheck className="size-5" /></span>
          <DialogTitle>{existing ? 'مشاهده تکلیف این کلاس' : 'افزودن تکلیف این کلاس'}</DialogTitle>
          <DialogDescription>
            {classTask.subject}{classTask.teacherClassName ? ` · ${classTask.teacherClassName}` : ''}{classTask.sessionNumber ? ` · ${classTask.sessionNumber}` : ''}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {existing ? (
            <p className="rounded-xl border border-[var(--accent)]/20 bg-[var(--accent-soft)] p-3 text-xs leading-6 text-[var(--foreground-muted)]">
              تکلیف این کلاس در تاریخ {formatPersianDateFromISO(existing.date)} به برنامه اضافه شده است. با «مشاهده تکلیف» می‌توانی جزئیات آن را تکمیل کنی.
            </p>
          ) : (
            <>
              <PersianDatePicker value={date} onChange={setDate} label="تاریخ انجام تکلیف" />
              <p className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-3 text-xs leading-6 text-[var(--foreground-muted)]">
                یک تسک «تست آموزشی» برای این کلاس ساخته می‌شود. جزئیات آن (تعداد تست، زمان و مبحث) را خود دانش‌آموز بعداً بسته به معلمش تکمیل می‌کند و نیازی به پرکردن فوری نیست.
              </p>
            </>
          )}
        </div>
        <DialogFooter>
          <button
            type="button"
            disabled={saving}
            onClick={save}
            className="h-11 w-full rounded-xl bg-[var(--accent)] px-5 text-sm font-bold text-[var(--bg-deep)] disabled:opacity-50 sm:w-auto"
          >
            {saving ? 'در حال ذخیره...' : existing ? 'مشاهده تکلیف' : 'افزودن تکلیف'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Nudge shown when the student ticks a class-homework task without details. */
export function homeworkNudgeMessage(): string {
  return 'بهتره تایم و تعداد تست و مبحث دقیق تکلیفت رو مشخص کنی تا آنالیز جامع باشه';
}

/** Is this task a class-homework task with no student-filled details yet? */
export function isHomeworkWithoutDetails(task: Pick<Task, 'classHomeworkOfId' | 'targetTimeMinutes' | 'targetTestCount' | 'chapterId' | 'topicIds' | 'topicModeId'>): boolean {
  return task.classHomeworkOfId != null
    && task.targetTimeMinutes == null
    && task.targetTestCount == null
    && task.chapterId == null
    && (task.topicIds?.length ?? 0) === 0
    && task.topicModeId == null;
}
