'use client';

import { useEffect, useMemo, useState } from 'react';
import { BookOpen, ChevronDown, Layers3, Loader2 } from 'lucide-react';
import {
  Bar,
  BarChart,
  Cell,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useAppStore } from '@/lib/store';
import type { ActivityType, Task } from '@/lib/types';
import { buildActivityBreakdown, buildDailyTrend, buildSubjectDistribution, filterTasksForReport, computeKpiTotals } from '@/lib/reporting/task-report-service';
import { minutesToHoursLabel, toPersianDigits } from '@/lib/persian-date';
import { PersianDateRangePicker } from '@/components/shared/PersianDateRangePicker';

const TIME_FILTERS = ['روزانه', 'هفته جاری', 'ماهانه', 'بازه دلخواه'] as const;
type TimeFilter = (typeof TIME_FILTERS)[number];
const REPORT_VIEWS = ['روند مطالعه', 'تفکیک دروس', 'روش مطالعه روزانه'] as const;
type ReportView = (typeof REPORT_VIEWS)[number];

interface CurriculumSubject {
  id: string;
  name: string;
  color: string;
  grades: Array<{
    id: string;
    grade: string;
    chapters: Array<{
      id: string;
      title: string;
      chapterNo: number;
      topics: Array<{ id: string; title: string; topicNo: number }>;
    }>;
  }>;
}

interface ChapterActivity {
  id: string;
  title: string;
  chapterNo: number;
  minutes: number;
  tests: number;
  taskCount: number;
  activities: Array<{ name: ActivityType; minutes: number }>;
  topics: TopicActivity[];
}

interface TopicActivity {
  id: string;
  title: string;
  topicNo: number;
  minutes: number;
  tests: number;
  taskCount: number;
  activities: Array<{ name: ActivityType; minutes: number }>;
}

const ACTIVITY_COLORS: Record<ActivityType, string> = {
  'مطالعه': 'var(--chart-1)',
  'مرور': 'var(--chart-2)',
  'تست آموزشی': 'var(--chart-3)',
  'تست سنجشی': 'var(--chart-5)',
  'کلاس/ویدیو': 'var(--chart-4)',
};

function ReportTooltip({
  active,
  payload,
  label,
  unit = '',
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color?: string }>;
  label?: string;
  unit?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div dir="rtl" className="rounded-lg border border-[var(--border-strong)] bg-[var(--bg-elevated)] px-3 py-2 text-xs shadow-xl">
      <p className="mb-1 font-medium text-[var(--foreground)]">{label}</p>
      {payload.filter((item) => item.value > 0).map((item) => (
        <p key={item.name} style={{ color: item.color }}>
          {item.name}: <span className="tabular-nums">{toPersianDigits(item.value)}{unit ? ` ${unit}` : ''}</span>
        </p>
      ))}
    </div>
  );
}

function EmptyReport({ icon, text }: { icon: React.ReactNode; text: string }) {
  return <div className="flex min-h-56 flex-col items-center justify-center gap-2 text-center text-xs text-[var(--foreground-muted)]"><span className="text-[var(--foreground-subtle)]">{icon}</span><p>{text}</p></div>;
}

function belongsToChapter(task: Task, chapter: CurriculumSubject['grades'][number]['chapters'][number]): boolean {
  if (task.chapterId === chapter.id) return true;
  const topicIds = task.topicIds?.length ? task.topicIds : task.topicId ? [task.topicId] : [];
  if (topicIds.some((id) => chapter.topics.some((topic) => topic.id === id))) return true;

  // Keep old tasks reportable until all persisted records have curriculum IDs.
  if (task.chapterId || topicIds.length > 0) return false;
  if (task.topic === chapter.title) return true;
  return chapter.topics.some((topic) => topic.title === task.topic);
}

