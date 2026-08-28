'use client';

import { useState } from 'react';
import { CalendarDays, ChevronDown } from 'lucide-react';
import { PersianCalendar } from '@/components/plan/PersianCalendar';
import { formatPersianDate, getPersianWeekdayName } from '@/lib/persian-date';
import { parseLocalDate } from '@/lib/student-utils';

export function PersianDatePicker({
  value,
  onChange,
  label = 'تاریخ',
}: {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = parseLocalDate(value);

  return (
    <div className="space-y-2" dir="rtl">
      <label className="block text-xs text-[var(--foreground-muted)]">{label}</label>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`flex min-h-11 w-full items-center gap-2 rounded-xl border bg-[var(--bg-elevated)] px-3 text-right text-sm transition-colors ${open ? 'border-[var(--accent)]/60' : 'border-[var(--border)]'}`}
        aria-expanded={open}
      >
        <CalendarDays className="size-4 shrink-0 text-[var(--accent)]" aria-hidden="true" />
        <span className="min-w-0 flex-1 font-semibold text-[var(--foreground)]">
          {getPersianWeekdayName(selected)}، {formatPersianDate(selected)}
        </span>
        <ChevronDown className={`size-4 shrink-0 text-[var(--foreground-muted)] transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      {open && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-base)] p-2">
          <PersianCalendar
            selectedDate={value}
            onSelect={(nextDate) => {
              onChange(nextDate);
              setOpen(false);
            }}
          />
        </div>
      )}
    </div>
  );
}
