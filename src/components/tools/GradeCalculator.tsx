'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { numericInput } from '@/lib/phone';
import { calculateTestPercentage, formatTestPercentage } from '@/lib/test-percentage';

type AnswerField = 'correct' | 'wrong' | 'blank';

const FIELDS: Array<{ id: AnswerField; label: string; hint: string }> = [
  { id: 'correct', label: 'تعداد درست', hint: 'پاسخ‌های صحیح' },
  { id: 'wrong', label: 'تعداد غلط', hint: 'پاسخ‌های نادرست' },
  { id: 'blank', label: 'تعداد نزده', hint: 'بدون پاسخ' },
];

export default function GradeCalculator() {
  const [values, setValues] = useState<Record<AnswerField, string>>({ correct: '', wrong: '', blank: '' });
  const correct = Number(values.correct || 0);
  const wrong = Number(values.wrong || 0);
  const blank = Number(values.blank || 0);
  const result = calculateTestPercentage(correct, wrong, blank);

  const update = (field: AnswerField, value: string) => {
    setValues((current) => ({ ...current, [field]: numericInput(value, 5) }));
  };

  return (
    <div className="space-y-5" dir="rtl">
      <div>
        <h3 className="text-base font-bold text-[var(--foreground)]">محاسبه درصد با نمره منفی</h3>
        <p className="mt-1 text-xs leading-6 text-[var(--foreground-muted)]">تعداد پاسخ‌ها را وارد کنید؛ خانه‌های خالی صفر در نظر گرفته می‌شوند.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {FIELDS.map((field) => (
          <label key={field.id} className="surface-1 rounded-xl border border-[var(--border)] p-3">
            <span className="block text-xs font-semibold text-[var(--foreground)]">{field.label}</span>
            <span className="mt-0.5 block text-[10px] text-[var(--foreground-subtle)]">{field.hint}</span>
            <input
              type="text"
              inputMode="numeric"
              value={values[field.id]}
              onChange={(event) => update(field.id, event.target.value)}
              placeholder="۰"
              className="mt-3 h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-overlay)] px-3 text-center text-lg font-bold tabular-nums text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]"
            />
          </label>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <motion.div layout className="surface-2 rounded-xl border border-[var(--accent)]/25 p-4">
          <div className="flex items-center justify-between gap-3">
            <div><p className="text-xs text-[var(--foreground-muted)]">درصد شما</p><p className="mt-1 text-[10px] text-[var(--foreground-subtle)]">از {result.total} سوال</p></div>
            <motion.strong key={result.percentage} initial={{ scale: 0.9, opacity: 0.5 }} animate={{ scale: 1, opacity: 1 }} className="text-3xl font-black tabular-nums text-[var(--accent)]">{formatTestPercentage(result.percentage)}</motion.strong>
          </div>
          <p className="mt-3 border-t border-[var(--border)] pt-3 text-[10px] leading-5 text-[var(--foreground-subtle)]" dir="ltr">(({correct} × 3) - {wrong}) ÷ ({result.total} × 3) × 100</p>
        </motion.div>

        <motion.div layout className="surface-1 rounded-xl border border-[var(--warning)]/25 p-4">
          <div className="flex items-center justify-between gap-3">
            <div><p className="text-xs text-[var(--foreground-muted)]">اگر غلط‌ها را نزده می‌گذاشتی</p><p className="mt-1 text-[10px] text-[var(--foreground-subtle)]">{correct} درست، ۰ غلط، {blank + wrong} نزده</p></div>
            <motion.strong key={result.noWrongPercentage} initial={{ scale: 0.9, opacity: 0.5 }} animate={{ scale: 1, opacity: 1 }} className="text-3xl font-black tabular-nums text-[var(--warning)]">{formatTestPercentage(result.noWrongPercentage)}</motion.strong>
          </div>
          <p className="mt-3 border-t border-[var(--border)] pt-3 text-xs leading-6 text-[var(--foreground-muted)]">پاسخ غلط علاوه بر از دست‌دادن امتیاز سوال، یک‌سوم امتیاز مثبت را هم کم می‌کند.</p>
        </motion.div>
      </div>
    </div>
  );
}
