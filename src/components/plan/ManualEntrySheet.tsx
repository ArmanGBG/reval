'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { FieldType, ActivityType, Task } from '@/lib/types';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/components/ui/drawer';
import { TaskSubjectPicker, TaskSelection } from '@/components/shared/TaskSubjectPicker';
import { useAppStore } from '@/lib/store';
import { useCurrentStudentId } from '@/lib/student-utils';
import { AuthError } from '@/lib/api-client';
import { ChevronLeft, Save, ArrowLeft } from 'lucide-react';

const ACTIVITIES: ActivityType[] = ['مطالعه', 'مرور', 'تست آموزشی', 'تست سنجشی'];

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
export default function ManualEntrySheet({ open, onOpenChange, selectedDate, existingTaskCount, onSubmit }: {
  open: boolean; onOpenChange: (open: boolean) => void; selectedDate: string;
  existingTaskCount: number; onSubmit: (task: Task) => Promise<void> | void;
}) {
  const { user } = useAppStore();
  const studentId = useCurrentStudentId();

  // === Step state ===
  // 1 = field type, 2 = subject picker, 3 = details (activity/time)
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [fieldType, setFieldType] = useState<FieldType>('کنکور');
  const [selection, setSelection] = useState<TaskSelection>({});
  const [activities, setActivities] = useState<ActivityType[]>([]);
  const [minutes, setMinutes] = useState('');
  const [tests, setTests] = useState('');
  const [saving, setSaving] = useState(false);

  const reset = useCallback(() => {
    setStep(1);
    setFieldType('کنکور');
    setSelection({});
    setActivities([]);
    setMinutes('');
    setTests('');
  }, []);

  // Can quick-save once subject is selected
  const canQuickSave = !!selection.subjectId && !!selection.subjectName;

  // Can full-save once subject + activity + time are set
  const canFullSave = canQuickSave && activities.length > 0 && Number(minutes) > 0;

  // Build task object from current state
  const buildTask = (detailsCompleted: boolean): Task => ({
    id: crypto.randomUUID(),
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
    completed: null,
    date: selectedDate,
    order: existingTaskCount + 1,
    createdBy: 'student',
    chapterId: selection.chapterId ?? null,
    topicId: selection.topicId ?? null,
    topicModeId: selection.topicModeId ?? null,
    pageStart: null,
    pageEnd: null,
    detailsCompleted,
  });

  const doSave = async (detailsCompleted: boolean) => {
    setSaving(true);
    try {
      await onSubmit(buildTask(detailsCompleted));
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
                onClick={() => setStep(s => (s - 1) as 1 | 2 | 3)}
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
                        ? 'bg-[var(--accent)] text-[var(--bg-deep)] border-[var(--accent)] font-bold scale-[1.02]'
                        : 'border-[var(--border)] hover:border-[var(--border-strong)] text-[var(--foreground-muted)]'
                    }`}
                  >
                    <span className="text-lg font-bold">{ft === 'کنکور' ? '🎯' : '📋'}</span>
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
                <span className={`text-[10px] px-2 py-1 rounded-md font-medium ${
                  fieldType === 'کنکور'
                    ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                    : 'bg-[var(--accent-soft)] text-[var(--accent)]'
                }`}>
                  {fieldType}
                </span>
              </div>
              <TaskSubjectPicker
                fieldType={fieldType}
                grade={user?.grade ?? 'دوازدهم'}
                major={user?.major ?? 'تجربی'}
                value={selection}
                onChange={setSelection}
              />
            </div>
          )}

          {/* ===== Step 3: Details (Activity + Time + Tests) ===== */}
          {step === 3 && (
            <div className="space-y-5">
              {/* Summary of what was selected */}
              <div className="flex items-center gap-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] p-3">
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: selection.subjectColor || 'var(--accent)' }}
                />
                <span className="text-sm font-semibold text-[var(--foreground)]">{selection.subjectName}</span>
                {selection.displayText && (
                  <>
                    <span className="text-[var(--border-strong)]">·</span>
                    <span className="text-xs text-[var(--foreground-muted)] truncate">{selection.displayText}</span>
                  </>
                )}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium mr-auto ${
                  fieldType === 'کنکور' ? 'bg-[var(--accent-soft)] text-[var(--accent)]' : 'bg-[var(--accent-soft)] text-[var(--accent)]'
                }`}>
                  {fieldType}
                </span>
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
              {canQuickSave && (
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
              {saving ? 'در حال ثبت...' : 'ثبت تسک'}
            </button>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
