'use client';

// ============================================================
// TaskSubjectPicker — Modern Dark Cinema — Persian RTL
// ============================================================
// Shared subject + topic picker used by BOTH student (ManualEntrySheet)
// and advisor (TaskModal) task-creation flows.
//
// Flow:
//   Konkur: Grade → Subject → [Chapter list + Page range input] → Topic multi-select
//   Final: Subject → Grade → [Chapter list + Page range input] → Topic multi-select
//      - Page range input is at the CHAPTER level (after grade select)
//      - Entering a page range auto-detects chapter + topics
//      - Topics support MULTI-SELECT (click to toggle)
//
// Output: onChange with TaskSelection { subjectId, subjectName,
//   subjectColor, chapterId?, topicId?, topicIds?, topicNames?,
//   topicModeId?, displayText?, pageStart?, pageEnd? }.

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Loader2,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  X,
  Filter,
  Layers,
} from 'lucide-react';
import { Chapter, GradeSubject, Subject, Topic, TopicMode, TopicModeSubtopic } from '@/lib/subjects-types';
import { FieldType } from '@/lib/types';
import { apiFetch, AuthError } from '@/lib/api-client';
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

// Format a bounded page range.
function formatPageRange(entity: {
  pageStart: number | null;
  pageEnd: number | null;
}): string {
  if (entity.pageStart === null || entity.pageEnd === null) return '';
  return `ص ${toPersianDigits(entity.pageStart)}–${toPersianDigits(entity.pageEnd)}`;
}

// ===== Public types =====
export interface TaskSelection {
  subjectId?: string;
  subjectName?: string;
  subjectColor?: string;
  chapterId?: string;
  topicId?: string;
  topicIds?: string[];
  topicNames?: string[];
  topicModeId?: string;
  curriculumMode?: 'BOOK' | 'THEMATIC';
  topicModeSubtopicIds?: string[];
  topicModeSubtopicNames?: string[];
  displayText?: string;
  pageStart?: number;
  pageEnd?: number;
}

interface TaskSubjectPickerProps {
  fieldType: FieldType;
  grade: string;
  major: string;
  value: TaskSelection;
  onChange: (selection: TaskSelection) => void;
  onSelectionComplete?: () => void;
}

type ApiSubject = Subject;
type ApiGradeSubject = GradeSubject;
type ApiChapter = Chapter;
type ApiTopic = Topic;
type ApiTopicMode = TopicMode;
type ApiTopicModeSubtopic = TopicModeSubtopic;

