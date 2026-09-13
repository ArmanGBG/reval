import { describe, expect, it } from 'vitest';
import {
  aggregateSleepByDay,
  circularMeanTime,
  computeSleepMetrics,
  isValidTimeString,
  minutesToTime,
  nightSleepMinutes,
  timeToMinutes,
} from '@/lib/sleep';
import type { SleepRecordData } from '@/lib/sleep';

function night(date: string, start: string, end: string, minutes: number): SleepRecordData {
  return { id: `n-${date}`, studentId: 's', type: 'NIGHT', date, startTime: start, endTime: end, durationMinutes: minutes };
}

function nap(date: string, start: string, minutes: number): SleepRecordData {
  return { id: `p-${date}-${start}`, studentId: 's', type: 'NAP', date, startTime: start, endTime: null, durationMinutes: minutes };
}

describe('sleep time helpers', () => {
  it('validates HH:mm strings', () => {
    expect(isValidTimeString('23:30')).toBe(true);
    expect(isValidTimeString('7:05')).toBe(true);
    expect(isValidTimeString('24:00')).toBe(false);
    expect(isValidTimeString('12:60')).toBe(false);
    expect(isValidTimeString('ab:cd')).toBe(false);
  });

  it('converts between time strings and minutes', () => {
    expect(timeToMinutes('23:30')).toBe(1410);
    expect(minutesToTime(1410)).toBe('23:30');
    expect(minutesToTime(0)).toBe('00:00');
  });

  it('computes night duration across midnight', () => {
    expect(nightSleepMinutes('23:00', '07:00')).toBe(8 * 60);
    expect(nightSleepMinutes('22:30', '06:45')).toBe(8 * 60 + 15);
    expect(nightSleepMinutes('01:00', '01:30')).toBe(30); // same-night edge
  });
});

describe('circular mean of times', () => {
  it('averages 23:00 and 01:00 to midnight, not noon', () => {
    expect(circularMeanTime(['23:00', '01:00'])).toBe(0);
  });

  it('averages normal times like a plain mean', () => {
    expect(circularMeanTime(['22:00', '23:00'])).toBe(22 * 60 + 30);
  });

  it('returns null for empty input', () => {
    expect(circularMeanTime([])).toBeNull();
  });

  it('handles three times spread around midnight', () => {
    // 23:00, 00:00, 01:00 → 00:00
    expect(circularMeanTime(['23:00', '00:00', '01:00'])).toBe(0);
  });
});

describe('sleep metrics', () => {
  it('computes averages excluding naps from night stats', () => {
    const records = [
      night('2026-09-12', '23:00', '07:00', 480),
      night('2026-09-13', '00:00', '07:30', 450),
      nap('2026-09-13', '14:00', 30),
    ];
    const metrics = computeSleepMetrics(records);
    expect(metrics.nightCount).toBe(2);
    expect(metrics.averageNightMinutes).toBe(465); // (480+450)/2
    // circular mean of 23:00 and 00:00 ≈ 23:30
    expect(metrics.averageBedtime).toBe('23:30');
    // mean of 07:00 and 07:30 = 07:15
    expect(metrics.averageWakeTime).toBe('07:15');
    expect(metrics.napCount).toBe(1);
    expect(metrics.napMinutes).toBe(30);
    expect(metrics.totalMinutes).toBe(480 + 450 + 30);
  });

  it('handles empty input', () => {
    const metrics = computeSleepMetrics([]);
    expect(metrics.averageNightMinutes).toBeNull();
    expect(metrics.averageBedtime).toBeNull();
    expect(metrics.nightCount).toBe(0);
  });
});

describe('sleep day aggregation', () => {
  it('stacks night and nap minutes per day and sorts by date', () => {
    const days = aggregateSleepByDay([
      nap('2026-09-13', '14:00', 30),
      night('2026-09-12', '23:00', '07:00', 480),
      night('2026-09-13', '00:00', '07:30', 450),
      nap('2026-09-13', '17:00', 20),
    ]);
    expect(days).toEqual([
      { date: '2026-09-12', nightMinutes: 480, napMinutes: 0 },
      { date: '2026-09-13', nightMinutes: 450, napMinutes: 50 },
    ]);
  });
});
