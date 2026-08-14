'use client';

import { Subject } from '@/lib/subjects-types';
import { ChevronLeft, BookOpen, Layers, MessageSquare, Sparkles, Award } from 'lucide-react';

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
  const topicModes = grades.flatMap((gs) => gs.topicModes || []);
  if (chapters.length === 0 && topicModes.length === 0) return 'incomplete_no_chapters';

  // Page bounds are optional, but partial ranges are invalid.
  const hasInvalidPages = chapters.some(
    (c) => (c.pageStart == null) !== (c.pageEnd == null),
  );
  if (hasInvalidPages) return 'incomplete_no_pages';

  return 'ready';
}

const STATUS_CONFIG: Record<SubjectStatus, { label: string; dotColor: string; bg: string; text: string; border: string }> = {
  incomplete_no_grades: {
    label: 'ناقص: بدون پایه/رشته',
    dotColor: 'bg-[var(--warning)]',
    bg: 'bg-[var(--warning)]/10',
    text: 'text-[var(--warning)]',
    border: 'border-[var(--warning)]/30',
  },
  incomplete_no_chapters: {
    label: 'ناقص: بدون فصل',
    dotColor: 'bg-[var(--warning)]',
    bg: 'bg-[var(--warning)]/10',
    text: 'text-[var(--warning)]',
    border: 'border-[var(--warning)]/30',
  },
  incomplete_no_pages: {
    label: 'ناقص: بازه صفحه نامعتبر',
    dotColor: 'bg-[var(--warning)]',
    bg: 'bg-[var(--warning)]/10',
    text: 'text-[var(--warning)]',
    border: 'border-[var(--warning)]/30',
  },
  ready: {
    label: 'آمادهٔ انتشار',
    dotColor: 'bg-[var(--accent)]',
    bg: 'bg-[var(--accent-soft)]',
    text: 'text-[var(--accent)]',
    border: 'border-[var(--accent)]/30',
  },
};

export function SubjectCard({ subject, onClick }: { subject: Subject; onClick: () => void }) {
  const grades = subject.grades || [];
  // New schema: chapters are nested under grades[].chapters[]
  const gradeCount = grades.length;
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
  const topicModeCount = grades.reduce((count, grade) => count + (grade.topicModes?.length || 0), 0);

  const hasKonkur = grades.some((grade) => grade.isKonkur);
  const hasFinal = grades.some((grade) => grade.isFinal);
  const status = computeSubjectStatus(subject);
  const statusConfig = STATUS_CONFIG[status];

  return (
    <button
      onClick={onClick}
      className="surface-1 edge-highlight rounded-2xl p-5 text-right w-full group"
      style={{
        borderRight: `3px solid ${subject.color}`,
        transition: 'box-shadow 0.22s ease, transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
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

      {/* Assessment and completeness badges */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {hasKonkur && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-[var(--gold-soft)] text-[var(--gold)] border-[var(--gold)]/30 flex items-center gap-1">
            <Award className="w-2.5 h-2.5" />
            کنکور
          </span>
        )}
        {hasFinal && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-[var(--accent-soft)] text-[var(--accent)] border-[var(--accent)]/30">
            نهایی
          </span>
        )}
        {/* Completeness status badge: dot + text */}
        <span
          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1.5 ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
        >
          <span className={`w-2 h-2 rounded-full ${statusConfig.dotColor}`} />
          {statusConfig.label}
        </span>
      </div>

      {/* Stats row */}
      <div className={`grid ${topicModeCount > 0 ? 'grid-cols-3' : 'grid-cols-2'} gap-3 pt-3.5 mt-1 border-t border-[var(--border)]`}>
        <div className="flex flex-col items-center justify-center text-center">
          <Layers className="w-4 h-4 text-[var(--foreground-muted)] mb-1.5" />
          <span className="text-base font-bold text-[var(--foreground)]">{toPersianDigits(chapterCount)}</span>
          <span className="text-[10px] text-[var(--foreground-subtle)] mt-0.5">فصل</span>
        </div>
        <div className="flex flex-col items-center justify-center text-center">
          <MessageSquare className="w-4 h-4 text-[var(--foreground-muted)] mb-1.5" />
          <span className="text-base font-bold text-[var(--foreground)]">{toPersianDigits(topicCount)}</span>
          <span className="text-[10px] text-[var(--foreground-subtle)] mt-0.5">گفتار</span>
        </div>
        {topicModeCount > 0 && (
          <div className="flex flex-col items-center justify-center text-center">
            <Sparkles className="w-4 h-4 text-[var(--foreground-muted)] mb-1.5" />
            <span className="text-base font-bold text-[var(--foreground)]">{toPersianDigits(topicModeCount)}</span>
            <span className="text-[10px] text-[var(--foreground-subtle)] mt-0.5">مبحث</span>
          </div>
        )}
      </div>
    </button>
  );
}
