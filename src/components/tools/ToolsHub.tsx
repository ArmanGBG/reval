'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAppStore } from '@/lib/store';
import { Flashcard } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Music, Brain, Timer, Calculator, Heart, X, Play, Pause, RotateCcw,
  Download, Plus, ImagePlus, ChevronLeft, ChevronRight, SkipForward, Minus,
  ChevronDown, Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

// ===== Tool Definitions =====
const TOOLS = [
  {
    id: 'music',
    title: 'موزیک تمرکز',
    description: 'تمرکزتو با موسیقی بالا ببر',
    icon: Music,
    color: '#3EB489',
  },
  {
    id: 'flashcards',
    title: 'فلش‌کارت هوشمند',
    description: 'یادگیری فعال با فلش‌کارت',
    icon: Brain,
    color: '#F59E0B',
  },
  {
    id: 'pomodoro',
    title: 'پومودورو',
    description: 'مدیریت زمان مطالعه',
    icon: Timer,
    color: '#8B5CF6',
  },
  {
    id: 'calculator',
    title: 'محاسبه‌گر درصد',
    description: 'درصد کنکور رو حساب کن',
    icon: Calculator,
    color: '#EF4444',
  },
  {
    id: 'breathing',
    title: 'اورژانس استرس',
    description: 'تنفس عمیق و آرامش',
    icon: Heart,
    color: '#06B6D4',
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
                className={`surface-1 edge-highlight card-hover rounded-[var(--radius-lg)] p-4 text-right min-h-[140px] flex flex-col justify-between ${
                  isLast ? 'col-span-2 max-w-[calc(50%-6px)] mx-auto' : ''
                }`}
              >
                <div>
                  <div
                    className="w-12 h-12 rounded-[var(--radius)] flex items-center justify-center mb-3"
                    style={{ background: `linear-gradient(135deg, ${tool.color}22, ${tool.color}08)` }}
                  >
                    <IconComp className="w-6 h-6" style={{ color: tool.color }} />
                  </div>
                  <h3 className="text-sm font-bold text-[var(--foreground)] mb-1">{tool.title}</h3>
                  <p className="text-xs text-[var(--foreground-muted)] leading-relaxed">{tool.description}</p>
                </div>
                <div
                  className="w-8 h-1 rounded-full mt-3"
                  style={{ backgroundColor: tool.color }}
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

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {TOOLS.map((tool, index) => {
            const IconComp = tool.icon;
            const isActive = activeTool === tool.id;
            return (
              <motion.button
                key={tool.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                onClick={() => handleToolSelect(tool.id)}
                className={`surface-1 edge-highlight card-hover rounded-[var(--radius-lg)] p-5 text-right min-h-[180px] flex flex-col justify-between transition-all ${
                  isActive ? 'border-[var(--accent)] ring-1 ring-[var(--accent-glow)]' : ''
                }`}
              >
                <div>
                  <div
                    className="w-14 h-14 rounded-[var(--radius)] flex items-center justify-center mb-4"
                    style={{ background: `linear-gradient(135deg, ${tool.color}22, ${tool.color}08)` }}
                  >
                    <IconComp className="w-7 h-7" style={{ color: tool.color }} />
                  </div>
                  <h3 className="text-base font-bold text-[var(--foreground)] mb-1.5">{tool.title}</h3>
                  <p className="text-xs text-[var(--foreground-muted)] leading-relaxed">{tool.description}</p>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <div
                    className="w-10 h-1 rounded-full"
                    style={{ backgroundColor: tool.color }}
                  />
                  <ChevronLeft className="w-4 h-4 text-[var(--foreground-subtle)] flip-rtl" />
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
                          background: `linear-gradient(135deg, ${activeToolObj.color}22, ${activeToolObj.color}08)`,
                        }}
                      >
                        <HeaderIcon className="w-5 h-5" style={{ color: activeToolObj.color }} />
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
                {activeTool === 'music' && <FocusMusicTool />}
                {activeTool === 'flashcards' && <FlashcardsTool />}
                {activeTool === 'pomodoro' && <PomodoroTool />}
                {activeTool === 'calculator' && <CalculatorTool />}
                {activeTool === 'breathing' && <BreathingTool />}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ===== Tool 1: Focus Music =====
function FocusMusicTool() {
  const { tracks, currentTrack, isPlaying, setCurrentTrack, setIsPlaying, togglePlay } = useAppStore();

  const handlePlay = useCallback(
    (track: typeof tracks[0]) => {
      if (currentTrack?.id === track.id && isPlaying) {
        setIsPlaying(false);
      } else {
        setCurrentTrack(track);
        setIsPlaying(true);
      }
    },
    [currentTrack, isPlaying, setCurrentTrack, setIsPlaying]
  );

  const handleNext = useCallback(() => {
    const idx = tracks.findIndex((t) => t.id === currentTrack?.id);
    const next = tracks[(idx + 1) % tracks.length];
    setCurrentTrack(next);
    setIsPlaying(true);
  }, [tracks, currentTrack, setCurrentTrack, setIsPlaying]);

  return (
    <div>
      {/* Now Playing Hero */}
      {currentTrack && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="surface-1 edge-highlight rounded-[var(--radius-lg)] p-5 mb-5 text-center"
        >
          <div className="w-20 h-20 rounded-2xl mx-auto mb-3 flex items-center justify-center text-4xl"
            style={{ background: 'linear-gradient(135deg, var(--accent-soft), rgba(62,180,137,0.04))' }}
          >
            {currentTrack.cover}
          </div>
          <h3 className="text-base font-bold text-[var(--foreground)] mb-0.5">{currentTrack.title}</h3>
          <p className="text-xs text-[var(--foreground-muted)] mb-3">{currentTrack.artist}</p>

          {/* Equalizer */}
          {isPlaying && (
            <div className="flex items-end justify-center gap-1 h-6 mb-3">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-1.5 bg-[var(--accent)] rounded-full"
                  animate={{ height: [8, 24, 12, 20, 8] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
                />
              ))}
            </div>
          )}

          {/* Mini Controls */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={togglePlay}
              className="glow-hover btn-hover w-12 h-12 rounded-full bg-[var(--accent)] text-[var(--bg-deep)] flex items-center justify-center hover:bg-[var(--accent-hover)]"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 mr-0.5" />}
            </button>
            <button
              onClick={handleNext}
              className="icon-btn w-10 h-10 rounded-full surface-1 border border-[var(--border)] flex items-center justify-center text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}

      {/* Playlist */}
      <p className="text-xs text-[var(--foreground-subtle)] mb-2 px-1 uppercase tracking-wider font-semibold">لیست پخش</p>
      <div className="space-y-2">
        {tracks.map((track, index) => {
          const isCurrent = currentTrack?.id === track.id;
          const isThisPlaying = isCurrent && isPlaying;

          return (
            <motion.div
              key={track.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.04 }}
              className={`flex items-center gap-3 rounded-[var(--radius)] p-3 transition-colors border ${
                isCurrent
                  ? 'bg-[var(--accent-soft)] border-[var(--accent)]/30'
                  : 'surface-1 border-[var(--border)] hover:border-[var(--border-strong)]'
              }`}
            >
              <div
                className="w-10 h-10 rounded-[var(--radius-sm)] flex items-center justify-center shrink-0 text-lg"
                style={{
                  background: isCurrent
                    ? 'linear-gradient(135deg, var(--accent-soft), rgba(62,180,137,0.04))'
                    : 'rgba(255,255,255,0.04)',
                }}
              >
                {track.cover}
              </div>

              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${isCurrent ? 'text-[var(--accent)]' : 'text-[var(--foreground)]'}`}>
                  {track.title}
                </p>
                <p className="text-xs text-[var(--foreground-muted)] truncate">{track.artist}</p>
              </div>

              {isThisPlaying && (
                <div className="flex items-end gap-0.5 h-4 shrink-0">
                  {[...Array(4)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-1 bg-[var(--accent)] rounded-full"
                      animate={{ height: [4, 14, 6, 12, 4] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.12, ease: 'easeInOut' }}
                    />
                  ))}
                </div>
              )}

              <span className="text-xs text-[var(--foreground-subtle)] shrink-0 tabular-nums">{track.duration}</span>

              <button
                onClick={() => handlePlay(track)}
                className={`btn-hover w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                  isCurrent
                    ? 'bg-[var(--accent)] text-[var(--bg-deep)]'
                    : 'surface-1 border border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                }`}
              >
                {isThisPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 mr-0.5" />}
              </button>

              <button
                onClick={() => toast('دانلود به زودی فعال می‌شه!')}
                className="icon-btn w-8 h-8 rounded-full flex items-center justify-center text-[var(--foreground-subtle)] hover:text-[var(--foreground)] shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

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

// ===== Tool 3: Smart Pomodoro =====
function PomodoroTool() {
  const {
    pomodoroTime,
    pomodoroRunning,
    pomodoroMode,
    setPomodoroTime,
    setPomodoroRunning,
    setPomodoroMode,
    resetPomodoro,
  } = useAppStore();

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (pomodoroRunning) {
      intervalRef.current = setInterval(() => {
        const currentTime = useAppStore.getState().pomodoroTime;
        if (currentTime <= 1) {
          setPomodoroRunning(false);
          if (pomodoroMode === 'work') {
            toast('وقت استراحت');
            setPomodoroMode('break');
            setPomodoroTime(5 * 60);
          } else {
            toast('استراحت تموم شد');
            setPomodoroMode('work');
            setPomodoroTime(25 * 60);
          }
        } else {
          setPomodoroTime(currentTime - 1);
        }
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [pomodoroRunning, pomodoroMode, setPomodoroTime, setPomodoroRunning, setPomodoroMode]);

  const totalTime = pomodoroMode === 'work' ? 25 * 60 : 5 * 60;
  const progress = totalTime > 0 ? (totalTime - pomodoroTime) / totalTime : 0;
  const minutes = Math.floor(pomodoroTime / 60);
  const seconds = pomodoroTime % 60;
  const displayTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const size = 240;
  const center = size / 2;
  const radius = 100;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  const accentColor = pomodoroMode === 'work' ? 'var(--accent)' : '#3B82F6';

  return (
    <div className="flex flex-col items-center py-4">
      {/* Mode indicator */}
      <motion.div
        animate={{ scale: pomodoroMode === 'work' ? 1 : 0.95 }}
        className={`px-5 py-2 rounded-full text-sm font-bold mb-8 border ${
          pomodoroMode === 'work'
            ? 'bg-[var(--accent-soft)] text-[var(--accent)] border-[var(--accent)]/30'
            : 'bg-[rgba(59,130,246,0.12)] text-[#60A5FA] border-[rgba(59,130,246,0.3)]'
        }`}
      >
        {pomodoroMode === 'work' ? 'زمان مطالعه' : 'استراحت'}
      </motion.div>

      {/* Circular Progress */}
      <div className="relative mb-8">
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth={strokeWidth}
          />
          <motion.circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={accentColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          />
          <motion.circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={accentColor}
            strokeWidth={strokeWidth + 6}
            strokeLinecap="round"
            strokeDasharray={circumference}
            animate={{ strokeDashoffset, opacity: 0.15 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            style={{ filter: 'blur(6px)' }}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            key={displayTime}
            className="text-5xl font-bold text-[var(--foreground)] tabular-nums tracking-wider"
          >
            {displayTime}
          </motion.span>
          <span className="text-xs text-[var(--foreground-muted)] mt-2">
            {pomodoroMode === 'work' ? 'تمرکز کن!' : 'استراحت کن'}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-5">
        <button
          onClick={resetPomodoro}
          className="icon-btn w-14 h-14 rounded-full surface-1 border border-[var(--border)] flex items-center justify-center text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
        >
          <RotateCcw className="w-5 h-5" />
        </button>

        <button
          onClick={() => setPomodoroRunning(!pomodoroRunning)}
          className="glow-hover btn-hover w-20 h-20 rounded-full bg-[var(--accent)] text-[var(--bg-deep)] flex items-center justify-center hover:bg-[var(--accent-hover)]"
        >
          {pomodoroRunning ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 mr-1" />}
        </button>

        <button
          onClick={() => {
            if (pomodoroMode === 'work') {
              setPomodoroMode('break');
              setPomodoroTime(5 * 60);
              setPomodoroRunning(false);
            } else {
              setPomodoroMode('work');
              setPomodoroTime(25 * 60);
              setPomodoroRunning(false);
            }
          }}
          className="icon-btn w-14 h-14 rounded-full surface-1 border border-[var(--border)] flex items-center justify-center text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
        >
          <Minus className="w-5 h-5" />
        </button>
      </div>

      <p className="text-xs text-[var(--foreground-muted)] mt-6">
        {pomodoroMode === 'work' ? '۲۵ دقیقه تمرکز' : '۵ دقیقه استراحت'}
      </p>
    </div>
  );
}

// ===== Tool 4: Percentage Calculator =====
function CalculatorTool() {
  const [correct, setCorrect] = useState('');
  const [unanswered, setUnanswered] = useState('');
  const [incorrect, setIncorrect] = useState('');

  const correctNum = parseInt(correct) || 0;
  const unansweredNum = parseInt(unanswered) || 0;
  const incorrectNum = parseInt(incorrect) || 0;

  const totalNum = correctNum + unansweredNum + incorrectNum;
  const denominator = totalNum * 3;
  const numerator = correctNum * 3 - incorrectNum;
  const result = denominator > 0 ? (numerator / denominator) * 100 : 0;
  const isNegative = result < 0;

  const whatIfTotal = correctNum + unansweredNum;
  const whatIfResult = whatIfTotal > 0 ? (correctNum / whatIfTotal) * 100 : 0;
  const whatIfDiff = whatIfTotal > 0 ? whatIfResult - result : 0;

  const resultColor = isNegative
    ? 'text-[#F87171]'
    : result >= 50
    ? 'text-[var(--accent)]'
    : 'text-[var(--warning)]';

  const resultMessage = isNegative
    ? 'درصد منفی! بیشتر تلاش کن'
    : result >= 70
    ? 'عالیه! روال ادامه بده'
    : result >= 50
    ? 'خوبه! ادامه بده'
    : result >= 30
    ? 'بیشتر تمرین کن'
    : 'باید بیشتر تلاش کنی';

  const hasInput = correctNum > 0 || unansweredNum > 0 || incorrectNum > 0;

  return (
    <div>
      {/* Formula display */}
      <div className="surface-1 rounded-[var(--radius)] border border-[var(--border)] p-3 mb-5">
        <p className="text-xs text-[var(--foreground-muted)] text-center leading-loose font-medium">
          (درست × ۳ - غلط) ÷ (کل × ۳) × ۱۰۰
        </p>
      </div>

      {/* Inputs */}
      <div className="space-y-3 mb-5">
        <div>
          <label className="text-xs text-[var(--foreground-muted)] mb-1.5 block font-medium">تعداد درست</label>
          <input
            type="number"
            inputMode="numeric"
            value={correct}
            onChange={(e) => setCorrect(e.target.value)}
            placeholder="مثلاً ۴۵"
            className="w-full bg-[rgba(255,255,255,0.04)] border border-[var(--border)] rounded-[var(--radius)] px-4 py-3.5 text-[var(--foreground)] text-base placeholder:text-[var(--foreground-subtle)] focus:outline-none focus:border-[var(--accent)] transition-colors"
            min="0"
          />
        </div>
        <div>
          <label className="text-xs text-[var(--foreground-muted)] mb-1.5 block font-medium">نزده</label>
          <input
            type="number"
            inputMode="numeric"
            value={unanswered}
            onChange={(e) => setUnanswered(e.target.value)}
            placeholder="مثلاً ۵"
            className="w-full bg-[rgba(255,255,255,0.04)] border border-[var(--border)] rounded-[var(--radius)] px-4 py-3.5 text-[var(--foreground)] text-base placeholder:text-[var(--foreground-subtle)] focus:outline-none focus:border-[var(--accent)] transition-colors"
            min="0"
          />
        </div>
        <div>
          <label className="text-xs text-[var(--foreground-muted)] mb-1.5 block font-medium">غلط</label>
          <input
            type="number"
            inputMode="numeric"
            value={incorrect}
            onChange={(e) => setIncorrect(e.target.value)}
            placeholder="مثلاً ۱۰"
            className="w-full bg-[rgba(255,255,255,0.04)] border border-[var(--border)] rounded-[var(--radius)] px-4 py-3.5 text-[var(--foreground)] text-base placeholder:text-[var(--foreground-subtle)] focus:outline-none focus:border-[var(--accent)] transition-colors"
            min="0"
          />
        </div>
      </div>

      {/* Total */}
      {hasInput && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between surface-1 rounded-[var(--radius-sm)] px-4 py-2 mb-4 border border-[var(--border)]"
        >
          <span className="text-xs text-[var(--foreground-muted)]">مجموع کل سوالات</span>
          <span className="text-sm font-bold text-[var(--foreground)] tabular-nums">{totalNum}</span>
        </motion.div>
      )}

      {/* Main Result */}
      <motion.div
        layout
        className="surface-1 edge-highlight rounded-[var(--radius-lg)] p-6 text-center"
      >
        {hasInput && totalNum > 0 ? (
          <>
            <motion.p
              key={result.toFixed(1)}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className={`text-6xl font-bold tabular-nums ${resultColor}`}
            >
              {isNegative ? (
                <span className="flex flex-col items-center gap-2">
                  <span className="text-[#F87171] text-xl">درصد منفی!</span>
                </span>
              ) : (
                `${result.toFixed(1)}%`
              )}
            </motion.p>
            {!isNegative && (
              <p className="text-sm text-[var(--foreground-muted)] mt-3">{resultMessage}</p>
            )}
          </>
        ) : (
          <div className="py-4">
            <p className="text-[var(--foreground-subtle)] text-sm">اعداد رو وارد کن تا درصد محاسبه بشه</p>
          </div>
        )}
      </motion.div>

      {/* What-If Section */}
      {hasInput && incorrectNum > 0 && totalNum > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-4 bg-[var(--accent-soft)] rounded-[var(--radius-lg)] border border-[var(--accent)]/15 p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <p className="text-xs font-bold text-[var(--accent)]">اگه غلط‌ها رو نزده می‌ذاشتی</p>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--foreground-muted)]">درصدت می‌شد</span>
            <span className="text-2xl font-bold text-[var(--accent)] tabular-nums">
              {whatIfResult.toFixed(1)}%
            </span>
          </div>
          {whatIfDiff > 0 && (
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-[var(--foreground-muted)]">تفاوت</span>
              <span className="text-sm font-medium text-[var(--accent)] tabular-nums">
                +{whatIfDiff.toFixed(1)}%
              </span>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

// ===== Tool 5: Breathing / Anti-Stress =====
function BreathingTool() {
  const [isRunning, setIsRunning] = useState(false);
  const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [cycleCount, setCycleCount] = useState(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const PHASE_CONFIG = {
    inhale: { text: 'دم', subtext: 'بکش...', duration: 4000, scale: 1 },
    hold: { text: 'نگه', subtext: 'دار...', duration: 4000, scale: 1 },
    exhale: { text: 'بازدم', subtext: 'بده...', duration: 6000, scale: 0.5 },
  };

  useEffect(() => {
    if (!isRunning) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    const currentConfig = PHASE_CONFIG[phase];

    timeoutRef.current = setTimeout(() => {
      const nextPhase: Record<string, 'inhale' | 'hold' | 'exhale'> = {
        inhale: 'hold',
        hold: 'exhale',
        exhale: 'inhale',
      };
      if (phase === 'exhale') {
        setCycleCount((prev) => prev + 1);
      }
      setPhase(nextPhase[phase]);
    }, currentConfig.duration);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, phase]);

  const handleToggle = useCallback(() => {
    setIsRunning((prev) => !prev);
    if (isRunning) {
      setPhase('inhale');
      setCycleCount(0);
    }
  }, [isRunning]);

  const currentConfig = PHASE_CONFIG[phase];
  const targetScale = isRunning ? currentConfig.scale : 0.5;
  const animationDuration = phase === 'inhale' ? 4 : phase === 'hold' ? 4 : 6;
  const phaseColor = phase === 'inhale' ? '#3EB489' : phase === 'hold' ? '#3B82F6' : '#8B5CF6';

  return (
    <div className="flex flex-col items-center py-4">
      {/* Cycle Counter */}
      {isRunning && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-[var(--foreground-muted)] mb-6"
        >
          سیکل {cycleCount + 1}
        </motion.div>
      )}

      {/* Breathing Orb */}
      <div className="relative w-72 h-72 flex items-center justify-center mb-8">
        {/* Outer glow */}
        <motion.div
          animate={{
            scale: targetScale,
            opacity: isRunning ? 0.12 : 0.03,
          }}
          transition={{ duration: animationDuration, ease: 'easeInOut' }}
          className="absolute w-72 h-72 rounded-full blur-3xl"
          style={{ backgroundColor: phaseColor }}
        />

        {/* Middle ring */}
        <motion.div
          animate={{
            scale: targetScale * 0.9,
            opacity: isRunning ? 0.08 : 0.02,
          }}
          transition={{ duration: animationDuration, ease: 'easeInOut' }}
          className="absolute w-56 h-56 rounded-full blur-2xl"
          style={{ backgroundColor: phaseColor }}
        />

        {/* Main circle */}
        <motion.div
          animate={{ scale: targetScale }}
          transition={{ duration: animationDuration, ease: 'easeInOut' }}
          className="w-48 h-48 rounded-full flex items-center justify-center relative"
          style={{
            border: `2px solid ${isRunning ? phaseColor + '40' : 'var(--border)'}`,
            background: `radial-gradient(circle at center, ${isRunning ? phaseColor + '15' : 'rgba(255,255,255,0.02)'} 0%, transparent 70%)`,
          }}
        >
          <motion.div
            animate={{ scale: targetScale * 0.85 }}
            transition={{ duration: animationDuration, ease: 'easeInOut' }}
            className="w-32 h-32 rounded-full flex items-center justify-center"
            style={{
              border: `1px solid ${isRunning ? phaseColor + '20' : 'var(--border)'}`,
              background: `radial-gradient(circle at center, ${isRunning ? phaseColor + '10' : 'rgba(255,255,255,0.01)'} 0%, transparent 70%)`,
            }}
          >
            <div className="text-center">
              <span
                className="font-bold text-lg block transition-colors"
                style={{ color: isRunning ? phaseColor : 'var(--foreground-muted)' }}
              >
                {isRunning ? currentConfig.text : 'شروع'}
              </span>
              <span
                className="text-sm block transition-colors"
                style={{ color: isRunning ? phaseColor + '99' : 'var(--foreground-subtle)' }}
              >
                {isRunning ? currentConfig.subtext : 'کن'}
              </span>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Phase indicator dots */}
      {isRunning && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex gap-4 mb-6"
        >
          {(['inhale', 'hold', 'exhale'] as const).map((p) => {
            const pColor = p === 'inhale' ? '#3EB489' : p === 'hold' ? '#3B82F6' : '#8B5CF6';
            return (
              <div key={p} className="flex flex-col items-center gap-1.5">
                <div
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                    phase === p ? 'scale-125' : 'scale-100'
                  }`}
                  style={{
                    backgroundColor: phase === p ? pColor : 'rgba(255,255,255,0.1)',
                  }}
                />
                <span
                  className={`text-[10px] transition-colors ${
                    phase === p ? 'text-[var(--foreground)]' : 'text-[var(--foreground-subtle)]'
                  }`}
                >
                  {p === 'inhale' ? 'دم' : p === 'hold' ? 'نگه دار' : 'بازدم'}
                </span>
              </div>
            );
          })}
        </motion.div>
      )}

      {/* Start/Stop Button */}
      <button
        onClick={handleToggle}
        className={`btn-hover glow-hover w-20 h-20 rounded-full flex items-center justify-center text-lg font-bold transition-all min-h-[44px] ${
          isRunning
            ? 'bg-[rgba(239,68,68,0.12)] text-[#F87171] border border-[rgba(239,68,68,0.3)] hover:bg-[rgba(239,68,68,0.2)]'
            : 'bg-[var(--accent)] text-[var(--bg-deep)] hover:bg-[var(--accent-hover)]'
        }`}
      >
        {isRunning ? 'توقف' : 'شروع'}
      </button>
    </div>
  );
}
