'use client';

import { useEffect, useMemo, useState } from 'react';
import { ClipboardCheck, Save } from 'lucide-react';
import { toast } from 'sonner';
import type { Exam } from '@/lib/types';
import { useAppStore } from '@/lib/store';
import { formatPersianDateFromISO, toPersianDigits } from '@/lib/persian-date';
import { LifecycleStatusBadge } from '@/components/shared/LifecycleStatusBadge';

function SubjectAnalysisEditor({ exam, studentId }: { exam: Exam; studentId: string }) {
  const { saveExamSubjectAnalysis } = useAppStore();
  const existing = exam.subjectAnalyses?.filter((item) => item.studentId === studentId) ?? [];
  const [subjectName, setSubjectName] = useState(exam.scope === 'SUBJECT' ? exam.subject : '');
  const selected = existing.find((item) => item.subjectName === subjectName);
  const [analyzed, setAnalyzed] = useState(selected?.analyzed ?? false);
  const [note, setNote] = useState(selected?.note ?? '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const current = existing.find((item) => item.subjectName === subjectName);
    setAnalyzed(current?.analyzed ?? false);
    setNote(current?.note ?? '');
  }, [exam.subjectAnalyses, subjectName]);

  const save = async () => {
    if (!subjectName.trim()) return toast.error('نام درس را وارد کنید');
    setSaving(true);
    try {
      await saveExamSubjectAnalysis(exam.id, { studentId, subjectName: subjectName.trim(), analyzed, note: note.trim() || null });
      toast.success('وضعیت تحلیل درس ذخیره شد');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'ذخیره تحلیل درس ناموفق بود');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-3">
      <p className="mb-3 text-xs font-bold text-[var(--foreground)]">ثبت تحلیل هر درس</p>
      {existing.length > 0 && <div className="mb-3 flex flex-wrap gap-1.5">{existing.map((item) => <button key={item.subjectName} type="button" onClick={() => setSubjectName(item.subjectName)} className={`rounded-lg border px-2.5 py-1.5 text-[10px] ${item.analyzed ? 'border-[var(--accent)]/30 bg-[var(--accent-soft)] text-[var(--accent)]' : 'border-[var(--warning)]/30 bg-[var(--warning)]/10 text-[var(--warning)]'}`}>{item.subjectName} · {item.analyzed ? 'بررسی شده' : 'بررسی نشده'}</button>)}</div>}
      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
        <input value={subjectName} onChange={(event) => setSubjectName(event.target.value)} disabled={exam.scope === 'SUBJECT'} placeholder="نام درس، مثلاً زیست" className="h-10 rounded-lg border border-[var(--border)] bg-[var(--bg-base)] px-3 text-sm outline-none focus:border-[var(--accent)] disabled:opacity-70" />
        <button type="button" onClick={() => setAnalyzed((value) => !value)} className={`min-h-10 rounded-lg border px-3 text-xs font-semibold ${analyzed ? 'border-[var(--accent)]/30 bg-[var(--accent-soft)] text-[var(--accent)]' : 'border-[var(--warning)]/30 bg-[var(--warning)]/10 text-[var(--warning)]'}`}>وضعیت درس: {analyzed ? 'بررسی شده' : 'بررسی نشده'}</button>
      </div>
      <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={3} placeholder="مشکل، نکته یا بخشی که در تحلیل این درس داشتی..." className="mt-2 w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--bg-base)] p-3 text-xs leading-6 outline-none focus:border-[var(--accent)]" />
      <button type="button" disabled={saving} onClick={save} className="mt-2 inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-[var(--accent)] px-4 text-xs font-bold text-[var(--bg-deep)] disabled:opacity-50"><Save className="size-3.5" />ذخیره تحلیل درس</button>
    </div>
  );
}

