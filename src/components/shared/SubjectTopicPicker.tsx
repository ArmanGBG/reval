'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap,
  Layers,
  MessageSquare,
  Sparkles,
  ChevronLeft,
  ChevronDown,
  Search,
  Type,
  BookOpen,
  CheckCircle2,
} from 'lucide-react';
import { Subject, Chapter, GRADES } from '@/lib/subjects-types';

function toPersianDigits(num: number | string): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return num
    .toString()
    .split('')
    .map((d) => persianDigits[parseInt(d)] ?? d)
    .join('');
}

// ============================================================
// Types
// ============================================================
export interface TopicSelection {
  displayText: string; // composed topic string for the Task model
  grade?: string;
  chapterId?: string;
  chapterTitle?: string;
  topicId?: string;
  topicTitle?: string;
  subtopic?: string; // free text (Physics/Chemistry)
  mode?: 'chapter' | 'topic';
  topicModeId?: string;
  topicModeTitle?: string;
}

interface SubjectTopicPickerProps {
  subject: Subject;
  defaultGrade?: string; // student's grade, e.g. "دوازدهم"
  value?: TopicSelection | null;
  onChange: (selection: TopicSelection | null) => void;
}

// ============================================================
// Main Component
// ============================================================
export function SubjectTopicPicker({
  subject,
  defaultGrade = 'دوازدهم',
  value,
  onChange,
}: SubjectTopicPickerProps) {
  // Determine available display mode for this subject
  const supportsChapter = subject.displayStrategy === 'chapter' || subject.displayStrategy === 'both';
  const supportsTopic = subject.displayStrategy === 'topic' || subject.displayStrategy === 'both';

  // If subject supports both, user picks a mode; otherwise it's forced
  const [mode, setMode] = useState<'chapter' | 'topic'>(
    value?.mode || (supportsChapter ? 'chapter' : 'topic')
  );

  // When subject changes, reset mode
  useEffect(() => {
    if (supportsChapter && !supportsTopic) setMode('chapter');
    else if (!supportsChapter && supportsTopic) setMode('topic');
    else if (supportsChapter && supportsTopic) {
      setMode(value?.mode || 'chapter');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject.id]);

  return (
    <div className="space-y-3">
      {/* Mode switch (only if subject supports both) */}
      {supportsChapter && supportsTopic && (
        <div className="flex gap-1 bg-[var(--bg-overlay)] rounded-xl p-1">
          <button
            onClick={() => {
              setMode('chapter');
              onChange(null);
            }}
            className={`btn-hover flex-1 h-9 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 ${
              mode === 'chapter'
                ? 'bg-[var(--accent)] text-zinc-950'
                : 'text-[var(--foreground-muted)]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            فصل کتاب
          </button>
          <button
            onClick={() => {
              setMode('topic');
              onChange(null);
            }}
            className={`btn-hover flex-1 h-9 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 ${
              mode === 'topic'
                ? 'bg-[var(--accent)] text-zinc-950'
                : 'text-[var(--foreground-muted)]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            مبحثی
          </button>
        </div>
      )}

      {/* Render the appropriate picker */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${subject.id}-${mode}`}
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -8 }}
          transition={{ duration: 0.18 }}
        >
          {mode === 'chapter' && supportsChapter ? (
            <ChapterPicker
              subject={subject}
              defaultGrade={defaultGrade}
              value={value}
              onChange={onChange}
              mode={mode}
            />
          ) : mode === 'topic' && supportsTopic ? (
            <TopicModePicker subject={subject} value={value} onChange={onChange} mode={mode} />
          ) : (
            <div className="surface-1 rounded-xl p-6 text-center text-xs text-[var(--foreground-muted)]">
              این درس از این حالت پشتیبانی نمی‌کند.
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ============================================================
// Chapter Picker (Grade → Chapter → Topic/Subtopic)
// ============================================================
function ChapterPicker({
  subject,
  defaultGrade,
  value,
  onChange,
  mode,
}: {
  subject: Subject;
  defaultGrade: string;
  value?: TopicSelection | null;
  onChange: (s: TopicSelection | null) => void;
  mode: 'chapter' | 'topic';
}) {
  // Grades available for this subject
  const availableGrades = useMemo(() => {
    const gradeSet = new Set<string>();
    for (const gs of subject.grades || []) {
      gradeSet.add(gs.grade);
    }
    // Also infer from chapters
    for (const ch of subject.chapters || []) {
      gradeSet.add(ch.grade);
    }
    return (GRADES as readonly string[]).filter((g) => gradeSet.has(g));
  }, [subject]);

  const [selectedGrade, setSelectedGrade] = useState<string>(
    value?.grade || (availableGrades.includes(defaultGrade) ? defaultGrade : availableGrades[0] || '')
  );

  // Grade config for depth + allowOptionalSubtopic
  const gradeConfig = (subject.grades || []).find(
    (g) => g.grade === selectedGrade
  );
  const depth = gradeConfig?.depth || 2;
  const allowSubtopic = gradeConfig?.allowOptionalSubtopic || false;

  // Chapters for the selected grade
  const chapters = useMemo(() => {
    return (subject.chapters || [])
      .filter((c) => c.grade === selectedGrade)
      .sort((a, b) => a.chapterNo - b.chapterNo);
  }, [subject, selectedGrade]);

  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(
    value?.chapterId
      ? (subject.chapters || []).find((c) => c.id === value.chapterId) || null
      : null
  );
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(
    value?.topicId || null
  );
  const [subtopicText, setSubtopicText] = useState<string>(value?.subtopic || '');

  // Reset selections when grade changes
  useEffect(() => {
    setSelectedChapter(null);
    setSelectedTopicId(null);
    setSubtopicText('');
    onChange(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGrade]);

  const handleChapterSelect = (chapter: Chapter) => {
    setSelectedChapter(chapter);
    setSelectedTopicId(null);
    // For depth ≤ 2, chapter is the leaf; compose display text immediately
    if (depth <= 2) {
      onChange({
        displayText: chapter.title,
        grade: selectedGrade,
        chapterId: chapter.id,
        chapterTitle: chapter.title,
        mode,
      });
    }
  };

  const handleTopicSelect = (topicId: string, topicTitle: string) => {
    setSelectedTopicId(topicId);
    if (selectedChapter) {
      onChange({
        displayText: `${selectedChapter.title} — ${topicTitle}`,
        grade: selectedGrade,
        chapterId: selectedChapter.id,
        chapterTitle: selectedChapter.title,
        topicId,
        topicTitle,
        mode,
      });
    }
  };

  const handleSubtopicChange = (text: string) => {
    setSubtopicText(text);
    if (selectedChapter) {
      const base = selectedChapter.title;
      const topicTitle = selectedTopicId
        ? (selectedChapter.topics || []).find((t) => t.id === selectedTopicId)?.title
        : null;
      const parts = [base];
      if (topicTitle) parts.push(topicTitle);
      if (text.trim()) parts.push(text.trim());
      onChange({
        displayText: parts.join(' — '),
        grade: selectedGrade,
        chapterId: selectedChapter.id,
        chapterTitle: base,
        topicId: selectedTopicId || undefined,
        topicTitle,
        subtopic: text.trim() || undefined,
        mode,
      });
    }
  };

  return (
    <div className="space-y-3">
      {/* Grade selector */}
      {availableGrades.length > 1 && (
        <div>
          <label className="text-[11px] font-medium text-[var(--foreground-muted)] mb-1.5 flex items-center gap-1">
            <GraduationCap className="w-3 h-3" />
            پایه
          </label>
          <div className="flex gap-1.5 flex-wrap">
            {availableGrades.map((g) => (
              <button
                key={g}
                onClick={() => setSelectedGrade(g)}
                className={`btn-hover h-9 px-3 rounded-lg text-xs font-medium border ${
                  selectedGrade === g
                    ? 'bg-[var(--accent-soft)] border-[var(--accent)]/40 text-[var(--accent)]'
                    : 'bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--foreground-muted)]'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chapters grid */}
      <div>
        <label className="text-[11px] font-medium text-[var(--foreground-muted)] mb-1.5 flex items-center gap-1">
          <Layers className="w-3 h-3" />
          فصل
          <span className="text-[var(--foreground-subtle)]">
            ({toPersianDigits(chapters.length)})
          </span>
        </label>
        {chapters.length === 0 ? (
          <div className="surface-1 rounded-xl p-4 text-center text-xs text-[var(--foreground-muted)]">
            فصلی برای این پایه ثبت نشده
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-1.5 max-h-44 overflow-y-auto custom-scrollbar pr-1">
            {chapters.map((ch) => {
              const isSelected = selectedChapter?.id === ch.id;
              return (
                <button
                  key={ch.id}
                  onClick={() => handleChapterSelect(ch)}
                  className={`btn-hover text-right p-2.5 rounded-lg border text-[11px] font-medium leading-snug min-h-[44px] ${
                    isSelected
                      ? 'bg-[var(--accent-soft)] border-[var(--accent)]/40 text-[var(--accent)]'
                      : 'bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                  }`}
                >
                  <span className="text-[10px] opacity-60 block mb-0.5">
                    فصل {toPersianDigits(ch.chapterNo)}
                  </span>
                  {ch.title.replace(/^فصل\s*\d+[：:]\s*/, '')}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Topics (only depth 3) */}
      {depth === 3 && selectedChapter && (
        <div>
          <label className="text-[11px] font-medium text-[var(--foreground-muted)] mb-1.5 flex items-center gap-1">
            <MessageSquare className="w-3 h-3" />
            گفتار
            <span className="text-[var(--foreground-subtle)]">
              ({toPersianDigits(selectedChapter.topics?.length || 0)})
            </span>
          </label>
          <div className="grid grid-cols-1 gap-1 max-h-40 overflow-y-auto custom-scrollbar pr-1">
            {(selectedChapter.topics || []).map((t) => {
              const isSelected = selectedTopicId === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => handleTopicSelect(t.id, t.title)}
                  className={`btn-hover text-right p-2 rounded-lg border text-[11px] ${
                    isSelected
                      ? 'bg-[var(--accent-soft)] border-[var(--accent)]/40 text-[var(--accent)]'
                      : 'bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                  }`}
                >
                  <span className="text-[10px] opacity-60 ml-1">{toPersianDigits(t.topicNo)}.</span>
                  {t.title}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Optional subtopic text field (Physics / Chemistry) */}
      {allowSubtopic && selectedChapter && (
        <div>
          <label className="text-[11px] font-medium text-[var(--foreground-muted)] mb-1.5 flex items-center gap-1">
            <Type className="w-3 h-3" />
            زیرمبحث (اختیاری)
          </label>
          <input
            type="text"
            value={subtopicText}
            onChange={(e) => handleSubtopicChange(e.target.value)}
            placeholder="مثلاً: قانون کولن، سقوط آزاد..."
            className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-3 h-10 text-xs text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)] focus:outline-none focus:border-[var(--accent)]/40"
          />
        </div>
      )}

      {/* Selected summary */}
      {value && value.displayText && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent)]/20">
          <CheckCircle2 className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
          <span className="text-[11px] text-[var(--accent)] font-medium truncate">
            {value.displayText}
          </span>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Topic Mode Picker (مبحثی)
// ============================================================
function TopicModePicker({
  subject,
  value,
  onChange,
  mode,
}: {
  subject: Subject;
  value?: TopicSelection | null;
  onChange: (s: TopicSelection | null) => void;
  mode: 'chapter' | 'topic';
}) {
  const [search, setSearch] = useState('');
  const topicModes = subject.topicModes || [];
  const filtered = topicModes.filter((tm) =>
    search ? tm.title.includes(search) || (tm.description || '').includes(search) : true
  );

  const handleSelect = (tm: { id: string; title: string; description: string | null }) => {
    onChange({
      displayText: tm.title,
      mode,
      topicModeId: tm.id,
      topicModeTitle: tm.title,
    });
  };

  return (
    <div className="space-y-3">
      {/* Search */}
      {topicModes.length > 4 && (
        <div className="relative">
          <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--foreground-subtle)] pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="جستجوی مبحث..."
            className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg pr-8 pl-3 h-9 text-xs text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)] focus:outline-none focus:border-[var(--accent)]/40"
          />
        </div>
      )}

      {/* Topic modes list */}
      {filtered.length === 0 ? (
        <div className="surface-1 rounded-xl p-4 text-center text-xs text-[var(--foreground-muted)]">
          {topicModes.length === 0
            ? 'مبحثی برای این درس ثبت نشده'
            : 'موردی یافت نشد'}
        </div>
      ) : (
        <div className="space-y-1.5 max-h-60 overflow-y-auto custom-scrollbar pr-1">
          {filtered.map((tm) => {
            const isSelected = value?.topicModeId === tm.id;
            return (
              <button
                key={tm.id}
                onClick={() => handleSelect(tm)}
                className={`btn-hover w-full text-right p-2.5 rounded-lg border ${
                  isSelected
                    ? 'bg-[var(--accent-soft)] border-[var(--accent)]/40'
                    : 'bg-[var(--bg-elevated)] border-[var(--border)]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold ${
                      isSelected
                        ? 'bg-[var(--accent)] text-zinc-950'
                        : 'bg-white/5 text-[var(--foreground-muted)]'
                    }`}
                  >
                    {toPersianDigits(tm.modeNo)}
                  </span>
                  <span
                    className={`text-xs font-medium flex-1 ${
                      isSelected ? 'text-[var(--accent)]' : 'text-[var(--foreground)]'
                    }`}
                  >
                    {tm.title}
                  </span>
                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-[var(--accent)]" />}
                </div>
                {tm.description && (
                  <p className="text-[10px] text-[var(--foreground-muted)] mt-1 mr-8 leading-relaxed">
                    {tm.description}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Selected summary */}
      {value && value.displayText && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent)]/20">
          <CheckCircle2 className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
          <span className="text-[11px] text-[var(--accent)] font-medium truncate">
            {value.displayText}
          </span>
        </div>
      )}
    </div>
  );
}