// ============================================================
// Main Component
// ============================================================
export function TaskSubjectPicker({
  fieldType,
  grade,
  major,
  value,
  onChange,
  onSelectionComplete,
}: TaskSubjectPickerProps) {
  const [subjects, setSubjects] = useState<ApiSubject[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const hasGradeMajor = !!(grade && major && grade.trim() && major.trim());

  useEffect(() => {
    if (!hasGradeMajor) {
      setSubjects([]);
      setLoading(false);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    apiFetch(
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
        if (err instanceof AuthError) return;
        setError(err.message || 'خطا در بارگذاری');
        setSubjects([]);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [fieldType, grade, major, reloadKey]);

  const selectedSubject = useMemo(() => {
    if (!subjects.length) return null;
    if (value.subjectId) {
      const byId = subjects.find((s) => s.id === value.subjectId);
      if (byId) return byId;
    }
    if (value.subjectName) {
      const byName = subjects.find((s) => s.name === value.subjectName);
      if (byName) return byName;
    }
    return null;
  }, [subjects, value.subjectId, value.subjectName]);

  // Konkur starts with grade selection. The API returns all eligible grades
  // for the student's major, so the subject list can be filtered locally.
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<ApiChapter | null>(null);
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]);
  const [curriculumMode, setCurriculumMode] = useState<'BOOK' | 'THEMATIC' | null>(value.curriculumMode ?? null);
  const [selectedTopicMode, setSelectedTopicMode] = useState<ApiTopicMode | null>(null);
  const [selectedSubtopicIds, setSelectedSubtopicIds] = useState<string[]>(value.topicModeSubtopicIds ?? []);
  const [pageRangeStart, setPageRangeStart] = useState<string>('');
  const [pageRangeEnd, setPageRangeEnd] = useState<string>('');

  const konkurGrades = useMemo(() => {
    const available = new Set(
      subjects.flatMap((subject) => (subject.grades ?? []).map((item) => item.grade)),
    );
    return ['دهم', 'یازدهم', 'دوازدهم'].filter((item) => available.has(item));
  }, [subjects]);

  const visibleSubjects = useMemo(() => {
    if (fieldType !== 'کنکور' || !selectedGrade) return subjects;
    return subjects.filter((subject) =>
      subject.grades?.some((item) => item.grade === selectedGrade),
    );
  }, [fieldType, selectedGrade, subjects]);

  useEffect(() => {
    if (value.subjectId && !selectedSubject && !loading && subjects.length > 0) {
      onChange({});
    }
  }, [value.subjectId, selectedSubject, loading, subjects.length]);

  useEffect(() => {
    if (fieldType !== 'کنکور' || selectedGrade || !selectedSubject || !value.subjectId) return;
    const grades = selectedSubject.grades ?? [];
    if (grades.length === 1) setSelectedGrade(grades[0].grade);
  }, [fieldType, selectedGrade, selectedSubject, value.subjectId]);

  // A weekly draft already has a subject. Reopen it at the student's grade
  // instead of sending the user back through subject selection.
  useEffect(() => {
    if (!selectedSubject || selectedGrade || !value.subjectId || value.chapterId || value.topicModeId) return;
    const matchingGrade = selectedSubject.grades?.find((item) => item.grade === grade);
    if (matchingGrade) setSelectedGrade(matchingGrade.grade);
  }, [grade, selectedGrade, selectedSubject, value.chapterId, value.subjectId, value.topicModeId]);

  // ===== Grade / Chapter / Topic hierarchy =====
  const gradeSubject = selectedSubject?.grades?.find((g) => g.grade === selectedGrade) || null;
  const availableGrades = selectedSubject?.grades || [];

  const chapters = useMemo(() => {
    if (!gradeSubject) return [];
    return (gradeSubject.chapters || []).slice().sort((a, b) => a.chapterNo - b.chapterNo);
  }, [gradeSubject]);

  const topics = useMemo(() => {
    if (!selectedChapter?.topics) return [];
    return selectedChapter.topics.slice().sort((a, b) => a.topicNo - b.topicNo);
  }, [selectedChapter]);

  const emitSelection = useCallback(
    (chapter: ApiChapter, topicIds: string[], pStart?: number, pEnd?: number) => {
      if (!selectedSubject) return;
      const chapterTopics = (chapter.topics || []).slice().sort((a, b) => a.topicNo - b.topicNo);
      const selectedTopics = chapterTopics.filter((tp) => topicIds.includes(tp.id));
      const topicNames = selectedTopics.map(
        (tp) => `گفتار ${toPersianDigits(tp.topicNo)}: ${tp.title}`,
      );
      let displayText = `فصل ${toPersianDigits(chapter.chapterNo)}: ${bareTitle(chapter.title)}`;
      if (topicNames.length > 0) displayText += ' · ' + topicNames.join('، ');
      onChange({
        subjectId: selectedSubject.id,
        subjectName: selectedSubject.name,
        subjectColor: selectedSubject.color,
        chapterId: chapter.id,
        topicId: topicIds[0] || undefined,
        topicIds: topicIds.length > 0 ? topicIds : undefined,
        topicNames: topicNames.length > 0 ? topicNames : undefined,
        topicModeId: undefined,
        curriculumMode: 'BOOK',
        displayText,
        pageStart: pStart,
        pageEnd: pEnd,
      });
    },
    [selectedSubject, onChange],
  );

  const handleChapterPageRangeChange = useCallback(
    (start: string, end: string) => {
      const s = parseInt(start, 10);
      const e = parseInt(end, 10);
      if (isNaN(s) || isNaN(e) || s <= 0 || e <= 0 || s > e) return;
      let bestChapter: ApiChapter | null = null;
      let bestOverlap = 0;
      for (const ch of chapters) {
        if (ch.pageStart === null) continue;
        if (ch.pageEnd === null) continue;
        const chEnd = ch.pageEnd;
        const overlapStart = Math.max(ch.pageStart, s);
        const overlapEnd = Math.min(chEnd, e);
        const overlap = overlapEnd >= overlapStart ? (overlapEnd - overlapStart + 1) : 0;
        if (overlap > bestOverlap) { bestOverlap = overlap; bestChapter = ch; }
      }
      if (!bestChapter) return;
      setSelectedChapter(bestChapter);
      const chapterTopics = (bestChapter.topics || []).slice().sort((a, b) => a.topicNo - b.topicNo);
      const overlappingTopicIds = chapterTopics
        .filter((tp) => {
          if (tp.pageStart === null) return false;
          if (tp.pageEnd === null) return false;
          const tpEnd = tp.pageEnd;
          return tp.pageStart <= e && s <= tpEnd;
        })
        .map((tp) => tp.id);
      setSelectedTopicIds(overlappingTopicIds);
      emitSelection(bestChapter, overlappingTopicIds, s, e);
      if (bestChapter.topics?.length === 0) onSelectionComplete?.();
    },
    [chapters, emitSelection, onSelectionComplete],
  );

  const resetContentSelection = () => {
    setSelectedChapter(null); setSelectedTopicIds([]);
    setCurriculumMode(null); setSelectedTopicMode(null); setSelectedSubtopicIds([]);
    setPageRangeStart(''); setPageRangeEnd('');
  };
  const handleClearSubject = () => {
    if (fieldType !== 'کنکور') setSelectedGrade(null);
    resetContentSelection();
    onChange({});
  };
  const handleSelectGrade = (g: string) => {
    setSelectedGrade(g);
    resetContentSelection();
    onChange({});
  };
  const handleSelectSubject = (subject: ApiSubject) => {
    resetContentSelection();
    onChange({ subjectId: subject.id, subjectName: subject.name, subjectColor: subject.color });
  };
  const handleBackFromGrade = () => {
    if (fieldType === 'کنکور') {
      handleClearSubject();
      return;
    }
    setSelectedGrade(null);
    resetContentSelection();
  };
  const handleSelectChapter = (ch: ApiChapter) => {
    setSelectedChapter(ch); setSelectedTopicIds([]);
    setPageRangeStart(''); setPageRangeEnd('');
    onChange({
      subjectId: selectedSubject!.id, subjectName: selectedSubject!.name,
      subjectColor: selectedSubject!.color, chapterId: ch.id,
      topicId: undefined, topicIds: undefined, topicNames: undefined,
      topicModeId: undefined,
      curriculumMode: 'BOOK',
      displayText: `فصل ${toPersianDigits(ch.chapterNo)}: ${bareTitle(ch.title)}`,
    });
    if ((ch.topics?.length ?? 0) === 0) onSelectionComplete?.();
  };
  const handleBackFromChapter = () => {
    setSelectedChapter(null); setSelectedTopicIds([]);
    setPageRangeStart(''); setPageRangeEnd('');
  };
  const handleToggleTopic = (tp: ApiTopic) => {
    if (!selectedChapter) return;
    const next = selectedTopicIds.includes(tp.id) ? selectedTopicIds.filter((id) => id !== tp.id) : [...selectedTopicIds, tp.id];
    setSelectedTopicIds(next);
    emitSelection(selectedChapter, next, pageRangeStart ? parseInt(pageRangeStart, 10) : undefined, pageRangeEnd ? parseInt(pageRangeEnd, 10) : undefined);
  };
  const handleSelectAllTopics = () => {
    if (!selectedChapter) return;
    const allIds = topics.map((tp) => tp.id);
    setSelectedTopicIds(allIds);
    emitSelection(selectedChapter, allIds, pageRangeStart ? parseInt(pageRangeStart, 10) : undefined, pageRangeEnd ? parseInt(pageRangeEnd, 10) : undefined);
  };
  const handleClearAllTopics = () => {
    if (!selectedChapter) return;
    setSelectedTopicIds([]); setPageRangeStart(''); setPageRangeEnd('');
    emitSelection(selectedChapter, [], undefined, undefined);
  };

  const handleSelectTopicMode = (mode: ApiTopicMode) => {
    setSelectedTopicMode(mode);
    setSelectedSubtopicIds([]);
    onChange({
      subjectId: selectedSubject!.id,
      subjectName: selectedSubject!.name,
      subjectColor: selectedSubject!.color,
      curriculumMode: 'THEMATIC',
      topicModeId: mode.id,
      displayText: mode.title,
    });
  };

  const handleToggleSubtopic = (subtopic: ApiTopicModeSubtopic) => {
    if (!selectedTopicMode) return;
    const next = selectedSubtopicIds.includes(subtopic.id)
      ? selectedSubtopicIds.filter((id) => id !== subtopic.id)
      : [...selectedSubtopicIds, subtopic.id];
    setSelectedSubtopicIds(next);
    const selected = (selectedTopicMode.subtopics ?? []).filter((item) => next.includes(item.id));
    onChange({
      subjectId: selectedSubject!.id,
      subjectName: selectedSubject!.name,
      subjectColor: selectedSubject!.color,
      curriculumMode: 'THEMATIC',
      topicModeId: selectedTopicMode.id,
      topicModeSubtopicIds: next,
      topicModeSubtopicNames: selected.map((item) => item.title),
      displayText: [selectedTopicMode.title, ...selected.map((item) => item.title)].join(' · '),
    });
  };

  useEffect(() => {
    if (!selectedSubject || !value.chapterId || selectedChapter?.id === value.chapterId) return;
    for (const gradeOption of selectedSubject.grades ?? []) {
      const chapter = gradeOption.chapters?.find((item) => item.id === value.chapterId);
      if (!chapter) continue;
      setSelectedGrade(gradeOption.grade);
      setSelectedChapter(chapter);
      setSelectedTopicIds(value.topicIds ?? (value.topicId ? [value.topicId] : []));
      setPageRangeStart(value.pageStart ? String(value.pageStart) : '');
      setPageRangeEnd(value.pageEnd ? String(value.pageEnd) : '');
      break;
    }
  }, [selectedSubject, selectedChapter?.id, value.chapterId, value.topicId, value.topicIds, value.pageStart, value.pageEnd]);

  useEffect(() => {
    if (!selectedSubject || !value.topicModeId || selectedTopicMode?.id === value.topicModeId) return;
    for (const gradeOption of selectedSubject.grades ?? []) {
      const mode = gradeOption.topicModes?.find((item) => item.id === value.topicModeId);
      if (!mode) continue;
      setSelectedGrade(gradeOption.grade);
      setCurriculumMode('THEMATIC');
      setSelectedTopicMode(mode);
      setSelectedSubtopicIds(value.topicModeSubtopicIds ?? []);
      break;
    }
  }, [selectedSubject, selectedTopicMode?.id, value.topicModeId, value.topicModeSubtopicIds]);

  if (loading && subjects.length === 0) {
    return (<div className="space-y-3" dir="rtl"><div className="flex items-center gap-1.5 text-xs text-[var(--foreground-muted)] mb-2"><BookOpen className="w-3.5 h-3.5" /><span>در حال بارگذاری دروس...</span></div><div className="grid grid-cols-2 gap-2">{[0,1,2,3].map((i) => (<Skeleton key={i} className="h-14 rounded-xl bg-[var(--bg-overlay)]" />))}</div></div>);
  }
  if (!hasGradeMajor) {
    return (<div className="surface-1 rounded-xl p-6 text-center" dir="rtl"><AlertCircle className="w-8 h-8 mx-auto text-[var(--warning)] mb-2" /><p className="text-xs text-[var(--foreground-muted)] mb-1">پایه و رشته تحصیلی مشخص نیست</p><p className="text-[10px] text-[var(--foreground-subtle)] leading-relaxed">برای انتخاب درس، ابتدا باید پایه و رشته تحصیلی دانش‌آموز در پروفایل ثبت شده باشد.</p></div>);
  }
  if (error && subjects.length === 0) {
    return (<div className="surface-1 rounded-xl p-6 text-center" dir="rtl"><AlertCircle className="w-8 h-8 mx-auto text-[var(--danger)] mb-2" /><p className="text-xs text-[var(--foreground-muted)] mb-3">{error}</p><Button variant="outline" size="sm" className="btn-hover h-9" onClick={() => setReloadKey((k) => k + 1)}><RefreshCw className="w-3.5 h-3.5 ml-1" />تلاش مجدد</Button></div>);
  }

  if (fieldType === 'کنکور' && !selectedGrade) {
    if (konkurGrades.length === 0) return (<div className="surface-1 rounded-xl p-6 text-center" dir="rtl"><BookOpen className="w-8 h-8 mx-auto text-[var(--foreground-subtle)] mb-2" /><p className="text-xs text-[var(--foreground-muted)]">پایه‌ای برای کنکور این رشته یافت نشد</p></div>);
    return (
      <div className="space-y-3" dir="rtl">
        <div className="flex items-center gap-1.5 text-xs text-[var(--foreground-muted)]"><Layers className="w-3.5 h-3.5" /><span>پایه را انتخاب کن</span></div>
        <div className="grid grid-cols-3 gap-2">{konkurGrades.map((gradeOption) => (<button key={gradeOption} onClick={() => handleSelectGrade(gradeOption)} className="btn-hover h-12 rounded-xl border border-[var(--border)] surface-1 text-sm font-medium text-[var(--foreground)] hover:border-[var(--accent)]/40 hover:text-[var(--accent)]">{gradeOption}</button>))}</div>
      </div>
    );
  }

  if (!selectedSubject) {
    if (visibleSubjects.length === 0) return (<div className="surface-1 rounded-xl p-6 text-center" dir="rtl"><BookOpen className="w-8 h-8 mx-auto text-[var(--foreground-subtle)] mb-2" /><p className="text-xs text-[var(--foreground-muted)]">درسی برای این حوزه و پایه یافت نشد</p></div>);
    return (
      <div className="space-y-2" dir="rtl">
        {fieldType === 'کنکور' && <button onClick={() => { setSelectedGrade(null); onChange({}); }} className="inline-flex items-center gap-1 text-xs text-[var(--foreground-muted)] hover:text-[var(--foreground)]"><ArrowRight className="w-3.5 h-3.5" />تغییر پایه</button>}
        <div className="flex items-center gap-1.5 text-xs text-[var(--foreground-muted)] mb-2"><BookOpen className="w-3.5 h-3.5" /><span>{fieldType === 'کنکور' ? `کتاب‌های پایه ${selectedGrade}` : 'درس را انتخاب کن'}<span className="text-[var(--foreground-subtle)] mr-1.5">({toPersianDigits(visibleSubjects.length)} درس)</span></span></div>
        <div className="grid grid-cols-2 gap-2">{visibleSubjects.map((s) => { const isSelected = value.subjectId === s.id; return (<button key={s.id} onClick={() => handleSelectSubject(s)} className={`btn-hover card-hover flex items-center gap-2 py-2.5 px-3 rounded-xl text-sm transition-all min-h-[48px] border text-right ${isSelected ? 'bg-[var(--accent-soft)] text-[var(--accent)] border-[var(--accent)]/40' : 'surface-1 text-[var(--foreground)] border-[var(--border)] hover:text-[var(--accent)]'}`}><span className="text-base shrink-0">{s.icon || '📚'}</span><span className="truncate flex-1 font-medium">{s.name}</span></button>); })}</div>
      </div>
    );
  }

  if (!selectedGrade) {
    return (
      <div className="space-y-3" dir="rtl">
        <div className="surface-1 rounded-xl p-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0"><div className="w-9 h-9 rounded-lg flex items-center justify-center text-base shrink-0" style={{ backgroundColor: `${selectedSubject.color}22` }}>{selectedSubject.icon || '📚'}</div><div className="min-w-0"><p className="text-sm font-semibold text-[var(--foreground)] truncate">{selectedSubject.name}</p><p className="text-[10px] text-[var(--foreground-subtle)]">{grade} · {major}</p></div></div>
          <button onClick={handleClearSubject} className="btn-hover icon-btn text-[11px] px-2.5 py-1.5 rounded-lg border border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--accent)] shrink-0">تغییر درس</button>
        </div>
        <p className="text-xs text-[var(--foreground-muted)]">پایه مورد نظر را انتخاب کنید</p>
        {availableGrades.length === 0 ? (<div className="surface-1 rounded-xl p-6 text-center text-xs text-[var(--foreground-muted)]">هیچ پایه‌ای برای این درس در این رشته یافت نشد</div>) : (<div className="flex flex-wrap gap-2">{availableGrades.map((g) => (<button key={g.grade} onClick={() => handleSelectGrade(g.grade)} className="btn-hover h-11 px-4 rounded-xl border border-[var(--border)] text-sm font-medium text-[var(--foreground)] hover:border-[var(--accent)]/40 hover:text-[var(--accent)]">{g.grade}</button>))}</div>)}
      </div>
    );
  }

  if (!curriculumMode) {
    const hasThematic = (gradeSubject?.topicModes?.length ?? 0) > 0;
    return (
      <div className="space-y-3" dir="rtl">
        <div className="surface-1 rounded-xl p-3 flex items-center gap-2">
          <button onClick={handleBackFromGrade} className="btn-hover icon-btn w-8 h-8 rounded-lg border border-[var(--border)] text-[var(--foreground-muted)] flex items-center justify-center"><ArrowRight className="w-4 h-4" /></button>
          <span className="text-xs text-[var(--foreground-muted)]">{selectedSubject.name} · {selectedGrade}</span>
        </div>
        <p className="text-xs text-[var(--foreground-muted)]">روش انتخاب محتوا را مشخص کنید</p>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => { setCurriculumMode('BOOK'); onChange({ subjectId: selectedSubject.id, subjectName: selectedSubject.name, subjectColor: selectedSubject.color, curriculumMode: 'BOOK' }); }} className="surface-1 rounded-xl border border-[var(--border)] p-4 text-sm font-medium hover:border-[var(--accent)]/40"><BookOpen className="w-5 h-5 mx-auto mb-2 text-[var(--accent)]" />کتابی</button>
          <button disabled={!hasThematic} onClick={() => { setCurriculumMode('THEMATIC'); onChange({ subjectId: selectedSubject.id, subjectName: selectedSubject.name, subjectColor: selectedSubject.color, curriculumMode: 'THEMATIC' }); }} className="surface-1 rounded-xl border border-[var(--border)] p-4 text-sm font-medium hover:border-[var(--accent)]/40 disabled:opacity-40"><Layers className="w-5 h-5 mx-auto mb-2 text-[var(--accent)]" />مبحثی</button>
        </div>
        {!hasThematic && <p className="text-[10px] text-[var(--foreground-subtle)]">برای این پایه ساختار مبحثی تعریف نشده است.</p>}
      </div>
    );
  }

  if (curriculumMode === 'THEMATIC') {
    const modes = gradeSubject?.topicModes ?? [];
    if (!selectedTopicMode) return (
      <div className="space-y-3" dir="rtl">
        <button onClick={() => setCurriculumMode(null)} className="text-xs text-[var(--foreground-muted)]">بازگشت به روش انتخاب</button>
        <p className="text-xs text-[var(--foreground-muted)]">مبحث اصلی را انتخاب کنید</p>
        <div className="space-y-2">{modes.map((mode) => <button key={mode.id} onClick={() => handleSelectTopicMode(mode)} className="w-full surface-1 border border-[var(--border)] rounded-xl p-3 text-right text-sm">{mode.title}<span className="block mt-1 text-[10px] text-[var(--foreground-subtle)]">{toPersianDigits(mode.subtopics?.length ?? 0)} زیرمبحث</span></button>)}</div>
      </div>
    );
    return (
      <div className="space-y-3" dir="rtl">
        <button onClick={() => setSelectedTopicMode(null)} className="text-xs text-[var(--foreground-muted)]">بازگشت به مباحث</button>
        <div className="surface-1 rounded-xl p-3"><p className="text-sm font-semibold">{selectedTopicMode.title}</p></div>
        {(selectedTopicMode.subtopics?.length ?? 0) === 0 ? <p className="text-xs text-[var(--foreground-muted)]">این مبحث زیرمبحث ندارد و قابل ثبت است.</p> : <div className="space-y-2">{selectedTopicMode.subtopics!.map((subtopic) => { const selected = selectedSubtopicIds.includes(subtopic.id); return <button key={subtopic.id} onClick={() => handleToggleSubtopic(subtopic)} className={`w-full rounded-xl border p-3 text-right text-sm ${selected ? 'bg-[var(--accent-soft)] border-[var(--accent)]/40 text-[var(--accent)]' : 'surface-1 border-[var(--border)]'}`}>{subtopic.title}</button>; })}</div>}
      </div>
    );
  }

  // ===== Chapter selection + PAGE RANGE INPUT =====
  if (!selectedChapter) {
    return (
      <div className="space-y-3" dir="rtl">
        <div className="surface-1 rounded-xl p-3 flex items-center gap-2">
          <button onClick={handleBackFromGrade} className="btn-hover icon-btn w-8 h-8 rounded-lg border border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] flex items-center justify-center" aria-label="بازگشت به پایه‌ها"><ArrowRight className="w-4 h-4" /></button>
          <div className="flex items-center gap-2 min-w-0"><span className="text-xs text-[var(--foreground-muted)]">{selectedSubject.name} · {selectedGrade}</span></div>
        </div>
        {chapters.length > 0 && (
          <div className="surface-1 rounded-xl p-3 space-y-2">
            <div className="flex items-center gap-1.5 text-xs text-[var(--foreground-muted)]"><Filter className="w-3.5 h-3.5" /><span>انتخاب بر اساس رنج صفحات</span></div>
            <div className="flex items-center gap-2">
              <div className="flex-1"><label className="text-[10px] text-[var(--foreground-subtle)] block mb-1">از صفحه</label><input type="number" min="1" value={pageRangeStart} onChange={(e) => { const v = e.target.value; setPageRangeStart(v); handleChapterPageRangeChange(v, pageRangeEnd); }} placeholder="مثلاً ۱" className="w-full h-9 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] px-2.5 text-[var(--foreground)] text-sm focus:border-[var(--accent)] focus:outline-none transition-colors" dir="ltr" /></div>
              <div className="flex-1"><label className="text-[10px] text-[var(--foreground-subtle)] block mb-1">تا صفحه</label><input type="number" min="1" value={pageRangeEnd} onChange={(e) => { const v = e.target.value; setPageRangeEnd(v); handleChapterPageRangeChange(pageRangeStart, v); }} placeholder="مثلاً ۵۰" className="w-full h-9 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] px-2.5 text-[var(--foreground)] text-sm focus:border-[var(--accent)] focus:outline-none transition-colors" dir="ltr" /></div>
            </div>
        {pageRangeStart && pageRangeEnd && parseInt(pageRangeStart) > 0 && parseInt(pageRangeEnd) > 0 && parseInt(pageRangeStart) <= parseInt(pageRangeEnd) && (<p className="text-[10px] text-[var(--accent)]">رنج صفحات وارد شد — فصل و گفتارهای مربوطه خودکار انتخاب می‌شوند</p>)}
          </div>
        )}
        <p className="text-xs text-[var(--foreground-muted)]">یا فصل رو دستی انتخاب کن:</p>
        {chapters.length === 0 ? (<div className="surface-1 rounded-xl p-6 text-center text-xs text-[var(--foreground-muted)]">فصلی برای این پایه ثبت نشده</div>) : (
          <div className="space-y-1.5 max-h-60 overflow-y-auto custom-scrollbar">{chapters.map((ch) => {
            const rangeS = parseInt(pageRangeStart, 10); const rangeE = parseInt(pageRangeEnd, 10);
            const isInRange = !isNaN(rangeS) && !isNaN(rangeE) && rangeS > 0 && rangeE > 0 && rangeS <= rangeE && ch.pageStart !== null && ch.pageEnd !== null && ch.pageStart <= rangeE && rangeS <= ch.pageEnd;
            return (<button key={ch.id} onClick={() => handleSelectChapter(ch)} className={`btn-hover w-full text-right p-3 rounded-lg border flex items-center gap-3 transition-all ${isInRange ? 'bg-[var(--accent-soft)] border-[var(--accent)]/40' : 'border-[var(--border)] surface-1'}`}><span className={`w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0 ${isInRange ? 'bg-[var(--accent)] text-[var(--bg-deep)]' : 'bg-[var(--bg-elevated)] text-[var(--foreground-muted)]'}`}>{toPersianDigits(ch.chapterNo)}</span><span className={`flex-1 text-sm font-medium truncate ${isInRange ? 'text-[var(--accent)]' : 'text-[var(--foreground)]'}`}>{bareTitle(ch.title)}</span><span className="text-[10px] text-[var(--foreground-subtle)] shrink-0">{formatPageRange(ch)}</span>{ch.topics && ch.topics.length > 0 && (<span className="text-[10px] text-[var(--foreground-subtle)] shrink-0">{toPersianDigits(ch.topics.length)} گفتار</span>)}</button>);
          })}</div>
        )}
      </div>
    );
  }

  // ===== Topic selection (multi-select) =====
  if (topics.length === 0) {
    return (
      <div className="space-y-3" dir="rtl">
        <div className="surface-1 rounded-xl p-3 flex items-center gap-2">
          <button onClick={handleBackFromChapter} className="btn-hover icon-btn w-8 h-8 rounded-lg border border-[var(--border)] text-[var(--foreground-muted)] flex items-center justify-center" aria-label="بازگشت به فصل‌ها"><ArrowRight className="w-4 h-4" /></button>
          <span className="text-xs text-[var(--foreground-muted)] truncate">{selectedSubject.name} · {selectedGrade} · فصل {toPersianDigits(selectedChapter.chapterNo)}: {bareTitle(selectedChapter.title)}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3" dir="rtl">
      <div className="surface-1 rounded-xl p-3 flex items-center gap-2">
        <button onClick={handleBackFromChapter} className="btn-hover icon-btn w-8 h-8 rounded-lg border border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] flex items-center justify-center" aria-label="بازگشت به فصل‌ها"><ArrowRight className="w-4 h-4" /></button>
        <div className="flex items-center gap-2 min-w-0 flex-1"><span className="text-xs text-[var(--foreground-muted)] truncate">{selectedSubject.name} · {selectedGrade} · فصل {toPersianDigits(selectedChapter.chapterNo)}: {bareTitle(selectedChapter.title)}</span></div>
        {selectedTopicIds.length > 0 && (<span className="text-[10px] px-2 py-1 rounded-md bg-[var(--accent-soft)] text-[var(--accent)] font-semibold shrink-0">{toPersianDigits(selectedTopicIds.length)} گفتار</span>)}
      </div>
      <div className="surface-1 rounded-xl p-3 space-y-2">
        <div className="flex items-center gap-1.5 text-xs text-[var(--foreground-muted)]"><Filter className="w-3.5 h-3.5" /><span>انتخاب بر اساس رنج صفحات</span></div>
        <div className="flex items-center gap-2">
          <div className="flex-1"><label className="text-[10px] text-[var(--foreground-subtle)] block mb-1">از صفحه</label><input type="number" min="1" value={pageRangeStart} onChange={(e) => { const v = e.target.value; setPageRangeStart(v); handleChapterPageRangeChange(v, pageRangeEnd); }} placeholder="مثلاً ۱" className="w-full h-9 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] px-2.5 text-[var(--foreground)] text-sm focus:border-[var(--accent)] focus:outline-none transition-colors" dir="ltr" /></div>
          <div className="flex-1"><label className="text-[10px] text-[var(--foreground-subtle)] block mb-1">تا صفحه</label><input type="number" min="1" value={pageRangeEnd} onChange={(e) => { const v = e.target.value; setPageRangeEnd(v); handleChapterPageRangeChange(pageRangeStart, v); }} placeholder="مثلاً ۵۰" className="w-full h-9 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] px-2.5 text-[var(--foreground)] text-sm focus:border-[var(--accent)] focus:outline-none transition-colors" dir="ltr" /></div>
        </div>
        {pageRangeStart && pageRangeEnd && parseInt(pageRangeStart) > 0 && parseInt(pageRangeEnd) > 0 && parseInt(pageRangeStart) <= parseInt(pageRangeEnd) && (<p className="text-[10px] text-[var(--accent)]">رنج صفحات وارد شد — گفتارهای مربوطه خودکار انتخاب می‌شوند</p>)}
      </div>
      {pageRangeStart && pageRangeEnd && (
        <div className="flex items-center gap-2 text-[10px] text-[var(--accent)] bg-[var(--accent-soft)] rounded-lg px-3 py-2"><Filter className="w-3 h-3" /><span>صفحات {toPersianDigits(pageRangeStart)} تا {toPersianDigits(pageRangeEnd)}</span>{selectedTopicIds.length > 0 && (<span>— {toPersianDigits(selectedTopicIds.length)} گفتار انتخاب‌شده</span>)}</div>
      )}
      {topics.length > 0 && (
        <div className="flex items-center gap-2">
          <button onClick={handleSelectAllTopics} className="text-[10px] px-2.5 py-1 rounded-md border border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--accent)] hover:border-[var(--accent)]/40 transition-colors">انتخاب همه</button>
          {selectedTopicIds.length > 0 && (<button onClick={handleClearAllTopics} className="text-[10px] px-2.5 py-1 rounded-md border border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--danger)] hover:border-[var(--danger)]/40 transition-colors flex items-center gap-1"><X className="w-3 h-3" />پاک کردن انتخاب‌ها</button>)}
        </div>
      )}
      <div className="space-y-1.5 max-h-64 overflow-y-auto custom-scrollbar">{topics.map((tp) => { const isSelected = selectedTopicIds.includes(tp.id); return (<button key={tp.id} onClick={() => handleToggleTopic(tp)} className={`btn-hover w-full text-right p-3 rounded-lg border flex items-center gap-3 transition-all ${isSelected ? 'bg-[var(--accent-soft)] border-[var(--accent)]/40 text-[var(--accent)]' : 'border-[var(--border)] surface-1 text-[var(--foreground)]'}`}><span className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 text-[10px] font-bold transition-all ${isSelected ? 'bg-[var(--accent)] text-[var(--bg-deep)]' : 'bg-[var(--bg-elevated)] text-[var(--foreground-muted)]'}`}>{isSelected ? <CheckCircle2 className="w-3.5 h-3.5" /> : toPersianDigits(tp.topicNo)}</span><span className="flex-1 text-sm font-medium truncate">{tp.title}</span><span className="text-[10px] text-[var(--foreground-subtle)] shrink-0">{formatPageRange(tp)}</span></button>); })}</div>
    </div>
  );
}
