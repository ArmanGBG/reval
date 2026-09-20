// ============================================================
// User Engagement Helpers
// ============================================================
// Shared logic for computing engagement & consistency metrics from a user's
// task list. Used by:
//   - GET /api/users         (14-day trend for the super-admin list sparkline)
//   - GET /api/users/[id]    (30-day trend for the detail page chart)
//
// All functions are null-safe: users with zero tasks get zeros and empty
// arrays, never NaN or null dates.
// ============================================================

export interface ActivityDay {
  /** ISO date string (YYYY-MM-DD) */
  date: string;
  /** Number of completed tasks on that day */
  count: number;
}

export interface UserEngagement {
  /** Total non-draft tasks (excludes DRAFT, which are scaffolding) */
  totalTasks: number;
  /** Tasks with status COMPLETED */
  completedTasks: number;
  /** ISO datetime of the most recent task interaction (max updatedAt), or null */
  lastTaskInteraction: string | null;
  /** Daily completed-task counts for the last N days (oldest → newest) */
  activityTrend: ActivityDay[];
}

interface TaskForEngagement {
  status: string;
  date: string; // ISO date (scheduled date — currently unused for trend but selected for future)
  updatedAt: Date;
}

/**
 * Compute engagement metrics from a flat list of tasks.
 *
 * @param tasks  The user's own tasks (for STUDENT) or all students' tasks
 *               flattened (for ADVISOR).
 * @param trendDays  How many days to include in the activityTrend array.
 *                   Default 14 (for list sparkline); use 30 for detail page.
 */
export function computeEngagement(
  tasks: TaskForEngagement[],
  trendDays: number = 14,
): UserEngagement {
  // Exclude DRAFT tasks — they're scaffolding that hasn't been committed to yet.
  const reportable = tasks.filter((t) => t.status !== 'DRAFT');
  const completed = reportable.filter((t) => t.status === 'COMPLETED');

  const totalTasks = reportable.length;
  const completedTasks = completed.length;

  // lastTaskInteraction = max(updatedAt) across ALL tasks (any interaction,
  // not just completions — editing a task also counts as engagement).
  let lastTaskInteraction: string | null = null;
  if (tasks.length > 0) {
    const maxDate = tasks.reduce(
      (max, t) => (t.updatedAt > max ? t.updatedAt : max),
      tasks[0].updatedAt,
    );
    lastTaskInteraction = maxDate.toISOString();
  }

  // activityTrend = for each of the last N days, count how many completed
  // tasks had their updatedAt fall on that day. Days with zero activity
  // are filled with count: 0 so the chart shows gaps clearly.
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Pre-bucket completed tasks by date string for O(n) lookup.
  const completedByDate = new Map<string, number>();
  for (const t of completed) {
    const dayKey = t.updatedAt.toISOString().split('T')[0];
    completedByDate.set(dayKey, (completedByDate.get(dayKey) ?? 0) + 1);
  }

  const activityTrend: ActivityDay[] = [];
  for (let i = trendDays - 1; i >= 0; i--) {
    const day = new Date(today);
    day.setDate(day.getDate() - i);
    const dayStr = day.toISOString().split('T')[0];
    activityTrend.push({ date: dayStr, count: completedByDate.get(dayStr) ?? 0 });
  }

  return { totalTasks, completedTasks, lastTaskInteraction, activityTrend };
}

/**
 * Compute a short text summary of the activity trend for CSV export.
 * Returns e.g. "میانگین ۳.۲ تسک/روز در ۷ روز اخیر" or "بدون فعالیت".
 */
export function trendSummary(trend: ActivityDay[], recentDays: number = 7): string {
  const recent = trend.slice(-recentDays);
  const total = recent.reduce((sum, d) => sum + d.count, 0);
  const avg = total / recent.length;
  if (total === 0) return 'بدون فعالیت در هفته اخیر';
  // Round to 1 decimal place, but strip trailing .0 for cleaner output.
  const rounded = Math.round(avg * 10) / 10;
  return `${rounded} تسک/روز (میانگین ${recentDays} روز اخیر)`;
}
