'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Moon, Sun, X } from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '@/lib/store';
import { useCurrentStudentId } from '@/lib/student-utils';
import { toEnglishDigits, normalizeNumericInput } from '@/lib/digits';
import { formatPersianDate, toPersianDigits } from '@/lib/persian-date';
import { PersianDatePicker } from '@/components/shared/PersianDatePicker';
import { formatTimePersian, timeToMinutes } from '@/lib/sleep';

const NAP_QUICK_PICKS = [30, 60];

/**
 * HH:mm input with ±15-minute steppers. Defined OUTSIDE the modal component
 * so its identity is stable — defining it inline remounts the input on every
 * keystroke and drops focus ("می‌ندازه بیرون").
 */
function TimeField({ label, value, onChange, icon }: { label: string; value: string; onChange: (v: string) => void; icon: React.ReactNode }) {
  const bump = (delta: number) => {
    const next = (((timeToMinutes(value) + delta) % 1440) + 1440) % 1440;
    onChange(`${String(Math.floor(next / 60)).padStart(2, '0')}:${String(next % 60).padStart(2, '0')}`);
  };
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1 text-xs font-medium text-[var(--foreground-muted)]">{icon}{label}</label>
      <div className="flex items-center gap-2" dir="ltr">
        <button type="button" onClick={() => bump(-15)} className="icon-btn h-11 w-11 rounded-lg border border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--accent)]" aria-label={`${label} ۱۵ دقیقه کمتر`}>−</button>
        <input
          type="text"
          inputMode="numeric"
          value={value}
          onChange={(event) => {
            const raw = toEnglishDigits(event.target.value).replace(/[^\d:]/g, '');
            if (raw.length <= 5) onChange(raw);
          }}
          onBlur={() => {
            const m = /^(\d{1,2}):?(\d{0,2})$/.exec(toEnglishDigits(value));
            if (!m) return;
            const h = Math.min(23, Number(m[1] || 0));
            const min = m[2] ? Math.min(59, Number(m[2].padEnd(2, '0'))) : 0;
            onChange(`${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`);
          }}
          placeholder="23:00"
          className="h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-base)] px-3 text-center font-mono text-sm tabular-nums text-[var(--foreground)] outline-none focus:border-[#72A8FF]"
        />
        <button type="button" onClick={() => bump(15)} className="icon-btn h-11 w-11 rounded-lg border border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--accent)]" aria-label={`${label} ۱۵ دقیقه بیشتر`}>+</button>
      </div>
      <p className="mt-1 text-center text-[11px] text-[var(--foreground-subtle)]" dir="rtl">{formatTimePersian(value)}</p>
    </div>
  );
}

/**
 * Logs sleep for a given date. Two segments:
 * - خواب شبانه: bedtime + wake time (duration derived; crossing midnight OK;
 *   re-submitting the same night replaces the record).
 * - چرت: start time + duration with 30/60-minute quick picks.
 * Mobile bottom sheet / desktop centered card, portaled to <body>.
 */
