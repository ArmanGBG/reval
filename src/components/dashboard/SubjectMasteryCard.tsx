'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, ChevronLeft, Info } from 'lucide-react';
import type { Task } from '@/lib/types';
import { toPersianDigits, minutesToHoursLabel } from '@/lib/persian-date';

// ====================================================================
// Subject Mastery Card
// -------------------
// Shows per-subject progress on the student dashboard. For each subject
// in the loaded tasks, we compute a 0-100 "mastery" score from:
//   • completion rate (completed / total tasks) — 50% weight
//   • time adherence (actualTime / targetTime) — 30% weight
//   • test adherence (actualTests / targetTests) — 20% weight
//
// Bars are sorted by mastery (highest first) so the student sees their
// strongest subjects at the top. Each bar uses the subject's own color
// for visual identification. The card auto-collapses to 3 subjects on
// mobile and expands to all on desktop.
// ====================================================================

interface SubjectStat {
  subject: string;
  color: string;
  totalTasks: number;
  completedTasks: number;
  skippedTasks: number;
  targetMinutes: number;
  actualMinutes: number;
  targetTests: number;
  actualTests: number;
  mastery: number; // 0-100
}

interface Props {
  tasks: Task[];
  onSelectSubject?: (subject: string) => void;
}

function computeSubjectStat(tasks: Task[], subject: string, color: string): SubjectStat {
  const subjectTasks = tasks.filter((t) => t.subject === subject);
  const totalTasks = subjectTasks.length;
  const completedTasks = subjectTasks.filter((t) => t.status === 'COMPLETED').length;
  const skippedTasks = subjectTasks.filter((t) => t.status === 'SKIPPED').length;
  const targetMinutes = subjectTasks.reduce((s, t) => s + (t.targetTimeMinutes ?? 0), 0);
  const actualMinutes = subjectTasks.reduce((s, t) => s + (t.actualTimeMinutes ?? 0), 0);
  const targetTests = subjectTasks.reduce((s, t) => s + (t.targetTestCount ?? 0), 0);
  const actualTests = subjectTasks.reduce((s, t) => s + (t.actualTestCount ?? 0), 0);

  // Mastery score (0-100):
  //   completion: 50% weight (completed / (total - skipped), since skipped
  //               tasks shouldn't count against the student)
  //   time adherence: 30% weight (actualTime / targetTime, capped at 100%)
  //   test adherence: 20% weight (actualTests / targetTests, capped at 100%)
  const denominator = Math.max(1, totalTasks - skippedTasks);
  const completionRate = (completedTasks / denominator) * 100;
  const timeAdherence = targetMinutes > 0 ? Math.min(100, (actualMinutes / targetMinutes) * 100) : 0;
  const testAdherence = targetTests > 0 ? Math.min(100, (actualTests / targetTests) * 100) : 0;

  const mastery = Math.round(completionRate * 0.5 + timeAdherence * 0.3 + testAdherence * 0.2);

  return {
    subject,
    color,
    totalTasks,
    completedTasks,
    skippedTasks,
    targetMinutes,
    actualMinutes,
    targetTests,
    actualTests,
    mastery: Math.max(0, Math.min(100, mastery)),
  };
}

export default function SubjectMasteryCard({ tasks, onSelectSubject }: Props) {
  const [showFormula, setShowFormula] = useState(false);
  const stats = useMemo<SubjectStat[]>(() => {
    // Group by subject, using first occurrence's color.
    const subjects = new Map<string, string>();
    for (const t of tasks) {
      if (!subjects.has(t.subject)) {
        subjects.set(t.subject, t.subjectColor || 'var(--accent)');
      }
    }
    const result = Array.from(subjects.entries()).map(([subject, color]) =>
      computeSubjectStat(tasks, subject, color)
    );
    // Sort by mastery desc (strongest subjects first).
    result.sort((a, b) => b.mastery - a.mastery);
    return result;
  }, [tasks]);

  // Overall mastery across all subjects (weighted by task count).
  const overall = useMemo(() => {
    const totalTasks = stats.reduce((s, st) => s + st.totalTasks, 0);
    if (totalTasks === 0) return 0;
    const weighted = stats.reduce((s, st) => s + st.mastery * st.totalTasks, 0);
    return Math.round(weighted / totalTasks);
  }, [stats]);

  if (stats.length === 0) return null;

  // Show top 3 subjects on mobile, all on desktop (we cap at 6 to keep the card readable).
  const visible = stats.slice(0, 6);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="relative rounded-[var(--radius-lg)] p-4 md:p-5 overflow-hidden border border-[var(--border)] mb-5"
      style={{
        backgroundColor: 'var(--bg-elevated)',
        boxShadow: 'inset 0 1px 0 var(--surface-glass)',
      }}
    >
      {/* Backdrop accent glow */}
      <div
        className="absolute inset-0 pointer-events-none opacity-60"
        style={{
          background: 'radial-gradient(ellipse 60% 80% at 80% 0%, var(--accent-soft), transparent)',
        }}
      />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-[var(--radius-sm)] bg-[var(--accent-soft)] flex items-center justify-center">
              <Award className="w-4 h-4 text-[var(--accent)]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--foreground)]">تسلط بر دروس</h3>
              <p className="text-[11px] text-[var(--foreground-muted)]">
                میانگین: <span className="text-[var(--accent)] font-bold tabular-nums">{toPersianDigits(overall)}٪</span>
              </p>
            </div>
          </div>
          {/* Info button — toggles the formula popover */}
          <button
            type="button"
            onClick={() => setShowFormula((v) => !v)}
            className="size-9 rounded-md flex items-center justify-center text-[var(--foreground-subtle)] hover:text-[var(--foreground-muted)] hover:bg-[var(--surface-glass)] transition-colors"
            aria-label="نحوه محاسبه تسلط"
            aria-expanded={showFormula}
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Formula popover */}
        <AnimatePresence>
          {showFormula && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden mb-4"
            >
              <div className="text-[11px] text-[var(--foreground-muted)] leading-relaxed bg-[var(--surface-glass)] border border-[var(--border)] rounded-[var(--radius)] p-3 space-y-1">
                <p className="font-bold text-[var(--foreground)] text-xs mb-1">نحوه محاسبه تسلط</p>
                <p>• <span className="text-[var(--accent)]">۵۰٪</span> — نرخ انجام تسک‌ها (تسک‌های انجام‌شده تقسیم بر کل، بدون احتساب رد‌شده‌ها)</p>
                <p>• <span className="text-[var(--accent)]">۳۰٪</span> — پایبندی به زمان مطالعه (واقعی تقسیم بر هدف)</p>
                <p>• <span className="text-[var(--accent)]">۲۰٪</span> — پایبندی به تست‌زنی (واقعی تقسیم بر هدف)</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Subject bars */}
        <div className="space-y-3">
          {visible.map((stat, idx) => (
            <SubjectBar
              key={stat.subject}
              stat={stat}
              index={idx}
              onClick={() => onSelectSubject?.(stat.subject)}
            />
          ))}
        </div>

        {stats.length > visible.length && (
          <p className="text-[11px] text-[var(--foreground-muted)] text-center mt-3">
            + {toPersianDigits(stats.length - visible.length)} درس دیگر
          </p>
        )}
      </div>
    </motion.div>
  );
}

