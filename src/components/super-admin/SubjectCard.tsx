'use client';

import { Subject } from '@/lib/subjects-types';
import { ChevronLeft, BookOpen, Layers, MessageSquare, Sparkles } from 'lucide-react';

function toPersianDigits(num: number | string): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return num
    .toString()
    .split('')
    .map((d) => persianDigits[parseInt(d)] ?? d)
    .join('');
}

const ASSESSMENT_BADGE: Record<string, { label: string; cls: string }> = {
  'کنکور': { label: 'کنکور', cls: 'bg-[var(--gold-soft)] text-[var(--gold)] border-[var(--gold)]/30' },
  'نهایی': { label: 'نهایی', cls: 'bg-[var(--accent-soft)] text-[var(--accent)] border-[var(--accent)]/30' },
  'هر دو': { label: 'کنکور + نهایی', cls: 'bg-purple-500/10 text-purple-400 border-purple-500/30' },
};

const STRATEGY_BADGE: Record<string, { label: string }> = {
  chapter: { label: 'فصل‌به‌فصل' },
  topic: { label: 'مبحثی' },
  both: { label: 'دوحالته' },
};

export function SubjectCard({ subject, onClick }: { subject: Subject; onClick: () => void }) {
  const chapterCount = subject.chapters?.length || 0;
  const topicCount = subject.chapters?.reduce((a, c) => a + (c.topics?.length || 0), 0) || 0;
  const topicModeCount = subject.topicModes?.length || 0;
  const gradeCount = subject.grades?.length || 0;

  const asm = ASSESSMENT_BADGE[subject.assessmentType] || ASSESSMENT_BADGE['کنکور'];
  const strat = STRATEGY_BADGE[subject.displayStrategy] || STRATEGY_BADGE['both'];

  return (
    <button
      onClick={onClick}
      className="surface-1 edge-highlight rounded-2xl p-5 card-hover text-right w-full group"
    >
      {/* Header: icon + name + chevron */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 ring-1 ring-inset ring-white/10"
            style={{ backgroundColor: `${subject.color}20`, color: subject.color }}
          >
            {subject.icon || <BookOpen className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="text-base font-bold text-[var(--foreground)] group-hover:text-[var(--gold)] transition-colors">
              {subject.name}
            </h3>
            <p className="text-[11px] text-[var(--foreground-muted)] mt-0.5">
              {toPersianDigits(gradeCount)} پایه · {subject.category}
            </p>
          </div>
        </div>
        <ChevronLeft className="w-4 h-4 text-[var(--foreground-subtle)] group-hover:text-[var(--gold)] group-hover:-translate-x-1 transition-all" />
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${asm.cls}`}>
          {asm.label}
        </span>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border border-[var(--border-strong)] text-[var(--foreground-muted)]">
          {strat.label}
        </span>
        {subject.finalStrategy && subject.finalStrategy !== 'default' && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400">
            استراتژی نهایی
          </span>
        )}
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
