// ===== Sleep analytics =====
// Pure helpers for sleep logging and reporting. Times are "HH:mm" strings in
// a 24-hour format; a night's sleep may cross midnight (bedtime 23:00 → wake
// 07:00), which is handled by adding 24h when wake < bed.

export const SLEEP_TYPE = { NIGHT: 'NIGHT', NAP: 'NAP' } as const;
export type SleepType = keyof typeof SLEEP_TYPE;

export interface SleepRecordData {
  id: string;
  studentId: string;
  type: SleepType;
  date: string; // ISO date
  startTime: string; // HH:mm
  endTime: string | null; // HH:mm (NIGHT only)
  durationMinutes: number;
  createdAt?: string;
  updatedAt?: string;
}

const HH_MM = /^([01]?\d|2[0-3]):([0-5]\d)$/;

export function isValidTimeString(value: unknown): value is string {
  return typeof value === 'string' && HH_MM.test(value.trim());
}

/** Minutes since midnight for an "HH:mm" string. Tolerates partial input. */
export function timeToMinutes(time: string): number {
  const m = /^(\d{1,2})(?::(\d{0,2}))?$/.exec(time ?? '');
  if (!m) return 0;
  const h = Math.min(23, Number(m[1] || 0));
  const min = m[2] ? Math.min(59, Number(m[2].padEnd(2, '0'))) : 0;
  return h * 60 + min;
}

/** Minutes → "HH:mm" (24h, zero-padded). */
export function minutesToTime(minutes: number): string {
  const m = ((minutes % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

/** Night-sleep duration: wake − bed, +24h when it crosses midnight. */
export function nightSleepMinutes(bedTime: string, wakeTime: string): number {
  const bed = timeToMinutes(bedTime);
  const wake = timeToMinutes(wakeTime);
  return wake >= bed ? wake - bed : wake - bed + 1440;
}

/**
 * Circular (clock) average of "HH:mm" times. A naive mean of 23:00 and 01:00
 * would give 12:00; the circular mean correctly gives 00:00. Returns minutes
 * since midnight, or null when there is nothing to average.
 */
export function circularMeanTime(times: string[]): number | null {
  if (times.length === 0) return null;
  let sin = 0;
  let cos = 0;
  for (const time of times) {
    const angle = (timeToMinutes(time) / 1440) * 2 * Math.PI;
    sin += Math.sin(angle);
    cos += Math.cos(angle);
  }
  const meanAngle = Math.atan2(sin / times.length, cos / times.length);
  const minutes = Math.round((meanAngle / (2 * Math.PI)) * 1440);
  return (minutes + 1440) % 1440;
}

/** Circular-mean "HH:mm" of times, formatted. */
export function averageTimeLabel(times: string[]): string | null {
  const mean = circularMeanTime(times);
  return mean == null ? null : minutesToTime(mean);
}

export interface SleepMetrics {
  /** Average NIGHT-sleep duration in minutes (naps excluded). */
  averageNightMinutes: number | null;
  /** Circular-mean bedtime (HH:mm), e.g. "23:15". */
  averageBedtime: string | null;
  /** Circular-mean wake time (HH:mm). */
  averageWakeTime: string | null;
  /** Nights with a NIGHT record inside the range. */
  nightCount: number;
  /** Total nap minutes inside the range. */
  napMinutes: number;
  napCount: number;
  /** Total sleep minutes (nights + naps). */
  totalMinutes: number;
}

/** Aggregate a set of records (already filtered to a range) into metrics. */
export function computeSleepMetrics(records: SleepRecordData[]): SleepMetrics {
  const nights = records.filter((record) => record.type === 'NIGHT');
  const naps = records.filter((record) => record.type === 'NAP');
  const nightMinutes = nights.reduce((sum, record) => sum + record.durationMinutes, 0);
  const napMinutes = naps.reduce((sum, record) => sum + record.durationMinutes, 0);
  return {
    averageNightMinutes: nights.length > 0 ? Math.round(nightMinutes / nights.length) : null,
    averageBedtime: averageTimeLabel(nights.map((record) => record.startTime)),
    averageWakeTime: averageTimeLabel(nights.filter((record) => record.endTime).map((record) => record.endTime!)),
    nightCount: nights.length,
    napMinutes,
    napCount: naps.length,
    totalMinutes: nightMinutes + napMinutes,
  };
}

export interface SleepDayDatum {
  date: string;
  nightMinutes: number;
  napMinutes: number;
}

/** Per-day aggregation (nights + naps on the same day stack in the chart). */
export function aggregateSleepByDay(records: SleepRecordData[]): SleepDayDatum[] {
  const byDay = new Map<string, SleepDayDatum>();
  for (const record of records) {
    const day = byDay.get(record.date) ?? { date: record.date, nightMinutes: 0, napMinutes: 0 };
    if (record.type === 'NIGHT') day.nightMinutes += record.durationMinutes;
    else day.napMinutes += record.durationMinutes;
    byDay.set(record.date, day);
  }
  return [...byDay.values()].sort((a, b) => a.date.localeCompare(b.date));
}

/** "HH:mm" → Persian "۲۳:۳۰" for display. Safe for partial/empty input. */
export function formatTimePersian(time: string): string {
  if (!time) return '';
  const [h, m] = time.split(':');
  const toFa = (digits?: string) => (digits ?? '').replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]);
  return m === undefined ? toFa(h) : `${toFa(h)}:${toFa(m)}`;
}

/**
 * Map a clock time onto a continuous "hours from 18:00" axis so evening/night
 * times plot adjacently (18:00 → 0, 23:00 → 5, 01:00 → 7, 06:00 → 12).
 * Values outside the 18:00–12:00 window wrap into the same range.
 */
export function timeToEveningAxis(time: string): number {
  const minutes = timeToMinutes(time);
  const from6pm = (minutes - 18 * 60 + 1440) % 1440;
  return Math.round((from6pm / 60) * 10) / 10;
}

/** Inverse of timeToEveningAxis for Y-axis labels: hours-from-18:00 → "HH:mm". */
export function eveningAxisToTimeLabel(hours: number): string {
  const minutes = (((Math.round(hours * 60) + 18 * 60) % 1440) + 1440) % 1440;
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}
