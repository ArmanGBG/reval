'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { MOCK_STUDENTS } from '@/lib/constants/mockData';
import { StudentStatus } from '@/lib/types';
import {
  AlertTriangle,
  CheckCircle2,
  Users,
  Target,
  UserCheck,
  Activity,
  Clock,
  Flame,
  Zap,
} from 'lucide-react';
import { Card, SectionHeader, MetricBar } from './advisor-ui';
import { toPersianDigits, computeRisks, computeStudentStatus, STATUS_CONFIG, RISK_CONFIG } from './advisor-helpers';

// ===== ADVISOR VIEW 1: Dashboard (Global KPIs) =====
export function AdvisorDashboardHome() {
  const students = MOCK_STUDENTS;
  const risks = useMemo(() => computeRisks(students), [students]);
  const statuses = useMemo(() => students.map(s => computeStudentStatus(s)), [students]);

  const statusCounts = useMemo(() => {
    const c = { excellent: 0, good: 0, fair: 0, 'at-risk': 0, critical: 0 };
    statuses.forEach(s => c[s]++);
    return c;
  }, [statuses]);

  const avgScore = Math.round(students.reduce((a, s) => a + s.mockExamScore, 0) / students.length);
  const avgStudy = Math.round(students.reduce((a, s) => a + s.studyHoursPerWeek, 0) / students.length);
  const avgAdherence = Math.round(students.reduce((a, s) => a + s.taskCompletionRate, 0) / students.length);
  const atRiskCount = statusCounts['at-risk'] + statusCounts.critical;

  const kpis = [
    { icon: <Users className="w-4 h-4" />, label: 'کل دانش‌آموزان', value: toPersianDigits(students.length), sub: 'تحت نظارت', accent: 'var(--accent)' },
    { icon: <AlertTriangle className="w-4 h-4" />, label: 'نیاز به مداخله', value: toPersianDigits(atRiskCount), sub: 'دانش‌آموز', accent: 'var(--danger)' },
    { icon: <Target className="w-4 h-4" />, label: 'میانگین نمره', value: toPersianDigits(avgScore), sub: 'آزمون آزمایشی', accent: 'var(--accent)' },
    { icon: <UserCheck className="w-4 h-4" />, label: 'میانگین رعایت', value: `${toPersianDigits(avgAdherence)}٪`, sub: 'تکمیل وظایف', accent: 'var(--warning)' },
  ];

  const statusBars = (Object.entries(statusCounts) as [StudentStatus, number][]).map(([status, count]) => ({
    status, count, config: STATUS_CONFIG[status], pct: Math.round((count / students.length) * 100),
  }));

  const activeRisks = risks.filter(r => r.level !== 'low');

  return (
    <div className="space-y-4 md:space-y-5">
      {/* Top row: KPI cards (mobile: 2-col grid, desktop: 4-col span 3 each) */}
      <div className="grid grid-cols-2 md:grid-cols-12 gap-3 md:gap-4">
        {kpis.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="md:col-span-3 surface-1 card-hover rounded-xl md:rounded-2xl p-4 md:p-5 edge-highlight"
          >
            <div className="flex items-center gap-2 mb-3">
              <span
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `color-mix(in srgb, ${kpi.accent} 12%, transparent)`, color: kpi.accent }}
              >
                {kpi.icon}
              </span>
              <span className="text-[11px] md:text-xs text-[var(--foreground-muted)] font-medium">{kpi.label}</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <p className="text-2xl md:text-3xl font-black text-[var(--foreground)] tabular-nums">{kpi.value}</p>
              <span className="text-[10px] md:text-[11px] text-[var(--foreground-subtle)]">{kpi.sub}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Middle row: status distribution (col-span-4) + study hours chart (col-span-8) — desktop only split; mobile stacks */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4">
        {/* Status distribution — mobile: horizontal bars, desktop: stacked bars */}
        <Card className="md:col-span-4">
          <SectionHeader icon={<Activity className="w-4 h-4" />} title="توزیع وضعیت دانش‌آموزان" />
          <div className="space-y-2.5">
            {statusBars.map(({ status, count, config, pct }) => (
              <div key={status}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className={config.color}>{config.icon}</span>
                    <span className="text-[11px] text-[var(--foreground-muted)] font-medium">{config.label}</span>
                  </div>
                  <span className="text-[11px] text-[var(--foreground)] font-bold tabular-nums">{toPersianDigits(count)}</span>
                </div>
                <div className="h-2 bg-[var(--bg-overlay)] rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${config.bg}`}
                    style={{ backgroundColor: 'currentColor' }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <div className={`h-full w-full ${config.bg}`} />
                  </motion.div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Study hours chart — full width on mobile, col-span-8 on desktop */}
        <Card className="md:col-span-8">
          <SectionHeader
            icon={<Clock className="w-4 h-4" />}
            title="ساعت مطالعه هفتگی"
            action={<span className="text-[11px] text-[var(--foreground-muted)]">هدف: <span className="text-[var(--foreground)] font-medium">۵۰ ساعت</span></span>}
          />
          <div className="space-y-2.5 max-h-72 overflow-y-auto custom-scrollbar pr-1">
            {students.map(student => (
              <MetricBar
                key={student.id}
                label={student.name.split(' ')[0]}
                value={student.studyHoursPerWeek}
                max={50}
                color={
                  student.studyHoursPerWeek >= student.studyHoursTarget
                    ? 'var(--accent)'
                    : student.studyHoursPerWeek >= student.studyHoursTarget * 0.7
                      ? 'var(--warning)'
                      : 'var(--danger)'
                }
              />
            ))}
          </div>
        </Card>
      </div>

      {/* Bottom row: red flags — full width, inner 3-col grid on desktop */}
      <Card className="border-[var(--danger)]/20">
        <SectionHeader
          icon={<Flame className="w-4 h-4" />}
          title="پرچم‌های قرمز"
          accent="var(--danger)"
          action={
            <span className="text-[11px] text-[var(--danger)] font-medium px-2.5 py-1 rounded-full bg-[var(--danger)]/10">
              {toPersianDigits(activeRisks.length)} مورد
            </span>
          }
        />
        {activeRisks.length === 0 ? (
          <div className="text-center py-6">
            <CheckCircle2 className="w-8 h-8 text-[var(--accent)] mx-auto mb-2" />
            <p className="text-sm text-[var(--foreground-muted)]">پرچم قرمزی شناسایی نشده</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {activeRisks.map(risk => {
              const student = students.find(s => s.id === risk.studentId)!;
              const config = RISK_CONFIG[risk.level];
              return (
                <div
                  key={risk.studentId}
                  className={`rounded-xl p-3.5 border ${config.border} ${config.bg} card-hover`}
                >
                  <div className="flex items-center gap-2.5 mb-2">
                    <span className="text-xl">{student.avatar}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[var(--foreground)] truncate">{student.name}</p>
                      <p className="text-[10px] text-[var(--foreground-muted)] truncate">{risk.reasons[0]}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${config.bg} ${config.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
                      {config.label}
                    </span>
                  </div>
                  <div className="flex items-start gap-1.5 pt-2 border-t border-[var(--border)]">
                    <Zap className="w-3 h-3 text-[var(--accent)] mt-0.5 shrink-0" />
                    <p className="text-[11px] text-[var(--foreground-muted)] leading-relaxed">{risk.immediateAction}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
