import { Check, Clock3, FileText, Inbox, X } from 'lucide-react';
import type { ExamParticipantStatus, TaskStatus } from '@/lib/types';

type LifecycleStatus = TaskStatus | ExamParticipantStatus;

const STATUS_STYLE: Record<LifecycleStatus, {
  label: string;
  className: string;
  icon: typeof Check;
}> = {
  COMPLETED: {
    label: 'انجام شد',
    className: 'border-[var(--accent)]/30 bg-[var(--accent-soft)] text-[var(--accent)]',
    icon: Check,
  },
  INCOMPLETE: {
    label: 'ناقص',
    className: 'border-[var(--warning)]/30 bg-[var(--warning)]/10 text-[var(--warning)]',
    icon: Inbox,
  },
  SKIPPED: {
    label: 'انجام نشد',
    className: 'border-[var(--danger)]/25 bg-[var(--danger)]/10 text-[var(--danger)]',
    icon: X,
  },
  DRAFT: {
    label: 'پیش‌نویس',
    className: 'border-[var(--warning)]/25 bg-[var(--warning)]/10 text-[var(--warning)]',
    icon: FileText,
  },
  PENDING: {
    label: 'در انتظار انجام',
    className: 'border-[var(--border-strong)] bg-[var(--surface-glass)] text-[var(--foreground-muted)]',
    icon: Clock3,
  },
};

export function LifecycleStatusBadge({ status, showPending = false }: { status: LifecycleStatus; showPending?: boolean }) {
  if (status === 'PENDING' && !showPending) return null;
  const config = STATUS_STYLE[status];
  const Icon = config.icon;
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-bold ${config.className}`}>
      <Icon className="size-3" aria-hidden="true" />
      {config.label}
    </span>
  );
}
