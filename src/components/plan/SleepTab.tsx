'use client';

import { useEffect, useMemo, useState } from 'react';
import { Moon, MoonStar, Sun, Trash2 } from 'lucide-react';
import {
  Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { useAppStore } from '@/lib/store';
import { useCurrentStudentId, parseLocalDate } from '@/lib/student-utils';
import {
  aggregateSleepByDay, computeSleepMetrics, circularMeanTime, eveningAxisToTimeLabel,
  formatTimePersian, timeToEveningAxis, type SleepRecordData,
} from '@/lib/sleep';
import { resolveDateRange, type TimeFilter } from '@/lib/analytics';
import { PersianDateRangePicker } from '@/components/shared/PersianDateRangePicker';
import { SleepEntryModal } from './SleepEntryModal';
import { formatPersianDate, getPersianWeekdayName, minutesToHoursLabel, toISODate, toPersianDigits } from '@/lib/persian-date';

const TIME_FILTERS: TimeFilter[] = ['روزانه', 'هفته جاری', 'ماهانه', 'بازه دلخواه'];

/** Night + nap minutes → decimal hours for the chart. */
function toChartDay(datum: { date: string; nightMinutes: number; napMinutes: number }) {
  return {
    name: formatPersianDate(parseLocalDate(datum.date)),
    شب: Math.round((datum.nightMinutes / 60) * 10) / 10,
    چرت: Math.round((datum.napMinutes / 60) * 10) / 10,
    date: datum.date,
  };
}

function SleepChartTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; color?: string; payload?: { date: string } }> }) {
  if (!active || !payload?.length) return null;
  const date = payload[0]?.payload?.date;
  return (
    <div dir="rtl" className="rounded-lg border border-[var(--border-strong)] bg-[var(--bg-overlay)] px-3 py-2 text-xs shadow-xl">
      <p className="mb-1 font-bold text-[var(--foreground)]">{date ? formatPersianDate(parseLocalDate(date)) : ''}</p>
      {payload.map((item) => (
        <p key={item.name} className="flex items-center gap-1.5 text-[var(--foreground-muted)]">
          <span className="inline-block size-2 rounded-full" style={{ backgroundColor: item.color }} />
          {item.name}: {toPersianDigits(item.value)} ساعت
        </p>
      ))}
    </div>
  );
}

/** Tooltip for the bedtime/wake-time charts (clock labels, not hours). */
function SleepClockTooltip({ active, payload, unit }: { active?: boolean; payload?: Array<{ name: string; value: number; color?: string; payload?: { clock: string; date: string } }>; unit: string }) {
  if (!active || !payload?.length) return null;
  const first = payload[0]?.payload;
  return (
    <div dir="rtl" className="rounded-lg border border-[var(--border-strong)] bg-[var(--bg-overlay)] px-3 py-2 text-xs shadow-xl">
      <p className="mb-1 font-bold text-[var(--foreground)]">{first?.date ? formatPersianDate(parseLocalDate(first.date)) : ''}</p>
      {payload.map((item) => (
        <p key={item.name} className="flex items-center gap-1.5 text-[var(--foreground-muted)]">
          <span className="inline-block size-2 rounded-full" style={{ backgroundColor: item.color }} />
          {item.name}: {first?.clock ? formatTimePersian(first.clock) : ''} {unit}
        </p>
      ))}
    </div>
  );
}

function MetricCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-3 text-center">
      <p className="text-base font-bold text-[var(--foreground)] tabular-nums">{value}</p>
      <p className="mt-1 text-[10px] text-[var(--foreground-muted)]">{label}</p>
      {hint && <p className="mt-0.5 text-[9px] text-[var(--foreground-subtle)]">{hint}</p>}
    </div>
  );
}

/**
 * Dedicated sleep tab: time-range chips (same as the study report), three
 * averages (night duration, bedtime, wake time — circular means), a stacked
 * night+nap bar chart, and recent records with delete.
 */
