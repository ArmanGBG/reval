'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, Calculator as CalculatorIcon } from 'lucide-react';
import { toPersianDigits } from '@/lib/persian-date';

// ===== Types =====
type TrackId = 'tajrobi' | 'riazi';

interface SubjectDef {
  id: string;
  name: string;
  emoji: string;
  color: string;
  coefficient: number;
}

interface TrackDef {
  id: TrackId;
  name: string;
  subjects: SubjectDef[];
}

// ===== Konkur track subject definitions =====
// تجربی (Experimental Sciences) and ریاضی (Mathematics) tracks.
// Each subject has a coefficient used in the weighted-average calculation.
const TRACKS: TrackDef[] = [
  {
    id: 'tajrobi',
    name: 'تجربی',
    subjects: [
      { id: 'bio', name: 'زیست‌شناسی', emoji: '🧬', color: '#8B5CF6', coefficient: 2 },
      { id: 'chem', name: 'شیمی', emoji: '⚗️', color: '#EF4444', coefficient: 2 },
      { id: 'phys', name: 'فیزیک', emoji: '🔋', color: '#F59E0B', coefficient: 2 },
      { id: 'math', name: 'ریاضی', emoji: '📐', color: '#3EB489', coefficient: 3 },
      { id: 'geo', name: 'زمین‌شناسی', emoji: '🪨', color: '#06B6D4', coefficient: 1 },
    ],
  },
  {
    id: 'riazi',
    name: 'ریاضی',
    subjects: [
      { id: 'math', name: 'ریاضی', emoji: '📐', color: '#3EB489', coefficient: 3 },
      { id: 'phys', name: 'فیزیک', emoji: '🔋', color: '#F59E0B', coefficient: 2 },
      { id: 'chem', name: 'شیمی', emoji: '⚗️', color: '#EF4444', coefficient: 2 },
      { id: 'lit', name: 'ادبیات فارسی', emoji: '📚', color: '#EC4899', coefficient: 2 },
      { id: 'religion', name: 'دین و زندگی', emoji: '🕌', color: '#F97316', coefficient: 1 },
    ],
  },
];

// ===== Persian digit helpers =====
const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