function aggregateChapter(
  chapter: CurriculumSubject['grades'][number]['chapters'][number],
  tasks: Task[],
): ChapterActivity {
  const completed = tasks.filter((task) => task.status === 'COMPLETED' && belongsToChapter(task, chapter));
  const activityMinutes = new Map<ActivityType, number>();

  for (const task of completed) {
    const minutes = task.actualTimeMinutes ?? 0;
    const activities = task.activityTypes ?? [];
    if (activities.length === 0) continue;
    const share = minutes / activities.length;
    for (const activity of activities) {
      activityMinutes.set(activity, (activityMinutes.get(activity) ?? 0) + share);
    }
  }

  const topics = chapter.topics.map((topic) => {
    const topicTasks = completed.filter((task) => {
      const topicIds = task.topicIds?.length ? task.topicIds : task.topicId ? [task.topicId] : [];
      return topicIds.includes(topic.id) || (topicIds.length === 0 && task.topic === topic.title);
    });
    const activityMinutesByType = new Map<ActivityType, number>();
    for (const task of topicTasks) {
      const topicShare = Math.max(1, task.topicIds?.length || (task.topicId ? 1 : 0));
      const activities = task.activityTypes ?? [];
      if (activities.length === 0) continue;
      const share = (task.actualTimeMinutes ?? 0) / topicShare / activities.length;
      for (const activity of activities) {
        activityMinutesByType.set(activity, (activityMinutesByType.get(activity) ?? 0) + share);
      }
    }
    return {
      id: topic.id,
      title: topic.title,
      topicNo: topic.topicNo,
      minutes: Math.round(topicTasks.reduce((sum, task) => sum + (task.actualTimeMinutes ?? 0) / Math.max(1, task.topicIds?.length || (task.topicId ? 1 : 0)), 0)),
      tests: Math.round(topicTasks.reduce((sum, task) => sum + (task.actualTestCount ?? 0) / Math.max(1, task.topicIds?.length || (task.topicId ? 1 : 0)), 0)),
      taskCount: topicTasks.length,
      activities: [...activityMinutesByType.entries()]
        .map(([name, minutes]) => ({ name, minutes: Math.round(minutes) }))
        .sort((a, b) => b.minutes - a.minutes),
    };
  });

  return {
    id: chapter.id,
    title: chapter.title,
    chapterNo: chapter.chapterNo,
    minutes: completed.reduce((sum, task) => sum + (task.actualTimeMinutes ?? 0), 0),
    tests: completed.reduce((sum, task) => sum + (task.actualTestCount ?? 0), 0),
    taskCount: completed.length,
    activities: [...activityMinutes.entries()]
      .map(([name, minutes]) => ({ name, minutes: Math.round(minutes) }))
      .sort((a, b) => b.minutes - a.minutes),
    topics,
  };
}

interface MinimalAnalyticsViewProps {
  tasksOverride?: Task[];
  embedded?: boolean;
  initialTimeFilter?: TimeFilter;
  initialReportView?: ReportView;
  academicContext?: { grade: string; major: string };
}

