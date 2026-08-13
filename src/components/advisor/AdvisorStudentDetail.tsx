'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, CalendarDays, CheckCircle2, Clock, Plus, Send } from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '@/lib/store';
import { computeKpis, filterReportTasks, type TimeFilter } from '@/lib/reporting/task-report-service';
import { toISODate, toPersianDigits } from '@/lib/persian-date';
import * as messageService from '@/lib/message-service';
import ManualEntrySheet from '@/components/plan/ManualEntrySheet';
import { TaskDetailsDialog } from '@/components/plan/TaskDetailsDialog';
import { FieldTypeBadge } from '@/components/shared/FieldTypeBadge';
import type { Task } from '@/lib/types';
import { Card, SectionHeader } from './advisor-ui';

const TIME_FILTERS: TimeFilter[] = ['روزانه', 'هفته جاری', 'ماهانه', 'بازه دلخواه'];

export function AdvisorStudentDetail() {
  const { user, selectedStudentId, setCurrentView, setSelectedStudentId, tasks, advisorStudents, loadTasksForStudent, loadedStudentId, tasksLoading, addTask, updateTask } = useAppStore();
  const student = advisorStudents.find((item) => item.id === selectedStudentId) ?? null;
  const studentTasks = useMemo(() => tasks.filter((task) => task.studentId === selectedStudentId), [tasks, selectedStudentId]);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('هفته جاری');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [selectedDate, setSelectedDate] = useState(toISODate(new Date()));
  const [addOpen, setAddOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (selectedStudentId && selectedStudentId !== loadedStudentId) loadTasksForStudent(selectedStudentId).catch(() => {});
  }, [selectedStudentId, loadedStudentId, loadTasksForStudent]);

  const customRange = customStart && customEnd ? { start: customStart <= customEnd ? customStart : customEnd, end: customStart <= customEnd ? customEnd : customStart } : null;
  const reportTasks = useMemo(() => filterReportTasks(studentTasks, timeFilter, 'همه', new Date(), customRange), [studentTasks, timeFilter, customStart, customEnd]);
  const report = useMemo(() => computeKpis(reportTasks), [reportTasks]);
  const targetMinutes = reportTasks.reduce((sum, task) => sum + (task.targetTimeMinutes ?? 0), 0);
  const actualMinutes = Math.round(report.totalHours * 60);
  const remainingMinutes = Math.max(0, targetMinutes - actualMinutes);

  if (!student) return <div className="surface-1 rounded-2xl p-8 text-center text-[var(--foreground-muted)]">دانش‌آموزی انتخاب نشده</div>;

  const sendMessage = async () => {
    if (!title.trim() || !body.trim()) return toast.error('عنوان و متن پیام الزامی است');
    setSending(true);
    try {
      await messageService.sendMessage({ recipientId: student.id, title: title.trim(), body: body.trim() });
      setTitle(''); setBody(''); toast.success('پیام ارسال شد');
    } catch (error) { toast.error(error instanceof Error ? error.message : 'ارسال پیام ناموفق بود'); }
    finally { setSending(false); }
  };

  return <div className="space-y-4" dir="rtl">
    <button onClick={() => { setSelectedStudentId(null); setCurrentView('advisor-students'); }} className="flex min-h-[44px] items-center gap-2 text-sm text-[var(--foreground-muted)]"><ArrowRight className="w-4 h-4" />بازگشت</button>

    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="text-lg font-bold">{student.name}</h2><p className="text-xs text-[var(--foreground-muted)]">{student.grade || 'پایه ثبت نشده'} - {student.major || 'رشته ثبت نشده'}</p></div>
        <button onClick={() => setAddOpen(true)} className="flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-bold text-[var(--bg-deep)]"><Plus className="w-4 h-4" />افزودن تسک</button>
      </div>
    </Card>

    <Card>
      <SectionHeader icon={<CalendarDays className="w-4 h-4" />} title="گزارش عملکرد" />
      <div className="mb-3 flex flex-wrap gap-2">{TIME_FILTERS.map((filter) => <button key={filter} onClick={() => setTimeFilter(filter)} className={`rounded-full border px-3 py-2 text-xs ${timeFilter === filter ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--bg-deep)]' : 'border-[var(--border)] text-[var(--foreground-muted)]'}`}>{filter}</button>)}</div>
      {timeFilter === 'بازه دلخواه' && <div className="mb-3 grid grid-cols-2 gap-2" dir="ltr"><input type="date" value={customStart} onChange={(event) => setCustomStart(event.target.value)} className="rounded-lg border border-[var(--border)] bg-[var(--bg-overlay)] p-2 text-sm" /><input type="date" value={customEnd} onChange={(event) => setCustomEnd(event.target.value)} className="rounded-lg border border-[var(--border)] bg-[var(--bg-overlay)] p-2 text-sm" /></div>}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
        <Metric label="زمان هدف" value={formatMinutes(targetMinutes)} />
        <Metric label="مطالعه واقعی" value={formatMinutes(actualMinutes)} />
        <Metric label="باقی‌مانده" value={formatMinutes(remainingMinutes)} />
        <Metric label="تست واقعی" value={toPersianDigits(report.totalTests)} />
        <Metric label="نرخ تکمیل" value={`${toPersianDigits(report.adherenceRate)}٪`} />
      </div>
    </Card>

    <Card>
      <SectionHeader icon={<CheckCircle2 className="w-4 h-4" />} title="تسک‌های دانش‌آموز" action={<input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} className="rounded-lg border border-[var(--border)] bg-[var(--bg-overlay)] p-2 text-xs" />} />
      {tasksLoading ? <p className="py-8 text-center text-sm text-[var(--foreground-muted)]">در حال بارگذاری...</p> : studentTasks.length === 0 ? <p className="py-8 text-center text-sm text-[var(--foreground-muted)]">تسکی ثبت نشده است</p> : <div className="space-y-2">{studentTasks.slice().sort((a, b) => b.date.localeCompare(a.date)).map((task) => <button key={task.id} onClick={() => setEditingTask(task)} className="flex w-full items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-overlay)]/50 p-3 text-right"><div><div className="flex items-center gap-2"><p className="font-semibold">{task.subject}</p><FieldTypeBadge value={task.fieldType} /></div><p className="text-xs text-[var(--foreground-muted)]">{task.topic || 'بدون مبحث'} · {task.date}</p><p className="mt-1 text-[10px] text-[var(--foreground-subtle)]">{task.createdBy === 'advisor' ? 'ساخته‌شده توسط مشاور' : 'ساخته‌شده توسط دانش‌آموز'}</p></div><div className="text-left text-xs"><p>{formatMinutes(task.targetTimeMinutes ?? 0)} هدف</p><p className="text-[var(--accent)]">{formatMinutes(task.actualTimeMinutes ?? 0)} واقعی · {toPersianDigits(task.actualTestCount ?? 0)} تست</p><span className="text-[var(--foreground-muted)]">{statusLabel(task)}</span></div></button>)}</div>}
    </Card>

    <Card><SectionHeader icon={<Send className="w-4 h-4" />} title="ارسال پیام" /><div className="space-y-3"><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="عنوان" className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-overlay)] p-3 text-sm" /><textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder="متن پیام" rows={4} className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-overlay)] p-3 text-sm" /><button disabled={sending} onClick={sendMessage} className="rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-bold text-[var(--bg-deep)]">{sending ? 'در حال ارسال...' : 'ارسال'}</button></div></Card>

    <ManualEntrySheet open={addOpen} onOpenChange={setAddOpen} selectedDate={selectedDate} existingTaskCount={studentTasks.filter((task) => task.date === selectedDate).length} onSubmit={addTask} studentId={student.id} grade={student.grade} major={student.major} createdBy="advisor" createdById={user?.id ?? null} />
    <TaskDetailsDialog task={editingTask} open={!!editingTask} onOpenChange={(open) => !open && setEditingTask(null)} grade={student.grade} major={student.major} onSave={(updates) => updateTask(editingTask!.id, updates)} />
  </div>;
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-overlay)]/60 p-3 text-center"><p className="font-black">{value}</p><p className="text-[10px] text-[var(--foreground-muted)]">{label}</p></div>; }
function formatMinutes(minutes: number) { return minutes >= 60 ? `${toPersianDigits(Math.round((minutes / 60) * 10) / 10)} ساعت` : `${toPersianDigits(minutes)} دقیقه`; }
function statusLabel(task: Task) { return task.status === 'COMPLETED' ? 'انجام‌شده' : task.status === 'INCOMPLETE' ? 'ناقص' : task.status === 'DRAFT' ? 'پیش‌نویس' : task.status === 'SKIPPED' ? 'ردشده' : 'در انتظار'; }
