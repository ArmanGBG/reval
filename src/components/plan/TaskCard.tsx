'use client';

import { motion, type Variants } from 'framer-motion';
import { Check, X, Settings, Trash2, Clock, FileText, GripVertical, RotateCcw, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { Task } from '@/lib/types';
import { getRandomSuccessMessage, getRandomFailureMessage } from '@/lib/constants/feedbackMessages';
import { toPersianDigits, minutesToHoursLabel } from '@/lib/persian-date';
import StudySessionTimer from './StudySessionTimer';

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
  onSettings: (id: string) => void;
  onReset: (id: string) => void; // NEW: undo complete/skip
  onEdit?: (id: string) => void; // edit task details
  dragHandleProps?: Record<string, unknown>; // for dnd-kit drag handle
}

// ===== Component =====
export default function TaskCard({
  task,
  index,
  onComplete,
  onSkip,
  onDelete,
  onSettings,
  onReset,
  onEdit,
  dragHandleProps,
}: TaskCardProps) {
  const isCompleted = task.completed === true;
  const isSkipped = task.completed === false;
  const isPending = task.completed === null;

  // Accent border classes based on status
  // Pending tasks use the subject color so students can visually scan by subject.
  // Completed/skipped use status colors (accent/danger).
  const accentBorder = isCompleted
    ? 'before:bg-[var(--accent)] before:w-[3px]'
    : isSkipped
      ? 'before:bg-[var(--danger)] before:w-[3px]'
      : 'before:bg-[var(--subject-accent)] before:w-[3px]'; // pending: subject color

  // Status dot color — neutral, no glow shadows
  const statusDotColor = isCompleted
    ? 'bg-[var(--accent)]'
    : isSkipped
      ? 'bg-[var(--danger)]'
      : 'bg-[var(--warning)]';

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
        before:absolute before:right-0 before:top-0 before:bottom-0 before:transition-all before:duration-300
        border border-[var(--border)] hover:border-[var(--border-strong)]
        ${accentBorder}
        ${isCompleted || isSkipped ? 'opacity-60 hover:opacity-90' : ''}
      `}
      style={isPending ? {
        // Subject-color accent stripe on the right edge (RTL) for pending tasks
        '--subject-accent': task.subjectColor,
      } as React.CSSProperties : undefined}
    >
      {/* Top subject color stripe (subtle accent strip at the very top) */}
      <div
        aria-hidden
        className="absolute top-0 left-0 right-0 h-[2px] opacity-50 group-hover:opacity-100 transition-opacity"
        style={{
          backgroundColor: task.subjectColor,
        }}
      />
      {/* Subtle accent overlay on hover (top-right) — kept calm, no glow */}
      {!isCompleted && !isSkipped && (
        <div
          aria-hidden
          className="absolute -top-12 -left-12 w-32 h-32 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            background:
              'radial-gradient(circle, var(--accent-soft) 0%, transparent 70%)',
          }}
        />
      )}

      <div className="flex items-start justify-between gap-2 md:gap-3 relative">
        {/* ===== Drag Handle + Task Info (right side in RTL) ===== */}
        <div className="flex items-start gap-1.5 flex-1 min-w-0">
          {/* Drag handle (desktop only) */}
          {dragHandleProps && (
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
              {/* Status dot indicator */}
              <span
                className={`w-2 h-2 rounded-full shrink-0 transition-all duration-300 ${statusDotColor}`}
              />
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0 ring-2 ring-white/10"
                style={{ backgroundColor: task.subjectColor }}
              />
              <span className="text-[var(--foreground)] font-bold text-sm md:text-base truncate">
                {task.subject}
              </span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium shrink-0 ${
                  task.fieldType === 'کنکور'
                    ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                    : 'bg-[var(--accent-soft)] text-[var(--accent)]'
                }`}
              >
                {task.fieldType}
              </span>
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

            {!task.detailsCompleted && <button onClick={() => onEdit?.(task.id)} className="mb-2 text-xs font-bold text-[var(--warning)] bg-[var(--warning)]/10 px-2 py-1 rounded-md">جزئیات ناقص · تکمیل کنید</button>}
            {task.detailsCompleted && task.topic && <p className="text-[var(--foreground-muted)] text-xs md:text-sm mb-2 line-clamp-2">{task.topic}</p>}

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

            {/* Study Session Timer — only for pending tasks with details completed */}
            {isPending && task.detailsCompleted && (
              <StudySessionTimer taskId={task.id} savedMinutes={task.actualTimeMinutes} />
            )}
          </div>
        </div>

        {/* ===== Action Buttons (left side in RTL) ===== */}
        <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
          {isPending && task.detailsCompleted ? (
            <>
              <button
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
              </button>
              <button
                onClick={async () => {
                  await onSkip(task.id);
                  toast(getRandomFailureMessage(), {
                    style: {
                      background: 'var(--bg-overlay)',
                      border: '1px solid var(--danger)',
                      color: 'var(--danger)',
                    },
                  });
                }}
                className="icon-btn w-10 h-10 md:w-11 md:h-11 rounded-[var(--radius)] bg-[rgba(229,72,77,0.12)] text-[var(--danger)] border border-[rgba(229,72,77,0.2)] flex items-center justify-center hover:bg-[rgba(229,72,77,0.18)] hover:border-[var(--danger)]"
                aria-label="انجام نشد"
              >
                <X className="w-4 h-4 md:w-5 md:h-5" />
              </button>
              {onEdit && (
                <button
                  onClick={() => onEdit(task.id)}
                  className="icon-btn w-10 h-10 md:w-11 md:h-11 rounded-[var(--radius)] bg-[rgba(255,255,255,0.04)] text-[var(--foreground-muted)] border border-[var(--border)] flex items-center justify-center hover:text-[var(--accent)] hover:bg-[var(--accent-soft)]"
                  aria-label="ویرایش"
                >
                  <Pencil className="w-4 h-4 md:w-5 md:h-5" />
                </button>
              )}
              <button
                onClick={() => onSettings(task.id)}
                className="icon-btn w-10 h-10 md:w-11 md:h-11 rounded-[var(--radius)] bg-[rgba(255,255,255,0.04)] text-[var(--foreground-muted)] border border-[var(--border)] flex items-center justify-center hover:text-[var(--foreground)] hover:bg-[rgba(255,255,255,0.08)]"
                aria-label="ثبت بخشی"
              >
                <Settings className="w-4 h-4 md:w-5 md:h-5" />
              </button>
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
              {/* Undo button — NEW: allows reverting to pending */}
              <button
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
              </button>
              {/* Delete button */}
              <button
                onClick={async () => {
                  await onDelete(task.id);
                  toast('تسک حذف شد', {
                    style: { background: 'var(--bg-overlay)', border: '1px solid var(--border-strong)', color: 'var(--foreground-muted)' },
                  });
                }}
                className="icon-btn w-8 h-8 rounded-md text-[var(--foreground-subtle)] hover:text-[var(--danger)] hover:bg-[rgba(229,72,77,0.08)] flex items-center justify-center"
                aria-label="حذف"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : onEdit ? <button onClick={() => onEdit(task.id)} className="px-3 h-10 rounded-lg bg-[var(--warning)]/10 text-[var(--warning)] text-xs font-bold">تکمیل جزئیات</button> : null}
        </div>
      </div>
    </motion.div>
  );
}
