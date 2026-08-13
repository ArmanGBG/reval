'use client';

import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { FieldType, ActivityType, Task } from '@/lib/types';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/components/ui/drawer';
import { TaskSubjectPicker, TaskSelection } from '@/components/shared/TaskSubjectPicker';
import { useAppStore } from '@/lib/store';
import { useCurrentStudentId } from '@/lib/student-utils';
import { AuthError } from '@/lib/api-client';
import { ChevronLeft, Save, ArrowLeft } from 'lucide-react';
import { FieldTypeBadge, FIELD_TYPE_STYLES } from '@/components/shared/FieldTypeBadge';

const ACTIVITIES: ActivityType[] = ['مطالعه', 'مرور', 'تست آموزشی', 'تست سنجشی', 'کلاس/ویدیو'];

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
export default function ManualEntrySheet({ open, onOpenChange, selectedDate, existingTaskCount, onSubmit, onSaved, studentId: studentIdProp, grade, major, createdBy = 'student', createdById = null, mode = 'create', initialTask = null }: {
  open: boolean; onOpenChange: (open: boolean) => void; selectedDate: string;
  existingTaskCount: number; onSubmit: (task: Task) => Promise<void> | void;
  studentId?: string; grade?: string; major?: string; createdBy?: 'student' | 'advisor'; createdById?: string | null;
  mode?: 'create' | 'complete-draft'; initialTask?: Task | null;
  onSaved?: (task: Task) => void;
}) {
  const { user } = useAppStore();
  const currentStudentId = useCurrentStudentId();
  const studentId = studentIdProp ?? currentStudentId;

  // === Step state ===
  // 1 = field type, 2 = subject picker, 3 = details (activity/time)
  const [step, setStep] = useState<1 | 2 | 3>(mode === 'complete-draft' ? 2 : 1);
  const initialSelection = useCallback((): TaskSelection => initialTask ? ({
    subjectId: initialTask.subjectId ?? undefined,
    subjectName: initialTask.subject,
    subjectColor: initialTask.subjectColor,
    chapterId: initialTask.chapterId ?? undefined,
    topicId: initialTask.topicId ?? undefined,
    topicIds: initialTask.topicIds ?? (initialTask.topicId ? [initialTask.topicId] : []),
    topicNames: initialTask.topics?.map((topic) => `گفتار ${topic.topicNo}: ${topic.title}`),
    topicModeId: initialTask.topicModeId ?? undefined,
    displayText: initialTask.topic ?? undefined,
    pageStart: initialTask.pageStart ?? undefined,
    pageEnd: initialTask.pageEnd ?? undefined,
  }) : ({}), [initialTask]);
  const [fieldType, setFieldType] = useState<FieldType>(initialTask?.fieldType ?? 'کنکور');
  const [selection, setSelection] = useState<TaskSelection>(initialSelection);
  const [activities, setActivities] = useState<ActivityType[]>(initialTask?.activityTypes ?? []);
  const [minutes, setMinutes] = useState(initialTask?.targetTimeMinutes == null ? '' : String(initialTask.targetTimeMinutes));
  const [tests, setTests] = useState(initialTask?.targetTestCount == null ? '' : String(initialTask.targetTestCount));
  const [saving, setSaving] = useState(false);

  const reset = useCallback(() => {
    setStep(mode === 'complete-draft' ? 2 : 1);
    setFieldType(initialTask?.fieldType ?? 'کنکور');
    setSelection(initialSelection());
    setActivities(initialTask?.activityTypes ?? []);
    setMinutes(initialTask?.targetTimeMinutes == null ? '' : String(initialTask.targetTimeMinutes));
    setTests(initialTask?.targetTestCount == null ? '' : String(initialTask.targetTestCount));
  }, [initialTask, initialSelection, mode]);

  useEffect(() => { if (open) reset(); }, [open, reset]);

  // Can quick-save once subject is selected
  const canQuickSave = !!selection.subjectId && !!selection.subjectName && !!selection.chapterId;

  // Can full-save once subject + activity + time are set
  const canFullSave = canQuickSave && activities.length > 0 && Number(minutes) > 0;

  // Build task object from current state
  const buildTask = (detailsCompleted: boolean): Task => ({
    id: initialTask?.id ?? crypto.randomUUID(),
    studentId,
    subjectId: selection.subjectId!,
    subject: selection.subjectName!,
    subjectColor: selection.subjectColor ?? 'var(--accent)',
    topic: selection.displayText ?? null,
    fieldType,
    activityTypes: detailsCompleted ? activities : null,
    targetTimeMinutes: detailsCompleted ? Number(minutes) : null,
    actualTimeMinutes: null,
    targetTestCount: detailsCompleted ? (tests ? Number(tests) : 0) : null,
    actualTestCount: null,
    status: detailsCompleted ? 'PENDING' : 'DRAFT',
    completed: null,
    date: initialTask?.date ?? selectedDate,
    order: initialTask?.order ?? existingTaskCount + 1,
    createdBy: initialTask?.createdBy ?? createdBy,
    createdById: initialTask?.createdById ?? createdById,
    chapterId: selection.chapterId ?? null,
    topicId: selection.topicId ?? null,
    topicIds: selection.topicIds ?? [],
    topicModeId: selection.topicModeId ?? null,
    pageStart: selection.pageStart ?? null,
    pageEnd: selection.pageEnd ?? null,
    detailsCompleted,
  });

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
    if (step === 2 && selection.subjectId) {
      setSelection({});
      return;
    }
    setStep((current) => (current - 1) as 1 | 2 | 3);
  };

  // Step labels
  const stepLabel = step === 1 ? 'انتخاب حوزه' : step === 2 ? 'انتخاب درس' : 'جزئیات مطالعه';
  const stepIndicator = (
    <div className="flex items-center justify-center gap-1.5 mb-2">
      {[1, 2, 3].map(s => (
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
    <Drawer open={open} onOpenChange={v => { if (!v) reset(); onOpenChange(v); }} direction="bottom">
      <DrawerContent className="surface-2 border-t border-[var(--border-strong)] text-[var(--foreground)] max-h-[88vh]">
        <DrawerHeader className="text-right pb-2">
          <div className="flex items-center justify-between">
            <div>
              <DrawerTitle>افزودن تسک</DrawerTitle>
              <p className="text-xs text-[var(--foreground-subtle)] mt-0.5">{stepLabel}</p>
            </div>
            {step > 1 && (
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
          {/* ===== Step 1: Field Type ===== */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-[var(--foreground-muted)]">نوع برنامه‌ریزی رو انتخاب کن:</p>
              <div className="flex gap-3">
                {(['کنکور', 'نهایی'] as FieldType[]).map(ft => (
                  <button
                    key={ft}
                    onClick={() => { setFieldType(ft); setSelection({}); }}
                    className={`flex-1 py-4 rounded-xl border text-center transition-all ${
                      fieldType === ft
                        ? `${FIELD_TYPE_STYLES[ft].selected} font-bold scale-[1.02]`
                        : 'border-[var(--border)] hover:border-[var(--border-strong)] text-[var(--foreground-muted)]'
                    }`}
                  >
                    <span className="block text-sm mt-1">{ft}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ===== Step 2: Subject Picker ===== */}
          {step === 2 && (
            <div className="space-y-3">
              {/* Field type badge */}
              <div className="flex items-center gap-2">
                <FieldTypeBadge value={fieldType} />
              </div>
              <TaskSubjectPicker
                key={`${fieldType}:${selection.subjectId ?? 'subjects'}`}
                fieldType={fieldType}
                 grade={grade ?? user?.grade ?? 'دوازدهم'}
                 major={major ?? user?.major ?? 'تجربی'}
                value={selection}
                onChange={setSelection}
              />
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
                  <FieldTypeBadge value={fieldType} className="mr-auto" />
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
                {selection.displayText && (!selection.topicNames || selection.topicNames.length === 0) && (
                  <p className="text-xs text-[var(--foreground-muted)]">{selection.displayText}</p>
                )}
                {selection.pageStart != null && selection.pageEnd != null && (
                  <p className="text-[10px] text-[var(--foreground-subtle)]">
                    صفحات {selection.pageStart} تا {selection.pageEnd}
                  </p>
                )}
              </div>

              {/* Activity types */}
              <div>
                <label className="text-xs text-[var(--foreground-muted)] mb-2 block">نوع فعالیت</label>
                <div className="flex flex-wrap gap-2">
                  {ACTIVITIES.map(a => (
                    <button
                      key={a}
                      onClick={() => setActivities(v => v.includes(a) ? v.filter(x => x !== a) : [...v, a])}
                      className={`px-3 py-2.5 rounded-lg border text-sm transition-all ${
                        activities.includes(a)
                          ? 'bg-[var(--accent)] text-[var(--bg-deep)] border-[var(--accent)] font-semibold'
                          : 'border-[var(--border)] text-[var(--foreground-muted)] hover:border-[var(--border-strong)]'
                      }`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time + Test count */}
              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs text-[var(--foreground-muted)]">
                  زمان مطالعه (دقیقه) *
                  <input
                    type="number"
                    min="1"
                    value={minutes}
                    onChange={e => setMinutes(e.target.value)}
                    placeholder="مثلاً ۶۰"
                    className="mt-1.5 w-full h-11 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] px-3 text-[var(--foreground)] text-sm focus:border-[var(--accent)] focus:outline-none transition-colors"
                    dir="ltr"
                  />
                </label>
                <label className="text-xs text-[var(--foreground-muted)]">
                  تعداد تست هدف
                  <input
                    type="number"
                    min="0"
                    value={tests}
                    onChange={e => setTests(e.target.value)}
                    placeholder="اختیاری"
                    className="mt-1.5 w-full h-11 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] px-3 text-[var(--foreground)] text-sm focus:border-[var(--accent)] focus:outline-none transition-colors"
                    dir="ltr"
                  />
                </label>
              </div>
            </div>
          )}
        </div>

        <DrawerFooter className="flex-col gap-2 pt-2">
          {step === 1 && (
            <button
              onClick={() => setStep(2)}
              className="w-full h-11 rounded-xl bg-[var(--accent)] text-[var(--bg-deep)] font-bold flex items-center justify-center gap-2"
            >
              ادامه
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}

          {step === 2 && (
            <>
              {/* Primary: continue to details */}
              <button
                disabled={!canQuickSave}
                onClick={() => setStep(3)}
                className="w-full h-11 rounded-xl bg-[var(--accent)] text-[var(--bg-deep)] font-bold disabled:opacity-40 flex items-center justify-center gap-2"
              >
                ادامه
                <ChevronLeft className="w-4 h-4" />
              </button>
              {/* Secondary: quick save as draft */}
               {mode === 'create' && canQuickSave && (
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
