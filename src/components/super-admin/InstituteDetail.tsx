'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import {
  ChevronRight,
  Building2,
  Users,
  GraduationCap,
  Crown,
  Zap,
  Phone,
  Calendar,
  ShieldCheck,
  Activity,
} from 'lucide-react';

function toPersianDigits(num: number | string): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return num.toString().split('').map((d) => persianDigits[parseInt(d)] ?? d).join('');
}

const SUB_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  free: { label: 'رایگان', color: 'text-muted-foreground', bg: 'bg-zinc-500/15' },
  basic: { label: 'پایه', color: 'text-muted-foreground', bg: 'bg-white/5' },
  pro: { label: 'حرفه‌ای', color: 'text-gold', bg: 'bg-gold/15' },
  enterprise: { label: 'سازمانی', color: 'text-gold', bg: 'bg-gold/15' },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  active: { label: 'فعال', color: 'text-[var(--success)]', bg: 'bg-[var(--success)]/15', dot: 'bg-[var(--success)]' },
  suspended: { label: 'معلق', color: 'text-[var(--danger)]', bg: 'bg-[var(--danger)]/15', dot: 'bg-[var(--danger)]' },
  trial: { label: 'آزمایشی', color: 'text-[var(--warning)]', bg: 'bg-[var(--warning)]/15', dot: 'bg-[var(--warning)]' },
};

