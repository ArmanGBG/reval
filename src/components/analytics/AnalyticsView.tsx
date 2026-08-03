'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  Clock, FileText, BarChart3, TrendingUp, TrendingDown, ChevronLeft,
  Sparkles, Target, Award, AlertTriangle,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { MOCK_DAILY_DATA, MOCK_SUBJECT_DISTRIBUTION, MOCK_ACTIVITY_DATA } from '@/lib/constants/mockData';

const TIME_FILTERS = ['روزانه', 'هفته جاری', 'ماهانه', 'بازه دلخواه'] as const;
const FIELD_FILTERS = ['همه', 'کنکوری', 'نهایی'] as const;
const CHART_TABS = ['روند روزانه', 'سهم دروس', 'نوع فعالیت'] as const;

type TimeFilter = (typeof TIME_FILTERS)[number];
type FieldFilter = (typeof FIELD_FILTERS)[number];
type ChartTab = (typeof CHART_TABS)[number];

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
      className="surface-1 edge-highlight card-hover rounded-[var(--radius-lg)] p-4 flex flex-col gap-2"
    >
      <div
        className="w-10 h-10 rounded-[var(--radius)] flex items-center justify-center"
        style={{ backgroundColor: `${color}1A` }}
      >
        <span style={{ color }}>{icon}</span>
      </div>
      <div>
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
      className="surface-1 edge-highlight card-hover rounded-[var(--radius-lg)] p-4 border-r-[3px]"
      style={{ borderRightColor: color }}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <span style={{ color }}>{icon}</span>
        <span className="text-xs text-[var(--foreground-muted)] font-medium">{title}</span>
      </div>
      <span className="text-sm font-bold text-[var(--foreground)]">{value}</span>
    </motion.div>
  );
}

// ===== Main Component =====
export default function AnalyticsView() {
  const { tasks } = useAppStore();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('هفته جاری');
  const [fieldFilter, setFieldFilter] = useState<FieldFilter>('همه');
  const [chartTab, setChartTab] = useState<ChartTab>('روند روزانه');

  // Calculate KPIs from tasks
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed === true).length;
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
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 className="w-6 h-6 text-[var(--accent)]" />
          <h1 className="text-2xl font-bold text-[var(--foreground)]">گزارش‌ها</h1>
        </div>

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
            ACTIVITY_COLORS={ACTIVITY_COLORS}
            ACTIVITY_LABELS={ACTIVITY_LABELS}
            pieTotal={pieTotal}
            renderPieLegend={renderPieLegend}
          />
        </div>
      </div>

      {/* ===================================================
          DESKTOP LAYOUT (4-col KPI + 2-col charts)
          =================================================== */}
      <div className="hidden md:block">
        {/* Desktop Header */}
        <div className="flex items-end justify-between mb-8 pb-6 border-b border-[var(--border)]">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-[var(--foreground-subtle)] font-semibold">
              <span>گزارش‌ها</span>
              <ChevronLeft className="w-3 h-3 flip-rtl" />
              <span className="text-[var(--accent)]">{timeFilter}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-[var(--foreground)]">گزارش‌های مطالعه</h1>
            <p className="text-sm text-[var(--foreground-muted)]">
              تحلیل کامل عملکرد، روند و بینش‌های هوشمند
            </p>
          </div>
          <div className="flex items-center gap-2">
            <FilterPill active={fieldFilter === 'همه'} onClick={() => setFieldFilter('همه')}>همه</FilterPill>
            <FilterPill active={fieldFilter === 'کنکوری'} onClick={() => setFieldFilter('کنکوری')}>کنکوری</FilterPill>
            <FilterPill active={fieldFilter === 'نهایی'} onClick={() => setFieldFilter('نهایی')}>نهایی</FilterPill>
          </div>
        </div>

        {/* Time Filter Row */}
        <div className="flex gap-2 mb-8">
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
                ACTIVITY_COLORS={ACTIVITY_COLORS}
                ACTIVITY_LABELS={ACTIVITY_LABELS}
                pieTotal={pieTotal}
                renderPieLegend={renderPieLegend}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== Chart Content (shared between mobile & desktop) =====
function ChartContent({
  chartTab,
  ACTIVITY_COLORS,
  ACTIVITY_LABELS,
  pieTotal,
  renderPieLegend,
}: {
  chartTab: ChartTab;
  ACTIVITY_COLORS: Record<string, string>;
  ACTIVITY_LABELS: Record<string, string>;
  pieTotal: number;
  renderPieLegend: (payload: Array<{ value: string; color: string }>) => React.ReactNode;
}) {
  return (
    <>
      {chartTab === 'روند روزانه' && (
        <div>
          <h3 className="text-sm font-bold text-[var(--foreground)] mb-4">روند روزانه مطالعه</h3>
          <div className="h-64" dir="ltr">
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
          </div>
        </div>
      )}

      {chartTab === 'سهم دروس' && (
        <div>
          <h3 className="text-sm font-bold text-[var(--foreground)] mb-4">سهم دروس</h3>
          <div className="h-64 relative" dir="ltr">
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
            <PieCenterLabel total={pieTotal} />
          </div>
        </div>
      )}

      {chartTab === 'نوع فعالیت' && (
        <div>
          <h3 className="text-sm font-bold text-[var(--foreground)] mb-4">نوع فعالیت</h3>
          <div className="h-64" dir="ltr">
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
    </>
  );
}
