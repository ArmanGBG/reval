'use client';

import { useState } from 'react';
import { Save, Loader2, Settings, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import { Subject } from '@/lib/subjects-types';
import { Switch } from '@/components/ui/switch';

interface SubjectSettingsPanelProps {
  subject: Subject;
  onUpdated: (subject: Subject) => void;
}

const COLORS = [
  '#3EBA8C', '#D89614', '#E5484D', '#5E6AD2',
  '#EC4899', '#6E7AE0', '#F97316', '#14B8A6',
  '#A855F7', '#6366F1', '#D946EF', '#84CC16',
  '#A16207', '#0EA5E9',
];

const ICONS = ['📚', '🧬', '⚛️', '⚗️', '📐', '🪨', '🌍', '🎨', '📝', '🌐', '🏛️', '🔢', '📖', '🔬'];

export function SubjectSettingsPanel({ subject, onUpdated }: SubjectSettingsPanelProps) {
  const [name, setName] = useState(subject.name);
  const [color, setColor] = useState(subject.color);
  const [icon, setIcon] = useState(subject.icon || '📚');
  const [isKonkur, setIsKonkur] = useState<boolean>(subject.isKonkur ?? false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('نام درس الزامی است');
      return;
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
          isKonkur,
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
            نام، رنگ، آیکون و وضعیت کنکور
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
                type="button"
                onClick={() => setColor(c)}
                aria-label={`رنگ ${c}`}
                className={`w-9 h-9 rounded-lg btn-hover ${
                  color === c ? 'ring-2 ring-offset-2 ring-offset-[var(--bg-elevated)] ring-white/10' : ''
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
                type="button"
                onClick={() => setIcon(ic)}
                className={`w-10 h-10 rounded-lg text-lg btn-hover flex items-center justify-center ${
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
        <div>
          <label className="text-xs font-medium text-[var(--foreground-muted)] mb-1.5 block">
            وضعیت کنکور
          </label>
          <div className="surface-1 rounded-2xl p-4 flex items-center justify-between gap-3 border border-[var(--border)]">
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

        {/* Save button */}
        <div className="pt-4 border-t border-[var(--border)]">
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-hover glow-hover-gold w-full h-11 rounded-xl bg-[var(--gold)] text-white font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4" />
                ذخیره
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
