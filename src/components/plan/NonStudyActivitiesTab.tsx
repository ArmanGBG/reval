'use client';

import { useEffect, useMemo, useState } from 'react';
import { Inbox, Loader2, Plus } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useCurrentStudentId } from '@/lib/student-utils';
import { NON_STUDY_STYLE, sumNonStudyMinutes, sumNonStudyMinutesByCategory } from '@/lib/non-study-activity';
import { filterNonStudyActivitiesForRange, type NonStudyTimeFilter } from '@/lib/non-study-activity-report';
import { PersianDateRangePicker } from '@/components/shared/PersianDateRangePicker';
import { NonStudyActivityCard, NonStudyActivityModal } from './NonStudyActivityModal';
import { formatPersianDate, getPersianWeekdayName, minutesToHoursLabel, toISODate, toPersianDigits } from '@/lib/persian-date';
import { parseLocalDate } from '@/lib/student-utils';

const TIME_FILTERS: NonStudyTimeFilter[] = ['روزانه', 'هفته جاری', 'ماهانه', 'بازه دلخواه'];

/**
 * Dedicated tab for non-study activities: a time-range selector that mirrors
 * the study-report filters exactly, per-category totals for the selected
 * range, and the logged entries grouped by day (latest first) with delete.
 * Loads its own data on mount so it works outside PlanView too (e.g. the
 * advisor's student workspace).
 */
