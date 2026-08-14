'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  Loader2,
  Pencil,
  Plus,
  Save,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { GradeSubject, TopicMode, TopicModeSubtopic } from '@/lib/subjects-types';

function toPersianDigits(num: number | string): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return num
    .toString()
    .split('')
    .map((d) => persianDigits[parseInt(d)] ?? d)
    .join('');
}

interface TopicModesPanelProps {
  subjectId: string;
  gradeSubject: GradeSubject | null;
  onRefresh: () => void | Promise<void>;
}

interface SubtopicEditor {
  topicMode: TopicMode;
  subtopic: TopicModeSubtopic | null;
}

export function TopicModesPanel({ subjectId, gradeSubject, onRefresh }: TopicModesPanelProps) {
  const [editingMode, setEditingMode] = useState<TopicMode | null>(null);
  const [showAddMode, setShowAddMode] = useState(false);
  const [subtopicEditor, setSubtopicEditor] = useState<SubtopicEditor | null>(null);
  const [expandedModes, setExpandedModes] = useState<Set<string>>(new Set());
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (!gradeSubject) {
    return (
      <div className="surface-1 rounded-2xl p-12 text-center">
        <Sparkles className="w-12 h-12 mx-auto text-[var(--foreground-subtle)] mb-3" />
        <p className="text-sm text-[var(--foreground-muted)]">
          ابتدا یک پایه/رشته برای مدیریت ساختار مبحثی انتخاب کنید
        </p>
      </div>
    );
  }

  const topicModes = gradeSubject.topicModes || [];
  const baseUrl = `/api/subjects/${subjectId}/grades/${gradeSubject.id}/topic-modes`;

  const toggleExpanded = (modeId: string) => {
    setExpandedModes((current) => {
      const next = new Set(current);
      if (next.has(modeId)) next.delete(modeId);
      else next.add(modeId);
      return next;
    });
  };

  const handleDeleteMode = async (mode: TopicMode) => {
    if (!confirm(`مبحث «${mode.title}» حذف شود؟`)) return;
    setDeletingId(mode.id);
    try {
      const res = await fetch(`${baseUrl}/${mode.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'خطا در حذف مبحث');
      }
      toast.success('مبحث حذف شد');
      await onRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'خطا در حذف مبحث');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteSubtopic = async (mode: TopicMode, subtopic: TopicModeSubtopic) => {
    if (!confirm(`زیرمبحث «${subtopic.title}» حذف شود؟`)) return;
    setDeletingId(subtopic.id);
    try {
      const res = await fetch(`${baseUrl}/${mode.id}/subtopics/${subtopic.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'خطا در حذف زیرمبحث');
      }
      toast.success('زیرمبحث حذف شد');
      await onRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'خطا در حذف زیرمبحث');
    } finally {
      setDeletingId(null);
    }
  };

  const closeModeForm = () => {
    setShowAddMode(false);
    setEditingMode(null);
  };

  return (
    <div className="space-y-4">
      <div className="surface-1 rounded-2xl p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Sparkles className="w-5 h-5 text-[var(--gold)] shrink-0" />
          <div className="min-w-0">
            <h2 className="text-base font-bold text-[var(--foreground)]">ساختار مبحثی</h2>
            <p className="text-xs text-[var(--foreground-muted)] mt-0.5 truncate">
              {gradeSubject.grade} · {gradeSubject.major}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowAddMode(true)}
          className="btn-hover glow-hover-gold glow-hover inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-[var(--gold-soft)] border border-[var(--gold)]/30 text-[var(--gold)] text-xs font-semibold shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          افزودن مبحث
        </button>
      </div>

      {topicModes.length === 0 ? (
        <div className="surface-1 rounded-2xl p-12 text-center">
          <Sparkles className="w-12 h-12 mx-auto text-[var(--foreground-subtle)] mb-3" />
          <p className="text-sm text-[var(--foreground-muted)] mb-4">
            هنوز مبحثی برای این پایه/رشته ثبت نشده است
          </p>
          <button
            onClick={() => setShowAddMode(true)}
            className="btn-hover glow-hover-gold glow-hover inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-[var(--gold)] text-white font-bold text-sm"
          >
            <Plus className="w-4 h-4" />
            افزودن مبحث اول
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence initial={false}>
            {topicModes.map((mode, idx) => {
              const subtopics = mode.subtopics || [];
              const isExpanded = expandedModes.has(mode.id);
              return (
                <motion.div
                  key={mode.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.2, delay: idx * 0.03 }}
                  className="surface-1 edge-highlight rounded-xl overflow-hidden"
                >
                  <div className="p-4 flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() => toggleExpanded(mode.id)}
                      aria-label={isExpanded ? 'بستن زیرمبحث‌ها' : 'نمایش زیرمبحث‌ها'}
                      className="w-9 h-9 rounded-xl bg-[var(--gold-soft)] border border-[var(--gold)]/30 flex items-center justify-center shrink-0"
                    >
                      <span className="text-sm font-black text-[var(--gold)]">
                        {toPersianDigits(mode.modeNo)}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleExpanded(mode.id)}
                      className="flex-1 min-w-0 text-right"
                    >
                      <h3 className="text-sm font-bold text-[var(--foreground)] mb-1">{mode.title}</h3>
                      {mode.description && (
                        <p className="text-xs text-[var(--foreground-muted)] leading-relaxed">
                          {mode.description}
                        </p>
                      )}
                      <span className="text-[10px] text-[var(--foreground-subtle)] mt-1.5 block">
                        {toPersianDigits(subtopics.length)} زیرمبحث
                      </span>
                    </button>

                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => setSubtopicEditor({ topicMode: mode, subtopic: null })}
                        aria-label="افزودن زیرمبحث"
                        className="icon-btn w-8 h-8 rounded-lg flex items-center justify-center text-[var(--gold)]"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setEditingMode(mode)}
                        aria-label="ویرایش مبحث"
                        className="icon-btn w-8 h-8 rounded-lg flex items-center justify-center text-[var(--foreground-muted)]"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteMode(mode)}
                        disabled={deletingId === mode.id}
                        aria-label="حذف مبحث"
                        className="icon-btn w-8 h-8 rounded-lg flex items-center justify-center text-[var(--foreground-muted)] hover:text-[var(--danger)]"
                      >
                        {deletingId === mode.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => toggleExpanded(mode.id)}
                        aria-label={isExpanded ? 'بستن زیرمبحث‌ها' : 'نمایش زیرمبحث‌ها'}
                        className="icon-btn w-8 h-8 rounded-lg flex items-center justify-center text-[var(--foreground-muted)]"
                      >
                        <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>
                    </div>
                  </div>

                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-[var(--border)] p-3 space-y-2 bg-[var(--bg-overlay)]/30">
                          {subtopics.length === 0 ? (
                            <button
                              onClick={() => setSubtopicEditor({ topicMode: mode, subtopic: null })}
                              className="w-full h-10 rounded-lg border border-dashed border-[var(--border-strong)] text-xs text-[var(--foreground-muted)] hover:text-[var(--gold)] transition-colors"
                            >
                              افزودن اولین زیرمبحث
                            </button>
                          ) : (
                            subtopics.map((subtopic) => (
                              <div
                                key={subtopic.id}
                                className="min-h-10 px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center gap-3"
                              >
                                <span className="w-6 h-6 rounded-md bg-[var(--accent-soft)] text-[var(--accent)] text-[10px] font-bold flex items-center justify-center shrink-0">
                                  {toPersianDigits(subtopic.subtopicNo)}
                                </span>
                                <span className="text-xs font-medium text-[var(--foreground)] flex-1 min-w-0">
                                  {subtopic.title}
                                </span>
                                <button
                                  onClick={() => setSubtopicEditor({ topicMode: mode, subtopic })}
                                  aria-label="ویرایش زیرمبحث"
                                  className="icon-btn w-7 h-7 rounded-md flex items-center justify-center text-[var(--foreground-muted)]"
                                >
                                  <Pencil className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => handleDeleteSubtopic(mode, subtopic)}
                                  disabled={deletingId === subtopic.id}
                                  aria-label="حذف زیرمبحث"
                                  className="icon-btn w-7 h-7 rounded-md flex items-center justify-center text-[var(--foreground-muted)] hover:text-[var(--danger)]"
                                >
                                  {deletingId === subtopic.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {(showAddMode || editingMode) && (
        <TopicModeFormModal
          baseUrl={baseUrl}
          topicMode={editingMode}
          onClose={closeModeForm}
          onSaved={async () => {
            closeModeForm();
            await onRefresh();
            toast.success(editingMode ? 'مبحث به‌روزرسانی شد' : 'مبحث جدید اضافه شد');
          }}
        />
      )}

      {subtopicEditor && (
        <SubtopicFormModal
          baseUrl={`${baseUrl}/${subtopicEditor.topicMode.id}/subtopics`}
          subtopic={subtopicEditor.subtopic}
          onClose={() => setSubtopicEditor(null)}
          onSaved={async () => {
            const wasEditing = !!subtopicEditor.subtopic;
            setExpandedModes((current) => new Set(current).add(subtopicEditor.topicMode.id));
            setSubtopicEditor(null);
            await onRefresh();
            toast.success(wasEditing ? 'زیرمبحث به‌روزرسانی شد' : 'زیرمبحث جدید اضافه شد');
          }}
        />
      )}
    </div>
  );
}

function TopicModeFormModal({
  baseUrl,
  topicMode,
  onClose,
  onSaved,
}: {
  baseUrl: string;
  topicMode: TopicMode | null;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
}) {
  const [title, setTitle] = useState(topicMode?.title || '');
  const [description, setDescription] = useState(topicMode?.description || '');
  const [modeNo, setModeNo] = useState(topicMode?.modeNo ? String(topicMode.modeNo) : '');
  const [saving, setSaving] = useState(false);
  const isEdit = !!topicMode;

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error('عنوان مبحث الزامی است');
      return;
    }
    if (modeNo && (!Number.isInteger(Number(modeNo)) || Number(modeNo) < 1)) {
      toast.error('شماره مبحث باید عدد صحیح مثبت باشد');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(isEdit ? `${baseUrl}/${topicMode.id}` : baseUrl, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          ...(modeNo ? { modeNo: Number(modeNo) } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطا در ذخیره مبحث');
      await onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'خطا در ذخیره مبحث');
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormModal
      title={isEdit ? 'ویرایش مبحث' : 'افزودن مبحث'}
      submitLabel={isEdit ? 'ذخیره' : 'افزودن مبحث'}
      saving={saving}
      submitDisabled={!title.trim()}
      onClose={onClose}
      onSubmit={handleSubmit}
    >
      <FormField label="عنوان مبحث">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
          className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-3 h-11 text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--gold)]/40"
        />
      </FormField>
      <FormField label="توضیحات (اختیاری)">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--gold)]/40 resize-none"
        />
      </FormField>
      <FormField label="شماره مبحث (اختیاری)">
        <input
          type="number"
          min={1}
          value={modeNo}
          onChange={(e) => setModeNo(e.target.value)}
          placeholder="تخصیص خودکار"
          className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-3 h-11 text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--gold)]/40"
        />
      </FormField>
    </FormModal>
  );
}

