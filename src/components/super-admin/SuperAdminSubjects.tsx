'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Plus, Search, Loader2, Crown, Layers, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Subject } from '@/lib/subjects-types';
import { SubjectDetail } from './SubjectDetail';
import { SubjectCard } from './SubjectCard';
import { SubjectFormModal } from './SubjectFormModal';

// ===== Helper: Persian digits =====
function toPersianDigits(num: number | string): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return num
    .toString()
    .split('')
    .map((d) => persianDigits[parseInt(d)] ?? d)
    .join('');
}

export default function SuperAdminSubjects() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<'all' | 'اختصاصی' | 'عمومی'>('all');
  const [filterAssessment, setFilterAssessment] = useState<'all' | 'کنکور' | 'نهایی' | 'هر دو'>('all');
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // ===== Fetch subjects with full tree =====
  const fetchSubjects = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/subjects?include=tree');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطا در بارگذاری دروس');
      setSubjects(data.subjects);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'خطا در بارگذاری دروس';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  // ===== Filtered subjects =====
  const filtered = subjects.filter((s) => {
    if (search && !s.name.includes(search)) return false;
    if (filterCategory !== 'all' && s.category !== filterCategory) return false;
    if (filterAssessment !== 'all' && s.assessmentType !== filterAssessment) return false;
    return true;
  });

  // ===== Stats =====
  const totalChapters = subjects.reduce((acc, s) => acc + (s.chapters?.length || 0), 0);
  const totalTopics = subjects.reduce(
    (acc, s) => acc + (s.chapters?.reduce((a, c) => a + (c.topics?.length || 0), 0) || 0),
    0
  );
  const totalTopicModes = subjects.reduce((acc, s) => acc + (s.topicModes?.length || 0), 0);

  // ===== Handle subject created/updated =====
  const handleSubjectChange = useCallback(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  // ===== Handle subject click → open detail =====
  const handleSubjectClick = (subject: Subject) => {
    setSelectedSubject(subject);
  };

  if (selectedSubject) {
    return (
      <SubjectDetail
        subject={selectedSubject}
        onBack={() => {
          setSelectedSubject(null);
          fetchSubjects();
        }}
        onChange={handleSubjectChange}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* ===== Header ===== */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Crown className="w-5 h-5 text-[var(--gold)]" />
            <span className="text-[10px] font-bold text-[var(--gold)] uppercase tracking-wider">
              God Mode · مدیریت دروس
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-[var(--foreground)] flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-[var(--gold)]" />
            مدیریت ساختار دروس
          </h1>
          <p className="text-sm text-[var(--foreground-muted)] mt-1">
            درخت کامل دروس، فصل‌ها، گفتارها و مباحث کنکوری — قابل ویرایش پویا
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-hover glow-hover-gold glow-hover inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-[var(--gold)] text-zinc-950 font-bold text-sm"
        >
          <Plus className="w-4 h-4" />
          افزودن درس جدید
        </button>
      </div>

      {/* ===== KPI Stats ===== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'دروس', value: subjects.length, icon: BookOpen, color: 'text-[var(--gold)]' },
          { label: 'فصل‌ها', value: totalChapters, icon: Layers, color: 'text-[var(--accent)]' },
          { label: 'گفتارها', value: totalTopics, icon: Layers, color: 'text-[#8B5CF6]' },
          { label: 'مباحث کنکوری', value: totalTopicModes, icon: Sparkles, color: 'text-[#F59E0B]' },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={i}
              className="surface-1 edge-highlight rounded-2xl p-4 card-hover"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-[var(--foreground-muted)]">{stat.label}</span>
                <Icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <div className="text-2xl font-black text-[var(--foreground)]">
                {toPersianDigits(stat.value)}
              </div>
            </div>
          );
        })}
      </div>

      {/* ===== Filters Bar ===== */}
      <div className="surface-1 rounded-2xl p-3 flex flex-col md:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--foreground-subtle)] pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="جستجوی درس..."
            className="w-full bg-[var(--bg-overlay)] border border-[var(--border)] rounded-xl pr-10 pl-3 h-10 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)] focus:outline-none focus:border-[var(--gold)]/40"
          />
        </div>

        {/* Category filter */}
        <div className="flex gap-1 bg-[var(--bg-overlay)] rounded-xl p-1">
          {(['all', 'اختصاصی', 'عمومی'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`btn-hover px-3 h-8 rounded-lg text-xs font-medium ${
                filterCategory === cat
                  ? 'bg-[var(--gold)] text-zinc-950'
                  : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
              }`}
            >
              {cat === 'all' ? 'همه دسته‌ها' : cat}
            </button>
          ))}
        </div>

        {/* Assessment filter */}
        <div className="flex gap-1 bg-[var(--bg-overlay)] rounded-xl p-1">
          {(['all', 'کنکور', 'نهایی', 'هر دو'] as const).map((asm) => (
            <button
              key={asm}
              onClick={() => setFilterAssessment(asm)}
              className={`btn-hover px-3 h-8 rounded-lg text-xs font-medium ${
                filterAssessment === asm
                  ? 'bg-[var(--gold)] text-zinc-950'
                  : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
              }`}
            >
              {asm === 'all' ? 'همه نوع‌ها' : asm}
            </button>
          ))}
        </div>
      </div>

      {/* ===== Subjects Grid ===== */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-[var(--foreground-muted)]">
          <Loader2 className="w-8 h-8 animate-spin mb-3" />
          <p className="text-sm">در حال بارگذاری دروس...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="surface-1 rounded-2xl p-12 text-center">
          <BookOpen className="w-12 h-12 mx-auto text-[var(--foreground-subtle)] mb-3" />
          <p className="text-sm text-[var(--foreground-muted)]">هیچ درسی یافت نشد</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((subject, idx) => (
              <motion.div
                key={subject.id}
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.3, delay: idx * 0.04, ease: [0.16, 1, 0.3, 1] }}
              >
                <SubjectCard subject={subject} onClick={() => handleSubjectClick(subject)} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* ===== Add Subject Modal ===== */}
      {showAddModal && (
        <SubjectFormModal
          onClose={() => setShowAddModal(false)}
          onSaved={() => {
            setShowAddModal(false);
            fetchSubjects();
            toast.success('درس جدید با موفقیت ایجاد شد');
          }}
        />
      )}
    </div>
  );
}
