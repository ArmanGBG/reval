'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAppStore } from '@/lib/store';
import { Flashcard } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Music, Brain, Timer, Calculator, Heart, X,
  Plus, ImagePlus, ChevronLeft, ChevronRight,
  ChevronDown, Sparkles,
} from 'lucide-react';
import PomodoroTimer from './PomodoroTimer';
import StudyMusicPlayer from './StudyMusicPlayer';
import GradeCalculator from './GradeCalculator';
import BreathingExercise from './BreathingExercise';
import { toast } from 'sonner';

// ===== Tool Definitions =====
const TOOLS = [
  {
    id: 'music',
    title: 'موزیک تمرکز',
    description: 'تمرکزتو با موسیقی بالا ببر',
    icon: Music,
    color: '#8B5CF6',
    gradientFrom: '#8B5CF6',
    gradientTo: '#C084FC',
  },
  {
    id: 'flashcards',
    title: 'فلش‌کارت هوشمند',
    description: 'یادگیری فعال با فلش‌کارت',
    icon: Brain,
    color: '#3EB489',
    gradientFrom: '#3EB489',
    gradientTo: '#4FD9A8',
  },
  {
    id: 'pomodoro',
    title: 'پومودورو',
    description: 'مدیریت زمان مطالعه',
    icon: Timer,
    color: '#F5B544',
    gradientFrom: '#F5B544',
    gradientTo: '#F59E0B',
  },
  {
    id: 'calculator',
    title: 'محاسبه‌گر درصد',
    description: 'درصد کنکور رو حساب کن',
    icon: Calculator,
    color: '#3B82F6',
    gradientFrom: '#3B82F6',
    gradientTo: '#60A5FA',
  },
  {
    id: 'breathing',
    title: 'اورژانس استرس',
    description: 'تنفس عمیق و آرامش',
    icon: Heart,
    color: '#F43F5E',
    gradientFrom: '#F43F5E',
    gradientTo: '#FB7185',
  },
];

