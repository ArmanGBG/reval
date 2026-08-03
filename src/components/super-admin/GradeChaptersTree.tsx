'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  ChevronDown,
  ChevronLeft,
  Pencil,
  Trash2,
  Layers,
  MessageSquare,
  X,
  Loader2,
  GraduationCap,
  Save,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Subject,
  Chapter,
  Topic,
  GradeSubject,
  GRADES,
  MAJORS,
  DEPTH_OPTIONS,
} from '@/lib/subjects-types';

function toPersianDigits(num: number | string): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return num
    .toString()
    .split('')
    .map((d) => persianDigits[parseInt(d)] ?? d)
    .join('');
}

interface GradeChaptersTreeProps {
  subject: Subject;
  chaptersByGrade: { grade: string; chapters: Chapter[] }[];
  gradeConfigs: Record<string, GradeSubject | undefined>;
  onRefresh: () => void;
}

const DEPTH_LABELS: Record<number, string> = {
  1: '۱ لایه (فقط فصل)',
  2: '۲ لایه (پایه ➔ فصل)',
  3: '۳ لایه (پایه ➔ فصل ➔ گفتار)',
};

export function GradeChaptersTree({
  subject,
  chaptersByGrade,
  gradeConfigs,
  onRefresh,
}: GradeChaptersTreeProps) {
  const [expandedGrade, setExpandedGrade] = useState<string | null>(
    chaptersByGrade[0]?.grade || null
  );
  const [showAddGrade, setShowAddGrade] = useState(false);
  const [showAddChapter, setShowAddChapter] = useState<string | null>(null); // grade name
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [editingTopic, setEditingTopic] = useState<{ chapter: Chapter; topic: Topic | null } | null>(null);

  // Grades that are already linked
  const linkedGrades = new Set(Object.keys(gradeConfigs));
  // Available grades to add
  const availableGrades = (GRADES as readonly string[]).filter((g) => !linkedGrades.has(g));

  return (
    <div className="space-y-4">
      {/* ===== Header ===== */}
      <div className="surface-1 rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Layers className="w-5 h-5 text-[var(--gold)]" />
          <div>
            <h2 className="text-base font-bold text-[var(--foreground)]">درخت فصل‌ها و گفتارها</h2>
            <p className="text-xs text-[var(--foreground-muted)] mt-0.5">
              ساختار درختی برای هر پایه — لایه‌ها قابل تنظیم
            </p>
          </div>
        </div>
        {availableGrades.length > 0 && (
          <button
            onClick={() => setShowAddGrade(true)}
            className="btn-hover glow-hover-gold glow-hover inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-[var(--gold-soft)] border border-[var(--gold)]/30 text-[var(--gold)] text-xs font-semibold"
          >
            <Plus className="w-3.5 h-3.5" />
            افزودن پایه
          </button>
        )}
      </div>

      {/* ===== Grades accordion ===== */}
      {chaptersByGrade.length === 0 ? (
        <div className="surface-1 rounded-2xl p-12 text-center">
          <GraduationCap className="w-12 h-12 mx-auto text-[var(--foreground-subtle)] mb-3" />
          <p className="text-sm text-[var(--foreground-muted)] mb-4">
            هنوز پایه‌ای برای این درس ثبت نشده است
          </p>
          {availableGrades.length > 0 && (
            <button
              onClick={() => setShowAddGrade(true)}
              className="btn-hover glow-hover-gold glow-hover inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-[var(--gold)] text-zinc-950 font-bold text-sm"
            >
              <Plus className="w-4 h-4" />
              افزودن پایه اول
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {chaptersByGrade.map(({ grade, chapters }) => {
            const config = gradeConfigs[grade];
            const isExpanded = expandedGrade === grade;
            return (
              <div key={grade} className="surface-1 rounded-2xl overflow-hidden">
                {/* Grade header */}
                <button
                  onClick={() => setExpandedGrade(isExpanded ? null : grade)}
                  className="w-full flex items-center justify-between p-4 nav-item-hover text-right"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[var(--gold-soft)] flex items-center justify-center">
                      <GraduationCap className="w-4 h-4 text-[var(--gold)]" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-[var(--foreground)]">
                        پایه {grade}
                      </div>
                      <div className="text-[11px] text-[var(--foreground-muted)] mt-0.5">
                        {toPersianDigits(chapters.length)} فصل
                        {config?.depth === 3 &&
                          ` · ${toPersianDigits(
                            chapters.reduce((a, c) => a + (c.topics?.length || 0), 0)
                          )} گفتار`}
                        {config?.allowOptionalSubtopic && ' · فیلد زیرفصل فعال'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {config && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border border-[var(--border-strong)] text-[var(--foreground-muted)]">
                        {DEPTH_LABELS[config.depth] || `${toPersianDigits(config.depth)} لایه`}
                      </span>
                    )}
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-[var(--foreground-muted)]" />
                    ) : (
                      <ChevronLeft className="w-4 h-4 text-[var(--foreground-muted)]" />
                    )}
                  </div>
                </button>

                {/* Expanded content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                      className="border-t border-[var(--border)] overflow-hidden"
                    >
                      <div className="p-4 space-y-2">
                        {/* Add chapter button */}
                        <button
                          onClick={() => setShowAddChapter(grade)}
                          className="btn-hover w-full h-10 rounded-xl border border-dashed border-[var(--border-strong)] text-[var(--foreground-muted)] hover:text-[var(--gold)] hover:border-[var(--gold)]/40 text-xs font-medium flex items-center justify-center gap-2"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          افزودن فصل جدید
                        </button>

                        {/* Chapters list */}
                        {chapters.map((chapter) => (
                          <ChapterRow
                            key={chapter.id}
                            subject={subject}
                            chapter={chapter}
                            depth={config?.depth || 2}
                            onEdit={() => setEditingChapter(chapter)}
                            onAddTopic={() =>
                              setEditingTopic({ chapter, topic: null })
                            }
                            onEditTopic={(topic) =>
                              setEditingTopic({ chapter, topic })
                            }
                            onRefresh={onRefresh}
                          />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}

      {/* ===== Add Grade Modal ===== */}
      {showAddGrade && (
        <AddGradeModal
          subjectId={subject.id}
          availableGrades={availableGrades}
          onClose={() => setShowAddGrade(false)}
          onSaved={() => {
            setShowAddGrade(false);
            onRefresh();
            toast.success('پایه جدید با موفقیت اضافه شد');
          }}
        />
      )}

      {/* ===== Add/Edit Chapter Modal ===== */}
      {(showAddChapter || editingChapter) && (
        <ChapterFormModal
          subjectId={subject.id}
          grade={showAddChapter || editingChapter!.grade}
          chapter={editingChapter}
          onClose={() => {
            setShowAddChapter(null);
            setEditingChapter(null);
          }}
          onSaved={() => {
            setShowAddChapter(null);
            setEditingChapter(null);
            onRefresh();
            toast.success(editingChapter ? 'فصل به‌روزرسانی شد' : 'فصل جدید اضافه شد');
          }}
        />
      )}

      {/* ===== Add/Edit Topic Modal ===== */}
      {editingTopic && (
        <TopicFormModal
          subjectId={subject.id}
          chapter={editingTopic.chapter}
          topic={editingTopic.topic}
          onClose={() => setEditingTopic(null)}
          onSaved={() => {
            setEditingTopic(null);
            onRefresh();
            toast.success(editingTopic.topic ? 'گفتار به‌روزرسانی شد' : 'گفتار جدید اضافه شد');
          }}
        />
      )}
    </div>
  );
}

// ============================================================
// Chapter Row (with expandable topics)
// ============================================================
function ChapterRow({
  subject,
  chapter,
  depth,
  onEdit,
  onAddTopic,
  onEditTopic,
  onRefresh,
}: {
  subject: Subject;
  chapter: Chapter;
  depth: number;
  onEdit: () => void;
  onAddTopic: () => void;
  onEditTopic: (topic: Topic) => void;
  onRefresh: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const hasTopics = depth === 3;
  const topicCount = chapter.topics?.length || 0;

  const handleDelete = async () => {
    if (!confirm(`فصل «${chapter.title}» حذف شود؟`)) return;
    setDeleting(true);
    try {
      const res = await fetch(
        `/api/subjects/${subject.id}/chapters/${chapter.id}`,
        { method: 'DELETE' }
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'خطا در حذف');
      }
      toast.success('فصل حذف شد');
      onRefresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'خطا در حذف فصل';
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="bg-[var(--bg-elevated)] rounded-xl border border-[var(--border)] overflow-hidden">
      <div className="flex items-center gap-2 p-3">
        {/* Expand toggle (only for depth 3) */}
        {hasTopics ? (
          <button
            onClick={() => setExpanded(!expanded)}
            className="icon-btn w-7 h-7 rounded-lg flex items-center justify-center text-[var(--foreground-muted)]"
          >
            {expanded ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronLeft className="w-3.5 h-3.5" />
            )}
          </button>
        ) : (
          <div className="w-7 h-7 flex items-center justify-center">
            <Layers className="w-3.5 h-3.5 text-[var(--foreground-subtle)]" />
          </div>
        )}

        {/* Chapter number badge */}
        <span className="text-[10px] font-bold text-[var(--foreground-subtle)] w-6 text-center">
          {toPersianDigits(chapter.chapterNo)}
        </span>

        {/* Title */}
        <button
          onClick={() => hasTopics && setExpanded(!expanded)}
          className="flex-1 text-right text-sm font-medium text-[var(--foreground)] hover:text-[var(--gold)] transition-colors"
        >
          {chapter.title}
        </button>

        {/* Topic count (depth 3) */}
        {hasTopics && (
          <span className="text-[10px] text-[var(--foreground-muted)]">
            {toPersianDigits(topicCount)} گفتار
          </span>
        )}

        {/* Actions */}
        <button
          onClick={onEdit}
          className="icon-btn w-7 h-7 rounded-lg flex items-center justify-center text-[var(--foreground-muted)]"
          aria-label="ویرایش فصل"
        >
          <Pencil className="w-3 h-3" />
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="icon-btn w-7 h-7 rounded-lg flex items-center justify-center text-[var(--foreground-muted)] hover:text-rose-400 disabled:opacity-50"
          aria-label="حذف فصل"
        >
          {deleting ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Trash2 className="w-3 h-3" />
          )}
        </button>
      </div>

      {/* Topics list (depth 3) */}
      <AnimatePresence>
        {expanded && hasTopics && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-[var(--border)] overflow-hidden"
          >
            <div className="p-3 space-y-1.5 bg-[var(--bg-deep)]/40">
              {chapter.topics && chapter.topics.length > 0 ? (
                chapter.topics.map((topic) => (
                  <div
                    key={topic.id}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-[var(--bg-elevated)] nav-item-hover"
                  >
                    <MessageSquare className="w-3 h-3 text-[var(--foreground-subtle)]" />
                    <span className="text-[10px] text-[var(--foreground-subtle)] w-5">
                      {toPersianDigits(topic.topicNo)}
                    </span>
                    <span className="flex-1 text-xs text-[var(--foreground-muted)]">
                      {topic.title}
                    </span>
                    <button
                      onClick={() => onEditTopic(topic)}
                      className="icon-btn w-6 h-6 rounded flex items-center justify-center text-[var(--foreground-subtle)]"
                    >
                      <Pencil className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-xs text-[var(--foreground-subtle)] text-center py-2">
                  گفتاری ثبت نشده
                </p>
              )}
              <button
                onClick={onAddTopic}
                className="btn-hover w-full h-8 rounded-lg border border-dashed border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--gold)] hover:border-[var(--gold)]/40 text-[11px] font-medium flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3 h-3" />
                افزودن گفتار
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================
// Add Grade Modal
// ============================================================
function AddGradeModal({
  subjectId,
  availableGrades,
  onClose,
  onSaved,
}: {
  subjectId: string;
  availableGrades: string[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [grade, setGrade] = useState(availableGrades[0] || '');
  const [major, setMajor] = useState<string>('تجربی');
  const [depth, setDepth] = useState(2);
  const [allowOptionalSubtopic, setAllowOptionalSubtopic] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!grade || !major) {
      toast.error('پایه و رشته الزامی است');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/subjects/${subjectId}/grades`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grade, major, depth, allowOptionalSubtopic }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطا در ایجاد پایه');
      onSaved();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'خطا در ایجاد پایه';
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
          <h2 className="text-lg font-bold text-[var(--foreground)]">افزودن پایه جدید</h2>
          <button
            onClick={onClose}
            className="icon-btn w-9 h-9 rounded-xl border border-[var(--border)] flex items-center justify-center text-[var(--foreground-muted)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Grade selector */}
        <div className="mb-4">
          <label className="text-xs font-medium text-[var(--foreground-muted)] mb-1.5 block">
            پایه
          </label>
          <div className="grid grid-cols-2 gap-2">
            {availableGrades.map((g) => (
              <button
                key={g}
                onClick={() => setGrade(g)}
                className={`btn-hover h-10 rounded-xl text-xs font-medium border ${
                  grade === g
                    ? 'bg-[var(--gold-soft)] border-[var(--gold)]/40 text-[var(--gold)]'
                    : 'bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--foreground-muted)]'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Major selector */}
        <div className="mb-4">
          <label className="text-xs font-medium text-[var(--foreground-muted)] mb-1.5 block">
            رشته
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(MAJORS as readonly string[]).map((m) => (
              <button
                key={m}
                onClick={() => setMajor(m)}
                className={`btn-hover h-10 rounded-xl text-xs font-medium border ${
                  major === m
                    ? 'bg-[var(--gold-soft)] border-[var(--gold)]/40 text-[var(--gold)]'
                    : 'bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--foreground-muted)]'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Depth selector */}
        <div className="mb-4">
          <label className="text-xs font-medium text-[var(--foreground-muted)] mb-1.5 block">
            تعداد لایه‌های درخت
          </label>
          <div className="space-y-2">
            {DEPTH_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setDepth(opt.value)}
                className={`btn-hover w-full h-10 rounded-xl text-xs font-medium border text-right px-3 ${
                  depth === opt.value
                    ? 'bg-[var(--gold-soft)] border-[var(--gold)]/40 text-[var(--gold)]'
                    : 'bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--foreground-muted)]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Optional subtopic toggle */}
        <div className="mb-4">
          <button
            onClick={() => setAllowOptionalSubtopic(!allowOptionalSubtopic)}
            className="w-full flex items-center justify-between p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] nav-item-hover"
          >
            <div className="text-right">
              <div className="text-xs font-semibold text-[var(--foreground)]">
                فیلد متنی زیرفصل (اختیاری)
              </div>
              <div className="text-[10px] text-[var(--foreground-muted)] mt-0.5">
                دانش‌آموز می‌تواند مبحث جزئی را دستی بنویسد
              </div>
            </div>
            <div
              className={`w-9 h-5 rounded-full transition-colors relative ${
                allowOptionalSubtopic ? 'bg-[var(--gold)]' : 'bg-[var(--border-strong)]'
              }`}
            >
              <div
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${
                  allowOptionalSubtopic ? 'left-0.5' : 'right-0.5'
                }`}
              />
            </div>
          </button>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t border-[var(--border)]">
          <button
            onClick={handleSubmit}
            disabled={saving || !grade}
            className="btn-hover glow-hover-gold glow-hover flex-1 h-11 rounded-xl bg-[var(--gold)] text-zinc-950 font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : (
              <>
                <Plus className="w-4 h-4" />
                افزودن پایه
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

// ============================================================
// Chapter Form Modal (Add/Edit)
// ============================================================
function ChapterFormModal({
  subjectId,
  grade,
  chapter,
  onClose,
  onSaved,
}: {
  subjectId: string;
  grade: string;
  chapter: Chapter | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(chapter?.title || '');
  const [saving, setSaving] = useState(false);
  const isEdit = !!chapter;

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error('عنوان فصل الزامی است');
      return;
    }
    setSaving(true);
    try {
      const url = isEdit
        ? `/api/subjects/${subjectId}/chapters/${chapter!.id}`
        : `/api/subjects/${subjectId}/chapters`;
      const method = isEdit ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grade, title: title.trim() }),
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
            {isEdit ? 'ویرایش فصل' : `افزودن فصل به پایه ${grade}`}
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
            عنوان فصل
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="مثلاً: فصل ۱: دنیای زنده"
            autoFocus
            className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-3 h-11 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)] focus:outline-none focus:border-[var(--gold)]/40"
          />
        </div>

        <div className="flex gap-2 pt-4 border-t border-[var(--border)]">
          <button
            onClick={handleSubmit}
            disabled={saving || !title.trim()}
            className="btn-hover glow-hover-gold glow-hover flex-1 h-11 rounded-xl bg-[var(--gold)] text-zinc-950 font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4" />
                {isEdit ? 'ذخیره تغییرات' : 'افزودن فصل'}
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

// ============================================================
// Topic Form Modal (Add/Edit)
// ============================================================
function TopicFormModal({
  subjectId,
  chapter,
  topic,
  onClose,
  onSaved,
}: {
  subjectId: string;
  chapter: Chapter;
  topic: Topic | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(topic?.title || '');
  const [saving, setSaving] = useState(false);
  const isEdit = !!topic;

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error('عنوان گفتار الزامی است');
      return;
    }
    setSaving(true);
    try {
      const url = isEdit
        ? `/api/subjects/${subjectId}/chapters/${chapter.id}/topics/${topic!.id}`
        : `/api/subjects/${subjectId}/chapters/${chapter.id}/topics`;
      const method = isEdit ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim() }),
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
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold text-[var(--foreground)]">
            {isEdit ? 'ویرایش گفتار' : 'افزودن گفتار'}
          </h2>
          <button
            onClick={onClose}
            className="icon-btn w-9 h-9 rounded-xl border border-[var(--border)] flex items-center justify-center text-[var(--foreground-muted)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-[var(--foreground-muted)] mb-4">
          فصل: {chapter.title}
        </p>

        <div className="mb-4">
          <label className="text-xs font-medium text-[var(--foreground-muted)] mb-1.5 block">
            عنوان گفتار
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="مثلاً: زیست‌شناسی چیست؟"
            autoFocus
            className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-3 h-11 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)] focus:outline-none focus:border-[var(--gold)]/40"
          />
        </div>

        <div className="flex gap-2 pt-4 border-t border-[var(--border)]">
          <button
            onClick={handleSubmit}
            disabled={saving || !title.trim()}
            className="btn-hover glow-hover-gold glow-hover flex-1 h-11 rounded-xl bg-[var(--gold)] text-zinc-950 font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4" />
                {isEdit ? 'ذخیره' : 'افزودن گفتار'}
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
