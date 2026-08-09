import type { Task } from '@/lib/types';

export {
  buildActivityBreakdown,
  buildActivityBreakdown as computeActivityBreakdown,
  buildDailyTrend,
  buildDailyTrend as computeDailyTrend,
  buildSubjectDistribution,
  buildSubjectDistribution as computeSubjectDistribution,
  computeKpiTotals,
  computeKpiTotals as computeKpis,
  computeInsights,
  filterTasksForReport,
  filterTasksForReport as filterReportTasks,
  hasAnyCompletedData,
  resolveDateRange,
} from '@/lib/analytics';

export type {
  ActivityDatum,
  DailyDatum,
  FieldFilter,
  KpiTotals,
  SubjectDatum,
  TimeFilter,
} from '@/lib/analytics';

export function isCompletedReportTask(task: Task): boolean {
  return task.status === 'COMPLETED' || (task.status === undefined && task.completed === true);
}

export function isReportableTask(task: Task): boolean {
  if (task.status !== undefined) return task.status !== 'DRAFT';
  return task.detailsCompleted !== false;
}
