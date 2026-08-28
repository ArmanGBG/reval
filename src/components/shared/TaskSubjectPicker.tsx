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
  Video,
} from 'lucide-react';
import { Chapter, GradeSubject, Subject, Topic, TopicMode, TopicModeSubtopic } from '@/lib/subjects-types';
import { FieldType } from '@/lib/types';
import { apiFetch, AuthError } from '@/lib/api-client';
import { normalizeNumericInput } from '@/lib/digits';
import { ClassSessionFields } from '@/components/shared/ClassSessionFields';
import { FIELD_TYPE_STYLES } from '@/components/shared/FieldTypeBadge';
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

// Joined two-option (کنکور/نهایی) segmented control that fills the available
// row width, so book/grade rows never end up with large empty areas.
function FieldTypeSegment({ konkur, final, onPick, className = '' }: { konkur: boolean; final: boolean; onPick: (fieldType: FieldType) => void; className?: string }) {
  if (!konkur && !final) return null;
  return (
    <div className={`flex h-11 min-w-0 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--bg-base)] ${className}`} role="group" aria-label="انتخاب حوزه">
      {konkur && (
        <button
          type="button"
          onClick={() => onPick('کنکور')}
          className={`flex min-h-11 flex-1 items-center justify-center px-3 text-xs font-semibold transition-colors ${FIELD_TYPE_STYLES['کنکور'].segment} ${final ? 'border-e border-[var(--border)]' : ''}`}
        >
          کنکور
        </button>
      )}
      {final && (
        <button
          type="button"
          onClick={() => onPick('نهایی')}
          className={`flex min-h-11 flex-1 items-center justify-center px-3 text-xs font-semibold transition-colors ${FIELD_TYPE_STYLES['نهایی'].segment}`}
        >
          نهایی
        </button>
      )}
    </div>
  );
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
  contentType?: 'BOOK' | 'THEMATIC' | 'CLASS_VIDEO';
  teacherClassName?: string;
  sessionNumber?: string;
  displayText?: string;
  pageStart?: number;
  pageEnd?: number;
}

export interface TaskSubjectPickerDraftState {
  selectedGrade: string | null;
  curriculumMode: 'BOOK' | 'THEMATIC' | null;
  selectedChapterId: string | null;
  selectedTopicIds: string[];
  selectedTopicModeId: string | null;
  selectedSubtopicIds: string[];
  pageRangeStart: string;
  pageRangeEnd: string;
}

interface TaskSubjectPickerProps {
  fieldType: FieldType | null;
  grade: string;
  major: string;
  value: TaskSelection;
  onChange: (selection: TaskSelection) => void;
  onSelectionComplete?: () => void;
  draftState?: TaskSubjectPickerDraftState;
  onDraftStateChange?: (state: TaskSubjectPickerDraftState) => void;
  allGrades?: boolean;
  onFieldTypeChange?: (fieldType: FieldType | null, selection?: TaskSelection) => void;
  onClassVideoSelected?: () => void;
  onClassVideoExited?: () => void;
  allowClassCurriculumLink?: boolean;
  teacherClassSuggestions?: string[];
  onTeacherSuggestionRemove?: (value: string) => void;
  allowClassVideo?: boolean;
  allowSubjectOnlySelection?: boolean;
}

type ApiSubject = Subject;
type ApiGradeSubject = GradeSubject;
type ApiChapter = Chapter;
type ApiTopic = Topic;
type ApiTopicMode = TopicMode;
type ApiTopicModeSubtopic = TopicModeSubtopic;

type CourseBookOption = {
  subject: ApiSubject;
  gradeSubject: ApiGradeSubject;
};

type CourseGroup = {
  name: string;
  icon: string | null;
  color: string;
  books: CourseBookOption[];
};

function courseName(name: string): string {
  const withoutBookNumber = name.replace(/\s*[۱۲۳123]\s*$/, '').trim();
  return withoutBookNumber
    .replace(/^زیست(?:‌|\s)*شناسی$/, 'زیست')
    .replace(/^زمین(?:‌|\s)*شناسی$/, 'زمین');
}

function bookLabel(course: CourseGroup, grade: string): string {
  return `${course.name} ${grade}`;
}

