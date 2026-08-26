'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { toast } from 'sonner';
import { FieldType, ActivityType, Task } from '@/lib/types';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/components/ui/drawer';
import { TaskSubjectPicker, TaskSelection, TaskSubjectPickerDraftState } from '@/components/shared/TaskSubjectPicker';
import { useAppStore } from '@/lib/store';
import { useCurrentStudentId } from '@/lib/student-utils';
import { AuthError } from '@/lib/api-client';
import { ChevronLeft, Save, ArrowLeft } from 'lucide-react';
import { FieldTypeBadge } from '@/components/shared/FieldTypeBadge';
import { clearTaskFormDraft, readTaskFormDraft, taskFormDraftKey, writeTaskFormDraft } from '@/lib/task-form-draft';
import { normalizeNumericInput, toEnglishDigits } from '@/lib/digits';
import { activitySelectedStyle } from '@/lib/activity-styles';
import { buildClassDraft, CLASS_ACTIVITY_TYPES, classSessionDetailsComplete, isClassTask, withoutClassActivity } from '@/lib/class-task';

const ACTIVITIES: ActivityType[] = ['مطالعه', 'مرور', 'تست آموزشی', 'تست سنجشی'];

const TIME_QUICK_PICKS = [60, 90, 120];
const TEST_QUICK_PICKS = [20, 30, 40];

const EMPTY_PICKER_DRAFT: TaskSubjectPickerDraftState = {
  selectedGrade: null,
  curriculumMode: null,
  selectedChapterId: null,
  selectedTopicIds: [],
  selectedTopicModeId: null,
  selectedSubtopicIds: [],
  pageRangeStart: '',
  pageRangeEnd: '',
};

/**
 * Unified task creation flow — all steps in one bottom sheet.
 *
 * Steps:
 *  1. Choose field type (کنکور/نهایی)
 *  2. Choose subject (+ drill into grade → chapter → topic)
 *  3. Choose activity type + time + test count
 *
 * User can do a "quick save" after step 2 (subject selected) → creates draft with detailsCompleted=false.
 * Or continue to step 3 and save a complete task with detailsCompleted=true.
 */
