'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import {
  ASSESSMENT_TYPES,
  DISPLAY_STRATEGIES,
  CATEGORIES,
  FINAL_STRATEGIES,
} from '@/lib/subjects-types';

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

export function SubjectFormModal({ onClose, onSaved }: SubjectFormModalProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [icon, setIcon] = useState(ICONS[0]);
  const [assessmentType, setAssessmentType] = useState<string>('کنکور');
  const [displayStrategy, setDisplayStrategy] = useState<string>('both');
  const [category, setCategory] = useState<string>('اختصاصی');
  const [finalStrategy, setFinalStrategy] = useState<string>('default');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error('نام درس الزامی است');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          color,
          icon,
          assessmentType,
          displayStrategy,
          category,
          finalStrategy,
          sortOrder: 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطا در ایجاد درس');
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
              ساختار درختی دروس، فصل‌ها و مباحث
            </p>
          </div>
          <button
            onClick={onClose}
            className="icon-btn w-9 h-9 rounded-xl border border-[var(--border)] flex items-center justify-center text-[var(--foreground-muted)]"
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
                onClick={() => setColor(c)}
                className={`w-8 h-8 rounded-lg btn-hover transition-all ${
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
                onClick={() => setIcon(ic)}
                className={`w-9 h-9 rounded-lg text-lg btn-hover flex items-center justify-center transition-all ${
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

        {/* Assessment Type */}
        <div className="mb-4">
          <label className="text-xs font-medium text-[var(--foreground-muted)] mb-1.5 block">
            نوع ارزیابی
          </label>
          <div className="grid grid-cols-3 gap-2">
            {ASSESSMENT_TYPES.map((asm) => (
              <button
                key={asm}
                onClick={() => setAssessmentType(asm)}
                className={`btn-hover h-10 rounded-xl text-xs font-medium border transition-all ${
                  assessmentType === asm
                    ? 'bg-[var(--gold-soft)] border-[var(--gold)]/40 text-[var(--gold)]'
                    : 'bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--foreground-muted)]'
                }`}
              >
                {asm}
              </button>
            ))}
          </div>
        </div>

        {/* Display Strategy */}
        <div className="mb-4">
          <label className="text-xs font-medium text-[var(--foreground-muted)] mb-1.5 block">
            استراتژی نمایش
          </label>
          <div className="grid grid-cols-1 gap-2">
            {DISPLAY_STRATEGIES.map((strat) => (
              <button
                key={strat.value}
                onClick={() => setDisplayStrategy(strat.value)}
                className={`btn-hover h-10 rounded-xl text-xs font-medium border transition-all text-right px-3 ${
                  displayStrategy === strat.value
                    ? 'bg-[var(--gold-soft)] border-[var(--gold)]/40 text-[var(--gold)]'
                    : 'bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--foreground-muted)]'
                }`}
              >
                {strat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Category */}
        <div className="mb-4">
          <label className="text-xs font-medium text-[var(--foreground-muted)] mb-1.5 block">
            دسته‌بندی
          </label>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`btn-hover h-10 rounded-xl text-xs font-medium border transition-all ${
                  category === cat
                    ? 'bg-[var(--gold-soft)] border-[var(--gold)]/40 text-[var(--gold)]'
                    : 'bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--foreground-muted)]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Final Strategy (only if نهایی or هر دو) */}
        {(assessmentType === 'نهایی' || assessmentType === 'هر دو') && (
          <div className="mb-4">
            <label className="text-xs font-medium text-[var(--foreground-muted)] mb-1.5 block">
              استراتژی امتحان نهایی
            </label>
            <div className="grid grid-cols-1 gap-2">
              {FINAL_STRATEGIES.map((fs) => (
                <button
                  key={fs.value}
                  onClick={() => setFinalStrategy(fs.value)}
                  className={`btn-hover h-10 rounded-xl text-xs font-medium border transition-all text-right px-3 ${
                    finalStrategy === fs.value
                      ? 'bg-[var(--gold-soft)] border-[var(--gold)]/40 text-[var(--gold)]'
                      : 'bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--foreground-muted)]'
                  }`}
                >
                  {fs.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t border-[var(--border)]">
          <button
            onClick={handleSubmit}
            disabled={saving || !name.trim()}
            className="btn-hover glow-hover-gold glow-hover flex-1 h-11 rounded-xl bg-[var(--gold)] text-zinc-950 font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
