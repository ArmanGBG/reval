'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import type { Exam } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Trophy, Award, Medal, Save, TrendingUp } from 'lucide-react';
import { toPersianDigits } from './advisor-helpers';
import { formatPersianDateFromISO } from '@/lib/persian-date';

// =================================================================
// ExamResultsModal
// Lets an advisor/institute-manager record scores and ranks for all
// students who participated in an exam.
//
// Features:
//  - Pre-fills existing results (if any)
//  - Live computed average + rank assignment
//  - "Auto-rank by score" button
//  - Color-coded score input (red < 50%, amber 50-70%, accent > 70%)
//  - Persists via /api/exams/[id]/results PUT
//  - Auto-marks the exam as 'completed' on save
// =================================================================

interface ExamResultsModalProps {
  exam: Exam | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ResultInput {
  studentId: string;
  score: string; // string for input; parsed on save
  rank: number | null;
}

export function ExamResultsModal({
  exam,
  open,
  onOpenChange,
}: ExamResultsModalProps) {
  const { advisorStudents, saveExamResults } = useAppStore();
  const students = advisorStudents;
  const [results, setResults] = useState<ResultInput[]>([]);
  const [saving, setSaving] = useState(false);

  // Reset / pre-fill results whenever the exam changes
  useEffect(() => {
    if (!exam) {
      setResults([]);
      return;
    }
    const next: ResultInput[] = exam.studentIds.map((sid) => {
      const existing = exam.results.find((r) => r.studentId === sid);
      return {
        studentId: sid,
        score: existing?.score != null ? String(existing.score) : '',
        rank: existing?.rank ?? null,
      };
    });
    setResults(next);
  }, [exam]);

  const participantStudents = useMemo(() => {
    if (!exam) return [];
    return exam.studentIds
      .map((sid) => students.find((s) => s.id === sid))
      .filter((s): s is NonNullable<typeof s> => Boolean(s));
  }, [exam, students]);

  const updateScore = (studentId: string, value: string) => {
    setResults((prev) =>
      prev.map((r) =>
        r.studentId === studentId
          ? { ...r, score: value.replace(/[^\d.]/g, '') }
          : r,
      ),
    );
  };

  const updateRank = (studentId: string, value: string) => {
    const num = parseInt(value.replace(/[^\d]/g, ''), 10);
    setResults((prev) =>
      prev.map((r) =>
        r.studentId === studentId
          ? { ...r, rank: isNaN(num) || num < 1 ? null : num }
          : r,
      ),
    );
  };

  // Auto-assign ranks based on score (1 = highest)
  const autoRank = () => {
    const scored = results
      .filter((r) => r.score !== '' && !isNaN(parseFloat(r.score)))
      .map((r) => ({ ...r, numScore: parseFloat(r.score) }))
      .sort((a, b) => b.numScore - a.numScore);

    const rankMap = new Map<string, number>();
    scored.forEach((r, idx) => {
      // Ties get the same rank — skip the next index for tied entries
      if (idx > 0 && scored[idx - 1].numScore === r.numScore) {
        rankMap.set(r.studentId, rankMap.get(scored[idx - 1].studentId) ?? idx + 1);
      } else {
        rankMap.set(r.studentId, idx + 1);
      }
    });

    setResults((prev) =>
      prev.map((r) => ({
        ...r,
        rank: rankMap.get(r.studentId) ?? null,
      })),
    );
    toast.success('رتبه‌ها به‌صورت خودکار محاسبه شد', {
      description: `${toPersianDigits(scored.length)} دانش‌آموز رتبه‌بندی شد`,
      duration: 2000,
    });
  };

  // Stats
  const stats = useMemo(() => {
    const validScores = results
      .map((r) => parseFloat(r.score))
      .filter((n) => !isNaN(n));
    if (validScores.length === 0 || !exam) {
      return { avg: null, max: null, min: null, count: 0 };
    }
    const sum = validScores.reduce((a, b) => a + b, 0);
    return {
      avg: sum / validScores.length,
      max: Math.max(...validScores),
      min: Math.min(...validScores),
      count: validScores.length,
    };
  }, [results, exam]);

  const handleSave = async () => {
    if (!exam) return;
    setSaving(true);
    try {
      const payload = results.map((r) => ({
        studentId: r.studentId,
        score: r.score === '' ? null : parseFloat(r.score),
        rank: r.rank,
      }));
      await saveExamResults(exam.id, payload);
      toast.success('نتیجه‌های آزمون ذخیره شد', {
        description: `${toPersianDigits(stats.count)} نمره ثبت شد`,
      });
      onOpenChange(false);
    } catch (e) {
      toast.error('خطا در ذخیره نتایج', {
        description: e instanceof Error ? e.message : 'خطای ناشناخته',
      });
    } finally {
      setSaving(false);
    }
  };

  if (!exam) return null;

  const totalScore = exam.totalScore;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        dir="rtl"
        className="sm:max-w-2xl bg-[var(--bg-elevated)] border-[var(--border-strong)] max-h-[90vh] overflow-y-auto custom-scrollbar"
      >
        <DialogHeader>
          <DialogTitle className="text-right text-[var(--foreground)] flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[var(--gold)]" />
            ثبت نتایج آزمون
          </DialogTitle>
          <DialogDescription className="text-right text-[var(--foreground-muted)]">
            نمرات و رتبه‌های دانش‌آموزان را وارد کنید
          </DialogDescription>
        </DialogHeader>

        {/* Exam summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 rounded-xl bg-[var(--bg-overlay)]/40 border border-[var(--border)] mb-3">
          <div className="text-center">
            <p className="text-[10px] text-[var(--foreground-muted)] mb-0.5">عنوان</p>
            <p className="text-xs font-semibold text-[var(--foreground)] truncate">{exam.title}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-[var(--foreground-muted)] mb-0.5">درس</p>
            <p className="text-xs font-semibold text-[var(--foreground)]">{exam.subject}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-[var(--foreground-muted)] mb-0.5">تاریخ</p>
            <p className="text-xs font-semibold text-[var(--foreground)]">{formatPersianDateFromISO(exam.date)}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-[var(--foreground-muted)] mb-0.5">نمره کل</p>
            <p className="text-xs font-semibold text-[var(--foreground)] tabular-nums">{toPersianDigits(totalScore)}</p>
          </div>
        </div>

        {/* Stats bar */}
        {stats.avg !== null && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 p-2.5 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent)]/30 mb-3"
          >
            <TrendingUp className="w-4 h-4 text-[var(--accent)] shrink-0" />
            <div className="flex items-center gap-4 text-xs text-[var(--foreground)] flex-wrap">
              <span>
                میانگین: <strong className="tabular-nums">{toPersianDigits(stats.avg!.toFixed(1))}</strong>
              </span>
              <span>
                بالاترین: <strong className="text-[var(--accent)] tabular-nums">{toPersianDigits(stats.max!)}</strong>
              </span>
              <span>
                پایین‌ترین: <strong className="text-[var(--danger)] tabular-nums">{toPersianDigits(stats.min!)}</strong>
              </span>
              <span>
                ثبت شده: <strong className="tabular-nums">{toPersianDigits(stats.count)}</strong> / {toPersianDigits(exam.studentIds.length)}
              </span>
            </div>
          </motion.div>
        )}

        {/* Auto-rank button */}
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-[var(--foreground-muted)]">
            برای محاسبه خودکار رتبه‌ها بر اساس نمره، دکمه زیر را بزنید
          </p>
          <button
            type="button"
            onClick={autoRank}
            className="flex items-center gap-1.5 px-3 h-9 rounded-md border border-[var(--border-strong)] bg-[var(--bg-overlay)] hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] text-xs text-[var(--foreground-muted)] hover:text-[var(--accent)] transition-colors"
          >
            <Medal className="w-3.5 h-3.5" />
            رتبه‌بندی خودکار
          </button>
        </div>

        {/* Results table */}
        <div className="space-y-2">
          {participantStudents.map((student, idx) => {
            const result = results.find((r) => r.studentId === student.id);
            if (!result) return null;
            const scoreNum = parseFloat(result.score);
            const validScore = !isNaN(scoreNum);
            const percent = validScore ? (scoreNum / totalScore) * 100 : 0;
            const scoreColor = !validScore
              ? 'border-[var(--border-strong)]'
              : percent < 50
                ? 'border-[var(--danger)]/60 bg-[var(--danger)]/5'
                : percent < 70
                  ? 'border-[var(--warning)]/60 bg-[var(--warning)]/5'
                  : 'border-[var(--accent)]/60 bg-[var(--accent-soft)]';

            return (
              <motion.div
                key={student.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className={`flex items-center gap-3 p-2.5 rounded-lg border ${scoreColor} transition-colors`}
              >
                {/* Avatar */}
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-lg shrink-0">{student.avatar || '🦊'}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[var(--foreground)] truncate">
                      {student.name}
                    </p>
                    <p className="text-[10px] text-[var(--foreground-muted)] truncate">
                      {student.grade} · {student.major}
                    </p>
                  </div>
                </div>

                {/* Score input */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <label className="text-[10px] text-[var(--foreground-muted)]">نمره</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    dir="ltr"
                    value={result.score}
                    onChange={(e) => updateScore(student.id, e.target.value)}
                    placeholder="—"
                    className="w-16 h-8 text-center rounded-md border border-[var(--border-strong)] bg-[var(--bg-base)] text-sm text-[var(--foreground)] tabular-nums outline-none focus:border-[var(--accent)] transition-colors"
                  />
                </div>

                {/* Rank input */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <label className="text-[10px] text-[var(--foreground-muted)]">رتبه</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    dir="ltr"
                    value={result.rank != null ? toPersianDigits(result.rank) : ''}
                    onChange={(e) => updateRank(student.id, e.target.value)}
                    placeholder="—"
                    className="w-12 h-8 text-center rounded-md border border-[var(--border-strong)] bg-[var(--bg-base)] text-sm text-[var(--foreground)] tabular-nums outline-none focus:border-[var(--gold)] transition-colors"
                  />
                </div>

                {/* Percent badge */}
                {validScore && (
                  <div
                    className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium tabular-nums ${
                      percent < 50
                        ? 'bg-[var(--danger)]/10 text-[var(--danger)]'
                        : percent < 70
                          ? 'bg-[var(--warning)]/10 text-[var(--warning)]'
                          : 'bg-[var(--accent-soft)] text-[var(--accent)]'
                    }`}
                  >
                    {toPersianDigits(percent.toFixed(0))}٪
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        <DialogFooter className="gap-2 mt-4">
          <DialogClose asChild>
            <button
              type="button"
              className="px-4 h-10 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-overlay)] text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:border-[var(--foreground-muted)] transition-colors"
            >
              انصراف
            </button>
          </DialogClose>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 h-11 rounded-lg bg-[var(--accent)] text-[var(--bg-deep)] text-sm font-medium hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="w-4 h-4" />
            {saving ? 'در حال ذخیره...' : 'ذخیره نتایج'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
