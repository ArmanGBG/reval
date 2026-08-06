'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { FieldType, Task } from '@/lib/types';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from '@/components/ui/drawer';
import { TaskSubjectPicker, TaskSelection } from '@/components/shared/TaskSubjectPicker';
import { useAppStore } from '@/lib/store';
import { useCurrentStudentId } from '@/lib/student-utils';

export default function ManualEntrySheet({ open, onOpenChange, selectedDate, existingTaskCount, onSubmit }: {
  open: boolean; onOpenChange: (open: boolean) => void; selectedDate: string;
  existingTaskCount: number; onSubmit: (task: Task) => Promise<void> | void;
}) {
  const { user } = useAppStore();
  const studentId = useCurrentStudentId();
  const [fieldType, setFieldType] = useState<FieldType>('کنکور');
  const [selection, setSelection] = useState<TaskSelection>({});
  const [saving, setSaving] = useState(false);
  const reset = () => { setFieldType('کنکور'); setSelection({}); };
  const submit = async () => {
    if (!selection.subjectId || !selection.subjectName) return toast.error('درس را انتخاب کنید');
    setSaving(true);
    try {
      await onSubmit({ id: crypto.randomUUID(), studentId, subjectId: selection.subjectId,
        subject: selection.subjectName, subjectColor: selection.subjectColor ?? '#3EB489', topic: selection.displayText ?? null,
        fieldType, activityTypes: null, targetTimeMinutes: null, actualTimeMinutes: null,
        targetTestCount: null, actualTestCount: null, completed: null, date: selectedDate,
        order: existingTaskCount + 1, createdBy: 'student', chapterId: selection.chapterId ?? null, topicId: selection.topicId ?? null,
        topicModeId: selection.topicModeId ?? null, pageStart: null, pageEnd: null, detailsCompleted: false });
      toast.success('تسک اولیه ثبت شد'); reset(); onOpenChange(false);
    } catch (err) {
      // Show the real server error so the user knows why it failed
      // (e.g. "احراز هویت لازم است" if the session expired)
      const msg = err instanceof Error && err.message ? err.message : 'ثبت تسک ناموفق بود';
      toast.error(msg);
      // If the session expired, reload so the user returns to the login screen
      if (msg.includes('احراز هویت') || msg.includes('نشست')) {
        setTimeout(() => window.location.reload(), 1200);
      }
    } finally { setSaving(false); }
  };
  return <Drawer open={open} onOpenChange={v => { if (!v) reset(); onOpenChange(v); }} direction="bottom">
    <DrawerContent className="surface-2 border-t border-[var(--border-strong)] text-[var(--foreground)] max-h-[85vh]">
      <DrawerHeader className="text-right"><DrawerTitle>افزودن سریع تسک</DrawerTitle><DrawerDescription>فعلاً فقط حوزه و درس را مشخص کنید؛ جزئیات را بعداً تکمیل می‌کنید.</DrawerDescription></DrawerHeader>
      <div className="px-4 space-y-4 overflow-y-auto">
        <div className="flex gap-2">{(['کنکور', 'نهایی'] as FieldType[]).map(ft => <button key={ft} onClick={() => { setFieldType(ft); setSelection({}); }} className={`flex-1 py-3 rounded-xl border ${fieldType === ft ? 'bg-[var(--accent)] text-[var(--bg-deep)]' : 'border-[var(--border)]'}`}>{ft}</button>)}</div>
        <TaskSubjectPicker fieldType={fieldType} grade={user?.grade ?? 'دوازدهم'} major={user?.major ?? 'تجربی'} value={selection} onChange={setSelection} />
      </div>
      <DrawerFooter><button disabled={!selection.subjectId || saving} onClick={submit} className="h-11 rounded-xl bg-[var(--accent)] text-[var(--bg-deep)] font-bold disabled:opacity-40">{saving ? 'در حال ثبت...' : 'ثبت تسک اولیه'}</button></DrawerFooter>
    </DrawerContent>
  </Drawer>;
}
