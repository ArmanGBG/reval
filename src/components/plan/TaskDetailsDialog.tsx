'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { ActivityType, Task } from '@/lib/types';
import { TaskSelection, TaskSubjectPicker } from '@/components/shared/TaskSubjectPicker';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

const ACTIVITIES: ActivityType[] = ['مطالعه', 'مرور', 'تست آموزشی', 'تست سنجشی'];

export function TaskDetailsDialog({ task, open, onOpenChange, grade, major, onSave }: {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  grade: string;
  major: string;
  onSave: (updates: Partial<Task>) => Promise<void> | void;
}) {
  if (!task) return null;
  return <TaskDetailsForm key={task.id} task={task} open={open} onOpenChange={onOpenChange} grade={grade} major={major} onSave={onSave} />;
}

function TaskDetailsForm({ task, open, onOpenChange, grade, major, onSave }: {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  grade: string;
  major: string;
  onSave: (updates: Partial<Task>) => Promise<void> | void;
}) {
  const [selection, setSelection] = useState<TaskSelection>({ subjectId: task.subjectId ?? undefined, subjectName: task.subject, subjectColor: task.subjectColor, displayText: task.topic ?? undefined, chapterId: task.chapterId ?? undefined, topicId: task.topicId ?? undefined, topicModeId: task.topicModeId ?? undefined });
  const [activities, setActivities] = useState<ActivityType[]>(task.activityTypes ?? []);
  const [minutes, setMinutes] = useState(task.targetTimeMinutes == null ? '' : String(task.targetTimeMinutes));
  const [tests, setTests] = useState(task.targetTestCount == null ? '' : String(task.targetTestCount));
  const [pageStart, setPageStart] = useState(task.pageStart == null ? '' : String(task.pageStart));
  const [pageEnd, setPageEnd] = useState(task.pageEnd == null ? '' : String(task.pageEnd));
  const [saving, setSaving] = useState(false);

  const valid = !!selection.subjectName && !!selection.displayText && activities.length > 0 && Number(minutes) > 0;
  const submit = async () => {
    if (!valid) return toast.error('مبحث، نوع فعالیت و زمان را کامل کنید');
    setSaving(true);
    try {
      await onSave({
        subjectId: selection.subjectId ?? task.subjectId ?? null,
        subject: selection.subjectName!, subjectColor: selection.subjectColor ?? task.subjectColor,
        topic: selection.displayText!, chapterId: selection.chapterId ?? null,
        topicId: selection.topicId ?? null, topicModeId: selection.topicModeId ?? null,
        pageStart: pageStart ? Number(pageStart) : null, pageEnd: pageEnd ? Number(pageEnd) : null,
        activityTypes: activities, targetTimeMinutes: Number(minutes),
        targetTestCount: tests ? Number(tests) : 0, detailsCompleted: true,
      });
      toast.success('جزئیات تسک ذخیره شد');
      onOpenChange(false);
    } catch { toast.error('ذخیره جزئیات ناموفق بود'); }
    finally { setSaving(false); }
  };

  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="surface-2 border-[var(--border-strong)] text-[var(--foreground)] max-h-[90vh] overflow-y-auto" dir="rtl">
      <DialogHeader><DialogTitle>تکمیل جزئیات تسک</DialogTitle><DialogDescription>{task.subject} · {task.fieldType}</DialogDescription></DialogHeader>
      <div className="space-y-4">
        <TaskSubjectPicker fieldType={task.fieldType} grade={grade} major={major} value={selection} onChange={setSelection} />
        <div><label className="text-xs text-[var(--foreground-muted)]">نوع فعالیت</label><div className="flex flex-wrap gap-2 mt-2">{ACTIVITIES.map(a => <button key={a} onClick={() => setActivities(v => v.includes(a) ? v.filter(x => x !== a) : [...v, a])} className={`px-3 py-2 rounded-lg border text-xs ${activities.includes(a) ? 'bg-[var(--accent)] text-[var(--bg-deep)]' : 'border-[var(--border)]'}`}>{a}</button>)}</div></div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="زمان (دقیقه)" value={minutes} onChange={setMinutes} />
          <Field label="تعداد تست" value={tests} onChange={setTests} />
          <Field label="صفحه شروع" value={pageStart} onChange={setPageStart} />
          <Field label="صفحه پایان" value={pageEnd} onChange={setPageEnd} />
        </div>
        <button disabled={!valid || saving} onClick={submit} className="w-full h-11 rounded-xl bg-[var(--accent)] text-[var(--bg-deep)] font-bold disabled:opacity-40">{saving ? 'در حال ذخیره...' : 'ذخیره و تکمیل جزئیات'}</button>
      </div>
    </DialogContent>
  </Dialog>;
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="text-xs text-[var(--foreground-muted)]">{label}<input type="number" min="0" value={value} onChange={e => onChange(e.target.value)} className="mt-1.5 w-full h-10 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] px-3 text-[var(--foreground)]" dir="ltr" /></label>;
}
