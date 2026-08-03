'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wand2, Sparkles, X, Trash2, Clock, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { ParsedTask, Task } from '@/lib/types';
import { SUBJECTS } from '@/lib/constants/mockData';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

// ===== Persian Helper =====
function toPersianNum(n: number): string {
  const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
  return String(n).replace(/\d/g, (d) => persianDigits[parseInt(d)]);
}

// ===== Props =====
interface AiEntryModalProps {
  open: boolean;
  onClose: () => void;
  selectedDate: string;
  existingTaskCount: number;
  onConfirm: (tasks: Task[]) => void;
}

// ===== Loading Spinner =====
function AnalyzingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center py-8 gap-3">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        className="w-10 h-10 border-3 border-[var(--accent)]/20 border-t-[var(--accent)] rounded-full"
      />
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-sm text-[var(--foreground-muted)]"
      >
        در حال تحلیل متنی...
      </motion.p>
    </div>
  );
}

// ===== Parsed Task Preview Card =====
function ParsedTaskCard({
  parsed,
  index,
  onDelete,
}: {
  parsed: ParsedTask;
  index: number;
  onDelete: (index: number) => void;
}) {
  const subjectObj = SUBJECTS.find((s) => s.name === parsed.subject);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="surface-1 edge-highlight rounded-[var(--radius)] border border-[var(--border)] p-3 flex items-start justify-between gap-2"
    >
      <div className="flex-1 min-w-0">
        {/* Subject + Field Type */}
        <div className="flex items-center gap-2 mb-1">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: subjectObj?.color || '#3EB489' }}
          />
          <span className="text-[var(--foreground)] text-sm font-medium">{parsed.subject}</span>
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${
              parsed.field_type === 'کنکور'
                ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                : 'bg-[rgba(245,181,68,0.12)] text-[var(--warning)]'
            }`}
          >
            {parsed.field_type}
          </span>
        </div>

        {/* Topic */}
        <p className="text-[var(--foreground-muted)] text-xs">{parsed.topic}</p>

        {/* Metrics */}
        <div className="flex items-center gap-2 mt-1 text-xs text-[var(--foreground-subtle)]">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {toPersianNum(parsed.target_time_minutes)} دقیقه
          </span>
          {parsed.target_test_count > 0 && (
            <>
              <span className="w-px h-3 bg-[var(--border)]" />
              <span className="flex items-center gap-1">
                <FileText className="w-3 h-3" />
                {toPersianNum(parsed.target_test_count)} تست
              </span>
            </>
          )}
        </div>

        {/* Activity Chips */}
        <div className="flex flex-wrap gap-1 mt-1.5">
          {parsed.activity_types.map((at) => (
            <span
              key={at}
              className="text-[9px] px-1.5 py-0.5 rounded-full bg-[rgba(255,255,255,0.05)] text-[var(--foreground-muted)] border border-[var(--border)]"
            >
              {at}
            </span>
          ))}
        </div>
      </div>

      {/* Delete Button */}
      <motion.button
        whileTap={{ scale: 0.85 }}
        onClick={() => onDelete(index)}
        className="icon-btn w-8 h-8 rounded-[var(--radius-sm)] text-[var(--foreground-subtle)] hover:text-[#F87171] flex items-center justify-center shrink-0"
        aria-label="حذف"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </motion.button>
    </motion.div>
  );
}

// ===== Main Component =====
export default function AiEntryModal({
  open,
  onClose,
  selectedDate,
  existingTaskCount,
  onConfirm,
}: AiEntryModalProps) {
  const [aiText, setAiText] = useState('');
  const [loading, setLoading] = useState(false);
  const [parsedTasks, setParsedTasks] = useState<ParsedTask[]>([]);
  const [previewMode, setPreviewMode] = useState(false);

  // Submit to API
  const handleAnalyze = useCallback(async () => {
    if (!aiText.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/parse-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: aiText }),
      });
      if (!res.ok) throw new Error('Failed to parse');
      const data = await res.json();
      setParsedTasks(data.tasks || []);
      setPreviewMode(true);
    } catch {
      toast.error('خطا در تحلیل برنامه. لطفاً دوباره تلاش کنید.');
    } finally {
      setLoading(false);
    }
  }, [aiText]);

  // Delete a parsed task
  const handleDeleteParsed = useCallback((index: number) => {
    setParsedTasks((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Confirm and add to plan
  const handleConfirm = useCallback(() => {
    const newTasks: Task[] = parsedTasks.map((pt, i) => {
      const subjectObj = SUBJECTS.find((s) => s.name === pt.subject);
      return {
        id: crypto.randomUUID(),
        studentId: 's1',
        subject: pt.subject,
        subjectColor: subjectObj?.color || '#3EB489',
        topic: pt.topic,
        fieldType: pt.field_type,
        activityTypes: pt.activity_types,
        targetTimeMinutes: pt.target_time_minutes,
        actualTimeMinutes: null,
        targetTestCount: pt.target_test_count,
        actualTestCount: null,
        completed: null,
        date: selectedDate,
        order: existingTaskCount + i + 1,
        createdBy: 'student' as const,
      };
    });
    onConfirm(newTasks);
    toast.success(`${toPersianNum(newTasks.length)} تسک اضافه شد`);
    handleClose();
  }, [parsedTasks, selectedDate, existingTaskCount, onConfirm]);

  // Close and reset
  const handleClose = useCallback(() => {
    onClose();
    setAiText('');
    setParsedTasks([]);
    setPreviewMode(false);
  }, [onClose]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="surface-2 border-[var(--border-strong)] text-[var(--foreground)] max-w-[calc(100%-2rem)] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[var(--foreground)] text-right flex items-center gap-2 justify-end">
            <span>ورود سریع با هوش مصنوعی</span>
            <Wand2 className="w-5 h-5 text-[var(--accent)]" />
          </DialogTitle>
          <DialogDescription className="text-[var(--foreground-muted)] text-right">
            برنامه‌ت رو برام بنویس، بقیه‌ش با من
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {!previewMode ? (
            /* ===== Input Mode ===== */
            <motion.div
              key="input"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              <textarea
                value={aiText}
                onChange={(e) => setAiText(e.target.value)}
                placeholder="مثال: ۳ ساعت ریاضی دهم مبحث تابع ۳۰ تست، فیزیک الکتریسیته ۱ ساعت مرور"
                className="w-full h-36 bg-[rgba(255,255,255,0.04)] border border-[var(--border)] rounded-[var(--radius)] p-3 text-[var(--foreground)] text-sm resize-none placeholder:text-[var(--foreground-subtle)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                dir="rtl"
              />

              {/* Quick Templates */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  'ریاضی ۲ ساعت مطالعه ۳۰ تست',
                  'فیزیک مرور ۱ ساعت',
                  'شیمی تست سنجشی ۴۰ تست',
                ].map((tmpl) => (
                  <motion.button
                    key={tmpl}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setAiText((prev) => (prev ? prev + '، ' : '') + tmpl)}
                    className="btn-hover text-[10px] px-2 py-1 rounded-full surface-1 text-[var(--foreground-muted)] border border-[var(--border)] hover:border-[var(--accent)]/30 hover:text-[var(--foreground)]"
                  >
                    {tmpl}
                  </motion.button>
                ))}
              </div>

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleAnalyze}
                disabled={loading || !aiText.trim()}
                className="btn-hover glow-hover w-full py-3 rounded-[var(--radius)] bg-[var(--accent)] text-[var(--bg-deep)] font-medium text-sm disabled:opacity-50 min-h-[48px] flex items-center justify-center gap-2 shadow-[0_8px_20px_-6px_var(--accent-glow)]"
              >
                {loading ? (
                  <AnalyzingSpinner />
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>تحلیل و ساخت برنامه</span>
                  </>
                )}
              </motion.button>
            </motion.div>
          ) : (
            /* ===== Preview Mode ===== */
            <motion.div
              key="preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-[var(--foreground)]">تسک‌های شناسایی‌شده:</p>
                <span className="text-xs text-[var(--accent)] bg-[var(--accent-soft)] px-2 py-0.5 rounded-full font-medium">
                  {toPersianNum(parsedTasks.length)} تسک
                </span>
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2 custom-scrollbar">
                {parsedTasks.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-[var(--foreground-muted)] text-sm">هیچ تسکی شناسایی نشد</p>
                    <p className="text-[var(--foreground-subtle)] text-xs mt-1">ساختار متن را تغییر دهید و دوباره تلاش کنید</p>
                  </div>
                ) : (
                  parsedTasks.map((pt, i) => (
                    <ParsedTaskCard
                      key={i}
                      parsed={pt}
                      index={i}
                      onDelete={handleDeleteParsed}
                    />
                  ))
                )}
              </div>

              <div className="flex gap-2 pt-2">
                {/* Back Button */}
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setPreviewMode(false);
                    setParsedTasks([]);
                  }}
                  className="btn-hover flex-1 py-2.5 rounded-[var(--radius)] text-sm surface-1 text-[var(--foreground-muted)] min-h-[44px] border border-[var(--border)]"
                >
                  بازگشت
                </motion.button>

                {/* Confirm Button */}
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleConfirm}
                  disabled={parsedTasks.length === 0}
                  className="btn-hover glow-hover flex-1 py-2.5 rounded-[var(--radius)] text-sm bg-[var(--accent)] text-[var(--bg-deep)] font-medium disabled:opacity-50 min-h-[44px] shadow-[0_8px_20px_-6px_var(--accent-glow)]"
                >
                  تایید و افزودن به برنامه
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
