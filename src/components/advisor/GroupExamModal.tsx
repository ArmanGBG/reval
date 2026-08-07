'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { MOCK_STUDENTS, SUBJECTS } from '@/lib/constants/mockData';
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
import { toast } from 'sonner';
import { ModalInput, ModalSelect } from './advisor-ui';
import { toPersianDigits, computeStudentStatus, STATUS_CONFIG } from './advisor-helpers';

// ===== Group Exam Modal =====
export function GroupExamModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { addExam, advisorStudents } = useAppStore();
  // Use real DB students when available; fall back to MOCK_STUDENTS only
  // if the advisor students list hasn't loaded yet (so the modal isn't empty
  // during the initial load).
  const students = advisorStudents.length > 0 ? advisorStudents : MOCK_STUDENTS;

  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('08:00');
  const [duration, setDuration] = useState(90);
  const [totalScore, setTotalScore] = useState(100);

  const resetForm = () => {
    setSelectedStudentIds([]);
    setTitle('');
    setSubject('');
    setDate(new Date().toISOString().split('T')[0]);
    setStartTime('08:00');
    setDuration(90);
    setTotalScore(100);
  };

  const toggleStudent = (id: string) => {
    setSelectedStudentIds(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedStudentIds(students.map(s => s.id));
  };

  const deselectAll = () => {
    setSelectedStudentIds([]);
  };

  const handleSubmit = async () => {
    if (selectedStudentIds.length === 0) {
      toast.error('لطفاً حداقل یک دانش‌آموز انتخاب کنید');
      return;
    }
    if (!title) {
      toast.error('لطفاً عنوان آزمون را وارد کنید');
      return;
    }
    if (!subject) {
      toast.error('لطفاً درس را انتخاب کنید');
      return;
    }

    const subjectObj = SUBJECTS.find(s => s.name === subject);
    const subjectColor = subjectObj?.color ?? 'var(--accent)';

    toast.loading('در حال ثبت آزمون...', { id: 'exam-create' });
    try {
      await addExam({
        title,
        subject,
        subjectColor,
        date,
        startTime,
        duration,
        totalScore,
        studentIds: selectedStudentIds,
        status: 'upcoming',
      });
      toast.success(`آزمون با موفقیت برای ${toPersianDigits(selectedStudentIds.length)} دانش‌آموز ثبت شد`, { id: 'exam-create' });
      resetForm();
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'خطا در ثبت آزمون', { id: 'exam-create' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="bg-[var(--bg-overlay)] border-[var(--border-strong)] text-[var(--foreground)] max-h-[90vh] overflow-y-auto rounded-2xl" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-[var(--foreground)] text-base">آزمون جدید برای گروه</DialogTitle>
          <DialogDescription className="text-[var(--foreground-muted)]">
            یک آزمون برای چند دانش‌آموز ثبت کنید
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] text-[var(--foreground-muted)] font-medium">انتخاب دانش‌آموزان</label>
              <div className="flex gap-2">
                <button onClick={selectAll} className="text-[11px] text-[var(--accent)] hover:text-[var(--accent-hover)] btn-hover">همه</button>
                <span className="text-[var(--foreground-subtle)]">|</span>
                <button onClick={deselectAll} className="text-[11px] text-[var(--foreground-muted)] hover:text-[var(--foreground)] btn-hover">هیچکدام</button>
              </div>
            </div>
            <div className="max-h-48 overflow-y-auto bg-[var(--bg-elevated)] rounded-lg border border-[var(--border)] p-2 space-y-1 custom-scrollbar">
              {students.map(student => {
                const status = computeStudentStatus(student);
                const config = STATUS_CONFIG[status];
                const checked = selectedStudentIds.includes(student.id);
                return (
                  <label
                    key={student.id}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer nav-item-hover ${
                      checked
                        ? 'bg-[var(--accent-soft)] border border-[var(--accent)]/30'
                        : 'hover:bg-[var(--bg-overlay)] border border-transparent'
                    }`}
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => toggleStudent(student.id)}
                      className="border-[var(--border-strong)] data-[state=checked]:bg-[var(--accent)] data-[state=checked]:border-[var(--accent)]"
                    />
                    <span className="text-lg">{student.avatar}</span>
                    <span className="text-sm text-[var(--foreground)] flex-1">{student.name}</span>
                    <span className={`text-[10px] ${config.color}`}>{config.label}</span>
                  </label>
                );
              })}
            </div>
            {selectedStudentIds.length > 0 && (
              <p className="text-[11px] text-[var(--accent)] mt-1.5 font-medium">{toPersianDigits(selectedStudentIds.length)} دانش‌آموز انتخاب شده</p>
            )}
          </div>

          <ModalInput label="عنوان آزمون" type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثلاً: آزمون جامع ریاضی - اسفند" />
          <ModalSelect label="درس" value={subject} onChange={(e) => setSubject(e.target.value)}>
            <option value="">انتخاب درس...</option>
            {SUBJECTS.map(s => (
              <option key={s.name} value={s.name}>{s.name}</option>
            ))}
          </ModalSelect>
          <ModalInput label="تاریخ" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <ModalInput label="ساعت شروع" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            <ModalInput label="مدت (دقیقه)" type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} min={1} />
          </div>
          <ModalInput label="نمره کل" type="number" value={totalScore} onChange={(e) => setTotalScore(Number(e.target.value))} min={1} />
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <DialogClose asChild>
            <button className="px-4 py-2.5 text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] btn-hover rounded-lg">
              انصراف
            </button>
          </DialogClose>
          <button
            onClick={handleSubmit}
            className="px-6 py-2.5 bg-[var(--accent)] text-white rounded-lg text-sm font-semibold btn-hover"
          >
            ثبت آزمون گروهی
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
