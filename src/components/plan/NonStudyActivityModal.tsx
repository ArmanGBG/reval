'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Clock, X } from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '@/lib/store';
import { useCurrentStudentId } from '@/lib/student-utils';
import { NON_STUDY_CATEGORIES, NON_STUDY_STYLE, nonStudyCategory, type NonStudyCategoryKey } from '@/lib/non-study-activity';
import { normalizeNumericInput, toEnglishDigits } from '@/lib/digits';
import { formatPersianDate, getPersianWeekdayName, toPersianDigits } from '@/lib/persian-date';

const MINUTES_QUICK_PICKS = [15, 30, 60, 90];

/**
 * Logs a personal, non-curricular activity for a given date.
 * - Category (required): one of the five fixed categories with icons.
 * - Duration (fully optional): minutes; empty is valid and never blocks submit.
 * - Mobile: bottom sheet (items-end); desktop: centered card. Portaled to
 *   <body> so it renders correctly even when opened from inside a dialog.
 */
export function NonStudyActivityModal({
  open,
  onOpenChange,
  date,
  studentId: studentIdProp,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: string;
  studentId?: string;
  onSaved?: () => void;
}) {
  const { addNonStudyActivity } = useAppStore();
  const currentStudentId = useCurrentStudentId();
  const studentId = studentIdProp ?? currentStudentId;
  const [category, setCategory] = useState<NonStudyCategoryKey | null>(null);
  const [minutes, setMinutes] = useState('');
  const [saving, setSaving] = useState(false);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setPortalTarget(document.body);
  }, []);

  // Reset the form each time the sheet opens
  useEffect(() => {
    if (open) {
      setCategory(null);
      setMinutes('');
    }
  }, [open]);

  const dayLabel = useMemo(() => {
    const d = new Date(`${date}T00:00:00`);
    return `${getPersianWeekdayName(d)} · ${formatPersianDate(d)}`;
  }, [date]);

  // Lock background scroll and close on Escape while open
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onOpenChange(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onOpenChange]);

  const parsedMinutes = toEnglishDigits(minutes);
  const canSubmit = category !== null && !saving;

  const handleSubmit = async () => {
    if (!category) return;
    setSaving(true);
    try {
      await addNonStudyActivity({
        studentId,
        category,
        durationMinutes: parsedMinutes ? Number(parsedMinutes) : null,
        date,
      });
      toast.success('فعالیت غیردرسی ثبت شد');
      onSaved?.();
      onOpenChange(false);
    } catch (err) {
      if (!(err instanceof Error && err.name === 'AuthError')) {
        toast.error(err instanceof Error ? err.message : 'ثبت فعالیت ناموفق بود');
      }
    } finally {
      setSaving(false);
    }
  };

  if (!portalTarget) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="pointer-events-auto fixed inset-0 z-[70] flex items-end justify-center md:items-center md:p-6"
          onClick={() => onOpenChange(false)}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 320 }}
            className="relative flex h-dvh w-full flex-col overflow-hidden surface-2 md:h-auto md:max-h-[88vh] md:max-w-md md:rounded-[var(--radius-xl)] md:border md:border-[var(--border-strong)] text-[var(--foreground)] shadow-2xl"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="ثبت فعالیت غیردرسی"
          >
            <div className="shrink-0 border-b border-[var(--border)] px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] text-right md:pt-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-base font-semibold text-[var(--foreground)]">فعالیت غیردرسی</h2>
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  aria-label="بستن"
                  className="flex size-9 items-center justify-center rounded-md border border-[var(--border)] text-[var(--foreground-muted)] transition-colors hover:text-[var(--foreground)]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="mt-0.5 text-xs text-[var(--foreground-subtle)]">{dayLabel}</p>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
              {/* Category (required) */}
              <label className="block text-xs font-medium text-[var(--foreground-muted)]">
                نوع فعالیت <span className="text-[var(--danger)]">*</span>
              </label>
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {NON_STUDY_CATEGORIES.map((item) => {
                  const selected = category === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setCategory(item.key)}
                      aria-pressed={selected}
                      className={`flex min-h-[52px] items-center gap-3 rounded-xl border px-3 py-2.5 text-right text-sm transition-all ${
                        selected
                          ? `${NON_STUDY_STYLE.softBg} ${NON_STUDY_STYLE.border} ${NON_STUDY_STYLE.text} font-semibold`
                          : 'border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--foreground)] hover:border-[var(--border-strong)]'
                      }`}
                    >
                      <span className="text-xl shrink-0" aria-hidden>{item.icon}</span>
                      <span className="flex-1">{item.label}</span>
                      {selected && <Check className="h-4 w-4 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* Duration (optional) */}
              <label className="mt-4 block text-xs font-medium text-[var(--foreground-muted)]">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  مدت زمان (دقیقه) — اختیاری
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={minutes}
                  onChange={(event) => setMinutes(normalizeNumericInput(event.target.value))}
                  placeholder="مثلاً ۴۵"
                  className="mt-1.5 h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-base)] px-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
                  dir="ltr"
                />
              </label>
              <div className="mt-2 flex gap-1.5">
                {MINUTES_QUICK_PICKS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMinutes(String(m))}
                    className={`btn-hover h-9 flex-1 rounded-lg border text-[11px] font-medium transition-all ${
                      parsedMinutes === String(m)
                        ? `${NON_STUDY_STYLE.softBg} ${NON_STUDY_STYLE.border} ${NON_STUDY_STYLE.text}`
                        : 'border-[var(--border)] text-[var(--foreground-muted)]'
                    }`}
                  >
                    {toPersianDigits(m)}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-[10px] leading-5 text-[var(--foreground-subtle)]">
                اگر زمان را نمی‌دانید خالی بگذارید؛ ثبت بدون مدت زمان هم معتبر است.
              </p>
            </div>

            <div className="shrink-0 border-t border-[var(--border)] p-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
              <button
                type="button"
                disabled={!canSubmit}
                onClick={handleSubmit}
                className="h-11 w-full rounded-xl bg-[#4DA3FF] font-bold text-[#0B1220] disabled:opacity-40"
              >
                {saving ? 'در حال ثبت...' : 'ثبت فعالیت'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    portalTarget,
  );
}

/** Compact card for a logged activity (used in the day plan and the activities tab). */
export function NonStudyActivityCard({
  category,
  durationMinutes,
  onDelete,
  compact = false,
}: {
  category: string;
  durationMinutes: number | null;
  onDelete?: () => void;
  compact?: boolean;
}) {
  const meta = nonStudyCategory(category);
  return (
    <div
      className={`flex items-center gap-3 rounded-xl border border-dashed ${NON_STUDY_STYLE.border} ${NON_STUDY_STYLE.softBg} ${compact ? 'px-3 py-2.5' : 'p-3.5 md:p-4'}`}
    >
      <span className="text-lg shrink-0 md:text-xl" aria-hidden>{meta.icon}</span>
      <div className="min-w-0 flex-1">
        <p className={`truncate font-medium ${NON_STUDY_STYLE.text} ${compact ? 'text-[12px] md:text-[13px]' : 'text-sm'}`}>{meta.label}</p>
        <p className="mt-0.5 text-[10px] text-[var(--foreground-subtle)] md:text-[11px]">
          {durationMinutes != null && durationMinutes > 0
            ? `${toPersianDigits(durationMinutes)} دقیقه`
            : 'بدون مدت زمان'}
        </p>
      </div>
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          aria-label="حذف فعالیت غیردرسی"
          className="icon-btn flex size-8 shrink-0 items-center justify-center rounded-lg text-[var(--foreground-subtle)] transition-colors hover:text-[var(--danger)]"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
