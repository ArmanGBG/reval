'use client';

// ============================================================
// TaskSubjectPicker — Modern Dark Cinema — Persian RTL
// ============================================================
// Shared subject + topic picker used by BOTH student (ManualEntrySheet)
// and advisor (TaskModal) task-creation flows. Replaces the legacy
// SubjectTopicPicker after the Task 12-a schema migration (the old
// displayStrategy/depth/allowOptionalSubtopic fields no longer exist).
//
// Flow:
//   ① Subject selection (fetched from /api/subjects/for-task)
//   ② Mode switch (مبحثی / فصلی-صفحه)
//      - If subject has ZERO TopicModes → hide مبحثی, force فصلی/صفحه
//   ②a. مبحثی: list of subject.topicModes → set topicModeId
//   ②b. فصلی / صفحه: Tabs
//       - انتخاب کلیکی: Accordion of chapters → topics
//         · chapter only → "فصل X: title"
//         · topic        → "فصل X · گفتار Y: title"
//       - وارد کردن صفحه: two inputs (از/تا صفحه) + debounced lookup
//         via /api/subjects/[id]/page-lookup → exact/unmapped/not_found
//
// Output: onChange with TaskSelection { subjectId, subjectName,
//   subjectColor, chapterId?, topicId?, topicModeId?, displayText? }.

