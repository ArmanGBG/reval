'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, Inbox, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface ExamTaskActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  onMoveToIncomplete: () => Promise<void>;
  onDelete?: () => Promise<void>;
}

export function ExamTaskActionDialog({
  open,
  onOpenChange,
  title,
  description,
  onMoveToIncomplete,
  onDelete,
}: ExamTaskActionDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setSubmitting(false);
      setError('');
    }
  }, [open]);

  const runAction = async (action: () => Promise<void>) => {
    setSubmitting(true);
    setError('');
    try {
      await action();
      onOpenChange(false);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'انجام عملیات ناموفق بود');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="surface-2 border-[var(--border-strong)] text-[var(--foreground)] max-w-[calc(100%-2rem)] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[var(--foreground)] text-right text-base">با این تسک چی کار کنم؟</DialogTitle>
          <DialogDescription className="text-[var(--foreground-muted)] text-right text-xs">{description ?? title}</DialogDescription>
        </DialogHeader>

        <div className="space-y-2.5 py-1">
          <button
            onClick={() => runAction(onMoveToIncomplete)}
            disabled={submitting}
            className="group w-full flex items-center gap-3 p-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] hover:border-[var(--warning)]/40 hover:bg-[var(--warning)]/8 transition-all text-right min-h-[56px]"
          >
            <div className="w-10 h-10 rounded-lg bg-[var(--warning)]/12 flex items-center justify-center shrink-0">
              <Inbox className="w-5 h-5 text-[var(--warning)]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-[var(--foreground)]">انتقال به ناقصی‌ها</div>
              <div className="text-xs text-[var(--foreground-muted)] mt-0.5">برای تکمیل بعدی به تب ناقصی‌ها منتقل میشه</div>
            </div>
            <ChevronLeft className="w-4 h-4 text-[var(--foreground-subtle)] flip-rtl group-hover:text-[var(--warning)] transition-colors" />
          </button>

          {onDelete && <button
            onClick={() => runAction(onDelete)}
            disabled={submitting}
            className="group w-full flex items-center gap-3 p-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] hover:border-[var(--danger)]/40 hover:bg-[rgba(229,72,77,0.08)] transition-all text-right min-h-[56px]"
          >
            <div className="w-10 h-10 rounded-lg bg-[rgba(229,72,77,0.12)] flex items-center justify-center shrink-0">
              <Trash2 className="w-5 h-5 text-[var(--danger)]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-[var(--foreground)]">حذف کل تسک</div>
              <div className="text-xs text-[var(--foreground-muted)] mt-0.5">تسک برای همیشه حذف میشه</div>
            </div>
            <ChevronLeft className="w-4 h-4 text-[var(--foreground-subtle)] flip-rtl group-hover:text-[var(--danger)] transition-colors" />
          </button>}
        </div>

        {error && <p role="alert" className="rounded-lg border border-[var(--danger)]/30 bg-[rgba(229,72,77,0.08)] px-3 py-2 text-xs text-[var(--danger)]">{error}</p>}

        <div className="pt-3 mt-1 border-t border-[var(--border)]">
          <button
            onClick={() => onOpenChange(false)}
            disabled={submitting}
            className="btn-hover w-full h-10 rounded-lg border border-[var(--border)] text-[var(--foreground-muted)] text-sm font-medium"
          >
            انصراف
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
