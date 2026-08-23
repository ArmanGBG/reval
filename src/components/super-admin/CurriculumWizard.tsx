'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  ArrowLeft,
  Loader2,
  BookOpen,
  Plus,
  Trash2,
  Save,
  Check,
  GraduationCap,
  Layers,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Subject, Chapter } from '@/lib/subjects-types';

// ============================================================
// Persian digits helper
// ============================================================
function toPersianDigits(num: number | string | null | undefined): string {
  if (num === null || num === undefined) return '';
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
const GRADES = ['دهم', 'یازدهم', 'دوازدهم'] as const;
const MAJORS = ['تجربی', 'انسانی', 'ریاضی'] as const;
type Grade = (typeof GRADES)[number];
type Major = (typeof MAJORS)[number];

interface ChapterRow {
  clientId: string; // stable React key for new (unsaved) rows
  id?: string; // DB id once saved
  chapterNo: number;
  title: string;
  pageStart: string; // string for input binding, parsed on save
  pageEnd: string;
  dirty: boolean; // has unsaved changes
  saving: boolean;
  saved: boolean; // recently saved (for visual feedback)
}

interface TopicRow {
  clientId: string; // stable React key for new (unsaved) rows
  id?: string; // DB id once saved
  topicNo: number;
  title: string;
  pageStart: string;
  pageEnd: string;
  dirty: boolean;
  saving: boolean;
  saved: boolean;
}

interface CurriculumWizardProps {
  subjectId: string;
  /** Pre-select grade & jump to chapters on mount (from grade completion overview) */
  initialGrade?: Grade;
  initialMajor?: Major;
  onRefresh?: () => void | Promise<void>;
}

const STEPS = [
  { n: 1, label: 'پایه' },
  { n: 2, label: 'رشته' },
  { n: 4, label: 'فصول' },
  { n: 5, label: 'گفتارها' },
];

// ============================================================
// Main Component
// ============================================================
export function CurriculumWizard({ subjectId, initialGrade, initialMajor, onRefresh }: CurriculumWizardProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(
    initialGrade && initialMajor ? 4 : 1,
  );
  const [grade, setGrade] = useState<Grade | null>(initialGrade || null);
  const [major, setMajor] = useState<Major | null>(initialMajor || null);

  // Subjects list (step 3)
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [subjectsError, setSubjectsError] = useState<string | null>(null);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [creatingSubject, setCreatingSubject] = useState(false);

  // Currently selected subject (the one we're configuring chapters for)
  // Defaults to the prop subjectId (SubjectDetail passes the subject we're viewing).
  const [activeSubjectId, setActiveSubjectId] = useState<string>(subjectId);

  // GradeSubject (the grade+major pivot for the active subject)
  const [gradeSubjectId, setGradeSubjectId] = useState<string | null>(null);
  const [gradeSubjectLoading, setGradeSubjectLoading] = useState(false);

  // Chapters (step 4)
  const [chapters, setChapters] = useState<ChapterRow[]>([]);
  const [chaptersLoading, setChaptersLoading] = useState(false);
  const [chaptersError, setChaptersError] = useState<string | null>(null);
  const [expandedChapterIdx, setExpandedChapterIdx] = useState<string | null>(null);

  // Unsaved-changes guard (bug 13)
  const [showUnsavedDialog, setShowUnsavedDialog] = useState<null | (() => void)>(null);

  // Topics per chapter (step 5)
  const [topicsByChapter, setTopicsByChapter] = useState<Record<string, TopicRow[]>>({});

  // Track existing topics loaded from server to skip re-fetching
  const loadedTopicsForChapter = useRef<Set<string>>(new Set());

  // ============================================================
  // Unsaved changes detection + guarded navigation (bug 13)
  // ============================================================
  const hasUnsavedChanges = useMemo(() => {
    // Any chapter row with dirty=true or saving=true
    if (chapters.some((c) => c.dirty || c.saving)) return true;
    // Any topic row with dirty=true or saving=true
    for (const chId of Object.keys(topicsByChapter)) {
      if (topicsByChapter[chId].some((t) => t.dirty || t.saving)) return true;
    }
    return false;
  }, [chapters, topicsByChapter]);

  // Wrap a navigation/action with an unsaved-changes guard.
  // If there are unsaved changes, shows a confirm dialog; otherwise runs immediately.
  const guardedAction = useCallback(
    (action: () => void) => {
      if (hasUnsavedChanges) {
        setShowUnsavedDialog(() => action);
      } else {
        action();
      }
    },
    [hasUnsavedChanges],
  );

  // ============================================================
  // Fetch subjects list (for step 3)
  // ============================================================
  const fetchSubjects = useCallback(async (): Promise<Subject[]> => {
    setSubjectsLoading(true);
    setSubjectsError(null);
    try {
      const res = await fetch('/api/subjects?include=tree');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطا در بارگذاری دروس');
      const fetchedSubjects = data.subjects || [];
      setSubjects(fetchedSubjects);
      return fetchedSubjects;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'خطا در بارگذاری دروس';
      setSubjectsError(msg);
      return [];
    } finally {
      setSubjectsLoading(false);
    }
  }, []);

  // ============================================================
  // Helpers: find existing GradeSubject for grade+major+subject
  // ============================================================
  const findExistingGradeSubject = useCallback(
    (subjId: string, g: Grade, m: Major): string | null => {
      const subj = subjects.find((s) => s.id === subjId);
      if (!subj || !subj.grades) return null;
      const match = subj.grades.find(
        (gs) => gs.grade === g && gs.major === m && gs.isActive,
      );
      return match?.id || null;
    },
    [subjects],
  );

  // ============================================================
  // Step 3 → Step 4 transition: ensure GradeSubject exists
  // ============================================================
  const ensureGradeSubject = useCallback(
    async (subjId: string, g: Grade, m: Major): Promise<string | null> => {
      // First, check if it already exists locally
      const existingId = findExistingGradeSubject(subjId, g, m);
      if (existingId) return existingId;

      // Otherwise, POST to create it
      setGradeSubjectLoading(true);
      try {
        const res = await fetch(`/api/subjects/${subjId}/grades`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ grade: g, major: m, isKonkur: true, isFinal: true }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'خطا در ایجاد پایه برای درس');
        await onRefresh?.();
        return data.gradeSubject.id as string;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'خطا در ایجاد پایه برای درس';
        toast.error(msg);
        return null;
      } finally {
        setGradeSubjectLoading(false);
      }
    },
    [findExistingGradeSubject, onRefresh],
  );

  // ============================================================
  // Fetch existing chapters for a gradeSubject (step 4)
  // ============================================================
  const fetchChapters = useCallback(
    async (gsId: string) => {
      setChaptersLoading(true);
      setChaptersError(null);
      try {
        const res = await fetch(
          `/api/subjects/${activeSubjectId}/chapters?gradeSubjectId=${gsId}`,
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'خطا در بارگذاری فصول');
        const fetched: Chapter[] = data.chapters || [];
        setChapters(
          fetched.map((c) => ({
            clientId: c.id, // use DB id as clientId for saved rows
            id: c.id,
            chapterNo: c.chapterNo,
            title: c.title,
            pageStart: c.pageStart != null ? String(c.pageStart) : '',
            pageEnd: c.pageEnd != null ? String(c.pageEnd) : '',
            dirty: false,
            saving: false,
            saved: false,
          })),
        );
        // Pre-load topics for each chapter so step 5 is ready
        fetched.forEach((c) => {
          if (c.topics && c.topics.length > 0) {
            setTopicsByChapter((prev) => ({
              ...prev,
              [c.id]: c.topics!.map((t) => ({
                clientId: t.id,
                id: t.id,
                topicNo: t.topicNo,
                title: t.title,
                pageStart: t.pageStart != null ? String(t.pageStart) : '',
                pageEnd: t.pageEnd != null ? String(t.pageEnd) : '',
                dirty: false,
                saving: false,
                saved: false,
              })),
            }));
            loadedTopicsForChapter.current.add(c.id);
          }
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'خطا در بارگذاری فصول';
        setChaptersError(msg);
      } finally {
        setChaptersLoading(false);
      }
    },
    [activeSubjectId],
  );

  // ============================================================
  // Handlers: subject selection
  // ============================================================
  const handleSelectSubject = async (subjId: string, subjectList = subjects) => {
    setActiveSubjectId(subjId);
    setGradeSubjectId(null);
    setChapters([]);
    setTopicsByChapter({});
    loadedTopicsForChapter.current.clear();

    const subject = subjectList.find((item) => item.id === subjId);
    const existingId = subject?.grades?.find(
      (gs) => gs.grade === grade && gs.major === major && gs.isActive,
    )?.id || null;
    if (existingId) {
      // Existing gradeSubject — go straight to step 4 and load chapters
      setGradeSubjectId(existingId);
      setStep(4);
    } else {
      // New gradeSubject — go to step 4 (will create on first save)
      setStep(4);
    }
  };

  const handleCreateNewSubject = async () => {
    if (!newSubjectName.trim()) {
      toast.error('نام درس الزامی است');
      return;
    }
    setCreatingSubject(true);
    try {
      const res = await fetch('/api/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newSubjectName.trim(),
          color: '#5E6AD2',
          icon: '📚',
          sortOrder: 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطا در ایجاد درس');
      toast.success(`درس «${data.subject.name}» ایجاد شد`);
      // Refresh subjects list and select the new one
      const refreshedSubjects = await fetchSubjects();
      setNewSubjectName('');
      handleSelectSubject(data.subject.id, refreshedSubjects);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'خطا در ایجاد درس';
      toast.error(msg);
    } finally {
      setCreatingSubject(false);
    }
  };

  // ============================================================
  // Auto-advance from initialGrade + initialMajor (grade completion overview click)
  // We need to fetch subjects first so findExistingGradeSubject works,
  // then the step-4 useEffect will handle the rest.
  // ============================================================
  useEffect(() => {
    if (!initialGrade || !initialMajor) return;
    // Only run once on mount
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/subjects?include=tree');
        const data = await res.json();
        if (!res.ok || cancelled) return;
        setSubjects(data.subjects || []);
        // Find the existing GradeSubject in the fetched data
        const subj = (data.subjects || []).find((s: Subject) => s.id === subjectId);
        const existingGs = subj?.grades?.find(
          (gs: { grade: string; major: string; isActive: boolean }) =>
            gs.grade === initialGrade && gs.major === initialMajor && gs.isActive,
        );
        if (existingGs && !cancelled) {
          setGradeSubjectId(existingGs.id);
        }
      } catch {
        // Silently fail — the step-4 useEffect will retry via ensureGradeSubject
      }
    })();
    return () => { cancelled = true; };
  }, []); // run once on mount

  // ============================================================
  // Step 4 mount: ensure gradeSubject + load chapters
  // ============================================================
  useEffect(() => {
    if (step === 4 && activeSubjectId && grade && major) {
      if (!gradeSubjectId) {
        // Need to create the gradeSubject
        ensureGradeSubject(activeSubjectId, grade, major).then((gsId) => {
          if (gsId) {
            setGradeSubjectId(gsId);
            fetchChapters(gsId);
          } else {
            // Failed — return to major selection so the user can retry.
            setStep(2);
          }
        });
      } else if (chapters.length === 0 && !chaptersLoading) {
        fetchChapters(gradeSubjectId);
      }
    }
  }, [step, activeSubjectId, grade, major, gradeSubjectId]);

  // ============================================================
  // Chapter row operations (step 4)
  // ============================================================
  const addChapterRow = () => {
    const nextNo = chapters.length === 0
      ? 1
      : Math.max(...chapters.map((c) => c.chapterNo)) + 1;
    setChapters((prev) => [
      ...prev,
      {
        clientId: crypto.randomUUID(), // stable key for new rows (bug 14)
        chapterNo: nextNo,
        title: '',
        pageStart: '',
        pageEnd: '',
        dirty: false,
        saving: false,
        saved: false,
      },
    ]);
    // Focus the new row's title input on next tick
    setTimeout(() => {
      const inputs = document.querySelectorAll<HTMLInputElement>(
        `input[data-chapter-title-idx="${chapters.length}"]`,
      );
      inputs[0]?.focus();
    }, 50);
  };

  const updateChapterRow = (idx: number, patch: Partial<ChapterRow>) => {
    setChapters((prev) =>
      prev.map((c, i) => (i === idx ? { ...c, ...patch, dirty: true, saved: false } : c)),
    );
  };

  const handleChapterTitleKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Add new row if this is the last row
      if (idx === chapters.length - 1) {
        addChapterRow();
      } else {
        // Focus next row's title
        const inputs = document.querySelectorAll<HTMLInputElement>(
          `input[data-chapter-title-idx="${idx + 1}"]`,
        );
        inputs[0]?.focus();
      }
    }
  };

  const saveChapterRow = async (idx: number) => {
    const row = chapters[idx];
    if (!row || !gradeSubjectId) return;
    if (!row.title.trim()) {
      toast.error('عنوان فصل الزامی است');
      return;
    }
    if (!Number.isInteger(row.chapterNo) || row.chapterNo < 0) {
      toast.error('شماره فصل باید عدد صحیح نامنفی باشد');
      return;
    }
    if (Boolean(row.pageStart) !== Boolean(row.pageEnd)) {
      toast.error('صفحه شروع و پایان باید هر دو وارد شوند یا هر دو خالی باشند');
      return;
    }
    if (row.pageStart && Number(row.pageStart) > Number(row.pageEnd)) {
      toast.error('صفحه پایان باید بزرگ‌تر یا مساوی صفحه شروع باشد');
      return;
    }
    if ((row.pageStart && (!Number.isInteger(Number(row.pageStart)) || Number(row.pageStart) < 1)) ||
        (row.pageEnd && (!Number.isInteger(Number(row.pageEnd)) || Number(row.pageEnd) < 1))) {
      toast.error('شماره صفحات باید عدد صحیح مثبت باشند');
      return;
    }

    setChapters((prev) => prev.map((c, i) => (i === idx ? { ...c, saving: true } : c)));

    try {
      const payload = {
        gradeSubjectId,
        title: row.title.trim(),
        chapterNo: row.chapterNo,
        pageStart: row.pageStart ? Number(row.pageStart) : null,
        pageEnd: row.pageEnd ? Number(row.pageEnd) : null,
      };

      let res: Response;
      if (row.id) {
        // PATCH
        res = await fetch(
          `/api/subjects/${activeSubjectId}/chapters/${row.id}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          },
        );
      } else {
        // POST
        res = await fetch(`/api/subjects/${activeSubjectId}/chapters`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطا در ذخیره فصل');

      setChapters((prev) =>
        prev.map((c, i) =>
          i === idx
            ? {
                ...c,
                id: data.chapter.id,
                saving: false,
                dirty: false,
                saved: true,
              }
            : c,
        ),
      );
      // Clear "saved" badge after 1.5s
      setTimeout(() => {
        setChapters((prev) =>
          prev.map((c, i) => (i === idx ? { ...c, saved: false } : c)),
        );
      }, 1500);
      await onRefresh?.();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'خطا در ذخیره فصل';
      toast.error(msg);
      setChapters((prev) => prev.map((c, i) => (i === idx ? { ...c, saving: false } : c)));
    }
  };

  const deleteChapterRow = async (idx: number) => {
    const row = chapters[idx];
    if (!row) return;
    if (row.id) {
      if (!confirm(`فصل «${row.title || `شماره ${toPersianDigits(row.chapterNo)}`}» حذف شود؟`)) return;
      try {
        const res = await fetch(
          `/api/subjects/${activeSubjectId}/chapters/${row.id}`,
          { method: 'DELETE' },
        );
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'خطا در حذف فصل');
        }
        toast.success('فصل حذف شد');
        await onRefresh?.();
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'خطا در حذف فصل';
        toast.error(msg);
        return;
      }
    }
    setChapters((prev) => prev.filter((_, i) => i !== idx));
    if (row.id) {
      setTopicsByChapter((prev) => {
        const next = { ...prev };
        delete next[row.id!];
        return next;
      });
      loadedTopicsForChapter.current.delete(row.id);
    }
  };

  // ============================================================
  // Topic row operations (step 5)
  // ============================================================
  const ensureTopicsLoaded = (chapterId: string) => {
    if (loadedTopicsForChapter.current.has(chapterId)) return;
    loadedTopicsForChapter.current.add(chapterId);
    // If no topics were preloaded in fetchChapters, start with empty list
    if (!topicsByChapter[chapterId]) {
      setTopicsByChapter((prev) => ({ ...prev, [chapterId]: [] }));
    }
  };

  const addTopicRow = (chapterId: string) => {
    ensureTopicsLoaded(chapterId);
    setTopicsByChapter((prev) => {
      const list = prev[chapterId] || [];
      const nextNo = list.length === 0
        ? 1
        : Math.max(...list.map((t) => t.topicNo)) + 1;
      return {
        ...prev,
        [chapterId]: [
          ...list,
          {
            clientId: crypto.randomUUID(), // stable key for new rows (bug 14)
            topicNo: nextNo,
            title: '',
            pageStart: '',
            pageEnd: '',
            dirty: false,
            saving: false,
            saved: false,
          },
        ],
      };
    });
    // Focus new row's title
    setTimeout(() => {
      const inputs = document.querySelectorAll<HTMLInputElement>(
        `input[data-topic-title-chapter="${chapterId}"][data-topic-title-idx="${(topicsByChapter[chapterId] || []).length}"]`,
      );
      inputs[0]?.focus();
    }, 50);
  };

  const updateTopicRow = (chapterId: string, idx: number, patch: Partial<TopicRow>) => {
    setTopicsByChapter((prev) => {
      const list = prev[chapterId] || [];
      return {
        ...prev,
        [chapterId]: list.map((t, i) =>
          i === idx ? { ...t, ...patch, dirty: true, saved: false } : t,
        ),
      };
    });
  };

  const handleTopicTitleKeyDown = (
    chapterId: string,
    idx: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const list = topicsByChapter[chapterId] || [];
      if (idx === list.length - 1) {
        addTopicRow(chapterId);
      } else {
        const inputs = document.querySelectorAll<HTMLInputElement>(
          `input[data-topic-title-chapter="${chapterId}"][data-topic-title-idx="${idx + 1}"]`,
        );
        inputs[0]?.focus();
      }
    }
  };

  const saveTopicRow = async (chapterId: string, idx: number) => {
    const list = topicsByChapter[chapterId] || [];
    const row = list[idx];
    if (!row) return;
    if (!row.title.trim()) {
      toast.error('عنوان گفتار الزامی است');
      return;
    }
    if (!Number.isInteger(row.topicNo) || row.topicNo < 0) {
      toast.error('شماره گفتار باید عدد صحیح نامنفی باشد');
      return;
    }
    if (Boolean(row.pageStart) !== Boolean(row.pageEnd)) {
      toast.error('صفحه شروع و پایان باید هر دو وارد شوند یا هر دو خالی باشند');
      return;
    }
    if (row.pageStart && Number(row.pageStart) > Number(row.pageEnd)) {
      toast.error('صفحه پایان باید بزرگ‌تر یا مساوی صفحه شروع باشد');
      return;
    }
    if ((row.pageStart && (!Number.isInteger(Number(row.pageStart)) || Number(row.pageStart) < 1)) ||
        (row.pageEnd && (!Number.isInteger(Number(row.pageEnd)) || Number(row.pageEnd) < 1))) {
      toast.error('شماره صفحات باید عدد صحیح مثبت باشند');
      return;
    }

    setTopicsByChapter((prev) => ({
      ...prev,
      [chapterId]: (prev[chapterId] || []).map((t, i) =>
        i === idx ? { ...t, saving: true } : t,
      ),
    }));

    try {
      const payload = {
        title: row.title.trim(),
        topicNo: row.topicNo,
        pageStart: row.pageStart ? Number(row.pageStart) : null,
        pageEnd: row.pageEnd ? Number(row.pageEnd) : null,
      };

      let res: Response;
      if (row.id) {
        res = await fetch(
          `/api/subjects/${activeSubjectId}/chapters/${chapterId}/topics/${row.id}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          },
        );
      } else {
        res = await fetch(
          `/api/subjects/${activeSubjectId}/chapters/${chapterId}/topics`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          },
        );
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطا در ذخیره گفتار');

      setTopicsByChapter((prev) => ({
        ...prev,
        [chapterId]: (prev[chapterId] || []).map((t, i) =>
          i === idx
            ? {
                ...t,
                id: data.topic.id,
                saving: false,
                dirty: false,
                saved: true,
              }
            : t,
        ),
      }));
      setTimeout(() => {
        setTopicsByChapter((prev) => ({
          ...prev,
          [chapterId]: (prev[chapterId] || []).map((t, i) =>
            i === idx ? { ...t, saved: false } : t,
          ),
        }));
      }, 1500);
      await onRefresh?.();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'خطا در ذخیره گفتار';
      toast.error(msg);
      setTopicsByChapter((prev) => ({
        ...prev,
        [chapterId]: (prev[chapterId] || []).map((t, i) =>
          i === idx ? { ...t, saving: false } : t,
        ),
      }));
    }
  };

  const deleteTopicRow = async (chapterId: string, idx: number) => {
    const list = topicsByChapter[chapterId] || [];
    const row = list[idx];
    if (!row) return;
    if (row.id) {
      if (!confirm(`گفتار «${row.title || toPersianDigits(row.topicNo)}» حذف شود؟`)) return;
      try {
        const res = await fetch(
          `/api/subjects/${activeSubjectId}/chapters/${chapterId}/topics/${row.id}`,
          { method: 'DELETE' },
        );
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'خطا در حذف گفتار');
        }
        toast.success('گفتار حذف شد');
        await onRefresh?.();
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'خطا در حذف گفتار';
        toast.error(msg);
        return;
      }
    }
    setTopicsByChapter((prev) => ({
      ...prev,
      [chapterId]: (prev[chapterId] || []).filter((_, i) => i !== idx),
    }));
  };

  // ============================================================
  // Active subject object (for display)
  // ============================================================
  const activeSubject = useMemo(
    () => subjects.find((s) => s.id === activeSubjectId),
    [subjects, activeSubjectId],
  );

  // ============================================================
  // Step indicator (top breadcrumb)
  // ============================================================
  const renderStepIndicator = () => (
    <div className="surface-1 rounded-2xl p-3">
      <div className="flex items-center justify-between gap-1">
        {STEPS.map((s, i) => {
          const isActive = step === s.n;
          const isDone = step > s.n;
          return (
            <div key={s.n} className="flex items-center gap-1 flex-1">
              <button
                onClick={() => {
                  // Allow going back to completed steps (with unsaved-changes guard)
                  if (s.n < step) {
                    if (s.n === 1 || s.n === 2) {
                      guardedAction(() => setStep(s.n as 1 | 2 | 3 | 4 | 5));
                    }
                  }
                }}
                disabled={s.n > step}
                className={`flex items-center gap-1.5 px-2 h-8 rounded-lg text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-[var(--gold)] text-white'
                    : isDone
                      ? 'bg-[var(--gold-soft)] text-[var(--gold)] border border-[var(--gold)]/30 cursor-pointer'
                      : 'text-[var(--foreground-subtle)] cursor-not-allowed'
                }`}
              >
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px]">
                  {isDone ? <Check className="w-3 h-3" /> : toPersianDigits(s.n)}
                </span>
                <span className="hidden sm:inline">{s.label}</span>
              </button>
              {i < STEPS.length - 1 && (
                <div className={`h-px flex-1 ${isDone ? 'bg-[var(--gold)]/40' : 'bg-[var(--border)]'}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  // ============================================================
  // Breadcrumb (selected subject+grade+major)
  // ============================================================
  const renderBreadcrumb = () => {
    if (step < 3) return null;
    return (
      <div className="flex items-center gap-2 text-xs text-[var(--foreground-muted)] flex-wrap">
        {activeSubject && (
          <span className="flex items-center gap-1.5 px-2 h-7 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)]">
            <span className="text-base">{activeSubject.icon || '📚'}</span>
            <span className="text-[var(--foreground)] font-medium">{activeSubject.name}</span>
          </span>
        )}
        {grade && (
          <span className="flex items-center gap-1.5 px-2 h-7 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)]">
            <GraduationCap className="w-3 h-3 text-[var(--gold)]" />
            <span className="text-[var(--foreground)] font-medium">{grade}</span>
          </span>
        )}
        {major && (
          <span className="flex items-center gap-1.5 px-2 h-7 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)]">
            <span className="text-[var(--foreground)] font-medium">{major}</span>
          </span>
        )}
      </div>
    );
  };

  // ============================================================
  // Render
  // ============================================================
  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="surface-1 rounded-2xl p-4 flex items-center gap-3">
        <Layers className="w-5 h-5 text-[var(--gold)]" />
        <div>
          <h2 className="text-base font-bold text-[var(--foreground)]">تعریف ساختار کتاب</h2>
          <p className="text-xs text-[var(--foreground-muted)] mt-0.5">
            {activeSubject?.name || 'درس'} ← پایه ← رشته ← فصول ← گفتارها
          </p>
        </div>
      </div>

      {renderStepIndicator()}
      {renderBreadcrumb()}

      {/* Step content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {/* ===== Step 1: Grade ===== */}
          {step === 1 && (
            <div className="surface-1 rounded-2xl p-6">
              <div className="mb-4">
                <h3 className="text-sm font-bold text-[var(--foreground)] mb-1">انتخاب پایه</h3>
                <p className="text-xs text-[var(--foreground-muted)]">پایه‌ای که می‌خواهید ساختار آن را تعریف کنید</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {GRADES.map((g) => (
                  <button
                    key={g}
                    onClick={() => {
                      setGrade(g);
                      setStep(2);
                    }}
                    className={`btn-hover glow-hover-gold h-16 rounded-2xl border-2 text-lg font-bold flex items-center justify-center gap-2 transition-all ${
                      grade === g
                        ? 'bg-[var(--gold-soft)] border-[var(--gold)] text-[var(--gold)]'
                        : 'bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--foreground)] hover:border-[var(--gold)]/40'
                    }`}
                  >
                    <GraduationCap className="w-5 h-5" />
                    {g}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ===== Step 2: Major ===== */}
          {step === 2 && (
            <div className="surface-1 rounded-2xl p-6">
              <div className="mb-4">
                <h3 className="text-sm font-bold text-[var(--foreground)] mb-1">انتخاب رشته</h3>
                <p className="text-xs text-[var(--foreground-muted)]">رشته‌ای که این پایه برای آن تعریف می‌شود</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {MAJORS.map((m) => (
                  <button
                    key={m}
                    onClick={async () => {
                      setMajor(m);
                      const subjectList = await fetchSubjects();
                      await handleSelectSubject(subjectId, subjectList);
                    }}
                    className={`btn-hover glow-hover-gold h-16 rounded-2xl border-2 text-lg font-bold flex items-center justify-center gap-2 transition-all ${
                      major === m
                        ? 'bg-[var(--gold-soft)] border-[var(--gold)] text-[var(--gold)]'
                        : 'bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--foreground)] hover:border-[var(--gold)]/40'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
              <div className="mt-4 flex justify-start">
                <button
                  onClick={() => setStep(1)}
                  className="btn-hover h-10 px-4 rounded-lg border border-[var(--border)] text-[var(--foreground-muted)] text-sm flex items-center gap-2"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  بازگشت
                </button>
              </div>
            </div>
          )}

          {/* ===== Step 3: Subject ===== */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="surface-1 rounded-2xl p-4">
                <h3 className="text-sm font-bold text-[var(--foreground)] mb-1">انتخاب درس</h3>
                <p className="text-xs text-[var(--foreground-muted)]">
                  درسی که ساختار فصول آن را برای پایه {grade} رشته {major} تعریف می‌کنید
                </p>
              </div>

              {subjectsLoading ? (
                <div className="surface-1 rounded-2xl p-12 text-center">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-[var(--gold)] mb-2" />
                  <p className="text-xs text-[var(--foreground-muted)]">در حال بارگذاری دروس...</p>
                </div>
              ) : subjectsError ? (
                <div className="surface-1 rounded-2xl p-12 text-center">
                  <AlertCircle className="w-10 h-10 mx-auto text-[var(--danger)] mb-2" />
                  <p className="text-xs text-[var(--foreground)] mb-3">{subjectsError}</p>
                  <button
                    onClick={fetchSubjects}
                    className="btn-hover h-10 px-4 rounded-lg border border-[var(--border-strong)] text-[var(--foreground)] text-sm font-medium inline-flex items-center gap-2"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    تلاش مجدد
                  </button>
                </div>
              ) : subjects.length === 0 ? (
                <div className="surface-1 rounded-2xl p-12 text-center">
                  <BookOpen className="w-10 h-10 mx-auto text-[var(--foreground-subtle)] mb-2" />
                  <p className="text-xs text-[var(--foreground-muted)]">هنوز درسی ثبت نشده است</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {subjects.map((s) => {
                    const existingGsId = findExistingGradeSubject(s.id, grade!, major!);
                    const isAlreadyDefined = !!existingGsId;
                    const isActive = activeSubjectId === s.id;
                    return (
                      <button
                        key={s.id}
                        onClick={() => handleSelectSubject(s.id)}
                        className={`surface-1 edge-highlight rounded-2xl p-4 card-hover text-right w-full transition-all ${
                          isActive ? 'ring-2 ring-[var(--gold)]/40' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 ring-1 ring-inset ring-white/10"
                              style={{ backgroundColor: `${s.color}20`, color: s.color }}
                            >
                              {s.icon || <BookOpen className="w-5 h-5" />}
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-sm font-bold text-[var(--foreground)] truncate">{s.name}</h4>
                            </div>
                          </div>
                          {isAlreadyDefined && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-[var(--gold-soft)] text-[var(--gold)] border border-[var(--gold)]/30 flex items-center gap-1 shrink-0">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              قبلاً تعریف شده
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-[var(--foreground-muted)]">
                          <span>{toPersianDigits(s.grades?.length || 0)} پایه</span>
                          <span className="text-[var(--foreground-subtle)]">·</span>
                          <span>{toPersianDigits(s.grades?.reduce((a, gs) => a + (gs.chapters?.length || 0), 0) || 0)} فصل</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* New subject inline form */}
              <div className="surface-1 rounded-2xl p-4 border-2 border-dashed border-[var(--border-strong)]">
                <div className="flex items-center gap-2 mb-3">
                  <Plus className="w-4 h-4 text-[var(--gold)]" />
                  <h4 className="text-sm font-bold text-[var(--foreground)]">درس جدید</h4>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSubjectName}
                    onChange={(e) => setNewSubjectName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !creatingSubject) handleCreateNewSubject();
                    }}
                    placeholder="نام درس جدید..."
                    className="flex-1 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-3 h-11 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)] focus:outline-none focus:border-[var(--gold)]/40"
                  />
                  <button
                    onClick={handleCreateNewSubject}
                    disabled={creatingSubject || !newSubjectName.trim()}
                    className="btn-hover glow-hover-gold h-11 px-6 rounded-lg bg-[var(--gold)] text-white font-bold text-sm disabled:opacity-50 flex items-center gap-2"
                  >
                    {creatingSubject ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline">ایجاد</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-[10px] text-[var(--foreground-subtle)] mt-2 leading-relaxed">
                  درس جدید با رنگ و آیکون پیش‌فرض ایجاد می‌شود. وضعیت ارزیابی برای هر پایه/رشته جداگانه تنظیم می‌شود.
                </p>
              </div>

              <div className="flex justify-start">
                <button
                  onClick={() => guardedAction(() => setStep(2))}
                  className="btn-hover h-10 px-4 rounded-lg border border-[var(--border)] text-[var(--foreground-muted)] text-sm flex items-center gap-2"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  بازگشت
                </button>
              </div>
            </div>
          )}

          {/* ===== Step 4: Chapters ===== */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="surface-1 rounded-2xl p-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-[var(--foreground)]">تعریف فصول</h3>
                  <p className="text-xs text-[var(--foreground-muted)] mt-0.5">
                    شماره فصل، عنوان و بازه صفحات را وارد کنید. Enter را بزنید تا فصل بعدی اضافه شود.
                  </p>
                </div>
                {gradeSubjectLoading || chaptersLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-[var(--gold)]" />
                ) : null}
              </div>

              {!gradeSubjectId ? (
                <div className="surface-1 rounded-2xl p-12 text-center">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-[var(--gold)] mb-2" />
                  <p className="text-xs text-[var(--foreground-muted)]">در حال آماده‌سازی...</p>
                </div>
              ) : chaptersError ? (
                <div className="surface-1 rounded-2xl p-8 text-center">
                  <AlertCircle className="w-10 h-10 mx-auto text-[var(--danger)] mb-2" />
                  <p className="text-xs text-[var(--foreground)] mb-3">{chaptersError}</p>
                  <button
                    onClick={() => gradeSubjectId && fetchChapters(gradeSubjectId)}
                    className="btn-hover h-10 px-4 rounded-lg border border-[var(--border-strong)] text-[var(--foreground)] text-sm font-medium inline-flex items-center gap-2"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    تلاش مجدد
                  </button>
                </div>
              ) : (
                <>
                  {chapters.length === 0 && !chaptersLoading ? (
                    <div className="surface-1 rounded-2xl p-8 text-center">
                      <Layers className="w-10 h-10 mx-auto text-[var(--foreground-subtle)] mb-2" />
                      <p className="text-xs text-[var(--foreground-muted)] mb-4">
                        هنوز فصلی ثبت نشده است. اولین فصل را اضافه کنید.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {chapters.map((row, idx) => (
                        <ChapterRowCard
                          key={row.clientId}
                          row={row}
                          idx={idx}
                          onChange={(patch) => updateChapterRow(idx, patch)}
                          onKeyDown={(e) => handleChapterTitleKeyDown(idx, e)}
                          onSave={() => saveChapterRow(idx)}
                          onDelete={() => deleteChapterRow(idx)}
                        />
                      ))}
                    </div>
                  )}

                  <button
                    onClick={addChapterRow}
                    className="btn-hover glow-hover-gold w-full h-11 rounded-lg border-2 border-dashed border-[var(--gold)]/30 text-[var(--gold)] font-bold text-sm flex items-center justify-center gap-2 hover:bg-[var(--gold-soft)]"
                  >
                    <Plus className="w-4 h-4" />
                    افزودن فصل
                  </button>

                  <div className="flex justify-between gap-2">
                    <button
                      onClick={() => guardedAction(() => setStep(3))}
                      className="btn-hover h-10 px-4 rounded-lg border border-[var(--border)] text-[var(--foreground-muted)] text-sm flex items-center gap-2"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                      بازگشت
                    </button>
                    <button
                      onClick={() => setStep(5)}
                      disabled={chapters.length === 0 || chapters.some((c) => !c.id)}
                      className="btn-hover glow-hover-gold h-10 px-4 rounded-lg bg-[var(--gold)] text-white font-bold text-sm disabled:opacity-50 flex items-center gap-2"
                    >
                      گفتارها
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {chapters.length > 0 && chapters.some((c) => !c.id) && (
                    <p className="text-[10px] text-[var(--warning)]/80 text-center flex items-center justify-center gap-1.5">
                      <AlertCircle className="w-3 h-3" />
                      ابتدا تمام فصل‌ها را ذخیره کنید تا به بخش گفتارها بروید.
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          {/* ===== Step 5: Topics ===== */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="surface-1 rounded-2xl p-4">
                <h3 className="text-sm font-bold text-[var(--foreground)]">تعریف گفتارها (اختیاری)</h3>
                <p className="text-xs text-[var(--foreground-muted)] mt-0.5">
                  هر فصل را باز کنید تا گفتارهای (sub-sections) آن را وارد کنید. فصل بدون گفتار = انتخاب کل فصل.
                </p>
              </div>

              {chapters.length === 0 ? (
                <div className="surface-1 rounded-2xl p-8 text-center">
                  <MessageSquare className="w-10 h-10 mx-auto text-[var(--foreground-subtle)] mb-2" />
                  <p className="text-xs text-[var(--foreground-muted)]">ابتدا در مرحله قبل فصول را اضافه کنید.</p>
                </div>
              ) : (
                <Accordion
                  type="single"
                  collapsible
                  value={expandedChapterIdx || undefined}
                  onValueChange={(v) => {
                    setExpandedChapterIdx(v || null);
                    if (v) {
                      const ch = chapters.find((item) => item.clientId === v);
                      if (ch?.id) ensureTopicsLoaded(ch.id);
                    }
                  }}
                  className="space-y-2"
                >
                  {chapters.map((ch, idx) => {
                    const chId = ch.id;
                    const topics = (chId && topicsByChapter[chId]) || [];
                    return (
                      <AccordionItem
                        key={ch.clientId}
                        value={ch.clientId}
                        className="surface-1 rounded-2xl border border-[var(--border)] overflow-hidden"
                      >
                        <AccordionTrigger className="px-4 py-3 hover:bg-[var(--bg-overlay)]/40 hover:no-underline">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-[var(--gold-soft)] border border-[var(--gold)]/30 flex items-center justify-center shrink-0">
                              <span className="text-sm font-black text-[var(--gold)]">
                                {toPersianDigits(ch.chapterNo)}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0 text-right">
                              <p className="text-sm font-bold text-[var(--foreground)] truncate">
                                {ch.title || `فصل ${toPersianDigits(ch.chapterNo)}`}
                              </p>
                              <p className="text-[10px] text-[var(--foreground-muted)] mt-0.5">
                                {ch.pageStart && ch.pageEnd
                                  ? `صفحات ${toPersianDigits(ch.pageStart)} تا ${toPersianDigits(ch.pageEnd)}`
                                  : 'بدون بازه صفحه'}
                                {topics.length > 0 && ` · ${toPersianDigits(topics.length)} گفتار`}
                              </p>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4">
                          {chId ? (
                            <div className="space-y-2 pt-2">
                              {topics.length === 0 ? (
                                <p className="text-[11px] text-[var(--foreground-muted)] text-center py-3">
                                  گفتاری ثبت نشده — این فصل به‌صورت کامل انتخاب می‌شود.
                                </p>
                              ) : (
                                topics.map((t, tIdx) => (
                                  <TopicRowCard
                                    key={t.clientId}
                                    row={t}
                                    idx={tIdx}
                                    chapterId={chId}
                                    onChange={(patch) => updateTopicRow(chId, tIdx, patch)}
                                    onKeyDown={(e) => handleTopicTitleKeyDown(chId, tIdx, e)}
                                    onSave={() => saveTopicRow(chId, tIdx)}
                                    onDelete={() => deleteTopicRow(chId, tIdx)}
                                  />
                                ))
                              )}
                              <button
                                onClick={() => addTopicRow(chId)}
                                className="btn-hover w-full h-9 rounded-md border border-dashed border-[var(--border-strong)] text-[var(--foreground-muted)] text-xs flex items-center justify-center gap-1.5"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                افزودن گفتار
                              </button>
                            </div>
                          ) : (
                            <p className="text-[11px] text-[var(--warning)]/80 text-center py-3 flex items-center justify-center gap-1.5">
                              <AlertCircle className="w-3 h-3" />
                              ابتدا این فصل را ذخیره کنید.
                            </p>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              )}

              <div className="flex justify-start">
                <button
                  onClick={() => guardedAction(() => setStep(4))}
                  className="btn-hover h-10 px-4 rounded-lg border border-[var(--border)] text-[var(--foreground-muted)] text-xs flex items-center gap-1.5"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  بازگشت به فصول
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* ===== Unsaved changes confirmation dialog (bug 13) ===== */}
      {showUnsavedDialog && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setShowUnsavedDialog(null)}
        >
          <div
            className="surface-2 edge-highlight rounded-2xl w-full max-w-sm p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-[var(--foreground)] mb-2">
              تغییرات ذخیره‌نشده
            </h3>
            <p className="text-xs text-[var(--foreground-muted)] mb-4 leading-relaxed">
              تغییرات ذخیره‌نشده‌ای دارید. آیا مطمئن هستید که می‌خواهید این صفحه را ترک کنید؟ تغییرات از بین خواهند رفت.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const action = showUnsavedDialog;
                  setShowUnsavedDialog(null);
                  action?.();
                }}
                className="flex-1 h-10 rounded-lg bg-[var(--danger)] text-white text-sm font-bold btn-hover"
              >
                بله، ادامه بده
              </button>
              <button
                onClick={() => setShowUnsavedDialog(null)}
                className="flex-1 h-10 rounded-lg border border-[var(--border)] text-[var(--foreground-muted)] text-sm btn-hover"
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// ChapterRowCard — single chapter row in step 4
// ============================================================
function ChapterRowCard({
  row,
  idx,
  onChange,
  onKeyDown,
  onSave,
  onDelete,
}: {
  row: ChapterRow;
  idx: number;
  onChange: (patch: Partial<ChapterRow>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onSave: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="surface-1 rounded-2xl p-3 border border-[var(--border)]">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end">
        {/* Chapter number */}
        <div className="md:col-span-2">
          <label className="text-[10px] font-medium text-[var(--foreground-muted)] mb-1 block">
            شماره فصل
          </label>
          <input
            type="number"
            min={1}
            value={row.chapterNo}
            onChange={(e) => onChange({ chapterNo: Number(e.target.value) || 0 })}
            className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-2 h-10 text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--gold)]/40"
          />
        </div>

        {/* Title */}
        <div className="md:col-span-5">
          <label className="text-[10px] font-medium text-[var(--foreground-muted)] mb-1 block">
            عنوان فصل
          </label>
          <input
            type="text"
            value={row.title}
            data-chapter-title-idx={idx}
            onChange={(e) => onChange({ title: e.target.value })}
            onKeyDown={onKeyDown}
            placeholder="مثلاً: دنیای زنده"
            className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-3 h-10 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)] focus:outline-none focus:border-[var(--gold)]/40"
          />
        </div>

        {/* Page start */}
        <div className="md:col-span-2">
          <label className="text-[10px] font-medium text-[var(--foreground-muted)] mb-1 block">
            از صفحه
          </label>
          <input
            type="number"
            min={1}
            value={row.pageStart}
            onChange={(e) => onChange({ pageStart: e.target.value })}
            disabled={false}
            className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-2 h-10 text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--gold)]/40 disabled:opacity-50"
          />
        </div>

        {/* Page end */}
        <div className="md:col-span-3">
          <label className="text-[10px] font-medium text-[var(--foreground-muted)] mb-1 block">
            تا صفحه
          </label>
          <input
            type="number"
            min={1}
            value={row.pageEnd}
            onChange={(e) => onChange({ pageEnd: e.target.value })}
            className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-2 h-10 text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--gold)]/40"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--border)]">
        <div className="flex items-center gap-1.5 text-[10px]">
          {row.id ? (
            <span className="text-[var(--foreground-subtle)] flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-[var(--accent)]" />
              ذخیره شده
            </span>
          ) : (
            <span className="text-[var(--warning)]/80 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              ذخیره نشده
            </span>
          )}
          {row.saved && (
            <span className="text-[var(--accent)] flex items-center gap-1 animate-fade-in-up">
              <Check className="w-3 h-3" />
              ثبت شد
            </span>
          )}
        </div>
        <div className="flex gap-1">
          <button
            onClick={onSave}
            disabled={row.saving || !row.title.trim() || Boolean(row.pageStart) !== Boolean(row.pageEnd)}
            className="btn-hover glow-hover-gold h-9 px-3 rounded-md bg-[var(--gold)] text-white font-bold text-xs disabled:opacity-50 flex items-center gap-1.5"
          >
            {row.saving ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <>
                <Save className="w-3 h-3" />
                ذخیره
              </>
            )}
          </button>
          <button
            onClick={onDelete}
            className="icon-btn size-9 rounded-md flex items-center justify-center text-[var(--foreground-muted)] hover:text-[var(--danger)]"
            aria-label="حذف"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// TopicRowCard — single topic row in step 5
// ============================================================
function TopicRowCard({
  row,
  idx,
  chapterId,
  onChange,
  onKeyDown,
  onSave,
  onDelete,
}: {
  row: TopicRow;
  idx: number;
  chapterId: string;
  onChange: (patch: Partial<TopicRow>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onSave: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="bg-[var(--bg-elevated)] rounded-xl p-2.5 border border-[var(--border)]">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end">
        <div className="md:col-span-2">
          <label className="text-[10px] font-medium text-[var(--foreground-muted)] mb-1 block">شماره</label>
          <input
            type="number"
            min={1}
            value={row.topicNo}
            onChange={(e) => onChange({ topicNo: Number(e.target.value) || 0 })}
            className="w-full bg-[var(--bg-overlay)] border border-[var(--border)] rounded-lg px-2 h-9 text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--gold)]/40"
          />
        </div>
        <div className="md:col-span-5">
          <label className="text-[10px] font-medium text-[var(--foreground-muted)] mb-1 block">عنوان گفتار</label>
          <input
            type="text"
            value={row.title}
            data-topic-title-chapter={chapterId}
            data-topic-title-idx={idx}
            onChange={(e) => onChange({ title: e.target.value })}
            onKeyDown={onKeyDown}
            placeholder="مثلاً: نوکلئیک‌اسیدها"
            className="w-full bg-[var(--bg-overlay)] border border-[var(--border)] rounded-lg px-3 h-9 text-xs text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)] focus:outline-none focus:border-[var(--gold)]/40"
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-[10px] font-medium text-[var(--foreground-muted)] mb-1 block">از صفحه</label>
          <input
            type="number"
            min={1}
            value={row.pageStart}
            onChange={(e) => onChange({ pageStart: e.target.value })}
            className="w-full bg-[var(--bg-overlay)] border border-[var(--border)] rounded-lg px-2 h-9 text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--gold)]/40"
          />
        </div>
        <div className="md:col-span-3">
          <label className="text-[10px] font-medium text-[var(--foreground-muted)] mb-1 block">تا صفحه</label>
          <input
            type="number"
            min={1}
            value={row.pageEnd}
            onChange={(e) => onChange({ pageEnd: e.target.value })}
            className="w-full bg-[var(--bg-overlay)] border border-[var(--border)] rounded-lg px-2 h-9 text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--gold)]/40"
          />
        </div>
      </div>

      <div className="flex items-center justify-between mt-2 pt-2 border-t border-[var(--border)]">
        <div className="flex items-center gap-1.5 text-[10px]">
          {row.id ? (
            <span className="text-[var(--foreground-subtle)] flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-[var(--accent)]" />
              ذخیره شده
            </span>
          ) : (
            <span className="text-[var(--warning)]/80 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              ذخیره نشده
            </span>
          )}
          {row.saved && (
            <span className="text-[var(--accent)] flex items-center gap-1">
              <Check className="w-3 h-3" />
              ثبت شد
            </span>
          )}
        </div>
        <div className="flex gap-1">
          <button
            onClick={onSave}
            disabled={row.saving || !row.title.trim() || Boolean(row.pageStart) !== Boolean(row.pageEnd)}
            className="btn-hover h-9 px-3 rounded-md bg-[var(--gold-soft)] border border-[var(--gold)]/30 text-[var(--gold)] font-bold text-xs disabled:opacity-50 flex items-center gap-1.5"
          >
            {row.saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
            ذخیره
          </button>
          <button
            onClick={onDelete}
            className="icon-btn size-9 rounded-md flex items-center justify-center text-[var(--foreground-muted)] hover:text-[var(--danger)]"
            aria-label="حذف گفتار"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