import { useState, useEffect, useMemo, useRef } from 'react';
import {
  BookOpen,
  FileText,
  CheckCircle2,
  ChevronDown,
  Loader2,
  AlertCircle,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';
import { Subject } from '@/lib/subjects-types';
import { FieldType } from '@/lib/types';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

// ===== Persian helper =====
function toPersianDigits(num: number | string | null | undefined): string {
  if (num === null || num === undefined) return '';
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return num
    .toString()
    .split('')
    .map((d) => persianDigits[parseInt(d)] ?? d)
    .join('');
}

// Strip the "فصل X: " / "فصل X:" prefix from chapter titles.
function bareTitle(title: string): string {
  return title.replace(/^فصل\s*\d+‌?\s*[:：]\s*/, '').trim();
}

// Format a page range like "صفحه ۱ تا ۸" / "از ۱۷۶ تا پایان کتاب".
function formatPageRange(entity: {
  pageStart: number | null;
  pageEnd: number | null;
  isLastPage: boolean;
}): string {
  if (entity.pageStart === null) return '';
  if (entity.isLastPage || entity.pageEnd === null) {
    return `از ${toPersianDigits(entity.pageStart)} تا پایان`;
  }
  return `ص ${toPersianDigits(entity.pageStart)}–${toPersianDigits(entity.pageEnd)}`;
}

// ===== Public types =====
export interface TaskSelection {
  subjectId?: string;
  subjectName?: string;
  subjectColor?: string;
  chapterId?: string;
  topicId?: string;
  topicModeId?: string;
  displayText?: string;
}

interface TaskSubjectPickerProps {
  fieldType: FieldType;
  grade: string;
  major: string;
  value: TaskSelection;
  onChange: (selection: TaskSelection) => void;
}

// ===== Local API response shapes (mirrors the new schema) =====
interface ApiTopic {
  id: string;
  chapterId: string;
  title: string;
  topicNo: number;
  pageStart: number | null;
  pageEnd: number | null;
  isLastPage: boolean;
  sortOrder: number;
  isActive: boolean;
}
interface ApiChapter {
  id: string;
  gradeSubjectId: string;
  title: string;
  chapterNo: number;
  pageStart: number | null;
  pageEnd: number | null;
  isLastPage: boolean;
  sortOrder: number;
  isActive: boolean;
  topics?: ApiTopic[];
}
interface ApiGradeSubject {
  id: string;
  subjectId: string;
  grade: string;
  major: string;
  sortOrder: number;
  isActive: boolean;
  chapters?: ApiChapter[];
}
interface ApiTopicMode {
  id: string;
  subjectId: string;
  title: string;
  description: string | null;
  modeNo: number;
  sortOrder: number;
  isActive: boolean;
}
interface ApiSubject extends Subject {
  grades?: ApiGradeSubject[];
  topicModes?: ApiTopicMode[];
}

interface PageLookupResult {
  status: 'exact' | 'unmapped' | 'not_found';
  chapter?: ApiChapter;
  topic?: ApiTopic;
}

// ============================================================
// Main Component
// ============================================================
export function TaskSubjectPicker({
  fieldType,
  grade,
  major,
  value,
  onChange,
}: TaskSubjectPickerProps) {
  const [subjects, setSubjects] = useState<ApiSubject[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // ===== Fetch subjects whenever fieldType/grade/major/reloadKey changes =====
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(
      `/api/subjects/for-task?fieldType=${encodeURIComponent(fieldType)}&grade=${encodeURIComponent(grade)}&major=${encodeURIComponent(major)}`,
    )
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'خطا در بارگذاری دروس');
        return data.subjects as ApiSubject[];
      })
      .then((subs) => {
        if (cancelled) return;
        setSubjects(subs || []);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message || 'خطا در بارگذاری');
        setSubjects([]);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [fieldType, grade, major, reloadKey]);

  // ===== Resolve the currently-selected subject =====
  // Prefer subjectId; fall back to subjectName (used when an existing
  // task is being edited and only the text subject name is known).
  const selectedSubject = useMemo(() => {
    if (!subjects.length) return null;
    if (value.subjectId) {
      const byId = subjects.find((s) => s.id === value.subjectId);
      if (byId) return byId;
    }
    if (value.subjectName) {
      const byName = subjects.find(
        (s) => s.name === value.subjectName,
      );
      if (byName) return byName;
    }
    return null;
  }, [subjects, value.subjectId, value.subjectName]);

  // If the selected subject is no longer in the list (e.g., fieldType
  // changed and the subject isn't available), reset the selection.
  useEffect(() => {
    if (value.subjectId && !selectedSubject && !loading && subjects.length > 0) {
      onChange({});
    }
  }, [value.subjectId, selectedSubject, loading, subjects.length]);

  // ===== Grade / Chapter / Topic hierarchy =====
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<ApiChapter | null>(null);

  const gradeSubject = selectedSubject?.grades?.find((g) => g.grade === selectedGrade) || null;

  const availableGrades = selectedSubject?.grades || [];

  const chapters = useMemo(() => {
    if (!gradeSubject) return [];
    return (gradeSubject.chapters || []).slice().sort((a, b) => a.chapterNo - b.chapterNo);
  }, [gradeSubject]);

  const topics = selectedChapter?.topics || [];
  const selectedChapterData = selectedChapter;

  const handleClearSubject = () => {
    setSelectedGrade(null);
    setSelectedChapter(null);
    onChange({});
  };

  const handleSelectGrade = (g: string) => {
    setSelectedGrade(g);
    setSelectedChapter(null);
  };

  const handleBackFromGrade = () => {
    setSelectedGrade(null);
  };

  const handleSelectChapter = (ch: ApiChapter) => {
    setSelectedChapter(ch);
    onChange({
      subjectId: selectedSubject!.id,
      subjectName: selectedSubject!.name,
      subjectColor: selectedSubject!.color,
      chapterId: ch.id,
      topicId: undefined,
      topicModeId: undefined,
      displayText: `فصل ${toPersianDigits(ch.chapterNo)}: ${bareTitle(ch.title)}`,
    });
  };

  const handleBackFromChapter = () => {
    setSelectedChapter(null);
  };

  const handleSelectTopic = (tp: ApiTopic) => {
    onChange({
      subjectId: selectedSubject!.id,
      subjectName: selectedSubject!.name,
      subjectColor: selectedSubject!.color,
      chapterId: selectedChapter!.id,
      topicId: tp.id,
      topicModeId: undefined,
      displayText: `فصل ${toPersianDigits(selectedChapter!.chapterNo)} · گفتار ${toPersianDigits(tp.topicNo)}: ${tp.title}`,
    });
  };

  // ===== Loading skeleton =====
  if (loading && subjects.length === 0) {
    return (
      <div className="space-y-3" dir="rtl">
        <div className="flex items-center gap-1.5 text-xs text-[var(--foreground-muted)] mb-2">
          <BookOpen className="w-3.5 h-3.5" />
          <span>در حال بارگذاری دروس...</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-14 rounded-xl bg-[var(--bg-overlay)]" />
          ))}
        </div>
      </div>
    );
  }

  // ===== Error state =====
  if (error && subjects.length === 0) {
    return (
      <div className="surface-1 rounded-xl p-6 text-center" dir="rtl">
        <AlertCircle className="w-8 h-8 mx-auto text-[var(--danger)] mb-2" />
        <p className="text-xs text-[var(--foreground-muted)] mb-3">{error}</p>
        <Button
          variant="outline"
          size="sm"
          className="btn-hover h-9"
          onClick={() => setReloadKey((k) => k + 1)}
        >
          <RefreshCw className="w-3.5 h-3.5 ml-1" />
          تلاش مجدد
        </Button>
      </div>
    );
  }

  // ===== Step 1: Subject selection =====
  if (!selectedSubject) {
    if (subjects.length === 0) {
      return (
        <div className="surface-1 rounded-xl p-6 text-center" dir="rtl">
          <BookOpen className="w-8 h-8 mx-auto text-[var(--foreground-subtle)] mb-2" />
          <p className="text-xs text-[var(--foreground-muted)]">
            درسی برای این حوزه و پایه یافت نشد
          </p>
        </div>
      );
    }
    return (
      <div className="space-y-2" dir="rtl">
        <div className="flex items-center gap-1.5 text-xs text-[var(--foreground-muted)] mb-2">
          <BookOpen className="w-3.5 h-3.5" />
          <span>
            درس را انتخاب کن
            <span className="text-[var(--foreground-subtle)] mr-1.5">
              ({toPersianDigits(subjects.length)} درس)
            </span>
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {subjects.map((s) => {
            const isSelected = value.subjectId === s.id;
            return (
              <button
                key={s.id}
                onClick={() => {
                  onChange({
                    subjectId: s.id,
                    subjectName: s.name,
                    subjectColor: s.color,
                  });
                }}
                className={`btn-hover card-hover flex items-center gap-2 py-2.5 px-3 rounded-xl text-sm transition-all min-h-[48px] border text-right ${
                  isSelected
                    ? 'bg-[var(--accent-soft)] text-[var(--accent)] border-[var(--accent)]/40'
                    : 'surface-1 text-[var(--foreground)] border-[var(--border)] hover:text-[var(--accent)]'
                }`}
              >
                <span className="text-base shrink-0">{s.icon || '📚'}</span>
                <span className="truncate flex-1 font-medium">{s.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ===== Step 2: Subject selected — show grade → chapter → topic hierarchy =====

  // ===== Render: Grade selection =====
  if (!selectedGrade) {
    return (
      <div className="space-y-3" dir="rtl">
        <div className="surface-1 rounded-xl p-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center text-base shrink-0"
              style={{ backgroundColor: `${selectedSubject.color}22` }}
            >
              {selectedSubject.icon || '📚'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[var(--foreground)] truncate">
                {selectedSubject.name}
              </p>
              <p className="text-[10px] text-[var(--foreground-subtle)]">
                {grade} · {major}
              </p>
            </div>
          </div>
          <button
            onClick={handleClearSubject}
            className="btn-hover icon-btn text-[11px] px-2.5 py-1.5 rounded-lg border border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--accent)] shrink-0"
          >
            تغییر درس
          </button>
        </div>

        <p className="text-xs text-[var(--foreground-muted)]">
          پایه مورد نظر را انتخاب کنید
        </p>

        {availableGrades.length === 0 ? (
          <div className="surface-1 rounded-xl p-6 text-center text-xs text-[var(--foreground-muted)]">
            هیچ پایه‌ای برای این درس در این رشته یافت نشد
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {availableGrades.map((g) => (
              <button
                key={g.grade}
                onClick={() => handleSelectGrade(g.grade)}
                className="btn-hover h-11 px-4 rounded-xl border border-[var(--border)] text-sm font-medium text-[var(--foreground)] hover:border-[var(--accent)]/40 hover:text-[var(--accent)]"
              >
                {g.grade}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ===== Render: Chapter selection =====
  if (!selectedChapter) {
    return (
      <div className="space-y-3" dir="rtl">
        <div className="surface-1 rounded-xl p-3 flex items-center gap-2">
          <button
            onClick={handleBackFromGrade}
            className="btn-hover icon-btn w-8 h-8 rounded-lg border border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] flex items-center justify-center"
            aria-label="بازگشت به پایه‌ها"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs text-[var(--foreground-muted)]">
              {selectedSubject.name} · {selectedGrade}
            </span>
          </div>
        </div>

        {chapters.length === 0 ? (
          <div className="surface-1 rounded-xl p-6 text-center text-xs text-[var(--foreground-muted)]">
            فصلی برای این پایه ثبت نشده
          </div>
        ) : (
          <div className="space-y-1.5 max-h-80 overflow-y-auto custom-scrollbar">
            {chapters.map((ch) => (
              <button
                key={ch.id}
                onClick={() => handleSelectChapter(ch)}
                className="btn-hover w-full text-right p-3 rounded-lg border border-[var(--border)] surface-1 flex items-center gap-3 transition-all"
              >
                <span className="w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-bold bg-[var(--bg-elevated)] text-[var(--foreground-muted)] shrink-0">
                  {toPersianDigits(ch.chapterNo)}
                </span>
                <span className="flex-1 text-sm font-medium text-[var(--foreground)] truncate">
                  {bareTitle(ch.title)}
                </span>
                <span className="text-[10px] text-[var(--foreground-subtle)] shrink-0">
                  {formatPageRange(ch)}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ===== Render: Topic selection =====
  return (
    <div className="space-y-3" dir="rtl">
      <div className="surface-1 rounded-xl p-3 flex items-center gap-2">
        <button
          onClick={handleBackFromChapter}
          className="btn-hover icon-btn w-8 h-8 rounded-lg border border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] flex items-center justify-center"
          aria-label="بازگشت به فصل‌ها"
        >
          <ArrowRight className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs text-[var(--foreground-muted)]">
            {selectedSubject.name} · {selectedGrade} · فصل {toPersianDigits(selectedChapterData?.chapterNo)}
          </span>
        </div>
      </div>

      {topics.length === 0 ? (
        <div className="surface-1 rounded-xl p-6 text-center text-xs text-[var(--foreground-muted)]">
          گفتاری برای این فصل ثبت نشده
        </div>
      ) : (
        <div className="space-y-1.5 max-h-80 overflow-y-auto custom-scrollbar">
          {topics.map((tp) => (
            <button
              key={tp.id}
              onClick={() => handleSelectTopic(tp)}
              className="btn-hover w-full text-right p-3 rounded-lg border border-[var(--border)] surface-1 flex items-center gap-3 transition-all"
            >
              <span className="w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-bold bg-[var(--bg-elevated)] text-[var(--foreground-muted)] shrink-0">
                {toPersianDigits(tp.topicNo)}
              </span>
              <span className="flex-1 text-sm font-medium text-[var(--foreground)] truncate">
                {tp.title}
              </span>
              <span className="text-[10px] text-[var(--foreground-subtle)] shrink-0">
                {formatPageRange(tp)}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