export function ExamHistory({ studentId, isAdvisor, embedded = false }: { studentId: string; isAdvisor: boolean; embedded?: boolean }) {
  const { exams, examsLoading, loadExams } = useAppStore();
  useEffect(() => { void loadExams({ studentId }); }, [loadExams, studentId]);
  const history = useMemo(() => exams.filter((exam) => exam.studentIds.includes(studentId)).sort((a, b) => b.date.localeCompare(a.date)), [exams, studentId]);
  const analyzedCount = history.filter((exam) => exam.analysisTasks?.some((task) => task.studentId === studentId && task.status === 'COMPLETED')).length;

  return (
    <section className={embedded ? 'space-y-4' : 'mx-auto max-w-4xl space-y-5 px-4 py-6 md:px-0 md:py-8'} dir="rtl">
      {!embedded && <header><h1 className="text-2xl font-bold text-[var(--foreground)] md:text-3xl">سابقه آزمون‌ها</h1><p className="mt-1 text-sm text-[var(--foreground-muted)]">تاریخچه آزمون‌ها، نتایج و وضعیت تحلیل هر آزمون</p></header>}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-3 text-center"><p className="text-lg font-bold">{toPersianDigits(history.length)}</p><p className="text-[10px] text-[var(--foreground-muted)]">کل آزمون‌ها</p></div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-3 text-center"><p className="text-lg font-bold text-[var(--accent)]">{toPersianDigits(analyzedCount)}</p><p className="text-[10px] text-[var(--foreground-muted)]">تحلیل کامل</p></div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-3 text-center"><p className="text-lg font-bold text-[var(--warning)]">{toPersianDigits(Math.max(0, history.length - analyzedCount))}</p><p className="text-[10px] text-[var(--foreground-muted)]">تحلیل‌نشده</p></div>
      </div>
      {examsLoading ? <div className="rounded-xl border border-[var(--border)] p-8 text-center text-sm text-[var(--foreground-muted)]">در حال دریافت سابقه آزمون‌ها...</div> : history.length === 0 ? <div className="rounded-xl border border-dashed border-[var(--border)] p-10 text-center"><ClipboardCheck className="mx-auto size-7 text-[var(--foreground-subtle)]" /><p className="mt-3 text-sm">سابقه آزمونی وجود ندارد.</p></div> : <div className="space-y-3">{history.map((exam) => {
        const task = exam.analysisTasks?.find((item) => item.studentId === studentId);
        const subjectAnalyses = exam.subjectAnalyses?.filter((item) => item.studentId === studentId) ?? [];
        return <article key={exam.id} className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-sm font-bold text-[var(--foreground)]">{exam.title}</h2><p className="mt-1 text-[11px] text-[var(--foreground-muted)]">{exam.subject} · {formatPersianDateFromISO(exam.date)}</p></div>{task ? <LifecycleStatusBadge status={task.status} showPending /> : <span className="inline-flex rounded-md border border-[var(--border-strong)] bg-[var(--surface-glass)] px-2 py-1 text-[10px] font-bold text-[var(--foreground-muted)]">تحلیل ساخته نشده</span>}</div>{task?.advisorNote && <p className="mt-3 rounded-lg border border-[var(--accent)]/20 bg-[var(--accent-soft)] px-3 py-2 text-xs leading-6"><strong className="text-[var(--accent)]">توضیح مشاور:</strong> {task.advisorNote}</p>}{isAdvisor && subjectAnalyses.length > 0 && <div className="mt-3 space-y-2"><p className="text-[10px] text-[var(--foreground-subtle)]">وضعیت بررسی درس‌ها مستقل از وضعیت کلی تسک تحلیل است.</p>{subjectAnalyses.map((item) => <div key={item.id} className="rounded-lg border border-[var(--border)] bg-[var(--bg-base)] px-3 py-2 text-xs"><div className="flex justify-between gap-2"><strong>{item.subjectName}</strong><span className={item.analyzed ? 'text-[var(--accent)]' : 'text-[var(--warning)]'}>{item.analyzed ? 'بررسی شده' : 'بررسی نشده'}</span></div>{item.note && <p className="mt-1 leading-6 text-[var(--foreground-muted)]">{item.note}</p>}</div>)}</div>}{!isAdvisor && <SubjectAnalysisEditor exam={exam} studentId={studentId} />}</article>;
      })}</div>}
    </section>
  );
}
