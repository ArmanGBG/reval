'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Loader2, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import { ActivityType, FieldType, Task } from '@/lib/types';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { SubjectTopicPicker, TopicSelection } from '@/components/shared/SubjectTopicPicker';
import { Subject } from '@/lib/subjects-types';
import { useAppStore } from '@/lib/store';

// ===== Persian Helper =====
function toPersianNum(n: number): string {
  const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
  return String(n).replace(/\d/g, (d) => persianDigits[parseInt(d)]);
}

// ===== Props =====
interface ManualEntrySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: string;
  existingTaskCount: number;
  onSubmit: (task: Task) => void;
}

// ===== Step Labels =====
const STEP_LABELS = ['حوزه', 'درس', 'مبحث', 'نوع فعالیت', 'زمان و تست'];

// ===== Component =====
export default function ManualEntrySheet({
  open,
  onOpenChange,
  selectedDate,
  existingTaskCount,
  onSubmit,
}: ManualEntrySheetProps) {
  const { user } = useAppStore();

  // Progressive form state
  const [step, setStep] = useState(0);
  const [fieldType, setFieldType] = useState<FieldType>('کنکور');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [topicSelection, setTopicSelection] = useState<TopicSelection | null>(null);
  const [activities, setActivities] = useState<ActivityType[]>([]);
  const [duration, setDuration] = useState('');
  const [testCount, setTestCount] = useState('');

  // ===== Fetch subjects whenever fieldType changes (or drawer opens) =====
  const fetchSubjects = useCallback(async (ft: FieldType) => {
    setSubjectsLoading(true);
    try {
      const grade = user?.grade || 'دوازدهم';
      const major = user?.major || 'تجربی';
      const res = await fetch(
        `/api/subjects/for-task?fieldType=${encodeURIComponent(ft)}&grade=${encodeURIComponent(grade)}&major=${encodeURIComponent(major)}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطا');
      setSubjects(data.subjects || []);
    } catch {
      setSubjects([]);
    } finally {
      setSubjectsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (open) {
      fetchSubjects(fieldType);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, fieldType]);

  // Reset form
  const resetForm = useCallback(() => {
    setStep(0);
    setFieldType('کنکور');
    setSelectedSubject(null);
    setTopicSelection(null);
    setActivities([]);
    setDuration('');
    setTestCount('');
  }, []);

  // Toggle activity chip
  const toggleActivity = useCallback((activity: ActivityType) => {
    setActivities((prev) =>
      prev.includes(activity) ? prev.filter((a) => a !== activity) : [...prev, activity]
    );
  }, []);

  // Submit handler
  const handleSubmit = useCallback(() => {
    if (!selectedSubject || activities.length === 0) {
      toast.error('لطفاً درس و نوع فعالیت را انتخاب کنید');
      return;
    }
    const newTask: Task = {
      id: crypto.randomUUID(),
      studentId: user?.id || 's1',
      subject: selectedSubject.name,
      subjectColor: selectedSubject.color,
      topic: topicSelection?.displayText || 'عمومی',
      fieldType,
      activityTypes: activities,
      targetTimeMinutes: parseInt(duration) || 60,
      actualTimeMinutes: null,
      targetTestCount: parseInt(testCount) || 0,
      actualTestCount: null,
      completed: null,
      date: selectedDate,
      order: existingTaskCount + 1,
      createdBy: 'student',
    };
    onSubmit(newTask);
    toast.success('تسک اضافه شد');
    onOpenChange(false);
    resetForm();
  }, [selectedSubject, topicSelection, activities, fieldType, duration, testCount, selectedDate, existingTaskCount, onSubmit, onOpenChange, resetForm, user]);

  // Step validation
  const canGoNext = useMemo(() => {
    switch (step) {
      case 0: return true;
      case 1: return !!selectedSubject;
      case 2: return true; // topic is optional
      case 3: return activities.length > 0;
      case 4: return true;
      default: return false;
    }
  }, [step, selectedSubject, activities]);

  // Progress percentage
  const progress = ((step + 1) / 5) * 100;

  return (
    <Drawer open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }} direction="bottom">
      <DrawerContent className="surface-2 border-t border-[var(--border-strong)] text-[var(--foreground)] max-h-[85vh]">
        <DrawerHeader className="text-right">
          <DrawerTitle className="text-[var(--foreground)] flex items-center justify-between">
            <span>اضافه کردن تسک</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--foreground-muted)]">
                {toPersianNum(step + 1)} از {toPersianNum(5)}
              </span>
              <div className="w-20 h-1.5 bg-[var(--bg-overlay)] rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-[var(--accent)] rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          </DrawerTitle>
          <DrawerDescription className="text-[var(--foreground-muted)]">
            {STEP_LABELS[step]}
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 pb-4 overflow-y-auto max-h-[50vh]">
          <AnimatePresence mode="wait">
            {/* ===== Step 1: Field Type — کنکور vs نهایی ===== */}
            {step === 0 && (
              <motion.div
                key="step-field"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                className="space-y-3"
              >
                <p className="text-sm text-[var(--foreground)] mb-3">حوزه مطالعه را انتخاب کنید:</p>
                <div className="flex gap-3">
                  {(['کنکور', 'نهایی'] as FieldType[]).map((ft) => (
                    <motion.button
                      key={ft}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setFieldType(ft);
                        setSelectedSubject(null);
                        setTopicSelection(null);
                      }}
                      className={`btn-hover flex-1 py-4 rounded-[var(--radius)] text-sm font-medium transition-all min-h-[56px] border ${
                        fieldType === ft
                          ? 'bg-[var(--accent)] text-[var(--bg-deep)] border-[var(--accent)] shadow-[0_8px_20px_-6px_var(--accent-glow)]'
                          : 'surface-1 text-[var(--foreground-muted)] border-[var(--border)] hover:border-[var(--accent)]/30'
                      }`}
                    >
                      {ft}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ===== Step 2: Subject (filtered by field type) ===== */}
            {step === 1 && (
              <motion.div
                key="step-subject"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                className="space-y-2"
              >
                <p className="text-sm text-[var(--foreground)] mb-1">
                  درس را انتخاب کنید
                  <span className="text-xs text-[var(--foreground-muted)] mr-2">
                    ({fieldType === 'کنکور' ? 'دروس اختصاصی کنکور' : 'دروس امتحانات نهایی'})
                  </span>
                </p>

                {subjectsLoading ? (
                  <div className="flex items-center justify-center py-8 text-[var(--foreground-muted)]">
                    <Loader2 className="w-5 h-5 animate-spin ml-2" />
                    <span className="text-xs">در حال بارگذاری دروس...</span>
                  </div>
                ) : subjects.length === 0 ? (
                  <div className="surface-1 rounded-xl p-6 text-center">
                    <BookOpen className="w-8 h-8 mx-auto text-[var(--foreground-subtle)] mb-2" />
                    <p className="text-xs text-[var(--foreground-muted)]">
                      درسی برای این حوزه یافت نشد
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {subjects.map((s) => (
                      <motion.button
                        key={s.id}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setSelectedSubject(s);
                          setTopicSelection(null);
                        }}
                        className={`btn-hover flex items-center gap-2 py-2.5 px-3 rounded-[var(--radius)] text-sm transition-all min-h-[48px] border ${
                          selectedSubject?.id === s.id
                            ? 'bg-[var(--accent-soft)] text-[var(--accent)] border-[var(--accent)]/30'
                            : 'surface-1 text-[var(--foreground-muted)] border-[var(--border)] hover:border-[var(--border-strong)]'
                        }`}
                      >
                        <span className="text-base shrink-0">{s.icon || '📚'}</span>
                        <span className="truncate text-right flex-1">{s.name}</span>
                      </motion.button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* ===== Step 3: Topic (dynamic SubjectTopicPicker) ===== */}
            {step === 2 && (
              <motion.div
                key="step-topic"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                className="space-y-2"
              >
                <p className="text-sm text-[var(--foreground)] mb-1">
                  مبحث را انتخاب کنید:
                </p>
                <p className="text-xs text-[var(--foreground-muted)] mb-3">
                  {selectedSubject?.displayStrategy === 'chapter'
                    ? 'انتخاب از درخت فصل‌ها و گفتارها'
                    : selectedSubject?.displayStrategy === 'topic'
                      ? 'انتخاب از مباحث یکپارچه کنکوری'
                      : 'می‌توانید بین فصل کتاب یا مبحثی انتخاب کنید'}
                </p>
                {selectedSubject ? (
                  <SubjectTopicPicker
                    subject={selectedSubject}
                    defaultGrade={user?.grade || 'دوازدهم'}
                    value={topicSelection}
                    onChange={setTopicSelection}
                  />
                ) : (
                  <p className="text-[var(--foreground-muted)] text-sm text-center py-6">
                    ابتدا درس را انتخاب کنید
                  </p>
                )}
              </motion.div>
            )}

            {/* ===== Step 4: Activity Types ===== */}
            {step === 3 && (
              <motion.div
                key="step-activities"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                className="space-y-2"
              >
                <p className="text-sm text-[var(--foreground)] mb-3">
                  نوع فعالیت‌ها:
                </p>
                <div className="flex flex-wrap gap-2">
                  {([
                    { type: 'مطالعه' as ActivityType },
                    { type: 'مرور' as ActivityType },
                    { type: 'تست آموزشی' as ActivityType },
                    { type: 'تست سنجشی' as ActivityType },
                  ]).map(({ type }) => (
                    <motion.button
                      key={type}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => toggleActivity(type)}
                      className={`btn-hover py-3 px-5 rounded-[var(--radius)] text-sm transition-all min-h-[52px] border ${
                        activities.includes(type)
                          ? 'bg-[var(--accent)] text-[var(--bg-deep)] border-[var(--accent)] shadow-[0_8px_20px_-6px_var(--accent-glow)]'
                          : 'surface-1 text-[var(--foreground-muted)] border-[var(--border)] hover:border-[var(--accent)]/30'
                      }`}
                    >
                      {type}
                    </motion.button>
                  ))}
                </div>
                {activities.length > 0 && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs text-[var(--accent)] mt-2"
                  >
                    {toPersianNum(activities.length)} فعالیت انتخاب شده
                  </motion.p>
                )}
              </motion.div>
            )}

            {/* ===== Step 5: Duration & Test Count ===== */}
            {step === 4 && (
              <motion.div
                key="step-metrics"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                className="space-y-5"
              >
                {/* Quick Duration Buttons */}
                <div>
                  <label className="text-sm text-[var(--foreground)] block mb-2">مدت زمان (دقیقه):</label>
                  <div className="flex gap-2 mb-2">
                    {[30, 45, 60, 90, 120].map((m) => (
                      <motion.button
                        key={m}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setDuration(String(m))}
                        className={`btn-hover px-3 py-1.5 rounded-[var(--radius-sm)] text-xs transition-all min-h-[36px] border ${
                          duration === String(m)
                            ? 'bg-[var(--accent)] text-[var(--bg-deep)] border-[var(--accent)]'
                            : 'surface-1 text-[var(--foreground-muted)] border-[var(--border)]'
                        }`}
                      >
                        {toPersianNum(m)}
                      </motion.button>
                    ))}
                  </div>
                  <Input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="مثلاً ۹۰"
                    className="bg-[rgba(255,255,255,0.04)] border-[var(--border)] text-[var(--foreground)] text-right"
                    dir="ltr"
                  />
                </div>

                {/* Quick Test Count Buttons */}
                <div>
                  <label className="text-sm text-[var(--foreground)] block mb-2">تعداد تست:</label>
                  <div className="flex gap-2 mb-2">
                    {[10, 20, 30, 40, 50].map((t) => (
                      <motion.button
                        key={t}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setTestCount(String(t))}
                        className={`btn-hover px-3 py-1.5 rounded-[var(--radius-sm)] text-xs transition-all min-h-[36px] border ${
                          testCount === String(t)
                            ? 'bg-[var(--accent)] text-[var(--bg-deep)] border-[var(--accent)]'
                            : 'surface-1 text-[var(--foreground-muted)] border-[var(--border)]'
                        }`}
                      >
                        {toPersianNum(t)}
                      </motion.button>
                    ))}
                  </div>
                  <Input
                    type="number"
                    value={testCount}
                    onChange={(e) => setTestCount(e.target.value)}
                    placeholder="مثلاً ۳۰"
                    className="bg-[rgba(255,255,255,0.04)] border-[var(--border)] text-[var(--foreground)] text-right"
                    dir="ltr"
                  />
                </div>

                {/* Summary Preview */}
                <div className="surface-1 rounded-[var(--radius)] p-3 border border-[var(--border)]">
                  <p className="text-xs text-[var(--foreground-muted)] mb-2">خلاصه تسک:</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-[var(--foreground)] font-medium">
                      {selectedSubject?.icon} {selectedSubject?.name}
                    </span>
                    <span className="text-[var(--foreground-subtle)]">•</span>
                    <span className="text-xs text-[var(--foreground-muted)]">
                      {topicSelection?.displayText || 'عمومی'}
                    </span>
                    <span className="text-[var(--foreground-subtle)]">•</span>
                    <span className="text-xs text-[var(--accent)]">
                      {toPersianNum(parseInt(duration) || 0)} دقیقه
                    </span>
                    {parseInt(testCount) > 0 && (
                      <>
                        <span className="text-[var(--foreground-subtle)]">•</span>
                        <span className="text-xs text-[var(--accent)]">
                          {toPersianNum(parseInt(testCount))} تست
                        </span>
                      </>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {activities.map((a) => (
                      <span key={a} className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">{a}</span>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <DrawerFooter className="flex-row gap-2 justify-between">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="btn-hover px-4 py-2 rounded-[var(--radius)] text-sm surface-1 text-[var(--foreground-muted)] disabled:opacity-30 min-h-[44px] border border-[var(--border)]"
          >
            <ChevronRight className="w-4 h-4 inline ml-1" />
            قبلی
          </motion.button>

          {step < 4 ? (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setStep((s) => s + 1)}
              disabled={!canGoNext}
              className="btn-hover glow-hover px-6 py-2 rounded-[var(--radius)] text-sm bg-[var(--accent)] text-[var(--bg-deep)] font-medium disabled:opacity-30 min-h-[44px]"
            >
              بعدی
              <ChevronLeft className="w-4 h-4 inline mr-1" />
            </motion.button>
          ) : (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleSubmit}
              className="btn-hover glow-hover px-6 py-2 rounded-[var(--radius)] text-sm bg-[var(--accent)] text-[var(--bg-deep)] font-medium min-h-[44px] shadow-[0_8px_20px_-6px_var(--accent-glow)]"
            >
              ثبت تسک
            </motion.button>
          )}

          <DrawerClose asChild>
            <motion.button
              whileTap={{ scale: 0.95 }}
              className="btn-hover px-4 py-2 rounded-[var(--radius)] text-sm surface-1 text-[var(--foreground-muted)] min-h-[44px] border border-[var(--border)]"
            >
              انصراف
            </motion.button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
