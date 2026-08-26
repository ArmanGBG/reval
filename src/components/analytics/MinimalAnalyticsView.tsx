'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, BookOpen, ChevronDown, Layers3, Loader2 } from 'lucide-react';
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
import { minutesToHoursLabel, toISODate, toPersianDigits } from '@/lib/persian-date';
import { PersianDateRangePicker } from '@/components/shared/PersianDateRangePicker';
import { ACTIVITY_COLORS } from '@/lib/activity-styles';

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
      pageStart: number | null;
      pageEnd: number | null;
      topics: Array<{ id: string; title: string; topicNo: number }>;
    }>;
  }>;
}

interface CourseBook {
  subject: CurriculumSubject;
  grade: CurriculumSubject['grades'][number];
}

interface CourseGroup {
  name: string;
  color: string;
  books: CourseBook[];
}

const GRADE_ORDER: Record<string, number> = { دهم: 1, یازدهم: 2, دوازدهم: 3 };
const COURSE_PART_COLORS = ['#4DA3FF', '#7C8CFF', '#B07CFF'];

function courseName(name: string): string {
  return name.replace(/\s*[۱۲۳123]\s*$/, '').trim()
    .replace(/^زیست(?:‌|\s)*شناسی$/, 'زیست')
    .replace(/^زمین(?:‌|\s)*شناسی$/, 'زمین');
}

function ActivityColorLegend() {
  return (
    <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-2" aria-label="راهنمای رنگ نوع فعالیت">
      <span className="text-[10px] font-medium text-[var(--foreground-subtle)]">راهنمای رنگ:</span>
      {(Object.keys(ACTIVITY_COLORS) as ActivityType[]).map((activity) => (
        <span key={activity} className="inline-flex items-center gap-1.5 text-[10px] text-[var(--foreground-muted)]">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: ACTIVITY_COLORS[activity] }} />
          {activity}
        </span>
      ))}
    </div>
  );
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
  classSessions: ClassSession[];
}

interface TopicActivity {
  id: string;
  title: string;
  topicNo: number;
  minutes: number;
  tests: number;
  taskCount: number;
  activities: Array<{ name: ActivityType; minutes: number }>;
  classSessions: ClassSession[];
}

interface ClassSession {
  id: string;
  teacherClassName: string;
  sessionNumber: string;
  minutes: number;
  tests: number;
  pageStart: number | null;
  pageEnd: number | null;
}

function toClassSession(task: Task): ClassSession {
  return {
    id: task.id,
    teacherClassName: task.teacherClassName || 'کلاس/ویدیو',
    sessionNumber: task.sessionNumber || 'جلسه بدون شماره',
    minutes: task.actualTimeMinutes ?? 0,
    tests: task.actualTestCount ?? 0,
    pageStart: task.pageStart ?? null,
    pageEnd: task.pageEnd ?? null,
  };
}

function ClassSessionMeta({ session }: { session: ClassSession }) {
  const parts = [
    session.minutes > 0 ? minutesToHoursLabel(session.minutes) : 'زمان ثبت نشده',
    session.tests > 0 ? `${toPersianDigits(session.tests)} تست` : null,
    session.pageStart != null && session.pageEnd != null ? `صفحات ${toPersianDigits(session.pageStart)} تا ${toPersianDigits(session.pageEnd)}` : null,
  ].filter(Boolean);
  return <span className="shrink-0 text-[#72E0BF]">{parts.join(' · ')}</span>;
}

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
  if (task.pageStart != null && task.pageEnd != null && chapter.pageStart != null && chapter.pageEnd != null) {
    return chapter.pageStart <= task.pageEnd && task.pageStart <= chapter.pageEnd;
  }
  if (task.chapterId === chapter.id) return true;
  const topicIds = task.topicIds?.length ? task.topicIds : task.topicId ? [task.topicId] : [];
  if (topicIds.some((id) => chapter.topics.some((topic) => topic.id === id))) return true;

  // Keep old tasks reportable until all persisted records have curriculum IDs.
  if (task.chapterId || topicIds.length > 0) return false;
  if (task.topic === chapter.title) return true;
  return chapter.topics.some((topic) => topic.title === task.topic);
}

function chapterTaskShare(task: Task, chapter: CurriculumSubject['grades'][number]['chapters'][number]): number {
  if (task.pageStart == null || task.pageEnd == null || chapter.pageStart == null || chapter.pageEnd == null) return 1;
  const totalPages = task.pageEnd - task.pageStart + 1;
  const overlapStart = Math.max(task.pageStart, chapter.pageStart);
  const overlapEnd = Math.min(task.pageEnd, chapter.pageEnd);
  const overlapPages = Math.max(0, overlapEnd - overlapStart + 1);
  return totalPages > 0 ? overlapPages / totalPages : 1;
}

