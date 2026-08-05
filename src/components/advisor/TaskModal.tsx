'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { MOCK_STUDENTS } from '@/lib/constants/mockData';
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
import { SubjectTopicPicker, TopicSelection } from '@/components/shared/SubjectTopicPicker';
import { Subject } from '@/lib/subjects-types';
import { toast } from 'sonner';
import { ModalInput } from './advisor-ui';
import { ALL_ACTIVITY_TYPES } from './advisor-helpers';

// ===== Task Modal (Add / Edit) — New Flow: field type → subject (filtered) → topic picker =====
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
  const { addTask, updateTask, selectedStudentId } = useAppStore();
  const isEdit = editTask !== null;

  // Find the selected student to read their grade + major
  const student = MOCK_STUDENTS.find(s => s.id === (selectedStudentId || studentId));
  const studentGrade = student?.grade || 'دوازدهم';
  const studentMajor = student?.major || 'تجربی';

  // Form state — new flow
  const [fieldType, setFieldType] = useState<FieldType>(editTask?.fieldType ?? 'کنکور');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [topicSelection, setTopicSelection] = useState<TopicSelection | null>(
    editTask?.topic ? { displayText: editTask.topic, mode: 'chapter' } : null
  );
  const [activityTypes, setActivityTypes] = useState<ActivityType[]>(editTask?.activityTypes ?? []);
  const [targetTimeMinutes, setTargetTimeMinutes] = useState(editTask?.targetTimeMinutes ?? 60);
  const [targetTestCount, setTargetTestCount] = useState(editTask?.targetTestCount ?? 20);
  const [date, setDate] = useState(editTask?.date ?? new Date().toISOString().split('T')[0]);

  // Fetch subjects whenever fieldType changes or modal opens
  const fetchSubjects = useCallback(async (ft: FieldType) => {
    setSubjectsLoading(true);
    try {
      const res = await fetch(
        `/api/subjects/for-task?fieldType=${encodeURIComponent(ft)}&grade=${encodeURIComponent(studentGrade)}&major=${encodeURIComponent(studentMajor)}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSubjects(data.subjects || []);
      // If editing, try to match the existing subject
      if (editTask?.subject) {
        const match = (data.subjects || []).find((s: Subject) => s.name === editTask.subject);
        if (match) setSelectedSubject(match);
      }
    } catch {
      setSubjects([]);
    } finally {
      setSubjectsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentGrade, studentMajor]);

  useEffect(() => {
    if (open) fetchSubjects(fieldType);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, fieldType]);

  // Reset form when modal opens or editTask changes
  const resetForm = () => {
    setFieldType(editTask?.fieldType ?? 'کنکور');
    setSelectedSubject(null);
    setTopicSelection(editTask?.topic ? { displayText: editTask.topic, mode: 'chapter' } : null);
    setActivityTypes(editTask?.activityTypes ?? []);
    setTargetTimeMinutes(editTask?.targetTimeMinutes ?? 60);
    setTargetTestCount(editTask?.targetTestCount ?? 20);
    setDate(editTask?.date ?? new Date().toISOString().split('T')[0]);
  };

  const toggleActivity = (act: ActivityType) => {
    setActivityTypes(prev =>
      prev.includes(act) ? prev.filter(a => a !== act) : [...prev, act]
    );
  };

  const handleSubmit = () => {
    if (!selectedSubject) {
      toast.error('لطفاً درس را انتخاب کنید');
      return;
    }
    if (activityTypes.length === 0) {
      toast.error('لطفاً حداقل یک نوع فعالیت انتخاب کنید');
      return;
    }

    const subjectColor = selectedSubject.color;
    const topic = topicSelection?.displayText || 'عمومی';

    if (isEdit && editTask) {
      updateTask(editTask.id, {
        subject: selectedSubject.name,
        subjectColor,
        topic,
        fieldType,
        activityTypes,
        targetTimeMinutes,
        targetTestCount,
        date,
      });
      toast.success('وظیفه با موفقیت ویرایش شد');
    } else {
      const newTask: Task = {
        id: crypto.randomUUID(),
        studentId,
        subject: selectedSubject.name,
        subjectColor,
        topic,
        fieldType,
        activityTypes,
        targetTimeMinutes,
        actualTimeMinutes: null,
        targetTestCount,
        actualTestCount: null,
        completed: null,
        date,
        order: Date.now(),
        createdBy: 'advisor',
      };
      addTask(newTask);
      toast.success('وظیفه جدید با موفقیت اضافه شد');
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="bg-[var(--bg-overlay)] border-[var(--border-strong)] text-[var(--foreground)] max-h-[90vh] overflow-y-auto rounded-2xl" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-[var(--foreground)] text-base">{isEdit ? 'ویرایش وظیفه' : 'افزودن وظیفه جدید'}</DialogTitle>
          <DialogDescription className="text-[var(--foreground-muted)]">
            {isEdit ? 'جزئیات وظیفه را ویرایش کنید' : 'یک وظیفه جدید برای دانش‌آموز تعریف کنید'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Step 1: Field Type */}
          <div>
            <label className="text-[11px] text-[var(--foreground-muted)] mb-1.5 block font-medium">حوزه</label>
            <div className="flex gap-2.5">
              {(['کنکور', 'نهایی'] as FieldType[]).map(ft => (
                <button
                  key={ft}
                  onClick={() => {
                    setFieldType(ft);
                    setSelectedSubject(null);
                    setTopicSelection(null);
                  }}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium border btn-hover ${
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

          {/* Step 2: Subject (filtered by field type) */}
          <div>
            <label className="text-[11px] text-[var(--foreground-muted)] mb-1.5 block font-medium">
              درس
              <span className="text-[var(--foreground-subtle)] mr-1">
                ({fieldType === 'کنکور' ? 'اختصاصی کنکور' : 'امتحانات نهایی'})
              </span>
            </label>
            {subjectsLoading ? (
              <div className="text-xs text-[var(--foreground-muted)] py-3 text-center">در حال بارگذاری...</div>
            ) : subjects.length === 0 ? (
              <div className="text-xs text-[var(--foreground-muted)] py-3 text-center">درسی یافت نشد</div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {subjects.map(s => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setSelectedSubject(s);
                      setTopicSelection(null);
                    }}
                    className={`btn-hover flex items-center gap-2 py-2.5 px-3 rounded-lg text-sm border ${
                      selectedSubject?.id === s.id
                        ? 'bg-[var(--accent-soft)] border-[var(--accent)]/30 text-[var(--accent)]'
                        : 'bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                    }`}
                  >
                    <span className="text-base">{s.icon || '📚'}</span>
                    <span className="truncate text-right flex-1">{s.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Step 3: Topic Picker (dynamic) */}
          {selectedSubject && (
            <div>
              <label className="text-[11px] text-[var(--foreground-muted)] mb-1.5 block font-medium">مبحث</label>
              <SubjectTopicPicker
                subject={selectedSubject}
                defaultGrade={studentGrade}
                value={topicSelection}
                onChange={setTopicSelection}
              />
            </div>
          )}

          {/* Activity Types */}
          <div>
            <label className="text-[11px] text-[var(--foreground-muted)] mb-2 block font-medium">نوع فعالیت</label>
            <div className="grid grid-cols-2 gap-2">
              {ALL_ACTIVITY_TYPES.map(act => (
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

          <div className="grid grid-cols-2 gap-3">
            <ModalInput
              label="زمان هدف (دقیقه)"
              type="number"
              value={targetTimeMinutes}
              onChange={(e) => setTargetTimeMinutes(Number(e.target.value))}
              min={1}
            />
            <ModalInput
              label="تعداد تست هدف"
              type="number"
              value={targetTestCount}
              onChange={(e) => setTargetTestCount(Number(e.target.value))}
              min={0}
            />
          </div>

          <ModalInput
            label="تاریخ"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <DialogClose asChild>
            <button className="px-4 py-2.5 text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] btn-hover rounded-lg">
              انصراف
            </button>
          </DialogClose>
          <button
            onClick={handleSubmit}
            className="px-6 py-2.5 bg-[var(--accent)] text-[var(--bg-deep)] rounded-lg text-sm font-semibold glow-hover"
          >
            {isEdit ? 'ذخیره تغییرات' : 'افزودن وظیفه'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
