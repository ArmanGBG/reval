'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, SkipForward, Settings, Link2, Unlink, Check } from 'lucide-react';
import { toast } from 'sonner';
import { toPersianDigits, toISODate } from '@/lib/persian-date';
import { useAppStore } from '@/lib/store';
import { useCurrentStudentId } from '@/lib/student-utils';
import type { Task } from '@/lib/types';

// ===== Mode configuration =====
type TimerMode = 'focus' | 'short' | 'long';

interface ModeConfig {
  id: TimerMode;
  label: string;
  hint: string;
  duration: number; // seconds (default)
}

const DEFAULT_DURATIONS: Record<TimerMode, number> = {
  focus: 25 * 60,
  short: 5 * 60,
  long: 15 * 60,
};

const SESSIONS_BEFORE_LONG_BREAK = 4;

// ===== Persistence keys =====
const DURATIONS_KEY = 'reval:pomodoro-durations:v1';
const STATS_KEY = 'reval:pomodoro-stats:v1';

interface DailyStats {
  date: string; // ISO date
  focusSessions: number;
  focusMinutes: number;
}

function loadDurations(): Record<TimerMode, number> {
  if (typeof window === 'undefined') return { ...DEFAULT_DURATIONS };
  try {
    const raw = localStorage.getItem(DURATIONS_KEY);
    if (!raw) return { ...DEFAULT_DURATIONS };
    const parsed = JSON.parse(raw) as Partial<Record<TimerMode, number>>;
    return {
      focus: typeof parsed.focus === 'number' && parsed.focus >= 60 ? parsed.focus : DEFAULT_DURATIONS.focus,
      short: typeof parsed.short === 'number' && parsed.short >= 30 ? parsed.short : DEFAULT_DURATIONS.short,
      long: typeof parsed.long === 'number' && parsed.long >= 60 ? parsed.long : DEFAULT_DURATIONS.long,
    };
  } catch {
    return { ...DEFAULT_DURATIONS };
  }
}

function saveDurations(d: Record<TimerMode, number>) {
  try { localStorage.setItem(DURATIONS_KEY, JSON.stringify(d)); } catch { /* ignore */ }
}

function loadTodayStats(): DailyStats {
  const today = toISODate(new Date());
  if (typeof window === 'undefined') return { date: today, focusSessions: 0, focusMinutes: 0 };
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) return { date: today, focusSessions: 0, focusMinutes: 0 };
    const parsed = JSON.parse(raw) as DailyStats;
    if (parsed.date !== today) return { date: today, focusSessions: 0, focusMinutes: 0 };
    return parsed;
  } catch {
    return { date: today, focusSessions: 0, focusMinutes: 0 };
  }
}

function saveTodayStats(s: DailyStats) {
  try { localStorage.setItem(STATS_KEY, JSON.stringify(s)); } catch { /* ignore */ }
}

// ===== Subtle beep generator (lazy, browser-only) =====
let cachedBeepUrl: string | null = null;

function getBeepUrl(): string {
  if (cachedBeepUrl) return cachedBeepUrl;
  try {
    const sampleRate = 8000;
    const duration = 0.22; // seconds
    const freq = 880;
    const samples = Math.floor(sampleRate * duration);
    const buffer = new ArrayBuffer(44 + samples);
    const view = new DataView(buffer);

    const writeStr = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    };

    // RIFF header
    writeStr(0, 'RIFF');
    view.setUint32(4, 36 + samples, true);
    writeStr(8, 'WAVE');
    // fmt chunk
    writeStr(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, 1, true); // mono
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate, true); // byte rate
    view.setUint16(32, 1, true); // block align
    view.setUint16(34, 8, true); // bits per sample
    // data chunk
    writeStr(36, 'data');
    view.setUint32(40, samples, true);

    // Soft sine beep with attack/release envelope
    const attack = Math.floor(sampleRate * 0.012);
    const release = Math.floor(sampleRate * 0.06);
    for (let i = 0; i < samples; i++) {
      let env = 1;
      if (i < attack) env = i / attack;
      else if (i > samples - release) env = Math.max(0, (samples - i) / release);
      const v = Math.sin(2 * Math.PI * freq * (i / sampleRate)) * 0.35 * env;
      view.setUint8(44 + i, Math.round((v + 1) * 127.5));
    }

    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    cachedBeepUrl = 'data:audio/wav;base64,' + btoa(binary);
  } catch {
    cachedBeepUrl = '';
  }
  return cachedBeepUrl;
}

