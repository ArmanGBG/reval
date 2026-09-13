'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Activity, ArrowRight, BarChart3, Calendar, CalendarDays, ClipboardCheck,
  FileEdit, Inbox, MoonStar, Send, UserRound,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '@/lib/store';
import * as messageService from '@/lib/message-service';
import PlanView from '@/components/plan/PlanView';
import { WeeklyPlanner } from '@/components/plan/WeeklyPlanner';
import { NonStudyActivitiesTab } from '@/components/plan/NonStudyActivitiesTab';
import { SleepTab } from '@/components/plan/SleepTab';
import MinimalAnalyticsView from '@/components/analytics/MinimalAnalyticsView';
import { ExamCenter } from '@/components/exams/ExamCenter';
import { ExamHistory } from '@/components/exams/ExamHistory';

const TASK_REFRESH_INTERVAL_MS = 60_000;

/** Unified student-workspace tabs — one bar instead of the old stacked pair. */
type WorkspaceTab = 'daily' | 'weekly' | 'tasks' | 'activities' | 'sleep' | 'exams' | 'drafts' | 'analytics' | 'message';

const TABS: Array<{ id: WorkspaceTab; label: string; icon: typeof CalendarDays }> = [
  { id: 'daily', label: 'برنامه روز', icon: CalendarDays },
  { id: 'weekly', label: 'برنامه هفتگی', icon: Calendar },
  { id: 'tasks', label: 'تسک‌ها و ناقصی‌ها', icon: Inbox },
  { id: 'activities', label: 'فعالیت‌های غیردرسی', icon: Activity },
  { id: 'sleep', label: 'خواب', icon: MoonStar },
  { id: 'exams', label: 'آزمون‌ها', icon: ClipboardCheck },
  { id: 'drafts', label: 'پیش‌نویس‌ها', icon: FileEdit },
  { id: 'analytics', label: 'گزارش کامل', icon: BarChart3 },
  { id: 'message', label: 'ارسال پیام', icon: Send },
];

/** Tabs rendered through PlanView (need the tasks cache warm + loading gate). */
const PLAN_VIEW_TABS: Partial<Record<WorkspaceTab, 'daily' | 'incomplete' | 'draft'>> = {
  daily: 'daily',
  tasks: 'incomplete',
  drafts: 'draft',
};

export function AdvisorStudentDetail() {
  const {
    user,
    selectedStudentId,
    navigateTo,
    tasks,
    advisorStudents,
    loadTasksForStudent,
    loadNonStudyActivities,
    loadSleepRecords,
    loadedStudentId,
    tasksLoading,
    setSelectedDate,
  } = useAppStore();
  const student = advisorStudents.find((item) => item.id === selectedStudentId) ?? null;
  const studentTasks = useMemo(
    () => tasks.filter((task) => task.studentId === selectedStudentId),
    [tasks, selectedStudentId],
  );
  const [tab, setTab] = useState<WorkspaceTab>('daily');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  const goBack = () => {
    if (window.history.state?.revalEntry) window.history.back();
    else navigateTo({ view: 'advisor-students' });
  };

  // Keep the tasks cache fresh while a plan-backed tab is active
  useEffect(() => {
    const needsTasks = tab in PLAN_VIEW_TABS || tab === 'weekly';
    if (!selectedStudentId || !needsTasks) return;

    const refreshTasks = () => {
      if (document.visibilityState === 'visible') {
        void loadTasksForStudent(selectedStudentId);
      }
    };

    refreshTasks();
    window.addEventListener('focus', refreshTasks);
    document.addEventListener('visibilitychange', refreshTasks);
    const interval = window.setInterval(refreshTasks, TASK_REFRESH_INTERVAL_MS);

    return () => {
      window.removeEventListener('focus', refreshTasks);
      document.removeEventListener('visibilitychange', refreshTasks);
      window.clearInterval(interval);
    };
  }, [selectedStudentId, tab, loadTasksForStudent]);

  useEffect(() => {
    setTab('daily');
    setSelectedDate(new Date().toISOString().slice(0, 10));
  }, [selectedStudentId, setSelectedDate]);

  // Keep the non-study-activities and sleep caches warm for this student so
  // the activities/sleep tabs and the analytics overview widgets have data.
  useEffect(() => {
    if (!selectedStudentId) return;
    void loadNonStudyActivities(selectedStudentId).catch(() => {});
    void loadSleepRecords(selectedStudentId).catch(() => {});
  }, [selectedStudentId, loadNonStudyActivities, loadSleepRecords]);

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

  const planTab = PLAN_VIEW_TABS[tab];

  return (
    <div className="flex w-full flex-col flex-1 space-y-5" dir="rtl">
      <button
        onClick={goBack}
        className="flex min-h-[44px] w-fit items-center gap-1.5 text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
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
        </div>
      </section>

      {/* ===== Unified navigation bar (merges the old top menu + plan tab bar) ===== */}
      <nav className="flex gap-1 overflow-x-auto whitespace-nowrap rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-1 no-scrollbar" aria-label="بخش‌های دانش‌آموز">
        {TABS.map((item) => {
          const Icon = item.icon;
          const isActive = tab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`flex min-h-11 shrink-0 items-center gap-2 rounded-lg px-4 text-sm font-semibold transition-colors ${
                isActive
                  ? 'bg-green-700 text-white shadow-sm'
                  : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
              }`}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* ===== Tab content ===== */}
      {planTab ? (
        tasksLoading && loadedStudentId !== student.id ? (
          <div className="surface-1 rounded-2xl p-12 text-center text-sm text-[var(--foreground-muted)]">در حال بارگذاری اطلاعات دانش‌آموز...</div>
        ) : (
          <PlanView
            targetStudent={{ id: student.id, grade: student.grade, major: student.major }}
            actor={{ role: 'ADVISOR', id: user.id }}
            embeddedTab={planTab}
          />
        )
      ) : tab === 'weekly' ? (
        tasksLoading && loadedStudentId !== student.id ? (
          <div className="surface-1 rounded-2xl p-12 text-center text-sm text-[var(--foreground-muted)]">در حال بارگذاری اطلاعات دانش‌آموز...</div>
        ) : (
          <WeeklyPlanner
            inline
            open
            onOpenChange={() => {}}
            onSelectDay={(date) => {
              setSelectedDate(date);
              setTab('daily');
            }}
            targetStudent={{ id: student.id, grade: student.grade, major: student.major }}
            actor={{ role: 'ADVISOR', id: user.id }}
          />
        )
      ) : tab === 'activities' ? (
        <NonStudyActivitiesTab studentId={student.id} canManage />
      ) : tab === 'sleep' ? (
        <SleepTab studentId={student.id} canManage />
      ) : tab === 'exams' ? (
        <div className="space-y-8">
          <ExamCenter studentId={student.id} grade={student.grade} major={student.major} isAdvisor />
          <section>
            <div className="mb-3">
              <h2 className="text-base font-bold text-[var(--foreground)]">سابقه آزمون‌ها</h2>
              <p className="mt-1 text-xs text-[var(--foreground-muted)]">تاریخچه آزمون‌ها و وضعیت تحلیل هر آزمون</p>
            </div>
            <ExamHistory studentId={student.id} isAdvisor embedded />
          </section>
        </div>
      ) : tab === 'analytics' ? (
        <MinimalAnalyticsView
          tasksOverride={studentTasks}
          academicContext={{ grade: student.grade, major: student.major }}
          studentId={student.id}
          isAdvisor
        />
      ) : (
        <section className="surface-1 rounded-2xl border border-[var(--border)] p-5 sm:p-6">
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
