'use client';

import { motion, type Variants } from 'framer-motion';
import { Check, X, Settings, Trash2, Clock, FileText, GripVertical, RotateCcw, Pencil, UserRound, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import { Task } from '@/lib/types';
import { getRandomSuccessMessage, getRandomFailureMessage } from '@/lib/constants/feedbackMessages';
import { toPersianDigits, minutesToHoursLabel } from '@/lib/persian-date';
import { formatTaskCurriculum } from '@/lib/task-summary';
import { FieldTypeBadge } from '@/components/shared/FieldTypeBadge';
import { isClassTask } from '@/lib/class-task';

// ===== Animation Variants =====
const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.3, ease: 'easeOut' },
  }),
  exit: { opacity: 0, x: -30, transition: { duration: 0.2 } },
};

interface TaskCardProps {
  task: Task;
  index: number;
  onComplete: (id: string) => void;
  onSkip: (id: string) => void;
  onDelete: (id: string) => void;
  /** Open the 3-way task action dialog (move to day / move to incompletes / delete). */
  onAction: (id: string) => void;
  onSettings: (id: string) => void;
  onReset: (id: string) => void; // NEW: undo complete/skip
  onEdit?: (id: string) => void; // edit task details
  dragHandleProps?: Record<string, unknown>; // for dnd-kit drag handle
  capabilities?: TaskCardCapabilities;
}

export interface TaskCardCapabilities {
  complete?: boolean;
  action?: boolean;
  partial?: boolean;
  reset?: boolean;
  edit?: boolean;
  deleteDraft?: boolean;
  drag?: boolean;
}