// ===== Single subject progress bar =====
function SubjectBar({
  stat,
  index,
  onClick,
}: {
  stat: SubjectStat;
  index: number;
  onClick?: () => void;
}) {
  const isStrong = stat.mastery >= 75;
  const isWeak = stat.mastery < 40;

  // Bar color depends on mastery level — desaturated status tokens only
  const barColor = isStrong
    ? 'var(--success)'
    : isWeak
    ? 'var(--danger)'
    : 'var(--accent)';

  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06, duration: 0.3 }}
      whileHover={onClick ? { scale: 1.005 } : undefined}
      className={`w-full text-right block ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          {/* Color dot — subject identifier (no glow) */}
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{
              backgroundColor: stat.color,
            }}
          />
          <span className="text-sm font-medium text-[var(--foreground)] truncate">
            {stat.subject}
          </span>
          {isStrong && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--gold-soft)] text-[var(--gold)] font-bold flex items-center gap-0.5 shrink-0">
              <Award className="w-2.5 h-2.5" />
              قوی
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* Time studied */}
          {stat.actualMinutes > 0 && (
            <span className="text-[10px] text-[var(--foreground-muted)] tabular-nums hidden sm:inline">
              {minutesToHoursLabel(stat.actualMinutes)}
            </span>
          )}
          <span
            className="text-xs font-bold tabular-nums"
            style={{ color: isStrong ? 'var(--success)' : isWeak ? 'var(--danger)' : 'var(--foreground)' }}
          >
            {toPersianDigits(stat.mastery)}٪
          </span>
        </div>
      </div>
      {/* Progress bar */}
      <div className="relative h-2 rounded-full bg-[var(--surface-glass-strong)] overflow-hidden">
        <motion.div
          className="h-full rounded-full relative"
          style={{
            backgroundColor: barColor,
          }}
          initial={{ width: 0 }}
          animate={{ width: `${stat.mastery}%` }}
          transition={{ delay: index * 0.06 + 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Shine sweep */}
          <motion.div
            className="absolute inset-0 opacity-30"
            style={{
              background: 'linear-gradient(90deg, transparent, var(--surface-glass-strong), transparent)',
            }}
            initial={{ x: '-100%' }}
            animate={{ x: '200%' }}
            transition={{ delay: index * 0.06 + 0.6, duration: 1.2, ease: 'easeOut' }}
          />
        </motion.div>
      </div>
      {/* Sub-stats */}
      <div className="flex items-center gap-3 mt-1.5 text-[10px] text-[var(--foreground-muted)]">
        <span className="tabular-nums">
          <span className="text-[var(--foreground)] font-medium">{toPersianDigits(stat.completedTasks)}</span>
          /
          {toPersianDigits(stat.totalTasks)}
          {' '}تسک
        </span>
        {stat.targetTests > 0 && (
          <span className="tabular-nums">
            <span className="text-[var(--foreground)] font-medium">{toPersianDigits(stat.actualTests)}</span>
            /
            {toPersianDigits(stat.targetTests)}
            {' '}تست
          </span>
        )}
        {onClick && (
          <span className="hidden sm:flex items-center gap-0.5 text-[var(--foreground-subtle)] mr-auto">
            جزئیات
            <ChevronLeft className="w-2.5 h-2.5 flip-rtl" />
          </span>
        )}
      </div>
    </motion.button>
  );
}
