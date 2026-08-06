// ===== Persian Shamsi (Jalali) Date Utilities =====
import { toJalaali, toGregorian, jalaaliMonthLength } from 'jalaali-js';

export const PERSIAN_WEEKDAYS = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'] as const;
export const PERSIAN_WEEKDAYS_SHORT = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'] as const;
export const PERSIAN_MONTHS = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند',
] as const;

function toPersianDigits(input: number | string): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return input
    .toString()
    .split('')
    .map((d) => persianDigits[parseInt(d)] ?? d)
    .join('');
}

export { toPersianDigits };

// Convert Gregorian Date to Jalali
export function toJalali(date: Date) {
  return toJalaali(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

// Convert Jalali to Gregorian Date
export function jalaliToDate(jy: number, jm: number, jd: number): Date {
  const g = toGregorian(jy, jm, jd);
  return new Date(g.gy, g.gm - 1, g.gd);
}

// Get Persian weekday index (Saturday=0, ..., Friday=6)
// Timezone-independent: converts date → Jalali → back to local midnight → getDay
// This avoids off-by-one errors when the runtime timezone differs from Iran time
export function getPersianWeekday(date: Date): number {
  const j = toJalaali(date);
  // Convert back to a Date at local midnight (timezone-independent)
  const g = toGregorian(j.jy, j.jm, j.jd);
  const localMidnight = new Date(g.gy, g.gm - 1, g.gd);
  const jsDay = localMidnight.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  // Convert: Sat(6)->0, Sun(0)->1, Mon(1)->2, ..., Fri(5)->6
  return jsDay === 6 ? 0 : jsDay + 1;
}

// Get full weekday name in Persian
export function getPersianWeekdayName(date: Date): string {
  return PERSIAN_WEEKDAYS[getPersianWeekday(date)];
}

// Get short weekday name in Persian
export function getPersianWeekdayShort(date: Date): string {
  return PERSIAN_WEEKDAYS_SHORT[getPersianWeekday(date)];
}

// Format date as "روز ماه" in Persian (e.g., "۱۵ مهر")
export function formatPersianDate(date: Date): string {
  const j = toJalali(date);
  return `${toPersianDigits(j.jd)} ${PERSIAN_MONTHS[j.jm - 1]}`;
}

// Format date as "روز/ماه" in Persian (e.g., "۱۵/۷")
export function formatPersianDateShort(date: Date): string {
  const j = toJalali(date);
  return `${toPersianDigits(j.jd)}/${toPersianDigits(j.jm)}`;
}

// Format an ISO date string (YYYY-MM-DD) or full ISO datetime string as a
// Persian (Jalali) date. Returns "—" for invalid input.
// Use this anywhere a stored date needs to be displayed to the user.
export function formatPersianDateFromISO(iso: string | undefined | null): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (isNaN(date.getTime())) return '—';
  return formatPersianDate(date);
}

// Format an ISO datetime string as Persian date + time (HH:MM)
export function formatPersianDateTimeFromISO(iso: string | undefined | null): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (isNaN(date.getTime())) return '—';
  const j = toJalali(date);
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${toPersianDigits(j.jd)} ${PERSIAN_MONTHS[j.jm - 1]} · ${toPersianDigits(hh)}:${toPersianDigits(mm)}`;
}

// Get ISO date string (YYYY-MM-DD) from Date — uses LOCAL date components
// to avoid timezone off-by-one errors
export function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Get the Saturday of the week containing the given date
export function getSaturdayOfWeek(date: Date): Date {
  const d = new Date(date);
  const iranDay = getPersianWeekday(d);
  d.setDate(d.getDate() - iranDay);
  return d;
}

// Get 7 days of the week starting from Saturday
export function getWeekDays(date: Date): Date[] {
  const sat = getSaturdayOfWeek(date);
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(sat);
    d.setDate(sat.getDate() + i);
    days.push(d);
  }
  return days;
}

// Get the next N days starting from a date
export function getNextDays(startDate: Date, count: number): Date[] {
  const days: Date[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    days.push(d);
  }
  return days;
}

// Get days in a Jalali month
export function getDaysInJalaliMonth(jy: number, jm: number): number {
  return jalaaliMonthLength(jy, jm);
}

// Get the first day of a Jalali month as a Date
export function getFirstDayOfJalaliMonth(jy: number, jm: number): Date {
  return jalaliToDate(jy, jm, 1);
}

// Get today's Jalali info
export function getTodayJalali() {
  const now = new Date();
  const j = toJalali(now);
  return {
    jy: j.jy,
    jm: j.jm,
    jd: j.jd,
    weekday: getPersianWeekday(now),
    date: now,
  };
}

// Check if two dates are the same day
export function isSameDay(d1: Date, d2: Date): boolean {
  return toISODate(d1) === toISODate(d2);
}

// Check if a date is today
export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

// Get relative day label (امروز، فردا، یا نام روز)
export function getRelativeDayLabel(date: Date): string {
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  if (isSameDay(date, today)) return 'امروز';
  if (isSameDay(date, tomorrow)) return 'فردا';
  return getPersianWeekdayName(date);
}

// Convert minutes to hours (e.g., 90 -> "۱.۵ ساعت", 60 -> "۱ ساعت")
export function minutesToHoursLabel(minutes: number): string {
  if (minutes < 60) return `${toPersianDigits(minutes)} دقیقه`;
  const hours = minutes / 60;
  const wholeHours = Math.floor(hours);
  const fraction = hours - wholeHours;
  if (fraction === 0) return `${toPersianDigits(wholeHours)} ساعت`;
  const decimalPart = fraction === 0.5 ? '۱/۲' : toPersianDigits(Math.round(fraction * 10) / 10);
  return `${toPersianDigits(wholeHours)}.${decimalPart} ساعت`;
}

// Convert minutes to hours number (for stats)
export function minutesToHours(minutes: number): number {
  return Math.round((minutes / 60) * 10) / 10;
}
