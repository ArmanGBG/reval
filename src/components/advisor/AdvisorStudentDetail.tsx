'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Send, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '@/lib/store';
import { computeKpis, filterReportTasks } from '@/lib/reporting/task-report-service';
import { toPersianDigits } from '@/lib/persian-date';
import * as messageService from '@/lib/message-service';
import { Card, SectionHeader } from './advisor-ui';

export function AdvisorStudentDetail() {
  const { selectedStudentId, setCurrentView, setSelectedStudentId, tasks, advisorStudents, loadTasksForStudent, loadedStudentId, tasksLoading } = useAppStore();
  const student = advisorStudents.find((item) => item.id === selectedStudentId) ?? null;
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (selectedStudentId && selectedStudentId !== loadedStudentId) loadTasksForStudent(selectedStudentId).catch(() => {});
  }, [selectedStudentId, loadedStudentId, loadTasksForStudent]);

  const report = useMemo(() => computeKpis(filterReportTasks(tasks.filter((task) => task.studentId === selectedStudentId), 'هفته جاری', 'همه')), [tasks, selectedStudentId]);

  if (!student) {
    return <div className="surface-1 rounded-2xl p-8 text-center text-[var(--foreground-muted)]">دانش‌آموزی انتخاب نشده</div>;
  }

  const sendMessage = async () => {
    if (!title.trim() || !body.trim()) {
      toast.error('عنوان و متن پیام الزامی است');
      return;
    }
    setSending(true);
    try {
      await messageService.sendMessage({ recipientId: student.id, title: title.trim(), body: body.trim() });
      setTitle('');
      setBody('');
      toast.success('پیام با موفقیت ارسال شد');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'ارسال پیام ناموفق بود');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4" dir="rtl">
      <button onClick={() => { setSelectedStudentId(null); setCurrentView('advisor-students'); }} className="flex items-center gap-2 text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] min-h-[44px]">
        <ArrowRight className="w-4 h-4" /> بازگشت به لیست
      </button>

      <Card>
        <div className="flex items-center gap-3">
          <span className="w-14 h-14 rounded-2xl bg-[var(--bg-overlay)] flex items-center justify-center text-2xl"><UserRound className="w-6 h-6 text-[var(--accent)]" /></span>
          <div>
            <h2 className="text-lg font-bold text-[var(--foreground)]">{student.name}</h2>
            <p className="text-xs text-[var(--foreground-muted)]">{student.grade || 'پایه ثبت نشده'} - {student.major || 'رشته ثبت نشده'}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-4">
          <Metric label="ساعت مطالعه واقعی" value={toPersianDigits(Math.round(report.totalHours * 10) / 10)} />
          <Metric label="تعداد تست واقعی" value={toPersianDigits(report.totalTests)} />
          <Metric label="نرخ تکمیل" value={`${toPersianDigits(report.adherenceRate)}٪`} />
        </div>
      </Card>

      <Card>
        <SectionHeader icon={<Send className="w-4 h-4" />} title="ارسال پیام به دانش‌آموز" />
        <div className="space-y-3">
          <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="عنوان پیام" maxLength={120} className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-overlay)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)]" />
          <textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder="متن پیام" maxLength={2000} rows={5} className="w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--bg-overlay)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)]" />
          <button disabled={sending} onClick={sendMessage} className="flex items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-[var(--bg-deep)] disabled:opacity-50">
            <Send className="w-4 h-4" /> {sending ? 'در حال ارسال...' : 'ارسال پیام'}
          </button>
        </div>
      </Card>

      {tasksLoading && <p className="text-center text-xs text-[var(--foreground-muted)]">در حال بارگذاری گزارش...</p>}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-overlay)]/60 p-2.5 text-center"><p className="text-base font-black text-[var(--foreground)] tabular-nums">{value}</p><p className="mt-0.5 text-[10px] text-[var(--foreground-muted)]">{label}</p></div>;
}