// ===== Component =====
export default function TaskCard({
  task,
  index,
  onComplete,
  onSkip,
  onDelete,
  onAction,
  onSettings,
  onReset,
  onEdit,
  dragHandleProps,
  capabilities,
}: TaskCardProps) {
  const isCompleted = task.completed === true;
  const isSkipped = task.completed === false;
  const isPending = task.completed === null;
  const isDraft = task.status === 'DRAFT';
  const isIncomplete = task.status === 'INCOMPLETE';
  const curriculumSummary = formatTaskCurriculum(task);
  const canComplete = capabilities?.complete ?? true;
  const canAction = capabilities?.action ?? true;
  const canPartial = capabilities?.partial ?? true;
  const canReset = capabilities?.reset ?? true;
  const canEdit = (capabilities?.edit ?? true) && Boolean(onEdit);
  const canDeleteDraft = capabilities?.deleteDraft ?? true;
  const canDrag = capabilities?.drag ?? true;

  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      layout
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={`surface-1 edge-highlight card-hover group relative overflow-hidden rounded-[var(--radius-lg)] p-4 md:p-5
        border border-[var(--border)] hover:border-[var(--border-strong)]
        ${isCompleted || isSkipped ? 'opacity-60 hover:opacity-90' : ''}
      `}
    >
      {/* Top subject color stripe (subtle accent strip at the very top) */}
      <div
        aria-hidden
        className="absolute top-0 left-0 right-0 h-[2px] opacity-50 group-hover:opacity-100 transition-opacity"
        style={{
          backgroundColor: task.subjectColor,
        }}
      />
      <div className="flex items-start justify-between gap-2 md:gap-3 relative">
        {/* ===== Drag Handle + Task Info (right side in RTL) ===== */}
        <div className="flex items-start gap-1.5 flex-1 min-w-0">
          {/* Drag handle (desktop only) */}
          {dragHandleProps && canDrag && (
            <button
              {...dragHandleProps}
              className="hidden md:flex shrink-0 cursor-grab active:cursor-grabbing text-[var(--foreground-subtle)] hover:text-[var(--foreground-muted)] transition-colors pt-1"
              aria-label="جابجایی"
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical className="w-4 h-4" />
            </button>
          )}

          <div className="flex-1 min-w-0">
            {/* Subject Row */}
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-[var(--foreground)] font-bold text-sm md:text-base truncate">
                {task.subject}
              </span>
              {task.fieldType ? <FieldTypeBadge value={task.fieldType} /> : <span className="rounded-md border border-[#35C49A]/30 bg-[#35C49A]/10 px-2 py-0.5 text-[10px] font-semibold text-[#72E0BF]">کلاس</span>}
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium shrink-0 ${
                  task.createdBy === 'advisor'
                    ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                    : 'bg-[rgba(255,255,255,0.04)] text-[var(--foreground-muted)]'
                }`}
              >
                {task.createdBy === 'advisor' ? 'مشاور' : 'خودم'}
              </span>
            </div>

            {isDraft && (canEdit ? <button onClick={() => onEdit?.(task.id)} className="mb-2 text-xs font-bold text-[var(--warning)] bg-[var(--warning)]/10 px-2 py-1 rounded-md">پیش‌نویس · تکمیل جزئیات</button> : <span className="mb-2 inline-block text-xs font-bold text-[var(--warning)] bg-[var(--warning)]/10 px-2 py-1 rounded-md">پیش‌نویس</span>)}
            {isIncomplete && <span className="mb-2 inline-block text-xs font-bold text-[var(--warning)] bg-[var(--warning)]/10 px-2 py-1 rounded-md">ناقص</span>}
            {curriculumSummary && <p className="text-[var(--foreground-muted)] text-xs md:text-sm mb-2 line-clamp-2">{curriculumSummary}</p>}

            {(task.teacherClassName || task.bookName) && (
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[var(--foreground-muted)] mb-2">
                {task.teacherClassName && <span className="flex items-center gap-1"><UserRound className="w-3 h-3" />دبیر: {task.teacherClassName}{task.sessionNumber ? ` · ${task.sessionNumber}` : ''}</span>}
                {task.bookName && <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />کتاب: {task.bookName}{task.testDescription ? ` · ${task.testDescription}` : ''}</span>}
              </div>
            )}

            {/* Activity Chips */}
            {task.detailsCompleted && <div className="flex flex-wrap gap-1.5 mb-2">
              {(task.activityTypes ?? []).map((at) => (
                <span
                  key={at}
                  className="text-[10px] px-1.5 py-0.5 rounded-md bg-[rgba(255,255,255,0.04)] text-[var(--foreground-muted)] border border-[var(--border)]"
                >
                  {at}
                </span>
              ))}
            </div>}

            {/* Target Metrics — hours instead of minutes */}
            {task.detailsCompleted && task.targetTimeMinutes != null && <div className="flex items-center gap-3 text-xs text-[var(--foreground-muted)]">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[var(--foreground-subtle)]" />
                {minutesToHoursLabel(task.targetTimeMinutes)}
              </span>
              {(task.targetTestCount ?? 0) > 0 && (
                <>
                  <span className="w-px h-3 bg-[var(--border)]" />
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[var(--foreground-subtle)]" />
                    {toPersianDigits(task.targetTestCount ?? 0)} تست
                  </span>
                </>
              )}
            </div>}

            {/* Actual Metrics (if completed) */}
            {isCompleted && (task.actualTimeMinutes !== null || task.actualTestCount !== null) && (
              <div className="flex items-center gap-3 text-xs text-[var(--accent)] mt-2 pt-2 border-t border-[var(--border)]">
                {task.actualTimeMinutes !== null && (
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
                    واقعی: {minutesToHoursLabel(task.actualTimeMinutes)}
                  </span>
                )}
                {task.actualTestCount !== null && (
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
                    واقعی: {toPersianDigits(task.actualTestCount)} تست
                  </span>
                )}
              </div>
            )}

          </div>
        </div>

        {/* ===== Action Buttons (left side in RTL) ===== */}
        <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
          {isDraft ? (
            <div className="flex items-center gap-2">
              {canEdit && onEdit && <button onClick={() => onEdit(task.id)} className="px-3 h-10 rounded-lg bg-[var(--warning)]/10 text-[var(--warning)] text-xs font-bold">تکمیل</button>}
              {canDeleteDraft && canAction && <button
                type="button"
                onClick={(event) => { event.preventDefault(); event.stopPropagation(); onAction(task.id); }}
                className="px-3 h-10 rounded-lg border border-[var(--danger)]/25 bg-[var(--danger)]/10 text-[var(--danger)] text-xs font-bold transition-colors hover:bg-[var(--danger)]/15"
              >
                حذف تسک
              </button>}
            </div>
          ) : isPending && task.detailsCompleted ? (
            <>
              {canComplete && <button
                onClick={async () => {
                  await onComplete(task.id);
                  toast.success(getRandomSuccessMessage(), {
                    style: {
                      background: 'var(--bg-overlay)',
                      border: '1px solid var(--border-strong)',
                      color: 'var(--accent)',
                    },
                  });
                }}
                className="icon-btn w-10 h-10 md:w-11 md:h-11 rounded-[var(--radius)] bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--border-strong)] flex items-center justify-center hover:bg-[var(--accent-soft)] hover:border-[var(--accent)]"
                aria-label="انجام شد"
              >
                <Check className="w-4 h-4 md:w-5 md:h-5" />
              </button>}
              {canAction && <button
                onClick={() => onAction(task.id)}
                className="icon-btn w-10 h-10 md:w-11 md:h-11 rounded-[var(--radius)] bg-[rgba(229,72,77,0.12)] text-[var(--danger)] border border-[rgba(229,72,77,0.2)] flex items-center justify-center hover:bg-[rgba(229,72,77,0.18)] hover:border-[var(--danger)]"
                aria-label="عملیات تسک"
              >
                <X className="w-4 h-4 md:w-5 md:h-5" />
              </button>}
              {canEdit && onEdit && (
                <button
                  onClick={() => onEdit(task.id)}
                  className="icon-btn w-10 h-10 md:w-11 md:h-11 rounded-[var(--radius)] bg-[rgba(255,255,255,0.04)] text-[var(--foreground-muted)] border border-[var(--border)] flex items-center justify-center hover:text-[var(--accent)] hover:bg-[var(--accent-soft)]"
                  aria-label="ویرایش"
                >
                  <Pencil className="w-4 h-4 md:w-5 md:h-5" />
                </button>
              )}
              {canPartial && !isClassTask(task) && <button
                onClick={() => onSettings(task.id)}
                className="icon-btn w-10 h-10 md:w-11 md:h-11 rounded-[var(--radius)] bg-[rgba(255,255,255,0.04)] text-[var(--foreground-muted)] border border-[var(--border)] flex items-center justify-center hover:text-[var(--foreground)] hover:bg-[rgba(255,255,255,0.08)]"
                aria-label="ثبت بخشی"
              >
                <Settings className="w-4 h-4 md:w-5 md:h-5" />
              </button>}
            </>
          ) : !isPending ? (
            <div className="flex items-center gap-1.5">
              {/* Status badge */}
              {isCompleted ? (
                <span className="text-[var(--accent)] text-xs font-bold flex items-center gap-1 bg-[var(--accent-soft)] px-2 py-1 rounded-md border border-[var(--border-strong)]">
                  <Check className="w-3 h-3" />
                  انجام شد
                </span>
              ) : (
                <span className="text-[var(--danger)] text-xs font-bold flex items-center gap-1 bg-[rgba(229,72,77,0.12)] px-2 py-1 rounded-md border border-[rgba(229,72,77,0.2)]">
                  <X className="w-3 h-3" />
                  انجام نشد
                </span>
              )}
              {canEdit && onEdit && (
                <button
                  onClick={() => onEdit(task.id)}
                  className="icon-btn w-9 h-9 rounded-[var(--radius)] bg-[rgba(255,255,255,0.04)] text-[var(--foreground-muted)] border border-[var(--border)] flex items-center justify-center hover:text-[var(--accent)] hover:bg-[var(--accent-soft)]"
                  aria-label="ویرایش جزئیات برنامه"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              )}
              {/* Undo button — NEW: allows reverting to pending */}
              {canReset && <button
                onClick={async () => {
                  await onReset(task.id);
                  toast('وضعیت به حالت قبل برگشت', {
                    style: {
                      background: 'var(--bg-overlay)',
                      border: '1px solid var(--border-strong)',
                      color: 'var(--foreground-muted)',
                    },
                  });
                }}
                className="icon-btn w-8 h-8 rounded-md text-[var(--foreground-subtle)] hover:text-[var(--accent)] hover:bg-[var(--accent-soft)] flex items-center justify-center"
                aria-label="بازگشت به حالت قبل"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>}
              {/* Task action button (opens the 3-way dialog) */}
              {canAction && <button
                onClick={() => onAction(task.id)}
                className="icon-btn w-8 h-8 rounded-md text-[var(--foreground-subtle)] hover:text-[var(--danger)] hover:bg-[rgba(229,72,77,0.08)] flex items-center justify-center"
                aria-label="عملیات تسک"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>}
            </div>
          ) : canEdit && onEdit ? <button onClick={() => onEdit(task.id)} className="px-3 h-10 rounded-lg bg-[var(--warning)]/10 text-[var(--warning)] text-xs font-bold">تکمیل</button> : null}
        </div>
      </div>
    </motion.div>
  );
}