export function SleepTab({ studentId: studentIdProp, canManage = false }: { studentId?: string; canManage?: boolean }) {
  const { sleepRecords, sleepLoading, loadSleepRecords, deleteSleepRecord, selectedDate } = useAppStore();
  const currentStudentId = useCurrentStudentId();
  const studentId = studentIdProp ?? currentStudentId;
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('هفته جاری');
  const [customRange, setCustomRange] = useState<{ start: string; end: string } | null>(null);
  const [entryOpen, setEntryOpen] = useState(false);

  useEffect(() => {
    if (studentId) void loadSleepRecords(studentId).catch(() => {});
  }, [loadSleepRecords, studentId]);

  const mine = useMemo(
    () => sleepRecords.filter((r) => r.studentId === studentId),
    [sleepRecords, studentId],
  );
  const rangeRecords = useMemo(() => {
    const range = timeFilter === 'بازه دلخواه' ? customRange ?? null : resolveDateRange(timeFilter, new Date());
    if (!range) return mine;
    return mine.filter((r) => r.date >= range.start && r.date <= range.end);
  }, [mine, timeFilter, customRange]);

  const metrics = useMemo(() => computeSleepMetrics(rangeRecords), [rangeRecords]);
  const chartData = useMemo(() => aggregateSleepByDay(rangeRecords).map(toChartDay), [rangeRecords]);
  // Bedtime / wake-time charts: clock times mapped onto a continuous
  // evening axis (18:00→0, 23:00→5, 01:00→7) so night times plot adjacently.
  const nightsSorted = useMemo(
    () => rangeRecords.filter((r) => r.type === 'NIGHT' && r.endTime).sort((a, b) => a.date.localeCompare(b.date)),
    [rangeRecords],
  );
  const bedtimeData = useMemo(() => nightsSorted.map((r) => ({
    name: formatPersianDate(parseLocalDate(r.date)),
    ساعت: timeToEveningAxis(r.startTime),
    clock: r.startTime,
    date: r.date,
  })), [nightsSorted]);
  const wakeData = useMemo(() => nightsSorted.map((r) => ({
    name: formatPersianDate(parseLocalDate(r.date)),
    ساعت: timeToEveningAxis(r.endTime!),
    clock: r.endTime!,
    date: r.date,
  })), [nightsSorted]);
  const avgBedtime = useMemo(() => circularMeanTime(nightsSorted.map((r) => r.startTime)), [nightsSorted]);
  const avgWake = useMemo(() => circularMeanTime(nightsSorted.map((r) => r.endTime!)), [nightsSorted]);

  const recent = useMemo(
    () => [...mine].sort((a, b) => b.date.localeCompare(a.date) || (b.createdAt ?? '').localeCompare(a.createdAt ?? '')).slice(0, 14),
    [mine],
  );

  const recordTitle = (record: SleepRecordData) =>
    record.type === 'NIGHT'
      ? `خواب شبانه · ${formatTimePersian(record.startTime)} تا ${record.endTime ? formatTimePersian(record.endTime) : '—'}`
      : `چرت · ${formatTimePersian(record.startTime)} · ${toPersianDigits(record.durationMinutes)} دقیقه`;

  return (
    <div className="space-y-4">
      {/* Header row: filters + add button */}
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
                  ? 'border-[#5B7FD9]/40 bg-[#5B7FD9]/15 text-[#9DBBFF]'
                  : 'border-[var(--border)] text-[var(--foreground-muted)]'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
        {canManage && (
          <button
            onClick={() => setEntryOpen(true)}
            className="flex min-h-[38px] shrink-0 items-center gap-1.5 rounded-lg border border-[#5B7FD9]/40 bg-[#5B7FD9]/15 px-3 py-2 text-xs font-bold text-[#9DBBFF]"
          >
            <Moon className="w-3.5 h-3.5" />
            ثبت خواب
          </button>
        )}
      </div>
      {timeFilter === 'بازه دلخواه' && (
        <div><PersianDateRangePicker value={customRange} onChange={setCustomRange} /></div>
      )}

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-2">
        <MetricCard
          label="میانگین خواب شبانه"
          value={metrics.averageNightMinutes != null ? minutesToHoursLabel(metrics.averageNightMinutes) : '—'}
          hint={metrics.nightCount > 0 ? `${toPersianDigits(metrics.nightCount)} شب` : undefined}
        />
        <MetricCard label="میانگین ساعت خواب" value={metrics.averageBedtime ? formatTimePersian(metrics.averageBedtime) : '—'} />
        <MetricCard label="میانگین ساعت بیداری" value={metrics.averageWakeTime ? formatTimePersian(metrics.averageWakeTime) : '—'} />
      </div>
      {metrics.napCount > 0 && (
        <p className="text-[11px] text-[var(--foreground-muted)]">
          چرت در این بازه: {toPersianDigits(metrics.napCount)} مورد · مجموع {minutesToHoursLabel(metrics.napMinutes)}
        </p>
      )}

      {/* Chart */}
      <section className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-[var(--foreground)]">نمودار خواب</h3>
            <p className="mt-1 text-[11px] text-[var(--foreground-muted)]">طول خواب شبانه و چرت هر روز (ساعت)</p>
          </div>
          <div className="flex shrink-0 gap-3 text-[10px] text-[var(--foreground-muted)]">
            <span className="flex items-center gap-1"><span className="inline-block size-2 rounded-full bg-[#5B7FD9]" />شبانه</span>
            <span className="flex items-center gap-1"><span className="inline-block size-2 rounded-full bg-[#F5B96B]" />چرت</span>
          </div>
        </div>
        {sleepLoading ? (
          <div className="flex h-56 items-center justify-center text-xs text-[var(--foreground-muted)]">در حال بارگذاری...</div>
        ) : chartData.length === 0 ? (
          <div className="flex h-56 flex-col items-center justify-center gap-2 text-center">
            <MoonStar className="h-6 w-6 text-[var(--foreground-subtle)]" />
            <p className="text-xs text-[var(--foreground-muted)]">در این بازه خوابی ثبت نشده است.</p>
          </div>
        ) : (
          <div className="h-56" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: 'var(--foreground-muted)', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                  minTickGap={12}
                  angle={chartData.length > 8 ? -40 : 0}
                  textAnchor={chartData.length > 8 ? 'end' : 'middle'}
                  height={chartData.length > 8 ? 44 : 30}
                />
                <YAxis tick={{ fill: 'var(--foreground-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<SleepChartTooltip />} cursor={{ fill: 'var(--border)' }} />
                <Bar dataKey="شب" name="خواب شبانه" stackId="sleep" fill="#5B7FD9" radius={[0, 0, 4, 4]} maxBarSize={34} />
                <Bar dataKey="چرت" name="چرت" stackId="sleep" fill="#F5B96B" radius={[4, 4, 0, 0]} maxBarSize={34} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      {/* Bedtime chart — hours-from-evening axis with real clock labels */}
      {bedtimeData.length > 0 && (
        <section className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-[var(--foreground)]">ساعت خواب</h3>
              <p className="mt-1 text-[11px] text-[var(--foreground-muted)]">ساعتی که هر شب به خواب رفته‌ای</p>
            </div>
            {avgBedtime != null && (
              <span className="shrink-0 rounded-lg border border-[#5B7FD9]/30 bg-[#5B7FD9]/10 px-2.5 py-1.5 text-xs font-bold text-[#9DBBFF] tabular-nums">
                میانگین {formatTimePersian(`${String(Math.floor(avgBedtime / 60)).padStart(2, '0')}:${String(avgBedtime % 60).padStart(2, '0')}`)}
              </span>
            )}
          </div>
          <div className="h-44" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bedtimeData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: 'var(--foreground-muted)', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                  minTickGap={12}
                  angle={bedtimeData.length > 8 ? -40 : 0}
                  textAnchor={bedtimeData.length > 8 ? 'end' : 'middle'}
                  height={bedtimeData.length > 8 ? 44 : 30}
                />
                <YAxis
                  tick={{ fill: 'var(--foreground-muted)', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value: number) => formatTimePersian(eveningAxisToTimeLabel(Number(value)))}
                  domain={[0, 'dataMax']}
                />
                {avgBedtime != null && <ReferenceLine y={timeToEveningAxis(`${String(Math.floor(avgBedtime / 60)).padStart(2, '0')}:${String(avgBedtime % 60).padStart(2, '0')}`)} stroke="#9DBBFF" strokeDasharray="6 4" />}
                <Tooltip content={<SleepClockTooltip unit="(ساعت خواب)" />} cursor={{ fill: 'var(--border)' }} />
                <Bar dataKey="ساعت" name="ساعت خواب" fill="#5B7FD9" radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* Wake-time chart */}
      {wakeData.length > 0 && (
        <section className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-[var(--foreground)]">ساعت بیداری</h3>
              <p className="mt-1 text-[11px] text-[var(--foreground-muted)]">ساعتی که هر روز بیدار شده‌ای</p>
            </div>
            {avgWake != null && (
              <span className="shrink-0 rounded-lg border border-[#F5B96B]/30 bg-[#F5B96B]/10 px-2.5 py-1.5 text-xs font-bold text-[#F5C98A] tabular-nums">
                میانگین {formatTimePersian(`${String(Math.floor(avgWake / 60)).padStart(2, '0')}:${String(avgWake % 60).padStart(2, '0')}`)}
              </span>
            )}
          </div>
          <div className="h-44" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={wakeData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: 'var(--foreground-muted)', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                  minTickGap={12}
                  angle={wakeData.length > 8 ? -40 : 0}
                  textAnchor={wakeData.length > 8 ? 'end' : 'middle'}
                  height={wakeData.length > 8 ? 44 : 30}
                />
                <YAxis
                  tick={{ fill: 'var(--foreground-muted)', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value: number) => formatTimePersian(eveningAxisToTimeLabel(Number(value)))}
                  domain={[0, 'dataMax']}
                />
                {avgWake != null && <ReferenceLine y={timeToEveningAxis(`${String(Math.floor(avgWake / 60)).padStart(2, '0')}:${String(avgWake % 60).padStart(2, '0')}`)} stroke="#F5C98A" strokeDasharray="6 4" />}
                <Tooltip content={<SleepClockTooltip unit="(ساعت بیداری)" />} cursor={{ fill: 'var(--border)' }} />
                <Bar dataKey="ساعت" name="ساعت بیداری" fill="#F5B96B" radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* Recent records */}
      <section>
        <h3 className="mb-2 text-sm font-bold text-[var(--foreground)]">رکوردهای اخیر</h3>
        {recent.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--border)] p-6 text-center text-xs text-[var(--foreground-muted)]">
            هنوز خوابی ثبت نشده است.
          </div>
        ) : (
          <div className="space-y-2">
            {recent.map((record) => (
              <div
                key={record.id}
                className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${
                  record.type === 'NIGHT'
                    ? 'border-[#5B7FD9]/25 bg-[#5B7FD9]/[0.07]'
                    : 'border-[#F5B96B]/25 bg-[#F5B96B]/[0.07]'
                }`}
              >
                {record.type === 'NIGHT'
                  ? <Moon className="h-4 w-4 shrink-0 text-[#9DBBFF]" />
                  : <Sun className="h-4 w-4 shrink-0 text-[#F5C98A]" />}
                <div className="min-w-0 flex-1">
                  <p className={`truncate text-[12px] font-medium ${record.type === 'NIGHT' ? 'text-[#9DBBFF]' : 'text-[#F5C98A]'}`}>
                    {recordTitle(record)}
                  </p>
                  <p className="mt-0.5 text-[10px] text-[var(--foreground-subtle)]">
                    {getPersianWeekdayName(parseLocalDate(record.date))} · {formatPersianDate(parseLocalDate(record.date))}
                    {record.type === 'NIGHT' ? ` · ${minutesToHoursLabel(record.durationMinutes)}` : ''}
                  </p>
                </div>
                {canManage && (
                  <button
                    type="button"
                    onClick={() => { void deleteSleepRecord(record.id).catch(() => {}); }}
                    aria-label="حذف رکورد خواب"
                    className="flex size-8 shrink-0 items-center justify-center rounded-lg text-[var(--foreground-subtle)] transition-colors hover:text-[var(--danger)]"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {canManage && (
        <SleepEntryModal
          open={entryOpen}
          onOpenChange={setEntryOpen}
          date={selectedDate || toISODate(new Date())}
          studentId={studentId}
        />
      )}
    </div>
  );
}
