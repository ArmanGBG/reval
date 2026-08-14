'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
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
  const [fieldType, setFieldType] = useState<FieldType>(
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
    if (isEdit && activityTypes.length === 0) {
      toast.error('لطفاً حداقل یک نوع فعالیت انتخاب کنید');
      return;
    }

    const subjectName = selection.subjectName || editTask?.subject || '';
    const subjectColor = selection.subjectColor || editTask?.subjectColor || 'var(--accent)';
    const topic = selection.displayText || null;

    if (isEdit && editTask) {
      await updateTask(editTask.id, {
        subjectId: selection.subjectId ?? editTask.subjectId ?? null,
        subject: subjectName,
        subjectColor,
        topic,
        fieldType,
        activityTypes,
        targetTimeMinutes,
        targetTestCount,
        date,
        chapterId: selection.chapterId ?? null,
        topicId: selection.topicId ?? null,
        topicIds: selection.topicIds ?? [],
        topicModeId: selection.topicModeId ?? null,
        curriculumMode: selection.curriculumMode ?? null,
        topicModeSubtopicIds: selection.topicModeSubtopicIds ?? [],
        pageStart: selection.pageStart ?? null,
        pageEnd: selection.pageEnd ?? null,
        teacherClassName: teacherClassName || null,
        sessionNumber: sessionNumber || null,
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
      ((selection.curriculumMode === 'BOOK' && !!selection.chapterId) ||
        (selection.curriculumMode === 'THEMATIC' && !!selection.topicModeId)) &&
      (!isEdit || activityTypes.length > 0),
    [studentInfoMissing, selection.subjectId, selection.subjectName, selection.curriculumMode, selection.chapterId, selection.topicModeId, activityTypes.length, isEdit],
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
        className="bg-[var(--bg-overlay)] border-[var(--border-strong)] text-[var(--foreground)] max-h-[90vh] overflow-y-auto rounded-2xl"
        dir="rtl"
      >
        <DialogHeader>
          <DialogTitle className="text-[var(--foreground)] text-base">
            {isEdit ? 'ویرایش وظیفه' : 'افزودن وظیفه جدید'}
          </DialogTitle>
          <DialogDescription className="text-[var(--foreground-muted)]">
            {isEdit
              ? 'جزئیات وظیفه را ویرایش کنید'
              : 'یک وظیفه جدید برای دانش‌آموز تعریف کنید'}
          </DialogDescription>
        </DialogHeader>

        {studentInfoMissing ? (
          <div className="surface-1 rounded-xl p-4 flex items-start gap-3 border border-[var(--warning)]/30">
            <AlertCircle className="w-5 h-5 text-[var(--warning)] shrink-0 mt-0.5" />
            <div className="text-sm text-[var(--foreground)]">
              <p className="font-semibold mb-1">اطلاعات دانش‌آموز ناقص است</p>
              <p className="text-[var(--foreground-muted)] text-xs">
                پایه یا رشته این دانش‌آموز در پروفایل ثبت نشده. لطفاً ابتدا
                پروفایل دانش‌آموز را تکمیل کنید تا بتوانید برای او وظیفه تعریف کنید.
              </p>
            </div>
          </div>
        ) : (
        <div className="space-y-4">
          {/* Step 1: Field Type */}
          <div>
            <label className="text-[11px] text-[var(--foreground-muted)] mb-1.5 block font-medium">
              حوزه
            </label>
            <div className="flex gap-2.5">
              {(['کنکور', 'نهایی'] as FieldType[]).map((ft) => (
                <button
                  key={ft}
                  onClick={() => {
                    setFieldType(ft);
                    setSelection({});
                  }}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium border btn-hover transition-all ${
                    fieldType === ft
                      ? 'bg-[var(--accent-soft)] border-[var(--accent)]/30 text-[var(--accent)]'
                      : 'bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                  }`}
                >
                  {ft}
                </button>
              ))}
            </div>
          </div>

          {/* Quick create stops at subject; edit retains the full form. */}
          <div>
            <label className="text-[11px] text-[var(--foreground-muted)] mb-1.5 block font-medium">
               {isEdit ? 'درس و مبحث' : 'درس'}
            </label>
            <TaskSubjectPicker
              fieldType={fieldType}
              grade={studentGrade}
              major={studentMajor}
              value={selection}
              onChange={setSelection}
            />
          </div>

          {isEdit && <>

          {/* Activity Types */}
          <div>
            <label className="text-[11px] text-[var(--foreground-muted)] mb-2 block font-medium">
              نوع فعالیت
            </label>
            <div className="grid grid-cols-2 gap-2">
              {ALL_ACTIVITY_TYPES.map((act) => (
                <label
                  key={act}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border cursor-pointer nav-item-hover ${
                    activityTypes.includes(act)
                      ? 'bg-[var(--accent-soft)] border-[var(--accent)]/30 text-[var(--accent)]'
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
          </div>

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

          <div className="grid grid-cols-2 gap-3">
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
          </>}
        </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <DialogClose asChild>
            <button className="px-4 py-2.5 text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] btn-hover rounded-lg">
              انصراف
            </button>
          </DialogClose>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="px-6 py-2.5 bg-[var(--accent)] text-[var(--bg-deep)] rounded-lg text-sm font-semibold glow-hover disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isEdit ? 'ذخیره تغییرات' : 'افزودن وظیفه'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
