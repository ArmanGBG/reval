'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  Loader2,
  BookOpen,
  Layers,
  Sparkles,
  Pencil,
  CheckCircle2,
  MessageSquare,
  GraduationCap,
  ChevronLeft,
} from 'lucide-react';
import { Subject } from '@/lib/subjects-types';
import { SubjectSettingsPanel } from './SubjectSettingsPanel';
import { CurriculumWizard } from './CurriculumWizard';
import { TopicModesPanel } from './TopicModesPanel';

function toPersianDigits(num: number | string): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return num
    .toString()
    .split('')
    .map((d) => persianDigits[parseInt(d)] ?? d)
    .join('');
}

interface SubjectDetailProps {
  subject: Subject;
  onBack: () => void;
  onChange: () => void;
}

type Tab = 'tree' | 'topicModes' | 'settings';

export function SubjectDetail({ subject: initialSubject, onBack, onChange }: SubjectDetailProps) {
  const [subject, setSubject] = useState<Subject>(initialSubject);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<Tab>('tree');
  // When user clicks a grade card, we store the target grade+major
  // and switch to the 'tree' tab so CurriculumWizard receives them.
  const [navigateToGrade, setNavigateToGrade] = useState<{ grade: string; major: string } | null>(null);

  // ===== Refresh subject (with full tree) =====
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/subjects/${subject.id}`);
      const data = await res.json();
      if (res.ok) setSubject(data.subject);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [subject.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // ===== Stats =====
  // Chapters are now nested under grades[].chapters[] (new schema)
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

  return (
    <div className="space-y-5">
      {/* ===== Back button header ===== */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="icon-btn w-10 h-10 rounded-xl border border-[var(--border)] flex items-center justify-center text-[var(--foreground-muted)]"
          aria-label="بازگشت"
        >
          <ArrowRight className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-3 flex-1">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-xl ring-1 ring-inset ring-white/10"
            style={{ backgroundColor: `${subject.color}20`, color: subject.color }}
          >
            {subject.icon || <BookOpen className="w-5 h-5" />}
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-[var(--foreground)]">
              {subject.name}
            </h1>
            <p className="text-xs text-[var(--foreground-muted)]">
              {toPersianDigits(gradeCount)} پایه · {toPersianDigits(chapterCount)} فصل · {toPersianDigits(topicCount)} گفتار · {toPersianDigits(topicModeCount)} مبحث
            </p>
          </div>
        </div>
        {loading && <Loader2 className="w-4 h-4 animate-spin text-[var(--gold)]" />}
      </div>

      {/* ===== Grade Completion Overview ===== */}
      {(() => {
        // Only show grades that have at least one chapter (populated)
        const populatedGrades = (subject.grades || [])
          .map((gs) => {
            const chapters = gs.chapters || [];
            const topics = chapters.reduce((a, c) => a + (c.topics?.length || 0), 0);
            // A grade is considered "populated" if it has at least one chapter
            const hasChapters = chapters.length > 0;
            // Check if all chapters have valid page ranges
            const allPagesValid = chapters.every(
              (c) => c.pageStart != null && (c.isLastPage || c.pageEnd != null),
            );
            return {
              grade: gs.grade,
              major: gs.major,
              chapterCount: chapters.length,
              topicCount: topics,
              hasChapters,
              allPagesValid,
              // Completion level: 'full' = has chapters + all pages valid, 'partial' = has chapters but some pages missing
              completionLevel: hasChapters ? (allPagesValid ? 'full' as const : 'partial' as const) : null,
            };
          })
          .filter((g) => g.hasChapters);

        if (populatedGrades.length === 0) return null;

        return (
          <div className="surface-1 edge-highlight rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <GraduationCap className="w-4 h-4 text-[var(--gold)]" />
              <h3 className="text-sm font-bold text-[var(--foreground)]">پایه‌های تکمیل‌شده</h3>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent)]/30">
                {toPersianDigits(populatedGrades.length)}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {populatedGrades.map((g) => (
                <motion.div
                  key={`${g.grade}-${g.major}`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => {
                    setNavigateToGrade({ grade: g.grade, major: g.major });
                    setTab('tree');
                  }}
                  className="flex items-center gap-3 rounded-xl p-3 border cursor-pointer group/grade hover:shadow-md transition-shadow duration-200"
                  style={{
                    backgroundColor: `${subject.color}08`,
                    borderColor: g.completionLevel === 'full'
                      ? `${subject.color}30`
                      : 'var(--border)',
                  }}
                >
                  {/* Status icon */}
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: g.completionLevel === 'full' ? `${subject.color}20` : 'var(--bg-overlay)',
                    }}
                  >
                    {g.completionLevel === 'full' ? (
                      <CheckCircle2 className="w-4 h-4" style={{ color: subject.color }} />
                    ) : (
                      <Layers className="w-4 h-4 text-[var(--warning)]" />
                    )}
                  </div>
                  {/* Grade info */}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-[var(--foreground)] truncate">
                      {g.grade} {g.major}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-[var(--foreground-muted)] flex items-center gap-0.5">
                        <Layers className="w-2.5 h-2.5" />
                        {toPersianDigits(g.chapterCount)} فصل
                      </span>
                      {g.topicCount > 0 && (
                        <span className="text-[10px] text-[var(--foreground-muted)] flex items-center gap-0.5">
                          <MessageSquare className="w-2.5 h-2.5" />
                          {toPersianDigits(g.topicCount)} گفتار
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Page validity badge */}
                  {g.completionLevel === 'partial' && (
                    <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-[var(--warning)]/10 text-[var(--warning)] border border-[var(--warning)]/30 whitespace-nowrap">
                      صفحه ناقص
                    </span>
                  )}
                  {/* Click indicator */}
                  <ChevronLeft className="w-3.5 h-3.5 text-[var(--foreground-subtle)] group-hover/grade:text-[var(--gold)] group-hover/grade:-translate-x-0.5 transition-all shrink-0" />
                </motion.div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* ===== Tabs ===== */}
      <div className="flex gap-1 surface-1 rounded-xl p-1 sticky top-0 z-10">
        {[
          { id: 'tree' as Tab, label: 'درخت فصل‌ها', icon: Layers },
          { id: 'topicModes' as Tab, label: 'مباحث کنکوری', icon: Sparkles },
          { id: 'settings' as Tab, label: 'تنظیمات درس', icon: Pencil },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => {
                setTab(t.id);
                // Clear navigateToGrade when switching tabs directly
                // so CurriculumWizard starts fresh from step 1
                if (t.id !== 'tree') setNavigateToGrade(null);
              }}
              className={`btn-hover flex-1 flex items-center justify-center gap-2 h-10 rounded-lg text-xs font-semibold transition-all ${
                tab === t.id
                  ? 'bg-[var(--gold)] text-white'
                  : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ===== Tab content ===== */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {tab === 'tree' && (
            <CurriculumWizard
              key={navigateToGrade ? `${navigateToGrade.grade}-${navigateToGrade.major}` : 'default'}
              subjectId={subject.id}
              initialGrade={navigateToGrade?.grade as 'دهم' | 'یازدهم' | 'دوازدهم' | undefined}
              initialMajor={navigateToGrade?.major as 'تجربی' | 'ریاضی' | 'انسانی' | undefined}
            />
          )}
          {tab === 'topicModes' && (
            <TopicModesPanel
              subject={subject}
              topicModes={subject.topicModes || []}
              onRefresh={refresh}
            />
          )}
          {tab === 'settings' && (
            <SubjectSettingsPanel
              subject={subject}
              onUpdated={(updated) => {
                setSubject(updated);
                onChange();
              }}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
