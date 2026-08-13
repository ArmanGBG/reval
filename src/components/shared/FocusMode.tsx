'use client';

import { ReactNode, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { toast } from 'sonner';

// =================================================================
// FocusMode
// A distraction-free overlay that hides the sidebar, bottom nav, and
// music player chrome so the student can concentrate on the current
// task / Pomodoro session. Triggered by the `F` keyboard shortcut.
//
// The actual page content (children) is rendered INSIDE the overlay so
// the student still sees their plan / timer. Only the surrounding
// chrome is replaced by a minimal "exit focus" pill.
// =================================================================

interface FocusModeProps {
  children: ReactNode;
}

export default function FocusMode({ children }: FocusModeProps) {
  const focusMode = useAppStore((s) => s.focusMode);
  const setFocusMode = useAppStore((s) => s.setFocusMode);
  const currentView = useAppStore((s) => s.currentView);

  // Show a one-time welcome toast when entering focus mode
  useEffect(() => {
    if (focusMode) {
      const t = toast.success('حالت تمرکز فعال شد', {
        description: 'برای خروج، Esc یا F را بزنید',
        duration: 2500,
      });
      return () => {
        toast.dismiss(t);
      };
    }
  }, [focusMode]);

  // Lock body scroll when in focus mode so background doesn't scroll
  useEffect(() => {
    if (focusMode) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [focusMode]);

  return (
    <AnimatePresence>
      {focusMode && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[90] bg-[var(--bg-deep)]"
        >
          {/* Subtle ambient gradient backdrop */}
          <div
            aria-hidden
            className="absolute inset-0 opacity-60 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse at 50% 0%, var(--accent-soft) 0%, transparent 60%), radial-gradient(ellipse at 50% 100%, var(--accent-soft) 0%, transparent 60%)',
            }}
          />

          {/* Top bar with exit pill + view label */}
          <motion.div
            initial={{ y: -16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3"
          >
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--border-strong)] bg-[var(--bg-elevated)]/80 backdrop-blur-md shadow-lg">
              <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span className="text-xs font-medium text-[var(--foreground-muted)]">
                {currentView === 'tools' ? 'تمرکز · ابزارها' : currentView === 'plan' ? 'تمرکز · برنامه' : 'حالت تمرکز'}
              </span>
            </div>
            <button
              onClick={() => setFocusMode(false)}
              className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[var(--border-strong)] bg-[var(--bg-elevated)]/80 backdrop-blur-md hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] transition-colors shadow-lg"
              aria-label="خروج از حالت تمرکز"
            >
              <X className="w-3.5 h-3.5 text-[var(--foreground-muted)] group-hover:text-[var(--accent)] transition-colors" />
              <span className="text-xs font-medium text-[var(--foreground-muted)] group-hover:text-[var(--accent)] transition-colors">
                خروج
              </span>
              <kbd
                dir="ltr"
                className="hidden sm:inline-flex items-center justify-center h-4 px-1 rounded border border-[var(--border-strong)] bg-[rgba(255,255,255,0.04)] text-[9px] font-mono text-[var(--foreground-muted)]"
              >
                F
              </kbd>
            </button>
          </motion.div>

          {/* Centered content */}
          <div className="relative h-full w-full overflow-y-auto custom-scrollbar">
            <div className="min-h-full flex items-start justify-center pt-20 pb-8 px-4">
              <div className="w-full max-w-2xl">
                {children}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
