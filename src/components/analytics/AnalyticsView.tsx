'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  Clock, FileText, BarChart3, TrendingUp, TrendingDown, ChevronLeft,
  Sparkles, Award, AlertTriangle, Loader2, BookOpen, Layers, Download,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { MOCK_DAILY_DATA, MOCK_SUBJECT_DISTRIBUTION, MOCK_ACTIVITY_DATA } from '@/lib/constants/mockData';
import { Subject, Chapter } from '@/lib/subjects-types';
import { toISODate, getWeekDays, getTodayJalali, getFirstDayOfJalaliMonth, getDaysInJalaliMonth } from '@/lib/persian-date';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import WeeklyGoalCard from '@/components/analytics/WeeklyGoalCard';
import StudyHeatmap from '@/components/analytics/StudyHeatmap';
import { toast } from 'sonner';

const TIME_FILTERS = ['روزانه', 'هفته جاری', 'ماهانه', 'بازه دلخواه'] as const;
const FIELD_FILTERS = ['همه', 'کنکوری', 'نهایی'] as const;
const CHART_TABS = ['روند روزانه', 'سهم دروس', 'نوع فعالیت', 'تفکیک فصول'] as const;
const ANALYTICS_VIEWS = ['نمای کلی', 'نمای فصل‌محور'] as const;

type TimeFilter = (typeof TIME_FILTERS)[number];
type FieldFilter = (typeof FIELD_FILTERS)[number];
type ChartTab = (typeof CHART_TABS)[number];
type AnalyticsViewName = (typeof ANALYTICS_VIEWS)[number];

// Persian digits helper
function toPersianNum(n: number | string): string {
  const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
  return String(n).replace(/\d/g, (d) => persianDigits[parseInt(d)]);
}

// Custom tooltip for dark theme
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color?: string }>; label?: string }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="surface-2 border border-[var(--border-strong)] rounded-[var(--radius-sm)] px-3 py-2 text-sm shadow-lg" dir="rtl">
      <p className="text-[var(--foreground)] mb-1 font-medium">{label}</p>
      {payload.map((item, idx) => (
        <p key={idx} style={{ color: item.color }} className="font-medium">
          {item.name}: <span className="tabular-nums">{toPersianNum(item.value)}</span>
        </p>
      ))}
    </div>
  );
}

// Pie chart center label
function PieCenterLabel({ total }: { total: number }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
      <span className="text-3xl font-bold text-[var(--foreground)] tabular-nums">{toPersianNum(total)}</span>
      <span className="text-xs text-[var(--foreground-muted)]">ساعت</span>
    </div>
  );
}

// ===== Filter pill button =====
function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`btn-hover shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all min-h-[44px] border ${
        active
          ? 'bg-[var(--accent)] text-[var(--bg-deep)] border-[var(--accent)] shadow-[0_4px_12px_-2px_var(--accent-glow)]'
          : 'surface-1 text-[var(--foreground-muted)] border-[var(--border)] hover:border-[var(--border-strong)] hover:text-[var(--foreground)]'
      }`}
    >
      {children}
    </button>
  );
}

// ===== KPI Card =====
function KpiCard({
  icon, label, value, color, index,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.35 }}
      whileHover={{ y: -3 }}
      className="surface-1 edge-highlight card-hover rounded-[var(--radius-lg)] p-4 flex flex-col gap-2 relative overflow-hidden group"
    >
      {/* Subtle gradient accent on hover */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: `radial-gradient(circle at top right, ${color}14 0%, transparent 60%)`,
        }}
      />
      <div
        className="relative w-10 h-10 rounded-[var(--radius)] flex items-center justify-center transition-transform group-hover:scale-110"
        style={{ backgroundColor: `${color}1A` }}
      >
        <span style={{ color }}>{icon}</span>
      </div>
      <div className="relative">
        <p className="text-xl font-bold text-[var(--foreground)] tabular-nums leading-none">{value}</p>
        <p className="text-xs text-[var(--foreground-muted)] mt-1">{label}</p>
      </div>
    </motion.div>
  );
}

// ===== Insight Card =====
function InsightCard({
  icon, title, value, color, index,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  color: string;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.35 }}
      whileHover={{ y: -2 }}
      className="surface-1 edge-highlight card-hover rounded-[var(--radius-lg)] p-4 border-r-[3px] relative overflow-hidden group"
      style={{ borderRightColor: color }}
    >
      {/* Hover gradient accent */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: `linear-gradient(135deg, ${color}10 0%, transparent 50%)`,
        }}
      />
      <div className="flex items-center gap-2 mb-1.5 relative">
        <span
          style={{ color }}
          className="transition-transform group-hover:scale-110 inline-flex"
        >
          {icon}
        </span>
        <span className="text-xs text-[var(--foreground-muted)] font-medium">{title}</span>
      </div>
      <span className="text-sm font-bold text-[var(--foreground)] relative">{value}</span>
    </motion.div>
  );
}

// ===== View Tab Toggle (نمای کلی / نمای فصل‌محور) =====
function ViewTabToggle({
  view,
  onChange,
}: {
  view: AnalyticsViewName;
  onChange: (v: AnalyticsViewName) => void;
}) {
  return (
    <div
      className="inline-flex p-1 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)]"
      role="tablist"
      dir="rtl"
    >
      {ANALYTICS_VIEWS.map((v) => {
        const active = view === v;
        return (
          <button
            key={v}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(v)}
            className={`btn-hover px-4 py-2 rounded-full text-sm font-medium transition-all min-h-[40px] ${
              active
                ? 'bg-[var(--accent)] text-[var(--bg-deep)] border border-[var(--accent)] shadow-[0_4px_12px_-2px_var(--accent-glow)]'
                : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)] border border-transparent'
            }`}
          >
            {v}
          </button>
        );
      })}
    </div>
  );
}

