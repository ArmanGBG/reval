import { useAppStore } from '@/lib/store';

/**
 * Shared hook for getting the current student's ID.
 * Used consistently across Dashboard, PlanView, WeeklyPlanner, ManualEntrySheet.
 *
 * Returns user?.id if logged in, otherwise falls back to 's1' (mock ID).
 */
export function useCurrentStudentId(): string {
  const { user } = useAppStore();
  return user?.id || 's1';
}

/**
 * Get student ID outside of React hooks (e.g., in utility functions).
 */
export function getCurrentStudentId(): string {
  // Read from Zustand store directly
  const state = useAppStore.getState();
  return state.user?.id || 's1';
}

/**
 * Parse an ISO date string (YYYY-MM-DD) as a LOCAL date, not UTC.
 * This prevents off-by-one errors when the user's timezone is behind UTC.
 *
 * new Date('2024-08-03') creates a date at UTC midnight,
 * which is Aug 2 in timezones behind UTC (e.g., Iran is UTC+3:30, so it's fine,
 * but to be safe we parse as local).
 */
export function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}
