'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Save, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { useStudySessionStore, formatStopwatch, msToMinutes } from '@/lib/study-session-store';
import { useAppStore } from '@/lib/store';
import { minutesToHoursLabel, toPersianDigits } from '@/lib/persian-date';

interface StudySessionTimerProps {
  taskId: string;
  // Existing actualTimeMinutes (from task.actualTimeMinutes)
  savedMinutes: number | null;
}

/**
 * Inline stopwatch that lives inside TaskCard.
 *
 * State is hoisted to useStudySessionStore so it survives view switches
 * (Dashboard ↔ Plan ↔ Tools) without losing elapsed time. The store is
 * also persisted to localStorage, so a page refresh preserves elapsed
 * time (running timers are auto-paused on reload).
 *
 * Behavior:
 *  - ▶ Play  → starts the timer (pauses any other running timer).
 *  - ⏸ Pause → stops the ticker, keeps accumulated ms.
 *  - 💾 Save → adds elapsed minutes to task.actualTimeMinutes via updateTask,
 *              then resets the timer. Toast confirmation.
 *  - ↺ Reset → discards elapsed time without saving (with confirm).
 *
 * Auto-save hooks:
 *  - `beforeunload` / `pagehide`: pauses all running timers (so the elapsed
 *    time is captured in localStorage before the tab closes).
 *  - Unmount (when the task is completed/skipped and the timer is unmounted):
 *    auto-saves any paused elapsed time ≥ 1 minute to the DB. This prevents
 *    the "user completes task while timer is running → elapsed time lost"
 *    scenario from round 24's known-issues list.
 */