const GRADE_ORDER: Record<string, number> = { دهم: 1, یازدهم: 2, دوازدهم: 3 };

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
  draftState,
  onDraftStateChange,
  allGrades = false,
  onFieldTypeChange,
  onClassVideoSelected,
  onClassVideoExited,
  allowClassCurriculumLink = false,
  teacherClassSuggestions = [],
  onTeacherSuggestionRemove,
  allowClassVideo = true,
  allowSubjectOnlySelection = false,
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
    const load = async () => {
      // The book list deliberately exposes every eligible grade. Keep reloads
      // after choosing Konkur/Final on the same scope so a selected book does
      // not disappear merely because it is not the student's current grade.
      const suffix = `grade=${encodeURIComponent(grade)}&major=${encodeURIComponent(major)}&allGrades=true`;
      const responses = fieldType
        ? [await apiFetch(`/api/subjects/for-task?fieldType=${encodeURIComponent(fieldType)}&${suffix}`)]
        : await Promise.all(['کنکور', 'نهایی'].map((type) => apiFetch(`/api/subjects/for-task?fieldType=${encodeURIComponent(type)}&${suffix}`)));
      const payloads = await Promise.all(responses.map(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'خطا در بارگذاری دروس');
        return data.subjects as ApiSubject[];
      }));
      const merged = new Map<string, ApiSubject>();
      for (const subject of payloads.flat()) {
        const current = merged.get(subject.id);
        if (!current) merged.set(subject.id, subject);
        else {
          const grades = new Map((current.grades ?? []).map((item) => [item.id, item]));
          for (const item of subject.grades ?? []) grades.set(item.id, item);
          merged.set(subject.id, { ...current, grades: [...grades.values()] });
        }
      }
      return [...merged.values()];
    };
    load()
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

  // For Konkur, grades are shown as books after the user chooses a course.
  const [selectedGrade, setSelectedGrade] = useState<string | null>(draftState?.selectedGrade ?? null);
  const [selectedCourseName, setSelectedCourseName] = useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<ApiChapter | null>(null);
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>(draftState?.selectedTopicIds ?? []);
  const [curriculumMode, setCurriculumMode] = useState<'BOOK' | 'THEMATIC' | null>(draftState?.curriculumMode ?? value.curriculumMode ?? null);
  const [selectedTopicMode, setSelectedTopicMode] = useState<ApiTopicMode | null>(null);
  const [selectedSubtopicIds, setSelectedSubtopicIds] = useState<string[]>(draftState?.selectedSubtopicIds ?? value.topicModeSubtopicIds ?? []);
  const [pageRangeStart, setPageRangeStart] = useState<string>(draftState?.pageRangeStart ?? '');
  const [pageRangeEnd, setPageRangeEnd] = useState<string>(draftState?.pageRangeEnd ?? '');
  const [linkingClassVideo, setLinkingClassVideo] = useState(
    allowClassCurriculumLink && value.contentType === 'CLASS_VIDEO',
  );

  useEffect(() => {
    if (allowClassCurriculumLink && value.contentType === 'CLASS_VIDEO') {
      setLinkingClassVideo(true);
    }
  }, [allowClassCurriculumLink, value.contentType]);

  useEffect(() => {
    onDraftStateChange?.({
      selectedGrade,
      curriculumMode,
      selectedChapterId: selectedChapter?.id ?? draftState?.selectedChapterId ?? null,
      selectedTopicIds,
      selectedTopicModeId: selectedTopicMode?.id ?? draftState?.selectedTopicModeId ?? null,
      selectedSubtopicIds,
      pageRangeStart,
      pageRangeEnd,
    });
  }, [curriculumMode, draftState?.selectedChapterId, draftState?.selectedTopicModeId, onDraftStateChange, pageRangeEnd, pageRangeStart, selectedChapter?.id, selectedGrade, selectedSubtopicIds, selectedTopicIds, selectedTopicMode?.id]);

  const courseGroups = useMemo<CourseGroup[]>(() => {
    const groups = new Map<string, CourseGroup>();
    for (const subject of subjects) {
      const name = courseName(subject.name);
      const group = groups.get(name) ?? {
        name,
        icon: subject.icon,
        color: subject.color,
        books: [],
      };
      for (const gradeSubject of subject.grades ?? []) {
        const duplicate = group.books.some(
          (book) => book.gradeSubject.grade === gradeSubject.grade && book.gradeSubject.major === gradeSubject.major,
        );
        if (!duplicate) group.books.push({ subject, gradeSubject });
      }
      groups.set(name, group);
    }
    return [...groups.values()]
      .map((group) => ({
        ...group,
        books: group.books.sort((a, b) => (GRADE_ORDER[a.gradeSubject.grade] ?? 99) - (GRADE_ORDER[b.gradeSubject.grade] ?? 99)),
      }))
      .sort((a, b) => a.books[0]?.gradeSubject.sortOrder - b.books[0]?.gradeSubject.sortOrder || a.name.localeCompare(b.name));
  }, [subjects]);

  const selectedCourse = useMemo(
    () => courseGroups.find((group) => group.name === (selectedCourseName ?? (linkingClassVideo && value.subjectName ? courseName(value.subjectName) : null))) ?? null,
    [courseGroups, linkingClassVideo, selectedCourseName, value.subjectName],
  );

  const visibleSubjects = useMemo(() => {
    if (fieldType !== 'کنکور' || !selectedGrade) return subjects;
    return subjects.filter((subject) =>
      subject.grades?.some((item) => item.grade === selectedGrade),
    );
  }, [fieldType, selectedGrade, subjects]);

  // ===== Grade / Chapter / Topic hierarchy =====
  const gradeSubject = selectedSubject?.grades?.find((g) => g.grade === selectedGrade) || null;
  const availableGrades = selectedSubject?.grades || [];
  const hasThematic = (gradeSubject?.topicModes?.length ?? 0) > 0;

  useEffect(() => {
    if (!selectedGrade || !gradeSubject || curriculumMode || hasThematic) return;
    setCurriculumMode('BOOK');
    onChange({
      subjectId: selectedSubject!.id,
      subjectName: selectedSubject!.name,
      subjectColor: selectedSubject!.color,
      curriculumMode: 'BOOK',
    });
  }, [curriculumMode, gradeSubject, hasThematic, onChange, selectedGrade, selectedSubject]);

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
      const selectedTopics = chapters.flatMap((item) => item.topics || []).filter((tp) => topicIds.includes(tp.id));
      const topicNames = selectedTopics.map(
        (tp) => `گفتار ${toPersianDigits(tp.topicNo)}: ${tp.title}`,
      );
      const rangedChapters = pStart != null && pEnd != null
        ? chapters.filter((item) => item.pageStart != null && item.pageEnd != null && item.pageStart <= pEnd && pStart <= item.pageEnd)
        : [chapter];
      let displayText = rangedChapters.length > 1
        ? `فصل‌های ${rangedChapters.map((item) => toPersianDigits(item.chapterNo)).join(' و ')}`
        : `فصل ${toPersianDigits(chapter.chapterNo)}: ${bareTitle(chapter.title)}`;
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
        contentType: value.contentType === 'CLASS_VIDEO' ? 'CLASS_VIDEO' : 'BOOK',
        teacherClassName: value.teacherClassName,
        sessionNumber: value.sessionNumber,
        displayText,
        pageStart: pStart,
        pageEnd: pEnd,
      });
    },
    [chapters, onChange, selectedSubject, value.contentType, value.sessionNumber, value.teacherClassName],
  );

  const handleChapterPageRangeChange = useCallback(
    (start: string, end: string) => {
      const s = parseInt(start, 10);
      const e = parseInt(end, 10);
      if (isNaN(s) || isNaN(e) || s <= 0 || e <= 0 || s > e) return;
      const overlappingChapters = chapters.filter((ch) =>
        ch.pageStart !== null && ch.pageEnd !== null && ch.pageStart <= e && s <= ch.pageEnd,
      );
      if (overlappingChapters.length === 0) return;
      const primaryChapter = overlappingChapters[0];
      setSelectedChapter(primaryChapter);
      const overlappingTopicIds = overlappingChapters.flatMap((chapter) => chapter.topics || [])
        .filter((tp) => {
          if (tp.pageStart === null) return false;
          if (tp.pageEnd === null) return false;
          return tp.pageStart <= e && s <= tp.pageEnd;
        })
        .map((tp) => tp.id);
      setSelectedTopicIds(overlappingTopicIds);
      emitSelection(primaryChapter, overlappingTopicIds, s, e);
      if (overlappingChapters.every((chapter) => (chapter.topics?.length ?? 0) === 0)) onSelectionComplete?.();
    },
    [chapters, emitSelection, onSelectionComplete],
  );

  const resetContentSelection = () => {
    setSelectedChapter(null); setSelectedTopicIds([]);
    setCurriculumMode(null); setSelectedTopicMode(null); setSelectedSubtopicIds([]);
    setPageRangeStart(''); setPageRangeEnd('');
  };
  const handleClearSubject = () => {
    setSelectedCourseName(null);
    setSelectedGrade(null);
    resetContentSelection();
    if (value.contentType === 'CLASS_VIDEO') {
      onChange({
        subjectId: selectedSubject?.id ?? value.subjectId,
        subjectName: selectedSubject?.name ?? value.subjectName,
        subjectColor: selectedSubject?.color ?? value.subjectColor,
        contentType: 'CLASS_VIDEO',
        teacherClassName: value.teacherClassName,
        sessionNumber: value.sessionNumber,
      });
      return;
    }
    // Returning to the course list must drop the selected book and its field
    // tag, otherwise the picker re-renders the same screen (subject-only
    // drafts land here with no grade chosen yet) and the button is a no-op.
    onFieldTypeChange?.(null, {});
    if (!onFieldTypeChange) onChange({});
  };
  const handleSelectGrade = (g: string) => {
    setSelectedGrade(g);
    resetContentSelection();
    if (selectedSubject) {
      onChange({
        subjectId: selectedSubject.id,
        subjectName: selectedSubject.name,
        subjectColor: selectedSubject.color,
      });
    } else {
      onChange({});
    }
  };
  const handleSelectSubject = (subject: ApiSubject) => {
    resetContentSelection();
    onChange({ subjectId: subject.id, subjectName: subject.name, subjectColor: subject.color });
  };
  const handleSelectCourse = (group: CourseGroup) => {
    setSelectedCourseName(group.name);
    setSelectedGrade(null);
    resetContentSelection();
    const representative = group.books.find((book) => book.gradeSubject.grade === grade) ?? group.books[0];
    onChange(allowSubjectOnlySelection && representative ? {
      subjectId: representative.subject.id,
      subjectName: group.name,
      subjectColor: representative.subject.color,
    } : {});
  };
  const handleSelectBook = (book: CourseBookOption) => {
    setSelectedCourseName(courseName(book.subject.name));
    setSelectedGrade(book.gradeSubject.grade);
    resetContentSelection();
    setCurriculumMode('BOOK');
    onChange({
      subjectId: book.subject.id,
      subjectName: book.subject.name,
      subjectColor: book.subject.color,
      contentType: value.teacherClassName != null || value.sessionNumber != null ? 'CLASS_VIDEO' : 'BOOK',
      curriculumMode: 'BOOK',
      teacherClassName: value.teacherClassName,
      sessionNumber: value.sessionNumber,
    });
  };
  const handleSelectBookField = (book: CourseBookOption, nextFieldType: FieldType) => {
    setSelectedCourseName(courseName(book.subject.name));
    setSelectedGrade(book.gradeSubject.grade);
    resetContentSelection();
    setCurriculumMode('BOOK');
    const nextSelection: TaskSelection = {
      subjectId: book.subject.id,
      subjectName: book.subject.name,
      subjectColor: book.subject.color,
      contentType: value.contentType === 'CLASS_VIDEO' ? 'CLASS_VIDEO' : 'BOOK',
      curriculumMode: 'BOOK',
      teacherClassName: value.teacherClassName,
      sessionNumber: value.sessionNumber,
    };
    onFieldTypeChange?.(nextFieldType, nextSelection);
    if (!onFieldTypeChange) onChange(nextSelection);
  };
  const handleBackFromGrade = () => {
    setSelectedGrade(null);
    resetContentSelection();
    if (value.contentType === 'CLASS_VIDEO') {
      onChange({
        subjectId: selectedSubject?.id ?? value.subjectId,
        subjectName: selectedSubject?.name ?? value.subjectName,
        subjectColor: selectedSubject?.color ?? value.subjectColor,
        contentType: 'CLASS_VIDEO',
        teacherClassName: value.teacherClassName,
        sessionNumber: value.sessionNumber,
      });
      return;
    }
    // The field tag belongs to the selected book. Going back to the course's
    // book list must clear it, otherwise the list remains locked to Konkur or
    // Final and the user cannot revise that choice.
    onFieldTypeChange?.(null, {});
    if (!onFieldTypeChange) onChange({});
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
      contentType: value.contentType === 'CLASS_VIDEO' ? 'CLASS_VIDEO' : 'BOOK',
      teacherClassName: value.teacherClassName,
      sessionNumber: value.sessionNumber,
      displayText: `فصل ${toPersianDigits(ch.chapterNo)}: ${bareTitle(ch.title)}`,
    });
    if ((ch.topics?.length ?? 0) === 0) onSelectionComplete?.();
  };
  const handleBackFromChapter = () => {
    setSelectedChapter(null); setSelectedTopicIds([]);
    setPageRangeStart(''); setPageRangeEnd('');
  };

  const handleSelectClassVideo = () => {
    const group = selectedCourse;
    const book = group?.books.find((item) => item.gradeSubject.grade === grade) ?? group?.books[0];
    if (!group || !book) return;
    // A class is attached to the course only. Do not select a grade or
    // curriculum here; those are optional details completed later.
    setSelectedGrade(null);
    resetContentSelection();
    onChange({
      subjectId: book.subject.id,
      subjectName: group.name,
      subjectColor: book.subject.color,
      contentType: 'CLASS_VIDEO',
      teacherClassName: value.teacherClassName ?? '',
      sessionNumber: value.sessionNumber ?? '',
      displayText: 'کلاس/ویدیو',
    });
    onClassVideoSelected?.();
  };

  const handleSelectTopicMode = (mode: ApiTopicMode, book?: CourseBookOption) => {
    if (book) {
      setSelectedGrade(book.gradeSubject.grade);
      setSelectedCourseName(courseName(book.subject.name));
    }
    setCurriculumMode('THEMATIC');
    setSelectedTopicMode(mode);
    setSelectedSubtopicIds([]);
    onChange({
      subjectId: book?.subject.id ?? selectedSubject!.id,
      subjectName: book?.subject.name ?? selectedSubject!.name,
      subjectColor: book?.subject.color ?? selectedSubject!.color,
      contentType: value.contentType === 'CLASS_VIDEO' ? 'CLASS_VIDEO' : 'THEMATIC',
      curriculumMode: 'THEMATIC',
      topicModeId: mode.id,
      displayText: mode.title,
      teacherClassName: value.teacherClassName,
      sessionNumber: value.sessionNumber,
    });
  };

  const handleBackFromSelectedTopicMode = () => {
    setSelectedTopicMode(null);
    setSelectedSubtopicIds([]);
    onChange({
      subjectId: selectedSubject?.id ?? value.subjectId,
      subjectName: selectedSubject?.name ?? value.subjectName,
      subjectColor: selectedSubject?.color ?? value.subjectColor,
      contentType: value.contentType,
      curriculumMode: 'THEMATIC',
      teacherClassName: value.teacherClassName,
      sessionNumber: value.sessionNumber,
    });
  };

  const handleBackFromThematic = () => {
    setCurriculumMode(null);
    setSelectedTopicMode(null);
    setSelectedSubtopicIds([]);
    onChange({
      subjectId: selectedSubject?.id ?? value.subjectId,
      subjectName: selectedSubject?.name ?? value.subjectName,
      subjectColor: selectedSubject?.color ?? value.subjectColor,
      contentType: value.contentType,
      teacherClassName: value.teacherClassName,
      sessionNumber: value.sessionNumber,
    });
  };

  const handleSelectTopicField = (mode: ApiTopicMode, book: CourseBookOption, nextFieldType: FieldType) => {
    const nextSelection: TaskSelection = {
      subjectId: book.subject.id,
      subjectName: book.subject.name,
      subjectColor: book.subject.color,
      contentType: value.contentType === 'CLASS_VIDEO' ? 'CLASS_VIDEO' : 'THEMATIC',
      curriculumMode: 'THEMATIC',
      topicModeId: mode.id,
      displayText: mode.title,
      teacherClassName: value.teacherClassName,
      sessionNumber: value.sessionNumber,
    };
    setSelectedCourseName(courseName(book.subject.name));
    setSelectedGrade(book.gradeSubject.grade);
    setCurriculumMode('THEMATIC');
    setSelectedTopicMode(mode);
    setSelectedSubtopicIds([]);
    onFieldTypeChange?.(nextFieldType, nextSelection);
    if (!onFieldTypeChange) onChange(nextSelection);
  };

  const handleBackFromClassVideo = () => {
    setLinkingClassVideo(false);
    setSelectedGrade(null);
    resetContentSelection();
    onChange({});
    onClassVideoExited?.();
  };

  const handleLinkClassVideo = () => {
    const sourceSubject = selectedSubject ?? selectedCourse?.books[0]?.subject;
    if (!sourceSubject) return;
    setLinkingClassVideo(true);
    setSelectedCourseName(courseName(sourceSubject.name));
    setSelectedGrade(null);
    resetContentSelection();
    onChange({
      ...value,
      teacherClassName: value.teacherClassName,
      sessionNumber: value.sessionNumber,
      contentType: 'CLASS_VIDEO',
    });
  };

  const updateClassVideoDetails = (details: { teacherClassName?: string; sessionNumber?: string }) => {
    onChange({
      subjectId: selectedSubject?.id,
      subjectName: selectedCourse?.name ?? selectedSubject?.name,
      subjectColor: selectedSubject?.color,
      contentType: 'CLASS_VIDEO',
      teacherClassName: details.teacherClassName ?? value.teacherClassName ?? '',
      sessionNumber: details.sessionNumber ?? value.sessionNumber ?? '',
      displayText: 'کلاس/ویدیو',
    });
  };

  const beginClassCurriculumLink = (nextFieldType: FieldType) => {
    const sourceName = value.subjectName ?? selectedSubject?.name ?? selectedCourse?.name;
    setLinkingClassVideo(true);
    if (sourceName) setSelectedCourseName(courseName(sourceName));
    setSelectedGrade(null);
    resetContentSelection();
    onFieldTypeChange?.(nextFieldType);
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
      contentType: value.contentType === 'CLASS_VIDEO' ? 'CLASS_VIDEO' : 'THEMATIC',
      teacherClassName: value.teacherClassName,
      sessionNumber: value.sessionNumber,
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

  if (!selectedSubject && !selectedCourseName) {
    if (courseGroups.length === 0) return (<div className="surface-1 rounded-xl p-6 text-center" dir="rtl"><BookOpen className="w-8 h-8 mx-auto text-[var(--foreground-subtle)] mb-2" /><p className="text-xs text-[var(--foreground-muted)]">درسی برای این حوزه و رشته یافت نشد</p></div>);
    return (
      <div className="space-y-2" dir="rtl">
        <div className="flex items-center gap-1.5 text-xs text-[var(--foreground-muted)] mb-2"><BookOpen className="w-3.5 h-3.5" /><span>درس را انتخاب کن<span className="text-[var(--foreground-subtle)] mr-1.5">({toPersianDigits(courseGroups.length)} درس)</span></span></div>
        <div className="grid grid-cols-2 gap-2">{courseGroups.map((group) => (<button key={group.name} onClick={() => handleSelectCourse(group)} className="btn-hover card-hover flex items-center gap-2 py-2.5 px-3 rounded-xl text-sm transition-all min-h-[48px] border text-right surface-1 text-[var(--foreground)] border-[var(--border)] hover:text-[var(--accent)]"><span className="text-base shrink-0">{group.icon || '📚'}</span><span className="truncate flex-1 font-medium">{group.name}</span></button>))}</div>
      </div>
    );
  }

  if (selectedCourse && (allowSubjectOnlySelection || !selectedSubject || linkingClassVideo) && !selectedGrade && (value.contentType !== 'CLASS_VIDEO' || linkingClassVideo)) {
    const thematicOptions = selectedCourse.books.flatMap((book) => (book.gradeSubject.topicModes ?? []).map((mode) => ({ book, mode })));
    return (
      <div className="space-y-3" dir="rtl">
        <div className="surface-1 rounded-xl p-3 flex items-center gap-2">
          {!linkingClassVideo && <button onClick={handleClearSubject} className="btn-hover icon-btn size-9 rounded-md border border-[var(--border)] text-[var(--foreground-muted)] flex items-center justify-center" aria-label="بازگشت به درس‌ها"><ArrowRight className="w-4 h-4" /></button>}
          <span className="text-xs text-[var(--foreground-muted)]">{selectedCourse.name}</span>
        </div>
        {allowSubjectOnlySelection && <div className="rounded-xl border border-[#E57373]/25 bg-[#E57373]/[0.06] px-3 py-2 text-[10px] leading-5 text-[var(--foreground-muted)]">درس انتخاب شد. انتخاب کتاب، فصل یا مبحث در ادامه اختیاری است.</div>}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs text-[var(--foreground-muted)]"><BookOpen className="w-3.5 h-3.5" /><span>کتاب را انتخاب کن</span></div>
          <div className="grid grid-cols-1 gap-2">{selectedCourse.books.map((book) => (
            <div key={`${book.subject.id}:${book.gradeSubject.id}`} className="flex min-h-12 items-center gap-3 rounded-xl border border-[var(--border)] surface-1 px-3 py-1.5">
              <span className="min-w-0 shrink-0 truncate text-sm font-medium text-[var(--foreground)]">{bookLabel(selectedCourse, book.gradeSubject.grade)}</span>
              <FieldTypeSegment
                konkur={book.gradeSubject.isKonkur}
                final={book.gradeSubject.isFinal}
                onPick={(nextFieldType) => handleSelectBookField(book, nextFieldType)}
                className="flex-1"
              />
            </div>
          ))}</div>
        </div>
        {thematicOptions.length > 0 && (
          <div className="space-y-2 border-t border-[var(--border)] pt-3">
            <div className="flex items-center gap-1.5 text-xs text-[var(--foreground-muted)]"><Layers className="w-3.5 h-3.5" /><span>خواندن مبحثی</span></div>
            <div className="space-y-2">{thematicOptions.map(({ book, mode }) => (
              <div key={mode.id} className="flex min-h-12 items-center gap-3 rounded-xl border border-[var(--border)] surface-1 p-3">
                <span className="min-w-0 shrink-0 text-right text-sm"><span className="block truncate">{mode.title}</span><span className="mt-1 block text-[10px] text-[var(--foreground-subtle)]">{bookLabel(selectedCourse, book.gradeSubject.grade)} · {toPersianDigits(mode.subtopics?.length ?? 0)} زیرمبحث</span></span>
                <FieldTypeSegment
                  konkur={book.gradeSubject.isKonkur}
                  final={book.gradeSubject.isFinal}
                  onPick={(nextFieldType) => handleSelectTopicField(mode, book, nextFieldType)}
                  className="flex-1"
                />
              </div>
            ))}</div>
          </div>
        )}
        {allowClassVideo && !linkingClassVideo && <button onClick={handleSelectClassVideo} className="btn-hover flex items-center gap-3 w-full rounded-xl border border-[var(--accent)]/30 bg-[var(--accent-soft)] p-3 text-right text-sm text-[var(--accent)]"><Video className="w-5 h-5 shrink-0" /><span><span className="block font-semibold">کلاس/ویدیو</span><span className="block mt-1 text-[10px] opacity-75">ثبت جلسه بدون انتخاب کتاب یا مبحث</span></span></button>}
      </div>
    );
  }

  if (!selectedSubject) {
    if (visibleSubjects.length === 0) return (<div className="surface-1 rounded-xl p-6 text-center" dir="rtl"><BookOpen className="w-8 h-8 mx-auto text-[var(--foreground-subtle)] mb-2" /><p className="text-xs text-[var(--foreground-muted)]">درسی برای این حوزه و رشته یافت نشد</p></div>);
    return (
      <div className="space-y-2" dir="rtl">
        <div className="flex items-center gap-1.5 text-xs text-[var(--foreground-muted)] mb-2"><BookOpen className="w-3.5 h-3.5" /><span>درس را انتخاب کن<span className="text-[var(--foreground-subtle)] mr-1.5">({toPersianDigits(visibleSubjects.length)} درس)</span></span></div>
        <div className="grid grid-cols-2 gap-2">{visibleSubjects.map((s) => { const isSelected = value.subjectId === s.id; return (<button key={s.id} onClick={() => handleSelectSubject(s)} className={`btn-hover card-hover flex items-center gap-2 py-2.5 px-3 rounded-xl text-sm transition-all min-h-[48px] border text-right ${isSelected ? 'bg-[var(--accent-soft)] text-[var(--accent)] border-[var(--accent)]/40' : 'surface-1 text-[var(--foreground)] border-[var(--border)] hover:text-[var(--accent)]'}`}><span className="text-base shrink-0">{s.icon || '📚'}</span><span className="truncate flex-1 font-medium">{s.name}</span></button>); })}</div>
      </div>
    );
  }

  if (value.contentType === 'CLASS_VIDEO' && !linkingClassVideo && !value.curriculumMode && !value.chapterId && !value.topicModeId) {
    return (
      <div className="space-y-3" dir="rtl">
        <div className="surface-1 rounded-xl p-3 flex items-center gap-2">
          <button onClick={handleBackFromClassVideo} className="btn-hover icon-btn size-9 rounded-md border border-[var(--border)] text-[var(--foreground-muted)] flex items-center justify-center" aria-label="بازگشت به گزینه‌های درس"><ArrowRight className="w-4 h-4" /></button>
          <div className="flex items-center gap-2 text-xs text-[var(--foreground-muted)]"><Video className="w-4 h-4 text-[var(--accent)]" />کلاس/ویدیو · {selectedCourse?.name ?? selectedSubject.name}</div>
        </div>
        <ClassSessionFields
          teacherClassName={value.teacherClassName ?? ''}
          sessionNumber={value.sessionNumber ?? ''}
          onTeacherClassNameChange={(teacherClassName) => updateClassVideoDetails({ teacherClassName })}
          onSessionNumberChange={(sessionNumber) => updateClassVideoDetails({ sessionNumber })}
          teacherSuggestions={teacherClassSuggestions}
          onTeacherSuggestionRemove={onTeacherSuggestionRemove}
        />
        {allowClassCurriculumLink && (fieldType === null ? (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-3">
            <p className="mb-2 text-xs font-semibold text-[var(--foreground)]">اتصال اختیاری به محتوای درسی</p>
            <p className="mb-3 text-[10px] text-[var(--foreground-muted)]">ابتدا حوزه را انتخاب کنید؛ سپس همه کتاب‌ها و مباحث آن حوزه نمایش داده می‌شوند.</p>
            <FieldTypeSegment
              konkur
              final
              onPick={beginClassCurriculumLink}
              className="w-full"
            />
          </div>
        ) : (
          <button type="button" onClick={handleLinkClassVideo} className="btn-hover w-full rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-3 text-right text-xs text-[var(--foreground)] hover:border-[var(--accent)]/40">
            <span className="block font-semibold">اتصال به کتاب یا مبحث {fieldType}</span>
            <span className="mt-1 block text-[10px] text-[var(--foreground-muted)]">همه پایه‌ها، فصل‌ها و مباحث معتبر قابل انتخاب هستند.</span>
          </button>
        ))}
      </div>
    );
  }

  if (!selectedGrade) {
    return (
      <div className="space-y-3" dir="rtl">
        <div className="surface-1 rounded-xl p-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0"><div className="w-9 h-9 rounded-lg flex items-center justify-center text-base shrink-0" style={{ backgroundColor: `${selectedSubject.color}22` }}>{selectedSubject.icon || '📚'}</div><div className="min-w-0"><p className="text-sm font-semibold text-[var(--foreground)] truncate">{selectedSubject.name}</p><p className="text-[10px] text-[var(--foreground-subtle)]">{grade} · {major}</p></div></div>
          <button onClick={handleClearSubject} className="btn-hover icon-btn text-xs px-3 h-9 rounded-md border border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--accent)] shrink-0">تغییر درس</button>
        </div>
        <p className="text-xs text-[var(--foreground-muted)]">پایه مورد نظر را انتخاب کنید</p>
        {availableGrades.length === 0 ? (<div className="surface-1 rounded-xl p-6 text-center text-xs text-[var(--foreground-muted)]">هیچ پایه‌ای برای این درس در این رشته یافت نشد</div>) : (<div className="flex flex-wrap gap-2">{availableGrades.map((g) => (<button key={g.grade} onClick={() => handleSelectGrade(g.grade)} className="btn-hover h-11 px-4 rounded-xl border border-[var(--border)] text-sm font-medium text-[var(--foreground)] hover:border-[var(--accent)]/40 hover:text-[var(--accent)]">{g.grade}</button>))}</div>)}
      </div>
    );
  }

  if (!curriculumMode && hasThematic) {
    return (
      <div className="space-y-3" dir="rtl">
        <div className="surface-1 rounded-xl p-3 flex items-center gap-2">
          <button onClick={handleBackFromGrade} className="btn-hover icon-btn size-9 rounded-md border border-[var(--border)] text-[var(--foreground-muted)] flex items-center justify-center"><ArrowRight className="w-4 h-4" /></button>
          <span className="text-xs text-[var(--foreground-muted)]">{selectedSubject.name} · {selectedGrade}</span>
        </div>
        <p className="text-xs text-[var(--foreground-muted)]">روش انتخاب محتوا را مشخص کنید</p>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => { setCurriculumMode('BOOK'); onChange({ subjectId: selectedSubject.id, subjectName: selectedSubject.name, subjectColor: selectedSubject.color, curriculumMode: 'BOOK' }); }} className="surface-1 rounded-xl border border-[var(--border)] p-4 text-sm font-medium hover:border-[var(--accent)]/40"><BookOpen className="w-5 h-5 mx-auto mb-2 text-[var(--accent)]" />کتابی</button>
          <button onClick={() => { setCurriculumMode('THEMATIC'); onChange({ subjectId: selectedSubject.id, subjectName: selectedSubject.name, subjectColor: selectedSubject.color, contentType: 'THEMATIC', curriculumMode: 'THEMATIC' }); }} className="surface-1 rounded-xl border border-[var(--border)] p-4 text-sm font-medium hover:border-[var(--accent)]/40"><Layers className="w-5 h-5 mx-auto mb-2 text-[var(--accent)]" />مبحثی</button>
        </div>
      </div>
    );
  }

  if (curriculumMode === 'THEMATIC') {
    const modes = gradeSubject?.topicModes ?? [];
    if (!selectedTopicMode) return (
      <div className="space-y-3" dir="rtl">
        <button onClick={handleBackFromThematic} className="text-xs text-[var(--foreground-muted)]">بازگشت به روش انتخاب</button>
        <p className="text-xs text-[var(--foreground-muted)]">مبحث اصلی را انتخاب کنید</p>
        <div className="space-y-2">{modes.map((mode) => <button key={mode.id} onClick={() => handleSelectTopicMode(mode)} className="w-full surface-1 border border-[var(--border)] rounded-xl p-3 text-right text-sm">{mode.title}<span className="block mt-1 text-[10px] text-[var(--foreground-subtle)]">{toPersianDigits(mode.subtopics?.length ?? 0)} زیرمبحث</span></button>)}</div>
      </div>
    );
    return (
      <div className="space-y-3" dir="rtl">
        <button onClick={handleBackFromSelectedTopicMode} className="text-xs text-[var(--foreground-muted)]">بازگشت به مباحث</button>
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
          <button onClick={handleBackFromGrade} className="btn-hover icon-btn size-9 rounded-md border border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] flex items-center justify-center" aria-label="بازگشت به پایه‌ها"><ArrowRight className="w-4 h-4" /></button>
          <div className="flex items-center gap-2 min-w-0"><span className="text-xs text-[var(--foreground-muted)]">{selectedSubject.name} · {selectedGrade}</span></div>
        </div>
        {chapters.length > 0 && (
          <div className="surface-1 rounded-xl p-3 space-y-2">
            <div className="flex items-center gap-1.5 text-xs text-[var(--foreground-muted)]"><Filter className="w-3.5 h-3.5" /><span>انتخاب بر اساس رنج صفحات</span></div>
            <div className="flex items-center gap-2">
              <div className="flex-1"><label className="text-[10px] text-[var(--foreground-subtle)] block mb-1">از صفحه</label><input type="text" inputMode="numeric" value={pageRangeStart} onChange={(e) => { const v = normalizeNumericInput(e.target.value); setPageRangeStart(v); handleChapterPageRangeChange(v, pageRangeEnd); }} placeholder="مثلاً ۱" className="w-full h-9 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] px-2.5 text-[var(--foreground)] text-sm focus:border-[var(--accent)] focus:outline-none transition-colors" dir="ltr" /></div>
              <div className="flex-1"><label className="text-[10px] text-[var(--foreground-subtle)] block mb-1">تا صفحه</label><input type="text" inputMode="numeric" value={pageRangeEnd} onChange={(e) => { const v = normalizeNumericInput(e.target.value); setPageRangeEnd(v); handleChapterPageRangeChange(pageRangeStart, v); }} placeholder="مثلاً ۵۰" className="w-full h-9 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] px-2.5 text-[var(--foreground)] text-sm focus:border-[var(--accent)] focus:outline-none transition-colors" dir="ltr" /></div>
            </div>
        {pageRangeStart && pageRangeEnd && parseInt(pageRangeStart) > 0 && parseInt(pageRangeEnd) > 0 && parseInt(pageRangeStart) <= parseInt(pageRangeEnd) && (<p className="text-[10px] text-[var(--accent)]">رنج صفحات وارد شد — فصل‌ها و گفتارهای مربوطه خودکار انتخاب می‌شوند</p>)}
          </div>
        )}
        <p className="text-xs text-[var(--foreground-muted)]">یا فصل رو دستی انتخاب کن:</p>
        {chapters.length === 0 ? (<div className="surface-1 rounded-xl p-6 text-center text-xs text-[var(--foreground-muted)]">فصلی برای این پایه ثبت نشده</div>) : (
          <div className="space-y-1.5">{chapters.map((ch) => {
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
          <button onClick={handleBackFromChapter} className="btn-hover icon-btn size-9 rounded-md border border-[var(--border)] text-[var(--foreground-muted)] flex items-center justify-center" aria-label="بازگشت به فصل‌ها"><ArrowRight className="w-4 h-4" /></button>
          <span className="text-xs text-[var(--foreground-muted)] truncate">{selectedSubject.name} · {selectedGrade} · فصل {toPersianDigits(selectedChapter.chapterNo)}: {bareTitle(selectedChapter.title)}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3" dir="rtl">
      <div className="surface-1 rounded-xl p-3 flex items-center gap-2">
        <button onClick={handleBackFromChapter} className="btn-hover icon-btn size-9 rounded-md border border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] flex items-center justify-center" aria-label="بازگشت به فصل‌ها"><ArrowRight className="w-4 h-4" /></button>
        <div className="flex items-center gap-2 min-w-0 flex-1"><span className="text-xs text-[var(--foreground-muted)] truncate">{selectedSubject.name} · {selectedGrade} · فصل {toPersianDigits(selectedChapter.chapterNo)}: {bareTitle(selectedChapter.title)}</span></div>
        {selectedTopicIds.length > 0 && (<span className="text-[10px] px-2 py-1 rounded-md bg-[var(--accent-soft)] text-[var(--accent)] font-semibold shrink-0">{toPersianDigits(selectedTopicIds.length)} گفتار</span>)}
      </div>
      <div className="surface-1 rounded-xl p-3 space-y-2">
        <div className="flex items-center gap-1.5 text-xs text-[var(--foreground-muted)]"><Filter className="w-3.5 h-3.5" /><span>انتخاب بر اساس رنج صفحات</span></div>
        <div className="flex items-center gap-2">
          <div className="flex-1"><label className="text-[10px] text-[var(--foreground-subtle)] block mb-1">از صفحه</label><input type="text" inputMode="numeric" value={pageRangeStart} onChange={(e) => { const v = normalizeNumericInput(e.target.value); setPageRangeStart(v); handleChapterPageRangeChange(v, pageRangeEnd); }} placeholder="مثلاً ۱" className="w-full h-9 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] px-2.5 text-[var(--foreground)] text-sm focus:border-[var(--accent)] focus:outline-none transition-colors" dir="ltr" /></div>
          <div className="flex-1"><label className="text-[10px] text-[var(--foreground-subtle)] block mb-1">تا صفحه</label><input type="text" inputMode="numeric" value={pageRangeEnd} onChange={(e) => { const v = normalizeNumericInput(e.target.value); setPageRangeEnd(v); handleChapterPageRangeChange(pageRangeStart, v); }} placeholder="مثلاً ۵۰" className="w-full h-9 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] px-2.5 text-[var(--foreground)] text-sm focus:border-[var(--accent)] focus:outline-none transition-colors" dir="ltr" /></div>
        </div>
        {pageRangeStart && pageRangeEnd && parseInt(pageRangeStart) > 0 && parseInt(pageRangeEnd) > 0 && parseInt(pageRangeStart) <= parseInt(pageRangeEnd) && (<p className="text-[10px] text-[var(--accent)]">رنج صفحات وارد شد — گفتارهای مربوطه خودکار انتخاب می‌شوند</p>)}
      </div>
      {pageRangeStart && pageRangeEnd && (
        <div className="flex items-center gap-2 text-[10px] text-[var(--accent)] bg-[var(--accent-soft)] rounded-lg px-3 py-2"><Filter className="w-3 h-3" /><span>صفحات {toPersianDigits(pageRangeStart)} تا {toPersianDigits(pageRangeEnd)}</span>{selectedTopicIds.length > 0 && (<span>— {toPersianDigits(selectedTopicIds.length)} گفتار انتخاب‌شده</span>)}</div>
      )}
      {topics.length > 0 && (
        <div className="flex items-center gap-2">
          <button onClick={handleSelectAllTopics} className="text-xs px-2.5 h-7 rounded-md border border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--accent)] hover:border-[var(--accent)]/40 transition-colors">انتخاب همه</button>
          {selectedTopicIds.length > 0 && (<button onClick={handleClearAllTopics} className="text-xs px-2.5 h-7 rounded-md border border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--danger)] hover:border-[var(--danger)]/40 transition-colors flex items-center gap-1"><X className="w-3 h-3" />پاک کردن انتخاب‌ها</button>)}
        </div>
      )}
      <div className="space-y-1.5">{topics.map((tp) => { const isSelected = selectedTopicIds.includes(tp.id); return (<button key={tp.id} onClick={() => handleToggleTopic(tp)} className={`btn-hover w-full text-right p-3 rounded-lg border flex items-center gap-3 transition-all ${isSelected ? 'bg-[var(--accent-soft)] border-[var(--accent)]/40 text-[var(--accent)]' : 'border-[var(--border)] surface-1 text-[var(--foreground)]'}`}><span className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 text-[10px] font-bold transition-all ${isSelected ? 'bg-[var(--accent)] text-[var(--bg-deep)]' : 'bg-[var(--bg-elevated)] text-[var(--foreground-muted)]'}`}>{isSelected ? <CheckCircle2 className="w-3.5 h-3.5" /> : toPersianDigits(tp.topicNo)}</span><span className="flex-1 text-sm font-medium truncate">{tp.title}</span><span className="text-[10px] text-[var(--foreground-subtle)] shrink-0">{formatPageRange(tp)}</span></button>); })}</div>
    </div>
  );
}
