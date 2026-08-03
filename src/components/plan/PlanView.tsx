'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Wand2, Check, X, Sparkles, CalendarDays, Clock, FileText,
  Target, ChevronLeft,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '@/lib/store';
import { Task } from '@/lib/types';
import { getRandomSuccessMessage, getRandomFailureMessage } from '@/lib/constants/feedbackMessages';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import TaskCard from './TaskCard';
import ManualEntrySheet from './ManualEntrySheet';
import AiEntryModal from './AiEntryModal';

// ===== Persian Date Helpers =====
const PERSIAN_DAYS = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه'];
const PERSIAN_DAYS_SHORT = ['یک', 'دو', 'سه', 'چه', 'پن', 'جم', 'شن'];

function toPersianNum(n: number): string {
  const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
  return String(n).replace(/\d/g, (d) => persianDigits[parseInt(d)]);
}

function getDayName(date: Date): string {
  return PERSIAN_DAYS[date.getDay()];
}

function getDayNameShort(date: Date): string {
  return PERSIAN_DAYS_SHORT[date.getDay()];
}

function getDateStr(date: Date): string {
  return date.toISOString().split('T')[0];
}

function getNext7Days(): { date: Date; dateStr: string; dayName: string; dayNameShort: string; dayNum: number }[] {
  const days: { date: Date; dateStr: string; dayName: string; dayNameShort: string; dayNum: number }[] = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push({
      date: d,
      dateStr: getDateStr(d),
      dayName: getDayName(d),
      dayNameShort: getDayNameShort(d),
      dayNum: d.getDate(),
    });
  }
  return days;
}

function getRelativeDayLabel(dateStr: string, days: ReturnType<typeof getNext7Days>): string {
  const todayStr = getDateStr(new Date());
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = getDateStr(tomorrow);

  if (dateStr === todayStr) return 'برنامه امروز';
  if (dateStr === tomorrowStr) return 'برنامه فردا';

  const day = days.find((d) => d.dateStr === dateStr);
  return day ? `برنامه ${day.dayName}` : 'برنامه من';
}

