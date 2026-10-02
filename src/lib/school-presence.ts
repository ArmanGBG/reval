// ===== School Presence Utilities =====
// Pure helpers for school presence duration and formatting.

import { toPersianDigits } from './persian-date';

const HH_MM = /^([01]?\d|2[0-3]):([0-5]\d)$/;

export function isValidTimeString(value: unknown): value is string {
  return typeof value === 'string' && HH_MM.test(value.trim());
}

/** Converts "HH:mm" to minutes from midnight */
export function timeStringToMinutes(time: string): number {
  const parts = time.trim().split(':');
  if (parts.length !== 2) return 0;
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  return h * 60 + m;
}

/** Calculates school duration in minutes from startTime to endTime */
export function calculateSchoolDurationMinutes(startTime: string, endTime: string): number {
  const start = timeStringToMinutes(startTime);
  const end = timeStringToMinutes(endTime);
  if (end >= start) {
    return end - start;
  }
  // In case someone logs overnight (unlikely for school, but safe: cross-midnight)
  return 1440 - start + end;
}

/** Formats hours nicely: e.g. 390 mins -> "6.5", 360 mins -> "6" */
export function formatDurationHours(durationMinutes: number): string {
  const hours = durationMinutes / 60;
  const formatted = hours % 1 === 0 ? hours.toFixed(0) : hours.toFixed(1);
  return toPersianDigits(formatted);
}

/**
 * Formats school presence string:
 * e.g., "مدرسه: ۰۷:۳۰ تا ۱۴:۰۰ - ۶.۵ ساعت حضور"
 */
export function formatSchoolPresenceSummary(
  startTime: string,
  endTime: string,
  durationMinutes: number,
): string {
  const hoursText = formatDurationHours(durationMinutes);
  return `مدرسه: ${toPersianDigits(startTime)} تا ${toPersianDigits(endTime)} - ${hoursText} ساعت حضور`;
}