// ===== Main Component =====
export default function ToolsHub() {
  const { currentTool, setCurrentTool } = useAppStore();
  const [activeTool, setActiveTool] = useState<string | null>(currentTool);

  useEffect(() => {
    setActiveTool(currentTool);
  }, [currentTool]);

  const handleToolSelect = useCallback(
    (toolId: string) => {
      setActiveTool(toolId);
      setCurrentTool(toolId);
    },
    [setCurrentTool]
  );

  const handleClose = useCallback(() => {
    setActiveTool(null);
    setCurrentTool(null);
  }, [setCurrentTool]);

  // Escape closes the modal (the global keyboard-shortcuts hook ignores
  // Escape while focus is inside the modal — handle it locally instead)
  useEffect(() => {
    if (!activeTool) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        handleClose();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [activeTool, handleClose]);

  const activeToolObj = TOOLS.find((t) => t.id === activeTool) || null;

  return (
    <div dir="rtl">
      {/* ===== MOBILE LAYOUT (2-col grid) ===== */}
      <div className="md:hidden max-w-md mx-auto px-4 pt-6 pb-24">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-bold text-[var(--foreground)] mb-1">ابزارهای مطالعه</h1>
          <p className="text-sm text-[var(--foreground-muted)]">ابزارهایی که روالت رو راحت‌تر می‌کنن</p>
        </motion.div>

        <div className="grid grid-cols-2 gap-3">
          {TOOLS.map((tool, index) => {
            const IconComp = tool.icon;
            const isLast = index === TOOLS.length - 1;
            return (
              <motion.button
                key={tool.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.06, duration: 0.3 }}
                onClick={() => handleToolSelect(tool.id)}
                className={`group surface-1 edge-highlight card-hover rounded-[var(--radius-lg)] p-4 text-right min-h-[150px] flex flex-col justify-between overflow-hidden ${
                  isLast ? 'col-span-2 max-w-[calc(50%-6px)] mx-auto' : ''
                }`}
              >
                {/* Gradient glow overlay */}
                <div
                  className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background: `radial-gradient(ellipse 50% 60% at 30% 30%, ${tool.gradientFrom}15, transparent)`,
                  }}
                />
                <div className="relative z-10">
                  <div
                    className="w-14 h-14 rounded-[var(--radius-lg)] flex items-center justify-center mb-3 tool-icon-container"
                    style={{ background: `linear-gradient(135deg, ${tool.gradientFrom}30, ${tool.gradientTo}15)` }}
                  >
                    <IconComp className="w-7 h-7 tool-icon-pulse" style={{ color: tool.gradientFrom }} />
                  </div>
                  <h3 className="text-sm font-bold text-[var(--foreground)] mb-1">{tool.title}</h3>
                  <p className="text-[11px] text-[var(--foreground-muted)] leading-relaxed">{tool.description}</p>
                </div>
                <div
                  className="relative z-10 w-8 h-1 rounded-full mt-3"
                  style={{ background: `linear-gradient(90deg, ${tool.gradientFrom}, ${tool.gradientTo})` }}
                />
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ===== DESKTOP LAYOUT (4-col grid + side panel) ===== */}
      <div className="hidden md:block">
        <div className="flex items-end justify-between mb-8 pb-6 border-b border-[var(--border)]">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-[var(--foreground-subtle)] font-semibold">
              <span>ابزارها</span>
              <ChevronLeft className="w-3 h-3 flip-rtl" />
              <span className="text-[var(--accent)]">مرکز ابزار</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-[var(--foreground)]">ابزارهای مطالعه</h1>
            <p className="text-sm text-[var(--foreground-muted)]">ابزارهایی که روالت رو راحت‌تر می‌کنن</p>
          </div>
          <Sparkles className="w-8 h-8 text-[var(--accent)] opacity-50" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {TOOLS.map((tool, index) => {
            const IconComp = tool.icon;
            const isActive = activeTool === tool.id;
            const isLast = index === TOOLS.length - 1;
            return (
              <motion.button
                key={tool.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                onClick={() => handleToolSelect(tool.id)}
                className={`group surface-1 edge-highlight card-hover rounded-[var(--radius-lg)] p-5 text-right min-h-[190px] flex flex-col justify-between transition-all overflow-hidden ${
                  isActive ? 'border-[var(--accent)] ring-1 ring-[var(--accent-glow)]' : ''
                } ${
                  isLast ? 'col-span-2 max-w-[calc(50%-8px)] mx-auto' : ''
                }`}
              >
                {/* Gradient glow overlay */}
                <div
                  className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background: `radial-gradient(ellipse 50% 60% at 25% 25%, ${tool.gradientFrom}18, transparent)`,
                  }}
                />
                <div className="relative z-10">
                  <div
                    className="w-16 h-16 rounded-[var(--radius-lg)] flex items-center justify-center mb-4 tool-icon-container"
                    style={{ background: `linear-gradient(135deg, ${tool.gradientFrom}35, ${tool.gradientTo}18)` }}
                  >
                    <IconComp className="w-8 h-8 tool-icon-pulse" style={{ color: tool.gradientFrom }} />
                  </div>
                  <h3 className="text-base font-bold text-[var(--foreground)] mb-1.5">{tool.title}</h3>
                  <p className="text-xs text-[var(--foreground-muted)] leading-relaxed">{tool.description}</p>
                </div>
                <div className="relative z-10 flex items-center justify-between mt-4">
                  <div
                    className="w-10 h-1 rounded-full"
                    style={{ background: `linear-gradient(90deg, ${tool.gradientFrom}, ${tool.gradientTo})` }}
                  />
                  <ChevronLeft className="w-4 h-4 text-[var(--foreground-subtle)] flip-rtl group-hover:text-[var(--foreground-muted)] transition-colors" />
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ===== TOOL MODAL / DRAWER (shared) ===== */}
      <AnimatePresence>
        {activeTool && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-6"
            onClick={handleClose}
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

            {/* Modal Content */}
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="relative w-full md:max-w-2xl max-h-[92vh] md:max-h-[88vh] overflow-y-auto surface-2 border-t md:border border-[var(--border-strong)] rounded-t-3xl md:rounded-[var(--radius-xl)]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="sticky top-0 z-10 flex items-center justify-between p-4 md:p-5 surface-2 border-b border-[var(--border)]">
                <div className="flex items-center gap-2.5">
                  {activeToolObj && (() => {
                    const HeaderIcon = activeToolObj.icon;
                    return (
                      <div
                        className="w-10 h-10 rounded-[var(--radius)] flex items-center justify-center"
                        style={{
                          background: `linear-gradient(135deg, ${activeToolObj.gradientFrom}30, ${activeToolObj.gradientTo}15)`,
                        }}
                      >
                        <HeaderIcon className="w-5 h-5" style={{ color: activeToolObj.gradientFrom }} />
                      </div>
                    );
                  })()}
                  <h2 className="text-base md:text-lg font-bold text-[var(--foreground)]">
                    {activeToolObj?.title}
                  </h2>
                </div>
                <button
                  onClick={handleClose}
                  className="icon-btn w-9 h-9 rounded-full surface-1 border border-[var(--border)] flex items-center justify-center text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-4 md:p-5">
                {activeTool === 'music' && <StudyMusicPlayer />}
                {activeTool === 'flashcards' && <FlashcardsTool />}
                {activeTool === 'pomodoro' && <PomodoroTimer />}
                {activeTool === 'calculator' && <GradeCalculator />}
                {activeTool === 'breathing' && <BreathingExercise />}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ===== Tool 1: Study Music (Focus Music) =====
// Implemented in ./StudyMusicPlayer — Web Audio API ambient sound generator.

// ===== Tool 2: Smart Flashcards =====
const SUBJECT_COLORS: Record<string, string> = {
  'ریاضی': '#3EB489',
  'فیزیک': '#F59E0B',
  'شیمی': '#EF4444',
  'زیست': '#8B5CF6',
  'ادبیات': '#EC4899',
  'عربی': '#06B6D4',
  'دینی': '#F97316',
  'زبان': '#14B8A6',
};

type MasteryFilter = 'all' | 'mastered' | 'review' | 'weak';

function FlashcardsTool() {
  const { flashcards, addFlashcard, updateFlashcard } = useAppStore();
  const [tab, setTab] = useState<'study' | 'marked'>('study');
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [masteryFilter, setMasteryFilter] = useState<MasteryFilter>('all');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newFront, setNewFront] = useState('');
  const [newBack, setNewBack] = useState('');
  const [newSubject, setNewSubject] = useState('');

  // Get unique subjects from all flashcards
  const allSubjects = [...new Set(flashcards.map((c) => c.subject).filter(Boolean) as string[])];

  // Filter cards based on all criteria
  const filteredCards = flashcards.filter((c) => {
    if (tab === 'marked') {
      if (c.mastery === 'mastered' && masteryFilter === 'all') return true;
      if (c.mastery === 'review' && masteryFilter === 'all') return true;
      if (c.mastery === 'weak' && masteryFilter === 'all') return true;
      if (masteryFilter !== 'all' && c.mastery !== masteryFilter) return false;
    }
    if (selectedSubject && c.subject !== selectedSubject) return false;
    if (masteryFilter !== 'all' && c.mastery !== masteryFilter) return false;
    return true;
  });

  const currentCard = filteredCards[currentIndex] || null;

  const handleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  const handleMastery = useCallback(
    (mastery: Flashcard['mastery']) => {
      if (!currentCard) return;
      updateFlashcard(currentCard.id, { mastery });
      setIsFlipped(false);
      setTimeout(() => {
        if (currentIndex < filteredCards.length - 1) {
          setCurrentIndex((prev) => prev + 1);
        }
      }, 300);
    },
    [currentCard, updateFlashcard, currentIndex, filteredCards.length]
  );

  const handlePrev = useCallback(() => {
    setIsFlipped(false);
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const handleNext = useCallback(() => {
    setIsFlipped(false);
    setCurrentIndex((prev) => Math.min(filteredCards.length - 1, prev + 1));
  }, [filteredCards.length]);

  const handleAddCard = useCallback(() => {
    if (!newFront.trim() || !newBack.trim()) {
      toast('لطفاً هر دو طرف کارت رو پر کن');
      return;
    }
    addFlashcard({
      id: Date.now().toString(),
      front: newFront.trim(),
      back: newBack.trim(),
      isSystem: false,
      mastery: 'review',
      subject: newSubject || undefined,
    });
    setNewFront('');
    setNewBack('');
    setNewSubject('');
    setShowAddForm(false);
    toast('کارت جدید اضافه شد');
  }, [newFront, newBack, newSubject, addFlashcard]);

  // Count cards per mastery
  const masteredCount = flashcards.filter((c) => c.mastery === 'mastered').length;
  const reviewCount = flashcards.filter((c) => c.mastery === 'review').length;
  const weakCount = flashcards.filter((c) => c.mastery === 'weak').length;

  const toPersianNum = (n: number) => String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)]);

  return (
    <div>
      {/* Main Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => { setTab('study'); setMasteryFilter('all'); setCurrentIndex(0); setIsFlipped(false); }}
          className={`btn-hover flex-1 py-2.5 rounded-[var(--radius)] text-sm font-medium transition-colors min-h-[44px] border ${
            tab === 'study'
              ? 'bg-[var(--accent-soft)] text-[var(--accent)] border-[var(--accent)]/30'
              : 'surface-1 text-[var(--foreground-muted)] border-[var(--border)]'
          }`}
        >
          مطالعه
        </button>
        <button
          onClick={() => { setTab('marked'); setMasteryFilter('all'); setCurrentIndex(0); setIsFlipped(false); }}
          className={`btn-hover flex-1 py-2.5 rounded-[var(--radius)] text-sm font-medium transition-colors min-h-[44px] border relative ${
            tab === 'marked'
              ? 'bg-[var(--accent-soft)] text-[var(--accent)] border-[var(--accent)]/30'
              : 'surface-1 text-[var(--foreground-muted)] border-[var(--border)]'
          }`}
        >
          نشانه‌گذاری شده
          {(reviewCount + weakCount) > 0 && (
            <span className="absolute -top-1 -left-1 w-5 h-5 bg-[var(--warning)] rounded-full text-[10px] font-bold text-[var(--bg-deep)] flex items-center justify-center">
              {toPersianNum(reviewCount + weakCount)}
            </span>
          )}
        </button>
      </div>

      {/* Subject Selector */}
      <div className="mb-3">
        <p className="text-xs text-[var(--foreground-subtle)] mb-2 px-1 uppercase tracking-wider font-semibold">انتخاب درس</p>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 no-scrollbar">
          <button
            onClick={() => { setSelectedSubject(null); setCurrentIndex(0); setIsFlipped(false); }}
            className={`btn-hover shrink-0 px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-medium transition-colors border ${
              !selectedSubject
                ? 'bg-[var(--foreground)] text-[var(--bg-deep)] border-[var(--foreground)]'
                : 'surface-1 text-[var(--foreground-muted)] border-[var(--border)]'
            }`}
          >
            همه
          </button>
          {allSubjects.map((subject) => (
            <button
              key={subject}
              onClick={() => { setSelectedSubject(subject === selectedSubject ? null : subject); setCurrentIndex(0); setIsFlipped(false); }}
              className={`btn-hover shrink-0 px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-medium transition-colors border ${
                selectedSubject === subject
                  ? 'text-[var(--bg-deep)] border-transparent'
                  : 'surface-1 text-[var(--foreground-muted)] border-[var(--border)]'
              }`}
              style={selectedSubject === subject ? {
                backgroundColor: SUBJECT_COLORS[subject] || 'var(--accent)',
              } : {}}
            >
              {subject}
            </button>
          ))}
        </div>
      </div>

      {/* Mastery Filter */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <button
          onClick={() => { setMasteryFilter('all'); setCurrentIndex(0); setIsFlipped(false); }}
          className={`btn-hover shrink-0 px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-medium transition-colors border ${
            masteryFilter === 'all'
              ? 'bg-[var(--foreground)] text-[var(--bg-deep)] border-[var(--foreground)]'
              : 'surface-1 text-[var(--foreground-muted)] border-[var(--border)]'
          }`}
        >
          همه ({toPersianNum(flashcards.length)})
        </button>
        <button
          onClick={() => { setMasteryFilter('mastered'); setCurrentIndex(0); setIsFlipped(false); }}
          className={`btn-hover shrink-0 px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-medium transition-colors border ${
            masteryFilter === 'mastered'
              ? 'bg-[var(--success)] text-[var(--bg-deep)] border-transparent'
              : 'bg-[rgba(16,185,129,0.08)] text-[#34D399] border-[rgba(16,185,129,0.2)]'
          }`}
        >
          مسلط ({toPersianNum(masteredCount)})
        </button>
        <button
          onClick={() => { setMasteryFilter('review'); setCurrentIndex(0); setIsFlipped(false); }}
          className={`btn-hover shrink-0 px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-medium transition-colors border ${
            masteryFilter === 'review'
              ? 'bg-[var(--warning)] text-[var(--bg-deep)] border-transparent'
              : 'bg-[rgba(245,181,68,0.08)] text-[var(--warning)] border-[rgba(245,181,68,0.2)]'
          }`}
        >
          مرور ({toPersianNum(reviewCount)})
        </button>
        <button
          onClick={() => { setMasteryFilter('weak'); setCurrentIndex(0); setIsFlipped(false); }}
          className={`btn-hover shrink-0 px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-medium transition-colors border ${
            masteryFilter === 'weak'
              ? 'bg-[var(--danger)] text-white border-transparent'
              : 'bg-[rgba(239,68,68,0.08)] text-[#F87171] border-[rgba(239,68,68,0.2)]'
          }`}
        >
          ضعف ({toPersianNum(weakCount)})
        </button>
      </div>

      {/* Add Card Button */}
      <div className="mb-4">
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn-hover flex items-center gap-2 bg-[var(--accent-soft)] text-[var(--accent)] rounded-[var(--radius)] px-4 py-2.5 text-sm font-medium min-h-[44px] hover:bg-[rgba(62,180,137,0.18)] border border-[var(--accent)]/20"
        >
          <Plus className="w-4 h-4" />
          افزودن کارت جدید
        </button>

        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 surface-1 rounded-[var(--radius)] border border-[var(--border)] p-4 space-y-3 overflow-hidden"
            >
              <div>
                <label className="text-xs text-[var(--foreground-muted)] mb-1.5 block font-medium">درس</label>
                <div className="flex gap-2 flex-wrap">
                  {allSubjects.map((subject) => (
                    <button
                      key={subject}
                      onClick={() => setNewSubject(subject === newSubject ? '' : subject)}
                      className={`btn-hover px-3 py-1 rounded-[var(--radius-sm)] text-xs font-medium transition-colors border ${
                        newSubject === subject
                          ? 'text-[var(--bg-deep)] border-transparent'
                          : 'surface-1 text-[var(--foreground-muted)] border-[var(--border)]'
                      }`}
                      style={newSubject === subject ? {
                        backgroundColor: SUBJECT_COLORS[subject] || 'var(--accent)',
                      } : {}}
                    >
                      {subject}
                    </button>
                  ))}
                </div>
              </div>
              <input
                type="text"
                value={newFront}
                onChange={(e) => setNewFront(e.target.value)}
                placeholder="روی کارت (سوال)"
                className="w-full bg-[rgba(255,255,255,0.04)] border border-[var(--border)] rounded-[var(--radius)] px-4 py-3 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)] focus:outline-none focus:border-[var(--accent)] transition-colors"
              />
              <input
                type="text"
                value={newBack}
                onChange={(e) => setNewBack(e.target.value)}
                placeholder="پشت کارت (جواب)"
                className="w-full bg-[rgba(255,255,255,0.04)] border border-[var(--border)] rounded-[var(--radius)] px-4 py-3 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)] focus:outline-none focus:border-[var(--accent)] transition-colors"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleAddCard}
                  className="btn-hover glow-hover flex-1 bg-[var(--accent)] text-[var(--bg-deep)] font-bold rounded-[var(--radius)] py-3 text-sm min-h-[44px] hover:bg-[var(--accent-hover)]"
                >
                  ذخیره کارت
                </button>
                <button
                  onClick={() => toast('آپلود تصویر به زودی!')}
                  className="icon-btn w-12 h-12 surface-1 rounded-[var(--radius)] border border-[var(--border)] flex items-center justify-center text-[var(--foreground-muted)] hover:text-[var(--foreground)] shrink-0"
                >
                  <ImagePlus className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Flashcard Display */}
      {filteredCards.length > 0 && currentCard ? (
        <div>
          <div className="flex items-center justify-between text-xs text-[var(--foreground-muted)] mb-3">
            <span className="tabular-nums">{toPersianNum(currentIndex + 1)} از {toPersianNum(filteredCards.length)}</span>
            {currentCard.subject && (
              <span
                className="px-2 py-0.5 rounded-md text-[10px] font-bold"
                style={{
                  backgroundColor: (SUBJECT_COLORS[currentCard.subject] || 'var(--accent)') + '22',
                  color: SUBJECT_COLORS[currentCard.subject] || 'var(--accent)',
                }}
              >
                {currentCard.subject}
              </span>
            )}
          </div>

          {/* 3D Flip Card */}
          <div className="perspective-[1000px] mb-4">
            <motion.div
              onClick={handleFlip}
              className="relative w-full cursor-pointer"
              style={{ transformStyle: 'preserve-3d' }}
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
            >
              {/* Front */}
              <div
                className="surface-1 edge-highlight rounded-[var(--radius-lg)] p-6 min-h-[220px] flex flex-col items-center justify-center"
                style={{ backfaceVisibility: 'hidden' }}
              >
                <p className="text-base text-[var(--foreground)] text-center leading-relaxed font-medium">
                  {currentCard.front}
                </p>
                <p className="text-xs text-[var(--foreground-subtle)] mt-4">برای دیدن جواب ضربه بزن</p>
              </div>

              {/* Back */}
              <div
                className="absolute inset-0 surface-1 edge-highlight rounded-[var(--radius-lg)] p-6 min-h-[220px] flex flex-col items-center justify-center"
                style={{
                  backfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                  borderColor: 'rgba(62,180,137,0.3)',
                }}
              >
                <p className="text-base text-[var(--accent)] text-center leading-relaxed font-medium">
                  {currentCard.back}
                </p>
              </div>
            </motion.div>
          </div>

          {/* Feedback Buttons */}
          <AnimatePresence>
            {isFlipped && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="space-y-2 mb-4"
              >
                <p className="text-xs text-[var(--foreground-muted)] text-center mb-2">سطح تسلطت چطوره؟</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleMastery('mastered')}
                    className="btn-hover flex-1 bg-[rgba(16,185,129,0.12)] text-[#34D399] rounded-[var(--radius)] py-3 text-sm font-medium min-h-[44px] hover:bg-[rgba(16,185,129,0.2)] border border-[rgba(16,185,129,0.2)]"
                  >
                    مسلط
                  </button>
                  <button
                    onClick={() => handleMastery('review')}
                    className="btn-hover flex-1 bg-[rgba(245,181,68,0.12)] text-[var(--warning)] rounded-[var(--radius)] py-3 text-sm font-medium min-h-[44px] hover:bg-[rgba(245,181,68,0.2)] border border-[rgba(245,181,68,0.2)]"
                  >
                    مرور
                  </button>
                  <button
                    onClick={() => handleMastery('weak')}
                    className="btn-hover flex-1 bg-[rgba(239,68,68,0.12)] text-[#F87171] rounded-[var(--radius)] py-3 text-sm font-medium min-h-[44px] hover:bg-[rgba(239,68,68,0.2)] border border-[rgba(239,68,68,0.2)]"
                  >
                    ضعف
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="btn-hover flex items-center gap-1 surface-1 border border-[var(--border)] rounded-[var(--radius)] px-4 py-2.5 text-sm text-[var(--foreground)] disabled:opacity-30 min-h-[44px] hover:border-[var(--border-strong)]"
            >
              <ChevronRight className="w-4 h-4" />
              قبلی
            </button>
            <button
              onClick={handleNext}
              disabled={currentIndex === filteredCards.length - 1}
              className="btn-hover flex items-center gap-1 surface-1 border border-[var(--border)] rounded-[var(--radius)] px-4 py-2.5 text-sm text-[var(--foreground)] disabled:opacity-30 min-h-[44px] hover:border-[var(--border-strong)]"
            >
              بعدی
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="surface-1 rounded-[var(--radius-lg)] p-8 text-center">
          <p className="text-[var(--foreground-muted)] text-sm">
            {tab === 'marked'
              ? 'هنوز کارتی نشانه‌گذاری نشده'
              : selectedSubject
              ? `فلش‌کارت ${selectedSubject} نداری`
              : 'فلش‌کارت نداری'}
          </p>
        </div>
      )}
    </div>
  );
}

// ===== Tool 3: Pomodoro is implemented in ./PomodoroTimer =====

// ===== Tool 4: Konkur Grade Calculator =====
// Implemented in ./GradeCalculator — Tajrobi/Riazi weighted-average tool.

// ===== Tool 5: Breathing / Anti-Stress =====
// Implemented in ./BreathingExercise — Guided breathing exercise with 3 techniques.