function aggregateChapter(
  chapter: CurriculumSubject['grades'][number]['chapters'][number],
  tasks: Task[],
): ChapterActivity {
  const completed = tasks.filter((task) => task.status === 'COMPLETED' && belongsToChapter(task, chapter));
  const activityMinutes = new Map<ActivityType, number>();

  for (const task of completed) {
    const minutes = (task.actualTimeMinutes ?? 0) * chapterTaskShare(task, chapter);
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
      classSessions: topicTasks
        .filter((task) => task.activityTypes?.includes('کلاس/ویدیو'))
        .map(toClassSession),
    };
  });

  return {
    id: chapter.id,
    title: chapter.title,
    chapterNo: chapter.chapterNo,
    minutes: Math.round(completed.reduce((sum, task) => sum + (task.actualTimeMinutes ?? 0) * chapterTaskShare(task, chapter), 0)),
    tests: Math.round(completed.reduce((sum, task) => sum + (task.actualTestCount ?? 0) * chapterTaskShare(task, chapter), 0)),
    taskCount: completed.length,
    activities: [...activityMinutes.entries()]
      .map(([name, minutes]) => ({ name, minutes: Math.round(minutes) }))
      .sort((a, b) => b.minutes - a.minutes),
    topics,
    classSessions: completed
      .filter((task) => task.activityTypes?.includes('کلاس/ویدیو'))
      .map(toClassSession),
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
  const [selectedCourseName, setSelectedCourseName] = useState<string | null>(null);
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
          setSelectedCourseName(null);
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
  const courseGroups = useMemo<CourseGroup[]>(() => {
    const groups = new Map<string, CourseGroup>();
    for (const subject of subjects) {
      const name = courseName(subject.name);
      const group = groups.get(name) ?? { name, color: subject.color, books: [] };
      for (const grade of subject.grades) {
        if (!group.books.some((book) => book.subject.id === subject.id && book.grade.id === grade.id)) {
          group.books.push({ subject, grade });
        }
      }
      groups.set(name, group);
    }
    return [...groups.values()]
      .map((group) => ({
        ...group,
        books: group.books.sort((a, b) => (GRADE_ORDER[a.grade.grade] ?? 99) - (GRADE_ORDER[b.grade.grade] ?? 99)),
      }))
      .sort((a, b) => a.books[0]?.subject.name.localeCompare(b.books[0]?.subject.name, 'fa') ?? 0);
  }, [subjects]);
  const selectedCourse = courseGroups.find((course) => course.name === selectedCourseName) ?? null;
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
  const courseOverview = useMemo(() => {
    if (!selectedCourse) return [];
    const subjectIds = new Set(selectedCourse.books.map((book) => book.subject.id));
    const completed = reportTasks.filter((task) =>
      task.status === 'COMPLETED' && (
        (task.subjectId ? subjectIds.has(task.subjectId) : courseName(task.subject) === selectedCourse.name)
      ),
    );
    const minutesFor = (predicate: (task: Task) => boolean) => completed
      .filter(predicate)
      .reduce((sum, task) => sum + (task.actualTimeMinutes ?? 0), 0);
    const books = selectedCourse.books.map((book, index) => ({
      key: book.grade.id,
      name: book.subject.name,
      minutes: minutesFor((task) =>
        task.subjectId === book.subject.id
        && task.curriculumMode !== 'THEMATIC'
        && !task.activityTypes?.includes('کلاس/ویدیو'),
      ),
      fill: COURSE_PART_COLORS[index % COURSE_PART_COLORS.length],
      book,
    }));
    return [
      ...books,
      { key: 'thematic', name: 'مطالعه مبحثی', minutes: minutesFor((task) => task.curriculumMode === 'THEMATIC'), fill: '#F2B84B', book: null },
      { key: 'class-video', name: 'کلاس/ویدیو', minutes: minutesFor((task) => Boolean(task.activityTypes?.includes('کلاس/ویدیو'))), fill: '#35C49A', book: null },
    ];
  }, [reportTasks, selectedCourse]);
  const courseClassSessions = useMemo(() => {
    if (!selectedCourse) return [];
    const subjectIds = new Set(selectedCourse.books.map((book) => book.subject.id));
    return reportTasks
      .filter((task) => task.status === 'COMPLETED' && task.activityTypes?.includes('کلاس/ویدیو') && (
        (task.subjectId ? subjectIds.has(task.subjectId) : courseName(task.subject) === selectedCourse.name)
      ))
      .map((task) => ({
        ...task,
        linked: Boolean(task.chapterId || task.topicId || task.topicIds?.length || task.topicModeId),
      }));
  }, [reportTasks, selectedCourse]);

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
            onClick={() => {
              if (filter === 'بازه دلخواه' && !customRange) {
                // Default range starts today (7-day window); the user can move it freely
                const today = new Date();
                const end = new Date(today);
                end.setDate(today.getDate() + 6);
                setCustomRange({ start: toISODate(today), end: toISODate(end) });
              }
              setTimeFilter(filter);
            }}
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
            <ActivityColorLegend />
          </> : <EmptyReport icon={<Layers3 className="h-5 w-5" />} text="روش مطالعه‌ای برای این بازه ثبت نشده است." />
        )}
      </section>

      {!embedded && <section>
        <div className="mb-3">
          <h2 className="text-base font-bold text-[var(--foreground)]">تفکیک دروس و فصول</h2>
          <p className="mt-1 text-xs text-[var(--foreground-muted)]">ابتدا درس را انتخاب کنید؛ سپس نمای جامع یا جزئیات هر کتاب را ببینید.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-[var(--accent)]" /></div>
        ) : error ? (
          <div className="rounded-xl border border-[var(--border)] p-8 text-center text-sm text-[var(--foreground-muted)]">دریافت ساختار دروس انجام نشد.</div>
        ) : (
          <>
            <div className="mb-5 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {courseGroups.map((course) => (
                <button
                  key={course.name}
                  onClick={() => {
                    setSelectedCourseName(course.name);
                    setSelectedSubjectId(null);
                    setSelectedGradeId(null);
                    setExpandedChapterId(null);
                  }}
                  className={`shrink-0 rounded-lg border px-4 py-2 text-sm ${
                    selectedCourseName === course.name
                      ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]'
                      : 'border-[var(--border)] text-[var(--foreground-muted)]'
                  }`}
                >
                  {course.name}
                </button>
              ))}
            </div>

            {!selectedCourse && (
              <div className="rounded-xl border border-dashed border-[var(--border)] p-8 text-center text-sm text-[var(--foreground-muted)]">
                برای مشاهده گزارش جامع، یک درس را انتخاب کنید.
              </div>
            )}

            {selectedCourse && !selectedSubject && (
              <>
                <div className="mb-5 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-[var(--foreground)]">نمای جامع {selectedCourse.name}</h3>
                      <p className="mt-1 text-[11px] text-[var(--foreground-muted)]">زمان واقعی کتاب‌ها، مطالعه مبحثی و کلاس/ویدیو</p>
                    </div>
                    <span className="shrink-0 text-xs text-[var(--foreground-muted)]">{minutesToHoursLabel(courseOverview.reduce((sum, item) => sum + item.minutes, 0))}</span>
                  </div>
                  {courseOverview.some((item) => item.minutes > 0) ? (
                    <div className="h-64" dir="ltr">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={courseOverview} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
                          <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.06)" />
                          <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.55)', fontSize: 10 }} axisLine={false} tickLine={false} interval={0} />
                          <YAxis tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 10 }} axisLine={false} tickLine={false} />
                          <Tooltip content={<ReportTooltip unit="دقیقه" />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                          <Bar dataKey="minutes" name="زمان" radius={[5, 5, 0, 0]} maxBarSize={42}>
                            {courseOverview.map((item) => <Cell key={item.key} fill={item.fill} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="py-10 text-center text-xs text-[var(--foreground-muted)]">در این بازه فعالیت تکمیل‌شده‌ای برای این درس وجود ندارد.</p>
                  )}
                  <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2">
                    {courseOverview.map((item) => <span key={item.key} className="inline-flex items-center gap-1.5 text-[10px] text-[var(--foreground-muted)]"><span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: item.fill }} />{item.name}</span>)}
                  </div>
                </div>

                <div className="mb-5">
                  <p className="mb-2 text-xs font-medium text-[var(--foreground-muted)]">جزئیات کتاب‌ها</p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {selectedCourse.books.map((book) => (
                    <button
                      key={`${book.subject.id}:${book.grade.id}`}
                      onClick={() => {
                        setSelectedSubjectId(book.subject.id);
                        setSelectedGradeId(book.grade.id);
                        setExpandedChapterId(null);
                      }}
                      className="flex min-h-12 items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3 text-right text-sm text-[var(--foreground)] transition-colors hover:border-[var(--accent)]/40 hover:text-[var(--accent)]"
                    >
                      <span className="font-medium">{book.subject.name}</span>
                      <span className="text-[10px] text-[var(--foreground-muted)]">{book.grade.grade}</span>
                    </button>
                  ))}
                  </div>
                </div>

                {courseClassSessions.length > 0 && (
                  <div className="mb-5 overflow-hidden rounded-xl border border-[#35C49A]/25 bg-[#35C49A]/[0.04]">
                    <div className="flex items-center justify-between border-b border-[#35C49A]/20 px-4 py-3">
                      <div>
                        <h3 className="text-sm font-bold text-[var(--foreground)]">جلسات کلاس/ویدیو</h3>
                        <p className="mt-1 text-[10px] text-[var(--foreground-muted)]">جلسات متصل و بدون اتصال به محتوای درسی</p>
                      </div>
                      <div className="text-left text-[10px] text-[#72E0BF]"><p>{toPersianDigits(courseClassSessions.length)} جلسه</p><p className="mt-1">{minutesToHoursLabel(courseClassSessions.reduce((sum, task) => sum + (task.actualTimeMinutes ?? 0), 0))}</p></div>
                    </div>
                    <div className="divide-y divide-[#35C49A]/15">
                      {courseClassSessions.map((task) => (
                        <div key={task.id} className="flex items-start justify-between gap-3 px-4 py-3">
                          <div className="min-w-0">
                            <p className="truncate text-xs font-medium text-[var(--foreground)]">{task.teacherClassName || 'کلاس/ویدیو'}{task.sessionNumber ? ` · ${task.sessionNumber}` : ''}</p>
                            <p className="mt-1 text-[10px] text-[var(--foreground-muted)]">{task.linked ? task.topic || 'متصل به محتوای درسی' : 'هنوز به کتاب یا مبحثی متصل نشده'}</p>
                          </div>
                          <span className="shrink-0 text-[10px] text-[#72E0BF]">{minutesToHoursLabel(task.actualTimeMinutes ?? 0)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {selectedSubject && selectedGrade && (
              <div className="mb-4 flex items-center gap-2">
                <button type="button" onClick={() => { setSelectedSubjectId(null); setSelectedGradeId(null); setExpandedChapterId(null); }} className="icon-btn flex size-9 items-center justify-center rounded-md border border-[var(--border)] text-[var(--foreground-muted)]" aria-label="بازگشت به نمای جامع"><ArrowRight className="h-4 w-4" /></button>
                <div>
                  <p className="text-xs font-medium text-[var(--foreground)]">{selectedSubject.name}</p>
                  <p className="text-[10px] text-[var(--foreground-muted)]">جزئیات فصل‌ها و گفتارها</p>
                </div>
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
                  <><div className="h-64" dir="ltr">
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
                  </div><ActivityColorLegend /></>
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
                      {chapter.classSessions.length > 0 && (
                        <div className="mt-3 rounded-lg border border-[#35C49A]/20 bg-[#35C49A]/[0.04] p-3">
                          <p className="mb-2 text-[10px] font-semibold text-[#72E0BF]">جلسات کلاس این فصل</p>
                          <div className="space-y-1.5">
                            {chapter.classSessions.map((session) => (
                              <div key={session.id} className="flex items-center justify-between gap-3 text-[10px] text-[var(--foreground-muted)]">
                                <span className="min-w-0 truncate">{session.teacherClassName} · {session.sessionNumber}</span>
                                <ClassSessionMeta session={session} />
                              </div>
                            ))}
                          </div>
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
                                   {topic.classSessions.length > 0 && (
                                     <div className="mt-2 rounded-md border border-[#35C49A]/20 bg-[#35C49A]/[0.04] p-2">
                                       <p className="mb-1.5 text-[9px] font-semibold text-[#72E0BF]">جلسات کلاس این گفتار</p>
                                       <div className="space-y-1">
                                         {topic.classSessions.map((session) => (
                                           <div key={session.id} className="flex items-center justify-between gap-2 text-[9px] text-[var(--foreground-muted)]">
                                             <span className="min-w-0 truncate">{session.teacherClassName} · {session.sessionNumber}</span>
                                             <ClassSessionMeta session={session} />
                                           </div>
                                         ))}
                                       </div>
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