export default function MinimalAnalyticsView({
  tasksOverride,
  embedded = false,
  initialTimeFilter = 'هفته جاری',
  initialReportView = 'روند مطالعه',
  academicContext,
}: MinimalAnalyticsViewProps = {}) {
  const { tasks: storeTasks, user } = useAppStore();
  const tasks = tasksOverride ?? storeTasks;
  const [timeFilter, setTimeFilter] = useState<TimeFilter>(initialTimeFilter);
  const [reportView, setReportView] = useState<ReportView>(initialReportView);
  const [customRange, setCustomRange] = useState<{ start: string; end: string } | null>(null);
  const [subjects, setSubjects] = useState<CurriculumSubject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [selectedGradeId, setSelectedGradeId] = useState<string | null>(null);
  const [expandedChapterId, setExpandedChapterId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadSubjects() {
      if (embedded || (!academicContext && !user)) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(false);
      try {
        const grade = academicContext?.grade ?? user!.grade;
        const major = academicContext?.major ?? user!.major;
        const params = `grade=${encodeURIComponent(grade)}&major=${encodeURIComponent(major)}&allGrades=true`;
        const [konkurResponse, finalResponse] = await Promise.all([
          fetch(`/api/subjects/for-task?fieldType=${encodeURIComponent('کنکور')}&${params}`),
          fetch(`/api/subjects/for-task?fieldType=${encodeURIComponent('نهایی')}&${params}`),
        ]);
        if (!konkurResponse.ok || !finalResponse.ok) throw new Error('subjects');
        const [konkurData, finalData] = await Promise.all([konkurResponse.json(), finalResponse.json()]);
        const merged = new Map<string, CurriculumSubject>();
        for (const subject of [...(konkurData.subjects ?? []), ...(finalData.subjects ?? [])] as CurriculumSubject[]) {
          const current = merged.get(subject.id);
          if (!current) {
            merged.set(subject.id, subject);
            continue;
          }
          const grades = new Map(current.grades.map((grade) => [grade.id, grade]));
          for (const grade of subject.grades) grades.set(grade.id, grade);
          merged.set(subject.id, { ...current, grades: [...grades.values()] });
        }
        const result = [...merged.values()];
        if (!cancelled) {
          setSubjects(result);
          setSelectedSubjectId(null);
          setSelectedGradeId(null);
        }
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadSubjects();
    return () => { cancelled = true; };
  }, [academicContext?.grade, academicContext?.major, embedded, user]);

  const reportTasks = useMemo(
    () => filterTasksForReport(tasks, timeFilter, 'همه', new Date(), customRange),
    [tasks, timeFilter, customRange],
  );
  const totals = useMemo(() => computeKpiTotals(reportTasks), [reportTasks]);
  const dailyTrend = useMemo(
    () => buildDailyTrend(reportTasks, timeFilter, new Date(), customRange),
    [reportTasks, timeFilter, customRange],
  );
  const subjectDistribution = useMemo(() => buildSubjectDistribution(reportTasks), [reportTasks]);
  const dailyActivities = useMemo(
    () => buildActivityBreakdown(reportTasks, timeFilter, new Date(), customRange),
    [reportTasks, timeFilter, customRange],
  );
  const completedCount = reportTasks.filter((task) => task.status === 'COMPLETED').length;
  const selectedSubject = subjects.find((subject) => subject.id === selectedSubjectId) ?? null;
  const selectedGrade = selectedSubject?.grades.find((grade) => grade.id === selectedGradeId) ?? null;
  const subjectTasks = useMemo(() => {
    if (!selectedSubject) return [];
    return reportTasks.filter((task) =>
      task.subjectId === selectedSubject.id || (!task.subjectId && task.subject === selectedSubject.name),
    );
  }, [reportTasks, selectedSubject]);
  const chapters = useMemo(() => {
    if (!selectedGrade) return [];
    return [...selectedGrade.chapters]
      .sort((a, b) => a.chapterNo - b.chapterNo)
      .map((chapter) => aggregateChapter(chapter, subjectTasks));
  }, [selectedGrade, subjectTasks]);
  const subjectMinutes = chapters.reduce((sum, chapter) => sum + chapter.minutes, 0);
  const chapterChartData = chapters.map((chapter) => ({
    name: `فصل ${toPersianDigits(chapter.chapterNo)}`,
    ...Object.fromEntries(chapter.activities.map((activity) => [activity.name, activity.minutes])),
  }));

  return (
    <div dir="rtl" className={`mx-auto max-w-4xl ${embedded ? 'px-0 py-0' : 'px-4 py-6 md:px-0 md:py-8'}`}>
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--foreground)] md:text-3xl">گزارش مطالعه</h1>
        <p className="mt-1 text-sm text-[var(--foreground-muted)]">خلاصه عملکرد و فعالیت هر فصل</p>
      </header>

      <div className="mb-5 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {TIME_FILTERS.map((filter) => (
          <button
            key={filter}
            onClick={() => setTimeFilter(filter)}
            className={`shrink-0 rounded-lg border px-3 py-2 text-xs transition-colors ${
              timeFilter === filter
                ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]'
                : 'border-[var(--border)] text-[var(--foreground-muted)]'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>
      {timeFilter === 'بازه دلخواه' && (
        <div className="mb-5"><PersianDateRangePicker value={customRange} onChange={setCustomRange} /></div>
      )}

      <section className="mb-8 grid grid-cols-3 divide-x divide-x-reverse divide-[var(--border)] rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-2 py-4">
        <div className="text-center"><p className="text-lg font-bold">{minutesToHoursLabel(Math.round(totals.totalHours * 60))}</p><p className="mt-1 text-[10px] text-[var(--foreground-muted)]">زمان مطالعه</p></div>
        <div className="text-center"><p className="text-lg font-bold">{toPersianDigits(totals.totalTests)}</p><p className="mt-1 text-[10px] text-[var(--foreground-muted)]">تست حل‌شده</p></div>
        <div className="text-center"><p className="text-lg font-bold">{toPersianDigits(completedCount)}</p><p className="mt-1 text-[10px] text-[var(--foreground-muted)]">تسک تکمیل‌شده</p></div>
      </section>

      <section className="mb-8 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4">
        <div className="mb-4">
          <h2 className="text-sm font-bold text-[var(--foreground)]">نمای تحلیلی</h2>
          <p className="mt-1 text-[11px] text-[var(--foreground-muted)]">زمان واقعی تسک‌های تکمیل‌شده در بازه انتخابی</p>
        </div>
        <div className="mb-5 grid grid-cols-3 gap-1 rounded-lg bg-[var(--bg-overlay)] p-1">
          {REPORT_VIEWS.map((item) => (
            <button key={item} onClick={() => setReportView(item)} className={`min-h-10 rounded-md px-2 text-[11px] font-medium transition-colors ${reportView === item ? 'bg-[var(--bg-elevated)] text-[var(--foreground)] shadow-sm' : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'}`}>{item}</button>
          ))}
        </div>
        {reportView === 'روند مطالعه' && (
          <div className="h-60" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyTrend} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="day" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ReportTooltip unit="ساعت" />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="hours" name="ساعت مطالعه" fill="var(--accent)" radius={[5, 5, 0, 0]} maxBarSize={34} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        {reportView === 'تفکیک دروس' && (
          subjectDistribution.length > 0 ? <div className="h-64" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectDistribution} layout="vertical" margin={{ top: 4, right: 8, left: 28, bottom: 0 }}>
                <CartesianGrid horizontal={false} stroke="rgba(255,255,255,0.06)" />
                <XAxis type="number" tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={90} tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ReportTooltip unit="ساعت" />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="value" name="ساعت مطالعه" radius={[0, 5, 5, 0]} maxBarSize={24}>{subjectDistribution.map((subject) => <Cell key={subject.name} fill={subject.fill} />)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </div> : <EmptyReport icon={<BookOpen className="h-5 w-5" />} text="مطالعه تکمیل‌شده‌ای برای تفکیک دروس وجود ندارد." />
        )}
        {reportView === 'روش مطالعه روزانه' && (
          dailyActivities.some((day) => day.مطالعه + day.مرور + day.تست_آموزشی + day.تست_سنجشی + day.کلاس_ویدیو > 0) ? <>
            <div className="h-64" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyActivities} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ReportTooltip unit="دقیقه" />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                  <Bar dataKey="مطالعه" name="مطالعه" stackId="method" fill={ACTIVITY_COLORS['مطالعه']} maxBarSize={42} />
                  <Bar dataKey="مرور" name="مرور" stackId="method" fill={ACTIVITY_COLORS['مرور']} maxBarSize={42} />
                  <Bar dataKey="تست_آموزشی" name="تست آموزشی" stackId="method" fill={ACTIVITY_COLORS['تست آموزشی']} maxBarSize={42} />
                  <Bar dataKey="تست_سنجشی" name="تست سنجشی" stackId="method" fill={ACTIVITY_COLORS['تست سنجشی']} maxBarSize={42} />
                  <Bar dataKey="کلاس_ویدیو" name="کلاس/ویدیو" stackId="method" fill={ACTIVITY_COLORS['کلاس/ویدیو']} radius={[5, 5, 0, 0]} maxBarSize={42} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-2">{(Object.keys(ACTIVITY_COLORS) as ActivityType[]).map((activity) => <span key={activity} className="inline-flex items-center gap-1.5 text-[10px] text-[var(--foreground-muted)]"><span className="h-2 w-2 rounded-sm" style={{ backgroundColor: ACTIVITY_COLORS[activity] }} />{activity}</span>)}</div>
          </> : <EmptyReport icon={<Layers3 className="h-5 w-5" />} text="روش مطالعه‌ای برای این بازه ثبت نشده است." />
        )}
      </section>

      {!embedded && <section>
        <div className="mb-3">
          <h2 className="text-base font-bold text-[var(--foreground)]">تفکیک دروس و فصول</h2>
          <p className="mt-1 text-xs text-[var(--foreground-muted)]">ابتدا درس و سپس پایه را انتخاب کنید.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-[var(--accent)]" /></div>
        ) : error ? (
          <div className="rounded-xl border border-[var(--border)] p-8 text-center text-sm text-[var(--foreground-muted)]">دریافت ساختار دروس انجام نشد.</div>
        ) : (
          <>
            <div className="mb-5 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {subjects.map((subject) => (
                <button
                  key={subject.id}
                  onClick={() => {
                    setSelectedSubjectId(subject.id);
                    setSelectedGradeId(null);
                    setExpandedChapterId(null);
                  }}
                  className={`shrink-0 rounded-lg border px-4 py-2 text-sm ${
                    selectedSubjectId === subject.id
                      ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]'
                      : 'border-[var(--border)] text-[var(--foreground-muted)]'
                  }`}
                >
                  {subject.name}
                </button>
              ))}
            </div>

            {!selectedSubject && (
              <div className="rounded-xl border border-dashed border-[var(--border)] p-8 text-center text-sm text-[var(--foreground-muted)]">
                برای مشاهده گزارش فصل‌ها، یک درس را انتخاب کنید.
              </div>
            )}

            {selectedSubject && (
              <div className="mb-5">
                <p className="mb-2 text-xs font-medium text-[var(--foreground-muted)]">پایه {selectedSubject.name}</p>
                <div className="flex flex-wrap gap-2">
                  {selectedSubject.grades.map((grade) => (
                    <button
                      key={grade.id}
                      onClick={() => {
                        setSelectedGradeId(grade.id);
                        setExpandedChapterId(null);
                      }}
                      className={`rounded-lg border px-4 py-2 text-sm ${
                        selectedGradeId === grade.id
                          ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]'
                          : 'border-[var(--border)] text-[var(--foreground-muted)]'
                      }`}
                    >
                      {grade.grade}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedSubject && !selectedGrade && (
              <div className="rounded-xl border border-dashed border-[var(--border)] p-8 text-center text-sm text-[var(--foreground-muted)]">
                پایه موردنظر را انتخاب کنید.
              </div>
            )}

            {selectedSubject && selectedGrade && (
              <>
              <div className="mb-5 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-[var(--foreground)]">فعالیت فصل‌های {selectedSubject.name} {selectedGrade.grade}</h3>
                    <p className="mt-1 text-[11px] text-[var(--foreground-muted)]">تفکیک زمان واقعی بر اساس نوع فعالیت</p>
                  </div>
                  <span className="shrink-0 text-xs text-[var(--foreground-muted)]">{minutesToHoursLabel(subjectMinutes)}</span>
                </div>
                {chapterChartData.some((chapter) => Object.values(chapter).some((value) => typeof value === 'number' && value > 0)) ? (
                  <div className="h-64" dir="ltr">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chapterChartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                        <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.06)" />
                        <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 10 }} axisLine={false} tickLine={false} />
                        <Tooltip content={<ReportTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                        {(Object.keys(ACTIVITY_COLORS) as ActivityType[]).map((activity) => (
                          <Bar key={activity} dataKey={activity} name={activity} stackId="activity" fill={ACTIVITY_COLORS[activity]} maxBarSize={42} />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="py-10 text-center text-xs text-[var(--foreground-muted)]">در این بازه فعالیت تکمیل‌شده‌ای برای نمودار وجود ندارد.</p>
                )}
              </div>

              <div className="overflow-hidden rounded-xl border border-[var(--border)]">
                <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
                  <h3 className="font-bold text-[var(--foreground)]">{selectedSubject.name} {selectedGrade.grade}</h3>
                  <span className="text-xs text-[var(--foreground-muted)]">{minutesToHoursLabel(subjectMinutes)}</span>
                </div>
                <div className="divide-y divide-[var(--border)]">
                  {chapters.map((chapter) => {
                    const expanded = expandedChapterId === chapter.id;
                    return (
                    <div key={chapter.id} className="px-4 py-4">
                      <button
                        type="button"
                        onClick={() => setExpandedChapterId(expanded ? null : chapter.id)}
                        className="flex w-full items-start justify-between gap-3 text-right"
                        aria-expanded={expanded}
                      >
                        <div className="min-w-0">
                          <p className="flex items-center gap-2 text-sm font-medium text-[var(--foreground)]">
                            <ChevronDown className={`h-4 w-4 shrink-0 text-[var(--foreground-muted)] transition-transform ${expanded ? 'rotate-180' : ''}`} />
                            فصل {toPersianDigits(chapter.chapterNo)}: {chapter.title}
                          </p>
                          <p className="mt-1 text-[11px] text-[var(--foreground-muted)]">
                            {chapter.taskCount > 0 ? `${toPersianDigits(chapter.taskCount)} فعالیت تکمیل‌شده` : 'بدون فعالیت در این بازه'}
                          </p>
                        </div>
                        <div className="shrink-0 text-left text-xs text-[var(--foreground-muted)]">
                          <p>{minutesToHoursLabel(chapter.minutes)}</p>
                          {chapter.tests > 0 && <p className="mt-1">{toPersianDigits(chapter.tests)} تست</p>}
                        </div>
                      </button>
                      {chapter.activities.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {chapter.activities.map((activity) => (
                            <span key={activity.name} className="rounded-md bg-[var(--bg-overlay)] px-2 py-1 text-[10px] text-[var(--foreground-muted)]">
                              {activity.name}: {minutesToHoursLabel(activity.minutes)}
                            </span>
                          ))}
                        </div>
                      )}
                      {expanded && (
                        <div className="mt-4 border-t border-[var(--border)] pt-3">
                          <p className="mb-2 text-[11px] font-medium text-[var(--foreground-muted)]">گفتارها و زیرمبحث‌ها</p>
                          {chapter.topics.length === 0 ? (
                            <p className="text-xs text-[var(--foreground-subtle)]">برای این فصل گفتاری تعریف نشده است.</p>
                          ) : (
                            <div className="space-y-2">
                              {chapter.topics.map((topic) => (
                                <div key={topic.id} className="rounded-lg bg-[var(--bg-overlay)] px-3 py-2.5">
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                      <p className={`text-xs ${topic.taskCount > 0 ? 'font-medium text-[var(--foreground)]' : 'text-[var(--foreground-muted)]'}`}>
                                        گفتار {toPersianDigits(topic.topicNo)}: {topic.title}
                                      </p>
                                      <p className="mt-1 text-[10px] text-[var(--foreground-subtle)]">
                                        {topic.taskCount > 0 ? `${toPersianDigits(topic.taskCount)} فعالیت تکمیل‌شده` : 'بدون فعالیت'}
                                      </p>
                                    </div>
                                    <div className="shrink-0 text-left text-[10px] text-[var(--foreground-muted)]">
                                      <p>{minutesToHoursLabel(topic.minutes)}</p>
                                      {topic.tests > 0 && <p className="mt-1">{toPersianDigits(topic.tests)} تست</p>}
                                    </div>
                                  </div>
                                  {topic.activities.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-1.5">
                                      {topic.activities.map((activity) => (
                                        <span key={activity.name} className="rounded bg-[var(--bg-elevated)] px-1.5 py-1 text-[9px] text-[var(--foreground-muted)]">
                                          {activity.name}: {minutesToHoursLabel(activity.minutes)}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    );
                  })}
                  {chapters.length === 0 && <p className="p-8 text-center text-sm text-[var(--foreground-muted)]">برای این درس فصلی تعریف نشده است.</p>}
                </div>
              </div>
              </>
            )}
          </>
        )}
      </section>}
    </div>
  );
}
