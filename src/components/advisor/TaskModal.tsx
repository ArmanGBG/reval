'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { AlertCircle, Check, ClipboardPlus, UserRound } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import {
  Task,
  FieldType,
  ActivityType,
} from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import {
  TaskSubjectPicker,
  TaskSelection,
} from '@/components/shared/TaskSubjectPicker';
import { toast } from 'sonner';
import { ModalInput } from './advisor-ui';
import { ALL_ACTIVITY_TYPES } from './advisor-helpers';
import { activitySelectedStyle } from '@/lib/activity-styles';
import { FIELD_TYPE_STYLES } from '@/components/shared/FieldTypeBadge';
import { buildClassDraft, classSessionDetailsComplete, isClassTask } from '@/lib/class-task';

const TIME_QUICK_PICKS = [60, 90, 120];
const TEST_QUICK_PICKS = [20, 30, 40];

// ===== Task Modal (Add / Edit) — New Flow (Task 12-c):
// field type → TaskSubjectPicker (subject + chapter/topic/topicMode) →
// activity types → metrics. Uses the new shared picker so the student
// and advisor UX are identical.
export function TaskModal({
  open,
  onOpenChange,
  studentId,
  editTask,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  editTask: Task | null;
}) {
  const { addTask, updateTask, selectedStudentId, advisorStudents, user } = useAppStore();
  const isEdit = editTask !== null;

  // Find the selected student to read their grade + major (from real DB students).
  // NO fallback — if the student isn't found or has no grade/major, we block
  // task creation rather than guessing (which would show wrong subjects).
  const student = advisorStudents.find(
    (s) => s.id === (selectedStudentId || studentId),
  );
  const studentGrade = student?.grade;
  const studentMajor = student?.major;
  const studentInfoMissing = !studentGrade || !studentMajor;

  // Form state — new flow
  const [fieldType, setFieldType] = useState<FieldType | null>(
    editTask?.fieldType ?? 'کنکور',
  );
  const [selection, setSelection] = useState<TaskSelection>(
    editTask
      ? {
          subjectId: editTask.subjectId ?? undefined,
          subjectName: editTask.subject,
          subjectColor: editTask.subjectColor,
          displayText: editTask.topic && editTask.topic !== 'عمومی' ? editTask.topic : undefined,
          chapterId: editTask.chapterId ?? undefined,
          topicId: editTask.topicId ?? undefined,
          topicIds: editTask.topicIds ?? [],
          topicModeId: editTask.topicModeId ?? undefined,
          curriculumMode: editTask.curriculumMode ?? undefined,
          topicModeSubtopicIds: editTask.topicModeSubtopicIds ?? [],
        }
      : {},
  );
  const [activityTypes, setActivityTypes] = useState<ActivityType[]>(
    editTask?.activityTypes ?? [],
  );
  const [targetTimeMinutes, setTargetTimeMinutes] = useState(
    editTask?.targetTimeMinutes ?? 60,
  );
  const [targetTestCount, setTargetTestCount] = useState(
    editTask?.targetTestCount ?? 20,
  );
  const [date, setDate] = useState(
    editTask?.date ?? new Date().toISOString().split('T')[0],
  );
  const [teacherClassName, setTeacherClassName] = useState(editTask?.teacherClassName ?? '');
  const [sessionNumber, setSessionNumber] = useState(editTask?.sessionNumber ?? '');
  const [bookName, setBookName] = useState(editTask?.bookName ?? '');
  const [testDescription, setTestDescription] = useState(editTask?.testDescription ?? '');
  const [teacherClassSuggestions, setTeacherClassSuggestions] = useState<string[]>([]);
  const [bookSuggestions, setBookSuggestions] = useState<string[]>([]);
  const isClassVideo = selection.contentType === 'CLASS_VIDEO' || Boolean(editTask && isClassTask(editTask));

  // Reset form (called on dialog close so the next open starts fresh).
  const resetForm = useCallback(() => {
    setFieldType(editTask?.fieldType ?? 'کنکور');
    setSelection(
      editTask
        ? {
            subjectId: editTask.subjectId ?? undefined,
            subjectName: editTask.subject,
            subjectColor: editTask.subjectColor,
            displayText:
              editTask.topic && editTask.topic !== 'عمومی'
                ? editTask.topic
                : undefined,
            chapterId: editTask.chapterId ?? undefined,
            topicId: editTask.topicId ?? undefined,
            topicIds: editTask.topicIds ?? [],
            topicModeId: editTask.topicModeId ?? undefined,
            curriculumMode: editTask.curriculumMode ?? undefined,
            topicModeSubtopicIds: editTask.topicModeSubtopicIds ?? [],
          }
        : {},
    );
    setActivityTypes(editTask?.activityTypes ?? []);
    setTargetTimeMinutes(editTask?.targetTimeMinutes ?? 60);
    setTargetTestCount(editTask?.targetTestCount ?? 20);
    setDate(editTask?.date ?? new Date().toISOString().split('T')[0]);
    setTeacherClassName(editTask?.teacherClassName ?? '');
    setSessionNumber(editTask?.sessionNumber ?? '');
    setBookName(editTask?.bookName ?? '');
    setTestDescription(editTask?.testDescription ?? '');
    setTeacherClassSuggestions([]);
    setBookSuggestions([]);
  }, [editTask]);

  const toggleActivity = (act: ActivityType) => {
    setActivityTypes((prev) =>
      prev.includes(act) ? prev.filter((a) => a !== act) : [...prev, act],
    );
  };

  // Fetch suggestions when subject or activity types change (edit mode only)
  useEffect(() => {
    if (!isEdit || !selection.subjectId) {
      setTeacherClassSuggestions([]);
      setBookSuggestions([]);
      return;
    }

    const hasClassVideo = activityTypes.includes('کلاس/ویدیو');
    const hasTestDetails = activityTypes.includes('تست آموزشی') || activityTypes.includes('تست سنجشی');

    const fetchSuggestions = async () => {
      const promises: Promise<void>[] = [];
      if (hasClassVideo) {
        promises.push(
          fetch(`/api/task-suggestions?studentId=${encodeURIComponent(studentId)}&subjectId=${encodeURIComponent(selection.subjectId!)}&type=teacherClass`)
            .then(r => r.ok ? r.json() : { values: [] })
            .then(data => setTeacherClassSuggestions(data.values || []))
            .catch(() => setTeacherClassSuggestions([]))
        );
      }
      if (hasTestDetails) {
        promises.push(
          fetch(`/api/task-suggestions?studentId=${encodeURIComponent(studentId)}&subjectId=${encodeURIComponent(selection.subjectId!)}&type=book`)
            .then(r => r.ok ? r.json() : { values: [] })
            .then(data => setBookSuggestions(data.values || []))
            .catch(() => setBookSuggestions([]))
        );
      }
      if (promises.length === 0) {
        setTeacherClassSuggestions([]);
        setBookSuggestions([]);
      }
      await Promise.all(promises);
    };

    fetchSuggestions();
  }, [isEdit, selection.subjectId, activityTypes, studentId]);

  const handleSubmit = async () => {
    if (!selection.subjectId && !selection.subjectName) {
      toast.error('لطفاً درس را انتخاب کنید');
      return;
    }
    if (isEdit && !isClassVideo && activityTypes.length === 0) {
      toast.error('لطفاً حداقل یک نوع فعالیت انتخاب کنید');
      return;
    }

    const subjectName = selection.subjectName || editTask?.subject || '';
    const subjectColor = selection.subjectColor || editTask?.subjectColor || 'var(--accent)';
    const topic = selection.displayText || null;

    if (isClassVideo && !isEdit) {
      if (!classSessionDetailsComplete(selection.teacherClassName, selection.sessionNumber)) {
        toast.error('نام کلاس و شماره جلسه را وارد کنید');
        return;
      }
      await addTask(buildClassDraft({
        id: crypto.randomUUID(),
        studentId,
        subjectId: selection.subjectId!,
        subject: subjectName,
        subjectColor,
        teacherClassName: selection.teacherClassName!,
        sessionNumber: selection.sessionNumber!,
        date,
        order: 0,
        createdBy: 'advisor',
        createdById: user?.id ?? null,
      }));
      toast.success('کلاس/ویدیو به‌صورت پیش‌نویس اضافه شد');
      onOpenChange(false);
      return;
    }

    if (isEdit && editTask) {
      await updateTask(editTask.id, {
        subjectId: selection.subjectId ?? editTask.subjectId ?? null,
        fieldType: isClassVideo ? editTask.fieldType : fieldType,
        activityTypes: isClassVideo ? ['کلاس/ویدیو'] : activityTypes,
        targetTimeMinutes: isClassVideo ? (targetTimeMinutes || null) : targetTimeMinutes,
        targetTestCount: isClassVideo ? (targetTestCount || null) : targetTestCount,
        date,
        chapterId: selection.chapterId ?? null,
        topicId: selection.topicId ?? null,
        topicIds: selection.topicIds ?? [],
        topicModeId: selection.topicModeId ?? null,
        curriculumMode: selection.curriculumMode ?? null,
        topicModeSubtopicIds: selection.topicModeSubtopicIds ?? [],
        pageStart: selection.pageStart ?? null,
        pageEnd: selection.pageEnd ?? null,
        teacherClassName: isClassVideo ? (selection.teacherClassName || teacherClassName || null) : teacherClassName || null,
        sessionNumber: isClassVideo ? (selection.sessionNumber || sessionNumber || null) : sessionNumber || null,
        bookName: bookName || null,
        testDescription: testDescription || null,
        detailsCompleted: true,
        status: 'PENDING',
        completed: null,
      });
      toast.success('وظیفه با موفقیت ویرایش شد');
    } else {
      const newTask: Task = {
        id: crypto.randomUUID(),
        studentId,
        subject: subjectName,
        subjectColor,
        topic,
        fieldType,
        subjectId: selection.subjectId ?? null,
        activityTypes: null,
        targetTimeMinutes: null,
        actualTimeMinutes: null,
        targetTestCount: null,
        actualTestCount: null,
        status: 'DRAFT',
        completed: null,
        date,
        order: 0,
        createdBy: 'advisor',
        createdById: user?.id || null,
        chapterId: selection.chapterId || null,
        topicId: selection.topicId || null,
        topicIds: selection.topicIds ?? [],
        topicModeId: selection.topicModeId || null,
        curriculumMode: selection.curriculumMode ?? null,
        topicModeSubtopicIds: selection.topicModeSubtopicIds ?? [],
        pageStart: selection.pageStart ?? null,
        pageEnd: selection.pageEnd ?? null,
        detailsCompleted: false,
      };
      await addTask(newTask);
      toast.success('وظیفه جدید با موفقیت اضافه شد');
    }
    onOpenChange(false);
  };

  const canSubmit = useMemo(
    () =>
      !studentInfoMissing &&
      (!!selection.subjectId || !!selection.subjectName) &&
      (isClassVideo
        ? classSessionDetailsComplete(selection.teacherClassName, selection.sessionNumber)
        : ((selection.curriculumMode === 'BOOK' && !!selection.chapterId) ||
        (selection.curriculumMode === 'THEMATIC' && !!selection.topicModeId)) &&
      (!isEdit || activityTypes.length > 0)),
    [isClassVideo, studentInfoMissing, selection.subjectId, selection.subjectName, selection.curriculumMode, selection.chapterId, selection.topicModeId, selection.teacherClassName, selection.sessionNumber, activityTypes.length, isEdit],
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) resetForm();
        onOpenChange(v);
      }}
    >
      <DialogContent
        className="max-h-[92dvh] gap-0 overflow-hidden rounded-2xl border-[var(--border-strong)] bg-[var(--bg-overlay)] p-0 text-[var(--foreground)] shadow-2xl sm:max-w-xl"
        dir="rtl"
      >
        <DialogHeader className="relative overflow-hidden border-b border-[var(--border)] bg-[var(--bg-elevated)] px-5 py-5 pr-14 text-right sm:px-6 sm:pr-14">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_0%,color-mix(in_srgb,var(--accent)_12%,transparent),transparent_48%)]" />
          <div className="relative flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-[var(--accent)]/20 bg-[var(--accent-soft)] text-[var(--accent)]">
              <ClipboardPlus className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-base font-bold leading-6 text-[var(--foreground)] sm:text-lg">
                {isEdit ? 'ویرایش وظیفه' : 'افزودن وظیفه جدید'}
              </DialogTitle>
              <DialogDescription className="mt-1 text-xs leading-5 text-[var(--foreground-muted)]">
                {isEdit
                  ? 'جزئیات وظیفه را ویرایش و به‌روزرسانی کنید'
                  : 'درس را انتخاب کنید؛ جزئیات تکمیلی بعداً قابل ثبت است'}
              </DialogDescription>
            </div>
          </div>
          {student && (
            <div className="relative mt-4 flex w-fit items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-overlay)]/70 px-3 py-1.5 text-[11px] text-[var(--foreground-muted)]">
              <UserRound className="size-3.5 text-[var(--accent)]" aria-hidden="true" />
              <span>برای</span>
              <span className="font-semibold text-[var(--foreground)]">{student.name}</span>
              <span className="text-[var(--foreground-subtle)]">·</span>
              <span>{studentGrade}، {studentMajor}</span>
            </div>
          )}
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 custom-scrollbar sm:px-6">
        {studentInfoMissing ? (
          <div className="flex items-start gap-3 rounded-xl border border-[var(--warning)]/30 bg-[var(--warning)]/5 p-4">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[var(--warning)]/10 text-[var(--warning)]">
              <AlertCircle className="size-5" aria-hidden="true" />
            </span>
            <div className="text-sm text-[var(--foreground)]">
              <p className="font-semibold mb-1">اطلاعات دانش‌آموز ناقص است</p>
              <p className="text-xs leading-6 text-[var(--foreground-muted)]">
                پایه یا رشته این دانش‌آموز در پروفایل ثبت نشده. لطفاً ابتدا
                پروفایل دانش‌آموز را تکمیل کنید تا بتوانید برای او وظیفه تعریف کنید.
              </p>
            </div>
          </div>
        ) : (
        <div className="space-y-5">
          {/* Step 1: Field Type */}
           {!isClassVideo && <section className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)]/55 p-3.5 sm:p-4">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[10px] font-bold text-[var(--accent)]">۱</span>
              <div>
                <p className="text-xs font-semibold text-[var(--foreground)]">انتخاب حوزه</p>
                <p className="mt-0.5 text-[10px] text-[var(--foreground-subtle)]">نوع برنامه‌ریزی این وظیفه را مشخص کنید</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {(['کنکور', 'نهایی'] as FieldType[]).map((ft) => (
                <button
                  key={ft}
                  type="button"
                  onClick={() => {
                    setFieldType(ft);
                    setSelection({});
                  }}
                  aria-pressed={fieldType === ft}
                  className={`relative flex min-h-11 items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
                    fieldType === ft
                      ? FIELD_TYPE_STYLES[ft].selected
                      : 'border-[var(--border)] bg-[var(--bg-overlay)] text-[var(--foreground-muted)] hover:border-[var(--border-strong)] hover:text-[var(--foreground)]'
                  }`}
                >
                  {fieldType === ft && <Check className="size-3.5" aria-hidden="true" />}
                  {ft}
                </button>
              ))}
            </div>
           </section>}

          {/* Quick create stops at subject; edit retains the full form. */}
          <section className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)]/55 p-3.5 sm:p-4">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[10px] font-bold text-[var(--accent)]">{isClassVideo ? '۱' : '۲'}</span>
              <div>
                <p className="text-xs font-semibold text-[var(--foreground)]">{isEdit ? 'درس و مبحث' : 'انتخاب درس'}</p>
                <p className="mt-0.5 text-[10px] text-[var(--foreground-subtle)]">از فهرست، محتوای موردنظر را انتخاب کنید</p>
              </div>
            </div>
           <TaskSubjectPicker
              fieldType={fieldType}
              grade={studentGrade}
              major={studentMajor}
              value={selection}
              onChange={setSelection}
              onClassVideoSelected={() => { setFieldType(null); setActivityTypes(['کلاس/ویدیو']); }}
              onClassVideoExited={() => {
                setActivityTypes([]);
                setTeacherClassName('');
                setSessionNumber('');
                setFieldType(null);
              }}
              onFieldTypeChange={(nextFieldType, nextSelection) => {
                setFieldType(nextFieldType);
                if (nextSelection) setSelection(nextSelection);
              }}
              allowClassCurriculumLink={isEdit}
              teacherClassSuggestions={teacherClassSuggestions}
            />
          </section>

          {isEdit && !isClassVideo && <>

          {/* Activity Types */}
           <section className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)]/55 p-3.5 sm:p-4">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[10px] font-bold text-[var(--accent)]">۳</span>
              <div>
                <p className="text-xs font-semibold text-[var(--foreground)]">نوع فعالیت</p>
                <p className="mt-0.5 text-[10px] text-[var(--foreground-subtle)]">یک یا چند فعالیت را برای این وظیفه انتخاب کنید</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {ALL_ACTIVITY_TYPES.map((act) => (
                <label
                  key={act}
                  className={`flex min-h-11 items-center gap-2 rounded-lg border px-3 py-2.5 cursor-pointer transition-all ${
                    activityTypes.includes(act)
                      ? activitySelectedStyle(act)
                      : 'bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                  }`}
                >
                  <Checkbox
                    checked={activityTypes.includes(act)}
                    onCheckedChange={() => toggleActivity(act)}
                    className="border-[var(--border-strong)] data-[state=checked]:bg-[var(--accent)] data-[state=checked]:border-[var(--accent)]"
                  />
                  <span className="text-sm">{act}</span>
                </label>
              ))}
            </div>
          </section>

          {/* Class/Video details */}
          {activityTypes.includes('کلاس/ویدیو') && (
            <div className="space-y-3 p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)]">
              <p className="text-[10px] text-[var(--foreground-subtle)] font-medium">جزئیات کلاس/ویدیو (اختیاری)</p>

              <div>
                <label className="text-[11px] text-[var(--foreground-muted)] mb-1.5 block">نام دبیر و کلاس</label>
                {teacherClassSuggestions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {teacherClassSuggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => setTeacherClassName(suggestion)}
                        className={`px-2.5 py-1 rounded-md text-[11px] border transition-all ${
                          teacherClassName === suggestion
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
                  value={teacherClassName}
                  onChange={e => setTeacherClassName(e.target.value)}
                  placeholder="مثلاً استاد محمدی — کلاس ۱۰"
                  className="w-full h-10 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] px-3 text-[var(--foreground)] text-sm focus:border-[var(--accent)] focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="text-[11px] text-[var(--foreground-muted)] mb-1.5 block">شماره جلسه</label>
                <input
                  type="text"
                  value={sessionNumber}
                  onChange={e => setSessionNumber(e.target.value)}
                  placeholder="مثلاً جلسه ۱۲"
                  className="w-full h-10 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] px-3 text-[var(--foreground)] text-sm focus:border-[var(--accent)] focus:outline-none transition-colors"
                />
              </div>
            </div>
          )}

          {/* Test details */}
          {(activityTypes.includes('تست آموزشی') || activityTypes.includes('تست سنجشی')) && (
            <div className="space-y-3 p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)]">
              <p className="text-[10px] text-[var(--foreground-subtle)] font-medium">جزئیات تست (اختیاری)</p>

              <div>
                <label className="text-[11px] text-[var(--foreground-muted)] mb-1.5 block">نام کتاب</label>
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

              <div>
                <label className="text-[11px] text-[var(--foreground-muted)] mb-1.5 block">توضیح شماره تست‌ها</label>
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

          <section className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)]/55 p-3.5 sm:p-4">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[10px] font-bold text-[var(--accent)]">۴</span>
            <div>
              <p className="text-xs font-semibold text-[var(--foreground)]">هدف‌گذاری</p>
              <p className="mt-0.5 text-[10px] text-[var(--foreground-subtle)]">زمان و تعداد تست مورد انتظار را مشخص کنید</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <ModalInput
                label="زمان هدف (دقیقه)"
                type="number"
                value={targetTimeMinutes}
                onChange={(e) => setTargetTimeMinutes(Number(e.target.value))}
                min={1}
              />
              <div className="flex gap-1.5 mt-2">
                {TIME_QUICK_PICKS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setTargetTimeMinutes(m)}
                    className={`btn-hover flex-1 h-8 rounded-lg text-[11px] font-medium border transition-all ${
                      targetTimeMinutes === m
                        ? 'bg-[var(--accent-soft)] border-[var(--accent)]/30 text-[var(--accent)]'
                        : 'border-[var(--border)] text-[var(--foreground-muted)]'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <ModalInput
                label="تعداد تست هدف"
                type="number"
                value={targetTestCount}
                onChange={(e) => setTargetTestCount(Number(e.target.value))}
                min={0}
              />
              <div className="flex gap-1.5 mt-2">
                {TEST_QUICK_PICKS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTargetTestCount(t)}
                    className={`btn-hover flex-1 h-8 rounded-lg text-[11px] font-medium border transition-all ${
                      targetTestCount === t
                        ? 'bg-[var(--accent-soft)] border-[var(--accent)]/30 text-[var(--accent)]'
                        : 'border-[var(--border)] text-[var(--foreground-muted)]'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <ModalInput
            label="تاریخ"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          </section>
          </>}
        </div>
        )}
        </div>

        <DialogFooter className="border-t border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3 sm:px-6">
          <DialogClose asChild>
            <button type="button" className="h-11 rounded-lg px-4 text-sm text-[var(--foreground-muted)] transition-colors hover:bg-[var(--bg-overlay)] hover:text-[var(--foreground)]">
              انصراف
            </button>
          </DialogClose>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="flex h-11 items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-6 text-sm font-semibold text-[var(--bg-deep)] transition-all hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-elevated)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Check className="size-4" aria-hidden="true" />
            {isEdit ? 'ذخیره تغییرات' : 'افزودن وظیفه'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
