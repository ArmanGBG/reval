'use client';

import { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Circle, Loader2, Users } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { AdvisorDailyTask, StudentProfile } from '@/lib/types';
import { toPersianDigits } from './advisor-helpers';

function dailySummary(student: StudentProfile) {
  const total = student.dailyTasks.length;
  const completed = student.dailyTasks.filter((task) => task.status === 'COMPLETED').length;
  const completionRate = total === 0 ? 0 : Math.round((completed / total) * 100);
  return { total, completed, completionRate, needsIntervention: total > 0 && completionRate <= 40 };
}

function TaskStatus({ task }: { task: AdvisorDailyTask }) {
  const completed = task.status === 'COMPLETED';
  return (
    <div className="flex items-center gap-2 text-xs text-[var(--foreground-muted)]">
      {completed ? <CheckCircle2 className="w-3.5 h-3.5 text-[var(--accent)]" /> : <Circle className="w-3.5 h-3.5 text-[var(--foreground-subtle)]" />}
      <span className={completed ? 'text-[var(--foreground)]' : undefined}>{task.subject}{task.topic ? ` · ${task.topic}` : ''}</span>
      <span className="mr-auto text-[10px]">{completed ? 'انجام شده' : task.status === 'SKIPPED' ? 'رد شده' : 'انجام نشده'}</span>
    </div>
  );
}

function StudentRow({ student, index, onOpen }: { student: StudentProfile; index: number; onOpen: () => void }) {
  const summary = dailySummary(student);
  return (
    <motion.button
      type="button"
      onClick={onOpen}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.25), duration: 0.25 }}
      className="surface-1 rounded-2xl border border-[var(--border)] p-4 md:p-5 text-right w-full hover:border-[var(--accent)]/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-10 h-10 rounded-xl bg-[var(--bg-overlay)] flex items-center justify-center text-lg shrink-0">{student.avatar}</span>
          <div className="min-w-0">
            <span className="font-bold text-[var(--foreground)] group-hover:text-[var(--accent)] text-right truncate">
              {student.name}
            </span>
            <p className="text-[11px] text-[var(--foreground-muted)] mt-1">{toPersianDigits(summary.completed)} از {toPersianDigits(summary.total)} تسک انجام شده</p>
          </div>
        </div>
        <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold shrink-0 ${summary.needsIntervention ? 'bg-[var(--danger)]/15 text-[var(--danger)]' : 'bg-[var(--accent-soft)] text-[var(--accent)]'}`}>
          {summary.needsIntervention ? 'نیاز به مداخله' : summary.total === 0 ? 'بدون تسک امروز' : `${toPersianDigits(summary.completionRate)}٪ انجام شده`}
        </span>
      </div>
      {student.dailyTasks.length > 0 && (
        <div className="mt-4 pt-3 border-t border-[var(--border)] space-y-2">
          {student.dailyTasks.map((task) => <TaskStatus key={task.id} task={task} />)}
        </div>
      )}
    </motion.button>
  );
}

export function AdvisorDashboardHome() {
  const { advisorStudents, advisorStudentsLoading, user, loadAdvisorStudents, navigateTo } = useAppStore();

  useEffect(() => {
    if (user?.id && advisorStudents.length === 0 && !advisorStudentsLoading) loadAdvisorStudents(user.id).catch(() => {});
  }, [user?.id, advisorStudents.length, advisorStudentsLoading, loadAdvisorStudents]);

  const sortedStudents = useMemo(() => [...advisorStudents].sort((a, b) => dailySummary(b).completionRate - dailySummary(a).completionRate || a.name.localeCompare(b.name)), [advisorStudents]);
  const interventionCount = advisorStudents.filter((student) => dailySummary(student).needsIntervention).length;

  return (
    <div className="space-y-4 md:space-y-5">
      <div className="grid grid-cols-2 gap-3 md:gap-4">
        <button type="button" onClick={() => navigateTo({ view: 'advisor-students', advisorFilter: 'intervention' })} className="surface-1 rounded-2xl border border-[var(--border)] p-4 md:p-5 text-right hover:border-[var(--danger)]/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--danger)]">
          <div className="flex items-center gap-2 text-[var(--foreground-muted)] text-xs"><Users className="w-4 h-4 text-[var(--accent)]" /> کل دانش‌آموزان</div>
          <p className="mt-3 text-3xl font-black text-[var(--foreground)]">{toPersianDigits(advisorStudents.length)}</p>
        </button>
        <div className="surface-1 rounded-2xl border border-[var(--border)] p-4 md:p-5">
          <div className="flex items-center gap-2 text-[var(--foreground-muted)] text-xs"><AlertTriangle className="w-4 h-4 text-[var(--danger)]" /> نیاز به مداخله</div>
          <p className="mt-3 text-3xl font-black text-[var(--danger)]">{toPersianDigits(interventionCount)}</p>
        </div>
      </div>

      <section className="surface-1 rounded-2xl border border-[var(--border)] overflow-hidden">
        <div className="px-4 py-4 md:px-5 border-b border-[var(--border)]">
          <h2 className="font-bold text-[var(--foreground)]">وضعیت دانش‌آموزان امروز</h2>
          <p className="text-[11px] text-[var(--foreground-muted)] mt-1">مرتب‌سازی از بیشترین به کمترین میزان انجام تسک‌ها</p>
        </div>
        {advisorStudentsLoading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-[var(--foreground-muted)]"><Loader2 className="w-4 h-4 animate-spin" /> در حال بارگذاری...</div>
        ) : sortedStudents.length === 0 ? (
          <div className="py-12 text-center text-sm text-[var(--foreground-muted)]">هنوز دانش‌آموزی به شما متصل نشده است.</div>
        ) : (
          <div className="p-3 md:p-4 space-y-3">{sortedStudents.map((student, index) => <StudentRow key={student.id} student={student} index={index} onOpen={() => navigateTo({ view: 'advisor-student-detail', selectedStudentId: student.id })} />)}</div>
        )}
      </section>
    </div>
  );
}
