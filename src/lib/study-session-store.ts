'use client';

import { create } from 'zustand';

// =================================================================
// Study Session Tracker — per-task stopwatch state.
//
// State is hoisted out of TaskCard so the timer survives view switches
// (Dashboard ↔ Plan ↔ Tools) and re-renders without losing elapsed time.
// Only one task can be "running" at a time — starting a new timer pauses
// any other running timer (you can't study two things at once).
// =================================================================

export interface SessionState {
  // epoch ms when the current run started, or null if paused/not started
  startedAt: number | null;
  // accumulated ms from previous start/stop cycles (excludes the current run)
  accumulatedMs: number;
  // is the stopwatch currently ticking?
  running: boolean;
}

interface StudySessionStore {
  sessions: Record<string, SessionState>;
  // Start (or resume) the timer for a task. Pauses any other running timer.
  start: (taskId: string) => void;
  // Pause the timer for a task (keeps accumulated ms).
  pause: (taskId: string) => void;
  // Reset the timer for a task to zero (used after saving the elapsed time).
  reset: (taskId: string) => void;
  // Consume the elapsed ms and reset — returns ms elapsed.
  consume: (taskId: string) => number;
  // Read-only: total elapsed ms including the current run.
  getElapsed: (taskId: string) => number;
}

const emptySession: SessionState = {
  startedAt: null,
  accumulatedMs: 0,
  running: false,
};

export const useStudySessionStore = create<StudySessionStore>((set, get) => ({
  sessions: {},

  start: (taskId) =>
    set((state) => {
      const now = Date.now();
      const sessions = { ...state.sessions };

      // Pause any other running timer (only one task runs at a time)
      for (const id of Object.keys(sessions)) {
        if (id === taskId) continue;
        const s = sessions[id];
        if (s.running && s.startedAt !== null) {
          sessions[id] = {
            startedAt: null,
            accumulatedMs: s.accumulatedMs + (now - s.startedAt),
            running: false,
          };
        }
      }

      const current = sessions[taskId] ?? emptySession;
      sessions[taskId] = {
        startedAt: now,
        accumulatedMs: current.accumulatedMs,
        running: true,
      };

      return { sessions };
    }),

  pause: (taskId) =>
    set((state) => {
      const s = state.sessions[taskId];
      if (!s || !s.running || s.startedAt === null) return state;
      const now = Date.now();
      return {
        sessions: {
          ...state.sessions,
          [taskId]: {
            startedAt: null,
            accumulatedMs: s.accumulatedMs + (now - s.startedAt),
            running: false,
          },
        },
      };
    }),

  reset: (taskId) =>
    set((state) => {
      const sessions = { ...state.sessions };
      delete sessions[taskId];
      return { sessions };
    }),

  consume: (taskId) => {
    const elapsed = get().getElapsed(taskId);
    if (elapsed > 0) {
      get().reset(taskId);
    }
    return elapsed;
  },

  getElapsed: (taskId) => {
    const s = get().sessions[taskId];
    if (!s) return 0;
    if (s.running && s.startedAt !== null) {
      return s.accumulatedMs + (Date.now() - s.startedAt);
    }
    return s.accumulatedMs;
  },
}));

// Format milliseconds as mm:ss (Persian digits).
// Caps at 99:59 to keep the layout stable.
export function formatStopwatch(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.min(99, Math.floor(totalSec / 60));
  const s = totalSec % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return toPersianDigitsLight(`${mm}:${ss}`);
}

// Convert ms → rounded minutes (for saving into actualTimeMinutes).
export function msToMinutes(ms: number): number {
  return Math.max(0, Math.round(ms / 60000));
}

// Light Persian digit conversion (avoids circular import with persian-date.ts).
function toPersianDigitsLight(s: string): string {
  const map = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return s.replace(/[0-9]/g, (d) => map[Number(d)]);
}
