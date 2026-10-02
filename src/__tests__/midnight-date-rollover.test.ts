import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  toISODate,
  getLocalToday,
  getTodayISODate,
  getTodayJalaliString,
  parseLocalDate,
  isToday,
  toJalali,
} from '@/lib/persian-date';
import { useAppStore } from '@/lib/store';

describe('Midnight Date Rollover & Timezone-Aware Calculations', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Timezone-aware Today Calculation', () => {
    it('uses local browser date components and does not drag back via UTC offsets', () => {
      // Create a local date: 2026-10-02 at 00:15:00 (15 minutes after midnight)
      const localDate = new Date(2026, 9, 2, 0, 15, 0); // month is 0-indexed: 9 = October
      const isoDate = toISODate(localDate);
      expect(isoDate).toBe('2026-10-02');

      const todayIso = getTodayISODate(localDate);
      expect(todayIso).toBe('2026-10-02');

      const jalali = toJalali(localDate);
      // October 2, 2026 corresponds to Mehr 10, 1405 in Jalali
      expect(jalali.jy).toBe(1405);
      expect(jalali.jm).toBe(7); // Mehr
      expect(jalali.jd).toBe(10);

      const jalaliStr = getTodayJalaliString(localDate);
      expect(jalaliStr).toContain('مهر');
      expect(jalaliStr).toContain('۱۴۰۵');
    });

    it('parseLocalDate preserves local day without timezone shifts', () => {
      const parsed = parseLocalDate('2026-10-02');
      expect(parsed.getFullYear()).toBe(2026);
      expect(parsed.getMonth()).toBe(9);
      expect(parsed.getDate()).toBe(2);
      expect(toISODate(parsed)).toBe('2026-10-02');
    });

    it('isToday correctly identifies today using both Date and string', () => {
      const today = new Date();
      const todayStr = toISODate(today);

      expect(isToday(today)).toBe(true);
      expect(isToday(todayStr)).toBe(true);

      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      expect(isToday(yesterday)).toBe(false);
      expect(isToday(toISODate(yesterday))).toBe(false);

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(isToday(tomorrow)).toBe(false);
      expect(isToday(toISODate(tomorrow))).toBe(false);
    });
  });

  describe('Zustand Store Rollover Logic', () => {
    it('shifts selectedDate to new day when user was viewing today and midnight passes', () => {
      // Mock timers to Oct 1st 23:59:00
      vi.useFakeTimers();
      const oct1 = new Date(2026, 9, 1, 23, 59, 0);
      vi.setSystemTime(oct1);

      const store = useAppStore.getState();
      store.setSelectedDate('2026-10-01', false);
      useAppStore.setState({
        todayDate: '2026-10-01',
        currentDate: '2026-10-01',
        selectedDate: '2026-10-01',
        isExplicitDateSelected: false,
      });

      expect(useAppStore.getState().selectedDate).toBe('2026-10-01');

      // Advance time past midnight to Oct 2nd 00:05:00
      const oct2 = new Date(2026, 9, 2, 0, 5, 0);
      vi.setSystemTime(oct2);

      // Check rollover
      const rolledOver = useAppStore.getState().checkDateRollover();
      expect(rolledOver).toBe(true);

      const stateAfter = useAppStore.getState();
      expect(stateAfter.todayDate).toBe('2026-10-02');
      expect(stateAfter.currentDate).toBe('2026-10-02');
      // UI Sync: selectedDate defaults to new today because user hadn't explicitly selected another past/future date
      expect(stateAfter.selectedDate).toBe('2026-10-02');
    });

    it('preserves user explicit past/future selection when midnight passes', () => {
      vi.useFakeTimers();
      const oct1 = new Date(2026, 9, 1, 23, 59, 0);
      vi.setSystemTime(oct1);

      useAppStore.setState({
        todayDate: '2026-10-01',
        currentDate: '2026-10-01',
        selectedDate: '2026-09-20', // Explicit past date picked by user
        isExplicitDateSelected: true,
      });

      // Advance time past midnight
      const oct2 = new Date(2026, 9, 2, 0, 5, 0);
      vi.setSystemTime(oct2);

      const rolledOver = useAppStore.getState().checkDateRollover();
      expect(rolledOver).toBe(true);

      const stateAfter = useAppStore.getState();
      expect(stateAfter.todayDate).toBe('2026-10-02');
      expect(stateAfter.currentDate).toBe('2026-10-02');
      // User's explicit past selection is preserved!
      expect(stateAfter.selectedDate).toBe('2026-09-20');
      expect(stateAfter.isExplicitDateSelected).toBe(true);
    });

    it('does not re-roll if date has not changed', () => {
      vi.useFakeTimers();
      const oct2Morning = new Date(2026, 9, 2, 9, 0, 0);
      vi.setSystemTime(oct2Morning);

      useAppStore.setState({
        todayDate: '2026-10-02',
        currentDate: '2026-10-02',
        selectedDate: '2026-10-02',
        isExplicitDateSelected: false,
      });

      // Same day afternoon
      const oct2Afternoon = new Date(2026, 9, 2, 14, 0, 0);
      vi.setSystemTime(oct2Afternoon);

      const rolledOver = useAppStore.getState().checkDateRollover();
      expect(rolledOver).toBe(false);
      expect(useAppStore.getState().selectedDate).toBe('2026-10-02');
    });
  });
});
