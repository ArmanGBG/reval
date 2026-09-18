'use client';

import { useState } from 'react';
import { Save, Loader2, Settings, Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Subject } from '@/lib/subjects-types';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface SubjectSettingsPanelProps {
  subject: Subject;
  onUpdated: (subject: Subject) => void;
  onClose?: () => void;
}

const COLORS = [
  '#3EBA8C', '#C9A24D', '#E5484D', '#5E6AD2',
  '#EC4899', '#6E7AE0', '#F97316', '#14B8A6',
  '#A855F7', '#6366F1', '#D946EF', '#84CC16',
  '#A16207', '#0EA5E9',
];

const ICONS = ['📚', '🧬', '⚛️', '⚗️', '📐', '🪨', '🌍', '🎨', '📝', '🌐', '🏛️', '🔢', '📖', '🔬'];

export function SubjectSettingsPanel({ subject, onUpdated, onClose }: SubjectSettingsPanelProps) {
  const [name, setName] = useState(subject.name);
  const [color, setColor] = useState(subject.color);
  const [icon, setIcon] = useState(subject.icon || '📚');
  const [sortOrder, setSortOrder] = useState(subject.sortOrder);
  const [isActive, setIsActive] = useState(subject.isActive);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

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
          sortOrder,
          isActive,
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

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/subjects/${subject.id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'حذف درس ناموفق بود');
      toast.success(`درس «${subject.name}» حذف شد`);
      setDeleteOpen(false);
      // Give the dialog a tick to close before notifying parent
      setTimeout(() => {
        onClose?.();
      }, 50);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'حذف درس ناموفق بود';
      toast.error(msg);
    } finally {
      setDeleting(false);
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
            فراداده، ترتیب نمایش و وضعیت کلی درس
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-[var(--foreground-muted)] mb-1.5 block">
              ترتیب نمایش
            </label>
            <input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value) || 0)}
              className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-3 h-11 text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--gold)]/40"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--foreground-muted)] mb-1.5 block">
              وضعیت درس
            </label>
            <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-3 h-11 flex items-center justify-between gap-3">
              <span className="text-sm text-[var(--foreground)]">{isActive ? 'فعال' : 'غیرفعال'}</span>
              <Switch
                checked={isActive}
                onCheckedChange={setIsActive}
                className="data-[state=checked]:bg-[var(--gold)] data-[state=unchecked]:bg-[var(--border-strong)]"
              />
            </div>
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

      {/* ============ Delete Subject (danger zone) ============ */}
      <div className="surface-1 rounded-2xl p-5 border border-[var(--danger)]/25 bg-[var(--danger)]/[0.03]">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-4 h-4 text-[var(--danger)]" />
          <h3 className="text-sm font-bold text-[var(--danger)]">منطقه خطر</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
          با کلیک روی «حذف درس»، این درس به‌صورت نرم حذف می‌شود. دانش‌آموزان دیگر آن را در فهرست دروس نخواهند دید اما تسک‌های ثبت‌شده نگه داشته می‌شوند. این عمل قابل بازگشت نیست.
        </p>
        <AlertDialog open={deleteOpen} onOpenChange={(open) => { setDeleteOpen(open); if (!open) setDeleting(false); }}>
          <AlertDialogTrigger asChild>
            <button
              type="button"
              className="btn-hover w-full h-11 rounded-xl border border-[var(--danger)]/40 text-[var(--danger)] bg-[var(--danger)]/5 hover:bg-[var(--danger)]/10 font-bold text-sm flex items-center justify-center gap-2 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              حذف درس
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent dir="rtl">
            <AlertDialogHeader>
              <AlertDialogTitle>حذف درس «{subject.name}»؟</AlertDialogTitle>
              <AlertDialogDescription>
                این عمل قابل بازگشت نیست. درس از فهرست دروس دانش‌آموزان مخفی می‌شود ولی تسک‌های ثبت‌شده حفظ می‌گردند.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>انصراف</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-white hover:bg-destructive/90"
                disabled={deleting}
                onClick={(e) => {
                  e.preventDefault();
                  void handleDelete();
                }}
              >
                {deleting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    در حال حذف...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Trash2 className="w-4 h-4" />
                    حذف درس
                  </span>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
