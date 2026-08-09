'use client';

import { useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import {
  Building2,
  Users,
  GraduationCap,
  TrendingUp,
  Activity,
  Zap,
  Crown,
  ShieldCheck,
  AlertOctagon,
  Sparkles,
} from 'lucide-react';

function toPersianDigits(num: number | string): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return num.toString().split('').map((d) => persianDigits[parseInt(d)] ?? d).join('');
}

export default function SuperAdminDashboard() {
  const { platformInstitutes, globalUsers, loadPlatformInstitutes, loadGlobalUsers } = useAppStore();
  useEffect(() => { loadPlatformInstitutes().catch(() => {}); loadGlobalUsers().catch(() => {}); }, [loadPlatformInstitutes, loadGlobalUsers]);

  // Platform-wide KPIs
  const kpis = useMemo(() => {
    const totalInstitutes = platformInstitutes.length;
    const activeInstitutes = platformInstitutes.filter((i) => i.status === 'active').length;
    const totalStudents = globalUsers.filter((user) => user.role === 'student').length;
    const totalAdvisors = globalUsers.filter((user) => user.role === 'advisor').length;
    const avgCompletion = totalInstitutes > 0
      ? Math.round(platformInstitutes.reduce((s, i) => s + i.avgCompletionRate, 0) / totalInstitutes)
      : 0;
    const activeUsers = globalUsers.filter((u) => u.status === 'active').length;
    const suspendedUsers = globalUsers.filter((u) => u.status === 'suspended').length;
    const proInstitutes = platformInstitutes.filter((i) => i.subscriptionPlan === 'pro' || i.subscriptionPlan === 'enterprise').length;

    return { totalInstitutes, activeInstitutes, totalStudents, totalAdvisors, avgCompletion, activeUsers, suspendedUsers, proInstitutes };
  }, [platformInstitutes, globalUsers]);

  // Subscription distribution
  const subscriptionDist = useMemo(() => {
    const dist: Record<string, number> = { free: 0, basic: 0, pro: 0, enterprise: 0 };
    platformInstitutes.forEach((i) => { dist[i.subscriptionPlan] = (dist[i.subscriptionPlan] || 0) + 1; });
    return dist;
  }, [platformInstitutes]);

  const SUB_LABELS: Record<string, { label: string; color: string; bg: string; dot: string }> = {
    free: { label: 'رایگان', color: 'text-muted-foreground', bg: 'bg-zinc-500/15', dot: 'bg-zinc-500' },
    basic: { label: 'پایه', color: 'text-muted-foreground', bg: 'bg-white/5', dot: 'bg-muted-foreground' },
    pro: { label: 'حرفه‌ای', color: 'text-gold', bg: 'bg-gold/15', dot: 'bg-gold' },
    enterprise: { label: 'سازمانی', color: 'text-gold', bg: 'bg-gold/15', dot: 'bg-gold' },
  };

  // Role distribution
  const roleDist = useMemo(() => {
    const dist: Record<string, number> = { student: 0, advisor: 0, institute_manager: 0 };
    globalUsers.forEach((u) => { dist[u.role] = (dist[u.role] || 0) + 1; });
    return dist;
  }, [globalUsers]);

  // Institute status distribution
  const instituteStatusDist = useMemo(() => {
    const dist: Record<string, number> = { active: 0, suspended: 0, trial: 0 };
    platformInstitutes.forEach((i) => { dist[i.status] = (dist[i.status] || 0) + 1; });
    return dist;
  }, [platformInstitutes]);

  // Max value for engagement bars normalization
  const maxStudents = Math.max(kpis.totalStudents, 1);

  const kpiCards = [
    {
      label: 'موسسات فعال',
      value: `${toPersianDigits(kpis.activeInstitutes)}`,
      sub: `از ${toPersianDigits(kpis.totalInstitutes)}`,
      icon: Building2,
      tint: 'bg-gold/15 text-gold',
      featured: true,
    },
    {
      label: 'کل دانش‌آموزان',
      value: toPersianDigits(kpis.totalStudents),
      sub: 'در پلتفرم',
      icon: GraduationCap,
      tint: 'bg-mint/15 text-mint',
      featured: false,
    },
    {
      label: 'کل مشاوران',
      value: toPersianDigits(kpis.totalAdvisors),
      sub: 'در پلتفرم',
      icon: Users,
      tint: 'bg-white/5 text-muted-foreground',
      featured: false,
    },
    {
      label: 'میانگین تکمیل',
      value: `${toPersianDigits(kpis.avgCompletion)}٪`,
      sub: 'پلتفرم',
      icon: TrendingUp,
      tint: 'bg-gold/15 text-gold',
      featured: false,
    },
  ];

  return (
    <div className="space-y-5 md:space-y-6 animate-fade-in-up">
      {/* ============ God Mode Hero Header ============ */}
      <header className="relative surface-1 edge-highlight rounded-[20px] p-5 md:p-7 overflow-hidden">
        <div className="relative flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-[14px] bg-gold/15 border border-gold/25 flex items-center justify-center shrink-0">
              <Crown className="w-6 h-6 md:w-7 md:h-7 text-gold" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg md:text-2xl font-bold text-foreground leading-tight">داشبورد آماری کلان</h1>
                <span className="inline-flex items-center gap-1 text-[10px] md:text-[11px] font-bold px-2 py-0.5 rounded-full bg-gold/15 text-gold border border-gold/30">
                  <ShieldCheck className="w-3 h-3" />
                  GOD MODE
                </span>
              </div>
              <p className="text-xs md:text-sm text-muted-foreground mt-1">نمای کلی پلتفرم روال — همه موسسات و کاربران</p>
            </div>
          </div>

          {/* Live status pill */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-[10px] bg-[var(--bg-overlay)] border border-[var(--border)]">
            <span className="w-2 h-2 rounded-full bg-mint animate-pulse" />
            <span className="text-xs text-muted-foreground">سیستم فعال</span>
          </div>
        </div>
      </header>

      {/* ============ 4 KPI Cards (top row) ============ */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {kpiCards.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.04 * idx, duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
              className={`card-hover edge-highlight rounded-[16px] p-4 md:p-5 relative overflow-hidden ${
                kpi.featured
                  ? 'bg-[var(--gold-soft)] border border-gold/25'
                  : 'surface-1'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-9 h-9 md:w-10 md:h-10 rounded-[10px] flex items-center justify-center ${kpi.tint}`}>
                  <Icon className="w-4 h-4 md:w-5 md:h-5" />
                </div>
                {kpi.featured && (
                  <span className="text-[10px] text-gold font-bold uppercase tracking-wide">VIP</span>
                )}
              </div>
              <p className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">{kpi.value}</p>
              <p className="text-xs md:text-sm text-muted-foreground mt-1">{kpi.label}</p>
              <p className="text-[10px] md:text-[11px] text-muted-foreground/70 mt-0.5">{kpi.sub}</p>
            </motion.div>
          );
        })}
      </section>

      {/* ============ Main 12-col Grid: Growth Chart + Subscription Distribution ============ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
        {/* Growth Chart (col-span-8) */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-8 surface-1 edge-highlight rounded-[16px] p-4 md:p-6"
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-gold" />
              <h3 className="text-sm md:text-base font-semibold text-foreground">رشد پلتفرم (ماهانه)</h3>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-mint" /> دانش‌آموز
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-muted-foreground" /> مشاور
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {[{ month: 'اکنون', students: kpis.totalStudents, advisors: kpis.totalAdvisors, completionRate: kpis.avgCompletion }].map((item, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-10 md:w-12 text-left tabular-nums">{item.month}</span>
                <div className="flex-1 flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-[var(--bg-overlay)] rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(item.students / maxStudents) * 100}%` }}
                        transition={{ duration: 0.8, delay: idx * 0.1, ease: [0.16, 1, 0.3, 1] }}
                        className="h-full bg-mint rounded-full"
                      />
                    </div>
                    <span className="text-[11px] text-muted-foreground w-7 tabular-nums">{toPersianDigits(item.students)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-[var(--bg-overlay)] rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(item.advisors / 30) * 100}%` }}
                        transition={{ duration: 0.8, delay: idx * 0.1 + 0.05, ease: [0.16, 1, 0.3, 1] }}
                        className="h-full bg-muted-foreground rounded-full"
                      />
                    </div>
                    <span className="text-[11px] text-muted-foreground w-7 tabular-nums">{toPersianDigits(item.advisors)}</span>
                  </div>
                </div>
                <div className="text-center min-w-[44px] md:min-w-[52px] px-2 py-1 rounded-[8px] bg-gold/10 border border-gold/15">
                  <span className="text-sm md:text-base font-bold text-gold tabular-nums">{toPersianDigits(item.completionRate)}٪</span>
                  <p className="text-[9px] text-muted-foreground/70">تکمیل</p>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Subscription Distribution (col-span-4) */}
        <motion.aside
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="lg:col-span-4 surface-1 rounded-[16px] p-4 md:p-6 self-start"
        >
          <div className="flex items-center gap-2 mb-5">
            <Zap className="w-4 h-4 text-gold" />
            <h3 className="text-sm md:text-base font-semibold text-foreground">توزیع اشتراک‌ها</h3>
          </div>

          {/* Stacked bar */}
          <div className="flex gap-0.5 h-3 rounded-full overflow-hidden mb-4 bg-[var(--bg-overlay)]">
            {Object.entries(subscriptionDist).map(([plan, count]) => {
              if (count === 0) return null;
              return (
                <div
                  key={plan}
                  className={`${SUB_LABELS[plan].dot} transition-all`}
                  style={{ width: `${kpis.totalInstitutes > 0 ? (count / kpis.totalInstitutes) * 100 : 0}%` }}
                />
              );
            })}
          </div>

          {/* Legend */}
          <div className="space-y-2.5">
            {Object.entries(subscriptionDist).map(([plan, count]) => {
              const cfg = SUB_LABELS[plan];
              const pct = kpis.totalInstitutes > 0 ? Math.round((count / kpis.totalInstitutes) * 100) : 0;
              return (
                <div key={plan} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                    <span className={`text-xs ${cfg.color}`}>{cfg.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground/70 tabular-nums">{toPersianDigits(pct)}٪</span>
                    <span className="text-xs font-bold text-foreground tabular-nums">{toPersianDigits(count)}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-4 border-t border-[var(--border)] flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-gold shrink-0" />
            <p className="text-[11px] text-muted-foreground">
              <span className="text-gold font-bold">{toPersianDigits(kpis.proInstitutes)}</span> موسسه اشتراک پولی
            </p>
          </div>
        </motion.aside>
      </div>

      {/* ============ 2-col Breakdowns ============ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* Role Distribution */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="surface-1 rounded-[16px] p-4 md:p-6"
        >
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-gold" />
            توزیع نقش‌ها
          </h3>
          <div className="space-y-3">
            {[
              { label: 'دانش‌آموز', value: roleDist.student || 0, color: 'text-mint', bg: 'bg-mint' },
              { label: 'مشاور', value: roleDist.advisor || 0, color: 'text-muted-foreground', bg: 'bg-muted-foreground' },
              { label: 'مدیر آموزشگاه', value: roleDist.institute_manager || 0, color: 'text-gold', bg: 'bg-gold' },
            ].map((role) => {
              const total = (roleDist.student || 0) + (roleDist.advisor || 0) + (roleDist.institute_manager || 0);
              const pct = total > 0 ? Math.round((role.value / total) * 100) : 0;
              return (
                <div key={role.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-muted-foreground">{role.label}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold ${role.color} tabular-nums`}>{toPersianDigits(role.value)}</span>
                      <span className="text-[10px] text-muted-foreground/60 tabular-nums">{toPersianDigits(pct)}٪</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-[var(--bg-overlay)] rounded-full overflow-hidden">
                    <div
                      className={`h-full ${role.bg} rounded-full transition-all`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.section>

        {/* Institute Status */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="surface-1 rounded-[16px] p-4 md:p-6"
        >
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-gold" />
            وضعیت موسسات
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-[10px] bg-[var(--success)]/10 border border-[var(--success)]/15 p-3 text-center">
              <div className="w-8 h-8 rounded-[8px] bg-[var(--success)]/15 flex items-center justify-center mx-auto mb-2">
                <ShieldCheck className="w-4 h-4 text-[var(--success)]" />
              </div>
              <p className="text-lg font-bold text-[var(--success)] tabular-nums">{toPersianDigits(instituteStatusDist.active || 0)}</p>
              <p className="text-[10px] text-muted-foreground">فعال</p>
            </div>
            <div className="rounded-[10px] bg-[var(--warning)]/10 border border-[var(--warning)]/15 p-3 text-center">
              <div className="w-8 h-8 rounded-[8px] bg-[var(--warning)]/15 flex items-center justify-center mx-auto mb-2">
                <Activity className="w-4 h-4 text-[var(--warning)]" />
              </div>
              <p className="text-lg font-bold text-[var(--warning)] tabular-nums">{toPersianDigits(instituteStatusDist.trial || 0)}</p>
              <p className="text-[10px] text-muted-foreground">آزمایشی</p>
            </div>
            <div className="rounded-[10px] bg-[var(--danger)]/10 border border-[var(--danger)]/15 p-3 text-center">
              <div className="w-8 h-8 rounded-[8px] bg-[var(--danger)]/15 flex items-center justify-center mx-auto mb-2">
                <AlertOctagon className="w-4 h-4 text-[var(--danger)]" />
              </div>
              <p className="text-lg font-bold text-[var(--danger)] tabular-nums">{toPersianDigits(instituteStatusDist.suspended || 0)}</p>
              <p className="text-[10px] text-muted-foreground">معلق</p>
            </div>
          </div>
        </motion.section>
      </div>

      {/* ============ Quick Stats Row ============ */}
      <section className="grid grid-cols-3 gap-3">
        <div className="surface-1 rounded-[12px] p-3 md:p-4 text-center card-hover border border-gold/15">
          <p className="text-[10px] md:text-xs text-muted-foreground mb-1">کاربران فعال</p>
          <p className="text-base md:text-lg font-bold text-gold tabular-nums">{toPersianDigits(kpis.activeUsers)}</p>
        </div>
        <div className="surface-1 rounded-[12px] p-3 md:p-4 text-center card-hover border border-[var(--danger)]/15">
          <p className="text-[10px] md:text-xs text-muted-foreground mb-1">معلق</p>
          <p className="text-base md:text-lg font-bold text-[var(--danger)] tabular-nums">{toPersianDigits(kpis.suspendedUsers)}</p>
        </div>
        <div className="surface-1 rounded-[12px] p-3 md:p-4 text-center card-hover border border-gold/15">
          <p className="text-[10px] md:text-xs text-muted-foreground mb-1">اشتراک پولی</p>
          <p className="text-base md:text-lg font-bold text-gold tabular-nums">{toPersianDigits(kpis.proInstitutes)}</p>
        </div>
      </section>
    </div>
  );
}
