'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, SkipForward } from 'lucide-react';
import { toast } from 'sonner';
import { toPersianDigits } from '@/lib/persian-date';

// ===== Mode configuration =====
type TimerMode = 'focus' | 'short' | 'long';

const MODES: {
  id: TimerMode;
  label: string;
  hint: string;
  duration: number; // seconds
}[] = [
  { id: 'focus', label: 'تمرکز', hint: 'تمرکز کن', duration: 25 * 60 },
  { id: 'short', label: 'استراحت کوتاه', hint: 'یه نفس بکش', duration: 5 * 60 },
  { id: 'long', label: 'استراحت بلند', hint: 'استراحت کامل', duration: 15 * 60 },
];

const DURATIONS: Record<TimerMode, number> = {
  focus: 25 * 60,
  short: 5 * 60,
  long: 15 * 60,
};

const SESSIONS_BEFORE_LONG_BREAK = 4;

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
  const [mode, setMode] = useState<TimerMode>('focus');
  const [timeLeft, setTimeLeft] = useState<number>(DURATIONS.focus);
  const [isRunning, setIsRunning] = useState(false);

  // Sessions completed in the current 4-session cycle (0..4)
  const [completedInCycle, setCompletedInCycle] = useState(0);
  // Cumulative focus sessions completed (for "جلسه N" display)
  const [totalCompleted, setTotalCompleted] = useState(0);

  const completionHandledRef = useRef(false);

  // Mode-driven styling
  const isFocus = mode === 'focus';
  const modeColor = isFocus ? 'var(--accent)' : 'var(--gold)';
  const modeGlow = isFocus ? 'var(--accent-glow)' : 'var(--gold-glow)';
  const modeSoft = isFocus ? 'var(--accent-soft)' : 'var(--gold-soft)';
  const modeHover = isFocus ? 'var(--accent-hover)' : '#F5C56B';

  const currentMode = useMemo(() => MODES.find((m) => m.id === mode)!, [mode]);
  const totalDuration = DURATIONS[mode];

  // ----- Completion handler -----
  const handleComplete = useCallback(() => {
    playBeep();

    if (mode === 'focus') {
      const nextCompleted = completedInCycle + 1;
      setTotalCompleted((n) => n + 1);

      if (nextCompleted >= SESSIONS_BEFORE_LONG_BREAK) {
        setCompletedInCycle(SESSIONS_BEFORE_LONG_BREAK);
        setMode('long');
        setTimeLeft(DURATIONS.long);
        toast.success(
          `آفرین! ${toPersianDigits(SESSIONS_BEFORE_LONG_BREAK)} جلسه تمرکز کامل شد — حالا یه استراحت بلند داشته باش`,
          { duration: 4000 }
        );
      } else {
        setCompletedInCycle(nextCompleted);
        setMode('short');
        setTimeLeft(DURATIONS.short);
        toast('تمرکز عالی بود! یه استراحت کوتاه داشته باش', { duration: 3500 });
      }
    } else {
      // A break just ended → go back to focus; reset cycle if long break done
      if (completedInCycle >= SESSIONS_BEFORE_LONG_BREAK) {
        setCompletedInCycle(0);
      }
      setMode('focus');
      setTimeLeft(DURATIONS.focus);
      toast('استراحت تموم شد — آماده‌ای برای تمرکز؟', { duration: 3500 });
    }

    setIsRunning(false);
  }, [mode, completedInCycle]);

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

  const handleReset = useCallback(() => {
    setTimeLeft(DURATIONS[mode]);
    setIsRunning(false);
    completionHandledRef.current = false;
  }, [mode]);

  const switchMode = useCallback((newMode: TimerMode) => {
    if (newMode === mode) return;
    // Starting fresh focus after a completed long break → reset cycle
    if (newMode === 'focus' && completedInCycle >= SESSIONS_BEFORE_LONG_BREAK) {
      setCompletedInCycle(0);
    }
    setMode(newMode);
    setTimeLeft(DURATIONS[newMode]);
    setIsRunning(false);
    completionHandledRef.current = false;
  }, [mode, completedInCycle]);

  const handleSkip = useCallback(() => {
    completionHandledRef.current = false;
    if (mode === 'focus') {
      // Abandon current focus → take a break
      const nextBreak: TimerMode =
        completedInCycle >= SESSIONS_BEFORE_LONG_BREAK ? 'long' : 'short';
      if (nextBreak === 'long') setCompletedInCycle(SESSIONS_BEFORE_LONG_BREAK);
      setMode(nextBreak);
      setTimeLeft(DURATIONS[nextBreak]);
    } else {
      // Break done early → go to focus; reset cycle if long break
      if (completedInCycle >= SESSIONS_BEFORE_LONG_BREAK) {
        setCompletedInCycle(0);
      }
      setMode('focus');
      setTimeLeft(DURATIONS.focus);
    }
    setIsRunning(false);
  }, [mode, completedInCycle]);

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
    <div dir="rtl" className="flex flex-col items-center py-2 select-none">
      {/* ===== Mode Tabs ===== */}
      <div className="inline-flex items-center gap-1 p-1 surface-1 rounded-full border border-[var(--border)] mb-7">
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

      {/* ===== Helper text ===== */}
      <p className="text-xs text-[var(--foreground-subtle)] mt-6 text-center">
        {isFocus
          ? `${toPersianDigits(25)} دقیقه تمرکز`
          : mode === 'short'
            ? `${toPersianDigits(5)} دقیقه استراحت کوتاه`
            : `${toPersianDigits(15)} دقیقه استراحت بلند`}
      </p>

      {/* Hint about cycle */}
      <p className="text-[11px] text-[var(--foreground-subtle)] mt-2 text-center">
        بعد از {toPersianDigits(SESSIONS_BEFORE_LONG_BREAK)} جلسه تمرکز، استراحت بلند پیشنهاد می‌شه
      </p>
    </div>
  );
}
