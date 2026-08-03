'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Save, Loader2, Settings, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import {
  Subject,
  ASSESSMENT_TYPES,
  DISPLAY_STRATEGIES,
  CATEGORIES,
  FINAL_STRATEGIES,
} from '@/lib/subjects-types';

interface SubjectSettingsPanelProps {
  subject: Subject;
  onUpdated: (subject: Subject) => void;
}

export function SubjectSettingsPanel({ subject, onUpdated }: SubjectSettingsPanelProps) {
  const [name, setName] = useState(subject.name);
  const [color, setColor] = useState(subject.color);
  const [icon, setIcon] = useState(subject.icon || '📚');
  const [assessmentType, setAssessmentType] = useState(subject.assessmentType);
  const [displayStrategy, setDisplayStrategy] = useState(subject.displayStrategy);
  const [category, setCategory] = useState(subject.category);
  const [finalStrategy, setFinalStrategy] = useState(subject.finalStrategy || 'default');
  const [saving, setSaving] = useState(false);

  const COLORS = [
    '#3EB489', '#F59E0B', '#EF4444', '#8B5CF6',
    '#EC4899', '#06B6D4', '#F97316', '#14B8A6',
    '#A855F7', '#6366F1', '#D946EF', '#84CC16',
    '#A16207', '#0EA5E9',
  ];
  const ICONS = ['📚', '🧬', '⚛️', '⚗️', '📐', '🪨', '🌍', '🎨', '📝', '🌐', '🏛️', '🔢', '📖', '🔬'];

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('نام درس الزامی است');
      return;
    }
    // If switching to chapter-only mode, delete all topic modes first
    const wasNotChapter = subject.displayStrategy !== 'chapter';
    const isNowChapter = displayStrategy === 'chapter';
    if (wasNotChapter && isNowChapter) {
      const ok = confirm(
        'با تغییر استراتژی به «فقط فصل‌به‌فصل»، تمام مباحث کنکوری این درس حذف خواهند شد. ادامه می‌دهید؟'
      );
      if (!ok) {
        setSaving(false);
        return;
      }
      try {
        // Fetch existing topic modes and delete them
        const modesRes = await fetch(`/api/subjects/${subject.id}/topic-modes`);
        const modesData = await modesRes.json();
        for (const mode of modesData.topicModes || []) {
          await fetch(`/api/subjects/${subject.id}/topic-modes/${mode.id}`, {
            method: 'DELETE',
          });
        }
      } catch {
        // non-fatal
      }
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/subjects/${subject.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          color,
          icon,
          assessmentType,
          displayStrategy,
          category,
          finalStrategy,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطا در به‌روزرسانی');
      onUpdated(data.subject);
      toast.success('تنظیمات درس به‌روزرسانی شد');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'خطا در به‌روزرسانی';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="surface-1 rounded-2xl p-4 flex items-center gap-3">
        <Settings className="w-5 h-5 text-[var(--gold)]" />
        <div>
          <h2 className="text-base font-bold text-[var(--foreground)]">تنظیمات درس</h2>
          <p className="text-xs text-[var(--foreground-muted)] mt-0.5">
            ویژگی‌های پایه، استراتژی نمایش و نوع ارزیابی
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="surface-1 rounded-2xl p-5 space-y-5">
        {/* Name */}
        <div>
          <label className="text-xs font-medium text-[var(--foreground-muted)] mb-1.5 block">
            نام درس
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-3 h-11 text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--gold)]/40"
          />
        </div>

        {/* Color */}
        <div>
          <label className="text-xs font-medium text-[var(--foreground-muted)] mb-1.5 block">
            رنگ
          </label>
          <div className="flex flex-wrap gap-2">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-8 h-8 rounded-lg btn-hover ${
                  color === c ? 'ring-2 ring-offset-2 ring-offset-[var(--bg-elevated)] ring-white/60' : ''
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        {/* Icon */}
        <div>
          <label className="text-xs font-medium text-[var(--foreground-muted)] mb-1.5 block">
            آیکون
          </label>
          <div className="flex flex-wrap gap-2">
            {ICONS.map((ic) => (
              <button
                key={ic}
                onClick={() => setIcon(ic)}
                className={`w-9 h-9 rounded-lg text-lg btn-hover flex items-center justify-center ${
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
        <div>
          <label className="text-xs font-medium text-[var(--foreground-muted)] mb-1.5 block">
            نوع ارزیابی
          </label>
          <div className="grid grid-cols-3 gap-2">
            {ASSESSMENT_TYPES.map((asm) => (
              <button
                key={asm}
                onClick={() => setAssessmentType(asm)}
                className={`btn-hover h-10 rounded-xl text-xs font-medium border ${
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
        <div>
          <label className="text-xs font-medium text-[var(--foreground-muted)] mb-1.5 block">
            استراتژی نمایش به دانش‌آموز
          </label>
          <div className="space-y-2">
            {DISPLAY_STRATEGIES.map((strat) => (
              <button
                key={strat.value}
                onClick={() => setDisplayStrategy(strat.value)}
                className={`btn-hover w-full h-10 rounded-xl text-xs font-medium border text-right px-3 ${
                  displayStrategy === strat.value
                    ? 'bg-[var(--gold-soft)] border-[var(--gold)]/40 text-[var(--gold)]'
                    : 'bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--foreground-muted)]'
                }`}
              >
                {strat.label}
              </button>
            ))}
          </div>
          {displayStrategy === 'chapter' && (
            <p className="text-[10px] text-amber-400/80 mt-2 px-1 leading-relaxed">
              ⚠️ با انتخاب «فقط فصل‌به‌فصل»، تب «مباحث کنکوری» برای این درس پنهان می‌شود. مباحث قبلی (در صورت وجود) حذف خواهند شد.
            </p>
          )}
        </div>

        {/* Category */}
        <div>
          <label className="text-xs font-medium text-[var(--foreground-muted)] mb-1.5 block">
            دسته‌بندی
          </label>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`btn-hover h-10 rounded-xl text-xs font-medium border ${
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
          <div>
            <label className="text-xs font-medium text-[var(--foreground-muted)] mb-1.5 block">
              استراتژی امتحان نهایی
            </label>
            <div className="space-y-2">
              {FINAL_STRATEGIES.map((fs) => (
                <button
                  key={fs.value}
                  onClick={() => setFinalStrategy(fs.value)}
                  className={`btn-hover w-full h-10 rounded-xl text-xs font-medium border text-right px-3 ${
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

        {/* Save button */}
        <div className="pt-4 border-t border-[var(--border)]">
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-hover glow-hover-gold glow-hover w-full h-11 rounded-xl bg-[var(--gold)] text-zinc-950 font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4" />
                ذخیره تغییرات
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
