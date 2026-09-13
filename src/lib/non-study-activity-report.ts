// ===== Non-Study Activity Reporting =====
// Range filtering for non-study activities. Reuses the study report's
// resolveDateRange so "روزانه / هفته جاری / ماهانه / بازه دلخواه" resolve to
// exactly the same date windows the study report uses.

import type { NonStudyActivity } from '@/lib/types';
import { resolveDateRange, type TimeFilter } from '@/lib/analytics';

export type NonStudyTimeFilter = TimeFilter;

export function filterNonStudyActivitiesForRange(
  activities: NonStudyActivity[],
  timeFilter: NonStudyTimeFilter,
  now: Date = new Date(),
  customRange?: { start: string; end: string } | null,
): NonStudyActivity[] {
  const range = timeFilter === 'بازه دلخواه' ? customRange ?? null : resolveDateRange(timeFilter, now);
  if (!range) return activities;
  return activities.filter((activity) => activity.date >= range.start && activity.date <= range.end);
}
