'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { SUBJECTS } from '@/lib/constants/mockData';
import { Exam } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { ModalInput, ModalSelect } from './advisor-ui';

// ===== Exam Modal (Single Student) =====
export function ExamModal({
  open,
  onOpenChange,
  studentId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
}) {
  const { addExam } = useAppStore();

  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('08:00');
  const [duration, setDuration] = useState(90);
  const [totalScore, setTotalScore] = useState(100);

  const resetForm = () => {
    setTitle('');
    setSubject('');
    setDate(new Date().toISOString().split('T')[0]);
    setStartTime('08:00');
    setDuration(90);
    setTotalScore(100);
  };

  const handleSubmit = () => {
    if (!title) {
      toast.error('لطفاً عنوان آزمون را وارد کنید');
      return;
    }
    if (!subject) {
      toast.error('لطفاً درس را انتخاب کنید');
      return;
    }

    const subjectObj = SUBJECTS.find(s => s.name === subject);
    const subjectColor = subjectObj?.color ?? '#8B5CF6';

    const newExam: Exam = {
      id: crypto.randomUUID(),
      title,
      subject,
      subjectColor,
      date,
      startTime,
      duration,
      totalScore,
      studentIds: [studentId],
      status: 'upcoming',
      results: [],
      createdBy: 'adv1',
      createdAt: new Date().toISOString(),
    };
    addExam(newExam);
    toast.success('آزمون با موفقیت ثبت شد');
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="bg-[var(--bg-overlay)] border-[var(--border-strong)] text-[var(--foreground)] max-h-[90vh] overflow-y-auto rounded-2xl" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-[var(--foreground)] text-base">ثبت آزمون جدید</DialogTitle>
          <DialogDescription className="text-[var(--foreground-muted)]">
            یک آزمون جدید برای این دانش‌آموز ثبت کنید
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <ModalInput
            label="عنوان آزمون"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="مثلاً: آزمون جامع ریاضی - اسفند"
          />
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
            className="px-6 py-2.5 bg-[#8B5CF6] text-white rounded-lg text-sm font-semibold btn-hover"
          >
            ثبت آزمون
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
