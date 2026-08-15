'use client';

// ============================================================
// MagicEntryBar — "AI Magic Task Entry" floating input
// ============================================================
// A Gemini/island-style floating chat bar fixed to the bottom of the
// Plan view. The student types a natural-language study plan in Persian;
// on submit we call /api/tasks/magic, which runs the LLM and resolves
// the text into a structured, DB-validated task object.
//
// IMPORTANT (human-in-the-loop): this component NEVER saves anything.
// It only returns the parsed object to the parent, which pre-fills the
// existing ManualEntrySheet. The user reviews and clicks "ثبت تسک".
// ============================================================

import { useState, useCallback, useRef, useEffect } from 'react';
import { Sparkles, Loader2, ArrowUp, X } from 'lucide-react';
import { toast } from 'sonner';
import { AuthError } from '@/lib/api-client';

export interface MagicResolvedTask {
  subjectId: string;
  subjectName: string;
  subjectColor: string;
  chapterId: string;
  chapterTitle: string;
  chapterPageStart: number | null;
  chapterPageEnd: number | null;
  topicId: string | null;
  topicIds: string[];
  topicTitles: string[];
  curriculumMode: 'BOOK';
  fieldType: 'کنکور' | 'نهایی';
  activityTypes: string[];
  targetTimeMinutes: number | null;
  targetTestCount: number | null;
  pageStart: number | null;
  pageEnd: number | null;
  displayText: string;
  rawInput: string;
  warnings: string[];
}

interface MagicEntryBarProps {
  onResult: (task: MagicResolvedTask) => void;
  disabled?: boolean;
}

const PLACEHOLDER = 'فردا شب ۵۰ تا تست آموزشی زیست دهم فصل ۲ رو می‌زنم...';

const QUICK_IDEAS = [
  '۵۰ تست آموزشی زیست فصل ۲',
  'یک ساعت مطالعه فیزیک فصل ۳',
  'مرور شیمی فصل ۱',
];

export default function MagicEntryBar({ onResult, disabled }: MagicEntryBarProps) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-grow: keep the bar compact but expand the input area slightly on focus.
  useEffect(() => {
    if (!loading && inputRef.current && focused) {
      // no-op; kept for future expansion
    }
  }, [loading, focused]);

  const submit = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || loading || disabled) return;
    setLoading(true);
    try {
      const res = await fetch('/api/tasks/magic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: trimmed }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'پردازش ناموفق بود');
      }
      const task = data.task as MagicResolvedTask;
      if (!task || !task.subjectId || !task.chapterId) {
        throw new Error('نتوانستم اطلاعات کافی استخراج کنم. لطفاً دقیق‌تر بنویسید.');
      }
      // Surface non-fatal warnings (e.g. out-of-range pages) as info toasts.
      if (task.warnings && task.warnings.length > 0) {
        task.warnings.forEach((w) => toast(w, { icon: '⚠️' }));
      }
      toast.success('برنامه‌ات استخراج شد — یه نگاه بنداز و ثبت کن');
      onResult(task);
      setText('');
    } catch (err) {
      if (err instanceof AuthError) return; // global handler redirects
      const msg = err instanceof Error && err.message ? err.message : 'خطا در ارتباط با هوش مصنوعی';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [text, loading, disabled, onResult]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-40 flex justify-center px-3 md:bottom-6" dir="rtl">
      <div
        className={`pointer-events-auto w-full max-w-2xl transition-all duration-300 ${
          focused ? 'translate-y-0' : 'translate-y-0'
        }`}
      >
        {/* Glow halo behind the bar */}
        <div className="relative">
          <div
            className="absolute -inset-1 rounded-[22px] opacity-60 blur-xl transition-opacity duration-500"
            style={{
              background:
                'radial-gradient(60% 80% at 80% 50%, rgba(62,159,112,0.25), transparent 70%), radial-gradient(50% 80% at 10% 50%, rgba(125,196,153,0.18), transparent 70%)',
            }}
            aria-hidden
          />

          <div
            className={`relative flex items-center gap-2 rounded-[20px] border bg-[var(--bg-elevated)]/70 p-2 shadow-[0_18px_50px_-22px_rgba(0,0,0,0.85)] backdrop-blur-2xl transition-colors duration-300 ${
              focused ? 'border-[var(--accent)]/45' : 'border-[var(--border-strong)]'
            }`}
          >
            {/* Magic icon badge */}
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
              <Sparkles className={`h-4.5 w-4.5 ${loading ? 'animate-pulse' : ''}`} />
            </div>

            {/* Input */}
            <input
              ref={inputRef}
              type="text"
              value={text}
              disabled={loading || disabled}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder={PLACEHOLDER}
              className="min-w-0 flex-1 bg-transparent px-1 text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--foreground-subtle)] disabled:opacity-50"
              aria-label="ورودی هوشمند برنامه مطالعه"
            />

            {/* Clear button */}
            {text && !loading && (
              <button
                type="button"
                onClick={() => { setText(''); inputRef.current?.focus(); }}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[var(--foreground-subtle)] transition hover:bg-white/5 hover:text-[var(--foreground)]"
                aria-label="پاک کردن"
              >
                <X className="h-4 w-4" />
              </button>
            )}

            {/* Submit (magic wand) button */}
            <button
              type="button"
              onClick={submit}
              disabled={!text.trim() || loading || disabled}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)] text-[var(--bg-deep)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-35"
              aria-label="استخراج با هوش مصنوعی"
            >
              {loading ? (
                <Loader2 className="h-4.5 w-4.5 animate-spin" />
              ) : (
                <ArrowUp className="h-4.5 w-4.5" strokeWidth={2.5} />
              )}
            </button>
          </div>

          {/* Quick-idea chips (only when empty + idle) */}
          {!text && !loading && !disabled && (
            <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5">
              {QUICK_IDEAS.map((idea) => (
                <button
                  key={idea}
                  type="button"
                  onClick={() => { setText(idea); inputRef.current?.focus(); }}
                  className="rounded-full border border-[var(--border-strong)] bg-[var(--bg-elevated)]/60 px-3 py-1 text-[11px] text-[var(--foreground-muted)] backdrop-blur-md transition hover:border-[var(--accent)]/40 hover:text-[var(--foreground)]"
                >
                  {idea}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