// ===== Main Component =====
export default function AnalyticsView() {
  const { tasks } = useAppStore();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('هفته جاری');
  const [fieldFilter, setFieldFilter] = useState<FieldFilter>('همه');
  const [chartTab, setChartTab] = useState<ChartTab>('روند روزانه');
  const [view, setView] = useState<AnalyticsViewName>('نمای کلی');

  // Calculate KPIs from tasks
  const reportTasks = tasks.filter((t) => t.detailsCompleted !== false);
  const totalTasks = reportTasks.length;
  const completedTasks = reportTasks.filter((t) => t.completed === true).length;
  const adherenceRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Calculate totals from mock data
  const totalHours = MOCK_DAILY_DATA.reduce((sum, d) => sum + d.hours, 0);
  const totalTests = MOCK_DAILY_DATA.reduce((sum, d) => sum + d.tests, 0);
  const dailyAvg = totalHours / MOCK_DAILY_DATA.length;

  // KPI cards data
  const kpiCards = [
    { icon: <Clock className="w-5 h-5" />, label: 'زمان کل', value: `${toPersianNum(totalHours.toFixed(0))} ساعت`, color: '#3EB489' },
    { icon: <FileText className="w-5 h-5" />, label: 'تست‌های حل شده', value: toPersianNum(totalTests), color: '#F59E0B' },
    { icon: <BarChart3 className="w-5 h-5" />, label: 'نرخ پایبندی', value: `${toPersianNum(adherenceRate)}٪`, color: '#8B5CF6' },
    { icon: <TrendingUp className="w-5 h-5" />, label: 'میانگین روزانه', value: `${toPersianNum(dailyAvg.toFixed(1))} ساعت`, color: '#06B6D4' },
  ];

  // Insight cards data
  const insightCards = [
    { icon: <TrendingUp className="w-4 h-4" />, title: 'بیشترین مطالعه', value: 'ریاضی - ۱۲ ساعت', color: '#3EB489' },
    { icon: <TrendingDown className="w-4 h-4" />, title: 'کمترین مطالعه', value: 'ادبیات - ۲ ساعت', color: '#F59E0B' },
    { icon: <Award className="w-4 h-4" />, title: 'منظم‌ترین درس', value: 'فیزیک', color: '#3EB489' },
    { icon: <AlertTriangle className="w-4 h-4" />, title: 'بیشترین کنسلی', value: 'شیمی', color: '#EF4444' },
  ];

  // Activity chart colors
  const ACTIVITY_COLORS = {
    'مطالعه': '#3EB489',
    'مرور': '#F59E0B',
    'تست_آموزشی': '#8B5CF6',
    'تست_سنجشی': '#EF4444',
  };

  const ACTIVITY_LABELS: Record<string, string> = {
    'مطالعه': 'مطالعه',
    'مرور': 'مرور',
    'تست_آموزشی': 'تست آموزشی',
    'تست_سنجشی': 'تست سنجشی',
  };

  const pieTotal = MOCK_SUBJECT_DISTRIBUTION.reduce((sum, d) => sum + d.value, 0);

  function renderPieLegend(payload: Array<{ value: string; color: string }>) {
    return (
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2" dir="rtl">
        {payload.map((entry, idx) => (
          <div key={idx} className="flex items-center gap-1.5 text-xs">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
            <span className="text-[var(--foreground-muted)]">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div dir="rtl">
      {/* ===================================================
          MOBILE LAYOUT (single column, max-w-md)
          =================================================== */}
      <div className="md:hidden max-w-md mx-auto px-4 pt-6 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-[var(--accent)]" />
            <h1 className="text-2xl font-bold text-[var(--foreground)]">گزارش‌ها</h1>
          </div>
          <button
            onClick={() => {
              window.dispatchEvent(new CustomEvent('reval-export-data'));
            }}
            className="glow-hover group flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-elevated)] text-xs font-medium text-[var(--foreground)] hover:border-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
            title="خروجی CSV و JSON"
          >
            <Download className="w-3.5 h-3.5 transition-transform group-hover:translate-y-0.5" />
            خروجی
          </button>
        </div>

        {/* View Tab Toggle */}
        <div className="mb-5">
          <ViewTabToggle view={view} onChange={setView} />
        </div>

        {view === 'نمای کلی' && (
          <>
            {/* Study Heatmap */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="mb-6"
            >
              <StudyHeatmap />
            </motion.div>

            {/* Weekly Study Goal */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut', delay: 0.05 }}
              className="mb-6"
            >
              <WeeklyGoalCard />
            </motion.div>

            {/* Filters */}
            <div className="space-y-3 mb-6">
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {TIME_FILTERS.map((filter) => (
                  <FilterPill
                    key={filter}
                    active={timeFilter === filter}
                    onClick={() => setTimeFilter(filter)}
                  >
                    {filter}
                  </FilterPill>
                ))}
              </div>
              <div className="flex gap-2">
                {FIELD_FILTERS.map((filter) => (
                  <FilterPill
                    key={filter}
                    active={fieldFilter === filter}
                    onClick={() => setFieldFilter(filter)}
                  >
                    {filter}
                  </FilterPill>
                ))}
              </div>
            </div>

            {/* KPI Summary */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {kpiCards.map((card, idx) => (
                <KpiCard key={card.label} {...card} index={idx} />
              ))}
            </div>

            {/* Smart Insights */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-[var(--accent)]" />
                <h2 className="text-sm font-bold text-[var(--foreground)]">بینش‌های هوشمند</h2>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {insightCards.map((card, idx) => (
                  <InsightCard key={card.title} {...card} index={idx} />
                ))}
              </div>
            </div>

            {/* Chart Toggle */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-1 no-scrollbar">
              {CHART_TABS.map((tab) => (
                <FilterPill
                  key={tab}
                  active={chartTab === tab}
                  onClick={() => setChartTab(tab)}
                >
                  {tab}
                </FilterPill>
              ))}
            </div>

            {/* Chart Container */}
            <div className="surface-1 edge-highlight rounded-[var(--radius-lg)] p-4">
              <ChartContent
                chartTab={chartTab}
                timeFilter={timeFilter}
                fieldFilter={fieldFilter}
                ACTIVITY_COLORS={ACTIVITY_COLORS}
                ACTIVITY_LABELS={ACTIVITY_LABELS}
                pieTotal={pieTotal}
                renderPieLegend={renderPieLegend}
              />
            </div>
          </>
        )}

        {view === 'نمای فصل‌محور' && <ChapterCentricReport />}
      </div>

      {/* ===================================================
          DESKTOP LAYOUT (4-col KPI + 2-col charts)
          =================================================== */}
      <div className="hidden md:block">
        {/* Desktop Header */}
        <div className="flex items-end justify-between mb-6 pb-6 border-b border-[var(--border)]">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-[var(--foreground-subtle)] font-semibold">
              <span>گزارش‌ها</span>
              <ChevronLeft className="w-3 h-3 flip-rtl" />
              <span className="text-[var(--accent)]">{view}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-[var(--foreground)]">گزارش‌های مطالعه</h1>
            <p className="text-sm text-[var(--foreground-muted)]">
              تحلیل کامل عملکرد، روند و بینش‌های هوشمند
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent('reval-export-data'));
              }}
              className="glow-hover group flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-elevated)] text-sm font-medium text-[var(--foreground)] hover:border-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
              title="خروجی CSV و JSON"
            >
              <Download className="w-4 h-4 transition-transform group-hover:translate-y-0.5" />
              خروجی داده‌ها
            </button>
            <ViewTabToggle view={view} onChange={setView} />
          </div>
        </div>

        {view === 'نمای کلی' && (
          <>
            {/* Study Heatmap */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="mb-8"
            >
              <StudyHeatmap />
            </motion.div>

            {/* Weekly Study Goal */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut', delay: 0.05 }}
              className="mb-8"
            >
              <WeeklyGoalCard />
            </motion.div>

            {/* Field + Time filters */}
            <div className="flex items-center justify-between gap-2 mb-8 flex-wrap">
              <div className="flex gap-2">
                {TIME_FILTERS.map((filter) => (
                  <FilterPill
                    key={filter}
                    active={timeFilter === filter}
                    onClick={() => setTimeFilter(filter)}
                  >
                    {filter}
                  </FilterPill>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <FilterPill active={fieldFilter === 'همه'} onClick={() => setFieldFilter('همه')}>همه</FilterPill>
                <FilterPill active={fieldFilter === 'کنکوری'} onClick={() => setFieldFilter('کنکوری')}>کنکوری</FilterPill>
                <FilterPill active={fieldFilter === 'نهایی'} onClick={() => setFieldFilter('نهایی')}>نهایی</FilterPill>
              </div>
            </div>

            {/* KPI Grid (4-col) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {kpiCards.map((card, idx) => (
                <KpiCard key={card.label} {...card} index={idx} />
              ))}
            </div>

            {/* Insights + Chart Area (2-col) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              {/* Insights column */}
              <aside className="lg:col-span-1 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-4 h-4 text-[var(--accent)]" />
                  <h2 className="text-sm font-bold text-[var(--foreground)]">بینش‌های هوشمند</h2>
                </div>
                {insightCards.map((card, idx) => (
                  <InsightCard key={card.title} {...card} index={idx} />
                ))}
              </aside>

              {/* Chart column (col-span-2) */}
              <div className="lg:col-span-2 space-y-3">
                {/* Chart Toggle */}
                <div className="flex gap-2">
                  {CHART_TABS.map((tab) => (
                    <FilterPill
                      key={tab}
                      active={chartTab === tab}
                      onClick={() => setChartTab(tab)}
                    >
                      {tab}
                    </FilterPill>
                  ))}
                </div>
                <div className="surface-1 edge-highlight rounded-[var(--radius-lg)] p-5">
                  <ChartContent
                    chartTab={chartTab}
                    timeFilter={timeFilter}
                    fieldFilter={fieldFilter}
                    ACTIVITY_COLORS={ACTIVITY_COLORS}
                    ACTIVITY_LABELS={ACTIVITY_LABELS}
                    pieTotal={pieTotal}
                    renderPieLegend={renderPieLegend}
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {view === 'نمای فصل‌محور' && <ChapterCentricReport />}
      </div>
    </div>
  );
}

// ===== Subject-Chapter Breakdown =====
interface ChapterStats {
  chapter: Chapter;
  targetMinutes: number;
  actualMinutes: number;
  completionRate: number;
}

interface SubjectStats {
  subject: Subject;
  targetMinutes: number;
  actualMinutes: number;
  completionRate: number;
  chapters: ChapterStats[];
}

function SubjectChapterBreakdown({ timeFilter, fieldFilter }: { timeFilter: TimeFilter; fieldFilter: FieldFilter }) {
  const { tasks, user } = useAppStore();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Fetch subjects with tree from API
  useEffect(() => {
    let cancelled = false;
    async function fetchSubjects() {
      setLoading(true);
      setError(false);
      const grade = user?.grade || 'دوازدهم';
      const major = user?.major || 'تجربی';
      try {
        const res = await fetch(`/api/subjects?include=tree&grade=${encodeURIComponent(grade)}&major=${encodeURIComponent(major)}`);
        if (!res.ok) throw new Error('Failed');
        const data = await res.json();
        if (!cancelled) setSubjects(data.subjects || []);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchSubjects();
    return () => { cancelled = true; };
  }, [user]);

  // Filter tasks by date and field
  const filteredTasks = useMemo(() => {
    const now = new Date();
    const todayStr = toISODate(now);

    return tasks.filter((task) => {
      if (task.detailsCompleted === false) return false;
      // Date filter
      if (timeFilter === 'روزانه') {
        if (task.date !== todayStr) return false;
      } else if (timeFilter === 'هفته جاری') {
        const weekDays = getWeekDays(now);
        const weekDateStrs = weekDays.map((d) => toISODate(d));
        if (!weekDateStrs.includes(task.date)) return false;
      } else if (timeFilter === 'ماهانه') {
        const j = getTodayJalali();
        const firstDay = getFirstDayOfJalaliMonth(j.jy, j.jm);
        const daysInMonth = getDaysInJalaliMonth(j.jy, j.jm);
        const lastDay = new Date(firstDay);
        lastDay.setDate(lastDay.getDate() + daysInMonth - 1);
        const lastDayStr = toISODate(lastDay);
        const firstDayStr = toISODate(firstDay);
        if (task.date < firstDayStr || task.date > lastDayStr) return false;
      }
      // بازه دلخواه = no date restriction

      // Field filter
      if (fieldFilter === 'کنکوری' && task.fieldType !== 'کنکور') return false;
      if (fieldFilter === 'نهایی' && task.fieldType !== 'نهایی') return false;

      return true;
    });
  }, [tasks, timeFilter, fieldFilter]);

  // Build subject → chapter stats
  const subjectStats = useMemo((): SubjectStats[] => {
    return subjects
      .map((subject) => {
        // Tasks matching this subject
        const subjectTasks = filteredTasks.filter((t) => t.subject === subject.name && t.fieldType === (subject.isKonkur ? 'کنکور' : 'نهایی'));

        // Per-chapter breakdown
        const chapters = (subject.chapters || [])
          .filter((ch) => ch.isActive)
          .map((chapter) => {
            // Match tasks whose topic equals chapter title, or matches any topic title within the chapter
            const chapterTopicTitles = new Set(
              (chapter.topics || []).filter((tp) => tp.isActive).map((tp) => tp.title)
            );
            const chapterTasks = subjectTasks.filter((t) => {
              if (t.topic === chapter.title) return true;
              if (t.topic && chapterTopicTitles.has(t.topic)) return true;
              return false;
            });

            const targetMinutes = chapterTasks.reduce((sum, t) => sum + (t.targetTimeMinutes ?? 0), 0);
            const actualMinutes = chapterTasks.reduce(
              (sum, t) => sum + (t.actualTimeMinutes ?? 0),
              0
            );
            const completionRate = targetMinutes > 0 ? Math.min(Math.round((actualMinutes / targetMinutes) * 100), 100) : 0;

            return { chapter, targetMinutes, actualMinutes, completionRate };
          });

        const targetMinutes = subjectTasks.reduce((sum, t) => sum + (t.targetTimeMinutes ?? 0), 0);
        const actualMinutes = subjectTasks.reduce(
          (sum, t) => sum + (t.actualTimeMinutes ?? 0),
          0
        );
        const completionRate = targetMinutes > 0 ? Math.min(Math.round((actualMinutes / targetMinutes) * 100), 100) : 0;

        return { subject, targetMinutes, actualMinutes, completionRate, chapters };
      })
      .filter((s) => s.targetMinutes > 0 || s.actualMinutes > 0);
  }, [subjects, filteredTasks]);

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3" dir="rtl">
        <Loader2 className="w-8 h-8 text-[var(--accent)] animate-spin" />
        <p className="text-sm text-[var(--foreground-muted)]">در حال بارگذاری دروس...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3" dir="rtl">
        <AlertTriangle className="w-8 h-8 text-[var(--accent)]" />
        <p className="text-sm text-[var(--foreground-muted)]">خطا در بارگذاری اطلاعات دروس</p>
      </div>
    );
  }

  // Empty state
  if (subjectStats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3" dir="rtl">
        <BookOpen className="w-8 h-8 text-[var(--foreground-muted)]" />
        <p className="text-sm text-[var(--foreground-muted)]">داده‌ای برای نمایش موجود نیست</p>
        <p className="text-xs text-[var(--foreground-subtle)]">ابتدا برنامه مطالعه تنظیم کنید</p>
      </div>
    );
  }

  return (
    <div dir="rtl">
      <h3 className="text-sm font-bold text-[var(--foreground)] mb-4">تفکیک فصول دروس</h3>
      <Accordion type="multiple" className="w-full space-y-2">
        {subjectStats.map(({ subject, targetMinutes, actualMinutes, completionRate, chapters }) => {
          const targetHours = (targetMinutes / 60);
          const actualHours = (actualMinutes / 60);
          return (
            <AccordionItem
              key={subject.id}
              value={subject.id}
              className="surface-2 border border-[var(--border)] rounded-[var(--radius-lg)] overflow-hidden data-[state=open]:border-[var(--border-strong)]"
            >
              <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-[rgba(255,255,255,0.02)] transition-colors [&>svg]:text-[var(--foreground-muted)]">
                <div className="flex items-center gap-3 w-full min-w-0">
                  {/* Color dot */}
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: subject.color }}
                  />
                  {/* Subject name */}
                  <span className="text-sm font-bold text-[var(--foreground)] truncate">
                    {subject.name}
                  </span>
                  {/* Stats */}
                  <div className="flex items-center gap-2 mr-auto text-xs text-[var(--foreground-muted)] shrink-0">
                    <span className="tabular-nums">
                      {toPersianNum(actualHours.toFixed(1))}/{toPersianNum(targetHours.toFixed(1))} ساعت
                    </span>
                    <span
                      className="font-bold tabular-nums"
                      style={{ color: completionRate >= 70 ? '#3EB489' : completionRate >= 40 ? '#F59E0B' : '#EF4444' }}
                    >
                      {toPersianNum(completionRate)}٪
                    </span>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-3">
                {/* Subject-level progress bar */}
                <div className="mb-3">
                  <div className="h-2 rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${completionRate}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: subject.color }}
                    />
                  </div>
                </div>
                {/* Chapter list */}
                <div className="space-y-2.5 max-h-80 overflow-y-auto custom-scrollbar">
                  {chapters.map(({ chapter, targetMinutes: chTarget, actualMinutes: chActual, completionRate: chRate }) => {
                    const chTargetH = (chTarget / 60);
                    const chActualH = (chActual / 60);
                    return (
                      <div key={chapter.id} className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-[var(--foreground)] truncate max-w-[70%]">
                            {toPersianNum(chapter.chapterNo)}- {chapter.title}
                          </span>
                          <div className="flex items-center gap-2 text-[10px] text-[var(--foreground-muted)] shrink-0 tabular-nums">
                            <span>{toPersianNum(chActualH.toFixed(1))}/{toPersianNum(chTargetH.toFixed(1))}</span>
                            <span
                              className="font-bold"
                              style={{ color: chRate >= 70 ? '#3EB489' : chRate >= 40 ? '#F59E0B' : '#EF4444' }}
                            >
                              {toPersianNum(chRate)}٪
                            </span>
                          </div>
                        </div>
                        {/* Chapter progress bar */}
                        <div className="h-1.5 rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${chRate}%` }}
                            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
                            className="h-full rounded-full"
                            style={{ backgroundColor: `${subject.color}AA` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  {chapters.length === 0 && (
                    <p className="text-xs text-[var(--foreground-subtle)] py-2 text-center">
                      فصولی برای این درس یافت نشد
                    </p>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}

// ===== Chart Content (shared between mobile & desktop) =====
function ChartContent({
  chartTab,
  timeFilter,
  fieldFilter,
  ACTIVITY_COLORS,
  ACTIVITY_LABELS,
  pieTotal,
  renderPieLegend,
}: {
  chartTab: ChartTab;
  timeFilter: TimeFilter;
  fieldFilter: FieldFilter;
  ACTIVITY_COLORS: Record<string, string>;
  ACTIVITY_LABELS: Record<string, string>;
  pieTotal: number;
  renderPieLegend: (payload: Array<{ value: string; color: string }>) => React.ReactNode;
}) {
  // Defer chart rendering until the container actually has non-zero width.
  // During AnimatePresence slide-in transitions the parent has width=0, which
  // triggers recharts' "width(0) and height(0)" console warnings. We use a
  // ResizeObserver to detect when the container is truly laid out.
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) {
          setReady(true);
          ro.disconnect();
          break;
        }
      }
    });
    ro.observe(el);
    // Fallback: if ResizeObserver never fires with width>0 (e.g. already laid
    // out), check synchronously after a frame.
    const id = requestAnimationFrame(() => {
      if (el.offsetWidth > 0) {
        setReady(true);
        ro.disconnect();
      }
    });
    return () => { ro.disconnect(); cancelAnimationFrame(id); };
  }, []);
  return (
    <div ref={containerRef}>
      {chartTab === 'روند روزانه' && (
        <div>
          <h3 className="text-sm font-bold text-[var(--foreground)] mb-4">روند روزانه مطالعه</h3>
          <div className="h-64" dir="ltr">
            {ready ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MOCK_DAILY_DATA} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis
                  dataKey="day"
                  tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                <Bar dataKey="hours" name="ساعت" fill="#3EB489" radius={[6, 6, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
            ) : (
              <div className="h-full w-full animate-pulse rounded-lg bg-[rgba(255,255,255,0.03)]" />
            )}
          </div>
        </div>
      )}

      {chartTab === 'سهم دروس' && (
        <div>
          <h3 className="text-sm font-bold text-[var(--foreground)] mb-4">سهم دروس</h3>
          <div className="h-64 relative" dir="ltr">
            {ready ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={MOCK_SUBJECT_DISTRIBUTION}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  dataKey="value"
                  stroke="none"
                  paddingAngle={2}
                >
                  {MOCK_SUBJECT_DISTRIBUTION.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  content={({ payload }) => {
                    if (!payload) return null;
                    return renderPieLegend(
                      payload.map((p) => ({
                        value: p.value || '',
                        color: p.color || '#fff',
                      }))
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            ) : (
              <div className="h-full w-full animate-pulse rounded-full bg-[rgba(255,255,255,0.03)] mx-auto" style={{ maxWidth: 220 }} />
            )}
            <PieCenterLabel total={pieTotal} />
          </div>
        </div>
      )}

      {chartTab === 'نوع فعالیت' && (
        <div>
          <h3 className="text-sm font-bold text-[var(--foreground)] mb-4">نوع فعالیت</h3>
          <div className="h-64" dir="ltr">
            {ready ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MOCK_ACTIVITY_DATA} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                <Bar dataKey="مطالعه" name="مطالعه" stackId="a" fill="#3EB489" radius={[0, 0, 0, 0]} />
                <Bar dataKey="مرور" name="مرور" stackId="a" fill="#F59E0B" />
                <Bar dataKey="تست_آموزشی" name="تست آموزشی" stackId="a" fill="#8B5CF6" />
                <Bar dataKey="تست_سنجشی" name="تست سنجشی" stackId="a" fill="#EF4444" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            ) : (
              <div className="h-full w-full animate-pulse rounded-lg bg-[rgba(255,255,255,0.03)]" />
            )}
          </div>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-3" dir="rtl">
            {Object.entries(ACTIVITY_LABELS).map(([key, label]) => (
              <div key={key} className="flex items-center gap-1.5 text-xs">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: ACTIVITY_COLORS[key as keyof typeof ACTIVITY_COLORS] }}
                />
                <span className="text-[var(--foreground-muted)]">{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {chartTab === 'تفکیک فصول' && (
        <SubjectChapterBreakdown timeFilter={timeFilter} fieldFilter={fieldFilter} />
      )}
    </div>
  );
}

// ============================================================
// ===== Chapter-Centric Report (نمای فصل‌محور) =============
// ============================================================
//
// Aggregates the student's COMPLETED tasks by their curriculum FK
// fields (chapterId / topicId / topicModeId) added in Task 12-a.
//
// Data sources:
//   - GET /api/subjects?include=tree&grade=<g>&major=<m>
//     → subject tree with chapters[] and topics[] nested under each
//       matching GradeSubject, plus subject.topicModes[].
//   - GET /api/tasks?studentId=<id>
//     → all tasks for the student (no date filter — chapter-centric
//       view shows cumulative progress).
//
// Aggregation rules (only tasks with completed === true are counted):
//   - Task with topicId           → that topic + its parent chapter
//   - Task with chapterId only    → chapter only (shown as خوانش جامع)
//   - Task with topicModeId       → "مباحث مستقل" subsection
//
// Per-chapter metrics:
//   - مجموع ساعت مطالعه = sum(targetTimeMinutes) / 60
//   - مجموع تست         = sum(targetTestCount)
//   - درصد پوشش         = (topics with ≥1 completed task) /
//                          (total topics in chapter) × 100

interface LinkedTask {
  id: string;
  subject: string;
  subjectColor: string;
  topic: string | null;
  fieldType: string;
  targetTimeMinutes: number | null;
  targetTestCount: number | null;
  completed: boolean | null;
  detailsCompleted: boolean;
  date: string;
  chapterId: string | null;
  topicId: string | null;
  topicModeId: string | null;
}

interface SubjectTreeNode {
  id: string;
  name: string;
  color: string;
  icon: string | null;
  isKonkur: boolean;
  grades: Array<{
    id: string;
    grade: string;
    major: string;
    chapters: Array<{
      id: string;
      title: string;
      chapterNo: number;
      topics: Array<{ id: string; title: string; topicNo: number }>;
    }>;
  }>;
  topicModes: Array<{
    id: string;
    title: string;
    modeNo: number;
    description: string | null;
  }>;
}

interface TopicAgg {
  id: string;
  title: string;
  topicNo: number;
  totalMinutes: number;
  totalTests: number;
  hasCompleted: boolean;
}

interface ChapterAgg {
  id: string;
  title: string;
  chapterNo: number;
  chapterLevelMinutes: number; // "خوانش جامع" — chapter-only tasks
  chapterLevelTests: number;
  topics: TopicAgg[];
  totalMinutes: number;        // chapter-level + all topics
  totalTests: number;
  coveragePct: number;
  coveredTopicCount: number;
}

interface TopicModeAgg {
  id: string;
  title: string;
  modeNo: number;
  description: string | null;
  totalMinutes: number;
  totalTests: number;
  hasCompleted: boolean;
}

function formatHours(minutes: number): string {
  const hours = minutes / 60;
  // Show one decimal if <10 hours, else integer
  if (hours === 0) return '۰';
  if (hours < 10) return toPersianNum(hours.toFixed(1));
  return toPersianNum(Math.round(hours).toString());
}

function coverageColor(pct: number): string {
  if (pct >= 70) return '#3EB489';
  if (pct >= 40) return '#F59E0B';
  return '#EF4444';
}

function ChapterProgressBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div
      className="h-1.5 rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden min-w-[60px] md:min-w-[100px] flex-1 max-w-[140px]"
      aria-hidden="true"
    >
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="h-full rounded-full"
        style={{ backgroundColor: color }}
      />
    </div>
  );
}

function ChapterCentricReport() {
  const { user } = useAppStore();
  const [subjects, setSubjects] = useState<SubjectTreeNode[]>([]);
  const [tasks, setTasks] = useState<LinkedTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);

  // Fetch subjects tree + tasks (parallel)
  useEffect(() => {
    let cancelled = false;
    async function fetchAll() {
      if (!user?.id) return;
      setLoading(true);
      setError(false);
      try {
        const grade = user.grade || 'دوازدهم';
        const major = user.major || 'تجربی';
        const [subsRes, tasksRes] = await Promise.all([
          fetch(`/api/subjects?include=tree&grade=${encodeURIComponent(grade)}&major=${encodeURIComponent(major)}`),
          fetch(`/api/tasks?studentId=${user.id}`),
        ]);
        if (!subsRes.ok || !tasksRes.ok) throw new Error('fetch failed');
        const subsData = await subsRes.json();
        const tasksData = await tasksRes.json();
        if (cancelled) return;
        const subs: SubjectTreeNode[] = (subsData.subjects || []).map((s: SubjectTreeNode) => ({
          id: s.id,
          name: s.name,
          color: s.color,
          icon: s.icon,
          isKonkur: s.isKonkur,
          grades: s.grades || [],
          topicModes: s.topicModes || [],
        }));
        setSubjects(subs);
        setTasks(tasksData.tasks || []);
        // Default to first subject
        if (subs.length > 0 && !selectedSubjectId) {
          setSelectedSubjectId(subs[0].id);
        }
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchAll();
    return () => { cancelled = true; };
  }, [user]);

  // Build subject options (with activity counts for badge)
  const subjectOptions = useMemo(() => {
    return subjects.map((s) => {
      const subjectTaskCount = tasks.filter(
        (t) => t.subject === s.name && t.fieldType === (s.isKonkur ? 'کنکور' : 'نهایی') && t.detailsCompleted !== false && t.completed === true,
      ).length;
      return { ...s, taskCount: subjectTaskCount };
    });
  }, [subjects, tasks]);

  // Aggregate chapters + topic modes for the selected subject
  const report = useMemo(() => {
    if (!selectedSubjectId) return null;
    const subject = subjects.find((s) => s.id === selectedSubjectId);
    if (!subject) return null;

    // Find the GradeSubject matching the student's grade + major. The API
    // returns ALL active grades for the subject (the `?grade=&major=` query
    // filters subjects, but doesn't filter the nested grades[] include).
    const userGrade = user?.grade || 'دوازدهم';
    const userMajor = user?.major || 'تجربی';
    const gs = subject.grades.find(
      (g) => g.grade === userGrade && g.major === userMajor,
    );
    if (!gs) {
      return { subject, chapters: [], topicModes: [] };
    }

    const completedTasks = tasks.filter(
      (t) => t.completed === true && t.detailsCompleted !== false && t.subject === subject.name && t.fieldType === (subject.isKonkur ? 'کنکور' : 'نهایی'),
    );

    // Build chapter aggregations
    const chapters: ChapterAgg[] = gs.chapters.map((ch) => {
      const topicAggs: TopicAgg[] = ch.topics.map((tp) => {
        const tpTasks = completedTasks.filter((t) => t.topicId === tp.id);
        return {
          id: tp.id,
          title: tp.title,
          topicNo: tp.topicNo,
          totalMinutes: tpTasks.reduce((s, t) => s + (t.targetTimeMinutes ?? 0), 0),
          totalTests: tpTasks.reduce((s, t) => s + (t.targetTestCount ?? 0), 0),
          hasCompleted: tpTasks.length > 0,
        };
      });

      // Chapter-level tasks (chapterId set, no topicId) = "خوانش جامع"
      const chapterOnlyTasks = completedTasks.filter(
        (t) => t.chapterId === ch.id && !t.topicId,
      );
      const chapterLevelMinutes = chapterOnlyTasks.reduce((s, t) => s + (t.targetTimeMinutes ?? 0), 0);
      const chapterLevelTests = chapterOnlyTasks.reduce((s, t) => s + (t.targetTestCount ?? 0), 0);

      const topicMinutes = topicAggs.reduce((s, t) => s + t.totalMinutes, 0);
      const topicTests = topicAggs.reduce((s, t) => s + t.totalTests, 0);

      const totalTopics = ch.topics.length;
      const coveredTopics = topicAggs.filter((t) => t.hasCompleted).length;
      const coveragePct = totalTopics > 0 ? Math.round((coveredTopics / totalTopics) * 100) : 0;

      return {
        id: ch.id,
        title: ch.title,
        chapterNo: ch.chapterNo,
        chapterLevelMinutes,
        chapterLevelTests,
        topics: topicAggs,
        totalMinutes: chapterLevelMinutes + topicMinutes,
        totalTests: chapterLevelTests + topicTests,
        coveragePct,
        coveredTopicCount: coveredTopics,
      };
    });

    // Build TopicMode aggregations (only show modes with at least one completed task)
    const topicModes: TopicModeAgg[] = subject.topicModes
      .map((m) => {
        const mTasks = completedTasks.filter((t) => t.topicModeId === m.id);
        return {
          id: m.id,
          title: m.title,
          modeNo: m.modeNo,
          description: m.description,
          totalMinutes: mTasks.reduce((s, t) => s + (t.targetTimeMinutes ?? 0), 0),
          totalTests: mTasks.reduce((s, t) => s + (t.targetTestCount ?? 0), 0),
          hasCompleted: mTasks.length > 0,
        };
      })
      .filter((m) => m.hasCompleted);

    return { subject, chapters, topicModes };
  }, [selectedSubjectId, subjects, tasks]);

  // ===== Loading state =====
  if (loading) {
    return (
      <div className="space-y-4 shimmer" dir="rtl">
        <div className="flex gap-2 overflow-hidden">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-9 w-24 rounded-full" />
          ))}
        </div>
        <Skeleton className="h-20 w-full rounded-[var(--radius-lg)]" />
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-14 w-full rounded-[var(--radius-lg)]" />
          ))}
        </div>
      </div>
    );
  }

  // ===== Error state =====
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3" dir="rtl">
        <AlertTriangle className="w-8 h-8 text-[var(--warning)]" />
        <p className="text-sm text-[var(--foreground-muted)]">خطا در بارگذاری اطلاعات فصول</p>
        <p className="text-xs text-[var(--foreground-subtle)]">لطفاً دوباره تلاش کنید</p>
      </div>
    );
  }

  // ===== Empty state (no subjects at all) =====
  if (subjects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3" dir="rtl">
        <BookOpen className="w-8 h-8 text-[var(--foreground-muted)]" />
        <p className="text-sm text-[var(--foreground-muted)]">دروس فعال برای پایه و رشته شما یافت نشد</p>
      </div>
    );
  }

  const selectedSubject = subjectOptions.find((s) => s.id === selectedSubjectId);

  return (
    <div dir="rtl" className="space-y-5">
      {/* ===== Subject Selector ===== */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {subjectOptions.map((s) => {
          const active = s.id === selectedSubjectId;
          return (
            <button
              key={s.id}
              onClick={() => setSelectedSubjectId(s.id)}
              className={`btn-hover shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all min-h-[44px] border ${
                active
                  ? 'text-[var(--bg-deep)] border-transparent shadow-[0_4px_12px_-2px_var(--accent-glow)]'
                  : 'surface-1 text-[var(--foreground-muted)] border-[var(--border)] hover:border-[var(--border-strong)] hover:text-[var(--foreground)]'
              }`}
              style={active ? { backgroundColor: s.color } : undefined}
            >
              {s.icon && <span className="text-base leading-none">{s.icon}</span>}
              <span>{s.name}</span>
              {s.taskCount > 0 && (
                <span
                  className={`text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded-full ${
                    active ? 'bg-[rgba(0,0,0,0.18)] text-[var(--bg-deep)]' : 'bg-[var(--accent-soft)] text-[var(--accent)]'
                  }`}
                >
                  {toPersianNum(s.taskCount)}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ===== Subject Header ===== */}
      {selectedSubject && report && (
        <div
          className="surface-1 edge-highlight rounded-[var(--radius-lg)] p-4 md:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
          style={{ borderRightColor: selectedSubject.color, borderRightWidth: '3px' }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-10 h-10 md:w-11 md:h-11 rounded-[var(--radius)] flex items-center justify-center shrink-0 text-xl"
              style={{ backgroundColor: `${selectedSubject.color}1A` }}
            >
              <span>{selectedSubject.icon || <BookOpen className="w-5 h-5" style={{ color: selectedSubject.color }} />}</span>
            </div>
            <div className="min-w-0">
              <h2 className="text-base md:text-lg font-bold text-[var(--foreground)] truncate">
                درس: {selectedSubject.name}
              </h2>
              <p className="text-xs text-[var(--foreground-muted)] mt-0.5">
                پایه {user?.grade || 'دوازدهم'} · رشته {user?.major || 'تجربی'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 md:gap-6 shrink-0">
            <div className="flex flex-col items-center md:items-end">
              <div className="flex items-center gap-1.5 text-[var(--foreground)]">
                <Clock className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span className="text-base md:text-lg font-bold tabular-nums">
                  {formatHours(
                    report.chapters.reduce((s, c) => s + c.totalMinutes, 0) +
                      report.topicModes.reduce((s, m) => s + m.totalMinutes, 0),
                  )}
                </span>
                <span className="text-xs text-[var(--foreground-muted)]">ساعت</span>
              </div>
              <span className="text-[10px] text-[var(--foreground-subtle)]">مجموع مطالعه</span>
            </div>
            <div className="flex flex-col items-center md:items-end">
              <div className="flex items-center gap-1.5 text-[var(--foreground)]">
                <FileText className="w-3.5 h-3.5 text-[var(--warning)]" />
                <span className="text-base md:text-lg font-bold tabular-nums">
                  {toPersianNum(
                    report.chapters.reduce((s, c) => s + c.totalTests, 0) +
                      report.topicModes.reduce((s, m) => s + m.totalTests, 0),
                  )}
                </span>
                <span className="text-xs text-[var(--foreground-muted)]">تست</span>
              </div>
              <span className="text-[10px] text-[var(--foreground-subtle)]">مجموع تست</span>
            </div>
          </div>
        </div>
      )}

      {/* ===== Chapters Accordion ===== */}
      {report && (
        <>
          {report.chapters.length === 0 ? (
            <div className="surface-1 rounded-[var(--radius-lg)] p-6 text-center" dir="rtl">
              <BookOpen className="w-7 h-7 text-[var(--foreground-muted)] mx-auto mb-2" />
              <p className="text-sm text-[var(--foreground-muted)]">این درس فصل‌بندی نشده است</p>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="w-4 h-4 text-[var(--accent)]" />
                <h3 className="text-sm font-bold text-[var(--foreground)]">فصول</h3>
                <span className="text-xs text-[var(--foreground-subtle)]">({toPersianNum(report.chapters.length)} فصل)</span>
              </div>
              <Accordion type="multiple" className="w-full space-y-2">
                {report.chapters.map((ch) => {
                  const pct = ch.coveragePct;
                  const color = coverageColor(pct);
                  const hasAnyActivity = ch.totalMinutes > 0 || ch.totalTests > 0;
                  return (
                    <AccordionItem
                      key={ch.id}
                      value={ch.id}
                      className="surface-1 border border-[var(--border)] rounded-[var(--radius-lg)] overflow-hidden data-[state=open]:border-[var(--border-strong)]"
                    >
                      <AccordionTrigger className="px-3 md:px-4 py-3 hover:no-underline hover:bg-[rgba(255,255,255,0.02)] transition-colors [&>svg]:text-[var(--foreground-muted)] [&>svg]:shrink-0">
                        <div className="flex items-center gap-2.5 md:gap-3 w-full min-w-0">
                          {/* Chapter number badge */}
                          <span
                            className="shrink-0 w-7 h-7 md:w-8 md:h-8 rounded-[var(--radius-sm)] flex items-center justify-center text-xs font-bold tabular-nums"
                            style={{
                              backgroundColor: hasAnyActivity
                                ? `${selectedSubject?.color}1A`
                                : 'rgba(255,255,255,0.04)',
                              color: hasAnyActivity ? selectedSubject?.color : 'var(--foreground-muted)',
                            }}
                          >
                            {toPersianNum(ch.chapterNo)}
                          </span>
                          {/* Title */}
                          <span className="text-xs md:text-sm font-medium text-[var(--foreground)] truncate flex-1 min-w-0 text-right">
                            {ch.title}
                          </span>
                          {/* Stats — hidden on very small screens to keep header compact */}
                          <div className="hidden sm:flex items-center gap-2 md:gap-3 text-[11px] md:text-xs text-[var(--foreground-muted)] shrink-0 tabular-nums">
                            <span className="inline-flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatHours(ch.totalMinutes)}
                              <span className="text-[var(--foreground-subtle)]">ساعت</span>
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <FileText className="w-3 h-3" />
                              {toPersianNum(ch.totalTests)}
                              <span className="text-[var(--foreground-subtle)]">تست</span>
                            </span>
                          </div>
                          {/* Coverage bar */}
                          <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
                            <ChapterProgressBar pct={pct} color={color} />
                            <span
                              className="text-[11px] md:text-xs font-bold tabular-nums w-9 md:w-11 text-left"
                              style={{ color }}
                            >
                              {toPersianNum(pct)}٪
                            </span>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-3 md:px-4 pb-3">
                        {/* Mobile-only stats row (since stats are hidden in header on mobile) */}
                        <div className="sm:hidden flex items-center gap-3 mb-3 text-xs text-[var(--foreground-muted)] tabular-nums">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-3 h-3 text-[var(--accent)]" />
                            {formatHours(ch.totalMinutes)} ساعت
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <FileText className="w-3 h-3 text-[var(--warning)]" />
                            {toPersianNum(ch.totalTests)} تست
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <BookOpen className="w-3 h-3" />
                            {toPersianNum(ch.coveredTopicCount)}/{toPersianNum(ch.topics.length)} گفتار
                          </span>
                        </div>

                        {/* Topic list */}
                        <div className="space-y-1.5">
                          {ch.topics.map((tp) => {
                            const hasData = tp.totalMinutes > 0 || tp.totalTests > 0;
                            return (
                              <div
                                key={tp.id}
                                className={`flex items-center gap-2 md:gap-3 px-2 md:px-3 py-2 rounded-[var(--radius-sm)] border ${
                                  hasData
                                    ? 'bg-[var(--bg-overlay)] border-[var(--border)]'
                                    : 'border-transparent'
                                }`}
                              >
                                {/* Topic indicator dot */}
                                <span
                                  className="shrink-0 w-1.5 h-1.5 rounded-full"
                                  style={{
                                    backgroundColor: hasData ? selectedSubject?.color : 'var(--foreground-subtle)',
                                  }}
                                />
                                {/* Topic title */}
                                <span
                                  className={`text-xs md:text-sm flex-1 min-w-0 truncate text-right ${
                                    hasData
                                      ? 'text-[var(--foreground)] font-medium'
                                      : 'text-[var(--foreground-subtle)]'
                                  }`}
                                >
                                  گفتار {toPersianNum(tp.topicNo)}: {tp.title}
                                </span>
                                {/* Topic stats */}
                                {hasData ? (
                                  <div className="flex items-center gap-2 md:gap-3 text-[10px] md:text-xs text-[var(--foreground-muted)] shrink-0 tabular-nums">
                                    <span className="inline-flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {formatHours(tp.totalMinutes)} ساعت
                                    </span>
                                    <span className="inline-flex items-center gap-1">
                                      <FileText className="w-3 h-3" />
                                      {toPersianNum(tp.totalTests)} تست
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-[10px] text-[var(--foreground-subtle)] shrink-0">
                                    بدون داده
                                  </span>
                                )}
                              </div>
                            );
                          })}

                          {ch.topics.length === 0 && (
                            <p className="text-xs text-[var(--foreground-subtle)] py-2 text-center">
                              این فصل گفتاری ندارد
                            </p>
                          )}

                          {/* Chapter-level (خوانش جامع) row */}
                          {ch.chapterLevelMinutes > 0 && (
                            <div className="flex items-center gap-2 md:gap-3 px-2 md:px-3 py-2 rounded-[var(--radius-sm)] border bg-[var(--accent-soft)] border-[var(--accent)]/20">
                              <Layers className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
                              <span className="text-xs md:text-sm flex-1 min-w-0 text-right font-medium text-[var(--foreground)]">
                                خوانش جامع فصل
                              </span>
                              <div className="flex items-center gap-2 md:gap-3 text-[10px] md:text-xs text-[var(--foreground-muted)] shrink-0 tabular-nums">
                                <span className="inline-flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {formatHours(ch.chapterLevelMinutes)} ساعت
                                </span>
                                <span className="inline-flex items-center gap-1">
                                  <FileText className="w-3 h-3" />
                                  {toPersianNum(ch.chapterLevelTests)} تست
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </div>
          )}

          {/* ===== Independent Topic Modes (مباحث مستقل) ===== */}
          {report.topicModes.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Layers className="w-4 h-4 text-[var(--accent)]" />
                <h3 className="text-sm font-bold text-[var(--foreground)]">مباحث مستقل</h3>
                <span className="text-xs text-[var(--foreground-subtle)]">
                  (نمای مبحثی · {toPersianNum(report.topicModes.length)} مبحث)
                </span>
              </div>
              <div className="surface-1 edge-highlight rounded-[var(--radius-lg)] border border-[var(--border)] overflow-hidden">
                {report.topicModes.map((m, idx) => (
                  <div
                    key={m.id}
                    className={`flex items-center gap-2.5 md:gap-3 px-3 md:px-4 py-3 ${
                      idx !== report.topicModes.length - 1 ? 'border-b border-[var(--border)]' : ''
                    }`}
                  >
                    <span
                      className="shrink-0 w-7 h-7 md:w-8 md:h-8 rounded-[var(--radius-sm)] flex items-center justify-center"
                      style={{ backgroundColor: `${selectedSubject?.color}1A`, color: selectedSubject?.color }}
                    >
                      <Layers className="w-3.5 h-3.5" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs md:text-sm font-medium text-[var(--foreground)] truncate">
                        {m.title}
                      </p>
                      {m.description && (
                        <p className="text-[10px] md:text-xs text-[var(--foreground-subtle)] truncate mt-0.5">
                          {m.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 md:gap-3 text-[11px] md:text-xs text-[var(--foreground-muted)] shrink-0 tabular-nums">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatHours(m.totalMinutes)} ساعت
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        {toPersianNum(m.totalTests)} تست
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===== Empty data hint ===== */}
          {report.chapters.every((c) => c.totalMinutes === 0 && c.totalTests === 0) &&
            report.topicModes.length === 0 && (
              <div className="surface-1 rounded-[var(--radius-lg)] p-6 text-center" dir="rtl">
                <Sparkles className="w-6 h-6 text-[var(--accent)] mx-auto mb-2" />
                <p className="text-sm text-[var(--foreground-muted)] mb-1">
                  هنوز وظیفه تکمیل‌شده‌ای برای این درس ثبت نشده است
                </p>
                <p className="text-xs text-[var(--foreground-subtle)]">
                  با تکمیل وظایف مرتبط با فصول و گفتارها، گزارش فصل‌محور به‌روز می‌شود
                </p>
              </div>
            )}
        </>
      )}
    </div>
  );
}