function SubtopicFormModal({
  baseUrl,
  subtopic,
  onClose,
  onSaved,
}: {
  baseUrl: string;
  subtopic: TopicModeSubtopic | null;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
}) {
  const [title, setTitle] = useState(subtopic?.title || '');
  const [subtopicNo, setSubtopicNo] = useState(subtopic?.subtopicNo ? String(subtopic.subtopicNo) : '');
  const [saving, setSaving] = useState(false);
  const isEdit = !!subtopic;

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error('عنوان زیرمبحث الزامی است');
      return;
    }
    if (subtopicNo && (!Number.isInteger(Number(subtopicNo)) || Number(subtopicNo) < 1)) {
      toast.error('شماره زیرمبحث باید عدد صحیح مثبت باشد');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(isEdit ? `${baseUrl}/${subtopic.id}` : baseUrl, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          ...(subtopicNo ? { subtopicNo: Number(subtopicNo) } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطا در ذخیره زیرمبحث');
      await onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'خطا در ذخیره زیرمبحث');
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormModal
      title={isEdit ? 'ویرایش زیرمبحث' : 'افزودن زیرمبحث'}
      submitLabel={isEdit ? 'ذخیره' : 'افزودن زیرمبحث'}
      saving={saving}
      submitDisabled={!title.trim()}
      onClose={onClose}
      onSubmit={handleSubmit}
    >
      <FormField label="عنوان زیرمبحث">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
          className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-3 h-11 text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--gold)]/40"
        />
      </FormField>
      <FormField label="شماره زیرمبحث (اختیاری)">
        <input
          type="number"
          min={1}
          value={subtopicNo}
          onChange={(e) => setSubtopicNo(e.target.value)}
          placeholder="تخصیص خودکار"
          className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-3 h-11 text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--gold)]/40"
        />
      </FormField>
    </FormModal>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-[var(--foreground-muted)] mb-1.5 block">{label}</span>
      {children}
    </label>
  );
}

function FormModal({
  title,
  submitLabel,
  saving,
  submitDisabled,
  onClose,
  onSubmit,
  children,
}: {
  title: string;
  submitLabel: string;
  saving: boolean;
  submitDisabled: boolean;
  onClose: () => void;
  onSubmit: () => void;
  children: React.ReactNode;
}) {
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
          <h2 className="text-lg font-bold text-[var(--foreground)]">{title}</h2>
          <button
            onClick={onClose}
            aria-label="بستن"
            className="icon-btn w-9 h-9 rounded-xl border border-[var(--border)] flex items-center justify-center text-[var(--foreground-muted)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">{children}</div>

        <div className="flex gap-2 pt-4 mt-4 border-t border-[var(--border)]">
          <button
            onClick={onSubmit}
            disabled={saving || submitDisabled}
            className="btn-hover glow-hover-gold glow-hover flex-1 h-11 rounded-xl bg-[var(--gold)] text-white font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {submitLabel}
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