export function SleepEntryModal({
  open,
  onOpenChange,
  date: dateProp,
  studentId: studentIdProp,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: string;
  studentId?: string;
}) {
  const { saveNightSleep, saveNap, sleepRecords } = useAppStore();
  const currentStudentId = useCurrentStudentId();
  const studentId = studentIdProp ?? currentStudentId;
  const [mode, setMode] = useState<'night' | 'nap'>('night');
  const [date, setDate] = useState(dateProp);
  const [bedTime, setBedTime] = useState('23:00');
  const [wakeTime, setWakeTime] = useState('07:00');
  const [napStart, setNapStart] = useState('14:00');
  const [napMinutes, setNapMinutes] = useState('30');
  const [saving, setSaving] = useState(false);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setPortalTarget(document.body);
  }, []);

  // Pre-fill from an existing record for the chosen date + reset on open.
  // The internal `date` starts at the caller's date and can be changed with
  // the picker (e.g. logging a forgotten previous day).
  useEffect(() => {
    if (!open) return;
    setDate(dateProp);
    const night = sleepRecords.find((r) => r.studentId === studentId && r.date === dateProp && r.type === 'NIGHT');
    const nap = sleepRecords.find((r) => r.studentId === studentId && r.date === dateProp && r.type === 'NAP');
    setMode('night');
    setBedTime(night?.startTime ?? '23:00');
    setWakeTime(night?.endTime ?? '07:00');
    setNapStart(nap?.startTime ?? '14:00');
    setNapMinutes(String(nap?.durationMinutes ?? 30));
  }, [open, dateProp, studentId, sleepRecords]);

  // When the user picks a different date inside the modal, refresh the
  // pre-filled times from that date's existing records (if any).
  const handleDateChange = (next: string) => {
    setDate(next);
    const night = sleepRecords.find((r) => r.studentId === studentId && r.date === next && r.type === 'NIGHT');
    const nap = sleepRecords.find((r) => r.studentId === studentId && r.date === next && r.type === 'NAP');
    setBedTime(night?.startTime ?? '23:00');
    setWakeTime(night?.endTime ?? '07:00');
    setNapStart(nap?.startTime ?? '14:00');
    setNapMinutes(String(nap?.durationMinutes ?? 30));
  };

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

  const handleSubmit = async () => {
    setSaving(true);
    try {
      if (mode === 'night') {
        await saveNightSleep({ studentId, date, startTime: bedTime, endTime: wakeTime });
        toast.success('خواب شبانه ثبت شد');
      } else {
        const minutes = Number(toEnglishDigits(napMinutes));
        await saveNap({ studentId, date, startTime: napStart, durationMinutes: minutes });
        toast.success('چرت ثبت شد');
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'ثبت خواب ناموفق بود');
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
            aria-label="ثبت خواب"
          >
            <div className="shrink-0 border-b border-[var(--border)] px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] text-right md:pt-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-base font-semibold text-[var(--foreground)]">ثبت خواب</h2>
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  aria-label="بستن"
                  className="flex size-9 items-center justify-center rounded-md border border-[var(--border)] text-[var(--foreground-muted)] transition-colors hover:text-[var(--foreground)]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
              {/* Date picker — log any date (e.g. a forgotten previous day) */}
              <div className="mb-4">
                <PersianDatePicker value={date} onChange={handleDateChange} label="تاریخ" />
                <p className="mt-1.5 text-[11px] text-[var(--foreground-subtle)]">
                  {formatPersianDate(new Date(`${date}T00:00:00`))} — روز دیگری هم می‌توانید انتخاب کنید
                </p>
              </div>

              {/* Mode segment */}
              <div className="mb-4 grid grid-cols-2 gap-1 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-1">
                <button
                  type="button"
                  onClick={() => setMode('night')}
                  aria-pressed={mode === 'night'}
                  className={`flex min-h-11 items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-colors ${
                    mode === 'night' ? 'bg-[#5B7FD9]/20 text-[#9DBBFF]' : 'text-[var(--foreground-muted)]'
                  }`}
                >
                  <Moon className="w-4 h-4" />
                  خواب شبانه
                </button>
                <button
                  type="button"
                  onClick={() => setMode('nap')}
                  aria-pressed={mode === 'nap'}
                  className={`flex min-h-11 items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-colors ${
                    mode === 'nap' ? 'bg-[#F5B96B]/20 text-[#F5C98A]' : 'text-[var(--foreground-muted)]'
                  }`}
                >
                  <Sun className="w-4 h-4" />
                  چرت روزانه
                </button>
              </div>

              {mode === 'night' ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <TimeField label="ساعت خواب" value={bedTime} onChange={setBedTime} icon={<Moon className="w-3 h-3" />} />
                    <TimeField label="ساعت بیداری" value={wakeTime} onChange={setWakeTime} icon={<Sun className="w-3 h-3" />} />
                  </div>
                  <p className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-3 text-[11px] leading-6 text-[var(--foreground-muted)]">
                    اگر خواب از نیمه‌شب بگذرد مشکلی نیست — طول خواب خودکار حساب می‌شود. ثبت مجدد همان شب، قبلی را جایگزین می‌کند.
                  </p>
                </>
              ) : (
                <>
                  <TimeField label="ساعت شروع چرت" value={napStart} onChange={setNapStart} icon={<Sun className="w-3 h-3" />} />
                  <label className="mt-4 block text-xs font-medium text-[var(--foreground-muted)]">مدت چرت (دقیقه)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={napMinutes}
                    onChange={(event) => setNapMinutes(normalizeNumericInput(event.target.value))}
                    placeholder="مثلاً ۴۵"
                    className="mt-1.5 h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-base)] px-3 text-sm text-[var(--foreground)] outline-none focus:border-[#F5B96B]"
                    dir="ltr"
                  />
                  <div className="mt-2 flex gap-2">
                    {NAP_QUICK_PICKS.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setNapMinutes(String(m))}
                        className={`h-10 flex-1 rounded-lg border text-xs font-bold transition-colors ${
                          Number(toEnglishDigits(napMinutes)) === m
                            ? 'border-[#F5B96B]/40 bg-[#F5B96B]/15 text-[#F5C98A]'
                            : 'border-[var(--border)] text-[var(--foreground-muted)]'
                        }`}
                      >
                        {toPersianDigits(m)} دقیقه
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="shrink-0 border-t border-[var(--border)] p-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
              <button
                type="button"
                disabled={saving}
                onClick={handleSubmit}
                className="h-11 w-full rounded-xl bg-[#5B7FD9] font-bold text-[#0B1220] disabled:opacity-40"
              >
                {saving ? 'در حال ثبت...' : mode === 'night' ? 'ثبت خواب شبانه' : 'ثبت چرت'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    portalTarget,
  );
}
