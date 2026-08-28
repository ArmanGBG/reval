'use client';

import { useEffect, useState } from 'react';
import { BookOpen, ChevronDown, ClipboardCheck, X } from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '@/lib/store';
import type { ExamScope, FieldType } from '@/lib/types';
import { TaskSubjectPicker, type TaskSelection } from '@/components/shared/TaskSubjectPicker';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PersianDatePicker } from '@/components/shared/PersianDatePicker';
import { toISODate } from '@/lib/persian-date';

const EXAM_RED = '#E57373';

export function ExamModal({
  open,
  onOpenChange,
  studentId,
  selectedDate,
  grade,
  major,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  selectedDate?: string;
  grade?: string;
  major?: string;
}) {
  const { addExam, user } = useAppStore();
  const [scope, setScope] = useState<ExamScope>('COMPREHENSIVE');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(selectedDate ?? toISODate(new Date()));
  const [startTime, setStartTime] = useState('08:00');
  const [duration, setDuration] = useState(90);
  const [fieldType, setFieldType] = useState<FieldType | null>(null);
  const [selection, setSelection] = useState<TaskSelection>({});
  const [showDetails, setShowDetails] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDate(selectedDate ?? toISODate(new Date()));
    fetch(`/api/exam-suggestions?studentId=${encodeURIComponent(studentId)}`)
      .then((response) => response.ok ? response.json() : { values: [] })
      .then((data) => setSuggestions(Array.isArray(data.values) ? data.values : []))
      .catch(() => setSuggestions([]));
  }, [open, selectedDate, studentId]);

  const reset = () => {
    setScope('COMPREHENSIVE');
    setTitle('');
    setDescription('');
    setDate(selectedDate ?? toISODate(new Date()));
    setStartTime('08:00');
    setDuration(90);
    setFieldType(null);
    setSelection({});
    setShowDetails(false);
    setSuggestions([]);
  };

  const removeSuggestion = async (value: string) => {
    setSuggestions((current) => current.filter((item) => item !== value));
    try {
      const response = await fetch('/api/exam-suggestions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, value }),
      });
      if (!response.ok) throw new Error();
      if (title === value) setTitle('');
    } catch {
      setSuggestions((current) => current.includes(value) ? current : [value, ...current]);
      toast.error('حذف پیشنهاد نام آزمون انجام نشد');
    }
  };

  const selectScope = (nextScope: ExamScope) => {
    setScope(nextScope);
    setSelection({});
    setFieldType(null);
    setShowDetails(false);
  };

  const handleSubmit = async () => {
    if (!title.trim()) return toast.error('نام آزمون را وارد کنید');
    if (!date) return toast.error('تاریخ آزمون را انتخاب کنید');
    if (scope === 'SUBJECT' && !selection.subjectId) return toast.error('درس آزمون را انتخاب کنید');
    setSaving(true);
    try {
      const hasCurriculumDetails = Boolean(selection.chapterId || selection.topicModeId);
      await addExam({
        title: title.trim(),
        scope,
        description: description.trim() || null,
        subject: scope === 'COMPREHENSIVE' ? 'آزمون جامع' : selection.subjectName!,
        subjectColor: scope === 'COMPREHENSIVE' ? EXAM_RED : selection.subjectColor ?? EXAM_RED,
        subjectId: scope === 'SUBJECT' ? selection.subjectId ?? null : null,
        fieldType: scope === 'SUBJECT' ? fieldType : null,
        chapterId: hasCurriculumDetails ? selection.chapterId ?? null : null,
        topicId: hasCurriculumDetails ? selection.topicId ?? null : null,
        topicModeId: hasCurriculumDetails ? selection.topicModeId ?? null : null,
        curriculumMode: hasCurriculumDetails ? selection.curriculumMode ?? null : null,
        curriculumLabel: hasCurriculumDetails ? selection.displayText ?? null : null,
        pageStart: hasCurriculumDetails ? selection.pageStart ?? null : null,
        pageEnd: hasCurriculumDetails ? selection.pageEnd ?? null : null,
        date,
        startTime,
        duration,
        studentIds: [studentId],
        status: 'upcoming',
      });
      toast.success('آزمون ثبت شد');
      reset();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'ثبت آزمون ناموفق بود');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) reset(); onOpenChange(next); }}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto rounded-2xl border-[var(--border-strong)] bg-[var(--bg-overlay)] text-[var(--foreground)] sm:max-w-xl" dir="rtl">
        <DialogHeader className="text-right">
          <div className="mb-2 flex size-10 items-center justify-center rounded-xl border border-[#E57373]/30 bg-[#E57373]/10 text-[#EF9A9A]">
            <ClipboardCheck className="size-5" aria-hidden="true" />
          </div>
          <DialogTitle>ثبت آزمون</DialogTitle>
          <DialogDescription>آزمون جامع به درس نیاز ندارد؛ اتصال آزمون تک‌درسی به فصل و مبحث اختیاری است.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-[var(--bg-elevated)] p-1">
            <button type="button" onClick={() => selectScope('COMPREHENSIVE')} className={`min-h-11 rounded-lg border text-sm font-semibold ${scope === 'COMPREHENSIVE' ? 'border-[#E57373]/50 bg-[#E57373]/15 text-[#EF9A9A]' : 'border-transparent text-[var(--foreground-muted)]'}`}>آزمون جامع</button>
            <button type="button" onClick={() => selectScope('SUBJECT')} className={`min-h-11 rounded-lg border text-sm font-semibold ${scope === 'SUBJECT' ? 'border-[#E57373]/50 bg-[#E57373]/15 text-[#EF9A9A]' : 'border-transparent text-[var(--foreground-muted)]'}`}>تک‌درسی</button>
          </div>

          <label className="block text-xs text-[var(--foreground-muted)]">
            نام آزمون
            {suggestions.length > 0 && <span className="mt-2 flex flex-wrap gap-1.5">{suggestions.map((suggestion) => <span key={suggestion} className="inline-flex items-center overflow-hidden rounded-lg border border-[#E57373]/25 bg-[#E57373]/10 text-[11px] text-[#EF9A9A]"><button type="button" onClick={() => setTitle(suggestion)} className="min-h-8 px-2.5">{suggestion}</button><button type="button" onClick={() => removeSuggestion(suggestion)} className="flex size-8 items-center justify-center border-r border-[#E57373]/20" aria-label={`حذف پیشنهاد ${suggestion}`}><X className="size-3" /></button></span>)}</span>}
            <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="مثلاً آزمون قلم‌چی ۲۱ شهریور" className="mt-2 h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-3 text-sm outline-none focus:border-[#E57373]/60" />
          </label>

          {scope === 'SUBJECT' && (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-3">
              <div className="mb-3 flex items-center gap-2 text-xs font-semibold"><BookOpen className="size-4 text-[#EF9A9A]" />درس آزمون</div>
              <TaskSubjectPicker
                fieldType={fieldType}
                grade={grade ?? user?.grade ?? 'دوازدهم'}
                major={major ?? user?.major ?? 'تجربی'}
                value={selection}
                onChange={setSelection}
                onFieldTypeChange={(nextFieldType, nextSelection) => { setFieldType(nextFieldType); if (nextSelection) setSelection(nextSelection); }}
                allGrades
                allowClassVideo={false}
                allowSubjectOnlySelection
              />
            </div>
          )}

          <button type="button" onClick={() => setShowDetails((current) => !current)} className="flex min-h-11 w-full items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-3 text-right text-xs font-semibold">
            توضیحات و تنظیمات آزمون
            <ChevronDown className={`size-4 transition-transform ${showDetails ? 'rotate-180' : ''}`} />
          </button>

          {showDetails && <div className="space-y-3 rounded-xl border border-[var(--border)] p-3">
            <label className="block text-xs text-[var(--foreground-muted)]">توضیحات (اختیاری)<textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} placeholder="توضیحات مشاور یا نکات آزمون" className="mt-1.5 w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-3 text-sm outline-none focus:border-[#E57373]/60" /></label>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs text-[var(--foreground-muted)]">ساعت شروع<input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} className="mt-1.5 h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-3" /></label>
              <label className="text-xs text-[var(--foreground-muted)]">مدت (دقیقه)<input type="number" min={1} value={duration} onChange={(event) => setDuration(Number(event.target.value))} className="mt-1.5 h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-3" /></label>
            </div>
          </div>}

          <PersianDatePicker value={date} onChange={setDate} label="تاریخ آزمون" />
        </div>

        <DialogFooter>
          <button type="button" disabled={saving} onClick={handleSubmit} className="h-11 w-full rounded-xl bg-[#E57373] px-6 text-sm font-bold text-[#241315] disabled:opacity-50 sm:w-auto">{saving ? 'در حال ثبت...' : 'ثبت آزمون'}</button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