export default function ManualEntrySheet({ open, onOpenChange, selectedDate, existingTaskCount, onSubmit, onSaved, onDraftChange, draftSessionId, studentId: studentIdProp, grade, major, createdBy = 'student', createdById = null, mode = 'create', initialTask = null, persistFormDraft = true, allowDraftSave = true }: {
  open: boolean; onOpenChange: (open: boolean) => void; selectedDate: string;
  existingTaskCount: number; onSubmit: (task: Task) => Promise<void> | void;
  studentId?: string; grade?: string; major?: string; createdBy?: 'student' | 'advisor'; createdById?: string | null;
  mode?: 'create' | 'complete-draft' | 'edit'; initialTask?: Task | null;
  persistFormDraft?: boolean;
  allowDraftSave?: boolean;
  onSaved?: (task: Task) => void;
  onDraftChange?: () => void;
  draftSessionId?: string;
}) {
  const { user } = useAppStore();
  const currentStudentId = useCurrentStudentId();
  const studentId = studentIdProp ?? currentStudentId;

  // === Step state ===
  // 1 = field type, 2 = subject picker, 3 = details (activity/time)
  const [step, setStep] = useState<1 | 2 | 3>(2);
  const initialSelection = useCallback((): TaskSelection => initialTask ? ({
    subjectId: initialTask.subjectId ?? undefined,
    subjectName: initialTask.subject,
    subjectColor: initialTask.subjectColor,
    chapterId: initialTask.chapterId ?? undefined,
    topicId: initialTask.topicId ?? undefined,
    topicIds: initialTask.topicIds ?? (initialTask.topicId ? [initialTask.topicId] : []),
    topicNames: initialTask.topics?.map((topic) => `گفتار ${topic.topicNo}: ${topic.title}`),
    topicModeId: initialTask.topicModeId ?? undefined,
    curriculumMode: initialTask.curriculumMode ?? undefined,
     topicModeSubtopicIds: initialTask.topicModeSubtopicIds ?? [],
     topicModeSubtopicNames: initialTask.topicModeSubtopics?.map((subtopic) => subtopic.title),
     contentType: initialTask.activityTypes?.includes('کلاس/ویدیو') ? 'CLASS_VIDEO' : initialTask.curriculumMode === 'THEMATIC' ? 'THEMATIC' : 'BOOK',
     teacherClassName: initialTask.teacherClassName ?? '',
     sessionNumber: initialTask.sessionNumber ?? '',
     displayText: initialTask.topic ?? undefined,
    pageStart: initialTask.pageStart ?? undefined,
    pageEnd: initialTask.pageEnd ?? undefined,
  }) : ({}), [initialTask]);
  const [fieldType, setFieldType] = useState<FieldType | null>(initialTask?.fieldType ?? null);
  const [selection, setSelection] = useState<TaskSelection>(initialSelection);
  const [activities, setActivities] = useState<ActivityType[]>(initialTask?.activityTypes ?? []);
  const initialIsClassVideo = Boolean(initialTask && isClassTask(initialTask));
  const [minutes, setMinutes] = useState(initialIsClassVideo ? (initialTask?.actualTimeMinutes == null ? '' : String(initialTask.actualTimeMinutes)) : (initialTask?.targetTimeMinutes == null ? '' : String(initialTask.targetTimeMinutes)));
  const [tests, setTests] = useState(initialIsClassVideo ? (initialTask?.actualTestCount == null ? '' : String(initialTask.actualTestCount)) : (initialTask?.targetTestCount == null ? '' : String(initialTask.targetTestCount)));
  const [teacherClassName, setTeacherClassName] = useState(initialTask?.teacherClassName ?? '');
  const [sessionNumber, setSessionNumber] = useState(initialTask?.sessionNumber ?? '');
  const [bookName, setBookName] = useState(initialTask?.bookName ?? '');
  const [testDescription, setTestDescription] = useState(initialTask?.testDescription ?? '');
  const [pickerDraft, setPickerDraft] = useState<TaskSubjectPickerDraftState>(EMPTY_PICKER_DRAFT);
  const [saving, setSaving] = useState(false);
  const hydratedDraftKeyRef = useRef<string | null>(null);

  const [teacherClassSuggestions, setTeacherClassSuggestions] = useState<string[]>([]);
  const [bookSuggestions, setBookSuggestions] = useState<string[]>([]);
  const [classVideoMode, setClassVideoMode] = useState(Boolean(initialTask && isClassTask(initialTask)));
  const isClassVideo = classVideoMode || selection.contentType === 'CLASS_VIDEO' || isClassTask({ activityTypes: activities });

  const reset = useCallback(() => {
    setStep(2);
    setFieldType(initialTask?.fieldType ?? null);
    setSelection(initialSelection());
    setActivities(initialTask?.activityTypes ?? []);
    setClassVideoMode(Boolean(initialTask && isClassTask(initialTask)));
    const resettingClass = Boolean(initialTask && isClassTask(initialTask));
    setMinutes(resettingClass ? (initialTask?.actualTimeMinutes == null ? '' : String(initialTask.actualTimeMinutes)) : (initialTask?.targetTimeMinutes == null ? '' : String(initialTask.targetTimeMinutes)));
    setTests(resettingClass ? (initialTask?.actualTestCount == null ? '' : String(initialTask.actualTestCount)) : (initialTask?.targetTestCount == null ? '' : String(initialTask.targetTestCount)));
    setTeacherClassName(initialTask?.teacherClassName ?? '');
    setSessionNumber(initialTask?.sessionNumber ?? '');
    setBookName(initialTask?.bookName ?? '');
    setTestDescription(initialTask?.testDescription ?? '');
    setPickerDraft(EMPTY_PICKER_DRAFT);
    setTeacherClassSuggestions([]);
    setBookSuggestions([]);
  }, [initialTask, initialSelection, mode]);

  const draftKey = useMemo(() => taskFormDraftKey({
    studentId,
    selectedDate,
    mode,
    taskId: initialTask?.id ?? draftSessionId,
  }), [draftSessionId, initialTask?.id, mode, selectedDate, studentId]);

  useEffect(() => {
    if (!open) {
      if (!persistFormDraft) {
        clearTaskFormDraft(window.localStorage, draftKey);
        hydratedDraftKeyRef.current = null;
        reset();
      }
      return;
    }
    if (hydratedDraftKeyRef.current === draftKey) return;
    if (!persistFormDraft) {
      clearTaskFormDraft(window.localStorage, draftKey);
      reset();
      hydratedDraftKeyRef.current = draftKey;
      return;
    }
    const draft = readTaskFormDraft(window.localStorage, draftKey);
    if (draft) {
      setStep(draft.step === 1 ? 2 : draft.step);
      setFieldType(draft.fieldType);
      setSelection(draft.selection);
      setPickerDraft(draft.picker);
      setActivities(draft.activities);
      setMinutes(toEnglishDigits(draft.minutes));
      setTests(toEnglishDigits(draft.tests));
      setTeacherClassName(draft.teacherClassName);
      setSessionNumber(draft.sessionNumber);
      setBookName(draft.bookName);
      setTestDescription(draft.testDescription);
    } else {
      reset();
    }
    hydratedDraftKeyRef.current = draftKey;
  }, [draftKey, open, persistFormDraft, reset]);

  useEffect(() => {
    if (!persistFormDraft || !open || hydratedDraftKeyRef.current !== draftKey) return;
    const hasProgress = step > 1 || Boolean(selection.subjectId || selection.subjectName);
    if (!hasProgress) return;
    writeTaskFormDraft(window.localStorage, draftKey, {
      version: 1,
      step,
      fieldType,
      selection,
      picker: pickerDraft,
      activities,
      minutes,
      tests,
      teacherClassName,
      sessionNumber,
      bookName,
      testDescription,
      selectedDate,
      updatedAt: new Date().toISOString(),
    });
    onDraftChange?.();
  }, [activities, bookName, draftKey, fieldType, minutes, onDraftChange, open, persistFormDraft, pickerDraft, selectedDate, selection, sessionNumber, step, teacherClassName, testDescription, tests]);

  // Fetch suggestions when subject or relevant activity types change
  useEffect(() => {
    const hasClassVideo = isClassVideo;
    const hasTestDetails = activities.includes('تست آموزشی') || activities.includes('تست سنجشی');

    if (!selection.subjectId || (!hasClassVideo && !hasTestDetails)) {
      setTeacherClassSuggestions([]);
      setBookSuggestions([]);
      return;
    }
    const subjectId = selection.subjectId;

    const fetchSuggestions = async () => {
      const promises: Promise<void>[] = [];
      if (hasClassVideo) {
        promises.push(
          fetch(`/api/task-suggestions?studentId=${encodeURIComponent(studentId || '')}&subjectId=${encodeURIComponent(subjectId)}&type=teacherClass`)
            .then(r => r.ok ? r.json() : { values: [] })
            .then(data => setTeacherClassSuggestions(data.values || []))
            .catch(() => setTeacherClassSuggestions([]))
        );
      }
      if (hasTestDetails) {
        promises.push(
          fetch(`/api/task-suggestions?studentId=${encodeURIComponent(studentId || '')}&subjectId=${encodeURIComponent(subjectId)}&type=book`)
            .then(r => r.ok ? r.json() : { values: [] })
            .then(data => setBookSuggestions(data.values || []))
            .catch(() => setBookSuggestions([]))
        );
      }
      await Promise.all(promises);
    };

    fetchSuggestions();
  }, [selection.subjectId, activities, isClassVideo, studentId]);

  const removeTeacherClassSuggestion = async (suggestion: string) => {
    if (!selection.subjectId) return;

    setTeacherClassSuggestions((current) => current.filter((value) => value !== suggestion));
    try {
      const response = await fetch('/api/task-suggestions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, subjectId: selection.subjectId, type: 'teacherClass', value: suggestion }),
      });
      if (!response.ok) throw new Error('Failed to remove teacher suggestion');
      if (selection.teacherClassName === suggestion) {
        setTeacherClassName('');
        setSelection((current) => ({ ...current, teacherClassName: '' }));
      }
    } catch {
      setTeacherClassSuggestions((current) => current.includes(suggestion) ? current : [...current, suggestion]);
      toast.error('حذف نام دبیر انجام نشد');
    }
  };

  // Can quick-save once subject is selected
  const classTeacherName = selection.teacherClassName ?? teacherClassName;
  const classSessionNumber = selection.sessionNumber ?? sessionNumber;
  const classDetailsComplete = classSessionDetailsComplete(classTeacherName, classSessionNumber);
  const canQuickSave = !!selection.subjectId && !!selection.subjectName && (
    (isClassVideo && classDetailsComplete) ||
    (selection.curriculumMode === 'BOOK' && !!selection.chapterId) ||
    (selection.curriculumMode === 'THEMATIC' && !!selection.topicModeId)
  );

  // Can full-save once subject + activity + time are set
  const effectiveActivities = isClassVideo
    ? CLASS_ACTIVITY_TYPES
    : activities.filter((activity) => activity !== 'کلاس/ویدیو');
  const canFullSave = canQuickSave && effectiveActivities.length > 0 && (isClassVideo || Number(minutes) > 0);

  // Build task object from current state
  const buildTask = (detailsCompleted: boolean): Task => {
    if (isClassVideo && mode === 'create') {
      return buildClassDraft({
        id: initialTask?.id ?? crypto.randomUUID(),
        studentId,
        subjectId: selection.subjectId!,
        subject: selection.subjectName!,
        subjectColor: selection.subjectColor ?? 'var(--accent)',
        teacherClassName: classTeacherName,
        sessionNumber: classSessionNumber,
        date: initialTask?.date ?? selectedDate,
        order: initialTask?.order ?? existingTaskCount + 1,
        createdBy: initialTask?.createdBy ?? createdBy,
        createdById: initialTask?.createdById ?? createdById,
      });
    }
    return {
    id: initialTask?.id ?? crypto.randomUUID(),
    studentId,
    subjectId: selection.subjectId!,
    subject: selection.subjectName!,
    subjectColor: selection.subjectColor ?? 'var(--accent)',
    topic: selection.displayText ?? null,
    fieldType,
    activityTypes: detailsCompleted || isClassVideo ? effectiveActivities : null,
    targetTimeMinutes: !isClassVideo && detailsCompleted && minutes ? Number(minutes) : null,
    actualTimeMinutes: isClassVideo && minutes ? Number(minutes) : null,
    targetTestCount: !isClassVideo && detailsCompleted && tests ? Number(tests) : null,
    actualTestCount: isClassVideo && tests ? Number(tests) : null,
    status: mode === 'edit' ? initialTask?.status ?? 'PENDING' : detailsCompleted ? 'PENDING' : 'DRAFT',
    completed: null,
    date: initialTask?.date ?? selectedDate,
    order: initialTask?.order ?? existingTaskCount + 1,
    createdBy: initialTask?.createdBy ?? createdBy,
    createdById: initialTask?.createdById ?? createdById,
    chapterId: selection.chapterId ?? null,
    topicId: selection.topicId ?? null,
    topicIds: selection.topicIds ?? [],
    topicModeId: selection.topicModeId ?? null,
    curriculumMode: selection.curriculumMode ?? null,
    topicModeSubtopicIds: selection.topicModeSubtopicIds ?? [],
    pageStart: selection.pageStart ?? null,
    pageEnd: selection.pageEnd ?? null,
    teacherClassName: isClassVideo ? (selection.teacherClassName !== undefined ? selection.teacherClassName : teacherClassName).trim() : null,
    sessionNumber: isClassVideo ? (selection.sessionNumber !== undefined ? selection.sessionNumber : sessionNumber).trim() : null,
    bookName: bookName || null,
    testDescription: testDescription || null,
      detailsCompleted: mode === 'edit' ? initialTask?.detailsCompleted ?? true : detailsCompleted,
    };
  };

  const doSave = async (detailsCompleted: boolean) => {
    setSaving(true);
    try {
      const task = buildTask(detailsCompleted);
      await onSubmit(task);
      onSaved?.(task);
      if (detailsCompleted) {
        toast.success('تسک ثبت شد');
      } else {
        toast.success('تسک اولیه ثبت شد — بعداً تکمیلش کنید');
      }
      clearTaskFormDraft(window.localStorage, draftKey);
      onDraftChange?.();
      hydratedDraftKeyRef.current = null;
      reset();
      onOpenChange(false);
    } catch (err) {
      if (err instanceof AuthError) {
        onOpenChange(false);
      } else {
        const msg = err instanceof Error && err.message ? err.message : 'ثبت تسک ناموفق بود';
        toast.error(msg);
      }
    } finally {
      setSaving(false);
    }
  };

  const handlePrevious = () => {
    setStep((current) => current === 3 ? 2 : current);
  };

  const handleFieldTypeChange = (nextFieldType: FieldType | null, nextSelection?: TaskSelection) => {
    setFieldType(nextFieldType);
    if (nextSelection) {
      setSelection(nextSelection);
      setPickerDraft(EMPTY_PICKER_DRAFT);
      return;
    }
    if (nextFieldType === fieldType) return;
    if (!selection.subjectId || !selection.subjectName) {
      setSelection({});
      setPickerDraft(EMPTY_PICKER_DRAFT);
      return;
    }
    setSelection(isClassVideo
      ? { ...selection, contentType: 'CLASS_VIDEO' }
      : {
          subjectId: selection.subjectId,
          subjectName: selection.subjectName,
          subjectColor: selection.subjectColor,
        });
    setPickerDraft(EMPTY_PICKER_DRAFT);
  };

  // Step labels
  const stepLabel = isClassVideo ? 'ثبت کلاس/ویدیو' : step === 2 ? 'انتخاب درس و نوع تسک' : 'جزئیات مطالعه';
  const stepIndicator = (
    <div className="flex items-center justify-center gap-1.5 mb-2">
      {[2, 3].map(s => (
        <div
          key={s}
          className={`h-1.5 rounded-full transition-all duration-300 ${
            s === step ? 'w-6 bg-[var(--accent)]' : s < step ? 'w-4 bg-[var(--accent)]/50' : 'w-4 bg-[var(--border)]'
          }`}
        />
      ))}
    </div>
  );

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
      <DrawerContent className="surface-2 border-t border-[var(--border-strong)] text-[var(--foreground)] max-h-[88vh]">
        <DrawerHeader className="text-right pb-2">
          <div className="flex items-center justify-between">
            <div>
              <DrawerTitle>افزودن تسک</DrawerTitle>
              <p className="text-xs text-[var(--foreground-subtle)] mt-0.5">{stepLabel}</p>
            </div>
            {step === 3 && (
              <button
                onClick={handlePrevious}
                className="flex items-center gap-1 text-xs text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                قبلی
              </button>
            )}
          </div>
          {stepIndicator}
        </DrawerHeader>

        <div className="px-4 pb-2 overflow-y-auto flex-1">
          {/* ===== Step 2: Subject Picker ===== */}
          {step === 2 && (
            <div className="space-y-3">
              {/* Field type badge */}
              <div className="flex items-center gap-2">
                {fieldType && <FieldTypeBadge value={fieldType} />}
              </div>
                <TaskSubjectPicker
                  fieldType={fieldType}
                 grade={grade ?? user?.grade ?? 'دوازدهم'}
                 major={major ?? user?.major ?? 'تجربی'}
                 value={selection}
                 onChange={setSelection}
                   onSelectionComplete={() => { if (!isClassVideo) setStep(3); }}
                  allGrades={Boolean(initialTask?.activityTypes?.includes('کلاس/ویدیو'))}
                  onFieldTypeChange={handleFieldTypeChange}
                  onClassVideoSelected={() => { setClassVideoMode(true); setFieldType(null); }}
                  onClassVideoExited={() => {
                    setClassVideoMode(false);
                    setActivities((current) => withoutClassActivity(current));
                    setTeacherClassName('');
                    setSessionNumber('');
                    setFieldType(null);
                  }}
                  allowClassCurriculumLink={mode !== 'create'}
                   teacherClassSuggestions={teacherClassSuggestions}
                   onTeacherSuggestionRemove={removeTeacherClassSuggestion}
                  draftState={pickerDraft}
                  onDraftStateChange={setPickerDraft}
                />
                {isClassVideo && mode !== 'create' && (
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-3">
                    <p className="mb-3 text-xs font-semibold text-[var(--foreground)]">زمان و تمرین این جلسه</p>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="text-xs text-[var(--foreground-muted)]">
                        زمان واقعی (دقیقه)
                         <input
                          type="text"
                          inputMode="numeric"
                          value={minutes}
                          onChange={(event) => setMinutes(normalizeNumericInput(event.target.value))}
                          placeholder="اختیاری"
                          className="mt-1.5 h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-base)] px-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
                          dir="ltr"
                        />
                      </label>
                      <label className="text-xs text-[var(--foreground-muted)]">
                        تعداد تمرین/تست
                         <input
                          type="text"
                          inputMode="numeric"
                          value={tests}
                          onChange={(event) => setTests(normalizeNumericInput(event.target.value))}
                          placeholder="اختیاری"
                          className="mt-1.5 h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-base)] px-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
                          dir="ltr"
                        />
                      </label>
                    </div>
                  </div>
                )}
             </div>
          )}

           {/* ===== Step 3: Details (Activity + Time + Tests) ===== */}
           {step === 3 && (
             <div className="space-y-5">
               {/* Summary of what was selected */}
               <div className="rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] p-3 space-y-2">
                 <div className="flex items-center gap-2">
                   <span
                     className="w-3 h-3 rounded-full shrink-0"
                     style={{ backgroundColor: selection.subjectColor || 'var(--accent)' }}
                   />
                   <span className="text-sm font-semibold text-[var(--foreground)]">{selection.subjectName}</span>
                    {fieldType ? <FieldTypeBadge value={fieldType} className="mr-auto" /> : <span className="mr-auto rounded-md border border-[#35C49A]/30 bg-[#35C49A]/10 px-2 py-0.5 text-[10px] font-semibold text-[#72E0BF]">کلاس</span>}
                 </div>
                 {selection.topicNames && selection.topicNames.length > 0 && (
                   <div className="flex flex-wrap gap-1">
                     {selection.topicNames.map((name, i) => (
                       <span key={i} className="text-[10px] px-1.5 py-0.5 rounded-md bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent)]/20">
                         {name}
                       </span>
                     ))}
                   </div>
                 )}
                 {selection.topicModeSubtopicNames && selection.topicModeSubtopicNames.length > 0 && (
                   <div className="flex flex-wrap gap-1">
                     {selection.topicModeSubtopicNames.map((name) => (
                       <span key={name} className="text-[10px] px-1.5 py-0.5 rounded-md bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent)]/20">{name}</span>
                     ))}
                   </div>
                 )}
                 {selection.displayText && (!selection.topicNames || selection.topicNames.length === 0) && (
                   <p className="text-xs text-[var(--foreground-muted)]">{selection.displayText}</p>
                 )}
                 {selection.pageStart != null && selection.pageEnd != null && (
                   <p className="text-[10px] text-[var(--foreground-subtle)]">
                     صفحات {selection.pageStart} تا {selection.pageEnd}
                   </p>
                 )}
               </div>

                {!isClassVideo && (
                  <div>
                    <label className="text-xs text-[var(--foreground-muted)] mb-2 block">نوع فعالیت</label>
                    <div className="flex flex-wrap gap-2">
                      {ACTIVITIES.map(a => (
                        <button
                          key={a}
                          onClick={() => setActivities(v => v.includes(a) ? v.filter(x => x !== a) : [...v, a])}
                          className={`px-3 py-2.5 rounded-lg border text-sm transition-all ${
                            activities.includes(a)
                              ? `${activitySelectedStyle(a)} font-semibold`
                              : 'border-[var(--border)] text-[var(--foreground-muted)] hover:border-[var(--border-strong)]'
                          }`}
                        >
                          {a}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Test details */}
               {(activities.includes('تست آموزشی') || activities.includes('تست سنجشی')) && (
                 <div className="space-y-3 p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)]">
                   <p className="text-[10px] text-[var(--foreground-subtle)] font-medium">جزئیات تست (اختیاری)</p>

                   {/* Book name with suggestions */}
                   <div>
                     <label className="text-xs text-[var(--foreground-muted)] mb-1.5 block">نام کتاب</label>
                     {bookSuggestions.length > 0 && (
                       <div className="flex flex-wrap gap-1.5 mb-2">
                         {bookSuggestions.map((suggestion) => (
                           <button
                             key={suggestion}
                             type="button"
                             onClick={() => setBookName(suggestion)}
                             className={`px-2.5 py-1 rounded-md text-[11px] border transition-all ${
                               bookName === suggestion
                                 ? 'bg-[var(--accent-soft)] border-[var(--accent)]/30 text-[var(--accent)]'
                                 : 'bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--foreground-muted)] hover:border-[var(--border-strong)]'
                             }`}
                           >
                             {suggestion}
                           </button>
                         ))}
                       </div>
                     )}
                     <input
                       type="text"
                       value={bookName}
                       onChange={e => setBookName(e.target.value)}
                       placeholder="مثلاً زیست‌شناسی نشر الگو"
                       className="w-full h-10 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] px-3 text-[var(--foreground)] text-sm focus:border-[var(--accent)] focus:outline-none transition-colors"
                     />
                   </div>

                   {/* Test description */}
                   <div>
                     <label className="text-xs text-[var(--foreground-muted)] mb-1.5 block">توضیح شماره تست‌ها</label>
                     <input
                       type="text"
                       value={testDescription}
                       onChange={e => setTestDescription(e.target.value)}
                       placeholder="مثلاً تست‌های ۱۲۰ تا ۱۵۰"
                       className="w-full h-10 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] px-3 text-[var(--foreground)] text-sm focus:border-[var(--accent)] focus:outline-none transition-colors"
                     />
                   </div>
                 </div>
               )}

               {/* Optional completion metrics for class/video; required time for other activities. */}
               <div className="grid grid-cols-2 gap-3">
                 <label className="text-xs text-[var(--foreground-muted)]">
                   {isClassVideo ? 'زمان کلاس (دقیقه) - اختیاری' : 'زمان مطالعه (دقیقه) *'}
                    <input
                      type="text"
                      inputMode="numeric"
                      value={minutes}
                      onChange={e => setMinutes(normalizeNumericInput(e.target.value))}
                      placeholder="مثلاً ۶۰"
                      className="mt-1.5 w-full h-11 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] px-3 text-[var(--foreground)] text-sm focus:border-[var(--accent)] focus:outline-none transition-colors"
                      dir="ltr"
                    />
                   <div className="flex gap-1.5 mt-2">
                     {TIME_QUICK_PICKS.map((m) => (
                       <button
                         key={m}
                         type="button"
                         onClick={() => setMinutes(String(m))}
                         className={`btn-hover flex-1 h-8 rounded-lg text-[11px] font-medium border transition-all ${
                           Number(minutes) === m
                             ? 'bg-[var(--accent-soft)] border-[var(--accent)]/30 text-[var(--accent)]'
                             : 'border-[var(--border)] text-[var(--foreground-muted)]'
                         }`}
                       >
                         {m}
                       </button>
                     ))}
                   </div>
                 </label>
                 <label className="text-xs text-[var(--foreground-muted)]">
                   {isClassVideo ? 'تعداد تست - اختیاری' : 'تعداد تست هدف'}
                    <input
                      type="text"
                      inputMode="numeric"
                      value={tests}
                      onChange={e => setTests(normalizeNumericInput(e.target.value))}
                      placeholder="اختیاری"
                      className="mt-1.5 w-full h-11 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] px-3 text-[var(--foreground)] text-sm focus:border-[var(--accent)] focus:outline-none transition-colors"
                      dir="ltr"
                    />
                   <div className="flex gap-1.5 mt-2">
                     {TEST_QUICK_PICKS.map((t) => (
                       <button
                         key={t}
                         type="button"
                         onClick={() => setTests(String(t))}
                         className={`btn-hover flex-1 h-8 rounded-lg text-[11px] font-medium border transition-all ${
                           Number(tests) === t
                             ? 'bg-[var(--accent-soft)] border-[var(--accent)]/30 text-[var(--accent)]'
                             : 'border-[var(--border)] text-[var(--foreground-muted)]'
                         }`}
                       >
                         {t}
                       </button>
                     ))}
                   </div>
                 </label>
               </div>
             </div>
           )}
        </div>

        <DrawerFooter className="flex-col gap-2 pt-2">
          {step === 2 && (
            <>
              {/* Primary: continue to details */}
              {!isClassVideo && <button
                disabled={!canQuickSave}
                onClick={() => setStep(3)}
                className="w-full h-11 rounded-xl bg-[var(--accent)] text-[var(--bg-deep)] font-bold disabled:opacity-40 flex items-center justify-center gap-2"
              >
                ادامه
                <ChevronLeft className="w-4 h-4" />
              </button>}
              {isClassVideo && mode === 'create' && (
                <button disabled={!canQuickSave || saving} onClick={() => doSave(false)} className="w-full h-11 rounded-xl bg-[var(--accent)] text-[var(--bg-deep)] font-bold disabled:opacity-40">
                  {saving ? 'در حال ثبت...' : 'ثبت کلاس/ویدیو'}
                </button>
              )}
              {isClassVideo && (mode === 'complete-draft' || mode === 'edit') && (
                <button disabled={!canQuickSave || saving} onClick={() => doSave(true)} className="w-full h-11 rounded-xl bg-[var(--accent)] text-[var(--bg-deep)] font-bold disabled:opacity-40">
                  {saving ? 'در حال ذخیره...' : mode === 'complete-draft' ? 'ذخیره و آماده انجام' : 'ذخیره تغییرات کلاس'}
                </button>
              )}
              {/* Secondary: quick save as draft */}
                {mode === 'create' && allowDraftSave && canQuickSave && !isClassVideo && (
                <button
                  disabled={saving}
                  onClick={() => doSave(false)}
                  className="w-full h-10 rounded-xl border border-[var(--border)] text-[var(--foreground-muted)] text-sm hover:border-[var(--border-strong)] hover:text-[var(--foreground)] transition-all flex items-center justify-center gap-2"
                >
                  <Save className="w-3.5 h-3.5" />
                  ثبت اولیه (تکمیل بعدی)
                </button>
              )}
            </>
          )}

          {step === 3 && (
            <button
              disabled={!canFullSave || saving}
              onClick={() => doSave(true)}
              className="w-full h-11 rounded-xl bg-[var(--accent)] text-[var(--bg-deep)] font-bold disabled:opacity-40"
            >
              {saving ? 'در حال ثبت...' : mode === 'complete-draft' ? 'ذخیره و تکمیل جزئیات' : 'ثبت تسک'}
            </button>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