// Convert any English/Persian/Arabic digit string into a numeric value.
// Accepts Persian (۰-۹) and Arabic-Indic (٠-٩) digits as well as standard 0-9.
function parseDigits(input: string): number {
  if (!input) return 0;
  const normalized = input
    .replace(/[۰-۹]/g, (d) => String(PERSIAN_DIGITS.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
  const num = parseInt(normalized, 10);
  return Number.isFinite(num) ? num : 0;
}

// Clamp a score to the 0-100 range.
function clampScore(n: number): number {
  if (n < 0) return 0;
  if (n > 100) return 100;
  return n;
}

// Format a number to a Persian percentage string with one decimal place.
function formatPercent(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  const [intPart, decPart] = rounded.toFixed(1).split('.');
  const persianInt = toPersianDigits(intPart);
  // Show "۷۵٪" when whole, "۷۵.۵٪" otherwise.
  return decPart === '0' ? `${persianInt}٪` : `${persianInt}.${toPersianDigits(decPart)}٪`;
}

// Pick a color based on score band: red < 50, amber 50-70, accent > 70
function scoreBarColor(score: number): string {
  if (score >= 70) return 'var(--accent)';
  if (score >= 50) return '#F59E0B';
  return '#EF4444';
}

// Rank message based on total percentage.
function rankMessage(percent: number): { text: string; color: string } {
  if (percent >= 80) return { text: 'تراز عالی! 🎉', color: 'var(--accent)' };
  if (percent >= 60) return { text: 'تراز خوب 👍', color: '#3EB489' };
  if (percent >= 40) return { text: 'تراز متوسط 📊', color: '#F59E0B' };
  return { text: 'نیاز به تلاش بیشتر 💪', color: '#EF4444' };
}

// ===== Animated Persian number (spring) =====
// Renders a number that springs to its new value via framer-motion.
function AnimatedPercent({ value }: { value: number }) {
  const display = formatPercent(value);
  return (
    <motion.div
      key={Math.round(value * 10)}
      initial={{ scale: 0.85, opacity: 0.4 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 18, mass: 0.8 }}
      className="tabular-nums"
    >
      {display}
    </motion.div>
  );
}

// ===== Subject row =====
interface SubjectRowProps {
  subject: SubjectDef;
  rawValue: string;
  onChange: (value: string) => void;
}

function SubjectRow({ subject, rawValue, onChange }: SubjectRowProps) {
  const score = clampScore(parseDigits(rawValue));
  const hasValue = rawValue.trim() !== '' && score > 0;
  const barColor = scoreBarColor(score);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="surface-1 rounded-[var(--radius)] border border-[var(--border)] p-3.5"
    >
      {/* Top row: subject info (right) + input (left) */}
      <div className="flex items-center justify-between gap-3" dir="rtl">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-9 h-9 rounded-[var(--radius-sm)] flex items-center justify-center flex-shrink-0"
            style={{
              background: `linear-gradient(135deg, ${subject.color}30, ${subject.color}10)`,
            }}
          >
            <span className="text-base leading-none">{subject.emoji}</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[var(--foreground)] truncate">
              {subject.name}
            </p>
            <span
              className="inline-block mt-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full"
              style={{
                background: `${subject.color}20`,
                color: subject.color,
              }}
            >
              ضریب {toPersianDigits(subject.coefficient)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <input
            type="text"
            inputMode="numeric"
            dir="ltr"
            value={rawValue}
            onChange={(e) => {
              // Allow only digit-like characters (Persian/Arabic/English) and empty.
              const cleaned = e.target.value.replace(/[^\d۰-۹٠-٩]/g, '');
              onChange(cleaned);
            }}
            placeholder="۰"
            className="w-16 text-center bg-[rgba(255,255,255,0.04)] border border-[var(--border)] rounded-[var(--radius-sm)] px-2 py-2 text-[var(--foreground)] text-base font-semibold tabular-nums placeholder:text-[var(--foreground-subtle)] focus:outline-none focus:border-[var(--accent)] transition-colors"
            aria-label={`نمره ${subject.name}`}
          />
          <span className="text-xs text-[var(--foreground-muted)]">از ۱۰۰</span>
        </div>
      </div>

      {/* Score bar */}
      <div className="mt-3 h-1.5 w-full rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden">
        <motion.div
          initial={false}
          animate={{ width: `${hasValue ? score : 0}%` }}
          transition={{ type: 'spring', stiffness: 200, damping: 24 }}
          className="h-full rounded-full"
          style={{ background: barColor, boxShadow: hasValue ? `0 0 8px ${barColor}66` : 'none' }}
        />
      </div>

      {/* Score readout */}
      <AnimatePresence>
        {hasValue && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2 flex items-center justify-between text-[11px] text-[var(--foreground-muted)]"
          >
            <span>درصد خام</span>
            <span className="tabular-nums font-medium" style={{ color: barColor }}>
              {toPersianDigits(score)}٪
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ===== Main GradeCalculator component =====
export default function GradeCalculator() {
  const [trackId, setTrackId] = useState<TrackId>('tajrobi');
  // Per-subject raw input strings, keyed by subject id. Stored as a record so
  // switching tracks preserves previously entered values for shared subjects.
  const [scores, setScores] = useState<Record<string, string>>({});

  const track = useMemo(
    () => TRACKS.find((t) => t.id === trackId) ?? TRACKS[0],
    [trackId]
  );

  // Compute the weighted average across all subjects in the current track.
  // Only subjects with a non-empty, valid score (> 0) contribute to numerator;
  // however, all subjects in the track contribute to the denominator so an
  // un-entered subject counts as zero — matching real Konkur behaviour.
  const { totalPercent, filledCount, totalCoeff } = useMemo(() => {
    let numerator = 0;
    let denominator = 0;
    let filled = 0;
    for (const subject of track.subjects) {
      denominator += subject.coefficient;
      const raw = scores[subject.id] ?? '';
      const value = clampScore(parseDigits(raw));
      if (raw.trim() !== '' && value > 0) filled++;
      numerator += value * subject.coefficient;
    }
    return {
      totalPercent: denominator > 0 ? numerator / denominator : 0,
      filledCount: filled,
      totalCoeff: denominator,
    };
  }, [track, scores]);

  const hasAnyInput = filledCount > 0;
  const rank = rankMessage(totalPercent);

  const handleScoreChange = useCallback((subjectId: string, value: string) => {
    setScores((prev) => ({ ...prev, [subjectId]: value }));
  }, []);

  const handleReset = useCallback(() => {
    setScores({});
  }, []);

  const handleTrackChange = useCallback((id: TrackId) => {
    setTrackId(id);
  }, []);

  const totalBarColor = scoreBarColor(totalPercent);

  return (
    <div className="space-y-4" dir="rtl">
      {/* Track selector tabs */}
      <div className="flex items-center gap-1 p-1 rounded-[var(--radius)] surface-1 border border-[var(--border)]">
        {TRACKS.map((t) => {
          const isActive = t.id === trackId;
          return (
            <button
              key={t.id}
              onClick={() => handleTrackChange(t.id)}
              className={`relative flex-1 py-2 px-3 text-sm font-semibold rounded-[var(--radius-sm)] transition-colors ${
                isActive
                  ? 'text-[var(--foreground)]'
                  : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
              }`}
              aria-pressed={isActive}
            >
              {isActive && (
                <motion.div
                  layoutId="grade-calc-tab"
                  className="absolute inset-0 rounded-[var(--radius-sm)]"
                  style={{
                    background:
                      'linear-gradient(135deg, var(--accent-soft), var(--accent-glow))',
                    boxShadow: '0 0 0 1px var(--accent-glow) inset',
                  }}
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}
              <span className="relative z-10">رشته {t.name}</span>
            </button>
          );
        })}
      </div>

      {/* Subjects list */}
      <div className="space-y-2.5">
        {track.subjects.map((subject) => (
          <SubjectRow
            key={`${trackId}-${subject.id}`}
            subject={subject}
            rawValue={scores[subject.id] ?? ''}
            onChange={(value) => handleScoreChange(subject.id, value)}
          />
        ))}
      </div>

      {/* Total / Result card */}
      <motion.div
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative surface-2 edge-highlight rounded-[var(--radius-lg)] p-5 overflow-hidden"
        style={{
          background:
            'linear-gradient(135deg, var(--bg-elevated), var(--bg-overlay))',
          boxShadow: `0 0 30px -8px var(--accent-glow)`,
        }}
      >
        {/* Decorative accent glow */}
        <div
          className="absolute -top-10 -left-10 w-32 h-32 rounded-full opacity-20 pointer-events-none"
          style={{ background: 'radial-gradient(circle, var(--accent), transparent 70%)' }}
        />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase tracking-wider font-semibold text-[var(--foreground-muted)]">
              درصد کل کنکور
            </span>
            <span className="text-[10px] text-[var(--foreground-subtle)]">
              مجموع ضریب: {toPersianDigits(totalCoeff)}
            </span>
          </div>

          {/* Big percentage */}
          <div className="flex items-baseline gap-2 mb-3">
            <AnimatePresence mode="popLayout">
              <motion.span
                key={Math.round(totalPercent)}
                className="text-5xl font-bold tabular-nums"
                style={{ color: hasAnyInput ? totalBarColor : 'var(--foreground-muted)' }}
              >
                {hasAnyInput ? (
                  <AnimatedPercent value={totalPercent} />
                ) : (
                  <span className="text-[var(--foreground-subtle)]">—</span>
                )}
              </motion.span>
            </AnimatePresence>
            {hasAnyInput && (
              <span className="text-sm text-[var(--foreground-muted)]">
                از ۱۰۰
              </span>
            )}
          </div>

          {/* Total progress bar */}
          <div className="h-2 w-full rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden">
            <motion.div
              initial={false}
              animate={{ width: `${hasAnyInput ? totalPercent : 0}%` }}
              transition={{ type: 'spring', stiffness: 180, damping: 26 }}
              className="h-full rounded-full"
              style={{
                background: hasAnyInput ? totalBarColor : 'transparent',
                boxShadow: hasAnyInput ? `0 0 10px ${totalBarColor}88` : 'none',
              }}
            />
          </div>

          {/* Rank message */}
          <AnimatePresence mode="wait">
            {hasAnyInput ? (
              <motion.div
                key={rank.text}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
                className="mt-3 flex items-center justify-between"
              >
                <span className="text-xs text-[var(--foreground-muted)]">تراز تخمینی</span>
                <span className="text-sm font-bold" style={{ color: rank.color }}>
                  {rank.text}
                </span>
              </motion.div>
            ) : (
              <motion.p
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mt-3 text-xs text-[var(--foreground-subtle)] text-center"
              >
                نمره‌های درس‌ها رو وارد کن تا درصد کل و تراز محاسبه بشه
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Reset button */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[11px] text-[var(--foreground-subtle)]">
          <CalculatorIcon className="w-3.5 h-3.5" />
          <span>محاسبه بر اساس ضرایب رسمی کنکور</span>
        </div>
        <button
          onClick={handleReset}
          disabled={!hasAnyInput}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-[var(--radius-sm)] surface-1 border border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:border-[var(--accent)]/40 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          ریست
        </button>
      </div>
    </div>
  );
}
