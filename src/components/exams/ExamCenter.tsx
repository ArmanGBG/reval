'use client';

import { useMemo, useState } from 'react';
import { BarChart3, CalendarDays, Check, ClipboardCheck, Clock3, Medal, Plus, RotateCcw, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import type { Exam } from '@/lib/types';
import { useAppStore } from '@/lib/store';
import { formatPersianDateFromISO, toPersianDigits } from '@/lib/persian-date';
import { ExamModal } from '@/components/advisor/ExamModal';
import { ExamResultsModal } from '@/components/advisor/ExamResultsModal';
import { getExamParticipantStatus } from '@/lib/exam-lifecycle';
import { ExamAnalysisDialog } from '@/components/exams/ExamAnalysisDialog';
import { ExamTaskActionDialog } from '@/components/exams/ExamTaskActionDialog';
import { LifecycleStatusBadge } from '@/components/shared/LifecycleStatusBadge';

export function ExamBadge({ exam }: { exam: Exam }) {
  return (
    <span className="inline-flex items-center rounded-md border border-[#E57373]/30 bg-[#E57373]/12 px-2 py-1 text-[10px] font-bold text-[#EF9A9A]">
      {exam.scope === 'COMPREHENSIVE' ? 'آزمون جامع' : 'آزمون تک‌درسی'}
    </span>
  );
}

export function ExamCard({ exam, studentId, canManageResult = false, compact = false }: { exam: Exam; studentId: string; canManageResult?: boolean; compact?: boolean }) {
  const { user, deleteExam, updateExamParticipantStatus } = useAppStore();
  const [resultsOpen, setResultsOpen] = useState(false);
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [actionOpen, setActionOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const ownResult = exam.results.find((result) => result.studentId === studentId);
  const canDelete = exam.createdBy === user?.id;
  const participantStatus = getExamParticipantStatus(exam, studentId);
  const canUpdateStatus = !canManageResult && exam.studentIds.includes(studentId);
  const isCompleted = participantStatus === 'COMPLETED';
  const isIncomplete = participantStatus === 'INCOMPLETE';

  const remove = async () => {
    if (!window.confirm('این آزمون برای همیشه حذف شود؟')) return;
    try {
      await deleteExam(exam.id);
      toast.success('آزمون حذف شد');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'حذف آزمون ناموفق بود');
    }
  };

  const changeStatus = async (status: Parameters<typeof updateExamParticipantStatus>[2]) => {
    setUpdatingStatus(true);
    try {
      await updateExamParticipantStatus(exam.id, studentId, status);
      if (status === 'COMPLETED') {
        toast.success('آزمون انجام شد', {
          style: { background: 'var(--bg-overlay)', border: '1px solid var(--border-strong)', color: 'var(--accent)' },
        });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'تغییر وضعیت آزمون ناموفق بود');
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <article className={`relative overflow-hidden rounded-xl border bg-[#E57373]/[0.06] ${isIncomplete ? 'border-[var(--warning)]/35' : 'border-[#E57373]/25'} ${isCompleted ? 'opacity-60' : ''} ${compact ? 'p-3' : 'p-4'}`}>
      <span className="absolute inset-y-3 right-0 w-1 rounded-l-full bg-[#E57373]" aria-hidden="true" />
      <div className="flex items-start justify-between gap-3 pr-1">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className={`${compact ? 'text-xs' : 'text-sm'} truncate font-bold text-[var(--foreground)] ${isCompleted ? 'line-through' : ''}`}>{exam.title}</h3>
            <ExamBadge exam={exam} />
            <LifecycleStatusBadge status={participantStatus} />
          </div>
          <p className="mt-1 text-[11px] text-[var(--foreground-muted)]">{exam.subject}</p>
        </div>
        {canDelete && <button type="button" onClick={remove} className="flex size-9 shrink-0 items-center justify-center rounded-lg text-[var(--foreground-subtle)] hover:bg-[#E57373]/10 hover:text-[#EF9A9A]" aria-label="حذف آزمون"><Trash2 className="size-4" /></button>}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-[var(--foreground-muted)]">
        <span className="flex items-center gap-1"><CalendarDays className="size-3.5" />{formatPersianDateFromISO(exam.date)}</span>
        <span className="flex items-center gap-1"><Clock3 className="size-3.5" />{toPersianDigits(exam.startTime)} · {toPersianDigits(exam.duration)} دقیقه</span>
        {ownResult?.score != null && <span className="flex items-center gap-1 font-semibold text-[#EF9A9A]"><Medal className="size-3.5" />نمره {toPersianDigits(ownResult.score)} از {toPersianDigits(exam.totalScore)}</span>}
        {ownResult?.rank != null && <span>رتبه {toPersianDigits(ownResult.rank)}</span>}
      </div>
      {exam.description && !compact && <p className="mt-3 border-t border-[#E57373]/15 pt-3 text-xs leading-6 text-[var(--foreground-muted)]">{exam.description}</p>}
      {exam.curriculumLabel && !compact && <p className="mt-2 rounded-lg bg-[var(--bg-elevated)] px-3 py-2 text-[11px] leading-5 text-[var(--foreground-muted)]">محدوده آزمون: {exam.curriculumLabel}{exam.pageStart != null && exam.pageEnd != null ? ` · صفحات ${toPersianDigits(exam.pageStart)} تا ${toPersianDigits(exam.pageEnd)}` : ''}</p>}
      {canUpdateStatus && <div className="mt-3 flex items-center gap-1.5 md:gap-2 border-t border-[#E57373]/15 pt-3">
        {!isCompleted ? (
          <>
            <button
              type="button"
              disabled={updatingStatus}
              onClick={() => changeStatus('COMPLETED')}
              className="icon-btn size-10 rounded-lg bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--border-strong)] flex items-center justify-center hover:bg-[var(--accent-soft)] hover:border-[var(--accent)] disabled:opacity-50"
              aria-label="انجام شد"
            >
              <Check className="w-4 h-4 md:w-5 md:h-5" />
            </button>
            <button
              type="button"
              disabled={updatingStatus}
              onClick={() => setActionOpen(true)}
              className="icon-btn size-10 rounded-lg bg-[rgba(229,72,77,0.12)] text-[var(--danger)] border border-[rgba(229,72,77,0.2)] flex items-center justify-center hover:bg-[rgba(229,72,77,0.18)] hover:border-[var(--danger)] disabled:opacity-50"
              aria-label="عملیات تسک"
            >
              <X className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              disabled={updatingStatus}
              onClick={() => changeStatus('PENDING')}
              className="icon-btn size-9 rounded-md text-[var(--foreground-subtle)] hover:text-[var(--accent)] hover:bg-[var(--accent-soft)] flex items-center justify-center disabled:opacity-50"
              aria-label="بازگشت به حالت قبل"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            {canDelete && <button
              type="button"
              onClick={remove}
              className="icon-btn size-9 rounded-md text-[var(--foreground-subtle)] hover:text-[var(--danger)] hover:bg-[rgba(229,72,77,0.08)] flex items-center justify-center"
              aria-label="حذف آزمون"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>}
          </>
        )}
      </div>}
      <button type="button" onClick={() => setAnalysisOpen(true)} className="mt-3 inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-[#E57373]/30 bg-[#E57373]/10 px-3 text-xs font-semibold text-[#EF9A9A]"><BarChart3 className="size-3.5" />{exam.analysisTasks?.some((task) => task.studentId === studentId) ? 'مشاهده تسک تحلیل' : 'تحلیل این آزمون'}</button>
      {canManageResult && <button type="button" onClick={() => setResultsOpen(true)} className="mt-3 min-h-10 rounded-lg border border-[#E57373]/30 bg-[#E57373]/10 px-3 text-xs font-semibold text-[#EF9A9A]">ثبت یا ویرایش نتیجه</button>}
      {canManageResult && <ExamResultsModal exam={exam} open={resultsOpen} onOpenChange={setResultsOpen} />}
      <ExamAnalysisDialog exam={exam} studentId={studentId} isAdvisor={canManageResult} open={analysisOpen} onOpenChange={setAnalysisOpen} />
      {canUpdateStatus && <ExamTaskActionDialog
        open={actionOpen}
        onOpenChange={setActionOpen}
        title={exam.title}
        description={`${exam.subject} · ${formatPersianDateFromISO(exam.date)}`}
        onMoveToIncomplete={async () => { await changeStatus('INCOMPLETE'); }}
        onDelete={canDelete ? remove : undefined}
      />}
    </article>
  );
}

export function ExamCenter({ studentId, grade, major, isAdvisor }: { studentId: string; grade?: string; major?: string; isAdvisor: boolean }) {
  const { exams, examsLoading } = useAppStore();
  const [createOpen, setCreateOpen] = useState(false);
  const studentExams = useMemo(() => exams
    .filter((exam) => exam.studentIds.includes(studentId))
    .sort((a, b) => b.date.localeCompare(a.date)), [exams, studentId]);
  const completed = studentExams.filter((exam) => exam.results.some((result) => result.studentId === studentId && result.score != null));
  const average = completed.length > 0
    ? Math.round(completed.reduce((sum, exam) => {
        const score = exam.results.find((result) => result.studentId === studentId)?.score ?? 0;
        return sum + (score / exam.totalScore) * 100;
      }, 0) / completed.length)
    : null;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-[var(--foreground)]">آزمون‌ها</h2>
          <p className="mt-1 text-xs text-[var(--foreground-muted)]">تاریخ، جزئیات و عملکرد آزمون‌های جامع و تک‌درسی</p>
        </div>
        <button type="button" onClick={() => setCreateOpen(true)} className="flex min-h-11 items-center gap-2 rounded-xl bg-[#E57373] px-4 text-sm font-bold text-[#241315]"><Plus className="size-4" />آزمون جدید</button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-3 text-center"><p className="text-lg font-bold">{toPersianDigits(studentExams.length)}</p><p className="text-[10px] text-[var(--foreground-muted)]">کل آزمون‌ها</p></div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-3 text-center"><p className="text-lg font-bold">{toPersianDigits(completed.length)}</p><p className="text-[10px] text-[var(--foreground-muted)]">نتیجه ثبت‌شده</p></div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-3 text-center"><p className="text-lg font-bold text-[#EF9A9A]">{average == null ? '—' : `${toPersianDigits(average)}٪`}</p><p className="text-[10px] text-[var(--foreground-muted)]">میانگین عملکرد</p></div>
      </div>
      {examsLoading ? <div className="rounded-xl border border-[var(--border)] p-8 text-center text-sm text-[var(--foreground-muted)]">در حال دریافت آزمون‌ها...</div> : studentExams.length === 0 ? <div className="rounded-xl border border-dashed border-[#E57373]/30 p-10 text-center"><ClipboardCheck className="mx-auto size-7 text-[#EF9A9A]" /><p className="mt-3 text-sm font-semibold">هنوز آزمونی ثبت نشده است</p></div> : <div className="grid gap-3 md:grid-cols-2">{studentExams.map((exam) => <ExamCard key={exam.id} exam={exam} studentId={studentId} canManageResult={isAdvisor} />)}</div>}
      <ExamModal open={createOpen} onOpenChange={setCreateOpen} studentId={studentId} grade={grade} major={major} />
    </section>
  );
}
