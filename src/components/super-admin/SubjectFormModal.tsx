'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Loader2, Plus, BookOpen, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';

interface SubjectFormModalProps {
  onClose: () => void;
  onSaved: () => void;
}

const COLORS = [
  '#3EB489', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#06B6D4', '#F97316', '#14B8A6',
  '#A855F7', '#6366F1', '#D946EF', '#84CC16',
  '#A16207', '#0EA5E9',
];

const ICONS = ['📚', '🧬', '⚛️', '⚗️', '📐', '🪨', '🌍', '🎨', '📝', '🌐', '🏛️', '🔢', '📖', '🔬'];

// Grade/Major matrix — super admin picks which combinations apply to this subject.
// A GradeSubject record will be created for each checked cell.
const GRADES = ['دهم', 'یازدهم', 'دوازدهم'] as const;
const MAJORS = ['تجربی', 'ریاضی', 'انسانی'] as const;

// Default matrix: تجربی × all grades (most common for konkur subjects)
const DEFAULT_MATRIX: Record<string, boolean> = {
  'دهم|تجربی': true,
  'یازدهم|تجربی': true,
  'دوازدهم|تجربی': true,
};

export function SubjectFormModal({ onClose, onSaved }: SubjectFormModalProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [icon, setIcon] = useState(ICONS[0]);
  const [isKonkur, setIsKonkur] = useState(true);
  // Grade/major matrix — key is `${grade}|${major}`
  const [matrix, setMatrix] = useState<Record<string, boolean>>({ ...DEFAULT_MATRIX });
  const [saving, setSaving] = useState(false);

  const selectedCount = Object.values(matrix).filter(Boolean).length;

  const toggleCell = (grade: string, major: string) => {
    const key = `${grade}|${major}`;
    setMatrix((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error('نام درس الزامی است');
      return;
    }
    if (selectedCount === 0) {
      toast.error('حداقل یک ترکیب پایه/رشته باید انتخاب شود');
      return;
    }
    setSaving(true);
    try {
      // 1. Create the subject (POST /api/subjects auto-reactivates if soft-deleted)
      const subjectRes = await fetch('/api/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          color,
          icon,
          isKonkur,
          sortOrder: 0,
        }),
      });
      const subjectData = await subjectRes.json();
      if (!subjectRes.ok) throw new Error(subjectData.error || 'خطا در ایجاد درس');
      const subjectId = subjectData.subject.id;
      const wasReactivated = subjectData.reactivated === true;

      // 2. Create GradeSubject records for each checked cell.
      // POST /api/subjects/[id]/grades auto-reactivates if soft-deleted.
      const gradePromises: Promise<{ ok: boolean; grade: string; major: string; error?: string }>[] = [];
      for (const grade of GRADES) {
        for (const major of MAJORS) {
          if (matrix[`${grade}|${major}`]) {
            gradePromises.push(
              (async () => {
                try {
                  const r = await fetch(`/api/subjects/${subjectId}/grades`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ grade, major }),
                  });
                  if (!r.ok) {
                    const d = await r.json().catch(() => ({}));
                    // 409 is OK here — means the GradeSubject already exists (active)
                    if (r.status !== 409) {
                      return { ok: false, grade, major, error: d.error };
                    }
                  }
                  return { ok: true, grade, major };
                } catch {
                  return { ok: false, grade, major, error: 'خطای شبکه' };
                }
              })(),
            );
          }
        }
      }
      const results = await Promise.all(gradePromises);
      const failures = results.filter((r) => !r.ok);

      if (failures.length > 0) {
        const msg = `درس ایجاد شد اما ${failures.length} ترکیب پایه/رشته با خطا مواجه شد`;
        toast.warning(msg);
      } else {
        toast.success(
          wasReactivated
            ? `درس بازیابی شد و ${selectedCount} پایه/رشته تعریف شد`
            : `درس با ${selectedCount} پایه/رشته ایجاد شد`,
        );
      }
      onSaved();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'خطا در ایجاد درس';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="surface-2 edge-highlight rounded-3xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto custom-scrollbar"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-[var(--foreground)]">افزودن درس جدید</h2>
            <p className="text-xs text-[var(--foreground-muted)] mt-0.5">
              نام، رنگ، آیکون، وضعیت کنکور و پایه/رشته‌های قابل‌کاربرد
            </p>
          </div>
          <button
            onClick={onClose}
            className="icon-btn w-9 h-9 rounded-xl border border-[var(--border)] flex items-center justify-center text-[var(--foreground-muted)]"
            aria-label="بستن"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Name */}
        <div className="mb-4">
          <label className="text-xs font-medium text-[var(--foreground-muted)] mb-1.5 block">
            نام درس
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="مثلاً: زیست‌شناسی"
            autoFocus
            className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-3 h-11 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)] focus:outline-none focus:border-[var(--gold)]/40"
          />
        </div>

        {/* Color */}
        <div className="mb-4">
          <label className="text-xs font-medium text-[var(--foreground-muted)] mb-1.5 block">
            رنگ درس
          </label>
          <div className="flex flex-wrap gap-2">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                aria-label={`رنگ ${c}`}
                className={`w-9 h-9 rounded-lg btn-hover transition-all ${
                  color === c ? 'ring-2 ring-offset-2 ring-offset-[var(--bg-overlay)] ring-white/60' : ''
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        {/* Icon */}
        <div className="mb-4">
          <label className="text-xs font-medium text-[var(--foreground-muted)] mb-1.5 block">
            آیکون
          </label>
          <div className="flex flex-wrap gap-2">
            {ICONS.map((ic) => (
              <button
                key={ic}
                type="button"
                onClick={() => setIcon(ic)}
                className={`w-10 h-10 rounded-lg text-lg btn-hover flex items-center justify-center transition-all ${
                  icon === ic
                    ? 'bg-[var(--gold-soft)] border border-[var(--gold)]/40'
                    : 'bg-[var(--bg-elevated)] border border-[var(--border)]'
                }`}
              >
                {ic}
              </button>
            ))}
          </div>
        </div>

        {/* isKonkur toggle */}
        <div className="mb-4">
          <div className="surface-1 rounded-2xl p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[var(--gold-soft)] border border-[var(--gold)]/30 flex items-center justify-center shrink-0">
                <BookOpen className="w-4 h-4 text-[var(--gold)]" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--foreground)]">
                  این درس در کنکور مطرح است؟
                </p>
                <p className="text-[11px] text-[var(--foreground-muted)] mt-0.5 leading-relaxed">
                  در صورت فعال بودن، این درس در فیلد کنکور به دانش‌آموزان نمایش داده می‌شود
                </p>
              </div>
            </div>
            <Switch
              checked={isKonkur}
              onCheckedChange={setIsKonkur}
              className="data-[state=checked]:bg-[var(--gold)] data-[state=unchecked]:bg-[var(--border-strong)]"
            />
          </div>
        </div>

        {/* Grade/Major Matrix */}
        <div className="mb-5">
          <label className="text-xs font-medium text-[var(--foreground-muted)] mb-1.5 block">
            پایه و رشته‌های قابل‌کاربرد
            <span className="text-[var(--foreground-subtle)] mr-2">
              ({toPersianDigits(selectedCount)} انتخاب)
            </span>
          </label>
          <p className="text-[11px] text-[var(--foreground-subtle)] mb-2 leading-relaxed">
            برای هر ترکیب پایه/رشته که این درس در آن ارائه می‌شود، تیک بزنید. دانش‌آموزان فقط دروس متناسب با پایه و رشته خود را می‌بینند.
          </p>
          <div className="surface-1 rounded-xl p-3 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className="text-right text-[var(--foreground-muted)] font-medium pb-2 pr-1">
                    پایه \ رشته
                  </th>
                  {MAJORS.map((m) => (
                    <th key={m} className="text-center text-[var(--foreground-muted)] font-medium pb-2 px-1">
                      {m}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {GRADES.map((grade) => (
                  <tr key={grade}>
                    <td className="text-right text-[var(--foreground)] font-medium py-1.5 pr-1">
                      {grade}
                    </td>
                    {MAJORS.map((major) => {
                      const key = `${grade}|${major}`;
                      const checked = !!matrix[key];
                      return (
                        <td key={major} className="text-center py-1 px-1">
                          <button
                            type="button"
                            onClick={() => toggleCell(grade, major)}
                            aria-label={`${grade} ${major}`}
                            className={`w-8 h-8 rounded-lg btn-hover flex items-center justify-center transition-all mx-auto ${
                              checked
                                ? 'bg-[var(--gold-soft)] border border-[var(--gold)]/40 text-[var(--gold)]'
                                : 'bg-[var(--bg-elevated)] border border-[var(--border)] text-transparent hover:text-[var(--foreground-subtle)]'
                            }`}
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {selectedCount === 0 && (
            <p className="text-[11px] text-[var(--warning)] mt-1.5">
              حداقل یک ترکیب پایه/رشته باید انتخاب شود
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t border-[var(--border)]">
          <button
            onClick={handleSubmit}
            disabled={saving || !name.trim() || selectedCount === 0}
            className="btn-hover glow-hover-gold flex-1 h-11 rounded-xl bg-[var(--gold)] text-zinc-950 font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Plus className="w-4 h-4" />
                ایجاد درس
              </>
            )}
          </button>
          <button
            onClick={onClose}
            className="btn-hover h-11 px-5 rounded-xl border border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] text-sm"
          >
            انصراف
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Local Persian digit helper (avoid importing from a shared util to keep this modal self-contained)
function toPersianDigits(num: number | string): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return num
    .toString()
    .split('')
    .map((d) => persianDigits[parseInt(d)] ?? d)
    .join('');
}
