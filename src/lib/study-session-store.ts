'use client';

import { create } from 'zustand';

// =================================================================
// Study Session Tracker — per-task stopwatch state.
//
// State is hoisted out of TaskCard so the timer survives view switches
// (Dashboard ↔ Plan ↔ Tools) and re-renders without losing elapsed time.
// Only one task can be "running" at a time — starting a new timer pauses
// any other running timer (you can't study two things at once).
//
// State is also persisted to localStorage so a page refresh doesn't
// lose the elapsed time. On hydration, any timer that was "running"
// when the page closed is auto-paused — its elapsed time is preserved
// (added to accumulatedMs), but the ticker doesn't resume on its own.
// The student can click ▶ again to continue.
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
  // Pause + persist any running timer (used on tab close / pagehide).
  pauseAll: () => void;
}

const emptySession: SessionState = {
  startedAt: null,
  accumulatedMs: 0,
  running: false,
};

// ===== localStorage persistence =====
const STORAGE_KEY = 'reval:study-sessions:v1';

function loadSessions(): Record<string, SessionState> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, SessionState>;
    if (!parsed || typeof parsed !== 'object') return {};

    // Hydration safety: any timer that was "running" when the page closed
    // is auto-paused. The elapsed time during the closed period is added
    // to accumulatedMs so the user doesn't lose progress — but the ticker
    // doesn't resume on its own (the student must click ▶ to continue).
    const now = Date.now();
    const result: Record<string, SessionState> = {};
    for (const [id, s] of Object.entries(parsed)) {
      if (!s || typeof s !== 'object') continue;
      if (s.running && s.startedAt !== null) {
        // Cap the auto-pause at 8 hours so a 3-day tab-close doesn't add
        // 72 hours of fake study time.
        const elapsed = Math.min(now - s.startedAt, 8 * 60 * 60 * 1000);
        result[id] = {
          startedAt: null,
          accumulatedMs: (s.accumulatedMs ?? 0) + elapsed,
          running: false,
        };
      } else {
        result[id] = {
          startedAt: null,
          accumulatedMs: s.accumulatedMs ?? 0,
          running: false,
        };
      }
    }
    return result;
  } catch {
    return {};
  }
}

function saveSessions(sessions: Record<string, SessionState>) {
  if (typeof window === 'undefined') return;
  try {
    // Don't persist empty sessions (cleanup).
    const hasData = Object.keys(sessions).length > 0;
    if (hasData) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Quota exceeded — fail silently.
  }
}

// Initial state — hydrate from localStorage on the client.
const initialSessions =
  typeof window !== 'undefined' ? loadSessions() : {};

export const useStudySessionStore = create<StudySessionStore>((set, get) => ({
  sessions: initialSessions,

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

      saveSessions(sessions);
      return { sessions };
    }),

  pause: (taskId) =>
    set((state) => {
      const s = state.sessions[taskId];
      if (!s || !s.running || s.startedAt === null) return state;
      const now = Date.now();
      const sessions = {
        ...state.sessions,
        [taskId]: {
          startedAt: null,
          accumulatedMs: s.accumulatedMs + (now - s.startedAt),
          running: false,
        },
      };
      saveSessions(sessions);
      return { sessions };
    }),

  reset: (taskId) =>
    set((state) => {
      const sessions = { ...state.sessions };
      delete sessions[taskId];
      saveSessions(sessions);
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

  pauseAll: () =>
    set((state) => {
      const now = Date.now();
      let changed = false;
      const sessions: Record<string, SessionState> = {};
      for (const [id, s] of Object.entries(state.sessions)) {
        if (s.running && s.startedAt !== null) {
          sessions[id] = {
            startedAt: null,
            accumulatedMs: s.accumulatedMs + (now - s.startedAt),
            running: false,
          };
          changed = true;
        } else {
          sessions[id] = s;
        }
      }
      if (changed) saveSessions(sessions);
      return changed ? { sessions } : state;
    }),
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
