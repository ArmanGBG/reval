'use client';

import { useState } from 'react';
import { Check, Clock3, Link2, MessageSquareText, RotateCcw, X } from 'lucide-react';
import { toast } from 'sonner';
import type { Exam, ExamAnalysisTask } from '@/lib/types';
import { useAppStore } from '@/lib/store';
import { minutesToHoursLabel, toPersianDigits } from '@/lib/persian-date';
import { LifecycleStatusBadge } from '@/components/shared/LifecycleStatusBadge';
import { ExamTaskActionDialog } from '@/components/exams/ExamTaskActionDialog';

export function ExamAnalysisTaskCard({ exam, task, isAdvisor, compact = false }: { exam: Exam; task: ExamAnalysisTask; isAdvisor: boolean; compact?: boolean }) {
  const { updateExamAnalysisTask } = useAppStore();
  const [minutes, setMinutes] = useState(task.actualTimeMinutes == null ? '' : String(task.actualTimeMinutes));
  const [actionOpen, setActionOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const completed = task.status === 'COMPLETED';
  const incomplete = task.status === 'INCOMPLETE';

  const update = async (updates: Omit<Parameters<typeof updateExamAnalysisTask>[1], 'studentId'>) => {
    setSaving(true);
    try {
      await updateExamAnalysisTask(exam.id, { ...updates, studentId: task.studentId });
      if (updates.status === 'COMPLETED') {
        toast.success('تحلیل آزمون انجام شد', {
          style: { background: 'var(--bg-overlay)', border: '1px solid var(--border-strong)', color: 'var(--accent)' },
        });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'به‌روزرسانی تسک تحلیل ناموفق بود');
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = () => update({ status: 'COMPLETED', actualTimeMinutes: minutes ? Number(minutes) : task.actualTimeMinutes });

  return (
    <article className={`relative overflow-hidden rounded-xl border border-[#E57373]/25 bg-[#E57373]/[0.045] ${completed ? 'opacity-60' : ''} ${compact ? 'p-3' : 'p-4'}`}>
      <span className="absolute inset-y-3 right-0 w-1 rounded-l-full bg-[#E57373]" />
      <div className="flex items-start justify-between gap-2 pr-1">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2"><h3 className={`font-bold text-[var(--foreground)] ${compact ? 'text-xs' : 'text-sm'} ${completed ? 'line-through' : ''}`}>تحلیل آزمون: {exam.title}</h3><span className="inline-flex items-center gap-1 rounded-md border border-[#E57373]/25 bg-[#E57373]/10 px-2 py-1 text-[10px] font-bold text-[#EF9A9A]"><Link2 className="size-3" />متصل به آزمون</span><LifecycleStatusBadge status={task.status} /></div>
          <p className="mt-1 text-[11px] text-[var(--foreground-muted)]">{exam.subject}</p>
          {task.advisorNote && <div className="mt-3 flex items-start gap-2 rounded-lg border border-[var(--accent)]/20 bg-[var(--accent-soft)] px-3 py-2 text-xs leading-5"><MessageSquareText className="mt-0.5 size-3.5 shrink-0 text-[var(--accent)]" /><span><strong className="text-[var(--accent)]">توضیح مشاور:</strong> {task.advisorNote}</span></div>}
          {task.actualTimeMinutes != null && <p className="mt-2 flex items-center gap-1.5 text-[11px] text-[var(--foreground-muted)]"><Clock3 className="size-3.5" />زمان واقعی: {minutesToHoursLabel(task.actualTimeMinutes)}</p>}
        </div>

        {!isAdvisor && (
          <div className="flex shrink-0 items-center gap-1.5 md:gap-2">
            {!completed ? (
              <>
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleComplete}
                  className="icon-btn size-10 rounded-lg bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--border-strong)] flex items-center justify-center hover:bg-[var(--accent-soft)] hover:border-[var(--accent)] disabled:opacity-50"
                  aria-label="انجام شد"
                >
                  <Check className="w-4 h-4 md:w-5 md:h-5" />
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setActionOpen(true)}
                  className="icon-btn size-10 rounded-lg bg-[rgba(229,72,77,0.12)] text-[var(--danger)] border border-[rgba(229,72,77,0.2)] flex items-center justify-center hover:bg-[rgba(229,72,77,0.18)] hover:border-[var(--danger)] disabled:opacity-50"
                  aria-label="عملیات تسک"
                >
                  <X className="w-4 h-4 md:w-5 md:h-5" />
                </button>
              </>
            ) : (
              <button
                type="button"
                disabled={saving}
                onClick={() => update({ status: 'PENDING' })}
                className="icon-btn size-9 rounded-md text-[var(--foreground-subtle)] hover:text-[var(--accent)] hover:bg-[var(--accent-soft)] flex items-center justify-center disabled:opacity-50"
                aria-label="بازگشت به حالت قبل"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {!isAdvisor && !completed && (
        <div className="mt-3 border-t border-[#E57373]/15 pt-3">
          <label className="text-[10px] text-[var(--foreground-muted)]">زمان واقعی (دقیقه)
            <input
              type="text"
              inputMode="numeric"
              value={minutes}
              onChange={(event) => setMinutes(event.target.value.replace(/\D/g, ''))}
              className="mt-1 block h-10 w-28 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 text-sm"
              placeholder="مثلاً ۴۵"
            />
          </label>
        </div>
      )}

      {completed && task.actualTimeMinutes != null && !compact && <p className="mt-2 text-[10px] text-[var(--accent)]">{toPersianDigits(task.actualTimeMinutes)} دقیقه برای تحلیل ثبت شده است.</p>}

      {!isAdvisor && <ExamTaskActionDialog
        open={actionOpen}
        onOpenChange={setActionOpen}
        title={`تحلیل آزمون: ${exam.title}`}
        description={`${exam.subject} · متصل به آزمون`}
        onMoveToIncomplete={async () => { await update({ status: 'INCOMPLETE' }); }}
      />}
    </article>
  );
}