export function NonStudyActivitiesTab({ studentId: studentIdProp, canManage = false }: { studentId?: string; canManage?: boolean }) {
  const { nonStudyActivities, nonStudyActivitiesLoading, loadNonStudyActivities, deleteNonStudyActivity, selectedDate } = useAppStore();
  const currentStudentId = useCurrentStudentId();
  const studentId = studentIdProp ?? currentStudentId;
  const [timeFilter, setTimeFilter] = useState<NonStudyTimeFilter>('هفته جاری');
  const [customRange, setCustomRange] = useState<{ start: string; end: string } | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    if (studentId) void loadNonStudyActivities(studentId).catch(() => {});
  }, [loadNonStudyActivities, studentId]);

  const mine = useMemo(
    () => nonStudyActivities.filter((activity) => activity.studentId === studentId),
    [nonStudyActivities, studentId],
  );
  const rangeActivities = useMemo(
    () => filterNonStudyActivitiesForRange(mine, timeFilter, new Date(), customRange),
    [mine, timeFilter, customRange],
  );
  const categoryTotals = useMemo(() => sumNonStudyMinutesByCategory(rangeActivities), [rangeActivities]);
  const totalMinutes = useMemo(() => sumNonStudyMinutes(rangeActivities), [rangeActivities]);

  const byDay = useMemo(() => {
    const groups = new Map<string, typeof rangeActivities>();
    for (const activity of rangeActivities) {
      const arr = groups.get(activity.date) ?? [];
      arr.push(activity);
      groups.set(activity.date, arr);
    }
    return [...groups.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [rangeActivities]);

  const handleDelete = (id: string) => {
    void deleteNonStudyActivity(id).catch(() => {});
  };

  return (
    <div className="space-y-4">
      {/* Header row: time filters + add button */}
      <div className="flex items-center gap-2">
        <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto pb-1 no-scrollbar">
          {TIME_FILTERS.map((filter) => (
            <button
              key={filter}
              onClick={() => {
                if (filter === 'بازه دلخواه' && !customRange) {
                  const today = new Date();
                  const end = new Date(today);
                  end.setDate(today.getDate() + 6);
                  setCustomRange({ start: toISODate(today), end: toISODate(end) });
                }
                setTimeFilter(filter);
              }}
              className={`shrink-0 rounded-lg border px-3 py-2 text-xs transition-colors ${
                timeFilter === filter
                  ? `${NON_STUDY_STYLE.softBg} ${NON_STUDY_STYLE.border} ${NON_STUDY_STYLE.text}`
                  : 'border-[var(--border)] text-[var(--foreground-muted)]'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
        {canManage && (
          <button
            onClick={() => setAddOpen(true)}
            className={`flex min-h-[38px] shrink-0 items-center gap-1.5 rounded-lg border border-[#4DA3FF]/30 bg-[#4DA3FF]/15 px-3 py-2 text-xs font-bold text-[#7EB8FF]`}
          >
            <Plus className="w-3.5 h-3.5" />
            ثبت فعالیت
          </button>
        )}
      </div>
      {timeFilter === 'بازه دلخواه' && (
        <div><PersianDateRangePicker value={customRange} onChange={setCustomRange} /></div>
      )}

      {/* Per-category totals — stacked on mobile, grid on desktop */}
      <section className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-[var(--foreground)]">مجموع زمان هر دسته</h3>
            <p className="mt-1 text-[11px] text-[var(--foreground-muted)]">بر اساس بازه انتخابی</p>
          </div>
          <span className={`shrink-0 text-xs font-bold ${NON_STUDY_STYLE.text}`}>
            {minutesToHoursLabel(totalMinutes)}
          </span>
        </div>
        {categoryTotals.length > 0 ? (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {categoryTotals.map((item) => {
              const share = totalMinutes > 0 ? Math.round((item.minutes / totalMinutes) * 100) : 0;
              return (
                <div key={item.key} className={`rounded-lg border border-dashed ${NON_STUDY_STYLE.border} ${NON_STUDY_STYLE.softBg} p-3`}>
                  <div className="flex items-center gap-2">
                    <span aria-hidden>{item.icon}</span>
                    <span className="min-w-0 flex-1 truncate text-xs font-medium text-[var(--foreground)]">{item.label}</span>
                    <span className="shrink-0 text-[10px] text-[var(--foreground-subtle)]">{toPersianDigits(item.count)} مورد</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className={`text-sm font-bold tabular-nums ${NON_STUDY_STYLE.text}`}>
                      {item.minutes > 0 ? minutesToHoursLabel(item.minutes) : 'بدون زمان'}
                    </span>
                    {totalMinutes > 0 && item.minutes > 0 && (
                      <span className="text-[10px] text-[var(--foreground-subtle)] tabular-nums">{toPersianDigits(share)}٪</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex min-h-32 flex-col items-center justify-center gap-2 text-center text-xs text-[var(--foreground-muted)]">
            <Inbox className="h-5 w-5 text-[var(--foreground-subtle)]" />
            <p>در این بازه فعالیتی ثبت نشده است.</p>
          </div>
        )}
      </section>

      {/* Logged entries grouped by day */}
      <section>
        <h3 className="mb-2 text-sm font-bold text-[var(--foreground)]">موارد ثبت‌شده</h3>
        {nonStudyActivitiesLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-[var(--accent)]" /></div>
        ) : byDay.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--border)] p-6 text-center text-xs text-[var(--foreground-muted)]">
            فعالیتی برای نمایش وجود ندارد.
          </div>
        ) : (
          <div className="space-y-4">
            {byDay.map(([date, activities]) => {
              const d = parseLocalDate(date);
              return (
                <div key={date}>
                  <p className="mb-2 text-[11px] font-semibold text-[var(--foreground-muted)]">
                    {getPersianWeekdayName(d)} · {formatPersianDate(d)}
                  </p>
                  <div className="space-y-2">
                    {activities.map((activity) => (
                      <NonStudyActivityCard
                        key={activity.id}
                        category={activity.category}
                        durationMinutes={activity.durationMinutes}
                        onDelete={canManage ? () => handleDelete(activity.id) : undefined}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {canManage && (
        <NonStudyActivityModal
          open={addOpen}
          onOpenChange={setAddOpen}
          date={selectedDate || toISODate(new Date())}
          studentId={studentId}
        />
      )}
    </div>
  );
}
