'use client';

import { Subject } from '@/lib/subjects-types';
import { ChevronLeft, BookOpen, Layers, MessageSquare, Sparkles, Award, AlertTriangle, CheckCircle2, CircleDashed } from 'lucide-react';

function toPersianDigits(num: number | string): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return num
    .toString()
    .split('')
    .map((d) => persianDigits[parseInt(d)] ?? d)
    .join('');
}

// Compute the subject's completeness status.
//   - 'incomplete_no_grades': no GradeSubject records → students can't see it
//   - 'incomplete_no_chapters': has grades but no chapters → can't create tasks
//   - 'incomplete_no_pages': has chapters but missing page ranges → page-lookup breaks
//   - 'ready': has grades + chapters with valid page ranges
export type SubjectStatus =
  | 'incomplete_no_grades'
  | 'incomplete_no_chapters'
  | 'incomplete_no_pages'
  | 'ready';

export function computeSubjectStatus(subject: Subject): SubjectStatus {
  const grades = subject.grades || [];
  if (grades.length === 0) return 'incomplete_no_grades';

  const chapters = grades.flatMap((gs) => gs.chapters || []);
  if (chapters.length === 0) return 'incomplete_no_chapters';

  // Check if all chapters have valid page ranges (pageStart set, and either
  // pageEnd set or isLastPage true)
  const hasInvalidPages = chapters.some(
    (c) => c.pageStart === null || c.pageStart === undefined ||
      (!c.isLastPage && (c.pageEnd === null || c.pageEnd === undefined)),
  );
  if (hasInvalidPages) return 'incomplete_no_pages';

  return 'ready';
}

const STATUS_CONFIG: Record<SubjectStatus, { label: string; icon: typeof AlertTriangle; bg: string; text: string; border: string }> = {
  incomplete_no_grades: {
    label: 'ناقص: بدون پایه/رشته',
    icon: AlertTriangle,
    bg: 'bg-[var(--warning)]/10',
    text: 'text-[var(--warning)]',
    border: 'border-[var(--warning)]/30',
  },
  incomplete_no_chapters: {
    label: 'ناقص: بدون فصل',
    icon: AlertTriangle,
    bg: 'bg-[var(--warning)]/10',
    text: 'text-[var(--warning)]',
    border: 'border-[var(--warning)]/30',
  },
  incomplete_no_pages: {
    label: 'ناقص: بازه صفحه نامعتبر',
    icon: AlertTriangle,
    bg: 'bg-[var(--warning)]/10',
    text: 'text-[var(--warning)]',
    border: 'border-[var(--warning)]/30',
  },
  ready: {
    label: 'آمادهٔ انتشار',
    icon: CheckCircle2,
    bg: 'bg-[var(--accent-soft)]',
    text: 'text-[var(--accent)]',
    border: 'border-[var(--accent)]/30',
  },
};

export function SubjectCard({ subject, onClick }: { subject: Subject; onClick: () => void }) {
  // New schema: chapters are nested under grades[].chapters[]
  const gradeCount = subject.grades?.length || 0;
  const chapterCount =
    subject.grades?.reduce(
      (acc, gs) => acc + (gs.chapters?.length || 0),
      0,
    ) || 0;
  const topicCount =
    subject.grades?.reduce(
      (acc, gs) =>
        acc +
        (gs.chapters?.reduce((a, c) => a + (c.topics?.length || 0), 0) || 0),
      0,
    ) || 0;
  const topicModeCount = subject.topicModes?.length || 0;

  const isKonkur = !!subject.isKonkur;
  const status = computeSubjectStatus(subject);
  const statusConfig = STATUS_CONFIG[status];
  const StatusIcon = statusConfig.icon;

  return (
    <button
      onClick={onClick}
      className="surface-1 edge-highlight rounded-2xl p-5 card-hover text-right w-full group"
    >
      {/* Header: icon + name + chevron */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 ring-1 ring-inset ring-white/10"
            style={{ backgroundColor: `${subject.color}20`, color: subject.color }}
          >
            {subject.icon || <BookOpen className="w-5 h-5" />}
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-bold text-[var(--foreground)] group-hover:text-[var(--gold)] transition-colors truncate">
              {subject.name}
            </h3>
            <p className="text-[11px] text-[var(--foreground-muted)] mt-0.5">
              {gradeCount > 0
                ? `${toPersianDigits(gradeCount)} پایه`
                : 'بدون پایه تعریف‌شده'}
            </p>
          </div>
        </div>
        <ChevronLeft className="w-4 h-4 text-[var(--foreground-subtle)] group-hover:text-[var(--gold)] group-hover:-translate-x-1 transition-all shrink-0" />
      </div>

      {/* Badges row 1: konkur + status */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {isKonkur ? (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-[var(--gold-soft)] text-[var(--gold)] border-[var(--gold)]/30 flex items-center gap-1">
            <Award className="w-2.5 h-2.5" />
            کنکور
          </span>
        ) : (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border border-[var(--border-strong)] text-[var(--foreground-muted)]">
            غیرکنکوری
          </span>
        )}
        {/* Completeness status badge */}
        <span
          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1 ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
        >
          <StatusIcon className="w-2.5 h-2.5" />
          {statusConfig.label}
        </span>
      </div>

      {/* Stats row */}
      <div className={`grid ${topicModeCount > 0 ? 'grid-cols-3' : 'grid-cols-2'} gap-2 pt-3 border-t border-[var(--border)]`}>
        <div className="flex flex-col items-center justify-center text-center">
          <Layers className="w-3.5 h-3.5 text-[var(--foreground-muted)] mb-1" />
          <span className="text-sm font-bold text-[var(--foreground)]">{toPersianDigits(chapterCount)}</span>
          <span className="text-[9px] text-[var(--foreground-subtle)]">فصل</span>
        </div>
        <div className="flex flex-col items-center justify-center text-center">
          <MessageSquare className="w-3.5 h-3.5 text-[var(--foreground-muted)] mb-1" />
          <span className="text-sm font-bold text-[var(--foreground)]">{toPersianDigits(topicCount)}</span>
          <span className="text-[9px] text-[var(--foreground-subtle)]">گفتار</span>
        </div>
        {topicModeCount > 0 && (
          <div className="flex flex-col items-center justify-center text-center">
            <Sparkles className="w-3.5 h-3.5 text-[var(--foreground-muted)] mb-1" />
            <span className="text-sm font-bold text-[var(--foreground)]">{toPersianDigits(topicModeCount)}</span>
            <span className="text-[9px] text-[var(--foreground-subtle)]">مبحث</span>
          </div>
        )}
      </div>
    </button>
  );
}
