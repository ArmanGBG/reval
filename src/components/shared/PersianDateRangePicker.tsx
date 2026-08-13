'use client';

import { useState } from 'react';
import { PersianCalendar } from '@/components/plan/PersianCalendar';
import { formatPersianDate, toISODate, toPersianDigits } from '@/lib/persian-date';
import { parseLocalDate } from '@/lib/student-utils';

export interface PersianDateRangeValue { start: string; end: string }

export function PersianDateRangePicker({ value, onChange, maxDays = 60 }: {
  value: PersianDateRangeValue | null;
  onChange: (value: PersianDateRangeValue | null) => void;
  maxDays?: number;
}) {
  const [target, setTarget] = useState<'start' | 'end'>('start');
  const [open, setOpen] = useState(false);
  const selectedDate = target === 'start'
    ? value?.start ?? toISODate(new Date())
    : value?.end ?? value?.start ?? toISODate(new Date());

  const selectDate = (date: string) => {
    const nextStart = target === 'start' ? date : value?.start ?? date;
    const nextEnd = target === 'end' ? date : value?.end ?? date;
    const start = nextStart <= nextEnd ? nextStart : nextEnd;
    let end = nextStart <= nextEnd ? nextEnd : nextStart;
    const startDate = parseLocalDate(start);
    const endDate = parseLocalDate(end);
    const dayCount = Math.floor((endDate.getTime() - startDate.getTime()) / 86400000) + 1;
    if (dayCount > maxDays) {
      const capped = new Date(startDate);
      capped.setDate(capped.getDate() + maxDays - 1);
      end = `${capped.getFullYear()}-${String(capped.getMonth() + 1).padStart(2, '0')}-${String(capped.getDate()).padStart(2, '0')}`;
    }
    onChange({ start, end });
    if (target === 'start') setTarget('end'); else setOpen(false);
  };

  const dayCount = value ? Math.floor((parseLocalDate(value.end).getTime() - parseLocalDate(value.start).getTime()) / 86400000) + 1 : 0;
  return (
    <div className="space-y-3" dir="rtl">
      <div className="flex flex-wrap items-center gap-2">
        {(['start', 'end'] as const).map((key) => <button key={key} onClick={() => { setTarget(key); setOpen(true); }} className={`h-10 rounded-lg border px-3 text-xs ${open && target === key ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]' : 'border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--foreground-muted)]'}`}>
          {key === 'start' ? 'از' : 'تا'}: <span className="font-bold text-[var(--foreground)]">{value?.[key] ? formatPersianDate(parseLocalDate(value[key])) : 'انتخاب تاریخ'}</span>
        </button>)}
        {dayCount > 0 && <span className="text-[10px] text-[var(--accent)]">{toPersianDigits(dayCount)} روز</span>}
      </div>
      {open && <div className="max-w-sm rounded-xl border border-[var(--border)] bg-[var(--bg-base)] p-2"><PersianCalendar selectedDate={selectedDate} onSelect={selectDate} /></div>}
    </div>
  );
}
