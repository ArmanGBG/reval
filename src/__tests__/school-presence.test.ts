import { describe, expect, it } from 'vitest';
import {
  calculateSchoolDurationMinutes,
  formatDurationHours,
  formatSchoolPresenceSummary,
  isValidTimeString,
} from '@/lib/school-presence';
import { buildSchoolDailyTrend } from '@/lib/analytics';
import { isGraduate, SchoolPresence } from '@/lib/types';

describe('School Presence helpers', () => {
  it('validates HH:mm time format correctly', () => {
    expect(isValidTimeString('07:30')).toBe(true);
    expect(isValidTimeString('14:00')).toBe(true);
    expect(isValidTimeString('00:00')).toBe(true);
    expect(isValidTimeString('23:59')).toBe(true);
    expect(isValidTimeString('24:00')).toBe(false);
    expect(isValidTimeString('7:30')).toBe(true);
    expect(isValidTimeString('invalid')).toBe(false);
    expect(isValidTimeString('')).toBe(false);
  });

  it('calculates school duration in minutes', () => {
    // 07:30 to 14:00 = 6 hours and 30 minutes = 390 minutes
    expect(calculateSchoolDurationMinutes('07:30', '14:00')).toBe(390);
    // 08:00 to 13:00 = 5 hours = 300 minutes
    expect(calculateSchoolDurationMinutes('08:00', '13:00')).toBe(300);
    // 07:30 to 12:30 = 5 hours = 300 minutes
    expect(calculateSchoolDurationMinutes('07:30', '12:30')).toBe(300);
  });

  it('formats duration in hours with Persian digits', () => {
    expect(formatDurationHours(390)).toBe('۶.۵');
    expect(formatDurationHours(360)).toBe('۶');
    expect(formatDurationHours(300)).toBe('۵');
  });

  it('formats school presence summary text', () => {
    const summary = formatSchoolPresenceSummary('07:30', '14:00', 390);
    expect(summary).toBe('مدرسه: ۰۷:۳۰ تا ۱۴:۰۰ - ۶.۵ ساعت حضور');
  });

  it('identifies graduated students accurately', () => {
    expect(isGraduate('فارغ‌التحصیل')).toBe(true);
    expect(isGraduate('فارغ التحصیل')).toBe(true);
    expect(isGraduate('فارغالتحصیل')).toBe(true);
    expect(isGraduate('دوازدهم')).toBe(false);
    expect(isGraduate('یازدهم')).toBe(false);
    expect(isGraduate('دهم')).toBe(false);
    expect(isGraduate(null)).toBe(false);
    expect(isGraduate(undefined)).toBe(false);
  });

  it('builds school daily trend matching dailyTrend format', () => {
    const presences: SchoolPresence[] = [
      {
        id: 'sp-1',
        userId: 'student-1',
        date: '2026-10-03',
        startTime: '07:30',
        endTime: '14:00',
        durationMinutes: 390,
      },
    ];

    const trend = buildSchoolDailyTrend(presences, 'هفته جاری', new Date('2026-10-03T12:00:00Z'));
    expect(trend).toBeDefined();
    expect(Array.isArray(trend)).toBe(true);
    expect(trend.length).toBe(7);
    const dayWithPresence = trend.find((d) => d.hours > 0);
    expect(dayWithPresence).toBeDefined();
    expect(dayWithPresence?.hours).toBe(6.5);
  });

  it('correctly distinguishes regular task payload from school task payload', () => {
    const regularTask = {
      studentId: 'user-1',
      subjectId: 'sub-1',
      date: '2026-10-02',
      isSchoolTask: false,
    };
    expect(Boolean(regularTask.isSchoolTask)).toBe(false);

    const schoolTask = {
      studentId: 'user-1',
      subjectId: 'sub-1',
      date: '2026-10-02',
      isSchoolTask: true,
      schoolPresenceId: 'sp-1',
    };
    expect(Boolean(schoolTask.isSchoolTask)).toBe(true);
    expect(schoolTask.schoolPresenceId).toBe('sp-1');
  });
});