export default function StudySessionTimer({ taskId, savedMinutes }: StudySessionTimerProps) {
  const session = useStudySessionStore((s) => s.sessions[taskId]);
  const start = useStudySessionStore((s) => s.start);
  const pause = useStudySessionStore((s) => s.pause);
  const consume = useStudySessionStore((s) => s.consume);
  const reset = useStudySessionStore((s) => s.reset);
  const getElapsed = useStudySessionStore((s) => s.getElapsed);
  const pauseAll = useStudySessionStore((s) => s.pauseAll);
  const updateTask = useAppStore((s) => s.updateTask);

  const [display, setDisplay] = useState('۰۰:۰۰');
  const [saving, setSaving] = useState(false);
  // Track the previously-saved minutes locally so the "saved" pill can
  // animate when a new chunk is added without waiting for the store update.
  const [savedPill, setSavedPill] = useState<number | null>(savedMinutes);
  const savedPillRef = useRef<number | null>(savedMinutes);

  // Keep savedPill in sync if the prop changes (e.g., after reset task)
  useEffect(() => {
    setSavedPill(savedMinutes);
    savedPillRef.current = savedMinutes;
  }, [savedMinutes]);

  // Tick every 500ms while running.
  useEffect(() => {
    const running = session?.running;
    if (!running) return;

    const update = () => {
      const ms = getElapsed(taskId);
      setDisplay(formatStopwatch(ms));
    };
    update();
    const id = setInterval(update, 500);
    return () => clearInterval(id);
  }, [session?.running, taskId, getElapsed]);

  // When paused (or never started), sync display with accumulated ms.
  useEffect(() => {
    if (session?.running) return;
    const ms = session?.accumulatedMs ?? 0;
    setDisplay(formatStopwatch(ms));
  }, [session?.running, session?.accumulatedMs]);

  // ===== Global pause on tab close =====
  // Pause all running timers when the user leaves/closes the tab so the
  // elapsed time is captured in localStorage (which is read on next load).
  useEffect(() => {
    const handler = () => pauseAll();
    window.addEventListener('pagehide', handler);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        // Don't pause on visibility change — the user might be switching
        // to another app briefly and want the timer to keep running.
        // Just persist the current state.
        pauseAll(); // OK to pause — they can resume on return
      }
    });
    return () => {
      window.removeEventListener('pagehide', handler);
    };
  }, [pauseAll]);

  // ===== Auto-save on unmount =====
  // When this timer component unmounts (e.g., the task was completed and
  // the card re-rendered without the timer), if there's accumulated time
  // ≥ 1 minute that hasn't been saved yet, save it silently.
  useEffect(() => {
    return () => {
      const elapsedMs = getElapsed(taskId);
      const minutes = msToMinutes(elapsedMs);
      if (minutes === 0) return;
      // Consume + save silently (no toast — the user might be mid-action)
      consume(taskId);
      const newTotal = (savedPillRef.current ?? 0) + minutes;
      updateTask(taskId, { actualTimeMinutes: newTotal }).catch(() => {
        // On error, restore the elapsed time so the user can retry.
        start(taskId);
        pause(taskId);
      });
    };
  }, [taskId, consume, getElapsed, updateTask, start, pause]);

  const running = session?.running ?? false;
  const accumulatedMs = session?.accumulatedMs ?? 0;
  const hasElapsed = accumulatedMs > 0 || running;

  const handleStartPause = () => {
    if (running) {
      pause(taskId);
    } else {
      start(taskId);
    }
  };

  const handleSave = async () => {
    const elapsedMs = getElapsed(taskId);
    const minutes = msToMinutes(elapsedMs);
    if (minutes === 0) {
      toast('زمان کمتر از یک دقیقه ثبت نشد', {
        style: { background: 'var(--bg-overlay)', border: '1px solid var(--border-strong)', color: 'var(--foreground-muted)' },
      });
      return;
    }
    // Only consume (reset) once we know we're actually saving
    consume(taskId);
    setSaving(true);
    const newTotal = (savedPillRef.current ?? 0) + minutes;
    try {
      await updateTask(taskId, { actualTimeMinutes: newTotal });
      setSavedPill(newTotal);
      savedPillRef.current = newTotal;
      toast.success(`${toPersianDigits(minutes)} دقیقه به زمان مطالعه اضافه شد`, {
        style: { background: 'var(--bg-overlay)', border: '1px solid var(--border-strong)', color: 'var(--accent)' },
      });
    } catch {
      toast.error('خطا در ذخیره زمان مطالعه', {
        style: { background: 'var(--bg-overlay)', border: '1px solid var(--danger)', color: 'var(--danger)' },
      });
      // restore the elapsed time so user can retry
      start(taskId);
      pause(taskId);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (accumulatedMs < 1000) {
      reset(taskId);
      return;
    }
    if (window.confirm('زمان تایمر صفر شود؟ این عمل قابل بازگشت نیست.')) {
      reset(taskId);
    }
  };

  return (
    <div className="mt-3 pt-3 border-t border-dashed border-[var(--border)]">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        {/* Left: label + accumulated saved time */}
        <div className="flex items-center gap-2 text-[11px] text-[var(--foreground-muted)]">
          <span className="flex items-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-full ${running ? 'bg-[var(--accent)] animate-pulse' : 'bg-[var(--foreground-subtle)]'}`} />
            تایمر مطالعه
          </span>
          {savedPill !== null && savedPill > 0 && (
            <motion.span
              key={savedPill}
              initial={{ scale: 0.85, opacity: 0.5 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 18 }}
              className="text-[10px] px-1.5 py-0.5 rounded-md bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--border-strong)] font-medium"
            >
              ذخیره: {minutesToHoursLabel(savedPill)}
            </motion.span>
          )}
        </div>

        {/* Right: timer display + buttons */}
        <div className="flex items-center gap-1.5">
          {/* Timer display */}
          <AnimatePresence mode="popLayout">
            {hasElapsed && (
              <motion.div
                key="display"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center gap-1.5 px-2.5 h-8 rounded-md bg-[rgba(255,255,255,0.04)] border border-[var(--border)] font-mono text-sm tabular-nums"
                style={{ color: running ? 'var(--accent)' : 'var(--foreground)' }}
                dir="ltr"
              >
                {display}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Start/Pause button */}
          <button
            onClick={handleStartPause}
            className={`w-8 h-8 rounded-md flex items-center justify-center border transition-all active:scale-95 ${
              running
                ? 'bg-[rgba(216,150,20,0.12)] text-[var(--warning)] border-[rgba(216,150,20,0.25)] hover:bg-[rgba(216,150,20,0.18)]'
                : 'bg-[var(--accent-soft)] text-[var(--accent)] border-[var(--border-strong)] hover:bg-[var(--accent-soft)]'
            }`}
            aria-label={running ? 'توقف تایمر' : 'شروع تایمر'}
            title={running ? 'توقف' : 'شروع'}
          >
            {running ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
          </button>

          {/* Save button — only visible when there's accumulated time */}
          <AnimatePresence>
            {hasElapsed && !running && (
              <motion.button
                key="save"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                onClick={handleSave}
                disabled={saving}
                className="h-8 px-2.5 rounded-md flex items-center gap-1 text-[11px] font-bold bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--border-strong)] hover:bg-[var(--accent-soft)] disabled:opacity-50 active:scale-95 transition-all overflow-hidden"
                aria-label="ذخیره زمان"
              >
                <Save className="w-3 h-3" />
                {saving ? '…' : 'ذخیره'}
              </motion.button>
            )}
          </AnimatePresence>

          {/* Reset button — only visible when paused with elapsed > 0 */}
          <AnimatePresence>
            {hasElapsed && !running && (
              <motion.button
                key="reset"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={handleReset}
                className="w-8 h-8 rounded-md flex items-center justify-center text-[var(--foreground-subtle)] hover:text-[var(--danger)] hover:bg-[rgba(229,72,77,0.08)] transition-all active:scale-95"
                aria-label="صفر کردن تایمر"
                title="صفر کردن"
              >
                <RotateCcw className="w-3 h-3" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