function playBeep() {
  try {
    const url = getBeepUrl();
    if (!url) return;
    const audio = new Audio(url);
    audio.volume = 0.4;
    void audio.play().catch(() => {
      /* autoplay blocked or unsupported — silent fallback */
    });
  } catch {
    /* no-op */
  }
}

// ===== Component =====
export default function PomodoroTimer() {
  const { tasks, updateTask } = useAppStore();
  const studentId = useCurrentStudentId();
  const [durations, setDurations] = useState<Record<TimerMode, number>>(() => loadDurations());
  const [mode, setMode] = useState<TimerMode>('focus');
  const [timeLeft, setTimeLeft] = useState<number>(() => loadDurations().focus);
  const [isRunning, setIsRunning] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  // Linked task for focus sessions — its actualTimeMinutes accumulates as the
  // student completes focus sessions. Cleared when the linked task is unlinked
  // or no longer exists in the store.
  const [linkedTaskId, setLinkedTaskId] = useState<string | null>(null);
  const [showTaskPicker, setShowTaskPicker] = useState(false);

  // Sessions completed in the current 4-session cycle (0..4)
  const [completedInCycle, setCompletedInCycle] = useState(0);
  // Cumulative focus sessions completed (for "جلسه N" display)
  const [totalCompleted, setTotalCompleted] = useState(0);

  // Today's focus stats (persisted)
  const [todayStats, setTodayStats] = useState<DailyStats>(() => loadTodayStats());

  const completionHandledRef = useRef(false);

  // Mode-driven styling
  const isFocus = mode === 'focus';
  const modeColor = isFocus ? 'var(--accent)' : 'var(--gold)';
  const modeGlow = isFocus ? 'var(--accent-glow)' : 'var(--gold-glow)';
  const modeHover = isFocus ? 'var(--accent-hover)' : '#F5C56B';

  const MODES: ModeConfig[] = useMemo(() => [
    { id: 'focus', label: 'تمرکز', hint: 'تمرکز کن', duration: durations.focus },
    { id: 'short', label: 'استراحت کوتاه', hint: 'یه نفس بکش', duration: durations.short },
    { id: 'long', label: 'استراحت بلند', hint: 'استراحت کامل', duration: durations.long },
  ], [durations]);

  const currentMode = useMemo(() => MODES.find((m) => m.id === mode)!, [MODES, mode]);
  const totalDuration = durations[mode];

  // ===== Today's tasks available for linking =====
  // Includes both pending AND completed tasks (so the student can log
  // additional focus time on a completed task — over-achievement is fine).
  // Drafts (detailsCompleted === false) and skipped tasks are excluded.
  const todayISO = toISODate(new Date());
  const todaysTasks = useMemo(
    () => tasks.filter((t) =>
      t.studentId === studentId &&
      t.date === todayISO &&
      t.detailsCompleted !== false &&
      t.completed !== false,
    ).sort((a, b) => {
      // Pending first, then by order
      const aPending = a.completed === null ? 0 : 1;
      const bPending = b.completed === null ? 0 : 1;
      if (aPending !== bPending) return aPending - bPending;
      return a.order - b.order;
    }),
    [tasks, studentId, todayISO],
  );
  const linkedTask: Task | null = useMemo(
    () => linkedTaskId ? tasks.find((t) => t.id === linkedTaskId) ?? null : null,
    [linkedTaskId, tasks],
  );
  // Auto-clear linked task if it was deleted or completed elsewhere
  useEffect(() => {
    if (linkedTaskId && !linkedTask) setLinkedTaskId(null);
  }, [linkedTaskId, linkedTask]);

  // ----- Completion handler -----
  const handleComplete = useCallback(() => {
    playBeep();

    if (mode === 'focus') {
      const nextCompleted = completedInCycle + 1;
      setTotalCompleted((n) => n + 1);

      // Record focus minutes to today's stats
      const focusMin = Math.round(durations.focus / 60);
      setTodayStats((prev) => {
        const next = { date: prev.date, focusSessions: prev.focusSessions + 1, focusMinutes: prev.focusMinutes + focusMin };
        saveTodayStats(next);
        return next;
      });

      // ===== Linked-task integration =====
      // If the student linked a task to this focus session, add the focus
      // minutes to its actualTimeMinutes. This works for both pending and
      // completed tasks — over-achievement (more time than planned) is fine
      // and shows up in analytics.
      if (linkedTask) {
        const newActual = (linkedTask.actualTimeMinutes ?? 0) + focusMin;
        void updateTask(linkedTask.id, { actualTimeMinutes: newActual }).then(() => {
          const subjectLabel = linkedTask.subject;
          const topicLabel = linkedTask.topic ? ` · ${linkedTask.topic}` : '';
          const targetMin = linkedTask.targetTimeMinutes ?? 0;
          if (targetMin > 0 && newActual >= targetMin && (linkedTask.actualTimeMinutes ?? 0) < targetMin) {
            toast.success(
              `${toPersianDigits(focusMin)} دقیقه به «${subjectLabel}${topicLabel}» اضافه شد — به هدف رسیدی! 🎯`,
              { duration: 4500 }
            );
          } else {
            toast.success(
              `${toPersianDigits(focusMin)} دقیقه به «${subjectLabel}${topicLabel}» اضافه شد`,
              { duration: 3500 }
            );
          }
        }).catch(() => {
          // Silently ignore — the focus session still counts toward today's stats
        });
      }

      if (nextCompleted >= SESSIONS_BEFORE_LONG_BREAK) {
        setCompletedInCycle(SESSIONS_BEFORE_LONG_BREAK);
        setMode('long');
        setTimeLeft(durations.long);
        toast.success(
          `آفرین! ${toPersianDigits(SESSIONS_BEFORE_LONG_BREAK)} جلسه تمرکز کامل شد — حالا یه استراحت بلند داشته باش`,
          { duration: 4000 }
        );
      } else {
        setCompletedInCycle(nextCompleted);
        setMode('short');
        setTimeLeft(durations.short);
        toast('تمرکز عالی بود! یه استراحت کوتاه داشته باش', { duration: 3500 });
      }
    } else {
      // A break just ended → go back to focus; reset cycle if long break done
      if (completedInCycle >= SESSIONS_BEFORE_LONG_BREAK) {
        setCompletedInCycle(0);
      }
      setMode('focus');
      setTimeLeft(durations.focus);
      toast('استراحت تموم شد — آماده‌ای برای تمرکز؟', { duration: 3500 });
    }

    setIsRunning(false);
  }, [mode, completedInCycle, durations, linkedTask, updateTask]);

  // ----- Tick effect (setInterval, cleaned up on unmount / pause) -----
  useEffect(() => {
    if (!isRunning) {
      completionHandledRef.current = false;
      return;
    }
    const id = setInterval(() => {
      setTimeLeft((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [isRunning]);

  // ----- Completion detection -----
  useEffect(() => {
    if (timeLeft === 0 && isRunning && !completionHandledRef.current) {
      completionHandledRef.current = true;
      handleComplete();
    }
  }, [timeLeft, isRunning, handleComplete]);

  // ----- Actions -----
  const toggleRunning = useCallback(() => {
    completionHandledRef.current = false;
    setIsRunning((r) => !r);
  }, []);

  // ----- Global Space-to-toggle listener -----
  useEffect(() => {
    const handler = () => toggleRunning();
    window.addEventListener('pomodoro-toggle', handler);
    return () => window.removeEventListener('pomodoro-toggle', handler);
  }, [toggleRunning]);

  const handleReset = useCallback(() => {
    setTimeLeft(durations[mode]);
    setIsRunning(false);
    completionHandledRef.current = false;
  }, [mode, durations]);

  const switchMode = useCallback((newMode: TimerMode) => {
    if (newMode === mode) return;
    // Starting fresh focus after a completed long break → reset cycle
    if (newMode === 'focus' && completedInCycle >= SESSIONS_BEFORE_LONG_BREAK) {
      setCompletedInCycle(0);
    }
    setMode(newMode);
    setTimeLeft(durations[newMode]);
    setIsRunning(false);
    completionHandledRef.current = false;
  }, [mode, completedInCycle, durations]);

  const handleSkip = useCallback(() => {
    completionHandledRef.current = false;
    if (mode === 'focus') {
      // Abandon current focus → take a break
      const nextBreak: TimerMode =
        completedInCycle >= SESSIONS_BEFORE_LONG_BREAK ? 'long' : 'short';
      if (nextBreak === 'long') setCompletedInCycle(SESSIONS_BEFORE_LONG_BREAK);
      setMode(nextBreak);
      setTimeLeft(durations[nextBreak]);
    } else {
      // Break done early → go to focus; reset cycle if long break
      if (completedInCycle >= SESSIONS_BEFORE_LONG_BREAK) {
        setCompletedInCycle(0);
      }
      setMode('focus');
      setTimeLeft(durations.focus);
    }
    setIsRunning(false);
  }, [mode, completedInCycle, durations]);

  // ----- Duration customization -----
  const updateDuration = useCallback((m: TimerMode, minutes: number) => {
    const clamped = Math.max(1, Math.min(120, minutes));
    const seconds = clamped * 60;
    setDurations((prev) => {
      const next = { ...prev, [m]: seconds };
      saveDurations(next);
      return next;
    });
    // If editing the current mode's duration (and not running), update timeLeft
    if (m === mode && !isRunning) {
      setTimeLeft(seconds);
    }
  }, [mode, isRunning]);

  const resetDurations = useCallback(() => {
    setDurations({ ...DEFAULT_DURATIONS });
    saveDurations({ ...DEFAULT_DURATIONS });
    if (!isRunning) setTimeLeft(DEFAULT_DURATIONS[mode]);
    toast('زمان‌ها به حالت پیش‌فرض برگشتند');
  }, [mode, isRunning]);

  // ----- Derived display values -----
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const displayTime = toPersianDigits(
    `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  );

  const progress = totalDuration > 0 ? (totalDuration - timeLeft) / totalDuration : 0;

  // Circle geometry
  const size = 240;
  const center = size / 2;
  const radius = 100;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  const dotsFilled =
    completedInCycle >= SESSIONS_BEFORE_LONG_BREAK
      ? SESSIONS_BEFORE_LONG_BREAK
      : completedInCycle;

  return (
    <div dir="rtl" className="flex flex-col items-center py-2 select-none relative">
      {/* ===== Settings gear (top-right) ===== */}
      <button
        onClick={() => setShowSettings((s) => !s)}
        aria-label="تنظیمات زمان‌ها"
        className={`absolute top-0 left-0 icon-btn w-9 h-9 rounded-lg surface-1 border border-[var(--border)] flex items-center justify-center transition-colors ${showSettings ? 'text-[var(--accent)]' : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'}`}
      >
        <Settings className="w-4 h-4" />
      </button>

      {/* ===== Settings panel (collapsible) ===== */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: 'auto', marginBottom: 20 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="w-full overflow-hidden"
          >
            <div className="surface-1 rounded-2xl p-4 border border-[var(--border)] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-[var(--foreground)]">زمان‌بندی جلسات</span>
                <button
                  onClick={resetDurations}
                  className="text-[11px] text-[var(--foreground-muted)] hover:text-[var(--accent)] transition-colors"
                >
                  پیش‌فرض
                </button>
              </div>
              {MODES.map((m) => (
                <div key={m.id} className="flex items-center justify-between gap-3">
                  <span className="text-xs text-[var(--foreground-muted)] min-w-[5.5rem]">{m.label}</span>
                  <div className="flex items-center gap-2 flex-1">
                    <button
                      onClick={() => updateDuration(m.id, Math.round(durations[m.id] / 60) - 1)}
                      disabled={durations[m.id] <= 60}
                      className="w-7 h-7 rounded-lg surface-1 border border-[var(--border)] text-[var(--foreground)] flex items-center justify-center disabled:opacity-30 hover:border-[var(--accent)] transition-colors text-sm"
                    >
                      −
                    </button>
                    <span className="text-sm font-bold text-[var(--foreground)] tabular-nums min-w-[3.5rem] text-center">
                      {toPersianDigits(Math.round(durations[m.id] / 60))} دقیقه
                    </span>
                    <button
                      onClick={() => updateDuration(m.id, Math.round(durations[m.id] / 60) + 1)}
                      disabled={durations[m.id] >= 7200}
                      className="w-7 h-7 rounded-lg surface-1 border border-[var(--border)] text-[var(--foreground)] flex items-center justify-center disabled:opacity-30 hover:border-[var(--accent)] transition-colors text-sm"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
              <p className="text-[11px] text-[var(--foreground-subtle)] pt-1">
                تغییرات ذخیره می‌شن و برای دفعات بعدی نگه داشته می‌شن
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== Mode Tabs ===== */}
      <div className="inline-flex items-center gap-1 p-1 surface-1 rounded-full border border-[var(--border)] mb-5">
        {MODES.map((m) => {
          const active = m.id === mode;
          return (
            <button
              key={m.id}
              onClick={() => switchMode(m.id)}
              className={`relative px-4 py-1.5 rounded-full text-xs font-bold transition-colors duration-200 ${
                active
                  ? 'text-[var(--bg-deep)]'
                  : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
              }`}
            >
              {active && (
                <motion.span
                  layoutId="pomodoro-mode-pill"
                  className="absolute inset-0 rounded-full"
                  style={{ backgroundColor: m.id === 'focus' ? 'var(--accent)' : 'var(--gold)' }}
                  transition={{ type: 'spring', damping: 26, stiffness: 320 }}
                />
              )}
              <span className="relative z-10 whitespace-nowrap">{m.label}</span>
            </button>
          );
        })}
      </div>

      {/* ===== Linked task chip + picker ===== */}
      {/* Shows the currently-linked task (or a "link task" CTA) above the timer. */}
      {/* Focus time accumulates onto the linked task's actualTimeMinutes. */}
      <div className="mb-5 w-full max-w-[280px] relative">
        {linkedTask ? (
          <div
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border bg-[var(--bg-elevated)] transition-shadow ${
              isRunning && isFocus ? 'animate-pulse-subtle' : ''
            }`}
            style={{
              borderColor: `${linkedTask.subjectColor}55`,
              boxShadow: isRunning && isFocus ? `0 0 0 1px ${linkedTask.subjectColor}33, 0 0 16px -4px ${linkedTask.subjectColor}55` : 'none',
            }}
          >
            <span
              className="w-2 h-2 rounded-full shrink-0 relative"
              style={{ backgroundColor: linkedTask.subjectColor }}
            >
              {isRunning && isFocus && (
                <motion.span
                  className="absolute inset-0 rounded-full"
                  style={{ backgroundColor: linkedTask.subjectColor }}
                  animate={{ scale: [1, 2.2, 1], opacity: [0.6, 0, 0.6] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                />
              )}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-[var(--foreground)] truncate leading-tight">
                {linkedTask.subject}
                {linkedTask.topic && (
                  <span className="text-[var(--foreground-muted)] font-normal"> · {linkedTask.topic}</span>
                )}
              </p>
              <p className="text-[10px] text-[var(--foreground-muted)] tabular-nums leading-tight mt-0.5">
                {toPersianDigits(linkedTask.actualTimeMinutes ?? 0)}/{toPersianDigits(linkedTask.targetTimeMinutes ?? 0)} دقیقه
                {isFocus && ' · زمان این جلسه اضافه می‌شه'}
              </p>
            </div>
            <button
              onClick={() => setLinkedTaskId(null)}
              aria-label="قطع ارتباط تسک"
              className="shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-[var(--foreground-muted)] hover:text-[var(--danger)] hover:bg-[rgba(239,68,68,0.08)] transition-colors"
            >
              <Unlink className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowTaskPicker((s) => !s)}
            className={`w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border text-[11px] font-medium transition-colors ${
              showTaskPicker
                ? 'border-[var(--accent)]/50 text-[var(--accent)] bg-[var(--accent-soft)]'
                : 'border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:border-[var(--border-strong)] bg-[var(--bg-elevated)]'
            }`}
          >
            <Link2 className="w-3.5 h-3.5" />
            {todaysTasks.length > 0 ? 'اتصال به تسک امروز' : 'تسکی برای امروز نیست'}
          </button>
        )}

        {/* ===== Task picker dropdown ===== */}
        <AnimatePresence>
          {showTaskPicker && !linkedTask && (
            <motion.div
              initial={{ opacity: 0, y: -6, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -6, height: 0 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="absolute top-full left-0 right-0 z-20 mt-1 overflow-hidden"
            >
              <div className="surface-2 rounded-xl border border-[var(--border-strong)] shadow-2xl max-h-72 overflow-y-auto custom-scrollbar p-1">
                {todaysTasks.length === 0 ? (
                  <p className="text-[11px] text-[var(--foreground-muted)] text-center py-4 px-2">
                    همه تسک‌های امروز تکمیل شدن 🎉
                  </p>
                ) : (
                  todaysTasks.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setLinkedTaskId(t.id);
                        setShowTaskPicker(false);
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-right hover:bg-[rgba(255,255,255,0.04)] transition-colors"
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: t.subjectColor }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold text-[var(--foreground)] truncate">
                          {t.subject}
                          {t.topic && (
                            <span className="text-[var(--foreground-muted)] font-normal"> · {t.topic}</span>
                          )}
                        </p>
                        <p className="text-[10px] text-[var(--foreground-muted)] tabular-nums">
                          {toPersianDigits(t.actualTimeMinutes ?? 0)}/{toPersianDigits(t.targetTimeMinutes ?? 0)} دقیقه
                          {t.targetTestCount ? ` · ${toPersianDigits(t.targetTestCount)} تست` : ''}
                        </p>
                      </div>
                      <Check className="w-3.5 h-3.5 text-[var(--foreground-subtle)] shrink-0 opacity-0 group-hover:opacity-100" />
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ===== Circular Timer ===== */}
      <div
        className="relative mb-7"
        style={{ width: size, height: size }}
      >
        {/* Soft outer glow when running */}
        <AnimatePresence>
          {isRunning && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                boxShadow: `0 0 60px 6px ${modeGlow}`,
              }}
            />
          )}
        </AnimatePresence>

        <svg width={size} height={size} className="-rotate-90">
          {/* Track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth={strokeWidth}
          />
          {/* Progress */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={modeColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{
              transition: 'stroke-dashoffset 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
              filter: `drop-shadow(0 0 6px ${modeGlow})`,
            }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.span
              key={displayTime}
              initial={{ opacity: 0.6, y: 2 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0.6, y: -2 }}
              transition={{ duration: 0.18 }}
              className="text-[3.25rem] leading-none font-bold text-[var(--foreground)] tabular-nums tracking-wider"
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {displayTime}
            </motion.span>
          </AnimatePresence>
          <span className="text-xs text-[var(--foreground-muted)] mt-3 font-medium">
            {currentMode.hint}
          </span>
        </div>
      </div>

      {/* ===== Session Counter + Dots ===== */}
      <div className="flex flex-col items-center gap-2.5 mb-7">
        <span className="text-xs text-[var(--foreground-muted)]">
          جلسه {toPersianDigits(totalCompleted + 1)}
        </span>
        <div className="flex items-center gap-2">
          {Array.from({ length: SESSIONS_BEFORE_LONG_BREAK }).map((_, i) => {
            const filled = i < dotsFilled;
            return (
              <motion.span
                key={i}
                animate={{
                  scale: filled ? 1 : 0.7,
                  opacity: filled ? 1 : 0.3,
                }}
                transition={{ duration: 0.25 }}
                className="w-2.5 h-2.5 rounded-full"
                style={{
                  backgroundColor: filled
                    ? isFocus
                      ? 'var(--accent)'
                      : 'var(--gold)'
                    : 'rgba(255,255,255,0.12)',
                  boxShadow: filled ? `0 0 8px ${modeGlow}` : 'none',
                }}
              />
            );
          })}
        </div>
      </div>

      {/* ===== Controls ===== */}
      <div className="flex items-center gap-5">
        {/* Reset */}
        <button
          onClick={handleReset}
          aria-label="بازنشانی"
          className="icon-btn w-14 h-14 rounded-full surface-1 border border-[var(--border)] flex items-center justify-center text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
        >
          <RotateCcw className="w-5 h-5" />
        </button>

        {/* Start / Pause */}
        <button
          onClick={toggleRunning}
          aria-label={isRunning ? 'توقف' : 'شروع'}
          className="glow-hover btn-hover w-20 h-20 rounded-full flex items-center justify-center text-[var(--bg-deep)]"
          style={{
            backgroundColor: modeColor,
            boxShadow: `0 8px 28px -8px ${modeGlow}`,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = modeHover;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = modeColor;
          }}
        >
          {isRunning ? (
            <Pause className="w-8 h-8" />
          ) : (
            <Play className="w-8 h-8 mr-1" />
          )}
        </button>

        {/* Skip */}
        <button
          onClick={handleSkip}
          aria-label="رد شدن"
          className="icon-btn w-14 h-14 rounded-full surface-1 border border-[var(--border)] flex items-center justify-center text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
        >
          <SkipForward className="w-5 h-5" />
        </button>
      </div>

      {/* ===== Today's focus stats (persisted) ===== */}
      <div className="mt-7 flex items-center gap-4 px-5 py-2.5 rounded-xl surface-1 border border-[var(--border)]">
        <div className="flex flex-col items-center">
          <span className="text-lg font-bold tabular-nums" style={{ color: 'var(--accent)' }}>
            {toPersianDigits(todayStats.focusSessions)}
          </span>
          <span className="text-[10px] text-[var(--foreground-muted)] mt-0.5">جلسه امروز</span>
        </div>
        <span className="w-px h-8 bg-[var(--border)]" />
        <div className="flex flex-col items-center">
          <span className="text-lg font-bold tabular-nums" style={{ color: 'var(--accent)' }}>
            {toPersianDigits(todayStats.focusMinutes)}
          </span>
          <span className="text-[10px] text-[var(--foreground-muted)] mt-0.5">دقیقه تمرکز</span>
        </div>
      </div>

      {/* ===== Helper text ===== */}
      <p className="text-xs text-[var(--foreground-subtle)] mt-5 text-center">
        {isFocus
          ? `${toPersianDigits(Math.round(durations.focus / 60))} دقیقه تمرکز`
          : mode === 'short'
            ? `${toPersianDigits(Math.round(durations.short / 60))} دقیقه استراحت کوتاه`
            : `${toPersianDigits(Math.round(durations.long / 60))} دقیقه استراحت بلند`}
      </p>

      {/* Hint about cycle */}
      <p className="text-[11px] text-[var(--foreground-subtle)] mt-2 text-center">
        بعد از {toPersianDigits(SESSIONS_BEFORE_LONG_BREAK)} جلسه تمرکز، استراحت بلند پیشنهاد می‌شه
      </p>
    </div>
  );
}
