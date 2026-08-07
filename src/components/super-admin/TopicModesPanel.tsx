'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, X, Loader2, Save, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Subject, TopicMode } from '@/lib/subjects-types';

function toPersianDigits(num: number | string): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return num
    .toString()
    .split('')
    .map((d) => persianDigits[parseInt(d)] ?? d)
    .join('');
}

interface TopicModesPanelProps {
  subject: Subject;
  topicModes: TopicMode[];
  onRefresh: () => void;
}

export function TopicModesPanel({ subject, topicModes, onRefresh }: TopicModesPanelProps) {
  const [editing, setEditing] = useState<TopicMode | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const handleDelete = async (mode: TopicMode) => {
    if (!confirm(`مبحث «${mode.title}» حذف شود؟`)) return;
    try {
      const res = await fetch(`/api/subjects/${subject.id}/topic-modes/${mode.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'خطا در حذف');
      }
      toast.success('مبحث حذف شد');
      onRefresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'خطا در حذف مبحث';
      toast.error(msg);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="surface-1 rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-[var(--gold)]" />
          <div>
            <h2 className="text-base font-bold text-[var(--foreground)]">مباحث کنکوری (یکپارچه)</h2>
            <p className="text-xs text-[var(--foreground-muted)] mt-0.5">
              لیست مباحث مبحثی برای حالت نمایش یکپارچه کنکوری
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="btn-hover glow-hover-gold glow-hover inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-[var(--gold-soft)] border border-[var(--gold)]/30 text-[var(--gold)] text-xs font-semibold"
        >
          <Plus className="w-3.5 h-3.5" />
          افزودن مبحث
        </button>
      </div>

      {/* List */}
      {topicModes.length === 0 ? (
        <div className="surface-1 rounded-2xl p-12 text-center">
          <Sparkles className="w-12 h-12 mx-auto text-[var(--foreground-subtle)] mb-3" />
          <p className="text-sm text-[var(--foreground-muted)] mb-4">
            هنوز مبحثی برای این درس ثبت نشده است
          </p>
          <button
            onClick={() => setShowAdd(true)}
            className="btn-hover glow-hover-gold glow-hover inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-[var(--gold)] text-white font-bold text-sm"
          >
            <Plus className="w-4 h-4" />
            افزودن مبحث اول
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {topicModes.map((mode, idx) => (
              <motion.div
                key={mode.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.25, delay: idx * 0.03 }}
                className="surface-1 edge-highlight rounded-xl p-4 flex items-start gap-3 card-hover"
              >
                {/* Number badge */}
                <div className="w-9 h-9 rounded-xl bg-[var(--gold-soft)] border border-[var(--gold)]/30 flex items-center justify-center shrink-0">
                  <span className="text-sm font-black text-[var(--gold)]">
                    {toPersianDigits(mode.modeNo)}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-[var(--foreground)] mb-1">
                    {mode.title}
                  </h3>
                  {mode.description && (
                    <p className="text-xs text-[var(--foreground-muted)] leading-relaxed">
                      {mode.description}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-1">
                  <button
                    onClick={() => setEditing(mode)}
                    className="icon-btn w-8 h-8 rounded-lg flex items-center justify-center text-[var(--foreground-muted)]"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(mode)}
                    className="icon-btn w-8 h-8 rounded-lg flex items-center justify-center text-[var(--foreground-muted)] hover:text-[var(--danger)]"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Add/Edit Modal */}
      {(showAdd || editing) && (
        <TopicModeFormModal
          subjectId={subject.id}
          topicMode={editing}
          onClose={() => {
            setShowAdd(false);
            setEditing(null);
          }}
          onSaved={() => {
            setShowAdd(false);
            setEditing(null);
            onRefresh();
            toast.success(editing ? 'مبحث به‌روزرسانی شد' : 'مبحث جدید اضافه شد');
          }}
        />
      )}
    </div>
  );
}

// ============================================================
// Topic Mode Form Modal
// ============================================================
function TopicModeFormModal({
  subjectId,
  topicMode,
  onClose,
  onSaved,
}: {
  subjectId: string;
  topicMode: TopicMode | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(topicMode?.title || '');
  const [description, setDescription] = useState(topicMode?.description || '');
  const [saving, setSaving] = useState(false);
  const isEdit = !!topicMode;

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error('عنوان مبحث الزامی است');
      return;
    }
    setSaving(true);
    try {
      const url = isEdit
        ? `/api/subjects/${subjectId}/topic-modes/${topicMode!.id}`
        : `/api/subjects/${subjectId}/topic-modes`;
      const method = isEdit ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), description: description.trim() || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطا');
      onSaved();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'خطا';
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
        onClick={(e) => e.stopPropagation()}
        className="surface-2 edge-highlight rounded-3xl w-full max-w-md p-6"
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-[var(--foreground)]">
            {isEdit ? 'ویرایش مبحث' : 'افزودن مبحث کنکوری'}
          </h2>
          <button
            onClick={onClose}
            className="icon-btn w-9 h-9 rounded-xl border border-[var(--border)] flex items-center justify-center text-[var(--foreground-muted)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mb-4">
          <label className="text-xs font-medium text-[var(--foreground-muted)] mb-1.5 block">
            عنوان مبحث
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="مثلاً: زیست سلولی و مولکولی"
            autoFocus
            className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-3 h-11 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)] focus:outline-none focus:border-[var(--gold)]/40"
          />
        </div>

        <div className="mb-4">
          <label className="text-xs font-medium text-[var(--foreground-muted)] mb-1.5 block">
            توضیحات (اختیاری)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="توضیح مختصری از محتوای این مبحث..."
            rows={3}
            className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)] focus:outline-none focus:border-[var(--gold)]/40 resize-none"
          />
        </div>

        <div className="flex gap-2 pt-4 border-t border-[var(--border)]">
          <button
            onClick={handleSubmit}
            disabled={saving || !title.trim()}
            className="btn-hover glow-hover-gold glow-hover flex-1 h-11 rounded-xl bg-[var(--gold)] text-white font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4" />
                {isEdit ? 'ذخیره' : 'افزودن مبحث'}
              </>
            )}
          </button>
          <button
            onClick={onClose}
            className="btn-hover h-11 px-5 rounded-xl border border-[var(--border)] text-[var(--foreground-muted)] text-sm"
          >
            انصراف
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