// ===== Date Ribbon (shared) =====
function DateRibbon({
  days,
  selectedDate,
  todayStr,
  onSelect,
}: {
  days: ReturnType<typeof getNext7Days>;
  selectedDate: string;
  todayStr: string;
  onSelect: (date: string) => void;
}) {
  return (
    <ScrollArea className="w-full">
      <div className="flex gap-2 pb-2">
        {days.map((day) => {
          const isSelected = day.dateStr === selectedDate;
          const isToday = day.dateStr === todayStr;
          return (
            <button
              key={day.dateStr}
              onClick={() => onSelect(day.dateStr)}
              className={`btn-hover flex flex-col items-center justify-center min-w-[56px] h-[68px] rounded-[var(--radius)] transition-all duration-200 shrink-0 border ${
                isSelected
                  ? 'bg-[var(--accent)] text-[var(--bg-deep)] border-[var(--accent)] shadow-[0_8px_20px_-6px_var(--accent-glow)]'
                  : isToday
                    ? 'bg-[var(--bg-elevated)] text-[var(--foreground)] border-[var(--accent)]/30'
                    : 'surface-1 text-[var(--foreground-muted)] border-[var(--border)] hover:border-[var(--border-strong)] hover:text-[var(--foreground)]'
              }`}
            >
              <span className="text-[10px] font-medium mb-0.5">{day.dayNameShort}</span>
              <span className="text-lg font-bold leading-tight tabular-nums">{toPersianNum(day.dayNum)}</span>
              {isToday && !isSelected && (
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}

// ===== Date Stats Bar (shared) =====
function DateStatsBar({ dateStats }: { dateStats: { completed: number; total: number; totalMinutes: number; totalTests: number } }) {
  if (dateStats.total === 0) return null;
  return (
    <div className="flex items-center gap-3 text-xs text-[var(--foreground-muted)] mb-4 flex-wrap">
      <span className="flex items-center gap-1.5">
        <FileText className="w-3.5 h-3.5 text-[var(--foreground-subtle)]" />
        {toPersianNum(dateStats.total)} تسک
      </span>
      <span className="w-px h-3 bg-[var(--border)]" />
      <span className="flex items-center gap-1.5">
        <Clock className="w-3.5 h-3.5 text-[var(--foreground-subtle)]" />
        {toPersianNum(dateStats.totalMinutes)} دقیقه
      </span>
      {dateStats.totalTests > 0 && (
        <>
          <span className="w-px h-3 bg-[var(--border)]" />
          <span className="flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-[var(--foreground-subtle)]" />
            {toPersianNum(dateStats.totalTests)} تست
          </span>
        </>
      )}
      {dateStats.completed > 0 && (
        <>
          <span className="w-px h-3 bg-[var(--border)]" />
          <span className="flex items-center gap-1.5 text-[var(--accent)]">
            <Check className="w-3.5 h-3.5" />
            {toPersianNum(dateStats.completed)} انجام شده
          </span>
        </>
      )}
    </div>
  );
}

// ===== AI Quick Entry Button (shared) =====
function AiQuickEntryButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="btn-hover glow-hover w-full flex items-center justify-center gap-2 py-3 rounded-[var(--radius)] border border-[var(--accent)]/30 bg-[var(--accent-soft)] text-[var(--accent)] font-medium hover:bg-[rgba(62,180,137,0.18)] min-h-[48px]"
    >
      <Wand2 className="w-4 h-4" />
      <span>ورود سریع با هوش مصنوعی</span>
      <Sparkles className="w-3.5 h-3.5" />
    </button>
  );
}

// ===== Pattern Button (shared) =====
function PatternButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="btn-hover nav-item-hover text-sm text-[var(--accent)] font-medium px-3 py-2 rounded-[var(--radius)] border border-[var(--accent)]/30 hover:bg-[var(--accent-soft)] min-h-[44px] flex items-center gap-1.5"
    >
      <CalendarDays className="w-4 h-4" />
      <span>الگو</span>
    </button>
  );
}

// ===== Main Component =====
export default function PlanView() {
  const {
    tasks,
    addTask,
    addTasks,
    updateTask,
    deleteTask,
    selectedDate,
    setSelectedDate,
  } = useAppStore();

  // Local state
  const [patternModalOpen, setPatternModalOpen] = useState(false);
  const [addDrawerOpen, setAddDrawerOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [settingsTaskId, setSettingsTaskId] = useState<string | null>(null);

  // Derived
  const days = useMemo(() => getNext7Days(), []);
  const todayStr = useMemo(() => getDateStr(new Date()), []);

  // Filter tasks for the current student (s1) and selected date
  const filteredTasks = useMemo(
    () =>
      tasks
        .filter((t) => t.date === selectedDate && t.studentId === 's1')
        .sort((a, b) => a.order - b.order),
    [tasks, selectedDate]
  );

  // Dynamic header title
  const headerTitle = useMemo(() => getRelativeDayLabel(selectedDate, days), [selectedDate, days]);

  // Stats for selected date
  const dateStats = useMemo(() => {
    const completed = filteredTasks.filter((t) => t.completed === true).length;
    const total = filteredTasks.length;
    const totalMinutes = filteredTasks.reduce((sum, t) => sum + t.targetTimeMinutes, 0);
    const totalTests = filteredTasks.reduce((sum, t) => sum + t.targetTestCount, 0);
    return { completed, total, totalMinutes, totalTests };
  }, [filteredTasks]);

  // Settings task
  const settingsTask = useMemo(() => tasks.find((t) => t.id === settingsTaskId), [tasks, settingsTaskId]);

  // ===== Handlers =====
  const handleComplete = useCallback(
    (taskId: string) => {
      updateTask(taskId, { completed: true });
    },
    [updateTask]
  );

  const handleSkip = useCallback(
    (taskId: string) => {
      updateTask(taskId, { completed: false });
    },
    [updateTask]
  );

  const handleDeleteTask = useCallback(
    (taskId: string) => {
      deleteTask(taskId);
      toast('تسک حذف شد', {
        style: { background: 'var(--bg-overlay)', border: '1px solid var(--border-strong)', color: 'var(--foreground-muted)' },
      });
    },
    [deleteTask]
  );

  const handleManualSubmit = useCallback(
    (task: Task) => {
      addTask(task);
    },
    [addTask]
  );

  const handleAIConfirm = useCallback(
    (newTasks: Task[]) => {
      addTasks(newTasks);
    },
    [addTasks]
  );

  const handleSettingsSave = useCallback(() => {
    if (!settingsTaskId) return;
    setSettingsTaskId(null);
  }, [settingsTaskId]);

  // ===== RENDER =====
  return (
    <div dir="rtl">
      {/* ===================================================
          MOBILE LAYOUT (single column, max-w-md, FAB + ribbon)
          =================================================== */}
      <div className="md:hidden max-w-md mx-auto px-4 pt-6 pb-28">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <motion.h1
            key={headerTitle}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-bold text-[var(--foreground)]"
          >
            {headerTitle}
          </motion.h1>
          <PatternButton onClick={() => setPatternModalOpen(true)} />
        </div>

        <DateStatsBar dateStats={dateStats} />

        {/* Date Picker Ribbon */}
        <div className="mb-5 -mx-4 px-4">
          <DateRibbon days={days} selectedDate={selectedDate} todayStr={todayStr} onSelect={setSelectedDate} />
        </div>

        {/* AI Quick Entry */}
        <div className="mb-4">
          <AiQuickEntryButton onClick={() => setAiModalOpen(true)} />
        </div>

        {/* Task Cards */}
        <div className="space-y-3">
          <AnimatePresence>
            {filteredTasks.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-16"
              >
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-5xl mb-4"
                >
                  📋
                </motion.div>
                <p className="text-[var(--foreground-muted)] text-sm font-medium">تسکی برای این روز تعریف نشده</p>
                <p className="text-[var(--foreground-subtle)] text-xs mt-1.5">
                  از دکمه <span className="text-[var(--accent)]">+</span> زیر صفحه یا{' '}
                  <span className="text-[var(--accent)]">🪄 هوش مصنوعی</span> استفاده کن
                </p>
              </motion.div>
            ) : (
              filteredTasks.map((task, index) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  index={index}
                  onComplete={handleComplete}
                  onSkip={handleSkip}
                  onDelete={handleDeleteTask}
                  onSettings={setSettingsTaskId}
                />
              ))
            )}
          </AnimatePresence>
        </div>

        {/* FAB: Add Task */}
        <motion.button
          whileTap={{ scale: 0.92 }}
          animate={{ scale: [1, 1.04, 1] }}
          transition={{ scale: { duration: 2, repeat: Infinity, repeatDelay: 3 } }}
          onClick={() => setAddDrawerOpen(true)}
          className="glow-hover fixed bottom-24 left-4 z-40 bg-[var(--accent)] text-[var(--bg-deep)] px-4 py-3 rounded-2xl shadow-[0_8px_24px_-6px_var(--accent-glow)] flex items-center gap-2 font-medium text-sm hover:bg-[var(--accent-hover)] min-h-[48px]"
          aria-label="اضافه کردن تسک"
        >
          <Plus className="w-5 h-5" />
          <span>اضافه کردن تسک</span>
        </motion.button>
      </div>

      {/* ===================================================
          DESKTOP LAYOUT (2-col: main + sidebar)
          =================================================== */}
      <div className="hidden md:block">
        {/* Desktop Header */}
        <div className="flex items-end justify-between mb-8 pb-6 border-b border-[var(--border)]">
          <div className="flex flex-col gap-2 min-w-0">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-[var(--foreground-subtle)] font-semibold">
              <span>برنامه‌ریزی</span>
              <ChevronLeft className="w-3 h-3 flip-rtl" />
              <span className="text-[var(--accent)]">{headerTitle}</span>
            </div>
            <motion.h1
              key={headerTitle}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl md:text-4xl font-bold text-[var(--foreground)]"
            >
              {headerTitle}
            </motion.h1>
          </div>
          <PatternButton onClick={() => setPatternModalOpen(true)} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ===== Main column (task list) — col-span-2 ===== */}
          <div className="lg:col-span-2 space-y-4">
            <div className="-mx-1 px-1">
              <DateRibbon days={days} selectedDate={selectedDate} todayStr={todayStr} onSelect={setSelectedDate} />
            </div>

            <DateStatsBar dateStats={dateStats} />

            <AiQuickEntryButton onClick={() => setAiModalOpen(true)} />

            {/* Task Cards */}
            <div className="space-y-3 pt-2">
              <AnimatePresence>
                {filteredTasks.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="surface-1 rounded-[var(--radius-lg)] p-12 text-center"
                  >
                    <motion.div
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="text-5xl mb-4"
                    >
                      📋
                    </motion.div>
                    <p className="text-[var(--foreground-muted)] text-base font-medium">تسکی برای این روز تعریف نشده</p>
                    <p className="text-[var(--foreground-subtle)] text-sm mt-2">
                      از دکمه افزودن تسک یا هوش مصنوعی استفاده کن
                    </p>
                  </motion.div>
                ) : (
                  filteredTasks.map((task, index) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      index={index}
                      onComplete={handleComplete}
                      onSkip={handleSkip}
                      onDelete={handleDeleteTask}
                      onSettings={setSettingsTaskId}
                    />
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* ===== Sidebar (right in RTL = first child) — col-span-1 ===== */}
          <aside className="lg:col-span-1 space-y-4">
            {/* Add task CTA card */}
            <div className="surface-1 edge-highlight card-hover rounded-[var(--radius-lg)] p-5">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-[var(--foreground)]">افزودن تسک</h3>
                    <p className="text-[11px] text-[var(--foreground-muted)] mt-0.5">دستی یا با هوش مصنوعی</p>
                  </div>
                  <div className="w-9 h-9 rounded-[var(--radius)] bg-[var(--accent-soft)] flex items-center justify-center">
                    <Plus className="w-5 h-5 text-[var(--accent)]" />
                  </div>
                </div>
                <button
                  onClick={() => setAddDrawerOpen(true)}
                  className="glow-hover btn-hover flex items-center justify-center gap-2 w-full py-2.5 rounded-[var(--radius)] bg-[var(--accent)] text-[var(--bg-deep)] font-semibold text-sm min-h-[44px]"
                >
                  <Plus className="w-4 h-4" />
                  تسک جدید
                </button>
                <button
                  onClick={() => setAiModalOpen(true)}
                  className="btn-hover flex items-center justify-center gap-2 w-full py-2.5 rounded-[var(--radius)] border border-[var(--accent)]/30 bg-[var(--accent-soft)] text-[var(--accent)] font-medium text-sm min-h-[44px]"
                >
                  <Wand2 className="w-4 h-4" />
                  هوش مصنوعی
                </button>
              </div>
            </div>

            {/* Stats card */}
            <div className="surface-1 edge-highlight rounded-[var(--radius-lg)] p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground-subtle)] mb-4">
                آمار این روز
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <StatTile icon={<FileText className="w-4 h-4" />} label="تسک‌ها" value={toPersianNum(dateStats.total)} color="var(--accent)" />
                <StatTile icon={<Check className="w-4 h-4" />} label="انجام شده" value={toPersianNum(dateStats.completed)} color="var(--accent)" />
                <StatTile icon={<Clock className="w-4 h-4" />} label="دقیقه" value={toPersianNum(dateStats.totalMinutes)} color="var(--warning)" />
                <StatTile icon={<Target className="w-4 h-4" />} label="تست" value={toPersianNum(dateStats.totalTests)} color="#A78BFA" />
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* ===================================================
          SHARED MODALS (work on both mobile & desktop)
          =================================================== */}
      {/* Pattern Modal */}
      <Dialog open={patternModalOpen} onOpenChange={setPatternModalOpen}>
        <DialogContent className="surface-2 border-[var(--border-strong)] text-[var(--foreground)] max-w-[calc(100%-2rem)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[var(--foreground)] text-right">الگوی برنامه</DialogTitle>
            <DialogDescription className="text-[var(--foreground-muted)] text-right">
              الگوی مناسب برنامه‌ریزی خود را انتخاب کنید
            </DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="exam" dir="rtl" className="w-full">
            <TabsList className="w-full bg-[var(--bg-elevated)]">
              <TabsTrigger
                value="exam"
                className="flex-1 text-xs data-[state=active]:bg-[var(--accent)] data-[state=active]:text-[var(--bg-deep)]"
              >
                الگوهای آزمون
              </TabsTrigger>
              <TabsTrigger
                value="custom"
                className="flex-1 text-xs data-[state=active]:bg-[var(--accent)] data-[state=active]:text-[var(--bg-deep)]"
              >
                الگوهای من
              </TabsTrigger>
            </TabsList>
            <TabsContent value="exam" className="mt-4">
              <div className="space-y-3">
                {[
                  { name: 'الگوی کنکور تجربی', desc: 'تمرکز بر زیست و شیمی', hours: '۸ ساعت', emoji: '🧬' },
                  { name: 'الگوی کنکور ریاضی', desc: 'تمرکز بر ریاضی و فیزیک', hours: '۹ ساعت', emoji: '📐' },
                  { name: 'الگوی نهایی', desc: 'پوشش همه دروس', hours: '۶ ساعت', emoji: '📚' },
                  { name: 'الگوی تست‌زنی intensiv', desc: 'تمرکز بر تست سنجشی', hours: '۴ ساعت', emoji: '🎯' },
                ].map((pattern) => (
                  <button
                    key={pattern.name}
                    className="card-hover btn-hover w-full text-right p-3 rounded-[var(--radius)] surface-1 border border-[var(--border)]"
                    onClick={() => {
                      toast.info('الگو به‌زودی اضافه می‌شود');
                      setPatternModalOpen(false);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{pattern.emoji}</span>
                        <span className="text-sm font-medium text-[var(--foreground)]">{pattern.name}</span>
                      </div>
                      <span className="text-[10px] text-[var(--accent)] bg-[var(--accent-soft)] px-2 py-0.5 rounded-full font-medium">
                        {pattern.hours}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--foreground-muted)] mt-1.5 mr-8">{pattern.desc}</p>
                  </button>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="custom" className="mt-4">
              <div className="text-center py-8">
                <motion.div
                  animate={{ y: [0, -3, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-4xl mb-3"
                >
                  📝
                </motion.div>
                <p className="text-[var(--foreground-muted)] text-sm font-medium">هنوز الگویی نساختی!</p>
                <p className="text-[var(--foreground-subtle)] text-xs mt-1">
                  با ساخت الگوی شخصی، برنامه‌ریزی سریع‌تر می‌شه
                </p>
                <button
                  onClick={() => {
                    setPatternModalOpen(false);
                    toast.info('ساخت الگوی شخصی به‌زودی...');
                  }}
                  className="btn-hover mt-4 px-4 py-2 rounded-[var(--radius)] text-sm bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent)]/30 hover:bg-[rgba(62,180,137,0.18)] min-h-[44px]"
                >
                  + ساخت الگوی جدید
                </button>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Manual Entry Sheet */}
      <ManualEntrySheet
        open={addDrawerOpen}
        onOpenChange={setAddDrawerOpen}
        selectedDate={selectedDate}
        existingTaskCount={tasks.filter((t) => t.date === selectedDate && t.studentId === 's1').length}
        onSubmit={handleManualSubmit}
      />

      {/* AI Entry Modal */}
      <AiEntryModal
        open={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        selectedDate={selectedDate}
        existingTaskCount={tasks.filter((t) => t.date === selectedDate && t.studentId === 's1').length}
        onConfirm={handleAIConfirm}
      />

      {/* Settings / Partial Completion Dialog */}
      <Dialog open={!!settingsTaskId} onOpenChange={(open) => !open && setSettingsTaskId(null)}>
        <DialogContent className="surface-2 border-[var(--border-strong)] text-[var(--foreground)] max-w-[calc(100%-2rem)] sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-[var(--foreground)] text-right">ثبت بخشی از تسک</DialogTitle>
            <DialogDescription className="text-[var(--foreground-muted)] text-right">
              {settingsTask?.subject} — {settingsTask?.topic}
            </DialogDescription>
          </DialogHeader>
          {settingsTask && (
            <div className="space-y-4">
              <div>
                <label className="text-sm text-[var(--foreground)] block mb-2">زمان واقعی (دقیقه):</label>
                <Input
                  type="number"
                  defaultValue={settingsTask.actualTimeMinutes ?? undefined}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    updateTask(settingsTask.id, {
                      actualTimeMinutes: isNaN(val) ? null : val,
                    });
                  }}
                  placeholder={toPersianNum(settingsTask.targetTimeMinutes).toString()}
                  className="bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--foreground)] text-right"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="text-sm text-[var(--foreground)] block mb-2">
                  تعداد تست واقعی:
                </label>
                <Input
                  type="number"
                  defaultValue={settingsTask.actualTestCount ?? undefined}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    updateTask(settingsTask.id, {
                      actualTestCount: isNaN(val) ? null : val,
                    });
                  }}
                  placeholder={toPersianNum(settingsTask.targetTestCount).toString()}
                  className="bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--foreground)] text-right"
                  dir="ltr"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    handleComplete(settingsTask.id);
                    toast.success(getRandomSuccessMessage(), {
                      style: { background: 'var(--bg-overlay)', border: '1px solid var(--accent-glow)', color: 'var(--accent)' },
                    });
                    setSettingsTaskId(null);
                  }}
                  className="btn-hover flex-1 py-2.5 rounded-[var(--radius)] text-sm bg-[var(--accent-soft)] text-[var(--accent)] font-medium min-h-[44px] hover:bg-[rgba(62,180,137,0.18)] border border-[var(--accent)]/20"
                >
                  <Check className="w-4 h-4 inline ml-1" />
                  انجام شد
                </button>
                <button
                  onClick={() => {
                    handleSkip(settingsTask.id);
                    toast(getRandomFailureMessage(), {
                      style: { background: 'var(--bg-overlay)', border: '1px solid rgba(239,68,68,0.3)', color: '#F87171' },
                    });
                    setSettingsTaskId(null);
                  }}
                  className="btn-hover flex-1 py-2.5 rounded-[var(--radius)] text-sm bg-[rgba(239,68,68,0.12)] text-[#F87171] font-medium min-h-[44px] hover:bg-[rgba(239,68,68,0.18)] border border-[rgba(239,68,68,0.2)]"
                >
                  <X className="w-4 h-4 inline ml-1" />
                  انجام نشد
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ===== Stat Tile (desktop sidebar) =====
function StatTile({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="rounded-[var(--radius)] p-3 bg-[rgba(255,255,255,0.03)] border border-[var(--border)] flex flex-col gap-1.5">
      <span style={{ color }}>{icon}</span>
      <span className="text-lg font-bold text-[var(--foreground)] tabular-nums leading-none">{value}</span>
      <span className="text-[10px] text-[var(--foreground-muted)]">{label}</span>
    </div>
  );
}