export default function InstituteDetail() {
  const { selectedInstituteId, platformInstitutes, globalUsers, setCurrentView } = useAppStore();

  const institute = useMemo(() =>
    platformInstitutes.find((i) => i.id === selectedInstituteId),
    [selectedInstituteId, platformInstitutes]
  );

  const instituteUsers = useMemo(() =>
    globalUsers.filter((u) => u.instituteId === selectedInstituteId),
    [selectedInstituteId, globalUsers]
  );

  const students = useMemo(() =>
    instituteUsers.filter((u) => u.role === 'student'),
    [instituteUsers]
  );

  const advisors = useMemo(() =>
    instituteUsers.filter((u) => u.role === 'advisor'),
    [instituteUsers]
  );

  if (!institute) {
    return (
      <div className="max-w-md mx-auto text-center py-20 animate-fade-in-up">
        <Building2 className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
        <p className="text-muted-foreground mb-4">موسسه‌ای انتخاب نشده</p>
        <button
          onClick={() => setCurrentView('sa-institutes')}
          className="btn-hover text-gold text-sm font-bold"
        >
          بازگشت به لیست موسسات
        </button>
      </div>
    );
  }

  const subCfg = SUB_CONFIG[institute.subscriptionPlan];
  const statusCfg = STATUS_CONFIG[institute.status];

  return (
    <div className="space-y-5 md:space-y-6 animate-fade-in-up">
      {/* ============ Back Header ============ */}
      <header className="flex items-center justify-between gap-3">
        <button
          onClick={() => setCurrentView('sa-institutes')}
          className="nav-item-hover flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground px-3 py-2 rounded-[10px] -mr-3"
        >
          <ChevronRight className="w-4 h-4 flip-rtl" />
          بازگشت به موسسات
        </button>
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-gold/15 text-gold border border-gold/30">
          <Crown className="w-3 h-3" />
          GOD VIEW
        </span>
      </header>

      {/* ============ Institute Hero Card ============ */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="relative surface-1 edge-highlight rounded-[20px] p-5 md:p-7 overflow-hidden"
      >
        <div className="relative">
          <div className="flex items-start gap-4 flex-wrap">
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-[14px] bg-gold/15 border border-gold/25 flex items-center justify-center shrink-0">
              <Building2 className="w-7 h-7 md:w-8 md:h-8 text-gold" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl md:text-2xl font-bold text-foreground">{institute.name}</h1>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${subCfg.bg} ${subCfg.color} font-medium`}>{subCfg.label}</span>
                <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full ${statusCfg.bg} ${statusCfg.color} font-medium`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                  {statusCfg.label}
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Phone className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
                  <span className="text-xs text-muted-foreground truncate">مدیر: {institute.managerName}</span>
                </div>
                <div className="flex items-center gap-1.5 min-w-0">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
                  <span className="text-xs text-muted-foreground tabular-nums">{toPersianDigits(institute.createdAt)}</span>
                </div>
                <div className="flex items-center gap-1.5 min-w-0">
                  <GraduationCap className="w-3.5 h-3.5 text-mint shrink-0" />
                  <span className="text-xs text-muted-foreground tabular-nums">{toPersianDigits(institute.studentCount)} دانش‌آموز</span>
                </div>
                <div className="flex items-center gap-1.5 min-w-0">
                  <Users className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span className="text-xs text-muted-foreground tabular-nums">{toPersianDigits(institute.advisorCount)} مشاور</span>
                </div>
              </div>
            </div>
          </div>

          {/* Avg completion bar */}
          <div className="mt-5 pt-5 border-t border-[var(--border)]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-gold" />
                نرخ تکمیل میانگین
              </span>
              <span className="text-base font-bold text-gold tabular-nums">{toPersianDigits(institute.avgCompletionRate)}٪</span>
            </div>
            <div className="h-2 bg-[var(--bg-overlay)] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${institute.avgCompletionRate}%` }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="h-full bg-[var(--gold)] rounded-full"
              />
            </div>
          </div>
        </div>
      </motion.section>

      {/* ============ Main 12-col Grid: Advisors+Students Left, Metrics+Info Right ============ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
        {/* ----- Left col-span-8: Advisors + Students tables ----- */}
        <div className="lg:col-span-8 space-y-4 md:space-y-6">
          {/* Advisors */}
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="surface-1 rounded-[16px] p-4 md:p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                مشاوران
                <span className="text-xs text-muted-foreground font-normal tabular-nums">({toPersianDigits(advisors.length)})</span>
              </h3>
            </div>

            {/* Desktop table */}
            <div className="hidden md:block">
              <div className="grid grid-cols-12 gap-2 px-2 py-2 text-[10px] text-muted-foreground/70 font-semibold uppercase tracking-wide border-b border-[var(--border)]">
                <div className="col-span-5">مشاور</div>
                <div className="col-span-4">شماره</div>
                <div className="col-span-3 text-right">وضعیت</div>
              </div>
              <div className="max-h-72 overflow-y-auto custom-scrollbar">
                {advisors.map((advisor) => (
                  <div key={advisor.id} className="nav-item-hover grid grid-cols-12 gap-2 px-2 py-3 border-b border-[var(--border)] last:border-0 items-center">
                    <div className="col-span-5 flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-[10px] bg-[var(--accent-soft)] flex items-center justify-center text-lg shrink-0">
                        {advisor.avatar}
                      </div>
                      <span className="text-sm text-foreground truncate">{advisor.name}</span>
                    </div>
                    <div className="col-span-4">
                      <span className="text-xs text-muted-foreground tabular-nums" dir="ltr">{advisor.phone}</span>
                    </div>
                    <div className="col-span-3 text-right">
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${advisor.status === 'active' ? 'bg-[var(--success)]/15 text-[var(--success)]' : 'bg-[var(--danger)]/15 text-[var(--danger)]'}`}>
                        {advisor.status === 'active' ? 'فعال' : 'معلق'}
                      </span>
                    </div>
                  </div>
                ))}
                {advisors.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-6">مشاوری ثبت نشده</p>
                )}
              </div>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-2">
              {advisors.map((advisor) => (
                <div key={advisor.id} className="nav-item-hover flex items-center gap-3 p-3 bg-[var(--bg-overlay)] rounded-[10px]">
                  <div className="w-10 h-10 rounded-[10px] bg-[var(--accent-soft)] flex items-center justify-center text-xl shrink-0">
                    {advisor.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{advisor.name}</p>
                    <p className="text-[11px] text-muted-foreground tabular-nums" dir="ltr">{advisor.phone}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${advisor.status === 'active' ? 'bg-[var(--success)]/15 text-[var(--success)]' : 'bg-[var(--danger)]/15 text-[var(--danger)]'}`}>
                    {advisor.status === 'active' ? 'فعال' : 'معلق'}
                  </span>
                </div>
              ))}
              {advisors.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">مشاوری ثبت نشده</p>
              )}
            </div>
          </motion.section>

          {/* Students */}
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="surface-1 rounded-[16px] p-4 md:p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-mint" />
                دانش‌آموزان
                <span className="text-xs text-muted-foreground font-normal tabular-nums">({toPersianDigits(students.length)})</span>
              </h3>
            </div>

            {/* Desktop table */}
            <div className="hidden md:block">
              <div className="grid grid-cols-12 gap-2 px-2 py-2 text-[10px] text-muted-foreground/70 font-semibold uppercase tracking-wide border-b border-[var(--border)]">
                <div className="col-span-5">دانش‌آموز</div>
                <div className="col-span-5">عملکرد</div>
                <div className="col-span-2 text-right">وضعیت</div>
              </div>
              <div className="max-h-96 overflow-y-auto custom-scrollbar">
                {students.map((student) => (
                  <div key={student.id} className="nav-item-hover grid grid-cols-12 gap-2 px-2 py-3 border-b border-[var(--border)] last:border-0 items-center">
                    <div className="col-span-5 flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-[10px] bg-[var(--accent-soft)] flex items-center justify-center text-lg shrink-0">
                        {student.avatar}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-foreground truncate">{student.name}</p>
                        <p className="text-[11px] text-muted-foreground/70 tabular-nums" dir="ltr">{student.phone}</p>
                      </div>
                    </div>
                    <div className="col-span-5 flex items-center gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground w-12">تکمیل</span>
                          <div className="flex-1 h-1.5 bg-[var(--bg-overlay)] rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${student.completionRate >= 75 ? 'bg-[var(--success)]' : student.completionRate >= 50 ? 'bg-[var(--warning)]' : 'bg-[var(--danger)]'}`}
                              style={{ width: `${student.completionRate}%` }}
                            />
                          </div>
                          <span className="text-[11px] text-foreground font-medium tabular-nums">{toPersianDigits(student.completionRate)}٪</span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                          <span className="tabular-nums">{toPersianDigits(student.studyHours)} ساعت</span>
                          <span className="tabular-nums">نمره {toPersianDigits(student.mockExamScore)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="col-span-2 text-right">
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${student.status === 'active' ? 'bg-[var(--success)]/15 text-[var(--success)]' : 'bg-[var(--danger)]/15 text-[var(--danger)]'}`}>
                        {student.status === 'active' ? 'فعال' : 'معلق'}
                      </span>
                    </div>
                  </div>
                ))}
                {students.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-6">دانش‌آموزی ثبت نشده</p>
                )}
              </div>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
              {students.map((student) => (
                <div key={student.id} className="nav-item-hover p-3 bg-[var(--bg-overlay)] rounded-[10px]">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-[10px] bg-[var(--accent-soft)] flex items-center justify-center text-xl shrink-0">
                      {student.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{student.name}</p>
                      <p className="text-[11px] text-muted-foreground tabular-nums" dir="ltr">{student.phone}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${student.status === 'active' ? 'bg-[var(--success)]/15 text-[var(--success)]' : 'bg-[var(--danger)]/15 text-[var(--danger)]'}`}>
                      {student.status === 'active' ? 'فعال' : 'معلق'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-[10px] text-muted-foreground/70">تکمیل</p>
                      <p className="text-xs font-bold text-[var(--warning)] tabular-nums">{toPersianDigits(student.completionRate)}٪</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground/70">ساعت</p>
                      <p className="text-xs font-bold text-muted-foreground tabular-nums">{toPersianDigits(student.studyHours)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground/70">نمره</p>
                      <p className="text-xs font-bold text-foreground tabular-nums">{toPersianDigits(student.mockExamScore)}</p>
                    </div>
                  </div>
                </div>
              ))}
              {students.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">دانش‌آموزی ثبت نشده</p>
              )}
            </div>
          </motion.section>
        </div>

        {/* ----- Right col-span-4: Metrics + Info ----- */}
        <aside className="lg:col-span-4 space-y-4 md:space-y-6">
          {/* Quick metrics */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="surface-1 rounded-[16px] p-5"
          >
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-gold" />
              شاخص‌های کلیدی
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-[10px] bg-[var(--success)]/10 border border-[var(--success)]/15 p-3 text-center">
                <p className="text-xl font-bold text-[var(--success)] tabular-nums">{toPersianDigits(institute.studentCount)}</p>
                <p className="text-[11px] text-muted-foreground">دانش‌آموز</p>
              </div>
              <div className="rounded-[10px] bg-[var(--accent-soft)] border border-[var(--accent)]/15 p-3 text-center">
                <p className="text-xl font-bold text-[var(--accent)] tabular-nums">{toPersianDigits(institute.advisorCount)}</p>
                <p className="text-[11px] text-muted-foreground">مشاور</p>
              </div>
              <div className="rounded-[10px] bg-gold/10 border border-gold/15 p-3 text-center col-span-2">
                <p className="text-xl font-bold text-gold tabular-nums">{toPersianDigits(institute.avgCompletionRate)}٪</p>
                <p className="text-[11px] text-muted-foreground">میانگین تکمیل</p>
              </div>
            </div>
          </motion.div>

          {/* Institute info */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="surface-1 rounded-[16px] p-5"
          >
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-gold" />
              اطلاعات موسسه
            </h3>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between p-2.5 bg-[var(--bg-overlay)] rounded-[10px]">
                <span className="text-xs text-muted-foreground">شناسه</span>
                <span className="text-xs text-foreground font-mono" dir="ltr">{institute.id.slice(0, 12)}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-[var(--bg-overlay)] rounded-[10px]">
                <span className="text-xs text-muted-foreground">مدیر</span>
                <span className="text-xs text-foreground font-medium">{institute.managerName}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-[var(--bg-overlay)] rounded-[10px]">
                <span className="text-xs text-muted-foreground">طرح اشتراک</span>
                <span className={`text-xs font-medium ${subCfg.color}`}>{subCfg.label}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-[var(--bg-overlay)] rounded-[10px]">
                <span className="text-xs text-muted-foreground">تاریخ ثبت</span>
                <span className="text-xs text-foreground font-medium tabular-nums">{toPersianDigits(institute.createdAt)}</span>
              </div>
            </div>
          </motion.div>
        </aside>
      </div>
    </div>
  );
}
