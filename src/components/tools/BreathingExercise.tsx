'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Square, RotateCcw, ThumbsUp, ThumbsDown } from 'lucide-react';
import { toPersianDigits } from '@/lib/persian-date';

// ===== Technique Definitions =====
type Phase = 'inhale' | 'hold' | 'exhale';

type PhaseConfig = {
  text: string;       // Phase text shown inside circle
  subtext: string;    // Hint text
  duration: number;   // seconds
  scale: number;      // circle scale factor (relative to base)
};

type Technique = {
  id: '478' | 'box' | 'deep';
  name: string;
  emoji: string;
  description: string;
  phases: Phase[];
  config: Record<Phase, PhaseConfig>;
};

const TECHNIQUES: Technique[] = [
  {
    id: '478',
    name: 'تنفس ۴-۷-۸',
    emoji: '🌙',
    description: 'آرامش عمیق و خواب بهتر',
    phases: ['inhale', 'hold', 'exhale'],
    config: {
      inhale: { text: 'دم', subtext: 'بکش...', duration: 4, scale: 1 },
      hold:   { text: 'حبس', subtext: 'نگه دار...', duration: 7, scale: 1 },
      exhale: { text: 'بازدم', subtext: 'رها کن...', duration: 8, scale: 0.45 },
    },
  },
  {
    id: 'box',
    name: 'تنفس جعبه‌ای',
    emoji: '🟦',
    description: 'تمرکز و آرامش ذهن',
    phases: ['inhale', 'hold', 'exhale', 'hold'],
    config: {
      inhale: { text: 'دم', subtext: 'بکش...', duration: 4, scale: 1 },
      hold:   { text: 'حبس', subtext: 'نگه دار...', duration: 4, scale: 1 },
      exhale: { text: 'بازدم', subtext: 'رها کن...', duration: 4, scale: 0.45 },
    },
  },
  {
    id: 'deep',
    name: 'تنفس عمیق',
    emoji: '🌿',
    description: 'ساده و موثر برای آرامش',
    phases: ['inhale', 'exhale'],
    config: {
      inhale: { text: 'دم', subtext: 'بکش...', duration: 5, scale: 1 },
      hold:   { text: 'حبس', subtext: '...', duration: 1, scale: 1 },
      exhale: { text: 'بازدم', subtext: 'رها کن...', duration: 5, scale: 0.45 },
    },
  },
];

const MAX_CYCLES = 10;
const BASE_CIRCLE_SIZE = 120; // px, default contracted state
const MAX_CIRCLE_SIZE = 280;  // px, fully expanded inhale state

