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
              onClick={() => setTab(t.id)}
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
          {tab === 'tree' && <CurriculumWizard subjectId={subject.id} />}
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
