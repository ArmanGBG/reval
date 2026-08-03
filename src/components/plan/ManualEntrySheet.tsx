'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { ActivityType, FieldType, Task } from '@/lib/types';
import { SUBJECTS, TOPICS } from '@/lib/constants/mockData';
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
const STEP_LABELS = ['رشته تحصیلی', 'درس', 'مبحث', 'نوع فعالیت', 'زمان و تست'];

// ===== Component =====
export default function ManualEntrySheet({
  open,
  onOpenChange,
  selectedDate,
  existingTaskCount,
  onSubmit,
}: ManualEntrySheetProps) {
  // Progressive form state
  const [step, setStep] = useState(0);
  const [fieldType, setFieldType] = useState<FieldType>('کنکور');
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [activities, setActivities] = useState<ActivityType[]>([]);
  const [duration, setDuration] = useState('');
  const [testCount, setTestCount] = useState('');

  // Available topics for selected subject
  const availableTopics = useMemo(() => TOPICS[subject] || [], [subject]);

  // Reset form
  const resetForm = useCallback(() => {
    setStep(0);
    setFieldType('کنکور');
    setSubject('');
    setTopic('');
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
    if (!subject || activities.length === 0) {
      toast.error('لطفاً درس و نوع فعالیت را انتخاب کنید');
      return;
    }
    const subjectObj = SUBJECTS.find((s) => s.name === subject);
    const newTask: Task = {
      id: crypto.randomUUID(),
      studentId: 's1',
      subject,
      subjectColor: subjectObj?.color || '#3EB489',
      topic: topic || 'عمومی',
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
    toast.success('تسک اضافه شد! 🎯');
    onOpenChange(false);
    resetForm();
  }, [subject, topic, activities, fieldType, duration, testCount, selectedDate, existingTaskCount, onSubmit, onOpenChange, resetForm]);

  // Step validation
  const canGoNext = useMemo(() => {
    switch (step) {
      case 0: return true;
      case 1: return !!subject;
      case 2: return true; // topic is optional
      case 3: return activities.length > 0;
      case 4: return true;
      default: return false;
    }
  }, [step, subject, topic, activities]);

  // Progress percentage
  const progress = ((step + 1) / 5) * 100;

  return (
    <Drawer open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }} direction="bottom">
      <DrawerContent className="surface-2 border-t border-[var(--border-strong)] text-[var(--foreground)] max-h-[85vh]">
        <DrawerHeader className="text-right">
          <DrawerTitle className="text-[var(--foreground)] flex items-center justify-between">
            <span>اضافه کردن تسک</span>
            {/* Progress bar */}
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
            {/* Step 1: Goal — کنکور vs نهایی */}
            {step === 0 && (
              <motion.div
                key="step-field"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                className="space-y-3"
              >
                <p className="text-sm text-[var(--foreground)] mb-3">نوع رشته تحصیلی:</p>
                <div className="flex gap-3">
                  {(['کنکور', 'نهایی'] as FieldType[]).map((ft) => (
                    <motion.button
                      key={ft}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setFieldType(ft)}
                      className={`btn-hover flex-1 py-4 rounded-[var(--radius)] text-sm font-medium transition-all min-h-[52px] border ${
                        fieldType === ft
                          ? 'bg-[var(--accent)] text-[var(--bg-deep)] border-[var(--accent)] shadow-[0_8px_20px_-6px_var(--accent-glow)]'
                          : 'surface-1 text-[var(--foreground-muted)] border-[var(--border)] hover:border-[var(--accent)]/30'
                      }`}
                    >
                      {ft === 'کنکور' ? '🎯' : '📚'} {ft}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 2: Subject Dropdown */}
            {step === 1 && (
              <motion.div
                key="step-subject"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                className="space-y-2"
              >
                <p className="text-sm text-[var(--foreground)] mb-3">درس را انتخاب کنید:</p>
                <div className="grid grid-cols-2 gap-2">
                  {SUBJECTS.map((s) => (
                    <motion.button
                      key={s.name}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setSubject(s.name);
                        setTopic('');
                      }}
                      className={`btn-hover flex items-center gap-2 py-2.5 px-3 rounded-[var(--radius)] text-sm transition-all min-h-[48px] border ${
                        subject === s.name
                          ? 'bg-[var(--accent-soft)] text-[var(--accent)] border-[var(--accent)]/30'
                          : 'surface-1 text-[var(--foreground-muted)] border-[var(--border)] hover:border-[var(--border-strong)]'
                      }`}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: s.color }}
                      />
                      <span className="truncate">{s.name}</span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 3: Topic Combobox/Search */}
            {step === 2 && (
              <motion.div
                key="step-topic"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                className="space-y-2"
              >
                <p className="text-sm text-[var(--foreground)] mb-1">مبحث را انتخاب کنید:</p>
                <p className="text-xs text-[var(--foreground-muted)] mb-3">اختیاری — می‌توانید بدون مبحث ادامه دهید</p>
                {subject ? (
                  <>
                    {/* Search/Filter Input */}
                    <Input
                      type="text"
                      placeholder="جستجوی مبحث..."
                      className="bg-[rgba(255,255,255,0.04)] border-[var(--border)] text-[var(--foreground)] text-right mb-2 text-sm"
                      dir="rtl"
                      onChange={() => {}} // optional: filter topics
                    />
                    <div className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto">
                      {availableTopics.map((t) => (
                        <motion.button
                          key={t}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setTopic(t)}
                          className={`btn-hover py-2.5 px-3 rounded-[var(--radius)] text-sm transition-all min-h-[48px] border ${
                            topic === t
                              ? 'bg-[var(--accent-soft)] text-[var(--accent)] border-[var(--accent)]/30'
                              : 'surface-1 text-[var(--foreground-muted)] border-[var(--border)] hover:border-[var(--border-strong)]'
                          }`}
                        >
                          {t}
                        </motion.button>
                      ))}
                    </div>
                    {/* Skip Topic Option */}
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setTopic('عمومی')}
                      className={`btn-hover w-full py-2.5 px-3 rounded-[var(--radius)] text-sm transition-all min-h-[44px] mt-2 border ${
                        topic === 'عمومی'
                          ? 'bg-[var(--accent-soft)] text-[var(--accent)] border-[var(--accent)]/30'
                          : 'surface-1 text-[var(--foreground-muted)] border-dashed border-[var(--border)] hover:border-[var(--border-strong)]'
                      }`}
                    >
                      بدون مبحث مشخص
                    </motion.button>
                  </>
                ) : (
                  <p className="text-[var(--foreground-muted)] text-sm text-center py-6">ابتدا درس را انتخاب کنید</p>
                )}
              </motion.div>
            )}

            {/* Step 4: Activity Types (Multi-select Chips) */}
            {step === 3 && (
              <motion.div
                key="step-activities"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                className="space-y-2"
              >
                <p className="text-sm text-[var(--foreground)] mb-3">نوع فعالیت‌ها (می‌توانید چند مورد انتخاب کنید):</p>
                <div className="flex flex-wrap gap-2">
                  {([
                    { type: 'مطالعه' as ActivityType, emoji: '📖' },
                    { type: 'مرور' as ActivityType, emoji: '🔄' },
                    { type: 'تست آموزشی' as ActivityType, emoji: '✏️' },
                    { type: 'تست سنجشی' as ActivityType, emoji: '🎯' },
                  ]).map(({ type, emoji }) => (
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
                      {emoji} {type}
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

            {/* Step 5: Duration & Test Count */}
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
                    <span className="text-sm text-[var(--foreground)] font-medium">{subject}</span>
                    <span className="text-[var(--foreground-subtle)]">•</span>
                    <span className="text-xs text-[var(--foreground-muted)]">{topic || 'عمومی'}</span>
                    <span className="text-[var(--foreground-subtle)]">•</span>
                    <span className="text-xs text-[var(--accent)]">{toPersianNum(parseInt(duration) || 0)} دقیقه</span>
                    {parseInt(testCount) > 0 && (
                      <>
                        <span className="text-[var(--foreground-subtle)]">•</span>
                        <span className="text-xs text-[var(--accent)]">{toPersianNum(parseInt(testCount))} تست</span>
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
          {/* Back Button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="btn-hover px-4 py-2 rounded-[var(--radius)] text-sm surface-1 text-[var(--foreground-muted)] disabled:opacity-30 min-h-[44px] border border-[var(--border)]"
          >
            <ChevronRight className="w-4 h-4 inline ml-1" />
            قبلی
          </motion.button>

          {/* Next / Submit Button */}
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
              ✔ ثبت تسک
            </motion.button>
          )}

          {/* Cancel */}
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