// ===== Main Component =====
export default function BreathingExercise() {
  const [techniqueId, setTechniqueId] = useState<Technique['id']>('478');
  const [isRunning, setIsRunning] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [cycleCount, setCycleCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const phaseIndexRef = useRef(0);

  const technique = TECHNIQUES.find((t) => t.id === techniqueId)!;

  const currentPhase = technique.phases[phaseIndex] ?? 'inhale';
  const phaseConfig = technique.config[currentPhase];

  // ===== Timer logic =====
  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Initialize countdown when phase changes
    setCountdown(phaseConfig.duration);

    intervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Advance to next phase
          const nextIndex = (phaseIndexRef.current + 1) % technique.phases.length;
          phaseIndexRef.current = nextIndex;

          // Check if we completed a full breath cycle
          if (nextIndex === 0) {
            setCycleCount((c) => {
              const newCount = c + 1;
              if (newCount >= MAX_CYCLES) {
                setIsComplete(true);
                setIsRunning(false);
              }
              return newCount;
            });
          }

          setPhaseIndex(nextIndex);
          const nextPhase = technique.phases[nextIndex];
          return technique.config[nextPhase].duration;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, phaseIndex, technique]);

  // Reset phase index ref when phaseIndex state changes
  useEffect(() => {
    phaseIndexRef.current = phaseIndex;
  }, [phaseIndex]);

  // Reset everything when technique changes
  const handleTechniqueChange = useCallback((id: Technique['id']) => {
    setTechniqueId(id);
    setIsRunning(false);
    setPhaseIndex(0);
    phaseIndexRef.current = 0;
    setCycleCount(0);
    setCountdown(0);
    setIsComplete(false);
  }, []);

  const handleStartPause = useCallback(() => {
    if (isComplete) return;
    setIsRunning((prev) => !prev);
  }, [isComplete]);

  const handleEnd = useCallback(() => {
    setIsRunning(false);
    if (cycleCount > 0) {
      setIsComplete(true);
    }
  }, [cycleCount]);

  const handleRestart = useCallback(() => {
    setIsRunning(false);
    setPhaseIndex(0);
    phaseIndexRef.current = 0;
    setCycleCount(0);
    setCountdown(0);
    setIsComplete(false);
  }, []);

  // ===== Derived display values =====
  const targetScale =
    isRunning && !isComplete
      ? phaseConfig.scale
      : 0.45; // contracted default (120px out of 280px container)

  const circleSize = BASE_CIRCLE_SIZE + (MAX_CIRCLE_SIZE - BASE_CIRCLE_SIZE) * targetScale;
  const animationDuration = phaseConfig.duration;

  const phaseColor =
    currentPhase === 'inhale'
      ? 'var(--accent)'
      : currentPhase === 'hold'
      ? '#F5B544'
      : 'var(--accent-hover)';

  // ===== Completion Screen =====
  if (isComplete) {
    return (
      <CompletionScreen
        cycleCount={cycleCount}
        techniqueName={technique.name}
        onRestart={handleRestart}
      />
    );
  }

  return (
    <div
      dir="rtl"
      className="relative flex flex-col items-center py-2 overflow-hidden rounded-[var(--radius)]"
      style={{
        background:
          'radial-gradient(circle at 50% 35%, var(--accent-soft) 0%, transparent 60%), var(--bg-elevated)',
      }}
    >
      {/* ===== Technique Selector ===== */}
      <div className="flex flex-wrap justify-center gap-2 mb-6 w-full">
        {TECHNIQUES.map((tech) => {
          const isActive = tech.id === techniqueId;
          return (
            <button
              key={tech.id}
              onClick={() => handleTechniqueChange(tech.id)}
              disabled={isRunning}
              className={`px-3.5 py-2 rounded-full text-xs font-medium transition-all min-h-[40px] flex items-center gap-1.5 border ${
                isActive
                  ? 'bg-[var(--accent)] text-[var(--bg-deep)] border-transparent shadow-[0_0_0_3px_var(--accent-glow)]'
                  : 'bg-[rgba(255,255,255,0.03)] text-[var(--foreground-muted)] border-[var(--border)] hover:bg-[rgba(255,255,255,0.06)] hover:text-[var(--foreground)]'
              } ${isRunning && !isActive ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              <span className="text-sm">{tech.emoji}</span>
              <span>{tech.name}</span>
            </button>
          );
        })}
      </div>

      {/* ===== Technique description ===== */}
      <p className="text-xs text-[var(--foreground-muted)] mb-2 text-center">
        🧘 {technique.description}
      </p>

      {/* ===== Cycle counter ===== */}
      <div className="text-xs text-[var(--foreground-muted)] mb-4">
        <AnimatePresence mode="wait">
          <motion.span
            key={cycleCount}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="inline-flex items-center gap-1.5"
          >
            <span className="text-[var(--accent)]">🌿</span>
            دور {toPersianDigits(Math.max(cycleCount + 1, 1))} از{' '}
            {toPersianDigits(MAX_CYCLES)}
          </motion.span>
        </AnimatePresence>
      </div>

      {/* ===== Breathing Circle ===== */}
      <div
        className="relative flex items-center justify-center mb-6"
        style={{ width: `${MAX_CIRCLE_SIZE}px`, height: `${MAX_CIRCLE_SIZE}px` }}
      >
        {/* Outer pulsing ring */}
        <motion.div
          animate={{
            scale: isRunning ? [1, 1.08, 1] : 1,
            opacity: isRunning ? [0.2, 0.4, 0.2] : 0.1,
          }}
          transition={{
            duration: 4,
            repeat: isRunning ? Infinity : 0,
            ease: 'easeInOut',
          }}
          className="absolute rounded-full"
          style={{
            width: `${MAX_CIRCLE_SIZE}px`,
            height: `${MAX_CIRCLE_SIZE}px`,
            border: '1px solid var(--accent)',
            filter: 'blur(1px)',
          }}
        />

        {/* Outer glow */}
        <motion.div
          animate={{
            scale: targetScale,
            opacity: isRunning ? 0.35 : 0.08,
          }}
          transition={{
            duration: animationDuration,
            ease: 'easeInOut',
          }}
          className="absolute rounded-full blur-2xl"
          style={{
            width: `${MAX_CIRCLE_SIZE}px`,
            height: `${MAX_CIRCLE_SIZE}px`,
            backgroundColor: 'var(--accent-glow)',
          }}
        />

        {/* Main breathing circle */}
        <motion.div
          animate={{
            width: `${circleSize}px`,
            height: `${circleSize}px`,
          }}
          transition={{
            duration: animationDuration,
            ease: 'easeInOut',
          }}
          className="rounded-full flex items-center justify-center relative"
          style={{
            background:
              'radial-gradient(circle at 50% 50%, var(--accent-soft) 0%, rgba(62,180,137,0.04) 70%, transparent 100%)',
            border: '1.5px solid var(--accent)',
            boxShadow: isRunning
              ? '0 0 40px var(--accent-glow), inset 0 0 30px var(--accent-soft)'
              : '0 0 20px var(--accent-soft), inset 0 0 20px var(--accent-soft)',
          }}
        >
          {/* Inner content */}
          <div className="flex flex-col items-center justify-center text-center px-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={isRunning ? currentPhase : 'idle'}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
              >
                <span
                  className="font-bold text-lg md:text-xl block mb-0.5"
                  style={{ color: isRunning ? phaseColor : 'var(--foreground-muted)' }}
                >
                  {isRunning ? phaseConfig.text : 'آماده‌ای؟'}
                </span>
                {isRunning && (
                  <span
                    className="text-xs block"
                    style={{ color: 'var(--foreground-muted)' }}
                  >
                    {phaseConfig.subtext}
                  </span>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* ===== Countdown display ===== */}
      <div className="h-7 mb-4 flex items-center justify-center">
        <AnimatePresence mode="wait">
          {isRunning && (
            <motion.div
              key={`${currentPhase}-${countdown}`}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="text-2xl font-light tabular-nums"
              style={{ color: phaseColor }}
            >
              {toPersianDigits(countdown)}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ===== Phase indicator dots ===== */}
      <div className="flex gap-3 mb-6">
        {technique.phases.map((p, idx) => {
          const isActive = isRunning && idx === phaseIndex;
          const pColor =
            p === 'inhale'
              ? 'var(--accent)'
              : p === 'hold'
              ? '#F5B544'
              : 'var(--accent-hover)';
          return (
            <div key={`${p}-${idx}`} className="flex flex-col items-center gap-1">
              <motion.div
                animate={{
                  scale: isActive ? 1.4 : 1,
                  opacity: isActive ? 1 : 0.3,
                }}
                transition={{ duration: 0.3 }}
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: pColor }}
              />
              <span
                className={`text-[10px] transition-colors ${
                  isActive ? 'text-[var(--foreground)]' : 'text-[var(--foreground-subtle)]'
                }`}
              >
                {technique.config[p].text}
              </span>
            </div>
          );
        })}
      </div>

      {/* ===== Controls ===== */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleStartPause}
          className={`btn-hover glow-hover w-16 h-16 rounded-full flex items-center justify-center transition-all min-h-[44px] ${
            isRunning
              ? 'bg-[rgba(245,181,68,0.12)] text-[#F5B544] border border-[rgba(245,181,68,0.3)] hover:bg-[rgba(245,181,68,0.2)]'
              : 'bg-[var(--accent)] text-[var(--bg-deep)] hover:bg-[var(--accent-hover)] shadow-[0_0_20px_var(--accent-glow)]'
          }`}
          aria-label={isRunning ? 'توقف' : 'شروع'}
        >
          {isRunning ? (
            <Pause className="w-6 h-6" fill="currentColor" />
          ) : (
            <Play className="w-6 h-6 mr-0.5" fill="currentColor" />
          )}
        </button>

        {(isRunning || cycleCount > 0) && (
          <button
            onClick={handleEnd}
            className="btn-hover w-12 h-12 rounded-full flex items-center justify-center bg-[rgba(239,68,68,0.1)] text-[#F87171] border border-[rgba(239,68,68,0.25)] hover:bg-[rgba(239,68,68,0.18)] transition-all min-h-[44px]"
            aria-label="پایان"
          >
            <Square className="w-4 h-4" fill="currentColor" />
          </button>
        )}

        {cycleCount > 0 && !isRunning && (
          <button
            onClick={handleRestart}
            className="btn-hover w-12 h-12 rounded-full flex items-center justify-center surface-1 border border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-all min-h-[44px]"
            aria-label="شروع مجدد"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ===== Helper text ===== */}
      <p className="text-[11px] text-[var(--foreground-subtle)] mt-5 text-center max-w-xs">
        💚 روی دایره تمرکز کن و همراه با حرکت اون نفس بکش
      </p>
    </div>
  );
}

// ===== Completion Screen =====
function CompletionScreen({
  cycleCount,
  techniqueName,
  onRestart,
}: {
  cycleCount: number;
  techniqueName: string;
  onRestart: () => void;
}) {
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);

  return (
    <motion.div
      dir="rtl"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="flex flex-col items-center py-8 px-4 rounded-[var(--radius)] text-center"
      style={{
        background:
          'radial-gradient(circle at 50% 30%, var(--accent-soft) 0%, transparent 70%), var(--bg-elevated)',
      }}
    >
      {/* Calming emoji */}
      <motion.div
        initial={{ scale: 0, rotate: -30 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 12 }}
        className="text-5xl mb-4"
      >
        🧘
      </motion.div>

      {/* Congrats message */}
      <motion.h3
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-lg font-bold text-[var(--foreground)] mb-1"
      >
        آفرین! {toPersianDigits(cycleCount)} دور تنفس کامل شد 🌿
      </motion.h3>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-xs text-[var(--foreground-muted)] mb-6"
      >
        {techniqueName} • امیدوارم الان آروم‌تر باشی 💚
      </motion.p>

      {/* Feedback question */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mb-6"
      >
        <p className="text-sm text-[var(--foreground)] mb-3">احساس بهتری داشتی؟</p>
        <div className="flex gap-3">
          <button
            onClick={() => setFeedback('up')}
            className={`w-14 h-14 rounded-full flex items-center justify-center border transition-all min-h-[44px] ${
              feedback === 'up'
                ? 'bg-[var(--accent)] text-[var(--bg-deep)] border-transparent shadow-[0_0_20px_var(--accent-glow)] scale-110'
                : 'surface-1 border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--accent)] hover:border-[var(--accent)]'
            }`}
            aria-label="بله، بهترم"
          >
            <ThumbsUp className="w-5 h-5" />
          </button>
          <button
            onClick={() => setFeedback('down')}
            className={`w-14 h-14 rounded-full flex items-center justify-center border transition-all min-h-[44px] ${
              feedback === 'down'
                ? 'bg-[rgba(239,68,68,0.2)] text-[#F87171] border-transparent scale-110'
                : 'surface-1 border-[var(--border)] text-[var(--foreground-muted)] hover:text-[#F87171] hover:border-[rgba(239,68,68,0.4)]'
            }`}
            aria-label="نه، تفاوتی نکرد"
          >
            <ThumbsDown className="w-5 h-5" />
          </button>
        </div>
        {feedback && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-[var(--foreground-muted)] mt-3"
          >
            {feedback === 'up' ? 'خوشحالم که بهتر شد 🌿' : 'اشکالی نداره، دوباره تلاش کن 💚'}
          </motion.p>
        )}
      </motion.div>

      {/* Restart button */}
      <motion.button
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        onClick={onRestart}
        className="btn-hover glow-hover px-6 py-3 rounded-full bg-[var(--accent)] text-[var(--bg-deep)] font-medium text-sm hover:bg-[var(--accent-hover)] transition-all min-h-[44px] flex items-center gap-2"
      >
        <RotateCcw className="w-4 h-4" />
        شروع مجدد
      </motion.button>
    </motion.div>
  );
}
