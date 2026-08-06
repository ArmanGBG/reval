'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PenLine, Save, Trash2, Clock, Sparkles, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '@/lib/store';
import { useCurrentStudentId } from '@/lib/student-utils';
import { toPersianDigits, toISODate, formatPersianDateTimeFromISO } from '@/lib/persian-date';
import type { Task } from '@/lib/types';

// ===== Types =====
interface Summary {
  id: string;
  taskId: string;
  subject: string;
  subjectColor: string;
  topic: string | null;
  content: string;
  keyPoints: string[]; // 3 bullet points (optional, may contain empty strings)
  createdAt: string; // ISO datetime
}

// ===== Persistence =====
const STORAGE_KEY = 'reval:summaries:v1';

function loadAllSummaries(): Record<string, Summary[]> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, Summary[]>;
  } catch {
    return {};
  }
}

function saveAllSummaries(data: Record<string, Summary[]>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore quota errors
  }
}

// ===== Component =====
export default function ActiveSummary() {
  const { tasks } = useAppStore();
  const studentId = useCurrentStudentId();
  const todayISO = toISODate(new Date());

  // Today's completed tasks — you can only summarize what you studied
  const todaysCompletedTasks = useMemo(
    () => tasks
      .filter((t) =>
        t.studentId === studentId &&
        t.date === todayISO &&
        t.detailsCompleted !== false &&
        t.completed === true,
      )
      .sort((a, b) => a.order - b.order),
    [tasks, studentId, todayISO],
  );

  // Also include skipped tasks? No — only completed ones have actual study time.
  // But we'll also include pending tasks that have some actualTimeMinutes (partial progress).
  const todaysSummarizableTasks = useMemo(() => {
    const completed = todaysCompletedTasks;
    const partial = tasks.filter((t) =>
      t.studentId === studentId &&
      t.date === todayISO &&
      t.detailsCompleted !== false &&
      t.completed === null &&
      (t.actualTimeMinutes ?? 0) > 0,
    );
    return [...completed, ...partial].sort((a, b) => a.order - b.order);
  }, [tasks, studentId, todayISO, todaysCompletedTasks]);

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [keyPoints, setKeyPoints] = useState<string[]>(['', '', '']);
  const [allSummaries, setAllSummaries] = useState<Record<string, Summary[]>>({});

  // Load from localStorage on mount
  useEffect(() => {
    setAllSummaries(loadAllSummaries());
  }, []);

  // Auto-select the first summarizable task on mount / when task list changes
  useEffect(() => {
    if (selectedTaskId === null && todaysSummarizableTasks.length > 0) {
      setSelectedTaskId(todaysSummarizableTasks[0].id);
    }
    // If the selected task is no longer in the list (e.g. reset), clear it
    if (selectedTaskId && !todaysSummarizableTasks.find((t) => t.id === selectedTaskId)) {
      // Keep it selected if it has past summaries, otherwise reset
      if (!allSummaries[selectedTaskId]?.length) {
        setSelectedTaskId(todaysSummarizableTasks[0]?.id ?? null);
      }
    }
  }, [todaysSummarizableTasks, selectedTaskId, allSummaries]);

  const selectedTask: Task | null = useMemo(
    () => selectedTaskId ? tasks.find((t) => t.id === selectedTaskId) ?? null : null,
    [selectedTaskId, tasks],
  );

  const taskSummaries = useMemo(
    () => (selectedTaskId ? allSummaries[selectedTaskId] ?? [] : []),
    [allSummaries, selectedTaskId],
  );

  // Reset form when task changes
  useEffect(() => {
    setContent('');
    setKeyPoints(['', '', '']);
  }, [selectedTaskId]);

  const wordCount = useMemo(() => {
    const trimmed = content.trim();
    if (!trimmed) return 0;
    // Split on whitespace for Latin / ZWNJ / spaces for Persian
    return trimmed.split(/\s+|‌/).filter(Boolean).length;
  }, [content]);

  const handleSave = useCallback(() => {
    if (!selectedTask) {
      toast('اول یک تسک انتخاب کن');
      return;
    }
    const trimmedContent = content.trim();
    const filledPoints = keyPoints.map((k) => k.trim()).filter(Boolean);
    if (!trimmedContent && filledPoints.length === 0) {
      toast('حداقل خلاصه یا یک نکته کلیدی بنویس');
      return;
    }
    const newSummary: Summary = {
      id: `smry-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      taskId: selectedTask.id,
      subject: selectedTask.subject,
      subjectColor: selectedTask.subjectColor || 'var(--accent)',
      topic: selectedTask.topic,
      content: trimmedContent,
      keyPoints: filledPoints,
      createdAt: new Date().toISOString(),
    };
    setAllSummaries((prev) => {
      const next = { ...prev };
      const list = next[selectedTask.id] ?? [];
      next[selectedTask.id] = [newSummary, ...list];
      saveAllSummaries(next);
      return next;
    });
    setContent('');
    setKeyPoints(['', '', '']);
    toast.success('خلاصه ذخیره شد! ✨');
  }, [selectedTask, content, keyPoints]);

  const handleDelete = useCallback((summaryId: string) => {
    if (!selectedTaskId) return;
    setAllSummaries((prev) => {
      const next = { ...prev };
      const list = next[selectedTaskId] ?? [];
      next[selectedTaskId] = list.filter((s) => s.id !== summaryId);
      saveAllSummaries(next);
      return next;
    });
    toast('خلاصه حذف شد');
  }, [selectedTaskId]);

  // Total summaries across all tasks (for the stat chip)
  const totalSummaries = useMemo(
    () => Object.values(allSummaries).reduce((sum, list) => sum + list.length, 0),
    [allSummaries],
  );

  // ===== Empty state: no summarizable tasks today =====
  if (todaysSummarizableTasks.length === 0) {
    return (
      <div dir="rtl" className="flex flex-col items-center justify-center py-10 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-[var(--accent-soft)] flex items-center justify-center mb-4">
          <BookOpen className="w-7 h-7 text-[var(--accent)]" />
        </div>
        <h3 className="text-base font-bold text-[var(--foreground)] mb-2">
          هنوز چیزی برای خلاصه‌نویسی نیست
        </h3>
        <p className="text-sm text-[var(--foreground-muted)] leading-7 max-w-xs mb-4">
          بعد از تکمیل کردن تسک‌های امروز، می‌تونی برای هر کدوم یک خلاصه کوتاه بنویسی.
          این کار یادگیری رو عمیق‌تر می‌کنه.
        </p>
        <p className="text-xs text-[var(--foreground-subtle)]">
          تسک‌های امروزت رو از بخش «برنامه من» تکمیل کن
        </p>
      </div>
    );
  }

  return (
    <div dir="rtl" className="flex flex-col gap-4">
      {/* ===== Intro + stats ===== */}
      <div className="flex items-start gap-3 p-3 rounded-xl bg-[var(--accent-soft)] border border-[var(--accent)]/20">
        <div className="w-9 h-9 rounded-lg bg-[var(--accent)]/15 flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4 text-[var(--accent)]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-[var(--foreground)] mb-0.5">خلاصه‌نویسی فعال</p>
          <p className="text-[11px] text-[var(--foreground-muted)] leading-relaxed">
            بدون نگاه به کتاب، با حرف خودت بنویس چی یاد گرفتی. این کار یادت رو پایدارتر می‌کنه.
          </p>
        </div>
        {totalSummaries > 0 && (
          <span className="shrink-0 px-2 py-1 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] text-[10px] font-bold text-[var(--accent)] tabular-nums">
            {toPersianDigits(totalSummaries)} خلاصه
          </span>
        )}
      </div>

      {/* ===== Task selector (horizontal chips) ===== */}
      <div>
        <p className="text-[11px] font-bold text-[var(--foreground-muted)] mb-2 uppercase tracking-wider">
          تسک امروز
        </p>
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {todaysSummarizableTasks.map((t) => {
            const active = t.id === selectedTaskId;
            const hasSummary = (allSummaries[t.id]?.length ?? 0) > 0;
            return (
              <button
                key={t.id}
                onClick={() => setSelectedTaskId(t.id)}
                className={`shrink-0 inline-flex items-center gap-1.5 h-9 px-3 rounded-full text-xs font-medium border transition-all ${
                  active
                    ? 'border-[var(--border-strong)] text-[var(--foreground)]'
                    : 'bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:border-[var(--border-strong)]'
                }`}
                style={active ? { backgroundColor: `${t.subjectColor}1A`, borderColor: `${t.subjectColor}66` } : undefined}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: t.subjectColor }}
                />
                <span className="truncate max-w-[120px]">{t.subject}</span>
                {hasSummary && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] shrink-0" title="خلاصه دارد" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ===== Selected task context ===== */}
      {selectedTask && (
        <div
          className="flex items-center gap-2 p-3 rounded-xl border bg-[var(--bg-elevated)]"
          style={{ borderColor: `${selectedTask.subjectColor}33` }}
        >
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: selectedTask.subjectColor }}
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[var(--foreground)] truncate">
              {selectedTask.subject}
              {selectedTask.topic && (
                <span className="text-[var(--foreground-muted)] font-normal"> · {selectedTask.topic}</span>
              )}
            </p>
            <p className="text-[10px] text-[var(--foreground-muted)] tabular-nums mt-0.5">
              {(selectedTask.actualTimeMinutes ?? 0) > 0
                ? `${toPersianDigits(selectedTask.actualTimeMinutes ?? 0)} دقیقه مطالعه`
                : selectedTask.completed === true
                  ? 'تسک تکمیل شد'
                  : 'بدون زمان ثبت‌شده'}
              {selectedTask.targetTimeMinutes ? ` از ${toPersianDigits(selectedTask.targetTimeMinutes)}` : ''}
            </p>
          </div>
        </div>
      )}

      {/* ===== Summary form ===== */}
      <div className="space-y-3">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-[var(--foreground)]">خلاصه خودت</label>
            <span className={`text-[10px] tabular-nums ${wordCount > 200 ? 'text-[var(--accent)]' : 'text-[var(--foreground-subtle)]'}`}>
              {toPersianDigits(wordCount)} کلمه
            </span>
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="مثلا: تفاوت حد و بی‌نهایت رو فهمیدم. حد چپ راست یعنی... بدون نگاه به جزوه بنویس!"
            rows={4}
            className="w-full rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent-glow)] outline-none p-3 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)] resize-none leading-7 transition-colors"
            dir="rtl"
          />
        </div>

        {/* Key points */}
        <div>
          <label className="text-xs font-bold text-[var(--foreground)] mb-1.5 block">
            نکات کلیدی <span className="text-[var(--foreground-subtle)] font-normal">(اختیاری)</span>
          </label>
          <div className="space-y-1.5">
            {keyPoints.map((kp, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] text-[10px] font-bold flex items-center justify-center shrink-0 tabular-nums">
                  {toPersianDigits(i + 1)}
                </span>
                <input
                  type="text"
                  value={kp}
                  onChange={(e) => setKeyPoints((prev) => prev.map((p, idx) => idx === i ? e.target.value : p))}
                  placeholder={`نکته ${toPersianDigits(i + 1)} که باید یادت بمونه`}
                  className="flex-1 h-9 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent-glow)] outline-none px-3 text-xs text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)] transition-colors"
                  dir="rtl"
                />
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={!content.trim() && !keyPoints.some((k) => k.trim())}
          className="btn-hover w-full h-11 rounded-xl flex items-center justify-center gap-2 text-sm font-bold text-[var(--bg-deep)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          style={{
            background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 100%)',
            boxShadow: '0 6px 18px -4px var(--accent-glow)',
          }}
        >
          <Save className="w-4 h-4" />
          ذخیره خلاصه
        </button>
      </div>

      {/* ===== Past summaries for this task ===== */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Clock className="w-3.5 h-3.5 text-[var(--foreground-muted)]" />
          <h3 className="text-xs font-bold text-[var(--foreground)]">
            خلاصه‌های قبلی
          </h3>
          {taskSummaries.length > 0 && (
            <span className="text-[10px] text-[var(--foreground-muted)] tabular-nums">
              ({toPersianDigits(taskSummaries.length)})
            </span>
          )}
        </div>

        {taskSummaries.length === 0 ? (
          <div className="text-center py-6 px-3 rounded-xl border border-dashed border-[var(--border)]">
            <PenLine className="w-5 h-5 text-[var(--foreground-subtle)] mx-auto mb-2" />
            <p className="text-xs text-[var(--foreground-muted)]">هنوز خلاصه‌ای برای این تسک ننوشتی</p>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence initial={false}>
              {taskSummaries.map((s) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="surface-1 rounded-xl border border-[var(--border)] p-3 group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-[var(--foreground-muted)] tabular-nums">
                      {formatPersianDateTimeFromISO(s.createdAt)}
                    </span>
                    <button
                      onClick={() => handleDelete(s.id)}
                      aria-label="حذف خلاصه"
                      className="opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 rounded-md flex items-center justify-center text-[var(--foreground-subtle)] hover:text-[var(--danger)] hover:bg-[rgba(239,68,68,0.08)]"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {s.content && (
                    <p className="text-xs text-[var(--foreground)] leading-7 mb-2 whitespace-pre-wrap">
                      {s.content}
                    </p>
                  )}
                  {s.keyPoints.length > 0 && (
                    <ul className="space-y-1">
                      {s.keyPoints.map((kp, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-1.5 text-[11px] text-[var(--foreground-muted)] leading-6"
                        >
                          <span
                            className="w-1 h-1 rounded-full mt-2.5 shrink-0"
                            style={{ backgroundColor: s.subjectColor }}
                          />
                          {kp}
                        </li>
                      ))}
                    </ul>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
