'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  TrendingUp,
  AlertTriangle,
  Target,
  Activity,
  ArrowUpDown,
  Search,
  Clock,
  CheckCircle2,
} from 'lucide-react';

// ===== Helper =====
function toPersianDigits(num: number | string): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return num.toString().split('').map((d) => persianDigits[parseInt(d)] ?? d).join('');
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  excellent: { label: 'عالی', color: 'text-mint', bg: 'bg-mint/15', dot: 'bg-mint' },
  good: { label: 'خوب', color: 'text-sky-400', bg: 'bg-sky-500/15', dot: 'bg-sky-500' },
  fair: { label: 'متوسط', color: 'text-amber-400', bg: 'bg-amber-500/15', dot: 'bg-amber-500' },
  'at-risk': { label: 'در خطر', color: 'text-orange-400', bg: 'bg-orange-500/15', dot: 'bg-orange-500' },
  critical: { label: 'بحرانی', color: 'text-red-400', bg: 'bg-red-500/15', dot: 'bg-red-500' },
};

type SortKey = 'name' | 'mockExamScore' | 'weeklyCompletionRate' | 'totalStudyHours';
type FilterAdvisor = 'all' | 'unassigned' | string;
type FilterPerformance = 'all' | 'top' | 'at-risk';

export default function InstituteDashboard() {
  const { instituteProfile, instituteStudents, instituteAdvisors } = useAppStore();
  const [sortKey, setSortKey] = useState<SortKey>('mockExamScore');
  const [sortDesc, setSortDesc] = useState(true);
  const [filterAdvisor, setFilterAdvisor] = useState<FilterAdvisor>('all');
  const [filterPerformance, setFilterPerformance] = useState<FilterPerformance>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Compute KPIs
  const kpis = useMemo(() => {
    const totalStudents = instituteStudents.length;
    const totalAdvisors = instituteAdvisors.filter((a) => a.isActive).length;
    const avgCompletion = totalStudents > 0
      ? Math.round(instituteStudents.reduce((sum, s) => sum + s.weeklyCompletionRate, 0) / totalStudents)
      : 0;
    const avgScore = totalStudents > 0
      ? Math.round(instituteStudents.reduce((sum, s) => sum + s.mockExamScore, 0) / totalStudents)
      : 0;
    const atRiskCount = instituteStudents.filter((s) => s.status === 'at-risk' || s.status === 'critical').length;
    const assignedCount = instituteStudents.filter((s) => s.assignedAdvisorId !== null).length;
    const totalStudyHours = instituteStudents.reduce((sum, s) => sum + s.totalStudyHours, 0);

    return { totalStudents, totalAdvisors, avgCompletion, avgScore, atRiskCount, assignedCount, totalStudyHours };
  }, [instituteStudents, instituteAdvisors]);

  // Status distribution
  const statusDistribution = useMemo(() => {
    const dist: Record<string, number> = { excellent: 0, good: 0, fair: 0, 'at-risk': 0, critical: 0 };
    instituteStudents.forEach((s) => { dist[s.status] = (dist[s.status] || 0) + 1; });
    return dist;
  }, [instituteStudents]);

  // Filtered and sorted students
  const filteredStudents = useMemo(() => {
    let result = [...instituteStudents];

    // Search
    if (searchQuery) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((s) => s.name.includes(q) || s.phone.includes(q));
    }

    // Filter by advisor
    if (filterAdvisor === 'unassigned') {
      result = result.filter((s) => s.assignedAdvisorId === null);
    } else if (filterAdvisor !== 'all') {
      result = result.filter((s) => s.assignedAdvisorId === filterAdvisor);
    }

    // Filter by performance
    if (filterPerformance === 'top') {
      result = result.filter((s) => s.status === 'excellent' || s.status === 'good');
    } else if (filterPerformance === 'at-risk') {
      result = result.filter((s) => s.status === 'at-risk' || s.status === 'critical');
    }

    // Sort
    result.sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;
      if (sortKey === 'name') {
        aVal = a.name;
        bVal = b.name;
      } else {
        aVal = a[sortKey];
        bVal = b[sortKey];
      }
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDesc ? bVal.localeCompare(aVal) : aVal.localeCompare(bVal);
      }
      return sortDesc ? (bVal as number) - (aVal as number) : (aVal as number) - (bVal as number);
    });

    return result;
  }, [instituteStudents, searchQuery, filterAdvisor, filterPerformance, sortKey, sortDesc]);

  const getAdvisorName = (advisorId: string | null) => {
    if (!advisorId) return '—';
    const advisor = instituteAdvisors.find((a) => a.id === advisorId);
    return advisor ? advisor.name : '—';
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDesc(!sortDesc);
    } else {
      setSortKey(key);
      setSortDesc(true);
    }
  };

  // KPI card definitions
  const kpiCards = [
    {
      label: 'دانش‌آموزان',
      value: kpis.totalStudents,
      icon: GraduationCap,
      tint: 'bg-mint/15 text-mint',
      sub: `${toPersianDigits(kpis.assignedCount)} تخصیص‌یافته`,
    },
    {
      label: 'مشاوران فعال',
      value: kpis.totalAdvisors,
      icon: Users,
      tint: 'bg-sky-500/15 text-sky-400',
      sub: `${toPersianDigits(instituteAdvisors.length)} کل مشاوران`,
    },
    {
      label: 'میانگین نمره',
      value: kpis.avgScore,
      icon: Target,
      tint: 'bg-amber-500/15 text-amber-400',
      sub: 'از ۱۰۰',
    },
    {
      label: 'در خطر / بحرانی',
      value: kpis.atRiskCount,
      icon: AlertTriangle,
      tint: 'bg-red-500/15 text-red-400',
      sub: kpis.atRiskCount > 0 ? 'نیازمند توجه' : 'بدون هشدار',
    },
  ];

  return (
    <div className="space-y-5 md:space-y-6 animate-fade-in-up">
      {/* ============ Page Header ============ */}
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 md:w-12 md:h-12 rounded-[14px] bg-mint/15 border border-mint/20 flex items-center justify-center shrink-0">
            <LayoutDashboard className="w-5 h-5 md:w-6 md:h-6 text-mint" />
          </div>
          <div>
            <h1 className="text-lg md:text-2xl font-bold text-foreground leading-tight">
              داشبورد {instituteProfile.name}
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground mt-0.5">نمای کلی عملکرد آموزشگاه</p>
          </div>
        </div>
      </header>

      {/* ============ KPI Cards ============ */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {kpiCards.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.04 * idx, duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
              className="card-hover surface-1 edge-highlight rounded-[16px] p-4 md:p-5 relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-9 h-9 md:w-10 md:h-10 rounded-[10px] flex items-center justify-center ${kpi.tint}`}>
                  <Icon className="w-4 h-4 md:w-5 md:h-5" />
                </div>
              </div>
              <p className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
                {toPersianDigits(kpi.value)}
              </p>
              <p className="text-xs md:text-sm text-muted-foreground mt-1">{kpi.label}</p>
              <p className="text-[10px] md:text-[11px] text-muted-foreground/70 mt-0.5">{kpi.sub}</p>
            </motion.div>
          );
        })}
      </section>

      {/* ============ Quick Stats Row ============ */}
      <section className="grid grid-cols-3 gap-3">
        <div className="surface-1 rounded-[12px] p-3 md:p-4 text-center card-hover">
          <div className="flex items-center justify-center gap-1.5 mb-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-mint" />
            <p className="text-[10px] md:text-xs text-muted-foreground">تخصیص‌یافته</p>
          </div>
          <p className="text-base md:text-lg font-bold text-foreground">
            {toPersianDigits(kpis.assignedCount)}<span className="text-muted-foreground/60 mx-0.5">/</span>{toPersianDigits(kpis.totalStudents)}
          </p>
        </div>
        <div className="surface-1 rounded-[12px] p-3 md:p-4 text-center card-hover">
          <div className="flex items-center justify-center gap-1.5 mb-1.5">
            <Activity className="w-3.5 h-3.5 text-amber-400" />
            <p className="text-[10px] md:text-xs text-muted-foreground">میانگین تکمیل</p>
          </div>
          <p className="text-base md:text-lg font-bold text-amber-400">{toPersianDigits(kpis.avgCompletion)}٪</p>
        </div>
        <div className="surface-1 rounded-[12px] p-3 md:p-4 text-center card-hover">
          <div className="flex items-center justify-center gap-1.5 mb-1.5">
            <Clock className="w-3.5 h-3.5 text-sky-400" />
            <p className="text-[10px] md:text-xs text-muted-foreground">مجموع ساعت</p>
          </div>
          <p className="text-base md:text-lg font-bold text-sky-400">{toPersianDigits(kpis.totalStudyHours)}</p>
        </div>
      </section>

      {/* ============ Main 12-col Grid: Table + Status ============ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
        {/* ----- Sortable Data Table (col-span-8 on desktop) ----- */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-8 surface-1 rounded-[16px] overflow-hidden"
        >
          {/* Toolbar */}
          <div className="p-4 md:p-5 border-b border-[var(--border)]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm md:text-base font-semibold text-foreground">جدول عملکرد دانش‌آموزان</h3>
              <span className="text-[11px] md:text-xs text-muted-foreground">{toPersianDigits(filteredStudents.length)} نفر</span>
            </div>

            {/* Search + Filters */}
            <div className="flex flex-col gap-2.5">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                <input
                  type="text"
                  placeholder="جستجوی نام یا شماره..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[var(--bg-overlay)] border border-[var(--border)] rounded-[10px] pr-10 pl-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-mint/50 focus:bg-[var(--bg-overlay)] transition-colors"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={filterAdvisor}
                  onChange={(e) => setFilterAdvisor(e.target.value as FilterAdvisor)}
                  className="flex-1 bg-[var(--bg-overlay)] border border-[var(--border)] rounded-[10px] px-3 py-2 text-xs text-foreground/90 focus:outline-none focus:border-mint/50 transition-colors"
                >
                  <option value="all">همه مشاوران</option>
                  <option value="unassigned">بدون مشاور</option>
                  {instituteAdvisors.filter((a) => a.isActive).map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
                <select
                  value={filterPerformance}
                  onChange={(e) => setFilterPerformance(e.target.value as FilterPerformance)}
                  className="flex-1 bg-[var(--bg-overlay)] border border-[var(--border)] rounded-[10px] px-3 py-2 text-xs text-foreground/90 focus:outline-none focus:border-mint/50 transition-colors"
                >
                  <option value="all">همه عملکردها</option>
                  <option value="top">برترین‌ها</option>
                  <option value="at-risk">در خطر</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table — Desktop */}
          <div className="hidden md:block">
            {/* Header */}
            <div className="grid grid-cols-12 gap-2 px-5 py-2.5 text-[11px] text-muted-foreground/70 font-semibold uppercase tracking-wide border-b border-[var(--border)] bg-[var(--bg-base)]/40">
              <button
                onClick={() => handleSort('name')}
                className="col-span-4 flex items-center gap-1 hover:text-foreground transition-colors text-right"
              >
                دانش‌آموز <ArrowUpDown className={`w-3 h-3 ${sortKey === 'name' ? 'text-mint' : 'opacity-40'}`} />
              </button>
              <button
                onClick={() => handleSort('mockExamScore')}
                className="col-span-2 flex items-center gap-1 hover:text-foreground transition-colors text-right"
              >
                نمره <ArrowUpDown className={`w-3 h-3 ${sortKey === 'mockExamScore' ? 'text-mint' : 'opacity-40'}`} />
              </button>
              <button
                onClick={() => handleSort('weeklyCompletionRate')}
                className="col-span-3 flex items-center gap-1 hover:text-foreground transition-colors text-right"
              >
                نرخ تکمیل <ArrowUpDown className={`w-3 h-3 ${sortKey === 'weeklyCompletionRate' ? 'text-mint' : 'opacity-40'}`} />
              </button>
              <button
                onClick={() => handleSort('totalStudyHours')}
                className="col-span-1 flex items-center gap-1 hover:text-foreground transition-colors text-right"
              >
                ساعت <ArrowUpDown className={`w-3 h-3 ${sortKey === 'totalStudyHours' ? 'text-mint' : 'opacity-40'}`} />
              </button>
              <div className="col-span-2 text-right">مشاور</div>
            </div>

            {/* Rows */}
            <div className="max-h-[480px] overflow-y-auto custom-scrollbar">
              <AnimatePresence>
                {filteredStudents.map((student, idx) => {
                  const statusCfg = STATUS_CONFIG[student.status];
                  return (
                    <motion.div
                      key={student.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: idx * 0.02, duration: 0.2 }}
                      className="nav-item-hover grid grid-cols-12 gap-2 px-5 py-3 border-b border-[var(--border)] last:border-0 items-center"
                    >
                      <div className="col-span-4 flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-[10px] bg-[var(--bg-overlay)] flex items-center justify-center text-lg shrink-0">
                          {student.avatar}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{student.name}</p>
                          <p className="text-[11px] text-muted-foreground/70 truncate">{student.grade} • {student.major}</p>
                        </div>
                      </div>
                      <div className="col-span-2 flex items-center gap-2">
                        <span className="text-sm font-bold text-foreground">{toPersianDigits(student.mockExamScore)}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${statusCfg.bg} ${statusCfg.color} font-medium`}>
                          {statusCfg.label}
                        </span>
                      </div>
                      <div className="col-span-3 flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-[var(--bg-overlay)] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              student.weeklyCompletionRate >= 75 ? 'bg-mint' : student.weeklyCompletionRate >= 50 ? 'bg-amber-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${student.weeklyCompletionRate}%` }}
                          />
                        </div>
                        <span className="text-[11px] text-muted-foreground tabular-nums">{toPersianDigits(student.weeklyCompletionRate)}٪</span>
                      </div>
                      <div className="col-span-1 text-xs text-muted-foreground tabular-nums">
                        {toPersianDigits(student.totalStudyHours)}
                      </div>
                      <div className="col-span-2 text-xs text-muted-foreground truncate">
                        {getAdvisorName(student.assignedAdvisorId)}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              {filteredStudents.length === 0 && (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  دانش‌آموزی با این فیلتر یافت نشد
                </div>
              )}
            </div>
          </div>

          {/* Cards — Mobile */}
          <div className="md:hidden divide-y divide-[var(--border)]">
            <AnimatePresence>
              {filteredStudents.map((student, idx) => {
                const statusCfg = STATUS_CONFIG[student.status];
                return (
                  <motion.div
                    key={student.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: idx * 0.02, duration: 0.2 }}
                    className="nav-item-hover p-4"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-[10px] bg-[var(--bg-overlay)] flex items-center justify-center text-xl shrink-0">
                        {student.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{student.name}</p>
                        <p className="text-[11px] text-muted-foreground/70">{student.grade} • {student.major}</p>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusCfg.bg} ${statusCfg.color} font-medium shrink-0`}>
                        {statusCfg.label}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-[var(--bg-overlay)] rounded-[8px] py-1.5">
                        <p className="text-[10px] text-muted-foreground/70">نمره</p>
                        <p className="text-sm font-bold text-foreground">{toPersianDigits(student.mockExamScore)}</p>
                      </div>
                      <div className="bg-[var(--bg-overlay)] rounded-[8px] py-1.5">
                        <p className="text-[10px] text-muted-foreground/70">تکمیل</p>
                        <p className="text-sm font-bold text-amber-400">{toPersianDigits(student.weeklyCompletionRate)}٪</p>
                      </div>
                      <div className="bg-[var(--bg-overlay)] rounded-[8px] py-1.5">
                        <p className="text-[10px] text-muted-foreground/70">ساعت</p>
                        <p className="text-sm font-bold text-sky-400">{toPersianDigits(student.totalStudyHours)}</p>
                      </div>
                    </div>
                    <div className="mt-2 text-[11px] text-muted-foreground/80">
                      مشاور: <span className="text-foreground/90">{getAdvisorName(student.assignedAdvisorId)}</span>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            {filteredStudents.length === 0 && (
              <div className="text-center py-10 text-muted-foreground text-sm">دانش‌آموزی یافت نشد</div>
            )}
          </div>
        </motion.section>

        {/* ----- Status Distribution (col-span-4 on desktop) ----- */}
        <motion.aside
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="lg:col-span-4 surface-1 rounded-[16px] p-4 md:p-5 self-start"
        >
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-mint" />
            <h3 className="text-sm md:text-base font-semibold text-foreground">توزیع وضعیت</h3>
          </div>

          {/* Stacked bar */}
          <div className="flex gap-0.5 h-3 rounded-full overflow-hidden mb-4 bg-[var(--bg-overlay)]">
            {Object.entries(statusDistribution).map(([status, count]) => {
              if (count === 0) return null;
              return (
                <div
                  key={status}
                  className={`${STATUS_CONFIG[status].dot} transition-all`}
                  style={{ width: `${kpis.totalStudents > 0 ? (count / kpis.totalStudents) * 100 : 0}%` }}
                />
              );
            })}
          </div>

          {/* Legend */}
          <div className="space-y-2.5">
            {Object.entries(statusDistribution).map(([status, count]) => {
              const cfg = STATUS_CONFIG[status];
              const pct = kpis.totalStudents > 0 ? Math.round((count / kpis.totalStudents) * 100) : 0;
              return (
                <div key={status} className="flex items-center justify-between">
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

          {/* Footer hint */}
          <div className="mt-4 pt-4 border-t border-[var(--border)]">
            <div className="flex items-start gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-mint mt-0.5 shrink-0" />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {kpis.atRiskCount > 0
                  ? `${toPersianDigits(kpis.atRiskCount)} دانش‌آموز نیازمند توجه فوری هستند.`
                  : 'وضعیت کلی دانش‌آموزان مطلوب است.'}
              </p>
            </div>
          </div>
        </motion.aside>
      </div>
    </div>
  );
}
