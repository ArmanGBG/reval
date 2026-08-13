import { describe, it, expect } from 'vitest';
import {
  toPersianDigits,
  toISODate,
  minutesToHoursLabel,
  minutesToHours,
  isSameDay,
  getPersianWeekday,
  formatPersianDate,
} from '@/lib/persian-date';

describe('toPersianDigits', () => {
  it('converts single digits', () => {
    expect(toPersianDigits(0)).toBe('۰');
    expect(toPersianDigits(5)).toBe('۵');
    expect(toPersianDigits(9)).toBe('۹');
  });

  it('converts multi-digit numbers', () => {
    expect(toPersianDigits(12)).toBe('۱۲');
    expect(toPersianDigits(1404)).toBe('۱۴۰۴');
  });

  it('converts string input', () => {
    expect(toPersianDigits('2024')).toBe('۲۰۲۴');
  });

  it('preserves non-digit characters', () => {
    expect(toPersianDigits('1.5')).toBe('۱.۵');
  });
});

describe('toISODate', () => {
  it('returns correct YYYY-MM-DD format', () => {
    const date = new Date(2024, 5, 15); // June 15, 2024
    expect(toISODate(date)).toBe('2024-06-15');
  });

  it('pads single-digit months and days', () => {
    const date = new Date(2024, 0, 3); // January 3, 2024
    expect(toISODate(date)).toBe('2024-01-03');
  });
});

describe('minutesToHoursLabel', () => {
  it('returns minutes for values < 60', () => {
    expect(minutesToHoursLabel(30)).toBe('۳۰ دقیقه');
    expect(minutesToHoursLabel(45)).toBe('۴۵ دقیقه');
  });

  it('returns whole hours for exact multiples of 60', () => {
    expect(minutesToHoursLabel(60)).toBe('۱ ساعت');
    expect(minutesToHoursLabel(120)).toBe('۲ ساعت');
  });

  it('returns exact hours and remaining minutes for non-multiples', () => {
    expect(minutesToHoursLabel(90)).toBe('۱ ساعت و ۳۰ دقیقه');
    expect(minutesToHoursLabel(100)).toBe('۱ ساعت و ۴۰ دقیقه');
  });

  it('rounds fractional input minutes and clamps negative values', () => {
    expect(minutesToHoursLabel(90.6)).toBe('۱ ساعت و ۳۱ دقیقه');
    expect(minutesToHoursLabel(-15)).toBe('۰ دقیقه');
  });
});

describe('minutesToHours', () => {
  it('converts minutes to hours', () => {
    expect(minutesToHours(60)).toBe(1);
    expect(minutesToHours(120)).toBe(2);
    expect(minutesToHours(90)).toBe(1.5);
  });

  it('rounds to 1 decimal place', () => {
    expect(minutesToHours(100)).toBe(1.7);
  });
});

describe('isSameDay', () => {
  it('returns true for same date', () => {
    const d1 = new Date(2024, 5, 15);
    const d2 = new Date(2024, 5, 15);
    expect(isSameDay(d1, d2)).toBe(true);
  });

  it('returns false for different dates', () => {
    const d1 = new Date(2024, 5, 15);
    const d2 = new Date(2024, 5, 16);
    expect(isSameDay(d1, d2)).toBe(false);
  });
});

describe('getPersianWeekday', () => {
  it('returns 0 for Saturday', () => {
    // June 15, 2024 is a Saturday
    const date = new Date(2024, 5, 15);
    expect(getPersianWeekday(date)).toBe(0);
  });

  it('returns 6 for Friday', () => {
    // June 21, 2024 is a Friday
    const date = new Date(2024, 5, 21);
    expect(getPersianWeekday(date)).toBe(6);
  });
});

describe('formatPersianDate', () => {
  it('returns Persian formatted date', () => {
    // Just verify it returns a string with Persian digits and month name
    const date = new Date(2024, 5, 15);
    const result = formatPersianDate(date);
    expect(result).toContain('خرداد'); // June 15, 2024 = ۲۵ خرداد ۱۴۰۳
    expect(result).toBeTruthy();
  });
});
