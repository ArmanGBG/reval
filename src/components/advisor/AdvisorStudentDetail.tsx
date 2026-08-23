'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, BarChart3, CalendarDays, Send, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '@/lib/store';
import * as messageService from '@/lib/message-service';
import PlanView from '@/components/plan/PlanView';
import MinimalAnalyticsView from '@/components/analytics/MinimalAnalyticsView';

type WorkspaceTab = 'plan' | 'analytics' | 'message';

const TABS: Array<{ id: WorkspaceTab; label: string; icon: typeof CalendarDays }> = [
  { id: 'plan', label: 'برنامه و تسک‌ها', icon: CalendarDays },
  { id: 'analytics', label: 'گزارش کامل', icon: BarChart3 },
  { id: 'message', label: 'ارسال پیام', icon: Send },
];

export function AdvisorStudentDetail() {
  const {
    user,
    selectedStudentId,
    setCurrentView,
    setSelectedStudentId,
    tasks,
    advisorStudents,
    loadTasksForStudent,
    loadedStudentId,
    tasksLoading,
    setSelectedDate,
  } = useAppStore();
  const student = advisorStudents.find((item) => item.id === selectedStudentId) ?? null;
  const studentTasks = useMemo(
    () => tasks.filter((task) => task.studentId === selectedStudentId),
    [tasks, selectedStudentId],
  );
  const [tab, setTab] = useState<WorkspaceTab>('plan');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (selectedStudentId && selectedStudentId !== loadedStudentId) {
      void loadTasksForStudent(selectedStudentId);
    }
  }, [selectedStudentId, loadedStudentId, loadTasksForStudent]);

  useEffect(() => {
    setTab('plan');
    setSelectedDate(new Date().toISOString().slice(0, 10));
  }, [selectedStudentId, setSelectedDate]);

  if (!student || !selectedStudentId || !user) {
    return <div className="surface-1 rounded-2xl p-8 text-center text-[var(--foreground-muted)]">دانش‌آموزی انتخاب نشده</div>;
  }

  const sendMessage = async () => {
    if (!title.trim() || !body.trim()) return toast.error('عنوان و متن پیام الزامی است');
    setSending(true);
    try {
      await messageService.sendMessage({ recipientId: student.id, title: title.trim(), body: body.trim() });
      setTitle('');
      setBody('');
      toast.success('پیام ارسال شد');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'ارسال پیام ناموفق بود');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-5" dir="rtl">
      <button
        onClick={() => { setSelectedStudentId(null); setCurrentView('advisor-students'); }}
        className="flex min-h-[44px] items-center gap-1.5 text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
      >
        <ArrowRight className="w-4 h-4" />
        بازگشت به دانش‌آموزان
      </button>

      <section className="surface-1 edge-highlight rounded-2xl border border-[var(--border)] p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-2xl">{student.avatar || <UserRound className="w-5 h-5" />}</span>
            <div>
              <h1 className="text-xl font-black text-[var(--foreground)]">{student.name}</h1>
              <p className="mt-1 text-xs text-[var(--foreground-muted)]">{student.grade || 'پایه ثبت نشده'} · {student.major || 'رشته ثبت نشده'}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-lg border border-[var(--border)] bg-[var(--bg-overlay)] px-3 py-2 text-xs text-[var(--foreground-muted)]">{studentTasks.length} تسک</span>
            <span className="rounded-lg border border-[var(--border)] bg-[var(--bg-overlay)] px-3 py-2 text-xs text-[var(--foreground-muted)]">{studentTasks.filter((task) => task.status === 'COMPLETED').length} تکمیل‌شده</span>
          </div>
        </div>
      </section>

      <nav className="flex gap-1 overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-1 no-scrollbar">
        {TABS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`flex min-h-11 shrink-0 items-center gap-2 rounded-lg px-4 text-sm font-semibold transition-colors ${tab === item.id ? 'bg-[var(--accent)] text-[var(--bg-deep)]' : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'}`}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </button>
          );
        })}
      </nav>

      {tasksLoading && loadedStudentId !== student.id ? (
        <div className="surface-1 rounded-2xl p-12 text-center text-sm text-[var(--foreground-muted)]">در حال بارگذاری اطلاعات دانش‌آموز...</div>
      ) : tab === 'plan' ? (
        <PlanView
          targetStudent={{ id: student.id, grade: student.grade, major: student.major }}
          actor={{ role: 'ADVISOR', id: user.id }}
        />
      ) : tab === 'analytics' ? (
        <MinimalAnalyticsView
          tasksOverride={studentTasks}
          academicContext={{ grade: student.grade, major: student.major }}
        />
      ) : (
        <section className="surface-1 mx-auto max-w-2xl rounded-2xl border border-[var(--border)] p-5 sm:p-6">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-[var(--foreground)]">پیام به {student.name}</h2>
            <p className="mt-1 text-xs text-[var(--foreground-muted)]">پیام داخل اپلیکیشن برای دانش‌آموز نمایش داده می‌شود.</p>
          </div>
          <div className="space-y-3">
            <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="عنوان پیام" className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-overlay)] p-3 text-sm outline-none focus:border-[var(--accent)]/50" />
            <textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder="متن پیام" rows={6} className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--bg-overlay)] p-3 text-sm outline-none focus:border-[var(--accent)]/50" />
            <button disabled={sending} onClick={sendMessage} className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-6 text-sm font-bold text-[var(--bg-deep)] disabled:opacity-50">
              <Send className="w-4 h-4" />
              {sending ? 'در حال ارسال...' : 'ارسال پیام'}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
