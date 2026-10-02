'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { School, Clock, X, Trash2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '@/lib/store';
import { useCurrentStudentId, parseLocalDate } from '@/lib/student-utils';
import { toEnglishDigits } from '@/lib/digits';
import { formatPersianDate, toPersianDigits } from '@/lib/persian-date';
import {
  calculateSchoolDurationMinutes,
  formatDurationHours,
  isValidTimeString,
  timeStringToMinutes,
} from '@/lib/school-presence';
import { SchoolPresence } from '@/lib/types';

interface SchoolPresenceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: string;
  existingRecord?: SchoolPresence | null;
  studentId?: string;
  onSaved?: (record: SchoolPresence) => void;
  onDeleted?: () => void;
}

const COMMON_SCHEDULES = [
  { label: '۰۷:۳۰ تا ۱۲:۳۰', start: '07:30', end: '12:30' },
  { label: '۰۷:۳۰ تا ۱۳:۳۰', start: '07:30', end: '13:30' },
  { label: '۰۷:۳۰ تا ۱۴:۰۰', start: '07:30', end: '14:00' },
  { label: '۰۷:۳۰ تا ۱۴:۳۰', start: '07:30', end: '14:30' },
];

function TimeField({
  label,
  value,
  onChange,
  icon,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  icon: React.ReactNode;
}) {
  const bump = (delta: number) => {
    const total = (((timeStringToMinutes(value) + delta) % 1440) + 1440) % 1440;
    const h = Math.floor(total / 60);
    const m = total % 60;
    onChange(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
  };

  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-400">
        {icon}
        <span>{label}</span>
      </label>
      <div className="flex items-center gap-2" dir="ltr">
        <button
          type="button"
          onClick={() => bump(-15)}
          className="flex h-11 w-11 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-base font-bold text-zinc-300 transition-colors hover:border-blue-500/50 hover:text-blue-400"
          aria-label={`${label} ۱۵ دقیقه کمتر`}
        >
          −
        </button>
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
          placeholder="07:30"
          className="h-11 w-full rounded-lg border border-zinc-800 bg-zinc-900/90 px-3 text-center font-mono text-sm tabular-nums text-zinc-100 outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
        <button
          type="button"
          onClick={() => bump(15)}
          className="flex h-11 w-11 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-base font-bold text-zinc-300 transition-colors hover:border-blue-500/50 hover:text-blue-400"
          aria-label={`${label} ۱۵ دقیقه بیشتر`}
        >
          +
        </button>
      </div>
    </div>
  );
}

export function SchoolPresenceModal({
  open,
  onOpenChange,
  selectedDate,
  existingRecord,
  studentId: studentIdProp,
  onSaved,
  onDeleted,
}: SchoolPresenceModalProps) {
  const currentStudentId = useCurrentStudentId();
  const studentId = studentIdProp ?? currentStudentId;
  const { saveSchoolPresence, deleteSchoolPresence } = useAppStore();

  const [startTime, setStartTime] = useState('07:30');
  const [endTime, setEndTime] = useState('14:00');
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) {
      if (existingRecord) {
        setStartTime(existingRecord.startTime || '07:30');
        setEndTime(existingRecord.endTime || '14:00');
      } else {
        setStartTime('07:30');
        setEndTime('14:00');
      }
    }
  }, [open, existingRecord]);

  const durationMinutes = useMemo(() => {
    if (!isValidTimeString(startTime) || !isValidTimeString(endTime)) return 0;
    return calculateSchoolDurationMinutes(startTime, endTime);
  }, [startTime, endTime]);

  const isValid = durationMinutes > 0;

  const handleSave = async () => {
    if (!isValid) {
      toast.error('ساعت شروع و پایان معتبر نیست');
      return;
    }
    setSaving(true);
    try {
      await saveSchoolPresence({
        userId: studentId,
        date: selectedDate,
        startTime,
        endTime,
      });
      toast.success('ساعت حضور در مدرسه ثبت شد');
      onOpenChange(false);
      onSaved?.({
        id: existingRecord?.id || crypto.randomUUID(),
        userId: studentId,
        date: selectedDate,
        startTime,
        endTime,
        durationMinutes,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'خطا در ثبت ساعت مدرسه');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!existingRecord?.id) return;
    if (!window.confirm('آیا مطمئن هستید که می‌خواهید ساعت مدرسه این روز را حذف کنید؟')) return;
    setSaving(true);
    try {
      await deleteSchoolPresence(existingRecord.id);
      toast.success('ساعت مدرسه حذف شد');
      onOpenChange(false);
      onDeleted?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'خطا در حذف ساعت مدرسه');
    } finally {
      setSaving(false);
    }
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-xs"
            onClick={() => onOpenChange(false)}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            className="relative w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-zinc-100 shadow-2xl"
            dir="rtl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-400">
                  <School className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-100">
                    {existingRecord ? 'ویرایش ساعت حضور در مدرسه' : 'ثبت ساعت حضور در مدرسه'}
                  </h3>
                  <p className="text-xs text-zinc-400">
                    {formatPersianDate(parseLocalDate(selectedDate))}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content */}
            <div className="mt-5 space-y-4">
              {/* Quick Picks */}
              <div>
                <label className="mb-2 block text-xs font-medium text-zinc-400">
                  برنامه‌های متداول:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {COMMON_SCHEDULES.map((item) => {
                    const isSelected = startTime === item.start && endTime === item.end;
                    return (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => {
                          setStartTime(item.start);
                          setEndTime(item.end);
                        }}
                        className={`rounded-lg border px-2.5 py-2 text-xs font-medium transition-all ${
                          isSelected
                            ? 'border-blue-500 bg-blue-500/15 text-blue-300'
                            : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time Pickers */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <TimeField
                  label="ساعت ورود"
                  value={startTime}
                  onChange={setStartTime}
                  icon={<Clock className="h-3.5 w-3.5 text-blue-400" />}
                />
                <TimeField
                  label="ساعت خروج"
                  value={endTime}
                  onChange={setEndTime}
                  icon={<Clock className="h-3.5 w-3.5 text-blue-400" />}
                />
              </div>

              {/* Duration Preview Card */}
              <div className="flex items-center justify-between rounded-xl border border-blue-900/40 bg-blue-950/20 p-3.5">
                <span className="text-xs text-zinc-400">مجموع مدت حضور:</span>
                <span className="font-mono text-sm font-bold text-blue-400" dir="rtl">
                  {formatDurationHours(durationMinutes)} ساعت ({toPersianDigits(durationMinutes)} دقیقه)
                </span>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="mt-6 flex items-center justify-between gap-3 border-t border-zinc-800/80 pt-4">
              {existingRecord ? (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={saving}
                  className="flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-400 transition-colors hover:bg-red-500/20 disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>حذف</span>
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  disabled={saving}
                  className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!isValid || saving}
                  className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-md transition-all hover:bg-blue-500 disabled:opacity-50"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>{saving ? 'در حال ثبت...' : 'ثبت ساعت مدرسه'}</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

export default SchoolPresenceModal;
